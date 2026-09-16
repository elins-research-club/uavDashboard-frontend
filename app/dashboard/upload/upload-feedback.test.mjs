import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

// Render the real component declarations without mounting the upload page,
// fetching raster data, or starting polling. Hooks/stores are explicit fixtures.
function loadComponent(file, name, dependencies = {}) {
    const text = read(file);
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const declaration = source.statements.find(
        (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
    );
    assert.ok(declaration, `${name} declaration exists`);
    const imports = source.statements.filter(ts.isImportDeclaration).map((node) => node.getText(source));
    const code = [
        ...imports,
        "const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024;",
        'const MAX_FILE_SIZE_LABEL = "3 GB";',
        declaration.getText(source),
        `exports.subject = ${name};`,
    ].join("\n");
    const compiled = ts.transpileModule(code, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const compiledModule = { exports: {} };
    const mockRequire = (specifier) => {
        if (Object.hasOwn(dependencies, specifier)) return dependencies[specifier];
        if (specifier === "react" || specifier.startsWith("react/") || specifier === "lucide-react") {
            return require(specifier);
        }
        if (specifier === "@/lib/utils") {
            return { cn: (...inputs) => require("tailwind-merge").twMerge(require("clsx").clsx(inputs)) };
        }
        if (specifier === "next/link") return { default: "a", __esModule: true };
        return {};
    };
    new Function("require", "module", "exports", compiled)(mockRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports.subject;
}

const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const Panel = loadComponent("./page.tsx", "SystemStatusPanel");
const Review = loadComponent("./ManualUploadFlow.tsx", "UploadReview", {
    "./upload-config": { formatFileSize: (size) => `${size} bytes` },
});
const panelProps = { fileCount: 2, totalBytes: 1024, loading: true, uploadProgress: 42 };
const reviewProps = {
    files: [{ name: "ortho.tif", size: 1024 }],
    totalBytes: 1024,
    checklist: [{ label: "File dipilih", ready: true }],
};

function renderResult(statuses, props = {}, tracked = true) {
    const active = tracked ? {
        mapId: "map-1",
        mapTitle: "Survei Mamuya",
        dismissed: false,
        layers: statuses.map((conversion_status, index) => ({
            id: String(index), name: `Layer ${index}`, conversion_status,
        })),
    } : null;
    const Banner = loadComponent("./BakingStatusBanner.tsx", "BakingStatusBanner", {
        react: { ...React, useState: () => [true, () => { }], useEffect: () => { } },
        "@/hooks/useMapBakingPoll": { useMapBakingPoll: () => { } },
        "@/lib/stores/bakingStatusStore": {
            useBakingStatusStore: (selector) => selector({ active, dismiss: () => { } }),
        },
    });
    return render(Banner, props);
}

test("upload progress: engine owns one spinner and an accessible progress bar", () => {
    const html = render(Panel, panelProps);
    assert.match(html, /AMX GeoStream Engine/);
    assert.equal((html.match(/ animate-spin /g) || []).length, 1);
    assert.match(html, /aria-valuenow="42"/);
    assert.match(html, /1\. Upload berkas/);
    assert.match(html, /role="status"/);
});

test("validation is indeterminate instead of appearing stuck at 99 percent", () => {
    const html = render(Panel, { ...panelProps, uploadProgress: 99 });
    assert.match(html, /Memeriksa berkas/);
    assert.match(html, /Menunggu server/);
    assert.doesNotMatch(html, /aria-valuenow=/);
});

test("baking progress uses the actual completed-layer ratio, including zero", () => {
    for (const completed of [0, 1, 2]) {
        const html = render(Panel, {
            ...panelProps, pmtilesStatus: "baking", pmtilesProgress: { completed, total: 2 },
        });
        assert.match(html, new RegExp(`aria-valuenow="${completed * 50}"`));
        assert.match(html, /2\. Kompilasi PMTiles/);
    }
});

test("review retains files/checklist but no readiness or loading banner during upload", () => {
    const html = render(Review, { ...reviewProps, loading: true });
    assert.match(html, /ortho.tif/);
    assert.match(html, /File dipilih/);
    assert.doesNotMatch(html, /submit-readiness|Dataset siap|animate-spin|Unggah berjalan/);
});

test("readiness returns when idle or after upload failure", () => {
    assert.match(render(Review, { ...reviewProps, loading: false }), /Dataset siap diunggah/);
    assert.doesNotMatch(render(Panel, { ...panelProps, loading: false }), /role="progressbar"|animate-spin/);
});

test("background result is suppressed while current engine upload is active", () => {
    assert.equal(renderResult(["processing"], { suppressed: true }), "");
});

test("successful result has one card, one viewer link and one new-upload action", () => {
    const html = renderResult(["completed", "completed"], {
        uploadedDataset: { mapId: "map-1", title: "Survei Mamuya", totalLayers: 2 },
        onNewUpload: () => { },
    });
    assert.equal((html.match(/<section/g) || []).length, 1);
    assert.equal((html.match(/Buka di Map Viewer/g) || []).length, 1);
    assert.equal((html.match(/Upload dataset lain/g) || []).length, 1);
    assert.match(html, /PMTiles siap/);
    assert.doesNotMatch(html, /animate-spin|di background|specular|blur-2xl/);
});

test("processing, unknown, partial failure and total failure never claim all tiles ready", () => {
    for (const statuses of [[], ["processing"], ["completed", "failed"], ["failed"]]) {
        const html = renderResult(statuses);
        assert.doesNotMatch(html, /PMTiles siap/);
        assert.match(html, /Memeriksa status|Kompilasi PMTiles|Sebagian layer gagal|Konversi gagal/);
    }
});

test("compact results summarize layers without a chip list or unnecessary details", () => {
    for (const statuses of [["completed", "processing"], ["completed", "completed"]]) {
        const html = renderResult(statuses);
        assert.equal((html.match(/role="status"/g) || []).length, 1);
        assert.doesNotMatch(html, /<ul\b|<details\b|Status layer/);
        assert.match(html, /Buka di Map Viewer/);
        if (statuses.includes("processing")) {
            assert.match(html, /1\/2 layer siap/);
            assert.match(html, /aria-valuenow="1"/);
            assert.match(html, /aria-valuemax="2"/);
        } else {
            assert.match(html, /2 layer siap ditampilkan/);
            assert.doesNotMatch(html, /role="progressbar"/);
        }
    }
});

test("failed-layer details remain collapsed and warning icons do not spin", () => {
    const html = renderResult(["completed", "processing", "failed"]);
    assert.match(html, /Diproses · sebagian gagal/);
    assert.match(html, /Detail 1 layer gagal/);
    assert.match(html, /<details\b/);
    assert.doesNotMatch(html, /<details\b[^>]*\bopen(?:\s|=|>)|animate-spin/);
    assert.equal((html.match(/<li\b/g) || []).length, 1);
    assert.match(html, /Layer 2/);
    assert.match(html, /Periksa detail konversi di Map Viewer/);
    assert.match(html, /role="progressbar"/);
});

test("loss of background status retains result actions without falsely reporting success", () => {
    const html = renderResult([], {
        uploadedDataset: { mapId: "map-1", title: "Survei Mamuya", totalLayers: 2 },
        onNewUpload: () => { },
    }, false);
    assert.match(html, /Status belum tersedia/);
    assert.match(html, /Upload dataset lain/);
    assert.doesNotMatch(html, /PMTiles siap/);
});

test("page wiring has no duplicate success card or submit-button loading label", () => {
    const source = read("./page.tsx");
    assert.equal((source.match(/<BakingStatusBanner\b/g) || []).length, 1);
    assert.match(source, /suppressed=\{loading\}/);
    assert.match(source, /uploadedDataset=\{isSuccess \? geoSuccess : null\}/);
    assert.match(source, /<fieldset disabled=\{loading\}/);
    assert.match(source, /loading \|\| submitting\.current/);
    assert.doesNotMatch(source, /Upload & Konversi Berhasil|PMTiles Siap ✓|Mengunggah\.\.\.|Dataset siap diunggah\./);
});
