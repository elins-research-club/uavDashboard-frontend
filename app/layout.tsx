/*
 * Ini adalah layout utama yang akan membungkus semua halaman di aplikasi Anda.
 * Perubahan di sini akan mempengaruhi seluruh situs.
 */
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { UserRoleProvider } from "@/context/UserRoleContext";

/* Sans-serif geometris seperti desain referensi sidebar
   (Inter + fitur cv11 untuk 'a' satu tingkat, letter-spacing ketat). */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata = {
  title: "UAV Dashboard - AMX",
  description: "Platform Monitoring dan Analisis Data Lahan",
};

export default function RootLayout({ children }) {
  return (
    // TAMBAHKAN 'suppressHydrationWarning' DI KEDUA BARIS INI
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true} className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <UserRoleProvider>{children}</UserRoleProvider>
      </body>
    </html>
  );
}
