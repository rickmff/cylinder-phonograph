// Pointer and keyboard: orbit, pan and zoom, and the parts you can grab
// (lever, crank, volume knob, reproducer, cylinder, lid and key).

import { $, canvas } from './context.js';
import { V3, clamp } from './math.js';
import { PITCH, REPY, XA, YM, ZM } from './constants.js';
import { AE, app, mach, state, swap } from './state.js';
import { NREV, RPS } from './groove.js';
import { VIEWS, camT, setView, view } from './camera.js';
import { lastEye } from './render.js';
import { crankAng, hitAt, hitCyl, pickMech, rayAt, reproHit, screenOf } from './picking.js';
import { moveNeedle } from './mechanics.js';
import { bRec, closeShelf, fmt, hideTip, renderShelf, say, setMenu } from './hud.js';
import { clack, ensureAudio, ratchet, setVol } from './audio.js';
import { togglePlay } from './recording.js';

const ptrs=new Map();let mode='orbit',pinch0=0,dist0=0;
const XMIN=XA+0.15*PITCH,XMAX=XA+(NREV-0.3)*PITCH;
const grab={a:null,full:false};
function crankDrag(R,dy){let da;const a=crankAng(R);if(a!==null&&grab.a!==null){da=a-grab.a;da-=2*Math.PI*Math.round(da/(2*Math.PI))}else da=dy*0.012;grab.a=a;
 let dc=-da;   // handle angle runs opposite to the crank angle (clockwise winding)
 if(dc<=0)return;   // the pawl holds: the crank will not turn backwards
 if(mach.spring>=0.999){if(!grab.full){grab.full=true;say('the spring is fully wound · it will not take another turn')}return}
 dc=Math.min(dc,0.5);state.crank+=dc;app.crankTarget=state.crank;mach.spring=Math.min(1,mach.spring+dc/(2*Math.PI)*0.07);ratchet(dc)}
function needlePoint(R){const D=mach.drag,v=V3.sub(lastEye,D.p0);let n=[0,v[1],v[2]];const l=Math.hypot(n[1],n[2]);n=l<1e-6?[0,1,0]:[0,n[1]/l,n[2]/l];
 const dn=V3.dot(R.d,n);if(Math.abs(dn)<1e-5)return null;const t=V3.dot(V3.sub(D.p0,R.o),n)/dn;return t>0?V3.add(R.o,V3.mul(R.d,t)):null}
function toggleLid(){if(swap.phase){say('wait for the cylinder');return}ensureAudio();app.lidTarget=app.lidTarget?0:1}
function turnKey(){ensureAudio();app.keyTarget=app.keyTarget?0:1;say(app.keyTarget?'locked':'unlocked',1400)}
function openShelfSoon(){setTimeout(()=>{const h=$('#shelf');h.hidden=false;$('#bCyl').classList.add('on');renderShelf()},0)}
const sg={phi:0,pt:null,px:0,py:0,sx:0,sy:0,st:0,moved:false};
function startScratch(hc,e){ensureAudio();const H=mach.hand;H.on=true;H.th=mach.rot;H.w=0;H.t=performance.now();H.iv=0.016;
 Object.assign(sg,{phi:Math.atan2(hc[2]-ZM,hc[1]-YM),pt:hc,px:e.clientX,py:e.clientY,sx:e.clientX,sy:e.clientY,st:performance.now(),moved:false});canvas.style.cursor='grabbing'}
