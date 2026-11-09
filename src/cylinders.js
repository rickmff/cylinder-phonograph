// The cylinders on the shelf: the built-in piece and the blank, and how a cylinder is generated.

import { app } from './state.js';
import { FSG, NREV, ROWS, SPR } from './groove.js';
import { addWear, cutSignal } from './cut.js';
import { pieceScore, rampTempo } from './music.js';

const PIECES={
 mountain:pieceScore('mountain',{time:rampTempo(140,205,88),seed:39,voice:(m,dw,w)=>[['piano',(0.3+0.14*Math.min(1,w/88))*(m<45?1.15:1)]]})};
const WAX={brown:[0.072,0.030,0.011,0.15],black:[0.011,0.010,0.009,0.10],pink:[0.40,0.12,0.09,0.09]};
const CYLS=[
 {id:'mountain',title:'In the Hall of the Mountain King',by:'Grieg · piano',year:'1875',head:'SOUND CYLINDER',wax:'brown',num:4600,seed:39,wear:1.0,gen:PIECES.mountain,src:'notes: Mutopia Project · public domain'},
 {id:'blank',title:'Blank cylinder',by:'record your own: microphone or file',year:'',head:'BLANK CYLINDER',wax:'brown',num:0,blank:true}];
app.WAXNOW=WAX.brown;
const curCyl=()=>CYLS.find(c=>c.id===app.curId);
function genCyl(c){const N=NREV*SPR,sig=c.gen(N,FSG),buf=new Float32Array(SPR*ROWS);cutSignal(sig,0,FSG,buf);addWear(c.seed,buf,c.wear);
 let last=0;for(let i=N-1;i>0;i-=64)if(Math.abs(sig[i])>3e-4){last=i;break}c.len=last/FSG;return buf}

export { CYLS, WAX, curCyl, genCyl };
