"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Edit3,
  Layers,
  Lock,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";

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
   CONSTANTS
============================================================ */

const ICON_STROKE = 1.75;

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE,
    },
  },
};

const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: EASE,
    },
  },
};

/* ============================================================
   ICON HELPERS
============================================================ */

const TIER_ICONS: Record<string, ReactElement> = {
  free: <Layers className="h-4 w-4" strokeWidth={ICON_STROKE} />,
  desa: <Users className="h-4 w-4" strokeWidth={ICON_STROKE} />,
  kecamatan: <Crown className="h-4 w-4" strokeWidth={ICON_STROKE} />,
};

function getTierIcon(tier: string) {
  return (
    TIER_ICONS[tier] ?? <Layers className="h-4 w-4" strokeWidth={ICON_STROKE} />
  );
}

/* ============================================================
   MICRO UI
============================================================ */

function AnimatedIcon({
  icon: Icon,
  active = false,
  size = "normal",
}: {
  icon: LucideIcon;
  active?: boolean;
  size?: "small" | "normal" | "large";
}) {
  const sizeMap = {
    small: "h-3.5 w-3.5",
    normal: "h-4 w-4",
    large: "h-5 w-5",
  };

  return (
    <motion.span
      animate={{
        rotate: active ? 0 : 0,
        scale: active ? 1 : 1,
      }}
      whileHover={{
        rotate: -6,
        scale: 1.08,
      }}
      transition={{
        duration: 0.22,
        ease: EASE,
      }}
      className="inline-flex"
    >
      <Icon className={sizeMap[size]} strokeWidth={ICON_STROKE} />
    </motion.span>
  );
}

function SectionMarker({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      <motion.div
        whileHover={{
          y: -2,
          rotate: -3,
        }}
        transition={{
          duration: 0.22,
          ease: EASE,
        }}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-[#DCDDD8] bg-white"
      >
        <AnimatedIcon icon={icon} />
      </motion.div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#858780]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-base font-bold tracking-[-0.02em] text-[#171717]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-[#6B6B66]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function WireframeDecoration({
  variant = "grid",
  dark = false,
}: {
  variant?: "grid" | "cube" | "layers";
  dark?: boolean;
}) {
  const stroke = dark ? "rgba(255,255,255,0.12)" : "rgba(23,23,23,0.10)";

  if (variant === "cube") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 240 180"
        className="pointer-events-none absolute right-0 top-0 h-full w-[260px] opacity-70"
      >
        <g fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="square">
          <path d="M100 34L176 58L140 86L64 62Z" />
          <path d="M64 62L64 122L140 148L140 86Z" />
          <path d="M140 86L176 58L176 116L140 148Z" />

          <path d="M82 54L158 78L122 106L46 82Z" />
          <path d="M46 82L46 106L122 132L122 106Z" />
          <path d="M122 106L158 78L158 102L122 132Z" />
        </g>
      </svg>
    );
  }

  if (variant === "layers") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 260 180"
        className="pointer-events-none absolute right-0 top-0 h-full w-[280px] opacity-65"
      >
        <g fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="square">
          <path d="M45 54L127 30L216 60L130 88Z" />
          <path d="M45 76L127 52L216 82L130 110Z" />
          <path d="M45 98L127 74L216 104L130 132Z" />
          <path d="M45 120L127 96L216 126L130 154Z" />

          <path d="M128 30L128 154" />
          <path d="M216 60L216 126" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 320 180"
      className="pointer-events-none absolute right-0 top-0 h-full w-[340px] opacity-55"
    >
      <g fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="square">
        {Array.from({ length: 8 }).map((_, index) => (
          <path key={`h-${index}`} d={`M60 ${28 + index * 18}H300`} />
        ))}

        {Array.from({ length: 10 }).map((_, index) => (
          <path key={`v-${index}`} d={`M${72 + index * 24} 20V170`} />
        ))}
      </g>
    </svg>
  );
}

/* ============================================================
   ROLE WORKSPACE
============================================================ */

