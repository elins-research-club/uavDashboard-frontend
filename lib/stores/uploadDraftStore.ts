"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BatchFileItem,
  ManualSlotItem,
} from "@/app/dashboard/upload/upload-config";

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === "function"
    ? (updater as (p: T) => T)(prev)
    : updater;
}

const todayISO = () => new Date().toISOString().split("T")[0];

interface UploadDraftState {
  uploadMode: "batch" | "manual";
  title: string;
  location: string;
  surveyDate: string;
  description: string;
  lockedForFree: boolean;
  purchasable: boolean;

  batchFiles: BatchFileItem[]; // TIDAK dipersist (butuh File asli, lihat catatan bawah)
  manualSlots: ManualSlotItem[]; // dipersist tanpa `file`

  expandedBatchItems: Set<string>;

  editingFiles: boolean;
  editingDetails: boolean;
  filesConfirmed: boolean;
  detailsConfirmed: boolean;

  setUploadMode: (u: Updater<UploadDraftState["uploadMode"]>) => void;
  setTitle: (u: Updater<string>) => void;
  setLocation: (u: Updater<string>) => void;
  setSurveyDate: (u: Updater<string>) => void;
  setDescription: (u: Updater<string>) => void;
  setLockedForFree: (u: Updater<boolean>) => void;
  setPurchasable: (u: Updater<boolean>) => void;
  setBatchFiles: (u: Updater<BatchFileItem[]>) => void;
  setManualSlots: (u: Updater<ManualSlotItem[]>) => void;
  setExpandedBatchItems: (u: Updater<Set<string>>) => void;
  setEditingFiles: (u: Updater<boolean>) => void;
  setEditingDetails: (u: Updater<boolean>) => void;
  setFilesConfirmed: (u: Updater<boolean>) => void;
  setDetailsConfirmed: (u: Updater<boolean>) => void;

  resetDraft: () => void;
}

const initial = {
  uploadMode: "batch" as const,
  title: "",
  location: "",
  surveyDate: todayISO(),
  description: "",
  lockedForFree: false,
  purchasable: false,
  batchFiles: [] as BatchFileItem[],
  manualSlots: [] as ManualSlotItem[],
  expandedBatchItems: new Set<string>(),
  editingFiles: true,
  editingDetails: true,
  filesConfirmed: false,
  detailsConfirmed: false,
};

export const useUploadDraftStore = create<UploadDraftState>()(
  persist(
    (set, get) => ({
      ...initial,

      setUploadMode: (u) => set({ uploadMode: resolve(u, get().uploadMode) }),
      setTitle: (u) => set({ title: resolve(u, get().title) }),
      setLocation: (u) => set({ location: resolve(u, get().location) }),
      setSurveyDate: (u) => set({ surveyDate: resolve(u, get().surveyDate) }),
      setDescription: (u) =>
        set({ description: resolve(u, get().description) }),
      setLockedForFree: (u) =>
        set({ lockedForFree: resolve(u, get().lockedForFree) }),
      setPurchasable: (u) =>
        set({ purchasable: resolve(u, get().purchasable) }),
      setBatchFiles: (u) => set({ batchFiles: resolve(u, get().batchFiles) }),
      setManualSlots: (u) =>
        set({ manualSlots: resolve(u, get().manualSlots) }),
      setExpandedBatchItems: (u) =>
        set({ expandedBatchItems: resolve(u, get().expandedBatchItems) }),
      setEditingFiles: (u) =>
        set({ editingFiles: resolve(u, get().editingFiles) }),
      setEditingDetails: (u) =>
        set({ editingDetails: resolve(u, get().editingDetails) }),
      setFilesConfirmed: (u) =>
        set({ filesConfirmed: resolve(u, get().filesConfirmed) }),
      setDetailsConfirmed: (u) =>
        set({ detailsConfirmed: resolve(u, get().detailsConfirmed) }),

      resetDraft: () =>
        set({
          ...initial,
          surveyDate: todayISO(),
          expandedBatchItems: new Set(),
        }),
    }),
    {
      name: "amx-upload-draft",
      storage: createJSONStorage(() => localStorage),
      // Hanya field yang aman & bermakna untuk disimpan lintas reload.
      // `batchFiles` sengaja TIDAK dipersist (butuh objek File asli, non-serializable).
      // `manualSlots` dipersist TANPA `file` mentahnya (File tidak bisa disimpan di localStorage).
      partialize: (state) => ({
        uploadMode: state.uploadMode,
        title: state.title,
        location: state.location,
        surveyDate: state.surveyDate,
        description: state.description,
        lockedForFree: state.lockedForFree,
        purchasable: state.purchasable,
        editingFiles: state.editingFiles,
        editingDetails: state.editingDetails,
        detailsConfirmed: state.detailsConfirmed,
        manualSlots: state.manualSlots.map((slot) => ({ ...slot, file: null })),
      }),
      // Setelah reload, file .tif pasti hilang (batasan browser) -> paksa
      // filesConfirmed ke false lagi supaya gate "klik Lanjutkan" tetap
      // konsisten dan user diarahkan memilih ulang file sebelum lanjut.
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error(
            "Gagal memuat draft upload dari penyimpanan lokal:",
            error
          );
          return;
        }
        if (state) {
          state.filesConfirmed = false;
          state.batchFiles = [];
        }
      },
    }
  )
);
