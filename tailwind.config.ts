import type { Config } from "tailwindcss";

// V1 NOTE: This is the temporary, functional V1 visual layer only.
// Per POLAR HQ 2 development rule: function first, final branding/visual
// identity comes later from approved page designs. Keep this simple,
// clean and neutral until a real design is approved for implementation.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        polar: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          border: "#E5E5E5",
          text: "#1A1A1A",
          muted: "#6B6B6B",
          primary: "#1A1A1A",
          danger: "#B3261E",
          success: "#1E6B3B",
        },
        // Landing page / marketing brand system only — deliberately
        // separate from the `polar.*` tokens above, which the existing
        // barber/client dashboards rely on. Nothing under `polar.*` was
        // changed, so dashboard styling is unaffected by this palette.
        ice: {
          50: "#F3FAFF",
          100: "#E4F2FF",
          200: "#CCE7FF",
          glow: "#7FD1FF",
        },
        royal: {
          DEFAULT: "#0B5FFF",
          dark: "#0A3FCC",
          light: "#5B9BFF",
        },
        navy: {
          DEFAULT: "#0A1128",
          light: "#111B3A",
        },
        magenta: "#FF3D9A",
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        body: [
          "var(--font-geist)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        ice: "0 10px 30px -10px rgba(11, 95, 255, 0.35)",
        "ice-lg": "0 25px 60px -15px rgba(10, 17, 40, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
