"use client";

import { useEffect, useRef } from "react";
import api from "@/lib/api";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";
import { notifyBakingFinished } from "@/lib/notify";

const POLL_INTERVAL_MS = 4000;

export function useMapBakingPoll() {
  const mapId = useBakingStatusStore((s) => s.active?.mapId);
  const updateLayers = useBakingStatusStore((s) => s.updateLayers);
  const clear = useBakingStatusStore((s) => s.clear);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Status transisi untuk notifikasi "selesai" (sekali per mapId). */
  const wasWorkingRef = useRef(false);
  const notifiedMapRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapId) return;

    let cancelled = false;

    wasWorkingRef.current = false;
    notifiedMapRef.current = null;

    const poll = async () => {
      try {
        const response = await api.get(`/maps/${mapId}/layers`);
        if (cancelled) return;

        const layers = (response.data || []).map((layer: any) => ({
          id: layer.id,
          name: layer.name,
          layer_type: layer.layer_type,
          conversion_status: layer.conversion_status,
          conversion_error: layer.conversion_error,
        }));

        updateLayers(layers);

        const stillWorking = layers.some(
          (l: any) =>
            l.conversion_status === "pending" ||
            l.conversion_status === "processing"
        );

        /* Transisi "masih bekerja → selesai" → kirim notifikasi.
           Preferensi notifyBaking / notifyBrowser diterapkan di lib/notify. */
        if (stillWorking) {
          wasWorkingRef.current = true;
        } else if (
          wasWorkingRef.current &&
          notifiedMapRef.current !== mapId &&
          layers.length > 0
        ) {
          notifiedMapRef.current = mapId;

          const completed = layers.filter(
            (l: any) => l.conversion_status === "completed"
          ).length;

          const failed = layers.filter(
            (l: any) => l.conversion_status === "failed"
          ).length;

          const activeBake = useBakingStatusStore.getState().active;

          notifyBakingFinished({
            mapTitle: activeBake?.mapTitle || "Dataset UAV",
            total: layers.length,
            completed,
            failed,
          });
        }

        if (!stillWorking && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch {
        // Map sudah tidak valid / dihapus / error jaringan -> hentikan tracking
        // supaya tidak polling selamanya terhadap resource yang sudah tidak ada.
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        clear();
      }
    };

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mapId, updateLayers, clear]);
}
