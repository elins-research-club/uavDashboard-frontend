"use client";

/* ============================================================
   HALAMAN PENGATURAN (/dashboard/settings)

   Shell: judul, rail tab (Umum / Preferensi / Notifikasi /
   Akun), dan panel aktif. Preferensi disimpan otomatis oleh
   zustand (`amx-user-settings`) — tombol Reset mengembalikan
   seluruh preferensi ke default.
============================================================ */

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CircleHelp,
  Palette,
  RotateCcw,
  Settings2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { useUserRole } from "@/context/UserRoleContext";
import { dispatchToast } from "@/lib/notify";
import { useSettingsStore } from "@/lib/stores/settingsStore";

import {
  EASE,
  ICON_STROKE,
  LinkItem,
  WireframeDecoration,
  fadeUp,
} from "./settings-ui";
import { AccountPanel } from "./account-panel";
import { GeneralPanel } from "./general-panel";
import { NotificationsPanel } from "./notifications-panel";
import { PreferencesPanel } from "./preferences-panel";

type SettingsTab = "general" | "preferences" | "notifications" | "account";

interface SettingsTabItem {
  key: SettingsTab;
  label: string;
  description: string;
  icon: LucideIcon;
}

const panelTransition = {
  duration: 0.28,
  ease: EASE,
};

const tabs: SettingsTabItem[] = [
  {
    key: "general",
    label: "Umum",
    description: "Workspace",
    icon: Settings2,
  },
  {
    key: "preferences",
    label: "Preferensi",
    description: "Tampilan",
    icon: Palette,
  },
  {
    key: "notifications",
    label: "Notifikasi",
    description: "Pemberitahuan",
    icon: Bell,
  },
  {
    key: "account",
    label: "Akun",
    description: "Profil & sesi",
    icon: UserRound,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const { logout } = useUserRole();

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const reset = useSettingsStore((state) => state.reset);

  const handleReset = () => {
    reset();

    dispatchToast({
      title: "Pengaturan direset",
      message: "Seluruh preferensi kembali ke pengaturan default.",
      tone: "info",
    });
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <main className="min-h-full bg-[#F4F5F2] text-[#171717]">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}

        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative mb-5 overflow-hidden sm:mb-7"
        >
          <WireframeDecoration />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.05em] text-[#171717] sm:text-4xl">
                Pengaturan
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] font-medium leading-[1.65] text-[#6B6B66] sm:text-xs sm:leading-5">
                Kelola preferensi tampilan, workspace, notifikasi, dan akses
                akun.
              </p>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <span className="inline-flex flex-1 items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#5F8F13] sm:flex-none sm:px-4 sm:text-xs">
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                Tersimpan otomatis
              </span>

              <motion.button
                type="button"
                onClick={handleReset}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex flex-1 items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#6B6B66] transition-colors hover:bg-[#F4F5F2] hover:text-[#171717] sm:flex-none sm:px-4 sm:text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Reset
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* ==================================================
            SETTINGS WORKSPACE
        =================================================== */}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{
            delay: 0.05,
          }}
          className="grid min-h-0 border border-[#DCDDD8] bg-white lg:min-h-[650px] lg:grid-cols-[230px_minmax(0,1fr)]"
        >
          {/* ==================================================
              NAVIGATION RAIL
          =================================================== */}

          <nav className="border-b border-[#DCDDD8] bg-[#F8F9F6] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#DCDDD8] px-4 py-3.5 sm:px-5 sm:py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780] sm:text-[10px] sm:tracking-[0.15em]">
                Settings Configuration
              </p>
            </div>

            <div className="p-2.5 sm:p-3">
              <div className="grid grid-cols-2 gap-1 lg:block lg:space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;

                  return (
                    <motion.button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className={`group relative flex w-full min-w-0 items-center gap-2.5 border px-2.5 py-2.5 text-left transition-colors sm:gap-3 sm:px-3.5 sm:py-3 ${
                        active
                          ? "border-[#CFCFC8] bg-white"
                          : "border-transparent hover:border-[#DCDDD8] hover:bg-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="settingsActiveIndicator"
                          className="uav-bg-accent absolute bottom-0 left-0 top-0 w-[3px]"
                          transition={{
                            duration: 0.28,
                            ease: EASE,
                          }}
                        />
                      )}

                      <motion.span
                        animate={{
                          scale: active ? 1 : 0.96,
                        }}
                        whileHover={{
                          rotate: -5,
                          scale: 1.06,
                        }}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                          active
                            ? "border-[#DCDDD8] bg-[#F4F5F2]"
                            : "border-[#E3E3DE] bg-white"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            active ? "text-[#171717]" : "text-[#858780]"
                          }`}
                          strokeWidth={ICON_STROKE}
                        />
                      </motion.span>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-[11px] font-bold sm:text-xs ${
                            active ? "text-[#171717]" : "text-[#33332F]"
                          }`}
                        >
                          {tab.label}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] font-medium text-[#858780] sm:text-[10px]">
                          {tab.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#DCDDD8] px-2.5 py-3 sm:px-3 sm:py-4">
              <LinkItem
                href="/dashboard/help"
                icon={CircleHelp}
                label="Pusat Bantuan"
                description="Bantuan & dokumentasi"
              />
            </div>
          </nav>

          {/* ==================================================
              CONTENT
          =================================================== */}

          <section className="min-w-0">
            <div className="p-4 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -6,
                  }}
                  transition={panelTransition}
                >
                  {activeTab === "general" && <GeneralPanel />}

                  {activeTab === "preferences" && <PreferencesPanel />}

                  {activeTab === "notifications" && <NotificationsPanel />}

                  {activeTab === "account" && (
                    <AccountPanel onLogout={handleLogout} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}