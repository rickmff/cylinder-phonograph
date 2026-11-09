// Shared runtime state: the clockwork (`mach`), the cylinder changer (`swap`), the audio engine (`AE`)
// and the pose of the moving parts (`state`). Modules read and change these objects in place.

import { D0U, N0, PITCH, XA } from './constants.js';

// Settings that several modules change: the cylinder on the mandrel, targets of the animated parts.
export const app = {
  curId: 'mountain',
  WAXNOW: null,
  crankTarget: 0,
  lidTarget: 0,
  keyTarget: 0,
};

const state={cx:XA+PITCH*N0,dy:0,rot:0,rotMod:0,crank:0,lift:0,time:0};
const mach={rpm:160,speed:1,autoplay:false,rewind:false,rot:0,omega:0,nOff:N0,spring:0.86,motorOn:false,engaged:true,lift:0,transit:null,mode:'idle',tAudio:0,cutD:D0U,lvl:0,clip:0,time:0,endRec:false,endPlay:false,lev:0,drag:null,hand:{on:false,th:0,w:0,t:0,iv:0.016}};
const swap={phase:0,t:0,to:null,then:null,autoplay:false};
const AE={vol:0.75,g:null,lp:0,tp:null,hs:0,master:null,pHorn:null,ctx:null,node:null,rec:null,player:null,srcBuf:null,srcPos:0,mic:null,micNode:null,sens:1,cj:-1,ca:0,cc:0};

export { AE, mach, state, swap };
