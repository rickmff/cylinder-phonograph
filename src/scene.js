// The machine, part by part: oak case, bed plate, mandrel and cylinder, belt and pulleys, crank,
// volume knob, lock and key, carriage, stylus and weight, horn and crane, the cylinder box.

import { M4, V3, bez3, chain, toX } from './math.js';
import { MB, circlePts, cylProf, lathe, rbox, rectLathe, roundPoly, sphereProf, sweep, torus } from './mesh.js';
import { upload } from './gl-util.js';
import { CYLL, HORN_D, HORN_E, HORN_L, HORN_S0, PLY, RB, RC, REPY, S_BAL, YB, YF, YM, ZB, ZF, ZM, hornR } from './constants.js';
import { AE, app, mach, state } from './state.js';
import { YC0 } from './contact.js';

const MAT={oak:{id:1},oakFlat:{id:1,p:[1,0,0,0]},plate:{id:2,p:[1,0.161,0.111,0]},japan:{id:2},wax:{id:3},waxPlain:{id:3,p:[0,0,1,0]},patch:{id:3,p:[1,0,0,0]},
 table:{id:4},brass:{id:5,p:[0,0,0,0.6]},brassClean:{id:5,p:[0,0,3,0.25]},horn:{id:6},screw:{id:7,p:[YF,ZF,0.0005,0]},belt:{id:8},nickel:{id:9},ebony:{id:10},rubber:{id:11},
 sapphire:{id:13},box:{id:14,p:[0.030,0.056,0,0.40]},lid:{id:14,p:[0,1,0,0]},hole:{id:15},lock:{id:16,p:[0,0,4,0.40]},lockKey:{id:16,p:[0,0,11,0.25]},steel:{id:0,base:[0.6,0.6,0.62],rough:0.25,metal:1}};
const parts=[];
function part(mb,mat,o={}){parts.push({mesh:upload(mb),mat,model:o.model||null,double:!!o.double,shadow:o.shadow!==false,micro:!!o.micro,main:o.main!==false,vis:o.vis||null,name:o.name||''});return parts[parts.length-1]}
const G={};const grp=k=>G[k]||(G[k]=new MB());
const carM=()=>M4.T(state.cx,state.lift,0);
const styM=()=>M4.T(state.cx,state.lift+state.dy,0);
/* -- case (oak) -- */
{const p=[];const to=(o,y)=>p.push([o,y]);const crease=()=>p.push(p[p.length-1].slice());
 const arc=(cx,cy,r,a0,a1,n)=>{for(let k=1;k<=n;k++){const a=a0+(a1-a0)*k/n;to(cx+r*Math.cos(a),cy+r*Math.sin(a))}};
 to(0,0);to(0.0170,0);arc(0.0170,0.0015,0.0015,-Math.PI/2,0,4);to(0.0185,0.0140);arc(0.0170,0.0140,0.0015,0,Math.PI/2,4);crease();
 to(0.0166,0.0155);for(let k=1;k<=9;k++){const a=k/9*Math.PI/2;to(0.0166-0.0072*Math.sin(a),0.0155+0.0100*(1-Math.cos(a)))}crease();
 to(0.0094,0.0262);arc(0.0088,0.0262,0.0006,0,Math.PI/2,3);crease();to(0.0082,0.0268);crease();
 to(0.0082,0.1235);crease();arc(0.0082,0.1265,0.0030,-Math.PI/2,Math.PI/2,10);crease();to(0.0078,0.1295);crease();
 to(0.0078,0.1352);arc(0.0063,0.1352,0.0015,0,Math.PI/2,4);crease();to(0,0.1367);
 grp('oak').add(rectLathe(0.160,0.110,p,12));
 const cap=new MB();const a=cap.v([0.16,0.1367,0.11],[0,1,0],0.16,0.11),b=cap.v([-0.16,0.1367,0.11],[0,1,0],-0.16,0.11),c=cap.v([-0.16,0.1367,-0.11],[0,1,0],-0.16,-0.11),d=cap.v([0.16,0.1367,-0.11],[0,1,0],0.16,-0.11);cap.quad(a,b,c,d);
 grp('oak').add(cap)}
/* -- table -- */
{const t=new MB();const a=t.v([-5,0,-5],[0,1,0]),b=t.v([5,0,-5],[0,1,0]),c=t.v([5,0,5],[0,1,0]),d=t.v([-5,0,5],[0,1,0]);t.quad(a,b,c,d);part(t,MAT.table,{shadow:false,name:'table'})}
/* -- bed plate -- */
part(rbox(0.322,0.008,0.222,0.0022,4,4),MAT.plate,{model:M4.T(0,PLY-0.004,0),name:'plate'});
grp('hole').add(rbox(0.0125,0.0008,0.050,0.0004,2,2),M4.T(0.117,PLY+0.0001,ZM));
/* -- upper works (japanned castings) -- */
{const J=grp('japan');
 J.add(lathe(cylProf(0.0135,0.026,0.0016),48),toX(0.085,YM,ZM));
 J.add(lathe(cylProf(0.0088,0.026,0.0012),32),toX(0.085,YF,ZF));
 J.add(lathe(cylProf(0.0088,0.026,0.0012),32),toX(0.085,YB,ZB));
 J.add(lathe(cylProf(0.0088,0.024,0.0012),32),toX(-0.146,YF,ZF));
 J.add(lathe(cylProf(0.0088,0.024,0.0012),32),toX(-0.146,YB,ZB));
 J.add(rbox(0.254,0.013,0.022,0.004,4,4),M4.T(-0.017,PLY+0.0065,-0.051));
 J.add(rbox(0.050,0.010,0.030,0.004,4,2),M4.T(0.098,PLY+0.005,-0.006));
 J.add(rbox(0.034,0.010,0.064,0.004,4,2),M4.T(-0.134,PLY+0.005,-0.036));}
