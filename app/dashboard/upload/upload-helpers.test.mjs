// Uji helper murni — dijalankan via: node app/dashboard/upload/upload-helpers.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { fileError, layerErrors, manualReadiness, normalizeBatchBase, batchErrors, createManualSlot, metadataChecklist, LAYER_TYPE_DEFAULTS } from "./upload-helpers.ts";
import { autoDetectLayer, formatFileSize, LAYER_TYPE_CONFIG } from "./upload-config.ts";

test("LAYER_TYPE_DEFAULTS sinkron dengan LAYER_TYPE_CONFIG", () => {
    assert.deepEqual(
        Object.fromEntries(Object.entries(LAYER_TYPE_DEFAULTS).map(([k, v]) => [k, [v.defaultName, v.defaultOpacity]])),
        Object.fromEntries(Object.entries(LAYER_TYPE_CONFIG).map(([k, v]) => [k, [v.defaultName, v.defaultOpacity]]))
    );
});

const f = (name, size = 1024) => ({ name, size });

test("fileError: ekstensi dan file kosong", () => {
    assert.equal(fileError(null), "Pilih satu file GeoTIFF.");
    assert.match(fileError(f("data.png")), /\.tif atau \.tiff/);
    assert.match(fileError(f("data.tif", 0)), /0 byte/);
    assert.equal(fileError(f("data.tiff")), null);
    assert.equal(fileError(f("DATA.TIF")), null);
});

test("layerErrors: nama wajib dan peran base", () => {
    assert.ok(layerErrors({ name: "", file: f("a.tif"), layer_type: "ndvi", default_opacity: 0.5 }).some(e => e.includes("Nama layer wajib")));
    assert.ok(layerErrors({ name: "B", file: f("a.tif"), layer_type: "ndvi", default_opacity: 0.5 }, true).length > 0);
    assert.equal(layerErrors({ name: "B", file: f("a.tif"), layer_type: "ortho", default_opacity: 1 }, true).length, 0);
    assert.ok(layerErrors({ name: "B", file: f("a.tif"), layer_type: "ortho", default_opacity: 1 }).some(e => e.includes("Tipe layer")));
    assert.ok(layerErrors({ name: "B", file: f("a.tif"), layer_type: "ndvi", default_opacity: 1.5 }).some(e => e.includes("Opasitas")));
});

test("manualReadiness: base saja siap; slot tak lengkap memblokir", () => {
    const ok = manualReadiness(f("ortho.tif"), "Citra Ortho RGB Utama", [], "Judul", "Paca, Halmahera Utara", "2026-09-11");
    assert.equal(ok.ready, true);
    assert.equal(ok.files.length, 1);
    const slot = createManualSlot("s1");
    const blocked = manualReadiness(f("ortho.tif"), "Citra Ortho RGB Utama", [slot], "Judul", "Paca", "2026-09-11");
    assert.equal(blocked.ready, false);
    assert.ok(blocked.errors.some(e => e.includes("Layer analisis 1")));
    const badMeta = manualReadiness(f("ortho.tif"), "Ortho", [], "", "", "2026-13-40");
    assert.equal(badMeta.ready, false);
    assert.ok(badMeta.errors.length >= 3);
});

test("createManualSlot: default NDVI, mengikuti tipe terakhir", () => {
    const first = createManualSlot("a");
    assert.equal(first.layer_type, "ndvi");
    assert.equal(first.file, null);
    const next = createManualSlot("b", { ...first, layer_type: "kalium" });
    assert.equal(next.layer_type, "kalium");
    assert.match(next.name, /Kalium/);
});

test("normalizeBatchBase: tepat satu base dan selalu ortho", () => {
    const items = [
        { id: "1", file: f("a.tif"), name: "A", layer_type: "ndvi", is_base: true, default_opacity: 1 },
        { id: "2", file: f("b.tif"), name: "B", layer_type: "kalium", is_base: true, default_opacity: 1 },
    ];
    const out = normalizeBatchBase(items);
    assert.equal(out.filter(i => i.is_base).length, 1);
    assert.equal(out.find(i => i.is_base).layer_type, "ortho");
    const noBase = normalizeBatchBase([{ id: "x", file: f("c.tif"), name: "C", layer_type: "dsm", is_base: false, default_opacity: 0.7 }]);
    assert.equal(noBase[0].is_base, true);
    assert.equal(noBase[0].layer_type, "ortho");
});

test("batchErrors: menolak multi-base / base non-ortho", () => {
    const base = { id: "1", file: f("o.tif"), name: "Ortho", layer_type: "ortho", is_base: true, default_opacity: 1 };
    assert.equal(batchErrors([base], "T", "L", "2026-09-11").length, 0);
    const bad = batchErrors([{ ...base, layer_type: "ndvi" }], "T", "L", "2026-09-11");
    assert.ok(bad.some(e => e.includes("tepat satu base Ortho")));
    assert.ok(batchErrors([], "T", "L", "2026-09-11").some(e => e.includes("minimal satu")));
});

test("metadataChecklist & util", () => {
    const c = metadataChecklist("A", "B", "2026-09-11");
    assert.ok(c.every(i => i.ready));
    assert.equal(metadataChecklist("A", "B", "2026-02-30")[2].ready, false);
    assert.equal(autoDetectLayer("survei_ndvi_final.tif").layer_type, "ndvi");
    assert.equal(autoDetectLayer("ortho_rgb_mosaic.tif").is_base, true);
    assert.equal(formatFileSize(5 * 1024 * 1024), "5.00 MB");
});
