"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";

import {
  Map as MapIcon,
  Layers,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Info,
  X,
  Crown,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
  MapPin,
  ScanLine,
  Lock,
} from "lucide-react";

import type { MapHandle } from "@/components/MapDisplay";
import type { GeoMetadata } from "@/types/map";

/* =========================================================
   MAP DISPLAY
========================================================= */

type MapDisplayProps = {
  mapId?: string;
  token?: string;
  mapFormat?: string;
  mapTitle?: string;
  mapLocation?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

const Map = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,

  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#f7f8f4]">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#123c28]/10 border-t-[#123c28]" />

        <p className="text-xs font-medium text-[#123c28]/45">Memuat peta...</p>
      </div>
    </div>
  ),
}) as unknown as React.ForwardRefExoticComponent<
  MapDisplayProps & React.RefAttributes<MapHandle>
>;

/* =========================================================
   TYPES
========================================================= */

interface MapData {
  id: string;
  title: string;
  location: string;
  survey_date: string;
  map_type?: string;
  description?: string;
  file_size: number;
  file_format: string;
  locked_for_free: boolean;
  purchasable: boolean;
  purchase_price?: number | null;
  created_at: string;
  geo_metadata?: GeoMetadata | null;
}

/* =========================================================
   HELPERS
========================================================= */

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/* =========================================================
   PAGE
========================================================= */

