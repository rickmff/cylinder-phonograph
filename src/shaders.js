// GLSL: the PBR material model (GGX, clear-coat wax), the groove displacement, shadows,
// image-based lighting, SSAO, bloom and AgX tone mapping.

import { D0, DA, GW, PITCH, XREC } from './constants.js';

const COMMON=`
#define PI 3.14159265359
float hash13(vec3 p3){p3=fract(p3*0.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vnoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x),mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float s=0.,a=0.5;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+vec3(3.1,1.7,4.3);a*=0.5;}return s/0.9375;}
float IGN(vec2 p){return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715))));}
`;
const GROOVE=`
const float PITCH=${PITCH},GW=${GW},D0=${D0},DA=${DA},XREC=${XREC};
uniform highp sampler2D uGroove;uniform highp sampler2D uLoud;uniform float uSPR,uNREV,uBlur,uCylOff;
float gTap(float c,float row){if(c>=uSPR){c-=uSPR;row+=1.;}else if(c<0.){c+=uSPR;row-=1.;}row=clamp(row,0.,uNREV+1.);return texelFetch(uGroove,ivec2(int(c),int(row)),0).r;}
float depthAt(float row,float tf){float cf=tf*uSPR;float c0=floor(cf);float f=cf-c0;
 float a=gTap(c0-1.,row),b=gTap(c0,row),c=gTap(c0+1.,row),d=gTap(c0+2.,row);
 float f2=f*f,f3=f2*f;   // Catmull-Rom: smooth hills & dales, no flat facets at extreme zoom
 return (b+0.5*f*(c-a)+f2*(a-2.5*b+2.*c-0.5*d)+f3*(1.5*(b-c)+0.5*(d-a)))*1e-6;}
float gH(float xa,float th){
 if(xa<0.||xa>XREC)return 0.;
 float rv=th*0.15915494;float u=xa/PITCH+rv;float n=floor(u+0.5);float q=abs(u-n)/(GW*0.5);if(q>=1.)return 0.;
 float fr=-rv;float fl=floor(fr);float row=n+fl;if(row<0.||row>=uNREV)return 0.;
 float d=depthAt(row,fr-fl);if(uBlur>0.001)d=mix(d,texelFetch(uLoud,ivec2(int(row),0),0).g*1e-6,uBlur);
 return -d*(1.-q*q);}
`;
const BG=`
vec3 bgCol(vec3 d){float y=d.y;vec3 c=mix(vec3(0.0026,0.0022,0.0019),vec3(0.0105,0.0089,0.0075),smoothstep(-0.3,0.5,y));
 c+=vec3(0.006,0.004,0.0025)*smoothstep(0.75,0.98,dot(d,normalize(vec3(-0.35,0.12,-1.))));return c;}
`;
const VS_MAIN=`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec2 aUv;
uniform mat4 uModel,uVP;uniform mat3 uNMat;
out vec3 vW,vN,vL;out vec2 vUv;
void main(){vec4 w=uModel*vec4(aPos,1.);vW=w.xyz;vN=uNMat*aNor;vL=aPos;vUv=aUv;gl_Position=uVP*w;}`;
const VS_PATCH=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec2 aUv;
uniform mat4 uVP;uniform vec4 uCyl;uniform float uRot;uniform vec4 uPatchG;
out vec3 vW,vN,vL;out vec2 vUv;
${GROOVE}
void main(){float sx=sign(aPos.x)*pow(abs(aPos.x),1.3),sy=sign(aPos.y)*pow(abs(aPos.y),1.3);
 float xw=uPatchG.x+sx*uPatchG.y,ph=uPatchG.w+sy*uPatchG.z;
 float fade=(1.-smoothstep(0.86,0.995,abs(aPos.x)))*(1.-smoothstep(0.86,0.995,abs(aPos.y)));
 float r=uCyl.z+gH(xw-uCyl.w-uCylOff,ph-uRot)*fade;
 vec3 W=vec3(xw,uCyl.x+r*cos(ph),uCyl.y+r*sin(ph));
 vW=W;vN=vec3(0.,cos(ph),sin(ph));vL=vec3(fade,0.,0.);vUv=aUv;gl_Position=uVP*vec4(W,1.);}`;
const VS_SHADOW=`#version 300 es
layout(location=0) in vec3 aPos;uniform mat4 uModel,uVP;void main(){gl_Position=uVP*(uModel*vec4(aPos,1.));}`;
const FS_SHADOW=`#version 300 es
precision mediump float;void main(){}`;
const FS_PRE=`#version 300 es
precision highp float;
in vec3 vW,vN,vL;in vec2 vUv;uniform mat4 uView;uniform bool uDouble;out vec4 o;
void main(){vec3 n=normalize(vN);if(uDouble&&!gl_FrontFacing)n=-n;o=vec4(normalize(mat3(uView)*n),-(uView*vec4(vW,1.)).z);}`;
const VS_FS=`#version 300 es
out vec2 vUv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const FS_MAIN=`#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vW,vN,vL;in vec2 vUv;
layout(location=0) out vec4 oCol;
uniform vec3 uCam;uniform mat4 uView;
uniform int uMat;uniform vec3 uBase;uniform float uRough,uMetal;uniform vec4 uP;uniform bool uDouble;
uniform samplerCube uSpec,uIrr;uniform float uSpecMax;
uniform sampler2D uShRaw;uniform sampler2DShadow uShCmp;uniform mat4 uLVP;uniform vec4 uShInfo;uniform float uShTexel;
uniform vec3 uLdir,uLcol,uKdir;uniform float uKeyVis;uniform vec2 uSpotC;uniform bool uLupaOcc;
uniform sampler2D uAO;uniform bool uUseAO;uniform vec2 uAOres,uVPsize;
uniform vec4 uCyl;uniform float uRot;uniform vec4 uPatch;uniform float uBelt;
uniform sampler2D uLabel;uniform float uPatchPhi,uSpeedStreak;uniform vec4 uWax;uniform bool uCylFly;
uniform vec3 uL2dir,uL2col;uniform mat4 uLVP2;uniform vec4 uSh2Info;uniform highp sampler2DShadow uSh2Cmp;
${COMMON}
${GROOVE}
${BG}
struct Surf{vec3 alb;float rough;float metal;vec3 N;float coat;float coatR;vec3 coatN;float aniso;vec3 T;float wrap;float occ;float f0;};
float sdRR(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 bumpN(vec3 N,vec3 P,float h,float k){vec3 dpx=dFdx(P),dpy=dFdy(P);float dhx=dFdx(h),dhy=dFdy(h);vec3 r1=cross(dpy,N),r2=cross(N,dpx);float det=dot(dpx,r1);
 vec3 g=sign(det)*(dhx*r1+dhy*r2);vec3 n=abs(det)*N-k*g;float l=length(n);return l>1e-20?n/l:N;}
float aaF(float freq,float fw){return clamp(1.-fw*freq*0.9,0.,1.);}

void matOak(inout Surf s,vec3 N){
 vec2 g;float w;
 if(uP.x<0.5){g=vec2(vUv.x,vL.y);w=vUv.y;}else{g=vec2(vL.x,vL.z);w=vL.y;}
 float fw=max(fwidth(g.y),1e-7);
 float ph=g.y*150.+fbm(vec3(g.x*0.9,g.y*7.,w*3.+1.))*7.+fbm(vec3(g.x*5.,g.y*40.,w*9.))*1.1;
 float li=floor(ph),lines=fract(ph);float lstr=0.35+0.65*hash13(vec3(li,7.,1.));
 float la=aaF(150.,fw);
 float late=smoothstep(0.70,0.97,lines)*lstr*la+(1.-la)*0.12;
 float pores=smoothstep(0.70,0.92,vnoise(vec3(g.x*260.,g.y*2600.,w*40.)))*aaF(2600.,fw);
 float fl=fbm(vec3(g.x*24.+g.y*9.,g.y*120.,w*3.+7.));
 float fleck=smoothstep(0.58,0.72,fl)*smoothstep(0.3,0.7,vnoise(vec3(g.x*5.,g.y*28.,3.)));
 float tone=fbm(vec3(g.x*0.7,g.y*2.2,w+5.));
 vec3 c=mix(vec3(0.255,0.098,0.026),vec3(0.105,0.034,0.009),late*0.55);
 c*=1.-pores*0.38;
 c=mix(c,vec3(0.36,0.165,0.052),fleck*0.75);
 c*=0.78+0.42*tone;
 s.alb=c;s.rough=mix(0.62,0.40,fleck);s.metal=0.;
 s.N=bumpN(N,vW,(pores*0.6+late*0.15)*0.00004,1.);
 float op=fbm(vW*420.);s.coat=1.;s.coatR=0.07+0.045*op;s.coatN=bumpN(N,vW,op*0.00003,1.);
}
void matJapan(inout Surf s,vec3 N){
 s.alb=vec3(0.011,0.010,0.009);s.rough=0.45;s.metal=0.;
 float op=fbm(vW*520.+3.);s.coat=1.;s.coatR=0.035+0.02*op;s.coatN=bumpN(N,vW,op*0.000008,1.);
 float wear=smoothstep(0.70,0.88,fbm(vW*70.+11.));s.coatR+=wear*0.06;
 if(uP.x>0.5&&uP.x<1.5){
  float top=smoothstep(0.6,0.9,N.y);vec2 p=vL.xz;vec2 hb=uP.yz;
  float d=sdRR(p,hb-vec2(0.0088),0.010);float fwd=fwidth(d)*0.75;
  float l1=1.-smoothstep(0.00045-fwd,0.00045+fwd,abs(d));
  float l2=1.-smoothstep(0.00019-fwd,0.00019+fwd,abs(d+0.0042));
  vec2 q=abs(p)-(hb-vec2(0.0255));float cd=abs(length(q)-0.0052);float l3=1.-smoothstep(0.00018-fwd,0.00018+fwd,cd);
  float cd2=abs(length(q)-0.0022);l3=max(l3,1.-smoothstep(0.00014-fwd,0.00014+fwd,cd2));
  float gold=max(max(l1,l2),l3)*top;
  gold*=smoothstep(0.18,0.45,vnoise(vW*1500.)+0.22);
  s.alb=mix(s.alb,vec3(0.98,0.72,0.33),gold);s.metal=gold;s.rough=mix(s.rough,0.30,gold);
 }else if(uP.x>0.5){
  vec3 q=vL,hb=uP.yzw;float side=smoothstep(0.75,0.9,abs(N.x));
  float d=sdRR(q.yz,hb.yz-vec2(0.0042),0.0035);float fwd=fwidth(d)*0.75;
  float gold=(1.-smoothstep(0.00028-fwd,0.00028+fwd,abs(d)))*side*smoothstep(0.18,0.45,vnoise(vW*1500.)+0.22);
  s.alb=mix(s.alb,vec3(0.98,0.72,0.33),gold);s.metal=gold;s.rough=mix(s.rough,0.30,gold);
 }
}
void matWax(inout Surf s,vec3 N){
 vec2 rel=vec2(vW.y-uCyl.x,vW.z-uCyl.y);float rr=length(rel);vec3 Nr=vec3(0.,rel/max(rr,1e-6));
 float phi=atan(rel.y,rel.x);float th=phi-uRot;float xa=vW.x-uCyl.w-uCylOff;
 float fw=fwidth(vW.x)/PITCH;
 float mott=fbm(vW*90.);
 s.alb=uWax.rgb*(0.84+0.32*mott);s.rough=uWax.a+0.05*mott;s.metal=0.;s.wrap=0.45;s.f0=0.05;
 if(uP.z>0.5||uCylFly)return;
 if(uPatch.w>0.5&&uP.x<0.5){float dp=phi-uPatchPhi;dp-=6.2831853*floor((dp+3.14159265)/6.2831853);if(abs(vW.x-uPatch.x)<uPatch.y&&abs(dp)<uPatch.z)discard;}
 bool outer=dot(N,Nr)>0.85&&rr>uCyl.z-0.0012&&xa>0.&&xa<XREC;
 if(outer){
  bool pt=uP.x>0.5;float fd=1.;
  float k=pt?1.:1.-smoothstep(0.16,0.38,fw);
  if(k>0.001){float h0=gH(xa,th);float ex=PITCH*0.02;float hx=gH(xa+ex,th);float et=0.00012;float ht=gH(xa,th+et);
   vec3 S=vec3(0.,-sin(phi),cos(phi));
   vec3 Ng=normalize(Nr-fd*((hx-h0)/ex)*vec3(1.,0.,0.)-fd*((ht-h0)/(et*rr))*S);
   s.N=normalize(mix(N,Ng,k));
   float gd=clamp(-h0/(D0+DA),0.,1.)*fd;s.alb*=1.-0.22*gd*k;s.rough=mix(s.rough,max(uWax.a-0.04,0.05),k*gd);
   if(pt&&uSpeedStreak>0.01){float st=vnoise(vec3(xa*7000.,th*24.+uRot*37.,3.));s.alb*=1.+0.3*uSpeedStreak*(st-0.5)*gd;}}
  float nn=floor(xa/PITCH+th*0.15915494+0.5);vec2 LD=texelFetch(uLoud,ivec2(int(clamp(nn,0.,uNREV-1.)),0),0).rg;
  float cut=smoothstep(3.,14.,LD.g);float loud=clamp(LD.r/13.,0.,1.)*cut;
  s.rough+=(0.05*cut+0.17*loud)*(1.-k);s.alb*=mix(1.,0.9+0.12*loud,(1.-k)*cut);
  s.aniso=0.5*(1.-k)*cut;s.T=vec3(1.,0.,0.);
 }
}
void matTable(inout Surf s,vec3 N){
 vec2 g=vW.xz;float fw=fwidth(g.y)+1e-6;
 const float PW=0.165;float pz=(g.y+0.031)/PW;float pid=floor(pz);float pf=fract(pz);
 float h1=hash13(vec3(pid,3.,9.)),h2=hash13(vec3(pid,5.,1.));
 vec2 q=vec2(g.x+h1*7.,(pf-0.5)*PW);
 float dist=length(vec2(q.y*1.+0.02*sin(q.x*3.1+h2*6.),0.05+0.10*h2+0.035*fbm(vec3(q.x*0.6,h1*9.,1.))));
 float ph=dist*70.+fbm(vec3(q.x*3.,q.y*24.,h2*5.))*2.2+fbm(vec3(q.x*0.5,q.y*3.,h1*3.))*4.;
 float rings=fract(ph);float la=aaF(70.,fw*1.4);
 float r2=smoothstep(0.62,0.96,rings)*la+(1.-la)*0.18;
 float pores=smoothstep(0.72,0.95,vnoise(vec3(q.x*170.,q.y*1900.,h1*20.)))*aaF(1900.,fw);
 vec3 c=mix(vec3(0.068,0.036,0.020),vec3(0.036,0.018,0.010),r2*0.6);
 c*=(0.82+0.36*h2)*(0.8+0.4*fbm(vec3(q*2.,4.+h1)));c*=1.-pores*0.3;
 float seam=1.-smoothstep(0.0,0.0035,min(pf,1.-pf)*PW);c*=1.-0.85*seam;
 s.alb=c;s.rough=0.5+0.2*seam;s.metal=0.;s.coat=0.35*(1.-seam);float op=fbm(vec3(g*250.,1.));s.coatR=0.22+0.06*op;s.coatN=bumpN(N,vW,op*0.00002+pores*0.00001-seam*0.0004,1.);
}
void matBrass(inout Surf s,vec3 N,float tarn){
 float t=fbm(vW*38.+uP.z);float t2=fbm(vW*160.+5.);float tar=smoothstep(0.45,0.85,t)*tarn;
 s.alb=mix(vec3(0.95,0.73,0.38),vec3(0.60,0.42,0.19),tar)*(0.93+0.1*t2);s.metal=1.;s.rough=mix(0.15,0.36,tar)+0.05*t2;
}
void matNickel(inout Surf s){float t=fbm(vW*70.+uP.z);s.alb=vec3(0.80,0.76,0.68)*(0.94+0.08*t);s.metal=1.;s.rough=0.11+0.09*smoothstep(0.5,0.9,t);}

float shadowPCSS(vec3 P,vec3 N){
 float NoL=clamp(dot(N,uLdir),0.,1.);
 vec3 Po=P+N*uShInfo.w*(1.2+2.5*(1.-NoL));
 vec3 sc=(uLVP*vec4(Po,1.)).xyz*0.5+0.5;
 if(sc.x<0.002||sc.y<0.002||sc.x>0.998||sc.y>0.998||sc.z>=1.)return 1.;
 float zr=sc.z-0.8*uShInfo.w/uShInfo.x;
 float a0=IGN(gl_FragCoord.xy)*6.2831853;
 float k=uShInfo.x*uShInfo.z/uShInfo.y;
 float sr=clamp(zr*k,3.*uShTexel,0.035);
 float bs=0.,bc=0.;
 for(int i=0;i<12;i++){float t=(float(i)+0.5)/12.;float an=a0+float(i)*2.3999632;vec2 o=vec2(cos(an),sin(an))*sqrt(t)*sr;float d=texture(uShRaw,sc.xy+o).r;if(d<zr){bs+=d;bc+=1.;}}
 if(bc<0.5)return 1.;
 float pen=clamp((zr-bs/bc)*k,1.5*uShTexel,0.035);
 float sum=0.;
 for(int i=0;i<24;i++){float t=(float(i)+0.5)/24.;float an=a0*1.37+float(i)*2.3999632;vec2 o=vec2(cos(an),sin(an))*sqrt(t)*pen;sum+=texture(uShCmp,vec3(sc.xy+o,zr));}
 return sum/24.;
}
float shadow2(vec3 P,vec3 N){vec3 Po=P+N*uSh2Info.w*1.5;vec3 sc=(uLVP2*vec4(Po,1.)).xyz*0.5+0.5;
 if(sc.x<0.01||sc.y<0.01||sc.x>0.99||sc.y>0.99||sc.z>=1.)return 1.;float zr=sc.z-uSh2Info.w/uSh2Info.x;
 float a0=IGN(gl_FragCoord.xy)*6.2831853,rad=2.2/1024.,sum=0.;
 for(int i=0;i<12;i++){float t=(float(i)+0.5)/12.;float an=a0+float(i)*2.3999632;sum+=texture(uSh2Cmp,vec3(sc.xy+vec2(cos(an),sin(an))*sqrt(t)*rad,zr));}
 return sum/12.;}
float spotF(vec3 P){vec2 d=(P.xz-uSpotC)*vec2(0.9,1.15);return 1.-smoothstep(0.38,1.0,length(d));}
float aoSample(){
 if(!uUseAO)return 1.;
 vec2 p=gl_FragCoord.xy*(uAOres/uVPsize)-0.5;ivec2 i0=ivec2(floor(p));vec2 f=fract(p);
 float dz=-(uView*vec4(vW,1.)).z;float sum=0.,ws=0.;
 for(int j=0;j<2;j++)for(int i=0;i<2;i++){ivec2 q=clamp(i0+ivec2(i,j),ivec2(0),ivec2(uAOres)-1);vec2 a=texelFetch(uAO,q,0).rg;
  float bw=(i==0?1.-f.x:f.x)*(j==0?1.-f.y:f.y);float w=bw*exp(-abs(a.y-dz)/(0.012*dz+1e-4))+1e-5;sum+=a.x*w;ws+=w;}
 return sum/ws;
}
vec2 envBRDF(float r,float NoV){const vec4 c0=vec4(-1.,-0.0275,-0.572,0.022);const vec4 c1=vec4(1.,0.0425,1.04,-0.04);vec4 q=r*c0+c1;
 float a004=min(q.x*q.x,exp2(-9.28*NoV))*q.x+q.y;return vec2(-1.04,1.04)*a004+q.zw;}
float overhead(vec3 R){return uLupaOcc?mix(1.,0.12,smoothstep(0.15,0.7,R.y)):1.;}

vec3 shade(Surf s,vec3 V,vec3 Ng){
 vec3 N=s.N;float NoV=max(dot(N,V),1e-4);
 float sh=shadowPCSS(vW,Ng);float vis=sh*spotF(vW);
 float kv=uKeyVis<0.?vis:uKeyVis;
 vec3 dif=s.alb*(1.-s.metal);vec3 F0=mix(vec3(s.f0),s.alb,s.metal);
 float NoL=dot(N,uLdir);float wl=clamp((NoL+s.wrap)/((1.+s.wrap)*(1.+s.wrap)),0.,1.);
 vec2 ab=envBRDF(s.rough,NoV);vec3 Fss=F0*ab.x+ab.y;
 vec3 col=dif*wl*uLcol*vis/PI;
 if(uL2col.r>0.){float NoL2=dot(N,uL2dir);if(NoL2>0.){float s2=shadow2(vW,Ng);vec3 H=normalize(uL2dir+V);float NoH=max(dot(N,H),0.);float a=max(s.rough*s.rough,0.02),a2=a*a,dd=NoH*NoH*(a2-1.)+1.,D=a2/(PI*dd*dd),k2=a*0.5;
  float Gv=NoV/(NoV*(1.-k2)+k2),Gl=NoL2/(NoL2*(1.-k2)+k2);vec3 F=F0+(1.-F0)*pow(1.-max(dot(H,V),0.),5.);
  col+=(dif*(1.-F)/PI+D*Gv*Gl*F/(4.*NoV*NoL2+1e-4))*uL2col*NoL2*s2;}}
 vec3 Nb=N;if(s.aniso>0.){vec3 at=cross(s.T,V);vec3 an=cross(at,s.T);Nb=normalize(mix(N,an,s.aniso));}
 vec3 R=reflect(-V,Nb);float hor=clamp(1.+dot(R,Ng),0.,1.);hor*=hor;
 vec3 pre=textureLod(uSpec,R,s.rough*uSpecMax).rgb*hor*overhead(R);
 float km=smoothstep(0.80-s.rough*0.5,0.97-s.rough*0.35,dot(R,uKdir));pre*=mix(1.,kv,km);
 vec3 spec=pre*Fss*(1.+F0*(1./max(ab.x+ab.y,1e-3)-1.));
 vec3 irr=texture(uIrr,N).rgb*(uLupaOcc?0.7:1.);
 float ao=s.occ*aoSample();
 float so=clamp(pow(NoV+ao,exp2(-16.*s.rough-1.))-1.+ao,0.,1.);
 col+=dif*irr*ao+spec*so;
 if(s.coat>0.){vec3 Nc=s.coatN;float NoVc=max(dot(Nc,V),1e-4);vec3 Rc=reflect(-V,Nc);float hc=clamp(1.+dot(Rc,Ng),0.,1.);
  float Fc=(0.04+0.96*pow(1.-NoVc,5.))*s.coat;vec3 pc=textureLod(uSpec,Rc,s.coatR*uSpecMax).rgb*hc*hc*overhead(Rc);
  float kc=smoothstep(0.80-s.coatR*0.5,0.97-s.coatR*0.35,dot(Rc,uKdir));pc*=mix(1.,kv,kc);
  col=col*(1.-Fc)+pc*Fc*so;}
 return col;
}
void main(){
 vec3 N=normalize(vN);if(uDouble&&!gl_FrontFacing)N=-N;
 vec3 V=normalize(uCam-vW);
 Surf s;s.alb=uBase;s.rough=uRough;s.metal=uMetal;s.N=N;s.coat=0.;s.coatR=0.1;s.coatN=N;s.aniso=0.;s.T=vec3(1,0,0);s.wrap=0.;s.occ=1.;s.f0=0.04;
 if(uMat==1)matOak(s,N);
 else if(uMat==2)matJapan(s,N);
 else if(uMat==3)matWax(s,N);
 else if(uMat==4)matTable(s,N);
 else if(uMat==5)matBrass(s,N,uP.w);
 else if(uMat==6){matBrass(s,N,0.85);s.N=bumpN(N,vW,fbm(vW*45.)*0.00022+fbm(vW*190.)*0.00002,1.);
  float su=abs(fract(vUv.x-0.75+0.5)-0.5);float seam=1.-smoothstep(0.0012,0.003,su);s.alb*=1.-0.35*seam;s.rough+=0.15*seam;
  if(!gl_FrontFacing){s.occ*=mix(0.30,1.,smoothstep(0.06,0.42,vUv.y));s.rough+=0.06;}
  float rim=smoothstep(0.405,0.41,vUv.y);s.rough=mix(s.rough,0.2,rim);}
 else if(uMat==7){vec2 rel=vec2(vW.y-uP.x,vW.z-uP.y);float phi=atan(rel.y,rel.x);float fw=fwidth(vW.x)/uP.z;
  float ph=vW.x/uP.z+(phi-uRot)*0.15915494;float o=fract(ph)-0.5;float k=1.-smoothstep(0.14,0.32,fw);
  s.N=normalize(N+k*sign(o)*0.9*vec3(1.,0.,0.));s.alb=vec3(0.56,0.56,0.57);s.metal=1.;s.rough=0.26+0.16*(1.-k);}
 else if(uMat==8){float m=fract(vUv.y*24.+uBelt*24.);s.alb=vec3(0.15,0.072,0.034)*(0.88+0.2*vnoise(vec3(vUv.y*600.+uBelt*600.,vUv.x*12.,0.)))*(1.-0.35*smoothstep(0.93,0.97,m)*smoothstep(1.,0.97,m));s.rough=0.55;}
 else if(uMat==9)matNickel(s);
 else if(uMat==10){s.alb=vec3(0.016,0.012,0.010);s.rough=0.4;s.coat=1.;s.coatR=0.07;}
 else if(uMat==11){s.alb=vec3(0.018,0.016,0.014);s.rough=0.62;}
 else if(uMat==13){s.alb=vec3(0.02,0.035,0.11);s.rough=0.04;s.f0=0.077;}
 else if(uMat==14){
  vec2 rel=vL.xz;float rr=length(rel);vec3 Nl=normalize(vN);
  float fib=fbm(vW*300.);vec3 card=vec3(0.15,0.062,0.022)*(0.82+0.32*fib)*(0.85+0.3*fbm(vW*24.));
  s.alb=card;s.rough=0.78;
  bool outerS=rr>0.0345&&abs(N.y)<0.5;
  bool inner=rr<0.0336&&vL.y>0.004;
  if((inner||(vL.y<0.0046&&vL.y>0.0044&&N.y>0.5))&&uP.y<0.5){s.alb=vec3(0.62,0.58,0.50)*(0.85+0.3*fbm(vW*900.));s.rough=1.;s.wrap=0.5;s.occ=mix(0.35,1.,smoothstep(0.02,0.11,vL.y));}
  if(outerS&&uP.w>0.){float vt=(vL.y-uP.x)/uP.y;float u=vUv.x;
   if(vt>0.&&vt<1.&&u>0.&&u<uP.w){vec3 lab=texture(uLabel,vec2(1.-u/uP.w,1.-vt)).rgb;lab=pow(lab,vec3(2.2));s.alb=lab;s.rough=0.62;}}
 }
 else if(uMat==15){s.alb=vec3(0.002,0.0018,0.0016);s.rough=0.9;}
 else if(uMat==16){   // lock brass: patina settles in the recesses, rubbed bright where the key and fingers wear it
  float t=fbm(vW*620.+uP.z),t2=fbm(vW*2900.+uP.z*1.7),t3=fbm(vW*140.+uP.z);
  float tar=clamp(smoothstep(0.42,0.86,0.7*t+0.3*t3)*uP.w+vUv.x*0.85-vUv.y*0.5,0.,1.);
  s.alb=mix(vec3(0.97,0.74,0.38),vec3(0.30,0.19,0.07),tar)*(0.92+0.12*t2);
  s.metal=1.;s.rough=mix(0.13,0.48,tar)+0.06*t2;
  s.N=bumpN(N,vW,(t2-0.5)*0.0000025+t*0.000003,1.);}
 vec3 col=shade(s,V,N);
 if(uMat==4){float f=smoothstep(0.5,1.75,length(vW.xz-uSpotC));col=mix(col,bgCol(-V),f);}
 oCol=vec4(col,1.);
}`;
const FACEDIR=`vec3 faceDir(int f,vec2 uv){
 if(f==0)return normalize(vec3(1.,-uv.y,-uv.x));if(f==1)return normalize(vec3(-1.,-uv.y,uv.x));
 if(f==2)return normalize(vec3(uv.x,1.,uv.y));if(f==3)return normalize(vec3(uv.x,-1.,-uv.y));
 if(f==4)return normalize(vec3(uv.x,-uv.y,1.));return normalize(vec3(-uv.x,-uv.y,-1.));}
vec2 ham(uint i,uint N){uint b=i;b=(b<<16u)|(b>>16u);b=((b&0x55555555u)<<1u)|((b&0xAAAAAAAAu)>>1u);b=((b&0x33333333u)<<2u)|((b&0xCCCCCCCCu)>>2u);
 b=((b&0x0F0F0F0Fu)<<4u)|((b&0xF0F0F0F0u)>>4u);b=((b&0x00FF00FFu)<<8u)|((b&0xFF00FF00u)>>8u);return vec2(float(i)/float(N),float(b)*2.3283064365386963e-10);}`;
