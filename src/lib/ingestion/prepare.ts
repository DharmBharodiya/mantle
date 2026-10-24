import ExcelJS from "exceljs";

export async function prepareUpload(file:File):Promise<{fileName:string;mimeType:string;contents:string|Uint8Array}> {
  if(!/\.(pdf|csv|xlsx|txt)$/i.test(file.name)) throw new Error("Supported files: PDF, CSV, XLSX, TXT.");
  if(file.size===0 || file.size>8*1024*1024) throw new Error("Upload must be 1 byte to 8 MB.");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const base={fileName:file.name};
  if(/\.pdf$/i.test(file.name)) {
    if(new TextDecoder().decode(bytes.slice(0,4))!=="%PDF") throw new Error("File signature is not a valid PDF.");
    return {...base,mimeType:"application/pdf",contents:bytes};
  }
  if(/\.xlsx$/i.test(file.name)) {
    // Parse spreadsheets deterministically into row text; LLM does classification.
    const wb=new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(bytes) as never);
    const rows:string[]=[];
    wb.eachSheet(sheet=>{
      rows.push(`SHEET: ${sheet.name}`);
      sheet.eachRow((row,number)=>{if(rows.length<1500) rows.push(`Row ${number}: ${row.values?.toString()??""}`);});
    });
    return {...base,mimeType:"text/plain",contents:rows.join("\n").slice(0,120000)};
  }
  return {...base,mimeType:"text/plain",contents:new TextDecoder().decode(bytes).slice(0,120000)};
}
