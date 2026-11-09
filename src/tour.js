// "How it works": an illustrated, partly live tour that moves the camera to each part.

import { $ } from './context.js';
import { V3 } from './math.js';
import { HORN_D, HORN_L, RBU, RC, REPY, YM, ZM } from './constants.js';
import { AE, mach, state } from './state.js';
import { GDATA, ROWS, SPR, traceAt } from './groove.js';
import { cam, camTo, setView } from './camera.js';
import { hornPt } from './scene.js';
import { lastEye } from './render.js';
import { coneG, offAxisFc } from './mechanics.js';
import { ART } from './figures.js';
import { closeDocs, openDocs } from './docs.js';
import { closeShelf, hideTip, setMenu } from './hud.js';
import { ensureAudio } from './audio.js';
import { togglePlay } from './recording.js';

function startIfIdle(){ensureAudio();if(mach.mode!=='rec'&&!(mach.mode==='play'&&mach.motorOn))togglePlay()}
const bellPos=()=>V3.add(hornPt(HORN_L),[state.cx,state.lift,0]);
let tourSnap=null,tourSnapT=0;
function liveSamples(c,W,H,now){   // a pressure wave arriving at the right, one number taken from it every tick: x[n] = p(n / fs), slowed down
 const sp=Math.max(11,W/38),t=now/1000*5.5,y0=H*0.52,A=H*0.34,hx=W-16,
  p=u=>{const w=2*Math.PI*u/17;return(Math.sin(w)+0.5*Math.sin(2*w+0.7)+0.22*Math.sin(3*w+1.9))*(0.8+0.2*Math.sin(u*0.071))/1.75},
  X=u=>hx-(t-u)*sp,u0=t-hx/sp-1;
 c.strokeStyle='rgba(236,223,198,.14)';c.lineWidth=1;c.beginPath();c.moveTo(0,y0);c.lineTo(W,y0);c.stroke();
 c.setLineDash([2,4]);c.strokeStyle='rgba(236,223,198,.25)';c.beginPath();c.moveTo(hx,12);c.lineTo(hx,H-12);c.stroke();c.setLineDash([]);
 c.beginPath();for(let u=u0;u<=t+1e-6;u+=0.05){const x=X(u),y=y0-A*p(u);u===u0?c.moveTo(x,y):c.lineTo(x,y)}c.strokeStyle='rgba(210,172,98,.34)';c.lineWidth=1.4;c.stroke();
 c.font='400 9.5px "IBM Plex Mono", monospace';c.textAlign='center';
 for(let n=Math.ceil(u0);n<=Math.floor(t);n++){const x=X(n),v=p(n),y=y0-A*v;c.globalAlpha=Math.max(0,Math.min(1,(x-6)/70));
  c.strokeStyle='rgba(236,223,198,.42)';c.lineWidth=1.2;c.beginPath();c.moveTo(x,y0);c.lineTo(x,y);c.stroke();
  c.fillStyle='#d2ac62';c.beginPath();c.arc(x,y,2.8,0,6.283);c.fill();
  if(n%4===0){c.fillStyle='rgba(236,223,198,.62)';c.textBaseline=v>=0?'bottom':'top';c.fillText((v<0?'−':'')+Math.abs(v).toFixed(2),x,v>=0?y-6:y+6)}}
 c.globalAlpha=1;const yh=y0-A*p(t);c.fillStyle='#f4dca6';c.beginPath();c.arc(hx,yh,3.4,0,6.283);c.fill();
 c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle='rgba(236,223,198,.8)';c.font='500 11px "IBM Plex Mono", monospace';c.fillText('x[n]',14,22)}
