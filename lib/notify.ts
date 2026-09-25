"use client";

/* ============================================================
   NOTIFICATION HELPERS

   Dua kanal nyata:
   1. In-app toast  → CustomEvent `amx:toast` yang dirender oleh
      <AppToastHost /> (dipasang di DashboardLayout).
   2. Desktop       → Web Notification API, hanya bila user
      mengizinkan DAN preferensi `notifyBrowser` menyala.
============================================================ */

import { getSettingsSnapshot } from "@/lib/stores/settingsStore";

export const TOAST_EVENT = "amx:toast";

export type ToastTone = "info" | "success" | "error";

export interface ToastDetail {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

export function dispatchToast(detail: ToastDetail): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, { detail })
  );

  return true;
}

export function subscribeToast(
  handler: (detail: ToastDetail) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ToastDetail>).detail;

    if (detail?.message) {
      handler(detail);
    }
  };

  window.addEventListener(TOAST_EVENT, listener);

  return () => window.removeEventListener(TOAST_EVENT, listener);
}

/* ============================================================
   WEB NOTIFICATION API
============================================================ */

export type PermissionState = NotificationPermission | "unsupported";

export function browserNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.Notification === "function"
  );
}

export function getBrowserPermission(): PermissionState {
  if (!browserNotificationSupported()) {
    return "unsupported";
  }

  try {
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

export async function requestBrowserPermission(): Promise<PermissionState> {
  if (!browserNotificationSupported()) {
    return "unsupported";
  }

  try {
    const result = await Notification.requestPermission();

    return result;
  } catch {
    return getBrowserPermission();
  }
}

/**
 * Kirim desktop notification bila diizinkan & preferensi menyala.
 * Return false bila tidak terkirim (mis. belum ada izin).
 */
export function showDesktopNotification(
  title: string,
  body: string
): boolean {
  const settings = getSettingsSnapshot();

  if (!settings.notifyBrowser) {
    return false;
  }

  if (getBrowserPermission() !== "granted") {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag: "amx-baking",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   DOMAIN NOTIFICATIONS
============================================================ */

export interface BakingNotificationPayload {
  mapTitle: string;
  total: number;
  completed: number;
  failed: number;
}

/**
 * Dipanggil saat seluruh layer selesai/gagal dikompilasi.
 * In-app toast mengikuti `notifyBaking`; desktop mengikuti
 * `notifyBrowser` + izin browser.
 */
export function notifyBakingFinished({
  mapTitle,
  total,
  completed,
  failed,
}: BakingNotificationPayload) {
  const settings = getSettingsSnapshot();

  const allFailed = total > 0 && failed === total;

  const title = allFailed ? "Konversi PMTiles gagal" : "Kompilasi PMTiles selesai";

  const body = allFailed
    ? `${failed}/${total} layer gagal · ${mapTitle}`
    : failed > 0
    ? `${completed}/${total} layer siap · ${failed} gagal · ${mapTitle}`
    : `${completed}/${total} layer siap ditampilkan · ${mapTitle}`;

  if (settings.notifyBaking) {
    dispatchToast({
      title,
      message: body,
      tone: allFailed ? "error" : failed > 0 ? "info" : "success",
    });
  }

  showDesktopNotification(title, body);
}

export function notifySubscriptionReminder(daysLeft: number, tier: string) {
  const settings = getSettingsSnapshot();

  if (!settings.notifySubscription) {
    return;
  }

  dispatchToast({
    title: "Langganan hampir berakhir",
    message: `Paket ${tier} berakhir dalam ${daysLeft} hari. Perpanjang di halaman Langganan.`,
    tone: "info",
    durationMs: 9000,
  });
}
