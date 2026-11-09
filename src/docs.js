// The in-app documentation: written once in the page, figures drawn on first open.

import { $ } from './context.js';
import { FIG } from './figures.js';
import { closeTour } from './tour.js';
import { closeShelf, hideTip, setMenu } from './hud.js';

let docsInit=false;
function openDocs(id){closeTour();setMenu(false);closeShelf();hideTip();const D=$('#docs');D.hidden=false;
 if(!docsInit){docsInit=true;D.querySelectorAll('[data-fig]').forEach(f=>{const fn=FIG[f.dataset.fig];if(!fn)return;const a=document.createElement('div');a.className='art';try{a.innerHTML=fn()}catch(e){console.error(e)}f.insertBefore(a,f.firstChild)})}
 D.style.scrollBehavior='auto';D.scrollTop=0;if(id){const t=document.getElementById(id);if(t)t.scrollIntoView()}D.style.scrollBehavior='';$('#docsX').focus({preventScroll:true});
 try{if(location.hash!=='#docs')location.hash='docs'}catch(e){}}
function closeDocs(){const D=$('#docs');if(D.hidden)return;D.hidden=true;try{if(location.hash==='#docs')history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
addEventListener('hashchange',()=>{if(location.hash==='#docs'){if($('#docs').hidden)openDocs()}else closeDocs()});
if(location.hash==='#docs')setTimeout(()=>openDocs(),0);
$('#docsX').onclick=closeDocs;
$('#docs').addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();const t=document.getElementById(a.getAttribute('href').slice(1));if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});
addEventListener('keydown',e=>{if(!$('#docs').hidden&&e.key==='Escape')closeDocs()});

export { closeDocs, openDocs };
