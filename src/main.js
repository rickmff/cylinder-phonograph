// Entry point. Loads every module in order, applies the URL test options and runs the frame loop.

import { $, FIXED, MAXF, QS, canvas, gl } from './context.js';
import { V3, clamp } from './math.js';
import './mesh.js';
import './gl-util.js';
import { OMEGA, PITCH, PLY, RB, RBU, RC, XA, YM, ZM } from './constants.js';
import { AE, app, mach, state, swap } from './state.js';
import { YC0 } from './contact.js';
import { AcousticPlayer, AcousticRecorder, setPlayGain } from './acoustics.js';
import { FSG, GDATA, NREV, ROWS, RPS, SPR, traceAt } from './groove.js';
import { cutSignal } from './cut.js';
import './scores.js';
import './music.js';
import { CYLS, curCyl, genCyl } from './cylinders.js';
import { VIEWS, cam, camT, setView, view } from './camera.js';
import './shaders.js';
import './programs.js';
import './environment.js';
import { makeLabel } from './label.js';
import { flushGroove, markDirty, rebuildHC } from './groove-texture.js';
import { BOXP, CRK, KEY_Y, KEY_Z0, LID_ON, LID_T, LID_TABLE, VOLK, crankM, keyM, levM, lidM, parts } from './scene.js';
import { adaptQuality, lastVP, render, resize } from './render.js';
import { hitCyl, pickMech, rayAt } from './picking.js';
import { carriageX, coneG, endTurn, govTau, handStep, mechStep, moveNeedle, offAxisFc, volLaw, wow } from './mechanics.js';
import { FIG } from './figures.js';
import { BV, TOUR, TX, closeTour, openTour, showStep, tourLive } from './tour.js';
import { closeDocs, openDocs } from './docs.js';
import { bPlay, fmt, msg, msgT, renderShelf, say, showTip, tipFor, updateUI } from './hud.js';
import { loadUserCyls } from './storage.js';
import { SEGT, SWAP_PRE, chooseCylinder, cylPose, doSwapData } from './swap.js';
import { clack, ratchet, setVol, spatialUpdate } from './audio.js';
import { isAudioFile, shave, stopRec } from './recording.js';
import { openFit } from './fit.js';
import { setSpeed } from './controls.js';
import { XMAX, XMIN, endScratch, scratchMove, startScratch, toggleLid, turnKey } from './input.js';

let uiT=0;
function renderAudio(sec,T0,fs=48000,gain){if(gain)setPlayGain(gain);const P=new AcousticPlayer(fs),n=Math.floor(sec*fs),o=new Float32Array(n);let rot=0;
 for(let i=0;i<n;i++){rot+=OMEGA*wow(i/fs)/fs;o[i]=P.step(traceAt(T0+rot/(2*Math.PI)),true)}renderAudio.fly=P.fly/P.n;return o}
