"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Crown, Layers, CreditCard } from "lucide-react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";

type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
  subscription?: {
    tier: string;
    status: string;
  };
};

const TIER_OPTIONS = ["free", "desa", "kecamatan"];
const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  desa: "bg-blue-100 text-blue-700",
  kecamatan: "bg-purple-100 text-purple-700",
};

export default function UsersPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("error");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    if (!user) return;

    api
      .get("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch((err) =>
        setMessage(err.response?.data?.detail || "Gagal memuat daftar user.")
      )
      .finally(() => setLoading(false));
  }, [router, user]);

  // Update role (admin/member)
  const updateRole = async (id: string, role: UserRecord["role"]) => {
    setUpdatingId(id);
    setMessage("");
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((cur) => cur.map((u) => (u.id === id ? data : u)));
      setMsgType("success");
      setMessage(`Role user berhasil diubah ke "${role}"`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMsgType("error");
      setMessage(err.response?.data?.detail || "Role user gagal diubah.");
    } finally {
      setUpdatingId("");
    }
  };

  // Simulasi upgrade tier subscription
  const updateTier = async (id: string, tier: string) => {
    setUpdatingId(id + "-tier");
    setMessage("");
    try {
      await api.patch(`/admin/users/${id}/tier`, { tier });
      setUsers((cur) =>
        cur.map((u) =>
          u.id === id
            ? { ...u, subscription: { ...(u.subscription || {}), tier, status: "active" } }
            : u
        )
      );
      setMsgType("success");
      setMessage(`Tier subscription berhasil diubah ke "${tier}"`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMsgType("error");
      setMessage(err.response?.data?.detail || "Gagal mengubah tier.");
    } finally {
      setUpdatingId("");
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manajemen User</h1>
            <p className="text-sm text-gray-500">
              Kelola role akses dan tier subscription setiap pengguna.
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${
              msgType === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700" />
              <span className="text-sm">Memuat daftar user...</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">
              Tidak ada user terdaftar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Terdaftar
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Role
                      </div>
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Tier Subscription
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {/* Avatar + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {item.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.username}</p>
                            {item.id === user?.id && (
                              <span className="text-xs text-blue-500 font-medium">(Anda)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.role === "admin" && (
                            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                          <select
                            value={item.role}
                            disabled={updatingId === item.id || item.id === user?.id}
                            onChange={(e) =>
                              updateRole(item.id, e.target.value as UserRecord["role"])
                            }
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>

                      {/* Tier Dropdown (simulasi) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              TIER_COLORS[item.subscription?.tier || "free"] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {(item.subscription?.tier || "free").toUpperCase()}
                          </span>
                          <select
                            value={item.subscription?.tier || "free"}
                            disabled={updatingId === item.id + "-tier"}
                            onChange={(e) => updateTier(item.id, e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {TIER_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