function liveTable(c,W,H,now){   // the real depth table under the stylus, right now
 const T=Math.max(0,mach.nOff+state.rot/(2*Math.PI)),j=Math.floor(T*SPR),G=GDATA,span=260,mid=W/2,sc=0.72;
 c.fillStyle='#4f260e';c.fillRect(0,22,W,92);c.fillStyle='#6d3a19';c.fillRect(0,20,W,4);
 if(!tourSnap||now-tourSnapT>170){tourSnapT=now;const w=new Float32Array(span+1);for(let k=-span,i=0;k<=span;k+=2,i++)w[i]=G[j+k]||0;tourSnap={j,v:[],w,pw:tourSnap&&tourSnap.w};for(let k=-13;k<=13;k++)tourSnap.v.push(G[j+k]||0)}
 const f=Math.min(1,(now-tourSnapT)/110),strip=(w,a)=>{c.globalAlpha=a;c.beginPath();for(let i=0;i<w.length;i++){const x=mid+(2*i-span)*(W/2-14)/span,y=22+w[i]*sc;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()};
 c.strokeStyle='#d2ac62';c.lineWidth=1.8;if(tourSnap.pw&&f<1){strip(tourSnap.pw,1-f);strip(tourSnap.w,f)}else strip(tourSnap.w,1);c.globalAlpha=1;
 const yb=22+tourSnap.w[span/2]*sc;c.fillStyle='#a9c3e6';c.beginPath();c.arc(mid,yb-6,6,0,6.283);c.fill();c.strokeStyle='rgba(236,223,198,.8)';c.lineWidth=1.4;c.beginPath();c.moveTo(mid,yb-12);c.lineTo(mid,4);c.stroke();
 const cw=Math.min(54,(W-24)/9),ch=24,x0=(W-cw*9)/2,y0=H-ch*3-14;c.font='500 11px "IBM Plex Mono", monospace';c.textAlign='center';c.textBaseline='middle';
 for(let r=0;r<3;r++)for(let q=0;q<9;q++){const k=r*9+q,v=tourSnap.v[k],x=x0+q*cw,y=y0+r*ch,cur=k===13;
  c.fillStyle=cur?'rgba(210,172,98,.22)':'rgba(236,223,198,'+(0.03+0.05*Math.min(1,v/90))+')';c.fillRect(x+1.5,y+1.5,cw-3,ch-3);
  if(cur){c.strokeStyle='#d2ac62';c.lineWidth=1.4;c.strokeRect(x+1.5,y+1.5,cw-3,ch-3)}c.fillStyle=cur?'#f4dca6':'rgba(236,223,198,.55)';c.fillText(v?Math.round(v):'·',x+cw/2,y+ch/2+0.5)}
 c.textAlign='right';c.fillStyle='rgba(236,223,198,.35)';c.font='400 10px "IBM Plex Mono", monospace';c.fillText('turn '+Math.floor(tourSnap.j/SPR)+' · '+(tourSnap.j%SPR)+' / '+SPR+' · µm',W-12,H-6)}
function liveRadar(c,W,H){   // a top-down map of horn and listener, with what the ears get
 const eye=lastEye,b=bellPos(),hd=HORN_D,f=V3.norm(V3.sub(cam.t,eye)),mapW=W*0.6;
 const xs=[0.2,-0.2,b[0],eye[0]],zs=[0.15,-0.15,b[2],eye[2]],x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
 const s=Math.min((mapW-40)/Math.max(0.05,x1-x0),(H-40)/Math.max(0.05,z1-z0)),ox=20+(mapW-40-(x1-x0)*s)/2-x0*s,oz=20+(H-40-(z1-z0)*s)/2-z0*s,P=(x,z)=>[ox+x*s,oz+z*s];
 c.strokeStyle='rgba(236,223,198,.25)';c.lineWidth=1.2;{const[a,q]=P(-0.16,-0.11);c.strokeRect(a,q,0.32*s,0.22*s)}
 const[bx,bz]=P(b[0],b[2]),ang=Math.atan2(hd[2],hd[0]),R=Math.max(26,0.5*s);
 for(const[half,al]of[[125,0.06],[35,0.16]]){c.fillStyle='rgba(210,172,98,'+al+')';c.beginPath();c.moveTo(bx,bz);c.arc(bx,bz,R,ang-half*Math.PI/180,ang+half*Math.PI/180);c.closePath();c.fill()}
 c.fillStyle='#d2ac62';c.beginPath();c.arc(bx,bz,4,0,6.283);c.fill();
 const[ex,ez]=P(eye[0],eye[2]),fa=Math.atan2(f[2],f[0]);c.setLineDash([4,4]);c.strokeStyle='rgba(236,223,198,.4)';c.beginPath();c.moveTo(bx,bz);c.lineTo(ex,ez);c.stroke();c.setLineDash([]);
 c.strokeStyle='#ecdfc6';c.lineWidth=1.6;c.beginPath();c.arc(ex,ez,9,0,6.283);c.stroke();c.beginPath();c.moveTo(ex+Math.cos(fa)*9,ez+Math.sin(fa)*9);c.lineTo(ex+Math.cos(fa)*15,ez+Math.sin(fa)*15);c.stroke();
 c.fillStyle='#d2ac62';for(const sd of[-1,1]){const a=fa+sd*Math.PI/2;c.beginPath();c.arc(ex+Math.cos(a)*10,ez+Math.sin(a)*10,2.6,0,6.283);c.fill()}
 const d=V3.len(V3.sub(eye,b)),dir=V3.norm(V3.sub(eye,b)),th=Math.acos(Math.max(-1,Math.min(1,V3.dot(hd,dir))))*180/Math.PI,cone=coneG(th),dist=0.5/(0.5+Math.max(d,0.5)-0.5),db=20*Math.log10(cone*dist*4);
 const right=V3.norm(V3.cross(f,[0,1,0])),pan=V3.dot(V3.norm(V3.sub(b,eye)),right),kHz=offAxisFc(V3.dot(hd,dir))/1000;
 const X=mapW+16;c.textAlign='left';c.textBaseline='middle';c.font='500 13px "IBM Plex Mono", monospace';
 const row=(y,icon,txt)=>{c.strokeStyle='rgba(236,223,198,.55)';c.lineWidth=1.5;icon(X+8,y);c.fillStyle='#ecdfc6';c.fillText(txt,X+26,y)};
 row(H*0.2,(x,y)=>{c.beginPath();c.moveTo(x-7,y);c.lineTo(x+7,y);c.moveTo(x-7,y-4);c.lineTo(x-7,y+4);c.moveTo(x+7,y-4);c.lineTo(x+7,y+4);c.stroke()},d.toFixed(2)+' m');
 row(H*0.4,(x,y)=>{c.beginPath();c.moveTo(x-7,y-3);c.lineTo(x-3,y-3);c.lineTo(x+2,y-7);c.lineTo(x+2,y+7);c.lineTo(x-3,y+3);c.lineTo(x-7,y+3);c.closePath();c.stroke()},(db>=0?'+':'')+db.toFixed(1)+' dB');
 row(H*0.6,(x,y)=>{c.beginPath();for(let k=0;k<=14;k++){const xx=x-7+k,yy=y-4*Math.sin(k*0.9);k?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke()},kHz.toFixed(1)+' kHz');
 const by=H*0.8,bw=W-X-34;c.fillStyle='rgba(236,223,198,.55)';c.font='500 11px "IBM Plex Mono", monospace';c.fillText('L',X+2,by);c.fillText('R',X+bw+22,by);c.fillStyle='rgba(236,223,198,.15)';c.fillRect(X+16,by-1.5,bw,3);
 c.fillStyle='#d2ac62';c.beginPath();c.arc(X+16+bw*(0.5+0.5*Math.max(-1,Math.min(1,pan))),by,5,0,6.283);c.fill()}
const rawAt=T=>{const f=T*SPR;if(!(f>=1&&f<SPR*ROWS-2))return 0;const i=Math.floor(f),t=f-i,p0=GDATA[i-1],p1=GDATA[i],p2=GDATA[i+1],p3=GDATA[i+2];
 return p1+0.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)))}; // cut depth (µm), same spline as the shader