if(QS.has('t')){mach.rot=+QS.get('t')*OMEGA;state.cx=XA+PITCH*(mach.nOff+mach.rot/(2*Math.PI))}
if(QS.get('view')&&VIEWS[QS.get('view')]){setView(QS.get('view'));Object.assign(cam,JSON.parse(JSON.stringify(camT)))}
if(QS.has('speed'))setSpeed(+QS.get('speed'));
if(QS.has('vol'))AE.vol=Math.max(0,Math.min(1,+QS.get('vol')));
if(QS.has('lid')){state.lidU=+QS.get('lid')||1;app.lidTarget=state.lidU>0.5?1:0}
if(QS.has('key')){state.keyA=1;app.keyTarget=1}
if(QS.has('tour'))setTimeout(()=>{openTour(+QS.get('tour')||0);Object.assign(cam,JSON.parse(JSON.stringify(camT)));state.lens=Math.min(0.8,($('#tour').offsetHeight+28)/innerHeight)},0);
if(QS.has('docs'))setTimeout(()=>openDocs(QS.get('docs')||undefined),0);
if(QS.has('shelf')){$('#shelf').hidden=false;$('#bCyl').classList.add('on')}
if(QS.has('fitdemo'))setTimeout(()=>openFit(new Float32Array(48000*145),48000,145),0);
if(QS.has('cyl')&&CYLS.find(c=>c.id===QS.get('cyl')))doSwapData(QS.get('cyl'));
if(QS.has('swapu')){swap.phase=1;swap.t=SWAP_PRE+(+QS.get('swapu'))*SEGT;swap.to=app.curId;swap.hold=true}
if(QS.has('play')){mach.mode='play';mach.motorOn=true;mach.omega=OMEGA;mach.lev=1}
if(QS.has('cuttest')){const sec=+QS.get('cuttest')||8;shave();const N=Math.floor(sec*RPS*SPR),sig=new Float32Array(N);
 for(let i=0;i<N;i++){const t=i/FSG,f0=150+60*Math.sin(t*1.7);sig[i]=0.06*(0.6*Math.sin(2*Math.PI*f0*t)+0.3*Math.sin(2*Math.PI*2.03*f0*t)+0.2*Math.sin(2*Math.PI*3.1*f0*t))*(0.5+0.5*Math.sin(t*5.0))}
 const j0=Math.floor(0.2*SPR);cutSignal(sig,j0,FSG);rebuildHC(0,ROWS-1);markDirty(0,ROWS-1);
 mach.mode='rec';mach.motorOn=true;mach.lev=1;mach.omega=OMEGA;const Te=0.2+N/SPR;mach.nOff=Math.floor(Te);mach.rot=(Te-mach.nOff)*2*Math.PI;mach.cutD=GDATA[j0+N-1]}
