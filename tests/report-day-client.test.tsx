import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ingestReport } from '@/components/dashboard/report-view';
import { ReportDaySelection } from '@/components/mantle/ReportDaySelection';
import { DEMO_REPORT } from '@/data/demo-report';
import { ReportDayReviewError, type ReportDayReview } from '@/types/report-day';
const review:ReportDayReview={reportDates:['2021-06-28','2021-06-29'],pages:[1,2],basis:'SOURCE_REVIEW_REQUIRED'};
const failure={type:'error',requestId:'example-request',code:'MULTI_DAY_REPORT',status:422,error:'Check original day boundaries.',reportDays:review};
afterEach(()=>vi.unstubAllGlobals());
describe('day selection client transaction and markup',()=>{
  it.each([true,false])('retains structured review context and the existing valid report (stream=%s)',async stream=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(stream?new Response(JSON.stringify(failure)+'\n',{headers:{'Content-Type':'application/x-ndjson'}}):Response.json(failure,{status:422})));
    let selected=DEMO_REPORT;
    await expect(ingestReport(new File(['pdf'],'days.pdf'),new AbortController().signal).then(next=>{selected=next;})).rejects.toMatchObject({name:'ReportDayReviewError',review,requestId:'example-request'});
    expect(selected).toBe(DEMO_REPORT);
  });
  it('sends explicit selection with the unchanged original file',async()=>{
    const fetcher=vi.fn().mockResolvedValue(Response.json({...DEMO_REPORT,sourceKind:'PUBLIC_SOURCE_UNREVIEWED'}));vi.stubGlobal('fetch',fetcher);
    const file=new File(['unchanged original'],'original.pdf');const selection={reportDate:'2021-06-29',pages:[2],sourceReviewed:true as const};
    await ingestReport(file,new AbortController().signal,undefined,selection);
    const body=fetcher.mock.calls[0][1].body as FormData;expect(JSON.parse(body.get('reportDay') as string)).toEqual(selection);expect(await (body.get('file') as File).text()).toBe('unchanged original');
  });
  it('does not start selected-day extraction after cancellation',async()=>{
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const controller=new AbortController();controller.abort();
    await expect(ingestReport(new File(['pdf'],'days.pdf'),controller.signal,undefined,{reportDate:'2021-06-28',pages:[1],sourceReviewed:true})).rejects.toThrow(/cancelled/);expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not accept malformed candidate metadata as a recoverable verified date',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...failure,reportDays:{...review,reportDates:['not-a-date']}},{status:422})));
    const error=await ingestReport(new File(['pdf'],'days.pdf'),new AbortController().signal).catch(e=>e);expect(error).toBeInstanceOf(Error);expect(error).not.toBeInstanceOf(ReportDayReviewError);
  });
  it('renders no default date or page selection, a confirmation control, disabled analysis and source-review fallback',()=>{
    const html=renderToStaticMarkup(<ReportDaySelection review={review} fileName="original.pdf" requestId="request-test" busy={false} onAnalyze={()=>{}} onDismiss={()=>{}}/>);
    expect(html).toContain('<option value="" selected="">');expect(html).toContain('type="checkbox"');expect(html).not.toContain(' checked=""');expect(html).toMatch(/disabled="">Analyze selected day/);expect(html).toContain('upload a single-day PDF');expect(html).toContain('request-test');expect(html).not.toContain('<form');
  });
  it('provides an actionable fallback with no invented date when source dates are missing',()=>{
    const html=renderToStaticMarkup(<ReportDaySelection review={{...review,reportDates:[]}} fileName="original.pdf" busy={false} onAnalyze={()=>{}} onDismiss={()=>{}}/>);expect(html).toContain('No date was identified reliably');expect(html).not.toContain('2021-06-28');
  });
});
