// Toolbar buttons and file drops.

import { $ } from './context.js';
import { AE, app, mach, state } from './state.js';
import { moveNeedle, windUp } from './mechanics.js';
import { bPlay, bRec, renderShelf, say } from './hud.js';
import { ensureAudio } from './audio.js';
import { recordFile, startRec, stopRec, togglePlay } from './recording.js';

bPlay.onclick=togglePlay;
bRec.onclick=()=>{if(mach.mode==='rec')stopRec();else startRec()};
$('#bHome').onclick=()=>{if(mach.mode==='rec')return;ensureAudio();moveNeedle(0.25)};
$('#bWind').onclick=()=>{if(!windUp())say('the spring is already fully wound')};
$('#sens').oninput=e=>{AE.sens=0.25*Math.pow(16,+e.target.value)};
$('#pCancel').onclick=()=>{$('#panel').hidden=true};
$('#pFile').onchange=e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(f)recordFile(f)};
addEventListener('dragover',e=>{e.preventDefault()});
const SPEEDS=[1,0.1,0.01],SPL=['1×','1/10','1/100'];let spdI=0;
function setSpeed(i){spdI=i;mach.speed=SPEEDS[i];   // test hook only (?speed=1|2)
 say(i===2?'motor at 1/100: the stylus crawls along the grooves (the sound is too low to hear)':i===1?'motor at 1/10: everything turns ten times slower and the sound drops in pitch':'normal speed · 160 rpm',5200)}
$('#bCyl').onclick=()=>{const h=$('#shelf');h.hidden=!h.hidden;$('#bCyl').classList.toggle('on',!h.hidden);if(!h.hidden)renderShelf()};

export { setSpeed };
