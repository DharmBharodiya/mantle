'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { IconArrowUp, IconAttach, IconSpark, IconTable, IconX } from './Icons';
import { cn } from '@/lib/mantle/cn';

const DEFAULT_PROMPTS = [
  'Paste a report: well name, report date, time intervals, operations and measured hole depths.',
  'Or attach a PDF, CSV, XLSX or TXT daily drilling report using the controls below.',
];
const ACCEPT_ALL = '.pdf,.csv,.xlsx,.txt';
const ACCEPT_SHEETS = '.csv,.xlsx';

export interface ReportPromptProps {
  /** Called with the typed question and/or the attached report. Return a promise to show the busy state. */
  onSubmit?: (input: { text: string; file: File | null }) => void | Promise<void>;
  demoHref?: string;
  prompts?: string[];
  maxBytes?: number;
  className?: string;
  status?: string;
  onCancel?: () => void;
}

/** Cycles through example prompts like someone typing. Pauses when `active` is false. */
function useTypewriter(prompts: string[], active: boolean): string {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 70);
    return () => window.clearInterval(id);
  }, [active]);
  const lens = prompts.map((s) => s.length + 34 + Math.ceil(s.length / 3) + 8);
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let t = tick % total;
  let i = 0;
  while (i < lens.length - 1 && t >= lens[i]) {
    t -= lens[i];
    i++;
  }
  const s = prompts[i] ?? '';
  const L = s.length;
  if (tick === 0) return s;
  if (t < L) return s.slice(0, t + 1);
  if (t < L + 34) return s;
  if (t < L + 34 + Math.ceil(L / 3)) return s.slice(0, Math.max(0, L - (t - L - 34) * 3));
  return '';
}

/**
 * The homepage upload box: glass panel over the ASCII field, a textarea with a
 * typing demo, attach chips, drag-and-drop, and a heat-gradient send button.
 */
export function ReportPrompt({ onSubmit, demoHref = '/console', prompts = DEFAULT_PROMPTS, maxBytes = 8 * 1024 * 1024, className, status, onCancel }: ReportPromptProps) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const typing = !focused && !text;
  const typed = useTypewriter(prompts, typing);

  const accept = (f: File | undefined | null) => {
    if (!f || busy) return;
    if (f.size === 0) return setError("Choose a non-empty report.");
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!ACCEPT_ALL.split(',').includes(ext)) { setFile(null); return setError('Use a PDF, CSV, XLSX or TXT report.'); }
    if (f.size > maxBytes) { setFile(null); return setError(`That file is ${(f.size / 1048576).toFixed(1)} MB — the limit is ${Math.round(maxBytes / 1048576)} MB.`); }
    setError(null);
    setFile(f);
  };

  const pick = (types: string) => {
    if (!fileRef.current) return;
    fileRef.current.accept = types;
    fileRef.current.click();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      setError("Attach a report or paste its operational time blocks.");
      textRef.current?.focus();
      return;
    }
    if (!onSubmit || busy) return;
    setError(null);
    try {
      setBusy(true);
      await onSubmit({ text: text.trim(), file });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The report could not be analyzed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    if (e.dataTransfer.files.length !== 1) return setError("Attach one report at a time.");
    accept(e.dataTransfer.files?.[0]);
  };

  return (
    <form
      onSubmit={submit}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'm-glass w-full max-w-[640px] rounded-card p-[18px] pb-3.5 text-left transition-[border-color,box-shadow] duration-200',
        dragging && 'm-prompt-drag',
        className,
      )}
    >
      <label htmlFor={id} className="mb-2.5 block text-[13px] text-steam-4">
        Paste your drilling report or attach a file
      </label>
      <div className="relative">
        <textarea
          id={id}
          ref={textRef}
          rows={3}
          disabled={busy}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="block min-h-[78px] w-full resize-none border-0 bg-transparent p-0 text-[17px] leading-normal text-steam caret-heat-6 outline-none"
        />
        {typing && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-[17px] leading-normal text-steam/90">
            {typed}
            <span className="m-caret" />
          </div>
        )}
      </div>

      {file && (
        <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-chip border border-m-line bg-m-ink-2 py-1.5 pr-1 pl-3 font-mono text-xs text-steam-2">
          <span className="truncate">{file.name}</span>
          <span className="text-steam-4">{(file.size / 1048576).toFixed(1)} MB</span>
          <button type="button" aria-label="Remove attached report" disabled={busy} onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="inline-flex size-11 items-center justify-center rounded-lg text-steam-4 hover:bg-white/5 hover:text-steam">
            <IconX size={14} />
          </button>
        </div>
      )}
      {status && <div className="m-status mt-3"><p role="status" aria-live="polite">{status}</p>{busy && onCancel && <button type="button" className="m-chip mt-2" onClick={onCancel}>Stop waiting</button>}</div>}
      {error && <p role="alert" className="mt-2 text-[13px] text-npt-ink">{error}</p>}

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className="m-chip" onClick={() => pick(ACCEPT_ALL)}>
            <IconAttach size={15} />Attach report
          </button>
          <button type="button" disabled={busy} className="m-chip" onClick={() => pick(ACCEPT_SHEETS)}>
            <IconTable size={15} />CSV / XLSX
          </button>
          <Link href={demoHref} className="m-chip">
            <IconSpark size={15} />Try the demo well
          </Link>
        </div>
        <button type="submit" aria-label="Analyze report" disabled={busy} className="m-send m-heat-fill disabled:opacity-70">
          {busy ? <span className="m-spin size-4 rounded-full border-2 border-white/40 border-t-white" /> : <IconArrowUp size={18} strokeWidth={2} />}
        </button>
      </div>
      <input disabled={busy} ref={fileRef} type="file" accept={ACCEPT_ALL} className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
    </form>
  );
}

