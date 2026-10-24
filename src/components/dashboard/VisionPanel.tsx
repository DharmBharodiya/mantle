"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScanEye, Upload } from "lucide-react";
import { VisionResultSchema, type VisionResult } from "@/types/vision";
export function VisionPanel() {
    const input = useRef<HTMLInputElement>(null);
    const active = useRef<AbortController | null>(null);
    const [preview, setPreview] = useState("");
    const [fileName, setFileName] = useState("");
    const [result, setResult] = useState<VisionResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => () => active.current?.abort(), []);
    useEffect(() => () => { if (preview)
        URL.revokeObjectURL(preview); }, [preview]);
    async function inspect(file: File) { setError(""); if (!/\.(png|jpe?g|webp)$/i.test(file.name) || !file.size || file.size > 6 * 1024 * 1024) {
        setError("Choose a non-empty PNG, JPEG or WebP up to 6 MB.");
        if (input.current)
            input.current.value = "";
        return;
    } active.current?.abort(); const controller = new AbortController(); active.current = controller; setBusy(true); setResult(null); setPreview(URL.createObjectURL(file)); setFileName(file.name); const timer = setTimeout(() => controller.abort(), 150000); try {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/vision", { method: "POST", body: data, signal: controller.signal });
        const body = await response.json();
        if (!response.ok)
            throw new Error(body.error ?? "Equipment observations unavailable.");
        const parsed = VisionResultSchema.parse(body);
        if (active.current === controller && !controller.signal.aborted)
            setResult(parsed);
    }
    catch (cause) {
        if (active.current === controller)
            setError(controller.signal.aborted ? "Stopped waiting for equipment observations. No findings were created." : cause instanceof Error ? cause.message : "Equipment observations unavailable.");
    }
    finally {
        clearTimeout(timer);
        if (active.current === controller) {
            active.current = null;
            setBusy(false);
            if (input.current)
                input.current.value = "";
        }
    } }
    return <section className="card panel"><div className="panel-head"><div><p className="eyebrow">Image to observations</p><h2>Equipment vision</h2><p className="caption">Visible features for qualified human review. Not an equipment diagnosis.</p></div><ScanEye size={20} color="#94A3FF"/></div><div className="source-banner upload"><strong>UNVERIFIED VISUAL OBSERVATIONS</strong><p>A photograph cannot establish damage causes, remaining life, safe operation or an IADC grade. BoreSight does not provide repair instructions or safety clearance.</p></div><input type="file" accept=".png,.jpg,.jpeg,.webp" ref={input} className="hidden" aria-label="Choose equipment photograph" onChange={event => { const file = event.target.files?.[0]; if (file)
        void inspect(file); }}/><div className="drop-area"><Upload size={26} color="#94A3FF"/><h3>Inspect a bit or equipment photograph</h3><p className="caption">PNG, JPEG or WebP · up to 6 MB · sent to Gemini only when selected</p><button className="primary-button" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Reviewing visible features…" : "Choose equipment image"}</button>{busy && <button className="ghost-button" onClick={() => active.current?.abort()}>Stop waiting</button>}</div>{error && <p role="alert" className="upload-error">{error}</p>}{preview && <div style={{ marginTop: 20 }}><p className="caption" style={{ marginBottom: 10 }}>{fileName} · preview of the selected source</p><Image src={preview} width={800} height={500} unoptimized alt="Selected equipment photograph for visual review" className="vision-preview"/></div>}{busy && <div role="status" className="upload-status" style={{ marginTop: 20 }}>Waiting for Gemini. No observations are assumed before a response.<div className="skeleton"/></div>}{result && <div style={{ marginTop: 24 }}><div className="row between"><h3>{result.equipmentDescription}</h3><span className="badge">Image quality: {result.imageQuality}</span></div>{result.observations.length ? result.observations.map((observation, index) => <article className="vision-observation" key={index}><div className="row between"><strong style={{ fontSize: 12 }}>{observation.region}</strong><span className="badge">{observation.confidence} visibility confidence</span></div><p>{observation.observation}</p></article>) : <div className="empty-state" style={{ marginTop: 16, minHeight: 120 }}>No supportable equipment observations in this image.</div>}<h3 style={{ marginTop: 24 }}>Limits & uncertainty</h3><ul className="quality-list">{result.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}</ul><p className="caption panel-divider">Source: {result.sourceFileName}. AI output is unverified; arrange qualified human inspection before any decision.</p></div>}</section>;
}
