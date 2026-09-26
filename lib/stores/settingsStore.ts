"use client";

/* ============================================================
   USER SETTINGS STORE

   Satu sumber kebenaran untuk seluruh preferensi user
   (Umum, Preferensi, Notifikasi). Dipersist ke localStorage
   dengan key `amx-user-settings` + migrasi otomatis dari
   key lama `uav_*` supaya preferensi pengguna lama tidak hilang.
============================================================ */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  DEFAULT_SETTINGS,
  sanitizeOpacity,
  type AccentKey,
  type DateFormatKey,
  type IconSizeKey,
  type LandingPageKey,
  type LocaleKey,
  type MapBasemapKey,
  type SidebarSizeKey,
  type SubscriptionLeadDays,
  type ThemeMode,
  type TimezoneKey,
  type UserSettings,
} from "@/lib/settings-options";

export const SETTINGS_STORAGE_KEY = "amx-user-settings";

export interface SettingsStore extends UserSettings {
  /* Sudah rehydrate dari localStorage? Dipakai untuk menghindari
     flicker pada render pertama. */
  hydrated: boolean;

  updatedAt: number | null;

  update: (patch: Partial<UserSettings>) => void;
  reset: () => void;
  setHydrated: (value: boolean) => void;
}

/* ============================================================
   LEGACY MIGRATION (key `uav_*` versi lama)
============================================================ */

const LEGACY_KEYS = [
  "uav_theme",
  "uav_timezone",
  "uav_language",
  "uav_sidebar_size",
  "uav_icon_size",
  "uav_notifications",
] as const;

const SIDEBAR_LEGACY: Record<string, SidebarSizeKey> = {
  "Kecil (220px)": "kecil",
  "Sedang (255px)": "sedang",
  "Besar (290px)": "besar",
};

const ICON_LEGACY: Record<string, IconSizeKey> = {
  "Kecil (16px)": "kecil",
  "Sedang (18px)": "sedang",
  "Besar (21px)": "besar",
};

const TIMEZONE_LEGACY: Record<string, TimezoneKey> = {
  "WIB (UTC+07:00)": "wib",
  "WITA (UTC+08:00)": "wita",
  "WIT (UTC+09:00)": "wit",
};

export function mapLegacyTheme(value: string | null): ThemeMode | null {
  if (value === "light" || value === "dark") {
    return value;
  }

  // "custom" pada versi lama tidak punya implementasi nyata → terang.
  if (value === "custom") {
    return "light";
  }

  return null;
}

export function migrateLegacySettings(): Partial<UserSettings> {
  if (typeof window === "undefined") {
    return {};
  }

  const patch: Partial<UserSettings> = {};

  try {
    const theme = mapLegacyTheme(localStorage.getItem("uav_theme"));
    if (theme) patch.theme = theme;

    const timezone = localStorage.getItem("uav_timezone");
    if (timezone && TIMEZONE_LEGACY[timezone]) {
      patch.timezone = TIMEZONE_LEGACY[timezone];
    }

    const language = localStorage.getItem("uav_language");
    if (language === "Bahasa Indonesia") patch.locale = "id-ID";
    if (language === "English (US)") patch.locale = "en-US";

    const sidebar = localStorage.getItem("uav_sidebar_size");
    if (sidebar && SIDEBAR_LEGACY[sidebar]) {
      patch.sidebarSize = SIDEBAR_LEGACY[sidebar];
    }

    const icon = localStorage.getItem("uav_icon_size");
    if (icon && ICON_LEGACY[icon]) {
      patch.iconSize = ICON_LEGACY[icon];
    }

    const notifications = localStorage.getItem("uav_notifications");
    if (notifications === "true" || notifications === "false") {
      patch.notifyBaking = notifications === "true";
    }

    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage bisa diblokir (private mode) — abaikan saja.
  }

  return patch;
}

/* ============================================================
   NORMALIZER — semua nilai dari UI melewati fungsi ini
============================================================ */

