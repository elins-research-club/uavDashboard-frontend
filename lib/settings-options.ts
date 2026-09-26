/* ============================================================
   SETTINGS OPTIONS & PURE FORMATTERS

   Modul ini sengaja bebas dari React/zustand supaya bisa diuji
   langsung dengan `node --test` (lihat settings-options.test.mjs)
   dan menjadi satu-satunya sumber kebenaran nilai default.
============================================================ */

export type ThemeMode = "light" | "dark";

export type AccentKey = "hijau" | "biru" | "amber" | "ungu";

export type TimezoneKey = "wib" | "wita" | "wit";

export type LocaleKey = "id-ID" | "en-US";

export type DateFormatKey = "dd/mm/yyyy" | "dd mmm yyyy" | "iso";

export type LandingPageKey =
  | "/dashboard"
  | "/dashboard/maps"
  | "/dashboard/subscription";

export type MapBasemapKey = "street" | "satellite";

export type SidebarSizeKey = "kecil" | "sedang" | "besar";

export type IconSizeKey = "kecil" | "sedang" | "besar";

export type SubscriptionLeadDays = 3 | 7 | 14;

export interface UserSettings {
  /* Umum */
  landingPage: LandingPageKey;
  timezone: TimezoneKey;
  dateFormat: DateFormatKey;
  locale: LocaleKey;
  mapBasemap: MapBasemapKey;
  mapTerrain: boolean;
  mapOpacity: number;

  /* Preferensi */
  theme: ThemeMode;
  accent: AccentKey;
  sidebarSize: SidebarSizeKey;
  iconSize: IconSizeKey;
  animations: boolean;

  /* Notifikasi */
  notifyBaking: boolean;
  notifyBrowser: boolean;
  notifySubscription: boolean;
  notifyUpload: boolean;
  subscriptionLeadDays: SubscriptionLeadDays;
}

/* ============================================================
   OPTIONS
============================================================ */

export const THEME_OPTIONS: {
  value: ThemeMode;
  label: string;
  description: string;
  beta?: boolean;
}[] = [
  {
    value: "light",
    label: "Terang",
    description: "Tampilan default platform",
  },
  {
    value: "dark",
    label: "Gelap",
    description: "Permukaan gelap, kontras tinggi",
    beta: true,
  },
];

export const ACCENT_OPTIONS: {
  value: AccentKey;
  label: string;
  accent: string;
  tint: string;
  border: string;
}[] = [
  {
    value: "hijau",
    label: "Hijau AMX",
    accent: "#76B900",
    tint: "#F1F6EB",
    border: "#DDE3D3",
  },
  {
    value: "biru",
    label: "Biru Presisi",
    accent: "#0E7490",
    tint: "#ECF6F9",
    border: "#CFE4EA",
  },
  {
    value: "amber",
    label: "Amber Panen",
    accent: "#B45309",
    tint: "#FDF5EA",
    border: "#EEDCC4",
  },
  {
    value: "ungu",
    label: "Ungu Geodesi",
    accent: "#7C3AED",
    tint: "#F4EFFD",
    border: "#E0D4F7",
  },
];

export const TIMEZONE_OPTIONS: {
  value: TimezoneKey;
  label: string;
  iana: string;
}[] = [
  { value: "wib", label: "WIB (UTC+07:00)", iana: "Asia/Jakarta" },
  { value: "wita", label: "WITA (UTC+08:00)", iana: "Asia/Makassar" },
  { value: "wit", label: "WIT (UTC+09:00)", iana: "Asia/Jayapura" },
];

export const LOCALE_OPTIONS: { value: LocaleKey; label: string }[] = [
  { value: "id-ID", label: "Bahasa Indonesia" },
  { value: "en-US", label: "English (US)" },
];

export const DATE_FORMAT_OPTIONS: {
  value: DateFormatKey;
  label: string;
  sample: string;
}[] = [
  { value: "dd/mm/yyyy", label: "31/12/2026", sample: "dd/mm/yyyy" },
  { value: "dd mmm yyyy", label: "31 Des 2026", sample: "dd mmm yyyy" },
  { value: "iso", label: "2026-12-31", sample: "yyyy-mm-dd" },
];

export const LANDING_PAGE_OPTIONS: {
  value: LandingPageKey;
  label: string;
  description: string;
}[] = [
  {
    value: "/dashboard",
    label: "Ringkasan",
    description: "Statistik dan aktivitas terbaru",
  },
  {
    value: "/dashboard/maps",
    label: "Peta Saya",
    description: "Langsung membuka WebGIS",
  },
  {
    value: "/dashboard/subscription",
    label: "Langganan",
    description: "Paket dan riwayat pembayaran",
  },
];

export const SIDEBAR_SIZE_OPTIONS: {
  value: SidebarSizeKey;
  label: string;
  width: number;
}[] = [
  { value: "kecil", label: "Kecil (220px)", width: 220 },
  { value: "sedang", label: "Sedang (258px)", width: 258 },
  { value: "besar", label: "Besar (290px)", width: 290 },
];

export const ICON_SIZE_OPTIONS: {
  value: IconSizeKey;
  label: string;
  size: number;
}[] = [
  { value: "kecil", label: "Kecil (16px)", size: 16 },
  { value: "sedang", label: "Sedang (18px)", size: 18 },
  { value: "besar", label: "Besar (21px)", size: 21 },
];

