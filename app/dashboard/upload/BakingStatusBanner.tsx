"use client";

import Link from "next/link";
import { CheckCircle2, RefreshCw, AlertCircle, X, Layers } from "lucide-react";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";
import { useMapBakingPoll } from "@/hooks/useMapBakingPoll";

export function BakingStatusBanner() {
  useMapBakingPoll();

  const active = useBakingStatusStore((s) => s.active);
  const dismiss = useBakingStatusStore((s) => s.dismiss);
  const clear = useBakingStatusStore((s) => s.clear);

  if (!active || active.dismissed) return null;

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
  const stillDetecting = total === 0; // response pertama dari server belum masuk

  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-2xl border p-4 ${
        allDone
          ? "border-emerald-200 bg-emerald-50"
          : failed.length > 0
          ? "border-red-200 bg-red-50"
          : "border-brand-800/15 bg-brand-50"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
        {allDone ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : failed.length > 0 ? (
          <AlertCircle className="h-4 w-4 text-red-600" />
        ) : (
          <RefreshCw className="h-4 w-4 animate-spin text-brand-700" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-brand-900">
          {allDone
            ? `"${active.mapTitle}" selesai diproses`
            : failed.length > 0
            ? `"${active.mapTitle}" — sebagian layer gagal diproses`
            : stillDetecting
            ? `Menyiapkan proses "${active.mapTitle}"...`
            : `"${active.mapTitle}" sedang di-baking ke PMTiles...`}
        </p>

        <p className="mt-0.5 text-2xs font-medium text-brand-800/60">
          {stillDetecting
            ? "Memeriksa status layer..."
            : `${completed} dari ${total} layer selesai${
                failed.length > 0 ? ` · ${failed.length} gagal` : ""
              }`}{" "}
          · proses berjalan di background, halaman ini tetap bisa dipakai
        </p>

        {total > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {active.layers.map((layer) => (
              <span
                key={layer.id}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                  layer.conversion_status === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : layer.conversion_status === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-white text-brand-800/60"
                }`}
                title={layer.conversion_error || undefined}
              >
                <Layers className="h-2.5 w-2.5" />
                {layer.name}
                {layer.conversion_status === "processing" && (
                  <RefreshCw className="h-2 w-2 animate-spin" />
                )}
              </span>
            ))}
          </div>
        )}

        {allDone && (
          <div className="mt-3 flex gap-2">
            <Link
              href={`/dashboard/maps?id=${active.mapId}`}
              className="rounded-full bg-brand-900 px-3 py-1.5 text-2xs font-bold text-white"
            >
              Buka di Map Viewer
            </Link>
            <button
              type="button"
              onClick={clear}
              className="rounded-full border border-brand-800/15 bg-white px-3 py-1.5 text-2xs font-bold text-brand-800/70"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {!allDone && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Sembunyikan notifikasi"
          className="shrink-0 text-brand-800/30 transition hover:text-brand-800/60"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
