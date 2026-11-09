// Mesh building on the CPU: lathes, sweeps along paths, rounded boxes and tori.
// Every part of the machine is made from these; nothing is loaded from a file.

import { M4, V3, m3v, rotAxis } from './math.js';

class MB{constructor(){this.P=[];this.N=[];this.U=[];this.I=[]}
 get n(){return this.P.length/3}
 v(p,n,u=0,w=0){this.P.push(p[0],p[1],p[2]);this.N.push(n[0],n[1],n[2]);this.U.push(u,w);return this.n-1}
 tri(a,b,c){const P=this.P,N=this.N,ax=P[a*3],ay=P[a*3+1],az=P[a*3+2];
  const e1x=P[b*3]-ax,e1y=P[b*3+1]-ay,e1z=P[b*3+2]-az,e2x=P[c*3]-ax,e2y=P[c*3+1]-ay,e2z=P[c*3+2]-az;
  const fx=e1y*e2z-e1z*e2y,fy=e1z*e2x-e1x*e2z,fz=e1x*e2y-e1y*e2x;if(fx*fx+fy*fy+fz*fz<1e-34)return;
  const sx=N[a*3]+N[b*3]+N[c*3],sy=N[a*3+1]+N[b*3+1]+N[c*3+1],sz=N[a*3+2]+N[b*3+2]+N[c*3+2];
  if(fx*sx+fy*sy+fz*sz>=0)this.I.push(a,b,c);else this.I.push(a,c,b)}
 quad(a,b,c,d){this.tri(a,b,c);this.tri(a,c,d)}
 add(o,m){m=m||M4.I();const base=this.n,nm=M4.nmat(m);
  for(let i=0;i<o.n;i++){this.v(M4.xf(m,[o.P[i*3],o.P[i*3+1],o.P[i*3+2]]),V3.norm(m3v(nm,[o.N[i*3],o.N[i*3+1],o.N[i*3+2]])),o.U[i*2],o.U[i*2+1])}
  for(const i of o.I)this.I.push(i+base);return this}
}
function splitGroups(pr){const gs=[];let cur=[pr[0]];for(let i=1;i<pr.length;i++){const p=pr[i],q=pr[i-1];if(Math.abs(p[0]-q[0])<1e-11&&Math.abs(p[1]-q[1])<1e-11){if(cur.length>1)gs.push(cur);cur=[p]}else cur.push(p)}if(cur.length>1)gs.push(cur);return gs}
function profN(g){return g.map((p,i)=>{const a=g[Math.max(0,i-1)],b=g[Math.min(g.length-1,i+1)],dr=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dr,dy)||1;return[dy/l,-dr/l]})}
function lathe(pr,segs=48){const mb=new MB();let acc=0;
 for(const g of splitGroups(pr)){const nr=profN(g),rows=[];
  for(let i=0;i<g.length;i++){if(i>0)acc+=Math.hypot(g[i][0]-g[i-1][0],g[i][1]-g[i-1][1]);const row=[];
   for(let j=0;j<=segs;j++){const t=j/segs,a=t*Math.PI*2,c=Math.cos(a),s=Math.sin(a);row.push(mb.v([g[i][0]*c,g[i][1],g[i][0]*s],[nr[i][0]*c,nr[i][1],nr[i][0]*s],t,acc))}rows.push(row)}
  for(let i=0;i<g.length-1;i++)for(let j=0;j<segs;j++)mb.quad(rows[i][j],rows[i+1][j],rows[i+1][j+1],rows[i][j+1])}
 return mb}
