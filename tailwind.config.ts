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
      },
    },
  },
  plugins: [],
};
export default config;
