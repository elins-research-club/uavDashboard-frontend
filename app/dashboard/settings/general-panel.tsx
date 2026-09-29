"use client";

/* ============================================================
   PANEL — UMUM
============================================================ */

import {
  Globe2,
  LayoutDashboard,
  MapPinned,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import {
  DATE_FORMAT_OPTIONS,
  LANDING_PAGE_OPTIONS,
  LOCALE_OPTIONS,
  MAP_BASEMAP_OPTIONS,
  TIMEZONE_OPTIONS,
  clampPercent,
  formatDateWithPrefs,
  type DateFormatKey,
  type LandingPageKey,
  type LocaleKey,
  type MapBasemapKey,
  type TimezoneKey,
} from "@/lib/settings-options";

import { useSettingsStore } from "@/lib/stores/settingsStore";

import {
  InfoBlock,
  InfoItem,
  RangeField,
  SectionHeader,
  SelectField,
  ToggleRow,
} from "./settings-ui";

const PREVIEW_DATE = new Date();

export function GeneralPanel() {
  const landingPage = useSettingsStore((state) => state.landingPage);

  const timezone = useSettingsStore((state) => state.timezone);

  const dateFormat = useSettingsStore((state) => state.dateFormat);

  const locale = useSettingsStore((state) => state.locale);

  const mapBasemap = useSettingsStore((state) => state.mapBasemap);

  const mapTerrain = useSettingsStore((state) => state.mapTerrain);

  const mapOpacity = useSettingsStore((state) => state.mapOpacity);

  const update = useSettingsStore((state) => state.update);

  const preview = formatDateWithPrefs(PREVIEW_DATE, {
    dateFormat,
    timezone,
    locale,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER */}
      <SectionHeader eyebrow="Workspace" title="Umum" icon={Settings2} />

      {/* STATUS */}
      <div className="border border-[#DCDDD8] bg-white">
        <InfoItem
          icon={LayoutDashboard}
          label="Platform"
          value="AMX UAV DaaS"
        />

        <InfoItem icon={Globe2} label="Wilayah" value="Halmahera Utara" />

        <InfoItem icon={ShieldCheck} label="Status" value="Aktif" accent />
      </div>

      {/* WORKSPACE */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-lg">
            Workspace
          </h3>
        </div>

        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <SelectField<LandingPageKey>
            label="Halaman setelah login"
            value={landingPage}
            onChange={(value) => update({ landingPage: value })}
            options={LANDING_PAGE_OPTIONS}
          />

          <SelectField<TimezoneKey>
            label="Zona waktu"
            value={timezone}
            onChange={(value) => update({ timezone: value })}
            options={TIMEZONE_OPTIONS}
          />

          <SelectField<LocaleKey>
            label="Bahasa"
            value={locale}
            onChange={(value) => update({ locale: value })}
            options={LOCALE_OPTIONS}
          />

          <SelectField<DateFormatKey>
            label="Format tanggal"
            value={dateFormat}
            onChange={(value) => update({ dateFormat: value })}
            options={DATE_FORMAT_OPTIONS}
          />

          {/* DATE PREVIEW */}
          <div className="border border-[#DCDDD8] bg-[#FAFAF8] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#858780] sm:text-[9px]">
                Pratinjau
              </p>

              <span className="border border-[#DCDDD8] bg-white px-2 py-0.5 text-[9px] font-bold text-[#6B6B66]">
                {timezone}
              </span>
            </div>

            <p className="mt-2 text-[13px] font-bold text-[#171717] sm:text-sm">
              {preview} · 14:30
            </p>
          </div>
        </div>
      </section>

      {/* MAP */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-lg">
            Pengaturan Peta
          </h3>
        </div>

        <div className="border border-[#DCDDD8] bg-white">
          <div className="border-b border-[#DCDDD8] p-4 sm:p-5">
            <SelectField<MapBasemapKey>
              label="Basemap"
              value={mapBasemap}
              onChange={(value) => update({ mapBasemap: value })}
              options={MAP_BASEMAP_OPTIONS}
            />
          </div>

          <ToggleRow
            icon={MapPinned}
            label="Terrain 3D"
            checked={mapTerrain}
            onChange={(value) => update({ mapTerrain: value })}
          />

          <div className="border-t border-[#DCDDD8] p-4 sm:p-5">
            <RangeField
              label="Opasitas overlay"
              value={clampPercent(Math.round(mapOpacity * 100))}
              onChange={(value) =>
                update({
                  mapOpacity: Math.round(value) / 100,
                })
              }
            />
          </div>
        </div>
      </section>

      {/* SYSTEM */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <InfoBlock label="Environment" value="Production" />

        <InfoBlock label="Data Region" value="Indonesia" />
      </div>
    </div>
  );
}
