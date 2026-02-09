import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Surfaces (layered depth)
        "surface-0": "#06080d",
        "surface-1": "#0c1017",
        "surface-2": "#131820",
        "surface-3": "#1a2030",
        // Borders
        "stroke-subtle": "#1a2235",
        "stroke-muted": "#253045",
        "stroke-accent": "#3b4f6e",
        // Agent colors
        solar: "#e2b340",
        home: "#5b9cf5",
        battery: "#a78bfa",
        // Text scale
        "txt-primary": "#e8ecf4",
        "txt-secondary": "#8896ab",
        "txt-tertiary": "#5a6a80",
        "txt-accent": "#7dd3fc",
        // User agent color
        user: "#34d399",
        // Semantic
        positive: "#34d399",
        negative: "#f87171",
      },
      boxShadow: {
        "glow-solar": "0 0 20px rgba(226, 179, 64, 0.3)",
        "glow-home": "0 0 20px rgba(91, 156, 245, 0.3)",
        "glow-battery": "0 0 20px rgba(167, 139, 250, 0.3)",
        "glow-user": "0 0 20px rgba(52, 211, 153, 0.3)",
        "glow-positive": "0 0 12px rgba(52, 211, 153, 0.25)",
        "inner-highlight": "inset 0 1px 0 0 rgba(255,255,255,0.03)",
      },
      animation: {
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
