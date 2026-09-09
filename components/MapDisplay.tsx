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

import {
  Globe,
  Map as MapIcon,
  RotateCcw,
  RotateCw,
  Mountain,
  Layers3,
} from "lucide-react";

import LayerControlPanel from "@/components/LayerControlPanel";
import type { MapLayerItem } from "@/types/map";

// Registrasi protokol PMTiles ke MapLibre GL jika belum terdaftar
let pmtilesRegistered = false;
if (typeof window !== "undefined" && !pmtilesRegistered) {
  try {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    pmtilesRegistered = true;
  } catch {
    // Protocol already added
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
}

export interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;

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

const BASEMAP_RASTER_SOURCE_ID = "basemap-raster";
const BASEMAP_RASTER_LAYER_ID = "basemap-layer";

const SATELLITE_LABEL_SOURCE_ID = "satellite-labels";
const SATELLITE_LABEL_LAYER_ID = "satellite-labels-layer";

const UAV_RASTER_SOURCE_ID = "uav-raster";
const UAV_RASTER_LAYER_ID = "uav-raster-layer";

const UAV_IMAGE_SOURCE_ID = "uav-image";
const UAV_IMAGE_LAYER_ID = "uav-image-layer";

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

    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

    labels: null,

    maxzoom: 19,

    attribution: "© OpenStreetMap contributors",
  },
};

/* =========================================================
   MAP DISPLAY
========================================================= */

