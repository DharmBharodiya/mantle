import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/console/page";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { DEMO_REPORT } from "@/data/demo-report";
import { buildWellReport } from "@/lib/analytics/compute";
import { EventDrawer } from "@/components/analytics/EventDrawer";
describe("dashboard output and source truth", () => {
    it("renders an offline synthetic workspace without live P4 affordances", () => {
        const html = renderToStaticMarkup(<Home />);
        expect(html).toContain("SYNTHETIC_DEMO");
        expect(html).toContain("Clarity below the surface");
        expect(html).toContain("Equipment vision");
        expect(html).toContain("Inspect event");
        expect(html).not.toContain("Generate with ElevenLabs");
        expect(html).not.toContain("Connect Photon to dispatch");
    });
    it("renders unknown depth, ILT and emissions as unavailable rather than zero", () => {
        const report = buildWellReport({ wellName: "Unknown source", reportDate: "", events: [], warnings: [] });
        const html = renderToStaticMarkup(<KpiStrip report={report}/>);
        expect(html.match(/Not available/g)?.length).toBeGreaterThanOrEqual(3);
        expect(html).toContain("Fuel differential not configured");
        expect(html).not.toContain("0.00 t");
    });
    it("renders exact evidence and unknown trip ILT without inventing page numbers", () => {
        const html = renderToStaticMarkup(<EventDrawer report={DEMO_REPORT} eventId="ev-08" onClose={() => { }}/>);
        expect(html).toContain("POOH BHA SERVICE / BIT CHANGE");
        expect(html).toContain("Page unavailable");
        expect(html).toContain("Not available");
        expect(html).toContain("Human review required");
    });
});
