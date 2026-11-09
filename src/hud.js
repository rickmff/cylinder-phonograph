// The interface around the scene: tooltips, the menu, status messages, the shelf of cylinders.

import { $ } from './context.js';
import { app, mach } from './state.js';
import { CYLS, curCyl } from './cylinders.js';
import { deleteUserCyl } from './storage.js';
import { chooseCylinder } from './swap.js';

const tipEl=$('#tip');let tipFor=null;
function placeTip(x0,x1,yTop,yBot){const tw=tipEl.offsetWidth,th=tipEl.offsetHeight;let x=(x0+x1)/2-tw/2;x=Math.max(8,Math.min(innerWidth-tw-8,x));let y=yTop-th-10;if(y<8)y=yBot+10;tipEl.style.left=x+'px';tipEl.style.top=y+'px'}
function showTip(el){tipFor=el;if(tipEl.textContent!==el.dataset.tip)tipEl.textContent=el.dataset.tip;tipEl.hidden=false;const r=el.getBoundingClientRect();placeTip(r.left,r.right,r.top,r.bottom)}
function hideTip(){tipFor=null;tipEl.hidden=true}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const el=e.target.closest&&e.target.closest('[data-tip]');if(el)showTip(el);else if(tipFor)hideTip()});
document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el)showTip(el)});document.addEventListener('focusout',hideTip);
function setMenu(o){$('#menu').hidden=!o;$('#burger').classList.toggle('open',o);$('#burger').setAttribute('aria-expanded',o?'true':'false')}
$('#burger').addEventListener('click',()=>{closeShelf();setMenu($('#menu').hidden)});
$('#bCyl').addEventListener('click',()=>setMenu(false));
addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);closeShelf()}});
let msg='';
let msgT=0;
const say=(m,ms=3400)=>{msg=m;msgT=performance.now()+ms};
const fmt=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');
const WAXTOP={brown:'#a2643a',black:'#4d4843',pink:'#eab2a4'};
function cylArt(wax,blank,add){
 if(add)return '<svg class="cy" viewBox="0 0 40 60" aria-hidden="true"><g fill="none" stroke="rgba(236,223,198,.32)" stroke-width="1.2" stroke-dasharray="3 3"><path d="M5 9v42a15 5 0 0 0 30 0V9"/><ellipse cx="20" cy="9" rx="15" ry="5"/></g><path d="M20 24v15M12.5 31.5h15" stroke="#d2ac62" stroke-width="1.8" stroke-linecap="round"/></svg>';
 let g='';if(!blank)for(let y=15;y<=49;y+=2.6)g+='<path d="M5 '+y.toFixed(1)+'a15 5 0 0 0 30 0" fill="none" stroke="rgba(0,0,0,.2)" stroke-width=".55"/>';
 return '<svg class="cy" viewBox="0 0 40 60" aria-hidden="true"><path d="M5 9v42a15 5 0 0 0 30 0V9" fill="url(#gw-'+wax+')"/>'+g+'<path d="M5 9v42a15 5 0 0 0 30 0V9" fill="url(#gw-sheen)"/><ellipse cx="20" cy="9" rx="15" ry="5" fill="'+WAXTOP[wax]+'"/><ellipse cx="20" cy="9.3" rx="9.6" ry="3.1" fill="rgba(0,0,0,.55)"/></svg>'}
function renderShelf(){const L=$('#shelfList');if(!L)return;L.innerHTML='';
 for(const c of CYLS){if(c.blank)continue;const b=document.createElement('button');b.className='cyl'+(c.id===app.curId?' cur':'');
  b.innerHTML='<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>'+cylArt(c.wax,!!c.blank,false)+'<em></em>';b.querySelector('em').textContent=c.title;b.setAttribute('aria-label',c.title);
  b.dataset.tip=c.title+(c.by?'\n'+c.by+(c.year?' · '+c.year:''):'')+(c.len?'\n'+fmt(c.len)+(c.rpm&&c.rpm!==160?' · '+c.rpm+' rpm':''):'')+(c.src?'\n'+c.src:'')+(c.user?'\nstored in this browser':'');
  b.onclick=()=>chooseCylinder(c.id,{autoplay:!c.blank});
  if(c.user){const x=document.createElement('span');x.className='del';x.setAttribute('role','button');x.setAttribute('aria-label','Delete this cylinder');x.dataset.tip='Delete this cylinder';
   x.innerHTML='<svg viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6"/></svg>';x.onclick=ev=>{ev.stopPropagation();deleteUserCyl(c.id)};b.appendChild(x)}L.appendChild(b)}
 const a=document.createElement('button');a.className='cyl add';a.innerHTML=cylArt('brown',true,true);a.setAttribute('aria-label','Cut an audio file onto a new cylinder');
 a.dataset.tip='Cut an audio file onto a new cylinder\n(or drop a file on the page)';a.onclick=()=>{closeShelf();$('#pFile').click();if(!curCyl().blank&&mach.mode!=='rec')chooseCylinder('blank')};L.appendChild(a)} // a fresh blank goes on the mandrel while you pick the file
const closeShelf=()=>{$('#shelf').hidden=true;$('#bCyl').classList.remove('on')};
const bPlay=$('#bPlay'),bRec=$('#bRec');
function updateUI(){const rec=mach.mode==='rec',pl=mach.mode==='play'&&mach.motorOn;
 bPlay.classList.toggle('playing',pl);bPlay.classList.toggle('on',pl);bPlay.setAttribute('aria-label',pl?'Pause':'Play');
 bRec.classList.toggle('rec',rec);bRec.setAttribute('aria-label',rec?'Stop recording':'Record');bRec.dataset.tip=rec?'Stop recording (R)':'Record (R)';
 $('#sensL').hidden=!rec;$('#lvw').hidden=!rec;
 }

export { bPlay, bRec, closeShelf, fmt, hideTip, msg, msgT, renderShelf, say, setMenu, showTip, tipFor, updateUI };
