// The groove array on the GPU: dirty rows are uploaded each frame, with per-turn loudness for far views.

import { gl } from './context.js';
import { Hof } from './contact.js';
import { GDATA, HC, LOUD, ROWS, SPR } from './groove.js';
import { CYLS, genCyl } from './cylinders.js';

const grooveTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,grooveTex);gl.texStorage2D(gl.TEXTURE_2D,1,gl.R16F,SPR,ROWS);
const loudTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,loudTex);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RG16F,ROWS,1);
for(const t of[grooveTex,loudTex]){gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
let dirty0=1e9,dirty1=-1;const markDirty=(a,b)=>{if(a<dirty0)dirty0=a;if(b>dirty1)dirty1=b};
function flushGroove(){if(dirty1<dirty0)return;const r0=Math.max(0,dirty0),r1=Math.min(ROWS-1,dirty1);
 for(let r=r0;r<=r1;r++){let a=0,a2=0,c=0;const o=r*SPR;for(let i=0;i<SPR;i+=4){const d=GDATA[o+i];if(d>0){a+=d;a2+=d*d;c++}}const m=c?a/c:0;LOUD[r*2]=c?Math.sqrt(Math.max(0,a2/c-m*m)):0;LOUD[r*2+1]=m*c/(SPR/4)}
 gl.bindTexture(gl.TEXTURE_2D,grooveTex);gl.texSubImage2D(gl.TEXTURE_2D,0,0,r0,SPR,r1-r0+1,gl.RED,gl.FLOAT,GDATA,r0*SPR);
 gl.bindTexture(gl.TEXTURE_2D,loudTex);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,ROWS,1,gl.RG,gl.FLOAT,LOUD);dirty0=1e9;dirty1=-1}
function rebuildHC(r0,r1){for(let j=r0*SPR;j<(r1+1)*SPR;j++)HC[j]=Hof(GDATA[j])}
{const c0=CYLS[0];c0.data=genCyl(c0);GDATA.set(c0.data);rebuildHC(0,ROWS-1);markDirty(0,ROWS-1);flushGroove()}

export { flushGroove, grooveTex, loudTex, markDirty, rebuildHC };
