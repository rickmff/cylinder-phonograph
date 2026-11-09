// The acoustic chain, sample by sample: RBJ biquads, the horn, the glass diaphragm, a small room,
// the cutting stylus (`AcousticRecorder`) and the reproducer that rides the groove (`AcousticPlayer`).
// Pure DSP: no DOM, no WebGL, so it runs under Node too.

let PLAYGAIN=0.21;function setPlayGain(g){PLAYGAIN=g}
/* ---- acoustics: biquads (RBJ) ---- */
class BQ{constructor(){this.b0=1;this.b1=this.b2=this.a1=this.a2=0;this.z1=this.z2=0}
 _s(b0,b1,b2,a0,a1,a2){this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=a1/a0;this.a2=a2/a0;return this}
 lp(f,Q,fs){const w=2*Math.PI*f/fs,c=Math.cos(w),a=Math.sin(w)/(2*Q);return this._s((1-c)/2,1-c,(1-c)/2,1+a,-2*c,1-a)}
 hp(f,Q,fs){const w=2*Math.PI*f/fs,c=Math.cos(w),a=Math.sin(w)/(2*Q);return this._s((1+c)/2,-(1+c),(1+c)/2,1+a,-2*c,1-a)}
 pk(f,Q,fs,g){const A=Math.pow(10,g/40),w=2*Math.PI*f/fs,c=Math.cos(w),a=Math.sin(w)/(2*Q);return this._s(1+a*A,-2*c,1-a*A,1+a/A,-2*c,1-a/A)}
 run(x){const y=this.b0*x+this.z1;this.z1=this.b1*x-this.a1*y+this.z2;this.z2=this.b2*x-this.a2*y;return y}}
/* horn: flare cut-off (~380 Hz) + standing waves between throat and mouth (round trip ≈ 2.45 ms) */
class Horn{constructor(fs,fc,refl=0.30){this.r=refl;this.h1=new BQ().hp(fc,0.75,fs);this.h2=new BQ().hp(fc*0.62,0.6,fs);this.cb=new Float32Array(Math.max(2,Math.round(fs*0.00245)));this.ci=0;this.cl=0;this.k=1-Math.exp(-2*Math.PI*1700/fs)}
 run(x){x=this.h2.run(this.h1.run(x));const d=this.cb[this.ci];this.cl+=(d-this.cl)*this.k;const y=x+this.r*this.cl;this.cb[this.ci]=y;this.ci=(this.ci+1)%this.cb.length;return y}}
/* recording: sound pressure -> horn -> glass diaphragm (mass-spring, ~2.6 kHz) -> cutting stylus excursion in µm */
class AcousticRecorder{constructor(fs){this.horn=new Horn(fs,270,0.20);this.dia=new BQ().lp(2300,1.3,fs);this.aa=new BQ().lp(Math.min(4300,fs*0.4),0.7,fs);this.gain=210}
 process(p){let z=this.dia.run(this.horn.run(p*this.gain));z=this.aa.run(z);return 44*Math.tanh(z/44)}}
/* a small warm room: four damped combs + two allpasses (Schroeder) */
class Room{constructor(fs){this.c=[0.0297,0.0371,0.0411,0.0437].map(t=>({b:new Float32Array(Math.round(t*fs)),i:0,l:0}));this.a=[0.0050,0.0017].map(t=>({b:new Float32Array(Math.round(t*fs)),i:0}))}
 run(x){let y=0;for(const c of this.c){const d=c.b[c.i];c.l=d*0.62+c.l*0.38;c.b[c.i]=x+c.l*0.73;c.i=(c.i+1)%c.b.length;y+=d}y*=0.25;
  for(const a of this.a){const d=a.b[a.i],o=-0.7*y+d;a.b[a.i]=y+0.7*o;a.i=(a.i+1)%a.b.length;y=o}return y}}
/* playback: groove -> sapphire ball (tracing) -> stylus held down only by the floating weight (can leave the groove)
   -> diaphragm (velocity radiates) -> horn */
class AcousticPlayer{constructor(fs){this.fs=fs;this.y=0;this.v=0;this.amax=9000e6/(fs*fs);this.fly=0;this.n=0;
  this.dia=new BQ().pk(2000,1.1,fs,2.2);this.tk=1-Math.exp(-2*Math.PI*650/fs);this.tl=0;this.body=new BQ().pk(480,0.9,fs,2.5);
  this.l1=new BQ().lp(3500,0.5412,fs);this.l2=new BQ().lp(3500,1.3066,fs);this.l3=new BQ().lp(4800,0.7071,fs);this.horn=new Horn(fs,280,0.20);this.room=new Room(fs);this.g=PLAYGAIN*48000/fs}
 step(g,live){let y;this.n++;
  if(!live){y=this.y;this.v=0}
  else{y=this.y+this.v-0.5*this.amax;if(y<=g){this.v=g-this.y;y=g}else{this.v-=this.amax;this.fly++}}
  const u=y-this.y;this.y=y;
  let o=this.dia.run(u);this.tl+=(o-this.tl)*this.tk;o=this.l3.run(this.l2.run(this.l1.run(this.tl)));o=this.body.run(this.horn.run(o))*this.g;o+=0.16*this.room.run(o);
  return o>0.8?0.8+0.2*Math.tanh((o-0.8)/0.2):o<-0.8?-0.8+0.2*Math.tanh((o+0.8)/0.2):o}}

export { AcousticPlayer, AcousticRecorder, BQ, Horn, setPlayGain };
