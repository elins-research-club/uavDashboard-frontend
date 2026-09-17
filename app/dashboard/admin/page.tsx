"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Crown,
  Edit3,
  Layers,
  Save,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_system_role: boolean;
  is_protected: boolean;
}

interface PermissionGroup {
  title: string;
  description: string;
  permissions: {
    key: string;
    label: string;
  }[];
}

interface Plan {
  id: string;
  tier: string;
  price: number;
  features: string[];
}

type SaveMessage = {
  id: string;
  type: "success" | "error";
  text: string;
} | null;

type PlanSaveMessage = {
  type: "success" | "error";
  text: string;
} | null;

/* ============================================================
   TIER STYLES
============================================================ */

const TIER_STYLES: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    orbTint: string;
    icon: ReactElement;
  }
> = {
  free: {
    bg: "bg-brand-50",
    text: "text-brand-800",
    border: "border-brand-800/10",
    orbTint: "#8cc7a5",
    icon: <Layers className="h-4 w-4" strokeWidth={1.75} />,
  },

  desa: {
    bg: "bg-[#e7efc4]",
    text: "text-[#4a5f0e]",
    border: "border-[#91b928]/25",
    orbTint: "#91b928",
    icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
  },

  kecamatan: {
    bg: "bg-[#fbe8c2]",
    text: "text-[#8a5a06]",
    border: "border-[#d99a2b]/25",
    orbTint: "#d99a2b",
    icon: <Crown className="h-4 w-4" strokeWidth={1.75} />,
  },
};

function getTierStyle(tier: string) {
  return (
    TIER_STYLES[tier] || {
      ...TIER_STYLES.free,
      icon: <Layers className="h-4 w-4" strokeWidth={1.75} />,
    }
  );
}

/* ============================================================
   DECORATIVE ORB
============================================================ */

