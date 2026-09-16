import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose conditional classes and resolve Tailwind v3 utility conflicts. */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
