import type { Metadata } from "next";
import "./globals.css";
import "../styles/mantle.css";
import { mantleFontVars } from "@/lib/mantle/fonts";
export const metadata:Metadata={title:"Mantle | Geothermal intelligence",description:"An evidence-first geothermal drilling analysis prototype."};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={mantleFontVars}><body>{children}</body></html>;
}
