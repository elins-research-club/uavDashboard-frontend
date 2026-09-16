const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#123c28",
          950: "#071e13",
          900: "#0c2b1d",
          800: "#123c28",
          700: "#1a5134",
          600: "#226842",
          500: "#2e7d54",
          400: "#5aa37b",
          300: "#8cc7a5",
          200: "#c4e4d2",
          100: "#e8f3ec",
          50: "#f4f8f5",
        },
        surface: {
          DEFAULT: "#f7f9f6",
          raised: "#ffffff",
          sunken: "#eef2ec",
          overlay: "rgba(255, 255, 255, 0.85)",
        },
        signal: {
          emerald: "#059669",
          jade: "#00b380",
          mint: "#6ee7b7",
          cyan: "#0891b2",
        },
        status: {
          success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: "#16a34a" },
          warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "#d97706" },
          error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "#dc2626" },
          info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "#3b82f6" },
          baking: { bg: "#f4f8f5", border: "#c4e4d2", text: "#123c28", icon: "#2e7d54" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Nyaman dibaca — tidak ada lagi di bawah 11px kecuali uppercase micro-label
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(18, 60, 40, 0.08)",
        "glass-lg": "0 16px 48px rgba(18, 60, 40, 0.12)",
        card: "0 1px 2px rgba(18, 60, 40, 0.05), 0 4px 16px rgba(18, 60, 40, 0.04)",
        "card-hover": "0 4px 8px rgba(18, 60, 40, 0.06), 0 12px 32px rgba(18, 60, 40, 0.10)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