export const MAP_BASEMAP_OPTIONS: {
  value: MapBasemapKey;
  label: string;
  description: string;
}[] = [
  {
    value: "street",
    label: "Peta Jalan (OSM)",
    description: "Cocok untuk orientasi batas lahan",
  },
  {
    value: "satellite",
    label: "Satelit Bumi",
    description: "Cocok untuk konteks visual lapangan",
  },
];

export const SUBSCRIPTION_LEAD_OPTIONS: {
  value: SubscriptionLeadDays;
  label: string;
}[] = [
  { value: 3, label: "3 hari sebelum berakhir" },
  { value: 7, label: "7 hari sebelum berakhir" },
  { value: 14, label: "14 hari sebelum berakhir" },
];

/* ============================================================
   DEFAULTS
============================================================ */

export const DEFAULT_SETTINGS: UserSettings = {

  landingPage: "/dashboard",
  timezone: "wib",
  dateFormat: "dd/mm/yyyy",
  locale: "id-ID",
  mapBasemap: "street",
  mapTerrain: false,
  mapOpacity: 0.95,

  theme: "light",
  accent: "hijau",
  sidebarSize: "sedang",
  iconSize: "sedang",
  animations: true,

  notifyBaking: true,
  notifyBrowser: false,
  notifySubscription: true,
  notifyUpload: true,
  subscriptionLeadDays: 7,
};

export const SIDEBAR_COLLAPSED_WIDTH = 76;

/* ============================================================
   LOOKUPS
============================================================ */

function accentOf(accent: AccentKey) {
  return (
    ACCENT_OPTIONS.find((item) => item.value === accent) || ACCENT_OPTIONS[0]
  );
}

export function getAccentCssVars(accent: AccentKey) {
  const option = accentOf(accent);

  return {
    "--uav-accent": option.accent,
    "--uav-accent-tint": option.tint,
    "--uav-accent-border": option.border,
  } as Record<string, string>;
}

export function getAccentLabel(accent: AccentKey) {
  return accentOf(accent).label;
}

export function getTimezone(zone: TimezoneKey) {
  return (
    TIMEZONE_OPTIONS.find((item) => item.value === zone) || TIMEZONE_OPTIONS[0]
  );
}

export function getSidebarWidth(size: SidebarSizeKey) {
  return (
    SIDEBAR_SIZE_OPTIONS.find((item) => item.value === size) ||
    SIDEBAR_SIZE_OPTIONS[1]
  ).width;
}

export function getIconSize(size: IconSizeKey) {
  return (
    ICON_SIZE_OPTIONS.find((item) => item.value === size) ||
    ICON_SIZE_OPTIONS[1]
  ).size;
}

/* ============================================================
   DATE FORMATTING (pure — dipakai store, komponen, dan test)
============================================================ */

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value as string);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function partsOf(date: Date, iana: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: iana,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
  };
}

export interface DateFormatPrefs {
  dateFormat: DateFormatKey;
  timezone: TimezoneKey;
  locale: LocaleKey;
}

/**
 * Format tanggal mengikuti preferensi user (zona waktu + pola + locale).
 * Mengembalikan "-" bila nilai kosong / tidak valid.
 */
export function formatDateWithPrefs(
  value: unknown,
  prefs: DateFormatPrefs
): string {
  const date = toDate(value);

  if (!date) {
    return "-";
  }

  const zone = getTimezone(prefs.timezone);
  const { year, month, day } = partsOf(date, zone.iana);

  if (prefs.dateFormat === "iso") {
    return `${year}-${month}-${day}`;
  }

  if (prefs.dateFormat === "dd/mm/yyyy") {
    return `${day}/${month}/${year}`;
  }

  const monthLabel = new Intl.DateTimeFormat(prefs.locale, {
    month: "short",
    timeZone: zone.iana,
  })
    .format(date)
    .replace(".", "");

  return `${Number(day)} ${monthLabel} ${year}`;
}

/**
 * Format tanggal + jam (HH:MM) mengikuti preferensi user.
 */
export function formatDateTimeWithPrefs(
  value: unknown,
  prefs: DateFormatPrefs
): string {
  const date = toDate(value);

  if (!date) {
    return "-";
  }

  const zone = getTimezone(prefs.timezone);
  const { hour, minute } = partsOf(date, zone.iana);

  return `${formatDateWithPrefs(date, prefs)} · ${hour}:${minute}`;
}

/**
 * Selisih hari menuju sebuah tanggal (negatif bila sudah lewat).
 */
export function daysUntil(
  value: unknown,
  now: Date = new Date()
): number | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function sanitizeOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SETTINGS.mapOpacity;
  }

  const clamped = Math.min(1, Math.max(0.3, value));

  return Math.round(clamped * 100) / 100;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function formatMegabytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const megabytes = bytes / 1024 / 1024;

  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }

  return `${megabytes.toFixed(2)} MB`;
}

export function decodeTokenExpiry(token: string | null): number | null {
  if (!token || typeof atob !== "function") {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded = JSON.parse(
      decodeURIComponent(
        atob(normalized)
          .split("")
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
      )
    );

    const exp = Number(decoded?.exp);

    if (!Number.isFinite(exp) || exp <= 0) {
      return null;
    }

    return exp * 1000;
  } catch {
    return null;
  }
}