export default function MapsPage() {
  const { user } = useUserRole();

  /* =========================================================
     STATE
  ========================================================== */

  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedLayer, setSelectedLayer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Premium modal */
  const [toastMessage, setToastMessage] = useState("");

  /* Notice */
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Fullscreen */
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapHandle>(null);

  /* Metadata */
  const [metadataMap, setMetadataMap] = useState<MapData | null>(null);

  /* Edit */
  const [editingMap, setEditingMap] = useState<MapData | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    location: "",
    survey_date: "",
    description: "",
    locked_for_free: false,
    purchasable: false,
    purchase_price: "" as string | number,
  });

  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editErrors, setEditErrors] = useState<{
    title?: string;
    location?: string;
    survey_date?: string;
  }>({});

  /* Delete */
  const [deletingMap, setDeletingMap] = useState<MapData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* Download analysis */
  const [isDownloadingAnalysis, setIsDownloadingAnalysis] = useState(false);

  /* =========================================================
     NOTICE
  ========================================================== */

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setNotice({
      type,
      text,
    });

    if (noticeTimeout.current) {
      clearTimeout(noticeTimeout.current);
    }

    noticeTimeout.current = setTimeout(() => {
      setNotice(null);
    }, 3000);
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
  };

  /* =========================================================
     FETCH MAPS
  ========================================================== */

  const fetchMaps = () => {
    setLoading(true);
    setError("");

    api
      .get("/maps")
      .then(({ data }) => {
        const rawMaps: any[] = data.maps ?? [];
        const mapList: MapData[] = rawMaps.filter((m) => {
          if (!m.layers || m.layers.length === 0) return true;
          return m.layers.every(
            (l: any) =>
              l.conversion_status === "completed" ||
              l.conversion_status === "failed"
          );
        });

        setMaps(mapList);

        setSelectedLayer((previous) =>
          mapList.some((map) => map.id === previous)
            ? previous
            : mapList[0]?.id || ""
        );
      })
      .catch(
        (requestError: {
          response?: {
            data?: {
              detail?: string;
            };
          };
        }) => {
          setError(requestError.response?.data?.detail || "Gagal memuat peta.");
        }
      )
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMaps();

    return () => {
      if (noticeTimeout.current) {
        clearTimeout(noticeTimeout.current);
      }
    };
  }, []);

  /* =========================================================
     FULLSCREEN
  ========================================================== */

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handler);

    return () => {
      document.removeEventListener("fullscreenchange", handler);
    };
  }, []);

  /* =========================================================
     DATA
  ========================================================== */

  const isAdmin = user?.role === "admin";

  const mapLayers = maps.map((map) => ({
    id: map.id,
    name: map.title,
    location: map.location,
    date: new Date(map.survey_date).toLocaleDateString("id-ID"),
    color: "bg-[#3e7658]",
    locked: map.locked_for_free && !isAdmin && user?.tier === "free",
    format: map.file_format,
    size: (map.file_size / 1024 / 1024).toFixed(2),
  }));

  /* =========================================================
     SEARCH
  ========================================================== */

  const filteredMapLayers = mapLayers.filter((layer) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      layer.name.toLowerCase().includes(query) ||
      layer.location.toLowerCase().includes(query) ||
      layer.format.toLowerCase().includes(query)
    );
  });

  const selectedMap = mapLayers.find((layer) => layer.id === selectedLayer);

  const selectedMapRaw = maps.find((map) => map.id === selectedLayer) || null;

  /* =========================================================
     MAP ACTIONS
  ========================================================== */

  const handleZoomIn = () => {
    if (mapRef.current?.zoomIn) {
      mapRef.current.zoomIn();
      return;
    }

    showNotice("Zoom in memerlukan pembaruan pada MapDisplay.", "error");
  };

  const handleZoomOut = () => {
    if (mapRef.current?.zoomOut) {
      mapRef.current.zoomOut();
      return;
    }

    showNotice("Zoom out memerlukan pembaruan pada MapDisplay.", "error");
  };

  const handleFullscreen = async () => {
    if (!mapContainerRef.current) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await mapContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showNotice("Browser tidak mendukung mode layar penuh.", "error");
    }
  };

  /* =========================================================
     SHARE
  ========================================================== */

  const handleShare = async () => {
    if (!selectedMapRaw) {
      showNotice("Pilih peta terlebih dahulu untuk dibagikan.", "error");

      return;
    }

    const shareUrl = `${window.location.origin}${
      window.location.pathname
    }?map=${encodeURIComponent(selectedMapRaw.id)}`;

    const shareTitle = selectedMapRaw.title || "Peta Geospasial";

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: shareTitle,
          text: `Lihat peta ${shareTitle}`,
          url: shareUrl,
        });

        showNotice("Peta berhasil dibagikan.");

        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);

        showNotice("Tautan peta berhasil disalin ke clipboard.");

        return;
      }

      const textArea = document.createElement("textarea");

      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const copied = document.execCommand("copy");

      textArea.remove();

      if (copied) {
        showNotice("Tautan peta berhasil disalin.");
      } else {
        showNotice("Tidak dapat menyalin tautan peta.", "error");
      }
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      console.error("Share error:", shareError);

      showNotice("Gagal membagikan peta.", "error");
    }
  };

  /* =========================================================
     DOWNLOAD ANALYSIS
  ========================================================== */

  const handleDownloadAnalysis = async () => {
    if (!isAdmin && user?.tier === "free") {
      triggerToast("Download Analisa tersedia untuk paket Desa & Kecamatan.");

      return;
    }

    if (!selectedMapRaw) {
      showNotice("Pilih peta yang ingin dianalisis.", "error");

      return;
    }

    setIsDownloadingAnalysis(true);

    try {
      const response = await api.get(
        `/maps/${selectedMapRaw.id}/analysis/download`,
        {
          responseType: "blob",

          headers: {
            Accept: "application/pdf, application/octet-stream",
          },
        }
      );

      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data]);

      const contentType = response.headers?.["content-type"] || blob.type || "";

      if (contentType.includes("application/json")) {
        const text = await blob.text();

        let message = "Gagal membuat hasil analisa.";

        try {
          const json = JSON.parse(text);

          message = json?.detail || json?.message || message;
        } catch {
          if (text) {
            message = text;
          }
        }

        throw new Error(message);
      }

      let filename = `Analisa_${selectedMapRaw.title || "Peta"}.pdf`;

      const contentDisposition = response.headers?.["content-disposition"];

      if (contentDisposition) {
        const encodedMatch = contentDisposition.match(
          /filename\*\s*=\s*UTF-8''([^;]+)/i
        );

        const normalMatch = contentDisposition.match(
          /filename\s*=\s*"([^"]+)"/i
        );

        const unquotedMatch = contentDisposition.match(
          /filename\s*=\s*([^;]+)/i
        );

        if (encodedMatch?.[1]) {
          filename = decodeURIComponent(encodedMatch[1]);
        } else if (normalMatch?.[1]) {
          filename = normalMatch[1];
        } else if (unquotedMatch?.[1]) {
          filename = unquotedMatch[1].trim();
        }
      }

      if (!filename.toLowerCase().endsWith(".pdf")) {
        filename = `${filename}.pdf`;
      }

      const downloadUrl = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.style.display = "none";

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

      showNotice(`Hasil analisa berhasil diunduh: ${filename}`);
    } catch (downloadError) {
      console.error("Download analysis error:", downloadError);

      let message = "Gagal mengunduh hasil analisa.";

      if (downloadError instanceof Error) {
        message = downloadError.message;
      }

      showNotice(message, "error");
    } finally {
      setIsDownloadingAnalysis(false);
    }
  };

  /* =========================================================
     EDIT
  ========================================================== */

  const openEditModal = (map: MapData, event?: React.MouseEvent) => {
    event?.stopPropagation();

    setEditingMap(map);

    setEditForm({
      title: map.title || "",
      location: map.location || "",
      survey_date: map.survey_date ? map.survey_date.split("T")[0] : "",
      description: map.description || "",
      locked_for_free: Boolean(map.locked_for_free),
      purchasable: Boolean(map.purchasable),
      purchase_price: map.purchase_price ?? "",
    });

    setEditErrors({});
  };

  const closeEditModal = () => {
    setEditingMap(null);
    setEditErrors({});
  };

  const submitEdit = async () => {
    if (!editingMap) {
      return;
    }

    const errors: {
      title?: string;
      location?: string;
      survey_date?: string;
    } = {};

    if (!editForm.title.trim()) {
      errors.title = "Nama peta wajib diisi.";
    }

    if (!editForm.location.trim()) {
      errors.location = "Lokasi wajib diisi.";
    }

    if (!editForm.survey_date) {
      errors.survey_date = "Tanggal survey wajib diisi.";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSavingEdit(true);

    try {
      await api.patch(`/maps/${editingMap.id}`, {
        title: editForm.title.trim(),
        location: editForm.location.trim(),
        survey_date: editForm.survey_date,
        description: editForm.description.trim(),
        locked_for_free: editForm.locked_for_free,
        purchasable: editForm.purchasable,
        purchase_price:
          editForm.purchasable && editForm.purchase_price !== ""
            ? Number(editForm.purchase_price)
            : null,
      });

      showNotice("Peta berhasil diperbarui.");

      closeEditModal();

      fetchMaps();
    } catch {
      showNotice("Gagal memperbarui peta.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================== */

  const openDeleteConfirm = (map: MapData, event?: React.MouseEvent) => {
    event?.stopPropagation();

    setDeletingMap(map);
  };

  const closeDeleteConfirm = () => setDeletingMap(null);

  const confirmDelete = async () => {
    if (!deletingMap) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete(`/maps/${deletingMap.id}`);

      showNotice("Peta berhasil dihapus.");

      if (selectedLayer === deletingMap.id) {
        setSelectedLayer("");
      }

      closeDeleteConfirm();

      fetchMaps();
    } catch {
      showNotice("Gagal menghapus peta.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-full bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ===================================================
    PAGE HEADER
==================================================== */}
        <header className="mb-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            {/* TITLE */}
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f3f6ed]">
                  <MapIcon className="h-4 w-4 text-[#123c28]" />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/70">
                  UAV DATA-AS-A-SERVICE PLATFORM
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-3xl">
                Peta & Analisis
                <span className="text-[#1a5134]"> Geospasial</span>
              </h1>
            </div>

            {/* SEARCH + LAYER TOGGLE */}
            <div className="flex w-full items-center gap-2 xl:w-auto">
              {/* SEARCH */}
              <div className="min-w-0 flex-1 xl:w-[460px]">
                <div className="relative">
                  <MapIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/35" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari peta anda..."
                    className="
              h-10 w-full rounded-full
              border border-[#123c28]/10
              bg-[#fafbf8]
              pl-10 pr-10
              text-[11px]
              font-medium
              text-[#123c28]
              outline-none
              transition
              placeholder:text-[#123c28]/40
              focus:border-[#123c28]/25
              focus:bg-white
              focus:ring-2
              focus:ring-[#123c28]/5
            "
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="
                absolute right-2 top-1/2
                flex h-7 w-7
                -translate-y-1/2
                items-center justify-center
                rounded-full
                text-[#123c28]/45
                transition
                hover:bg-[#f3f6ed]
                hover:text-[#123c28]
              "
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            SEARCH RESULT INFO
        ==================================================== */}
        {searchQuery && (
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[10px] font-medium text-[#123c28]/55">
              Menampilkan{" "}
              <span className="font-bold text-[#123c28]">
                {filteredMapLayers.length}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-[#123c28]">{maps.length}</span>{" "}
              peta
            </p>

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[10px] font-bold text-[#123c28] hover:underline"
            >
              Hapus pencarian
            </button>
          </div>
        )}

        {/* ===================================================
            MAIN WORKSPACE (FULL WIDTH)
        ==================================================== */}
        <div className="w-full">
          <div className="w-full">
            <div className="overflow-hidden rounded-[20px] border border-[#123c28]/10 bg-white shadow-sm">
              {/* =================================================
                  ACTIVE LAYER HEADER
              ================================================== */}
              <div className="border-b border-[#123c28]/10 px-5 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* MAP IDENTITY */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f6ed]">
                      <ScanLine className="h-4 w-4 text-[#123c28]" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold leading-5 text-[#123c28] sm:text-[15px]">
                        {selectedMap
                          ? selectedMap.name
                          : "Belum ada layer dipilih"}
                      </h3>

                      {selectedMap ? (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-[#123c28]/50">
                          <span>
                            {selectedMap.format?.toUpperCase() || "UNKNOWN"}
                          </span>

                          <span className="text-[#123c28]/20">•</span>

                          <span>{selectedMap.size} MB</span>

                          <span className="text-[#123c28]/20">•</span>

                          <span>Survey {selectedMap.date}</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-[10px] font-medium text-[#123c28]/45">
                          Pilih layer untuk melihat data pemetaan
                        </p>
                      )}
                    </div>
                  </div>

                  {/* MAP ACTIONS */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {/* DOWNLOAD */}
                    <button
                      type="button"
                      onClick={handleDownloadAnalysis}
                      disabled={isDownloadingAnalysis}
                      className={`
                        inline-flex h-10
                        items-center gap-2
                        rounded-full
                        px-4
                        text-[11px]
                        font-bold
                        transition
                        ${
                          !isAdmin && user?.tier === "free"
                            ? "cursor-not-allowed border border-[#123c28]/10 bg-[#fafbf8] text-[#123c28]/35"
                            : "bg-[#123c28] text-white hover:bg-[#1a5134]"
                        }
                      `}
                    >
                      {!isAdmin && user?.tier === "free" ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : isDownloadingAnalysis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}

                      <span>
                        {isDownloadingAnalysis
                          ? "Menyiapkan..."
                          : "Download Analisa"}
                      </span>
                    </button>

                    {/* MAP CONTROLS */}
                    <div className="flex h-10 items-center gap-0.5 rounded-full border border-[#123c28]/10 bg-white p-1">
                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={!selectedMapRaw}
                        title="Zoom In"
                        aria-label="Zoom In"
                        className="
                          flex h-8 w-8
                          items-center justify-center
                          rounded-full
                          text-[#123c28]/70
                          transition
                          hover:bg-[#f3f6ed]
                          hover:text-[#123c28]
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                        "
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={!selectedMapRaw}
                        title="Zoom Out"
                        aria-label="Zoom Out"
                        className="
                          flex h-8 w-8
                          items-center justify-center
                          rounded-full
                          text-[#123c28]/70
                          transition
                          hover:bg-[#f3f6ed]
                          hover:text-[#123c28]
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                        "
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleFullscreen}
                        title={
                          isFullscreen ? "Keluar Layar Penuh" : "Full Screen"
                        }
                        aria-label={
                          isFullscreen ? "Keluar Layar Penuh" : "Full Screen"
                        }
                        className="
                          flex h-8 w-8
                          items-center justify-center
                          rounded-full
                          text-[#123c28]/70
                          transition
                          hover:bg-[#f3f6ed]
                          hover:text-[#123c28]
                        "
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  MAP & FLOATING MAP LAYERS
              ================================================== */}
              <div
                ref={mapContainerRef}
                className={`relative w-full bg-[#f1f3ed] ${
                  isFullscreen ? "h-screen w-screen" : "h-[480px] sm:h-[620px]"
                }`}
              >
                <Map
                  ref={mapRef}
                  mapId={selectedMap?.id}
                  token={
                    typeof window !== "undefined"
                      ? localStorage.getItem("token") || undefined
                      : undefined
                  }
                  mapFormat={selectedMap?.format}
                  mapTitle={selectedMap?.name}
                  mapLocation={selectedMap?.location}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={handleFullscreen}
                />

                {/* =================================================
                    FLOATING TOGGLE BUTTON (WHEN PANEL CLOSED)
                ================================================== */}
                {!isLayerPanelOpen && (
                  <button
                    type="button"
                    onClick={() => setIsLayerPanelOpen(true)}
                    className="absolute top-3 left-3 z-30 inline-flex items-center gap-2 rounded-full border border-[#123c28]/15 bg-white/95 px-3.5 py-2 text-xs font-bold text-[#123c28] shadow-lg backdrop-blur-md transition hover:bg-[#f3f6ed] hover:shadow-xl"
                  >
                    <Layers className="h-3.5 w-3.5 text-[#123c28]" />
                    <span>Daftar Peta</span>
                    <span className="rounded-full bg-[#123c28]/10 px-1.5 py-0.5 text-[9px] font-extrabold text-[#123c28]">
                      {maps.length}
                    </span>
                  </button>
                )}

                {/* =================================================
                    FLOATING MAP LAYERS PANEL (OVERLAY INSIDE MAP)
                ================================================== */}
                {isLayerPanelOpen && (
                  <aside className="absolute top-3 left-3 z-30 flex max-h-[calc(100%-140px)] w-72 flex-col overflow-hidden rounded-2xl border border-[#123c28]/15 bg-white/95 shadow-2xl backdrop-blur-md sm:w-80 animate-in fade-in slide-in-from-left-2 duration-200">
                    {/* PANEL HEADER */}
                    <div className="border-b border-[#123c28]/10 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#123c28]/55">
                            MAP LAYERS
                          </p>

                          <h2 className="mt-0.5 text-sm font-bold text-[#123c28]">
                            Pilih Peta Anda
                          </h2>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-[10px] font-semibold text-[#123c28]/50">
                            {searchQuery
                              ? `${filteredMapLayers.length} / ${maps.length}`
                              : `${maps.length} Peta`}
                          </span>

                          <button
                            type="button"
                            onClick={() => setIsLayerPanelOpen(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#123c28]/60 transition hover:bg-[#123c28]/10 hover:text-[#123c28]"
                            title="Sembunyikan daftar peta"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* LAYERS LIST */}
                    <div className="flex-1 space-y-2 overflow-y-auto p-3 overscroll-contain">
                      {/* LOADING */}
                      {loading && (
                        <div className="rounded-2xl bg-[#f7f8f4] px-4 py-8 text-center">
                          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#123c28]/20 border-t-[#123c28]" />

                          <p className="text-xs font-semibold text-[#123c28]/70">
                            Memuat data peta...
                          </p>
                        </div>
                      )}

                      {/* ERROR */}
                      {!loading && error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                          {error}
                        </div>
                      )}

                      {/* EMPTY */}
                      {!loading && !error && maps.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] px-4 py-8 text-center">
                          <MapIcon className="mx-auto h-5 w-5 text-[#123c28]/45" />

                          <p className="mt-3 text-xs font-bold text-[#123c28]">
                            Belum ada peta
                          </p>

                          <p className="mt-1 text-[10px] font-medium leading-5 text-[#123c28]/60">
                            Upload peta pertama Anda untuk mulai melakukan
                            analisis.
                          </p>
                        </div>
                      )}

                      {/* SEARCH EMPTY */}
                      {!loading &&
                        !error &&
                        maps.length > 0 &&
                        filteredMapLayers.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] px-4 py-8 text-center">
                            <MapIcon className="mx-auto h-5 w-5 text-[#123c28]/40" />

                            <p className="mt-3 text-xs font-bold text-[#123c28]">
                              Peta tidak ditemukan
                            </p>

                            <p className="mt-1 text-[10px] font-medium leading-5 text-[#123c28]/60">
                              Coba gunakan kata kunci lain untuk pencarian.
                            </p>
                          </div>
                        )}

                      {/* LAYER LIST */}
                      {filteredMapLayers.map((layer) => {
                        const raw = maps.find((map) => map.id === layer.id)!;

                        const active = selectedLayer === layer.id;

                        return (
                          <div
                            key={layer.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (layer.locked) {
                                triggerToast(
                                  "Peta ini terkunci untuk Member Free. Silakan Upgrade Tier Anda."
                                );
                              } else {
                                setSelectedLayer(layer.id);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();

                                if (layer.locked) {
                                  triggerToast(
                                    "Peta ini terkunci untuk Member Free. Silakan Upgrade Tier Anda."
                                  );
                                } else {
                                  setSelectedLayer(layer.id);
                                }
                              }
                            }}
                            className={`
                                group
                                rounded-2xl
                                border
                                p-3
                                transition
                                ${
                                  active
                                    ? "border-[#123c28]/25 bg-[#f3f6ed]"
                                    : "border-[#123c28]/10 bg-white hover:border-[#123c28]/20 hover:bg-[#fafbf8]"
                                }
                                ${
                                  layer.locked
                                    ? "cursor-not-allowed opacity-70"
                                    : "cursor-pointer"
                                }
                              `}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`
                                    mt-1
                                    h-2 w-2
                                    shrink-0
                                    rounded-full
                                    ${layer.color}
                                  `}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="truncate text-[11px] font-bold text-[#123c28]">
                                    {layer.name}
                                  </h3>

                                  {layer.locked && (
                                    <span className="inline-flex shrink-0 items-center gap-1 text-[8px] font-bold text-[#b27518]">
                                      <Lock className="h-2.5 w-2.5" />
                                      Pro
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-[#123c28]/65">
                                  <Calendar className="h-3 w-3" />
                                  {layer.date}
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 text-[9px] font-medium text-[#123c28]/65">
                                  <MapPin className="h-3 w-3" />

                                  <span className="truncate">
                                    {layer.location}
                                  </span>
                                </div>
                              </div>

                              {(isAdmin || !layer.locked) && (
                                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(event) =>
                                      openEditModal(raw, event)
                                    }
                                    className="
                                        flex h-7 w-7
                                        items-center justify-center
                                        rounded-lg
                                        text-[#123c28]/55
                                        transition
                                        hover:bg-white
                                        hover:text-[#123c28]
                                      "
                                    title="Edit peta"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) =>
                                      openDeleteConfirm(raw, event)
                                    }
                                    className="
                                        flex h-7 w-7
                                        items-center justify-center
                                        rounded-lg
                                        text-[#123c28]/55
                                        transition
                                        hover:bg-red-50
                                        hover:text-red-600
                                      "
                                    title="Hapus peta"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </aside>
                )}
              </div>

              {/* =================================================
                  FOOTER
              ================================================== */}
              <div className="border-t border-[#123c28]/10 bg-[#fafbf8] px-5 py-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] font-medium text-[#123c28]/50">
                    <span>{maps.length} peta tersimpan</span>

                    {selectedMap && (
                      <>
                        <span className="mx-2 text-[#123c28]/20">•</span>

                        <span>
                          Lokasi {selectedMap.location || "Tidak tersedia"}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMetadataMap(selectedMapRaw)}
                    disabled={!selectedMapRaw}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-1.5
                      rounded-lg
                      border border-[#123c28]/10
                      bg-white
                      px-3.5 py-2
                      text-[10px]
                      font-bold
                      text-[#123c28]
                      transition
                      hover:bg-[#f3f6ed]
                      disabled:cursor-not-allowed
                      disabled:border-[#123c28]/5
                      disabled:bg-[#fafbf8]
                      disabled:text-[#123c28]/30
                    "
                  >
                    Lihat Metadata
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          NOTICE
      ====================================================== */}
      {notice && (
        <div
          className={`
            fixed bottom-6 right-6
            z-[9998]
            flex max-w-sm
            items-center gap-3
            rounded-2xl
            px-4 py-3.5
            text-xs
            font-medium
            shadow-2xl
            ${
              notice.type === "success"
                ? "bg-[#123c28] text-white"
                : "bg-[#a3483c] text-white"
            }
          `}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}

          <span>{notice.text}</span>
        </div>
      )}

      {/* =====================================================
          METADATA MODAL
      ====================================================== */}
      {metadataMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#123c28]/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                  FIELD & GEOSPATIAL DATA
                </p>

                <h3 className="mt-1 text-lg font-bold tracking-tight text-[#123c28]">
                  Metadata Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-[#f5f7f1]
                  text-[#123c28]/80
                  transition
                  hover:bg-[#123c28]
                  hover:text-white
                "
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* BASIC */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/70">
                  Informasi Umum
                </p>

                <div className="space-y-1 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-3">
                  {[
                    ["Nama", metadataMap.title],
                    ["Lokasi", metadataMap.location],
                    [
                      "Tanggal Survey",
                      new Date(metadataMap.survey_date).toLocaleDateString(
                        "id-ID"
                      ),
                    ],
                    [
                      "Format File",
                      `.${metadataMap.file_format?.toUpperCase()}`,
                    ],
                    ["Ukuran File", formatSize(metadataMap.file_size)],
                    [
                      "Dibuat",
                      new Date(metadataMap.created_at).toLocaleDateString(
                        "id-ID"
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        rounded-xl
                        px-3 py-2
                        text-xs
                        hover:bg-white
                      "
                    >
                      <span className="font-medium text-[#123c28]/70">
                        {label}
                      </span>

                      <span className="max-w-[65%] truncate text-right font-bold text-[#123c28]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GEO METADATA */}
              {metadataMap.geo_metadata ? (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/70">
                    Metadata Geospasial & Raster
                  </p>

                  <div className="space-y-1 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-3">
                    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs hover:bg-white">
                      <span className="font-medium text-[#123c28]/70">
                        Sistem Koordinat (CRS)
                      </span>

                      <span className="max-w-[65%] truncate text-right font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.crs}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs hover:bg-white">
                      <span className="font-medium text-[#123c28]/70">
                        Dimensi Citra
                      </span>

                      <span className="font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.width?.toLocaleString()} ×{" "}
                        {metadataMap.geo_metadata.height?.toLocaleString()}{" "}
                        piksel
                      </span>
                    </div>

                    <div className="rounded-xl px-3 py-2.5 text-xs hover:bg-white transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="font-medium text-[#123c28]/70">
                            Saluran (Bands)
                          </span>
                          <p className="mt-0.5 text-[11px] font-semibold text-[#123c28]">
                            {metadataMap.geo_metadata.band_type ||
                              (metadataMap.geo_metadata.bands === 3
                                ? "Ortho True-Color (3 Saluran RGB)"
                                : metadataMap.geo_metadata.bands === 1
                                ? "Single-Band (Analisis Indeks / Unsur Hara)"
                                : `${metadataMap.geo_metadata.bands} Saluran Multispektral`)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-md bg-[#123c28]/5 px-2 py-0.5 font-mono text-[11px] font-bold text-[#123c28]">
                          {metadataMap.geo_metadata.bands} Saluran ({metadataMap.geo_metadata.dtypes?.join(", ") || "uint8"})
                        </span>
                      </div>

                      {/* Rincian Tiap Band */}
                      {(() => {
                        const bandsList =
                          metadataMap.geo_metadata.band_details &&
                          metadataMap.geo_metadata.band_details.length > 0
                            ? metadataMap.geo_metadata.band_details
                            : Array.from(
                                { length: metadataMap.geo_metadata.bands || 1 },
                                (_, idx) => {
                                  const b = idx + 1;
                                  const dtype =
                                    metadataMap.geo_metadata.dtypes?.[idx] || "uint8";
                                  let label = `Saluran ${b}`;
                                  if (metadataMap.geo_metadata.bands === 3) {
                                    label =
                                      b === 1
                                        ? "Red (Merah)"
                                        : b === 2
                                        ? "Green (Hijau)"
                                        : "Blue (Biru)";
                                  } else if (metadataMap.geo_metadata.bands === 1) {
                                    label = "Nilai Analisis / Indeks";
                                  }
                                  return { band: b, label, dtype };
                                }
                              );

                        return (
                          <div className="mt-2 space-y-1 border-t border-[#123c28]/10 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#123c28]/50">
                              Rincian Saluran
                            </p>
                            <div className="grid grid-cols-1 gap-1">
                              {bandsList.map((item) => {
                                const lower = item.label.toLowerCase();
                                const isRed = lower.includes("red") || lower.includes("merah");
                                const isGreen = lower.includes("green") || lower.includes("hijau");
                                const isBlue = lower.includes("blue") || lower.includes("biru");
                                const isAlpha = lower.includes("alpha");

                                const dotColor = isRed
                                  ? "bg-rose-500"
                                  : isGreen
                                  ? "bg-emerald-500"
                                  : isBlue
                                  ? "bg-sky-500"
                                  : isAlpha
                                  ? "bg-slate-400"
                                  : "bg-amber-500";

                                return (
                                  <div
                                    key={item.band}
                                    className="flex items-center justify-between rounded-lg border border-[#123c28]/10 bg-white/80 px-2.5 py-1 text-[11px]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                                      <span className="font-semibold text-[#123c28]">
                                        Band {item.band}:
                                      </span>
                                      <span className="font-medium text-[#123c28]/80">
                                        {item.label}
                                      </span>
                                    </div>
                                    <span className="rounded bg-[#123c28]/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#123c28]/70">
                                      {item.dtype}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs hover:bg-white">
                      <span className="font-medium text-[#123c28]/70">
                        Driver Raster
                      </span>

                      <span className="font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.driver || "GTiff"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs hover:bg-white">
                      <span className="font-medium text-[#123c28]/70">
                        Format Tiling
                      </span>

                      <span className="font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.is_tiled
                          ? "Tiled (Cloud-Optimized)"
                          : "Strip / Standar"}
                      </span>
                    </div>

                    {metadataMap.geo_metadata.nodata !== undefined &&
                      metadataMap.geo_metadata.nodata !== null && (
                        <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-xs hover:bg-white">
                          <span className="font-medium text-[#123c28]/70">
                            Nilai NoData
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.nodata}
                          </span>
                        </div>
                      )}
                  </div>

                  {metadataMap.geo_metadata.bounds_wgs84 && (
                    <div className="mt-3 rounded-2xl border border-[#123c28]/10 bg-[#f7f8f4] p-3.5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#123c28]/75">
                        Cakupan Wilayah (WGS 84 Bounds)
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-xl border border-[#123c28]/5 bg-white p-2">
                          <span className="block text-[9px] font-semibold text-[#123c28]/60">
                            Bujur Barat (Min Lon)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.min_lon}°
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#123c28]/5 bg-white p-2">
                          <span className="block text-[9px] font-semibold text-[#123c28]/60">
                            Bujur Timur (Max Lon)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.max_lon}°
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#123c28]/5 bg-white p-2">
                          <span className="block text-[9px] font-semibold text-[#123c28]/60">
                            Lintang Selatan (Min Lat)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.min_lat}°
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#123c28]/5 bg-white p-2">
                          <span className="block text-[9px] font-semibold text-[#123c28]/60">
                            Lintang Utara (Max Lat)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.max_lat}°
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] p-4 text-center">
                  <p className="text-xs font-semibold text-[#123c28]/60">
                    Metadata geospasial tidak tersemat pada berkas ini.
                  </p>
                </div>
              )}

              {/* DESCRIPTION */}
              {metadataMap.description && (
                <div className="rounded-2xl border border-[#123c28]/10 bg-[#f7f8f4] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#123c28]/75">
                    Deskripsi
                  </p>

                  <p className="mt-2 text-xs font-medium leading-6 text-[#123c28]/85">
                    {metadataMap.description}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex gap-3 border-t border-[#123c28]/10 bg-[#fafbf8] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  openEditModal(metadataMap);

                  setMetadataMap(null);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#123c28] py-3 text-xs font-semibold text-white transition hover:bg-[#1a5134]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Peta
              </button>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="flex-1 rounded-full border border-[#123c28]/15 bg-white py-3 text-xs font-bold text-[#123c28] transition hover:bg-[#f0f2ed]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT MODAL
      ====================================================== */}
      {editingMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#123c28]/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                  INFORMASI PETA
                </p>

                <h3 className="mt-1 text-lg font-bold tracking-tight text-[#123c28]">
                  Edit Informasi Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-[#f5f7f1]
                  text-[#123c28]/80
                  transition
                  hover:bg-[#123c28]
                  hover:text-white
                "
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              {/* TITLE */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Judul Peta
                </label>

                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      title: event.target.value,
                    })
                  }
                  className={`
                    h-11 w-full
                    rounded-2xl
                    border
                    bg-[#fafbf8]
                    px-4
                    text-sm
                    font-medium
                    text-[#123c28]
                    outline-none
                    transition
                    placeholder:text-[#123c28]/45
                    focus:bg-white
                    ${
                      editErrors.title
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#123c28]/15 focus:border-[#123c28]/40"
                    }
                  `}
                  placeholder="Contoh: Peta Orthomosaic Lahan Padi - Jul 2026"
                />

                {editErrors.title && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    {editErrors.title}
                  </p>
                )}
              </div>

              {/* LOCATION */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Lokasi / Wilayah
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/40" />

                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        location: event.target.value,
                      })
                    }
                    className={`
                      h-11 w-full
                      rounded-2xl
                      border
                      bg-[#fafbf8]
                      pl-10 pr-4
                      text-sm
                      font-medium
                      text-[#123c28]
                      outline-none
                      transition
                      placeholder:text-[#123c28]/45
                      focus:bg-white
                      ${
                        editErrors.location
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#123c28]/15 focus:border-[#123c28]/40"
                      }
                    `}
                    placeholder="Contoh: Desa Sriharjo, Kec. Imogiri, Bantul"
                  />
                </div>

                {editErrors.location && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    {editErrors.location}
                  </p>
                )}
              </div>

              {/* DATE */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Tanggal Survey Drone
                </label>

                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/40" />

                  <input
                    type="date"
                    value={editForm.survey_date}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        survey_date: event.target.value,
                      })
                    }
                    className={`
                      h-11 w-full
                      rounded-2xl
                      border
                      bg-[#fafbf8]
                      pl-10 pr-4
                      text-sm
                      font-medium
                      text-[#123c28]
                      outline-none
                      transition
                      focus:bg-white
                      ${
                        editErrors.survey_date
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#123c28]/15 focus:border-[#123c28]/40"
                      }
                    `}
                  />
                </div>

                {editErrors.survey_date && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    {editErrors.survey_date}
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Deskripsi Tambahan (Opsional)
                </label>

                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border border-[#123c28]/15
                    bg-[#fafbf8]
                    px-4 py-2.5
                    text-sm
                    font-medium
                    text-[#123c28]
                    outline-none
                    transition
                    placeholder:text-[#123c28]/45
                    focus:border-[#123c28]/40
                    focus:bg-white
                  "
                  placeholder="Informasi ketinggian terbang, sensor kamera, dsb..."
                />
              </div>

              {/* ACCESS */}
              <div className="pt-2">
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f3f6ed]">
                    <Lock className="h-3.5 w-3.5 text-[#123c28]" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                    Aturan Akses & Monetisasi DaaS
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* LOCK */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-3.5 transition-colors hover:border-[#123c28]/25 hover:bg-white">
                    <input
                      type="checkbox"
                      checked={editForm.locked_for_free}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          locked_for_free: event.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 rounded border-[#123c28]/30 text-[#123c28] focus:ring-[#123c28]"
                    />

                    <div>
                      <p className="text-xs font-bold text-[#123c28]">
                        Kunci untuk Member Free
                      </p>

                      <p className="mt-0.5 text-[11px] font-medium text-[#123c28]/70">
                        Hanya member berbayar (Tier Desa/Kecamatan) yang dapat
                        mengakses data peta ini
                      </p>
                    </div>
                  </label>

                  {/* PURCHASE */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-3.5 transition-colors hover:border-[#123c28]/25 hover:bg-white">
                    <input
                      type="checkbox"
                      checked={editForm.purchasable}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          purchasable: event.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 rounded border-[#123c28]/30 text-[#123c28] focus:ring-[#123c28]"
                    />

                    <div>
                      <p className="text-xs font-bold text-[#123c28]">
                        Tersedia untuk Pembelian Satuan
                      </p>

                      <p className="mt-0.5 text-[11px] font-medium text-[#123c28]/70">
                        User dapat membeli akses peta ini secara terpisah tanpa
                        langganan
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex gap-3 border-t border-[#123c28]/10 bg-[#fafbf8] px-6 py-4">
              <button
                type="button"
                onClick={submitEdit}
                disabled={isSavingEdit}
                className="
                  flex flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#123c28]
                  py-3
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#1a5134]
                  disabled:opacity-60
                "
              >
                {isSavingEdit && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Simpan Perubahan
              </button>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSavingEdit}
                className="
                  flex-1
                  rounded-full
                  border
                  border-[#123c28]/15
                  bg-white
                  py-3
                  text-xs
                  font-bold
                  text-[#123c28]
                  transition
                  hover:bg-[#f0f2ed]
                "
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE MODAL
      ====================================================== */}
      {deletingMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white shadow-2xl">
            <div className="p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                DELETE DATA
              </p>

              <h3 className="mt-2 text-xl font-bold tracking-tight text-[#123c28]">
                Hapus Peta?
              </h3>

              <p className="mt-3 text-xs font-medium leading-6 text-[#123c28]/75">
                Peta{" "}
                <span className="font-bold text-[#123c28]">
                  &quot;
                  {deletingMap.title}
                  &quot;
                </span>{" "}
                akan dihapus secara permanen.
              </p>

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="
                    flex flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-red-600
                    py-3
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-red-700
                    disabled:opacity-60
                  "
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Hapus
                </button>

                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  disabled={isDeleting}
                  className="
                    flex-1
                    rounded-full
                    border
                    border-[#123c28]/15
                    bg-[#f5f7f1]
                    py-3
                    text-xs
                    font-bold
                    text-[#123c28]
                    transition
                    hover:bg-[#e9ede3]
                  "
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PREMIUM MODAL
      ====================================================== */}
      {toastMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white shadow-2xl">
            {/* PREMIUM HEADER */}
            <div className="relative overflow-hidden bg-[#123c28] px-7 py-8 text-center text-white">
              <div className="absolute -right-10 -top-16 h-36 w-36 rounded-full border border-white/10" />

              <div className="absolute -left-12 bottom-[-70px] h-40 w-40 rounded-full border border-white/5" />

              <button
                type="button"
                onClick={() => setToastMessage("")}
                className="
                  absolute
                  right-4 top-4
                  flex h-8 w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                  text-white/80
                  transition
                  hover:bg-white/20
                  hover:text-white
                "
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d6f347] text-[#123c28]">
                <Crown className="h-6 w-6" />
              </div>

              <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
                PREMIUM ACCESS
              </p>

              <h3 className="relative mt-2 text-2xl font-bold tracking-tight">
                Fitur ini terkunci
              </h3>

              <p className="relative mt-2 text-xs font-medium text-emerald-100">
                Upgrade untuk mendapatkan akses penuh.
              </p>
            </div>

            {/* BODY */}
            <div className="px-7 py-7 text-center">
              <p className="text-sm font-medium leading-6 text-[#123c28]">
                {toastMessage}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/dashboard/subscription"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-[#123c28]
                    px-5 py-3.5
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-[#1a5134]
                  "
                >
                  Lihat Paket Langganan
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setToastMessage("")}
                  className="
                    rounded-full
                    border border-[#123c28]/15
                    bg-[#f5f7f1]
                    px-5 py-3.5
                    text-xs
                    font-bold
                    text-[#123c28]
                    transition
                    hover:bg-[#e9ede3]
                  "
                >
                  Mungkin Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