function AdminOrb({ tint, dark = false }: { tint: string; dark?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28"
    >
      <div
        className={`absolute -inset-5 rounded-full blur-xl ${dark ? "opacity-20" : "opacity-25"
          }`}
        style={{
          background: `${tint}35`,
        }}
      />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${tint}40 42%, ${tint}5c 72%, ${tint}73 100%)`,
          boxShadow: `inset -5px -7px 12px ${tint}33, inset 3px 4px 8px rgba(255,255,255,0.75), 0 8px 18px ${tint}25`,
        }}
      />

      <div className="absolute left-[18%] top-[14%] h-4 w-4 rounded-full bg-white/90 blur-[3px]" />
    </div>
  );
}

/* ============================================================
   ROLE PERMISSION EDITOR
============================================================ */

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
  canManageRoles,
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
  saveMessage: SaveMessage;
  canManageRoles: boolean;
}) {
  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  const selectedRoleProtected =
    Boolean(selectedRole?.is_protected) || selectedRole?.name === "god";

  const toggleGroup = (permissions: string[]) => {
    if (!canManageRoles || selectedRoleProtected) {
      return;
    }

    const selectablePermissions = permissions.filter(
      (permission) => permission !== "all"
    );

    const allSelected =
      selectablePermissions.length > 0 &&
      selectablePermissions.every((permission) =>
        editedPermissions.includes(permission)
      );

    if (allSelected) {
      setTimeout(() => {
        selectablePermissions.forEach((permission) =>
          togglePermission(permission)
        );
      }, 0);
      return;
    }

    const next = new Set(
      editedPermissions.filter((permission) => permission !== "all")
    );

    selectablePermissions.forEach((permission) => next.add(permission));

    selectablePermissions.forEach((permission) => {
      if (!editedPermissions.includes(permission)) {
        togglePermission(permission);
      }
    });
  };

  if (roleLoading || !selectedRole) {
    return (
      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="glass flex min-h-[300px] items-center justify-center p-8"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="icon-ring h-12 w-12">
            <ShieldCheck className="h-5 w-5 animate-pulse" strokeWidth={1.75} />
          </span>

          <div>
            <p className="text-sm font-bold text-brand-900">
              Memuat data role...
            </p>

            <p className="mt-1 text-xs font-medium text-brand-800/55">
              Mengambil konfigurasi akses terbaru.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        delay: 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="glass overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-brand-800/8 px-6 py-5 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="icon-ring h-10 w-10 flex-shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>

          <div>
            <p className="micro-label">RBAC</p>

            <h2 className="text-base font-bold tracking-[-0.02em] text-brand-900">
              Edit Role & Permission
            </h2>

            <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-brand-800/55">
              Atur fitur dan akses yang dapat digunakan oleh setiap role pada
              platform.
            </p>
          </div>
        </div>

        <label className="w-full lg:w-[240px]">
          <span className="mb-1.5 block text-2xs font-bold uppercase tracking-[0.14em] text-brand-800/55">
            Role
          </span>

          <select
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            className="glass-input w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canManageRoles}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name === "god" ? "God · Protected" : role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Protected notice */}
      {selectedRoleProtected && (
        <div className="flex items-start gap-3 border-b border-violet-200/50 bg-violet-50/70 px-6 py-4 sm:px-7">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-700"
            strokeWidth={1.75}
          />

          <div>
            <p className="text-xs font-bold text-violet-800">
              Protected System Role
            </p>

            <p className="mt-1 text-xs font-medium leading-5 text-violet-700/70">
              Role God memiliki akses penuh dan tidak dapat diedit dari Admin
              Panel.
            </p>
          </div>
        </div>
      )}

      {/* Permission Groups */}
      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        {permissionGroups.map((group, index) => {
          const groupKeys = group.permissions.map(
            (permission) => permission.key
          );

          const selectableKeys = groupKeys.filter((key) => key !== "all");

          const allSelected =
            editedPermissions.includes("all") ||
            (selectableKeys.length > 0 &&
              selectableKeys.every((permission) =>
                editedPermissions.includes(permission)
              ));

          return (
            <motion.div
              key={group.title}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
                delay: 0.12 + index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-2xl border border-brand-800/8 bg-white/55 p-4 transition-all duration-200 hover:bg-white/75 hover:shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-3 border-b border-brand-800/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-900">
                    {group.title}
                  </p>

                  {group.description && (
                    <p className="mt-0.5 text-xs font-medium text-brand-800/50">
                      {group.description}
                    </p>
                  )}
                </div>

                <label
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-2xs font-bold ${canManageRoles && !selectedRoleProtected
                      ? "cursor-pointer bg-brand-50 text-brand-800 transition hover:bg-brand-100"
                      : "cursor-not-allowed bg-brand-50/50 text-brand-800/35"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={
                      !canManageRoles ||
                      selectedRoleProtected ||
                      selectableKeys.length === 0
                    }
                    onChange={() => toggleGroup(groupKeys)}
                    className="h-3.5 w-3.5 accent-[#123c28]"
                  />
                  Pilih Semua
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {group.permissions.map((permission) => {
                  const isAll = permission.key === "all";

                  const checked =
                    editedPermissions.includes(permission.key) ||
                    editedPermissions.includes("all");

                  const disabled =
                    !canManageRoles || selectedRoleProtected || isAll;

                  return (
                    <label
                      key={permission.key}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${disabled
                          ? "cursor-not-allowed opacity-55"
                          : "cursor-pointer"
                        } ${checked
                          ? "border-brand-800/10 bg-brand-50/80 text-brand-900"
                          : "border-brand-800/8 bg-white/50 text-brand-800/65 hover:border-brand-800/15 hover:bg-white"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => togglePermission(permission.key)}
                        className="h-3.5 w-3.5 accent-[#123c28]"
                      />

                      <span className="leading-5">{permission.label}</span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4 border-t border-brand-800/8 px-6 py-4 sm:px-7 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold text-brand-900">
            {editedPermissions.includes("all")
              ? "Akses penuh aktif"
              : `${editedPermissions.length} permission aktif`}
          </p>

          <p className="mt-0.5 text-2xs font-medium text-brand-800/45">
            {selectedRoleProtected
              ? "Role ini dilindungi dan tidak dapat diubah."
              : "Perubahan akan diterapkan pada role yang sedang dipilih."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={!canManageRoles}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-800/10 bg-white px-4 py-2.5 text-xs font-bold text-brand-800/70 transition hover:bg-brand-50 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            Batal
          </button>

          <button
            type="button"
            onClick={() => saveRole(selectedRole.id)}
            disabled={!canManageRoles || selectedRoleProtected}
            className="btn-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2} />
            Simpan Role
          </button>
        </div>
      </div>

      {saveMessage?.id === selectedRole.id && (
        <div
          className={`border-t px-6 py-3.5 text-xs font-bold sm:px-7 ${saveMessage.type === "success"
              ? "border-[#91b928]/15 bg-[#f3f8e2] text-[#4a5f0e]"
              : "border-red-200 bg-red-50 text-red-600"
            }`}
        >
          {saveMessage.text}
        </div>
      )}
    </motion.section>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AdminPage() {
  const router = useRouter();

  const { user, isLoading: authLoading, hasPermission } = useUserRole();

  const canManageRoles = hasPermission("manage_roles");

  const canManagePricing = hasPermission("manage_pricing");

  const canOpenAdminPanel = canManageRoles || canManagePricing;

  const [activeTab, setActiveTab] = useState<"roles" | "pricing">("roles");

  /* ==========================================================
     ROLES
  ========================================================== */

  const [roles, setRoles] = useState<Role[]>([]);

  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
    []
  );

  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  const [roleLoading, setRoleLoading] = useState(false);

  const [roleSaveMsg, setRoleSaveMsg] = useState<SaveMessage>(null);

  /* ==========================================================
     PRICING
  ========================================================== */

  const [plans, setPlans] = useState<Plan[]>([]);

  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const [editedPrice, setEditedPrice] = useState("0");

  const [editedFeatures, setEditedFeatures] = useState("");

  const [planSaveMsg, setPlanSaveMsg] = useState<PlanSaveMessage>(null);

  /* ==========================================================
     AUTH GUARD
  ========================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canOpenAdminPanel) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, canOpenAdminPanel, router]);

  /* ==========================================================
     DEFAULT TAB
  ========================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canManageRoles && canManagePricing) {
      setActiveTab("pricing");
    }

    if (canManageRoles) {
      setActiveTab("roles");
    }
  }, [authLoading, canManageRoles, canManagePricing]);

  /* ==========================================================
     FETCH ROLES
  ========================================================== */

  useEffect(() => {
    if (authLoading || !user || !canManageRoles) {
      return;
    }

    let cancelled = false;

    setRoleLoading(true);

    Promise.all([
      api.get<Role[]>("/admin/roles"),

      api.get<PermissionGroup[]>("/admin/permission-catalog"),
    ])
      .then(([roleResponse, permissionResponse]) => {
        if (cancelled) {
          return;
        }

        const fetchedRoles = roleResponse.data;

        setRoles(fetchedRoles);

        setPermissionGroups(permissionResponse.data);

        if (fetchedRoles.length === 0) {
          return;
        }

        const editableRole = fetchedRoles.find(
          (role) => !role.is_protected && role.name !== "god"
        );

        const firstRole = editableRole || fetchedRoles[0];

        setSelectedRoleId(firstRole.id);

        setEditedPermissions(firstRole.permissions || []);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setRoles([]);
        setPermissionGroups([]);
      })
      .finally(() => {
        if (!cancelled) {
          setRoleLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, canManageRoles]);

  /* ==========================================================
     FETCH PLANS
  ========================================================== */

  useEffect(() => {
    if (authLoading || !user || !canManagePricing) {
      return;
    }

    let cancelled = false;

    api
      .get<Plan[]>("/admin/plans")
      .then(({ data }) => {
        if (!cancelled) {
          setPlans(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlans([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, canManagePricing]);

  /* ==========================================================
     ROLE HELPERS
  ========================================================== */

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId]
  );

  const startEditRole = (role: Role) => {
    setSelectedRoleId(role.id);

    setEditedPermissions(role.permissions || []);
  };

  const togglePermission = (permission: string) => {
    if (
      permission === "all" ||
      !canManageRoles ||
      selectedRole?.is_protected ||
      selectedRole?.name === "god"
    ) {
      return;
    }

    setEditedPermissions((previous) => {
      const exists = previous.includes(permission);

      if (exists) {
        return previous.filter((item) => item !== permission);
      }

      return [...previous.filter((item) => item !== "all"), permission];
    });
  };

  const saveRole = async (roleId: string) => {
    if (!canManageRoles) {
      return;
    }

    const role = roles.find((item) => item.id === roleId);

    if (!role || role.is_protected || role.name === "god") {
      setRoleSaveMsg({
        id: roleId,
        type: "error",
        text: "Protected system role tidak dapat diubah.",
      });

      return;
    }

    try {
      const permissions = editedPermissions.filter(
        (permission) => permission !== "all"
      );

      const { data } = await api.put<Role>(`/admin/roles/${roleId}`, {
        permissions,
      });

      setRoles((previous) =>
        previous.map((item) => (item.id === roleId ? data : item))
      );

      setEditedPermissions(data.permissions || []);

      setRoleSaveMsg({
        id: roleId,
        type: "success",
        text: "Role berhasil diperbarui.",
      });

      window.setTimeout(() => setRoleSaveMsg(null), 3000);
    } catch (error: any) {
      setRoleSaveMsg({
        id: roleId,
        type: "error",
        text: error.response?.data?.detail || "Gagal menyimpan role.",
      });
    }
  };

  /* ==========================================================
     PLAN HELPERS
  ========================================================== */

  const startEditPlan = (plan: Plan) => {
    setEditingPlan(plan.id);

    setEditedPrice(plan.price.toString());

    setEditedFeatures(plan.features?.join("\n") || "");
  };

  const savePlan = async (planId: string) => {
    if (!canManagePricing) {
      return;
    }

    try {
      const features = editedFeatures
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean);

      const { data } = await api.put<Plan>(`/admin/plans/${planId}`, {
        price: Number(editedPrice) || 0,

        features,
      });

      setPlans((previous) =>
        previous.map((plan) => (plan.id === planId ? data : plan))
      );

      setEditingPlan(null);

      setPlanSaveMsg({
        type: "success",
        text: "Harga paket berhasil diperbarui.",
      });

      window.setTimeout(() => setPlanSaveMsg(null), 3000);
    } catch (error: any) {
      setPlanSaveMsg({
        type: "error",
        text: error.response?.data?.detail || "Gagal menyimpan harga.",
      });
    }
  };

  /* ==========================================================
     RENDER GUARD
  ========================================================== */

  if (authLoading || !user || !canOpenAdminPanel) {
    return null;
  }

  /* ==========================================================
     AVAILABLE TABS
  ========================================================== */

  const showRolesTab = canManageRoles;

  const showPricingTab = canManagePricing;

  return (
    <main className="min-h-screen bg-page text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-brand-900 sm:text-4xl">
                Admin <span className="text-brand-600">Panel</span>
              </h1>


            </div>

            <span className="liquid-badge px-4 py-2 text-xs font-bold text-brand-800">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />

              {user.role === "god" ? "God · Protected" : "Administrator"}
            </span>
          </div>
        </motion.header>

        {/* ==================================================
            TABS
        =================================================== */}

        {(showRolesTab || showPricingTab) && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-1 rounded-full border border-brand-800/10 bg-white/70 p-1 shadow-sm">
              {showRolesTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab("roles")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "roles"
                      ? "bg-brand-800 text-white shadow-sm"
                      : "text-brand-800/60 hover:text-brand-900"
                    }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Manajemen Role
                </button>
              )}

              {showPricingTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab("pricing")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all ${activeTab === "pricing"
                      ? "bg-brand-800 text-white shadow-sm"
                      : "text-brand-800/60 hover:text-brand-900"
                    }`}
                >
                  <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Harga Subscription
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================================================
            ROLE MANAGEMENT
        =================================================== */}

        {activeTab === "roles" && showRolesTab && (
          <RolePermissionEditor
            roles={roles}
            permissionGroups={permissionGroups}
            roleLoading={roleLoading}
            selectedRoleId={selectedRoleId}
            setSelectedRoleId={(roleId) => {
              const role = roles.find((item) => item.id === roleId);

              if (role) {
                startEditRole(role);
              }
            }}
            editedPermissions={editedPermissions}
            togglePermission={togglePermission}
            saveRole={saveRole}
            cancelEdit={() => {
              if (selectedRole) {
                startEditRole(selectedRole);
              }
            }}
            saveMessage={roleSaveMsg}
            canManageRoles={canManageRoles}
          />
        )}

        {/* ==================================================
            PRICING MANAGEMENT
        =================================================== */}

        {activeTab === "pricing" && showPricingTab && (
          <div>
            {planSaveMsg && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className={`mb-5 flex items-start gap-3 rounded-2xl border px-5 py-4 text-xs font-bold ${planSaveMsg.type === "success"
                    ? "border-[#91b928]/25 bg-[#f3f8e2] text-[#4a5f0e]"
                    : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                {planSaveMsg.type === "success" ? (
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    strokeWidth={2}
                  />
                ) : (
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                )}

                <span>{planSaveMsg.text}</span>
              </motion.div>
            )}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mb-5 flex items-center gap-2.5"
            >
              <span className="icon-ring h-9 w-9">
                <CreditCard className="h-4 w-4" strokeWidth={1.75} />
              </span>

              <div>
                <p className="micro-label">Subscription</p>

                <h2 className="text-base font-bold tracking-[-0.02em] text-brand-900">
                  Konfigurasi Harga & Fitur
                </h2>
              </div>
            </motion.div>

            {plans.length === 0 ? (
              <motion.section
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="glass mb-6 px-6 py-16 text-center"
              >
                <span className="icon-ring mx-auto h-12 w-12">
                  <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                </span>

                <h3 className="mt-4 text-sm font-bold text-brand-900">
                  Belum ada paket
                </h3>

                <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-5 text-brand-800/55">
                  Data paket subscription belum tersedia dari server.
                </p>
              </motion.section>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {plans.map((plan, index) => {
                  const style = getTierStyle(plan.tier);

                  const isEditing = editingPlan === plan.id;

                  const isPopular = plan.tier === "desa";

                  return (
                    <motion.article
                      key={plan.id}
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: 0.1 + index * 0.07,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{
                        y: isEditing ? 0 : -3,
                      }}
                      className={`group relative flex min-h-[440px] flex-col overflow-hidden rounded-3xl p-6 transition-shadow duration-300 ${isPopular
                          ? "bg-brand-800 text-white shadow-card-hover"
                          : "glass text-brand-900 hover:shadow-card-hover"
                        }`}
                    >
                      <AdminOrb tint={style.orbTint} dark={isPopular} />

                      <div className="relative mb-7 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-bold ${isPopular
                              ? "bg-[#91b928] text-brand-900"
                              : `${style.bg} ${style.text}`
                            }`}
                        >
                          {style.icon}

                          <span className="capitalize">{plan.tier}</span>
                        </span>

                        {isPopular && (
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-white">
                            Populer
                          </span>
                        )}
                      </div>

                      <div className="relative mb-6">
                        <p
                          className={`micro-label ${isPopular ? "text-white/50" : ""
                            }`}
                        >
                          Harga / Bulan
                        </p>

                        {isEditing ? (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`text-sm font-bold ${isPopular
                                  ? "text-white/65"
                                  : "text-brand-800/55"
                                }`}
                            >
                              Rp
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={editedPrice}
                              onChange={(event) =>
                                setEditedPrice(event.target.value)
                              }
                              className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-lg font-bold outline-none ${isPopular
                                  ? "border-white/15 bg-white/10 text-white placeholder:text-white/30 focus:border-white/30"
                                  : "border-brand-800/10 bg-white text-brand-900 focus:border-brand-800/25"
                                }`}
                            />
                          </div>
                        ) : (
                          <p
                            className={`mt-1 text-3xl font-bold tracking-[-0.04em] ${isPopular ? "text-white" : "text-brand-900"
                              }`}
                          >
                            {plan.price === 0
                              ? "Gratis"
                              : `Rp ${plan.price.toLocaleString("id-ID")}`}
                          </p>
                        )}
                      </div>

                      <div
                        className={`border-t ${isPopular ? "border-white/12" : "border-brand-800/8"
                          }`}
                      />

                      <div className="relative flex-1 py-6">
                        <p
                          className={`micro-label ${isPopular ? "text-white/50" : ""
                            }`}
                        >
                          Fitur Termasuk
                        </p>

                        {isEditing ? (
                          <textarea
                            value={editedFeatures}
                            onChange={(event) =>
                              setEditedFeatures(event.target.value)
                            }
                            rows={7}
                            placeholder="Satu fitur per baris..."
                            className={`mt-4 w-full resize-none rounded-2xl border px-3.5 py-3 text-xs font-medium leading-5 outline-none ${isPopular
                                ? "border-white/15 bg-white/10 text-white placeholder:text-white/35 focus:border-white/30"
                                : "border-brand-800/10 bg-white text-brand-900 focus:border-brand-800/25"
                              }`}
                          />
                        ) : plan.features?.length ? (
                          <ul className="mt-4 space-y-3">
                            {plan.features.map((feature, featureIndex) => (
                              <li
                                key={`${feature}-${featureIndex}`}
                                className="flex items-start gap-3"
                              >
                                <span
                                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${isPopular
                                      ? "bg-white/10 text-[#91b928]"
                                      : "bg-brand-50 text-brand-700"
                                    }`}
                                >
                                  <Check
                                    className="h-3.5 w-3.5"
                                    strokeWidth={2}
                                  />
                                </span>

                                <span
                                  className={`text-xs font-medium leading-5 ${isPopular
                                      ? "text-white/80"
                                      : "text-brand-900"
                                    }`}
                                >
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p
                            className={`mt-4 rounded-2xl border border-dashed px-4 py-5 text-center text-xs font-medium ${isPopular
                                ? "border-white/15 text-white/45"
                                : "border-brand-800/10 text-brand-800/45"
                              }`}
                          >
                            Belum ada fitur.
                          </p>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="relative flex gap-2">
                          <button
                            type="button"
                            onClick={() => savePlan(plan.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-0.5 ${isPopular
                                ? "bg-white text-brand-900 hover:bg-[#dfeeb1]"
                                : "bg-brand-800 text-white hover:bg-brand-700"
                              }`}
                          >
                            <Save className="h-3.5 w-3.5" strokeWidth={2} />
                            Simpan
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingPlan(null)}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${isPopular
                                ? "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                                : "border-brand-800/10 bg-white text-brand-800/60 hover:bg-brand-50 hover:text-brand-900"
                              }`}
                            aria-label="Batal edit"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditPlan(plan)}
                          className={`relative inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-0.5 ${isPopular
                              ? "bg-white text-brand-900 hover:bg-[#dfeeb1]"
                              : "border border-brand-800/10 bg-white text-brand-900 hover:bg-brand-50"
                            }`}
                        >
                          <Edit3 className="h-3.5 w-3.5" strokeWidth={1.9} />
                          Edit Harga & Fitur
                        </button>
                      )}
                    </motion.article>
                  );
                })}
              </div>
            )}

            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-5 flex items-start gap-3 rounded-3xl border border-[#d99a2b]/20 bg-[#fdf5e5] p-5"
            >
              <span className="icon-ring h-9 w-9 flex-shrink-0 text-[#8a5a06]">
                <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
              </span>

              <div>
                <p className="text-sm font-bold text-[#8a5a06]">
                  Mode Simulasi Aktif
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-[#8a5a06]/75">
                  Platform ini berjalan tanpa payment gateway. Perubahan harga
                  di sini akan disimpan ke database dan mempengaruhi tampilan
                  halaman Langganan.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
