"use client";

/* ============================================================
   PANEL — PREFERENSI

   Tema, aksen, ukuran sidebar/ikon, dan animasi.
   Semua kontrol menulis langsung ke useSettingsStore dan
   langsung terlihat berkat <SettingsEffects />.
============================================================ */

import { Check, Palette } from "lucide-react";
import { motion } from "framer-motion";

import {
  ACCENT_OPTIONS,
  ICON_SIZE_OPTIONS,
  SIDEBAR_SIZE_OPTIONS,
  THEME_OPTIONS,
  type AccentKey,
  type IconSizeKey,
  type SidebarSizeKey,
  type ThemeMode,
} from "@/lib/settings-options";
import { useSettingsStore } from "@/lib/stores/settingsStore";

import { SectionHeader, SelectField, ToggleRow } from "./settings-ui";

function ThemePreview({ value }: { value: ThemeMode }) {
  const dark = value === "dark";

  return (
    <div
      className={`relative h-24 overflow-hidden border sm:h-28 ${
        dark ? "border-[#3B403D] bg-[#171917]" : "border-[#DCDDD8] bg-[#F8F9F6]"
      }`}
    >
      <div
        className={`absolute bottom-0 left-0 top-0 w-[24%] border-r ${
          dark ? "border-white/10 bg-[#111311]" : "border-black/5 bg-white"
        }`}
      />

      <div
        className={`absolute left-[28%] right-3 top-3 h-2 ${
          dark ? "bg-white/15" : "bg-[#171717]/10"
        }`}
      />

      <div className="absolute left-[28%] right-3 top-10 grid grid-cols-2 gap-1.5 sm:gap-2">
        <div
          className={`h-9 border sm:h-10 ${
            dark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"
          }`}
        />

        <div
          className={`h-9 border sm:h-10 ${
            dark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"
          }`}
        />
      </div>

      <div className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 bg-[var(--uav-accent)] sm:bottom-3 sm:right-3" />
    </div>
  );
}

export function PreferencesPanel() {
  const theme = useSettingsStore((state) => state.theme);
  const accent = useSettingsStore((state) => state.accent);
  const sidebarSize = useSettingsStore((state) => state.sidebarSize);
  const iconSize = useSettingsStore((state) => state.iconSize);
  const animations = useSettingsStore((state) => state.animations);
  const update = useSettingsStore((state) => state.update);

  const activeThemeLabel =
    THEME_OPTIONS.find((item) => item.value === theme)?.label || "Terang";

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Appearance"
        title="Preferensi Tampilan"
        description="Tema, warna aksen, dan dimensi navigasi berlaku seketika di seluruh halaman."
        icon={Palette}
      />

      {/* Tema */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
              Tema
            </h3>

            <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
              Pilih visual environment yang digunakan.
            </p>
          </div>

          <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.1em] text-[#858780] sm:text-[9px] sm:tracking-[0.12em]">
            {activeThemeLabel}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {THEME_OPTIONS.map((item) => {
            const active = theme === item.value;

            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => update({ theme: item.value })}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative overflow-hidden border p-3 text-left transition-colors ${
                  active
                    ? "border-[#BFC0BA] bg-[#FAFAF8]"
                    : "border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="themeIndicator"
                    className="absolute left-0 top-0 h-full w-[3px] bg-[var(--uav-accent)]"
                    transition={{ duration: 0.25 }}
                  />
                )}

                <ThemePreview value={item.value} />

                <div className="mt-3 flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#171717] sm:text-xs">
                      {item.label}

                      {item.beta && (
                        <span className="border border-[#EEDCC4] bg-[#FDF5EA] px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.08em] text-[#B45309]">
                          Beta
                        </span>
                      )}
                    </p>

                    <p className="mt-0.5 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
                      {item.description}
                    </p>
                  </div>

                  {active && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]">
                      <Check className="h-3.5 w-3.5 text-[#171717]" strokeWidth={2} />
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
      {/* Aksen */}
      <section>
        <div className="mb-3">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Warna Aksen
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Menyorot indikator navigasi, status aktif, dan elemen brand.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACCENT_OPTIONS.map((item) => {
            const active = accent === item.value;

            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => update({ accent: item.value })}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                aria-pressed={active}
                className={`relative border p-3 text-left transition-colors ${
                  active
                    ? "border-[#BFC0BA] bg-[#FAFAF8]"
                    : "border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
                }`}
              >
                <span
                  className="flex h-12 items-center justify-between border px-3 sm:h-14"
                  style={{
                    backgroundColor: item.tint,
                    borderColor: item.border,
                  }}
                >
                  <span
                    className="h-4 w-4 rounded-full sm:h-5 sm:w-5"
                    style={{ backgroundColor: item.accent }}
                  />

                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: item.accent }}
                  >
                    Aa
                  </span>
                </span>

                <span className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#171717] sm:text-xs">
                    {item.label}
                  </span>

                  {active && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]">
                      <Check className="h-3 w-3 text-[#171717]" strokeWidth={2.2} />
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Dimensi */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Dimensi &amp; Gerak
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Ukuran sidebar, skala ikon, dan perilaku animasi.
          </p>
        </div>

        <div className="border border-[#DCDDD8] bg-white">
          <div className="grid gap-x-5 gap-y-5 border-b border-[#DCDDD8] p-4 sm:grid-cols-2 sm:p-5">
            <SelectField<SidebarSizeKey>
              label="Ukuran sidebar"
              description="Lebar navigasi sidebar desktop."
              value={sidebarSize}
              onChange={(value) => update({ sidebarSize: value })}
              options={SIDEBAR_SIZE_OPTIONS}
            />

            <SelectField<IconSizeKey>
              label="Ukuran ikon"
              description="Skala ikon pada menu navigasi."
              value={iconSize}
              onChange={(value) => update({ iconSize: value })}
              options={ICON_SIZE_OPTIONS}
            />
          </div>

          <ToggleRow
            icon={Check}
            label="Animasi antarmuka"
            description="Transisi, hover motion, dan toast dinamis. Matikan untuk gerak minimal."
            checked={animations}
            badge={animations ? "Aktif" : "Nonaktif"}
            onChange={(value) => update({ animations: value })}
          />
        </div>
      </section>
    </div>
  );
}
