import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F7F9", ink: "#161A24", muted: "#6F7887",
        line: "#E8EBEF", indigo: "#5358F7", orange: "#F28A46",
        amber: "#D69A2D", emerald: "#21A783", red: "#E76D69"
      },
      boxShadow: { card: "0 12px 34px rgba(25,34,54,0.035)" },
      borderRadius: { card: "22px" }
    }
  },
  plugins: []
};
export default config;
