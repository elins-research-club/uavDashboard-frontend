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
  Pentagon,
  SplitSquareVertical,
  Trash2,
  MousePointer,
  BadgeCheck,
  SlidersHorizontal,
  Info,
  Check,
  ChevronDown,
  Undo2,
  ArrowLeftRight,
  X,
} from "lucide-react";

import LayerControlPanel from "@/components/LayerControlPanel";
import type { MapLayerItem } from "@/types/map";

/* =========================================================
   PMTILES REGISTRATION
========================================================= */

let pmtilesRegistered = false;

if (typeof window !== "undefined" && !pmtilesRegistered) {
  try {
    const protocol = new pmtiles.Protocol();

    maplibregl.addProtocol("pmtiles", protocol.tile);

    pmtilesRegistered = true;
  } catch {
    // Protocol already registered.
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
    maxzoom: 19,
    attribution:
      "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  street: {
    name: "Peta Jalan",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    labels: null,
    maxzoom: 19,
    attribution: "Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, USGS",
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
    const basemapRef = useRef<keyof typeof BASEMAPS>("satellite");

    /*
     * Tetap digunakan untuk fallback
     * single raster/image mode.
     *
     * TIDAK dikirim ke LayerControlPanel.
     */
    const overlayOpacityRef = useRef(0.95);
    const terrainEnabledRef = useRef(false);
    const mapIdRef = useRef(mapId);
    const tokenRef = useRef(token);
    const currentMetaRef = useRef<BoundsResponse | null>(null);
    const mapLayersRef = useRef<MapLayerItem[]>([]);

    /* =====================================================
       STATE
    ====================================================== */

    const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("satellite");

    /*
     * Global overlay opacity.
     *
     * Hanya dipakai fallback single-layer.
     */
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
       PRECISION FARMING & SPATIAL TOOLS STATE (TURF & POSTGIS)
    ====================================================== */

    const [spatialInfo, setSpatialInfo] = useState<{
      area_hectares?: number | null;
      area_m2?: number | null;
      perimeter_meters?: number | null;
      centroid?: [number, number] | null;
      has_spatial_geometry?: boolean;
    } | null>(null);

    const [toolMode, setToolMode] = useState<"none" | "area" | "distance">("none");
    const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
    const [measuredMetrics, setMeasuredMetrics] = useState<{
      areaHa?: number;
      areaM2?: number;
      perimeterM?: number;
      distanceM?: number;
      distanceKm?: number;
    } | null>(null);

    /* Multilayer Compare State */
    const [compareMode, setCompareMode] = useState(false);
    const [compareLayerA, setCompareLayerA] = useState<string>("");
    const [compareLayerB, setCompareLayerB] = useState<string>("");
    const [compareRatio, setCompareRatio] = useState<number>(50);
    const measureMarkersRef = useRef<maplibregl.Marker[]>([]);
    const isComparingRef = useRef(false);

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

    /* Auto resize map whenever container dimensions change */
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
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

      // 1. Street Basemap (bottom layer above background)
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

      // 2. Satellite Basemap
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

      // 3. Satellite Labels
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
            pitch: 50,
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

        /* =============================================
             MULTI LAYER
          ============================================== */

        if (currentLayers && currentLayers.length > 0) {
          // Remove old single-layer fallbacks if any
          if (map.getLayer(UAV_RASTER_LAYER_ID)) map.removeLayer(UAV_RASTER_LAYER_ID);
          if (map.getSource(UAV_RASTER_SOURCE_ID)) map.removeSource(UAV_RASTER_SOURCE_ID);
          if (map.getLayer(UAV_IMAGE_LAYER_ID)) map.removeLayer(UAV_IMAGE_LAYER_ID);
          if (map.getSource(UAV_IMAGE_SOURCE_ID)) map.removeSource(UAV_IMAGE_SOURCE_ID);

          // Clean up any stale layers no longer in currentLayers
          const activeIds = new Set(currentLayers.map((l) => l.id));
          mapLayersRef.current.forEach((l) => {
            if (!activeIds.has(l.id)) {
              const targetL = `layer-render-${l.id}`;
              const targetS = `layer-source-${l.id}`;
              if (map.getLayer(targetL)) map.removeLayer(targetL);
              if (map.getSource(targetS)) map.removeSource(targetS);
            }
          });

          const beforeId = map.getLayer("precision-measure-fill")
            ? "precision-measure-fill"
            : undefined;

          currentLayers.forEach((layer) => {
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
                  maxzoom: 22,
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

        /* =============================================
             SINGLE TILE FALLBACK
          ============================================== */

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

        /* =============================================
             SINGLE IMAGE FALLBACK
          ============================================== */

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
        /* ===============================================
             BOUNDS
          ================================================ */

        const response = await fetch(`${baseUrl}/maps/${activeMapId}/bounds`, {
          headers,
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil batas peta");
        }

        const data = (await response.json()) as BoundsResponse;

        setCurrentMeta(data);

        currentMetaRef.current = data;

        /* ===============================================
             LAYERS
          ================================================ */

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

            setupUavLayer(data, lData);
          } else {
            setupUavLayer(data);
          }
        } catch {
          setupUavLayer(data);
        }

        /* PostGIS Spatial Info */
        fetch(`${baseUrl}/maps/${activeMapId}/spatial-info`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .then((sData) => {
            if (sData) setSpatialInfo(sData);
          })
          .catch(() => {});

        /* ===============================================
             FIT BOUNDS
          ================================================ */

        if (
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
        } else if (data.center) {
          const [lat, lng] = data.center;

          map.flyTo({
            center: [lng, lat],

            zoom: 16,

            pitch: terrainEnabledRef.current ? 50 : 0,

            bearing: 0,

            duration: 1000,

            essential: true,
          });
        }
      } catch (error) {
        console.error("Error fetching map bounds:", error);
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

        /*
         * MapLibre perlu resize setelah
         * fullscreen berubah.
         */

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

        maxPitch: 85,

        attributionControl: {
          compact: true,
        },

        renderWorldCopies: false,
      });

      mapRef.current = map;

      /* Navigation */

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,

          showZoom: false,

          visualizePitch: true,
        }),
        "top-left"
      );

      /* Load */

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

      /* Camera */

      map.on("rotate", syncCameraState);

      map.on("pitch", syncCameraState);

      map.on("zoom", syncCameraState);

      /* Cleanup */

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
       PRECISION FARMING: DYNAMIC COLORMAP
    ====================================================== */

    const handleChangeColormap = useCallback(
      async (layerId: string, colormap: string) => {
        setMapLayers((prev) =>
          prev.map((l) => (l.id === layerId ? { ...l, color_map: colormap } : l))
        );
        mapLayersRef.current = mapLayersRef.current.map((l) =>
          l.id === layerId ? { ...l, color_map: colormap } : l
        );

        const activeMapId = mapIdRef.current;
        const activeToken = tokenRef.current;
        if (activeMapId) {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (activeToken) headers.Authorization = `Bearer ${activeToken}`;
          try {
            await fetch(`${baseUrl}/maps/${activeMapId}/layers/${layerId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ color_map: colormap }),
            });
          } catch (err) {
            console.error("Gagal update colormap:", err);
          }
        }

        if (currentMetaRef.current) {
          setupUavLayer(currentMetaRef.current, mapLayersRef.current);
        }
      },
      [setupUavLayer]
    );

    /* =====================================================
       PRECISION FARMING: MEASUREMENT WITH TURF.JS
    ====================================================== */

    /* =====================================================
       PRECISION FARMING: MEASUREMENT WITH TURF.JS & MARKERS
    ====================================================== */

    const handleClearMeasurement = useCallback(() => {
      setMeasurePoints([]);
      setMeasuredMetrics(null);
      measureMarkersRef.current.forEach((m) => m.remove());
      measureMarkersRef.current = [];

      const map = mapRef.current;
      if (!map || !map.getStyle()) return;

      const lineSrc = map.getSource("precision-measure-line-source") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (lineSrc) {
        lineSrc.setData({ type: "FeatureCollection", features: [] });
      }
      const polySrc = map.getSource("precision-measure-poly-source") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (polySrc) {
        polySrc.setData({ type: "FeatureCollection", features: [] });
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
      if (!map) return;

      if (toolMode !== "none") {
        map.getCanvas().style.cursor = "crosshair";
      } else {
        map.getCanvas().style.cursor = "";
      }

      const handleMapClick = (e: maplibregl.MapMouseEvent) => {
        if (toolMode === "none") return;
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
      if (!map || !map.getStyle()) return;

      // 1. Remove previous markers
      measureMarkersRef.current.forEach((m) => m.remove());
      measureMarkersRef.current = [];

      if (toolMode === "none" || measurePoints.length === 0) {
        const lineSrc = map.getSource("precision-measure-line-source") as
          | maplibregl.GeoJSONSource
          | undefined;
        if (lineSrc)
          lineSrc.setData({ type: "FeatureCollection", features: [] });
        const polySrc = map.getSource("precision-measure-poly-source") as
          | maplibregl.GeoJSONSource
          | undefined;
        if (polySrc)
          polySrc.setData({ type: "FeatureCollection", features: [] });
        return;
      }

      // 2. Render HTML DOM Markers for 100% visible pins with numbering
      measurePoints.forEach((pt, idx) => {
        const el = document.createElement("div");
        const isFirstInArea =
          toolMode === "area" && idx === 0 && measurePoints.length >= 3;
        const isLastPoint = idx === measurePoints.length - 1;

        el.className = `flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-white text-[11px] font-black shadow-lg cursor-pointer transform hover:scale-125 transition-transform select-none ${
          isFirstInArea
            ? "bg-[#91b928] ring-4 ring-[#91b928]/60 animate-pulse"
            : isLastPoint
            ? "bg-amber-500 ring-2 ring-amber-300"
            : "bg-[#123c28]"
        }`;
        el.innerText = `${idx + 1}`;

        if (isFirstInArea) {
          el.title = "Klik untuk menutup area polygon";
        }

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(pt)
          .addTo(map);

        measureMarkersRef.current.push(marker);
      });

      // 3. Compute Metrics via Turf.js
      if (toolMode === "distance" && measurePoints.length >= 2) {
        try {
          const line = turf.lineString(measurePoints);
          const lenM = turf.length(line, { units: "meters" });
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
          const lenM = turf.length(line, { units: "meters" });
          setMeasuredMetrics({
            perimeterM: Math.round(lenM),
          });
        } catch {
          // ignore
        }
      } else {
        setMeasuredMetrics(null);
      }

      // 4. Update Line FeatureCollection
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

      // 5. Update Polygon FeatureCollection
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

      // 6. Ensure Line Source & Layers Exist
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

      // 7. Ensure Polygon Source & Layer Exist
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

      // 8. Always ensure measurement visual layers stay on top
      try {
        if (map.getLayer(FILL_LAYER)) map.moveLayer(FILL_LAYER);
        if (map.getLayer(CASING_LAYER)) map.moveLayer(CASING_LAYER);
        if (map.getLayer(INNER_LAYER)) map.moveLayer(INNER_LAYER);
      } catch {
        // ignore
      }
    }, [measurePoints, toolMode]);

    /* =====================================================
       MULTILAYER COMPARISON EFFECT
    ====================================================== */

    const handleCloseCompare = useCallback(() => {
      setCompareMode(false);
      isComparingRef.current = false;
      const map = mapRef.current;
      if (!map || !map.getStyle()) return;

      // Restore all original layer visibilities and opacities
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
      if (!map || !map.getStyle() || !compareMode) return;

      isComparingRef.current = true;

      // Ensure all other layers are temporarily managed
      mapLayersRef.current.forEach((l) => {
        const targetId = `layer-render-${l.id}`;
        if (!map.getLayer(targetId)) return;

        if (l.id === compareLayerA) {
          map.setLayoutProperty(targetId, "visibility", "visible");
          const opacityA = (100 - compareRatio) / 100;
          map.setPaintProperty(targetId, "raster-opacity", opacityA);
        } else if (l.id === compareLayerB) {
          map.setLayoutProperty(targetId, "visibility", "visible");
          const opacityB = compareRatio / 100;
          map.setPaintProperty(targetId, "raster-opacity", opacityB);
        } else {
          // If not part of comparison, hide during compare
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

      /*
       * Only fallback single raster.
       */

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
            pitch: Math.min(map.getPitch() + 10, 85),

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
            pitch: terrainEnabledRef.current ? 50 : 0,

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

    const handlePitchUp = useCallback(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      map.easeTo({
        pitch: Math.min(map.getPitch() + 10, 85),

        duration: 400,
      });
    }, []);

    const handlePitchDown = useCallback(() => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      map.easeTo({
        pitch: Math.max(map.getPitch() - 10, 0),

        duration: 400,
      });
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
          <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-md">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />

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
          onChangeColormap={handleChangeColormap}
        />

        {/* =================================================
            PRECISION FARMING TOOLBAR (TURF.JS & GIS TOOLS)
        ================================================== */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setToolMode("none");
              handleCloseCompare();
              handleClearMeasurement();
            }}
            title="Navigasi Standar"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              toolMode === "none" && !compareMode
                ? "bg-[#123c28] text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Navigasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseCompare();
              const next = toolMode === "area" ? "none" : "area";
              setToolMode(next);
              handleClearMeasurement();
            }}
            title="Ukur Luas Lahan (Hektar / m²)"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              toolMode === "area"
                ? "bg-[#91b928] text-white shadow-sm ring-2 ring-[#91b928]/40"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Pentagon className="h-3.5 w-3.5" />
            <span>Ukur Lahan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseCompare();
              const next = toolMode === "distance" ? "none" : "distance";
              setToolMode(next);
              handleClearMeasurement();
            }}
            title="Ukur Jarak & Keliling"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              toolMode === "distance"
                ? "bg-[#91b928] text-white shadow-sm ring-2 ring-[#91b928]/40"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Ukur Jarak</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleClearMeasurement();
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
            title="Bandingkan Layer Multilayer (Ortho vs NDVI / DSM / Basemap)"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              compareMode
                ? "bg-[#123c28] text-white shadow-sm ring-2 ring-[#123c28]/40"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bandingkan</span>
          </button>
        </div>

        {/* =================================================
            MEASUREMENT STATUS CARD
        ================================================== */}
        {/* =================================================
            MEASUREMENT STATUS CARD (HUD)
        ================================================== */}
        {toolMode !== "none" && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[380px] rounded-2xl border border-emerald-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
            {/* Header: Clean Title, Simple Point Count, and Close Button */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-900">
                {toolMode === "area" ? "Ukur Area Lahan" : "Ukur Jarak Lintasan"}
              </h4>

              <div className="flex items-center gap-2">
                {measurePoints.length > 0 && (
                  <span className="text-[11px] font-medium text-gray-500">
                    {measurePoints.length} titik
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setToolMode("none")}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                  title="Tutup Pengukuran"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Step Guide / Hint */}
            <div className="my-2.5 flex items-center gap-2 rounded-xl bg-slate-50/90 px-3 py-2 border border-slate-100 text-[11px] text-slate-600">
              <MousePointer className="h-3.5 w-3.5 text-[#91b928] shrink-0" />
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

            {/* Calculated Metrics Display */}
            {measuredMetrics && (
              <div className="my-2.5 rounded-xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/40 p-3 shadow-xs">
                {toolMode === "area" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-r border-emerald-100/70 pr-2">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        Total Luas Lahan
                      </span>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-xl font-black text-[#123c28] tracking-tight">
                          {measuredMetrics.areaHa ?? 0}
                        </span>
                        <span className="text-xs font-bold text-gray-500">ha</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {(measuredMetrics.areaM2 ?? 0).toLocaleString("id-ID")} m²
                      </span>
                    </div>

                    <div className="pl-1 flex flex-col justify-between">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          Keliling Batas
                        </span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-gray-800">
                            {(measuredMetrics.perimeterM ?? 0).toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs font-bold text-gray-500">meter</span>
                        </div>
                      </div>

                      {measuredMetrics.areaHa ? (
                        <div className="mt-1 flex items-center gap-1 rounded-md bg-emerald-100/70 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900 border border-emerald-200/60">
                          <span>🌱 Est. Urea:</span>
                          <span>±{Math.round(measuredMetrics.areaHa * 250)} kg</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Total Jarak Lintasan
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-[#123c28] tracking-tight">
                        {measuredMetrics.distanceKm}
                      </span>
                      <span className="text-xs font-bold text-gray-600">km</span>
                      <span className="text-xs text-gray-400 font-medium">
                        ({(measuredMetrics.distanceM ?? 0).toLocaleString("id-ID")} meter)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {measurePoints.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoPoint}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition shadow-2xs"
                    title="Undo titik terakhir"
                  >
                    <Undo2 className="h-3.5 w-3.5 text-gray-500" />
                    <span>Undo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearMeasurement}
                  disabled={measurePoints.length === 0}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    measurePoints.length === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent"
                  }`}
                  title="Reset semua titik pengukuran"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setToolMode("none")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#123c28] text-white text-xs font-bold hover:bg-[#1b4d35] active:scale-95 transition shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Selesai</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            MULTILAYER COMPARISON BAR
        ================================================== */}
        {compareMode && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-[420px] rounded-2xl border border-emerald-900/10 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-900">
                Bandingkan Layer Multilayer
              </h4>

              <button
                type="button"
                onClick={handleCloseCompare}
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                title="Tutup Perbandingan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Layer Selectors & Swap */}
            <div className="my-3 flex items-center gap-2">
              <div className="flex-1">
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Layer A (Primer)
                </span>
                <select
                  value={compareLayerA}
                  onChange={(e) => setCompareLayerA(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none transition focus:border-[#123c28] focus:bg-white"
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
                className="mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:text-[#123c28] hover:border-emerald-200 active:scale-95 transition shadow-2xs"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>

              <div className="flex-1">
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Layer B (Pembanding)
                </span>
                <select
                  value={compareLayerB}
                  onChange={(e) => setCompareLayerB(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none transition focus:border-[#123c28] focus:bg-white"
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

            {/* Slider & Presets */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                <span className="text-[#123c28] bg-white px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                  Layer A: {100 - compareRatio}%
                </span>
                <span className="text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                  Layer B: {compareRatio}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={compareRatio}
                onChange={(e) => setCompareRatio(parseInt(e.target.value))}
                className="w-full h-2 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
              />

              <div className="flex items-center gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setCompareRatio(0)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition active:scale-95 ${
                    compareRatio === 0
                      ? "bg-[#123c28] text-white border-[#123c28] shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  100% A
                </button>
                <button
                  type="button"
                  onClick={() => setCompareRatio(50)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition active:scale-95 ${
                    compareRatio === 50
                      ? "bg-[#123c28] text-white border-[#123c28] shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  50 / 50 Blend
                </button>
                <button
                  type="button"
                  onClick={() => setCompareRatio(100)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition active:scale-95 ${
                    compareRatio === 100
                      ? "bg-[#123c28] text-white border-[#123c28] shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  100% B
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            BOTTOM-LEFT CONTROLS (POSTGIS BADGE + COMPASS)
        ================================================== */}
        <div className="absolute bottom-6 left-4 z-20 flex flex-col items-start gap-2.5 pointer-events-none">
          {spatialInfo?.has_spatial_geometry && spatialInfo.area_hectares && (
            <div
              title="Luas Lahan Terverifikasi Geodetik (WGS-84 via PostGIS)"
              className="pointer-events-auto group inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/90 p-1 pl-1.5 pr-3.5 shadow-lg shadow-black/5 backdrop-blur-xl ring-1 ring-slate-900/5 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl"
            >
              {/* Flowy Inner Pill for PostGIS verification */}
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#123c28] to-[#1e5a3c] px-2.5 py-1 text-white shadow-sm ring-1 ring-emerald-500/20">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                <span className="text-[10.5px] font-medium tracking-tight text-emerald-50">
                  PostGIS Geodetik
                </span>
              </div>

              {/* Fluid, natural typography metrics */}
              <div className="flex items-center gap-2 text-slate-700">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-900">
                    {spatialInfo.area_hectares}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">ha</span>
                </div>

                {spatialInfo.area_m2 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-[11px] font-normal text-slate-500">
                      {spatialInfo.area_m2.toLocaleString("id-ID")} m²
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-gray-200/90 bg-white/95 p-1.5 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={handleRotateLeft}
              title="Putar -45°"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetNorth}
              title="Reset ke Utara"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition hover:bg-gray-100"
            >
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  transform: `rotate(${-bearing}deg)`,
                }}
              >
                <div className="relative flex h-5 w-2 flex-col items-center">
                  <div className="h-2.5 w-0 border-x-[3.5px] border-x-transparent border-b-[10px] border-b-red-600" />
                  <div className="h-2.5 w-0 border-x-[3.5px] border-x-transparent border-t-[10px] border-t-gray-300" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              title="Putar +45°"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            <span className="pl-1 pr-1.5 text-[10px] font-bold text-gray-700">
              {bearing}° {getDirection(bearing)}
            </span>
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
