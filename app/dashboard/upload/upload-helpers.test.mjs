import test from "node:test";
import assert from "node:assert/strict";

import {
  fileError,
  layerErrors,
  manualReadiness,
  normalizeBatchBase,
  batchErrors,
  createManualSlot,
  metadataChecklist,
  LAYER_TYPE_DEFAULTS,
} from "./upload-helpers.ts";

import {
  autoDetectLayer,
  formatFileSize,
  LAYER_TYPE_CONFIG,
} from "./upload-config.ts";

/* ============================================================
   HELPERS
============================================================ */

const f = (name, size = 1024) => ({
  name,
  size,
});

/* ============================================================
   CONFIG SYNC
============================================================ */

test("LAYER_TYPE_DEFAULTS sinkron dengan LAYER_TYPE_CONFIG", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(LAYER_TYPE_DEFAULTS).map(([key, value]) => [
        key,
        [value.defaultName, value.defaultOpacity],
      ])
    ),

    Object.fromEntries(
      Object.entries(LAYER_TYPE_CONFIG).map(([key, value]) => [
        key,
        [value.defaultName, value.defaultOpacity],
      ])
    )
  );
});

/* ============================================================
   FILE ERROR
============================================================ */

test("fileError: ekstensi dan file kosong", () => {
  assert.equal(fileError(null), "Pilih satu file GeoTIFF.");

  assert.match(fileError(f("data.png")), /\.tif atau \.tiff/);

  assert.match(fileError(f("data.tif", 0)), /0 byte/);

  assert.equal(fileError(f("data.tiff")), null);

  assert.equal(fileError(f("DATA.TIF")), null);
});

/* ============================================================
   LAYER ERRORS
============================================================ */

test("layerErrors: nama wajib dan peran base", () => {
  assert.ok(
    layerErrors({
      name: "",
      file: f("a.tif"),
      layer_type: "ndvi",
      default_opacity: 0.5,
    }).some((error) => error.includes("Nama layer wajib"))
  );

  assert.ok(
    layerErrors(
      {
        name: "B",
        file: f("a.tif"),
        layer_type: "ndvi",
        default_opacity: 0.5,
      },
      true
    ).length > 0
  );

  assert.equal(
    layerErrors(
      {
        name: "B",
        file: f("a.tif"),
        layer_type: "ortho",
        default_opacity: 1,
      },
      true
    ).length,
    0
  );

  assert.ok(
    layerErrors({
      name: "B",
      file: f("a.tif"),
      layer_type: "ortho",
      default_opacity: 1,
    }).some((error) => error.includes("Tipe layer"))
  );

  assert.ok(
    layerErrors({
      name: "B",
      file: f("a.tif"),
      layer_type: "ndvi",
      default_opacity: 1.5,
    }).some((error) => error.includes("Opasitas"))
  );
});

/* ============================================================
   MANUAL READINESS
============================================================ */

test("manualReadiness: base saja siap; slot tak lengkap memblokir", () => {
  const ok = manualReadiness(
    f("ortho.tif"),
    "Citra Ortho RGB Utama",
    [],
    "Judul",
    "Paca, Halmahera Utara",
    "2026-09-11"
  );

  assert.equal(ok.ready, true);

  assert.equal(ok.files.length, 1);

  const slot = createManualSlot("s1");

  const blocked = manualReadiness(
    f("ortho.tif"),
    "Citra Ortho RGB Utama",
    [slot],
    "Judul",
    "Paca",
    "2026-09-11"
  );

  assert.equal(blocked.ready, false);

  assert.ok(blocked.errors.some((error) => error.includes("Layer analisis 1")));

  const badMeta = manualReadiness(
    f("ortho.tif"),
    "Ortho",
    [],
    "",
    "",
    "2026-13-40"
  );

  assert.equal(badMeta.ready, false);

  assert.ok(badMeta.errors.length >= 3);
});

/* ============================================================
   CREATE MANUAL SLOT
============================================================ */

