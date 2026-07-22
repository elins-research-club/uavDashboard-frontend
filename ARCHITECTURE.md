# Frontend — Arsitektur & Aturan Main

Dokumen ini berisi aturan dan batasan untuk AI agent yang akan mengembangkan *source code* frontend ini lebih lanjut.

## 1. Aturan Dasar Next.js (App Router)

- **Use Client vs Server:** Secara *default*, komponen di Next.js App Router adalah *Server Components*. Jika kamu butuh *state* (`useState`), *lifecycle* (`useEffect`), event listener (`onClick`), atau *hooks* lainnya, pastikan menambahkan direktif `"use client";` di baris pertama file.
- **Data Fetching:**
  - Jika memungkinkan (dan data bersifat statis/tidak butuh login realtime), gunakan Server Components untuk mengambil data.
  - Namun, karena kita menggunakan JWT (yang kemungkinan disimpan di *localStorage* client), sebagian besar *fetching* ke Backend API harus dilakukan di Client Components atau dengan *wrapper hook* khusus.

## 2. Autentikasi (Client-Side Guard)

Sistem proteksi halaman dashboard (Auth Guard) saat ini ditangani oleh komponen `<DashboardLayout>`.

- Komponen ini mengecek `localStorage.getItem("token")` di dalam `useEffect`.
- Jika token tidak ada, *user* akan di-*redirect* menggunakan `useRouter().push('/login')`.
- Ini artinya, **setiap halaman di dalam `/dashboard` wajib di-wrap dengan `<DashboardLayout>`** agar otomatis terproteksi.

## 3. Komponen Peta (React-Leaflet)

> ⚠️ **SANGAT PENTING:** Leaflet memanipulasi DOM secara langsung dan butuh objek global `window`. Ia akan *error* / *crash* jika dijalankan di server (Node.js/Next.js SSR).

- **Jangan pernah me-render `ActualMap.tsx` secara langsung** di komponen lain.
- **Selalu gunakan `MapDisplay.tsx`** sebagai *wrapper*.
- `MapDisplay.tsx` menggunakan `next/dynamic` dengan opsi `ssr: false` untuk memastikan Leaflet hanya dimuat di browser *client*.

## 4. Rencana Integrasi Backend (REST API)

Kita akan menggunakan **Axios** (atau fetch standar) untuk berkomunikasi dengan Backend FastAPI (`http://localhost:8000`).

### Interceptor Standar (Contoh Implementasi yang Diharapkan)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Otomatis sisipkan JWT token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 5. UI/UX & Styling

- Pertahankan estetika modern, responsif, dan premium.
- Kombinasi TailwindCSS dan Vanilla CSS digunakan di sini. Usahakan konsisten.
- Gunakan ikon dari `lucide-react`.

## 6. Penanganan File Upload (TIFF)

Upload file geospasial (TIFF) tidak bisa dikirim sebagai JSON biasa. **Wajib menggunakan `FormData`** (multipart/form-data).

Contoh yang diharapkan di komponen upload:
```typescript
const formData = new FormData();
formData.append('title', title);
formData.append('map_type', mapType);
formData.append('file', selectedFile); // Obyek file dari input type="file"

await api.post('/maps', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```
