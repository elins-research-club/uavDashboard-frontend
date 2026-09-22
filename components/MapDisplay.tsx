"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import * as pmtiles from "pmtiles";
import * as turf from "@turf/turf";

import {
  RotateCcw,
  RotateCw,
  Ruler,
  SplitSquareVertical,
  Trash2,
  MousePointer,
  Info,
  Check,
  Undo2,
  ArrowLeftRight,
  X,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sprout,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import LayerControlPanel from "@/components/LayerControlPanel";
import MapLegend from "@/components/MapLegend";
import type { MapLayerItem } from "@/types/map";
import { generatePetakGrid, type PetakProperties } from "@/lib/gridGenerator";
import { cn } from "@/lib/utils";
import { EASE, ICON_STROKE } from "@/app/dashboard/upload/upload-ui";

/* =========================================================
   PMTILES REGISTRATION
========================================================= */

let pmtilesRegistered = false;

if (typeof window !== "undefined") {
  try {
    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
  } catch {
    // Worker URL failed or already set
  }

  if (!pmtilesRegistered) {
    try {
      const protocol = new pmtiles.Protocol();

      maplibregl.addProtocol("pmtiles", protocol.tile);

      pmtilesRegistered = true;
    } catch {
      // Protocol already registered.
    }
  }
}

/* =========================================================
   TYPES
========================================================= */

interface MapDisplayProps {
  mapId?: string;
  token?: string;
  mapFormat?: string;
  mapTitle?: string;
  mapLocation?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resize: () => void;

  rotateLeft: () => void;
  rotateRight: () => void;

  resetNorth: () => void;

  getBearing: () => number;

  setBearing: (deg: number) => void;

  tiltUp: () => void;
  tiltDown: () => void;

  resetView: () => void;

  toggle3D: () => void;

  is3D: () => boolean;
}

interface BoundsResponse {
  bounds: [[number, number], [number, number]];

  center: [number, number];

  has_tiles: boolean;

  gps_source: string;

  title?: string;

  location?: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_POSITION: [number, number] = [110.3695, -7.7956];

const TERRAIN_SOURCE_ID = "terrain-dem";

const TERRAIN_SOURCE_URL = "https://tiles.mapterhorn.com/tilejson.json";

const BASEMAP_SATELLITE_SOURCE_ID = "basemap-satellite-source";

const BASEMAP_SATELLITE_LAYER_ID = "basemap-satellite-layer";

const SATELLITE_LABEL_SOURCE_ID = "satellite-labels-source";

const SATELLITE_LABEL_LAYER_ID = "satellite-labels-layer";

const BASEMAP_STREET_SOURCE_ID = "basemap-street-source";

const BASEMAP_STREET_LAYER_ID = "basemap-street-layer";

const UAV_RASTER_SOURCE_ID = "uav-raster";
const UAV_RASTER_LAYER_ID = "uav-raster-layer";

const UAV_IMAGE_SOURCE_ID = "uav-image";
const UAV_IMAGE_LAYER_ID = "uav-image-layer";

/* Warna aksen tema */
const INK = "#171717";
const ACCENT = "#76B900";

/* =========================================================
   BASEMAPS
========================================================= */

const BASEMAPS = {
  satellite: {
    name: "Satelit Bumi",

    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

    labels:
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",

    maxzoom: 18,

    attribution:
      "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },

  street: {
    name: "Peta Jalan (OSM)",

    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

    labels: null,

    maxzoom: 19,

    attribution: "© OpenStreetMap contributors",
  },
};

/* =========================================================
   SHARED UI BITS
========================================================= */

const eyebrowClass =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-[#999B94]";

const hudCardMotion = {
  initial: {
    opacity: 0,
    y: -8,
  },

  animate: {
    opacity: 1,
    y: 0,
  },

  exit: {
    opacity: 0,
    y: -8,
  },

  transition: {
    duration: 0.25,
    ease: EASE,
  },
} as const;

const hudCardClass =
  "border border-[#DCDDD8] bg-white/95 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.10)] backdrop-blur-md";

function ToolbarButton({
  active,
  title,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  title?: string;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      aria-label={label}
      className={cn(
        "group relative flex h-9 w-9 shrink-0 items-center justify-center border outline-none transition-all duration-150",
        "focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
        active
          ? "border-[#171717] bg-[#171717] text-white"
          : "border-transparent bg-white text-[#555750] hover:border-[#DCDDD8] hover:bg-[#F7F8F5] hover:text-[#171717]"
      )}
    >
      {children}

      {/* TOOLTIP */}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-[100] -translate-x-1/2 whitespace-nowrap",
          "border border-[#DCDDD8] bg-[#171717] px-2 py-1 text-[10px] font-medium text-white",
          "translate-y-[-2px] opacity-0 shadow-[0_8px_18px_rgba(0,0,0,0.10)] transition-all duration-150",
          "group-hover:translate-y-0 group-hover:opacity-100"
        )}
      >
        {label}
      </span>
    </button>
  );
}

function HudHeader({
  eyebrow,
  title,
  onClose,
  closeLabel,
  meta,
  icon,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  closeLabel: string;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E7E8E3] pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon}

        <div className="min-w-0">
          <p className={eyebrowClass}>{eyebrow}</p>

          <h4 className="mt-1 text-sm font-bold tracking-[-0.02em] text-[#171717]">
            {title}
          </h4>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {meta}

        <button
          type="button"
          onClick={onClose}
          title={closeLabel}
          aria-label={closeLabel}
          className="flex h-8 w-8 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] outline-none transition-colors hover:bg-[#F2F3EF] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
        >
          <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   SWEEP BUTTON
========================================================= */

function SweepButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="group/sweep relative inline-flex items-center justify-center gap-1.5 overflow-hidden bg-[#171717] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[#76B900] focus-visible:ring-offset-2 active:scale-[0.985]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-right scale-x-0 transform-gpu bg-[#76B900] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover/sweep:origin-left group-hover/sweep:scale-x-100 motion-reduce:transition-none"
      />

      <span className="relative z-10 inline-flex items-center justify-center gap-1.5 transition-colors duration-500 ease-out group-hover/sweep:text-[#0F1A00]">
        {children}
      </span>
    </button>
  );
}

/* =========================================================
   ACCORDION ROW
========================================================= */

function AccordionRow({
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#E0E1DC] bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left outline-none transition-colors hover:bg-[#F7F8F5] focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
      >
        <span className="text-[11px] font-bold text-[#171717]">{title}</span>

        <span className="flex items-center gap-1.5">
          {badge && (
            <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#666861]">
              {badge}
            </span>
          )}

          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[#858780] transition-transform duration-200",
              open && "rotate-180"
            )}
            strokeWidth={ICON_STROKE}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-[#E7E8E3] px-2.5 py-2">{children}</div>
      )}
    </div>
  );
}

const hudButtonSecondary =
  "inline-flex items-center justify-center gap-1.5 border border-[#DCDDD8] bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#555750] outline-none transition-colors hover:bg-[#F8F8F6] focus-visible:ring-2 focus-visible:ring-[#76B900]/40";

const compareSelectClass =
  "h-9 w-full border border-[#DCDDD8] bg-[#FAFAF8] px-2.5 text-xs font-medium text-[#171717] outline-none transition-all hover:border-[#C8CAC4] focus:border-[#BFC4B8] focus:bg-white focus:ring-4 focus:ring-black/[0.03]";

/* =========================================================
   COMPONENT
========================================================= */

