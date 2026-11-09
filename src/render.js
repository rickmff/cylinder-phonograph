// Render targets, shadow maps and the frame's passes: shadows, SSAO, main PBR pass, the groove patch
// for close-ups, bloom and the final composite. Also the canvas size and the adaptive resolution.

import { HDRF, canvas, gl } from './context.js';
import { M4, V3, clamp, sstep } from './math.js';
import { CUR, U, drawFS, fbOf, rbo, tex2D, use } from './gl-util.js';
import { CYL0, CYLL, KEYE, LDIR, RC, SPOTC, XA, YM, ZM } from './constants.js';
import { app, mach, state, swap } from './state.js';
import { NREV, SPR } from './groove.js';
import { cam } from './camera.js';
import { P_bg, P_blur, P_comp, P_down, P_main, P_patch, P_patchSh, P_pre, P_sh, P_ssao, P_up } from './programs.js';
import { SPEC_LEVELS, irrTex, specTex } from './environment.js';
import { labelTex } from './label.js';
import { grooveTex, loudTex } from './groove-texture.js';
import { MAT, PATCH, chainA, chainB, linkMesh, parts } from './scene.js';
import { spatialUpdate } from './audio.js';

const whiteTex=tex2D(1,1,gl.RGBA8);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
function makeShadow(size){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,size,size);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,t,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{t,f,size}}
const SH_MAIN=makeShadow(2048),SH_MICRO=makeShadow(1024);
const sampRaw=gl.createSampler(),sampCmp=gl.createSampler();
for(const[s,f]of[[sampRaw,gl.NEAREST],[sampCmp,gl.LINEAR]]){gl.samplerParameteri(s,gl.TEXTURE_MIN_FILTER,f);gl.samplerParameteri(s,gl.TEXTURE_MAG_FILTER,f);gl.samplerParameteri(s,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.samplerParameteri(s,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
gl.samplerParameteri(sampCmp,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.samplerParameteri(sampCmp,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
let MSS=4;try{const s=gl.getInternalformatParameter(gl.RENDERBUFFER,HDRF,gl.SAMPLES);if(s&&s.length)MSS=Math.min(4,Math.max(...s))}catch(e){MSS=0}
let RT=null;
function freeRT(){if(!RT)return;for(const t of RT.tex)gl.deleteTexture(t);for(const f of RT.fbs)gl.deleteFramebuffer(f);for(const r of RT.rbs)gl.deleteRenderbuffer(r)}
function makeRT(w,h){freeRT();const tex=[],fbs=[],rbs=[];const T=(...a)=>{const t=tex2D(...a);tex.push(t);return t},F=(t,d)=>{const f=fbOf(t,d);fbs.push(f);return f},R=(...a)=>{const r=rbo(...a);rbs.push(r);return r};
 const msC=R(HDRF,w,h,MSS),msD=R(gl.DEPTH_COMPONENT24,w,h,MSS);const msF=gl.createFramebuffer();fbs.push(msF);gl.bindFramebuffer(gl.FRAMEBUFFER,msF);
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,msC);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,msD);
 const hdr=T(w,h,HDRF),hdrF=F(hdr);
 const pw=Math.max(1,w>>1),ph=Math.max(1,h>>1);const pre=T(pw,ph,HDRF,gl.NEAREST),preD=R(gl.DEPTH_COMPONENT24,pw,ph),preF=F(pre,preD);
 const ao1=T(pw,ph,HDRF,gl.NEAREST),ao1F=F(ao1),ao2=T(pw,ph,HDRF,gl.NEAREST),ao2F=F(ao2);
 const bl=[];let bw=pw,bh=ph;for(let i=0;i<6&&bw>=4&&bh>=4;i++){const t=T(bw,bh,HDRF);bl.push({t,f:F(t),w:bw,h:bh});bw>>=1;bh>>=1}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 RT={w,h,pw,ph,msF,hdr,hdrF,pre,preF,ao1,ao1F,ao2,ao2F,bl,tex,fbs,rbs}}
function lightOrtho(center,dir,pts,margin){const view=M4.lookAt(V3.add(center,V3.mul(dir,2)),center,Math.abs(dir[1])>0.99?[0,0,1]:[0,1,0]);
 let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(const p of pts){const q=M4.xf(view,p);for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],q[k]);mx[k]=Math.max(mx[k],q[k])}}
 const n=-mx[2]-margin,f=-mn[2]+margin;const pr=M4.ortho(mn[0]-margin,mx[0]+margin,mn[1]-margin,mx[1]+margin,n,f);
 return{vp:M4.mul(pr,view),range:f-n,width:Math.max(mx[0]-mn[0],mx[1]-mn[1])+2*margin}}