const FS_ENV=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform int uFace;uniform float uKey;uniform vec3 uKdir,uKeyRad;
#define PI 3.14159265359
${FACEDIR}
float rectL(vec3 d,vec3 c,vec3 up,vec2 hs,float soft){float k=dot(d,c);if(k<=0.)return 0.;vec3 p=d/k;vec3 rt=normalize(cross(up,c));vec3 u2=cross(c,rt);
 vec2 q=vec2(dot(p,rt),dot(p,u2));vec2 e=abs(q)-hs;float sd=length(max(e,0.))+min(max(e.x,e.y),0.);return 1.-smoothstep(-soft,soft,sd);}
vec3 studio(vec3 d){float y=d.y;
 vec3 c=vec3(0.010,0.009,0.008)+vec3(0.020,0.018,0.016)*smoothstep(-0.1,0.9,y);
 c=mix(c,vec3(0.026,0.016,0.009),smoothstep(0.02,-0.15,y));
 c+=vec3(0.08,0.05,0.026)*smoothstep(-0.04,-0.32,y)*smoothstep(-1.0,-0.45,y);
 c+=vec3(1.5,1.42,1.3)*rectL(d,normalize(vec3(-0.15,1.,0.1)),vec3(0,0,-1),vec2(0.34,0.20),0.03);
 c+=vec3(3.4,3.75,4.3)*rectL(d,normalize(vec3(0.85,0.22,-0.62)),vec3(0,1,0),vec2(0.085,0.55),0.02);
 c+=vec3(2.0,1.55,1.1)*rectL(d,normalize(vec3(-1.,0.16,-0.18)),vec3(0,1,0),vec2(0.07,0.45),0.02);
 c+=vec3(0.30,0.29,0.27)*rectL(d,normalize(vec3(0.3,0.15,1.)),vec3(0,1,0),vec2(0.75,0.35),0.25);
 c+=uKey*uKeyRad*rectL(d,uKdir,vec3(0,1,0),vec2(0.21,0.15),0.012);
 return c;}
