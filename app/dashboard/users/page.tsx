"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, CreditCard, Activity } from "lucide-react";
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

// Solid tier colors — consistent with the platform's green/lime/amber palette.
const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  free: { bg: "bg-[#eef1ea]", text: "text-[#4b5d52]" },
  desa: { bg: "bg-[#dfeeb1]", text: "text-[#4a5f0e]" },
  kecamatan: { bg: "bg-[#fbe6bd]", text: "text-[#8a5a06]" },
};

const AVATAR_PALETTE = ["#123c28", "#1a5134", "#4a5f0e", "#8a5a06"];

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
            ? {
              ...u,
              subscription: {
                ...(u.subscription || {}),
                tier,
                status: "active",
              },
            }
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

  const avatarColor = (username: string) => {
    const sum = username
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
  };

  return (
    <main className="min-h-screen bg-white text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            TOP HEADER
        ====================================================== */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#91b928]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#123c28]">
                UAV DaaS PLATFORM
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-4xl">
              Manajemen <span className="text-[#1a5134]">User</span>
            </h1>


          </div>

          <div className="rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#123c28]" />
              <span className="text-[11px] font-bold text-[#123c28]">
                {users.length} Pengguna Terdaftar
              </span>
            </div>
          </div>
        </header>

        {/* =====================================================
            QUICK STATUS
        ====================================================== */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-3.5 text-sm font-semibold ${msgType === "success"
              ? "border-[#91b928]/40 bg-[#f3f8e2] text-[#4a5f0e]"
              : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {message}
          </div>
        )}

        {/* =====================================================
            TABLE
        ====================================================== */}
        <section className="overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white">
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 p-12 text-[#4b5d52]">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#123c28]" />
              <span className="text-sm font-semibold">
                Memuat daftar user...
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f6ed]">
                <Users className="h-5 w-5 text-[#123c28]/60" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#4b5d52]">
                Tidak ada user terdaftar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#123c28]/12 bg-[#fafbf8]">
                  <tr>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                      User
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                      Email
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                      Terdaftar
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Role
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Tier Subscription
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#123c28]/8">
                  {users.map((item) => {
                    const tierKey = item.subscription?.tier || "free";
                    const tierStyle = TIER_STYLES[tierKey] || TIER_STYLES.free;

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-[#fafbf8]"
                      >
                        {/* Avatar + Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{
                                backgroundColor: avatarColor(item.username),
                              }}
                            >
                              {item.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#123c28]">
                                {item.username}
                              </p>
                              {item.id === user?.id && (
                                <span className="text-[11px] font-semibold text-[#1a5134]">
                                  (Anda)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-sm font-medium text-[#4b5d52]">
                          {item.email}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-sm font-medium text-[#4b5d52]">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>

                        {/* Role Dropdown */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {item.role === "admin" && (
                              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-[#1a5134]" />
                            )}
                            <select
                              value={item.role}
                              disabled={
                                updatingId === item.id || item.id === user?.id
                              }
                              onChange={(e) =>
                                updateRole(
                                  item.id,
                                  e.target.value as UserRecord["role"]
                                )
                              }
                              className="rounded-lg border border-[#123c28]/15 bg-white px-3 py-1.5 text-sm font-medium text-[#123c28] focus:outline-none focus:ring-2 focus:ring-[#123c28] disabled:cursor-not-allowed disabled:bg-[#f5f7f1] disabled:text-[#4b5d52]"
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
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${tierStyle.bg} ${tierStyle.text}`}
                            >
                              {tierKey.toUpperCase()}
                            </span>
                            <select
                              value={tierKey}
                              disabled={updatingId === item.id + "-tier"}
                              onChange={(e) =>
                                updateTier(item.id, e.target.value)
                              }
                              className="rounded-lg border border-[#123c28]/15 bg-white px-3 py-1.5 text-sm font-medium text-[#123c28] focus:outline-none focus:ring-2 focus:ring-[#123c28] disabled:cursor-not-allowed disabled:bg-[#f5f7f1] disabled:text-[#4b5d52]"
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