function scratchMove(e){const H=mach.hand,R=rayAt(e.clientX,e.clientY),hc=hitCyl(R);let d=0;
 if(hc){const phi=Math.atan2(hc[2]-ZM,hc[1]-YM);d=phi-sg.phi;d-=2*Math.PI*Math.round(d/(2*Math.PI));sg.phi=phi;sg.pt=hc}   // the wax under your finger moves with it
 else{const p=sg.pt,ry=p[1]-YM,rz=p[2]-ZM,a=screenOf(p),b=screenOf([p[0],p[1]-rz*0.01,p[2]+ry*0.01]),sx=(b[0]-a[0])/0.01,sy=(b[1]-a[1])/0.01;   // off the silhouette: keep pushing along the surface
  d=((e.clientX-sg.px)*sx+(e.clientY-sg.py)*sy)/Math.max(sx*sx+sy*sy,400);const c=Math.cos(d),s2=Math.sin(d);sg.pt=[p[0],YM+ry*c-rz*s2,ZM+ry*s2+rz*c];sg.phi+=d}
 sg.px=e.clientX;sg.py=e.clientY;if(Math.hypot(e.clientX-sg.sx,e.clientY-sg.sy)>4)sg.moved=true;
 let th=H.th+d;const T=mach.nOff+th/(2*Math.PI);if(T<0.05)th=(0.05-mach.nOff)*2*Math.PI;else if(T>NREV+0.3)th=(NREV+0.3-mach.nOff)*2*Math.PI;   // the carriage runs out of feed screw at both ends
 const now=performance.now(),dtE=Math.max(0.004,(now-H.t)/1000);H.w=H.w*0.45+((th-H.th)/dtE)*0.55;H.th=th;H.iv=H.iv*0.8+Math.min(0.05,dtE)*0.2;H.t=now}
function endScratch(e){const H=mach.hand;H.on=false;canvas.style.cursor='';   // let go: the cylinder keeps its momentum, then motor or brake take over
 if(e&&e.type==='pointerup'&&!sg.moved&&performance.now()-sg.st<350)pick(e.clientX,e.clientY)}
function startNeedleDrag(R){ensureAudio();const t=reproHit(R);const p0=V3.add(R.o,V3.mul(R.d,isFinite(t)?t:0.3));
 mach.transit=null;mach.engaged=false;mach.rewind=false;mach.drag={x:state.cx,v:0,tx:state.cx,p0,off:p0[0]-state.cx};clack(0.16,2100,5,[state.cx,REPY,ZM]);say('stylus lifted · slide the reproducer along the cylinder')}
function needleDrag(R){const p=needlePoint(R);if(p)mach.drag.tx=clamp(p[0]-mach.drag.off,XMIN,XMAX)}
function dropNeedle(){const D=mach.drag;if(!D)return;mach.drag=null;const T1=(D.x-XA)/PITCH;mach.transit={x0:D.x,x1:D.x,T1,t:0,dur:0.14};clack(0.12,2400,4,[state.cx,REPY,ZM]);say('stylus at '+fmt(Math.max(0,T1)/(mach.rpm/60)))} // lowered: the half-nut meshes and the ball settles into the nearest groove
let hoverT=0;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.classList.add('drag');down={x:e.clientX,y:e.clientY,t:performance.now(),moved:false};
 mode=(e.button===2||e.shiftKey)?'pan':'orbit';
 if(mode==='orbit'&&ptrs.size===1){const R=rayAt(e.clientX,e.clientY),h=pickMech(R);
  if(h==='lever'){mode='lever';togglePlay()}
  else if(h==='volume'){mode='volume';ensureAudio()}
  else if(h==='lid'){mode='tap';toggleLid()}
  else if(h==='box'){mode='tap';openShelfSoon()}
  else if(h==='key'){mode='tap';turnKey()}
  else if(!h&&!e.altKey&&!swap.phase){const hc=hitCyl(R);if(hc){if(mach.mode==='rec')say('stop recording before spinning the cylinder by hand');else{mode='scratch';startScratch(hc,e)}}}
  else if(h==='crank'){mode='crank';ensureAudio();app.crankTarget=state.crank;grab.a=crankAng(R);grab.full=false}
  else if(h==='needle'){if(mach.mode==='rec')say('stop recording before moving the recorder');else{mode='needle';startNeedleDrag(R)}}}
 if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=camT.dist}});
canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);
 if(!p){const now=performance.now();if(now-hoverT>60){hoverT=now;const R=rayAt(e.clientX,e.clientY),h=pickMech(R);canvas.style.cursor=(h==='lever'||h==='lid'||h==='box'||h==='key')?'pointer':h==='needle'?'ew-resize':(h==='crank'||h==='volume')?'grab':(!h&&!e.altKey&&hitCyl(R))?'grab':''}return}if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(ptrs.size===2){const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0>0)camT.dist=Math.min(2.2,Math.max(0.0012,dist0*pinch0/d));panBy(dx*0.5,dy*0.5);return}
 if(mode==='lever'||mode==='tap')return;
 if(mode==='scratch'){const ce=e.getCoalescedEvents?e.getCoalescedEvents():[];if(ce.length>1)for(const q of ce)scratchMove(q);else scratchMove(e);return}
 if(mode==='volume'){setVol(AE.vol+(dx-dy)/220);return}   // drag right or up = louder (clockwise)
 if(mode==='crank'){crankDrag(rayAt(e.clientX,e.clientY),dy);return}
 if(mode==='needle'){needleDrag(rayAt(e.clientX,e.clientY));return}
 if(mode==='orbit'){camT.yaw-=dx*0.0055;camT.pitch=Math.min(1.45,Math.max(0.03,camT.pitch+dy*0.0045))}else panBy(dx,dy);
 if(VIEWS[view].follow&&mode==='pan')VIEWS[view].follow=false});
function panBy(dx,dy){const cy=Math.cos(camT.yaw),sy=Math.sin(camT.yaw),k=camT.dist*0.0011;const right=[cy,0,-sy];const upv=[-Math.sin(camT.pitch)*sy,Math.cos(camT.pitch),-Math.sin(camT.pitch)*cy];
 camT.t=V3.add(camT.t,V3.add(V3.mul(right,-dx*k),V3.mul(upv,dy*k)))}
const endP=e=>{const single=ptrs.size===1;ptrs.delete(e.pointerId);if(!ptrs.size)canvas.classList.remove('drag');pinch0=0;
 const mech=mode==='lever'||mode==='crank'||mode==='needle'||mode==='volume'||mode==='tap'||mode==='scratch';if(mode==='needle')dropNeedle();if(mode==='scratch')endScratch(e);if(mech){mode='orbit';if(!ptrs.size)down=null;return}
 if(e.type==='pointerup'&&single&&down&&!down.moved&&e.button===0&&performance.now()-down.t<600)pick(e.clientX,e.clientY);if(!ptrs.size)down=null};
canvas.addEventListener('pointerup',endP);canvas.addEventListener('pointercancel',endP);
canvas.addEventListener('wheel',e=>{e.preventDefault();const nd=Math.min(2.2,Math.max(0.0012,camT.dist*Math.exp(e.deltaY*0.0012))),k=nd/camT.dist;
 if(k<1){const h=hitAt(e.clientX,e.clientY);if(h){camT.t=V3.add(h,V3.mul(V3.sub(camT.t,h),k));if(view==='stylus')VIEWS.stylus.follow=false}}camT.dist=nd},{passive:false});
canvas.addEventListener('pointerdown',()=>{if(!$('#shelf').hidden)closeShelf();setMenu(false);hideTip()});
let down=null;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{VIEWS.stylus.follow=true;setView(b.dataset.view)});
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;if(!$('#docs').hidden)return;if(e.code==='Space'){e.preventDefault();togglePlay()}else if(e.key==='c'||e.key==='C')$('#bCyl').click();
 else if(e.key==='r'||e.key==='R')bRec.click();
 else if(e.key==='-'||e.key==='_')setVol(AE.vol-0.05);
 else if(e.key==='='||e.key==='+')setVol(AE.vol+0.05);
 else if('1234'.includes(e.key)){VIEWS.stylus.follow=true;setView(['overview','horn','mechanism','stylus'][+e.key-1])}});
function pick(cx,cy){if(mach.mode==='rec')return;const p=hitCyl(rayAt(cx,cy));if(!p||p[0]<XA)return;ensureAudio();moveNeedle((p[0]-XA)/PITCH);say('stylus at '+fmt(Math.max(0,(p[0]-XA)/PITCH)/RPS))}

export { XMAX, XMIN, endScratch, scratchMove, startScratch, toggleLid, turnKey };
