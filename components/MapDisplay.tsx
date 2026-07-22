"use client";

// Impor komponen React-Leaflet
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// Impor CSS utama Leaflet
import "leaflet/dist/leaflet.css";

// --- INI ADALAH SOLUSI YANG BENAR ---
// Impor file CSS yang kompatibel, BUKAN yang .webpack.css
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
// --- AKHIR SOLUSI ---

// KITA TIDAK PERLU LAGI:
// - import L from 'leaflet'
// - import iconMarker, iconShadow, dll.
// - Kode 'const customIcon = new L.Icon(...)'

// Komponen Peta kita, sekarang sangat bersih
export default function MapDisplay() {
  // Koordinat tengah peta (Contoh: Yogyakarta)
  const position: [number, number] = [-7.7956, 110.3695];

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marker ini sekarang akan otomatis menemukan ikonnya 
        berkat 'leaflet-defaulticon-compatibility.css' 
      */}
      <Marker position={position}>
        <Popup>
          Pusat Kota Yogyakarta. <br /> Peta Anda akan muncul di sini.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