if(QS.has('cam')){const c=QS.get('cam').split(',').map(Number);camT.t=[c[0],c[1],c[2]];camT.yaw=c[3];camT.pitch=c[4];camT.dist=c[5];Object.assign(cam,JSON.parse(JSON.stringify(camT)))}
updateUI();
addEventListener('resize',resize);
let tPrev=performance.now(),tStart=tPrev,frames=0;
function frame(now){
 const dt=Math.max(0,Math.min(0.05,(now-tPrev)/1000));tPrev=Math.max(tPrev,now);frames++;
 if(!FIXED)adaptQuality(dt,now,frames);
 // mechanics: the audio callback drives them while sound runs; otherwise integrate here
 const live=!!(AE.ctx&&AE.ctx.state==='running');
 if(!live){const t0=mach.time;mechStep(dt);if(mach.hand.on){const a0=(now-mach.hand.t)/1000;for(let k=0;k<8;k++)handStep(dt/8,a0+k*dt/8)}else mach.rot+=mach.omega*wow(t0)*dt;if(mach.mode==='play'&&mach.motorOn&&mach.nOff+mach.rot/(2*Math.PI)>=endTurn())mach.endPlay=true}
 if(mach.endRec){mach.endRec=false;stopRec();say('end of cylinder · recording stopped',4500)}
 if(mach.endPlay){mach.endPlay=false;mach.motorOn=false;say('end of cylinder');updateUI()}
 flushGroove();
 const ext=live?Math.min(0.1,Math.max(0,(now-mach.tAudio)/1000)):0,rotV=mach.rot+mach.omega*ext;
 state.chip=(state.chip||0)+(mach.mode==='rec'&&mach.engaged?Math.min(mach.omega*RC/0.0013,6)*2*Math.PI*dt:0);state.rot=rotV;state.rotMod=((rotV%(2*Math.PI))+2*Math.PI)%(2*Math.PI);state.time=mach.time;
 if(mach.hand.on&&now-mach.hand.t>Math.max(45,mach.hand.iv*2500))mach.hand.w=0;   // the hand stopped moving: hold still
 {const lt=mach.motorOn?1:0,was=mach.lev;mach.lev+=Math.max(-dt*7,Math.min(dt*7,lt-mach.lev));if(was!==lt&&mach.lev===lt)clack(0.22,1700,6,[0.075,PLY+0.02,0.1])}   // lever snaps into its detent
 {const was=state.lidU;state.lidU=clamp(state.lidU+Math.sign(app.lidTarget-state.lidU)*dt/LID_T,0,1);if(was<1&&state.lidU===1)clack(0.26,300,14,V3.add(LID_ON,[0,0.02,0]));if(was>0&&state.lidU===0)clack(0.2,240,12,LID_TABLE)}
 {const was=state.keyA;state.keyA=clamp(state.keyA+Math.sign(app.keyTarget-state.keyA)*dt/0.32,0,1);if(was!==app.keyTarget&&state.keyA===app.keyTarget){clack(0.22,1300,8,[0,KEY_Y,KEY_Z0]);clack(0.12,2600,3,[0,KEY_Y,KEY_Z0])}}
 if(mach.drag){const D=mach.drag,k=320,c=2*Math.sqrt(k)*0.9,h=dt/4;for(let i=0;i<4;i++){D.v+=(k*(D.tx-D.x)-c*D.v)*h;D.x+=D.v*h}if(D.x<XMIN||D.x>XMAX){D.x=clamp(D.x,XMIN,XMAX);D.v=0}}   // carriage has mass and slides on the rod
 const Tc=mach.drag?(mach.drag.x-XA)/PITCH:mach.nOff+rotV/(2*Math.PI);
 state.cx=(mach.transit||mach.drag)?carriageX(rotV):XA+PITCH*Tc;state.lift=mach.lift*0.0019;
 {const bT=mach.omega/60/(2*Math.PI);let a=0;for(let k=0;k<7;k++)a+=traceAt(Tc-bT*k/6);
  state.dy=mach.mode==='rec'?-(mach.cutD*1e-6)-(YC0-RB):(mach.engaged?(a/7+RBU)*1e-6-YC0:0)}
 if(swap.phase&&!swap.hold){swap.t+=dt;
  if(swap.phase===1){state.cylU=clamp((swap.t-SWAP_PRE)/SEGT,0,1);if(swap.t>=SWAP_PRE+SEGT){doSwapData(swap.to);swap.phase=2;swap.t=0}}
  else{state.cylU=1-clamp(swap.t/SEGT,0,1);if(swap.t>=SEGT){state.cylU=0;swap.phase=0;const f=swap.then;swap.then=null;
   if(f)f();else{moveNeedle(0.25);if(swap.autoplay)mach.autoplay=true}updateUI();renderShelf()}}}
 else if(swap.hold)state.cylU=clamp((swap.t-SWAP_PRE)/SEGT,0,1);
 state.pose=cylPose(state.cylU);
 if(mach.autoplay&&!mach.transit&&mach.engaged&&mach.lift<0.05&&!swap.phase){mach.autoplay=false;mach.mode='play';mach.motorOn=true;updateUI()}
 {const dcx=state.cx-(state.pcx??state.cx);state.pcx=state.cx;const t=camT.t,ry=t[1]-YM,rz=t[2]-ZM;
  if(!mach.transit&&Math.abs(dcx)<0.001&&Math.abs(t[0]-state.cx)<0.008&&Math.hypot(ry,rz)<RC+0.012&&Math.abs(Math.atan2(rz,ry))<0.6&&!(VIEWS.stylus.follow&&view==='stylus')){camT.t[0]+=dcx;cam.t[0]+=dcx}}
 const dc=app.crankTarget-state.crank,stp=Math.sign(dc)*Math.min(Math.abs(dc),dt*(2.4+Math.abs(dc)*0.8));state.crank+=stp;if(stp>0){mach.spring=Math.min(1,mach.spring+stp/(2*Math.PI)*0.07);ratchet(stp)}
 if(VIEWS.stylus.follow&&view==='stylus')camT.t[0]=state.cx;
 const kk=1-Math.exp(-dt*7);cam.yaw+=(camT.yaw-cam.yaw)*kk;cam.pitch+=(camT.pitch-cam.pitch)*kk;cam.dist+=(camT.dist-cam.dist)*kk;cam.t=V3.lerp(cam.t,camT.t,kk);
 if(!QS.has('norender'))render(now/1000);
 tourLive(now);
 {const tc=$('#tour'),tgt=tc.hidden?0:Math.min(0.8,(tc.offsetHeight+28)/Math.max(1,innerHeight));state.lens=(state.lens||0)+(tgt-(state.lens||0))*(1-Math.exp(-dt*6))}
 if(now-uiT>110){uiT=now;const rec=mach.mode==='rec',rps=mach.rpm/60,cy=curCyl(),pl=mach.mode==='play'&&mach.motorOn;
  const st=rec?'recording':(mach.transit||!mach.engaged?'moving the stylus':(mach.mode==='play'&&mach.omega>0.3*mach.speed?(!mach.motorOn?'stopping':mach.spring<0.12?'playing · the spring is running down':'playing'):(mach.spring<0.02?'spring run down':'stopped')));
  bPlay.dataset.tip=(pl?'Pause':'Play')+' (space)\n'+cy.title+' · '+fmt(Math.max(0,Math.min(NREV,Tc))/rps)+' / '+fmt(NREV/rps)+'\n'+st;
  $('#posRing').style.strokeDashoffset=(100*(1-Math.max(0,Math.min(1,Tc/NREV)))).toFixed(1);
  $('#sprRing').style.strokeDashoffset=(100*(1-mach.spring)).toFixed(1);$('#bWind').classList.toggle('low',mach.spring<0.12);
  $('#bWind').dataset.tip='Wind the spring · '+Math.round(mach.spring*100)+'%';
  $('#bCyl').dataset.tip='Cylinders (C)\n'+cy.title+' · '+Math.round(mach.rpm*mach.speed*10)/10+' rpm · '+{brown:'brown wax',black:'black wax',pink:'pink celluloid'}[cy.wax];
  $('#shelf').classList.toggle('playing',pl&&mach.omega>0.3*mach.speed);
  {const t=$('#toast'),on=now<msgT&&$('#shelf').hidden;t.classList.toggle('on',on);if(on&&t.innerHTML!==msg)t.innerHTML=msg}
  if(rec){$('#lvb').style.width=Math.min(100,mach.lvl/44*100).toFixed(0)+'%';$('#lvi').classList.toggle('hot',now-mach.clip<600)}
  if(tipFor)showTip(tipFor)}
 if(!started){started=true;setTimeout(()=>$('#loading').classList.add('gone'),60)}
 if(frames>=MAXF){gl.finish();document.title='done:'+((performance.now()-tStart)/frames).toFixed(0)+'ms';return}
 requestAnimationFrame(frame)}
