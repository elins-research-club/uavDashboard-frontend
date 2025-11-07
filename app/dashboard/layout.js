import DashboardLayout from "../../components/DashboardLayout";

// Memaksa halaman ini agar tidak di-cache,
// sangat penting untuk "penjaga" keamanan kita.
export const dynamic = "force-dynamic";

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
