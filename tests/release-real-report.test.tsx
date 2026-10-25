import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { importSnapshot } from '@/lib/reports/manage';
import { buildWellReport } from '@/lib/analytics/compute';
import { ConsoleOverview } from '@/components/mantle/console/ConsoleOverview';
import { PrintSummary } from '@/components/dashboard/PrintSummary';

const report = importSnapshot(readFileSync('demo-fixtures/public/forge-78b-32/2021-06-28-gemini.snapshot.json', 'utf8'));
describe('release rendering with the recorded genuine FORGE report (server markup, not browser QA)', () => {
  it('shows the selected real event and canonical report values rather than synthetic demo values', () => {
    const selected = report.events.find(event => event.startMinute === 870)!;
    const html = renderToStaticMarkup(<ConsoleOverview report={report} selectedId={selected.id} onSelect={() => {}} onScenario={() => {}} />);
    expect(html).toContain('17 of 17');
    expect(html).toContain('421');
    expect(html).toContain('24.0');
    expect(html).toContain(selected.evidence.fileName);
    expect(html).toContain(renderToStaticMarkup(<>{selected.evidence.snippet}</>));
    expect(html).not.toContain('PUMP #2 LINER SEAL FAILED');
    expect(html).not.toContain('6,590');
  });
  it('prints all real evidence and explicit scenario assumptions without replacing unavailable carbon', () => {
    const scenario = buildWellReport(report, {scenario: {...report.scenario, rigDailyUsd: 240000, drillBenchmarkFtPerHour: 100, excessFuelGallonsPerHour: null}});
    const html = renderToStaticMarkup(<PrintSummary report={scenario} fileName="FORGE scenario copy" />);
    expect(html.match(/class="print-evidence"/g)).toHaveLength(17);
    for (const event of report.events) expect(html).toContain(renderToStaticMarkup(<blockquote>{event.evidence.snippet}</blockquote>));
    expect(html).toContain('$5,700');
    expect(html).toContain('100 ft/h');
    expect(html).toContain('Unknown (not configured)');
    expect(html).toContain('UNVERIFIED');
    expect(html).not.toContain('SYNTHETIC DEMO');
    expect(scenario.metrics.modeledExcessCo2Tons).toBeNull();
  });
});