const SB=[];for(const x of[-0.52,0.36])for(const y of[0,0.48])for(const z of[-0.37,0.31])SB.push([x,y,z]);
const LM=lightOrtho([-0.07,0.2,-0.03],LDIR,SB,0.01);
const SHI_MAIN=[LM.range,LM.width,0.11,LM.width/SH_MAIN.size];
const ID=M4.I(),IDN=M4.nmat(ID);
function drawParts(pass){
 for(const pt of parts){
  if(pt.vis&&!pt.vis())continue;if(pass==='shadow'&&!pt.shadow)continue;if(pass==='micro'&&!pt.micro)continue;
  const M=pt.model?(typeof pt.model==='function'?pt.model():pt.model):ID;
  U.m4('uModel',M);
  if(pass==='main'||pass==='pre'){U.m3('uNMat',M===ID?IDN:M4.nmat(M));U.i('uDouble',pt.double?1:0)}
  if(pass==='main'){const m=pt.mat;U.i('uMat',m.id);U.v3('uBase',m.base||[0.5,0.5,0.5]);U.f('uRough',m.rough??0.5);U.f('uMetal',m.metal??0);U.v4('uP',m.p||[0,0,0,0])}
  gl.bindVertexArray(pt.mesh.vao);gl.drawElements(gl.TRIANGLES,pt.mesh.count,gl.UNSIGNED_INT,0)}
 if(pass==='main')drawChain(chainA(),chainB())
}
const LINKS=[];
function drawChain(A,B){const d=V3.sub(B,A),L=V3.len(d),dir=V3.mul(d,1/L),step=0.0052,n=Math.max(1,Math.round(L/step));
 const h=Math.abs(dir[1])<0.95?[0,1,0]:[1,0,0],e1=V3.norm(V3.cross(dir,h)),e2=V3.cross(e1,dir);
 const m=MAT.nickel;if(CUR!==P_sh){U.i('uMat',m.id);U.v4('uP',[0,0,0,0]);U.i('uDouble',0)}
 for(let k=0;k<n;k++){const p=V3.add(A,V3.mul(dir,(k+0.5)*L/n));const a=k%2?Math.PI/2:0;const x=V3.add(V3.mul(e1,Math.cos(a)),V3.mul(e2,Math.sin(a))),z=V3.cross(x,dir);
  const M=M4.basis(x,V3.mul(dir,-1),z,p);U.m4('uModel',M);if(CUR!==P_sh)U.m3('uNMat',M4.nmat(M));gl.bindVertexArray(linkMesh.vao);gl.drawElements(gl.TRIANGLES,linkMesh.count,gl.UNSIGNED_INT,0)}}
function bindIBL(){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_CUBE_MAP,specTex);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_CUBE_MAP,irrTex);
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,labelTex);gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,grooveTex);gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,loudTex)}
function bindShadow(S){gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,S.t);gl.bindSampler(4,sampRaw);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,S.t);gl.bindSampler(5,sampCmp)}
function renderShadow(S,vp,pass){gl.bindFramebuffer(gl.FRAMEBUFFER,S.f);gl.viewport(0,0,S.size,S.size);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
 gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,3);use(P_sh);U.m4('uVP',vp);drawParts(pass);if(pass==='shadow')drawChain(chainA(),chainB())
 gl.disable(gl.POLYGON_OFFSET_FILL)}
