import { Photon } from "@photon-ai/api";
/** PHOTON 2.0 BETA only; do not mix with spectrum-ts stable. */
export async function sendPhotonText(opts:{spaceId:string;senderId:string;text:string;idempotencyKey:string}):Promise<{state:"accepted"}> {
  if(process.env.ENABLE_REAL_DISPATCH!=="true") throw new Error("Real dispatch is disabled. Set ENABLE_REAL_DISPATCH=true after configuration.");
  if(!process.env.PHOTON_API_KEY||!process.env.PHOTON_PROJECT_ID) throw new Error("Photon 2.0 credentials missing.");
  if(!opts.spaceId||!opts.senderId) throw new Error("Photon requires an existing verified conversation space and agent sender ID.");
  const photon=new Photon({headers:{Authorization:`Bearer ${process.env.PHOTON_API_KEY}`}});
  await photon.projects.sendMessage({
    path:{id:process.env.PHOTON_PROJECT_ID},
    headers:{"idempotency-key":opts.idempotencyKey},
    body:{spaceId:opts.spaceId,senderId:opts.senderId,content:{type:"text",format:"plain",text:opts.text}}
  });
  // Accepted for dispatch != delivered to user's phone.
  return {state:"accepted"};
}
