"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  Map as MapIcon,
  Layers,
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
  Calendar,
  MapPin,
  ScanLine,
  Lock,
  Gem,
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
   3D ISOMETRIC WIREFRAME (dipakai di modal Premium)
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
  blocks: { top: string; left: string; right: string; levels: string }[];
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

      return { top, left, right, levels };
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

const NON_SCALING = { vectorEffect: "non-scaling-stroke" as const };

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
      staggerChildren: 0.07,
      delayChildren: 0.12,
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
      duration: 0.4,
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
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [isMinSearchFocused, setIsMinSearchFocused] = useState(false);

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
    color: "bg-[#76B900]",
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
    <main className="min-h-screen bg-[#F4F5F2] text-[#151515]">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
        {/* ===================================================
            PAGE HEADER
        ==================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-5 sm:mb-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <h1 className="max-w-3xl text-[28px] font-bold leading-[1.08] tracking-[-0.045em] text-[#111111] sm:text-[34px] lg:text-[42px]">
                Peta &amp; Analisis{" "}
                <span className="text-[#171717]">Geospasial</span>
              </h1>

              <p className="mt-2.5 max-w-2xl text-[11px] font-medium leading-[1.7] text-[#767871] sm:mt-3 sm:text-sm sm:leading-6">
                Jelajahi hasil pemetaan drone, lihat metadata raster, dan unduh
                hasil analisis berdasarkan cakupan wilayah Anda.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto">
              <span className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 border border-[#D8DAD4] bg-white px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.07em] text-[#595B55] sm:flex-none sm:px-3.5 sm:text-[11px] sm:tracking-[0.08em]">
                <Gem className="h-3.5 w-3.5 text-[#666861]" strokeWidth={1.8} />
                <span className="truncate">{tierBadgeLabel}</span>
              </span>

              <span className="inline-flex shrink-0 items-center justify-center border border-[#D8DAD4] bg-white px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.07em] text-[#777972] sm:px-3.5 sm:text-[11px] sm:tracking-[0.08em]">
                {maps.length} Peta
              </span>
            </div>
          </div>
        </motion.header>

        {/* ===================================================
            ACTIVE MAP SUMMARY
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          aria-label="Ringkasan peta aktif"
          className="relative mb-4 overflow-hidden rounded-none border border-[#DCDDD8] bg-white sm:mb-5"
        >
          {/* accent bar kiri */}

          <motion.span
            aria-hidden="true"
            initial={{
              scaleY: 0,
            }}
            animate={{
              scaleY: 1,
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              originY: 0,
            }}
            className={`absolute inset-y-0 left-0 w-[3px] ${
              selectedMap ? "bg-[#76B900]" : "bg-[#C5C7C1]"
            }`}
          />

          {/* garis tipis atas */}

          {selectedMap && (
            <motion.span
              aria-hidden="true"
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                duration: 0.9,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                originX: 0,
              }}
              className="absolute inset-x-0 top-0 h-px bg-[#76B900]/70"
            />
          )}

          <motion.div
            variants={overviewContainer}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center py-4 pl-5 pr-4 sm:py-4 sm:pl-6 sm:pr-5 lg:flex-nowrap"
          >
            {/* IDENTITY */}

            <motion.div
              variants={overviewItem}
              className="order-1 flex min-w-0 max-w-full items-center gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] sm:h-10 sm:w-10">
                <ScanLine
                  className="h-4 w-4 text-[#666861]"
                  strokeWidth={1.8}
                />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-medium text-[#8A8C85] sm:text-[11px]">
                  Peta aktif
                </p>

                <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                  <p className="max-w-[calc(100vw-135px)] truncate text-[13px] font-semibold text-[#171717] sm:max-w-[400px] sm:text-sm lg:max-w-[360px]">
                    {selectedMap ? selectedMap.name : "Belum ada layer dipilih"}
                  </p>

                  <span
                    className={`inline-flex h-5 shrink-0 items-center rounded-none px-2 text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.12em] ${
                      selectedMap
                        ? "bg-[#76B900] text-[#0F1A00]"
                        : "bg-[#EEEFEA] text-[#666861]"
                    }`}
                  >
                    {selectedMap
                      ? selectedMap.format?.toUpperCase() || "UNKNOWN"
                      : "Kosong"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* DOWNLOAD */}

            <motion.div
              variants={overviewItem}
              className="order-2 ml-auto mt-3 w-full lg:order-3 lg:ml-6 lg:mt-0 lg:w-auto"
            >
              {isDownloadLocked ? (
                <button
                  type="button"
                  onClick={handleDownloadAnalysis}
                  disabled={isDownloadingAnalysis}
                  className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 border border-[#DCDDD8] bg-[#F4F5F2] px-4 text-[9px] font-bold uppercase tracking-[0.08em] text-[#A0A19C] transition-colors hover:border-[#C8CAC4] sm:text-[10px] lg:w-auto"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Download Analisa
                </button>
              ) : (
                <SweepButton
                  onClick={handleDownloadAnalysis}
                  disabled={isDownloadingAnalysis}
                  sizing="h-10 w-full gap-2 px-4 lg:w-auto"
                >
                  {isDownloadingAnalysis ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}

                  {isDownloadingAnalysis ? "Menyiapkan..." : "Download Analisa"}
                </SweepButton>
              )}
            </motion.div>

            {/* DETAILS */}

            <dl className="order-3 mt-3 grid w-full grid-cols-2 gap-x-4 gap-y-3 border-t border-[#EEEFEA] pt-3 sm:grid-cols-3 sm:gap-x-6 lg:order-2 lg:ml-8 lg:mt-0 lg:w-auto lg:flex-1 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <motion.div
                variants={overviewItem}
                className="col-span-2 min-w-0 sm:col-span-1"
              >
                <dt className="text-[10px] font-medium text-[#8A8C85] sm:text-[11px]">
                  Lokasi
                </dt>

                <dd className="mt-0.5 truncate text-[13px] font-semibold text-[#171717] sm:text-sm">
                  {selectedMap?.location || "—"}
                </dd>
              </motion.div>

              <motion.div
                variants={overviewItem}
                className="min-w-0 lg:border-l lg:border-[#EEEFEA] lg:pl-6"
              >
                <dt className="text-[10px] font-medium text-[#8A8C85] sm:text-[11px]">
                  Ukuran file
                </dt>

                <dd className="mt-0.5 truncate text-[13px] font-semibold tabular-nums text-[#171717] sm:text-sm">
                  {selectedMap ? `${selectedMap.size} MB` : "—"}
                </dd>
              </motion.div>

              <motion.div
                variants={overviewItem}
                className="min-w-0 lg:border-l lg:border-[#EEEFEA] lg:pl-6"
              >
                <dt className="text-[10px] font-medium text-[#8A8C85] sm:text-[11px]">
                  Tanggal survey
                </dt>

                <dd className="mt-0.5 truncate text-[13px] font-semibold tabular-nums text-[#171717] sm:text-sm">
                  {selectedMap ? selectedMap.date : "—"}
                </dd>
              </motion.div>
            </dl>
          </motion.div>
        </motion.section>

        {/* ===================================================
            SEARCH RESULT INFO
        ==================================================== */}

        {searchQuery && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-0.5 sm:mb-4">
            <p className="text-[11px] font-medium text-[#858780] sm:text-xs">
              Menampilkan{" "}
              <span className="font-bold text-[#171717]">
                {filteredMapLayers.length}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-[#171717]">{maps.length}</span>{" "}
              peta
            </p>

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-bold text-[#171717] transition-colors hover:text-[#76B900] sm:text-xs"
            >
              Hapus pencarian
            </button>
          </div>
        )}

        {/* ===================================================
            MAP WORKSPACE
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.025)]"
        >
          {/* =================================================
              MAP & FLOATING MAP LAYERS
          ================================================== */}

          <div
            ref={mapContainerRef}
            className={`relative w-full bg-[#E8ECE5] ${
              isFullscreen
                ? "h-screen w-screen"
                : "h-[500px] sm:h-[560px] lg:h-[620px]"
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
                FLOATING TOGGLE
            ================================================== */}

            {!isLayerPanelOpen && (
              <div className="absolute left-2 top-2 z-30 flex items-center gap-2 sm:left-3 sm:top-3">
                <button
                  type="button"
                  onClick={() => setIsLayerPanelOpen(true)}
                  className="group/toggle inline-flex shrink-0 items-center gap-2 border border-[#DCDDD8] bg-white px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.07em] text-[#171717] shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-colors duration-200 hover:border-[#171717] hover:bg-[#171717] hover:text-white sm:px-3.5 sm:text-[10px] sm:tracking-[0.08em]"
                  title="Buka daftar peta (Maximize)"
                >
                  <Layers
                    className="h-3.5 w-3.5 text-[#666861] transition-colors group-hover/toggle:text-white"
                    strokeWidth={1.8}
                  />

                  <span>Daftar Peta</span>

                  <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-1.5 py-0.5 text-[9px] font-extrabold text-[#171717] sm:text-[10px]">
                    {maps.length}
                  </span>
                </button>
              </div>
            )}

            {/* =================================================
                FLOATING MAP LAYERS PANEL
            ================================================== */}

            {isLayerPanelOpen && (
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
                className="absolute left-2 top-2 z-30 flex max-h-[calc(100%-16px)] w-[calc(100%-16px)] max-w-[320px] flex-col overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.10)] sm:left-3 sm:top-3 sm:max-h-[calc(100%-100px)] sm:w-[300px]"
              >
                {/* PANEL HEADER */}

                <div className="border-b border-[#E7E8E3] px-3.5 py-3.5 sm:px-4 sm:py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#999B94] sm:text-[10px] sm:tracking-[0.16em]">
                        Layer
                      </p>

                      <h2 className="mt-1 text-[13px] font-bold tracking-[-0.02em] text-[#171717] sm:text-sm">
                        Pilih Peta Anda
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="hidden shrink-0 text-[10px] font-semibold tabular-nums text-[#858780] min-[430px]:inline sm:text-[11px]">
                        {searchQuery
                          ? `${filteredMapLayers.length} / ${maps.length}`
                          : `${maps.length} Peta`}
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsLayerPanelOpen(false)}
                        className="flex h-8 w-8 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717]"
                        title="Sembunyikan daftar peta (Minimize)"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  {/* SEARCH INPUT */}

                  <div className="relative mt-3 flex items-center">
                    <Search
                      className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#A0A29B]"
                      strokeWidth={1.8}
                    />

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsMinSearchFocused(true)}
                      onBlur={() => setIsMinSearchFocused(false)}
                      placeholder="Cari peta..."
                      className={`h-9 w-full border bg-[#FAFAF8] pl-9 pr-9 text-[11px] font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:bg-white sm:h-10 sm:text-xs ${
                        isMinSearchFocused
                          ? "border-[#BFC4B8] ring-4 ring-black/[0.03]"
                          : "border-[#DCDDD8]"
                      }`}
                    />

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 flex h-6 w-6 items-center justify-center text-[#A0A29B] transition-colors hover:text-[#171717]"
                        title="Hapus pencarian"
                      >
                        <X className="h-3 w-3" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </div>

                {/* LAYERS LIST */}

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#FAFAF8] p-2 overscroll-contain sm:p-2.5">
                  {/* LOADING */}

                  {loading && (
                    <div className="flex items-center justify-center gap-3 border border-[#DCDDD8] bg-white px-4 py-7 text-[#555750] sm:py-8">
                      <Loader2 className="h-4 w-4 animate-spin" />

                      <span className="text-[11px] font-medium sm:text-xs">
                        Memuat data peta...
                      </span>
                    </div>
                  )}

                  {/* ERROR */}

                  {!loading && error && (
                    <div className="flex items-start gap-3 border border-[#E7D0CC] bg-[#FFF7F5] px-3.5 py-3 text-[11px] font-medium leading-5 text-[#9B3E32] sm:px-4 sm:py-3.5 sm:text-xs">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        strokeWidth={1.75}
                      />

                      <span className="min-w-0 flex-1">{error}</span>
                    </div>
                  )}

                  {/* EMPTY */}

                  {!loading && !error && maps.length === 0 && (
                    <div className="border border-dashed border-[#DCDDD8] bg-white px-4 py-7 text-center sm:py-8">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6]">
                        <MapIcon
                          className="h-4 w-4 text-[#777972]"
                          strokeWidth={1.7}
                        />
                      </div>

                      <p className="mt-3 text-[13px] font-bold text-[#1B1B1B] sm:text-sm">
                        Belum ada peta
                      </p>

                      <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#858780] sm:text-xs">
                        Upload peta pertama Anda untuk mulai melakukan analisis.
                      </p>
                    </div>
                  )}

                  {/* SEARCH EMPTY */}

                  {!loading &&
                    !error &&
                    maps.length > 0 &&
                    filteredMapLayers.length === 0 && (
                      <div className="border border-dashed border-[#DCDDD8] bg-white px-4 py-7 text-center sm:py-8">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6]">
                          <Search
                            className="h-4 w-4 text-[#777972]"
                            strokeWidth={1.7}
                          />
                        </div>

                        <p className="mt-3 text-[13px] font-bold text-[#1B1B1B] sm:text-sm">
                          Peta tidak ditemukan
                        </p>

                        <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#858780] sm:text-xs">
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
                        aria-pressed={active}
                        className={cn(
                          "group relative select-none overflow-hidden border p-3.5 transition-all duration-300 sm:p-4",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
                          {
                            "border-[#171717] border-l-[3px] border-l-[#76B900] bg-[#171717] text-white shadow-[0_12px_30px_rgba(0,0,0,0.10)]":
                              active,
                            "border-[#DCDDD8] bg-white text-[#171717] shadow-[0_8px_25px_rgba(0,0,0,0.025)]":
                              !active,
                            "cursor-not-allowed": layer.locked,
                            "cursor-pointer": !layer.locked,
                            "hover:-translate-y-0.5 hover:border-[#C8CAC4] hover:shadow-[0_16px_35px_rgba(0,0,0,0.06)]":
                              !layer.locked && !active,
                          }
                        )}
                      >
                        {/* Card Header */}

                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3
                                className={cn(
                                  "whitespace-normal break-words text-[13px] font-bold leading-snug tracking-[-0.01em] sm:text-sm",
                                  active ? "text-white" : "text-[#171717]"
                                )}
                              >
                                {layer.name}
                              </h3>

                              {layer.locked && (
                                <span className="inline-flex shrink-0 items-center gap-1 border border-[#E0E2DC] bg-[#F7F8F5] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#666861] sm:px-2 sm:text-[9px] sm:tracking-[0.1em]">
                                  <Lock
                                    className="h-3 w-3"
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                  />
                                  Pro
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}

                          {(isAdmin || !layer.locked) && (
                            <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(event) => openEditModal(raw, event)}
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2",
                                  active
                                    ? "text-white/75 hover:border-white/15 hover:bg-white/10 hover:text-white focus-visible:ring-white/30"
                                    : "text-[#858780] hover:border-[#E0E1DC] hover:bg-[#F7F8F5] hover:text-[#171717] focus-visible:ring-[#76B900]/20"
                                )}
                                title="Edit peta"
                              >
                                <Pencil
                                  className="h-4 w-4"
                                  strokeWidth={1.6}
                                  aria-hidden="true"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={(event) =>
                                  openDeleteConfirm(raw, event)
                                }
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center border border-transparent transition-colors hover:border-[#E7D0CC] hover:bg-[#FFF7F5] hover:text-[#9B3E32] focus-visible:outline-none focus-visible:ring-2",
                                  active
                                    ? "text-white/75 focus-visible:ring-white/30"
                                    : "text-[#858780] focus-visible:ring-[#E7D0CC]"
                                )}
                                title="Hapus peta"
                              >
                                <Trash2
                                  className="h-4 w-4"
                                  strokeWidth={1.6}
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* META */}

                        <div
                          aria-hidden="true"
                          className={cn(
                            "relative my-2.5 h-px sm:my-3",
                            active ? "bg-white/10" : "bg-[#E7E8E3]"
                          )}
                        />

                        <div
                          className={cn(
                            "relative flex flex-col gap-1.5 text-[10px] font-medium sm:text-xs",
                            active ? "text-white/70" : "text-[#858780]"
                          )}
                        >
                          {/* DATE */}

                          <div className="flex items-center gap-2">
                            <Calendar
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                active ? "text-white/55" : "text-[#A0A29B]"
                              )}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />

                            <span className="whitespace-normal break-words font-mono tabular-nums">
                              {layer.date}
                            </span>
                          </div>

                          {/* LOCATION */}

                          <div className="flex items-start gap-2">
                            <MapPin
                              className={cn(
                                "mt-0.5 h-3.5 w-3.5 shrink-0",
                                active ? "text-white/55" : "text-[#A0A29B]"
                              )}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />

                            <span className="whitespace-normal break-words leading-tight">
                              {layer.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.aside>
            )}
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="flex flex-col gap-3 border-t border-[#E7E8E3] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <p className="min-w-0 text-[11px] font-medium text-[#858780] sm:text-xs">
              <span className="font-bold tabular-nums text-[#171717]">
                {maps.length}
              </span>{" "}
              peta tersimpan
            </p>

            <button
              type="button"
              onClick={() => setMetadataMap(selectedMapRaw)}
              disabled={!selectedMapRaw}
              className="group inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-none border border-[#DCDDD8] bg-white px-3 text-[11px] font-semibold text-[#3F413B] transition-colors duration-200 hover:border-[#171717] hover:bg-[#171717] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#DCDDD8] disabled:hover:bg-white disabled:hover:text-[#3F413B] sm:h-8 sm:w-auto sm:text-xs"
            >
              Lihat Metadata
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
                strokeWidth={1.8}
              />
            </button>
          </div>
        </motion.section>
      </div>

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