test("createManualSlot: default NDVI, mengikuti tipe terakhir", () => {
  const first = createManualSlot("a");

  assert.equal(first.layer_type, "ndvi");

  assert.equal(first.file, null);

  const next = createManualSlot("b", {
    ...first,
    layer_type: "kalium",
  });

  assert.equal(next.layer_type, "kalium");

  assert.match(next.name, /Kalium/);
});

/* ============================================================
   NORMALIZE BATCH BASE
============================================================ */

test("normalizeBatchBase: tidak pernah memaksa layer non-ortho menjadi ortho", () => {
  const items = [
    {
      id: "1",
      file: f("a.tif"),
      name: "A",
      layer_type: "ndvi",
      is_base: false,
      default_opacity: 0.85,
    },

    {
      id: "2",
      file: f("b.tif"),
      name: "B",
      layer_type: "kalium",
      is_base: false,
      default_opacity: 0.75,
    },
  ];

  const out = normalizeBatchBase(items);

  assert.equal(out.filter((item) => item.is_base).length, 0);

  assert.equal(out[0].layer_type, "ndvi");

  assert.equal(out[1].layer_type, "kalium");
});

test("normalizeBatchBase: ortho yang terdeteksi menjadi satu-satunya base", () => {
  const items = [
    {
      id: "1",
      file: f("ndvi.tif"),
      name: "NDVI",
      layer_type: "ndvi",
      is_base: false,
      default_opacity: 0.85,
    },

    {
      id: "2",
      file: f("ortho.tif"),
      name: "Ortho",
      layer_type: "ortho",
      is_base: false,
      default_opacity: 1,
    },

    {
      id: "3",
      file: f("kalium.tif"),
      name: "Kalium",
      layer_type: "kalium",
      is_base: false,
      default_opacity: 0.75,
    },
  ];

  const out = normalizeBatchBase(items);

  assert.equal(out.filter((item) => item.is_base).length, 1);

  const base = out.find((item) => item.is_base);

  assert.equal(base?.id, "2");

  assert.equal(base?.layer_type, "ortho");

  assert.equal(out[0].layer_type, "ndvi");

  assert.equal(out[2].layer_type, "kalium");
});

test("normalizeBatchBase: explicit base ortho diprioritaskan", () => {
  const items = [
    {
      id: "1",
      file: f("ortho-a.tif"),
      name: "Ortho A",
      layer_type: "ortho",
      is_base: true,
      default_opacity: 1,
    },

    {
      id: "2",
      file: f("ortho-b.tif"),
      name: "Ortho B",
      layer_type: "ortho",
      is_base: false,
      default_opacity: 1,
    },
  ];

  const out = normalizeBatchBase(items);

  assert.equal(out.filter((item) => item.is_base).length, 1);

  assert.equal(out.find((item) => item.is_base)?.id, "1");
});

/* ============================================================
   BATCH ERRORS
============================================================ */

test("batchErrors: menolak multi-base / base non-ortho", () => {
  const base = {
    id: "1",
    file: f("o.tif"),
    name: "Ortho",
    layer_type: "ortho",
    is_base: true,
    default_opacity: 1,
  };

  assert.equal(batchErrors([base], "T", "L", "2026-09-11").length, 0);

  const bad = batchErrors(
    [
      {
        ...base,
        layer_type: "ndvi",
      },
    ],
    "T",
    "L",
    "2026-09-11"
  );

  assert.ok(bad.some((error) => error.includes("tepat satu base Ortho")));

  assert.ok(
    batchErrors([], "T", "L", "2026-09-11").some((error) =>
      error.includes("minimal satu")
    )
  );
});

/* ============================================================
   METADATA + UTILITIES
============================================================ */

test("metadataChecklist & util", () => {
  const checklist = metadataChecklist("A", "B", "2026-09-11");

  assert.ok(checklist.every((item) => item.ready));

  assert.equal(metadataChecklist("A", "B", "2026-02-30")[2].ready, false);

  assert.equal(autoDetectLayer("survei_ndvi_final.tif").layer_type, "ndvi");

  assert.equal(autoDetectLayer("ortho_rgb_mosaic.tif").is_base, true);

  assert.equal(formatFileSize(5 * 1024 * 1024), "5.00 MB");
});
