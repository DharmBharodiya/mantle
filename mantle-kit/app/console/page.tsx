import type { Metadata } from 'next';
import { ConsoleOverview } from '@/components/mantle/console/ConsoleOverview';
import { DEMO_EVENTS } from '@/lib/mantle/report';

export const metadata: Metadata = { title: 'Console — Mantle' };

export default function ConsolePage() {
  // Replace DEMO_EVENTS with the events your Gemini extraction returns (same DrillEvent shape).
  return <ConsoleOverview events={DEMO_EVENTS} wellName="Demo geothermal well" dateLabel="24 Oct 2026" synthetic />;
}
