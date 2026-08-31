"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUserRole } from "@/context/UserRoleContext";
import {
  LayoutDashboard,
  Map,
  CreditCard,
  Upload,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  Users,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const mainMenuItems = [
    {
      href: "/dashboard",
      label: "Ringkasan",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      href: "/dashboard/maps",
      label: "Peta Saya",
      icon: <Map className="w-4 h-4" />,
    },
    {
      href: "/dashboard/subscription",
      label: "Langganan",
      icon: <CreditCard className="w-4 h-4" />,
    },
  ];

  const adminMenuItems = [
    ...(user?.role === "admin"
      ? [
          {
            href: "/dashboard/users",
            label: "Manajemen User",
            icon: <Users className="w-4 h-4" />,
          },
          {
            href: "/dashboard/admin",
            label: "Admin Panel (RBAC)",
            icon: <ShieldCheck className="w-4 h-4" />,
          },
          {
            href: "/dashboard/upload",
            label: "Upload Peta",
            icon: <Upload className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const bottomMenuItems = [
    {
      href: "/dashboard/settings",
      label: "Pengaturan",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      href: "/dashboard/help",
      label: "Bantuan",
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Map className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">
            UAV Platform
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {isActive(item.href) && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Admin
          </p>
          <div className="space-y-1">
            {adminMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {isActive(item.href) && <ChevronRight className="w-4 h-4" />}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="space-y-1">
            {bottomMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700">
              {(user?.username || "P").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.username || "Pengguna"}
              </p>
              {user?.role === "admin" ? (
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-white">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize border ${
                  user?.tier === "kecamatan"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : user?.tier === "desa"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}>
                  {user?.tier === "kecamatan" ? "👑" : user?.tier === "desa" ? "🏘️" : "🗂️"} {user?.tier || "Free"}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