part(rbox(0.020,0.108,0.114,0.006,5,3),{id:2,p:[2,0.010,0.054,0.057]},{model:M4.T(0.098,PLY+0.054,-0.006),name:'stdR'});
part(rbox(0.016,0.102,0.052,0.005,5,3),{id:2,p:[2,0.008,0.051,0.026]},{model:M4.T(-0.134,PLY+0.051,-0.036),name:'stdL'});
/* -- rods, mandrel, cylinder -- */
part(lathe(cylProf(0.0042,0.212,0.0006),36),MAT.screw,{model:toX(-0.124,YF,ZF),name:'feed'});
grp('nickel').add(lathe(cylProf(0.0055,0.218,0.0008),40),toX(-0.128,YB,ZB));
grp('nickel').add(lathe([[0,0],[0.0170,0],[0.0195,0.0008],[0.0210,0.0025],[0.0215,0.0045],[0.0215,0.0045],[0.0215,0.0060],[0.0226,0.1150],[0.0228,0.1160],[0.0236,0.1168],[0.0240,0.1182],[0.0240,0.1222],[0.0234,0.1238],[0.0234,0.1238],[0.0060,0.1238],[0.0060,0.1238],[0.0055,0.1244],[0.0055,0.2030],[0.0050,0.2036],[0,0.2036]],72),toX(-0.0765,YM,ZM));
part(lathe([[0.0219,0],[0.0266,0],[0.0274,0.0005],[0.0278,0.0014],[0.0278,0.1066],[0.0274,0.1075],[0.0266,0.1080],[0.0229,0.1080],[0.0229,0.1080],[0.0219,0]],180),MAT.wax,{model:()=>{const P=state.pose;return chain(M4.T(P.p[0],P.p[1],P.p[2]),M4.RZ(P.a),M4.T(0,-CYLL/2,0))},name:'wax'});
/* -- pulley (rotating) & belt -- */
{const pm=new MB();
 pm.add(lathe([[0.0185,0],[0.0235,0],[0.0235,0],[0.0235,0.0015],[0.0205,0.005],[0.0235,0.0085],[0.0235,0.0100],[0.0235,0.0100],[0.0185,0.0100],[0.0185,0.0100],[0.0185,0]],72),toX(0.112,YM,ZM));
 pm.add(lathe(cylProf(0.0085,0.012,0.0012),40),toX(0.111,YM,ZM));
 for(let k=0;k<5;k++)pm.add(rbox(0.0032,0.0108,0.0036,0.0010,3,2),chain(M4.T(0.117,YM,ZM),M4.RX(k/5*Math.PI*2),M4.T(0,0.0135,0)));
 part(pm,MAT.brassClean,{model:()=>chain(M4.T(0,YM,ZM),M4.RX(state.rot),M4.T(0,-YM,-ZM)),name:'pulley'});
 const c1=[YM,ZM],r1=0.0223,c2=[0.060,ZM-0.002],r2=0.0085,dx=c2[0]-c1[0],dz=c2[1]-c1[1],d=Math.hypot(dx,dz),th=Math.atan2(dz,dx),be=Math.acos((r1-r2)/d),pts=[];
 const N1=90,N2=24,NL=40;
 for(let i=0;i<N1;i++){const a=th+be+(2*Math.PI-2*be)*i/N1;pts.push([0.117,c1[0]+r1*Math.cos(a),c1[1]+r1*Math.sin(a)])}
 {const a=th-be,p0=[c1[0]+r1*Math.cos(a),c1[1]+r1*Math.sin(a)],p1=[c2[0]+r2*Math.cos(a),c2[1]+r2*Math.sin(a)];for(let i=0;i<NL;i++){const t=i/NL;pts.push([0.117,p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t])}}
 for(let i=0;i<N2;i++){const a=th-be+2*be*i/N2;pts.push([0.117,c2[0]+r2*Math.cos(a),c2[1]+r2*Math.sin(a)])}
 {const a=th+be,p0=[c2[0]+r2*Math.cos(a),c2[1]+r2*Math.sin(a)],p1=[c1[0]+r1*Math.cos(a),c1[1]+r1*Math.sin(a)];for(let i=0;i<NL;i++){const t=i/NL;pts.push([0.117,p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t])}}
 part(sweep(pts,pts.map(()=>0.0019),14,{closed:true,up:[1,0,0]}),MAT.belt,{name:'belt'})}
