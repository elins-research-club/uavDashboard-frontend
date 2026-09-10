"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell, Check, ChevronDown, CircleHelp, Globe2, LayoutDashboard,
  LockKeyhole, Palette, Save, Settings2, ShieldCheck, UserRound,
  UsersRound, X,
} from "lucide-react";
import { useUserRole } from "@/context/UserRoleContext";

type SettingsTab = "general" | "preferences" | "notifications" | "account";

const tabs = [
  { key: "general" as const, label: "Umum", icon: Settings2 },
  { key: "preferences" as const, label: "Preferensi", icon: Palette },
  { key: "notifications" as const, label: "Notifikasi", icon: Bell },
  { key: "account" as const, label: "Akun", icon: UserRound },
];

export default function SettingsPage() {
  const { user, logout } = useUserRole();
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");
  const [theme, setTheme] = useState("light");
  const [timezone, setTimezone] = useState("WIB (UTC+07:00)");
  const [language, setLanguage] = useState("Bahasa Indonesia");
  const [sidebarSize, setSidebarSize] = useState("Sedang (255px)");
  const [iconSize, setIconSize] = useState("Sedang (18px)");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem("uav_theme") || "light");
    setTimezone(localStorage.getItem("uav_timezone") || "WIB (UTC+07:00)");
    setLanguage(localStorage.getItem("uav_language") || "Bahasa Indonesia");
    setSidebarSize(localStorage.getItem("uav_sidebar_size") || "Sedang (255px)");
    setIconSize(localStorage.getItem("uav_icon_size") || "Sedang (18px)");
    setNotifications(localStorage.getItem("uav_notifications") !== "false");
  }, []);

  const saveSettings = () => {
    const preferences = { uav_theme: theme, uav_timezone: timezone, uav_language: language, uav_sidebar_size: sidebarSize, uav_icon_size: iconSize, uav_notifications: String(notifications) };
    Object.entries(preferences).forEach(([key, value]) => localStorage.setItem(key, value));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="min-h-full bg-[#f3f6f4] px-4 py-5 text-[#123c28] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1><p className="mt-1 text-sm">Sesuaikan dashboard dengan kebutuhan Anda.</p></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setActiveTab("preferences")} className="inline-flex items-center gap-2 rounded-xl border border-[#123c28]/15 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-[#eef3e8]"><X className="h-4 w-4" />Batal</button>
            <button type="button" onClick={saveSettings} className="inline-flex items-center gap-2 rounded-xl bg-[#277f6d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f6c5d]">{saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saved ? "Tersimpan" : "Simpan"}</button>
          </div>
        </header>

        <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-[#123c28]/10 bg-white shadow-sm lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav className="border-b border-[#123c28]/10 bg-[#fbfcfb] p-3 lg:border-b-0 lg:border-r">
            <div className="space-y-1">{tabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all duration-200 ${activeTab === key ? "bg-[#e5f1ed] text-[#176b5b] shadow-sm" : "text-[#385246] hover:bg-[#eef3e8]"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
            <div className="mt-6 border-t border-[#123c28]/10 pt-5"><Link href="/dashboard/help" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#385246] transition hover:bg-[#eef3e8]"><CircleHelp className="h-4 w-4" />Pusat Bantuan</Link></div>
          </nav>

          <section className="p-5 sm:p-8">
            {activeTab === "preferences" && <PreferencesPanel {...{ theme, setTheme, timezone, setTimezone, language, setLanguage, sidebarSize, setSidebarSize, iconSize, setIconSize }} />}
            {activeTab === "general" && <Panel title="Umum" description="Informasi dasar workspace Anda."><InfoItem icon={<LayoutDashboard />} label="Platform" value="AMX UAV DaaS" /><InfoItem icon={<Globe2 />} label="Wilayah" value="Halmahera Utara, Indonesia" /><InfoItem icon={<ShieldCheck />} label="Status platform" value="Aktif" /></Panel>}
            {activeTab === "notifications" && <Panel title="Notifikasi" description="Atur pemberitahuan aktivitas dashboard."><ToggleRow icon={<Bell />} label="Status upload dan konversi" description="Siapkan notifikasi saat proses dataset selesai." checked={notifications} onChange={setNotifications} /></Panel>}
            {activeTab === "account" && <Panel title="Akun" description="Informasi akun dan keamanan sesi."><InfoItem icon={<UserRound />} label="Nama pengguna" value={user?.username || "Pengguna"} /><InfoItem icon={<UsersRound />} label="Role" value={user?.role || "Member"} /><InfoItem icon={<LockKeyhole />} label="Idle timeout" value="30 menit" /><button type="button" onClick={logout} className="mt-5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50">Keluar dari akun</button></Panel>}
          </section>
        </div>
      </div>
    </main>
  );
}

function PreferencesPanel({ theme, setTheme, timezone, setTimezone, language, setLanguage, sidebarSize, setSidebarSize, iconSize, setIconSize }: any) {
  return <Panel title="Preferensi" description="Sesuaikan tampilan dashboard sesuai preferensi Anda.">
    <h3 className="mb-3 text-sm font-bold">Pilih tema</h3>
    <div className="grid gap-3 md:grid-cols-3">{[{ value: "light", label: "Mode Terang", className: "bg-white" }, { value: "dark", label: "Mode Gelap", className: "bg-[#18211f]" }, { value: "custom", label: "Warna Kustom", className: "bg-[#dce9e5]" }].map((item) => <button key={item.value} type="button" onClick={() => setTheme(item.value)} className={`rounded-2xl border-2 p-2 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${theme === item.value ? "border-[#277f6d]" : "border-[#123c28]/10"}`}><div className={`h-20 rounded-xl ${item.className} p-3 shadow-inner`}><div className="h-2 w-1/2 rounded bg-[#277f6d]/70" /><div className="mt-3 h-7 w-3/4 rounded bg-[#277f6d]/20" /></div><span className="mt-2 flex items-center justify-between px-1 text-sm font-bold">{item.label}{theme === item.value && <Check className="h-4 w-4 text-[#277f6d]" />}</span></button>)}</div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><SelectField label="Zona waktu" value={timezone} onChange={setTimezone} options={["WIB (UTC+07:00)", "WITA (UTC+08:00)", "WIT (UTC+09:00)"]} /><SelectField label="Bahasa" value={language} onChange={setLanguage} options={["Bahasa Indonesia", "English (US)"]} /><SelectField label="Ukuran sidebar" value={sidebarSize} onChange={setSidebarSize} options={["Kecil (220px)", "Sedang (255px)", "Besar (290px)"]} /><SelectField label="Ukuran ikon" value={iconSize} onChange={setIconSize} options={["Kecil (16px)", "Sedang (18px)", "Besar (21px)"]} /></div>
  </Panel>;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="animate-[fade-in_300ms_ease-out]"><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm">{description}</p><div className="mt-7">{children}</div></div>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><span className="relative block"><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-[#123c28]/15 bg-white px-3.5 py-3 pr-10 text-sm font-medium outline-none transition focus:border-[#277f6d]">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" /></span></label>; }
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 border-b border-[#123c28]/10 py-4 last:border-0"><span className="text-[#277f6d]">{icon}</span><span className="flex-1 text-sm">{label}</span><span className="text-sm font-bold capitalize">{value}</span></div>; }
function ToggleRow({ icon, label, description, checked, onChange }: { icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#123c28]/10 p-4 transition hover:bg-[#f7f8f5]"><span className="flex items-start gap-3"><span className="mt-0.5 text-[#277f6d]">{icon}</span><span><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-sm">{description}</span></span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#277f6d]" /></label>; }
