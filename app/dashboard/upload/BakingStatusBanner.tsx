"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";
import { useMapBakingPoll } from "@/hooks/useMapBakingPoll";

interface BakingStatusBannerProps {
  suppressed?: boolean;
  uploadedDataset?: { mapId: string; title: string; totalLayers: number } | null;
  onNewUpload?: () => void;
}

/** One result card owns persisted conversion status and post-upload actions. */
export function BakingStatusBanner({
  suppressed = false,
  uploadedDataset,
  onNewUpload,
}: BakingStatusBannerProps) {
  // Keep tracking mounted even when the current upload owns the visible progress.
  useMapBakingPoll();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = useBakingStatusStore((s) => s.active);
  const dismiss = useBakingStatusStore((s) => s.dismiss);
  const tracked = active && (!uploadedDataset || active.mapId === uploadedDataset.mapId)
    ? active
    : null;

  if (!mounted || suppressed) return null;
  if (!uploadedDataset && (!tracked || tracked.dismissed)) return null;

  const mapId = uploadedDataset?.mapId ?? tracked!.mapId;
  const title = uploadedDataset?.title ?? tracked!.mapTitle;
  const layers = tracked?.layers ?? [];
  const total = layers.length;
  const completed = layers.filter((layer) => layer.conversion_status === "completed").length;
  const failed = layers.filter((layer) => layer.conversion_status === "failed").length;
  const allDone = total > 0 && completed === total;
  const allFailed = total > 0 && failed === total;
  const partialFailed = failed > 0 && !allFailed;
  const working = total > completed + failed;
  const checking = total === 0 && !!tracked;
  const unavailable = !tracked;
  const processing = working || checking;
  const label = unavailable
    ? "Status belum tersedia"
    : allDone
      ? "PMTiles siap"
      : allFailed
        ? "Konversi gagal"
        : partialFailed
          ? working ? "Diproses · sebagian gagal" : "Sebagian layer gagal"
          : "Kompilasi PMTiles";
  const detail = unavailable
    ? "Dataset tersimpan · periksa status di peta"
    : allDone
      ? `${total} layer siap ditampilkan`
      : allFailed
        ? `${failed}/${total} layer gagal · dataset tersimpan`
        : partialFailed
          ? `${completed}/${total} layer siap · ${failed} gagal${working ? " · lainnya diproses" : ""}`
          : checking
            ? "Memeriksa status konversi"
            : `${completed}/${total} layer siap · berjalan di background`;

  return (
    <section
      aria-label="Hasil upload dataset"
      className="relative mb-4 rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-300"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <div className={cn("min-w-0 flex-1", !onNewUpload && "pr-9 md:pr-0")}>
          <p className="text-xs font-medium text-brand-800/60">AMX GeoStream Engine</p>
          <h2 className="mt-0.5 break-words text-sm font-bold leading-snug text-brand-950">{title}</h2>
          <div role="status" aria-live="polite" aria-atomic="true" className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed">
            {allDone ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  title="Format Cloud-Native PMTiles v3 (Protomaps Tile Archive)"
                  className="inline-flex items-center overflow-hidden rounded-full border border-[#2525C5]/30 bg-white shadow-xs transition hover:border-[#2525C5]/60 hover:shadow-sm"
                >
                  <span className="flex items-center justify-center bg-[#2525C5] pl-2 pr-1.5 py-0.5">
                    <img
                      src="/pmtiles-logo.png"
                      alt="PMTiles Logo"
                      className="h-3.5 w-3.5 rounded-full"
                    />
                  </span>
                  <span className="bg-[#2525C5]/5 pl-1.5 pr-2 py-0.5 font-mono text-[9.5px] font-bold tracking-tight text-[#2222D4]">
                    PMTiles
                  </span>
                </span>

                <span className="sr-only">PMTiles siap</span>
              </span>
            ) : (
              <span className={cn(
                "font-semibold",
                unavailable || partialFailed ? "text-status-warning-text" : allFailed ? "text-status-error-text" : "text-brand-700"
              )}>
                {label}
              </span>
            )}
            <span className="tabular-nums text-brand-800/70">{detail}</span>
          </div>

          {processing && (
            <div
              role="progressbar"
              aria-label="Layer PMTiles selesai dikonversi"
              aria-valuemin={0}
              aria-valuemax={total || undefined}
              aria-valuenow={total > 0 ? completed : undefined}
              className="mt-2 h-1 overflow-hidden rounded-full bg-brand-100"
            >
              <div
                className={cn("h-full rounded-full bg-brand-500", checking ? "animate-pulse motion-reduce:animate-none" : "transition-[width] motion-reduce:transition-none")}
                style={{ width: checking ? "100%" : `${(completed / total) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className={cn("flex shrink-0 flex-wrap items-center gap-2", !onNewUpload && "md:pr-8")}>
          <Link
            href={`/dashboard/maps?id=${encodeURIComponent(mapId)}`}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-brand-800 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Buka di Map Viewer
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          </Link>
          {onNewUpload && (
            <button
              type="button"
              onClick={() => { dismiss(); onNewUpload(); }}
              className="inline-flex min-h-9 items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              Upload dataset lain
            </button>
          )}
        </div>
      </div>

      {!onNewUpload && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup notifikasi konversi"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl text-brand-800/60 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:top-1/2 md:-translate-y-1/2"
        >
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}

      {failed > 0 && (
        <details className="mt-3 rounded-xl border border-status-warning-border bg-status-warning-bg px-3 py-2 text-xs">
          <summary className="cursor-pointer rounded font-semibold text-status-warning-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
            Detail {failed} layer gagal
          </summary>
          <ul className="mt-2 space-y-2" aria-label="Layer gagal">
            {layers.filter((layer) => layer.conversion_status === "failed").map((layer) => (
              <li key={layer.id} className="break-words text-status-error-text">
                <span className="font-semibold">{layer.name}</span>
                <p className="mt-0.5 leading-relaxed">
                  {layer.conversion_error || "Periksa detail konversi di Map Viewer."}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