/* -- crank (rotating) + escutcheon -- */
const CRK=[0.1682,0.080,0.010];
const crankM=()=>chain(M4.T(CRK[0],CRK[1],CRK[2]),M4.RX(-state.crank)); // winds clockwise, seen from the crank side
const LEVP=[0.075,0,0.090],LEV_STOP=0.36,LEV_RUN=-0.36;
const levAng=()=>{const u=Math.max(0,Math.min(1,mach.lev)),e=u*u*(3-2*u);return LEV_STOP+(LEV_RUN-LEV_STOP)*e};
const levM=()=>chain(M4.T(LEVP[0],0,LEVP[2]),M4.RY(levAng()),M4.T(-LEVP[0],0,-LEVP[2]));
{const CX=CRK[0],CY=CRK[1],CZ=CRK[2];
 grp('nickel').add(lathe([[0,0],[0.0150,0],[0.0160,0.0006],[0.0158,0.0016],[0.0140,0.0024],[0.0062,0.0027],[0,0.0027]],56),toX(CX,CY,CZ));
 const cn=new MB(),ce=new MB();
 cn.add(lathe(cylProf(0.0042,0.022,0.0005),28),toX(0,0,0));
 cn.add(lathe(cylProf(0.0085,0.0065,0.0012),36),toX(0.0155,0,0));
 const ap=[];for(let i=0;i<=40;i++)ap.push(bez3([0.0188,0,0],[0.0188,-0.022,0],[0.0248,-0.038,0],[0.0248,-0.060,0],i/40));
 cn.add(sweep(ap,ap.map((p,i)=>{const t=i/40;return[0.0021-0.0003*t,0.0052-0.0012*t]}),20,{up:[1,0,0],capStart:true,capEnd:true}));
 cn.add(lathe(cylProf(0.0058,0.0050,0.0009),32),toX(0.0225,-0.060,0));
 ce.add(lathe([[0,0],[0.0040,0],[0.0046,0.0010],[0.0052,0.0030],[0.0068,0.0090],[0.0078,0.0170],[0.0080,0.0230],[0.0074,0.0300],[0.0062,0.0350],[0.0050,0.0375],[0.0046,0.0380],[0,0.0380]],40),toX(0.0275,-0.060,0));
 cn.add(lathe([[0,0],[0.0046,0],[0.0046,0.0010],[0.0038,0.0022],[0.0020,0.0027],[0,0.0028]],32),toX(0.0655,-0.060,0));
 const cm=crankM;
 part(cn,MAT.nickel,{model:cm,name:'crankN'});part(ce,MAT.ebony,{model:cm,name:'crankE'})}
/* -- plate details -- */
{const N=grp('nickel'),H=grp('hole');
 for(const[x,z]of[[0.148,0.098],[-0.148,0.098],[0.148,-0.098],[-0.148,-0.098]]){N.add(lathe([[0,0],[0.0034,0],[0.0034,0.0006],[0.0028,0.0014],[0.0016,0.0019],[0,0.0021]],24),M4.T(x,PLY,z));
  H.add(rbox(0.0058,0.0007,0.0007,0.0002,1,1),chain(M4.T(x,PLY+0.0019,z),M4.RY(x*37+z*11)))}
 N.add(lathe(cylProf(0.0042,0.004,0.0008),24),M4.T(0.075,PLY,0.090));
 const lp=[];for(let i=0;i<=24;i++)lp.push(bez3([0.075,PLY+0.003,0.090],[0.075,PLY+0.012,0.090],[0.075,PLY+0.019,0.096],[0.075,PLY+0.022,0.104],i/24));
 part(sweep(lp,lp.map(()=>0.0016),12),MAT.nickel,{model:levM,name:'lever'});   // start/stop lever: releases or applies the governor brake
 part(lathe(sphereProf(0.0034,14),24),MAT.ebony,{model:()=>chain(levM(),M4.T(0.075,PLY+0.022,0.104)),name:'leverK'});
 const B=grp('brass');
}
/* -- volume knob: knurled, with an index line; turns over a gold-leaf scale on the plate -- */
const VOLK=[-0.135,0.088],VOL_A0=-0.75*Math.PI,VOL_A1=0.75*Math.PI;
const volAng=()=>VOL_A0+(VOL_A1-VOL_A0)*AE.vol; // index points at 12 o'clock (away from you) at mid scale; clockwise = louder
const volM=()=>chain(M4.T(VOLK[0],0,VOLK[1]),M4.RY(-volAng()),M4.T(-VOLK[0],0,-VOLK[1]));
{const kb=new MB(),K=[VOLK[0],PLY,VOLK[1]];
 kb.add(lathe([[0,0],[0.0035,0],[0.0035,0.004],[0.0035,0.004],[0.0062,0.004],[0.0064,0.0046]],48),M4.T(...K));
 kb.add(lathe([[0.0064,0.0094],[0.0060,0.0102],[0.0040,0.0105],[0,0.0106]],48),M4.T(...K));
 const NK=192,R0=0.0064,KD=0.00024,ya=PLY+0.0046,yb=PLY+0.0094,T=[],B=[],TU=[],TO=[],BD=[],BO=[];
 for(let i=0;i<=NK;i++){const t=i/NK*2*Math.PI,r=R0-KD*0.5*(1-Math.cos(24*t)),dr=-KD*12*Math.sin(24*t),c=Math.cos(t),sn=Math.sin(t),tx=dr*c-r*sn,tz=dr*sn+r*c,l=Math.hypot(tx,tz),n=[tz/l,0,-tx/l];
  const P=y=>[K[0]+r*c,y,K[2]+r*sn],Q=y=>[K[0]+R0*c,y,K[2]+R0*sn];
  T.push(kb.v(P(yb),n));B.push(kb.v(P(ya),n));TU.push(kb.v(P(yb),[0,1,0]));TO.push(kb.v(Q(yb),[0,1,0]));BD.push(kb.v(P(ya),[0,-1,0]));BO.push(kb.v(Q(ya),[0,-1,0]))}
 for(let i=0;i<NK;i++){kb.quad(T[i],B[i],B[i+1],T[i+1]);kb.quad(TU[i],TO[i],TO[i+1],TU[i+1]);kb.quad(BD[i],BO[i],BO[i+1],BD[i+1])}   // 24 flutes, notches closed at both edges
 const hTop=r=>r<0.004?0.0106-0.0001*(r/0.004):0.0105-0.0003*((r-0.004)/0.002),il=new MB();
 for(let k=0;k<=8;k++){const r=0.0012+0.0035*k/8,y=PLY+hTop(r)+0.000015;il.v([K[0]-0.00028,y,K[2]-r],[0,1,0]);il.v([K[0]+0.00028,y,K[2]-r],[0,1,0])}
 for(let k=0;k<8;k++){const a=k*2;il.quad(a,a+1,a+3,a+2)}
 part(kb,MAT.nickel,{model:volM,name:'volKnob'});part(il,{id:0,base:[0.80,0.76,0.66],rough:0.45,metal:0},{model:volM,name:'volIndex'});
 const tk=new MB();for(let k=0;k<=10;k++){const a=VOL_A0+(VOL_A1-VOL_A0)*k/10,r0=0.0077,r1=k%5===0?0.0099:0.0090,rm=(r0+r1)/2;
  tk.add(rbox(0.00042,0.00006,r1-r0,0.00002,1,1),chain(M4.T(K[0]+Math.sin(a)*rm,PLY+0.00003,K[2]-Math.cos(a)*rm),M4.RY(-a)))}
 const glyph=(a,plus)=>{const cx=K[0]+Math.sin(a)*0.0091,cz=K[2]-Math.cos(a)*0.0091;tk.add(rbox(0.0016,0.00006,0.00035,0.00002,1,1),M4.T(cx,PLY+0.00003,cz));if(plus)tk.add(rbox(0.00035,0.00006,0.0016,0.00002,1,1),M4.T(cx,PLY+0.00003,cz))};
 glyph(VOL_A0-0.42,false);glyph(VOL_A1+0.42,true);
 part(tk,MAT.brassClean,{name:'volScale'})}