const MapDisplay = forwardRef<MapHandle, MapDisplayProps>(
  (
    {
      mapId,
      token,
      mapFormat,
      mapTitle,
      mapLocation,
      isFullscreen: isFullscreenProp,
      onToggleFullscreen,
    },
    ref
  ) => {
    /* =====================================================
       REFS
    ====================================================== */

    const containerRef = useRef<HTMLDivElement | null>(null);

    const mapRef = useRef<maplibregl.Map | null>(null);

    const basemapRef = useRef<keyof typeof BASEMAPS>("street");

    const overlayOpacityRef = useRef(0.95);

    const terrainEnabledRef = useRef(false);

    const mapIdRef = useRef(mapId);

    const tokenRef = useRef(token);

    const currentMetaRef = useRef<BoundsResponse | null>(null);

    const mapLayersRef = useRef<MapLayerItem[]>([]);

    /* =====================================================
       STATE
    ====================================================== */

    const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("street");

    const [overlayOpacity, setOverlayOpacity] = useState(0.95);

    const [currentMeta, setCurrentMeta] = useState<BoundsResponse | null>(null);

    const [mapLayers, setMapLayers] = useState<MapLayerItem[]>([]);

    const [bearing, setBearing] = useState(0);

    const [pitch, setPitch] = useState(0);

    const [terrainEnabled, setTerrainEnabled] = useState(false);

    const [loading, setLoading] = useState(false);

    const [mapReady, setMapReady] = useState(false);

    const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);

    const isFullscreen = isFullscreenProp ?? internalIsFullscreen;

    /* =====================================================
       PRECISION FARMING & SPATIAL TOOLS
    ====================================================== */

    const [spatialInfo, setSpatialInfo] = useState<{
      area_hectares?: number | null;
      area_m2?: number | null;
      perimeter_meters?: number | null;
      centroid?: [number, number] | null;
      has_spatial_geometry?: boolean;
      geojson?: any;
    } | null>(null);

    const [postgisCardOpen, setPostgisCardOpen] = useState(false);

    const [toolMode, setToolMode] = useState<"none" | "area" | "distance">(
      "none"
    );

    const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

    const [measuredMetrics, setMeasuredMetrics] = useState<{
      areaHa?: number;
      areaM2?: number;
      perimeterM?: number;
      distanceM?: number;
      distanceKm?: number;
    } | null>(null);

    /* =====================================================
       MULTILAYER COMPARE
    ====================================================== */

    const [compareMode, setCompareMode] = useState(false);

    const [compareLayerA, setCompareLayerA] = useState<string>("");

    const [compareLayerB, setCompareLayerB] = useState<string>("");

    const [compareRatio, setCompareRatio] = useState<number>(50);

    const measureMarkersRef = useRef<maplibregl.Marker[]>([]);

    const isComparingRef = useRef(false);

    /* =====================================================
       DYNAMIC GRID PETAK
    ====================================================== */

    const [gridEnabled, setGridEnabled] = useState(false);

    const gridCellSize = 10;

    const [selectedPetak, setSelectedPetak] = useState<PetakProperties | null>(
      null
    );

    const [petakScreenPos, setPetakScreenPos] = useState<{
      x: number;
      y: number;
    } | null>(null);

    const [popupHeight, setPopupHeight] = useState<number>(190);

    const [petakSection, setPetakSection] = useState<
      "summary" | "layers" | null
    >(null);

    const gridDataRef = useRef<GeoJSON.FeatureCollection<
      GeoJSON.Polygon,
      PetakProperties
    > | null>(null);

    /* =====================================================
       SYNC REFS
    ====================================================== */

    useEffect(() => {
      basemapRef.current = basemap;
    }, [basemap]);

    useEffect(() => {
      overlayOpacityRef.current = overlayOpacity;
    }, [overlayOpacity]);

    useEffect(() => {
      terrainEnabledRef.current = terrainEnabled;
    }, [terrainEnabled]);

    useEffect(() => {
      mapIdRef.current = mapId;
    }, [mapId]);

    useEffect(() => {
      tokenRef.current = token;
    }, [token]);

    useEffect(() => {
      currentMetaRef.current = currentMeta;
    }, [currentMeta]);

    /* =====================================================
       BAKING POLL
    ====================================================== */

    useEffect(() => {
      const hasBaking = mapLayers.some(
        (l) =>
          l.conversion_status === "pending" ||
          l.conversion_status === "processing"
      );

      if (!hasBaking || !mapId) {
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

      let cancelled = false;

      const poll = async () => {
        try {
          const headers: Record<string, string> = {};

          if (tokenRef.current) {
            headers.Authorization = `Bearer ${tokenRef.current}`;
          }

          const res = await fetch(`${baseUrl}/maps/${mapId}/layers`, {
            headers,
          });

          if (!res.ok || cancelled) {
            return;
          }

          const fresh: MapLayerItem[] = await res.json();

          setMapLayers((prev) =>
            prev.map((l) => {
              const updated = fresh.find((f) => f.id === l.id);

              return updated
                ? {
                    ...l,
                    ...updated,
                  }
                : l;
            })
          );

          mapLayersRef.current = mapLayersRef.current.map((l) => {
            const updated = fresh.find((f) => f.id === l.id);

            return updated
              ? {
                  ...l,
                  ...updated,
                }
              : l;
          });

          const map = mapRef.current;

          if (map && currentMetaRef.current) {
            fresh.forEach((fl) => {
              if (fl.conversion_status === "completed" && fl.pmtiles_url) {
                const sourceId = `layer-source-${fl.id}`;

                const layerId = `layer-render-${fl.id}`;

                if (!map.getSource(sourceId)) {
                  const apiOrigin = baseUrl.replace(/\/api\/?$/, "");

                  map.addSource(sourceId, {
                    type: "raster",
                    url: `pmtiles://${apiOrigin}${fl.pmtiles_url}`,
                    tileSize: 256,
                  });
                }

                if (!map.getLayer(layerId)) {
                  map.addLayer({
                    id: layerId,
                    type: "raster",
                    source: sourceId,
                    layout: {
                      visibility: fl.is_visible ? "visible" : "none",
                    },
                    paint: {
                      "raster-opacity": fl.default_opacity,
                      "raster-resampling": "linear",
                      "raster-fade-duration": 150,
                    },
                  });
                }
              }
            });
          }
        } catch {
          // network error — keep polling
        }
      };

      poll();

      const timer = setInterval(poll, 3000);

      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }, [mapId, mapLayers.map((l) => l.conversion_status).join(",")]);

    /* =====================================================
       AUTO RESIZE
    ====================================================== */

    useEffect(() => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const observer = new ResizeObserver(() => {
        mapRef.current?.resize();
      });

      observer.observe(container);

      return () => observer.disconnect();
    }, []);

    /* =====================================================
       HELPERS
    ====================================================== */

    const normalizeBearing = useCallback((value: number) => {
      return ((value % 360) + 360) % 360;
    }, []);

    const getDirection = useCallback((deg: number) => {
      if (deg >= 337.5 || deg < 22.5) {
        return "U";
      }

      if (deg >= 22.5 && deg < 67.5) {
        return "TL";
      }

      if (deg >= 67.5 && deg < 112.5) {
        return "T";
      }

      if (deg >= 112.5 && deg < 157.5) {
        return "TG";
      }

      if (deg >= 157.5 && deg < 202.5) {
        return "S";
      }

      if (deg >= 202.5 && deg < 247.5) {
        return "BD";
      }

      if (deg >= 247.5 && deg < 292.5) {
        return "B";
      }

      return "BL";
    }, []);

    /* =====================================================
       CAMERA
    ====================================================== */

    const syncCameraState = useCallback(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      setBearing(Math.round(normalizeBearing(map.getBearing())));

      setPitch(Math.round(map.getPitch()));
    }, [normalizeBearing]);

    /* =====================================================
       REMOVE UAV
    ====================================================== */

    const removeUavLayers = useCallback(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      mapLayersRef.current.forEach((layer) => {
        const layerId = `layer-render-${layer.id}`;

        const sourceId = `layer-source-${layer.id}`;

        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }

        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });

      if (map.getLayer(UAV_RASTER_LAYER_ID)) {
        map.removeLayer(UAV_RASTER_LAYER_ID);
      }

      if (map.getSource(UAV_RASTER_SOURCE_ID)) {
        map.removeSource(UAV_RASTER_SOURCE_ID);
      }

      if (map.getLayer(UAV_IMAGE_LAYER_ID)) {
        map.removeLayer(UAV_IMAGE_LAYER_ID);
      }

      if (map.getSource(UAV_IMAGE_SOURCE_ID)) {
        map.removeSource(UAV_IMAGE_SOURCE_ID);
      }
    }, []);

    /* =====================================================
       BASEMAP
    ====================================================== */

    const setupInitialBasemaps = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      const currentBm = basemapRef.current;

      if (!map.getSource(BASEMAP_STREET_SOURCE_ID)) {
        map.addSource(BASEMAP_STREET_SOURCE_ID, {
          type: "raster",
          tiles: [BASEMAPS.street.tiles],
          tileSize: 256,
          maxzoom: BASEMAPS.street.maxzoom,
          attribution: BASEMAPS.street.attribution,
        });
      }

      if (!map.getLayer(BASEMAP_STREET_LAYER_ID)) {
        map.addLayer({
          id: BASEMAP_STREET_LAYER_ID,
          type: "raster",
          source: BASEMAP_STREET_SOURCE_ID,
          layout: {
            visibility: currentBm === "street" ? "visible" : "none",
          },
          paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 150,
          },
        });
      }

      if (!map.getSource(BASEMAP_SATELLITE_SOURCE_ID)) {
        map.addSource(BASEMAP_SATELLITE_SOURCE_ID, {
          type: "raster",
          tiles: [BASEMAPS.satellite.tiles],
          tileSize: 256,
          maxzoom: BASEMAPS.satellite.maxzoom,
          attribution: BASEMAPS.satellite.attribution,
        });
      }

      if (!map.getLayer(BASEMAP_SATELLITE_LAYER_ID)) {
        map.addLayer({
          id: BASEMAP_SATELLITE_LAYER_ID,
          type: "raster",
          source: BASEMAP_SATELLITE_SOURCE_ID,
          layout: {
            visibility: currentBm === "satellite" ? "visible" : "none",
          },
          paint: {
            "raster-opacity": 1,
            "raster-fade-duration": 150,
          },
        });
      }

      if (BASEMAPS.satellite.labels) {
        if (!map.getSource(SATELLITE_LABEL_SOURCE_ID)) {
          map.addSource(SATELLITE_LABEL_SOURCE_ID, {
            type: "raster",
            tiles: [BASEMAPS.satellite.labels],
            tileSize: 256,
            maxzoom: BASEMAPS.satellite.maxzoom,
          });
        }

        if (!map.getLayer(SATELLITE_LABEL_LAYER_ID)) {
          map.addLayer({
            id: SATELLITE_LABEL_LAYER_ID,
            type: "raster",
            source: SATELLITE_LABEL_SOURCE_ID,
            layout: {
              visibility: currentBm === "satellite" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": 0.9,
              "raster-fade-duration": 150,
            },
          });
        }
      }
    }, []);

    const applyBasemap = useCallback((target: keyof typeof BASEMAPS) => {
      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      const isSat = target === "satellite";

      if (map.getLayer(BASEMAP_SATELLITE_LAYER_ID)) {
        map.setLayoutProperty(
          BASEMAP_SATELLITE_LAYER_ID,
          "visibility",
          isSat ? "visible" : "none"
        );
      }

      if (map.getLayer(SATELLITE_LABEL_LAYER_ID)) {
        map.setLayoutProperty(
          SATELLITE_LABEL_LAYER_ID,
          "visibility",
          isSat ? "visible" : "none"
        );
      }

      if (map.getLayer(BASEMAP_STREET_LAYER_ID)) {
        map.setLayoutProperty(
          BASEMAP_STREET_LAYER_ID,
          "visibility",
          isSat ? "none" : "visible"
        );
      }
    }, []);

    /* =====================================================
       TERRAIN
    ====================================================== */

    const setupTerrain = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      if (terrainEnabledRef.current) {
        if (!map.getSource(TERRAIN_SOURCE_ID)) {
          map.addSource(TERRAIN_SOURCE_ID, {
            type: "raster-dem",
            url: TERRAIN_SOURCE_URL,
            tileSize: 256,
            maxzoom: 14,
          });
        }

        map.setTerrain({
          source: TERRAIN_SOURCE_ID,
          exaggeration: 1.5,
        });

        if (map.getPitch() < 20) {
          map.easeTo({
            pitch: 45,
            duration: 700,
          });
        }
      } else {
        map.setTerrain(null);

        map.easeTo({
          pitch: 0,
          duration: 600,
        });
      }
    }, []);

    /* =====================================================
       UAV LAYER
    ====================================================== */

    const setupUavLayer = useCallback(
      (meta: BoundsResponse, layersToRender?: MapLayerItem[]) => {
        const map = mapRef.current;

        const activeMapId = mapIdRef.current;

        if (!map || !activeMapId) {
          return;
        }

        if (!map.getStyle()) {
          map.once("load", () => setupUavLayer(meta, layersToRender));

          return;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

        const currentLayers = layersToRender ?? mapLayersRef.current;

        /* MULTI LAYER */

        if (currentLayers && currentLayers.length > 0) {
          if (map.getLayer(UAV_RASTER_LAYER_ID)) {
            map.removeLayer(UAV_RASTER_LAYER_ID);
          }

          if (map.getSource(UAV_RASTER_SOURCE_ID)) {
            map.removeSource(UAV_RASTER_SOURCE_ID);
          }

          if (map.getLayer(UAV_IMAGE_LAYER_ID)) {
            map.removeLayer(UAV_IMAGE_LAYER_ID);
          }

          if (map.getSource(UAV_IMAGE_SOURCE_ID)) {
            map.removeSource(UAV_IMAGE_SOURCE_ID);
          }

          const activeIds = new Set(currentLayers.map((l) => l.id));

          mapLayersRef.current.forEach((l) => {
            if (!activeIds.has(l.id)) {
              const targetL = `layer-render-${l.id}`;

              const targetS = `layer-source-${l.id}`;

              if (map.getLayer(targetL)) {
                map.removeLayer(targetL);
              }

              if (map.getSource(targetS)) {
                map.removeSource(targetS);
              }
            }
          });

          const beforeId = map.getLayer("precision-measure-fill")
            ? "precision-measure-fill"
            : undefined;

          currentLayers.forEach((layer) => {
            if (
              layer.conversion_status === "pending" ||
              layer.conversion_status === "processing"
            ) {
              return;
            }

            const sourceId = `layer-source-${layer.id}`;

            const layerId = `layer-render-${layer.id}`;

            if (!map.getSource(sourceId)) {
              if (layer.pmtiles_url) {
                const apiOrigin = baseUrl.replace(/\/api\/?$/, "");

                const pmtilesUrl = `${apiOrigin}${layer.pmtiles_url}`;

                map.addSource(sourceId, {
                  type: "raster",
                  url: `pmtiles://${pmtilesUrl}`,
                  tileSize: 256,
                });
              } else {
                map.addSource(sourceId, {
                  type: "raster",
                  tiles: [
                    `${baseUrl}/maps/${activeMapId}/layers/${layer.id}/tiles/{z}/{x}/{y}.png`,
                  ],
                  tileSize: 256,
                  maxzoom: 22,
                });
              }
            }

            if (!map.getLayer(layerId)) {
              map.addLayer(
                {
                  id: layerId,
                  type: "raster",
                  source: sourceId,
                  layout: {
                    visibility: layer.is_visible ? "visible" : "none",
                  },
                  paint: {
                    "raster-opacity": layer.default_opacity,
                    "raster-resampling": "linear",
                    "raster-fade-duration": 150,
                  },
                },
                beforeId
              );
            } else {
              map.setLayoutProperty(
                layerId,
                "visibility",
                layer.is_visible ? "visible" : "none"
              );

              map.setPaintProperty(
                layerId,
                "raster-opacity",
                layer.default_opacity
              );
            }
          });

          return;
        }

        /* SINGLE TILE FALLBACK */

        if (meta.has_tiles) {
          if (!map.getSource(UAV_RASTER_SOURCE_ID)) {
            map.addSource(UAV_RASTER_SOURCE_ID, {
              type: "raster",
              tiles: [`${baseUrl}/maps/${activeMapId}/tiles/{z}/{x}/{y}.png`],
              tileSize: 256,
              maxzoom: 22,
            });
          }

          if (!map.getLayer(UAV_RASTER_LAYER_ID)) {
            const beforeId = map.getLayer("precision-measure-fill")
              ? "precision-measure-fill"
              : undefined;

            map.addLayer(
              {
                id: UAV_RASTER_LAYER_ID,
                type: "raster",
                source: UAV_RASTER_SOURCE_ID,
                paint: {
                  "raster-opacity": overlayOpacityRef.current,
                  "raster-resampling": "linear",
                },
              },
              beforeId
            );
          }

          return;
        }

        /* SINGLE IMAGE FALLBACK */

        if (meta.bounds) {
          const [[south, west], [north, east]] = meta.bounds;

          if (!map.getSource(UAV_IMAGE_SOURCE_ID)) {
            map.addSource(UAV_IMAGE_SOURCE_ID, {
              type: "image",
              url: `${baseUrl}/maps/${activeMapId}/preview`,
              coordinates: [
                [west, north],
                [east, north],
                [east, south],
                [west, south],
              ],
            });
          }

          if (!map.getLayer(UAV_IMAGE_LAYER_ID)) {
            const beforeId = map.getLayer("precision-measure-fill")
              ? "precision-measure-fill"
              : undefined;

            map.addLayer(
              {
                id: UAV_IMAGE_LAYER_ID,
                type: "raster",
                source: UAV_IMAGE_SOURCE_ID,
                paint: {
                  "raster-opacity": overlayOpacityRef.current,
                  "raster-resampling": "linear",
                },
              },
              beforeId
            );
          }
        }
      },
      []
    );

    /* =====================================================
       LOAD BOUNDS
    ====================================================== */

    const loadBounds = useCallback(async () => {
      const map = mapRef.current;

      const activeMapId = mapIdRef.current;

      const activeToken = tokenRef.current;

      if (!map || !activeMapId) {
        setCurrentMeta(null);

        currentMetaRef.current = null;

        return;
      }

      setLoading(true);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

      const headers: Record<string, string> = {};

      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      try {
        const response = await fetch(`${baseUrl}/maps/${activeMapId}/bounds`, {
          headers,
        });

        let data: BoundsResponse | null = null;

        if (response.ok) {
          data = (await response.json()) as BoundsResponse;

          setCurrentMeta(data);

          currentMetaRef.current = data;
        } else {
          console.warn(
            `[MapDisplay] Batas peta tidak ditemukan untuk ID ${activeMapId} (HTTP ${response.status})`
          );
        }

        try {
          const layersRes = await fetch(
            `${baseUrl}/maps/${activeMapId}/layers`,
            {
              headers,
            }
          );

          if (layersRes.ok) {
            const lData = (await layersRes.json()) as MapLayerItem[];

            setMapLayers(lData);

            mapLayersRef.current = lData;

            setupUavLayer(data as BoundsResponse, lData);
          } else if (data) {
            setupUavLayer(data);
          }
        } catch {
          if (data) {
            setupUavLayer(data);
          }
        }

        if (response.ok) {
          fetch(`${baseUrl}/maps/${activeMapId}/spatial-info`, {
            headers,
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((sData) => {
              if (sData) {
                setSpatialInfo(sData);
              }
            })
            .catch(() => {});
        }

        if (
          data &&
          data.bounds &&
          Array.isArray(data.bounds) &&
          data.bounds.length === 2
        ) {
          const [[south, west], [north, east]] = data.bounds;

          const bounds = new maplibregl.LngLatBounds(
            [west, south],
            [east, north]
          );

          map.fitBounds(bounds, {
            padding: {
              top: 80,
              bottom: 80,
              left: 80,
              right: 80,
            },
            maxZoom: 19,
            duration: 1000,
            essential: true,
          });
        } else if (data?.center) {
          const [lat, lng] = data.center;

          map.flyTo({
            center: [lng, lat],
            zoom: 16,
            pitch: terrainEnabledRef.current ? 45 : 0,
            bearing: 0,
            duration: 1000,
            essential: true,
          });
        }
      } catch (error) {
        console.warn("[MapDisplay] Gagal memuat batas peta:", error);
      } finally {
        setLoading(false);
      }
    }, [setupUavLayer]);

    /* =====================================================
       FULLSCREEN
    ====================================================== */

    const handleToggleFullscreen = useCallback(async () => {
      if (onToggleFullscreen) {
        onToggleFullscreen();
        return;
      }

      const target =
        containerRef.current?.parentElement?.parentElement ||
        containerRef.current?.parentElement;

      if (!target) {
        return;
      }

      try {
        if (!document.fullscreenElement) {
          await target.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.error("Fullscreen gagal:", error);
      }
    }, [onToggleFullscreen]);

    /* =====================================================
       FULLSCREEN EVENT
    ====================================================== */

    useEffect(() => {
      const handleFullscreenChange = () => {
        const fullscreen = document.fullscreenElement !== null;

        setInternalIsFullscreen(fullscreen);

        requestAnimationFrame(() => {
          mapRef.current?.resize();
        });

        window.setTimeout(() => {
          mapRef.current?.resize();
        }, 100);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }, []);

    /* =====================================================
       CREATE MAP
    ====================================================== */

    useEffect(() => {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: containerRef.current,

        style: {
          version: 8,

          sources: {},

          layers: [
            {
              id: "background",

              type: "background",

              paint: {
                "background-color": "#F4F5F2",
              },
            },
          ],
        },

        center: DEFAULT_POSITION,

        zoom: 13,

        pitch: 0,

        bearing: 0,

        maxPitch: 65,

        attributionControl: {
          compact: true,
        },

        renderWorldCopies: false,
      });

      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,
          showZoom: false,
          visualizePitch: true,
        }),
        "top-left"
      );

      map.once("load", () => {
        setupInitialBasemaps();

        if (terrainEnabledRef.current) {
          setupTerrain();
        }

        setMapReady(true);

        syncCameraState();

        requestAnimationFrame(() => {
          map.resize();
        });
      });

      map.on("rotate", syncCameraState);

      map.on("pitch", syncCameraState);

      map.on("zoom", syncCameraState);

      return () => {
        map.remove();

        mapRef.current = null;

        setMapReady(false);

        currentMetaRef.current = null;
      };
    }, [setupInitialBasemaps, setupTerrain, syncCameraState]);

    /* =====================================================
       BASEMAP CHANGE
    ====================================================== */

    const handleChangeBasemap = useCallback(
      (next: keyof typeof BASEMAPS) => {
        setBasemap(next);

        basemapRef.current = next;

        applyBasemap(next);
      },
      [applyBasemap]
    );

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      applyBasemap(basemap);
    }, [basemap, mapReady, applyBasemap]);

    /* =====================================================
       TERRAIN CHANGE
    ====================================================== */

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      setupTerrain();
    }, [terrainEnabled, mapReady, setupTerrain]);

    /* =====================================================
       GRID PETAK
    ====================================================== */

    const updateGridOnMap = useCallback(
      async (cellSize: number) => {
        const map = mapRef.current;

        if (!map || !map.getStyle()) {
          return;
        }

        const activeAnalysisLayer = mapLayers.find(
          (l) => l.is_visible && l.layer_type?.toLowerCase() !== "ortho"
        );

        if (!activeAnalysisLayer) {
          if (map.getLayer("grid-petak-fill")) {
            map.setLayoutProperty("grid-petak-fill", "visibility", "none");
          }

          if (map.getLayer("grid-petak-outline")) {
            map.setLayoutProperty("grid-petak-outline", "visibility", "none");
          }

          setSelectedPetak(null);

          return;
        }

        let fc: GeoJSON.FeatureCollection<
          GeoJSON.Polygon,
          PetakProperties
        > | null = null;

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

        const headers: Record<string, string> = {};

        if (tokenRef.current) {
          headers.Authorization = `Bearer ${tokenRef.current}`;
        }

        try {
          const res = await fetch(
            `${baseUrl}/maps/layers/${activeAnalysisLayer.id}/grid`,
            {
              headers,
            }
          );

          if (res.ok) {
            fc = (await res.json()) as GeoJSON.FeatureCollection<
              GeoJSON.Polygon,
              PetakProperties
            >;
          }
        } catch (e) {
          console.warn("Gagal memuat grid dari backend, memakai fallback:", e);
        }

        if (!fc || !fc.features || fc.features.length === 0) {
          let boundaryInput: any = spatialInfo?.geojson;

          if (!boundaryInput && currentMeta?.bounds) {
            const [[south, west], [north, east]] = currentMeta.bounds;

            boundaryInput = turf.bboxPolygon([west, south, east, north]);
          }

          if (!boundaryInput) {
            return;
          }

          const result = generatePetakGrid(boundaryInput, cellSize);

          fc = {
            type: "FeatureCollection",
            features: result.features,
          };
        }

        gridDataRef.current = fc;

        const source = map.getSource("grid-petak-source") as
          | maplibregl.GeoJSONSource
          | undefined;

        if (source) {
          source.setData(fc as any);
        } else {
          map.addSource("grid-petak-source", {
            type: "geojson",
            data: fc as any,
          });

          map.addLayer({
            id: "grid-petak-fill",
            type: "fill",
            source: "grid-petak-source",
            layout: {
              visibility: "visible",
            },
            paint: {
              "fill-color": ["coalesce", ["get", "color"], "#4caf50"],
              "fill-opacity": 0.52,
            },
          });

          map.addLayer({
            id: "grid-petak-outline",
            type: "line",
            source: "grid-petak-source",
            layout: {
              visibility: "visible",
            },
            paint: {
              "line-color": "#ffffff",
              "line-width": 1.2,
              "line-opacity": 0.85,
            },
          });

          map.on("click", "grid-petak-fill", (e) => {
            if (!e.features || e.features.length === 0) {
              return;
            }

            const props = e.features[0].properties as PetakProperties;

            setSelectedPetak(props);

            const pt = e.point;

            const cEl = containerRef.current;

            const w = cEl?.clientWidth || 800;

            const h = cEl?.clientHeight || 600;

            if (pt.y < 320 || pt.x < 170 || pt.x > w - 170 || pt.y > h - 80) {
              map.easeTo({
                center: [props.center_lng, props.center_lat],
                offset: [0, 80],
                duration: 300,
              });
            }
          });

          map.on("mouseenter", "grid-petak-fill", () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", "grid-petak-fill", () => {
            map.getCanvas().style.cursor = "";
          });
        }

        if (map.getLayer("grid-petak-fill")) {
          map.setLayoutProperty("grid-petak-fill", "visibility", "visible");

          map.setPaintProperty("grid-petak-fill", "fill-color", [
            "coalesce",
            ["get", "color"],
            "#4caf50",
          ]);

          map.moveLayer("grid-petak-fill");
        }

        if (map.getLayer("grid-petak-outline")) {
          map.setLayoutProperty("grid-petak-outline", "visibility", "visible");

          map.moveLayer("grid-petak-outline");
        }
      },
      [spatialInfo, currentMeta, mapLayers]
    );

    useEffect(() => {
      const map = mapRef.current;

      if (!map || !map.getStyle() || !mapReady) {
        return;
      }

      if (gridEnabled) {
        updateGridOnMap(gridCellSize);
      } else {
        if (map.getLayer("grid-petak-fill")) {
          map.setLayoutProperty("grid-petak-fill", "visibility", "none");
        }

        if (map.getLayer("grid-petak-outline")) {
          map.setLayoutProperty("grid-petak-outline", "visibility", "none");
        }

        setSelectedPetak(null);
      }
    }, [gridEnabled, gridCellSize, mapReady, updateGridOnMap, mapLayers]);

    /* =====================================================
       PETAK SCREEN POSITION
    ====================================================== */

    const updatePetakScreenPos = useCallback(() => {
      const map = mapRef.current;

      if (!map || !selectedPetak) {
        setPetakScreenPos(null);

        return;
      }

      const p = map.project([
        selectedPetak.center_lng,
        selectedPetak.center_lat,
      ]);

      setPetakScreenPos({
        x: Math.round(p.x),
        y: Math.round(p.y),
      });
    }, [selectedPetak]);

    useEffect(() => {
      updatePetakScreenPos();

      const map = mapRef.current;

      if (!map) {
        return;
      }

      map.on("move", updatePetakScreenPos);

      map.on("zoom", updatePetakScreenPos);

      return () => {
        map.off("move", updatePetakScreenPos);

        map.off("zoom", updatePetakScreenPos);
      };
    }, [selectedPetak, updatePetakScreenPos]);

    /* =====================================================
       SELECTED PETAK HIGHLIGHT
    ====================================================== */

    useEffect(() => {
      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      const sourceId = "grid-petak-selected-source";

      const fillLayerId = "grid-petak-selected-fill";

      const outlineLayerId = "grid-petak-selected-outline";

      const markerSourceId = "grid-petak-selected-marker-source";

      const markerLayerId = "grid-petak-selected-marker";

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#ffffff",
            "fill-opacity": 0.28,
          },
        });

        map.addLayer({
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": INK,
            "line-width": 3.5,
            "line-opacity": 1,
          },
        });
      }

      if (!map.getSource(markerSourceId)) {
        map.addSource(markerSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer({
          id: markerLayerId,
          type: "circle",
          source: markerSourceId,
          paint: {
            "circle-radius": 5,
            "circle-color": INK,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      if (selectedPetak && gridDataRef.current) {
        const feat = gridDataRef.current.features.find(
          (f) => f.properties.block_id === selectedPetak.block_id
        );

        const polyData: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: feat ? [feat] : [],
        };

        const pointData: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [
                  selectedPetak.center_lng,
                  selectedPetak.center_lat,
                ],
              },
            },
          ],
        };

        const sPoly = map.getSource(sourceId) as
          | maplibregl.GeoJSONSource
          | undefined;

        if (sPoly) {
          sPoly.setData(polyData as any);
        }

        const sPoint = map.getSource(markerSourceId) as
          | maplibregl.GeoJSONSource
          | undefined;

        if (sPoint) {
          sPoint.setData(pointData as any);
        }

        if (map.getLayer(fillLayerId)) {
          map.moveLayer(fillLayerId);
        }

        if (map.getLayer(outlineLayerId)) {
          map.moveLayer(outlineLayerId);
        }

        if (map.getLayer(markerLayerId)) {
          map.moveLayer(markerLayerId);
        }
      } else {
        const emptyFC: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: [],
        };

        const sPoly = map.getSource(sourceId) as
          | maplibregl.GeoJSONSource
          | undefined;

        if (sPoly) {
          sPoly.setData(emptyFC as any);
        }

        const sPoint = map.getSource(markerSourceId) as
          | maplibregl.GeoJSONSource
          | undefined;

        if (sPoint) {
          sPoint.setData(emptyFC as any);
        }
      }
    }, [selectedPetak]);

    /* =====================================================
       MEASUREMENT
    ====================================================== */

    const handleClearMeasurement = useCallback(() => {
      setMeasurePoints([]);

      setMeasuredMetrics(null);

      measureMarkersRef.current.forEach((m) => m.remove());

      measureMarkersRef.current = [];

      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      const lineSrc = map.getSource("precision-measure-line-source") as
        | maplibregl.GeoJSONSource
        | undefined;

      if (lineSrc) {
        lineSrc.setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      const polySrc = map.getSource("precision-measure-poly-source") as
        | maplibregl.GeoJSONSource
        | undefined;

      if (polySrc) {
        polySrc.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }, []);

    const handleUndoPoint = useCallback(() => {
      setMeasurePoints((prev) => {
        const next = prev.slice(0, -1);

        if (next.length === 0) {
          handleClearMeasurement();
        }

        return next;
      });
    }, [handleClearMeasurement]);

    useEffect(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (toolMode !== "none") {
        map.getCanvas().style.cursor = "crosshair";
      } else {
        map.getCanvas().style.cursor = "";
      }

      const handleMapClick = (e: maplibregl.MapMouseEvent) => {
        if (toolMode === "none") {
          return;
        }

        const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        setMeasurePoints((prev) => [...prev, coord]);
      };

      map.on("click", handleMapClick);

      return () => {
        map.off("click", handleMapClick);
      };
    }, [toolMode]);

    useEffect(() => {
      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      measureMarkersRef.current.forEach((m) => m.remove());

      measureMarkersRef.current = [];

      if (toolMode === "none" || measurePoints.length === 0) {
        const lineSrc = map.getSource("precision-measure-line-source") as
          | maplibregl.GeoJSONSource
          | undefined;

        if (lineSrc) {
          lineSrc.setData({
            type: "FeatureCollection",
            features: [],
          });
        }

        const polySrc = map.getSource("precision-measure-poly-source") as
          | maplibregl.GeoJSONSource
          | undefined;

        if (polySrc) {
          polySrc.setData({
            type: "FeatureCollection",
            features: [],
          });
        }

        return;
      }

      /* MARKERS */

      measurePoints.forEach((pt, idx) => {
        const el = document.createElement("div");

        const isFirstInArea =
          toolMode === "area" && idx === 0 && measurePoints.length >= 3;

        const isLastPoint = idx === measurePoints.length - 1;

        el.className = `
            flex
            items-center
            justify-center
            w-5
            h-5
            border-2
            border-white
            text-white
            text-[9px]
            font-black
            shadow-lg
            cursor-pointer
            transform
            hover:scale-125
            transition-transform
            select-none
            sm:w-6
            sm:h-6
            sm:text-[11px]
            ${
              isFirstInArea
                ? "bg-[#76B900] ring-4 ring-[#76B900]/60 animate-pulse"
                : isLastPoint
                ? "bg-amber-500 ring-2 ring-amber-300"
                : "bg-[#171717]"
            }
          `;

        el.innerText = `${idx + 1}`;

        if (isFirstInArea) {
          el.title = "Klik untuk menutup area polygon";
        }

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat(pt)
          .addTo(map);

        measureMarkersRef.current.push(marker);
      });

      /* COMPUTE METRICS */

      if (toolMode === "distance" && measurePoints.length >= 2) {
        try {
          const line = turf.lineString(measurePoints);

          const lenM = turf.length(line, {
            units: "meters",
          });

          setMeasuredMetrics({
            distanceM: Math.round(lenM),

            distanceKm: +(lenM / 1000).toFixed(2),
          });
        } catch (err) {
          console.error("Turf distance error:", err);
        }
      } else if (toolMode === "area" && measurePoints.length >= 3) {
        try {
          const poly = turf.polygon([[...measurePoints, measurePoints[0]]]);

          const areaM2 = turf.area(poly);

          const perimM = turf.length(turf.polygonToLine(poly) as any, {
            units: "meters",
          });

          setMeasuredMetrics({
            areaM2: Math.round(areaM2),

            areaHa: +(areaM2 / 10000).toFixed(4),

            perimeterM: Math.round(perimM),
          });
        } catch (err) {
          console.error("Turf area error:", err);
        }
      } else if (toolMode === "area" && measurePoints.length === 2) {
        try {
          const line = turf.lineString(measurePoints);

          const lenM = turf.length(line, {
            units: "meters",
          });

          setMeasuredMetrics({
            perimeterM: Math.round(lenM),
          });
        } catch {
          // ignore
        }
      } else {
        setMeasuredMetrics(null);
      }

      /* LINE */

      let lineCoords: [number, number][] = [];

      if (toolMode === "distance" && measurePoints.length >= 2) {
        lineCoords = measurePoints;
      } else if (toolMode === "area" && measurePoints.length >= 3) {
        lineCoords = [...measurePoints, measurePoints[0]];
      } else if (toolMode === "area" && measurePoints.length === 2) {
        lineCoords = measurePoints;
      }

      const lineGeoJson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",

        features:
          lineCoords.length >= 2
            ? [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: lineCoords,
                  },
                },
              ]
            : [],
      };

      /* POLYGON */

      const polyGeoJson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",

        features:
          toolMode === "area" && measurePoints.length >= 3
            ? [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Polygon",
                    coordinates: [[...measurePoints, measurePoints[0]]],
                  },
                },
              ]
            : [],
      };

      /* LINE SOURCE */

      const LINE_SRC = "precision-measure-line-source";

      const CASING_LAYER = "precision-measure-line-casing";

      const INNER_LAYER = "precision-measure-line-inner";

      const lineSource = map.getSource(LINE_SRC) as
        | maplibregl.GeoJSONSource
        | undefined;

      if (lineSource) {
        lineSource.setData(lineGeoJson);
      } else {
        map.addSource(LINE_SRC, {
          type: "geojson",
          data: lineGeoJson,
        });

        map.addLayer({
          id: CASING_LAYER,
          type: "line",
          source: LINE_SRC,
          paint: {
            "line-color": "#ffffff",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });

        map.addLayer({
          id: INNER_LAYER,
          type: "line",
          source: LINE_SRC,
          paint: {
            "line-color": INK,
            "line-width": 2.5,
            "line-dasharray": [2, 2],
          },
        });
      }

      /* POLYGON SOURCE */

      const POLY_SRC = "precision-measure-poly-source";

      const FILL_LAYER = "precision-measure-fill";

      const polySource = map.getSource(POLY_SRC) as
        | maplibregl.GeoJSONSource
        | undefined;

      if (polySource) {
        polySource.setData(polyGeoJson);
      } else {
        map.addSource(POLY_SRC, {
          type: "geojson",
          data: polyGeoJson,
        });

        map.addLayer({
          id: FILL_LAYER,
          type: "fill",
          source: POLY_SRC,
          paint: {
            "fill-color": ACCENT,
            "fill-opacity": 0.35,
          },
        });
      }

      try {
        if (map.getLayer(FILL_LAYER)) {
          map.moveLayer(FILL_LAYER);
        }

        if (map.getLayer(CASING_LAYER)) {
          map.moveLayer(CASING_LAYER);
        }

        if (map.getLayer(INNER_LAYER)) {
          map.moveLayer(INNER_LAYER);
        }
      } catch {
        // ignore
      }
    }, [measurePoints, toolMode]);

    /* =====================================================
       MULTILAYER COMPARISON
    ====================================================== */

    const handleCloseCompare = useCallback(() => {
      setCompareMode(false);

      isComparingRef.current = false;

      const map = mapRef.current;

      if (!map || !map.getStyle()) {
        return;
      }

      mapLayersRef.current.forEach((layer) => {
        const layerId = `layer-render-${layer.id}`;

        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            layer.is_visible ? "visible" : "none"
          );

          map.setPaintProperty(
            layerId,
            "raster-opacity",
            layer.default_opacity
          );
        }
      });
    }, []);

    useEffect(() => {
      const map = mapRef.current;

      if (!map || !map.getStyle() || !compareMode) {
        return;
      }

      isComparingRef.current = true;

      mapLayersRef.current.forEach((l) => {
        const targetId = `layer-render-${l.id}`;

        if (!map.getLayer(targetId)) {
          return;
        }

        if (l.id === compareLayerA) {
          map.setLayoutProperty(targetId, "visibility", "visible");

          const opacityA = (100 - compareRatio) / 100;

          map.setPaintProperty(targetId, "raster-opacity", opacityA);
        } else if (l.id === compareLayerB) {
          map.setLayoutProperty(targetId, "visibility", "visible");

          const opacityB = compareRatio / 100;

          map.setPaintProperty(targetId, "raster-opacity", opacityB);
        } else {
          map.setLayoutProperty(targetId, "visibility", "none");
        }
      });
    }, [compareMode, compareLayerA, compareLayerB, compareRatio]);

    /* =====================================================
       FALLBACK OVERLAY OPACITY
    ====================================================== */

    useEffect(() => {
      overlayOpacityRef.current = overlayOpacity;

      if (!mapReady || !mapRef.current) {
        return;
      }

      const map = mapRef.current;

      if (map.getLayer(UAV_RASTER_LAYER_ID)) {
        map.setPaintProperty(
          UAV_RASTER_LAYER_ID,
          "raster-opacity",
          overlayOpacity
        );
      }

      if (map.getLayer(UAV_IMAGE_LAYER_ID)) {
        map.setPaintProperty(
          UAV_IMAGE_LAYER_ID,
          "raster-opacity",
          overlayOpacity
        );
      }
    }, [overlayOpacity, mapReady]);

    /* =====================================================
       LOAD MAP DATA
    ====================================================== */

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (!mapId) {
        setCurrentMeta(null);

        currentMetaRef.current = null;

        setMapLayers([]);

        mapLayersRef.current = [];

        removeUavLayers();

        return;
      }

      loadBounds();
    }, [mapId, mapReady, loadBounds, removeUavLayers]);

    /* =====================================================
       IMPERATIVE HANDLE
    ====================================================== */

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => {
          mapRef.current?.zoomIn({
            duration: 400,
          });
        },

        zoomOut: () => {
          mapRef.current?.zoomOut({
            duration: 400,
          });
        },

        resize: () => {
          mapRef.current?.resize();
        },

        rotateLeft: () => {
          const map = mapRef.current;

          if (!map) {
            return;
          }

          map.easeTo({
            bearing: map.getBearing() - 45,
            duration: 500,
          });
        },

        rotateRight: () => {
          const map = mapRef.current;

          if (!map) {
            return;
          }

          map.easeTo({
            bearing: map.getBearing() + 45,
            duration: 500,
          });
        },

        resetNorth: () => {
          mapRef.current?.easeTo({
            bearing: 0,
            duration: 600,
          });
        },

        getBearing: () => {
          return mapRef.current?.getBearing() || 0;
        },

        setBearing: (deg: number) => {
          mapRef.current?.easeTo({
            bearing: deg,
            duration: 500,
          });
        },

        tiltUp: () => {
          const map = mapRef.current;

          if (!map) {
            return;
          }

          map.easeTo({
            pitch: Math.min(map.getPitch() + 10, 45),
            duration: 400,
          });
        },

        tiltDown: () => {
          const map = mapRef.current;

          if (!map) {
            return;
          }

          map.easeTo({
            pitch: Math.max(map.getPitch() - 10, 0),
            duration: 400,
          });
        },

        resetView: () => {
          const map = mapRef.current;

          if (!map) {
            return;
          }

          map.easeTo({
            pitch: terrainEnabledRef.current ? 45 : 0,
            bearing: 0,
            duration: 700,
          });
        },

        toggle3D: () => {
          setTerrainEnabled((current) => !current);
        },

        is3D: () => {
          return terrainEnabledRef.current;
        },
      }),
      []
    );

    /* =====================================================
       LOCAL HANDLERS
    ====================================================== */

    const handleResetNorth = useCallback(() => {
      mapRef.current?.easeTo({
        bearing: 0,
        duration: 600,
      });
    }, []);

    const handleRotateLeft = useCallback(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      map.easeTo({
        bearing: map.getBearing() - 45,
        duration: 500,
      });
    }, []);

    const handleRotateRight = useCallback(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      map.easeTo({
        bearing: map.getBearing() + 45,
        duration: 500,
      });
    }, []);

    const handleZoomIn = useCallback(() => {
      mapRef.current?.zoomIn({
        duration: 400,
      });
    }, []);

    const handleZoomOut = useCallback(() => {
      mapRef.current?.zoomOut({
        duration: 400,
      });
    }, []);

    const handleToggle3D = useCallback(() => {
      setTerrainEnabled((current) => !current);
    }, []);

    /* =====================================================
       RENDER
    ====================================================== */

    const isPlainNavigation =
      toolMode === "none" && !compareMode && !postgisCardOpen;

    const controlButtonClass =
      "flex h-8 w-8 items-center justify-center border border-transparent text-[#4E504A] outline-none transition-colors hover:border-[#E0E1DC] hover:bg-[#F7F8F5] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#76B900]/40";

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#F4F5F2]">
        {/* =================================================
              LOADING
        ================================================== */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="map-loading"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 8,
              }}
              transition={{
                duration: 0.25,
                ease: EASE,
              }}
              role="status"
              className="pointer-events-none absolute inset-x-0 bottom-2 z-40 mx-auto w-fit sm:bottom-3"
            >
              <div className="flex items-center gap-1.5 border border-[#DCDDD8] bg-white/95 px-2 py-1.5 text-[10px] font-semibold text-[#4E504A] shadow-[0_8px_18px_rgba(0,0,0,0.06)] backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse bg-[#76B900] motion-reduce:animate-none" />

                <span>Memuat data geospasial...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
              LAYER CONTROL PANEL
        ================================================== */}
        <LayerControlPanel
          mapId={mapId}
          layers={mapLayers}
          basemap={basemap}
          onChangeBasemap={handleChangeBasemap}
          terrainEnabled={terrainEnabled}
          onToggleTerrain={handleToggle3D}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleVisibility={(layerId, visible) => {
            const map = mapRef.current;

            const targetId = `layer-render-${layerId}`;

            if (map && map.getLayer(targetId)) {
              map.setLayoutProperty(
                targetId,
                "visibility",
                visible ? "visible" : "none"
              );
            }

            setMapLayers((prev) =>
              prev.map((layer) =>
                layer.id === layerId
                  ? {
                      ...layer,
                      is_visible: visible,
                    }
                  : layer
              )
            );

            mapLayersRef.current = mapLayersRef.current.map((layer) =>
              layer.id === layerId
                ? {
                    ...layer,
                    is_visible: visible,
                  }
                : layer
            );
          }}
          onChangeOpacity={(layerId, opacity) => {
            const map = mapRef.current;

            const targetId = `layer-render-${layerId}`;

            if (map && map.getLayer(targetId)) {
              map.setPaintProperty(targetId, "raster-opacity", opacity);
            }

            setMapLayers((prev) =>
              prev.map((layer) =>
                layer.id === layerId
                  ? {
                      ...layer,
                      default_opacity: opacity,
                    }
                  : layer
              )
            );

            mapLayersRef.current = mapLayersRef.current.map((layer) =>
              layer.id === layerId
                ? {
                    ...layer,
                    default_opacity: opacity,
                  }
                : layer
            );
          }}
          onLayerUploaded={async () => {
            const activeMapId = mapIdRef.current;

            const activeToken = tokenRef.current;

            if (!activeMapId) {
              return;
            }

            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

            const headers: Record<string, string> = {};

            if (activeToken) {
              headers.Authorization = `Bearer ${activeToken}`;
            }

            try {
              const res = await fetch(`${baseUrl}/maps/${activeMapId}/layers`, {
                headers,
              });

              if (res.ok) {
                const data = (await res.json()) as MapLayerItem[];

                setMapLayers(data);

                mapLayersRef.current = data;

                if (currentMetaRef.current) {
                  setupUavLayer(currentMetaRef.current, data);
                }
              }
            } catch (error) {
              console.error("Gagal refresh layers:", error);
            }
          }}
          onDeleteLayer={async (layerId) => {
            const activeMapId = mapIdRef.current;

            const activeToken = tokenRef.current;

            if (!activeMapId) {
              return;
            }

            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

            const headers: Record<string, string> = {};

            if (activeToken) {
              headers.Authorization = `Bearer ${activeToken}`;
            }

            try {
              const res = await fetch(
                `${baseUrl}/maps/${activeMapId}/layers/${layerId}`,
                {
                  method: "DELETE",
                  headers,
                }
              );

              if (res.ok) {
                const map = mapRef.current;

                if (map) {
                  const layerIdMap = `layer-render-${layerId}`;

                  const sourceId = `layer-source-${layerId}`;

                  if (map.getLayer(layerIdMap)) {
                    map.removeLayer(layerIdMap);
                  }

                  if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                  }
                }

                setMapLayers((prev) =>
                  prev.filter((layer) => layer.id !== layerId)
                );

                mapLayersRef.current = mapLayersRef.current.filter(
                  (layer) => layer.id !== layerId
                );
              }
            } catch (error) {
              console.error("Gagal menghapus layer:", error);
            }
          }}
          onRetryConvert={async (layerId) => {
            const activeMapId = mapIdRef.current;

            const activeToken = tokenRef.current;

            if (!activeMapId) {
              return;
            }

            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

            const headers: Record<string, string> = {};

            if (activeToken) {
              headers.Authorization = `Bearer ${activeToken}`;
            }

            try {
              const res = await fetch(
                `${baseUrl}/maps/${activeMapId}/layers/${layerId}/convert`,
                {
                  method: "POST",
                  headers,
                }
              );

              if (res.ok) {
                setMapLayers((prev) =>
                  prev.map((l) =>
                    l.id === layerId
                      ? {
                          ...l,
                          conversion_status: "pending",
                          conversion_error: null,
                        }
                      : l
                  )
                );

                mapLayersRef.current = mapLayersRef.current.map((l) =>
                  l.id === layerId
                    ? {
                        ...l,
                        conversion_status: "pending",
                        conversion_error: null,
                      }
                    : l
                );
              }
            } catch (error) {
              console.error("Gagal memicu ulang konversi:", error);
            }
          }}
          token={tokenRef.current ?? undefined}
          onReorderLayers={async (newLayers) => {
            const activeMapId = mapIdRef.current;

            const activeToken = tokenRef.current;

            if (!activeMapId) {
              return;
            }

            const updated = newLayers.map((layer, idx) => ({
              ...layer,
              display_order: idx,
            }));

            setMapLayers(updated);

            mapLayersRef.current = updated;

            const map = mapRef.current;

            if (map) {
              updated.forEach((l, i) => {
                const mlId = `layer-render-${l.id}`;

                if (map.getLayer(mlId)) {
                  const nextLayer = updated[i + 1];

                  const beforeId = nextLayer
                    ? `layer-render-${nextLayer.id}`
                    : undefined;

                  if (beforeId && map.getLayer(beforeId)) {
                    map.moveLayer(mlId, beforeId);
                  } else {
                    map.moveLayer(mlId);
                  }
                }
              });
            }

            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };

            if (activeToken) {
              headers.Authorization = `Bearer ${activeToken}`;
            }

            try {
              await Promise.all(
                updated.map((layer) =>
                  fetch(`${baseUrl}/maps/${activeMapId}/layers/${layer.id}`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                      display_order: layer.display_order,
                    }),
                  })
                )
              );
            } catch (err) {
              console.error("Gagal persist urutan layer:", err);
            }
          }}
          onSetBaseLayer={async (layerId) => {
            const activeMapId = mapIdRef.current;

            const activeToken = tokenRef.current;

            if (!activeMapId) {
              return;
            }

            const updated = mapLayersRef.current.map((l) => ({
              ...l,
              is_base_layer: l.id === layerId,
            }));

            setMapLayers(updated);

            mapLayersRef.current = updated;

            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };

            if (activeToken) {
              headers.Authorization = `Bearer ${activeToken}`;
            }

            try {
              await fetch(`${baseUrl}/maps/${activeMapId}/layers/${layerId}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({
                  is_base_layer: true,
                }),
              });
            } catch (err) {
              console.error("Gagal mengubah base layer:", err);
            }
          }}
        />

        {/* =================================================
              PRECISION FARMING TOOLBAR
        ================================================== */}
        <div className="absolute inset-x-0 top-2 z-50 mx-auto flex w-fit max-w-[calc(100%-12px)] translate-x-8 items-center gap-1 border border-[#DCDDD8] bg-white/95 p-1 shadow-[0_10px_24px_rgba(0,0,0,0.07)] backdrop-blur-md sm:top-2.5">
          <ToolbarButton
            active={isPlainNavigation}
            title="Navigasi Standar"
            label="Navigasi"
            onClick={() => {
              setToolMode("none");

              handleCloseCompare();

              handleClearMeasurement();

              setPostgisCardOpen(false);
            }}
          >
            <MousePointer className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </ToolbarButton>

          {spatialInfo?.has_spatial_geometry && spatialInfo.area_hectares && (
            <ToolbarButton
              active={postgisCardOpen}
              title="Verifikasi Geodetik PostGIS"
              label="PostGIS"
              onClick={() => {
                const next = !postgisCardOpen;

                setPostgisCardOpen(next);

                if (next) {
                  setToolMode("none");

                  handleCloseCompare();

                  handleClearMeasurement();
                }
              }}
            >
              <img
                src="/postgis.png"
                alt="PostGIS"
                className="h-5 w-5 shrink-0 object-contain"
              />
            </ToolbarButton>
          )}

          <ToolbarButton
            active={toolMode === "distance"}
            title="Ukur Jarak & Keliling"
            label="Ukur Jarak"
            onClick={() => {
              handleCloseCompare();

              setPostgisCardOpen(false);

              const next = toolMode === "distance" ? "none" : "distance";

              setToolMode(next);

              handleClearMeasurement();
            }}
          >
            <Ruler className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </ToolbarButton>

          <ToolbarButton
            active={compareMode}
            title="Bandingkan Layer"
            label="Bandingkan"
            onClick={() => {
              handleClearMeasurement();

              setPostgisCardOpen(false);

              setToolMode("none");

              if (compareMode) {
                handleCloseCompare();
              } else {
                setCompareMode(true);

                if (mapLayers.length >= 2) {
                  setCompareLayerA(mapLayers[0]?.id || "");

                  setCompareLayerB(mapLayers[1]?.id || "");
                } else if (mapLayers.length === 1) {
                  setCompareLayerA(mapLayers[0]?.id || "");

                  setCompareLayerB("__basemap__");
                }
              }
            }}
          >
            <SplitSquareVertical
              className="h-4 w-4"
              strokeWidth={ICON_STROKE}
            />
          </ToolbarButton>

          <div className="mx-0.5 h-5 w-px shrink-0 bg-[#E7E8E3]" />

          <ToolbarButton
            active={gridEnabled}
            title="Tampilkan Grid Petak Pertanian (10×10m)"
            label="Petak"
            onClick={() => {
              setGridEnabled((prev) => !prev);
            }}
          >
            <Grid className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </ToolbarButton>
        </div>

        {/* =================================================
              MEASUREMENT STATUS CARD
        ================================================== */}
        <AnimatePresence>
          {toolMode !== "none" && (
            <motion.div
              key="measure-card"
              {...hudCardMotion}
              className={cn(
                hudCardClass,
                "absolute inset-x-0 top-16 z-50 mx-auto w-[calc(100%-16px)] max-w-[310px]"
              )}
            >
              <HudHeader
                eyebrow=""
                title={
                  toolMode === "area"
                    ? "Ukur Area Lahan"
                    : "Ukur Jarak Lintasan"
                }
                onClose={() => setToolMode("none")}
                closeLabel="Tutup Pengukuran"
                meta={
                  measurePoints.length > 0 ? (
                    <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-1 py-0.5 text-[10px] font-bold tabular-nums text-[#666861]">
                      {measurePoints.length} titik
                    </span>
                  ) : undefined
                }
              />

              <div className="my-1.5 flex items-center gap-1.5 border border-[#E0E1DC] bg-[#F7F8F5] px-2 py-1.5 text-[10px] text-[#666861]">
                <MousePointer
                  className="h-2.5 w-2.5 shrink-0 text-[#171717]"
                  strokeWidth={ICON_STROKE}
                />

                <span className="font-medium leading-4">
                  {measurePoints.length === 0
                    ? "Klik titik batas ke-1 di atas peta lahan"
                    : measurePoints.length === 1
                    ? "Klik titik ke-2 untuk mulai menghubungkan garis"
                    : toolMode === "area" && measurePoints.length < 3
                    ? "Klik titik ke-3 untuk membentuk bidang poligon"
                    : toolMode === "area"
                    ? "Klik titik selanjutnya atau klik titik awal untuk menutup area"
                    : "Klik titik berikutnya untuk memperpanjang jalur lintasan"}
                </span>
              </div>

              {measuredMetrics && (
                <div className="mb-1.5 border border-[#E0E1DC] bg-[#F7F8F5] p-2">
                  {toolMode === "area" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border-r border-[#E7E8E3] pr-2">
                        <span className={cn(eyebrowClass, "block text-[10px]")}>
                          Total Luas Lahan
                        </span>

                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-[10px] font-bold tabular-nums text-[#171717]">
                            {measuredMetrics.areaHa ?? 0}
                          </span>

                          <span className="text-[10px] font-medium text-[#858780]">
                            ha
                          </span>
                        </div>

                        <span className="text-[10px] font-medium tabular-nums text-[#858780]">
                          {(measuredMetrics.areaM2 ?? 0).toLocaleString(
                            "id-ID"
                          )}{" "}
                          m²
                        </span>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div>
                          <span
                            className={cn(eyebrowClass, "block text-[10px]")}
                          >
                            Keliling Batas
                          </span>

                          <div className="mt-0.5 flex items-baseline gap-1">
                            <span className="text-[10px] font-bold tabular-nums text-[#171717]">
                              {(measuredMetrics.perimeterM ?? 0).toLocaleString(
                                "id-ID"
                              )}
                            </span>

                            <span className="text-[10px] font-medium text-[#858780]">
                              meter
                            </span>
                          </div>
                        </div>

                        {measuredMetrics.areaHa ? (
                          <div className="mt-1 flex items-center gap-1 border border-[#E0E1DC] bg-white px-1.5 py-1 text-[10px] font-medium text-[#4E504A]">
                            <Sprout
                              className="h-2.5 w-2.5 shrink-0 text-[#666861]"
                              strokeWidth={ICON_STROKE}
                            />

                            <span>Est. Urea:</span>

                            <span className="font-bold tabular-nums text-[#171717]">
                              ±{Math.round(measuredMetrics.areaHa * 250)} kg
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className={cn(eyebrowClass, "block text-[10px]")}>
                        Total Jarak Lintasan
                      </span>

                      <div className="mt-0.5 flex flex-wrap items-baseline gap-1">
                        <span className="text-[10px] font-bold tabular-nums text-[#171717]">
                          {measuredMetrics.distanceKm}
                        </span>

                        <span className="text-[10px] font-medium text-[#858780]">
                          km
                        </span>

                        <span className="text-[10px] font-medium tabular-nums text-[#858780]">
                          (
                          {(measuredMetrics.distanceM ?? 0).toLocaleString(
                            "id-ID"
                          )}{" "}
                          meter)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  {measurePoints.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndoPoint}
                      className={hudButtonSecondary}
                      title="Undo titik terakhir"
                    >
                      <Undo2
                        className="h-2.5 w-2.5"
                        strokeWidth={ICON_STROKE}
                      />

                      <span>Undo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClearMeasurement}
                    disabled={measurePoints.length === 0}
                    className={cn(
                      "inline-flex items-center gap-1 border px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
                      measurePoints.length === 0
                        ? "cursor-not-allowed border-transparent text-[#B0B1AB]"
                        : "border-transparent text-[#9B3E32] hover:border-[#E7D0CC] hover:bg-[#FFF7F5]"
                    )}
                    title="Reset semua titik pengukuran"
                  >
                    <Trash2 className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />

                    <span>Reset</span>
                  </button>
                </div>

                <SweepButton onClick={() => setToolMode("none")}>
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} />

                  <span>Selesai</span>
                </SweepButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
              MULTILAYER COMPARISON
        ================================================== */}
        <AnimatePresence>
          {compareMode && (
            <motion.div
              key="compare-card"
              {...hudCardMotion}
              className={cn(
                hudCardClass,
                "absolute inset-x-0 top-16 z-50 mx-auto w-[calc(100%-16px)] max-w-[325px]"
              )}
            >
              <HudHeader
                eyebrow=""
                title="Bandingkan Layer Multilayer"
                onClose={handleCloseCompare}
                closeLabel="Tutup Perbandingan"
              />

              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <select
                      value={compareLayerA}
                      onChange={(e) => setCompareLayerA(e.target.value)}
                      className={compareSelectClass}
                      aria-label="Layer A"
                    >
                      {mapLayers.map((l) => (
                        <option key={`a-${l.id}`} value={l.id}>
                          {l.name}
                        </option>
                      ))}

                      <option value="__basemap__">
                        Basemap (Satelit / Jalan)
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const prevA = compareLayerA;

                      const prevB = compareLayerB;

                      setCompareLayerA(prevB);

                      setCompareLayerB(prevA);
                    }}
                    title="Tukar Posisi Layer A & B"
                    aria-label="Tukar Posisi Layer A & B"
                    className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#4E504A] outline-none transition-colors hover:border-[#171717] hover:bg-[#171717] hover:text-white focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
                  >
                    <ArrowLeftRight
                      className="h-2.5 w-2.5"
                      strokeWidth={ICON_STROKE}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <select
                      value={compareLayerB}
                      onChange={(e) => setCompareLayerB(e.target.value)}
                      className={compareSelectClass}
                      aria-label="Layer B"
                    >
                      {mapLayers.map((l) => (
                        <option key={`b-${l.id}`} value={l.id}>
                          {l.name}
                        </option>
                      ))}

                      <option value="__basemap__">
                        Basemap (Satelit / Jalan)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="border border-[#E0E1DC] bg-[#F7F8F5] p-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-semibold tabular-nums text-[#666861]">
                    <span>Layer A {100 - compareRatio}%</span>

                    <span>Layer B {compareRatio}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={compareRatio}
                    aria-label="Rasio perbandingan Layer A dan B"
                    onChange={(e) => setCompareRatio(parseInt(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none bg-[#DCDDD8] accent-[#171717]"
                  />

                  <div className="mt-1 flex items-center gap-px">
                    {[
                      {
                        value: 0,
                        label: "100% A",
                      },
                      {
                        value: 50,
                        label: "50 / 50",
                      },
                      {
                        value: 100,
                        label: "100% B",
                      },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setCompareRatio(preset.value)}
                        aria-pressed={compareRatio === preset.value}
                        className={cn(
                          "flex-1 border py-1 text-[10px] font-semibold uppercase tracking-[0.02em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
                          compareRatio === preset.value
                            ? "border-[#171717] bg-[#171717] text-white"
                            : "border-[#DCDDD8] bg-white text-[#858780] hover:bg-[#F8F8F6] hover:text-[#171717]"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
              POSTGIS GEODETIC DETAIL HUD CARD
        ================================================== */}
        <AnimatePresence>
          {postgisCardOpen && spatialInfo && (
            <motion.div
              key="postgis-card"
              {...hudCardMotion}
              className={cn(
                hudCardClass,
                "absolute inset-x-0 top-16 z-50 mx-auto w-[calc(100%-16px)] max-w-[325px]"
              )}
            >
              <HudHeader
                eyebrow=""
                title="Detail Verifikasi Geodetik"
                onClose={() => setPostgisCardOpen(false)}
                closeLabel="Tutup Detail"
                icon={
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                    <img
                      src="/postgis.png"
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                  </span>
                }
              />

              <div className="space-y-1.5">
                <details className="group border border-[#E0E1DC] bg-[#F7F8F5]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 outline-none [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#999B94]">
                        Verifikasi Geodetik
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-bold text-[#171717]">
                        Luas & dimensi lahan
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0 text-[10px] font-bold tabular-nums text-[#171717]">
                        {spatialInfo.area_hectares ?? "-"} ha
                      </span>

                      <ChevronRight
                        className="h-2.5 w-2.5 shrink-0 text-[#999B94] transition-transform duration-200 group-open:rotate-90"
                        strokeWidth={ICON_STROKE}
                      />
                    </div>
                  </summary>

                  <div className="border-t border-[#E7E8E3] px-2 py-2">
                    <div className="mb-1.5 flex items-start gap-1.5 border border-[#E0E1DC] bg-white p-1.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] text-[#666861]">
                        <Info
                          className="h-2.5 w-2.5"
                          strokeWidth={ICON_STROKE}
                        />
                      </span>

                      <span className="text-[10px] font-medium leading-4 text-[#4E504A]">
                        Luas lahan terverifikasi dihitung pada ellipsoid{" "}
                        <strong className="font-bold text-[#171717]">
                          WGS-84 (EPSG:4326)
                        </strong>{" "}
                        menggunakan fungsi geodetik PostGIS backend.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 border border-[#E0E1DC] bg-white p-1.5">
                      <div>
                        <span className="block text-[10px] font-medium text-[#999B94]">
                          Luas Lahan (ha)
                        </span>

                        <p className="mt-0.5 text-[10px] font-bold tabular-nums text-[#171717]">
                          {spatialInfo.area_hectares ?? "-"}{" "}
                          <span className="font-medium text-[#858780]">ha</span>
                        </p>
                      </div>

                      <div>
                        <span className="block text-[10px] font-medium text-[#999B94]">
                          Luas Lahan (m²)
                        </span>

                        <p className="mt-0.5 text-[10px] font-bold tabular-nums text-[#171717]">
                          {spatialInfo.area_m2
                            ? spatialInfo.area_m2.toLocaleString("id-ID")
                            : "-"}{" "}
                          <span className="font-medium text-[#858780]">m²</span>
                        </p>
                      </div>

                      <div className="border-t border-[#E7E8E3] pt-1.5">
                        <span className="block text-[10px] font-medium text-[#999B94]">
                          Keliling Batas Lahan
                        </span>

                        <p className="mt-0.5 text-[10px] font-bold tabular-nums text-[#171717]">
                          {spatialInfo.perimeter_meters
                            ? spatialInfo.perimeter_meters >= 1000
                              ? `${(
                                  spatialInfo.perimeter_meters / 1000
                                ).toFixed(2)} km`
                              : `${spatialInfo.perimeter_meters.toFixed(1)} m`
                            : "-"}
                        </p>

                        {spatialInfo.perimeter_meters && (
                          <span className="text-[10px] font-medium tabular-nums text-[#858780]">
                            (
                            {spatialInfo.perimeter_meters.toLocaleString(
                              "id-ID"
                            )}{" "}
                            meter)
                          </span>
                        )}
                      </div>

                      <div className="border-t border-[#E7E8E3] pt-1.5">
                        <span className="block text-[10px] font-medium text-[#999B94]">
                          Titik Pusat (Centroid)
                        </span>

                        <p className="mt-0.5 text-[10px] font-bold leading-4 tabular-nums text-[#171717]">
                          {spatialInfo.centroid
                            ? `${spatialInfo.centroid[1].toFixed(
                                5
                              )}°, ${spatialInfo.centroid[0].toFixed(5)}°`
                            : "-"}
                        </p>

                        <span className="text-[10px] font-medium text-[#858780]">
                          Latitude, Longitude
                        </span>
                      </div>
                    </div>
                  </div>
                </details>

                <div className="flex items-center justify-between gap-1">
                  <SweepButton
                    onClick={() => {
                      const map = mapRef.current;

                      if (!map) {
                        return;
                      }

                      if (currentMetaRef.current?.bounds) {
                        const [[south, west], [north, east]] =
                          currentMetaRef.current.bounds;

                        map.fitBounds(
                          [
                            [west, south],
                            [east, north],
                          ],
                          {
                            padding: 40,
                            duration: 800,
                          }
                        );
                      }
                    }}
                  >
                    <MousePointer
                      className="h-2.5 w-2.5"
                      strokeWidth={ICON_STROKE}
                    />

                    <span>Fokus ke Lahan</span>
                  </SweepButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
              INSPEKSI PETAK
        ================================================== */}
        {selectedPetak &&
          petakScreenPos &&
          (() => {
            const cEl = containerRef.current;

            const containerW = cEl?.clientWidth || 800;

            const containerH = cEl?.clientHeight || 600;

            const isSmall = containerW < 640;

            const cardWidth = isSmall ? 188 : 208;

            const SAFE_TOP = 54;
            const SAFE_BOTTOM = 10;
            const SAFE_LEFT = 8;
            const SAFE_RIGHT = 8;

            const maxAllowedH = Math.max(
              190,
              containerH - SAFE_TOP - SAFE_BOTTOM
            );

            const currentCardH = Math.min(popupHeight, maxAllowedH);

            const spaceAbove = petakScreenPos.y - 10 - SAFE_TOP;

            const spaceBelow =
              containerH - SAFE_BOTTOM - (petakScreenPos.y + 10);

            let isAbove = false;

            if (spaceAbove >= currentCardH) {
              isAbove = true;
            } else if (spaceBelow >= currentCardH) {
              isAbove = false;
            } else {
              isAbove = spaceAbove >= spaceBelow;
            }

            const rawTop = isAbove
              ? petakScreenPos.y - 10 - currentCardH
              : petakScreenPos.y + 10;

            const clampedTop = Math.max(
              SAFE_TOP,
              Math.min(containerH - SAFE_BOTTOM - currentCardH, rawTop)
            );

            const rawLeft = petakScreenPos.x - cardWidth / 2;

            const clampedLeft = Math.max(
              SAFE_LEFT,
              Math.min(containerW - SAFE_RIGHT - cardWidth, rawLeft)
            );

            const arrowX = Math.max(
              16,
              Math.min(cardWidth - 16, petakScreenPos.x - clampedLeft)
            );

            const arrowAtBottom =
              petakScreenPos.y >= clampedTop + currentCardH / 2;

            const activeAnalysisLayer = mapLayers.find(
              (l) => l.is_visible && l.layer_type?.toLowerCase() !== "ortho"
            );

            const layerTitle =
              activeAnalysisLayer?.name ||
              selectedPetak.layer_type?.toUpperCase() ||
              "Analisis Spasial";

            const isNDVI = (
              activeAnalysisLayer?.layer_type ||
              selectedPetak.layer_type ||
              ""
            )
              .toLowerCase()
              .includes("ndvi");

            const isDSM = (
              activeAnalysisLayer?.layer_type ||
              selectedPetak.layer_type ||
              ""
            )
              .toLowerCase()
              .includes("dsm");

            const isNutrient = ["nitrogen", "phosphorus", "kalium"].some((k) =>
              (
                activeAnalysisLayer?.layer_type ||
                selectedPetak.layer_type ||
                ""
              )
                .toLowerCase()
                .includes(k)
            );

            const unit = isDSM ? "mdpl" : isNutrient ? "mg/kg" : "";

            const summaryText = (() => {
              const lt = (selectedPetak.layer_type || "").toLowerCase();

              const val = selectedPetak.value_mean;

              const status = selectedPetak.status;

              if (lt.includes("ndvi") || lt.includes("vari")) {
                if (val !== undefined) {
                  const currentStatus =
                    status ||
                    (val >= 0.42
                      ? "Tinggi"
                      : val >= 0.22
                      ? "Sedang"
                      : val >= 0.11
                      ? "Rendah"
                      : "Non Vegetasi");

                  if (
                    val >= 0.42 ||
                    currentStatus.toLowerCase().includes("tinggi")
                  ) {
                    return `${currentStatus} (NDVI ≥ 0.42). Kerapatan tajuk dan aktivitas fotosintesis vegetasi sangat optimal. (Ref: Rahaldi et al., 2013)`;
                  }

                  if (
                    val >= 0.22 ||
                    currentStatus.toLowerCase().includes("sedang")
                  ) {
                    return `${currentStatus} (NDVI 0.22–0.42). Kondisi tanaman wajar dengan kerapatan tajuk sedang/berjarak. (Ref: Rahaldi et al., 2013)`;
                  }

                  if (
                    val >= 0.11 ||
                    currentStatus.toLowerCase().includes("rendah")
                  ) {
                    return `${currentStatus} (NDVI 0.11–0.22). Vegetasi terindikasi mengalami stres, kekurangan hara, atau kerusakan tajuk. (Ref: Rahaldi et al., 2013)`;
                  }

                  return `${currentStatus} (NDVI < 0.11). Area lahan terbuka, tanah gundul, bebatuan, atau jalan kebun. (Ref: Rahaldi et al., 2013)`;
                }
              } else if (lt.includes("nitrogen")) {
                if (val !== undefined) {
                  const s =
                    status ||
                    (val >= 70
                      ? "Tinggi / Berlebih"
                      : val >= 35
                      ? "Optimal / Cukup"
                      : "Defisit Rendah");

                  return `${s} (${val} mg/kg). ${
                    val < 35
                      ? "Ketersediaan unsur hara nitrogen rendah, disarankan pemupukan N."
                      : val <= 70
                      ? "Ketersediaan unsur hara N dalam rentang optimal."
                      : "Kandungan hara N tinggi pada tajuk tanaman."
                  }`;
                }
              } else if (lt.includes("phosphorus") || lt.includes("fosfor")) {
                if (val !== undefined) {
                  const s =
                    status ||
                    (val >= 30
                      ? "Tinggi"
                      : val >= 15
                      ? "Optimal / Cukup"
                      : "Defisit Rendah");

                  return `${s} (${val} mg/kg). ${
                    val < 15
                      ? "Ketersediaan unsur hara fosfor rendah, disarankan suplementasi P."
                      : val <= 30
                      ? "Ketersediaan unsur hara fosfor dalam rentang optimal."
                      : "Kandungan hara fosfor tinggi pada lahan."
                  }`;
                }
              } else if (lt.includes("kalium")) {
                if (val !== undefined) {
                  const s =
                    status ||
                    (val >= 150
                      ? "Tinggi"
                      : val >= 80
                      ? "Optimal / Cukup"
                      : "Defisit Rendah");

                  return `${s} (${val} mg/kg). ${
                    val < 80
                      ? "Ketersediaan unsur hara kalium rendah, disarankan pemupukan K."
                      : val <= 150
                      ? "Ketersediaan unsur hara K optimal untuk ketahanan tanaman."
                      : "Kandungan hara kalium tinggi pada lahan."
                  }`;
                }
              } else if (lt.includes("dsm")) {
                return `Elevasi permukaan tanah berada pada ketinggian rata-rata ${
                  val ?? "-"
                } mdpl.`;
              } else if (status) {
                return `Kondisi petak berstatus ${status} dengan nilai rata-rata ${
                  val ?? "-"
                } berdasarkan pembacaan raster sensor drone.`;
              }

              return "Data saintifik diekstraksi langsung dari berkas GeoTIFF drone resolusi tinggi.";
            })();

            const analysisRows = [
              {
                key: "ndvi",
                label: "NDVI (Vegetasi)",
              },
              {
                key: "nitrogen",
                label: "Nitrogen (N)",
              },
              {
                key: "phosphorus",
                label: "Fosfor (P)",
              },
              {
                key: "kalium",
                label: "Kalium (K)",
              },
              {
                key: "dsm",
                label: "DSM (Elevasi)",
              },
            ];

            const availableCount = analysisRows.filter(({ key }) =>
              mapLayers.some((l) => (l.layer_type || "").toLowerCase() === key)
            ).length;

            return (
              <div
                ref={(node) => {
                  if (node) {
                    const h = node.offsetHeight;

                    if (h > 50 && Math.abs(h - popupHeight) > 10) {
                      setPopupHeight(h);
                    }
                  }
                }}
                className={cn(
                  "pointer-events-auto absolute z-30 flex flex-col transition-all duration-75 ease-out",
                  isSmall ? "w-[188px]" : "w-[208px]"
                )}
                style={{
                  left: `${clampedLeft}px`,
                  top: `${clampedTop}px`,
                  maxHeight: `${maxAllowedH}px`,
                }}
              >
                {arrowAtBottom ? (
                  <div
                    className="absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#DCDDD8] bg-white"
                    style={{
                      left: `${arrowX}px`,
                    }}
                  />
                ) : (
                  <div
                    className="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[#DCDDD8] bg-white"
                    style={{
                      left: `${arrowX}px`,
                    }}
                  />
                )}

                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.18,
                    ease: EASE,
                  }}
                  className="relative flex max-h-[inherit] flex-col overflow-y-auto border border-[#DCDDD8] bg-white/95 shadow-[0_12px_28px_rgba(0,0,0,0.09)] backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-1.5 px-2 pt-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[#999B94]">
                        Inspeksi petak
                      </p>

                      <h4 className="mt-0.5 truncate text-[10px] font-bold text-[#171717]">
                        Petak {selectedPetak.block_id}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPetak(null)}
                      aria-label="Tutup inspeksi petak"
                      className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] outline-none transition-colors hover:bg-[#F2F3EF] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
                    >
                      <X className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
                    </button>
                  </div>

                  <div className="space-y-1 p-2">
                    <div className="relative overflow-hidden bg-[#171717] px-2 py-1.5 text-white">
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-[#76B900]" />

                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.04em] text-white/50">
                          {layerTitle}
                        </span>

                        {selectedPetak.status && (
                          <span
                            className="shrink-0 px-1 py-0.5 text-[10px] font-bold text-white"
                            style={{
                              backgroundColor: selectedPetak.color || "#16a34a",
                            }}
                          >
                            {selectedPetak.status}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-[10px] font-bold tabular-nums text-white">
                          {selectedPetak.value_mean !== undefined
                            ? selectedPetak.value_mean
                            : "-"}
                        </span>

                        {unit && (
                          <span className="text-[10px] font-medium text-white/50">
                            {unit}
                          </span>
                        )}
                      </div>

                      {selectedPetak.value_min !== undefined &&
                        selectedPetak.value_max !== undefined && (
                          <div className="mt-1 grid grid-cols-3 border-t border-white/10 pt-1 text-center tabular-nums">
                            <div>
                              <p className="text-[10px] font-medium text-white/45">
                                Min
                              </p>

                              <p className="text-[10px] font-bold text-white">
                                {selectedPetak.value_min}
                              </p>
                            </div>

                            <div className="border-x border-white/10">
                              <p className="text-[10px] font-medium text-white/45">
                                Rerata
                              </p>

                              <p className="text-[10px] font-bold text-white">
                                {selectedPetak.value_mean}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-medium text-white/45">
                                Maks
                              </p>

                              <p className="text-[10px] font-bold text-white">
                                {selectedPetak.value_max}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>

                    <AccordionRow
                      title="Ringkasan kondisi"
                      open={petakSection === "summary"}
                      onToggle={() =>
                        setPetakSection((prev) =>
                          prev === "summary" ? null : "summary"
                        )
                      }
                    >
                      <p className="text-[10px] font-medium leading-4 text-[#4E504A]">
                        {summaryText}
                      </p>
                    </AccordionRow>

                    <AccordionRow
                      title="Layer analisis lahan"
                      badge={`${availableCount}/${analysisRows.length}`}
                      open={petakSection === "layers"}
                      onToggle={() =>
                        setPetakSection((prev) =>
                          prev === "layers" ? null : "layers"
                        )
                      }
                    >
                      <div className="space-y-0.5">
                        {analysisRows.map(({ key, label }) => {
                          const activeAnalysis = mapLayers.find(
                            (l) =>
                              l.is_visible &&
                              l.layer_type?.toLowerCase() !== "ortho"
                          );

                          const isCurrent =
                            (activeAnalysis?.layer_type || "").toLowerCase() ===
                            key;

                          const layerItem = mapLayers.find(
                            (l) => (l.layer_type || "").toLowerCase() === key
                          );

                          return (
                            <div
                              key={key}
                              className={cn(
                                "flex items-center justify-between gap-1.5 border px-1 py-0.5 text-[10px]",
                                isCurrent
                                  ? "border-[#171717] bg-[#F7F8F5] font-bold text-[#171717]"
                                  : "border-transparent text-[#858780]"
                              )}
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span
                                  className={cn(
                                    "h-1 w-1 shrink-0",
                                    isCurrent
                                      ? "bg-[#76B900]"
                                      : layerItem
                                      ? "bg-[#171717]"
                                      : "bg-[#DCDDD8]"
                                  )}
                                />

                                <span className="truncate">{label}</span>
                              </span>

                              {isCurrent ? (
                                <span className="shrink-0 font-bold tabular-nums text-[#171717]">
                                  {selectedPetak.value_mean !== undefined
                                    ? selectedPetak.value_mean
                                    : "Aktif"}
                                </span>
                              ) : layerItem ? (
                                <span className="shrink-0 border border-[#E0E1DC] bg-[#F7F8F5] px-1 py-0.5 text-[10px] font-semibold text-[#4E504A]">
                                  Tersedia
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-medium text-[#B0B1AB]">
                                  Belum ada
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionRow>
                  </div>
                </motion.div>
              </div>
            );
          })()}

        {/* =================================================
              MAP LEGEND — BOTTOM CENTER DRAWER
        ================================================== */}
        <MapLegend layers={mapLayers} gridEnabled={gridEnabled} />

        {/* =================================================
      BOTTOM-LEFT CONTROLS
================================================== */}
        <div
          className="pointer-events-none absolute bottom-2 z-20 flex flex-col items-start gap-1 sm:bottom-3"
          style={{
            left: "calc(var(--map-ui-left, 8px) + 4px)",
            transition: "left 300ms ease-out",
          }}
        >
          <div className="pointer-events-auto flex items-center gap-px border border-[#DCDDD8] bg-white/95 p-px shadow-[0_8px_18px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <button
              type="button"
              onClick={handleRotateLeft}
              title="Putar -45°"
              aria-label="Putar kiri 45 derajat"
              className={controlButtonClass}
            >
              <RotateCcw className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
            </button>

            <button
              type="button"
              onClick={handleResetNorth}
              title="Reset ke Utara"
              aria-label="Reset ke Utara"
              className="flex h-7 w-7 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] outline-none transition-colors hover:bg-[#EEEFEA] focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
            >
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  transform: `rotate(${-bearing}deg)`,
                }}
              >
                <div className="relative flex h-3.5 w-1.5 flex-col items-center">
                  <div className="h-2 w-0 border-x-[2.5px] border-b-[7px] border-x-transparent border-b-red-600" />

                  <div className="h-2 w-0 border-x-[2.5px] border-t-[7px] border-x-transparent border-t-[#B0B1AB]" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              title="Putar +45°"
              aria-label="Putar kanan 45 derajat"
              className={controlButtonClass}
            >
              <RotateCw className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
            </button>

            <span className="min-w-[36px] px-0.5 text-center text-[10px] font-semibold tabular-nums text-[#4E504A]">
              {bearing}° {getDirection(bearing)}
            </span>

            <div className="mx-px h-3.5 w-px bg-[#E7E8E3]" />

            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar Peta (Zoom In)"
              aria-label="Zoom In"
              className={controlButtonClass}
            >
              <ZoomIn className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil Peta (Zoom Out)"
              aria-label="Zoom Out"
              className={controlButtonClass}
            >
              <ZoomOut className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              aria-label={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              className={controlButtonClass}
            >
              {isFullscreen ? (
                <Minimize2 className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
              ) : (
                <Maximize2 className="h-2.5 w-2.5" strokeWidth={ICON_STROKE} />
              )}
            </button>
          </div>
        </div>

        {/* =================================================
              MAP CONTAINER
        ================================================== */}
        <div ref={containerRef} className="h-full w-full bg-[#F4F5F2]" />
      </div>
    );
  }
);

MapDisplay.displayName = "MapDisplay";

export default React.memo(MapDisplay);
