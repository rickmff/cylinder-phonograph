// Camera presets (overview, horn, mechanism, stylus close-up) and the animated camera state.

import { RC, YM, ZM } from './constants.js';
import { state } from './state.js';

const VIEWS={overview:{t:[-0.075,0.20,-0.04],yaw:-0.30,pitch:0.27,dist:1.30},horn:{t:[-0.21,0.29,-0.07],yaw:-1.22,pitch:0.16,dist:0.66},
 mechanism:{t:[-0.005,0.222,0.012],yaw:0.42,pitch:0.44,dist:0.40},stylus:{t:[0,YM+RC,ZM],yaw:0.62,pitch:0.22,dist:0.0042,follow:true}};
let view='overview';const cam={t:VIEWS.overview.t.slice(),yaw:VIEWS.overview.yaw,pitch:VIEWS.overview.pitch,dist:VIEWS.overview.dist};const camT=JSON.parse(JSON.stringify(cam));
function setView(v){view=v;const V=VIEWS[v];if(v==='stylus')V.follow=true;camT.t=V.t.slice();if(V.follow)camT.t[0]=state.cx;camT.yaw=V.yaw;camT.pitch=V.pitch;camT.dist=V.dist;
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===v))}
function camTo(t,yaw,pitch,dist){VIEWS.stylus.follow=false;view='overview';document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('on'));camT.t=t.slice();camT.yaw=yaw;camT.pitch=pitch;camT.dist=dist}

export { VIEWS, cam, camT, camTo, setView, view };
