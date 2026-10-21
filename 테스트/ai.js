/* 디지털 안전 탐험대 2.0 — 독립 Gemini 연결 모듈 v0.3
 * 이 파일은 안전한지 판정하지 않습니다. judge.js에서 UNCLEAR인 문장만 전달됩니다.
 * API 키는 Cloudflare Worker에만 보관해야 합니다.
 */
(function(root){
'use strict';
const ENDPOINT='https://digital-safety-ai.choijihey.workers.dev/';
const AITIMEOUT=16000;
const apiMap={m1_age:'m1_age',m1_school:'m1_school',m1_photo:'m1_photo',m1_pressure:'m1_photo_pressure',m2_reject:'m2_save',m2_pressure:'m2_pressure',m2_help:'m2_help'};
const aiResponse=(data)=>{const v=String(data?.result||'').toUpperCase();if(v==='SAFE')return {status:'safe',reason:''};if(v==='UNSAFE')return {status:'unsafe',reason:String(data.feedback||data.reason||'안전한 방법으로 다시 답해 보세요.')};if(v==='RETRY')return {status:'unclear',reason:String(data.feedback||data.reason||'조금 더 분명하게 답해 보세요.')};return null;};
let blockedUntil=0;
async function evaluate(stage,text,npcMessage,report){
  const tell=(route,ms,status,attempts,reason)=>report?.(route,ms,status,attempts,reason);
  if(!apiMap[stage]){tell('fallback',0,0,0,'worker-stage-not-confirmed');return {status:'fallback'};}
  if(Date.now()<blockedUntil){tell('fallback',0,429,0,'quota-cooldown');return {status:'fallback'};}
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),AITIMEOUT);
  const st=Date.now();let status=0;
  try{
    const payload={scene_id:apiMap[stage],npc_message:npcMessage,student_message:text};
    const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    status=response.status;
    if(!response.ok){
      if([429,502,503].includes(status))blockedUntil=Date.now()+30000;
      tell('fallback',Date.now()-st,status,1,'http-'+status);
      return {status:'fallback'};
    }
    const parsed=await response.json();
    const verdict=aiResponse(parsed);
    if(!verdict){tell('fallback',Date.now()-st,status,1,'invalid-result');return {status:'fallback'};}
    tell('api',Date.now()-st,status,1,verdict.status);
    return verdict;
  }catch(e){
    tell('fallback',Date.now()-st,status,1,e.name==='AbortError'?'timeout':'network');
    return {status:'fallback'};
  }finally{clearTimeout(timer);}
}
root.DSAI=Object.freeze({evaluate,sceneMap:Object.freeze({...apiMap}),build:'ai-v0.3'});
})(window);
