// Rays from the pointer into the scene: which part is under the cursor, and where on the cylinder.

import { canvas } from './context.js';
import { M4, V3 } from './math.js';
import { CYL0, CYLL, PLY, RC, REPY, YM, ZM } from './constants.js';
import { state, swap } from './state.js';
import { cam } from './camera.js';
import { BOXP, CRK, KEY_Y, KEY_Z0, KEY_Z1, VOLK, crankM, levM, lidM } from './scene.js';
import { lastEye, lastInvVP, lastVP } from './render.js';

function rayCapsule(R,a,b,r){   // closest approach of the ray to segment ab; returns ray distance t if within r (r grows with distance so small parts stay grabbable)
 const u=R.d,v=V3.sub(b,a),w=V3.sub(R.o,a),A=V3.dot(u,u),B=V3.dot(u,v),C2=V3.dot(v,v),D=V3.dot(u,w),E=V3.dot(v,w),den=A*C2-B*B;
 let sc,tc;if(den<1e-14){sc=0;tc=E/C2}else{sc=(B*E-C2*D)/den;tc=(A*E-B*D)/den}tc=Math.max(0,Math.min(1,tc));sc=Math.max(0,(B*tc-D)/A);
 const p=V3.add(R.o,V3.mul(u,sc)),q=V3.add(a,V3.mul(v,tc)),d=V3.len(V3.sub(p,q));return d<Math.max(r,sc*0.011)?sc:Infinity}
function rayCylY(R,cx,cz,r,y0,y1){const ox=R.o[0]-cx,oz=R.o[2]-cz,dx=R.d[0],dz=R.d[2],a=dx*dx+dz*dz,b=2*(ox*dx+oz*dz),c=ox*ox+oz*oz-r*r,D=b*b-4*a*c;let best=Infinity;   // ray vs upright finite cylinder (side + caps)
 if(a>1e-12&&D>=0){const q=Math.sqrt(D);for(const t of[(-b-q)/(2*a),(-b+q)/(2*a)]){const y=R.o[1]+R.d[1]*t;if(t>0&&y>=y0&&y<=y1)best=Math.min(best,t)}}
 if(Math.abs(R.d[1])>1e-9)for(const yy of[y0,y1]){const t=(yy-R.o[1])/R.d[1],x=ox+dx*t,z=oz+dz*t;if(t>0&&x*x+z*z<=r*r)best=Math.min(best,t)}return best}
function rayCylAxis(R,c,a,r,h){const t0=Math.abs(a[1])<0.9?[0,1,0]:[1,0,0],u=V3.norm(V3.cross(a,t0)),w=V3.cross(u,a),q=V3.sub(R.o,c);
 return rayCylY({o:[V3.dot(q,u),V3.dot(q,a),V3.dot(q,w)],d:[V3.dot(R.d,u),V3.dot(R.d,a),V3.dot(R.d,w)]},0,0,r,-h,h)}
const reproHit=R=>rayCylY(R,state.cx,ZM,0.0245,REPY-0.0075+state.lift,REPY+0.014+state.lift);
function pickMech(R){if(!R||swap.phase)return null;let best=null,bt=Infinity;const tryIt=(name,t)=>{if(t<bt){bt=t;best=name}};
 const L=levM(),lk=M4.xf(L,[0.075,PLY+0.022,0.104]),lb=M4.xf(L,[0.075,PLY+0.004,0.090]);tryIt('lever',Math.min(rayCapsule(R,lb,lk,0.0035),rayCapsule(R,lk,lk,0.0045)));
 const Cm=crankM(),P=q=>M4.xf(Cm,q);tryIt('crank',Math.min(rayCapsule(R,P([0.0275,-0.060,0]),P([0.0655,-0.060,0]),0.009),rayCapsule(R,P([0.0188,0,0]),P([0.0248,-0.060,0]),0.006),rayCapsule(R,P([0,0,0]),P([0.026,0,0]),0.010)));
 tryIt('needle',reproHit(R));
 {const L=lidM(),c=M4.xf(L,[0,0.012,0]),a=V3.norm(V3.sub(M4.xf(L,[0,1,0]),M4.xf(L,[0,0,0])));tryIt('lid',rayCylAxis(R,c,a,0.0366,0.0125))}
 tryIt('box',rayCylY(R,BOXP[0],BOXP[2],0.0352,0,0.1178));
 tryIt('key',rayCapsule(R,[0,KEY_Y,KEY_Z0],[0,KEY_Y,KEY_Z1],0.0036));
 {const kd=V3.len(V3.sub(lastEye,[VOLK[0],PLY,VOLK[1]]));tryIt('volume',rayCylY(R,VOLK[0],VOLK[1],0.0066+kd*0.006,PLY,PLY+0.0107))}
 const hc=hitCyl(R);if(hc&&V3.len(V3.sub(hc,R.o))<bt-0.004)return null;   // the wax is in front: that click is for the cylinder
 return best}
function crankAng(R){const dx=R.d[0];if(Math.abs(dx)<0.05)return null;const t=(CRK[0]+0.046-R.o[0])/dx;if(t<0)return null;const p=V3.add(R.o,V3.mul(R.d,t));return Math.atan2(p[2]-CRK[2],p[1]-CRK[1])}
function screenOf(p){const m=lastVP,x=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],y=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15],r=canvas.getBoundingClientRect();return[r.left+(x/w*0.5+0.5)*r.width,r.top+(0.5-y/w*0.5)*r.height]}
function rayAt(cx,cy){if(!lastInvVP)return null;const r=canvas.getBoundingClientRect(),nx=(cx-r.left)/r.width*2-1,ny=1-(cy-r.top)/r.height*2,m=lastInvVP;
 const un=z=>{const X=m[0]*nx+m[4]*ny+m[8]*z+m[12],Y=m[1]*nx+m[5]*ny+m[9]*z+m[13],Z=m[2]*nx+m[6]*ny+m[10]*z+m[14],Wd=m[3]*nx+m[7]*ny+m[11]*z+m[15];return[X/Wd,Y/Wd,Z/Wd]};
 const p0=un(-1);return{o:p0,d:V3.norm(V3.sub(un(1),p0))}}
function hitCyl(R){if(!R||swap.phase)return null;const{o,d}=R,oy=o[1]-YM,oz=o[2]-ZM,a=d[1]*d[1]+d[2]*d[2],b=2*(oy*d[1]+oz*d[2]),c=oy*oy+oz*oz-RC*RC,D=b*b-4*a*c;
 if(D<0||a<1e-12)return null;const t=(-b-Math.sqrt(D))/(2*a);if(t<0)return null;const p=V3.add(o,V3.mul(d,t));return(p[0]<CYL0||p[0]>CYL0+CYLL)?null:p}
function hitAt(cx,cy){const R=rayAt(cx,cy);if(!R)return null;const h=hitCyl(R);if(h)return h;const n=V3.norm(V3.sub(lastEye,cam.t)),dn=V3.dot(R.d,n);if(Math.abs(dn)<1e-6)return null;
 const t=V3.dot(V3.sub(cam.t,R.o),n)/dn;return t>0?V3.add(R.o,V3.mul(R.d,t)):null}

export { crankAng, hitAt, hitCyl, pickMech, rayAt, reproHit, screenOf };
