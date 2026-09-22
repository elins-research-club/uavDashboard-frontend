"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

import React from "react";
import {
  Map as MapIcon,
  Search,
  Download,
  X,
  Crown,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowLeft,
  Calendar,
  MapPin,
  ScanLine,
  Lock,
  ChevronRight,
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
    <div className="flex h-full items-center justify-center bg-[#F4F5F2]">
      <div className="flex items-center gap-3 text-[#555750]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-xs font-medium sm:text-sm">Memuat peta...</span>
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
   3D ISOMETRIC WIREFRAME
========================================================= */

type Block = {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
};

type SceneConfig = {
  grid: number;
  blocks: Block[];
};

const WIREFRAME_CONFIG: SceneConfig = {
  grid: 6,
  blocks: [
    { x: 0, y: 0, w: 2, d: 2, h: 1.4 },
    { x: 3, y: 0, w: 1, d: 1, h: 3 },
    { x: 5, y: 0, w: 1, d: 1, h: 0.8 },
    { x: 4, y: 1, w: 2, d: 2, h: 2 },
    { x: 2, y: 2, w: 2, d: 2, h: 1.1 },
    { x: 0, y: 3, w: 1, d: 2, h: 2.4 },
    { x: 4, y: 4, w: 2, d: 1, h: 1.6 },
    { x: 2, y: 5, w: 1, d: 1, h: 0.6 },
  ],
};

const ISO_COS = Math.sqrt(3) / 2;
const ISO_UNIT = 40;

type BuiltScene = {
  viewBox: string;
  ratio: number;
  region: string;
  grid: string;
  floor: string;
  blocks: {
    top: string;
    left: string;
    right: string;
    levels: string;
  }[];
};

function buildScene({ grid: n, blocks }: SceneConfig): BuiltScene {
  const xs: number[] = [];
  const ys: number[] = [];

  const P = (x: number, y: number, z = 0) => {
    const px = (x - y) * ISO_COS * ISO_UNIT;
    const py = ((x + y) * 0.5 - z) * ISO_UNIT;

    xs.push(px);
    ys.push(py);

    return `${px.toFixed(1)} ${py.toFixed(1)}`;
  };

  const face = (points: string[]) => `M${points.join(" L")} Z`;

  let grid = "";

  for (let i = 0; i <= n; i++) {
    grid += `M${P(i, 0)} L${P(i, n)} M${P(0, i)} L${P(n, i)} `;
  }

  const floor = face([P(0, 0), P(n, 0), P(n, n), P(0, n)]);

  const m = 0.55;

  const region = face([P(-m, -m), P(n + m, -m), P(n + m, n + m), P(-m, n + m)]);

  const builtBlocks = [...blocks]
    .sort(
      (a, b) =>
        a.x + a.w / 2 + (a.y + a.d / 2) - (b.x + b.w / 2 + (b.y + b.d / 2))
    )
    .map(({ x, y, w, d, h }) => {
      const top = face([
        P(x, y, h),
        P(x + w, y, h),
        P(x + w, y + d, h),
        P(x, y + d, h),
      ]);

      const right = face([
        P(x + w, y, 0),
        P(x + w, y + d, 0),
        P(x + w, y + d, h),
        P(x + w, y, h),
      ]);

      const left = face([
        P(x, y + d, 0),
        P(x + w, y + d, 0),
        P(x + w, y + d, h),
        P(x, y + d, h),
      ]);

      let levels = "";

      for (let z = 0.5; z < h - 0.01; z += 0.5) {
        levels += `M${P(x + w, y, z)} L${P(x + w, y + d, z)} L${P(
          x,
          y + d,
          z
        )} `;
      }

      return {
        top,
        left,
        right,
        levels,
      };
    });

  const pad = 6;

  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;

  const width = Math.max(...xs) - Math.min(...xs) + pad * 2;

  const height = Math.max(...ys) - Math.min(...ys) + pad * 2;

  return {
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${width.toFixed(
      1
    )} ${height.toFixed(1)}`,
    ratio: width / height,
    region,
    grid,
    floor,
    blocks: builtBlocks,
  };
}

const WIREFRAME_SCENE = buildScene(WIREFRAME_CONFIG);

const NON_SCALING = {
  vectorEffect: "non-scaling-stroke" as const,
};

function PlanGeometry({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  const scene = WIREFRAME_SCENE;

  const surface = dark ? "#171717" : "#FFFFFF";

  const fade =
    "radial-gradient(120% 120% at 100% 0%, #000 35%, transparent 74%)";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={scene.viewBox}
      preserveAspectRatio="xMaxYMin meet"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        aspectRatio: scene.ratio,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
      className={`pointer-events-none absolute select-none ${className} ${
        dark ? "text-white opacity-[0.2]" : "text-black opacity-[0.13]"
      }`}
    >
      <path
        d={scene.region}
        strokeDasharray="3 4"
        strokeOpacity={0.7}
        {...NON_SCALING}
      />

      <path d={scene.grid} strokeOpacity={0.5} {...NON_SCALING} />

      <path d={scene.floor} {...NON_SCALING} />

      {scene.blocks.map((block, index) => (
        <g key={index}>
          <path d={block.left} fill={surface} {...NON_SCALING} />

          <path d={block.right} fill={surface} {...NON_SCALING} />

          <path d={block.top} fill={surface} {...NON_SCALING} />

          <path
            d={block.left}
            fill="currentColor"
            fillOpacity={0.22}
            stroke="none"
          />

          <path
            d={block.right}
            fill="currentColor"
            fillOpacity={0.5}
            stroke="none"
          />

          {block.levels && (
            <path d={block.levels} strokeOpacity={0.55} {...NON_SCALING} />
          )}
        </g>
      ))}
    </svg>
  );
}

/* =========================================================
   SWEEP BUTTON
========================================================= */

function SweepButton({
  children,
  onClick,
  disabled = false,
  tone = "dark",
  sizing = "w-full px-5 py-3.5",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "dark" | "light";
  sizing?: string;
}) {
  const base =
    tone === "dark" ? "bg-[#171717] text-white" : "bg-white text-[#171717]";

  const textHover =
    tone === "dark" && !disabled ? "group-hover/sweep:text-[#0F1A00]" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group/sweep relative inline-flex items-center justify-center overflow-hidden text-[9px] font-bold uppercase tracking-[0.08em] outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[#76B900] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:text-[10px] ${
        disabled ? "" : "active:scale-[0.985]"
      } ${sizing} ${base}`}
    >
      {!disabled && (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-right scale-x-0 transform-gpu bg-[#76B900] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover/sweep:origin-left group-hover/sweep:scale-x-100 motion-reduce:transition-none"
        />
      )}

      <span
        className={`relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-500 ease-out ${textHover}`}
      >
        {children}
      </span>
    </button>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-3 text-[11px] transition-colors hover:bg-white sm:px-4 sm:py-3 sm:text-xs">
      <span className="min-w-0 shrink-0 font-medium text-[#858780]">
        {label}
      </span>

      <span className="max-w-[66%] truncate text-right font-bold text-[#171717]">
        {children}
      </span>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/* =========================================================
   MOTION VARIANTS
========================================================= */

const overviewContainer: Variants = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const overviewItem: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },

  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

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

  const [activeCategory, setActiveCategory] = useState("Semua");

  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);

  const [panelView, setPanelView] = useState<"list" | "detail">("list");

  const [isMinSearchFocused, setIsMinSearchFocused] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =========================================================
     SIDEBAR STATE
  ========================================================== */

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /*
   * Sidebar:
   *
   * Normal:
   * 12px margin + 258px width + 12px gap
   * = 282px
   *
   * Collapsed:
   * 12px margin + 76px width + 12px gap
   * = 100px
   */
  const mapPanelLeft = sidebarCollapsed ? 100 : 282;

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
     SIDEBAR SYNC
  ========================================================== */

  useEffect(() => {
    const syncSidebar = () => {
      const stored = localStorage.getItem("sidebar:collapsed");

      setSidebarCollapsed(stored === "true");
    };

    syncSidebar();

    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{
        collapsed?: boolean;
      }>;

      if (typeof customEvent.detail?.collapsed === "boolean") {
        setSidebarCollapsed(customEvent.detail.collapsed);

        return;
      }

      syncSidebar();
    };

    window.addEventListener("sidebar:toggle", handleSidebarToggle);

    return () => {
      window.removeEventListener("sidebar:toggle", handleSidebarToggle);
    };
  }, []);

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
    color: "bg-[#76B900]",
    locked: map.locked_for_free && !isAdmin && user?.tier === "free",
    format: map.file_format,
    size: (map.file_size / 1024 / 1024).toFixed(2),
    mapType: map.map_type?.trim() || "Umum",
  }));

  /* =========================================================
     CATEGORY CHIPS
  ========================================================== */

  const categoryChips = useMemo(() => {
    const seen = new Set<string>();

    mapLayers.forEach((layer) => seen.add(layer.mapType));

    return ["Semua", ...Array.from(seen)];
  }, [mapLayers]);

  /* =========================================================
     SEARCH + FILTER
  ========================================================== */

  const filteredMapLayers = mapLayers.filter((layer) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesQuery =
      !query ||
      layer.name.toLowerCase().includes(query) ||
      layer.location.toLowerCase().includes(query) ||
      layer.format.toLowerCase().includes(query);

    const matchesCategory =
      activeCategory === "Semua" || layer.mapType === activeCategory;

    return matchesQuery && matchesCategory;
  });

  const selectedMap = mapLayers.find((layer) => layer.id === selectedLayer);

  const selectedMapRaw = maps.find((map) => map.id === selectedLayer) || null;

  /* =========================================================
     DISPLAY-ONLY DERIVATIONS
  ========================================================== */

  const isDownloadLocked = !isAdmin && user?.tier === "free";

  const tierKey = String(user?.tier || "free").toLowerCase();

  const tierBadgeLabel = isAdmin
    ? "Akses Admin"
    : tierKey === "desa"
    ? "Tier Desa"
    : tierKey === "kecamatan"
    ? "Tier Kecamatan"
    : "User Free";

  /* =========================================================
     MAP ACTIONS
  ========================================================== */

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

        setPanelView("list");
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
     PANEL / SELECTION HELPERS
  ========================================================== */

  const handlePickLayer = (layer: (typeof mapLayers)[number]) => {
    if (layer.locked) {
      triggerToast(
        "Peta ini terkunci untuk Member Free. Silakan Upgrade Tier Anda."
      );

      return;
    }

    if (selectedLayer === layer.id) {
      mapRef.current?.resetView();
    } else {
      setSelectedLayer(layer.id);
    }

    setPanelView("detail");
  };

  const closeLayerPanel = () => {
    setIsLayerPanelOpen(false);
  };

  /* =========================================================
     DETAIL ACTIONS
  ========================================================== */

  const canManage =
    Boolean(selectedMapRaw) && (isAdmin || !selectedMap?.locked);

  const detailActions = selectedMapRaw
    ? [
        {
          key: "share",
          icon: ArrowUpRight,
          label: "Bagikan",
          onClick: () => handleShare(),
        },

        {
          key: "download",
          icon: isDownloadingAnalysis
            ? Loader2
            : isDownloadLocked
            ? Lock
            : Download,

          label: isDownloadingAnalysis ? "Memuat" : "Unduh",

          onClick: () => handleDownloadAnalysis(),

          spin: isDownloadingAnalysis,

          disabled: isDownloadingAnalysis,
        },

        {
          key: "metadata",
          icon: ScanLine,
          label: "Metadata",
          onClick: () => setMetadataMap(selectedMapRaw),
        },

        ...(canManage
          ? [
              {
                key: "edit",
                icon: Pencil,
                label: "Edit",

                onClick: (event?: React.MouseEvent) =>
                  openEditModal(selectedMapRaw, event),
              },

              {
                key: "delete",
                icon: Trash2,
                label: "Hapus",

                onClick: (event?: React.MouseEvent) =>
                  openDeleteConfirm(selectedMapRaw, event),

                danger: true,
              },
            ]
          : []),
      ]
    : [];

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <main className="fixed inset-0 z-10 overflow-hidden bg-[#F4F5F2] text-[#151515]">
      {/* ===================================================
          MAP — FULL VIEWPORT
      ==================================================== */}

      <div ref={mapContainerRef} className="absolute inset-0">
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
      </div>

      {/* ===================================================
          BUTTON — CARI PETA
          Ikut bergerak mengikuti sidebar
      ==================================================== */}

      {!isFullscreen && !isLayerPanelOpen && (
        <button
          type="button"
          onClick={() => setIsLayerPanelOpen(true)}
          className="absolute top-2 z-40 flex items-center gap-2 border border-[#DCDDD8] bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#171717] shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-[left,color,background-color,border-color] duration-300 ease-out hover:border-[#171717] hover:bg-[#171717] hover:text-white sm:top-3"
          style={{
            left: `${mapPanelLeft}px`,
          }}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.8} />

          <span>Cari Peta</span>

          <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-1.5 py-0.5 text-[9px] font-extrabold text-[#171717]">
            {maps.length}
          </span>
        </button>
      )}

      {/* ===================================================
          LEFT PANEL — SEARCH / LIST / DETAIL
          Ikut bergerak mengikuti sidebar
      ==================================================== */}

      {!isFullscreen && isLayerPanelOpen && (
        <motion.aside
          initial={{
            opacity: 0,
            x: -8,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute top-2 z-40 flex max-h-[58vh] w-[calc(100%-16px)] max-w-[300px] flex-col overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_16px_36px_rgba(0,0,0,0.08)] transition-[left] duration-300 ease-out sm:top-3 sm:max-h-[62vh] sm:w-[300px]"
          style={{
            left: `${mapPanelLeft}px`,
          }}
        >
          {panelView === "list" ? (
            <>
              {/* =========================================================
                    LIST VIEW
                ========================================================= */}

              <div className="border-b border-[#E7E8E3] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-[12px] font-bold tracking-[-0.02em] text-[#171717] sm:text-[13px]">
                      Telusuri Peta Anda
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeLayerPanel}
                    className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717]"
                    title="Sembunyikan panel"
                  >
                    <X className="h-3 w-3" strokeWidth={1.8} />
                  </button>
                </div>

                {/* SEARCH */}

                <div className="relative mt-2.5 flex items-center">
                  <Search
                    className="pointer-events-none absolute left-2.5 h-3 w-3 text-[#A0A29B]"
                    strokeWidth={1.8}
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsMinSearchFocused(true)}
                    onBlur={() => setIsMinSearchFocused(false)}
                    placeholder="Cari nama, lokasi, atau format..."
                    className={`h-[34px] w-full border bg-[#FAFAF8] pl-8 pr-8 text-[10px] font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:bg-white sm:h-9 sm:text-[11px] ${
                      isMinSearchFocused
                        ? "border-[#BFC4B8] ring-4 ring-black/[0.03]"
                        : "border-[#DCDDD8]"
                    }`}
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1.5 flex h-6 w-6 items-center justify-center text-[#A0A29B] transition-colors hover:text-[#171717]"
                      title="Hapus pencarian"
                    >
                      <X className="h-2.5 w-2.5" strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              </div>

              {/* =========================================================
                    MAP LIST
                ========================================================= */}

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-[#FAFAF8] p-1.5 overscroll-contain sm:p-2">
                {/* LOADING */}

                {loading && (
                  <div className="flex items-center justify-center gap-2.5 border border-[#DCDDD8] bg-white px-3 py-5 text-[#555750] sm:py-6">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />

                    <span className="text-[10px] font-medium sm:text-[11px]">
                      Memuat data peta...
                    </span>
                  </div>
                )}

                {/* ERROR */}

                {!loading && error && (
                  <div className="flex items-start gap-2 border border-[#E7D0CC] bg-[#FFF7F5] px-2.5 py-2.5 text-[10px] font-medium leading-4.5 text-[#9B3E32] sm:px-3 sm:py-3 sm:text-[11px]">
                    <AlertTriangle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      strokeWidth={1.75}
                    />

                    <span className="min-w-0 flex-1">{error}</span>
                  </div>
                )}

                {/* EMPTY */}

                {!loading && !error && maps.length === 0 && (
                  <div className="border border-dashed border-[#DCDDD8] bg-white px-3 py-6 text-center sm:py-7">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6]">
                      <MapIcon
                        className="h-3.5 w-3.5 text-[#777972]"
                        strokeWidth={1.7}
                      />
                    </div>

                    <p className="mt-2.5 text-[11px] font-bold text-[#1B1B1B] sm:text-xs">
                      Belum ada peta
                    </p>

                    <p className="mt-1 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
                      Upload peta pertama Anda untuk mulai melakukan analisis.
                    </p>
                  </div>
                )}

                {/* SEARCH EMPTY */}

                {!loading &&
                  !error &&
                  maps.length > 0 &&
                  filteredMapLayers.length === 0 && (
                    <div className="border border-dashed border-[#DCDDD8] bg-white px-3 py-6 text-center sm:py-7">
                      <div className="mx-auto flex h-8 w-8 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6]">
                        <Search
                          className="h-3.5 w-3.5 text-[#777972]"
                          strokeWidth={1.7}
                        />
                      </div>

                      <p className="mt-2.5 text-[11px] font-bold text-[#1B1B1B] sm:text-xs">
                        Peta tidak ditemukan
                      </p>

                      <p className="mt-1 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
                        Coba kata kunci atau kategori lain.
                      </p>
                    </div>
                  )}

                {/* MAP ROWS */}

                {filteredMapLayers.map((layer) => {
                  const active = selectedLayer === layer.id;

                  return (
                    <div
                      key={layer.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePickLayer(layer)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();

                          handlePickLayer(layer);
                        }
                      }}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-2 border p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#76B900]/40 sm:p-2.5",

                        active
                          ? "border-[#171717] border-l-[3px] border-l-[#76B900] bg-[#171717] text-white"
                          : "border-[#DCDDD8] bg-white text-[#171717] hover:border-[#C8CAC4]",

                        layer.locked ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center border",

                          active
                            ? "border-white/15 bg-white/10"
                            : "border-[#E0E1DC] bg-[#F7F8F5]"
                        )}
                      >
                        {layer.locked ? (
                          <Lock className="h-3 w-3" strokeWidth={1.8} />
                        ) : (
                          <MapIcon className="h-3 w-3" strokeWidth={1.8} />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold leading-tight sm:text-[12px]">
                          {layer.name}
                        </p>

                        <p
                          className={cn(
                            "mt-0.5 truncate text-[9px] font-medium leading-tight sm:text-[10px]",
                            active ? "text-white/65" : "text-[#858780]"
                          )}
                        >
                          {layer.location} • {layer.date}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 border px-1 py-0.5 text-[7px] font-bold uppercase tracking-[0.06em] sm:text-[8px]",

                          active
                            ? "border-white/20 text-white/80"
                            : "border-[#E0E1DC] bg-[#F7F8F5] text-[#666861]"
                        )}
                      >
                        {layer.format}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* =========================================================
                    DETAIL HEADER
                ========================================================= */}

              <div className="flex items-center gap-1.5 border-b border-[#E7E8E3] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setPanelView("list")}
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717]"
                  title="Kembali ke daftar"
                >
                  <ArrowLeft className="h-3 w-3" strokeWidth={1.8} />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[9px]">
                    Detail peta
                  </p>

                  <h2 className="mt-0.5 truncate text-[12px] font-bold tracking-[-0.01em] text-[#171717] sm:text-[13px]">
                    {selectedMap?.name || "Belum ada layer dipilih"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeLayerPanel}
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717]"
                  title="Sembunyikan panel"
                >
                  <X className="h-3 w-3" strokeWidth={1.8} />
                </button>
              </div>

              {/* =========================================================
                    DETAIL CONTENT
                ========================================================= */}

              <div className="min-h-0 flex-1 overflow-y-auto">
                {!selectedMapRaw ? (
                  <div className="px-3 py-7 text-center">
                    <p className="text-[10px] font-medium text-[#858780]">
                      Pilih peta dari daftar untuk melihat detail.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    variants={overviewContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {/* FORMAT + LOCATION */}

                    <motion.div variants={overviewItem} className="px-3 py-2.5">
                      <span className="inline-flex h-[18px] items-center bg-[#76B900] px-1.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#0F1A00]">
                        {selectedMap?.format?.toUpperCase() || "UNKNOWN"}
                      </span>

                      <p className="mt-2 flex items-start gap-1 text-[10px] font-medium leading-4.5 text-[#4E504A] sm:text-[11px]">
                        <MapPin
                          className="mt-0.5 h-3 w-3 shrink-0 text-[#A0A29B]"
                          strokeWidth={1.7}
                        />

                        <span className="min-w-0">{selectedMap?.location}</span>
                      </p>
                    </motion.div>

                    {/* MAIN ACTIONS */}

                    <motion.div
                      variants={overviewItem}
                      className="space-y-1.5 px-3 pb-3"
                    >
                      {/* DOWNLOAD */}

                      {isDownloadLocked ? (
                        <button
                          type="button"
                          onClick={handleDownloadAnalysis}
                          disabled={isDownloadingAnalysis}
                          className="inline-flex h-[42px] w-full items-center justify-center gap-2 border border-[#DCDDD8] bg-[#F4F5F2] px-3.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#A0A19C] transition-colors hover:border-[#C8CAC4] disabled:cursor-not-allowed"
                        >
                          <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />

                          <span>Download Analisa</span>
                        </button>
                      ) : (
                        <SweepButton
                          onClick={handleDownloadAnalysis}
                          disabled={isDownloadingAnalysis}
                          sizing="h-[42px] w-full gap-2 px-3.5"
                        >
                          {isDownloadingAnalysis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download
                              className="h-3.5 w-3.5"
                              strokeWidth={1.8}
                            />
                          )}

                          <span>
                            {isDownloadingAnalysis
                              ? "Menyiapkan..."
                              : "Download Analisa"}
                          </span>
                        </SweepButton>
                      )}

                      {/* METADATA */}

                      {(() => {
                        const metadataAction = detailActions.find(
                          (action) =>
                            action.key === "metadata" ||
                            action.key === "download-metadata" ||
                            action.key === "download_metadata"
                        );

                        if (!metadataAction) {
                          return null;
                        }

                        const metadataIcon = metadataAction.icon;

                        return (
                          <button
                            type="button"
                            onClick={metadataAction.onClick}
                            disabled={
                              "disabled" in metadataAction
                                ? metadataAction.disabled
                                : false
                            }
                            className="flex h-[34px] w-full items-center justify-between border border-[#E0E1DC] bg-white px-3 text-left transition-colors hover:border-[#C8CAC4] hover:bg-[#FAFAF8] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center bg-[#F4F5F1] text-[#666861]">
                                {React.isValidElement(metadataIcon)
                                  ? metadataIcon
                                  : React.createElement(
                                      metadataIcon as React.ElementType,
                                      {
                                        className: "h-3 w-3",
                                        strokeWidth: 1.8,
                                      }
                                    )}
                              </span>

                              <span className="truncate text-[9px] font-bold uppercase tracking-[0.06em] text-[#4E504A]">
                                {metadataAction.label}
                              </span>
                            </div>

                            <ChevronRight
                              className="h-3 w-3 shrink-0 text-[#A0A29B]"
                              strokeWidth={1.7}
                            />
                          </button>
                        );
                      })()}

                      {/* EDIT + DELETE */}

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {/* EDIT */}

                        {(() => {
                          const editAction = detailActions.find(
                            (action) =>
                              action.key === "edit" || action.key === "edit-map"
                          );

                          if (!editAction) {
                            return null;
                          }

                          const editIcon = editAction.icon;

                          return (
                            <button
                              type="button"
                              onClick={editAction.onClick}
                              disabled={
                                "disabled" in editAction
                                  ? editAction.disabled
                                  : false
                              }
                              title={editAction.label || "Edit peta"}
                              aria-label={editAction.label || "Edit peta"}
                              className="flex h-[34px] items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#666861] transition-colors hover:border-[#C8CAC4] hover:bg-[#F2F3EF] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {editAction.spin ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : React.isValidElement(editIcon) ? (
                                editIcon
                              ) : (
                                React.createElement(
                                  editIcon as React.ElementType,
                                  {
                                    className: "h-3.5 w-3.5",
                                    strokeWidth: 1.8,
                                  }
                                )
                              )}
                            </button>
                          );
                        })()}

                        {/* DELETE */}

                        {(() => {
                          const deleteAction = detailActions.find(
                            (action) =>
                              action.key === "delete" ||
                              action.key === "delete-map"
                          );

                          if (!deleteAction) {
                            return null;
                          }

                          const deleteIcon = deleteAction.icon;

                          return (
                            <button
                              type="button"
                              onClick={deleteAction.onClick}
                              disabled={
                                "disabled" in deleteAction
                                  ? deleteAction.disabled
                                  : false
                              }
                              title={deleteAction.label || "Hapus peta"}
                              aria-label={deleteAction.label || "Hapus peta"}
                              className="flex h-[34px] items-center justify-center border border-[#E7D0CC] bg-[#FFF9F7] text-[#A34A3D] transition-colors hover:border-[#D8B8B2] hover:bg-[#FFF2EF] hover:text-[#8D3026] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleteAction.spin ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : React.isValidElement(deleteIcon) ? (
                                deleteIcon
                              ) : (
                                React.createElement(
                                  deleteIcon as React.ElementType,
                                  {
                                    className: "h-3.5 w-3.5",
                                    strokeWidth: 1.8,
                                  }
                                )
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </motion.div>

                    {/* INFO */}

                    <motion.div variants={overviewItem}>
                      <InfoRow label="Tanggal survey">
                        {selectedMap?.date}
                      </InfoRow>

                      <InfoRow label="Ukuran file">
                        {selectedMap?.size} MB
                      </InfoRow>
                    </motion.div>

                    {/* DESCRIPTION */}

                    {selectedMapRaw.description && (
                      <motion.div
                        variants={overviewItem}
                        className="mx-3 mb-3 mt-1 border border-[#E0E1DC] bg-[#F7F8F5] p-2.5"
                      >
                        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#999B94]">
                          Deskripsi
                        </p>

                        <p className="mt-1.5 text-[10px] font-medium leading-4.5 text-[#4E504A]">
                          {selectedMapRaw.description}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </>
          )}
        </motion.aside>
      )}

      {/* =====================================================
          NOTICE
      ====================================================== */}

      {notice && (
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={`fixed bottom-3 left-3 right-3 z-[9998] flex items-start gap-3 border px-4 py-3.5 text-[11px] font-medium leading-5 shadow-[0_20px_45px_rgba(0,0,0,0.10)] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm sm:px-5 sm:py-4 sm:text-sm ${
            notice.type === "success"
              ? "border-[#D8DDD0] bg-[#F7F9F4] text-[#5D664F]"
              : "border-[#E7D0CC] bg-[#FFF7F5] text-[#9B3E32]"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={1.75}
            />
          ) : (
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={1.75}
            />
          )}

          <span className="min-w-0 flex-1">{notice.text}</span>
        </motion.div>
      )}

      {/* =====================================================
          METADATA MODAL
      ====================================================== */}

      {metadataMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.35)]"
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-3 border-b border-[#E6E7E2] px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#999B94] sm:text-[10px] sm:tracking-[0.16em]">
                  Field &amp; Geospatial Data
                </p>

                <h3 className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-[#171717] sm:text-xl">
                  Metadata Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717] sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
              {/* BASIC */}

              <div>
                <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]">
                  Informasi Umum
                </p>

                <div className="divide-y divide-[#E7E8E3] border border-[#E0E1DC] bg-[#F7F8F5]">
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
                    <InfoRow key={label} label={label}>
                      {value}
                    </InfoRow>
                  ))}
                </div>
              </div>

              {/* GEO METADATA */}

              {metadataMap.geo_metadata ? (
                <div>
                  <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]">
                    Metadata Geospasial &amp; Raster
                  </p>

                  <div className="divide-y divide-[#E7E8E3] border border-[#E0E1DC] bg-[#F7F8F5]">
                    <InfoRow label="Sistem Koordinat (CRS)">
                      {metadataMap.geo_metadata.crs}
                    </InfoRow>

                    <InfoRow label="Dimensi Citra">
                      {metadataMap.geo_metadata.width?.toLocaleString()} ×{" "}
                      {metadataMap.geo_metadata.height?.toLocaleString()} piksel
                    </InfoRow>

                    <div className="px-3.5 py-3 text-[11px] transition-colors hover:bg-white sm:px-4 sm:text-xs">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start sm:gap-4">
                        <div className="min-w-0">
                          <span className="font-medium text-[#858780]">
                            Saluran (Bands)
                          </span>

                          <p className="mt-1 text-[10px] font-semibold leading-4 text-[#171717] sm:text-[11px]">
                            {metadataMap.geo_metadata.band_type ||
                              (metadataMap.geo_metadata.bands === 3
                                ? "Ortho True-Color (3 Saluran RGB)"
                                : metadataMap.geo_metadata.bands === 1
                                ? "Single-Band (Analisis Indeks / Unsur Hara)"
                                : `${metadataMap.geo_metadata.bands} Saluran Multispektral`)}
                          </p>
                        </div>

                        <span className="shrink-0 border border-[#E0E1DC] bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#171717]">
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
                          <div className="mt-3 space-y-1.5 border-t border-[#E7E8E3] pt-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]">
                              Rincian Saluran
                            </p>

                            <div className="grid grid-cols-1 gap-1.5">
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
                                    className="flex min-w-0 items-center justify-between gap-2 border border-[#E0E1DC] bg-white px-2.5 py-2 text-[10px] sm:px-3 sm:text-[11px]"
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span
                                        className={`h-2 w-2 shrink-0 ${dotColor}`}
                                      />

                                      <span className="shrink-0 font-semibold text-[#171717]">
                                        Band {item.band}:
                                      </span>

                                      <span className="truncate font-medium text-[#858780]">
                                        {item.label}
                                      </span>
                                    </div>

                                    <span className="ml-2 shrink-0 border border-[#E0E1DC] bg-[#F7F8F5] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#666861] sm:text-[10px]">
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

                    <InfoRow label="Driver Raster">
                      {metadataMap.geo_metadata.driver || "GTiff"}
                    </InfoRow>

                    <InfoRow label="Format Tiling">
                      {metadataMap.geo_metadata.is_tiled
                        ? "Tiled (Cloud-Optimized)"
                        : "Strip / Standar"}
                    </InfoRow>

                    {metadataMap.geo_metadata.nodata !== undefined &&
                      metadataMap.geo_metadata.nodata !== null && (
                        <InfoRow label="Nilai NoData">
                          {metadataMap.geo_metadata.nodata}
                        </InfoRow>
                      )}
                  </div>

                  {metadataMap.geo_metadata.bounds_wgs84 && (
                    <div className="mt-3 border border-[#E0E1DC] bg-[#F7F8F5] p-3.5 sm:p-4">
                      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]">
                        Cakupan Wilayah (WGS 84 Bounds)
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                        <div className="border border-[#E0E1DC] bg-white p-2.5">
                          <span className="block text-[9px] font-semibold leading-4 text-[#999B94] sm:text-[10px]">
                            Bujur Barat (Min Lon)
                          </span>

                          <span className="mt-0.5 block font-bold tabular-nums text-[#171717]">
                            {metadataMap.geo_metadata.bounds_wgs84.min_lon}°
                          </span>
                        </div>

                        <div className="border border-[#E0E1DC] bg-white p-2.5">
                          <span className="block text-[9px] font-semibold leading-4 text-[#999B94] sm:text-[10px]">
                            Bujur Timur (Max Lon)
                          </span>

                          <span className="mt-0.5 block font-bold tabular-nums text-[#171717]">
                            {metadataMap.geo_metadata.bounds_wgs84.max_lon}°
                          </span>
                        </div>

                        <div className="border border-[#E0E1DC] bg-white p-2.5">
                          <span className="block text-[9px] font-semibold leading-4 text-[#999B94] sm:text-[10px]">
                            Lintang Selatan (Min Lat)
                          </span>

                          <span className="mt-0.5 block font-bold tabular-nums text-[#171717]">
                            {metadataMap.geo_metadata.bounds_wgs84.min_lat}°
                          </span>
                        </div>

                        <div className="border border-[#E0E1DC] bg-white p-2.5">
                          <span className="block text-[9px] font-semibold leading-4 text-[#999B94] sm:text-[10px]">
                            Lintang Utara (Max Lat)
                          </span>

                          <span className="mt-0.5 block font-bold tabular-nums text-[#171717]">
                            {metadataMap.geo_metadata.bounds_wgs84.max_lat}°
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-[#DCDDD8] bg-[#F7F8F5] p-4 text-center">
                  <p className="text-[11px] font-medium leading-5 text-[#858780] sm:text-xs">
                    Metadata geospasial tidak tersemat pada berkas ini.
                  </p>
                </div>
              )}

              {/* DESCRIPTION */}

              {metadataMap.description && (
                <div className="border border-[#E0E1DC] bg-[#F7F8F5] p-3.5 sm:p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]">
                    Deskripsi
                  </p>

                  <p className="mt-2 text-[11px] font-medium leading-6 text-[#4E504A] sm:text-xs">
                    {metadataMap.description}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="grid grid-cols-1 gap-2 border-t border-[#E6E7E2] px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
              <SweepButton
                tone="dark"
                onClick={() => {
                  openEditModal(metadataMap);

                  setMetadataMap(null);
                }}
                sizing="w-full px-5 py-3.5"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Edit Peta
              </SweepButton>

              <button
                type="button"
                onClick={() => setMetadataMap(null)}
                className="w-full border border-[#DCDDD8] bg-white px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#555750] transition-colors hover:bg-[#F8F8F6] sm:text-[10px]"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =====================================================
          EDIT MODAL
      ====================================================== */}

      {editingMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.35)]"
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-3 border-b border-[#E6E7E2] px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#999B94] sm:text-[10px] sm:tracking-[0.16em]">
                  INFORMASI PETA
                </p>

                <h3 className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-[#171717] sm:text-xl">
                  Edit Informasi Peta
                </h3>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717] sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6">
              {/* TITLE */}

              <div>
                <label
                  htmlFor="edit-map-title"
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]"
                >
                  Judul Peta
                </label>

                <input
                  id="edit-map-title"
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      title: event.target.value,
                    })
                  }
                  className={`mt-2 h-10 w-full border bg-[#FAFAF8] px-3.5 text-[13px] font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:bg-white focus:ring-4 focus:ring-black/[0.03] sm:h-11 sm:px-4 sm:text-sm ${
                    editErrors.title
                      ? "border-[#E7D0CC] focus:border-[#C27B72]"
                      : "border-[#DCDDD8] focus:border-[#BFC4B8]"
                  }`}
                  placeholder="Contoh: Peta Orthomosaic Lahan Padi - Jul 2026"
                />

                {editErrors.title && (
                  <p className="mt-1.5 text-[11px] font-semibold text-[#9B3E32] sm:text-xs">
                    {editErrors.title}
                  </p>
                )}
              </div>

              {/* LOCATION */}

              <div>
                <label
                  htmlFor="edit-map-location"
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]"
                >
                  Lokasi / Wilayah
                </label>

                <div className="relative mt-2">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0A29B] sm:left-4"
                    strokeWidth={1.8}
                  />

                  <input
                    id="edit-map-location"
                    type="text"
                    value={editForm.location}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        location: event.target.value,
                      })
                    }
                    className={`h-10 w-full border bg-[#FAFAF8] pl-10 pr-3.5 text-[13px] font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:bg-white focus:ring-4 focus:ring-black/[0.03] sm:h-11 sm:pl-11 sm:pr-4 sm:text-sm ${
                      editErrors.location
                        ? "border-[#E7D0CC] focus:border-[#C27B72]"
                        : "border-[#DCDDD8] focus:border-[#BFC4B8]"
                    }`}
                    placeholder="Contoh: Desa Sriharjo, Kec. Imogiri, Bantul"
                  />
                </div>

                {editErrors.location && (
                  <p className="mt-1.5 text-[11px] font-semibold text-[#9B3E32] sm:text-xs">
                    {editErrors.location}
                  </p>
                )}
              </div>

              {/* DATE */}

              <div>
                <label
                  htmlFor="edit-map-date"
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]"
                >
                  Tanggal Survey Drone
                </label>

                <div className="relative mt-2">
                  <Calendar
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0A29B] sm:left-4"
                    strokeWidth={1.8}
                  />

                  <input
                    id="edit-map-date"
                    type="date"
                    value={editForm.survey_date}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        survey_date: event.target.value,
                      })
                    }
                    className={`h-10 w-full border bg-[#FAFAF8] pl-10 pr-3.5 text-[13px] font-medium text-[#171717] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-black/[0.03] sm:h-11 sm:pl-11 sm:pr-4 sm:text-sm ${
                      editErrors.survey_date
                        ? "border-[#E7D0CC] focus:border-[#C27B72]"
                        : "border-[#DCDDD8] focus:border-[#BFC4B8]"
                    }`}
                  />
                </div>

                {editErrors.survey_date && (
                  <p className="mt-1.5 text-[11px] font-semibold text-[#9B3E32] sm:text-xs">
                    {editErrors.survey_date}
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="edit-map-description"
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]"
                >
                  Deskripsi Tambahan (Opsional)
                </label>

                <textarea
                  id="edit-map-description"
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="mt-2 w-full resize-none border border-[#DCDDD8] bg-[#FAFAF8] px-3.5 py-3 text-[13px] font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:border-[#BFC4B8] focus:bg-white focus:ring-4 focus:ring-black/[0.03] sm:px-4 sm:text-sm"
                  placeholder="Informasi ketinggian terbang, sensor kamera, dsb..."
                />
              </div>

              {/* ACCESS */}

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E1E2DD] bg-[#F7F8F5]">
                    <Lock
                      className="h-3.5 w-3.5 text-[#666861]"
                      strokeWidth={1.8}
                    />
                  </span>

                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#999B94] sm:text-[10px] sm:tracking-[0.14em]">
                    Aturan Akses &amp; Monetisasi DaaS
                  </span>
                </div>

                <div className="space-y-2">
                  {/* LOCK */}

                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border p-3.5 transition-colors hover:border-[#BFC4B8] hover:bg-[#F7F8F5] sm:p-4",

                      editForm.locked_for_free
                        ? "border-[#BFC4B8] bg-[#F7F8F5]"
                        : "border-[#E1E2DD] bg-white"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.locked_for_free}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          locked_for_free: event.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 border-[#DCDDD8] text-[#171717] accent-[#171717] focus:ring-[#171717]/20"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#171717] sm:text-xs">
                        Kunci untuk Member Free
                      </p>

                      <p className="mt-1 text-[10px] font-medium leading-5 text-[#858780] sm:text-[11px]">
                        Hanya member berbayar (Tier Desa/Kecamatan) yang dapat
                        mengakses data peta ini
                      </p>
                    </div>
                  </label>

                  {/* PURCHASE */}

                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border p-3.5 transition-colors hover:border-[#BFC4B8] hover:bg-[#F7F8F5] sm:p-4",

                      editForm.purchasable
                        ? "border-[#BFC4B8] bg-[#F7F8F5]"
                        : "border-[#E1E2DD] bg-white"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.purchasable}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          purchasable: event.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 border-[#DCDDD8] text-[#171717] accent-[#171717] focus:ring-[#171717]/20"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#171717] sm:text-xs">
                        Tersedia untuk Pembelian Satuan
                      </p>

                      <p className="mt-1 text-[10px] font-medium leading-5 text-[#858780] sm:text-[11px]">
                        User dapat membeli akses peta ini secara terpisah tanpa
                        langganan
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="grid grid-cols-1 gap-2 border-t border-[#E6E7E2] px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
              <SweepButton
                tone="dark"
                onClick={submitEdit}
                disabled={isSavingEdit}
                sizing="w-full px-5 py-3.5"
              >
                {isSavingEdit && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Simpan Perubahan
              </SweepButton>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSavingEdit}
                className="w-full border border-[#DCDDD8] bg-white px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#555750] transition-colors hover:bg-[#F8F8F6] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[10px]"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =====================================================
          DELETE MODAL
      ====================================================== */}

      {deletingMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-sm overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.35)]"
          >
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <span className="flex h-10 w-10 items-center justify-center border border-[#E7D0CC] bg-[#FFF7F5] sm:h-11 sm:w-11">
                <AlertTriangle
                  className="h-5 w-5 text-[#9B3E32]"
                  strokeWidth={1.8}
                />
              </span>

              <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.13em] text-[#999B94] sm:mt-5 sm:text-[10px] sm:tracking-[0.16em]">
                DELETE DATA
              </p>

              <h3 className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-[#171717] sm:text-xl">
                Hapus Peta?
              </h3>

              <p className="mt-2 text-[11px] font-medium leading-6 text-[#858780] sm:text-xs">
                Peta{" "}
                <span className="font-bold text-[#171717]">
                  &quot;
                  {deletingMap.title}
                  &quot;
                </span>{" "}
                akan dihapus secara permanen.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#9B3E32] px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#843228] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[10px]"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  Hapus
                </button>

                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  disabled={isDeleting}
                  className="w-full border border-[#DCDDD8] bg-white px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#555750] transition-colors hover:bg-[#F8F8F6] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[10px]"
                >
                  Batal
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* =====================================================
          PREMIUM MODAL
      ====================================================== */}

      {toastMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-md overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.35)]"
          >
            {/* PREMIUM HEADER */}

            <div className="relative overflow-hidden bg-[#171717] px-5 py-6 text-white sm:px-7 sm:py-8">
              <div className="absolute inset-x-0 top-0 z-20 h-1 bg-[#76B900]" />

              <PlanGeometry
                dark
                className="-right-8 -top-2 w-[62%] max-w-[260px] sm:-right-6 sm:w-[62%] sm:max-w-[280px]"
              />

              <button
                type="button"
                onClick={() => setToastMessage("")}
                className="absolute right-3.5 top-4 z-20 flex h-8 w-8 items-center justify-center border border-white/10 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-4 sm:top-5 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>

              <div className="relative z-10">
                <span className="flex h-10 w-10 items-center justify-center bg-[#76B900] text-[#0F1A00] sm:h-11 sm:w-11">
                  <Crown className="h-5 w-5" strokeWidth={1.8} />
                </span>

                <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.13em] text-[#76B900] sm:mt-5 sm:text-[10px] sm:tracking-[0.16em]">
                  PREMIUM ACCESS
                </p>

                <h3 className="mt-1.5 text-[21px] font-bold tracking-[-0.04em] text-white sm:text-2xl">
                  Fitur ini terkunci
                </h3>

                <p className="mt-2 max-w-[85%] text-[11px] font-medium leading-5 text-white/55 sm:text-xs">
                  Upgrade untuk mendapatkan akses penuh.
                </p>
              </div>
            </div>

            {/* BODY */}

            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-[11px] font-medium leading-6 text-[#4E504A] sm:text-sm">
                {toastMessage}
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:mt-6">
                <Link
                  href="/dashboard/subscription"
                  className="group/sweep relative inline-flex w-full items-center justify-center overflow-hidden bg-[#171717] px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[#76B900] focus-visible:ring-offset-2 active:scale-[0.985] sm:text-[10px]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 origin-right scale-x-0 transform-gpu bg-[#76B900] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover/sweep:origin-left group-hover/sweep:scale-x-100 motion-reduce:transition-none"
                  />

                  <span className="relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-500 ease-out group-hover/sweep:text-[#0F1A00]">
                    Lihat Paket Langganan
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setToastMessage("")}
                  className="w-full border border-[#DCDDD8] bg-white px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#555750] transition-colors hover:bg-[#F8F8F6] sm:text-[10px]"
                >
                  Mungkin Nanti
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
