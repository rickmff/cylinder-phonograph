// The clockwork, as equations: governor lag, spring drain, wow and flutter, the hand on the cylinder,
// and the carriage that follows the feed screw.

import { PITCH, XA } from './constants.js';
import { mach } from './state.js';
import { NREV } from './groove.js';
import { curCyl } from './cylinders.js';

function mechStep(dt){
 const run=mach.lev>0.5,H=mach.hand;   // the start/stop lever releases the governor brake; the motor only drives when it is over
 const tgt=run?(mach.rpm/60*2*Math.PI)*mach.speed*Math.min(1,mach.spring/0.12):0;   // governor holds the set speed while the spring has torque
 if(!H.on){mach.omega+=(tgt-mach.omega)*(1-Math.exp(-dt/govTau(tgt,mach.omega,run)));if(!run&&Math.abs(mach.omega)<0.02)mach.omega=0}   // brake on: stops in a fraction of a second
 mach.spring=Math.max(0,mach.spring-(run?(H.on?tgt:Math.max(0,mach.omega)):0)*dt/(2*Math.PI*1100));   // a held cylinder makes the belt slip: the motor keeps running
 const tr=mach.transit;if(tr){tr.t+=dt;if(tr.t>=tr.dur){mach.nOff=Math.round(tr.T1-mach.rot/(2*Math.PI));mach.transit=null;mach.engaged=true}}
 mach.lift+=((mach.engaged?0:1)-mach.lift)*(1-Math.exp(-dt/0.09));mach.time+=dt}
function govTau(tgt,om,run){return tgt>om?0.45:(run?0.9:0.32)} // governor lag: spin up, coast, brake
function volLaw(v){return[v<=0.75?Math.pow(v/0.75,2):1+(v-0.75)/0.25,900+21000*Math.pow(Math.min(v,0.75)/0.75,2)]} // knob -> gain, damper cut-off (Hz)
function coneG(th){return th<=35?1:th>=125?0.6:1-0.4*(th-35)/90} // what the PannerNode cone (70° / 250°, outer 0.6) applies, θ in degrees
function offAxisFc(c){return 1800*Math.pow(9,(1+c)/2)} // horn beaming: low-pass cut-off vs cos θ
const wow=t=>1+0.0022*Math.sin(2*Math.PI*1.35*t)+0.0007*Math.sin(2*Math.PI*11.3*t+1)+0.004*(1-Math.min(1,mach.spring/0.25))*Math.sin(2*Math.PI*0.9*t);
const GRIP_K=3600,GRIP_C=120; // grip: ~60 rad/s natural frequency, critically damped
function handStep(dt,age){const H=mach.hand,tgt=H.th+H.w*Math.min(age,H.iv*1.5),a=GRIP_K*(tgt-mach.rot)-GRIP_C*(mach.omega-H.w);mach.omega+=a*dt;mach.rot+=mach.omega*dt}
function endTurn(){const c=curCyl();return Math.min(NREV+0.4,c&&c.len?c.len*(c.rpm||160)/60+1.2:NREV+0.4)} // one turn after the last groove modulation
function carriageX(rot){if(mach.drag)return mach.drag.x;const tr=mach.transit;if(tr){const u=Math.min(1,tr.t/tr.dur),e=u*u*(3-2*u);return tr.x0+(tr.x1-tr.x0)*e}return XA+PITCH*(mach.nOff+rot/(2*Math.PI))}
function moveNeedle(T1){if(mach.mode!=='rec'&&T1>0.3)mach.rewind=false;T1=Math.max(0.15,Math.min(NREV-0.3,T1));const x0=carriageX(mach.rot),x1=XA+PITCH*T1;mach.transit={x0,x1,T1,t:0,dur:0.5+Math.min(1.0,Math.abs(x1-x0)*12)};mach.engaged=false}

export { carriageX, coneG, endTurn, govTau, handStep, mechStep, moveNeedle, offAxisFc, volLaw, wow };
