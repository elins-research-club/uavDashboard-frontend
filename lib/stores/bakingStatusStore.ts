"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface LayerBakingInfo {
  id: string;
  name: string;
  layer_type: string;
  conversion_status: "pending" | "processing" | "completed" | "failed";
  conversion_error?: string | null;
}

interface ActiveBake {
  mapId: string;
  mapTitle: string;
  startedAt: number;
  layers: LayerBakingInfo[];
  dismissed: boolean;
}

interface BakingStatusState {
  active: ActiveBake | null;
  startTracking: (
    mapId: string,
    mapTitle: string,
    layers: LayerBakingInfo[]
  ) => void;
  updateLayers: (layers: LayerBakingInfo[]) => void;
  dismiss: () => void;
  clear: () => void;
}

export const useBakingStatusStore = create<BakingStatusState>()(
  persist(
    (set) => ({
      active: null,

      startTracking: (mapId, mapTitle, layers) =>
        set({
          active: {
            mapId,
            mapTitle,
            startedAt: Date.now(),
            layers,
            dismissed: false,
          },
        }),

      updateLayers: (layers) =>
        set((state) =>
          state.active ? { active: { ...state.active, layers } } : state
        ),

      dismiss: () =>
        set((state) =>
          state.active
            ? { active: { ...state.active, dismissed: true } }
            : state
        ),

      clear: () => set({ active: null }),
    }),
    {
      name: "amx-upload-baking-status",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