function rectLathe(ax,az,pr,cseg=10,ob=0.0082){const mb=new MB(),path=[],cs=[[ax,az],[-ax,az],[-ax,-az],[ax,-az]];
 for(let c=0;c<4;c++)for(let k=0;k<=cseg;k++){const a=(c+k/cseg)*Math.PI/2;path.push([cs[c][0],cs[c][1],Math.cos(a),Math.sin(a)])}
 const L=path.length,S=[0];for(let j=1;j<=L;j++){const p=path[j%L],q=path[j-1];S.push(S[j-1]+Math.hypot(p[0]+p[2]*ob-q[0]-q[2]*ob,p[1]+p[3]*ob-q[1]-q[3]*ob))}
 let acc=0;
 for(const g of splitGroups(pr)){const nr=profN(g),rows=[];
  for(let i=0;i<g.length;i++){if(i>0)acc+=Math.hypot(g[i][0]-g[i-1][0],g[i][1]-g[i-1][1]);const row=[],[o,y]=g[i];
   for(let j=0;j<=L;j++){const p=path[j%L];row.push(mb.v([p[0]+p[2]*o,y,p[1]+p[3]*o],[p[2]*nr[i][0],nr[i][1],p[3]*nr[i][0]],S[j],acc))}rows.push(row)}
  for(let i=0;i<g.length-1;i++)for(let j=0;j<L;j++)mb.quad(rows[i][j],rows[i+1][j],rows[i+1][j+1],rows[i][j+1])}
 return mb}
function rbox(sx,sy,sz,r,bs=4,inner=2){const H=[sx/2,sy/2,sz/2];r=Math.max(1e-5,Math.min(r,H[0],H[1],H[2])*0.999);
 const cs=h=>{const a=[];for(let k=0;k<=bs;k++)a.push(-h+r*k/bs);for(let k=1;k<inner;k++)a.push(-h+r+(2*h-2*r)*k/inner);for(let k=0;k<=bs;k++)a.push(h-r+r*k/bs);return a.filter((v,i,ar)=>i===0||Math.abs(v-ar[i-1])>1e-9)};
 const C=[cs(H[0]),cs(H[1]),cs(H[2])],mb=new MB();
 for(let ax=0;ax<3;ax++)for(const sg of[1,-1]){const ua=ax===0?1:0,va=ax===2?1:2,A=C[ua],B=C[va],rows=[];
  for(let i=0;i<A.length;i++){const row=[];for(let j=0;j<B.length;j++){const q=[0,0,0];q[ax]=sg*H[ax];q[ua]=A[i];q[va]=B[j];
   const c=[0,1,2].map(k=>Math.max(-(H[k]-r),Math.min(H[k]-r,q[k]))),d=V3.norm(V3.sub(q,c));row.push(mb.v(V3.add(c,V3.mul(d,r)),d,q[0],q[2]))}rows.push(row)}
  for(let i=0;i<A.length-1;i++)for(let j=0;j<B.length-1;j++)mb.quad(rows[i][j],rows[i+1][j],rows[i+1][j+1],rows[i][j+1])}
 return mb}
