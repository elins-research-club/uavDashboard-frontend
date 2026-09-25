"use client";

/* ============================================================
   SETTINGS EFFECTS

   Menerapkan preferensi user ke dokumen sehingga benar-benar
   terpakai di seluruh halaman:

   - data-theme        → tema terang/gelap (CSS layer di globals.css)
   - --uav-accent(*)   → warna aksen highlight navigasi
   - data-reduce-motion→ mematikan animasi/transisi
   - lang              → atribut bahasa dokumen

   Dipasang sekali di root layout.
============================================================ */

import { useEffect, useLayoutEffect } from "react";

import {
  getAccentCssVars,
  type LocaleKey,
  type ThemeMode,
} from "@/lib/settings-options";
import { useSettingsStore } from "@/lib/stores/settingsStore";

/* useLayoutEffect akan memicu warning saat SSR, jadi fallback ke
   useEffect di server. */
const useBrowserLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function SettingsEffects() {
  const theme = useSettingsStore((state) => state.theme);
  const accent = useSettingsStore((state) => state.accent);
  const animations = useSettingsStore((state) => state.animations);
  const locale = useSettingsStore((state) => state.locale);

  useBrowserLayoutEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme satisfies ThemeMode);

    root.setAttribute(
      "data-reduce-motion",
      animations ? "false" : "true"
    );

    const vars = getAccentCssVars(accent);

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    root.lang = locale satisfies LocaleKey;

    root.style.colorScheme = theme === "dark" ? "dark" : "light";
  }, [theme, accent, animations, locale]);

  return null;
}
