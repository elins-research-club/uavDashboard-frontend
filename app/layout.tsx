/*
 * Ini adalah layout utama yang akan membungkus semua halaman di aplikasi Anda.
 * Perubahan di sini akan mempengaruhi seluruh situs.
 */
import "./globals.css";
import { UserRoleProvider } from "@/context/UserRoleContext";

export const metadata = {
  title: "UAV Dashboard - AMX",
  description: "Platform Monitoring dan Analisis Data Lahan",
};

export default function RootLayout({ children }) {
  return (
    // TAMBAHKAN 'suppressHydrationWarning' DI KEDUA BARIS INI
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <UserRoleProvider>{children}</UserRoleProvider>
      </body>
    </html>
  );
}
