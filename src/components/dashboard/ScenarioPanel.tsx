"use client";
import { useState } from "react";
import { IconCheck as Check, IconGauge as SlidersHorizontal } from "@/components/mantle/Icons";
import { ScenarioSchema, type Scenario, type WellTelemetryReport } from "@/types/telemetry";
import { usd } from "./KpiStrip";
export function ScenarioPanel({ report, onApply, busy }: {
    report: WellTelemetryReport;
    onApply: (scenario: Scenario) => Promise<void>;
    busy: boolean;
}) {
    const [values, setValues] = useState({ rigDailyUsd: String(report.scenario.rigDailyUsd), drillBenchmarkFtPerHour: String(report.scenario.drillBenchmarkFtPerHour), excessFuelGallonsPerHour: report.scenario.excessFuelGallonsPerHour === null ? "" : String(report.scenario.excessFuelGallonsPerHour), kgCo2PerGallon: String(report.scenario.kgCo2PerGallon) });
    const [error, setError] = useState("");
    const [applied, setApplied] = useState(false);
    async function submit(event: React.FormEvent) { event.preventDefault(); setError(""); setApplied(false); const parsed = ScenarioSchema.safeParse({ ...report.scenario, rigDailyUsd: values.rigDailyUsd === "" ? NaN : Number(values.rigDailyUsd), drillBenchmarkFtPerHour: values.drillBenchmarkFtPerHour === "" ? NaN : Number(values.drillBenchmarkFtPerHour), excessFuelGallonsPerHour: values.excessFuelGallonsPerHour.trim() === "" ? null : Number(values.excessFuelGallonsPerHour), kgCo2PerGallon: values.kgCo2PerGallon === "" ? NaN : Number(values.kgCo2PerGallon) }); if (!parsed.success) {
        setError("Enter finite, valid scenario values. Rig rate and fuel may be zero; drilling benchmark and CO₂ factor must be positive.");
        return;
    } try {
        await onApply(parsed.data);
        setApplied(true);
    }
    catch (cause) {
        setError(cause instanceof Error ? cause.message : "Scenario could not be applied.");
    } }
    const fields = [{ key: "rigDailyUsd", label: "Rig day rate", unit: "USD / day", help: "Scenario assumption; not an established rate for this well." }, { key: "drillBenchmarkFtPerHour", label: "Comparable drilling benchmark", unit: "feet / hour", help: "Choose for the formation and well section. Applies only to supported productive drilling." }, { key: "excessFuelGallonsPerHour", label: "Incremental excess fuel", unit: "gallons / hour", help: "Leave blank for unknown. Differential against feasible operation, not total rig consumption." }, { key: "kgCo2PerGallon", label: "Emissions factor", unit: "kg CO₂ / gallon", help: "Assumed conversion factor. Results are modeled, not measured emissions." }] as const;
    return <section className="card panel"><div className="panel-head"><div><h2>Benchmark & economics</h2><p className="caption">Recalculate the selected report without another Gemini request.</p></div><SlidersHorizontal size={18} color="var(--m-steam-3)"/></div><form onSubmit={event => void submit(event)}><fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}><div className="form-grid">{fields.map(field => <label className="field" key={field.key}>{field.label}<span className="caption">{field.unit}</span><input type="number" step="any" min={field.key === "rigDailyUsd" || field.key === "excessFuelGallonsPerHour" ? 0 : 0.000001} value={values[field.key]} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setApplied(false); }} placeholder={field.key === "excessFuelGallonsPerHour" ? "Unknown — optional" : ""}/><span className="caption">{field.help}</span></label>)}</div><div className="form-actions"><button className="primary-button" type="submit">{busy ? "Recalculating…" : "Apply scenario"}</button>{applied && <span role="status" className="row caption"><Check size={14}/>Scenario applied</span>}</div></fieldset>{error && <p role="alert" className="form-error">{error}</p>}</form><div className="panel-divider caption"><strong>Current modeled exposure: {usd(report.metrics.estimatedLossUsd)}</strong><p style={{ marginTop: 8 }}>NPT cost + supported drilling ILT opportunity, without overlap. {report.metrics.benchmarkCoveragePct.toFixed(1)}% of productive time can be benchmarked. Trip ILT is unavailable because bit/string travel is not supplied.</p></div></section>;
}
