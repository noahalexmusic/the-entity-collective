const roles=new Set(["Survivor","Killer","Team Captain","Streamer / Creator","Coach / Analyst","Caster / Staff"]);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const clean=(v,max)=>typeof v==="string"?v.trim().slice(0,max):"";
const html=(s)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=="/api/apply")return env.ASSETS.fetch(request);
  if(request.method!=="POST")return json({error:"Method not allowed"},405);
  if(!env.RESEND_API_KEY)return json({error:"Applications are not open yet. Please try again later."},503);
  const origin=request.headers.get("origin");
  if(origin&&origin!==url.origin)return json({error:"Invalid request origin"},403);
  if(Number(request.headers.get("content-length")||0)>12000)return json({error:"Application is too large"},413);
  let data;try{data=await request.json()}catch{return json({error:"Invalid application"},400)}
  if(!data||typeof data!=="object"||Array.isArray(data))return json({error:"Invalid application"},400);
  if(data.website)return json({ok:true});
  const role=clean(data.role,40),name=clean(data.name,80),email=clean(data.email,160),discord=clean(data.discord,80),region=clean(data.region,80),experience=clean(data.experience,1500),motivation=clean(data.motivation,1500),links=clean(data.links,400);
  if(!roles.has(role)||!name||!region||!experience||!motivation||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"Please complete all required fields."},400);
  const rows=[["Role",role],["Name",name],["Email",email],["Discord",discord||"Not provided"],["Region / Time zone",region],["Experience",experience],["Why TEC",motivation],["Links",links||"None"]];
  const body='<h2>New Entity Collective application</h2><p>Submitted through the TEC website. Review before replying.</p><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">'+rows.map(([k,v])=>'<tr><th align="left">'+html(k)+'</th><td style="white-space:pre-wrap">'+html(v)+'</td></tr>').join("")+'</table>';
  let res;try{res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"authorization":"Bearer "+env.RESEND_API_KEY,"content-type":"application/json"},body:JSON.stringify({from:"The Entity Collective <contact@theroyaleorganization.com>",to:["contact@theroyaleorganization.com"],reply_to:email,subject:"[TEC APPLICATION] "+role+" — "+name,html:body})})}catch{return json({error:"Email service unavailable. Please try again later."},502)}
  if(!res.ok)return json({error:"Email delivery could not be confirmed. Please try again later."},502);
  return json({ok:true,message:"Application sent to TEC for review."});
 }
};