export function normalizeSettingsPatch(
  patch: Partial<UserSettings>
): Partial<UserSettings> {
  const next: Partial<UserSettings> = { ...patch };

  if (next.mapOpacity !== undefined) {
    next.mapOpacity = sanitizeOpacity(Number(next.mapOpacity));
  }

  if (next.subscriptionLeadDays !== undefined) {
    const allowed: SubscriptionLeadDays[] = [3, 7, 14];
    const value = Number(next.subscriptionLeadDays) as SubscriptionLeadDays;
    next.subscriptionLeadDays = allowed.includes(value) ? value : 7;
  }

  if (next.landingPage !== undefined) {
    const allowed: LandingPageKey[] = [
      "/dashboard",
      "/dashboard/maps",
      "/dashboard/subscription",
    ];

    if (!allowed.includes(next.landingPage)) {
      next.landingPage = DEFAULT_SETTINGS.landingPage;
    }
  }

  if (next.mapBasemap !== undefined) {
    const allowed: MapBasemapKey[] = ["street", "satellite"];

    if (!allowed.includes(next.mapBasemap)) {
      next.mapBasemap = DEFAULT_SETTINGS.mapBasemap;
    }
  }

  if (next.theme !== undefined) {
    const allowed: ThemeMode[] = ["light", "dark"];

    if (!allowed.includes(next.theme)) {
      next.theme = DEFAULT_SETTINGS.theme;
    }
  }

  if (next.accent !== undefined) {
    const allowed: AccentKey[] = ["hijau", "biru", "amber", "ungu"];

    if (!allowed.includes(next.accent)) {
      next.accent = DEFAULT_SETTINGS.accent;
    }
  }

  if (next.dateFormat !== undefined) {
    const allowed: DateFormatKey[] = ["dd/mm/yyyy", "dd mmm yyyy", "iso"];

    if (!allowed.includes(next.dateFormat)) {
      next.dateFormat = DEFAULT_SETTINGS.dateFormat;
    }
  }

  if (next.locale !== undefined) {
    const allowed: LocaleKey[] = ["id-ID", "en-US"];

    if (!allowed.includes(next.locale)) {
      next.locale = DEFAULT_SETTINGS.locale;
    }
  }

  if (next.timezone !== undefined) {
    const allowed: TimezoneKey[] = ["wib", "wita", "wit"];

    if (!allowed.includes(next.timezone)) {
      next.timezone = DEFAULT_SETTINGS.timezone;
    }
  }

  if (next.sidebarSize !== undefined) {
    const allowed: SidebarSizeKey[] = ["kecil", "sedang", "besar"];

    if (!allowed.includes(next.sidebarSize)) {
      next.sidebarSize = DEFAULT_SETTINGS.sidebarSize;
    }
  }

  if (next.iconSize !== undefined) {
    const allowed: IconSizeKey[] = ["kecil", "sedang", "besar"];

    if (!allowed.includes(next.iconSize)) {
      next.iconSize = DEFAULT_SETTINGS.iconSize;
    }
  }

  return next;
}

/* ============================================================
   STORE
============================================================ */

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      hydrated: false,

      updatedAt: null,

      update: (patch) =>
        set((state) => ({
          ...state,
          ...normalizeSettingsPatch(patch),
          updatedAt: Date.now(),
        })),

      reset: () =>
        set({
          ...DEFAULT_SETTINGS,
          updatedAt: Date.now(),
        }),

      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,

      storage: createJSONStorage(() => localStorage),

      version: 1,

      /* `hydrated` bukan state yang perlu disimpan. */
      partialize: (state) => {
        const { hydrated: _hydrated, ...persisted } = state;

        return persisted as SettingsStore;
      },

      onRehydrateStorage: () => (state) => {
        const legacy = migrateLegacySettings();

        if (Object.keys(legacy).length > 0) {
          useSettingsStore.getState().update(legacy);
        }

        state?.setHydrated(true);
      },
    }
  )
);

/* ============================================================
   NON-REACT ACCESSOR (dipakai lib/notify.ts, hook, dan util)
============================================================ */

export function getSettingsSnapshot(): UserSettings {
  const state = useSettingsStore.getState();

  return {
    landingPage: state.landingPage,
    timezone: state.timezone,
    dateFormat: state.dateFormat,
    locale: state.locale,
    mapBasemap: state.mapBasemap,
    mapTerrain: state.mapTerrain,
    mapOpacity: state.mapOpacity,
    theme: state.theme,
    accent: state.accent,
    sidebarSize: state.sidebarSize,
    iconSize: state.iconSize,
    animations: state.animations,
    notifyBaking: state.notifyBaking,
    notifyBrowser: state.notifyBrowser,
    notifySubscription: state.notifySubscription,
    notifyUpload: state.notifyUpload,
    subscriptionLeadDays: state.subscriptionLeadDays,
  };
}
