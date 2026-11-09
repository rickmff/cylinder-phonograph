// The record itself: groove depth as data. One row per turn of the spiral, `SPR` samples per turn,
// depths in micrometres. The GPU draws this array, the stylus plays it, the browser stores it.

import { gl } from './context.js';
import { PITCH, XREC } from './constants.js';
import { TAPS } from './contact.js';

// one texel per groove sample; rows = turns of the spiral, columns = angle
const MAXTEX=gl.getParameter(gl.MAX_TEXTURE_SIZE);
const SPR=MAXTEX>=4096?4096:2048,RPS=160/60,FSG=SPR*RPS; // samples per revolution, groove sample-rate (Hz)
const NREV=Math.floor(XREC/PITCH)-1,ROWS=NREV+2;
const GDATA=new Float32Array(SPR*ROWS); // cut depth in µm (0 = uncut wax)
const HC=new Float32Array(SPR*ROWS); // height of the reproducing ball for that depth (µm, <=0)
const LOUD=new Float32Array(ROWS*2); // per turn: modulation rms, mean depth (µm)
const hcAt=T=>{const f=T*SPR;if(!(f>=1&&f<SPR*ROWS-2))return 0;const i=Math.floor(f),t=f-i,p0=HC[i-1],p1=HC[i],p2=HC[i+1],p3=HC[i+2];
 return p1+0.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0)))};
const traceAt=T=>{let m=-1e9;for(let k=0;k<TAPS.length;k++){const v=hcAt(T+TAPS[k][0])+TAPS[k][1];if(v>m)m=v}return m};

export { FSG, GDATA, HC, LOUD, NREV, ROWS, RPS, SPR, traceAt };
