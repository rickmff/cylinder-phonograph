// A file longer than the cylinder: pick an excerpt, or cut the whole song slower (down to 120 rpm).

import { $ } from './context.js';
import { AE } from './state.js';
import { fmt, hideTip } from './hud.js';
import { withBlank } from './swap.js';
import { ensureAudio } from './audio.js';
import { CAP120, CAP160, beginCut, normRMS } from './recording.js';

let prevSrc=null;
const fitMode=()=>{const r=document.querySelector('input[name=fitm]:checked');return r?r.value:'fit'};
const fitDur=()=>fitMode()==='120'?120:Math.floor(CAP160*2)/2-0.5;
const fitStart=()=>+$('#fitStart').value*Math.max(0,AE.fit.L-fitDur());
function openFit(m,sr,L){AE.fit={m,sr,L,peaks:null};$('#fitLen').textContent=fmt(L);$('#fitHold').textContent=fmt(CAP160);
 $('#fitCap').textContent=fmt(fitDur0());const rpm=Math.max(120,Math.floor(160*CAP160/Math.min(L,CAP120)));$('#fitRpm').textContent=rpm+' rpm';
 $('#fitRpm').closest('.seg').dataset.tip='Whole song, recorded slower at '+rpm+' rpm\nas they did back then: the cylinder plays it back at that speed'+(L>CAP120?'\n(up to '+fmt(CAP120)+')':'');
 $('#fitStart').value=0;$('#fit').hidden=false;updFit()}
const fitDur0=()=>Math.floor(CAP160*2)/2-0.5;
function fitWin(){const F=AE.fit,md=fitMode();return md==='slow'?{st:0,dur:Math.min(F.L,CAP120)}:{st:fitStart(),dur:Math.min(F.L,fitDur())}}
function drawFit(){const F=AE.fit;if(!F)return;const cv=$('#fitWave'),box=$('#fitWaveBox'),dpr=Math.min(2,devicePixelRatio||1),W=Math.max(10,box.clientWidth),H=Math.max(10,box.clientHeight);
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
 const COLS=Math.floor(W/3);if(!F.peaks||F.peaks.length!==COLS){const pk=new Float32Array(COLS),m=F.m,step=m.length/COLS;let mx=1e-9;
  for(let k=0;k<COLS;k++){let a=0;const e=Math.min(m.length,Math.floor((k+1)*step));for(let i=Math.floor(k*step);i<e;i++){const v=m[i]<0?-m[i]:m[i];if(v>a)a=v}pk[k]=a;if(a>mx)mx=a}
  for(let k=0;k<COLS;k++)pk[k]=Math.pow(pk[k]/mx,1.25);F.peaks=pk}
 const {st,dur}=fitWin(),x0=st/F.L*W,x1=Math.min(W,(st+dur)/F.L*W);
 c.fillStyle='rgba(210,172,98,.09)';c.beginPath();c.roundRect?c.roundRect(x0+1,1,x1-x0-2,H-2,9):c.rect(x0+1,1,x1-x0-2,H-2);c.fill();
 for(let k=0;k<COLS;k++){const x=k*3+1,h=Math.max(1.5,F.peaks[k]*(H-16)),inside=x>=x0&&x<=x1;c.fillStyle=inside?'rgba(232,196,128,.95)':'rgba(236,223,198,.17)';c.fillRect(x,(H-h)/2,1.6,h)}
 c.strokeStyle='rgba(210,172,98,.95)';c.lineWidth=1.5;c.beginPath();c.roundRect?c.roundRect(x0+0.75,0.75,x1-x0-1.5,H-1.5,9):c.rect(x0+0.75,0.75,x1-x0-1.5,H-1.5);c.stroke();
 if(fitMode()!=='slow'){c.fillStyle='rgba(240,211,154,.9)';for(const x of[x0+5,x1-5]){c.beginPath();c.roundRect?c.roundRect(x-1.5,H/2-9,3,18,1.5):c.rect(x-1.5,H/2-9,3,18);c.fill()}}   // grips
 if(prevSrc&&F.prevT0!=null&&AE.ctx){const t=F.prevSt+(AE.ctx.currentTime-F.prevT0),x=t/F.L*W;if(x>=0&&x<=W){c.fillStyle='#fff';c.fillRect(x-0.75,4,1.5,H-8)}}   // preview playhead
 box.classList.toggle('slow',fitMode()==='slow');box.setAttribute('aria-valuetext',fmt(st)+' to '+fmt(Math.min(F.L,st+dur)));
 const r=$('#fitRange');r.textContent=fmt(st)+' – '+fmt(Math.min(F.L,st+dur));r.style.left=Math.max(42,Math.min(W-78,(x0+x1)/2))+'px';$('#fitEnd').textContent=fmt(F.L)}
