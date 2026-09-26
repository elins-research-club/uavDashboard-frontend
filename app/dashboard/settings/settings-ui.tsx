"use client";

/* ============================================================
   SHARED UI — HALAMAN PENGATURAN

   Blok bangunan yang dipakai keempat panel (Umum, Preferensi,
   Notifikasi, Agkun) supaya visual konsisten dengan desain
   asli halaman settings.
============================================================ */

import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { motion, type Variants } from "framer-motion";

export const ICON_STROKE = 1.75;

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: EASE,
    },
  },
};

/* ============================================================
   ANIMATED ICON + SECTION HEADER
============================================================ */

function AnimatedIcon({
  icon: Icon,
  active = false,
}: {
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <motion.span
      animate={{
        scale: active ? 1.02 : 1,
      }}
      whileHover={{
        rotate: -5,
        scale: 1.08,
      }}
      transition={{
        duration: 0.22,
        ease: EASE,
      }}
      className="inline-flex"
    >
      <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
    </motion.span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <motion.div
        whileHover={{
          y: -2,
          rotate: -3,
        }}
        transition={{
          duration: 0.22,
          ease: EASE,
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2] sm:h-10 sm:w-10"
      >
        <AnimatedIcon icon={Icon} />
      </motion.div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780] sm:text-[10px] sm:tracking-[0.15em]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-[15px] font-bold tracking-[-0.02em] text-[#171717] sm:text-base">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-[11px] font-medium leading-[1.55] text-[#6B6B66] sm:text-xs sm:leading-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   WIREFRAME DECORATION
============================================================ */

export function WireframeDecoration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 340 160"
      className="pointer-events-none absolute right-0 top-0 h-full w-[250px] opacity-35 sm:w-[360px] sm:opacity-45"
    >
      <g
        fill="none"
        stroke="rgba(23,23,23,0.08)"
        strokeWidth="1"
        strokeLinecap="square"
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <path key={`h-${index}`} d={`M55 ${22 + index * 20}H320`} />
        ))}

        {Array.from({ length: 10 }).map((_, index) => (
          <path key={`v-${index}`} d={`M70 ${16}V146`} />
        ))}

        <path d="M135 44L196 25L272 48L210 69Z" />
        <path d="M135 44L135 95L210 120L210 69Z" />
        <path d="M210 69L272 48L272 96L210 120Z" />
      </g>
    </svg>
  );
}

/* ============================================================
   LINK ITEM (rail footer)
============================================================ */

export function LinkItem({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{
          x: 2,
        }}
        className="group flex min-w-0 items-center gap-3 border border-transparent px-2.5 py-3 transition-colors hover:border-[#DCDDD8] hover:bg-white sm:px-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E3E3DE] bg-white">
          <Icon
            className="h-4 w-4 text-[#858780] group-hover:text-[#171717]"
            strokeWidth={ICON_STROKE}
          />
        </span>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-[#33332F] sm:text-xs">
            {label}
          </p>

          <p className="mt-0.5 truncate text-[9px] font-medium text-[#858780] sm:text-[10px]">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
/* ============================================================
   SELECT FIELD (value-based)
============================================================ */

export function SelectField<T extends string | number>({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-[#171717] sm:text-xs">
        {label}
      </span>

      <span className="mb-2 block text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
        {description}
      </span>

      <span className="relative block">
        <select
          value={value}
          onChange={(event) => {
            const raw = event.target.value;

            onChange(
              (typeof value === "number" ? Number(raw) : raw) as T
            );
          }}
          className="h-10 w-full appearance-none border border-[#DCDDD8] bg-[#FAFAF8] px-3 pr-10 text-[11px] font-semibold text-[#33332F] outline-none transition-colors focus:border-[#9A9B95] focus:bg-white sm:h-11 sm:px-3.5 sm:text-xs"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858780]"
          strokeWidth={ICON_STROKE}
        />
      </span>
    </label>
  );
}

/* ============================================================
   TEXT FIELD
============================================================ */

export function TextField({
  label,
  description,
  value,
  onChange,
  placeholder,
  maxLength = 60,
  icon: Icon,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  icon?: LucideIcon;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#171717] sm:text-xs">
        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />}
        {label}
      </span>

      <span className="mb-2 block text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
        {description}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full border border-[#DCDDD8] bg-[#FAFAF8] px-3 text-[11px] font-semibold text-[#33332F] outline-none transition-colors placeholder:font-medium placeholder:text-[#A9ABA3] focus:border-[#9A9B95] focus:bg-white sm:h-11 sm:px-3.5 sm:text-xs"
      />

      <span className="mt-1 block text-right text-[9px] font-medium text-[#A9ABA3] sm:text-[10px]">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

/* ============================================================
   RANGE FIELD (persen)
============================================================ */

export function RangeField({
  label,
  description,
  value,
  onChange,
  min = 30,
  max = 100,
  suffix = "%",
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-bold text-[#171717] sm:text-xs">
          {label}
        </span>

        <span className="shrink-0 border border-[#DCDDD8] bg-[#F4F5F2] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#33332F]">
          {value}
          {suffix}
        </span>
      </span>

      <span className="mt-1 block text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
        {description}
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-[#76B900]"
      />
    </label>
  );
}
/* ============================================================
   TOGGLE ROW
============================================================ */

export function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  badge?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center justify-between gap-3 p-4 transition-colors hover:bg-[#FAFAF8] sm:gap-5 sm:p-5">
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F8F9F6] sm:h-9 sm:w-9">
          <Icon className="h-4 w-4 text-[#6B6B66]" strokeWidth={ICON_STROKE} />
        </span>

        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="block text-[11px] font-bold text-[#171717] sm:text-xs">
              {label}
            </span>

            {badge && (
              <span className="border border-[#DDE3D3] bg-[#F1F6EB] px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.08em] text-[#5F8F13]">
                {badge}
              </span>
            )}
          </span>

          <span className="mt-1 block max-w-xl text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
            {description}
          </span>
        </span>
      </span>

      <span className="relative flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span className="absolute inset-0 border border-[#C7C8C2] bg-[#F4F5F2] transition-colors peer-checked:border-[#171717] peer-checked:bg-[#171717]" />

        <motion.span
          animate={{
            x: checked ? 20 : 2,
          }}
          transition={{
            duration: 0.22,
            ease: EASE,
          }}
          className="relative z-10 h-5 w-5 bg-white shadow-sm"
        />
      </span>
    </label>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

export function InfoItem({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        x: 2,
      }}
      className="group flex min-w-0 items-center gap-3 border-b border-[#DCDDD8] px-3.5 py-3.5 last:border-b-0 sm:gap-4 sm:px-5 sm:py-4"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F8F9F6] sm:h-9 sm:w-9">
        <Icon
          className={`h-4 w-4 ${accent ? "uav-text-accent" : "text-[#6B6B66]"}`}
          strokeWidth={ICON_STROKE}
        />
      </span>

      <span className="min-w-0 flex-1 text-[11px] font-medium text-[#6B6B66] sm:text-xs">
        {label}
      </span>

      <span className="max-w-[55%] truncate text-right text-[11px] font-bold capitalize text-[#171717] sm:text-xs">
        {value}
      </span>
    </motion.div>
  );
}
/* ============================================================
   INFO BLOCK
============================================================ */

export function InfoBlock({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="border border-[#DCDDD8] bg-[#FAFAF8] p-4 sm:p-5"
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#858780] sm:text-[9px] sm:tracking-[0.14em]">
        {label}
      </p>

      <p className="mt-2 text-[13px] font-bold text-[#171717] sm:text-sm">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
        {description}
      </p>
    </motion.div>
  );
}