function RoleWorkspace({
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

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    setExpandedGroups(permissionGroups.map((group) => group.title));
  }, [permissionGroups]);

  const activePermissionCount = editedPermissions.filter(
    (permission) => permission !== "all"
  ).length;

  const toggleGroup = (group: PermissionGroup) => {
    if (!canManageRoles || selectedRoleProtected) {
      return;
    }

    const keys = group.permissions
      .map((permission) => permission.key)
      .filter((key) => key !== "all");

    const allSelected =
      keys.length > 0 && keys.every((key) => editedPermissions.includes(key));

    const next = new Set(
      editedPermissions.filter((permission) => permission !== "all")
    );

    if (allSelected) {
      keys.forEach((key) => next.delete(key));
    } else {
      keys.forEach((key) => next.add(key));
    }

    const nextPermissions = [...next];

    if (
      nextPermissions.length ===
      permissionGroups.reduce(
        (total, currentGroup) =>
          total +
          currentGroup.permissions.filter(
            (permission) => permission.key !== "all"
          ).length,
        0
      )
    ) {
      nextPermissions.unshift("all");
    }

    // Direct state update through each permission is intentionally avoided
    // because togglePermission protects system roles.
    keys.forEach((key) => {
      const shouldBeSelected = next.has(key);
      const isSelected = editedPermissions.includes(key);

      if (shouldBeSelected !== isSelected) {
        togglePermission(key);
      }
    });
  };

  const toggleGroupExpanded = (title: string) => {
    setExpandedGroups((previous) =>
      previous.includes(title)
        ? previous.filter((item) => item !== title)
        : [...previous, title]
    );
  };

  if (roleLoading || !selectedRole) {
    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="border border-[#DCDDD8] bg-white"
      >
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
              }}
              className="mx-auto flex h-12 w-12 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]"
            >
              <ShieldCheck
                className="h-5 w-5 text-[#33332F]"
                strokeWidth={ICON_STROKE}
              />
            </motion.div>

            <p className="mt-4 text-sm font-bold text-[#171717]">
              Memuat workspace...
            </p>

            <p className="mt-1 text-xs font-medium text-[#858780]">
              Mengambil konfigurasi akses terbaru.
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="border border-[#DCDDD8] bg-white"
    >
      {/* Workspace top bar */}
      <div className="relative overflow-hidden border-b border-[#DCDDD8] bg-[#FBFBF9]">
        <WireframeDecoration variant="grid" />

        <div className="relative flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionMarker
            eyebrow=""
            title="Role & Permission Matrix"
            description="Pilih role di sebelah kiri, lalu atur capability yang tersedia untuk role tersebut."
            icon={ShieldCheck}
          />

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#858780]">
                Active Permissions
              </p>

              <motion.p
                key={activePermissionCount}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#171717]"
              >
                {activePermissionCount}
              </motion.p>
            </div>

            <div className="h-8 w-px bg-[#DCDDD8]" />

            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#858780]">
                Groups
              </p>

              <p className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#171717]">
                {permissionGroups.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid min-h-[620px] lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Role rail */}
        <aside className="border-b border-[#DCDDD8] bg-[#F7F8F5] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#DCDDD8] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mt-1 text-xs font-medium text-[#6B6B66]">
                  {roles.length} Role{roles.length === 1 ? "" : "s"} Terdaftar
                </p>
              </div>

              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.25 }}
                className="flex h-8 w-8 items-center justify-center border border-[#DCDDD8] bg-white"
              >
                <Settings2
                  className="h-3.5 w-3.5 text-[#6B6B66]"
                  strokeWidth={ICON_STROKE}
                />
              </motion.div>
            </div>
          </div>

          <div className="p-3">
            <div className="space-y-1">
              {roles.map((role, index) => {
                const active = role.id === selectedRole.id;

                const protectedRole =
                  Boolean(role.is_protected) || role.name === "god";

                return (
                  <motion.button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    disabled={!canManageRoles}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.04,
                      ease: EASE,
                    }}
                    whileHover={
                      canManageRoles
                        ? {
                            x: 2,
                          }
                        : undefined
                    }
                    className={`group relative flex w-full items-center justify-between border px-3.5 py-3 text-left transition-colors ${
                      active
                        ? "border-[#CFCFC8] bg-white"
                        : "border-transparent hover:border-[#DCDDD8] hover:bg-white"
                    } ${
                      !canManageRoles
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeRoleIndicator"
                        className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#76B900]"
                        transition={{
                          duration: 0.3,
                          ease: EASE,
                        }}
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <motion.span
                        animate={{
                          scale: active ? 1 : 0.94,
                          rotate: active ? 0 : 0,
                        }}
                        whileHover={{
                          rotate: -6,
                          scale: 1.06,
                        }}
                        className={`flex h-9 w-9 items-center justify-center border ${
                          active
                            ? "border-[#DCDDD8] bg-[#F4F5F2]"
                            : "border-[#E1E1DC] bg-white"
                        }`}
                      >
                        {protectedRole ? (
                          <ShieldCheck
                            className={`h-4 w-4 ${
                              active ? "text-[#171717]" : "text-[#858780]"
                            }`}
                            strokeWidth={ICON_STROKE}
                          />
                        ) : (
                          <Users
                            className={`h-4 w-4 ${
                              active ? "text-[#171717]" : "text-[#858780]"
                            }`}
                            strokeWidth={ICON_STROKE}
                          />
                        )}
                      </motion.span>

                      <div>
                        <p
                          className={`text-xs font-bold ${
                            active ? "text-[#171717]" : "text-[#33332F]"
                          }`}
                        >
                          {role.name}
                        </p>

                        <p className="mt-0.5 text-[10px] font-medium text-[#858780]">
                          {role.permissions?.length || 0} permissions
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        active
                          ? "translate-x-0 text-[#171717]"
                          : "-translate-x-1 text-[#B1B2AC] group-hover:translate-x-0"
                      }`}
                      strokeWidth={1.75}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#DCDDD8] px-5 py-4">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center border border-[#DCDDD8] bg-white">
                <Lock
                  className="h-3.5 w-3.5 text-[#6B6B66]"
                  strokeWidth={ICON_STROKE}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#33332F]">
                  Protected roles
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-[#858780]">
                  System role tertentu dikunci dan tidak dapat diedit.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Permission workspace */}
        <div className="min-w-0">
          <div className="flex flex-col border-b border-[#DCDDD8] px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#171717]">
                  {selectedRole.name}
                </h3>

                {selectedRoleProtected && (
                  <span className="inline-flex items-center gap-1 border border-[#DCDDD8] bg-[#F4F5F2] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#6B6B66]">
                    <ShieldCheck
                      className="h-3 w-3"
                      strokeWidth={ICON_STROKE}
                    />
                    Protected
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 md:mt-0">
              <div className="h-1.5 w-1.5 bg-[#76B900]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B6B66]">
                Configuration Mode
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid gap-3 xl:grid-cols-2">
              {permissionGroups.map((group, index) => {
                const expanded = expandedGroups.includes(group.title);

                const selectableKeys = group.permissions
                  .map((permission) => permission.key)
                  .filter((key) => key !== "all");

                const allSelected =
                  selectableKeys.length > 0 &&
                  selectableKeys.every((key) =>
                    editedPermissions.includes(key)
                  );

                const selectedCount = selectableKeys.filter((key) =>
                  editedPermissions.includes(key)
                ).length;

                return (
                  <motion.div
                    key={group.title}
                    variants={staggerItem}
                    initial="hidden"
                    animate="visible"
                    transition={{
                      delay: index * 0.045,
                    }}
                    className={`border bg-white transition-colors ${
                      expanded ? "border-[#CFCFC8]" : "border-[#DCDDD8]"
                    }`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleGroupExpanded(group.title)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleGroupExpanded(group.title);
                        }
                      }}
                      className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <motion.span
                            animate={{
                              rotate: expanded ? 0 : -90,
                            }}
                            transition={{
                              duration: 0.22,
                              ease: EASE,
                            }}
                            className="flex h-6 w-6 items-center justify-center bg-[#F4F5F2]"
                          >
                            <ChevronRight
                              className="h-3.5 w-3.5 text-[#6B6B66]"
                              strokeWidth={1.75}
                            />
                          </motion.span>

                          <div>
                            <p className="text-sm font-bold text-[#171717]">
                              {group.title}
                            </p>

                            {group.description && (
                              <p className="mt-0.5 text-[10px] font-medium text-[#858780]">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#858780]">
                          {selectedCount}/{selectableKeys.length}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleGroup(group);
                          }}
                          disabled={!canManageRoles || selectedRoleProtected}
                          className={`hidden border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] sm:inline-flex ${
                            allSelected
                              ? "border-[#CFCFC8] bg-[#F4F5F2] text-[#33332F]"
                              : "border-[#DCDDD8] bg-white text-[#6B6B66] hover:bg-[#F4F5F2]"
                          } ${
                            !canManageRoles || selectedRoleProtected
                              ? "cursor-not-allowed opacity-40"
                              : ""
                          }`}
                        >
                          {allSelected ? "Clear" : "All"}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{
                            height: 0,
                            opacity: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                          }}
                          transition={{
                            duration: 0.26,
                            ease: EASE,
                          }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#DCDDD8] p-3">
                            <div className="grid gap-2">
                              {group.permissions.map((permission) => {
                                const isAll = permission.key === "all";

                                const checked =
                                  editedPermissions.includes(permission.key) ||
                                  editedPermissions.includes("all");

                                const disabled =
                                  !canManageRoles ||
                                  selectedRoleProtected ||
                                  isAll;

                                return (
                                  <motion.label
                                    key={permission.key}
                                    whileHover={
                                      !disabled
                                        ? {
                                            x: 2,
                                          }
                                        : undefined
                                    }
                                    className={`group/permission flex items-center justify-between border px-3 py-3 transition-colors ${
                                      disabled
                                        ? "cursor-not-allowed border-[#E9E9E5] bg-[#F7F8F5] opacity-60"
                                        : checked
                                        ? "cursor-pointer border-[#CFCFC8] bg-[#F3F5EF]"
                                        : "cursor-pointer border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
                                    }`}
                                  >
                                    <span className="flex items-center gap-3">
                                      <span
                                        className={`relative flex h-5 w-5 items-center justify-center border ${
                                          checked
                                            ? "border-[#171717] bg-[#171717]"
                                            : "border-[#C7C8C2] bg-white"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={disabled}
                                          onChange={() =>
                                            togglePermission(permission.key)
                                          }
                                          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                                        />

                                        <AnimatePresence>
                                          {checked && (
                                            <motion.div
                                              initial={{
                                                opacity: 0,
                                                scale: 0.5,
                                              }}
                                              animate={{
                                                opacity: 1,
                                                scale: 1,
                                              }}
                                              exit={{
                                                opacity: 0,
                                                scale: 0.5,
                                              }}
                                            >
                                              <Check
                                                className="h-3 w-3 text-white"
                                                strokeWidth={2.5}
                                              />
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </span>

                                      <span
                                        className={`text-xs font-semibold ${
                                          checked
                                            ? "text-[#171717]"
                                            : "text-[#6B6B66]"
                                        }`}
                                      >
                                        {permission.label}
                                      </span>
                                    </span>

                                    <motion.span
                                      animate={{
                                        opacity: checked ? 1 : 0.35,
                                        scale: checked ? 1 : 0.9,
                                      }}
                                    >
                                      <ChevronRight
                                        className="h-3.5 w-3.5 text-[#858780]"
                                        strokeWidth={1.75}
                                      />
                                    </motion.span>
                                  </motion.label>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Action dock */}
          <div className="sticky bottom-0 z-20 border-t border-[#DCDDD8] bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]">
                  <Settings2
                    className="h-3.5 w-3.5 text-[#6B6B66]"
                    strokeWidth={ICON_STROKE}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#171717]">
                    {selectedRoleProtected
                      ? "Protected role"
                      : `${activePermissionCount} permission aktif`}
                  </p>

                  <p className="mt-0.5 text-[10px] font-medium text-[#858780]">
                    {selectedRoleProtected
                      ? "Konfigurasi role ini dikunci oleh sistem."
                      : "Perubahan belum tersimpan sampai tombol simpan ditekan."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={cancelEdit}
                  disabled={!canManageRoles}
                  whileHover={
                    canManageRoles
                      ? {
                          x: -2,
                        }
                      : undefined
                  }
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="inline-flex items-center justify-center gap-1.5 border border-[#DCDDD8] bg-white px-4 py-2.5 text-xs font-bold text-[#6B6B66] transition-colors hover:bg-[#F4F5F2] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw
                    className="h-3.5 w-3.5"
                    strokeWidth={ICON_STROKE}
                  />
                  Reset
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => saveRole(selectedRole.id)}
                  disabled={!canManageRoles || selectedRoleProtected}
                  whileHover={
                    !selectedRoleProtected && canManageRoles
                      ? {
                          y: -2,
                        }
                      : undefined
                  }
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#171717] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <motion.span
                    whileHover={{
                      rotate: -8,
                    }}
                  >
                    <Save className="h-3.5 w-3.5" strokeWidth={2} />
                  </motion.span>
                  Simpan Perubahan
                </motion.button>
              </div>
            </div>
          </div>

          {/* Save feedback */}
          <AnimatePresence>
            {saveMessage?.id === selectedRole.id && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                className={`overflow-hidden border-t ${
                  saveMessage.type === "success"
                    ? "border-[#D7E6B7] bg-[#F4F8EB]"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2.5 px-5 py-3 text-xs font-bold sm:px-6">
                  {saveMessage.type === "success" ? (
                    <Check
                      className="h-4 w-4 flex-shrink-0 text-[#5D762C]"
                      strokeWidth={2}
                    />
                  ) : (
                    <AlertTriangle
                      className="h-4 w-4 flex-shrink-0 text-red-700"
                      strokeWidth={ICON_STROKE}
                    />
                  )}

                  <span
                    className={
                      saveMessage.type === "success"
                        ? "text-[#5D762C]"
                        : "text-red-700"
                    }
                  >
                    {saveMessage.text}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}

/* ============================================================
   PRICING WORKSPACE
============================================================ */

function PricingWorkspace({
  plans,
  editingPlan,
  editedPrice,
  editedFeatures,
  setEditedPrice,
  setEditedFeatures,
  startEditPlan,
  savePlan,
  setEditingPlan,
  planSaveMsg,
  canManagePricing,
}: {
  plans: Plan[];
  editingPlan: string | null;
  editedPrice: string;
  editedFeatures: string;
  setEditedPrice: (value: string) => void;
  setEditedFeatures: (value: string) => void;
  startEditPlan: (plan: Plan) => void;
  savePlan: (planId: string) => Promise<void>;
  setEditingPlan: (id: string | null) => void;
  planSaveMsg: PlanSaveMessage;
  canManagePricing: boolean;
}) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const sortedPlans = useMemo(() => {
    const order = ["free", "desa", "kecamatan"];

    return [...plans].sort((a, b) => {
      return order.indexOf(a.tier) - order.indexOf(b.tier);
    });
  }, [plans]);

  return (
    <div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-5 border border-[#DCDDD8] bg-white"
      >
        <div className="relative overflow-hidden">
          <WireframeDecoration variant="layers" />

          <div className="relative flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionMarker
              eyebrow=""
              title="Pricing Control Center"
              description="Kelola harga dan feature set yang ditampilkan pada halaman subscription."
              icon={CreditCard}
            />

            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-px bg-[#DCDDD8] sm:block" />

              <div className="hidden max-w-[180px] sm:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780]">
                  Pricing Mode
                </p>

                <p className="mt-1 text-xs font-semibold text-[#33332F]">
                  Database driven
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {planSaveMsg && (
        <motion.div
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={`mb-5 flex items-center gap-3 border px-4 py-3 text-xs font-bold ${
            planSaveMsg.type === "success"
              ? "border-[#D7E6B7] bg-[#F4F8EB] text-[#5D762C]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {planSaveMsg.type === "success" ? (
            <Check className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
          ) : (
            <AlertTriangle
              className="h-4 w-4 flex-shrink-0"
              strokeWidth={ICON_STROKE}
            />
          )}

          {planSaveMsg.text}
        </motion.div>
      )}

      {plans.length === 0 ? (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="border border-[#DCDDD8] bg-white px-6 py-20 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]">
            <CreditCard
              className="h-5 w-5 text-[#33332F]"
              strokeWidth={ICON_STROKE}
            />
          </div>

          <h3 className="mt-4 text-sm font-bold text-[#171717]">
            Belum ada paket
          </h3>

          <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-5 text-[#6B6B66]">
            Data paket subscription belum tersedia dari server.
          </p>
        </motion.section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {sortedPlans.map((plan, index) => {
              const isEditing = editingPlan === plan.id;
              const isPopular = plan.tier === "desa";
              const isHovered = hoveredPlan === plan.id;

              return (
                <motion.article
                  key={plan.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  transition={{
                    delay: index * 0.07,
                  }}
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  whileHover={{
                    y: isEditing ? 0 : -5,
                  }}
                  className={`group relative flex min-h-[470px] flex-col overflow-hidden border ${
                    isPopular
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#DCDDD8] bg-white text-[#171717]"
                  }`}
                >
                  <WireframeDecoration
                    variant={
                      index === 0 ? "grid" : index === 1 ? "cube" : "layers"
                    }
                    dark={isPopular}
                  />

                  <div className="relative flex flex-1 flex-col p-6">
                    {/* Plan top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{
                            rotate: isHovered ? -7 : 0,
                            scale: isHovered ? 1.04 : 1,
                          }}
                          transition={{
                            duration: 0.25,
                            ease: EASE,
                          }}
                          className={`flex h-10 w-10 items-center justify-center border ${
                            isPopular
                              ? "border-white/15 bg-white/8"
                              : "border-[#DCDDD8] bg-[#F4F5F2]"
                          }`}
                        >
                          {getTierIcon(plan.tier)}
                        </motion.div>

                        <div>
                          <p
                            className={`text-[9px] font-bold uppercase tracking-[0.15em] ${
                              isPopular ? "text-white/45" : "text-[#858780]"
                            }`}
                          >
                            Plan
                          </p>

                          <h3
                            className={`mt-1 text-base font-bold capitalize ${
                              isPopular ? "text-white" : "text-[#171717]"
                            }`}
                          >
                            {plan.tier}
                          </h3>
                        </div>
                      </div>

                      {isPopular && (
                        <span className="border border-white/15 bg-white/8 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/80">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="relative mt-8">
                      <p
                        className={`text-[9px] font-bold uppercase tracking-[0.15em] ${
                          isPopular ? "text-white/45" : "text-[#858780]"
                        }`}
                      >
                        Harga / Bulan
                      </p>

                      {isEditing ? (
                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isPopular ? "text-white/55" : "text-[#6B6B66]"
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
                            style={
                              isPopular ? { colorScheme: "dark" } : undefined
                            }
                            className={`min-w-0 flex-1 border px-3 py-3 text-xl font-bold outline-none ${
                              isPopular
                                ? "border-white/15 !bg-white/[0.08] !text-white caret-white focus:border-white/30"
                                : "border-[#DCDDD8] bg-[#F9FAF7] text-[#171717] focus:border-[#9A9B95]"
                            }`}
                          />
                        </div>
                      ) : (
                        <motion.p
                          key={plan.price}
                          initial={{
                            opacity: 0,
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className={`mt-2 text-3xl font-bold tracking-[-0.04em] ${
                            isPopular ? "text-white" : "text-[#171717]"
                          }`}
                        >
                          {plan.price === 0
                            ? "Gratis"
                            : `Rp ${plan.price.toLocaleString("id-ID")}`}
                        </motion.p>
                      )}
                    </div>

                    {/* Divider */}
                    <div
                      className={`mt-7 border-t ${
                        isPopular ? "border-white/12" : "border-[#DCDDD8]"
                      }`}
                    />

                    {/* Features */}
                    <div className="relative flex-1 py-6">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-[9px] font-bold uppercase tracking-[0.15em] ${
                            isPopular ? "text-white/45" : "text-[#858780]"
                          }`}
                        >
                          Fitur Termasuk
                        </p>

                        <span
                          className={`text-[9px] font-bold ${
                            isPopular ? "text-white/35" : "text-[#A1A29C]"
                          }`}
                        >
                          {plan.features?.length || 0} items
                        </span>
                      </div>

                      {isEditing ? (
                        <textarea
                          value={editedFeatures}
                          onChange={(event) =>
                            setEditedFeatures(event.target.value)
                          }
                          rows={9}
                          placeholder="Satu fitur per baris..."
                          style={
                            isPopular ? { colorScheme: "dark" } : undefined
                          }
                          className={`mt-4 w-full resize-none border px-3.5 py-3 text-xs font-medium leading-5 outline-none ${
                            isPopular
                              ? "border-white/15 !bg-white/[0.08] !text-white !placeholder:text-white/30 caret-white focus:border-white/30"
                              : "border-[#DCDDD8] bg-[#F9FAF7] text-[#171717] placeholder:text-[#858780] focus:border-[#9A9B95]"
                          }`}
                        />
                      ) : plan.features?.length ? (
                        <ul className="mt-4 space-y-2.5">
                          {plan.features.map((feature, featureIndex) => (
                            <motion.li
                              key={`${feature}-${featureIndex}`}
                              initial={{
                                opacity: 0,
                                x: -6,
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                              }}
                              transition={{
                                delay: 0.08 + featureIndex * 0.025,
                                duration: 0.25,
                                ease: EASE,
                              }}
                              className="flex items-start gap-3"
                            >
                              <motion.span
                                whileHover={{
                                  rotate: -8,
                                  scale: 1.08,
                                }}
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center border ${
                                  isPopular
                                    ? "border-white/15 bg-white/6 text-white/80"
                                    : "border-[#DCDDD8] bg-[#F4F5F2] text-[#33332F]"
                                }`}
                              >
                                <Check className="h-3 w-3" strokeWidth={2} />
                              </motion.span>

                              <span
                                className={`text-xs font-medium leading-5 ${
                                  isPopular ? "text-white/80" : "text-[#33332F]"
                                }`}
                              >
                                {feature}
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <div
                          className={`mt-4 border border-dashed px-4 py-8 text-center ${
                            isPopular
                              ? "border-white/15 text-white/40"
                              : "border-[#DCDDD8] text-[#858780]"
                          }`}
                        >
                          <Sparkles
                            className="mx-auto h-4 w-4"
                            strokeWidth={ICON_STROKE}
                          />

                          <p className="mt-2 text-[10px] font-semibold">
                            Belum ada fitur.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer action */}
                    {isEditing ? (
                      <div className="flex gap-2">
                        <motion.button
                          type="button"
                          onClick={() => savePlan(plan.id)}
                          whileHover={{
                            y: -2,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold ${
                            isPopular
                              ? "bg-white text-[#171717] hover:bg-[#F0F0EC]"
                              : "bg-[#171717] text-white hover:bg-[#2A2A2A]"
                          }`}
                        >
                          <Save className="h-3.5 w-3.5" strokeWidth={2} />
                          Simpan
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => setEditingPlan(null)}
                          whileHover={{
                            rotate: 4,
                          }}
                          whileTap={{
                            scale: 0.96,
                          }}
                          className={`flex h-11 w-11 items-center justify-center border ${
                            isPopular
                              ? "border-white/15 bg-white/5 text-white/70"
                              : "border-[#DCDDD8] bg-white text-[#6B6B66]"
                          }`}
                          aria-label="Batal edit"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={() => startEditPlan(plan)}
                        disabled={!canManagePricing}
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.98,
                        }}
                        className={`inline-flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold transition-colors ${
                          isPopular
                            ? "bg-white text-[#171717] hover:bg-[#F0F0EC]"
                            : "border border-[#DCDDD8] bg-white text-[#171717] hover:bg-[#F4F5F2]"
                        } ${
                          !canManagePricing
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      >
                        <motion.span
                          whileHover={{
                            rotate: -8,
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5" strokeWidth={1.9} />
                        </motion.span>
                        Edit Harga & Fitur
                      </motion.button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

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
              delay: 0.28,
              ease: EASE,
            }}
            className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]"
          ></motion.div>
        </>
      )}
    </div>
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
      return;
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

      window.setTimeout(() => {
        setRoleSaveMsg(null);
      }, 3000);
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

      window.setTimeout(() => {
        setPlanSaveMsg(null);
      }, 3000);
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

  const showRolesTab = canManageRoles;
  const showPricingTab = canManagePricing;

  return (
    <main className="min-h-screen bg-[#F4F5F2] text-[#171717]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
    PAGE HEADER
=================================================== */}

        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative mb-8 overflow-hidden"
        >
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">
                Admin Panel
              </h1>

              <p className="mt-2 max-w-2xl text-xs font-medium leading-5 text-[#6B6B66]">
                Central workspace untuk mengontrol akses, role, permission, dan
                subscription platform.
              </p>
            </div>

            <div className="hidden border-l border-[#DCDDD8] pl-4 sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#858780]">
                Signed in as
              </p>

              <p className="mt-1 text-xs font-bold text-[#171717]">
                {user.role === "god" ? "God Administrator" : "Administrator"}
              </p>
            </div>
          </div>
        </motion.header>
        {/* ==================================================
            MODULE NAV
        =================================================== */}

        {(showRolesTab || showPricingTab) && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.08,
              ease: EASE,
            }}
            className="mb-5 flex items-center justify-between border-b border-[#DCDDD8]"
          >
            <div className="flex items-center gap-6">
              {showRolesTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab("roles")}
                  className="group relative flex items-center gap-2 py-3 text-xs font-bold"
                >
                  <AnimatedIcon
                    icon={ShieldCheck}
                    active={activeTab === "roles"}
                  />

                  <span
                    className={
                      activeTab === "roles"
                        ? "text-[#171717]"
                        : "text-[#858780]"
                    }
                  >
                    Role Management
                  </span>

                  {activeTab === "roles" && (
                    <motion.span
                      layoutId="activeAdminTab"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#171717]"
                      transition={{
                        duration: 0.3,
                        ease: EASE,
                      }}
                    />
                  )}
                </button>
              )}

              {showPricingTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab("pricing")}
                  className="group relative flex items-center gap-2 py-3 text-xs font-bold"
                >
                  <AnimatedIcon
                    icon={CreditCard}
                    active={activeTab === "pricing"}
                  />

                  <span
                    className={
                      activeTab === "pricing"
                        ? "text-[#171717]"
                        : "text-[#858780]"
                    }
                  >
                    Subscription Pricing
                  </span>

                  {activeTab === "pricing" && (
                    <motion.span
                      layoutId="activeAdminTab"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#171717]"
                      transition={{
                        duration: 0.3,
                        ease: EASE,
                      }}
                    />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================================================
            CONTENT
        =================================================== */}

        <AnimatePresence mode="wait">
          {activeTab === "roles" && showRolesTab && (
            <motion.div
              key="roles"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.3,
                ease: EASE,
              }}
            >
              <RoleWorkspace
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
            </motion.div>
          )}

          {activeTab === "pricing" && showPricingTab && (
            <motion.div
              key="pricing"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.3,
                ease: EASE,
              }}
            >
              <PricingWorkspace
                plans={plans}
                editingPlan={editingPlan}
                editedPrice={editedPrice}
                editedFeatures={editedFeatures}
                setEditedPrice={setEditedPrice}
                setEditedFeatures={setEditedFeatures}
                startEditPlan={startEditPlan}
                savePlan={savePlan}
                setEditingPlan={setEditingPlan}
                planSaveMsg={planSaveMsg}
                canManagePricing={canManagePricing}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
