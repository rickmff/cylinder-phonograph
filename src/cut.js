// Cutting a signal into the groove, and the wear of an old cylinder: dust specks and scratches.

import { mulberry32 } from './math.js';
import { D0U, DMAXU } from './constants.js';
import { AcousticRecorder } from './acoustics.js';
import { GDATA, NREV, SPR } from './groove.js';

function addWear(seed,G=GDATA,amt=1){const r=mulberry32(seed),N=NREV*SPR,GDATA=G;
 for(let k=0;k<300*amt;k++){const j=Math.floor(r()*N),h=1+r()*r()*9,w=1+Math.floor(r()*2);for(let q=-w;q<=w;q++){const i=j+q;if(GDATA[i]>0)GDATA[i]=Math.max(0,GDATA[i]-h*(1-Math.abs(q)/(w+1)))}}
 for(const[ang,r0,r1,dep]of[[0.31,40,96,9],[2.2,182,231,6],[4.6,250,263,13]]){const c=Math.floor(ang/(2*Math.PI)*SPR);
  for(let row=r0;row<r1;row++)for(let q=-1;q<=1;q++){const i=row*SPR+((c+q+SPR)%SPR);if(GDATA[i]>0)GDATA[i]=Math.min(DMAXU,GDATA[i]+dep*(q===0?1:0.45))}}}
function cutSignal(sig,j0,fs,G=GDATA){const rec=new AcousticRecorder(fs),rn=mulberry32(77);let lp=0;
 for(let j=0;j<sig.length;j++){const z=rec.process(sig[j]);lp+=((rn()-0.5)*0.75-lp)*0.33;G[j0+j]=Math.max(0,Math.min(DMAXU,D0U+z+lp))}}

export { addWear, cutSignal };
