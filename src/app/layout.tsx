import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"BoreSight | Geothermal intelligence",description:"An evidence-first geothermal drilling analysis prototype."};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
