/*
 * Ini adalah layout utama yang akan membungkus semua halaman di aplikasi Anda.
 * Perubahan di sini akan mempengaruhi seluruh situs.
 */
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "UAV Dashboard - AMX",
  description: "Platform Monitoring dan Analisis Data Lahan",
};

export default function RootLayout({ children }) {
  return (
    // TAMBAHKAN 'suppressHydrationWarning' DI KEDUA BARIS INI
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
