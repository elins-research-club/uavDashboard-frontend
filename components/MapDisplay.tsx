"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import "@tomickigrzegorz/leaflet-rotate";
import "@tomickigrzegorz/leaflet-rotate/css";
import L from "leaflet";
import { Globe, Map as MapIcon, Compass, RotateCcw, RotateCw } from "lucide-react";

interface MapDisplayProps {
  mapId?: string;
  token?: string;
  mapFormat?: string;
  mapTitle?: string;
  mapLocation?: string;
}

// Methods exposed to the parent (page.tsx) via ref, e.g. mapRef.current?.zoomIn()
export interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  resetNorth: () => void;
  getBearing: () => number;
  setBearing: (deg: number) => void;
}

interface BoundsResponse {
  bounds: [[number, number], [number, number]];
  center: [number, number];
  has_tiles: boolean;
  gps_source: string;
  title?: string;
  location?: string;
}

const DEFAULT_POSITION: [number, number] = [-7.7956, 110.3695];

const BASEMAPS = {
  satellite: {
    name: "Satelit Bumi",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelsUrl:
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  },
  street: {
    name: "Peta Jalan (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    labelsUrl: null,
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
};

function MapViewController({
  mapId,
  token,
  mapFormat,
  mapTitle,
  mapLocation,
  overlayOpacity,
  onBoundsLoaded,
}: {
  mapId?: string;
  token?: string;
  mapFormat?: string;
  mapTitle?: string;
  mapLocation?: string;
  overlayOpacity: number;
  onBoundsLoaded?: (meta: BoundsResponse) => void;
}) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [mapMeta, setMapMeta] = useState<BoundsResponse | null>(null);

  // Daftarkan custom pane 'uavOverlayPane' dengan z-index 450 agar selalu di atas basemap (200)
  if (typeof window !== "undefined" && map && !map.getPane("uavOverlayPane")) {
    const pane = map.createPane("uavOverlayPane");
    pane.style.zIndex = "450";
    // Jika Leaflet rotate pane aktif, masukkan uavOverlayPane ke dalam rotatePane agar berotasi serentak
    if ((map as any)._rotatePane && (map as any)._rotatePane !== pane.parentElement) {
      (map as any)._rotatePane.appendChild(pane);
    }
  }

  useEffect(() => {
    if (!mapId) {
      setMapMeta(null);
      return;
    }

    setLoading(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${baseUrl}/maps/${mapId}/bounds`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil batas peta");
        return res.json();
      })
      .then((data: BoundsResponse) => {
        setMapMeta(data);
        if (onBoundsLoaded) onBoundsLoaded(data);

        // Teleportasi / Fly ke lokasi peta
        if (
          data.bounds &&
          Array.isArray(data.bounds) &&
          data.bounds.length === 2
        ) {
          map.fitBounds(data.bounds, {
            padding: [60, 60],
            maxZoom: 18,
            animate: true,
            duration: 1.5,
          });
        } else if (
          data.center &&
          Array.isArray(data.center) &&
          data.center.length === 2
        ) {
          map.flyTo(data.center, 16, {
            animate: true,
            duration: 1.5,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching map bounds:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mapId, token, mapFormat, map]);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  return (
    <>
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-gray-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-gray-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent"></div>
          <span className="text-xs font-semibold">
            🛰️ Menemukan koordinat & memuat citra satelit...
          </span>
        </div>
      )}

      {/* Layer 1: TileLayer XYZ untuk GeoTIFF berproyeksi (selalu di pane uavOverlayPane) */}
      {mapMeta?.has_tiles && mapId && (
        <TileLayer
          key={`tile-${mapId}`}
          url={`${baseUrl}/maps/${mapId}/tiles/{z}/{x}/{y}.png`}
          maxZoom={22}
          maxNativeZoom={22}
          opacity={overlayOpacity}
          zIndex={100}
          pane="uavOverlayPane"
        />
      )}

      {/* Layer 2: ImageOverlay untuk foto udara Drone / TIFF tunggal (selalu di pane uavOverlayPane) */}
      {!mapMeta?.has_tiles && mapMeta?.bounds && mapId && (
        <ImageOverlay
          key={`overlay-${mapId}`}
          url={`${baseUrl}/maps/${mapId}/preview`}
          bounds={mapMeta.bounds}
          opacity={overlayOpacity}
          zIndex={100}
          pane="uavOverlayPane"
        />
      )}

      {/* Marker Titik Lokasi */}
      {mapMeta?.center && (
        <Marker position={mapMeta.center}>
          <Popup>
            <div className="p-1 min-w-[200px]">
              <div className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-1.5">
                <span>🛰️</span> {mapTitle || mapMeta.title || "Peta UAV"}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                📍 {mapLocation || mapMeta.location || "Lokasi Survey"}
              </div>
              <div className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200 font-semibold mb-1">
                {mapMeta.has_tiles
                  ? "✓ Raster Tile Georeferenced"
                  : mapMeta.gps_source === "exif"
                  ? "✓ Foto Udara Drone (GPS Terdeteksi)"
                  : "✓ Area Peta"}
              </div>
              <div className="text-[10px] text-gray-500">
                Koordinat: {mapMeta.center[0].toFixed(5)},{" "}
                {mapMeta.center[1].toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

// Bridge component to expose map instance to MapDisplay
function MapInstanceBridge({
  onMapReady,
  innerRef,
}: {
  onMapReady: (map: L.Map) => void;
  innerRef: React.Ref<MapHandle>;
}) {
  const map = useMap();

  useEffect(() => {
    (window as any)._debugMap = map;
    onMapReady(map);
  }, [map, onMapReady]);

  useImperativeHandle(innerRef, () => ({
    zoomIn: () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
    rotateLeft: () => {
      const cur = (map as any).getBearing ? (map as any).getBearing() : 0;
      (map as any).setBearing?.(cur - 45);
    },
    rotateRight: () => {
      const cur = (map as any).getBearing ? (map as any).getBearing() : 0;
      (map as any).setBearing?.(cur + 45);
    },
    resetNorth: () => {
      (map as any).setBearing?.(0);
    },
    getBearing: () => {
      return (map as any).getBearing ? (map as any).getBearing() : 0;
    },
    setBearing: (deg: number) => {
      (map as any).setBearing?.(deg);
    },
  }));

  return null;
}

const MapDisplay = forwardRef<MapHandle, MapDisplayProps>(
  ({ mapId, token, mapFormat, mapTitle, mapLocation }, ref) => {
    const [basemap, setBasemap] = useState<"satellite" | "street">("satellite");
    const [overlayOpacity, setOverlayOpacity] = useState<number>(0.95);
    const [currentMeta, setCurrentMeta] = useState<BoundsResponse | null>(null);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [bearing, setBearing] = useState<number>(0);

    const activeBasemap = BASEMAPS[basemap];

    // Listen to map rotation event
    useEffect(() => {
      if (!mapInstance) return;

      const updateBearing = () => {
        const b = (mapInstance as any).getBearing
          ? (mapInstance as any).getBearing()
          : 0;
        const normalized = ((b % 360) + 360) % 360;
        setBearing(Math.round(normalized));
      };

      updateBearing();
      mapInstance.on("rotate" as any, updateBearing);

      return () => {
        mapInstance.off("rotate" as any, updateBearing);
      };
    }, [mapInstance]);

    const handleResetNorth = () => {
      (mapInstance as any)?.setBearing?.(0);
    };

    const handleRotateLeft = () => {
      const cur = (mapInstance as any)?.getBearing
        ? (mapInstance as any).getBearing()
        : 0;
      (mapInstance as any)?.setBearing?.(cur - 45);
    };

    const handleRotateRight = () => {
      const cur = (mapInstance as any)?.getBearing
        ? (mapInstance as any).getBearing()
        : 0;
      (mapInstance as any)?.setBearing?.(cur + 45);
    };

    // Get cardinal direction label in Indonesian
    const getDirection = (deg: number) => {
      if (deg >= 337.5 || deg < 22.5) return "U"; // Utara
      if (deg >= 22.5 && deg < 67.5) return "TL"; // Timur Laut
      if (deg >= 67.5 && deg < 112.5) return "T"; // Timur
      if (deg >= 112.5 && deg < 157.5) return "TG"; // Tenggara
      if (deg >= 157.5 && deg < 202.5) return "S"; // Selatan
      if (deg >= 202.5 && deg < 247.5) return "BD"; // Barat Daya
      if (deg >= 247.5 && deg < 292.5) return "B"; // Barat
      return "BL"; // Barat Laut
    };

    return (
      <div className="relative h-full w-full">
        {/* Floating Control Bar: Basemap Toggle & Opacity */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setBasemap("satellite")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                basemap === "satellite"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Satelit
            </button>
            <button
              type="button"
              onClick={() => setBasemap("street")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                basemap === "street"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Peta Jalan
            </button>
          </div>

          {mapId && (
            <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-200 text-[11px] text-gray-600">
              <span>Transparansi:</span>
              <div className="flex gap-1">
                {[1, 0.75, 0.5, 0.25].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOverlayOpacity(op)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
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

        {/* Floating Interactive Compass Widget */}
        <div className="absolute bottom-6 left-4 z-[1000] flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-md">
          {/* Compass Dial / Needle Button */}
          <button
            type="button"
            onClick={handleResetNorth}
            title="Klik untuk mereset orientasi ke Arah Utara (0°)"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 transition-all hover:scale-105 hover:border-gray-300 hover:bg-white hover:shadow-md active:scale-95"
          >
            {/* Rotating Compass Needle Container */}
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${-bearing}deg)` }}
            >
              {/* Compass Needle Graphics */}
              <div className="relative flex flex-col items-center h-8 w-2.5">
                {/* North Tip (Red) */}
                <div className="h-4 w-0 border-x-[5px] border-x-transparent border-b-[15px] border-b-red-600 drop-shadow-sm" />
                {/* South Tip (Gray) */}
                <div className="h-4 w-0 border-x-[5px] border-x-transparent border-t-[15px] border-t-gray-400 drop-shadow-sm" />
                {/* Center Pivot Pin */}
                <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-gray-600 shadow-sm" />
              </div>
            </div>

            {/* Permanent North label on needle top */}
            <span
              className="pointer-events-none absolute text-[8px] font-black text-red-600 transition-transform duration-200 ease-out"
              style={{
                transform: `rotate(${-bearing}deg) translateY(-14px)`,
              }}
            >
              N
            </span>
          </button>

          {/* Bearing & Heading Readout */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
            <span>{bearing}°</span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-800 font-extrabold">
              {getDirection(bearing)}
            </span>
          </div>

          {/* Quick Rotation Buttons */}
          <div className="flex items-center gap-1 pt-1 border-t border-gray-200/80">
            <button
              type="button"
              onClick={handleRotateLeft}
              title="Putar -45° (Berlawanan jarum jam)"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              title="Putar +45° (Searah jarum jam)"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          </div>

          {/* Quick Hint */}
          <span className="text-[8px] text-gray-600 font-medium tracking-tight text-center leading-tight">
            Shift + Drag
          </span>
        </div>

        <MapContainer
          center={DEFAULT_POSITION}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          {...({
            rotate: true,
            touchRotate: true,
            shiftKeyRotate: true,
          } as any)}
        >
          {/* Basemap Primary Layer (selalu di tilePane dengan zIndex 1) */}
          <TileLayer
            key={basemap}
            attribution={activeBasemap.attribution}
            url={activeBasemap.url}
            maxZoom={activeBasemap.maxZoom}
            zIndex={1}
            pane="tilePane"
          />

          {/* Reference Labels untuk Satelit */}
          {activeBasemap.labelsUrl && (
            <TileLayer
              key={`${basemap}-labels`}
              url={activeBasemap.labelsUrl}
              maxZoom={activeBasemap.maxZoom}
              zIndex={2}
              pane="tilePane"
            />
          )}

          <MapViewController
            mapId={mapId}
            token={token}
            mapFormat={mapFormat}
            mapTitle={mapTitle}
            mapLocation={mapLocation}
            overlayOpacity={overlayOpacity}
            onBoundsLoaded={setCurrentMeta}
          />

          {/* Exposes zoomIn/zoomOut and rotation controls to ref and handles instance */}
          <MapInstanceBridge onMapReady={setMapInstance} innerRef={ref} />
        </MapContainer>
      </div>
    );
  }
);

MapDisplay.displayName = "MapDisplay";

export default React.memo(MapDisplay);
