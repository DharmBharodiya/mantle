import type { SVGProps } from 'react';

/** Mantle icon set: 24px grid, 1.7 stroke, round caps, currentColor. Never mix in filled or emoji icons. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const IconAttach = (p: IconProps) => <Base {...p}><path d="M20 11.5 12.5 19a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" /></Base>;
export const IconTable = (p: IconProps) => <Base {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></Base>;
export const IconSpark = (p: IconProps) => <Base {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Base>;
export const IconArrowUp = (p: IconProps) => <Base {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Base>;
export const IconArrowRight = (p: IconProps) => <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const IconArrowUpRight = (p: IconProps) => <Base {...p}><path d="M7 17 17 7M9 7h8v8" /></Base>;
export const IconUpload = (p: IconProps) => <Base {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></Base>;
export const IconDownload = (p: IconProps) => <Base {...p}><path d="M12 4v12M6 10l6 6 6-6M4 20h16" /></Base>;
export const IconAlert = (p: IconProps) => <Base {...p}><path d="M12 4 3 20h18L12 4z" /><path d="M12 10v4M12 17h.01" /></Base>;
export const IconGauge = (p: IconProps) => <Base {...p}><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 16l4-5" /></Base>;
export const IconChart = (p: IconProps) => <Base {...p}><path d="M4 5v14h16" /><path d="M7 8l4 4 3-2 5 6" /></Base>;
export const IconLeaf = (p: IconProps) => <Base {...p}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" /><path d="M5 19l7-7" /></Base>;
export const IconEye = (p: IconProps) => <Base {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Base>;
export const IconLink = (p: IconProps) => <Base {...p}><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></Base>;
export const IconGrid = (p: IconProps) => <Base {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Base>;
export const IconFile = (p: IconProps) => <Base {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></Base>;
export const IconCompare = (p: IconProps) => <Base {...p}><path d="M7 4v16M17 4v16M3 8h8M13 16h8" /></Base>;
export const IconChevronLeft = (p: IconProps) => <Base {...p}><path d="M15 6l-6 6 6 6" /></Base>;
export const IconChevronRight = (p: IconProps) => <Base {...p}><path d="M9 6l6 6-6 6" /></Base>;
export const IconSelector = (p: IconProps) => <Base {...p}><path d="M8 9l4-4 4 4M16 15l-4 4-4-4" /></Base>;
export const IconInfo = (p: IconProps) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Base>;
export const IconX = (p: IconProps) => <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>;
