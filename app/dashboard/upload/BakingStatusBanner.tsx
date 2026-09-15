"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";
import { useMapBakingPoll } from "@/hooks/useMapBakingPoll";

export function BakingStatusBanner() {
  useMapBakingPoll();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const active = useBakingStatusStore((s) => s.active);
  const dismiss = useBakingStatusStore((s) => s.dismiss);
  const clear = useBakingStatusStore((s) => s.clear);

  if (!mounted || !active || active.dismissed) return null;

  const total = active.layers.length;
  const completed = active.layers.filter(
    (l) => l.conversion_status === "completed"
  ).length;
  const failed = active.layers.filter((l) => l.conversion_status === "failed");
  const stillWorking = active.layers.some(
    (l) =>
      l.conversion_status === "pending" || l.conversion_status === "processing"
  );
  const allDone = !stillWorking && failed.length === 0 && total > 0;
  const partialFailed = !stillWorking && failed.length > 0;
  const stillDetecting = total === 0;

  const progressPct =
    total > 0 ? Math.round((completed / total) * 100) : stillDetecting ? 15 : 0;

  return (
    <AnimatePresence>
      <motion.section
        key={active.mapId}
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`relative mb-6 overflow-hidden rounded-3xl border p-5 shadow-glass backdrop-blur-xl transition-all duration-300 ${allDone
          ? "border-emerald-500/25 bg-gradient-to-r from-emerald-50/90 via-white/85 to-emerald-50/50"
          : partialFailed
            ? "border-amber-500/30 bg-gradient-to-r from-amber-50/90 via-white/85 to-amber-50/50"
            : failed.length > 0 && failed.length === total
              ? "border-red-500/25 bg-gradient-to-r from-red-50/90 via-white/85 to-red-50/50"
              : "border-brand-800/15 bg-gradient-to-r from-brand-50/90 via-white/85 to-brand-50/50"
          }`}
      >
        {/* Subtle Ambient Glow Orbs */}
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-all ${allDone
            ? "bg-emerald-400/20"
            : partialFailed
              ? "bg-amber-400/20"
              : failed.length > 0
                ? "bg-red-400/20"
                : "bg-brand-500/15"
            }`}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Status Icon */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ${allDone
              ? "bg-emerald-600 text-white ring-4 ring-emerald-500/15"
              : partialFailed
                ? "bg-amber-600 text-white ring-4 ring-amber-500/15"
                : failed.length > 0 && failed.length === total
                  ? "bg-red-600 text-white ring-4 ring-red-500/15"
                  : "bg-brand-900 text-brand-300 ring-4 ring-brand-800/10"
              }`}
          >
            {allDone ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : partialFailed ? (
              <AlertTriangle className="h-5 w-5" />
            ) : failed.length > 0 && failed.length === total ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <RefreshCw className="h-5 w-5 animate-spin" />
            )}
          </div>

          {/* Content Area */}
          <div className="min-w-0 flex-1">
            {/* Header / Micro-label & Status Pill */}
            <div className="flex flex-wrap items-center gap-2">

              {allDone ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100/90 px-2.5 py-0.5 text-3xs font-bold text-emerald-800 shadow-2xs">
                  PMTiles Siap
                </span>
              ) : partialFailed ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100/90 px-2.5 py-0.5 text-3xs font-bold text-amber-800 shadow-2xs">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Sebagian Gagal ({failed.length}/{total})
                </span>
              ) : failed.length > 0 && failed.length === total ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-300/60 bg-red-100/90 px-2.5 py-0.5 text-3xs font-bold text-red-800 shadow-2xs">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Konversi Gagal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand-800/15 bg-brand-100/80 px-2.5 py-0.5 text-3xs font-bold text-brand-900 shadow-2xs">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-brand-700" />
                  {stillDetecting ? "Menyiapkan" : `Baking (${progressPct}%)`}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="mt-1 text-sm font-bold text-brand-900 sm:text-base">
              {allDone
                ? `"${active.mapTitle}" berhasil dikonversi ke PMTiles`
                : partialFailed
                  ? `"${active.mapTitle}" — sebagian layer gagal diproses`
                  : failed.length > 0 && failed.length === total
                    ? `"${active.mapTitle}" — konversi PMTiles gagal`
                    : stillDetecting
                      ? `Menyiapkan proses kompilasi "${active.mapTitle}"...`
                      : `"${active.mapTitle}" sedang di-baking ke PMTiles`}
            </h2>

            {/* Description */}
            <p className="mt-1 text-xs font-medium text-brand-800/65">
              Proses berjalan di background, halaman ini tetap bisa dipakai
            </p>

            {/* Progress Bar (Visible while active/processing) */}
            {!allDone && total > 0 && (
              <div className="mt-3 space-y-1.5 max-w-md">
                <div className="flex items-center justify-between text-2xs font-semibold">
                  <span className="text-brand-800/60">Progres Konversi</span>
                  <span className="font-mono text-brand-900">
                    {completed} / {total} layer ({progressPct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-800/10">
                  <motion.div
                    className={`h-full rounded-full transition-all duration-500 ${failed.length > 0
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-brand-600 to-brand-400"
                      }`}
                    style={{
                      width: `${Math.max(6, progressPct)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Layer Chips */}
            {total > 0 && (
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {active.layers.map((layer) => {
                  const isDone = layer.conversion_status === "completed";
                  const isFail = layer.conversion_status === "failed";
                  const isProcessing = layer.conversion_status === "processing";

                  return (
                    <span
                      key={layer.id}
                      title={
                        layer.conversion_error
                          ? `Gagal: ${layer.conversion_error}`
                          : `Status: ${layer.conversion_status}`
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold transition-all ${isDone
                        ? "border-emerald-300/60 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100/90"
                        : isFail
                          ? "border-red-300/60 bg-red-50/90 text-red-800 hover:bg-red-100/90"
                          : isProcessing
                            ? "border-brand-400/60 bg-brand-100/80 text-brand-900 ring-2 ring-brand-500/10"
                            : "border-brand-800/10 bg-white/80 text-brand-800/60"
                        }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                      ) : isFail ? (
                        <AlertCircle className="h-3 w-3 shrink-0 text-red-600" />
                      ) : isProcessing ? (
                        <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-brand-700" />
                      ) : (
                        <Layers className="h-3 w-3 shrink-0 text-brand-800/40" />
                      )}
                      <span className="max-w-[160px] truncate">{layer.name}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            {(allDone || partialFailed) && (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/dashboard/maps?id=${active.mapId}`}
                  className="btn-brand"
                >
                  Buka di Map Viewer
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="btn-ghost"
                >
                  Tutup Notifikasi
                </button>
              </div>
            )}
          </div>

          {/* Dismiss Button (for ongoing / non-cleared states) */}
          <button
            type="button"
            onClick={allDone || partialFailed ? clear : dismiss}
            aria-label={
              allDone || partialFailed
                ? "Tutup notifikasi"
                : "Sembunyikan notifikasi sementara"
            }
            title={
              allDone || partialFailed
                ? "Tutup notifikasi"
                : "Sembunyikan notifikasi sementara"
            }
            className="shrink-0 rounded-xl p-1.5 text-brand-800/40 transition hover:bg-brand-800/10 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
