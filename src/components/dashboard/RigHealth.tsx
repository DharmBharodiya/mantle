import type { WellTelemetryReport } from "@/types/telemetry";
export function RigHealth({ report }: { report: WellTelemetryReport }) {
  const m = report.metrics;
  const productive = m.classifiedMinutes ? m.productiveMinutes / m.classifiedMinutes * 100 : null;
  const unknown = Math.max(0, m.observedMinutes - m.classifiedMinutes);
  const coverage = m.observedMinutes / 1440 * 100;
  const rows = [
    { label: "Productive", minutes: m.productiveMinutes, color: "#27A982" },
    { label: "Confirmed NPT", minutes: m.nptMinutes, color: "#E9736B" },
    { label: "Unknown classification", minutes: unknown, color: "#A7AFBD" },
  ];
  const productiveEnd = m.observedMinutes ? m.productiveMinutes / m.observedMinutes * 100 : 0;
  const nptEnd = m.observedMinutes ? (m.productiveMinutes + m.nptMinutes) / m.observedMinutes * 100 : 0;
  return <section className="card flex h-full flex-col px-6 py-6">
    <p className="micro mb-2">Reported operations</p><h2 className="text-[18px] font-semibold tracking-tight">Operational time mix</h2>
    <div className="relative mx-auto my-5 flex h-[166px] w-[166px] items-center justify-center rounded-full" role="img" aria-label={`Classified productive fraction: ${productive === null ? "unknown" : `${productive.toFixed(1)} percent`}. Ring segments show observed time.`} style={{ background: m.observedMinutes ? `conic-gradient(#27A982 0 ${productiveEnd}%, #E9736B ${productiveEnd}% ${nptEnd}%, #A7AFBD ${nptEnd}% 100%)` : "#EFF1F6" }}>
      <div className="flex h-[142px] w-[142px] flex-col items-center justify-center rounded-full bg-white"><span className="number text-[35px] font-semibold tracking-tight">{productive === null ? "—" : `${productive.toFixed(1)}%`}</span><span className="mt-1 text-[10px] text-[#667286]">Classified productive</span></div>
    </div>
    <dl className="space-y-3 text-xs">{rows.map(row => <div key={row.label} className="flex items-center justify-between gap-2"><dt className="flex items-center gap-2 text-[#667286]"><span className="h-2 w-2 rounded-full" style={{ background: row.color }} />{row.label}</dt><dd className="number font-medium">{(row.minutes / 60).toFixed(1)}h</dd></div>)}</dl>
    <div className="mt-5 border-t border-line pt-4 text-[11px] leading-5 text-[#667286]"><p>{coverage.toFixed(0)}% of report day observed · {m.observedMinutes ? (m.classifiedMinutes / m.observedMinutes * 100).toFixed(0) : "—"}% of observed time classified.</p>
      {(coverage < 100 || unknown > 0) && <p className="mt-2 font-medium text-[#93601E]">Incomplete coverage: missing or unknown time is not assumed productive.</p>}
      <p className="mt-2">Time classification describes operations, not equipment condition or safety.</p>
    </div>
  </section>;
}