function updFit(){if(!AE.fit)return;document.querySelectorAll('#fit .seg').forEach(l=>l.classList.toggle('sel',l.querySelector('input').checked));drawFit()}
document.querySelectorAll('input[name=fitm]').forEach(r=>r.onchange=updFit);$('#fitStart').oninput=updFit;
{const box=$('#fitWaveBox');let drag=null;
 const setStart=st=>{const F=AE.fit,dur=Math.min(F.L,fitDur()),span=Math.max(1e-6,F.L-dur);$('#fitStart').value=Math.max(0,Math.min(1,st/span));updFit()};
 box.addEventListener('pointerdown',e=>{if(!AE.fit||fitMode()==='slow')return;hideTip();const F=AE.fit,W=box.clientWidth,{st,dur}=fitWin(),x0=st/F.L*W,w=dur/F.L*W,x=e.clientX-box.getBoundingClientRect().left;
  drag={off:(x>=x0&&x<=x0+w)?x-x0:w/2};box.setPointerCapture(e.pointerId);box.classList.add('drag');setStart((x-drag.off)/W*F.L)});
 box.addEventListener('pointermove',e=>{if(!drag)return;const F=AE.fit,W=box.clientWidth,x=e.clientX-box.getBoundingClientRect().left;setStart((x-drag.off)/W*F.L)});
 const end=()=>{drag=null;box.classList.remove('drag')};box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
 box.addEventListener('keydown',e=>{if(!AE.fit||fitMode()==='slow')return;const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();e.stopPropagation();setStart(fitStart()+d*(e.shiftKey?10:1))});
 addEventListener('resize',()=>{if(AE.fit&&!$('#fit').hidden){AE.fit.peaks=null;drawFit()}})}
function stopPrev(){if(prevSrc){try{prevSrc.stop()}catch(e){}prevSrc=null}$('#fitPrev').classList.remove('playing');if(AE.fit)drawFit()}
$('#fitPrev').onclick=()=>{if(prevSrc){stopPrev();return}if(!AE.fit||!ensureAudio())return;const F=AE.fit,{st}=fitWin(),i0=Math.floor(st*F.sr),len=Math.min(F.m.length-i0,Math.floor(8*F.sr));if(len<=0)return;
 const b=AE.ctx.createBuffer(1,len,F.sr);b.copyToChannel(F.m.subarray(i0,i0+len),0);const sN=AE.ctx.createBufferSource();sN.buffer=b;sN.connect(AE.ctx.destination);sN.start();prevSrc=sN;F.prevT0=AE.ctx.currentTime;F.prevSt=st;
 $('#fitPrev').classList.add('playing');sN.onended=()=>{if(prevSrc===sN)stopPrev()};(function loop(){if(prevSrc!==sN)return;drawFit();requestAnimationFrame(loop)})()};
$('#fitCancel').onclick=()=>{stopPrev();$('#fit').hidden=true;AE.fit=null};
$('#fitOk').onclick=()=>{stopPrev();const F=AE.fit;if(!F)return;$('#fit').hidden=true;let seg;
 if(fitMode()==='slow')seg=F.m.slice(0,Math.min(F.m.length,Math.floor(CAP120*F.sr)));
 else{const i0=Math.floor(fitStart()*F.sr);seg=F.m.slice(i0,Math.min(F.m.length,i0+Math.floor(fitDur()*F.sr)));
  const fi=Math.floor(0.12*F.sr),fo=Math.floor(2.5*F.sr);if(i0>0)for(let i=0;i<fi&&i<seg.length;i++)seg[i]*=i/fi;
  for(let i=0;i<fo&&i<seg.length;i++)seg[seg.length-1-i]*=0.5-0.5*Math.cos(Math.PI*i/fo);
  AE.srcName=(AE.srcName||'Audio file')+' (excerpt)'}
 AE.fit=null;AE.srcBuf=normRMS(seg);AE.srcPos=0;withBlank(beginCut)};

export { openFit };
