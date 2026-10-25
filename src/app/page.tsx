import type { Metadata } from "next";
import { HomeLanding } from "@/components/mantle/HomeLanding";
export const metadata: Metadata = {
  title: "Mantle — Steel goes down. Steam comes up.",
  description: "Read geothermal drilling reports, inspect source evidence and explore NPT, drilling ILT and economic scenarios.",
};
export default function HomePage() { return <HomeLanding />; }