const KEY_Y=0.1135+0.0020,KEY_Z0=0.1182+0.0009,KEY_Z1=KEY_Z0+0.0125;
state.keyA=0;
const keyM=()=>{const u=Math.max(0,Math.min(1,state.keyA)),e=u*u*(3-2*u);return chain(M4.T(0,KEY_Y,0),M4.RZ(-e*Math.PI/2),M4.T(0,-KEY_Y,0))}; // turns clockwise, seen from the front
/* -- case lock: brass escutcheon with a cut-through keyhole, slotted screws and its key -- */
{const Z0=0.1182,ZF=Z0+0.0009,BV=0.00035,PY=0.1135,HX=0.0065,HY=0.0085,RR=0.0016,KC=0.0020,KR=0.00095,WT=0.00037,WB=0.00052,KB=KC-0.0028;
 const rrect=(hx,hy,r,k=14)=>{const P=[];[[hx-r,hy-r],[-(hx-r),hy-r],[-(hx-r),-(hy-r)],[hx-r,-(hy-r)]].forEach(([cx,cy],q)=>{for(let i=0;i<=k;i++){const a=(q+i/k)*Math.PI/2;P.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}});return P};
 const OUT=rrect(HX,HY,RR),INS=rrect(HX-BV,HY-BV,RR-BV);
 const yj=KC-Math.sqrt(KR*KR-WT*WT),a0=Math.atan2(yj-KC,WT),a1=Math.PI-a0,KEY=[];
 for(let i=0;i<=40;i++){const a=a0+(a1-a0)*i/40;KEY.push([KR*Math.cos(a),KC+KR*Math.sin(a)])}KEY.push([-WB,KB],[WB,KB]);
 const C=[0,KC-0.0003];   // every outline is star-shaped about this point, so rings can be stitched by angle
 const hit=(P,d)=>{let best=1e9;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ex=b[0]-a[0],ey=b[1]-a[1],den=d[0]*ey-d[1]*ex;if(Math.abs(den)<1e-16)continue;
   const wx=a[0]-C[0],wy=a[1]-C[1],t=(wx*ey-wy*ex)/den,u=(wx*d[1]-wy*d[0])/den;if(t>1e-10&&u>=-1e-7&&u<=1+1e-7&&t<best)best=t}return[C[0]+d[0]*best,C[1]+d[1]*best]};
 const AS=[];for(let i=0;i<240;i++)AS.push(i/240*2*Math.PI);
 for(const P of[OUT,INS,KEY])for(const q of P){let a=Math.atan2(q[1]-C[1],q[0]-C[0]);if(a<0)a+=2*Math.PI;AS.push(a)}
 AS.sort((x,y)=>x-y);const A=AS.filter((a,i)=>i===0||a-AS[i-1]>2e-5),n=A.length;
 const D=A.map(a=>[Math.cos(a),Math.sin(a)]),K=D.map(d=>hit(KEY,d)),Oi=D.map(d=>hit(INS,d)),Oo=D.map(d=>hit(OUT,d));
 const Mi=K.map((k,i)=>[k[0]+(Oi[i][0]-k[0])*0.3,k[1]+(Oi[i][1]-k[1])*0.3]);
 const rrN=q=>{const cx=Math.max(-(HX-RR),Math.min(HX-RR,q[0])),cy=Math.max(-(HY-RR),Math.min(HY-RR,q[1]));const nx=q[0]-cx,ny=q[1]-cy,l=Math.hypot(nx,ny)||1;return[nx/l,ny/l]};
 const kN=i=>{const a=K[(i+n-1)%n],b=K[(i+1)%n];let nx=b[1]-a[1],ny=a[0]-b[0];const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;if(nx*(C[0]-K[i][0])+ny*(C[1]-K[i][1])<0){nx=-nx;ny=-ny}return[nx,ny,0]};
 const M=new MB(),Hm=new MB();
 const ring=(mb,pts,z,nf,u,v)=>pts.map((q,i)=>mb.v([q[0],PY+q[1],z],nf(i),u,v));
 const strip=(mb,ra,rb)=>{for(let i=0;i<n;i++){const j=(i+1)%n;mb.quad(ra[i],rb[i],rb[j],ra[j])}};
 const up=()=>[0,0,1],bev=i=>{const q=rrN(Oo[i]);return V3.norm([q[0],q[1],1])},side=i=>{const q=rrN(Oo[i]);return[q[0],q[1],0]};
 // vUv carries the wear map: x = how sheltered (patina collects), y = how rubbed (key and fingers polish it)
 strip(M,ring(M,K,ZF,up,0,1),ring(M,Mi,ZF,up,0,0.3));strip(M,ring(M,Mi,ZF,up,0,0.3),ring(M,Oi,ZF,up,0,0));
 strip(M,ring(M,Oi,ZF,bev,0.2,0.1),ring(M,Oo,ZF-BV,bev,0.3,0));
 strip(M,ring(M,Oo,ZF-BV,side,0.6,0),ring(M,Oo,Z0-0.0002,side,0.8,0));
 strip(M,ring(M,K,ZF,kN,0.5,0.4),ring(M,K,ZF-0.00022,kN,0.95,0));
 const KZ=Z0+0.00004;strip(Hm,ring(Hm,K,ZF-0.00022,kN,0,0),ring(Hm,K,KZ,kN,0,0));
 {const c=Hm.v([C[0],PY+C[1],KZ],[0,0,1]),b=K.map(q=>Hm.v([q[0],PY+q[1],KZ],[0,0,1]));for(let i=0;i<n;i++)Hm.tri(c,b[i],b[(i+1)%n])}
 // slotted dome-head screws, slot walls and floor modelled (not painted)
 const screw=(x,y,ang)=>{const R=0.00088,HH=0.00040,E=0.00011,w=0.000105,ZB=E*0.7,I=18,cs=Math.cos(ang),sn=Math.sin(ang);
  const f=r=>{const q=Math.min(r/R,0.999);return E+(HH-E)*Math.sqrt(1-q*q)};
  const g=(X,Y)=>{const r=Math.hypot(X,Y);if(r<1e-9)return[0,0,1];const q=Math.min(r/R,0.992),df=-(HH-E)*q/(R*Math.sqrt(1-q*q));return V3.norm([-df*X/r,-df*Y/r,1])};
  const W=(X,Y,z)=>[x+X*cs-Y*sn,PY+y+X*sn+Y*cs,ZF+z],Wn=v=>[v[0]*cs-v[1]*sn,v[0]*sn+v[1]*cs,v[2]];
  const ys=[];for(let j=0;j<=10;j++)ys.push(w+(R-w)*Math.sin(j/10*Math.PI/2));const hwS=Math.sqrt(R*R-w*w);
  for(const sg of[1,-1]){const rows=ys.map(yy=>{const Y=sg*yy,hw=Math.sqrt(Math.max(0,R*R-yy*yy)),row=[];for(let i=0;i<=I;i++){const X=hw*(i/I*2-1);row.push(M.v(W(X,Y,f(Math.hypot(X,Y))),Wn(g(X,Y)),0.05,0.75))}return row});
   for(let j=0;j<rows.length-1;j++)for(let i=0;i<I;i++)M.quad(rows[j][i],rows[j+1][i],rows[j+1][i+1],rows[j][i+1]);
   const t=[],b=[];for(let i=0;i<=I;i++){const X=hwS*(i/I*2-1);t.push(M.v(W(X,sg*w,f(Math.hypot(X,w))),Wn([0,-sg,0]),0.9,0));b.push(M.v(W(X,sg*w,ZB),Wn([0,-sg,0]),1,0))}
   for(let i=0;i<I;i++)M.quad(t[i],b[i],b[i+1],t[i+1])}
  {const a=[],b=[];for(let i=0;i<=I;i++){const X=hwS*(i/I*2-1);a.push(M.v(W(X,-w,ZB),Wn([0,0,1]),1,0));b.push(M.v(W(X,w,ZB),Wn([0,0,1]),1,0))}for(let i=0;i<I;i++)M.quad(a[i],b[i],b[i+1],a[i+1])}
  const band=(p0,p1,zt)=>{const N=Math.max(2,Math.ceil((p1-p0)/0.1)),t=[],b=[];for(let k=0;k<=N;k++){const p=p0+(p1-p0)*k/N,nn=Wn([Math.cos(p),Math.sin(p),0]);t.push(M.v(W(R*Math.cos(p),R*Math.sin(p),zt),nn,0.3,0.3));b.push(M.v(W(R*Math.cos(p),R*Math.sin(p),-0.00005),nn,0.5,0))}for(let k=0;k<N;k++)M.quad(t[k],b[k],b[k+1],t[k+1])};
  const pw=Math.asin(w/R);band(pw,Math.PI-pw,E);band(Math.PI+pw,2*Math.PI-pw,E);band(-pw,pw,ZB);band(Math.PI-pw,Math.PI+pw,ZB)};
 screw(0,0.0058,0.45);screw(0,-0.0050,-0.25);
 part(M,MAT.lock,{name:'lock'});part(Hm,MAT.hole,{name:'keyhole'});
 // the key, left in the lock: bit down through the slot, so the bow stands vertical
 const Kk=new MB(),ky=PY+KC,toZ=(z)=>chain(M4.T(0,ky,z),M4.RX(Math.PI/2));
 Kk.add(lathe(cylProf(0.00040,0.0072,0.00008),20),toZ(Z0+0.0001));
 Kk.add(lathe([[0,0],[0.00052,0],[0.00066,0.00018],[0.00066,0.00052],[0.00052,0.0007],[0,0.0007]],24),toZ(ZF+0.0047));
 Kk.add(lathe(sphereProf(0.00056,10),18),toZ(ZF+0.0060));
 const bc=[0,ky,ZF+0.0063+0.0026],bp=circlePts(bc,[1,0,0],0.0026,56);
 Kk.add(sweep(bp,bp.map(()=>[0.00042,0.00068]),14,{closed:true,up:[1,0,0]}));
 for(let i=0;i<Kk.U.length;i+=2){Kk.U[i]=0.05;Kk.U[i+1]=0.8}
 part(Kk,MAT.lockKey,{model:keyM,name:'key'})}
