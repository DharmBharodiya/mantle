import type { WellTelemetryReport } from "@/types/telemetry";
// Ephemeral client-module handoff across Next.js navigation. Never stores source files,
// raw documents, keys or evidence in localStorage/sessionStorage or URL parameters.
let pending: { report: WellTelemetryReport; fileName: string } | null = null;
type ConsoleSession = { reports: { id: string; report: WellTelemetryReport; fileName: string }[]; reportId: string };
let session: ConsoleSession | null = null;
export function stageConsoleReport(report: WellTelemetryReport, fileName: string) { pending = { report, fileName }; }
export function takeConsoleReport() { const result = pending; pending = null; return result; }
export function readConsoleSession() { return session; }
export function saveConsoleSession(value: ConsoleSession) { session = value; }
