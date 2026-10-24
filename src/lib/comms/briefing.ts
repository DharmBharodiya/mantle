import type { WellTelemetryReport } from "@/types/telemetry";
export function createBriefing(report:WellTelemetryReport):string {
  const m=report.metrics;
  const top=report.events.filter(e=>e.classification==="NPT").sort((a,b)=>(b.endMinute-b.startMinute)-(a.endMinute-a.startMinute))[0];
  const source=report.sourceKind==="SYNTHETIC_DEMO"?"This briefing uses a simulated drilling report.":"This report has not yet been independently verified.";
  return `${source} Shift summary for ${report.wellName}. Observed ${Math.round(m.observedMinutes/60*10)/10} hours. Non-productive time: ${(m.nptMinutes/60).toFixed(1)} hours. Benchmark-based drilling delay opportunity: ${(m.iltMinutes/60).toFixed(1)} hours. Example-rate estimated impact: $${Math.round(m.estimatedLossUsd).toLocaleString("en-US")}. ${top?`Largest unplanned stoppage: ${top.explanation}`:"No confirmed unplanned stoppage was classified."} Review source evidence and site procedures before operational decisions.`;
}
export async function generateSpeech(script:string):Promise<Uint8Array> {
  const key=process.env.ELEVENLABS_API_KEY;
  const voice=process.env.ELEVENLABS_VOICE_ID;
  if(!key||!voice) throw new Error("ElevenLabs API key or voice ID missing.");
  const endpoint=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`;
  const response=await fetch(endpoint,{
    method:"POST",headers:{"xi-api-key":key,"Content-Type":"application/json"},
    body:JSON.stringify({text:script.slice(0,1200),model_id:process.env.ELEVENLABS_MODEL_ID||"eleven_flash_v2_5"}),
    signal:AbortSignal.timeout(22000)
  });
  if(!response.ok) throw new Error(`ElevenLabs request failed (HTTP ${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}