const BV={t0:-1e9};
function liveBall(c,W,H,now){   // slow-motion replay of the groove under the stylus: the floor, the path a 70 µm ball can take, where it flies (true horizontal scale)
 const ds=2*Math.PI*RC*1e6/SPR,um=1.45,half=W/2*um/ds,run=2.4*half,dur=4.5,fs=AE.ctx?AE.ctx.sampleRate:48000;
 if((now-BV.t0)/1000>dur||BV.W!==W||BV.H!==H){const T=Math.max(0.6,mach.nOff+state.rot/(2*Math.PI)),K=half+run/2+1,st=SPR*(mach.rpm/60)/fs,a=9000e6/(fs*fs),M=Math.ceil(2*K/st)+2;
  Object.assign(BV,{t0:now,T,K,st,W,H,g:new Float32Array(M),y:new Float32Array(M),fly:new Uint8Array(M)});
  let y=0,v=0;for(let m=0;m<M;m++){const g=traceAt(T+(-K+m*st)/SPR);if(!m)y=g;else{const yh=y+v-0.5*a;if(yh<=g){v=g-y;y=g}else{v-=a;y=yh;BV.fly[m]=1}}BV.g[m]=g;BV.y[m]=y}   // AcousticPlayer.step, at the audio rate
  let lo=1e9,hi=-1e9;for(let k=-K;k<=K;k+=0.25){const d=rawAt(T+k/SPR);if(d<lo)lo=d;if(d>hi)hi=d}
  BV.E=Math.max(1,Math.min(4,Math.floor(Math.min(64*um/Math.max(1,hi-lo),(H-60)*um/Math.max(1,hi)))));   // vertical exaggeration, only when the cut is quiet
  BV.y0=Math.max(10,H-34-hi*BV.E/um);
  const P=AE.player;if(P){const n=P.n-(BV.pn||0),f=P.fly-(BV.pf||0);if(n>2000){BV.r=f/n;BV.pn=P.n;BV.pf=P.fly}}}
 const E=BV.E,u=Math.min(1,(now-BV.t0)/1000/dur),fa=Math.max(0,Math.min(1,u/0.07,(1-u)/0.07)),kc=-run/2+run*u,y0=BV.y0,X=k=>W/2+(k-kc)*ds/um,Y=d=>y0+d*E/um,k0=kc-half-0.6,k1=kc+half+0.6,sm=k=>BV.T+k/SPR;
 c.globalAlpha=fa;c.beginPath();c.moveTo(X(k0),H);for(let k=k0;k<=k1;k+=0.1)c.lineTo(X(k),Y(rawAt(sm(k))));c.lineTo(X(k1),H);c.closePath();c.fillStyle='#4f260e';c.fill();
 c.beginPath();for(let k=k0;k<=k1;k+=0.1){const x=X(k),y=Y(rawAt(sm(k)));k===k0?c.moveTo(x,y):c.lineTo(x,y)}c.strokeStyle='rgba(236,223,198,.55)';c.lineWidth=1.3;c.stroke();
 c.setLineDash([2,4]);c.strokeStyle='rgba(236,223,198,.2)';c.beginPath();c.moveTo(0,y0);c.lineTo(W,y0);c.stroke();c.setLineDash([]);
 const mA=Math.max(1,Math.floor((k0+BV.K)/BV.st)),mB=Math.min(BV.g.length-1,Math.ceil((k1+BV.K)/BV.st)),xm=m=>X(-BV.K+m*BV.st);
 c.beginPath();for(let m=mA;m<=mB;m++){const x=xm(m),y=Y(-BV.g[m]);m===mA?c.moveTo(x,y):c.lineTo(x,y)}c.strokeStyle='#d2ac62';c.lineWidth=1.6;c.stroke();
 c.beginPath();for(let m=mA;m<=mB;m++)if(BV.fly[m]){c.moveTo(xm(m-1),Y(-BV.y[m-1]));c.lineTo(xm(m),Y(-BV.y[m]))}c.strokeStyle='#a9c3e6';c.lineWidth=2;c.stroke();
 const mf=(kc+BV.K)/BV.st,mi=Math.min(BV.y.length-2,Math.max(0,Math.floor(mf))),yb=BV.y[mi]+(BV.y[mi+1]-BV.y[mi])*(mf-mi),Rx=RBU/um,Ry=RBU*E/um,cy=Y(-yb)-Ry;
 c.strokeStyle='rgba(236,223,198,.75)';c.lineWidth=1.4;c.beginPath();c.moveTo(W/2,cy-Ry);c.lineTo(W/2,-2);c.stroke();
 c.fillStyle='rgba(169,195,230,.9)';c.beginPath();c.ellipse(W/2,cy,Rx,Ry,0,0,6.283);c.fill();c.globalAlpha=1;
 const slow=(2*Math.PI*RC*mach.rpm/60)/(run*ds*1e-6/dur),s2=Math.pow(10,Math.floor(Math.log10(slow))-1),sx=Math.round(slow/s2)*s2;
 c.font='400 10px "IBM Plex Mono", monospace';c.textBaseline='alphabetic';const yl=H-10;
 c.lineWidth=2;c.strokeStyle='rgba(236,223,198,.6)';c.beginPath();c.moveTo(12,yl-3.5);c.lineTo(24,yl-3.5);c.stroke();c.strokeStyle='#d2ac62';c.beginPath();c.moveTo(78,yl-3.5);c.lineTo(90,yl-3.5);c.stroke();
 c.fillStyle='rgba(236,223,198,.72)';c.textAlign='left';c.fillText('floor',29,yl);c.fillText('ball path',95,yl);
 c.textAlign='right';c.fillText((E>1?'depth ×'+E:'true scale')+' · '+sx.toLocaleString('en-US')+'× slower · contact '+(100*(1-(BV.r||0))).toFixed(1)+' %',W-12,yl)}
