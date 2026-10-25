import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import { PrintSummary } from "@/components/dashboard/PrintSummary";
import { DEMO_REPORT } from "@/data/demo-report";
import { buildWellReport } from "@/lib/analytics/compute";

describe("selected analysis printing", () => {
    it("keeps the console report visible while hiding dashboard and homepage chrome in print media", () => {
        const css = postcss.parse(readFileSync("src/styles/mantle.css", "utf8"));
        const hidden: string[] = [];
        css.walkAtRules("media", media => {
            if (media.params !== "print") return;
            media.walkRules(rule => {
                if (rule.nodes.some(node => node.type === "decl" && node.prop === "display" && node.value === "none")) hidden.push(rule.selector);
            });
        });
        expect(hidden).toContain(".mantle-console .m-console-layout");
        expect(hidden).toContain(".mantle-page:not(.mantle-console)");
        expect(hidden).not.toContain(".mantle-page");
        expect(hidden).not.toContain(".mantle-console");
        expect(hidden).not.toContain(".mantle-console .print-summary");
    });
    it("prints every event, exact evidence and every warning without the previous top-five/top-four truncation", () => {
        const report = {...DEMO_REPORT, warnings: Array.from({length:8},(_,i)=>`Review warning ${i+1}`)};
        const html = renderToStaticMarkup(<PrintSummary report={report} fileName="selected-report.csv"/>);
        expect(html).toContain("Selected analysis: selected-report.csv");
        expect(html.match(/class="print-evidence"/g)).toHaveLength(report.events.length);
        for (const event of report.events) expect(html).toContain(renderToStaticMarkup(<blockquote>{event.evidence.snippet}</blockquote>));
        for (const warning of report.warnings) expect(html).toContain(warning);
        expect(html).toContain("Scenario assumptions and calculation basis");
        expect(html).toContain("Complete activity timeline");
    });
    it("uses the passed selection and its recalculated scenario instead of the built-in sample", () => {
        const report = buildWellReport({wellName:"Selected Delta well",reportDate:"2026-10-23",warnings:[],events:[{...DEMO_REPORT.events[0],id:"selected-event",classification:"NPT",startMinute:0,endMinute:60,evidence:{fileName:"delta.csv",page:null,row:9,sheet:"Day 1",snippet:"Exact delta source text."}}]},{scenario:{rigDailyUsd:240000}});
        const html = renderToStaticMarkup(<PrintSummary report={report} fileName="Scenario copy · delta.csv"/>);
        expect(html).toContain("Selected Delta well");expect(html).toContain("$10,000");
        expect(html).toContain("Scenario copy · delta.csv");expect(html).toContain("Row 9");expect(html).toContain("Sheet Day 1");
        expect(html).toContain("UNVERIFIED");expect(html).not.toContain("Mantle Lab");expect(html).not.toContain("SYNTHETIC DEMO");
    });
    it("keeps missing depth, efficiency and carbon unavailable in an empty report", () => {
        const report = buildWellReport({wellName:"",reportDate:"",warnings:[],events:[]});
        const html = renderToStaticMarkup(<PrintSummary report={report}/>);
        expect(html.match(/Not available/g)?.length).toBeGreaterThanOrEqual(4);
        expect(html).toContain("No extracted events");expect(html).toContain("Unknown (not configured)");
        expect(html).not.toContain("0.00 t");
    });
});
