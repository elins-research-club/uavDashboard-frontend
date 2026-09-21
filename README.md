# AMX GeoStream Engine™ — Frontend (UAV DaaS Platform)

Frontend aplikasi web modern untuk **AMX GeoStream Engine™**, platform pemetaan lahan pertanian presisi (*precision agriculture*) berbasis citra drone UAV dengan arsitektur WebGIS mutakhir, navigasi responsif, sistem kontrol layer dinamis, dan panel admin RBAC.

---

## 🚀 Tech Stack

| Layer | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack, React 19) | Server & Client Components modern |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS + CSS Modules | Desain responsif, brand theme `#123C28` |
| **Map Rendering** | **MapLibre GL JS v6** | WebGL GPU-accelerated 60 FPS, 3D Terrain DEM |
| **Tile Format** | **PMTiles v4** | Single-file tile archives via HTTP Range Requests |
| **Spatial Analytics** | **Turf.js v7** | Perhitungan spasial client-side (luas ha/m², jarak km, perimeter) |
| **API Client** | Axios | Interceptor JWT, auto bearer token, timeout guard |
| **Animation & UX** | Framer Motion / Motion | Animasi transisi fluid & panel interaktif |
| **Icons** | Lucide React | Modern minimalist vector icons |

---

## 🌾 Fitur Utama Precision Farming & WebGIS

### 1. WebGL Multi-Layer Map Engine (MapLibre GL JS v6)
- Rendering raster berkecepatan tinggi **60 FPS** tanpa lag saat menumpuk banyak layer resolusi tinggi:
  - `ortho` (Citra Ortho RGB / Mosaic)
  - `ndvi` & `vari` (Indeks Kesehatan Vegetasi)
  - `nitrogen`, `phosphorus`, `kalium` (Kandungan Hara Tanah N-P-K)
  - `dsm` (Digital Surface Model / Elevasi 3D)
  - `spectral` (Multispektral)
- **3D Terrain DEM:** Elevasi kontur realistis berbasis DEM / DSM UAV.
- **PMTiles Native Protocol:** Konsumsi data tile bertahap langsung dari server storage tanpa dekompresi seluruh file.
- **Interactive Layer Controls:** Drag-and-drop urutan layer, toggle base layer, opasitas independen, dan indikator status proses PMTiles (*baking indicator*).

### 2. Floating Map Layers Panel (Dual Mode: Minimize & Maximize)
- **Mode Minimize:** Tombol pil ringkas mengambang dengan **Search Bar terintegrasi** (`Cari peta...`) dan quick dropdown hasil pencarian untuk beralih layer peta seketika.
- **Mode Maximize:** Panel samping penuh untuk melihat daftar layer, status konversi, metadata ringkas, dan pencarian instan.

### 3. Toolkit Pengukuran Lahan & Grid 10m (Powered by Turf.js)
Toolbar mengambang di atas peta dengan fitur instan:
- **Ukur Luas Lahan (Polygon Tool):** Gambar batas petak sawah/kebun secara interaktif. Menghitung:
  - Luas Lahan dalam **Hektar (ha)** dan **Meter Persegi (m²)**
  - Keliling Batas Lahan dalam **Meter (m)**
- **Ukur Jarak & Keliling (Ruler Tool):** Klik titik-titik lintasan pipa/jalan untuk mengukur jarak kumulatif (**km** & **meter**).
- **Petak & Statistik Grid:** Popup petak interaktif yang menampilkan luas zonasi dan status analisis PostGIS.

### 4. Multilayer Comparison (A/B Blend Slider)
- Fitur pembanding dua layer secara interaktif (contoh: Ortho RGB visual vs Indeks NDVI atau Pupuk Nitrogen).
- Dilengkapi **Slider Blend 0% – 100%** untuk transisi halus antar-layer, memudahkan agronomis mendeteksi anomali tanaman secara presisi.

### 5. Dynamic Scientific Colormaps & Legend
- Palet warna pertanian ilmiah standar industri: `rdylgn`, `viridis`, `plasma`, `inferno`, `spectral`, `terrain`, `turbo`, `ylgn`, `ylorrd`, `pubugn`.
- Legenda gradien dinamis MapLibre native yang sinkron dengan parameter min/max layer.

### 6. Unduh Laporan Analisis
- Ekspor ringkasan laporan hasil pemetaan lahan ke format PDF terformat langsung dari dashboard.

### 7. Dashboard Manajemen, Langganan & Admin RBAC
- **Manajemen User & Role:** Kelola hak akses akun, penugasan role pengguna, dan proteksi akun Super Admin (*God*).
- **Katalog Paket Langganan:** Halaman paket (Free, Desa, Kecamatan) dengan integrasi checkout pembayaran.
- **Upload Citra UAV:** Dukungan upload berkas GeoTIFF hingga 3 GB dengan deteksi multi-layer otomatis atau pemilihan manual slot.

---

## 📁 Struktur Proyek

```
frontend/
├── app/
│   ├── page.tsx                    # Landing Page Publik (Marketing)
│   ├── login/page.tsx              # Form Login
│   ├── register/page.tsx           # Form Registrasi Akun
│   ├── features-pricing/           # Halaman Brosur Fitur & Harga
│   ├── contact/                    # Halaman Kontak
│   ├── help/                       # Halaman Bantuan
│   └── dashboard/                  # Dashboard Terproteksi (Auth Guard)
│       ├── page.tsx                # Overview Platform & Statistik Cepat
│       ├── maps/page.tsx           # Visualisasi WebGIS Utama, Layer & Tools
│       ├── upload/page.tsx         # Upload GeoTIFF (Batch Auto & Manual Slot)
│       ├── subscription/page.tsx   # Paket Langganan & Billing
│       ├── users/page.tsx          # Manajemen User
│       ├── admin/page.tsx          # Panel Admin & Manajemen Role RBAC
│       └── settings/page.tsx       # Pengaturan Akun
├── components/
│   ├── DashboardLayout.tsx         # Auth Guard & Wrapper Sesi
│   ├── Sidebar.tsx                 # Navigasi Responsif
│   ├── MapDisplay.tsx              # Core MapLibre GL JS + Turf.js Tools + Compare Slider
│   └── LayerControlPanel.tsx       # Layer Toggles, Opacity, Palette Selector & Basemap
├── context/
│   └── UserRoleContext.tsx         # Global Auth Context, Role Check, & Idle Timeout
├── lib/
│   ├── api.ts                      # Konfigurasi Axios (baseURL localhost:8001)
│   └── utils.ts                    # Helper utilitas Tailwind merge & formatting
└── types/
    ├── map.ts                      # TypeScript Interfaces (MapLayerItem, GeoMetadata, SpatialInfo)
    └── subscription.ts             # Interface Paket & Order
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
