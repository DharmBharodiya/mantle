import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';

/** UI + display type. */
export const fontSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mantle-sans',
  display: 'swap',
});

/** Accent serif — italic only, at most one phrase per section. */
export const fontSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-mantle-serif',
  display: 'swap',
});

/** Numbers, units, timestamps, source lines and all ASCII canvases. */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mantle-mono',
  display: 'swap',
});

/** Put this on <html className>. */
export const mantleFontVars = `${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`;
