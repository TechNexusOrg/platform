import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        surface: {
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
        },
        primary: {
          DEFAULT: "#0ea5e9", // Electric cyan
          foreground: "#ffffff",
          dark: "#0284c7",
        },
        accent: {
          DEFAULT: "#10b981", // Electric emerald/lime
          foreground: "#ffffff",
          violet: "#a855f7",
          amber: "#f59e0b",
        },
        muted: {
          DEFAULT: "#1e293b",
          foreground: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