/* -- carriage -- */
{const J=new MB();
 J.add(lathe([[0,0],[0.0080,0],[0.0094,0.0010],[0.0098,0.0030],[0.0098,0.0150],[0.0092,0.0160],[0.0092,0.0200],[0.0098,0.0210],[0.0098,0.0330],[0.0094,0.0350],[0.0080,0.0360],[0,0.0360]],40),toX(-0.018,YB,ZB));
 J.add(rbox(0.006,0.017,0.022,0.0015,3,2),M4.T(0,(YB+YF)/2+0.002,(ZB+ZF)/2+0.001));
 J.add(rbox(0.012,0.0055,0.0095,0.0015,3,2),M4.T(0,YF+0.0062,ZF));
 const ap=[];for(let i=0;i<=30;i++)ap.push(bez3([0,YB+0.004,ZB+0.004],[0,YB+0.012,ZB+0.020],[0,REPY+0.001,ZM-0.045],[0,REPY+0.0005,ZM-0.0274],i/30));
 J.add(sweep(ap,ap.map((p,i)=>{const t=i/30;return[0.0032,0.0058-0.0016*t]}),20,{up:[0,1,0],capStart:true,capEnd:true}));
 const lv=[];for(let i=0;i<=16;i++)lv.push(bez3([0.004,REPY+0.002,ZM-0.036],[0.010,REPY+0.004,ZM-0.036],[0.013,REPY+0.010,ZM-0.034],[0.014,REPY+0.014,ZM-0.031],i/16));
 const LIFTP=[0.004,REPY+0.002,ZM-0.036],liftM=()=>chain(carM(),M4.T(...LIFTP),M4.RZ(-0.55*mach.lift),M4.T(-LIFTP[0],-LIFTP[1],-LIFTP[2]));   // lift lever swings as the stylus is raised
 part(sweep(lv,lv.map(()=>0.0011),10,{capStart:true}),MAT.japan,{model:liftM,name:'liftLever'});
 J.add(rbox(0.005,0.0034,0.004,0.0008,2,2),M4.T(0,REPY-0.0089,ZM-0.0092));
 J.add(sweep(circlePts([0,REPY+0.0005,ZM],[0,1,0],0.0258,72),Array(72).fill([0.0026,0.0012]),12,{closed:true,up:[0,1,0]}));
 part(J,MAT.japan,{model:carM,name:'carriage'});
 part(lathe(sphereProf(0.0027,12),20),MAT.ebony,{model:()=>chain(liftM(),M4.T(0.014,REPY+0.014,ZM-0.031)),name:'liftKnob'});
 const Nk=new MB();
 Nk.add(lathe([[0,-0.0072],[0.0196,-0.0072],[0.0216,-0.0068],[0.0229,-0.0059],[0.0236,-0.0046],[0.0238,-0.0030],[0.0238,0.0042],[0.0235,0.0055],[0.0226,0.0064],[0.0212,0.0068],[0.0200,0.0068],[0.0200,0.0068],[0.0196,0.0062],[0.0186,0.0058],[0.0186,0.0058],[0.0100,0.0058],[0.0100,0.0058],[0.0088,0.0062],[0.0078,0.0070],[0.0072,0.0082],[0.0068,0.0096],[0.0066,0.0110],[0.0066,0.0135],[0,0.0135]],96),M4.T(0,REPY,ZM));
 for(const a of[0.6,2.7,4.8])Nk.add(lathe(cylProf(0.0011,0.0026,0.0003),12),chain(M4.T(0,REPY+0.0005,ZM),M4.RY(a),M4.T(0.0264,0,0),M4.RZ(-Math.PI/2)));
 part(Nk,MAT.nickel,{model:carM,name:'repro'});
 part(lathe([[0.0066,0],[0.0076,0],[0.0081,0.0007],[0.0082,0.0016],[0.0082,0.0086],[0.0081,0.0094],[0.0076,0.0100],[0.0066,0.0100]],40),MAT.rubber,{model:()=>chain(carM(),M4.T(0,0.2585,ZM)),name:'rubber'});}
