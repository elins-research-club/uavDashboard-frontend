import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SETTINGS,
  SIDEBAR_COLLAPSED_WIDTH,
  clampPercent,
  daysUntil,
  decodeTokenExpiry,
  formatMegabytes,
  formatDateWithPrefs,
  formatDateTimeWithPrefs,
  getAccentCssVars,
  getIconSize,
  getSidebarWidth,
  getTimezone,
  sanitizeOpacity,
} from "./settings-options.ts";

/* ============================================================
   DEFAULTS
============================================================ */

test("DEFAULT_SETTINGS konsisten", () => {
  assert.equal(DEFAULT_SETTINGS.landingPage, "/dashboard");
  assert.equal(DEFAULT_SETTINGS.timezone, "wib");
  assert.equal(DEFAULT_SETTINGS.dateFormat, "dd/mm/yyyy");
  assert.equal(DEFAULT_SETTINGS.theme, "light");
  assert.equal(DEFAULT_SETTINGS.accent, "hijau");
  assert.ok(["id-ID", "en-US"].includes(DEFAULT_SETTINGS.locale));
  assert.ok(DEFAULT_SETTINGS.animations);
  assert.ok(DEFAULT_SETTINGS.notifyBaking);
  assert.ok(!DEFAULT_SETTINGS.notifyBrowser);
  assert.equal(DEFAULT_SETTINGS.subscriptionLeadDays, 7);
});

test("SIDEBAR_COLLAPSED_WIDTH", () => {
  assert.equal(SIDEBAR_COLLAPSED_WIDTH, 76);
});

/* ============================================================
   LOOKUPS
============================================================ */

test("getSidebarWidth / getIconSize mengikuti opsi", () => {
  assert.equal(getSidebarWidth("kecil"), 220);
  assert.equal(getSidebarWidth("sedang"), 258);
  assert.equal(getSidebarWidth("besar"), 290);

  assert.equal(getIconSize("kecil"), 16);
  assert.equal(getIconSize("sedang"), 18);
  assert.equal(getIconSize("besar"), 21);
});

test("getTimezone mengembalikan IANA yang benar", () => {
  assert.equal(getTimezone("wib").iana, "Asia/Jakarta");
  assert.equal(getTimezone("wita").iana, "Asia/Makassar");
  assert.equal(getTimezone("wit").iana, "Asia/Jayapura");
});

test("getAccentCssVars memetakan warna aksen", () => {
  assert.deepEqual(getAccentCssVars("hijau"), {
    "--uav-accent": "#76B900",
    "--uav-accent-tint": "#F1F6EB",
    "--uav-accent-border": "#DDE3D3",
  });

  assert.equal(getAccentCssVars("biru")["--uav-accent"], "#0E7490");
  assert.equal(getAccentCssVars("ungu")["--uav-accent"], "#7C3AED");
});

/* ============================================================
   FORMAT TANGGAL
============================================================ */

const WIB_PREFS = {
  dateFormat: "dd/mm/yyyy",
  timezone: "wib",
  locale: "id-ID",
};

test("formatDateWithPrefs: pola dd/mm/yyyy dan iso", () => {
  // 15:30 UTC = 22:30 WIB (hari yang sama)
  assert.equal(
    formatDateWithPrefs("2026-09-10T15:30:00Z", WIB_PREFS),
    "10/09/2026"
  );

  assert.equal(
    formatDateWithPrefs("2026-09-10T15:30:00Z", {
      ...WIB_PREFS,
      dateFormat: "iso",
    }),
    "2026-09-10"
  );
});

test("formatDateWithPrefs: zona waktu mengubah hari", () => {
  // 15:30 UTC → 22:30 WIT sudah 11 September
  assert.equal(
    formatDateWithPrefs("2026-09-10T15:30:00Z", {
      ...WIB_PREFS,
      timezone: "wit",
    }),
    "11/09/2026"
  );
});

test("formatDateWithPrefs: pola dd mmm yyyy dan nilai invalid", () => {
  const formatted = formatDateWithPrefs("2026-09-11T03:00:00Z", {
    ...WIB_PREFS,
    dateFormat: "dd mmm yyyy",
  });

  assert.match(formatted, /^11 \S+ 2026$/);

  assert.equal(formatDateWithPrefs(null, WIB_PREFS), "-");
  assert.equal(formatDateWithPrefs("bukan-tanggal", WIB_PREFS), "-");
});

test("formatDateTimeWithPrefs menyertakan jam", () => {
  const formatted = formatDateTimeWithPrefs("2026-09-10T15:30:00Z", WIB_PREFS);

  assert.equal(formatted, "10/09/2026 · 22:30");
});

/* ============================================================
   UTILITIES
============================================================ */

test("daysUntil menghitung selisih hari", () => {
  const now = new Date("2026-09-11T00:00:00Z");

  assert.equal(daysUntil("2026-09-14T00:00:00Z", now), 3);
  assert.equal(daysUntil("2026-09-08T00:00:00Z", now), -3);
  assert.equal(daysUntil(null, now), null);
});

test("sanitizeOpacity membatasi 0.3–1 dan 2 desimal", () => {
  assert.equal(sanitizeOpacity(0.05), 0.3);
  assert.equal(sanitizeOpacity(1.7), 1);
  assert.equal(sanitizeOpacity(0.555), 0.56);
  assert.equal(sanitizeOpacity(Number.NaN), DEFAULT_SETTINGS.mapOpacity);
});

test("clampPercent membatasi 0–100", () => {
  assert.equal(clampPercent(-10), 0);
  assert.equal(clampPercent(130), 100);
  assert.equal(clampPercent(96.6), 97);
  assert.equal(clampPercent(Number.NaN), 0);
});

test("formatMegabytes dalam MB/GB", () => {
  assert.equal(formatMegabytes(0), "0 MB");
  assert.equal(formatMegabytes(5 * 1024 * 1024), "5.00 MB");
  assert.equal(formatMegabytes(1.5 * 1024 * 1024 * 1024), "1.50 GB");
});

test("decodeTokenExpiry membaca exp JWT", () => {
  const payload = Buffer.from(JSON.stringify({ exp: 1893456000 })).toString(
    "base64url"
  );

  const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;

  assert.equal(decodeTokenExpiry(token), 1893456000 * 1000);
  assert.equal(decodeTokenExpiry(null), null);
  assert.equal(decodeTokenExpiry("abc.def.ghi"), null);
});