let started=false;
resize();
const fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))]):Promise.resolve();
fontsReady.then(()=>{try{makeLabel(curCyl())}catch(e){console.warn(e)}});
renderShelf();loadUserCyls();
{const q=CYLS.filter(c=>!c.blank&&!c.data);const pump=()=>{const c=q.shift();if(!c)return;if(!c.data)c.data=genCyl(c);renderShelf();setTimeout(pump,400)};if(!QS.has('frames'))setTimeout(pump,2500)}
requestAnimationFrame(frame);
window.__fono={openTour,showStep,closeTour,openDocs,closeDocs,FIG,TX,BV,volLaw,govTau,coneG,offAxisFc,TOUR,startScratch,scratchMove,endScratch,hitCyl,lidM,keyM,toggleLid,turnKey,spatialUpdate,LID_ON,BOXP,KEY_Y,KEY_Z0,getLid:()=>[state.lidU,app.lidTarget],getKey:()=>[state.keyA,app.keyTarget],AE,setVol,VOLK,screenOf:p=>{const m=lastVP,x=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],y=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15],r=canvas.getBoundingClientRect();return[r.left+(x/w*0.5+0.5)*r.width,r.top+(0.5-y/w*0.5)*r.height]},levM,crankM,CRK,pickMech,rayAt,isAudioFile,doSwapData,CYLS,genCyl,chooseCylinder,swap,audioState:()=>AE.ctx?AE.ctx.state+'@'+AE.ctx.sampleRate:'none',state,parts,cam,camT,setView,mach,renderAudio,GDATA,SPR,NREV,FSG,AcousticRecorder,AcousticPlayer};