/* -- stylus & floating weight (micro-shadow casters) -- */
{const ball=lathe(sphereProf(RB,24),40);
 const by=YM+RC+YC0;
 part(ball,MAT.sapphire,{model:()=>chain(styM(),M4.T(0,by,ZM)),micro:true,name:'ball',vis:()=>mach.mode!=='rec'});
 const tipY=by-RB;
 // recording sapphire: a rod whose end is ground into a cup; the cup's sharp rim is the cutting edge,
 // tilted so the cup faces the oncoming wax (the wax arrives from -z)
 const CT=0.55,CRIM=0.000086;
 part(lathe([[0,0.000034],[0.00004,0.000026],[0.000068,0.000012],[CRIM,0],[0.000094,0.000008],[0.000108,0.00005],[0.000116,0.00026],[0.000116,0.0019],[0,0.0019]],40),{id:0,base:[0.24,0.26,0.30],rough:0.05,metal:0},
  {model:()=>chain(styM(),M4.T(0,tipY+CRIM*Math.sin(CT),ZM),M4.RX(CT)),micro:true,name:'cutter',vis:()=>mach.mode==='rec'});
 // the shaving: a thin ribbon peeled off by the cup, riding up the face and curling into a widening coil
 const AX=V3.norm([0.32,0.42,-0.85]);
 const LP0=[0,0.000004,-0.00005],LP3=[0.000018,0.00015,-0.00015],lead=[];for(let i=0;i<=16;i++)lead.push(bez3(LP0,V3.add(LP0,[0,0.00009,-0.00002]),V3.sub(LP3,V3.mul(AX,0.00006)),LP3,i/16));
 const ribbon=n=>Array.from({length:n},(_,i)=>[0.000040*(1-0.2*i/n),0.0000065]);
 part(sweep(lead,ribbon(lead.length),8,{up:[1,0,0]}),MAT.waxPlain,{model:()=>chain(styM(),M4.T(0,tipY,ZM)),micro:true,name:'swarf0',vis:()=>mach.mode==='rec'&&mach.engaged&&mach.omega>0.02});
 const PE=lead[lead.length-1],E1=V3.norm(V3.cross([0,1,0],AX)),E2=V3.cross(AX,E1),R0=0.000010;
 const coil=[],NC=300,TURNS=7,LEN=0.00085;
 for(let i=0;i<=NC;i++){const t=i/NC,a=t*TURNS*2*Math.PI,r=R0+0.00013*Math.pow(t,1.3);coil.push([r*Math.cos(a),r*Math.sin(a),LEN*t*(1-0.2*t)])}
 const coilMesh=sweep(coil,coil.map((q,i)=>[0.000032*(1-0.3*i/NC),0.0000060]),8,{up:[0,0,1]});
 const C0=V3.sub(PE,V3.mul(E1,R0));
 part(coilMesh,MAT.waxPlain,{model:()=>chain(styM(),M4.T(0,tipY,ZM),M4.T(...C0),M4.basis(E1,E2,AX),M4.RZ(-state.chip),M4.T(0,0,0)),micro:true,name:'swarf',vis:()=>mach.mode==='rec'&&mach.engaged&&mach.omega>0.02});
 const sk=new MB();sk.add(lathe([[0,0],[0.000055,0],[0.000105,0.00028],[0.000115,0.0013],[0,0.0013]],24),chain(M4.T(0,by,ZM),M4.RX(-0.35)));
 sk.add(lathe(cylProf(0.00025,0.0034,0.00005),12),M4.T(0,0.2366,ZM-0.002));
 part(sk,MAT.steel,{model:styM,micro:true,name:'shank',vis:()=>mach.mode!=='rec'});
 part(rbox(0.0032,0.0030,0.0105,0.0005,3,2),MAT.brassClean,{model:()=>chain(styM(),M4.T(0,by+0.0011+0.0015,ZM-0.0040)),micro:true,name:'weight'});
 part(lathe(cylProf(0.0012,0.0050,0.0002),16),MAT.brassClean,{model:()=>chain(carM(),toX(-0.0025,REPY-0.0096,ZM-0.0092)),name:'hinge'});}
