# AMX GeoStream Engine™ — Frontend (UAV DaaS Platform)

Frontend aplikasi web modern untuk **AMX GeoStream Engine™**, platform pemetaan lahan pertanian presisi (*precision agriculture*) berbasis citra drone UAV dengan arsitektur WebGIS mutakhir.

---

## 🚀 Tech Stack

| Layer | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Next.js 15 (App Router, React 19) | Server & Client Components modern |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Desain responsif, clean UI modern |
| **Map Rendering** | **MapLibre GL JS v6** | WebGL GPU-accelerated 60 FPS, 3D Terrain DEM |
| **Tile Format** | **PMTiles v4** | Single-file tile archives via HTTP Range Requests |
| **Spatial Analytics** | **Turf.js v7** | Perhitungan spasial client-side (luas ha/m², jarak km, perimeter) |
| **API Client** | Axios | Interceptor JWT, timeout guard 20s |
| **Icons** | Lucide React | Modern minimalist vector icons |

---

## 🌾 Fitur Utama Precision Farming & WebGIS

### 1. WebGL Multi-Layer Map Engine (MapLibre GL JS)
- Rendering raster berkecepatan tinggi **60 FPS** tanpa lag saat menumpuk banyak layer resolusi tinggi:
  - `ortho` (Citra Ortho RGB / Mosaic)
  - `ndvi` & `vari` (Indeks Kesehatan Vegetasi)
  - `nitrogen`, `phosphorus`, `kalium` (Kandungan Hara Tanah N-P-K)
  - `dsm` (Digital Surface Model / Elevasi 3D)
  - `spectral` (Multispektral)
- **3D Terrain DEM:** Elevasi kontur realistis berbasis DEM Mapterhorn / DSM UAV.
- **PMTiles Native Protocol:** Konsumsi data tile bertahap langsung dari storage tanpa dekompresi seluruh file.

### 2. Toolkit Pengukuran Lahan (Powered by Turf.js)
Toolbar mengambang di atas peta dengan fitur instan:
- **Ukur Luas Lahan (Polygon Tool):** Gambar batas petak sawah/kebun secara interaktif. Menghitung:
  - Luas Lahan dalam **Hektar (ha)** dan **Meter Persegi (m²)**
  - Keliling Batas Lahan dalam **Meter (m)**
- **Ukur Jarak & Keliling (Ruler Tool):** Klik titik-titik lintasan pipa/jalan untuk mengukur jarak kumulatif (**km** & **meter**).
- **Reset Titik:** Membersihkan pengukuran dalam 1 klik.

### 3. Multilayer Comparison (A/B Blend Slider)
- Fitur pembanding dua layer secara interaktif (contoh: Ortho RGB visual vs Indeks NDVI atau Pupuk Nitrogen).
- Dilengkapi **Slider Blend 0% – 100%** untuk transisi halus antar-layer, memudahkan agronomis mendeteksi anomali tanaman secara presisi.

### 4. Dynamic Scientific Colormaps (On-the-Fly)
Pilihan palet ilmiah interaktif pada setiap layer analitis:
- `Red-Yellow-Green (rdylgn)`: Standar kesehatan tanaman NDVI/VARI
- `Viridis (viridis)`: Skala perseptual seragam standar ilmiah
- `Plasma (plasma)`: Kontras tinggi untuk fosfor & termal
- `Inferno (inferno)`: Deteksi kalium & kelembaban tanah
- `Spectral (spectral)`: Analisis multispektral
- `Terrain (terrain)`: Topografi permukaan DSM
- `Turbo (turbo)`: Deteksi anomali kontras tinggi

### 5. PostGIS Geodetic Area Card
Menampilkan metrik luas lahan terverifikasi hasil perhitungan spasial geodetik PostGIS langsung dari backend.

---

## 📁 Struktur Proyek

```
frontend/
├── app/
│   ├── page.tsx                    # Landing Page Publik (Marketing)
│   ├── login/page.tsx              # Form Login
│   ├── register/page.tsx           # Form Registrasi Akun
│   └── dashboard/                  # Dashboard Terproteksi (Auth Guard)
│       ├── page.tsx                # Overview Platform
│       ├── maps/page.tsx           # Visualisasi Peta Utama & Metadata
│       ├── upload/page.tsx         # Upload GeoTIFF (Dual Mode: Batch Auto & Manual Slot)
│       ├── subscription/page.tsx   # Tier Paket & Kuota Lahan
│       └── admin/                  # Panel Manajemen Admin
├── components/
│   ├── DashboardLayout.tsx         # Auth Guard & Wrapper Sesi
│   ├── Sidebar.tsx                 # Navigasi Responsif
│   ├── MapDisplay.tsx              # Core MapLibre GL JS + Turf.js Tools + Compare Slider
│   └── LayerControlPanel.tsx       # Layer Toggles, Opacity, Palette Selector & Basemap
├── context/
│   └── UserRoleContext.tsx         # Global Auth Context & 30-min Idle Timeout
├── lib/
│   └── api.ts                      # Konfigurasi Axios (baseURL localhost:8001)
└── types/
    └── map.ts                      # TypeScript Interfaces (MapLayerItem, GeoMetadata, SpatialInfo)
```

---

## ⚙️ Setup & Menjalankan

### 1. Prasyarat
- Node.js 18+ atau 20+
- npm atau pnpm

### 2. Konfigurasi Environment (`.env.local`)
Buat file `.env.local` di folder `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

### 3. Install & Jalankan
```bash
npm install
npm run dev
```

Aplikasi frontend akan berjalan di: **http://localhost:3000**  
Pastikan Backend FastAPI berjalan di port **8001**.