const OMH=[];
function liveClock(c,W,H){   // the governor and the spring, as the code integrates them
 if(!OMH.length)for(let k=0;k<359;k++)OMH.push(mach.omega*60/(2*Math.PI));OMH.push(mach.omega*60/(2*Math.PI));if(OMH.length>360)OMH.shift();
 const pw=W*0.66,x0=16,y0=18,h=H-44,lo=0,hi=200,Y=v=>y0+h*(1-(v-lo)/(hi-lo));
 c.strokeStyle='rgba(236,223,198,.25)';c.setLineDash([3,4]);c.beginPath();c.moveTo(x0,Y(mach.rpm));c.lineTo(x0+pw,Y(mach.rpm));c.stroke();c.setLineDash([]);
 c.beginPath();OMH.forEach((v,k)=>{const x=x0+pw*k/359,y=Y(v);k?c.lineTo(x,y):c.moveTo(x,y)});c.strokeStyle='#d2ac62';c.lineWidth=1.8;c.stroke();
 c.font='500 12px "IBM Plex Mono", monospace';c.fillStyle='#ecdfc6';c.textAlign='left';c.fillText((OMH[OMH.length-1]||0).toFixed(1)+' rpm',x0+4,H-10);
 c.fillStyle='rgba(236,223,198,.45)';c.font='400 10px "IBM Plex Mono", monospace';c.fillText('target '+mach.rpm,x0+pw-70,Y(mach.rpm)-6);
 const bx=W*0.76,bw=22,bh=H-50;c.strokeStyle='rgba(236,223,198,.35)';c.strokeRect(bx,18,bw,bh);c.fillStyle=mach.spring<0.12?'#e0644f':'#d2ac62';c.fillRect(bx+2,18+bh*(1-mach.spring)+2,bw-4,bh*mach.spring-4);
 c.fillStyle='#ecdfc6';c.font='500 12px "IBM Plex Mono", monospace';c.fillText(Math.round(mach.spring*100)+' %',bx+bw+8,24+bh*(1-mach.spring));c.fillStyle='rgba(236,223,198,.45)';c.font='400 10px "IBM Plex Mono", monospace';c.fillText('spring',bx-2,H-10)}
