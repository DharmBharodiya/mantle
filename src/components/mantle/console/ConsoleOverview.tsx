import type { WellTelemetryReport } from "@/types/telemetry";
import { fmtNum } from "@/lib/mantle/report";
import { KpiStrip } from "./KpiStrip";
import { EvidencePanel } from "./EvidencePanel";
import { EventLog } from "./EventLog";
import { LossLedger } from "./LossLedger";
import { DepthTimeline } from "./DepthTimeline";

/** Kit overview composition, fed exclusively by the current canonical report. */
export function ConsoleOverview({report,selectedId,onSelect,onScenario}:{report:WellTelemetryReport;selectedId?:string;onSelect:(id:string)=>void;onScenario:()=>void}) {
  return <div className="flex flex-col gap-5"><section className="m-panel" aria-label="Day summary"><h2>Report day summary</h2><p className="mt-3 text-base leading-relaxed text-steam-2">{fmtNum(report.metrics.observedMinutes/60)} h observed, including <span className="text-npt-ink">{fmtNum(report.metrics.nptMinutes/60)} h confirmed NPT</span>. {report.metrics.iltEligibleMinutes?`${fmtNum(report.metrics.iltMinutes/60)} h drilling ILT against the ${report.scenario.drillBenchmarkFtPerHour} ft/h benchmark.`:"Drilling ILT cannot be evaluated from these observations."}</p><p className="mt-2 text-sm text-steam-4">Calculated from validated source events · {fmtNum(report.metrics.coveragePct)}% report-day coverage{report.metrics.unknownMinutes?` · ${fmtNum(report.metrics.unknownMinutes/60)} h unknown classification`:""}</p></section><KpiStrip report={report}/><div className="m-analysis-row"><div className="min-w-0 flex-[999_1_560px]"><DepthTimeline report={report} selectedId={selectedId} onSelect={onSelect}/></div><div className="min-w-0 flex-[1_1_320px]"><EvidencePanel report={report} selectedId={selectedId}/></div></div><div className="m-analysis-row"><div className="min-w-0 flex-[999_1_560px]"><EventLog report={report} selectedId={selectedId} onSelect={onSelect}/></div><div className="min-w-0 flex-[1_1_320px]"><LossLedger report={report} onSelect={onSelect} onScenario={onScenario}/></div></div></div>;
}
