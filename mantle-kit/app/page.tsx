import type { Metadata } from 'next';
import { Landing } from '@/components/mantle/Landing';

export const metadata: Metadata = {
  title: 'Mantle — every lost hour on the rig, found',
  description: 'Mantle reads daily geothermal drilling reports and finds downtime, invisible lost time and what it cost — every figure traced to its source line.',
};

export default function HomePage() {
  // To wire the hero upload box, pass a Server Action: <Landing onAnalyze={analyzeReport} />
  return <Landing consoleHref="/console" />;
}
