import { afterEach, describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { prepareUpload } from '@/lib/ingestion/prepare';
import { extractStructuredTable } from '@/lib/ingestion/structured';
import { POST } from '@/app/api/ingest/route';
const header=['wellName','reportDate','startMinute','endMinute','activity','classification','startHoleDepthFt','endHoleDepthFt','note'];
const row=['TEST_WELL','2026-10-24','0','60','DRILLING','PRODUCTIVE','1000','1035','DRILL 35 FT'];
async function csv(columns:string[],values:string[]) {
  const encode=(cells:string[])=>cells.map(value=>JSON.stringify(value)).join(',');
  return prepareUpload(new File([encode(columns)+'\n'+encode(values)],'day.csv',{type:'text/csv'}));
}
afterEach(()=>vi.unstubAllEnvs());
describe('unambiguous structured source columns',()=>{
  it.each(['startMinute','start_minute','Start Minute'])('rejects duplicate normalized headers: %s',async duplicate=>{
    const input=await csv([...header,duplicate],[...row,'120']);
    expect(()=>extractStructuredTable(input)).toThrow(/duplicate.*column/i);
  });
  it.each([
    ['startTime','01:00'],['endTime','02:00'],['wellId','OTHER_WELL'],['observation','CONFLICTING SOURCE NOTE'],
  ])('rejects conflicting %s aliases without choosing one',async(column,value)=>{
    const input=await csv([...header,column],[...row,value]);
    expect(()=>extractStructuredTable(input)).toThrow(/conflicting.*column/i);
  });
  it('accepts equivalent minute/clock aliases, a blank alias, and matching source labels',async()=>{
    const input=await csv([...header,'startTime','endTime','wellId','observation'],[...row,'00:00','01:00','','DRILL 35 FT']);
    const output=extractStructuredTable(input)!;
    expect(output.events[0]).toMatchObject({startMinute:0,endMinute:60,startHoleDepthFt:1000,endHoleDepthFt:1035});
    expect(output.events[0].evidence.snippet).toBe('DRILL 35 FT');
    expect(output.wellName).toBe('TEST_WELL');
  });
  it('uses a populated alias when its primary column is blank',async()=>{
    const values=[...row];values[0]='';values[2]='';values[8]='';
    const input=await csv([...header,'wellId','startTime','observation'],[...values,'TEST_WELL','00:00','EXACT SOURCE']);
    expect(extractStructuredTable(input)).toMatchObject({wellName:'TEST_WELL',events:[{startMinute:0,note:'EXACT SOURCE'}]});
  });
  it('rejects XLSX duplicate columns through the actual preprocessing path',async()=>{
    const workbook=new ExcelJS.Workbook();
    workbook.addWorksheet('DDR').addRows([[...header,'End Minute'],[...row,'120']]);
    const input=await prepareUpload(new File([new Uint8Array(await workbook.xlsx.writeBuffer())],'day.xlsx'));
    expect(()=>extractStructuredTable(input)).toThrow(/duplicate.*column/i);
  });
  it.each(['1,2','0x400','1,,000',','])('rejects ambiguous depth notation %s rather than reinterpreting it',async value=>{
    const values=[...row];values[6]=value;
    const input=await csv(header,values);
    expect(()=>extractStructuredTable(input)).toThrow(/depth/i);
  });
  it.each(['1,000','1000','1000.0','1e3'])('retains explicit numeric depth %s',async value=>{
    const values=[...row];values[6]=value;
    expect(extractStructuredTable(await csv(header,values))!.events[0].startHoleDepthFt).toBe(1000);
  });
  it('returns a streamed terminal error and no report for conflicting source columns',async()=>{
    vi.stubEnv('GEMINI_API_KEY','');
    const data=new FormData();
    data.append('file',new File([[...header,'startTime'].join(',')+'\n'+[...row,'01:00'].join(',')],'day.csv'));
    const response=await POST(new Request('http://localhost/api/ingest',{method:'POST',body:data,headers:{Accept:'application/x-ndjson'}}));
    const frames=(await response.text()).trim().split('\n').map(line=>JSON.parse(line));
    expect(frames.at(-1)).toMatchObject({type:'error',status:422,code:'AMBIGUOUS_STRUCTURED_COLUMNS'});
    expect(frames.some(frame=>frame.type==='result'||frame.stage==='ready')).toBe(false);
  });
});
