"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Settings,
  Info,
  X,
  Crown,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Database,
  MapPin,
  Leaf,
  ScanLine,
  Compass,
} from "lucide-react";

import type { MapHandle } from "@/components/MapDisplay";

/* =========================================================
   MAP DISPLAY
========================================================= */

type MapDisplayProps = {
  mapId?: string;
  token?: string;
  mapFormat?: string;
  mapTitle?: string;
  mapLocation?: string;
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
  created_at: string;
}

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/* =========================================================
   PAGE
========================================================= */

export default function MapsPage() {
  const { user } = useUserRole();

  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedLayer, setSelectedLayer] = useState("");
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Upgrade modal */
  const [toastMessage, setToastMessage] = useState("");

  /* Action notice */
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setNotice({ type, text });

    if (noticeTimeout.current) {
      clearTimeout(noticeTimeout.current);
    }

    noticeTimeout.current = setTimeout(() => {
      setNotice(null);
    }, 3000);
  };

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
    description: "",
  });

  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editErrors, setEditErrors] = useState<{
    title?: string;
    location?: string;
  }>({});

  /* Delete */
  const [deletingMap, setDeletingMap] = useState<MapData | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  /* Export */
  const [isExporting, setIsExporting] = useState(false);

  const triggerToast = (message: string) => setToastMessage(message);

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

        setSelectedLayer((previous) =>
          mapList.find((map) => map.id === previous)
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
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaps();

    return () => {
      if (noticeTimeout.current) {
        clearTimeout(noticeTimeout.current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     FULLSCREEN
  ========================================================== */

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", handler);

    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* =========================================================
     USER / LAYERS
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
    if (!mapContainerRef.current) return;

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

  const handleShare = async () => {
    if (!selectedMap) {
      showNotice("Pilih peta terlebih dahulu untuk dibagikan.", "error");
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}?map=${selectedMap.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedMap.name,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);

        showNotice("Tautan peta berhasil disalin.");
      }
    } catch {
      // user cancelled native share
    }
  };

  const handleExport = async () => {
    if (!isAdmin && user?.tier === "free") {
      triggerToast(
        "Fitur Export Resolusi Tinggi hanya tersedia untuk paket Desa & Kecamatan."
      );
      return;
    }

    if (!selectedMap || !selectedMapRaw) {
      showNotice("Pilih peta yang ingin diexport.", "error");
      return;
    }

    setIsExporting(true);

    try {
      const response = await api.get(`/maps/${selectedMapRaw.id}/export`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = downloadUrl;
      a.download = `${selectedMapRaw.title}.${selectedMapRaw.file_format || "tif"
        }`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);

      showNotice("Export berhasil diunduh.");
    } catch {
      showNotice("Gagal mengexport peta. Silakan coba lagi.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  /* =========================================================
     EDIT
  ========================================================== */

  const openEditModal = (map: MapData, event?: React.MouseEvent) => {
    event?.stopPropagation();

    setEditingMap(map);

    setEditForm({
      title: map.title,
      location: map.location,
      description: map.description || "",
    });

    setEditErrors({});
  };

  const closeEditModal = () => {
    setEditingMap(null);
    setEditErrors({});
  };

  const submitEdit = async () => {
    if (!editingMap) return;

    const errors: {
      title?: string;
      location?: string;
    } = {};

    if (!editForm.title.trim()) {
      errors.title = "Nama peta wajib diisi.";
    }

    if (!editForm.location.trim()) {
      errors.location = "Lokasi wajib diisi.";
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
        description: editForm.description.trim(),
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
    if (!deletingMap) return;

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
     TOOLBAR
  ========================================================== */

  const mapTools = [
    {
      icon: <ZoomIn className="h-4 w-4" />,
      label: "Zoom In",
      onClick: handleZoomIn,
    },
    {
      icon: <ZoomOut className="h-4 w-4" />,
      label: "Zoom Out",
      onClick: handleZoomOut,
    },
    {
      icon: <Compass className="h-4 w-4 text-emerald-800" />,
      label: "Reset Arah Utara (Shift+Drag untuk rotasi bebas)",
      onClick: () => {
        if (mapRef.current?.resetNorth) {
          mapRef.current.resetNorth();
          showNotice("Orientasi peta dikembalikan menghadap Utara (0°).");
        }
      },
    },
    {
      icon: isFullscreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      ),
      label: isFullscreen ? "Keluar Layar Penuh" : "Full Screen",
      onClick: handleFullscreen,
    },
    {
      icon: <Share2 className="h-4 w-4" />,
      label: "Share",
      onClick: handleShare,
    },
  ];

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-full bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ===================================================
            PAGE HEADER
        ==================================================== */}
        <header className="mb-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                  <MapIcon className="h-4 w-4 text-[#123c28]" />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#123c28]/80">
                  GEOSPATIAL WORKSPACE
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.045em] text-[#123c28] sm:text-4xl">
                Peta & Analisis
                <span className="text-[#1a5134]"> Geospasial</span>
              </h1>
            </div>
          </div>
        </header>

        {/* ===================================================
            TOOLBAR
        ==================================================== */}
        <section className="mb-4 rounded-[24px] border border-[#123c28]/15 bg-white p-3 shadow-sm">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            {/* Left tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLayerPanelOpen((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold transition ${isLayerPanelOpen
                    ? "bg-[#123c28] text-white"
                    : "bg-[#f3f6ed] text-[#123c28] hover:bg-[#e7ede1]"
                  }`}
              >
                <Layers className="h-4 w-4" />
                Layer Peta
              </button>
            </div>

            {/* Right tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold transition ${!isAdmin && user?.tier === "free"
                    ? "cursor-not-allowed bg-[#f4f5f2] text-[#123c28]/50"
                    : "bg-[#123c28] text-white hover:bg-[#1a5134]"
                  }`}
              >
                {!isAdmin && user?.tier === "free" ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export
              </button>

              <div className="hidden h-7 w-px bg-[#123c28]/15 sm:block" />

              <div className="flex items-center gap-1 rounded-full bg-[#f7f8f4] p-1 border border-[#123c28]/10">
                {mapTools.map((tool, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={tool.onClick}
                    title={tool.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#123c28]/80 transition hover:bg-white hover:text-[#123c28]"
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            MAIN WORKSPACE
        ==================================================== */}
        <div className="grid grid-cols-12 gap-4">
          {/* =================================================
              LAYER PANEL
          ================================================== */}
          {isLayerPanelOpen && (
            <aside className="col-span-12 lg:col-span-4">
              <div className="rounded-[26px] border border-[#123c28]/15 bg-white p-4 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                      DATA LAYERS
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#123c28]">
                        Layer Peta
                      </h2>
                      <span className="rounded-full border border-[#123c28]/15 bg-[#f7f8f4] px-2.5 py-0.5 text-[10px] font-bold text-[#123c28]">
                        {maps.length} peta tersimpan
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f7f1] text-[#123c28]/80 transition hover:bg-[#e7ede1]"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Loading */}
                {loading && (
                  <div className="rounded-2xl bg-[#f7f8f4] px-4 py-8 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#123c28]/20 border-t-[#123c28]" />

                    <p className="text-xs font-semibold text-[#123c28]/80">
                      Memuat data peta...
                    </p>
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                {/* Empty */}
                {!loading && !error && mapLayers.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#123c28]/20 bg-[#fafbf8] px-4 py-9 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                      <MapIcon className="h-5 w-5 text-[#123c28]/60" />
                    </div>

                    <p className="mt-4 text-xs font-bold text-[#123c28]">
                      Belum ada peta
                    </p>

                    <p className="mt-1 text-[11px] font-medium leading-5 text-[#123c28]/75">
                      Upload peta pertama Anda untuk mulai melakukan analisis.
                    </p>
                  </div>
                )}

                {/* Layers */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {mapLayers.map((layer) => {
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
                        className={`group cursor-pointer rounded-2xl border p-3 transition ${active
                            ? "border-[#123c28]/30 bg-[#f3f6ed] shadow-sm"
                            : "border-[#123c28]/10 bg-white hover:border-[#123c28]/25 hover:bg-[#fafbf8]"
                          } ${layer.locked ? "opacity-75" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${layer.color}`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-xs font-bold text-[#123c28]">
                                {layer.name}
                              </h3>

                              {layer.locked && (
                                <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#fff5df] px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-[#b27518]">
                                  <Lock className="h-2.5 w-2.5" />
                                  Pro
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#123c28]/75">
                              <Calendar className="h-3 w-3 text-[#123c28]/70" />
                              {layer.date}
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-[#123c28]/85">
                              <MapPin className="h-3 w-3 text-[#123c28]/70" />
                              <span className="truncate">{layer.location}</span>
                            </div>
                          </div>

                          {(isAdmin || !layer.locked) && (
                            <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(event) => openEditModal(raw, event)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#123c28]/60 transition hover:bg-white hover:text-[#123c28]"
                                title="Edit peta"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(event) =>
                                  openDeleteConfirm(raw, event)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#123c28]/60 transition hover:bg-red-50 hover:text-red-600"
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

                {/* Info */}
                <div className="mt-4 rounded-2xl bg-[#f7f8f4] p-3.5 border border-[#123c28]/10">
                  <div className="flex items-start gap-2.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#123c28]/75" />

                    <p className="text-[10px] font-medium leading-5 text-[#123c28]/80">
                      Klik layer untuk menampilkannya di workspace. Gunakan
                      action icon untuk edit atau hapus data.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* =================================================
              MAP
          ================================================== */}
          <div
            className={`${isLayerPanelOpen ? "col-span-12 lg:col-span-8" : "col-span-12"
              }`}
          >
            <div className="overflow-hidden rounded-[26px] border border-[#123c28]/15 bg-white shadow-sm">
              {/* Map top information */}
              <div className="flex flex-col justify-between gap-3 border-b border-[#123c28]/10 bg-white px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#f3f6ed]">
                    <ScanLine className="h-3.5 w-3.5 text-[#123c28]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#123c28]/75">
                      ACTIVE LAYER
                    </p>

                    <p className="truncate text-xs font-bold text-[#123c28]">
                      {selectedMap
                        ? selectedMap.name
                        : "Belum ada layer dipilih"}
                    </p>
                  </div>
                </div>

                {selectedMap && (
                  <div className="flex items-center gap-4 text-[10px] font-semibold text-[#123c28]/80">
                    <span>
                      .{selectedMap.format?.toUpperCase() || "UNKNOWN"}
                    </span>

                    <span className="h-3 w-px bg-[#123c28]/20" />

                    <span>{selectedMap.size} MB</span>
                  </div>
                )}
              </div>

              {/* Map */}
              <div
                ref={mapContainerRef}
                className="relative h-[520px] w-full bg-[#f1f3ed] sm:h-[600px]"
              >
                {useMemo(
                  () => (
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
                    />
                  ),
                  [
                    selectedMap?.id,
                    selectedMap?.format,
                    selectedMap?.name,
                    selectedMap?.location,
                  ]
                )}

                {/* Floating map badge */}
                <div className="pointer-events-none absolute left-4 top-4 z-[400] hidden rounded-full border border-white/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:block">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#91b928]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#123c28]">
                      UAV FIELD MAP
                    </span>
                  </div>
                </div>
              </div>

              {/* Map footer */}
              <div className="flex flex-col justify-between gap-3 border-t border-[#123c28]/10 bg-[#fafbf8] px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4 text-[10px] font-semibold text-[#123c28]/75">
                  <span>{maps.length} peta tersimpan</span>

                  {selectedMap && (
                    <>
                      <span>•</span>

                      <span>Survey: {selectedMap.date}</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMetadataMap(selectedMapRaw)}
                  disabled={!selectedMapRaw}
                  className="inline-flex items-center gap-1.5 self-start text-[10px] font-bold text-[#123c28] transition hover:underline disabled:cursor-not-allowed disabled:text-[#123c28]/35 sm:self-auto"
                >
                  Lihat Metadata
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          NOTICE TOAST
      ====================================================== */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-[9998] flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3.5 text-xs font-medium shadow-2xl ${notice.type === "success"
              ? "bg-[#123c28] text-white"
              : "bg-[#a3483c] text-white"
            }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}

          <span>{notice.text}</span>
        </div>
      )}

      {/* =====================================================
          METADATA MODAL
      ====================================================== */}
      {metadataMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123c28]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between border-b border-[#123c28]/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                  FIELD DATA
                </p>

                <h3 className="mt-1 text-lg font-bold tracking-tight text-[#123c28]">
                  Metadata Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f7f1] text-[#123c28]/80 transition hover:bg-[#123c28] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* content */}
            <div className="space-y-1 px-6 py-5">
              {[
                ["Nama", metadataMap.title],
                ["Lokasi", metadataMap.location],
                ...(metadataMap.map_type ? [["Tipe", metadataMap.map_type]] : []),
                [
                  "Tanggal Survey",
                  new Date(metadataMap.survey_date).toLocaleDateString("id-ID"),
                ],
                ["Format", `.${metadataMap.file_format?.toUpperCase()}`],
                [
                  "Ukuran File",
                  `${(metadataMap.file_size / 1024 / 1024).toFixed(2)} MB`,
                ],
                [
                  "Dibuat",
                  new Date(metadataMap.created_at).toLocaleDateString("id-ID"),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-5 rounded-xl px-3 py-3 hover:bg-[#f7f8f4]"
                >
                  <span className="text-xs font-medium text-[#123c28]/75">{label}</span>

                  <span className="max-w-[60%] truncate text-right text-xs font-bold text-[#123c28]">
                    {value}
                  </span>
                </div>
              ))}

              {metadataMap.description && (
                <div className="mt-2 rounded-2xl bg-[#f7f8f4] p-4 border border-[#123c28]/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#123c28]/75">
                    Deskripsi
                  </p>

                  <p className="mt-2 text-xs font-medium leading-6 text-[#123c28]/85">
                    {metadataMap.description}
                  </p>
                </div>
              )}
            </div>

            {/* footer */}
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
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#123c28]/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                  EDIT DATA
                </p>

                <h3 className="mt-1 text-lg font-bold tracking-tight text-[#123c28]">
                  Edit Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f7f1] text-[#123c28]/80 transition hover:bg-[#123c28] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {/* title */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Nama Peta
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
                  className={`h-12 w-full rounded-2xl border bg-[#fafbf8] px-4 text-sm font-medium text-[#123c28] outline-none transition placeholder:text-[#123c28]/45 focus:bg-white ${editErrors.title
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#123c28]/15 focus:border-[#123c28]/40"
                    }`}
                  placeholder="Nama peta"
                />

                {editErrors.title && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {editErrors.title}
                  </p>
                )}
              </div>

              {/* location */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Lokasi
                </label>

                <input
                  type="text"
                  value={editForm.location}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      location: event.target.value,
                    })
                  }
                  className={`h-12 w-full rounded-2xl border bg-[#fafbf8] px-4 text-sm font-medium text-[#123c28] outline-none transition placeholder:text-[#123c28]/45 focus:bg-white ${editErrors.location
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#123c28]/15 focus:border-[#123c28]/40"
                    }`}
                  placeholder="Lokasi"
                />

                {editErrors.location && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {editErrors.location}
                  </p>
                )}
              </div>

              {/* description */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/75">
                  Deskripsi
                </label>

                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      description: event.target.value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#123c28]/15 bg-[#fafbf8] px-4 py-3 text-sm font-medium text-[#123c28] outline-none transition placeholder:text-[#123c28]/45 focus:border-[#123c28]/40 focus:bg-white"
                  placeholder="Tambahkan catatan atau deskripsi..."
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-[#123c28]/10 bg-[#fafbf8] px-6 py-4">
              <button
                type="button"
                onClick={submitEdit}
                disabled={isSavingEdit}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#123c28] py-3 text-xs font-semibold text-white transition hover:bg-[#1a5134] disabled:opacity-60"
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
                className="flex-1 rounded-full border border-[#123c28]/15 bg-white py-3 text-xs font-bold text-[#123c28] transition hover:bg-[#f0f2ed]"
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
                  "{deletingMap.title}"
                </span>{" "}
                akan dihapus secara permanen.
              </p>

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
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
                  className="flex-1 rounded-full border border-[#123c28]/15 bg-[#f5f7f1] py-3 text-xs font-bold text-[#123c28] transition hover:bg-[#e9ede3]"
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
            {/* header */}
            <div className="relative overflow-hidden bg-[#123c28] px-7 py-8 text-center text-white">
              <div className="absolute -right-10 -top-16 h-36 w-36 rounded-full border border-white/10" />
              <div className="absolute -left-12 bottom-[-70px] h-40 w-40 rounded-full border border-white/5" />

              <button
                type="button"
                onClick={() => setToastMessage("")}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
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

            {/* body */}
            <div className="px-7 py-7 text-center">
              <p className="text-sm font-medium leading-6 text-[#123c28]">
                {toastMessage}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#123c28] px-5 py-3.5 text-xs font-bold text-white transition hover:bg-[#1a5134]"
                >
                  Lihat Paket Langganan
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setToastMessage("")}
                  className="rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-5 py-3.5 text-xs font-bold text-[#123c28] transition hover:bg-[#e9ede3]"
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
