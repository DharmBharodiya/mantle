import localFont from "next/font/local";
const sans = localFont({ src: "./font-files/instrument-sans.woff2", weight: "400 600", display: "swap", variable: "--font-mantle-sans", fallback: ["Arial", "sans-serif"] });
const serif = localFont({ src: "./font-files/instrument-serif-italic.woff2", weight: "400", style: "italic", display: "swap", variable: "--font-mantle-serif", fallback: ["Georgia", "serif"] });
const mono = localFont({ src: "./font-files/jetbrains-mono.woff2", weight: "400 500", display: "swap", variable: "--font-mantle-mono", fallback: ["Consolas", "monospace"] });
export const mantleFontVars = `${sans.variable} ${serif.variable} ${mono.variable}`;
