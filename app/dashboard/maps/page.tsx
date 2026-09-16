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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
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
        <div className="mx-auto mb-2.5 h-7 w-7 animate-spin rounded-full border-2 border-[#123c28]/10 border-t-[#123c28] sm:mb-3 sm:h-8 sm:w-8" />

        <p className="text-[10px] font-medium text-[#123c28]/45 sm:text-xs">
          Memuat peta...
        </p>
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
        const mapList: MapData[] = data.maps ?? [];

        setMaps(mapList);

        const urlId =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("id")
            : null;

        setSelectedLayer((previous) => {
          if (urlId && mapList.some((map) => map.id === urlId)) {
            return urlId;
          }
          if (previous && mapList.some((map) => map.id === previous)) {
            return previous;
          }
          return mapList[0]?.id || "";
        });
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
    <div
      className="
        min-h-full
        bg-white
        px-3
        py-4
        sm:px-5
        sm:py-5
        lg:px-8
        lg:py-6
      "
    >
      <div className="mx-auto max-w-7xl">
        {/* ===================================================
            PAGE HEADER
        ==================================================== */}

        <header className="mb-3 sm:mb-5">
          <div
            className="
              flex
              flex-col
              gap-3
              xl:flex-row
              xl:items-end
              xl:justify-between
              xl:gap-5
            "
          >
            {/* TITLE */}

            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f3f6ed] sm:h-8 sm:w-8 sm:rounded-xl">
                  <MapIcon className="h-3.5 w-3.5 text-[#123c28] sm:h-4 sm:w-4" />
                </span>

                <span className="text-[8px] font-bold uppercase tracking-[0.17em] text-[#123c28]/70 sm:text-[10px] sm:tracking-[0.2em]">
                  UAV DATA-AS-A-SERVICE PLATFORM
                </span>
              </div>

              <h1 className="text-xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-2xl md:text-3xl">
                Peta & Analisis
                <span className="text-[#1a5134]"> Geospasial</span>
              </h1>
            </div>

            {/* SEARCH */}

            <div className="flex w-full items-center gap-1.5 xl:w-auto">
              <div className="min-w-0 flex-1 xl:w-[420px]">
                <div className="relative">
                  <MapIcon
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-[#123c28]/35
                      sm:left-3.5
                      sm:h-4
                      sm:w-4
                    "
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari peta anda..."
                    className="
                      h-9
                      w-full
                      rounded-full
                      border
                      border-[#123c28]/10
                      bg-[#fafbf8]
                      pl-9
                      pr-9
                      text-[10px]
                      font-medium
                      text-[#123c28]
                      outline-none
                      transition
                      placeholder:text-[#123c28]/40
                      focus:border-[#123c28]/25
                      focus:bg-white
                      focus:ring-2
                      focus:ring-[#123c28]/5
                      sm:h-10
                      sm:pl-10
                      sm:pr-10
                      sm:text-[11px]
                    "
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="
                        absolute
                        right-1.5
                        top-1/2
                        flex
                        h-6
                        w-6
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-full
                        text-[#123c28]/45
                        transition
                        hover:bg-[#f3f6ed]
                        hover:text-[#123c28]
                        sm:right-2
                        sm:h-7
                        sm:w-7
                      "
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
          <div className="mb-2.5 flex items-center justify-between px-0.5 sm:mb-3 sm:px-1">
            <p className="text-[9px] font-medium text-[#123c28]/55 sm:text-[10px]">
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
              className="text-[9px] font-bold text-[#123c28] hover:underline sm:text-[10px]"
            >
              Hapus pencarian
            </button>
          </div>
        )}

        {/* ===================================================
            MAIN WORKSPACE
        ==================================================== */}

        <div className="w-full">
          <div className="w-full">
            <div className="overflow-hidden rounded-[16px] border border-[#123c28]/10 bg-white shadow-sm sm:rounded-[20px]">
              {/* =================================================
                  ACTIVE LAYER HEADER
              ================================================== */}

              <div className="border-b border-[#123c28]/10 px-3.5 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
                  {/* MAP IDENTITY */}

                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3f6ed] sm:h-10 sm:w-10 sm:rounded-xl">
                      <ScanLine className="h-3.5 w-3.5 text-[#123c28] sm:h-4 sm:w-4" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-[11px] font-bold leading-4 text-[#123c28] sm:text-sm sm:leading-5 md:text-[15px]">
                        {selectedMap
                          ? selectedMap.name
                          : "Belum ada layer dipilih"}
                      </h3>

                      {selectedMap ? (
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8px] font-medium text-[#123c28]/50 sm:mt-1 sm:gap-x-2.5 sm:gap-y-1 sm:text-[10px]">
                          <span>
                            {selectedMap.format?.toUpperCase() || "UNKNOWN"}
                          </span>

                          <span className="text-[#123c28]/20">•</span>

                          <span>{selectedMap.size} MB</span>

                          <span className="text-[#123c28]/20">•</span>

                          <span>Survey {selectedMap.date}</span>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-[8px] font-medium text-[#123c28]/45 sm:mt-1 sm:text-[10px]">
                          Pilih layer untuk melihat data pemetaan
                        </p>
                      )}
                    </div>
                  </div>

                  {/* MAP ACTIONS */}

                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {/* DOWNLOAD */}

                    <button
                      type="button"
                      onClick={handleDownloadAnalysis}
                      disabled={isDownloadingAnalysis}
                      className={`
                        inline-flex
                        h-8
                        items-center
                        gap-1
                        rounded-full
                        px-2.5
                        text-[9px]
                        font-bold
                        transition
                        sm:h-10
                        sm:gap-2
                        sm:px-4
                        sm:text-[11px]
                        ${
                          !isAdmin && user?.tier === "free"
                            ? "cursor-not-allowed border border-[#123c28]/10 bg-[#fafbf8] text-[#123c28]/35"
                            : "bg-[#123c28] text-white hover:bg-[#1a5134]"
                        }
                      `}
                    >
                      {!isAdmin && user?.tier === "free" ? (
                        <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      ) : isDownloadingAnalysis ? (
                        <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
                      ) : (
                        <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      )}

                      <span>
                        {isDownloadingAnalysis
                          ? "Menyiapkan..."
                          : "Download Analisa"}
                      </span>
                    </button>

                    {/* MAP CONTROLS */}

                    <div className="flex h-8 items-center gap-0 rounded-full border border-[#123c28]/10 bg-white p-0.5 sm:h-10 sm:gap-0.5 sm:p-1">
                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={!selectedMapRaw}
                        title="Zoom In"
                        aria-label="Zoom In"
                        className="
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-full
                          text-[#123c28]/70
                          transition
                          hover:bg-[#f3f6ed]
                          hover:text-[#123c28]
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                          sm:h-8
                          sm:w-8
                        "
                      >
                        <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={!selectedMapRaw}
                        title="Zoom Out"
                        aria-label="Zoom Out"
                        className="
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-full
                          text-[#123c28]/70
                          transition
                          hover:bg-[#f3f6ed]
                          hover:text-[#123c28]
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                          sm:h-8
                          sm:w-8
                        "
                      >
                        <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-full
                          text-[#123c28]/70
                          transition
                          hover:bg-[#f3f6ed]
                          hover:text-[#123c28]
                          sm:h-8
                          sm:w-8
                        "
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  isFullscreen
                    ? "h-screen w-screen"
                    : "h-[420px] sm:h-[560px] lg:h-[620px]"
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
                    FLOATING TOGGLE BUTTON
                ================================================== */}

                {!isLayerPanelOpen && (
                  <button
                    type="button"
                    onClick={() => setIsLayerPanelOpen(true)}
                    className="
                      absolute
                      left-2
                      top-2
                      z-30
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border
                      border-[#123c28]/15
                      bg-white/95
                      px-2.5
                      py-1.5
                      text-[9px]
                      font-bold
                      text-[#123c28]
                      shadow-lg
                      backdrop-blur-md
                      transition
                      hover:bg-[#f3f6ed]
                      hover:shadow-xl
                      sm:left-3
                      sm:top-3
                      sm:gap-2
                      sm:px-3.5
                      sm:py-2
                      sm:text-xs
                    "
                  >
                    <Layers className="h-3 w-3 text-[#123c28] sm:h-3.5 sm:w-3.5" />

                    <span>Daftar Peta</span>

                    <span className="rounded-full bg-[#123c28]/10 px-1.5 py-0.5 text-[8px] font-extrabold text-[#123c28] sm:text-[9px]">
                      {maps.length}
                    </span>
                  </button>
                )}

                {/* =================================================
                    FLOATING MAP LAYERS PANEL
                ================================================== */}

                {isLayerPanelOpen && (
                  <aside
                    className="
                      absolute
                      left-2
                      top-2
                      z-30
                      flex
                      max-h-[calc(100%-36px)]
                      w-[220px]
                      flex-col
                      overflow-hidden
                      rounded-xl
                      border
                      border-[#123c28]/15
                      bg-white/95
                      shadow-xl
                      backdrop-blur-md
                      animate-in
                      fade-in
                      slide-in-from-left-2
                      duration-200
                      sm:left-3
                      sm:top-3
                      sm:max-h-[calc(100%-100px)]
                      sm:w-[272px]
                      sm:rounded-2xl
                    "
                  >
                    {/* PANEL HEADER */}

                    <div className="border-b border-[#123c28]/10 px-2.5 py-2.5 sm:px-3 sm:py-3">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-[7px] font-bold uppercase tracking-[0.15em] text-[#123c28]/55 sm:text-[8px] sm:tracking-[0.16em]">
                            MAP LAYERS
                          </p>

                          <h2 className="mt-0.5 text-[11px] font-bold text-[#123c28] sm:text-[12px]">
                            Pilih Peta Anda
                          </h2>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="shrink-0 text-[8px] font-semibold text-[#123c28]/50 sm:text-[9px]">
                            {searchQuery
                              ? `${filteredMapLayers.length} / ${maps.length}`
                              : `${maps.length} Peta`}
                          </span>

                          <button
                            type="button"
                            onClick={() => setIsLayerPanelOpen(false)}
                            className="
                              flex
                              h-6
                              w-6
                              items-center
                              justify-center
                              rounded-md
                              text-[#123c28]/60
                              transition
                              hover:bg-[#123c28]/10
                              hover:text-[#123c28]
                              sm:h-7
                              sm:w-7
                              sm:rounded-lg
                            "
                            title="Sembunyikan daftar peta"
                          >
                            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* LAYERS LIST */}

                    <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5 overscroll-contain sm:space-y-2 sm:p-2">
                      {/* LOADING */}

                      {loading && (
                        <div className="rounded-xl bg-[#f7f8f4] px-3 py-6 text-center sm:rounded-2xl sm:px-4 sm:py-8">
                          <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-[#123c28]/20 border-t-[#123c28] sm:mb-3 sm:h-6 sm:w-6" />

                          <p className="text-[10px] font-semibold text-[#123c28]/70 sm:text-xs">
                            Memuat data peta...
                          </p>
                        </div>
                      )}

                      {/* ERROR */}

                      {!loading && error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] font-medium text-red-700 sm:rounded-2xl sm:p-4 sm:text-xs">
                          {error}
                        </div>
                      )}

                      {/* EMPTY */}

                      {!loading && !error && maps.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] px-3 py-6 text-center sm:rounded-2xl sm:px-4 sm:py-8">
                          <MapIcon className="mx-auto h-4 w-4 text-[#123c28]/45 sm:h-5 sm:w-5" />

                          <p className="mt-2 text-[10px] font-bold text-[#123c28] sm:mt-3 sm:text-xs">
                            Belum ada peta
                          </p>

                          <p className="mt-1 text-[8px] font-medium leading-4 text-[#123c28]/60 sm:text-[10px] sm:leading-5">
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
                          <div className="rounded-xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] px-3 py-6 text-center sm:rounded-2xl sm:px-4 sm:py-8">
                            <MapIcon className="mx-auto h-4 w-4 text-[#123c28]/40 sm:h-5 sm:w-5" />

                            <p className="mt-2 text-[10px] font-bold text-[#123c28] sm:mt-3 sm:text-xs">
                              Peta tidak ditemukan
                            </p>

                            <p className="mt-1 text-[8px] font-medium leading-4 text-[#123c28]/60 sm:text-[10px] sm:leading-5">
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
                                if (selectedLayer === layer.id) {
                                  mapRef.current?.resetView();
                                } else {
                                  setSelectedLayer(layer.id);
                                }
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
                                  if (selectedLayer === layer.id) {
                                    mapRef.current?.resetView();
                                  } else {
                                    setSelectedLayer(layer.id);
                                  }
                                }
                              }
                            }}
                            className={`
                                group
                                relative
                                overflow-hidden
                                rounded-lg
                                border
                                p-2.5
                                transition-all
                                duration-200
                                select-none
                                sm:rounded-xl
                                sm:p-3
                                ${
                                  active
                                    ? "border-emerald-500/30 bg-gradient-to-br from-[#1b4d35] via-[#123c28] to-[#0c271a] text-white shadow-[0_10px_22px_-7px_rgba(18,60,40,0.42),0_3px_10px_-2px_rgba(18,60,40,0.28),inset_0_1px_1px_rgba(255,255,255,0.22)] ring-1 ring-white/10 -translate-y-0.5"
                                    : "border-gray-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-md"
                                }
                                ${
                                  layer.locked
                                    ? "cursor-not-allowed opacity-70"
                                    : "cursor-pointer"
                                }
                              `}
                          >
                            {/* Ambient */}

                            {active && (
                              <>
                                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-400/15 blur-xl sm:-right-10 sm:-top-10 sm:h-28 sm:w-28" />

                                <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-black/25 blur-lg sm:-bottom-10 sm:-left-10 sm:h-24 sm:w-24" />
                              </>
                            )}

                            {/* Card Header */}

                            <div className="relative z-10 flex items-start justify-between gap-1.5 sm:gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1">
                                  <h3
                                    className={`break-words whitespace-normal text-[9px] font-bold leading-snug sm:text-[10px] md:text-xs ${
                                      active
                                        ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {layer.name}
                                  </h3>

                                  {layer.locked && (
                                    <span
                                      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-[6px] font-bold sm:px-1.5 sm:text-[8px] ${
                                        active
                                          ? "border border-white/20 bg-white/15 text-amber-300"
                                          : "border border-amber-200/60 bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      <Lock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                      Pro
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}

                              {(isAdmin || !layer.locked) && (
                                <div className="flex shrink-0 items-center gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(event) =>
                                      openEditModal(raw, event)
                                    }
                                    className={`flex h-5 w-5 items-center justify-center rounded-md transition sm:h-6 sm:w-6 ${
                                      active
                                        ? "text-white/70 hover:bg-white/15 hover:text-white"
                                        : "text-gray-400 hover:bg-white hover:text-gray-800 hover:shadow-xs"
                                    }`}
                                    title="Edit peta"
                                  >
                                    <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) =>
                                      openDeleteConfirm(raw, event)
                                    }
                                    className={`flex h-5 w-5 items-center justify-center rounded-md transition sm:h-6 sm:w-6 ${
                                      active
                                        ? "text-white/70 hover:bg-red-500/30 hover:text-red-200"
                                        : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    }`}
                                    title="Hapus peta"
                                  >
                                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* META */}

                            <div className="relative z-10 mt-1.5 flex flex-col gap-0.5 text-[8px] sm:mt-2 sm:gap-1 sm:text-[9px] md:text-[10px]">
                              {/* DATE */}

                              <div
                                className={`flex items-center gap-1 font-medium ${
                                  active ? "text-white/85" : "text-gray-500"
                                }`}
                              >
                                <svg
                                  className={`h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 ${
                                    active
                                      ? "text-white"
                                      : "text-emerald-700/80"
                                  }`}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="2"
                                    y="3"
                                    width="12"
                                    height="11"
                                    rx="2.5"
                                  />

                                  <path d="M5 1.5v2.5M11 1.5v2.5M2 6.5h12" />

                                  <circle
                                    cx="5.5"
                                    cy="9.5"
                                    r="0.75"
                                    fill="currentColor"
                                  />

                                  <circle
                                    cx="8"
                                    cy="9.5"
                                    r="0.75"
                                    fill="currentColor"
                                  />

                                  <circle
                                    cx="10.5"
                                    cy="9.5"
                                    r="0.75"
                                    fill="currentColor"
                                  />
                                </svg>

                                <span className="whitespace-normal break-words">
                                  {layer.date}
                                </span>
                              </div>

                              {/* LOCATION */}

                              <div
                                className={`flex items-start gap-1 font-medium ${
                                  active ? "text-white/95" : "text-gray-600"
                                }`}
                              >
                                <svg
                                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 ${
                                    active
                                      ? "text-white"
                                      : "text-emerald-700/80"
                                  }`}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M8 14.5s-4.5-4-4.5-7.5a4.5 4.5 0 1 1 9 0c0 3.5-4.5 7.5-4.5 7.5z" />

                                  <circle cx="8" cy="7" r="1.75" />
                                </svg>

                                <span className="whitespace-normal break-words leading-tight">
                                  {layer.location}
                                </span>
                              </div>
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

              <div className="border-t border-[#123c28]/10 bg-[#fafbf8] px-3.5 py-2.5 sm:px-5 sm:py-3.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0 text-[8px] font-medium text-[#123c28]/50 sm:text-[10px]">
                    <span>{maps.length} peta tersimpan</span>

                    {selectedMap && (
                      <>
                        <span className="mx-1.5 text-[#123c28]/20 sm:mx-2">
                          •
                        </span>

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
                      w-full
                      items-center
                      justify-center
                      gap-1
                      rounded-lg
                      border
                      border-[#123c28]/10
                      bg-white
                      px-3
                      py-1.5
                      text-[9px]
                      font-bold
                      text-[#123c28]
                      transition
                      hover:bg-[#f3f6ed]
                      disabled:cursor-not-allowed
                      disabled:border-[#123c28]/5
                      disabled:bg-[#fafbf8]
                      disabled:text-[#123c28]/30
                      sm:w-auto
                      sm:gap-1.5
                      sm:px-3.5
                      sm:py-2
                      sm:text-[10px]
                    "
                  >
                    Lihat Metadata
                    <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
            fixed
            bottom-3
            left-3
            right-3
            z-[9998]
            flex
            items-center
            gap-2.5
            rounded-xl
            px-3
            py-2.5
            text-[10px]
            font-medium
            shadow-2xl
            sm:bottom-6
            sm:left-auto
            sm:right-6
            sm:max-w-sm
            sm:gap-3
            sm:rounded-2xl
            sm:px-4
            sm:py-3.5
            sm:text-xs
            ${
              notice.type === "success"
                ? "bg-[#123c28] text-white"
                : "bg-[#a3483c] text-white"
            }
          `}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          )}

          <span className="min-w-0">{notice.text}</span>
        </div>
      )}

      {/* =====================================================
          METADATA MODAL
      ====================================================== */}

      {metadataMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-2.5 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-[22px] border border-[#123c28]/15 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[28px]">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#123c28]/10 px-4 py-3.5 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#123c28]/75 sm:text-[10px] sm:tracking-[0.2em]">
                  FIELD & GEOSPATIAL DATA
                </p>

                <h3 className="mt-0.5 text-base font-bold tracking-tight text-[#123c28] sm:mt-1 sm:text-lg">
                  Metadata Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#f5f7f1]
                  text-[#123c28]/80
                  transition
                  hover:bg-[#123c28]
                  hover:text-white
                  sm:h-9
                  sm:w-9
                "
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* CONTENT */}

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
              {/* BASIC */}

              <div>
                <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/70 sm:mb-2 sm:text-[10px] sm:tracking-[0.16em]">
                  Informasi Umum
                </p>

                <div className="space-y-0.5 rounded-xl border border-[#123c28]/10 bg-[#fafbf8] p-2 sm:space-y-1 sm:rounded-2xl sm:p-3">
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
                          gap-3
                          rounded-lg
                          px-2.5
                          py-1.5
                          text-[10px]
                          hover:bg-white
                          sm:gap-4
                          sm:rounded-xl
                          sm:px-3
                          sm:py-2
                          sm:text-xs
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
                  <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/70 sm:mb-2 sm:text-[10px] sm:tracking-[0.16em]">
                    Metadata Geospasial & Raster
                  </p>

                  <div className="space-y-1 rounded-xl border border-[#123c28]/10 bg-[#fafbf8] p-2 sm:rounded-2xl sm:p-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[10px] hover:bg-white sm:gap-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                      <span className="font-medium text-[#123c28]/70">
                        Sistem Koordinat (CRS)
                      </span>

                      <span className="max-w-[65%] truncate text-right font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.crs}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[10px] hover:bg-white sm:gap-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                      <span className="font-medium text-[#123c28]/70">
                        Dimensi Citra
                      </span>

                      <span className="text-right font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.width?.toLocaleString()} ×{" "}
                        {metadataMap.geo_metadata.height?.toLocaleString()}{" "}
                        piksel
                      </span>
                    </div>

                    <div className="rounded-lg px-2.5 py-2 text-[10px] transition-colors hover:bg-white sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <span className="font-medium text-[#123c28]/70">
                            Saluran (Bands)
                          </span>

                          <p className="mt-0.5 text-[9px] font-semibold text-[#123c28] sm:text-[11px]">
                            {metadataMap.geo_metadata.band_type ||
                              (metadataMap.geo_metadata.bands === 3
                                ? "Ortho True-Color (3 Saluran RGB)"
                                : metadataMap.geo_metadata.bands === 1
                                ? "Single-Band (Analisis Indeks / Unsur Hara)"
                                : `${metadataMap.geo_metadata.bands} Saluran Multispektral`)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-md bg-[#123c28]/5 px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#123c28] sm:px-2 sm:text-[11px]">
                          {metadataMap.geo_metadata.bands} Saluran (
                          {metadataMap.geo_metadata.dtypes?.join(", ") ||
                            "uint8"}
                          )
                        </span>
                      </div>

                      {/* BAND DETAILS */}

                      {(() => {
                        const bandsList =
                          metadataMap.geo_metadata.band_details &&
                          metadataMap.geo_metadata.band_details.length > 0
                            ? metadataMap.geo_metadata.band_details
                            : Array.from(
                                {
                                  length: metadataMap.geo_metadata.bands || 1,
                                },
                                (_, idx) => {
                                  const b = idx + 1;

                                  const dtype =
                                    metadataMap.geo_metadata.dtypes?.[idx] ||
                                    "uint8";

                                  let label = `Saluran ${b}`;

                                  if (metadataMap.geo_metadata.bands === 3) {
                                    label =
                                      b === 1
                                        ? "Red (Merah)"
                                        : b === 2
                                        ? "Green (Hijau)"
                                        : "Blue (Biru)";
                                  } else if (
                                    metadataMap.geo_metadata.bands === 1
                                  ) {
                                    label = "Nilai Analisis / Indeks";
                                  }

                                  return {
                                    band: b,
                                    label,
                                    dtype,
                                  };
                                }
                              );

                        return (
                          <div className="mt-1.5 space-y-1 border-t border-[#123c28]/10 pt-1.5 sm:mt-2 sm:pt-2">
                            <p className="text-[8px] font-bold uppercase tracking-wider text-[#123c28]/50 sm:text-[10px]">
                              Rincian Saluran
                            </p>

                            <div className="grid grid-cols-1 gap-1">
                              {bandsList.map((item) => {
                                const lower = item.label.toLowerCase();

                                const isRed =
                                  lower.includes("red") ||
                                  lower.includes("merah");

                                const isGreen =
                                  lower.includes("green") ||
                                  lower.includes("hijau");

                                const isBlue =
                                  lower.includes("blue") ||
                                  lower.includes("biru");

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
                                    className="flex items-center justify-between rounded-md border border-[#123c28]/10 bg-white/80 px-2 py-1 text-[8px] sm:rounded-lg sm:px-2.5 sm:text-[11px]"
                                  >
                                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                      <span
                                        className={`h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${dotColor}`}
                                      />

                                      <span className="font-semibold text-[#123c28]">
                                        Band {item.band}:
                                      </span>

                                      <span className="truncate font-medium text-[#123c28]/80">
                                        {item.label}
                                      </span>
                                    </div>

                                    <span className="ml-1 shrink-0 rounded bg-[#123c28]/5 px-1 py-0.5 font-mono text-[7px] font-medium text-[#123c28]/70 sm:px-1.5 sm:text-[10px]">
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

                    <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[10px] hover:bg-white sm:gap-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                      <span className="font-medium text-[#123c28]/70">
                        Driver Raster
                      </span>

                      <span className="font-bold text-[#123c28]">
                        {metadataMap.geo_metadata.driver || "GTiff"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[10px] hover:bg-white sm:gap-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
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
                        <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[10px] hover:bg-white sm:gap-4 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
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
                    <div className="mt-2.5 rounded-xl border border-[#123c28]/10 bg-[#f7f8f4] p-2.5 sm:mt-3 sm:rounded-2xl sm:p-3.5">
                      <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:mb-2 sm:text-[10px] sm:tracking-[0.15em]">
                        Cakupan Wilayah (WGS 84 Bounds)
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 text-[9px] sm:gap-2 sm:text-[11px]">
                        <div className="rounded-lg border border-[#123c28]/5 bg-white p-1.5 sm:rounded-xl sm:p-2">
                          <span className="block text-[7px] font-semibold text-[#123c28]/60 sm:text-[9px]">
                            Bujur Barat (Min Lon)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.min_lon}°
                          </span>
                        </div>

                        <div className="rounded-lg border border-[#123c28]/5 bg-white p-1.5 sm:rounded-xl sm:p-2">
                          <span className="block text-[7px] font-semibold text-[#123c28]/60 sm:text-[9px]">
                            Bujur Timur (Max Lon)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.max_lon}°
                          </span>
                        </div>

                        <div className="rounded-lg border border-[#123c28]/5 bg-white p-1.5 sm:rounded-xl sm:p-2">
                          <span className="block text-[7px] font-semibold text-[#123c28]/60 sm:text-[9px]">
                            Lintang Selatan (Min Lat)
                          </span>

                          <span className="font-bold text-[#123c28]">
                            {metadataMap.geo_metadata.bounds_wgs84.min_lat}°
                          </span>
                        </div>

                        <div className="rounded-lg border border-[#123c28]/5 bg-white p-1.5 sm:rounded-xl sm:p-2">
                          <span className="block text-[7px] font-semibold text-[#123c28]/60 sm:text-[9px]">
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
                <div className="rounded-xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] p-3 text-center sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] font-semibold text-[#123c28]/60 sm:text-xs">
                    Metadata geospasial tidak tersemat pada berkas ini.
                  </p>
                </div>
              )}

              {/* DESCRIPTION */}

              {metadataMap.description && (
                <div className="rounded-xl border border-[#123c28]/10 bg-[#f7f8f4] p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:text-[10px] sm:tracking-[0.15em]">
                    Deskripsi
                  </p>

                  <p className="mt-1.5 text-[10px] font-medium leading-5 text-[#123c28]/85 sm:mt-2 sm:text-xs sm:leading-6">
                    {metadataMap.description}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex gap-2 border-t border-[#123c28]/10 bg-[#fafbf8] px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => {
                  openEditModal(metadataMap);

                  setMetadataMap(null);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#123c28] py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#1a5134] sm:gap-2 sm:py-3 sm:text-xs"
              >
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Edit Peta
              </button>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="flex-1 rounded-full border border-[#123c28]/15 bg-white py-2.5 text-[10px] font-bold text-[#123c28] transition hover:bg-[#f0f2ed] sm:py-3 sm:text-xs"
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-2.5 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-[22px] border border-[#123c28]/15 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[28px]">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#123c28]/10 px-4 py-3.5 sm:px-6 sm:py-5">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#123c28]/75 sm:text-[10px] sm:tracking-[0.2em]">
                  INFORMASI PETA
                </p>

                <h3 className="mt-0.5 text-base font-bold tracking-tight text-[#123c28] sm:mt-1 sm:text-lg">
                  Edit Informasi Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-[#f5f7f1]
                  text-[#123c28]/80
                  transition
                  hover:bg-[#123c28]
                  hover:text-white
                  sm:h-9
                  sm:w-9
                "
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* CONTENT */}

            <div className="space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
              {/* TITLE */}

              <div>
                <label className="mb-1 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.16em]">
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
                    h-9
                    w-full
                    rounded-xl
                    border
                    bg-[#fafbf8]
                    px-3
                    text-[11px]
                    font-medium
                    text-[#123c28]
                    outline-none
                    transition
                    placeholder:text-[#123c28]/45
                    focus:bg-white
                    sm:h-11
                    sm:rounded-2xl
                    sm:px-4
                    sm:text-sm
                    ${
                      editErrors.title
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#123c28]/15 focus:border-[#123c28]/40"
                    }
                  `}
                  placeholder="Contoh: Peta Orthomosaic Lahan Padi - Jul 2026"
                />

                {editErrors.title && (
                  <p className="mt-1 text-[10px] font-semibold text-red-600 sm:mt-1.5 sm:text-xs">
                    {editErrors.title}
                  </p>
                )}
              </div>

              {/* LOCATION */}

              <div>
                <label className="mb-1 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.16em]">
                  Lokasi / Wilayah
                </label>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/40 sm:left-3.5 sm:h-4 sm:w-4" />

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
                      h-9
                      w-full
                      rounded-xl
                      border
                      bg-[#fafbf8]
                      pl-9
                      pr-3
                      text-[11px]
                      font-medium
                      text-[#123c28]
                      outline-none
                      transition
                      placeholder:text-[#123c28]/45
                      focus:bg-white
                      sm:h-11
                      sm:rounded-2xl
                      sm:pl-10
                      sm:pr-4
                      sm:text-sm
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
                  <p className="mt-1 text-[10px] font-semibold text-red-600 sm:mt-1.5 sm:text-xs">
                    {editErrors.location}
                  </p>
                )}
              </div>

              {/* DATE */}

              <div>
                <label className="mb-1 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.16em]">
                  Tanggal Survey Drone
                </label>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/40 sm:left-3.5 sm:h-4 sm:w-4" />

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
                      h-9
                      w-full
                      rounded-xl
                      border
                      bg-[#fafbf8]
                      pl-9
                      pr-3
                      text-[11px]
                      font-medium
                      text-[#123c28]
                      outline-none
                      transition
                      focus:bg-white
                      sm:h-11
                      sm:rounded-2xl
                      sm:pl-10
                      sm:pr-4
                      sm:text-sm
                      ${
                        editErrors.survey_date
                          ? "border-red-400 focus:border-red-500"
                          : "border-[#123c28]/15 focus:border-[#123c28]/40"
                      }
                    `}
                  />
                </div>

                {editErrors.survey_date && (
                  <p className="mt-1 text-[10px] font-semibold text-red-600 sm:mt-1.5 sm:text-xs">
                    {editErrors.survey_date}
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-1 block text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.16em]">
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
                    rounded-xl
                    border
                    border-[#123c28]/15
                    bg-[#fafbf8]
                    px-3
                    py-2
                    text-[11px]
                    font-medium
                    text-[#123c28]
                    outline-none
                    transition
                    placeholder:text-[#123c28]/45
                    focus:border-[#123c28]/40
                    focus:bg-white
                    sm:rounded-2xl
                    sm:px-4
                    sm:py-2.5
                    sm:text-sm
                  "
                  placeholder="Informasi ketinggian terbang, sensor kamera, dsb..."
                />
              </div>

              {/* ACCESS */}

              <div className="pt-1 sm:pt-2">
                <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5 sm:gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f3f6ed] sm:h-6 sm:w-6 sm:rounded-lg">
                    <Lock className="h-3 w-3 text-[#123c28] sm:h-3.5 sm:w-3.5" />
                  </div>

                  <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#123c28]/75 sm:text-[10px] sm:tracking-[0.16em]">
                    Aturan Akses & Monetisasi DaaS
                  </span>
                </div>

                <div className="space-y-2">
                  {/* LOCK */}

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#123c28]/10 bg-[#fafbf8] p-2.5 transition-colors hover:border-[#123c28]/25 hover:bg-white sm:gap-3 sm:rounded-2xl sm:p-3.5">
                    <input
                      type="checkbox"
                      checked={editForm.locked_for_free}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          locked_for_free: event.target.checked,
                        })
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-[#123c28]/30 text-[#123c28] focus:ring-[#123c28] sm:h-4 sm:w-4"
                    />

                    <div>
                      <p className="text-[10px] font-bold text-[#123c28] sm:text-xs">
                        Kunci untuk Member Free
                      </p>

                      <p className="mt-0.5 text-[9px] font-medium leading-4 text-[#123c28]/70 sm:text-[11px] sm:leading-normal">
                        Hanya member berbayar (Tier Desa/Kecamatan) yang dapat
                        mengakses data peta ini
                      </p>
                    </div>
                  </label>

                  {/* PURCHASE */}

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#123c28]/10 bg-[#fafbf8] p-2.5 transition-colors hover:border-[#123c28]/25 hover:bg-white sm:gap-3 sm:rounded-2xl sm:p-3.5">
                    <input
                      type="checkbox"
                      checked={editForm.purchasable}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          purchasable: event.target.checked,
                        })
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-[#123c28]/30 text-[#123c28] focus:ring-[#123c28] sm:h-4 sm:w-4"
                    />

                    <div>
                      <p className="text-[10px] font-bold text-[#123c28] sm:text-xs">
                        Tersedia untuk Pembelian Satuan
                      </p>

                      <p className="mt-0.5 text-[9px] font-medium leading-4 text-[#123c28]/70 sm:text-[11px] sm:leading-normal">
                        User dapat membeli akses peta ini secara terpisah tanpa
                        langganan
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex gap-2 border-t border-[#123c28]/10 bg-[#fafbf8] px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={submitEdit}
                disabled={isSavingEdit}
                className="
                  flex
                  flex-1
                  items-center
                  justify-center
                  gap-1.5
                  rounded-full
                  bg-[#123c28]
                  py-2.5
                  text-[10px]
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#1a5134]
                  disabled:opacity-60
                  sm:gap-2
                  sm:py-3
                  sm:text-xs
                "
              >
                {isSavingEdit && (
                  <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
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
                  py-2.5
                  text-[10px]
                  font-bold
                  text-[#123c28]
                  transition
                  hover:bg-[#f0f2ed]
                  sm:py-3
                  sm:text-xs
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-2.5 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-[22px] border border-[#123c28]/15 bg-white shadow-2xl sm:rounded-[28px]">
            <div className="p-5 text-center sm:p-7">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 sm:h-14 sm:w-14">
                <AlertTriangle className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
              </div>

              <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.18em] text-[#123c28]/75 sm:mt-5 sm:text-[10px] sm:tracking-[0.2em]">
                DELETE DATA
              </p>

              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-[#123c28] sm:mt-2 sm:text-xl">
                Hapus Peta?
              </h3>

              <p className="mt-2 text-[10px] font-medium leading-5 text-[#123c28]/75 sm:mt-3 sm:text-xs sm:leading-6">
                Peta{" "}
                <span className="font-bold text-[#123c28]">
                  &quot;
                  {deletingMap.title}
                  &quot;
                </span>{" "}
                akan dihapus secara permanen.
              </p>

              <div className="mt-5 flex gap-2.5 sm:mt-7 sm:gap-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-1.5
                    rounded-full
                    bg-red-600
                    py-2.5
                    text-[10px]
                    font-bold
                    text-white
                    transition
                    hover:bg-red-700
                    disabled:opacity-60
                    sm:gap-2
                    sm:py-3
                    sm:text-xs
                  "
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                    py-2.5
                    text-[10px]
                    font-bold
                    text-[#123c28]
                    transition
                    hover:bg-[#e9ede3]
                    sm:py-3
                    sm:text-xs
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-2.5 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-[#123c28]/15 bg-white shadow-2xl sm:rounded-[28px]">
            {/* PREMIUM HEADER */}

            <div className="relative overflow-hidden bg-[#123c28] px-5 py-6 text-center text-white sm:px-7 sm:py-8">
              <div className="absolute -right-8 -top-12 h-28 w-28 rounded-full border border-white/10 sm:-right-10 sm:-top-16 sm:h-36 sm:w-36" />

              <div className="absolute -left-10 bottom-[-55px] h-32 w-32 rounded-full border border-white/5 sm:-left-12 sm:bottom-[-70px] sm:h-40 sm:w-40" />

              <button
                type="button"
                onClick={() => setToastMessage("")}
                className="
                  absolute
                  right-3
                  top-3
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                  text-white/80
                  transition
                  hover:bg-white/20
                  hover:text-white
                  sm:right-4
                  sm:top-4
                  sm:h-8
                  sm:w-8
                "
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#d6f347] text-[#123c28] sm:h-14 sm:w-14">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <p className="relative mt-4 text-[8px] font-bold uppercase tracking-[0.2em] text-white/90 sm:mt-5 sm:text-[10px] sm:tracking-[0.22em]">
                PREMIUM ACCESS
              </p>

              <h3 className="relative mt-1.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-2xl">
                Fitur ini terkunci
              </h3>

              <p className="relative mt-1.5 text-[10px] font-medium text-emerald-100 sm:mt-2 sm:text-xs">
                Upgrade untuk mendapatkan akses penuh.
              </p>
            </div>

            {/* BODY */}

            <div className="px-5 py-5 text-center sm:px-7 sm:py-7">
              <p className="text-xs font-medium leading-5 text-[#123c28] sm:text-sm sm:leading-6">
                {toastMessage}
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:gap-2.5">
                <Link
                  href="/dashboard/subscription"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-1.5
                    rounded-full
                    bg-[#123c28]
                    px-4
                    py-3
                    text-[10px]
                    font-bold
                    text-white
                    transition
                    hover:bg-[#1a5134]
                    sm:gap-2
                    sm:px-5
                    sm:py-3.5
                    sm:text-xs
                  "
                >
                  Lihat Paket Langganan
                  <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setToastMessage("")}
                  className="
                    rounded-full
                    border
                    border-[#123c28]/15
                    bg-[#f5f7f1]
                    px-4
                    py-3
                    text-[10px]
                    font-bold
                    text-[#123c28]
                    transition
                    hover:bg-[#e9ede3]
                    sm:px-5
                    sm:py-3.5
                    sm:text-xs
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
