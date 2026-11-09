// Recordings kept in this browser (IndexedDB), quantised to 16 bits.

import { app } from './state.js';
import { ROWS, SPR } from './groove.js';
import { CYLS } from './cylinders.js';
import { renderShelf } from './hud.js';

const IDB={db:null};
function idbOpen(){return new Promise(res=>{try{const r=indexedDB.open('phonograph-cylinders',1);r.onupgradeneeded=()=>r.result.createObjectStore('cyl',{keyPath:'id'});r.onsuccess=()=>{IDB.db=r.result;res(true)};r.onerror=()=>res(false)}catch(e){res(false)}})}
function saveUserCyl(c){try{if(!IDB.db||!c.data)return;let last=0;for(let r=ROWS-1;r>=0;r--){if(c.data[r*SPR+SPR/2]>0||c.data[r*SPR]>0){last=r;break}}
 const n=(last+1)*SPR,q=new Uint16Array(n);for(let i=0;i<n;i++)q[i]=Math.round(c.data[i]*400);
 IDB.db.transaction('cyl','readwrite').objectStore('cyl').put({id:c.id,title:c.title,by:c.by,year:c.year,rpm:c.rpm,len:c.len,q})}catch(e){}}
function deleteUserCyl(id){const i=CYLS.findIndex(c=>c.id===id);if(i<0||CYLS[i].id===app.curId)return;CYLS.splice(i,1);try{IDB.db&&IDB.db.transaction('cyl','readwrite').objectStore('cyl').delete(id)}catch(e){}renderShelf()}
async function loadUserCyls(){if(!(await idbOpen()))return;try{const rq=IDB.db.transaction('cyl').objectStore('cyl').getAll();rq.onsuccess=()=>{for(const o of rq.result||[]){if(CYLS.find(c=>c.id===o.id))continue;
 const data=new Float32Array(SPR*ROWS);for(let i=0;i<o.q.length&&i<data.length;i++)data[i]=o.q[i]/400;
 CYLS.splice(CYLS.length-1,0,{id:o.id,user:true,title:o.title,by:o.by,year:o.year,head:'PRIVATE RECORDING',wax:'brown',num:0,rpm:o.rpm||160,len:o.len,data})}renderShelf()}}catch(e){}}

export { deleteUserCyl, loadUserCyls, saveUserCyl };
