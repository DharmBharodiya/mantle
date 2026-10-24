import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "m-ink": { DEFAULT: "#050506", 1: "#08080A", 2: "#0B0B0E", 3: "#121216" },
        "m-line": "rgb(255 255 255 / 0.08)",
        "line-strong": "rgb(255 255 255 / 0.14)",
        steam: { DEFAULT: "#F2F0EC", 2: "#C9C6C0", 3: "#A09E9A", 4: "#8F8C88", 5: "#6F6C78" },
        productive: { DEFAULT: "#6A5CD6", flat: "#4B4196", ink: "#B3AAF7" },
        ilt: { DEFAULT: "#FFB357", ink: "#FFC27A" },
        npt: { DEFAULT: "#FF4F6E", ink: "#FF8597" },
        heat: { 2: "#5A1A7E", 4: "#C2307A", 5: "#E9466B", 6: "#FF6F4D", 7: "#FF9A3D", 8: "#FFC56B" },
        canvas: "#F6F7F9", ink: "#161A24", muted: "#6F7887",
        line: "#E8EBEF", indigo: "#5358F7", orange: "#F28A46",
        amber: "#D69A2D", emerald: "#21A783", red: "#E76D69"
      },
      boxShadow: { card: "0 12px 34px rgba(25,34,54,0.035)" },
      borderRadius: { card: "22px", chip: "12px", panel: "20px", hero: "30px" },
      fontFamily: {
        sans: ["var(--font-mantle-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-mantle-serif)", "Georgia", "serif"],
        mono: ["var(--font-mantle-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      opacity: { 8: ".08", 12: ".12", 14: ".14", 15: ".15", 35: ".35", 45: ".45", 55: ".55", 65: ".65", 85: ".85" },
    }
  },
  plugins: []
};
export default config;
