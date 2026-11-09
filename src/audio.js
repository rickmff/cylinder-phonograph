// The audio engine: one loop (`onAudio`) steps the clockwork and records or plays every sample.
// The horn is a 3D source (HRTF panner) and the camera is the listener. Mechanical clicks are synthesised.

import { V3, clamp } from './math.js';
import { D0U, DMAXU, HORN_D, HORN_L, RC, YM, ZM } from './constants.js';
import { AE, mach, state } from './state.js';
import { Hof } from './contact.js';
import { AcousticPlayer, AcousticRecorder } from './acoustics.js';
import { GDATA, HC, NREV, ROWS, SPR, traceAt } from './groove.js';
import { markDirty } from './groove-texture.js';
import { CRK, hornPt } from './scene.js';
import { endTurn, handStep, mechStep, offAxisFc, volLaw, wow } from './mechanics.js';
import { say } from './hud.js';

function setVol(v){v=clamp(v,0,1);if(Math.abs(v-AE.vol)<1e-4)return;AE.vol=v;try{localStorage.setItem('phonograph-volume',String(v))}catch(e){}say('volume '+Math.round(v*100)+'%',1600)}
try{const v=localStorage.getItem('phonograph-volume');if(v!==null&&isFinite(+v))AE.vol=Math.max(0,Math.min(1,+v))}catch(e){}
function ensureAudio(){
 if(AE.ctx){if(AE.ctx.state!=='running')AE.ctx.resume();return true}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
 try{AE.ctx=new AC({latencyHint:'interactive'})}catch(e){return false}
 const fs=AE.ctx.sampleRate;AE.player=new AcousticPlayer(fs);AE.rec=new AcousticRecorder(fs);
 AE.node=AE.ctx.createScriptProcessor(1024,1,2);AE.node.onaudioprocess=onAudio;
 try{buildSpatial()}catch(e){AE.master=null}
 const osc=AE.ctx.createOscillator(),g0=AE.ctx.createGain();g0.gain.value=0;osc.connect(g0);g0.connect(AE.node);osc.start();
 if(!AE.master)AE.node.connect(AE.ctx.destination);AE.ctx.resume();return true}
/* spatial sound: the horn mouth is the source, the camera is the listener */
function setP3(p,v,ctx,k){if(p.positionX){const t=ctx.currentTime;p.positionX.setTargetAtTime(v[0],t,k);p.positionY.setTargetAtTime(v[1],t,k);p.positionZ.setTargetAtTime(v[2],t,k)}else p.setPosition(v[0],v[1],v[2])}
function setO3(p,v,ctx,k){if(p.orientationX){const t=ctx.currentTime;p.orientationX.setTargetAtTime(v[0],t,k);p.orientationY.setTargetAtTime(v[1],t,k);p.orientationZ.setTargetAtTime(v[2],t,k)}else p.setOrientation(v[0],v[1],v[2])}
function panner(o){const p=AE.ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.maxDistance=50;for(const k in o)p[k]=o[k];return p}
function buildSpatial(){const ctx=AE.ctx,sp=ctx.createChannelSplitter(2);AE.node.connect(sp);
 AE.master=ctx.createGain();AE.master.gain.value=4.0;   // calibrated so the overview sounds as loud as before
 const lim=ctx.createDynamicsCompressor();lim.threshold.value=-5;lim.knee.value=6;lim.ratio.value=14;lim.attack.value=0.002;lim.release.value=0.2;AE.master.connect(lim);lim.connect(ctx.destination);
 AE.hornLP=ctx.createBiquadFilter();AE.hornLP.type='lowpass';AE.hornLP.frequency.value=16000;AE.hornLP.Q.value=0.55;   // a horn beams its highs along its axis: off-axis it sounds duller
 AE.pHorn=panner({refDistance:0.5,rolloffFactor:1,coneInnerAngle:70,coneOuterAngle:250,coneOuterGain:0.6});
 AE.pTalk=panner({refDistance:0.012,rolloffFactor:1.3});   // "needle talk": the stylus's own faint scratch, audible only right next to it
 sp.connect(AE.hornLP,0);AE.hornLP.connect(AE.pHorn);AE.pHorn.connect(AE.master);sp.connect(AE.pTalk,1);AE.pTalk.connect(AE.master)}
function spatialUpdate(eye,target){if(!AE.ctx||!AE.master||!AE.pHorn)return;const ctx=AE.ctx,L=ctx.listener,f=V3.norm(V3.sub(target,eye)),k=0.025;
 if(L.positionX){const t=ctx.currentTime;L.positionX.setTargetAtTime(eye[0],t,k);L.positionY.setTargetAtTime(eye[1],t,k);L.positionZ.setTargetAtTime(eye[2],t,k);
  L.forwardX.setTargetAtTime(f[0],t,k);L.forwardY.setTargetAtTime(f[1],t,k);L.forwardZ.setTargetAtTime(f[2],t,k);L.upX.value=0;L.upY.value=1;L.upZ.value=0}
 else{L.setPosition(eye[0],eye[1],eye[2]);L.setOrientation(f[0],f[1],f[2],0,1,0)}
 const bell=V3.add(hornPt(HORN_L),[state.cx,state.lift,0]);setP3(AE.pHorn,bell,ctx,k);setO3(AE.pHorn,HORN_D,ctx,k);
 const c=V3.dot(HORN_D,V3.norm(V3.sub(eye,bell)));AE.hornLP.frequency.setTargetAtTime(offAxisFc(c),ctx.currentTime,0.05);
 setP3(AE.pTalk,[state.cx,YM+RC,ZM],ctx,k)}
