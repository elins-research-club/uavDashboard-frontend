"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import {
  ShieldCheck,
  CreditCard,
  Check,
  X,
  Edit3,
  Save,
  AlertTriangle,
  Crown,
  Users,
  Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface Plan {
  id: string;
  tier: string;
  price: number;
  features: string[];
}

// ─── Available Permissions ────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  { key: "all", label: "Full Access (Super Admin)", color: "red" },
  { key: "manage_users", label: "Kelola Pengguna", color: "purple" },
  { key: "manage_maps", label: "Kelola Peta", color: "blue" },
  { key: "manage_pricing", label: "Kelola Harga Paket", color: "orange" },
  { key: "upload_map", label: "Upload Peta", color: "green" },
  { key: "view_map", label: "Lihat Peta", color: "gray" },
  { key: "download_map", label: "Download Peta", color: "teal" },
];

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 border-gray-200",
  desa: "bg-blue-100 text-blue-700 border-blue-200",
  kecamatan: "bg-purple-100 text-purple-700 border-purple-200",
};

const TIER_ICONS: Record<string, JSX.Element> = {
  free: <Layers className="w-5 h-5" />,
  desa: <Users className="w-5 h-5" />,
  kecamatan: <Crown className="w-5 h-5" />,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [activeTab, setActiveTab] = useState<"roles" | "pricing">("roles");

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSaveMsg, setRoleSaveMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<string>("0");
  const [editedFeatures, setEditedFeatures] = useState<string>("");
  const [planSaveMsg, setPlanSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ─── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  useEffect(() => {
    setRoleLoading(true);
    api.get("/admin/roles").then(({ data }) => setRoles(data)).finally(() => setRoleLoading(false));
    api.get("/admin/plans").then(({ data }) => setPlans(data));
  }, []);

  // ─── Role Handlers ─────────────────────────────────────────────────────────
  const startEditRole = (role: Role) => {
    setEditingRole(role.id);
    setEditedPermissions([...role.permissions]);
  };

  const togglePermission = (perm: string) => {
    if (perm === "all") {
      setEditedPermissions(["all"]);
      return;
    }
    setEditedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev.filter((p) => p !== "all"), perm]
    );
  };

  const saveRole = async (roleId: string) => {
    try {
      const { data } = await api.put(`/admin/roles/${roleId}`, { permissions: editedPermissions });
      setRoles((prev) => prev.map((r) => (r.id === roleId ? data : r)));
      setEditingRole(null);
      setRoleSaveMsg({ id: roleId, type: "success", text: "Role berhasil diperbarui!" });
      setTimeout(() => setRoleSaveMsg(null), 3000);
    } catch {
      setRoleSaveMsg({ id: roleId, type: "error", text: "Gagal menyimpan role." });
    }
  };

  // ─── Plan Handlers ─────────────────────────────────────────────────────────
  const startEditPlan = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditedPrice(plan.price.toString());
    setEditedFeatures(plan.features?.join("\n") || "");
  };

  const savePlan = async (planId: string) => {
    try {
      const features = editedFeatures.split("\n").map((f) => f.trim()).filter(Boolean);
      const { data } = await api.put(`/admin/plans/${planId}`, { price: Number(editedPrice) || 0, features });
      setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)));
      setEditingPlan(null);
      setPlanSaveMsg({ type: "success", text: "Harga paket berhasil diperbarui!" });
      setTimeout(() => setPlanSaveMsg(null), 3000);
    } catch {
      setPlanSaveMsg({ type: "error", text: "Gagal menyimpan harga." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-gray-700" />
            <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-sm text-gray-500">
            Kelola Role &amp; Hak Akses (RBAC) dan Harga Paket Langganan
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "roles"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Manajemen Role (RBAC)
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "pricing"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Harga Subscription
          </button>
        </div>

        {/* ─── TAB 1: RBAC Role Management ──────────────────────────────────── */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            {roleLoading ? (
              <div className="flex items-center gap-2 py-10 justify-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
                <span className="text-sm">Memuat data role...</span>
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 capitalize">
                        {role.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {role.permissions.length === 1 && role.permissions[0] === "all"
                          ? "Full access ke semua fitur"
                          : `${role.permissions.length} permission aktif`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingRole === role.id ? (
                        <>
                          <button
                            onClick={() => saveRole(role.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingRole(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Batal
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditRole(role)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Permission
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permission Checkboxes */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked =
                        editingRole === role.id
                          ? editedPermissions.includes(perm.key)
                          : role.permissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-sm cursor-pointer transition-all ${
                            isChecked
                              ? "bg-blue-50 border-blue-300 text-blue-800"
                              : "bg-gray-50 border-gray-200 text-gray-500"
                          } ${editingRole !== role.id ? "pointer-events-none" : "hover:border-blue-400"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              isChecked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {editingRole === role.id && (
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.key)}
                            />
                          )}
                          <span className="font-medium">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Save message */}
                  {roleSaveMsg?.id === role.id && (
                    <p
                      className={`text-xs mt-3 font-medium ${
                        roleSaveMsg.type === "success" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {roleSaveMsg.text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB 2: Subscription Pricing ─────────────────────────────────── */}
        {activeTab === "pricing" && (
          <div>
            {planSaveMsg && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
                  planSaveMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {planSaveMsg.type === "success" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {planSaveMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col"
                >
                  {/* Plan Header */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold mb-4 w-fit ${TIER_COLORS[plan.tier] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    {TIER_ICONS[plan.tier] || <Layers className="w-4 h-4" />}
                    <span className="capitalize">{plan.tier}</span>
                  </div>

                  {/* Price Edit */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Harga / Bulan</p>
                    {editingPlan === plan.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-600">Rp</span>
                        <input
                          type="number"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-base font-bold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {plan.price === 0
                          ? "Gratis"
                          : `Rp ${plan.price.toLocaleString("id-ID")}`}
                      </p>
                    )}
                  </div>

                  {/* Features Edit */}
                  <div className="flex-1 mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Fitur Termasuk</p>
                    {editingPlan === plan.id ? (
                      <textarea
                        value={editedFeatures}
                        onChange={(e) => setEditedFeatures(e.target.value)}
                        rows={4}
                        placeholder="Satu fitur per baris..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    ) : (
                      <ul className="space-y-1.5">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingPlan === plan.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => savePlan(plan.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingPlan(null)}
                        className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditPlan(plan)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Harga &amp; Fitur
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Simulasi Subscription Info */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Mode Simulasi Aktif</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Platform ini berjalan dalam mode simulasi tanpa payment gateway. Perubahan harga
                  di sini akan tersimpan ke database dan mempengaruhi tampilan halaman Langganan.
                  Untuk mengubah tier seorang user, gunakan menu{" "}
                  <strong>Manajemen User</strong> di sidebar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
