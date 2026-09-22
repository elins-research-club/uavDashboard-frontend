"use client";

import Link from "next/link";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useUserRole } from "@/context/UserRoleContext";

type SettingsTab = "general" | "preferences" | "notifications" | "account";

type Theme = "light" | "dark" | "custom";

interface SettingsTabItem {
  key: SettingsTab;
  label: string;
  description: string;
  icon: LucideIcon;
}

const ICON_STROKE = 1.75;

const EASE = [0.22, 1, 0.36, 1] as const;

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

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: EASE,
    },
  },
};

const panelTransition = {
  duration: 0.28,
  ease: EASE,
};

/* ============================================================
   SMALL UI
============================================================ */

function AnimatedIcon({
  icon: Icon,
  active = false,
}: {
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <motion.span
      animate={{
        rotate: active ? 0 : 0,
        scale: active ? 1.02 : 1,
      }}
      whileHover={{
        rotate: -5,
        scale: 1.08,
      }}
      transition={{
        duration: 0.22,
        ease: EASE,
      }}
      className="inline-flex"
    >
      <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
    </motion.span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <motion.div
        whileHover={{
          y: -2,
          rotate: -3,
        }}
        transition={{
          duration: 0.22,
          ease: EASE,
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2] sm:h-10 sm:w-10"
      >
        <AnimatedIcon icon={Icon} />
      </motion.div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780] sm:text-[10px] sm:tracking-[0.15em]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-[15px] font-bold tracking-[-0.02em] text-[#171717] sm:text-base">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-[11px] font-medium leading-[1.55] text-[#6B6B66] sm:text-xs sm:leading-5">
          {description}
        </p>
      </div>
    </div>
  );
}

function WireframeDecoration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 340 160"
      className="pointer-events-none absolute right-0 top-0 h-full w-[250px] opacity-35 sm:w-[360px] sm:opacity-45"
    >
      <g
        fill="none"
        stroke="rgba(23,23,23,0.08)"
        strokeWidth="1"
        strokeLinecap="square"
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <path key={`h-${index}`} d={`M55 ${22 + index * 20}H320`} />
        ))}

        {Array.from({ length: 10 }).map((_, index) => (
          <path key={`v-${index}`} d={`M70 ${16}V146`} />
        ))}

        <path d="M135 44L196 25L272 48L210 69Z" />
        <path d="M135 44L135 95L210 120L210 69Z" />
        <path d="M210 69L272 48L272 96L210 120Z" />
      </g>
    </svg>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function SettingsPage() {
  const router = useRouter();

  const { user, logout } = useUserRole();

  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");

  const [theme, setTheme] = useState<Theme>("light");
  const [timezone, setTimezone] = useState("WIB (UTC+07:00)");
  const [language, setLanguage] = useState("Bahasa Indonesia");
  const [sidebarSize, setSidebarSize] = useState("Sedang (255px)");
  const [iconSize, setIconSize] = useState("Sedang (18px)");
  const [notifications, setNotifications] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme((localStorage.getItem("uav_theme") as Theme) || "light");

    setTimezone(localStorage.getItem("uav_timezone") || "WIB (UTC+07:00)");

    setLanguage(localStorage.getItem("uav_language") || "Bahasa Indonesia");

    setSidebarSize(
      localStorage.getItem("uav_sidebar_size") || "Sedang (255px)"
    );

    setIconSize(localStorage.getItem("uav_icon_size") || "Sedang (18px)");

    setNotifications(localStorage.getItem("uav_notifications") !== "false");
  }, []);

  const saveSettings = () => {
    const preferences = {
      uav_theme: theme,
      uav_timezone: timezone,
      uav_language: language,
      uav_sidebar_size: sidebarSize,
      uav_icon_size: iconSize,
      uav_notifications: String(notifications),
    };

    Object.entries(preferences).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  const resetSettings = () => {
    setTheme("light");
    setTimezone("WIB (UTC+07:00)");
    setLanguage("Bahasa Indonesia");
    setSidebarSize("Sedang (255px)");
    setIconSize("Sedang (18px)");
    setNotifications(true);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];

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
              <motion.button
                type="button"
                onClick={resetSettings}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex flex-1 items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#6B6B66] transition-colors hover:bg-[#F4F5F2] hover:text-[#171717] sm:flex-none sm:px-4 sm:text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Reset
              </motion.button>

              <motion.button
                type="button"
                onClick={saveSettings}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[#171717] px-3.5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-[#2A2A2A] sm:flex-none sm:px-4 sm:text-xs"
              >
                <motion.span
                  animate={
                    saved
                      ? {
                          scale: [1, 1.15, 1],
                          rotate: [0, -8, 0],
                        }
                      : {
                          scale: 1,
                          rotate: 0,
                        }
                  }
                  transition={{
                    duration: 0.35,
                    ease: EASE,
                  }}
                >
                  {saved ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Save className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </motion.span>

                {saved ? "Tersimpan" : "Simpan"}
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
                      whileHover={{
                        x: 2,
                      }}
                      whileTap={{
                        scale: 0.99,
                      }}
                      className={`group relative flex w-full min-w-0 items-center gap-2.5 border px-2.5 py-2.5 text-left transition-colors sm:gap-3 sm:px-3.5 sm:py-3 ${
                        active
                          ? "border-[#CFCFC8] bg-white"
                          : "border-transparent hover:border-[#DCDDD8] hover:bg-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="settingsActiveIndicator"
                          className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#76B900]"
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
                  {activeTab === "preferences" && (
                    <PreferencesPanel
                      theme={theme}
                      setTheme={setTheme}
                      timezone={timezone}
                      setTimezone={setTimezone}
                      language={language}
                      setLanguage={setLanguage}
                      sidebarSize={sidebarSize}
                      setSidebarSize={setSidebarSize}
                      iconSize={iconSize}
                      setIconSize={setIconSize}
                    />
                  )}

                  {activeTab === "general" && <GeneralPanel />}

                  {activeTab === "notifications" && (
                    <NotificationsPanel
                      notifications={notifications}
                      setNotifications={setNotifications}
                    />
                  )}

                  {activeTab === "account" && (
                    <AccountPanel
                      username={user?.username || "Pengguna"}
                      role={user?.role || "Member"}
                      onLogout={handleLogout}
                    />
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

/* ============================================================
   PREFERENCES
============================================================ */

function PreferencesPanel({
  theme,
  setTheme,
  timezone,
  setTimezone,
  language,
  setLanguage,
  sidebarSize,
  setSidebarSize,
  iconSize,
  setIconSize,
}: {
  theme: Theme;
  setTheme: (value: Theme) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  language: string;
  setLanguage: (value: string) => void;
  sidebarSize: string;
  setSidebarSize: (value: string) => void;
  iconSize: string;
  setIconSize: (value: string) => void;
}) {
  const themeOptions: {
    value: Theme;
    label: string;
    description: string;
  }[] = [
    {
      value: "light",
      label: "Terang",
      description: "Tampilan default",
    },
    {
      value: "dark",
      label: "Gelap",
      description: "Kontras tinggi",
    },
    {
      value: "custom",
      label: "Kustom",
      description: "Mode eksperimental",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Appearance"
        title="Preferensi Tampilan"
        description=""
        icon={Palette}
      />

      {/* Theme */}
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
            {themeOptions.find((item) => item.value === theme)?.label ||
              "Terang"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((item) => {
            const active = theme === item.value;

            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => setTheme(item.value)}
                whileHover={{
                  y: -3,
                }}
                whileTap={{
                  scale: 0.99,
                }}
                className={`group relative overflow-hidden border p-3 text-left transition-colors ${
                  active
                    ? "border-[#BFC0BA] bg-[#FAFAF8]"
                    : "border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="themeIndicator"
                    className="absolute left-0 top-0 h-full w-[3px] bg-[#76B900]"
                    transition={{
                      duration: 0.25,
                      ease: EASE,
                    }}
                  />
                )}

                <div
                  className={`relative h-24 overflow-hidden border sm:h-28 ${
                    item.value === "light"
                      ? "border-[#DCDDD8] bg-[#F8F9F6]"
                      : item.value === "dark"
                      ? "border-[#3B403D] bg-[#171917]"
                      : "border-[#D3DAD5] bg-[#E7ECE8]"
                  }`}
                >
                  {/* Mini sidebar */}
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-[24%] border-r ${
                      item.value === "dark"
                        ? "border-white/10 bg-[#111311]"
                        : "border-black/5 bg-white"
                    }`}
                  />

                  {/* Mini top bar */}
                  <div
                    className={`absolute left-[28%] right-3 top-3 h-2 ${
                      item.value === "dark" ? "bg-white/15" : "bg-[#171717]/10"
                    }`}
                  />

                  {/* Mini cards */}
                  <div className="absolute left-[28%] right-3 top-10 grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div
                      className={`h-9 border sm:h-10 ${
                        item.value === "dark"
                          ? "border-white/10 bg-white/5"
                          : "border-black/5 bg-white"
                      }`}
                    >
                      <div className="m-1.5 h-1.5 w-1/2 bg-[#171717]/15 sm:m-2" />
                      <div className="m-1.5 h-2.5 w-2/3 bg-[#76B900]/30 sm:m-2" />
                    </div>

                    <div
                      className={`h-9 border sm:h-10 ${
                        item.value === "dark"
                          ? "border-white/10 bg-white/5"
                          : "border-black/5 bg-white"
                      }`}
                    >
                      <div className="m-1.5 h-1.5 w-1/2 bg-[#171717]/15 sm:m-2" />
                      <div className="m-1.5 h-2.5 w-2/3 bg-[#171717]/10 sm:m-2" />
                    </div>
                  </div>

                  {/* Theme marker */}
                  <motion.div
                    animate={
                      active
                        ? {
                            scale: [1, 1.12, 1],
                          }
                        : {
                            scale: 1,
                          }
                    }
                    transition={{
                      duration: 1.8,
                      repeat: active ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                    className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 bg-[#76B900] sm:bottom-3 sm:right-3"
                  />
                </div>

                <div className="mt-3 flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#171717] sm:text-xs">
                      {item.label}
                    </p>

                    <p className="mt-0.5 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
                      {item.description}
                    </p>
                  </div>

                  {active && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.5,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]"
                    >
                      <Check
                        className="h-3.5 w-3.5 text-[#171717]"
                        strokeWidth={2}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Workspace defaults */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Workspace
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Konfigurasi regional dan dimensi antarmuka.
          </p>
        </div>

        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <SelectField
            label="Zona waktu"
            description="Digunakan untuk aktivitas dan timestamp."
            value={timezone}
            onChange={setTimezone}
            options={["WIB (UTC+07:00)", "WITA (UTC+08:00)", "WIT (UTC+09:00)"]}
          />

          <SelectField
            label="Bahasa"
            description="Bahasa interface workspace."
            value={language}
            onChange={setLanguage}
            options={["Bahasa Indonesia", "English (US)"]}
          />

          <SelectField
            label="Ukuran sidebar"
            description="Lebar navigation sidebar."
            value={sidebarSize}
            onChange={setSidebarSize}
            options={["Kecil (220px)", "Sedang (255px)", "Besar (290px)"]}
          />

          <SelectField
            label="Ukuran ikon"
            description="Skala icon pada interface."
            value={iconSize}
            onChange={setIconSize}
            options={["Kecil (16px)", "Sedang (18px)", "Besar (21px)"]}
          />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   GENERAL
============================================================ */

function GeneralPanel() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Workspace"
        title="Umum"
        description="Informasi dasar mengenai environment yang sedang digunakan."
        icon={Settings2}
      />

      <div className="border border-[#DCDDD8]">
        <InfoItem
          icon={LayoutDashboard}
          label="Platform"
          value="AMX UAV DaaS"
        />

        <InfoItem icon={Globe2} label="Wilayah" value="Halmahera Utara" />

        <InfoItem icon={ShieldCheck} label="Status" value="Aktif" accent />
      </div>

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

/* ============================================================
   NOTIFICATIONS
============================================================ */

function NotificationsPanel({
  notifications,
  setNotifications,
}: {
  notifications: boolean;
  setNotifications: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Notifications"
        title="Notifikasi"
        description="Atur pemberitahuan yang dikirim selama proses berjalan."
        icon={Bell}
      />

      <div className="border border-[#DCDDD8] bg-white">
        <ToggleRow
          icon={Bell}
          label="Status proses"
          description="Upload, preprocessing, conversion, dan proses dataset lainnya."
          checked={notifications}
          onChange={setNotifications}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <InfoBlock
          label="Delivery"
          value="In-App"
          description="Notifikasi ditampilkan langsung pada dashboard."
        />

        <InfoBlock
          label="Push"
          value="Segera hadir"
          description="Push notification belum diaktifkan."
        />
      </div>
    </div>
  );
}

/* ============================================================
   ACCOUNT
============================================================ */

function AccountPanel({
  username,
  role,
  onLogout,
}: {
  username: string;
  role: string;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Identity"
        title="Akun"
        description="Informasi identitas, role, dan kontrol sesi akun Anda."
        icon={UserRound}
      />

      <div className="border border-[#DCDDD8] bg-white">
        <InfoItem icon={UserRound} label="Nama" value={username} />

        <InfoItem icon={UsersRound} label="Role" value={role} />

        <InfoItem icon={LockKeyhole} label="Idle timeout" value="30 menit" />
      </div>

      <div className="border border-[#DCDDD8] bg-[#F8F9F6] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#171717] sm:text-sm">
              Akhiri sesi
            </p>

            <p className="mt-1 max-w-xl text-[11px] font-medium leading-[1.65] text-[#6B6B66] sm:text-xs sm:leading-5">
              Keluar dari workspace pada perangkat ini.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onLogout}
            whileHover={{
              x: 2,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className="inline-flex w-full items-center justify-center gap-2 border border-red-200 bg-white px-4 py-2.5 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-50 sm:w-fit sm:text-xs"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            Log Out
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LINK ITEM
============================================================ */

function LinkItem({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{
          x: 2,
        }}
        className="group flex min-w-0 items-center gap-3 border border-transparent px-2.5 py-3 transition-colors hover:border-[#DCDDD8] hover:bg-white sm:px-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E3E3DE] bg-white">
          <Icon
            className="h-4 w-4 text-[#858780] group-hover:text-[#171717]"
            strokeWidth={ICON_STROKE}
          />
        </span>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-[#33332F] sm:text-xs">
            {label}
          </p>

          <p className="mt-0.5 truncate text-[9px] font-medium text-[#858780] sm:text-[10px]">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

/* ============================================================
   SELECT FIELD
============================================================ */

function SelectField({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#171717] sm:text-xs">
        {label}
      </span>

      <span className="mb-2 block text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
        {description}
      </span>

      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none border border-[#DCDDD8] bg-[#FAFAF8] px-3 pr-10 text-[11px] font-semibold text-[#33332F] outline-none transition-colors focus:border-[#9A9B95] focus:bg-white sm:h-11 sm:px-3.5 sm:text-xs"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858780]"
          strokeWidth={ICON_STROKE}
        />
      </span>
    </label>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        x: 2,
      }}
      className="group flex min-w-0 items-center gap-3 border-b border-[#DCDDD8] px-3.5 py-3.5 last:border-b-0 sm:gap-4 sm:px-5 sm:py-4"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F8F9F6] sm:h-9 sm:w-9">
        <Icon
          className={`h-4 w-4 ${accent ? "text-[#76B900]" : "text-[#6B6B66]"}`}
          strokeWidth={ICON_STROKE}
        />
      </span>

      <span className="min-w-0 flex-1 text-[11px] font-medium text-[#6B6B66] sm:text-xs">
        {label}
      </span>

      <span className="max-w-[55%] text-right text-[11px] font-bold capitalize text-[#171717] sm:text-xs">
        {value}
      </span>
    </motion.div>
  );
}

/* ============================================================
   INFO BLOCK
============================================================ */

function InfoBlock({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="border border-[#DCDDD8] bg-[#FAFAF8] p-4 sm:p-5"
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#858780] sm:text-[9px] sm:tracking-[0.14em]">
        {label}
      </p>

      <p className="mt-2 text-[13px] font-bold text-[#171717] sm:text-sm">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
        {description}
      </p>
    </motion.div>
  );
}

/* ============================================================
   TOGGLE ROW
============================================================ */

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center justify-between gap-3 p-4 transition-colors hover:bg-[#FAFAF8] sm:gap-5 sm:p-5">
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F8F9F6] sm:h-9 sm:w-9">
          <Icon className="h-4 w-4 text-[#6B6B66]" strokeWidth={ICON_STROKE} />
        </span>

        <span className="min-w-0">
          <span className="block text-[11px] font-bold text-[#171717] sm:text-xs">
            {label}
          </span>

          <span className="mt-1 block max-w-xl text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
            {description}
          </span>
        </span>
      </span>

      <span className="relative flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span className="absolute inset-0 border border-[#C7C8C2] bg-[#F4F5F2] transition-colors peer-checked:border-[#171717] peer-checked:bg-[#171717]" />

        <motion.span
          animate={{
            x: checked ? 20 : 2,
          }}
          transition={{
            duration: 0.22,
            ease: EASE,
          }}
          className="relative z-10 h-5 w-5 bg-white shadow-sm"
        />
      </span>
    </label>
  );
}
