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
import L from "leaflet";
import { Globe, Map as MapIcon } from "lucide-react";

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

      {/* Layer 1: TileLayer XYZ untuk GeoTIFF berproyeksi */}
      {mapMeta?.has_tiles && mapId && (
        <TileLayer
          key={`tile-${mapId}`}
          url={`${baseUrl}/maps/${mapId}/tiles/{z}/{x}/{y}.png`}
          maxZoom={22}
          maxNativeZoom={22}
          opacity={overlayOpacity}
        />
      )}

      {/* Layer 2: ImageOverlay untuk foto udara Drone / TIFF tunggal (misal Mamuya 1) */}
      {!mapMeta?.has_tiles && mapMeta?.bounds && mapId && (
        <ImageOverlay
          key={`overlay-${mapId}`}
          url={`${baseUrl}/maps/${mapId}/preview`}
          bounds={mapMeta.bounds}
          opacity={overlayOpacity}
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

// Small bridge component: lives inside <MapContainer> so it can call useMap(),
// then exposes zoomIn/zoomOut to the ref passed down from the outer forwardRef component.
function ZoomBridge({ innerRef }: { innerRef: React.Ref<MapHandle> }) {
  const map = useMap();

  useImperativeHandle(innerRef, () => ({
    zoomIn: () => map.zoomIn(),
    zoomOut: () => map.zoomOut(),
  }));

  return null;
}

const MapDisplay = forwardRef<MapHandle, MapDisplayProps>(
  ({ mapId, token, mapFormat, mapTitle, mapLocation }, ref) => {
    const [basemap, setBasemap] = useState<"satellite" | "street">("satellite");
    const [overlayOpacity, setOverlayOpacity] = useState<number>(0.95);
    const [currentMeta, setCurrentMeta] = useState<BoundsResponse | null>(null);

    const activeBasemap = BASEMAPS[basemap];

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

        <MapContainer
          center={DEFAULT_POSITION}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Basemap Primary Layer */}
          <TileLayer
            key={basemap}
            attribution={activeBasemap.attribution}
            url={activeBasemap.url}
            maxZoom={activeBasemap.maxZoom}
          />

          {/* Reference Labels untuk Satelit */}
          {activeBasemap.labelsUrl && (
            <TileLayer
              key={`${basemap}-labels`}
              url={activeBasemap.labelsUrl}
              maxZoom={activeBasemap.maxZoom}
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

          {/* Exposes zoomIn/zoomOut to the outer ref (used by the toolbar in page.tsx) */}
          <ZoomBridge innerRef={ref} />
        </MapContainer>
      </div>
    );
  }
);

MapDisplay.displayName = "MapDisplay";

export default React.memo(MapDisplay);
