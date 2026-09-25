"use client";

/* ============================================================
   FORMAT HELPERS (React) — membaca preferensi user dari store
   sehingga perubahan di halaman Pengaturan langsung terpakai.
============================================================ */

import { useCallback, useMemo } from "react";

import {
  formatDateWithPrefs,
  formatDateTimeWithPrefs,
  type DateFormatPrefs,
} from "@/lib/settings-options";
import { useSettingsStore } from "@/lib/stores/settingsStore";

export function useDatePrefs(): DateFormatPrefs {
  const dateFormat = useSettingsStore((state) => state.dateFormat);
  const timezone = useSettingsStore((state) => state.timezone);
  const locale = useSettingsStore((state) => state.locale);

  return useMemo(
    () => ({ dateFormat, timezone, locale }),
    [dateFormat, timezone, locale]
  );
}

/** `const formatDate = useFormatDate(); formatDate(map.survey_date)` */
export function useFormatDate() {
  const prefs = useDatePrefs();

  return useCallback(
    (value: unknown) => formatDateWithPrefs(value, prefs),
    [prefs]
  );
}

export function useFormatDateTime() {
  const prefs = useDatePrefs();

  return useCallback(
    (value: unknown) => formatDateTimeWithPrefs(value, prefs),
    [prefs]
  );
}
