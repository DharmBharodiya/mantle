import type { Metadata } from 'next';
import { mantleFontVars } from '@/lib/mantle/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mantle',
  description: 'Geothermal drilling intelligence',
};

// If you already have a layout: just add `mantleFontVars` to <html className>
// and `bg-ink text-steam font-sans antialiased` to <body>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mantleFontVars}>
      <body className="bg-ink font-sans text-steam antialiased">{children}</body>
    </html>
  );
}