function setMain(P,c){use(P);U.m4('uVP',c.vp);U.m4('uView',c.view);U.v3('uCam',c.eye);
 U.i('uSpec',0);U.i('uIrr',1);U.i('uAO',2);U.i('uLabel',3);U.i('uShRaw',4);U.i('uShCmp',5);U.i('uGroove',6);U.i('uLoud',7);U.f('uSPR',SPR);U.f('uNREV',NREV);U.f('uSpecMax',SPEC_LEVELS-1);
 U.m4('uLVP',c.lvp);U.v4('uShInfo',c.shi);U.f('uShTexel',1/c.shs);U.v3('uLdir',c.ldir);U.v3('uLcol',c.lcol);U.v3('uKdir',LDIR);U.f('uKeyVis',c.keyVis);
 U.v2('uSpotC',SPOTC[0],SPOTC[1]);U.i('uLupaOcc',0);U.i('uUseAO',c.ao?1:0);U.v2('uAOres',RT.pw,RT.ph);U.v2('uVPsize',c.w,c.h);
 U.f('uBelt',state.rot*0.0223%1);patchUniforms(c.mi,c.blur);
 U.v4('uPatch',c.mi.on?[c.mi.x0,c.mi.HX,c.mi.HA,1]:[0,0,0,0]);U.f('uPatchPhi',c.mi.phi0);U.v4('uWax',app.WAXNOW);U.i('uCylFly',state.pose.fly?1:0);
 U.v3('uL2dir',c.L2);U.v3('uL2col',c.L2col);U.m4('uLVP2',c.LVP2);U.v4('uSh2Info',c.SH2);U.i('uSh2Cmp',8);U.f('uSpeedStreak',c.blur*c.mi.m)}
function patchUniforms(mi,blur){U.v4('uCyl',[YM,ZM,RC,XA]);U.f('uRot',state.rotMod);U.v4('uPatchG',[mi.x0,mi.HX,mi.HA,mi.phi0]);
 U.i('uGroove',6);U.i('uLoud',7);U.f('uSPR',SPR);U.f('uNREV',NREV);U.f('uBlur',blur);U.f('uCylOff',state.pose.off)}
function microState(dist,asp,fov){const t=cam.t,ry=t[1]-YM,rz=t[2]-ZM,rT=Math.hypot(ry,rz);
 const on=!swap.phase&&Math.abs(rT-RC)<0.004&&t[0]>CYL0-0.003&&t[0]<CYL0+CYLL+0.003;
 const vw=dist*Math.tan(fov/2)*Math.max(asp,1),HX=clamp(vw*2.6,0.0011,0.012);
 return{on:on&&dist<0.034,m:on?1-sstep(0.010,0.032,dist):0,x0:t[0],HX,HA:clamp(HX*4.2/RC,0.06,0.6),phi0:Math.atan2(rz,ry)}}
