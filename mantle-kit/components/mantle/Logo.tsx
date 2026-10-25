import { cn } from '@/lib/mantle/cn';

/**
 * Mantle mark: a ground line, two half-shells of the earth (crust and the hot
 * mantle, filled with heat) and the drill string reaching into it.
 */
export function MantleMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true" className={className}>
      <path d="M2 10h22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 10a8 8 0 0 0 16 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 10a4 4 0 0 0 8 0z" fill="var(--m-heat-5)" />
      <path d="M13 3v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Lowercase wordmark. Never set it in caps, serif, or with a gradient. */
export function MantleLogo({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-steam', className)}>
      <MantleMark size={size} />
      <span className="font-semibold tracking-[-0.03em]" style={{ fontSize: Math.round(size * 0.77) }}>
        mantle
      </span>
    </span>
  );
}
