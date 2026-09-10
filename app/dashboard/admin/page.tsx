"use client";

import { useEffect, useState, type ReactElement } from "react";
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

function RolePermissionEditor({
  roles,
  permissionGroups,
  roleLoading,
  selectedRoleId,
  setSelectedRoleId,
  editedPermissions,
  togglePermission,
  saveRole,
  cancelEdit,
  saveMessage,
}: {
  roles: Role[];
  permissionGroups: PermissionGroup[];
  roleLoading: boolean;
  selectedRoleId: string;
  setSelectedRoleId: (roleId: string) => void;
  editedPermissions: string[];
  togglePermission: (permission: string) => void;
  saveRole: (roleId: string) => Promise<void>;
  cancelEdit: () => void;
  saveMessage: { id: string; type: "success" | "error"; text: string } | null;
}) {
  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  const toggleGroup = (permissions: string[]) => {
    const allSelected = permissions.every((permission) =>
      editedPermissions.includes(permission)
    );
    permissions.forEach((permission) => {
      const shouldToggle = allSelected
        ? editedPermissions.includes(permission)
        : !editedPermissions.includes(permission);
      if (shouldToggle) togglePermission(permission);
    });
  };

  if (roleLoading || !selectedRole) {
    return (
      <div className="flex items-center justify-center gap-2.5 rounded-3xl border border-[#123c28]/10 bg-white p-12 text-sm font-semibold">
        Memuat data role...
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#123c28]/10 pb-5">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#277f6d]" />
            <h2 className="text-xl font-bold">Edit Role</h2>
          </div>
          <p className="text-sm">Atur fitur yang dapat digunakan oleh setiap role.</p>
        </div>
        <label className="w-full max-w-xs">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Role</span>
          <select
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            className="w-full rounded-xl border border-[#123c28]/15 bg-white px-3.5 py-2.5 text-sm font-bold outline-none focus:border-[#277f6d]"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {permissionGroups.map((group) => {
          const groupKeys = group.permissions.map((permission) => permission.key);
          const allSelected = editedPermissions.includes("all") ||
            groupKeys.every((permission) => editedPermissions.includes(permission));

          return (
            <div key={group.title} className="rounded-2xl border border-[#123c28]/10 bg-[#f1f6fb] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b border-[#123c28]/10 pb-2">
                <div><span className="text-sm font-bold">{group.title}</span><span className="ml-1.5 text-xs">{group.description}</span></div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={allSelected} onChange={() => toggleGroup(groupKeys)} className="h-4 w-4 accent-[#277f6d]" />
                  Pilih Semua
                </label>
              </div>
              <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {group.permissions.map((permission) => {
                  const checked = editedPermissions.includes(permission.key) || editedPermissions.includes("all");
                  return (
                    <label key={permission.key} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.key)} className="h-4 w-4 accent-[#277f6d]" />
                      {permission.label}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#123c28]/10 pt-5">
        <p className="text-sm font-semibold">{editedPermissions.includes("all") ? "Akses penuh aktif" : `${editedPermissions.length} permission aktif`}</p>
        <div className="flex gap-2">
          <button type="button" onClick={cancelEdit} className="rounded-xl border border-[#123c28]/15 px-4 py-2.5 text-sm font-bold transition hover:bg-[#f3f6ed]">Batal</button>
          <button type="button" onClick={() => saveRole(selectedRole.id)} className="inline-flex items-center gap-2 rounded-xl bg-[#277f6d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f6c5d]"><Save className="h-4 w-4" />Simpan Role</button>
        </div>
      </div>
      {saveMessage?.id === selectedRole.id && <p className={`mt-3 text-sm font-bold ${saveMessage.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{saveMessage.text}</p>}
    </section>
  );
}

interface PermissionGroup {
  title: string;
  description: string;
  permissions: { key: string; label: string }[];
}

interface Plan {
  id: string;
  tier: string;
  price: number;
  features: string[];
}

// ─── Available Permissions ────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  { key: "all", label: "Full Access (Super Admin)" },
  { key: "manage_users", label: "Kelola Pengguna" },
  { key: "manage_maps", label: "Kelola Peta" },
  { key: "manage_pricing", label: "Kelola Harga Paket" },
  { key: "upload_map", label: "Upload Peta" },
  { key: "view_map", label: "Lihat Peta" },
  { key: "download_map", label: "Download Peta" },
];

// Solid tier colors — consistent with the platform's green/lime/amber palette.
const TIER_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  free: {
    bg: "bg-[#eef1ea]",
    text: "text-[#4b5d52]",
    border: "border-[#123c28]/15",
  },
  desa: {
    bg: "bg-[#dfeeb1]",
    text: "text-[#4a5f0e]",
    border: "border-[#91b928]/50",
  },
  kecamatan: {
    bg: "bg-[#fbe6bd]",
    text: "text-[#8a5a06]",
    border: "border-[#f0ad25]/50",
  },
};

const TIER_ICONS: Record<string, ReactElement> = {
  free: <Layers className="h-4 w-4" />,
  desa: <Users className="h-4 w-4" />,
  kecamatan: <Crown className="h-4 w-4" />,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [activeTab, setActiveTab] = useState<"roles" | "pricing">("roles");

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSaveMsg, setRoleSaveMsg] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<string>("0");
  const [editedFeatures, setEditedFeatures] = useState<string>("");
  const [planSaveMsg, setPlanSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ─── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  useEffect(() => {
    setRoleLoading(true);
    api
      .get("/admin/roles")
      .then(({ data }) => {
        setRoles(data);
        if (data[0]) {
          setSelectedRoleId(data[0].id);
          startEditRole(data[0]);
        }
      })
      .finally(() => setRoleLoading(false));
    api.get("/admin/plans").then(({ data }) => setPlans(data));
    api.get("/admin/permission-catalog").then(({ data }) => setPermissionGroups(data));
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
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev.filter((p) => p !== "all"), perm]
    );
  };

  const saveRole = async (roleId: string) => {
    try {
      const { data } = await api.put(`/admin/roles/${roleId}`, {
        permissions: editedPermissions,
      });
      setRoles((prev) => prev.map((r) => (r.id === roleId ? data : r)));
      setEditingRole(null);
      setRoleSaveMsg({
        id: roleId,
        type: "success",
        text: "Role berhasil diperbarui!",
      });
      setTimeout(() => setRoleSaveMsg(null), 3000);
    } catch {
      setRoleSaveMsg({
        id: roleId,
        type: "error",
        text: "Gagal menyimpan role.",
      });
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
      const features = editedFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const { data } = await api.put(`/admin/plans/${planId}`, {
        price: Number(editedPrice) || 0,
        features,
      });
      setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)));
      setEditingPlan(null);
      setPlanSaveMsg({
        type: "success",
        text: "Harga paket berhasil diperbarui!",
      });
      setTimeout(() => setPlanSaveMsg(null), 3000);
    } catch {
      setPlanSaveMsg({ type: "error", text: "Gagal menyimpan harga." });
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            TOP HEADER
        ====================================================== */}
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#91b928]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#123c28]">
              UAV DaaS PLATFORM
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-4xl">
            Admin <span className="text-[#1a5134]">Panel</span>
          </h1>


        </header>

        {/* =====================================================
            TABS
        ====================================================== */}
        <div className="mb-6 inline-flex w-fit gap-1 rounded-full border border-[#123c28]/15 bg-[#f7f8f4] p-1">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${activeTab === "roles"
              ? "bg-[#123c28] text-white"
              : "text-[#4b5d52] hover:text-[#123c28]"
              }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Manajemen Role
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${activeTab === "pricing"
              ? "bg-[#123c28] text-white"
              : "text-[#4b5d52] hover:text-[#123c28]"
              }`}
          >
            <CreditCard className="h-4 w-4" />
            Harga Subscription
          </button>
        </div>

        {/* ─── TAB 1: RBAC Role Management ──────────────────────────────────── */}
        {activeTab === "roles" && (
          <RolePermissionEditor
            roles={roles}
            permissionGroups={permissionGroups}
            roleLoading={roleLoading}
            selectedRoleId={selectedRoleId}
            setSelectedRoleId={(roleId) => {
              setSelectedRoleId(roleId);
              const role = roles.find((item) => item.id === roleId);
              if (role) startEditRole(role);
            }}
            editedPermissions={editedPermissions}
            togglePermission={togglePermission}
            saveRole={saveRole}
            cancelEdit={() => {
              const role = roles.find((item) => item.id === selectedRoleId);
              if (role) startEditRole(role);
            }}
            saveMessage={roleSaveMsg}
          />
        )}

        {false && activeTab === "roles" && (
          <div className="space-y-4">
            {roleLoading ? (
              <div className="flex items-center justify-center gap-2.5 py-12 text-[#4b5d52]">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#123c28]" />
                <span className="text-sm font-semibold">
                  Memuat data role...
                </span>
              </div>
            ) : (
              roles.map((role) => (
                <section
                  key={role.id}
                  className="rounded-[28px] border border-[#123c28]/15 bg-white p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold capitalize text-[#123c28]">
                        {role.name}
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-[#4b5d52]">
                        {role.permissions.length === 1 &&
                          role.permissions[0] === "all"
                          ? "Full access ke semua fitur"
                          : `${role.permissions.length} permission aktif`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingRole === role.id ? (
                        <>
                          <button
                            onClick={() => saveRole(role.id)}
                            className="flex items-center gap-1.5 rounded-full bg-[#123c28] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1a5134]"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingRole(null)}
                            className="flex items-center gap-1.5 rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-3.5 py-1.5 text-xs font-bold text-[#4b5d52] transition hover:bg-[#eef1ea]"
                          >
                            <X className="h-3.5 w-3.5" />
                            Batal
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditRole(role)}
                          className="flex items-center gap-1.5 rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-3.5 py-1.5 text-xs font-bold text-[#123c28] transition hover:bg-[#eef1ea]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit Otorisasi
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permission Checkboxes */}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked =
                        editingRole === role.id
                          ? editedPermissions.includes(perm.key)
                          : role.permissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-sm transition-all ${isChecked
                            ? "border-[#91b928]/50 bg-[#eef3e8] text-[#123c28]"
                            : "border-[#123c28]/12 bg-[#fafbf8] text-[#4b5d52]"
                            } ${editingRole !== role.id
                              ? "pointer-events-none"
                              : "cursor-pointer hover:border-[#123c28]/30"
                            }`}
                        >
                          <div
                            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${isChecked
                              ? "border-[#123c28] bg-[#123c28]"
                              : "border-[#123c28]/25 bg-white"
                              }`}
                          >
                            {isChecked && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          {editingRole === role.id && (
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.key)}
                            />
                          )}
                          <span className="font-semibold">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Save message */}
                  {roleSaveMsg?.id === role.id && (
                    <p
                      className={`mt-3 text-xs font-bold ${roleSaveMsg.type === "success"
                        ? "text-[#4a5f0e]"
                        : "text-red-600"
                        }`}
                    >
                      {roleSaveMsg.text}
                    </p>
                  )}
                </section>
              ))
            )}
          </div>
        )}

        {/* ─── TAB 2: Subscription Pricing ─────────────────────────────────── */}
        {activeTab === "pricing" && (
          <div>
            {planSaveMsg && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${planSaveMsg.type === "success"
                  ? "border-[#91b928]/40 bg-[#f3f8e2] text-[#4a5f0e]"
                  : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                {planSaveMsg.type === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {planSaveMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {plans.map((plan) => {
                const style = TIER_STYLES[plan.tier] || TIER_STYLES.free;
                return (
                  <div
                    key={plan.id}
                    className="flex flex-col rounded-[28px] border border-[#123c28]/15 bg-white p-6"
                  >
                    {/* Plan Header */}
                    <div
                      className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${style.bg} ${style.text} ${style.border}`}
                    >
                      {TIER_ICONS[plan.tier] || <Layers className="h-4 w-4" />}
                      <span className="capitalize">{plan.tier}</span>
                    </div>

                    {/* Price Edit */}
                    <div className="mb-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                        Harga / Bulan
                      </p>
                      {editingPlan === plan.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#4b5d52]">
                            Rp
                          </span>
                          <input
                            type="number"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(e.target.value)}
                            className="flex-1 rounded-xl border border-[#123c28]/20 bg-white px-3 py-1.5 text-base font-bold text-[#123c28] outline-none focus:border-transparent focus:ring-2 focus:ring-[#123c28]"
                          />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold tracking-[-0.02em] text-[#123c28]">
                          {plan.price === 0
                            ? "Gratis"
                            : `Rp ${plan.price.toLocaleString("id-ID")}`}
                        </p>
                      )}
                    </div>

                    {/* Features Edit */}
                    <div className="mb-4 flex-1">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4b5d52]">
                        Fitur Termasuk
                      </p>
                      {editingPlan === plan.id ? (
                        <textarea
                          value={editedFeatures}
                          onChange={(e) => setEditedFeatures(e.target.value)}
                          rows={4}
                          placeholder="Satu fitur per baris..."
                          className="w-full resize-none rounded-xl border border-[#123c28]/20 bg-white px-3 py-2 text-sm font-medium text-[#123c28] outline-none focus:border-transparent focus:ring-2 focus:ring-[#123c28]"
                        />
                      ) : (
                        <ul className="space-y-1.5">
                          {plan.features.map((feat, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-sm font-medium text-[#123c28]"
                            >
                              <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#1a5134]" />
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
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#123c28] py-2 text-sm font-bold text-white transition hover:bg-[#1a5134]"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingPlan(null)}
                          className="rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-3 py-2 text-[#4b5d52] transition hover:bg-[#eef1ea]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditPlan(plan)}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-[#123c28]/15 bg-[#f5f7f1] py-2 text-sm font-bold text-[#123c28] transition hover:bg-[#eef1ea]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Harga &amp; Fitur
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Simulasi Subscription Info */}
            <div className="mt-6 flex items-start gap-3 rounded-[24px] border border-[#f0ad25]/40 bg-[#fdf1dd] p-5">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8a5a06]" />
              <div>
                <p className="text-sm font-bold text-[#8a5a06]">
                  Mode Simulasi Aktif
                </p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#8a5a06]">
                  Platform ini berjalan dalam mode simulasi tanpa payment
                  gateway. Perubahan harga di sini akan tersimpan ke database
                  dan mempengaruhi tampilan halaman Langganan. Untuk mengubah
                  tier seorang user, gunakan menu{" "}
                  <strong>Manajemen User</strong> di sidebar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