/* -- horn -- */
const hornPt=s=>V3.add(HORN_E,V3.mul(HORN_D,s));
const upPerp=V3.norm(V3.sub([0,1,0],V3.mul(HORN_D,HORN_D[1])));
{const pts=[],rad=[];const P1=V3.add(HORN_S0,[0,0.024,0]),P2=V3.sub(HORN_E,V3.mul(HORN_D,0.020));
 for(let i=0;i<36;i++){pts.push(bez3(HORN_S0,P1,P2,HORN_E,i/36));rad.push(0.0068)}
 const NS=240;for(let i=0;i<=NS;i++){const u=i/NS,s=HORN_L*(1-Math.pow(1-u,1.8));pts.push(hornPt(s));rad.push(hornR(s))}
 part(sweep(pts,rad,112,{up:upPerp}),MAT.horn,{model:carM,double:true,name:'horn'});
 const B=new MB();
 B.add(torus(V3.sub(hornPt(HORN_L),V3.mul(HORN_D,0.0006)),HORN_D,hornR(HORN_L)+0.0004,0.0021,160,14));
 B.add(sweep(circlePts(hornPt(S_BAL),HORN_D,hornR(S_BAL)+0.0010,80),Array(80).fill([0.0030,0.0011]),10,{closed:true,up:HORN_D}));
 const eye=V3.add(hornPt(S_BAL),V3.mul(upPerp,hornR(S_BAL)+0.0021+0.0022));
 B.add(sweep((()=>{const p=[];for(let i=0;i<40;i++){const t=i/40*Math.PI*2;p.push(V3.add(eye,V3.add(V3.mul(upPerp,Math.cos(t)*0.0022),V3.mul(HORN_D,Math.sin(t)*0.0022))))}return p})(),Array(40).fill(0.00065),8,{closed:true}));
 part(B,MAT.brass,{model:carM,name:'hornB'});}