function sweep(pts,rads,ring=32,o={}){const n=pts.length,closed=!!o.closed,T=[];
 for(let i=0;i<n;i++){const a=closed?pts[(i-1+n)%n]:pts[Math.max(0,i-1)],b=closed?pts[(i+1)%n]:pts[Math.min(n-1,i+1)];T.push(V3.norm(V3.sub(b,a)))}
 let up=o.up||(Math.abs(T[0][1])<0.92?[0,1,0]:[1,0,0]);let N1=V3.norm(V3.sub(up,V3.mul(T[0],V3.dot(up,T[0]))));const F=[];
 for(let i=0;i<n;i++){if(i>0){const ax=V3.cross(T[i-1],T[i]),s=V3.len(ax);if(s>1e-9){N1=rotAxis(N1,V3.mul(ax,1/s),Math.atan2(s,V3.dot(T[i-1],T[i])))}N1=V3.norm(V3.sub(N1,V3.mul(T[i],V3.dot(N1,T[i]))))}F.push([N1,V3.cross(T[i],N1)])}
 const S=[0];for(let i=1;i<n;i++)S.push(S[i-1]+V3.len(V3.sub(pts[i],pts[i-1])));
 const R=rads.map(r=>Array.isArray(r)?r:[r,r]),mb=new MB(),rows=[];
 for(let i=0;i<n;i++){const i0=Math.max(0,i-1),i1=Math.min(n-1,i+1),ds=(S[i1]-S[i0])||1,drx=(R[i1][0]-R[i0][0])/ds,dry=(R[i1][1]-R[i0][1])/ds,row=[],[A,B]=F[i],[rx,ry]=R[i];
  for(let j=0;j<=ring;j++){const a=j/ring*Math.PI*2+(o.phase||0),c=Math.cos(a),s=Math.sin(a);
   const p=[pts[i][0]+A[0]*c*rx+B[0]*s*ry,pts[i][1]+A[1]*c*rx+B[1]*s*ry,pts[i][2]+A[2]*c*rx+B[2]*s*ry];
   let e0=c*ry,e1=s*rx;const el=Math.hypot(e0,e1)||1;e0/=el;e1/=el;const dr=drx*c*c+dry*s*s;
   row.push(mb.v(p,V3.norm([A[0]*e0+B[0]*e1-T[i][0]*dr,A[1]*e0+B[1]*e1-T[i][1]*dr,A[2]*e0+B[2]*e1-T[i][2]*dr]),j/ring,S[i]))}rows.push(row)}
 const m=closed?n:n-1;for(let i=0;i<m;i++){const k=(i+1)%n;for(let j=0;j<ring;j++)mb.quad(rows[i][j],rows[k][j],rows[k][j+1],rows[i][j+1])}
 const cap=(i,sg)=>{const[A,B]=F[i],[rx,ry]=R[i],nn=V3.mul(T[i],sg),c0=mb.v(pts[i],nn,0.5,S[i]),rr=[];
  for(let j=0;j<=ring;j++){const a=j/ring*Math.PI*2+(o.phase||0),c=Math.cos(a),s=Math.sin(a);rr.push(mb.v([pts[i][0]+A[0]*c*rx+B[0]*s*ry,pts[i][1]+A[1]*c*rx+B[1]*s*ry,pts[i][2]+A[2]*c*rx+B[2]*s*ry],nn,0,S[i]))}
  for(let j=0;j<ring;j++)mb.tri(c0,rr[j],rr[j+1])};
 if(o.capStart)cap(0,-1);if(o.capEnd)cap(n-1,1);return mb}
function circlePts(c,ax,r,n){const a=V3.norm(ax),h=Math.abs(a[1])<0.9?[0,1,0]:[1,0,0],e1=V3.norm(V3.cross(a,h)),e2=V3.cross(a,e1),p=[];
 for(let i=0;i<n;i++){const t=i/n*Math.PI*2;p.push(V3.add(c,V3.add(V3.mul(e1,Math.cos(t)*r),V3.mul(e2,Math.sin(t)*r))))}return p}
function torus(c,ax,R,r,n=64,ring=16){const pts=circlePts(c,ax,R,n);return sweep(pts,pts.map(()=>r),ring,{closed:true,up:V3.norm(ax)})}
function roundPoly(P,rc,k=10){const out=[P[0]];for(let i=1;i<P.length-1;i++){const a=P[i-1],b=P[i],c=P[i+1],d1=V3.norm(V3.sub(b,a)),d2=V3.norm(V3.sub(c,b)),
 r=Math.min(rc,V3.len(V3.sub(b,a))*0.45,V3.len(V3.sub(c,b))*0.45),p0=V3.sub(b,V3.mul(d1,r)),p2=V3.add(b,V3.mul(d2,r));
 for(let j=0;j<=k;j++){const t=j/k,u=1-t;out.push([u*u*p0[0]+2*u*t*b[0]+t*t*p2[0],u*u*p0[1]+2*u*t*b[1]+t*t*p2[1],u*u*p0[2]+2*u*t*b[2]+t*t*p2[2]])}}
 out.push(P[P.length-1]);const res=[out[0]];const seg=0.004;
 for(let i=1;i<out.length;i++){const a=out[i-1],b=out[i],L=V3.len(V3.sub(b,a)),m=Math.max(1,Math.ceil(L/seg));for(let j=1;j<=m;j++)res.push(V3.lerp(a,b,j/m))}return res}
const cylProf=(r,L,ch)=>[[0,0],[r-ch,0],[r,ch],[r,L-ch],[r-ch,L],[0,L]];
const sphereProf=(r,n=16)=>{const a=[];for(let i=0;i<=n;i++){const t=-Math.PI/2+Math.PI*i/n;a.push([Math.cos(t)*r*(i===0||i===n?0:1),Math.sin(t)*r])}return a};

export { MB, circlePts, cylProf, lathe, rbox, rectLathe, roundPoly, sphereProf, sweep, torus };