let lastVP=null;
let lastInvVP=null;
let lastEye=[0,0,1];
let scale=1,emaMs=16,lastAdj=0,W=0,H=0;
function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);const cw=canvas.clientWidth,ch=canvas.clientHeight;
 let w=Math.round(cw*dpr*scale),h=Math.round(ch*dpr*scale);const cap=2.8e6;if(w*h>cap){const k=Math.sqrt(cap/(w*h));w=Math.round(w*k);h=Math.round(h*k)}
 if(w!==W||h!==H||!RT){W=w;H=h;canvas.width=w;canvas.height=h;makeRT(w,h)}

}
function adaptQuality(dt,now,frames){emaMs=emaMs*0.92+(dt*1000)*0.08;if(now-lastAdj>1600&&frames>20){lastAdj=now;if(emaMs>24&&scale>0.55){scale=Math.max(0.55,scale-0.12);resize()}else if(emaMs<13&&scale<1){scale=Math.min(1,scale+0.08);resize()}}} // lower the render scale when frames run slow, raise it again with headroom
function render(time){
 const asp=W/H,fov=0.52,dist=cam.dist*Math.max(1,1.2/asp);
 const eye=V3.add(cam.t,[Math.sin(cam.yaw)*Math.cos(cam.pitch)*dist,Math.sin(cam.pitch)*dist,Math.cos(cam.yaw)*Math.cos(cam.pitch)*dist]);
 {const ry=eye[1]-YM,rz=eye[2]-ZM,r=Math.hypot(ry,rz),minR=RC+Math.max(0.00025,dist*0.05);   // never inside the wax
  if(!swap.phase&&eye[0]>CYL0-0.001&&eye[0]<CYL0+CYLL+0.001&&r<minR){const k=minR/Math.max(r,1e-6);eye[1]=YM+ry*k;eye[2]=ZM+rz*k}}
 const near=Math.max(0.000015,dist*0.02),far=clamp(near*2e5,3,40);const proj0=M4.persp(fov,asp,near,far),proj=state.lens>1e-4?M4.mul(M4.T(0,state.lens,0),proj0):proj0,vw=M4.lookAt(eye,cam.t,[0,1,0]),vp=M4.mul(proj,vw);   // lens shift: keeps the subject above the guide card
 lastInvVP=M4.inv(vp);lastVP=vp;lastEye=eye;spatialUpdate(eye,cam.t);
 const mi=microState(dist,asp,fov);
 const blur=sstep(0.00008,0.0012,mach.omega*RC/60);   // 1/60 s exposure: at full speed the hills & dales smear out
 gl.disable(gl.BLEND);bindIBL();
 renderShadow(SH_MAIN,LM.vp,'shadow');
 let L2=[0,1,0],L2col=[0,0,0],LVP2=LM.vp,SH2=[1,1,0,0.001];
 if(mi.m>0.001){   // close-up: inspection lamp + its own fine shadow map (stylus, weight and the groove walls)
  const Ns=[0,Math.cos(mi.phi0),Math.sin(mi.phi0)],cen=[mi.x0,YM+RC*Ns[1],ZM+RC*Ns[2]],c=V3.norm(V3.sub(eye,cen));
  let ct=V3.sub(c,V3.mul(Ns,V3.dot(c,Ns)));if(V3.len(ct)<0.2)ct=[0,-Ns[2],Ns[1]];ct=V3.norm(ct);
  L2=V3.norm(V3.add(V3.add(V3.mul(ct,0.70),V3.mul(Ns,0.48)),[0.32,0,0]));L2col=[6.4*mi.m,6.0*mi.m,5.4*mi.m];
  const sz=Math.max(mi.HX*1.3,0.0035),pts=[];for(const a of[-1,1])for(const b of[-1,1])for(const d of[-1,1])pts.push(V3.add(cen,[a*sz,b*sz,d*sz]));
  const LMm=lightOrtho(cen,L2,pts,0.0004);LVP2=LMm.vp;SH2=[LMm.range,LMm.width,0,LMm.width/SH_MICRO.size];
  renderShadow(SH_MICRO,LMm.vp,'micro');
  if(mi.on){gl.bindFramebuffer(gl.FRAMEBUFFER,SH_MICRO.f);gl.viewport(0,0,SH_MICRO.size,SH_MICRO.size);gl.enable(gl.DEPTH_TEST);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,3);
   use(P_patchSh);patchUniforms(mi,blur);U.m4('uVP',LMm.vp);gl.bindVertexArray(PATCH.vao);gl.drawElements(gl.TRIANGLES,PATCH.count,gl.UNSIGNED_INT,0);gl.disable(gl.POLYGON_OFFSET_FILL)}}
 const useAO=mi.m<0.5;
 if(useAO){
  gl.bindFramebuffer(gl.FRAMEBUFFER,RT.preF);gl.viewport(0,0,RT.pw,RT.ph);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  use(P_pre);U.m4('uVP',vp);U.m4('uView',vw);drawParts('pre');
  gl.disable(gl.DEPTH_TEST);const tanY=Math.tan(fov/2);
  gl.bindFramebuffer(gl.FRAMEBUFFER,RT.ao1F);use(P_ssao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,RT.pre);U.i('uND',0);U.v2('uRes',RT.pw,RT.ph);U.v2('uTan',tanY*asp,tanY);U.f('uRad',clamp(dist*0.05,0.002,0.02));U.f('uInt',1.0);drawFS();
  use(P_blur);U.i('uSrc',0);gl.bindFramebuffer(gl.FRAMEBUFFER,RT.ao2F);gl.bindTexture(gl.TEXTURE_2D,RT.ao1);U.v2('uDir',1/RT.pw,0);drawFS();
  gl.bindFramebuffer(gl.FRAMEBUFFER,RT.ao1F);gl.bindTexture(gl.TEXTURE_2D,RT.ao2);U.v2('uDir',0,1/RT.ph);drawFS()}
 // main
 gl.bindFramebuffer(gl.FRAMEBUFFER,RT.msF);gl.viewport(0,0,W,H);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);
 use(P_bg);U.m4('uInvVP',lastInvVP);U.v3('uCam',eye);drawFS();
 gl.enable(gl.DEPTH_TEST);bindIBL();bindShadow(SH_MAIN);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,useAO?RT.ao1:whiteTex);
 gl.activeTexture(gl.TEXTURE8);gl.bindTexture(gl.TEXTURE_2D,SH_MICRO.t);gl.bindSampler(8,sampCmp);
 const ctx={vp,view:vw,eye,lvp:LM.vp,shi:SHI_MAIN,shs:SH_MAIN.size,ldir:LDIR,lcol:KEYE,keyVis:-1,ao:useAO,w:W,h:H,mi,blur,L2,L2col,LVP2,SH2};
 setMain(P_main,ctx);drawParts('main');
 if(mi.on){setMain(P_patch,ctx);U.v4('uPatch',[0,0,0,0]);U.m3('uNMat',IDN);U.i('uDouble',0);U.i('uMat',3);U.v4('uP',[1,0,0,0]);U.v3('uBase',[0.5,0.5,0.5]);U.f('uRough',0.3);U.f('uMetal',0);
  gl.bindVertexArray(PATCH.vao);gl.drawElements(gl.TRIANGLES,PATCH.count,gl.UNSIGNED_INT,0)}
 gl.bindFramebuffer(gl.READ_FRAMEBUFFER,RT.msF);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,RT.hdrF);gl.blitFramebuffer(0,0,W,H,0,0,W,H,gl.COLOR_BUFFER_BIT,gl.NEAREST);
 gl.disable(gl.DEPTH_TEST);
 // bloom
 use(P_down);U.i('uSrc',0);gl.activeTexture(gl.TEXTURE0);
 for(let i=0;i<RT.bl.length;i++){const L=RT.bl[i];gl.bindFramebuffer(gl.FRAMEBUFFER,L.f);gl.viewport(0,0,L.w,L.h);
  if(i===0){gl.bindTexture(gl.TEXTURE_2D,RT.hdr);U.v2('uTexel',1/W,1/H);U.i('uKaris',1)}else{const S=RT.bl[i-1];gl.bindTexture(gl.TEXTURE_2D,S.t);U.v2('uTexel',1/S.w,1/S.h);U.i('uKaris',0)}drawFS()}
 use(P_up);U.i('uSrc',0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
 for(let i=RT.bl.length-1;i>0;i--){const S=RT.bl[i],D=RT.bl[i-1];gl.bindFramebuffer(gl.FRAMEBUFFER,D.f);gl.viewport(0,0,D.w,D.h);gl.bindTexture(gl.TEXTURE_2D,S.t);U.v2('uTexel',1/S.w,1/S.h);drawFS()}
 gl.disable(gl.BLEND);
 // composite
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);use(P_comp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,RT.hdr);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,RT.bl[0].t);
 U.i('uHDR',0);U.i('uBloom',1);U.f('uExpo',1.08);U.f('uBloomK',0.055/RT.bl.length);U.f('uTime',time);U.v2('uRes',W,H);drawFS();
}

export { adaptQuality, lastEye, lastInvVP, lastVP, render, resize };
