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

import { RotateCcw, RotateCw } from "lucide-react";

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
  ({ mapId, token, mapFormat, mapTitle, mapLocation }, ref) => {
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

    const terrainEnabledRef = useRef(true);

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

    const [pitch, setPitch] = useState(45);

    const [terrainEnabled, setTerrainEnabled] = useState(true);

    const [loading, setLoading] = useState(false);

    const [mapReady, setMapReady] = useState(false);

    const [isFullscreen, setIsFullscreen] = useState(false);

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

    const setupBasemap = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.isStyleLoaded()) {
        return;
      }

      const active = BASEMAPS[basemapRef.current];

      /* Remove old raster layer */

      if (map.getLayer(BASEMAP_RASTER_LAYER_ID)) {
        map.removeLayer(BASEMAP_RASTER_LAYER_ID);
      }

      /* Remove old raster source */

      if (map.getSource(BASEMAP_RASTER_SOURCE_ID)) {
        map.removeSource(BASEMAP_RASTER_SOURCE_ID);
      }

      /* Add new source */

      map.addSource(BASEMAP_RASTER_SOURCE_ID, {
        type: "raster",

        tiles: [active.tiles],

        tileSize: 256,

        maxzoom: active.maxzoom,

        attribution: active.attribution,
      });

      /*
       * Put basemap below UAV layers.
       */

      let firstUavLayer: string | undefined;

      for (const layer of mapLayersRef.current) {
        const target = `layer-render-${layer.id}`;

        if (map.getLayer(target)) {
          firstUavLayer = target;

          break;
        }
      }

      if (!firstUavLayer) {
        if (map.getLayer(UAV_RASTER_LAYER_ID)) {
          firstUavLayer = UAV_RASTER_LAYER_ID;
        } else if (map.getLayer(UAV_IMAGE_LAYER_ID)) {
          firstUavLayer = UAV_IMAGE_LAYER_ID;
        }
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

      /* =================================================
           SATELLITE LABELS
        ================================================== */

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
       TERRAIN
    ====================================================== */

    const setupTerrain = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.isStyleLoaded()) {
        return;
      }

      if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, {
          type: "raster-dem",

          url: TERRAIN_SOURCE_URL,

          tileSize: 256,

          maxzoom: 14,
        });
      }

      if (terrainEnabledRef.current) {
        map.setTerrain({
          source: TERRAIN_SOURCE_ID,

          exaggeration: 1.5,
        });

        /*
         * Tidak menampilkan derajat di UI,
         * tetapi terrain tetap memakai pitch.
         */

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
       UAV LAYER
    ====================================================== */

    const setupUavLayer = useCallback(
      (meta: BoundsResponse, layersToRender?: MapLayerItem[]) => {
        const map = mapRef.current;

        const activeMapId = mapIdRef.current;

        if (!map || !map.isStyleLoaded() || !activeMapId) {
          return;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

        removeUavLayers();

        const currentLayers = layersToRender ?? mapLayersRef.current;

        /* =============================================
             MULTI LAYER
          ============================================== */

        if (currentLayers && currentLayers.length > 0) {
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

        /* =============================================
             SINGLE TILE
          ============================================== */

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

        /* =============================================
             SINGLE IMAGE
          ============================================== */

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
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

            maxZoom: 18,

            duration: 1500,

            essential: true,
          });
        } else if (data.center) {
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
       FULLSCREEN
    ====================================================== */

    const handleToggleFullscreen = useCallback(async () => {
      const target = containerRef.current?.parentElement;

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
    }, []);

    /* =====================================================
       FULLSCREEN EVENT
    ====================================================== */

    useEffect(() => {
      const handleFullscreenChange = () => {
        const fullscreen = document.fullscreenElement !== null;

        setIsFullscreen(fullscreen);

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

        pitch: 45,

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
        setupBasemap();

        setupTerrain();

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
    }, [setupBasemap, setupTerrain, syncCameraState]);

    /* =====================================================
       BASEMAP CHANGE
    ====================================================== */

    useEffect(() => {
      if (!mapReady) {
        return;
      }

      setupBasemap();

      const meta = currentMetaRef.current;

      if (meta) {
        setupUavLayer(meta);
      }
    }, [basemap, mapReady, setupBasemap, setupUavLayer]);

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
            COMPASS
        ================================================== */}

        <div className="absolute bottom-6 left-4 z-[1000] flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-md">
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition hover:bg-gray-100"
          >
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                transform: `rotate(${-bearing}deg)`,
              }}
            >
              <div className="relative flex h-6 w-2 flex-col items-center">
                <div className="h-3 w-0 border-x-[4px] border-x-transparent border-b-[11px] border-b-red-600" />

                <div className="h-3 w-0 border-x-[4px] border-x-transparent border-t-[11px] border-t-gray-300" />
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

        {/* =================================================
            LAYER CONTROL PANEL
        ================================================== */}

        <LayerControlPanel
          mapId={mapId}
          layers={mapLayers}
          basemap={basemap}
          onChangeBasemap={setBasemap}
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
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
        />

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