void main(){o=vec4(studio(faceDir(uFace,vUv*2.-1.)),1.);}`;
const FS_PREF=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform samplerCube uEnv;uniform int uFace;uniform float uRough,uSrc;
#define PI 3.14159265359
${FACEDIR}
void main(){vec3 N=faceDir(uFace,vUv*2.-1.);
 if(uRough<0.01){o=vec4(textureLod(uEnv,N,0.).rgb,1.);return;}
 float a=uRough*uRough;vec3 up=abs(N.y)<0.999?vec3(0,1,0):vec3(1,0,0);vec3 T=normalize(cross(up,N));vec3 B=cross(N,T);
 vec3 acc=vec3(0);float w=0.;const uint SC=256u;
 for(uint i=0u;i<SC;i++){vec2 X=ham(i,SC);float ph=2.*PI*X.x;float ct=sqrt((1.-X.y)/(1.+(a*a-1.)*X.y));float st=sqrt(1.-ct*ct);
  vec3 H=normalize(T*st*cos(ph)+B*st*sin(ph)+N*ct);vec3 L=normalize(2.*dot(N,H)*H-N);float NoL=dot(N,L);
  if(NoL>0.){float d=ct*ct*(a*a-1.)+1.;float D=a*a/(PI*d*d);float pdf=D*0.25;float saS=1./(float(SC)*pdf+1e-5);float saT=4.*PI/(6.*uSrc*uSrc);
   float mip=max(0.5*log2(saS/saT)+1.,0.);acc+=textureLod(uEnv,L,mip).rgb*NoL;w+=NoL;}}
 o=vec4(acc/max(w,1e-4),1.);}`;
