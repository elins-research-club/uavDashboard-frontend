# UAV DaaS Platform — Frontend

Frontend aplikasi web untuk **UAV DaaS (Data-as-a-Service) Platform**, yaitu platform pemetaan lahan pertanian presisi berbasis drone dengan sistem subscription.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (.tsx) |
| Styling | CSS Modules / TailwindCSS (campur, butuh standarisasi) |
| Map Library | React-Leaflet (`leaflet`) |
| API Client | Axios (dengan JWT Interceptor) |
| Icons | Lucide React |

## Struktur Folder & Rute

```
uavDashboard-frontend/
├── app/
│   ├── page.tsx                    # Landing Page Publik (/, Marketing)
│   ├── login/page.tsx              # Form Login
│   ├── register/page.tsx           # Form Register
│   └── dashboard/                  # Area Terproteksi (Butuh Login)
│       ├── page.tsx                # Dashboard Home (Ringkasan)
│       ├── maps/page.tsx           # Peta Interaktif (Leaflet)
│       ├── upload/page.tsx         # Upload Peta (TIFF/PNG/JPG)
│       └── subscription/page.tsx   # Tier/Pricing Plans
├── components/
│   ├── DashboardLayout.tsx         # Layout Utama & Auth Guard
│   ├── Sidebar.tsx                 # Navigasi Kiri
│   ├── MapDisplay.tsx              # Map Wrapper (Dynamic Import SSR: false)
│   └── ActualMap.tsx               # Komponen Leaflet Core
├── context/
│   └── UserRoleContext.tsx         # Global State untuk User Auth (terhubung ke /users/me)
├── lib/
│   └── api.ts                      # Konfigurasi Axios & JWT Interceptor
└── public/
    └── ...                         # Asset Statis (Gambar, Icon)
```

## Kondisi Saat Ini

1. **Autentikasi & Backend (FastAPI):** Proyek ini **telah terhubung secara arsitektur** dengan backend FastAPI. Endpoint untuk Auth (`/auth/login`, `/auth/register`), User (`/users/me`), dan Maps (`/maps`) sudah tersedia. 
2. **TypeScript:** Proyek ini menggunakan TypeScript secara penuh. Konfigurasi `tsconfig.json` dan `global.d.ts` sudah siap.
3. **Peta (Leaflet):** Menggunakan `react-leaflet`. Di-*import* secara dinamis (`next/dynamic` dengan `ssr: false`) agar tidak *crash* saat SSR di Next.js.
4. **Setup API Client:** Sudah disediakan *blueprint* integrasi di `lib/api.ts` dan panduan unggah file *multipart* (TIFF) di `INTEGRATION_GUIDE.md`.

## Setup & Menjalankan

```bash
cd uavDashboard-frontend
npm install
npm run dev
```

Aplikasi berjalan di **http://localhost:3000**
Pastikan **Backend FastAPI** juga berjalan di `http://localhost:8000` agar fitur API bisa diakses.
