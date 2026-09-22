"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* ============================================================
   DESIGN TOKENS — disamakan dengan page Help
============================================================ */

export const ICON_STROKE = 1.75;
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
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

/** Card standar: sudut siku, border tipis, latar putih. */
export const cardClass = "border border-[#DCDDD8] bg-white";

/** Label kecil di atas judul section. */
export const eyebrowClass =
  "text-[10px] font-bold uppercase tracking-[0.15em] text-[#858780]";

export const inputClass =
  "w-full border border-[#DCDDD8] bg-white px-3.5 py-2.5 text-xs font-medium text-[#171717] outline-none transition-colors placeholder:text-[#B0B1AB] hover:border-[#CFCFC8] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 disabled:cursor-not-allowed disabled:bg-[#F4F5F2] disabled:opacity-60";

/* ============================================================
   ICON BOX
============================================================ */

export function IconBox({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <motion.span
      whileHover={{
        y: -2,
        rotate: -4,
      }}
      transition={{
        duration: 0.22,
        ease: EASE,
      }}
      className={cn(
        "flex shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        className
      )}
    >
      <Icon
        className={cn(
          "text-[#33332F]",
          size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
        )}
        strokeWidth={ICON_STROKE}
        aria-hidden="true"
      />
    </motion.span>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  right,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <IconBox icon={icon} />

        <div className="min-w-0">
          <p className={eyebrowClass}>{eyebrow}</p>

          <h2 className="mt-1 text-base font-bold tracking-[-0.02em] text-[#171717]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-[#6B6B66]">
              {description}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );
}

/* ============================================================
   BUTTON
============================================================ */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md"
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" ? "px-4 py-2.5 text-xs" : "px-3 py-1.5 text-[10px]",
    variant === "primary" &&
      "bg-[#171717] text-white hover:bg-[#33332F] disabled:hover:bg-[#171717]",
    variant === "secondary" &&
      "border border-[#DCDDD8] bg-white text-[#33332F] hover:border-[#CFCFC8] hover:bg-[#FAFAF8] hover:text-[#171717]",
    variant === "ghost" &&
      "text-[#6B6B66] hover:bg-[#F4F5F2] hover:text-[#171717]"
  );
}

export function ActionButton({
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  className,
  ...props
}: HTMLMotionProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{
        duration: 0.2,
        ease: EASE,
      }}
      className={cn(buttonClass(variant, size), className)}
      {...props}
    />
  );
}