const FS_IRR=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform samplerCube uEnv;uniform int uFace;
#define PI 3.14159265359
${FACEDIR}
void main(){vec3 N=faceDir(uFace,vUv*2.-1.);vec3 up=abs(N.y)<0.999?vec3(0,1,0):vec3(1,0,0);vec3 T=normalize(cross(up,N));vec3 B=cross(N,T);
 vec3 acc=vec3(0);const uint SC=1024u;
 for(uint i=0u;i<SC;i++){vec2 X=ham(i,SC);float ph=2.*PI*X.x;float r=sqrt(X.y);vec3 L=T*r*cos(ph)+B*r*sin(ph)+N*sqrt(1.-X.y);acc+=textureLod(uEnv,L,4.).rgb;}
 o=vec4(acc/float(SC),1.);}`;
const FS_BG=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform mat4 uInvVP;uniform vec3 uCam;
${BG}
void main(){vec4 p=uInvVP*vec4(vUv*2.-1.,1.,1.);vec3 d=normalize(p.xyz/p.w-uCam);o=vec4(bgCol(d),1.);}`;
const FS_SSAO=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform sampler2D uND;uniform vec2 uRes,uTan;uniform float uRad,uInt;
float IGN(vec2 p){return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715))));}
vec3 vpos(vec2 uv,float d){return vec3((uv*2.-1.)*uTan*d,-d);}
void main(){vec4 c=texture(uND,vUv);float d=c.a;if(d<=0.){o=vec4(1.,0.,0.,1.);return;}
 vec3 P=vpos(vUv,d);vec3 N=normalize(c.xyz);float r=uRad,r2=r*r;
 float rpx=clamp(r/(d*uTan.y)*0.5*uRes.y,2.,110.);float a0=IGN(gl_FragCoord.xy)*6.2831853;float sum=0.;const int NS=16;
 for(int i=0;i<NS;i++){float t=(float(i)+0.5)/float(NS);float an=a0+float(i)*2.3999632;vec2 uv=vUv+vec2(cos(an),sin(an))*t*rpx/uRes;
  if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)continue;vec4 sN=texture(uND,uv);if(sN.a<=0.)continue;
  vec3 v=vpos(uv,sN.a)-P;float vv=dot(v,v);float vn=dot(v,N);float f=max(r2-vv,0.);sum+=f*f*f*max((vn-0.01*r)/(0.02*r2+vv),0.);}
 float A=max(0.,1.-sum*(r/(r2*r2*r2))*(5./float(NS))*uInt);o=vec4(pow(A,1.25),d,0.,1.);}`;
const FS_BLUR=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform sampler2D uSrc;uniform vec2 uDir;
void main(){vec2 c=texture(uSrc,vUv).rg;if(c.y<=0.){o=vec4(1.,0.,0.,1.);return;}float s=c.x,w=1.;
 for(int i=-5;i<=5;i++){if(i==0)continue;vec2 t=texture(uSrc,vUv+uDir*float(i)).rg;float g=exp(-float(i*i)/12.);float dw=t.y>0.?exp(-abs(t.y-c.y)/(0.012*c.y)):0.;s+=t.x*g*dw;w+=g*dw;}
 o=vec4(s/w,c.y,0.,1.);}`;
