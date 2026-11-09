// Recording from the microphone or an audio file, and the play/stop lever.

import { $ } from './context.js';
import { D0U } from './constants.js';
import { AE, app, mach, swap } from './state.js';
import { AcousticRecorder } from './acoustics.js';
import { GDATA, HC, LOUD, NREV, ROWS, RPS } from './groove.js';
import { CYLS, curCyl } from './cylinders.js';
import { makeLabel } from './label.js';
import { markDirty } from './groove-texture.js';
import { endTurn, moveNeedle } from './mechanics.js';
import { renderShelf, say, updateUI } from './hud.js';
import { saveUserCyl } from './storage.js';
import { withBlank } from './swap.js';
import { ensureAudio, flushCut } from './audio.js';
import { openFit } from './fit.js';

function shave(){GDATA.fill(0);HC.fill(0);LOUD.fill(0);markDirty(0,ROWS-1)}
function beginCut(){shave();
 if(curCyl().blank){const L=AE.srcBuf?AE.srcBuf.length/AE.ctx.sampleRate:0,cap=(NREV-0.6)/RPS,rpm=L>cap?Math.max(120,Math.floor(160*cap/L)):160;
  const d=new Date(),uc={id:'u'+Date.now(),user:true,title:AE.srcBuf?(AE.srcName||'Audio file'):'Microphone recording',by:AE.srcBuf?'audio file':'microphone',
   year:d.toLocaleDateString('en-GB'),head:'PRIVATE RECORDING',wax:'brown',num:0,rpm,len:0,data:null};
  CYLS.splice(CYLS.length-1,0,uc);app.curId=uc.id;mach.rpm=rpm;try{makeLabel(uc)}catch(e){}renderShelf();
  if(rpm<160)say('recording at '+rpm+' rpm to fit the cylinder (as they did back then)',5200)}AE.rec=new AcousticRecorder(AE.ctx.sampleRate);AE.cj=-1;AE.ca=AE.cc=0;mach.clip=0;mach.lvl=0;mach.cutD=D0U;mach.mode='rec';mach.motorOn=true;moveNeedle(0.2);
 if(mach.rpm===160)say(AE.srcBuf?'cutting the file onto the cylinder':'recording · speak or sing close to the horn',4500);updateUI()}
async function startRec(){
 if(!ensureAudio()){say('this browser has no Web Audio');return}
 if(mach.mode==='rec')return;
 let st=null;
 try{if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})}catch(err){st=null}
 if(!st){$('#panel').hidden=false;return}
 AE.mic=st;AE.micNode=AE.ctx.createMediaStreamSource(st);AE.micNode.connect(AE.node);AE.srcBuf=null;withBlank(beginCut)}
function stopRec(){if(mach.mode!=='rec')return;flushCut();mach.mode='idle';mach.motorOn=false;{const cb=curCyl();if(cb.user){cb.len=Math.max(0,mach.nOff+mach.rot/(2*Math.PI)-0.2)/(cb.rpm/60);cb.data=GDATA.slice();saveUserCyl(cb);renderShelf()}}
 if(AE.micNode){AE.micNode.disconnect();AE.micNode=null}if(AE.mic){AE.mic.getTracks().forEach(t=>t.stop());AE.mic=null}AE.srcBuf=null;
 moveNeedle(0.25);mach.rewind=true;say('recording done · press Play to listen',4500);updateUI()}
function togglePlay(){ensureAudio();
 if(swap.phase){swap.autoplay=true;return}
 if(mach.mode==='rec'){stopRec();return}
 if(mach.mode==='play'&&mach.motorOn)mach.motorOn=false;
 else{const Tc=mach.nOff+mach.rot/(2*Math.PI);if(Tc>endTurn()-0.8||mach.rewind)moveNeedle(0.25);mach.rewind=false;if(mach.spring<0.02)say('spring run down · turn the crank');mach.mode='play';mach.motorOn=true}
 updateUI()}
const isAudioFile=f=>!!f&&(/^(audio|video)\//.test(f.type||'')||/\.(mpe?g|mp[34]|m4a|aac|og[ga]|opus|wav|flac|webm|amr|3gp)$/i.test(f.name||'')||!f.type);
addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(isAudioFile(f))recordFile(f);else if(f)say('that file doesn\'t look like audio')});
async function recordFile(f){if(mach.mode==='rec')return;$('#panel').hidden=true;if(!ensureAudio())return;
 say('reading the file…');
 try{const ab=await f.arrayBuffer();const buf=await new Promise((res,rej)=>{const pr=AE.ctx.decodeAudioData(ab,res,rej);if(pr&&pr.then)pr.then(res,rej)});
  const n=Math.min(buf.length,Math.ceil(300*buf.sampleRate)),ch=buf.numberOfChannels,m=new Float32Array(n);
  for(let c=0;c<ch;c++){const d=buf.getChannelData(c);for(let i=0;i<n;i++)m[i]+=d[i]/ch}
  AE.srcName=f.name.replace(/\.[^.]+$/,'').replace(/^[0-9a-f]{6,}-/i,'').replace(/[_]+/g,' ').trim().slice(0,46);
  const L=n/buf.sampleRate;if(L<=CAP160+0.05){AE.srcBuf=normRMS(m);AE.srcPos=0;withBlank(beginCut);return}
  openFit(m,buf.sampleRate,L)}catch(err){say('couldn\'t read the audio in that file · try MP3, M4A, WAV or OGG',6000)}}
const CAP160=(NREV-0.6)/RPS,CAP120=(NREV-0.6)/2;
function normRMS(x){let s2=0;for(let i=0;i<x.length;i++)s2+=x[i]*x[i];const g=0.038/Math.max(1e-6,Math.sqrt(s2/Math.max(1,x.length)));for(let i=0;i<x.length;i++)x[i]*=g;return x}

export { CAP120, CAP160, beginCut, isAudioFile, normRMS, recordFile, shave, startRec, stopRec, togglePlay };
