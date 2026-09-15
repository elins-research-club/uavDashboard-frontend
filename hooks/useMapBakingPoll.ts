"use client";

import { useEffect, useRef } from "react";
import api from "@/lib/api";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";

const POLL_INTERVAL_MS = 4000;

export function useMapBakingPoll() {
  const mapId = useBakingStatusStore((s) => s.active?.mapId);
  const updateLayers = useBakingStatusStore((s) => s.updateLayers);
  const clear = useBakingStatusStore((s) => s.clear);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!mapId) return;

    let cancelled = false;

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