const FS_DOWN=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform sampler2D uSrc;uniform vec2 uTexel;uniform bool uKaris;
vec3 S(vec2 d){return texture(uSrc,vUv+d*uTexel).rgb;}
float W(vec3 c){return 1./(1.+dot(c,vec3(0.2126,0.7152,0.0722)));}
void main(){vec3 a=S(vec2(-2,2)),b=S(vec2(0,2)),c=S(vec2(2,2)),d=S(vec2(-2,0)),e=S(vec2(0)),f=S(vec2(2,0)),g=S(vec2(-2,-2)),h=S(vec2(0,-2)),i=S(vec2(2,-2)),j=S(vec2(-1,1)),k=S(vec2(1,1)),l=S(vec2(-1,-1)),m=S(vec2(1,-1));
 vec3 r;
 if(uKaris){vec3 g0=(j+k+l+m)*0.25,g1=(a+b+d+e)*0.25,g2=(b+c+e+f)*0.25,g3=(d+e+g+h)*0.25,g4=(e+f+h+i)*0.25;
  float w0=W(g0)*0.5,w1=W(g1)*0.125,w2=W(g2)*0.125,w3=W(g3)*0.125,w4=W(g4)*0.125;r=(g0*w0+g1*w1+g2*w2+g3*w3+g4*w4)/(w0+w1+w2+w3+w4);}
 else r=e*0.125+(a+c+g+i)*0.03125+(b+d+f+h)*0.0625+(j+k+l+m)*0.125;
 o=vec4(max(r,0.),1.);}`;
const FS_UP=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform sampler2D uSrc;uniform vec2 uTexel;
vec3 S(vec2 d){return texture(uSrc,vUv+d*uTexel).rgb;}
void main(){vec3 r=(S(vec2(-1,1))+S(vec2(1,1))+S(vec2(-1,-1))+S(vec2(1,-1))+2.*(S(vec2(0,1))+S(vec2(0,-1))+S(vec2(-1,0))+S(vec2(1,0)))+4.*S(vec2(0)))/16.;o=vec4(r,1.);}`;
const AGX=`
vec3 agxCurve(vec3 x){vec3 x2=x*x;vec3 x4=x2*x2;return 15.5*x4*x2-40.14*x4*x+31.96*x4-6.868*x2*x+0.4298*x2+0.1191*x-0.00232;}
vec3 agx(vec3 v){const mat3 m=mat3(0.842479062253094,0.0423282422610123,0.0423756549057051,0.0784335999999992,0.878468636469772,0.0784336,0.0792237451477643,0.0791661274605434,0.879142973793104);
 const float mn=-12.47393,mx=4.026069;v=m*v;v=clamp(log2(max(v,vec3(1e-10))),mn,mx);v=(v-mn)/(mx-mn);return agxCurve(v);}
vec3 agxEotf(vec3 v){const mat3 mi=mat3(1.19687900512017,-0.0528968517574562,-0.0529716355144438,-0.0980208811401368,1.15190312990417,-0.0980434501171241,-0.0990297440797205,-0.0989611768448433,1.15107367264116);return mi*v;}
vec3 agxLook(vec3 v){float l=dot(v,vec3(0.2126,0.7152,0.0722));v=pow(max(v,0.),vec3(1.07));return l+1.14*(v-l);}
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
`;
const FS_COMP=`#version 300 es
precision highp float;in vec2 vUv;out vec4 o;uniform sampler2D uHDR,uBloom;uniform float uExpo,uBloomK,uTime;uniform vec2 uRes;
${AGX}
void main(){vec2 uv=vUv;vec2 dc=uv-0.5;vec2 off=dc*0.0042*length(dc);
 vec3 col=vec3(texture(uHDR,uv-off).r,texture(uHDR,uv).g,texture(uHDR,uv+off).b);
 col=mix(col,texture(uBloom,uv).rgb,uBloomK);col*=uExpo;
 vec2 q=dc*vec2(uRes.x/uRes.y,1.);float vg=smoothstep(1.2,0.2,length(q)*0.95);col*=mix(0.5,1.,vg);
 col=agxEotf(agxLook(agx(col)));
 float n=hash12(gl_FragCoord.xy+fract(uTime*7.31)*vec2(113.,71.))-0.5;col+=n*(0.010+0.03*col*(1.-col));
 o=vec4(clamp(col,0.,1.),1.);}`;

export { FS_BG, FS_BLUR, FS_COMP, FS_DOWN, FS_ENV, FS_IRR, FS_MAIN, FS_PRE, FS_PREF, FS_SHADOW, FS_SSAO, FS_UP, VS_FS, VS_MAIN, VS_PATCH, VS_SHADOW };
