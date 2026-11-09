// Changing cylinders: the animation from the mandrel to the box and back, and loading the groove data.

import { V3, bez3 } from './math.js';
import { CYL0, CYLL, YM, ZM } from './constants.js';
import { app, mach, state, swap } from './state.js';
import { GDATA, ROWS } from './groove.js';
import { CYLS, WAX, curCyl, genCyl } from './cylinders.js';
import { makeLabel } from './label.js';
import { markDirty, rebuildHC } from './groove-texture.js';
import { BOXP, LID_T } from './scene.js';
import { closeShelf, renderShelf, say, updateUI } from './hud.js';
import { ensureAudio } from './audio.js';
import { stopRec, togglePlay } from './recording.js';

const SEG=[0.42,0.62,0.34],SEGT=SEG[0]+SEG[1]+SEG[2],SWAP_PRE=0.35;
const easeIO=u=>u<0.5?2*u*u:1-2*(1-u)*(1-u);
const CP0=[CYL0+CYLL/2,YM,ZM],CP1=[CYL0+CYLL/2-0.14,YM,ZM],CP2=[BOXP[0],0.225,BOXP[2]],CP3=[BOXP[0],0.0058+CYLL/2,BOXP[2]];
function cylPose(u){const q=u*SEGT;
 if(q<=SEG[0]){const e=easeIO(q/SEG[0]);return{p:V3.lerp(CP0,CP1,e),a:-Math.PI/2,fly:false,off:(CP1[0]-CP0[0])*e}}
 if(q<=SEG[0]+SEG[1]){const e=easeIO((q-SEG[0])/SEG[1]);return{p:bez3(CP1,V3.add(CP1,[-0.05,0.08,0.02]),V3.add(CP2,[0,0.08,0]),CP2,e),a:-Math.PI/2*(1-e),fly:true,off:0}}
 const e=easeIO(Math.min(1,(q-SEG[0]-SEG[1])/SEG[2]));return{p:V3.lerp(CP2,CP3,e),a:0,fly:true,off:0}}
state.cylU=0;state.pose=cylPose(0);
function doSwapData(id){const cur=curCyl();if(cur.user)cur.data=GDATA.slice();
 const nx=CYLS.find(c=>c.id===id);if(!nx.data&&!nx.blank)nx.data=genCyl(nx);
 if(nx.data)GDATA.set(nx.data);else GDATA.fill(0);rebuildHC(0,ROWS-1);markDirty(0,ROWS-1);
 app.curId=id;app.WAXNOW=WAX[nx.wax];mach.rpm=nx.rpm||160;try{makeLabel(nx)}catch(e){}renderShelf()}
function chooseCylinder(id,o={}){const nx=CYLS.find(c=>c.id===id);if(!nx||swap.phase)return;ensureAudio();closeShelf();
 if(mach.mode==='rec')stopRec();
 if(id===app.curId){if(o.then)o.then();else if(o.autoplay){mach.rewind=true;if(!(mach.mode==='play'&&mach.motorOn))togglePlay()}return}
 mach.motorOn=false;mach.mode='idle';mach.transit=null;mach.engaged=false;mach.autoplay=false;
 const lidWait=(state.lidU>0||app.lidTarget)?state.lidU*LID_T+0.25:0;app.lidTarget=0;
 Object.assign(swap,{phase:1,t:-lidWait,to:id,then:o.then||null,autoplay:!!o.autoplay});say('changing the cylinder…',2600);updateUI();renderShelf()}
function withBlank(fn){if(curCyl().blank&&!swap.phase){fn();return}if(swap.phase&&swap.to==='blank'){swap.then=fn;return}chooseCylinder('blank',{then:fn})}

export { SEGT, SWAP_PRE, chooseCylinder, cylPose, doSwapData, withBlank };
