// A small orchestra: band-limited wavetable instruments, a tiny score language and a renderer.

import { mulberry32 } from './math.js';
import { SCORES } from './scores.js';

/* ---- small orchestra: band-limited wavetable instruments + a tiny score language ---- */
const TN=2048;
const mkTab=h=>{const t=new Float32Array(TN+1);let mx=0;for(let i=0;i<=TN;i++){let v=0;for(let k=0;k<h.length;k++)v+=h[k]*Math.sin(2*Math.PI*(k+1)*i/TN);t[i]=v;mx=Math.max(mx,Math.abs(v))}for(let i=0;i<=TN;i++)t[i]/=mx||1;return t};
const INS={};const defIns=(n,h,o)=>{INS[n]=Object.assign({tabs:h.map((_,k)=>mkTab(h.slice(0,k+1)))},o)};
defIns('cornet',[1,.85,.72,.56,.42,.3,.2],{att:0.025,sus:0.72,rel:0.09,vib:0.004});
defIns('clar',[1,.04,.5,.03,.3,.02,.16,.01,.08],{att:0.045,sus:0.85,rel:0.12,vib:0.003});
defIns('flute',[1,.32,.1,.04],{att:0.04,sus:0.85,rel:0.1,vib:0.006});
defIns('tuba',[1,.75,.5,.34,.22,.14,.09,.05,.03],{att:0.015,sus:0.7,rel:0.1});
defIns('horn',[1,.55,.32,.18,.1,.06,.04],{att:0.012,sus:0.65,rel:0.07});
defIns('piano',[1,.72,.48,.34,.24,.16,.11,.07,.05,.03],{att:0.003,rel:0.16,piano:true,det:0.0016});
INS.snare={noise:true};
const NN={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const midi=n=>{const m=/^([A-G])(#|b)?(\d)$/.exec(n);if(!m)throw new Error('note '+n);return 12*(+m[3]+1)+NN[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)};
function seq(ev,str,t,U,ins,v,tr=0,hold=1){for(const tok of str.trim().split(/\s+/)){const k=tok.lastIndexOf('/'),nm=tok.slice(0,k),d=parseFloat(tok.slice(k+1))*U;
 if(nm!=='R')for(const x of nm.split('+'))ev.push({t,d:d*hold,m:midi(x)+tr,ins,v});t+=d}return t}
function renderEvents(ev,N,fs,rms=0.045,seed=3){const out=new Float32Array(N),rnd=mulberry32(seed);
 for(const e of ev){const I=INS[e.ins],i0=Math.max(0,Math.floor(e.t*fs));
  if(I.noise){const i1=Math.min(N,i0+Math.floor(0.16*fs));for(let i=i0;i<i1;i++)out[i]+=e.v*(rnd()*2-1)*Math.exp(-(i-i0)/fs/0.04);continue}
  const f=440*Math.pow(2,(e.m-69)/12),tab=I.tabs[Math.max(0,Math.min(I.tabs.length,Math.floor(4800/f))-1)],i1=Math.min(N,Math.floor((e.t+e.d+I.rel)*fs)),tau=I.piano?1.5*Math.pow(262/f,0.55):0,v=e.v*(0.9+0.2*rnd());
  let p1=rnd()*TN,p2=rnd()*TN;
  for(let i=i0;i<i1;i++){const t=i/fs-e.t;let env;
   if(I.piano){env=t<I.att?t/I.att:Math.exp(-(t-I.att)/tau);if(t>e.d)env*=Math.max(0,1-(t-e.d)/I.rel)}
   else env=t<I.att?t/I.att:(t<e.d?I.sus+(1-I.sus)*Math.exp(-(t-I.att)/0.12):I.sus*Math.max(0,1-(t-e.d)/I.rel));
   p1+=f*(I.vib?1+I.vib*Math.sin(2*Math.PI*5.3*t)*Math.min(1,t/0.3):1)/fs*TN;p1-=TN*Math.floor(p1/TN);let k=p1|0,x=tab[k]+(tab[k+1]-tab[k])*(p1-k);
   if(I.det){p2+=f*(1+I.det)/fs*TN;p2-=TN*Math.floor(p2/TN);k=p2|0;x=0.5*(x+tab[k]+(tab[k+1]-tab[k])*(p2-k))}
   out[i]+=v*env*x}}
 let s2=0;for(let i=0;i<N;i++)s2+=out[i]*out[i];const g=rms/(Math.sqrt(s2/N)||1);for(let i=0;i<N;i++)out[i]*=g;return out}
function scoreNotes(key){const out=[];let t=0;for(const tk of SCORES[key].split(' ')){const[a,b,c]=tk.split('.').map(x=>parseInt(x,36));t+=a;out.push([t/192,b/192,c])}return out}
const constTempo=bpm=>w=>w*240/bpm;
const rampTempo=(q0,q1,W)=>w=>{const k=(q1-q0)/(W*4);return 60*Math.log(1+k*w*4/q0)/k}; // accelerando, linear in tempo
function pieceScore(key,o){return(N,fs)=>{const ev=[],lead=1.4,T=o.time;
 for(const[w,dw,m]of scoreNotes(key)){const t0=lead+T(w),t1=lead+T(w+dw);for(const[ins,v,tr]of o.voice(m,dw,w))ev.push({t:t0,d:Math.max(0.03,(t1-t0)*(o.hold||1)),m:m+(tr||0)+(m+(tr||0)<40?12:0),ins,v})}   // acoustic-era practice: the horn can't carry the lowest octave, so it is lifted
 const out=renderEvents(ev,N,fs,o.rms||0.045,o.seed||5);
 if(o.fade){const i1=Math.min(N,Math.floor((lead+T(o.len)+0.2)*fs)),i0=Math.max(0,i1-Math.floor(o.fade*fs));for(let i=i0;i<N;i++)out[i]*=i<i1?0.5+0.5*Math.cos(Math.PI*(i-i0)/(i1-i0)):0}
 return out}}

export { pieceScore, rampTempo };