const TX={"samples": ["Sampling", "The mic is read 48,000 times a second: each reading is one number."], "hornf": ["Biquad filters · feedback comb", "Two filters cut the bass; a 2.45 ms echo gives the horn its honk."], "cutter": ["Resonant low-pass · tanh soft clipping", "The glass disc rings at 2.3 kHz; loud sound is squashed to ±44 µm."], "table": ["Averaging · box filter", "Every 1/4096 of a turn keeps one depth: the average of the sound there."], "texture": ["Displacement mapping · Catmull–Rom spline", "The GPU reads the same numbers and pushes the wax in, smoothly."], "ball": ["Morphological dilation · Newton’s second law", "The ball skips dips smaller than itself and flies on steep drops."], "playback": ["Velocity pickup · Schroeder reverb", "Needle speed becomes sound, then disc, horn, box and room filters."], "space": ["Inverse distance law · HRTF", "Farther is quieter, off-axis is duller, and HRTF places it in your ears."], "clock": ["First-order lag", "The governor eases toward 160 rpm; the spring runs down as it plays."]};
const TOUR=[
 {h:'Sound as numbers',eq:'samples',live:liveSamples,cam:()=>setView('horn')},
 {h:'The horn, as filters',eq:'hornf',art:'hornf',cam:()=>setView('horn')},
 {h:'Diaphragm and cutter',eq:'cutter',art:'cutter',cam:()=>camTo([state.cx,REPY-0.004,ZM+0.006],0.95,0.2,0.12)},
 {h:'A table of depths',eq:'table',live:liveTable,cam:()=>{setView('stylus');startIfIdle()}},
 {h:'From array to 3D',eq:'texture',art:'texture',cam:()=>camTo([state.cx+0.0018,YM+RC,ZM+0.0012],0.28,0.52,0.0036)},
 {h:'The ball’s path',eq:'ball',live:liveBall,cam:()=>{setView('stylus');startIfIdle()}},
 {h:'Back to sound',eq:'playback',art:'playback',cam:()=>{camTo(bellPos(),Math.atan2(HORN_D[0],HORN_D[2]),Math.asin(HORN_D[1])+0.06,0.95)}},
 {h:'Sound in 3D',eq:'space',live:liveRadar,cam:()=>{setView('overview');startIfIdle()}},
 {h:'Clockwork, as equations',eq:'clock',live:liveClock,cam:()=>{setView('mechanism');startIfIdle()}}];
