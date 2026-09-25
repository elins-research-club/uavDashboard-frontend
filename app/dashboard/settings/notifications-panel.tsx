"use client";

/* ============================================================
   PANEL — NOTIFIKASI

   Empat saluran preferensi + kontrol izin browser sungguhan
   (Web Notification API) + uji kirim toast/desktop.
============================================================ */

import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Clock3,
  Flame,
  Info,
  Monitor,
  Send,
  UploadCloud,
} from "lucide-react";

import {
  SUBSCRIPTION_LEAD_OPTIONS,
  type SubscriptionLeadDays,
} from "@/lib/settings-options";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import {
  browserNotificationSupported,
  dispatchToast,
  getBrowserPermission,
  requestBrowserPermission,
  showDesktopNotification,
  type PermissionState,
} from "@/lib/notify";

import {
  InfoBlock,
  SectionHeader,
  SelectField,
  ToggleRow,
} from "./settings-ui";

const PERMISSION_LABEL: Record<PermissionState, string> = {
  granted: "Diizinkan",
  denied: "Diblokir browser",
  default: "Belum diminta",
  unsupported: "Tidak didukung",
};

export function NotificationsPanel() {
  const notifyBaking = useSettingsStore((state) => state.notifyBaking);
  const notifyUpload = useSettingsStore((state) => state.notifyUpload);
  const notifySubscription = useSettingsStore(
    (state) => state.notifySubscription
  );
  const notifyBrowser = useSettingsStore((state) => state.notifyBrowser);
  const subscriptionLeadDays = useSettingsStore(
    (state) => state.subscriptionLeadDays
  );
  const update = useSettingsStore((state) => state.update);

  const [permission, setPermission] = useState<PermissionState>("default");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setPermission(getBrowserPermission());
  }, []);

  const handleRequestPermission = async () => {
    setRequesting(true);

    try {
      const result = await requestBrowserPermission();

      setPermission(result);

      if (result === "granted") {
        dispatchToast({
          title: "Notifikasi browser aktif",
          message: "Pemberitahuan desktop kini dapat dikirim ke perangkat ini.",
          tone: "success",
        });
      } else if (result === "denied") {
        dispatchToast({
          title: "Izin notifikasi ditolak",
          message:
            "Izinkan notifikasi lewat ikon gembok di bilah alamat browser Anda.",
          tone: "error",
        });
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleSendTest = () => {
    dispatchToast({
      title: "Notifikasi uji",
      message: "In-app toast berhasil dikirim dari halaman Pengaturan.",
      tone: "success",
    });

    const sent = showDesktopNotification(
      "Uji notifikasi UAV DaaS",
      "Desktop notification berhasil dikirim. Preferensi Anda berlaku di sini."
    );

    if (!sent && permission !== "granted") {
      dispatchToast({
        title: "Desktop belum aktif",
        message:
          "Berikan izin notifikasi browser agar pemberitahuan desktop terkirim.",
        tone: "info",
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Notifications"
        title="Notifikasi"
        description="Atur pemberitahuan in-app dan desktop untuk proses yang berjalan di latar belakang."
        icon={Bell}
      />

      {/* Saluran */}
      <div className="border border-[#DCDDD8] bg-white">
        <ToggleRow
          icon={Flame}
          label="Kompilasi PMTiles"
          description="Berakhirnya proses konversi layer menjadi PMTiles (sukses/gagal)."
          checked={notifyBaking}
          onChange={(value) => update({ notifyBaking: value })}
        />

        <div className="border-t border-[#DCDDD8]" />

        <ToggleRow
          icon={UploadCloud}
          label="Upload dataset"
          description="Konfirmasi dataset diterima dan mulai diproses di background."
          checked={notifyUpload}
          onChange={(value) => update({ notifyUpload: value })}
        />

        <div className="border-t border-[#DCDDD8]" />

        <ToggleRow
          icon={Clock3}
          label="Pengingat langganan"
          description="Peringatan saat paket langganan mendekati tanggal berakhir."
          checked={notifySubscription}
          onChange={(value) => update({ notifySubscription: value })}
        />

        <div className="border-t border-[#DCDDD8]" />

        <ToggleRow
          icon={Monitor}
          label="Notifikasi browser"
          description="Kirim juga sebagai desktop notification (memerlukan izin browser)."
          checked={notifyBrowser}
          onChange={(value) => update({ notifyBrowser: value })}
          badge={PERMISSION_LABEL[permission]}
        />
      </div>
      {/* Izin browser + uji kirim */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Izin &amp; Uji Kirim
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Kontrol izin Web Notification API pada browser perangkat ini.
          </p>
        </div>

        <div className="border border-[#DCDDD8] bg-[#F8F9F6] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13px] font-bold text-[#171717] sm:text-sm">
                <BellRing className="h-4 w-4" strokeWidth={1.9} />
                Status izin: {PERMISSION_LABEL[permission]}
              </p>

              <p className="mt-1 max-w-xl text-[11px] font-medium leading-[1.65] text-[#6B6B66] sm:text-xs sm:leading-5">
                {browserNotificationSupported()
                  ? "Browser memperbolehkan pemberitahuan desktop setelah Anda menekan Izinkan."
                  : "Browser ini tidak mendukung Web Notification API."}
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={
                  requesting ||
                  permission === "granted" ||
                  permission === "unsupported"
                }
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:text-xs"
              >
                {permission === "granted" ? "Izin diberikan" : "Izinkan"}
              </button>

              <button
                type="button"
                onClick={handleSendTest}
                className="inline-flex flex-1 items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-4 py-2.5 text-[11px] font-bold text-[#33332F] transition-colors hover:bg-[#F4F5F2] sm:flex-none sm:text-xs"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2} />
                Kirim uji
              </button>
            </div>
          </div>

          {permission === "denied" && (
            <p className="mt-3 flex items-start gap-2 border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[10px] font-medium leading-4 text-[#B91C1C]">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Izin diblokir. Buka pengaturan situs (ikon gembok) lalu ubah
              Notifikasi menjadi “Allow”.
            </p>
          )}
        </div>
      </section>

      {/* Pengingat langganan */}
      <section>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <SelectField<SubscriptionLeadDays>
            label="Ingatkan sebelum berakhir"
            description="Berapa hari sebelum tanggal berakhir paket pengingat dikirim."
            value={subscriptionLeadDays}
            onChange={(value) => update({ subscriptionLeadDays: value })}
            options={SUBSCRIPTION_LEAD_OPTIONS}
          />

          <div className="border border-[#DCDDD8] bg-[#FAFAF8] p-4 sm:p-5">
            <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#858780] sm:text-[9px]">
              Saluran
            </p>

            <p className="mt-2 text-[13px] font-bold text-[#171717] sm:text-sm">
              In-App {notifyBrowser ? "+ Desktop" : "saja"}
            </p>

            <p className="mt-1 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
              Notifikasi dikirim ketika aplikasi terbuka di tab ini.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <InfoBlock
          label="Delivery"
          value="In-App"
          description="Toast muncul di kanan bawah seluruh halaman dashboard."
        />

        <InfoBlock
          label="Push"
          value={permission === "granted" ? "Desktop aktif" : "Perlu izin"}
          description="Desktop notification mengikuti izin browser perangkat."
        />
      </div>
    </div>
  );
}
