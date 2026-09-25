"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";
import { useMapBakingPoll } from "@/hooks/useMapBakingPoll";
import { getSettingsSnapshot } from "@/lib/stores/settingsStore";
import { dispatchToast, showDesktopNotification } from "@/lib/notify";

import {
  ActionButton,
  EASE,
  ICON_STROKE,
  IconBox,
  buttonClass,
  cardClass,
  eyebrowClass,
  fadeUp,
} from "./upload-ui";

interface BakingStatusBannerProps {
  suppressed?: boolean;
  uploadedDataset?: {
    mapId: string;
    title: string;
    totalLayers: number;
  } | null;
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

  /* Notifikasi "upload diterima" — dipicu saat dataset baru
     dikirim dari halaman Upload (sekali per mapId). */
  const notifiedUploadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uploadedDataset) return;

    if (notifiedUploadRef.current === uploadedDataset.mapId) return;

    notifiedUploadRef.current = uploadedDataset.mapId;

    const settings = getSettingsSnapshot();

    if (settings.notifyUpload) {
      dispatchToast({
        title: "Upload diterima",
        message: `${uploadedDataset.title} · ${uploadedDataset.totalLayers} layer diproses di background.`,
        tone: "info",
      });
    }

    showDesktopNotification(
      "Upload diterima",
      `${uploadedDataset.title} sedang diproses di background.`
    );
  }, [uploadedDataset]);

  const active = useBakingStatusStore((s) => s.active);
  const dismiss = useBakingStatusStore((s) => s.dismiss);
  const tracked =
    active && (!uploadedDataset || active.mapId === uploadedDataset.mapId)
      ? active
      : null;

  if (!mounted || suppressed) return null;
  if (!uploadedDataset && (!tracked || tracked.dismissed)) return null;

  const mapId = uploadedDataset?.mapId ?? tracked!.mapId;
  const title = uploadedDataset?.title ?? tracked!.mapTitle;
  const layers = tracked?.layers ?? [];
  const total = layers.length;
  const completed = layers.filter(
    (layer) => layer.conversion_status === "completed"
  ).length;
  const failed = layers.filter(
    (layer) => layer.conversion_status === "failed"
  ).length;
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
    ? working
      ? "Diproses · sebagian gagal"
      : "Sebagian layer gagal"
    : "Kompilasi PMTiles";
  const detail = unavailable
    ? "Dataset tersimpan · periksa status di peta"
    : allDone
    ? `${total} layer siap ditampilkan`
    : allFailed
    ? `${failed}/${total} layer gagal · dataset tersimpan`
    : partialFailed
    ? `${completed}/${total} layer siap · ${failed} gagal${
        working ? " · lainnya diproses" : ""
      }`
    : checking
    ? "Memeriksa status konversi"
    : `${completed}/${total} layer siap · berjalan di background`;

  const StatusIcon = allDone
    ? CheckCircle2
    : allFailed || partialFailed
    ? AlertCircle
    : Layers;

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      aria-label="Hasil upload dataset"
      className={cn(cardClass, "relative mb-4 p-4 sm:p-5")}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-start gap-3",
            !onNewUpload && "pr-11 md:pr-0"
          )}
        >
          <IconBox icon={StatusIcon} />

          <div className="min-w-0 flex-1">
            <p className={eyebrowClass}>AMX GeoStream Engine</p>
            <h2 className="mt-1 break-words text-sm font-bold leading-snug text-[#171717]">
              {title}
            </h2>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed"
            >
              {allDone ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    title="Format Cloud-Native PMTiles v3 (Protomaps Tile Archive)"
                    className="inline-flex items-center overflow-hidden border border-[#2525C5]/30 bg-white transition-colors hover:border-[#2525C5]/60"
                  >
                    <span className="flex items-center justify-center bg-[#2525C5] py-0.5 pl-2 pr-1.5">
                      <img
                        src="/pmtiles-logo.png"
                        alt="PMTiles Logo"
                        className="h-3.5 w-3.5 rounded-full"
                      />
                    </span>
                    <span className="bg-[#2525C5]/5 py-0.5 pl-1.5 pr-2 text-[10px] font-bold tracking-tight text-[#2222D4]">
                      PMTiles
                    </span>
                  </span>

                  <span className="sr-only">PMTiles siap</span>
                </span>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 font-bold",
                    unavailable || partialFailed
                      ? "text-status-warning-text"
                      : allFailed
                      ? "text-status-error-text"
                      : "text-[#171717]"
                  )}
                >
                  {processing && (
                    <motion.span
                      aria-hidden="true"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="h-1.5 w-1.5 bg-[#76B900]"
                    />
                  )}
                  {label}
                </span>
              )}
              <span className="font-medium tabular-nums text-[#6B6B66]">
                {detail}
              </span>
            </div>

            {processing && (
              <div
                role="progressbar"
                aria-label="Layer PMTiles selesai dikonversi"
                aria-valuemin={0}
                aria-valuemax={total || undefined}
                aria-valuenow={total > 0 ? completed : undefined}
                className="mt-2.5 h-1 overflow-hidden bg-[#DCDDD8]/60"
              >
                <div
                  className={cn(
                    "h-full bg-[#171717]",
                    checking
                      ? "animate-pulse motion-reduce:animate-none"
                      : "transition-[width] duration-300 motion-reduce:transition-none"
                  )}
                  style={{
                    width: checking ? "100%" : `${(completed / total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 flex-wrap items-center gap-2",
            !onNewUpload && "md:pr-11"
          )}
        >
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <Link
              href={`/dashboard/maps?id=${encodeURIComponent(mapId)}`}
              className={cn(buttonClass("primary"), "group min-h-9")}
            >
              Buka di Map Viewer
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={ICON_STROKE}
                aria-hidden="true"
              />
            </Link>
          </motion.div>

          {onNewUpload && (
            <ActionButton
              variant="secondary"
              className="min-h-9"
              onClick={() => {
                dismiss();
                onNewUpload();
              }}
            >
              Upload dataset lain
            </ActionButton>
          )}
        </div>
      </div>

      {!onNewUpload && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup notifikasi konversi"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-[#DCDDD8] bg-white text-[#6B6B66] outline-none transition-colors hover:bg-[#FAFAF8] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#171717]/20 md:top-1/2 md:-translate-y-1/2"
        >
          <X
            className="h-3.5 w-3.5"
            strokeWidth={ICON_STROKE}
            aria-hidden="true"
          />
        </button>
      )}

      {failed > 0 && (
        <details className="mt-4 border border-status-warning-border bg-status-warning-bg px-3 py-2 text-xs">
          <summary className="cursor-pointer font-bold text-status-warning-text outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20">
            Detail {failed} layer gagal
          </summary>
          <ul className="mt-2 space-y-2" aria-label="Layer gagal">
            {layers
              .filter((layer) => layer.conversion_status === "failed")
              .map((layer) => (
                <li
                  key={layer.id}
                  className="break-words text-status-error-text"
                >
                  <span className="font-bold">{layer.name}</span>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    {layer.conversion_error ||
                      "Periksa detail konversi di Map Viewer."}
                  </p>
                </li>
              ))}
          </ul>
        </details>
      )}
    </motion.section>
  );
}