let tourI=-1;
const BOOK='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.6C10.2 5.3 7.7 4.7 4.5 4.7v12.6c3.2 0 5.7.6 7.5 1.9 1.8-1.3 4.3-1.9 7.5-1.9V4.7c-3.2 0-5.7.6-7.5 1.9zM12 6.6v12.6"/></svg>';
function openTour(i=0){setMenu(false);closeShelf();hideTip();closeDocs();$('#tour').hidden=false;showStep(i)}
function closeTour(){$('#tour').hidden=true;tourI=-1}
function showStep(i){if(i<0||i>=TOUR.length)return;tourI=i;const S=TOUR[i];
 $('#tourArt').innerHTML=S.live?'<canvas id="tourCv"></canvas>':ART[S.art]();$('#tourH').textContent=S.h;$('#tourEq').textContent=TX[S.eq][0];$('#tourP').textContent=TX[S.eq][1];
 $('#tourDots').innerHTML=TOUR.map((_,k)=>'<i class="'+(k===i?'on':'')+'" data-k="'+k+'"></i>').join('')+'<button class="ib dbook" aria-label="Read the documentation">'+BOOK+'</button>';
 $('#tourPrev').disabled=i===0;$('#tourNext').setAttribute('aria-label',i===TOUR.length-1?'Read the documentation':'Next');tourSnap=null;if(S.live===liveClock)OMH.length=0;BV.t0=-1e9;try{S.cam()}catch(e){}}
const tourFwd=()=>{if(tourI>=TOUR.length-1)openDocs();else showStep(tourI+1)};
function tourLive(now){if(tourI<0||!TOUR[tourI].live)return;const cv=$('#tourCv');if(!cv)return;const dpr=Math.min(2,devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);TOUR[tourI].live(c,W,H,now)}
$('#bHelp').onclick=()=>openTour(0);$('#tourX').onclick=closeTour;$('#tourPrev').onclick=()=>showStep(tourI-1);$('#tourNext').onclick=tourFwd;
$('#tourDots').onclick=e=>{if(e.target.closest&&e.target.closest('.dbook')){openDocs();return}const k=e.target&&e.target.dataset&&e.target.dataset.k;if(k!==undefined)showStep(+k)};
addEventListener('keydown',e=>{if($('#tour').hidden)return;if(e.key==='ArrowRight')tourFwd();else if(e.key==='ArrowLeft')showStep(tourI-1);else if(e.key==='Escape')closeTour()});

export { BV, TOUR, TX, closeTour, openTour, showStep, tourLive };