function cutSample(T,z){const j=Math.floor(T*SPR);if(j!==AE.cj){flushCut();AE.cj=j}AE.ca+=z;AE.cc++}
function flushCut(){const j=AE.cj;if(j>=0&&j<SPR*ROWS&&AE.cc>0){AE.wn=(AE.wn||0)+((Math.random()-0.5)*0.75-(AE.wn||0))*0.33;const d=Math.max(0,Math.min(DMAXU,D0U+AE.ca/AE.cc+AE.wn));GDATA[j]=d;HC[j]=Hof(d);mach.cutD=d;const r=Math.floor(j/SPR);markDirty(r,r)}AE.ca=0;AE.cc=0}
function onAudio(e){
 const out=e.outputBuffer.getChannelData(0),talk=e.outputBuffer.numberOfChannels>1?e.outputBuffer.getChannelData(1):new Float32Array(out.length),inp=e.inputBuffer.getChannelData(0),n=out.length,fs=AE.ctx.sampleRate,dt=1/fs,t0=mach.time;
 mechStep(n*dt);const H=mach.hand,hAge=H.on?(performance.now()-H.t)/1000:0;
 const rec=mach.mode==='rec',play=mach.mode==='play',contact=mach.engaged&&mach.lift<0.06;let pk=0,T=0;
 for(let i=0;i<n;i++){
  if(H.on)handStep(dt,hAge+i*dt);else mach.rot+=mach.omega*wow(t0+i*dt)*dt;T=mach.nOff+mach.rot/(2*Math.PI);
  if(rec){const cutting=contact&&mach.omega>2&&T>=0&&T<NREV;let x=0;
   if(AE.srcBuf){if(cutting&&AE.srcPos<AE.srcBuf.length)x=AE.srcBuf[AE.srcPos++]}else x=inp[i];
   const z=AE.rec.process(x*AE.sens);if(cutting)cutSample(T,z);const a=Math.abs(z);if(a>pk)pk=a;out[i]=AE.srcBuf?x*0.5:0;
   if(cutting){const v=AE.tp===null?0:z-AE.tp;AE.tp=z;AE.hs+=(v-AE.hs)*0.15;talk[i]=(v-AE.hs)*0.02}else{AE.tp=null;talk[i]=0}}
  else{const live=contact&&T>=0&&T<NREV+0.5,tr=live?traceAt(T):0;out[i]=AE.player.step(tr,live);
   if(live){const v=AE.tp===null?0:tr-AE.tp;AE.tp=tr;AE.hs+=(v-AE.hs)*0.15;talk[i]=(v-AE.hs)*0.03}else{AE.tp=null;talk[i]=0}}}
 {const v=AE.vol,VL=volLaw(v),gt=VL[0],fc=Math.min(fs*0.45,VL[1]),a=1-Math.exp(-2*Math.PI*fc/fs);   // volume knob
  let g=AE.g===null?gt:AE.g,lp=AE.lp;for(let i=0;i<n;i++){g+=(gt-g)*0.002;lp+=(out[i]-lp)*a;let y=(v<0.75?lp:out[i])*g;if(g>1)y=Math.tanh(y);out[i]=y}AE.g=g;AE.lp=lp}
 {const km=Math.min(1,AE.vol/0.08);if(km<1)for(let i=0;i<n;i++)talk[i]*=km}
 mach.tAudio=performance.now();
 if(rec){mach.lvl=Math.max(pk,mach.lvl*0.82);if(pk>40)mach.clip=mach.tAudio;if(T>=NREV||(AE.srcBuf&&AE.srcPos>=AE.srcBuf.length))mach.endRec=true}
 if(play&&mach.motorOn&&T>=endTurn())mach.endPlay=true}
function clack(a=0.12,f=2800,ms=4,pos=null){const ctx=AE.ctx;if(!ctx||ctx.state!=='running')return;   // a short mechanical click, placed where it happens
 const fs=ctx.sampleRate,tau=fs*ms/1000/3,len=Math.floor(tau*6),b=ctx.createBuffer(1,len,fs),d=b.getChannelData(0),w=2*Math.PI*f/fs;
 for(let i=0;i<len;i++)d[i]=a*Math.exp(-i/tau)*(0.6*Math.sin(w*i)+0.4*(Math.random()*2-1));
 const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=b;g.gain.value=Math.min(1,AE.vol/0.08);src.connect(g);
 if(AE.master){const p=panner({refDistance:0.35,rolloffFactor:1});setP3(p,pos||[0,0.17,0],ctx,0.001);g.connect(p);p.connect(AE.master)}else g.connect(ctx.destination);src.start()}
let ratchetAcc=0;function ratchet(d){ratchetAcc+=d;while(ratchetAcc>Math.PI/6){ratchetAcc-=Math.PI/6;clack(0.09,3300+Math.random()*500,3,[CRK[0]+0.03,CRK[1],CRK[2]])}} // pawl clicking over the ratchet teeth

export { clack, ensureAudio, flushCut, ratchet, setVol, spatialUpdate };
