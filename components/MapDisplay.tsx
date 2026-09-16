"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

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
} from "lucide-react";

import LayerControlPanel from "@/components/LayerControlPanel";
import type { MapLayerItem } from "@/types/map";
import { generatePetakGrid, type PetakProperties } from "@/lib/gridGenerator";

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
       BAKING POLL — auto-refresh layer status while any
       layer is pending/processing, hide from MapLibre
    ====================================================== */

    useEffect(() => {
      const hasBaking = mapLayers.some(
        (l) => l.conversion_status === "pending" || l.conversion_status === "processing"
      );
      if (!hasBaking || !mapId) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
      let cancelled = false;

      const poll = async () => {
        try {
          const headers: Record<string, string> = {};
          if (tokenRef.current) headers.Authorization = `Bearer ${tokenRef.current}`;
          const res = await fetch(`${baseUrl}/maps/${mapId}/layers`, { headers });
          if (!res.ok || cancelled) return;
          const fresh: MapLayerItem[] = await res.json();

          // Update state with fresh statuses
          setMapLayers((prev) =>
            prev.map((l) => {
              const updated = fresh.find((f) => f.id === l.id);
              return updated ? { ...l, ...updated } : l;
            })
          );
          mapLayersRef.current = mapLayersRef.current.map((l) => {
            const updated = fresh.find((f) => f.id === l.id);
            return updated ? { ...l, ...updated } : l;
          });

          // For any layer that just completed, add it to MapLibre
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
                    layout: { visibility: fl.is_visible ? "visible" : "none" },
                    paint: { "raster-opacity": fl.default_opacity, "raster-resampling": "linear", "raster-fade-duration": 150 },
                  });
                }
              }
            });
          }
        } catch {
          // network error — keep polling, don't clear
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
            // Skip baking layers — not renderable yet
            if (
              layer.conversion_status === "pending" ||
              layer.conversion_status === "processing"
            ) return;

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
          console.warn(`[MapDisplay] Batas peta tidak ditemukan untuk ID ${activeMapId} (HTTP ${response.status})`);
        }

        try {
          const layersRes = await fetch(
            `${baseUrl}/maps/${activeMapId}/layers`,
            { headers }
          );

          if (layersRes.ok) {
            const lData = (await layersRes.json()) as MapLayerItem[];

            setMapLayers(lData);

            mapLayersRef.current = lData;

            setupUavLayer(data, lData);
          } else if (data) {
            setupUavLayer(data);
          }
        } catch {
          if (data) {
            setupUavLayer(data);
          }
        }

        if (response.ok) {
          fetch(`${baseUrl}/maps/${activeMapId}/spatial-info`, { headers })
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
                "background-color": "#eef2ec",
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
            { headers }
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
            "line-color": "#10b981",
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
            "circle-color": "#10b981",
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
            rounded-full
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
                ? "bg-[#91b928] ring-4 ring-[#91b928]/60 animate-pulse"
                : isLastPoint
                ? "bg-amber-500 ring-2 ring-amber-300"
                : "bg-[#123c28]"
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
            "line-color": "#123c28",
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
            "fill-color": "#91b928",
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
      mapRef.current?.zoomIn({ duration: 400 });
    }, []);

    const handleZoomOut = useCallback(() => {
      mapRef.current?.zoomOut({ duration: 400 });
    }, []);

    const handleToggle3D = useCallback(() => {
      setTerrainEnabled((current) => !current);
    }, []);

    /* =====================================================
       RENDER
    ====================================================== */

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#eef2ec]">
        {/* =================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 sm:bottom-6">
            <div className="flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-gray-800 shadow-xl backdrop-blur-md ring-1 ring-black/5 sm:gap-2.5 sm:px-4 sm:py-2 sm:text-xs">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent sm:h-3.5 sm:w-3.5" />
              <span>Memuat data geospasial...</span>
            </div>
          </div>
        )}

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
            if (!activeMapId) return;

            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
            const headers: Record<string, string> = {};
            if (activeToken) headers.Authorization = `Bearer ${activeToken}`;

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
                      ? { ...l, conversion_status: "pending", conversion_error: null }
                      : l
                  )
                );
                mapLayersRef.current = mapLayersRef.current.map((l) =>
                  l.id === layerId
                    ? { ...l, conversion_status: "pending", conversion_error: null }
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
            if (!activeMapId) return;

            // Berikan nilai display_order baru berurutan sesuai urutan drag
            const updated = newLayers.map((layer, idx) => ({
              ...layer,
              display_order: idx,
            }));

            // Update visual state seketika
            setMapLayers(updated);
            mapLayersRef.current = updated;

            // Update MapLibre layer z-order secara instan
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

            // Persist ke database di backend
            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (activeToken) headers.Authorization = `Bearer ${activeToken}`;

            try {
              await Promise.all(
                updated.map((layer) =>
                  fetch(`${baseUrl}/maps/${activeMapId}/layers/${layer.id}`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({ display_order: layer.display_order }),
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
            if (!activeMapId) return;

            // Update visual state seketika
            const updated = mapLayersRef.current.map((l) => ({
              ...l,
              is_base_layer: l.id === layerId,
            }));
            setMapLayers(updated);
            mapLayersRef.current = updated;

            // Persist ke backend
            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (activeToken) headers.Authorization = `Bearer ${activeToken}`;

            try {
              await fetch(`${baseUrl}/maps/${activeMapId}/layers/${layerId}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ is_base_layer: true }),
              });
            } catch (err) {
              console.error("Gagal mengubah base layer:", err);
            }
          }}
        />

        {/* =================================================
            PRECISION FARMING TOOLBAR
            RESPONSIVE, TETAP SATU BARIS
        ================================================== */}

        <div
          className="
            absolute
            left-1/2
            top-2
            z-50
            flex
            max-w-[calc(100%-12px)]
            -translate-x-1/2
            items-center
            gap-0.5
            whitespace-nowrap
            rounded-full
            border border-gray-200/80
            bg-white/95
            p-0.5
            shadow-lg
            backdrop-blur-md
            sm:top-3
            sm:max-w-[calc(100%-24px)]
            sm:gap-1
            sm:p-1
            md:p-1.5
          "
        >
          {/* NAVIGASI */}

          <button
            type="button"
            onClick={() => {
              setToolMode("none");

              handleCloseCompare();

              handleClearMeasurement();

              setPostgisCardOpen(false);
            }}
            title="Navigasi Standar"
            className={`
              flex
              shrink-0
              items-center
              justify-center
              gap-0.5
              rounded-full
              px-1.5
              py-1
              text-[7px]
              font-semibold
              transition
              sm:gap-1
              sm:px-2
              sm:py-1
              sm:text-[9px]
              md:gap-1.5
              md:px-3
              md:py-1.5
              md:text-[11px]
              ${
                toolMode === "none" && !compareMode && !postgisCardOpen
                  ? "bg-[#123c28] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <MousePointer className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />

            <span>Navigasi</span>
          </button>

          {/* POSTGIS */}

          {spatialInfo?.has_spatial_geometry && spatialInfo.area_hectares && (
            <button
              type="button"
              onClick={() => {
                const next = !postgisCardOpen;

                setPostgisCardOpen(next);

                if (next) {
                  setToolMode("none");

                  handleCloseCompare();

                  handleClearMeasurement();
                }
              }}
              title={`Klik untuk melihat detail verifikasi geodetik PostGIS (${spatialInfo.area_hectares} ha)`}
              className={`
                  flex
                  shrink-0
                  items-center
                  justify-center
                  gap-0.5
                  whitespace-nowrap
                  rounded-full
                  px-1.5
                  py-1
                  text-[7px]
                  font-semibold
                  transition
                  cursor-pointer
                  select-none
                  sm:gap-1
                  sm:px-2
                  sm:py-1
                  sm:text-[9px]
                  md:gap-1.5
                  md:px-3
                  md:py-1.5
                  md:text-[11px]
                  ${
                    postgisCardOpen
                      ? "bg-[#123c28] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
            >
              <img src="/postgis.png" alt="PostGIS Elephant" className="h-6 w-6 shrink-0 object-contain -my-1" />
              <span>PostGIS</span>

              <span
                className={`font-bold ${
                  postgisCardOpen ? "text-white" : "text-gray-900"
                }`}
              >
                {typeof spatialInfo.area_hectares === "number"
                  ? `${Number(spatialInfo.area_hectares.toFixed(2))} ha`
                  : `${spatialInfo.area_hectares} ha`}
              </span>
            </button>
          )}

          {/* UKUR JARAK */}

          <button
            type="button"
            onClick={() => {
              handleCloseCompare();

              setPostgisCardOpen(false);

              const next = toolMode === "distance" ? "none" : "distance";

              setToolMode(next);

              handleClearMeasurement();
            }}
            title="Ukur Jarak & Keliling"
            className={`
              flex
              shrink-0
              items-center
              justify-center
              gap-0.5
              rounded-full
              px-1.5
              py-1
              text-[7px]
              font-semibold
              transition
              sm:gap-1
              sm:px-2
              sm:py-1
              sm:text-[9px]
              md:gap-1.5
              md:px-3
              md:py-1.5
              md:text-[11px]
              ${
                toolMode === "distance"
                  ? "bg-[#123c28] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <Ruler className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />

            <span>Ukur Jarak</span>
          </button>

          {/* BANDINGKAN */}

          <button
            type="button"
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
            title="Bandingkan Layer Multilayer"
            className={`
              flex
              shrink-0
              items-center
              justify-center
              gap-0.5
              rounded-full
              px-1.5
              py-1
              text-[7px]
              font-semibold
              transition
              sm:gap-1
              sm:px-2
              sm:py-1
              sm:text-[9px]
              md:gap-1.5
              md:px-3
              md:py-1.5
              md:text-[11px]
              ${
                compareMode
                  ? "bg-[#123c28] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <SplitSquareVertical className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />

            <span>Bandingkan</span>
          </button>

          {/* DIVIDER */}

          <div className="mx-0.5 h-4 w-px shrink-0 bg-gray-200 sm:mx-1 sm:h-5" />

          {/* PETAK */}

          <button
            type="button"
            onClick={() => {
              setGridEnabled((prev) => !prev);
            }}
            title="Tampilkan Grid Petak Pertanian (10×10m)"
            className={`
              flex
              shrink-0
              items-center
              justify-center
              gap-0.5
              rounded-full
              px-1.5
              py-1
              text-[7px]
              font-semibold
              transition
              sm:gap-1
              sm:px-2
              sm:py-1
              sm:text-[9px]
              md:gap-1.5
              md:px-3
              md:py-1.5
              md:text-[11px]
              ${
                gridEnabled
                  ? "bg-[#123c28] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <Grid className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />

            <span>Petak</span>
          </button>
        </div>

        {/* =================================================
            MEASUREMENT STATUS CARD
        ================================================== */}

        {toolMode !== "none" && (
          <div
            className="
              absolute
              left-1/2
              top-12
              z-50
              w-[calc(100%-20px)]
              max-w-[380px]
              -translate-x-1/2
              rounded-xl
              border border-emerald-900/10
              bg-white/95
              p-2.5
              shadow-2xl
              backdrop-blur-xl
              transition-all
              duration-200
              animate-in
              fade-in
              slide-in-from-top-2
              sm:top-16
              sm:w-[92vw]
              sm:rounded-2xl
              sm:p-4
            "
          >
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-[10px] font-bold text-gray-900 sm:text-xs">
                {toolMode === "area"
                  ? "Ukur Area Lahan"
                  : "Ukur Jarak Lintasan"}
              </h4>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {measurePoints.length > 0 && (
                  <span className="text-[9px] font-medium text-gray-500 sm:text-[11px]">
                    {measurePoints.length} titik
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setToolMode("none")}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 sm:h-6 sm:w-6"
                  title="Tutup Pengukuran"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* HINT */}

            <div className="my-2 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/90 px-2 py-1.5 text-[9px] text-slate-600 sm:my-2.5 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[11px]">
              <MousePointer className="h-3 w-3 shrink-0 text-[#91b928] sm:h-3.5 sm:w-3.5" />

              <span className="font-medium leading-tight">
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

            {/* METRICS */}

            {measuredMetrics && (
              <div className="my-2 rounded-lg border border-emerald-100/90 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/40 p-2.5 shadow-xs sm:my-2.5 sm:rounded-xl sm:p-3">
                {toolMode === "area" ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="border-r border-emerald-100/70 pr-2">
                      <span className="block text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[9px]">
                        Total Luas Lahan
                      </span>

                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-lg font-black tracking-tight text-[#123c28] sm:text-xl">
                          {measuredMetrics.areaHa ?? 0}
                        </span>

                        <span className="text-[10px] font-bold text-gray-500 sm:text-xs">
                          ha
                        </span>
                      </div>

                      <span className="text-[9px] font-medium text-gray-400 sm:text-[10px]">
                        {(measuredMetrics.areaM2 ?? 0).toLocaleString("id-ID")}{" "}
                        m²
                      </span>
                    </div>

                    <div className="flex flex-col justify-between pl-1">
                      <div>
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[9px]">
                          Keliling Batas
                        </span>

                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-sm font-extrabold text-gray-800 sm:text-base">
                            {(measuredMetrics.perimeterM ?? 0).toLocaleString(
                              "id-ID"
                            )}
                          </span>

                          <span className="text-[10px] font-bold text-gray-500 sm:text-xs">
                            meter
                          </span>
                        </div>
                      </div>

                      {measuredMetrics.areaHa ? (
                        <div className="mt-1 flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-100/70 px-1 py-0.5 text-[8px] font-bold text-emerald-900 sm:px-1.5 sm:text-[9px]">
                          <span>🌱 Est. Urea:</span>

                          <span>
                            ±{Math.round(measuredMetrics.areaHa * 250)} kg
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[9px]">
                      Total Jarak Lintasan
                    </span>

                    <div className="mt-0.5 flex flex-wrap items-baseline gap-1 sm:gap-1.5">
                      <span className="text-xl font-black tracking-tight text-[#123c28] sm:text-2xl">
                        {measuredMetrics.distanceKm}
                      </span>

                      <span className="text-[10px] font-bold text-gray-600 sm:text-xs">
                        km
                      </span>

                      <span className="text-[9px] font-medium text-gray-400 sm:text-xs">
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

            {/* ACTIONS */}

            <div className="flex items-center justify-between gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
              <div className="flex items-center gap-1">
                {measurePoints.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoPoint}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[9px] font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs"
                    title="Undo titik terakhir"
                  >
                    <Undo2 className="h-3 w-3 text-gray-500 sm:h-3.5 sm:w-3.5" />

                    <span>Undo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearMeasurement}
                  disabled={measurePoints.length === 0}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold transition active:scale-95 sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs ${
                    measurePoints.length === 0
                      ? "cursor-not-allowed text-gray-300"
                      : "border border-transparent text-red-600 hover:border-red-200 hover:bg-red-50"
                  }`}
                  title="Reset semua titik pengukuran"
                >
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

                  <span>Reset</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setToolMode("none")}
                className="flex items-center gap-1 rounded-lg bg-[#123c28] px-2.5 py-1 text-[9px] font-bold text-white shadow-sm transition hover:bg-[#1b4d35] active:scale-95 sm:gap-1.5 sm:rounded-xl sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

                <span>Selesai</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            MULTILAYER COMPARISON BAR
        ================================================== */}

        {compareMode && (
          <div className="absolute left-1/2 top-14 z-50 w-[calc(100%-20px)] max-w-[420px] -translate-x-1/2 rounded-xl border border-emerald-900/10 bg-white/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2 sm:top-16 sm:w-[92vw] sm:rounded-2xl sm:p-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-[10px] font-bold text-gray-900 sm:text-xs">
                Bandingkan Layer Multilayer
              </h4>

              <button
                type="button"
                onClick={handleCloseCompare}
                className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 sm:h-6 sm:w-6"
                title="Tutup Perbandingan"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="my-2.5 flex items-center gap-1.5 sm:my-3 sm:gap-2">
              <div className="flex-1">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[9px]">
                  Layer A (Primer)
                </span>

                <select
                  value={compareLayerA}
                  onChange={(e) => setCompareLayerA(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1.5 text-[10px] font-bold text-gray-800 outline-none transition focus:border-[#123c28] focus:bg-white sm:rounded-xl sm:px-2.5 sm:text-xs"
                >
                  {mapLayers.map((l) => (
                    <option key={`a-${l.id}`} value={l.id}>
                      {l.name}
                    </option>
                  ))}

                  <option value="__basemap__">Basemap (Satelit / Jalan)</option>
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
                className="mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#123c28] active:scale-95 shadow-2xs sm:h-8 sm:w-8 sm:rounded-xl"
              >
                <ArrowLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>

              <div className="flex-1">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[9px]">
                  Layer B (Pembanding)
                </span>

                <select
                  value={compareLayerB}
                  onChange={(e) => setCompareLayerB(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1.5 text-[10px] font-bold text-gray-800 outline-none transition focus:border-[#123c28] focus:bg-white sm:rounded-xl sm:px-2.5 sm:text-xs"
                >
                  {mapLayers.map((l) => (
                    <option key={`b-${l.id}`} value={l.id}>
                      {l.name}
                    </option>
                  ))}

                  <option value="__basemap__">Basemap (Satelit / Jalan)</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 sm:rounded-xl sm:p-3">
              <div className="mb-1.5 flex items-center justify-between text-[8px] font-bold sm:text-[10px]">
                <span className="rounded-md border border-gray-200/60 bg-white px-1.5 py-0.5 text-[#123c28] shadow-2xs sm:px-2">
                  Layer A: {100 - compareRatio}%
                </span>

                <span className="rounded-md border border-gray-200/60 bg-white px-1.5 py-0.5 text-emerald-700 shadow-2xs sm:px-2">
                  Layer B: {compareRatio}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={compareRatio}
                onChange={(e) => setCompareRatio(parseInt(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28] sm:h-2"
              />

              <div className="mt-2 flex items-center gap-1 sm:mt-2.5 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setCompareRatio(0)}
                  className={`flex-1 rounded-md border py-1 text-[8px] font-bold transition active:scale-95 sm:rounded-lg sm:py-1.5 sm:text-[10px] ${
                    compareRatio === 0
                      ? "border-[#123c28] bg-[#123c28] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  100% A
                </button>

                <button
                  type="button"
                  onClick={() => setCompareRatio(50)}
                  className={`flex-1 rounded-md border py-1 text-[8px] font-bold transition active:scale-95 sm:rounded-lg sm:py-1.5 sm:text-[10px] ${
                    compareRatio === 50
                      ? "border-[#123c28] bg-[#123c28] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  50 / 50 Blend
                </button>

                <button
                  type="button"
                  onClick={() => setCompareRatio(100)}
                  className={`flex-1 rounded-md border py-1 text-[8px] font-bold transition active:scale-95 sm:rounded-lg sm:py-1.5 sm:text-[10px] ${
                    compareRatio === 100
                      ? "border-[#123c28] bg-[#123c28] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  100% B
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            POSTGIS GEODETIC DETAIL HUD CARD
        ================================================== */}

        {postgisCardOpen && spatialInfo && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-[400px] rounded-2xl border border-emerald-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src="/postgis.png" alt="PostGIS Elephant" className="h-6 w-6 shrink-0 object-contain" />
                <h4 className="text-xs font-bold text-gray-900">
                  Detail Verifikasi Geodetik PostGIS
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setPostgisCardOpen(false)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 sm:h-6 sm:w-6"
                title="Tutup Detail"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Spatial Reference / Info Banner */}
            <div className="my-2.5 flex items-start sm:items-center gap-2.5 rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/95 via-white to-teal-50/80 p-2.5 shadow-[0_2px_8px_-2px_rgba(18,60,40,0.1),0_1px_3px_rgba(18,60,40,0.06)] ring-1 ring-emerald-900/5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100/90 text-emerald-800 shadow-2xs border border-emerald-200/80">
                <Info className="h-3.5 w-3.5 stroke-[2.3]" />
              </div>
              <span className="text-[10.5px] font-medium text-emerald-950 leading-snug">
                Luas lahan terverifikasi dihitung pada ellipsoid{" "}
                <strong className="font-bold text-emerald-900">WGS-84 (EPSG:4326)</strong>{" "}
                menggunakan fungsi geodetik PostGIS backend.
              </span>
            </div>

            {/* METRICS */}

            <div className="my-2 rounded-lg border border-emerald-100/90 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 p-2.5 shadow-xs sm:my-2.5 sm:rounded-xl sm:p-3">
              <div className="grid grid-cols-2 gap-2 border-b border-emerald-100/60 pb-2 sm:gap-3 sm:pb-2.5">
                <div>
                  <span className="text-[8px] font-medium uppercase tracking-wider text-gray-500 sm:text-[10px]">
                    Luas Lahan (ha)
                  </span>

                  <p className="text-sm font-extrabold text-[#123c28] sm:text-base">
                    {spatialInfo.area_hectares ?? "-"}{" "}
                    <span className="text-[9px] font-semibold sm:text-xs">
                      ha
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-[8px] font-medium uppercase tracking-wider text-gray-500 sm:text-[10px]">
                    Luas Lahan (m²)
                  </span>

                  <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                    {spatialInfo.area_m2
                      ? spatialInfo.area_m2.toLocaleString("id-ID")
                      : "-"}{" "}
                    <span className="text-[9px] font-semibold text-slate-500 sm:text-xs">
                      m²
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 sm:gap-3 sm:pt-2.5">
                <div>
                  <span className="text-[8px] font-medium uppercase tracking-wider text-gray-500 sm:text-[10px]">
                    Keliling Batas Lahan
                  </span>

                  <p className="text-xs font-bold text-slate-800 sm:text-sm">
                    {spatialInfo.perimeter_meters
                      ? spatialInfo.perimeter_meters >= 1000
                        ? `${(spatialInfo.perimeter_meters / 1000).toFixed(
                            2
                          )} km`
                        : `${spatialInfo.perimeter_meters.toFixed(1)} m`
                      : "-"}
                  </p>

                  {spatialInfo.perimeter_meters && (
                    <span className="text-[8px] text-slate-400 sm:text-[10px]">
                      ({spatialInfo.perimeter_meters.toLocaleString("id-ID")}{" "}
                      meter)
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[8px] font-medium uppercase tracking-wider text-gray-500 sm:text-[10px]">
                    Titik Pusat (Centroid)
                  </span>

                  <p className="text-[10px] font-bold leading-tight text-slate-800 sm:text-xs">
                    {spatialInfo.centroid
                      ? `${spatialInfo.centroid[1].toFixed(
                          5
                        )}°, ${spatialInfo.centroid[0].toFixed(5)}°`
                      : "-"}
                  </p>

                  <span className="text-[8px] text-slate-400 sm:text-[10px]">
                    Latitude, Longitude
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex items-center justify-between gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
              <button
                type="button"
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
                className="flex items-center gap-1 rounded-lg bg-[#123c28] px-2.5 py-1 text-[9px] font-bold text-white shadow-sm transition hover:bg-[#1b4d35] active:scale-95 sm:gap-1.5 sm:rounded-xl sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                <MousePointer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

                <span>Fokus ke Lahan</span>
              </button>

              <button
                type="button"
                onClick={() => setPostgisCardOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 sm:rounded-xl sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            INSPEKSI PETAK
        ================================================== */}

        {selectedPetak &&
          petakScreenPos &&
          (() => {
            const cEl = containerRef.current;

            const containerW = cEl?.clientWidth || 800;

            const isSmall = containerW < 640;

            const cardWidth = isSmall ? 255 : 295;

            const halfW = cardWidth / 2;

            const clampX = Math.max(
              halfW + 12,
              Math.min(containerW - halfW - 12, petakScreenPos.x)
            );

            const isAbove = petakScreenPos.y >= (isSmall ? 240 : 320);

            const arrowOffsetPercent = Math.max(
              14,
              Math.min(86, 50 + ((petakScreenPos.x - clampX) / cardWidth) * 100)
            );

            return (
              <div
                className={`
                  absolute
                  z-30
                  ${isSmall ? "w-[255px]" : "w-[295px]"}
                  pointer-events-auto
                  transition-transform
                  duration-75
                  ease-out
                `}
                style={{
                  left: `${clampX}px`,
                  top: `${
                    isAbove ? petakScreenPos.y - 14 : petakScreenPos.y + 14
                  }px`,
                  transform: isAbove
                    ? "translate(-50%, -100%)"
                    : "translate(-50%, 0)",
                }}
              >
                {isAbove ? (
                  <div
                    className="absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-gray-200/80 bg-white shadow-xs"
                    style={{
                      left: `${arrowOffsetPercent}%`,
                    }}
                  />
                ) : (
                  <div
                    className="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gray-200/80 bg-white shadow-xs"
                    style={{
                      left: `${arrowOffsetPercent}%`,
                    }}
                  />
                )}

                <div className="relative rounded-xl border border-gray-200/90 bg-white/95 p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 sm:rounded-2xl sm:p-3.5">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-1.5 sm:pb-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-100 text-[8px] font-black text-emerald-800 sm:h-5 sm:w-5 sm:text-[10px]">
                          🔲
                        </span>

                        <h4 className="text-[10px] font-bold text-gray-900 sm:text-xs">
                          Petak {selectedPetak.block_id}
                        </h4>

                        <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-1 py-0.5 text-[7px] font-bold text-emerald-700 sm:px-1.5 sm:text-[9px]">
                          {Math.round(Math.sqrt(selectedPetak.area_m2))}×
                          {Math.round(Math.sqrt(selectedPetak.area_m2))}m
                        </span>
                      </div>

                      <div className="mt-0.5 text-[8px] font-medium text-gray-400 sm:text-[10px]">
                        {mapTitle || "Lahan Drone"} · {selectedPetak.area_m2} m²
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPetak(null)}
                      className="cursor-pointer rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 sm:p-1"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-2 sm:mt-2.5 sm:space-y-2.5">
                    {/* PRIMARY */}

                    {(() => {
                      const activeAnalysisLayer = mapLayers.find(
                        (l) =>
                          l.is_visible &&
                          l.layer_type?.toLowerCase() !== "ortho"
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

                      const isNutrient = [
                        "nitrogen",
                        "phosphorus",
                        "kalium",
                      ].some((k) =>
                        (
                          activeAnalysisLayer?.layer_type ||
                          selectedPetak.layer_type ||
                          ""
                        )
                          .toLowerCase()
                          .includes(k)
                      );

                      const unit = isDSM
                        ? "mdpl"
                        : isNutrient
                        ? "mg/kg"
                        : isNDVI
                        ? "Skala (-0.2 s/d 1.0)"
                        : "";

                      return (
                        <div className="rounded-lg border border-emerald-900/10 bg-emerald-50/60 p-2 sm:rounded-xl sm:p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-900/70 sm:text-[10px]">
                              {layerTitle}
                            </span>

                            {selectedPetak.status && (
                              <span
                                className="rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white shadow-xs sm:px-2 sm:text-[9.5px]"
                                style={{
                                  backgroundColor:
                                    selectedPetak.color || "#16a34a",
                                }}
                              >
                                {selectedPetak.status}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-baseline gap-1.5 sm:mt-1.5 sm:gap-2">
                            <span className="text-xl font-black text-emerald-950 sm:text-2xl">
                              {selectedPetak.value_mean !== undefined
                                ? selectedPetak.value_mean
                                : "-"}
                            </span>

                            {unit && (
                              <span className="text-[9px] font-semibold text-emerald-800/70 sm:text-[11px]">
                                {unit}
                              </span>
                            )}
                          </div>

                          {selectedPetak.value_min !== undefined &&
                            selectedPetak.value_max !== undefined && (
                              <div className="mt-1 flex items-center justify-between border-t border-emerald-900/10 pt-1 text-[8px] text-emerald-900/80 sm:mt-2 sm:pt-1.5 sm:text-[10.5px]">
                                <span>
                                  Min: <b>{selectedPetak.value_min}</b>
                                </span>

                                <span className="text-emerald-300">•</span>

                                <span>
                                  Rerata: <b>{selectedPetak.value_mean}</b>
                                </span>

                                <span className="text-emerald-300">•</span>

                                <span>
                                  Maks: <b>{selectedPetak.value_max}</b>
                                </span>
                              </div>
                            )}
                        </div>
                      );
                    })()}

                    {/* SUMMARY */}

                    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-2 text-[9px] sm:rounded-xl sm:p-2.5 sm:text-xs">
                      <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[10px]">
                        Ringkasan Kondisi Petak
                      </p>

                      <p className="text-[9px] leading-relaxed text-gray-700 sm:text-[11px]">
                        {(() => {
                          const lt = (
                            selectedPetak.layer_type || ""
                          ).toLowerCase();

                          const val = selectedPetak.value_mean;

                          if (lt.includes("ndvi") || lt.includes("vari")) {
                            if (val !== undefined) {
                              if (val >= 0.42) {
                                return "Tanaman Sehat (NDVI 0.42–0.92). Aktivitas fotosintesis dan klorofil kanopi sangat optimal. (Ref: Rahaldi et al., 2013)";
                              }

                              if (val >= 0.22) {
                                return "Tanaman Normal (NDVI 0.22–0.42). Kondisi tanaman wajar dengan kerapatan tajuk sedang/berjarak. (Ref: Rahaldi et al., 2013)";
                              }

                              if (val >= 0.11) {
                                return "Tanaman Tidak Sehat (NDVI 0.11–0.22). Vegetasi terindikasi mengalami stres, kekurangan hara, atau kerusakan tajuk. (Ref: Rahaldi et al., 2013)";
                              }

                              return "Non Vegetasi (NDVI < 0.11). Area lahan terbuka, tanah gundul, bebatuan, atau jalan kebun. (Ref: Rahaldi et al., 2013)";
                            }
                          } else if (lt.includes("dsm")) {
                            return `Elevasi permukaan tanah berada pada ketinggian rata-rata ${
                              val ?? "-"
                            } mdpl.`;
                          } else if (selectedPetak.status) {
                            return `Kondisi petak terindikasi ${selectedPetak.status.toLowerCase()} berdasarkan pembacaan raster sensor drone.`;
                          }

                          return "Data saintifik diekstraksi langsung dari berkas GeoTIFF drone resolusi tinggi.";
                        })()}
                      </p>
                    </div>

                    {/* LAYER STATUS */}

                    <div className="space-y-1 rounded-lg border border-gray-100 bg-white p-2 text-[9px] sm:rounded-xl sm:p-2.5 sm:text-xs">
                      <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-gray-400 sm:text-[10px]">
                        Daftar Layer Analisis Lahan
                      </p>

                      {[
                        {
                          key: "ndvi",
                          label: "NDVI (Kesehatan Vegetasi)",
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
                          label: "DSM (Elevasi Lahan)",
                        },
                      ].map(({ key, label }) => {
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
                            className={`flex items-center justify-between rounded-md px-1.5 py-1 text-[9px] sm:rounded-lg sm:px-2 sm:text-[11px] ${
                              isCurrent
                                ? "border border-emerald-200/60 bg-emerald-50/70 font-bold text-emerald-950"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-1">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  isCurrent
                                    ? "bg-emerald-600"
                                    : layerItem
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                                }`}
                              />

                              <span className="truncate">{label}</span>
                            </span>

                            {isCurrent ? (
                              <span className="ml-1 shrink-0 font-mono font-bold text-emerald-700">
                                {selectedPetak.value_mean !== undefined
                                  ? selectedPetak.value_mean
                                  : "Aktif"}
                              </span>
                            ) : layerItem ? (
                              <span className="ml-1 shrink-0 rounded bg-blue-50 px-1 py-0.5 text-[8px] font-semibold text-blue-700 sm:px-1.5 sm:text-[10px]">
                                Tersedia di Peta
                              </span>
                            ) : (
                              <span className="ml-1 shrink-0 text-[8px] italic text-gray-400 sm:text-[10px]">
                                Belum diunggah
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* =================================================
            BOTTOM-LEFT CONTROLS
        ================================================== */}

        <div className="pointer-events-none absolute bottom-3 left-2 z-20 flex flex-col items-start gap-2 sm:bottom-6 sm:left-4 sm:gap-2.5">
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-gray-200/90 bg-white/95 p-1 shadow-md backdrop-blur-md sm:gap-1 sm:p-1.5">
            <button
              type="button"
              onClick={handleRotateLeft}
              title="Putar -45°"
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 sm:h-7 sm:w-7"
            >
              <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetNorth}
              title="Reset ke Utara"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition hover:bg-gray-100 sm:h-9 sm:w-9"
            >
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  transform: `rotate(${-bearing}deg)`,
                }}
              >
                <div className="relative flex h-4 w-1.5 flex-col items-center sm:h-5 sm:w-2">
                  <div className="h-2 w-0 border-x-[2.5px] border-x-transparent border-b-[8px] border-b-red-600 sm:h-2.5 sm:border-x-[3.5px] sm:border-b-[10px]" />

                  <div className="h-2 w-0 border-x-[2.5px] border-x-transparent border-t-[8px] border-t-gray-300 sm:h-2.5 sm:border-x-[3.5px] sm:border-t-[10px]" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              title="Putar +45°"
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 sm:h-7 sm:w-7"
            >
              <RotateCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>

            <span className="pl-0.5 pr-1 text-[8px] font-bold text-gray-700 sm:pl-1 sm:pr-1.5 sm:text-[10px]">
              {bearing}° {getDirection(bearing)}
            </span>

            {/* DIVIDER */}
            <div className="mx-0.5 h-4 w-px bg-gray-200 sm:mx-1 sm:h-5" />

            {/* ZOOM IN */}
            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar Peta (Zoom In)"
              aria-label="Zoom In"
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:h-7 sm:w-7"
            >
              <ZoomIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>

            {/* ZOOM OUT */}
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil Peta (Zoom Out)"
              aria-label="Zoom Out"
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:h-7 sm:w-7"
            >
              <ZoomOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>

            {/* FULLSCREEN */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              aria-label={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:h-7 sm:w-7"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : (
                <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            MAP CONTAINER
        ================================================== */}

        <div ref={containerRef} className="h-full w-full bg-[#eef2ec]" />
      </div>
    );
  }
);

MapDisplay.displayName = "MapDisplay";

export default React.memo(MapDisplay);
