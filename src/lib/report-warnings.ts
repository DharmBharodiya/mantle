export const MAX_WARNINGS = 2000;
export function boundedWarnings(values: Iterable<string>): string[] {
    const warnings = [...new Set(values)];
    return warnings.length <= MAX_WARNINGS ? warnings : [...warnings.slice(0, MAX_WARNINGS - 1), `${warnings.length - MAX_WARNINGS + 1} additional review warnings are summarized because this report reached the warning display limit. Inspect all source events before relying on this report.`];
}
