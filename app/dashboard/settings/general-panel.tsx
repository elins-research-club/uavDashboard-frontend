"use client";

/* ============================================================
   PANEL — UMUM

   Workspace name, halaman tujuan setelah login, zona waktu /
   format tanggal / bahasa, dan preferensi dasar peta.
   Semua kontrol menulis langsung ke useSettingsStore
   (auto-save + persist ke localStorage).
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
  TextField,
  ToggleRow,
} from "./settings-ui";

const PREVIEW_DATE = new Date();

export function GeneralPanel() {
  const workspaceName = useSettingsStore((state) => state.workspaceName);
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
      <SectionHeader
        eyebrow="Workspace"
        title="Umum"
        description="Informasi dasar workspace, preferensi regional, dan setelan peta awal."
        icon={Settings2}
      />

      {/* Status strip */}
      <div className="border border-[#DCDDD8]">
        <InfoItem icon={LayoutDashboard} label="Platform" value="AMX UAV DaaS" />

        <InfoItem icon={Globe2} label="Wilayah" value="Halmahera Utara" />

        <InfoItem icon={ShieldCheck} label="Status" value="Aktif" accent />
      </div>

      {/* Workspace */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Workspace
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Nama tampil dan halaman tujuan setelah login.
          </p>
        </div>

        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <TextField
            icon={LayoutDashboard}
            label="Nama workspace"
            description="Ditampilkan pada judul dokumen dan kartu profil."
            value={workspaceName}
            placeholder="Agri Halmahera"
            onChange={(value) => update({ workspaceName: value })}
          />

          <SelectField<LandingPageKey>
            label="Halaman setelah login"
            description="Tujuan redirect setelah berhasil masuk."
            value={landingPage}
            onChange={(value) => update({ landingPage: value })}
            options={LANDING_PAGE_OPTIONS}
          />

          <SelectField<TimezoneKey>
            label="Zona waktu"
            description="Digunakan untuk seluruh timestamp."
            value={timezone}
            onChange={(value) => update({ timezone: value })}
            options={TIMEZONE_OPTIONS}
          />

          <SelectField<LocaleKey>
            label="Bahasa"
            description="Bahasa interface dan nama bulan."
            value={locale}
            onChange={(value) => update({ locale: value })}
            options={LOCALE_OPTIONS}
          />

          <SelectField<DateFormatKey>
            label="Format tanggal"
            description="Pola penulisan tanggal pada seluruh halaman."
            value={dateFormat}
            onChange={(value) => update({ dateFormat: value })}
            options={DATE_FORMAT_OPTIONS}
          />

          <div className="border border-[#DCDDD8] bg-[#FAFAF8] p-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#858780] sm:text-[9px]">
              Pratinjau tanggal
            </p>

            <p className="mt-2 text-[13px] font-bold text-[#171717] sm:text-sm">
              {preview} · 14:30
            </p>

            <p className="mt-1 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
              Sesuai zona waktu, pola, dan bahasa yang dipilih.
            </p>
          </div>
        </div>
      </section>
      {/* Peta */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Peta
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Basemap, terrain 3D, dan opasitas bawaan Map Viewer.
          </p>
        </div>

        <div className="border border-[#DCDDD8] bg-white">
          <div className="border-b border-[#DCDDD8] p-4 sm:p-5">
            <SelectField<MapBasemapKey>
              label="Basemap awal"
              description="Tampilan dasar peta saat Map Viewer dibuka."
              value={mapBasemap}
              onChange={(value) => update({ mapBasemap: value })}
              options={MAP_BASEMAP_OPTIONS}
            />
          </div>

          <ToggleRow
            icon={MapPinned}
            label="Terrain 3D"
            description="Aktifkan relief terrain saat peta dibuka (butuh koneksi internet)."
            checked={mapTerrain}
            onChange={(value) => update({ mapTerrain: value })}
          />

          <div className="border-t border-[#DCDDD8] p-4 sm:p-5">
            <RangeField
              label="Opasitas overlay"
              description="Transparansi kumpulan layer UAV pada peta (30–100%)."
              value={clampPercent(Math.round(mapOpacity * 100))}
              onChange={(value) => update({ mapOpacity: Math.round(value) / 100 })}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <InfoBlock
          label="Environment"
          value="Production"
          description="Workspace terhubung ke environment utama."
        />

        <InfoBlock
          label="Data Region"
          value="Indonesia"
          description="Konfigurasi regional utama platform."
        />
      </div>
    </div>
  );
}