const EYE_TOP=V3.add(hornPt(S_BAL),V3.mul(upPerp,hornR(S_BAL)+0.0021+0.0044));
/* -- crane with sliding rail (japanned) -- */
const RAIL_Y=0.430,RAIL_Z=EYE_TOP[2];
{const J=grp('japan');const pts=roundPoly([[-0.125,0.088,-0.1225],[-0.125,0.088,-0.140],[-0.125,RAIL_Y,-0.140],[-0.125,RAIL_Y,RAIL_Z],[-0.246,RAIL_Y,RAIL_Z]],0.018,14);
 J.add(sweep(pts,pts.map(()=>0.0040),20,{capStart:true,capEnd:true}));
 J.add(rbox(0.024,0.036,0.004,0.0012,2,2),M4.T(-0.125,0.088,-0.1203));
 J.add(lathe(cylProf(0.0062,0.010,0.0015),28),chain(M4.T(-0.125,0.088,-0.1222),M4.RX(-Math.PI/2)));
 J.add(lathe(cylProf(0.0058,0.012,0.0015),28),M4.T(-0.125,0.130,-0.140));
 const N=grp('nickel');
 N.add(lathe([[0,0],[0.0030,0],[0.0030,0.0008],[0.0018,0.0016],[0,0.0018]],16),chain(M4.T(-0.133,0.080,-0.1222),M4.RX(-Math.PI/2)));
 N.add(lathe([[0,0],[0.0030,0],[0.0030,0.0008],[0.0018,0.0016],[0,0.0018]],16),chain(M4.T(-0.117,0.096,-0.1222),M4.RX(-Math.PI/2)));
 grp('brass').add(lathe(sphereProf(0.0060,16),24),M4.T(-0.249,RAIL_Y,RAIL_Z));
 const R=new MB();R.add(torus([EYE_TOP[0],RAIL_Y,RAIL_Z],[1,0,0],0.0055,0.0012,28,10));
 R.add(lathe(cylProf(0.0013,0.0045,0.0003),10),M4.T(EYE_TOP[0],RAIL_Y-0.0110,RAIL_Z));
 part(R,MAT.brass,{model:carM,name:'slider'});}
const chainA=()=>[EYE_TOP[0]+state.cx,RAIL_Y-0.0112,RAIL_Z],chainB=()=>{const b=EYE_TOP.slice();b[0]+=state.cx;b[1]+=state.lift;return b};
/* chain links */
const linkMesh=(()=>{const p=[],L=0.0034,R=0.0015;for(let i=0;i<48;i++){const t=i/48;let x,y;const per=2*L+2*Math.PI*R,s=t*per;
 if(s<L){x=R;y=-L/2+s}else if(s<L+Math.PI*R){const a=(s-L)/R;x=R*Math.cos(a);y=L/2+R*Math.sin(a)}else if(s<2*L+Math.PI*R){x=-R;y=L/2-(s-L-Math.PI*R)}else{const a=Math.PI+(s-2*L-Math.PI*R)/R;x=R*Math.cos(a);y=-L/2+R*Math.sin(a)}p.push([x,y,0])}
 return upload(sweep(p,p.map(()=>0.0006),8,{closed:true}))})();
/* -- cylinder box, lid, spare cylinder -- */
const BOXP=[-0.300,0,0.135],BOXR=-0.62;
part(lathe([[0,0],[0.0340,0],[0.0348,0.0006],[0.0350,0.0016],[0.0350,0.1160],[0.0348,0.1172],[0.0343,0.1178],[0.0337,0.1178],[0.0337,0.1178],[0.0334,0.1172],[0.0334,0.0045],[0.0334,0.0045],[0,0.0045]],96),MAT.box,{model:chain(M4.T(...BOXP),M4.RY(BOXR)),name:'box'});
const LID_TABLE=[-0.215,0.0362,0.215],LID_ON=[BOXP[0],0.1178-0.0226,BOXP[2]],LID_T=1.1;
state.lidU=0;
const lidM=()=>{const u=Math.max(0,Math.min(1,state.lidU)),e=u*u*(3-2*u);   // lift off the table, stand it up, carry it over, lower it onto the rim
 const pc=bez3(LID_TABLE,V3.add(LID_TABLE,[0,0.075,0]),V3.add(LID_ON,[0,0.07,0]),LID_ON,e),r=Math.min(1,Math.max(0,(e-0.12)/0.6)),q=r*r*(3-2*r);
 return chain(M4.T(...pc),M4.RY(0.35+(BOXR-0.35)*q),M4.RZ(-Math.PI/2*(1-q)),M4.T(0,-0.012*(1-q),0))};
part(lathe([[0.0362,0],[0.0362,0.0210],[0.0359,0.0228],[0.0349,0.0238],[0.0336,0.0240],[0,0.0240],[0,0.0240],[0,0.0226],[0,0.0226],[0.0352,0.0226],[0.0352,0.0226],[0.0352,0],[0.0352,0],[0.0362,0]],96),MAT.lid,{model:lidM,name:'lid'});
/* -- flush static groups -- */
const GM={oak:MAT.oak,japan:MAT.japan,nickel:MAT.nickel,brass:MAT.brass,ebony:MAT.ebony,hole:MAT.hole};
for(const k in G){if(k==='carE'){part(G[k],MAT.ebony,{model:carM,name:k});continue}part(G[k],GM[k],{name:k})}
/* -- groove patch for the loupe -- */
const PATCH=(()=>{const mb=new MB(),NX=320,NY=480;for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++)mb.v([i/NX*2-1,j/NY*2-1,0],[0,0,1],i/NX,j/NY);
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i;mb.I.push(a,a+1,a+NX+2,a,a+NX+2,a+NX+1)}return upload(mb)})();

export { BOXP, CRK, KEY_Y, KEY_Z0, KEY_Z1, LID_ON, LID_T, LID_TABLE, MAT, PATCH, VOLK, chainA, chainB, crankM, hornPt, keyM, levM, lidM, linkMesh, parts };