const MapDisplay = forwardRef<MapHandle, MapDisplayProps>(
  ({ mapId, token, mapFormat, mapTitle, mapLocation }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const mapRef = useRef<maplibregl.Map | null>(null);

    /*
     * Simpan state terbaru di ref supaya callback yang
     * dipakai MapLibre tidak menyebabkan map dibuat ulang.
     */

    const basemapRef = useRef<keyof typeof BASEMAPS>("satellite");

    const overlayOpacityRef = useRef(0.95);

    const terrainEnabledRef = useRef(true);

    const mapIdRef = useRef(mapId);

    const tokenRef = useRef(token);

    const currentMetaRef = useRef<BoundsResponse | null>(null);

    const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("satellite");

    const [overlayOpacity, setOverlayOpacity] = useState(0.95);

    const [currentMeta, setCurrentMeta] = useState<BoundsResponse | null>(null);

    const [mapLayers, setMapLayers] = useState<MapLayerItem[]>([]);
    const mapLayersRef = useRef<MapLayerItem[]>([]);

    const [bearing, setBearing] = useState(0);

    const [pitch, setPitch] = useState(45);

    const [terrainEnabled, setTerrainEnabled] = useState(true);

    const [loading, setLoading] = useState(false);

    const [mapReady, setMapReady] = useState(false);

    /* =====================================================
       KEEP REFS IN SYNC
    ===================================================== */

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
       HELPERS
    ===================================================== */

    const normalizeBearing = useCallback((value: number) => {
      return ((value % 360) + 360) % 360;
    }, []);

    const getDirection = useCallback((deg: number) => {
      if (deg >= 337.5 || deg < 22.5) return "U";
      if (deg >= 22.5 && deg < 67.5) return "TL";
      if (deg >= 67.5 && deg < 112.5) return "T";
      if (deg >= 112.5 && deg < 157.5) return "TG";
      if (deg >= 157.5 && deg < 202.5) return "S";
      if (deg >= 202.5 && deg < 247.5) return "BD";
      if (deg >= 247.5 && deg < 292.5) return "B";

      return "BL";
    }, []);

    /* =====================================================
       CAMERA STATE
    ===================================================== */

    const syncCameraState = useCallback(() => {
      const map = mapRef.current;

      if (!map) return;

      setBearing(Math.round(normalizeBearing(map.getBearing())));

      setPitch(Math.round(map.getPitch()));
    }, [normalizeBearing]);

    /* =====================================================
       REMOVE UAV LAYERS
    ===================================================== */

    const removeUavLayers = useCallback(() => {
      const map = mapRef.current;

      if (!map) return;

      /*
       * Remove previous multi-layer & single-layer UAV layers
       */
      if (mapLayersRef.current) {
        mapLayersRef.current.forEach((l) => {
          const lid = `layer-render-${l.id}`;
          const sid = `layer-source-${l.id}`;
          if (map.getLayer(lid)) map.removeLayer(lid);
          if (map.getSource(sid)) map.removeSource(sid);
        });
      }

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
       SETUP BASEMAP
    ===================================================== */

    const setupBasemap = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.isStyleLoaded()) {
        return;
      }

      const active = BASEMAPS[basemapRef.current];

      /*
       * Remove previous basemap layer
       */

      if (map.getLayer(BASEMAP_RASTER_LAYER_ID)) {
        map.removeLayer(BASEMAP_RASTER_LAYER_ID);
      }

      /*
       * Remove previous basemap source
       */

      if (map.getSource(BASEMAP_RASTER_SOURCE_ID)) {
        map.removeSource(BASEMAP_RASTER_SOURCE_ID);
      }

      /*
       * Add basemap source
       */

      map.addSource(BASEMAP_RASTER_SOURCE_ID, {
        type: "raster",

        tiles: [active.tiles],

        tileSize: 256,

        maxzoom: active.maxzoom,

        attribution: active.attribution,
      });

      /*
       * Add basemap layer — always BELOW the UAV overlay layers.
       */
      let firstUavLayer: string | undefined = undefined;
      if (mapLayersRef.current && mapLayersRef.current.length > 0) {
        for (const l of mapLayersRef.current) {
          const target = `layer-render-${l.id}`;
          if (map.getLayer(target)) {
            firstUavLayer = target;
            break;
          }
        }
      }
      if (!firstUavLayer) {
        firstUavLayer = map.getLayer(UAV_RASTER_LAYER_ID)
          ? UAV_RASTER_LAYER_ID
          : map.getLayer(UAV_IMAGE_LAYER_ID)
          ? UAV_IMAGE_LAYER_ID
          : undefined;
      }

      map.addLayer(
        {
          id: BASEMAP_RASTER_LAYER_ID,

          type: "raster",

          source: BASEMAP_RASTER_SOURCE_ID,

          paint: {
            "raster-opacity": 1,
          },
        },
        firstUavLayer
      );

      /*
       * Satellite labels — juga di bawah UAV overlay.
       */

      if (map.getLayer(SATELLITE_LABEL_LAYER_ID)) {
        map.removeLayer(SATELLITE_LABEL_LAYER_ID);
      }

      if (map.getSource(SATELLITE_LABEL_SOURCE_ID)) {
        map.removeSource(SATELLITE_LABEL_SOURCE_ID);
      }

      if (active.labels) {
        map.addSource(SATELLITE_LABEL_SOURCE_ID, {
          type: "raster",

          tiles: [active.labels],

          tileSize: 256,

          maxzoom: active.maxzoom,
        });

        map.addLayer(
          {
            id: SATELLITE_LABEL_LAYER_ID,

            type: "raster",

            source: SATELLITE_LABEL_SOURCE_ID,

            paint: {
              "raster-opacity": 0.9,
            },
          },
          firstUavLayer
        );
      }
    }, []);

    /* =====================================================
       SETUP TERRAIN
    ===================================================== */

    const setupTerrain = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.isStyleLoaded()) {
        return;
      }

      /*
       * Create DEM source only once.
       */

      if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, {
          type: "raster-dem",

          url: TERRAIN_SOURCE_URL,

          tileSize: 256,

          maxzoom: 14,
        });
      }

      /*
       * Enable / disable terrain.
       */

      if (terrainEnabledRef.current) {
        map.setTerrain({
          source: TERRAIN_SOURCE_ID,

          exaggeration: 1.5,
        });

        if (map.getPitch() < 20) {
          map.easeTo({
            pitch: 55,

            duration: 700,
          });
        }
      } else {
        map.setTerrain(null);

        map.easeTo({
          pitch: 0,

          duration: 700,
        });
      }
    }, []);

    /* =====================================================
       SETUP UAV LAYER
    ===================================================== */

    const setupUavLayer = useCallback(
      (meta: BoundsResponse, layersToRender?: MapLayerItem[]) => {
        const map = mapRef.current;

        const activeMapId = mapIdRef.current;

        if (!map || !map.isStyleLoaded() || !activeMapId) {
          return;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

        /*
         * Remove old UAV layers.
         */
        removeUavLayers();

        const currentLayers = layersToRender ?? mapLayersRef.current;

        /*
         * 1. MULTI-LAYER MODE (PMTiles / Dynamic Tile per layer)
         */
        if (currentLayers && currentLayers.length > 0) {
          currentLayers.forEach((layer) => {
            const sourceId = `layer-source-${layer.id}`;
            const layerId = `layer-render-${layer.id}`;

            if (!map.getSource(sourceId)) {
              if (layer.pmtiles_url) {
                // Streaming langsung lewat PMTiles HTTP Range Request
                const apiOrigin = baseUrl.replace(/\/api\/?$/, "");
                const pmtilesUrl = `${apiOrigin}${layer.pmtiles_url}`;
                map.addSource(sourceId, {
                  type: "raster",
                  url: `pmtiles://${pmtilesUrl}`,
                  tileSize: 256,
                });
              } else {
                // Fallback dynamic XYZ raster tile
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
              map.addLayer({
                id: layerId,
                type: "raster",
                source: sourceId,
                layout: {
                  visibility: layer.is_visible ? "visible" : "none",
                },
                paint: {
                  "raster-opacity": layer.default_opacity,
                  "raster-resampling": "linear",
                },
              });
            }
          });
          return;
        }

        /*
         * 2. FALLBACK SINGLE TILE MODE
         */
        if (meta.has_tiles) {
          map.addSource(UAV_RASTER_SOURCE_ID, {
            type: "raster",

            tiles: [`${baseUrl}/maps/${activeMapId}/tiles/{z}/{x}/{y}.png`],

            tileSize: 256,

            maxzoom: 22,
          });

          map.addLayer({
            id: UAV_RASTER_LAYER_ID,

            type: "raster",

            source: UAV_RASTER_SOURCE_ID,

            paint: {
              "raster-opacity": overlayOpacityRef.current,

              "raster-resampling": "linear",
            },
          });

          return;
        }

        /*
         * 3. SINGLE IMAGE PREVIEW MODE
         */
        if (meta.bounds) {
          const [[south, west], [north, east]] = meta.bounds;

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

          map.addLayer({
            id: UAV_IMAGE_LAYER_ID,

            type: "raster",

            source: UAV_IMAGE_SOURCE_ID,

            paint: {
              "raster-opacity": overlayOpacityRef.current,

              "raster-resampling": "linear",
            },
          });
        }
      },
      [removeUavLayers]
    );

    /* =====================================================
       LOAD MAP BOUNDS
    ===================================================== */

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
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

      const headers: Record<string, string> = {};

      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      try {
        const response = await fetch(`${baseUrl}/maps/${activeMapId}/bounds`, {
          headers,
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil batas peta");
        }

        const data = (await response.json()) as BoundsResponse;

        setCurrentMeta(data);

        currentMetaRef.current = data;

        /*
         * Fetch Multi-Layers if available
         */
        try {
          const layersRes = await fetch(
            `${baseUrl}/maps/${activeMapId}/layers`,
            {
              headers,
            }
          );
          if (layersRes.ok) {
            const lData: MapLayerItem[] = await layersRes.json();
            setMapLayers(lData);
            mapLayersRef.current = lData;
            setupUavLayer(data, lData);
          } else {
            setupUavLayer(data);
          }
        } catch {
          setupUavLayer(data);
        }

        /*
         * Fit bounds
         */

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

            maxZoom: 18,

            duration: 1500,

            essential: true,
          });
        } else if (data.center) {
          /*
           * Backend:
           * [latitude, longitude]
           */

          const [lat, lng] = data.center;

          map.flyTo({
            center: [lng, lat],

            zoom: 16,

            pitch: terrainEnabledRef.current ? 50 : 0,

            bearing: 0,

            duration: 1500,

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
       CREATE MAP
       IMPORTANT:
       MAP INSTANCE HANYA DIBUAT SEKALI
    ===================================================== */

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

        pitch: 45,

        bearing: 0,

        maxPitch: 85,

        attributionControl: {
          compact: true,
        },

        renderWorldCopies: false,
      });

      mapRef.current = map;

      /*
       * Navigation control
       */

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,

          showZoom: false,

          visualizePitch: true,
        }),
        "top-left"
      );

      /*
       * Map load
       */

      map.once("load", () => {
        /*
         * Basemap
         */

        setupBasemap();

        /*
         * Terrain
         */

        setupTerrain();

        /*
         * Ready
         */

        setMapReady(true);

        syncCameraState();
      });

      /*
       * Camera events
       */

      map.on("rotate", syncCameraState);

      map.on("pitch", syncCameraState);

      map.on("zoom", syncCameraState);

      /*
       * Cleanup
       */

      return () => {
        map.remove();

        mapRef.current = null;

        setMapReady(false);

        currentMetaRef.current = null;
      };
    }, [setupBasemap, setupTerrain, syncCameraState]);

    /* =====================================================
       BASEMAP CHANGE
    ===================================================== */

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      setupBasemap();

      /*
       * Re-add UAV overlay because
       * basemap layer might have changed
       * layer ordering.
       */

      const meta = currentMetaRef.current;

      if (meta) {
        setupUavLayer(meta);
      }
    }, [basemap, mapReady, setupBasemap, setupUavLayer]);

    /* =====================================================
       TERRAIN TOGGLE
    ===================================================== */

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      setupTerrain();
    }, [terrainEnabled, mapReady, setupTerrain]);

    /* =====================================================
       OVERLAY OPACITY
    ===================================================== */

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
    ===================================================== */

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      const map = mapRef.current;

      if (!map) {
        return;
      }

      /*
       * No map selected
       */

      if (!mapId) {
        setCurrentMeta(null);

        currentMetaRef.current = null;

        removeUavLayers();

        return;
      }

      loadBounds();
    }, [mapId, mapReady, loadBounds, removeUavLayers]);

    /* =====================================================
       IMPERATIVE HANDLE
    ===================================================== */

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
       LOCAL UI HANDLERS
    ===================================================== */

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
    ===================================================== */

    return (
      <div className="relative h-full w-full overflow-hidden">
        {/* =================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
            <div className="flex items-center gap-2.5 rounded-full border border-gray-700 bg-gray-900/90 px-4 py-2 text-white shadow-2xl backdrop-blur-md">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />

              <span className="text-xs font-semibold">
                🛰️ Memuat data geospasial...
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            TOP CONTROL
        ================================================== */}

        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          {/* BASEMAP */}

          <div className="rounded-xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setBasemap("satellite")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  basemap === "satellite"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Satelit
              </button>

              <button
                type="button"
                onClick={() => setBasemap("street")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  basemap === "street"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Jalan
              </button>
            </div>

            {/* OPACITY */}

            {mapId && (
              <div className="mt-2 border-t border-gray-200 px-1 pt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-600">
                    Transparansi
                  </span>

                  <span className="text-[10px] font-bold text-gray-800">
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>

                <div className="flex gap-1">
                  {[1, 0.75, 0.5, 0.25].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOverlayOpacity(op)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        overlayOpacity === op
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {Math.round(op * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3D CONTROL */}

          <div className="rounded-xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={handleToggle3D}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                terrainEnabled
                  ? "bg-[#123c28] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Mountain className="h-4 w-4" />

              {terrainEnabled ? "3D Terrain Aktif" : "Aktifkan 3D"}
            </button>

            <div className="mt-2 flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={handlePitchDown}
                title="Kurangi kemiringan"
                className="flex h-7 flex-1 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                −
              </button>

              <div className="flex min-w-[52px] items-center justify-center gap-1 text-[10px] font-bold text-gray-700">
                <Layers3 className="h-3 w-3" />
                {pitch}°
              </div>

              <button
                type="button"
                onClick={handlePitchUp}
                title="Tambah kemiringan"
                className="flex h-7 flex-1 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            COMPASS
        ================================================== */}

        <div className="absolute bottom-6 left-4 z-[1000] flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleResetNorth}
            title="Reset ke Utara"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 transition hover:scale-105 hover:border-gray-300"
          >
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-200"
              style={{
                transform: `rotate(${-bearing}deg)`,
              }}
            >
              <div className="relative flex h-8 w-2.5 flex-col items-center">
                <div className="h-4 w-0 border-x-[5px] border-x-transparent border-b-[15px] border-b-red-600" />

                <div className="h-4 w-0 border-x-[5px] border-x-transparent border-t-[15px] border-t-gray-400" />

                <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-600 bg-white" />
              </div>
            </div>

            <span
              className="pointer-events-none absolute text-[8px] font-black text-red-600"
              style={{
                transform: `rotate(${-bearing}deg) translateY(-14px)`,
              }}
            >
              N
            </span>
          </button>

          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
            <span>{bearing}°</span>

            <span className="text-gray-300">|</span>

            <span className="font-extrabold text-emerald-800">
              {getDirection(bearing)}
            </span>
          </div>

          <div className="flex items-center gap-1 border-t border-gray-200/80 pt-1">
            <button
              type="button"
              onClick={handleRotateLeft}
              title="Putar -45°"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <RotateCcw className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              title="Putar +45°"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          </div>

          <span className="text-center text-[8px] font-medium leading-tight text-gray-600">
            Drag untuk rotasi
            <br />
            Ctrl / Shift untuk tilt
          </span>
        </div>

        {/* =================================================
            MULTI-LAYER CONTROL PANEL (AMX Multi-Spectral Engine)
        ================================================== */}
        <LayerControlPanel
          mapId={mapId}
          token={token}
          layers={mapLayers}
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
              prev.map((l) =>
                l.id === layerId ? { ...l, is_visible: visible } : l
              )
            );
            if (mapLayersRef.current) {
              mapLayersRef.current = mapLayersRef.current.map((l) =>
                l.id === layerId ? { ...l, is_visible: visible } : l
              );
            }
          }}
          onChangeOpacity={(layerId, opacity) => {
            const map = mapRef.current;
            const targetId = `layer-render-${layerId}`;
            if (map && map.getLayer(targetId)) {
              map.setPaintProperty(targetId, "raster-opacity", opacity);
            }
            setMapLayers((prev) =>
              prev.map((l) =>
                l.id === layerId ? { ...l, default_opacity: opacity } : l
              )
            );
            if (mapLayersRef.current) {
              mapLayersRef.current = mapLayersRef.current.map((l) =>
                l.id === layerId ? { ...l, default_opacity: opacity } : l
              );
            }
          }}
          onLayerUploaded={async () => {
            const activeMapId = mapIdRef.current;
            const activeToken = tokenRef.current;
            if (!activeMapId) return;
            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
            const headers: Record<string, string> = {};
            if (activeToken) headers.Authorization = `Bearer ${activeToken}`;
            try {
              const res = await fetch(`${baseUrl}/maps/${activeMapId}/layers`, {
                headers,
              });
              if (res.ok) {
                const data: MapLayerItem[] = await res.json();
                setMapLayers(data);
                mapLayersRef.current = data;
                if (currentMetaRef.current) {
                  setupUavLayer(currentMetaRef.current, data);
                }
              }
            } catch (err) {
              console.error("Gagal refresh layers:", err);
            }
          }}
          onDeleteLayer={async (layerId) => {
            const activeMapId = mapIdRef.current;
            const activeToken = tokenRef.current;
            if (!activeMapId) return;
            const baseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
            const headers: Record<string, string> = {};
            if (activeToken) headers.Authorization = `Bearer ${activeToken}`;
            try {
              const res = await fetch(
                `${baseUrl}/maps/${activeMapId}/layers/${layerId}`,
                { method: "DELETE", headers }
              );
              if (res.ok) {
                const map = mapRef.current;
                if (map) {
                  const lid = `layer-render-${layerId}`;
                  const sid = `layer-source-${layerId}`;
                  if (map.getLayer(lid)) map.removeLayer(lid);
                  if (map.getSource(sid)) map.removeSource(sid);
                }
                setMapLayers((prev) => prev.filter((l) => l.id !== layerId));
                mapLayersRef.current = mapLayersRef.current.filter(
                  (l) => l.id !== layerId
                );
              }
            } catch (err) {
              console.error("Gagal menghapus layer:", err);
            }
          }}
        />

        {/* =================================================
            ACTIVE DATA BADGE
        ================================================== */}

        {currentMeta && (
          <div className="pointer-events-none absolute bottom-14 right-4 z-[1000] max-w-xs rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#123c28]">
                PETA LAPANGAN UAV
              </span>
            </div>

            <p className="mt-1 truncate text-[10px] font-bold text-gray-900">
              {mapTitle || currentMeta.title || "Peta UAV"}
            </p>

            <p className="mt-0.5 truncate text-[9px] text-gray-500">
              {mapLocation || currentMeta.location || "Lokasi Survey"}
            </p>
          </div>
        )}

        {/* =================================================
            MAP
        ================================================== */}

        <div ref={containerRef} className="h-full w-full bg-[#eef2ec]" />
      </div>
    );
  }
);

MapDisplay.displayName = "MapDisplay";

export default React.memo(MapDisplay);
