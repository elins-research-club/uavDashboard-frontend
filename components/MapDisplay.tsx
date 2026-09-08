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

import {
  Globe,
  Map as MapIcon,
  Compass,
  RotateCcw,
  RotateCw,
  Mountain,
  Layers3,
} from "lucide-react";

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

    tiles: "https://{a,b,c}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    labels: null,

    maxzoom: 19,

    attribution: "© OpenStreetMap contributors",
  },
};

/*
 * DEM sementara untuk membuat terrain 3D.
 *
 * Ini adalah DEM demo milik MapLibre.
 * Untuk production sebaiknya diganti dengan DEM milik sendiri
 * atau provider terrain yang memiliki SLA / API key.
 */
const TERRAIN_SOURCE_URL =
  "https://demotiles.maplibre.org/terrain-tiles/tiles.json";

/* =========================================================
   MAP DISPLAY
========================================================= */

const MapDisplay = forwardRef<MapHandle, MapDisplayProps>(
  ({ mapId, token, mapFormat, mapTitle, mapLocation }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const mapRef = useRef<maplibregl.Map | null>(null);

    const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("satellite");

    const [overlayOpacity, setOverlayOpacity] = useState(0.95);

    const [currentMeta, setCurrentMeta] = useState<BoundsResponse | null>(null);

    const [bearing, setBearing] = useState(0);

    const [pitch, setPitch] = useState(45);

    const [terrainEnabled, setTerrainEnabled] = useState(true);

    const [loading, setLoading] = useState(false);

    const [mapReady, setMapReady] = useState(false);

    /* =====================================================
       HELPERS
    ====================================================== */

    const normalizeBearing = (value: number) => {
      return ((value % 360) + 360) % 360;
    };

    const getDirection = (deg: number) => {
      if (deg >= 337.5 || deg < 22.5) return "U";
      if (deg >= 22.5 && deg < 67.5) return "TL";
      if (deg >= 67.5 && deg < 112.5) return "T";
      if (deg >= 112.5 && deg < 157.5) return "TG";
      if (deg >= 157.5 && deg < 202.5) return "S";
      if (deg >= 202.5 && deg < 247.5) return "BD";
      if (deg >= 247.5 && deg < 292.5) return "B";
      return "BL";
    };

    /* =====================================================
       UPDATE CAMERA STATE
    ====================================================== */

    const syncCameraState = useCallback(() => {
      const map = mapRef.current;

      if (!map) return;

      setBearing(Math.round(normalizeBearing(map.getBearing())));
      setPitch(Math.round(map.getPitch()));
    }, []);

    /* =====================================================
       ADD / UPDATE BASEMAP
    ====================================================== */

    const setupBasemap = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.isStyleLoaded()) return;

      const active = BASEMAPS[basemap];

      const rasterSourceId = "basemap-raster";
      const rasterLayerId = "basemap-layer";

      /* ---------------------------------------------
         Remove old raster layer/source
      --------------------------------------------- */

      if (map.getLayer(rasterLayerId)) {
        map.removeLayer(rasterLayerId);
      }

      if (map.getSource(rasterSourceId)) {
        map.removeSource(rasterSourceId);
      }

      /* ---------------------------------------------
         Add basemap source
      --------------------------------------------- */

      map.addSource(rasterSourceId, {
        type: "raster",
        tiles: [active.tiles],
        tileSize: 256,
        maxzoom: active.maxzoom,
      });

      map.addLayer({
        id: rasterLayerId,
        type: "raster",
        source: rasterSourceId,
        paint: {
          "raster-opacity": 1,
        },
      });

      /* ---------------------------------------------
         Satellite labels
      --------------------------------------------- */

      const labelsSourceId = "satellite-labels";
      const labelsLayerId = "satellite-labels-layer";

      if (map.getLayer(labelsLayerId)) {
        map.removeLayer(labelsLayerId);
      }

      if (map.getSource(labelsSourceId)) {
        map.removeSource(labelsSourceId);
      }

      if (active.labels) {
        map.addSource(labelsSourceId, {
          type: "raster",
          tiles: [active.labels],
          tileSize: 256,
          maxzoom: active.maxzoom,
        });

        map.addLayer({
          id: labelsLayerId,
          type: "raster",
          source: labelsSourceId,
          paint: {
            "raster-opacity": 0.9,
          },
        });
      }
    }, [basemap]);

    /* =====================================================
       TERRAIN
    ====================================================== */

    const setupTerrain = useCallback(() => {
      const map = mapRef.current;

      if (!map || !map.isStyleLoaded()) return;

      const terrainSourceId = "terrain-dem";

      /*
       * Tambahkan DEM source kalau belum ada
       */

      if (!map.getSource(terrainSourceId)) {
        map.addSource(terrainSourceId, {
          type: "raster-dem",
          url: TERRAIN_SOURCE_URL,
          tileSize: 256,
          maxzoom: 14,
        });
      }

      /*
       * Aktifkan / matikan terrain
       */

      if (terrainEnabled) {
        map.setTerrain({
          source: terrainSourceId,
          exaggeration: 1.5,
        });

        /*
         * Saat terrain aktif, sedikit pitch agar
         * efek relief langsung terlihat.
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
    }, [terrainEnabled]);

    /* =====================================================
       UAV LAYER
    ====================================================== */

    const setupUavLayer = useCallback(
      (meta: BoundsResponse) => {
        const map = mapRef.current;

        if (!map || !map.isStyleLoaded() || !mapId) return;

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

        /* ---------------------------------------------
           Remove previous UAV layers
        --------------------------------------------- */

        const tileLayerId = "uav-raster-layer";
        const tileSourceId = "uav-raster";

        const imageLayerId = "uav-image-layer";
        const imageSourceId = "uav-image";

        if (map.getLayer(tileLayerId)) {
          map.removeLayer(tileLayerId);
        }

        if (map.getSource(tileSourceId)) {
          map.removeSource(tileSourceId);
        }

        if (map.getLayer(imageLayerId)) {
          map.removeLayer(imageLayerId);
        }

        if (map.getSource(imageSourceId)) {
          map.removeSource(imageSourceId);
        }

        /* ---------------------------------------------
           GEOTIFF TILE MODE
        --------------------------------------------- */

        if (meta.has_tiles) {
          map.addSource(tileSourceId, {
            type: "raster",
            tiles: [`${baseUrl}/maps/${mapId}/tiles/{z}/{x}/{y}.png`],
            tileSize: 256,
            maxzoom: 22,
          });

          map.addLayer({
            id: tileLayerId,
            type: "raster",
            source: tileSourceId,
            paint: {
              "raster-opacity": overlayOpacity,
              "raster-resampling": "linear",
            },
          });

          return;
        }

        /* ---------------------------------------------
           SINGLE IMAGE MODE
        --------------------------------------------- */

        if (meta.bounds) {
          const [[south, west], [north, east]] = meta.bounds;

          /*
           * Leaflet backend:
           *
           * [
           *   [south, west],
           *   [north, east]
           * ]
           *
           * MapLibre image source:
           *
           * [topLeft, topRight, bottomRight, bottomLeft]
           */

          map.addSource(imageSourceId, {
            type: "image",

            url: `${baseUrl}/maps/${mapId}/preview`,

            coordinates: [
              [west, north],
              [east, north],
              [east, south],
              [west, south],
            ],
          });

          map.addLayer({
            id: imageLayerId,
            type: "raster",
            source: imageSourceId,
            paint: {
              "raster-opacity": overlayOpacity,
              "raster-resampling": "linear",
            },
          });
        }
      },
      [mapId, overlayOpacity]
    );

    /* =====================================================
       LOAD BOUNDS
    ====================================================== */

    const loadBounds = useCallback(async () => {
      const map = mapRef.current;

      if (!map || !mapId) {
        setCurrentMeta(null);
        return;
      }

      setLoading(true);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${baseUrl}/maps/${mapId}/bounds`, {
          headers,
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil batas peta");
        }

        const data = (await response.json()) as BoundsResponse;

        setCurrentMeta(data);

        /*
         * Setup UAV data
         */

        setupUavLayer(data);

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
           * Backend center:
           *
           * [latitude, longitude]
           */

          const [lat, lng] = data.center;

          map.flyTo({
            center: [lng, lat],
            zoom: 16,
            pitch: terrainEnabled ? 50 : 0,
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
    }, [mapId, token, terrainEnabled, setupUavLayer]);

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
      });

      mapRef.current = map;

      /*
       * Navigation controls
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
       * Terrain source harus sudah ditambahkan
       * ketika style selesai loading.
       */

      map.once("load", () => {
        setupBasemap();

        if (!map.getSource("terrain-dem")) {
          map.addSource("terrain-dem", {
            type: "raster-dem",

            url: TERRAIN_SOURCE_URL,

            tileSize: 256,

            maxzoom: 14,
          });
        }

        if (terrainEnabled) {
          map.setTerrain({
            source: "terrain-dem",
            exaggeration: 1.5,
          });
        }

        setMapReady(true);

        syncCameraState();
      });

      /*
       * Camera events
       */

      map.on("rotate", syncCameraState);
      map.on("pitch", syncCameraState);
      map.on("zoom", syncCameraState);

      return () => {
        map.remove();

        mapRef.current = null;

        setMapReady(false);
      };
    }, [setupBasemap, terrainEnabled, syncCameraState]);

    /* =====================================================
       BASEMAP CHANGE
    ====================================================== */

    useEffect(() => {
      if (!mapReady) return;

      setupBasemap();

      /*
       * Re-add UAV layer after basemap.
       */

      if (currentMeta) {
        setupUavLayer(currentMeta);
      }
    }, [basemap, mapReady, currentMeta, setupBasemap, setupUavLayer]);

    /* =====================================================
       TERRAIN TOGGLE
    ====================================================== */

    useEffect(() => {
      if (!mapReady) return;

      setupTerrain();
    }, [terrainEnabled, mapReady, setupTerrain]);

    /* =====================================================
       OVERLAY OPACITY
    ====================================================== */

    useEffect(() => {
      if (!mapReady || !mapRef.current) return;

      const map = mapRef.current;

      if (map.getLayer("uav-raster-layer")) {
        map.setPaintProperty(
          "uav-raster-layer",
          "raster-opacity",
          overlayOpacity
        );
      }

      if (map.getLayer("uav-image-layer")) {
        map.setPaintProperty(
          "uav-image-layer",
          "raster-opacity",
          overlayOpacity
        );
      }
    }, [overlayOpacity, mapReady]);

    /* =====================================================
       LOAD MAP DATA
    ====================================================== */

    useEffect(() => {
      if (!mapReady) return;

      if (!mapId) {
        setCurrentMeta(null);

        const map = mapRef.current;

        if (map) {
          if (map.getLayer("uav-raster-layer")) {
            map.removeLayer("uav-raster-layer");
          }

          if (map.getSource("uav-raster")) {
            map.removeSource("uav-raster");
          }

          if (map.getLayer("uav-image-layer")) {
            map.removeLayer("uav-image-layer");
          }

          if (map.getSource("uav-image")) {
            map.removeSource("uav-image");
          }
        }

        return;
      }

      loadBounds();
    }, [mapId, mapReady, loadBounds]);

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

          if (!map) return;

          map.easeTo({
            bearing: map.getBearing() - 45,
            duration: 500,
          });
        },

        rotateRight: () => {
          const map = mapRef.current;

          if (!map) return;

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

          if (!map) return;

          map.easeTo({
            pitch: Math.min(map.getPitch() + 10, 85),
            duration: 400,
          });
        },

        tiltDown: () => {
          const map = mapRef.current;

          if (!map) return;

          map.easeTo({
            pitch: Math.max(map.getPitch() - 10, 0),
            duration: 400,
          });
        },

        resetView: () => {
          mapRef.current?.easeTo({
            pitch: terrainEnabled ? 50 : 0,
            bearing: 0,
            duration: 700,
          });
        },

        toggle3D: () => {
          setTerrainEnabled((current) => !current);
        },

        is3D: () => {
          return terrainEnabled;
        },
      }),
      [terrainEnabled]
    );

    /* =====================================================
       LOCAL UI HANDLERS
    ====================================================== */

    const handleResetNorth = () => {
      mapRef.current?.easeTo({
        bearing: 0,
        duration: 600,
      });
    };

    const handleRotateLeft = () => {
      mapRef.current?.easeTo({
        bearing: (mapRef.current?.getBearing() || 0) - 45,
        duration: 500,
      });
    };

    const handleRotateRight = () => {
      mapRef.current?.easeTo({
        bearing: (mapRef.current?.getBearing() || 0) + 45,
        duration: 500,
      });
    };

    const handlePitchUp = () => {
      const map = mapRef.current;

      if (!map) return;

      map.easeTo({
        pitch: Math.min(map.getPitch() + 10, 85),
        duration: 400,
      });
    };

    const handlePitchDown = () => {
      const map = mapRef.current;

      if (!map) return;

      map.easeTo({
        pitch: Math.max(map.getPitch() - 10, 0),
        duration: 400,
      });
    };

    const handleToggle3D = () => {
      setTerrainEnabled((current) => !current);
    };

    /* =====================================================
       RENDER
    ====================================================== */

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
          {/* Basemap */}

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

            {/* Opacity */}

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

          {/* 3D Control */}

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
            ACTIVE DATA BADGE
        ================================================== */}

        {currentMeta && (
          <div className="pointer-events-none absolute bottom-14 right-4 z-[1000] max-w-xs rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#91b928]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#123c28]">
                UAV FIELD MAP
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
