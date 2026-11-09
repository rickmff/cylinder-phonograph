// Small vector and matrix helpers, easing curves and a seeded random generator.

const V3={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
len:a=>Math.hypot(a[0],a[1],a[2]),norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]},lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
const M4={
I(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m},
mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o},
T(x,y,z){const m=M4.I();m[12]=x;m[13]=y;m[14]=z;return m},
S(x,y,z){const m=M4.I();m[0]=x;m[5]=y;m[10]=z;return m},
RX(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I();m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m},
RY(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I();m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m},
RZ(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I();m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m},
basis(x,y,z,p){const m=M4.I();m[0]=x[0];m[1]=x[1];m[2]=x[2];m[4]=y[0];m[5]=y[1];m[6]=y[2];m[8]=z[0];m[9]=z[1];m[10]=z[2];if(p){m[12]=p[0];m[13]=p[1];m[14]=p[2]}return m},
persp(fy,as,n,f){const t=1/Math.tan(fy/2),m=new Float32Array(16);m[0]=t/as;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m},
ortho(l,r,b,t,n,f){const m=M4.I();m[0]=2/(r-l);m[5]=2/(t-b);m[10]=-2/(f-n);m[12]=-(r+l)/(r-l);m[13]=-(t+b)/(t-b);m[14]=-(f+n)/(f-n);return m},
lookAt(e,c,up){const z=V3.norm(V3.sub(e,c)),x=V3.norm(V3.cross(up,z)),y=V3.cross(z,x),m=M4.I();
 m[0]=x[0];m[4]=x[1];m[8]=x[2];m[1]=y[0];m[5]=y[1];m[9]=y[2];m[2]=z[0];m[6]=z[1];m[10]=z[2];m[12]=-V3.dot(x,e);m[13]=-V3.dot(y,e);m[14]=-V3.dot(z,e);return m},
xf(m,p){return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]},
inv(m){const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
 const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
 let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;d=d?1/d:0;const o=new Float32Array(16);
 o[0]=(a11*b11-a12*b10+a13*b09)*d;o[1]=(a02*b10-a01*b11-a03*b09)*d;o[2]=(a31*b05-a32*b04+a33*b03)*d;o[3]=(a22*b04-a21*b05-a23*b03)*d;
 o[4]=(a12*b08-a10*b11-a13*b07)*d;o[5]=(a00*b11-a02*b08+a03*b07)*d;o[6]=(a32*b02-a30*b05-a33*b01)*d;o[7]=(a20*b05-a22*b02+a23*b01)*d;
 o[8]=(a10*b10-a11*b08+a13*b06)*d;o[9]=(a01*b08-a00*b10-a03*b06)*d;o[10]=(a30*b04-a31*b02+a33*b00)*d;o[11]=(a21*b02-a20*b04-a23*b00)*d;
 o[12]=(a11*b07-a10*b09-a12*b06)*d;o[13]=(a00*b09-a01*b07+a02*b06)*d;o[14]=(a31*b01-a30*b03-a32*b00)*d;o[15]=(a20*b03-a21*b01+a22*b00)*d;return o},
nmat(m){const a00=m[0],a01=m[1],a02=m[2],a10=m[4],a11=m[5],a12=m[6],a20=m[8],a21=m[9],a22=m[10];
 const b01=a22*a11-a12*a21,b11=-a22*a10+a12*a20,b21=a21*a10-a11*a20;let d=a00*b01+a01*b11+a02*b21;d=d?1/d:0;
 const o0=b01*d,o1=(-a22*a01+a02*a21)*d,o2=(a12*a01-a02*a11)*d,o3=b11*d,o4=(a22*a00-a02*a20)*d,o5=(-a12*a00+a02*a10)*d,o6=b21*d,o7=(-a21*a00+a01*a20)*d,o8=(a11*a00-a01*a10)*d;
 return new Float32Array([o0,o3,o6,o1,o4,o7,o2,o5,o8])}
};
const chain=(...ms)=>ms.reduce((a,b)=>M4.mul(a,b));
const toX=(x,y,z)=>chain(M4.T(x,y,z),M4.RZ(-Math.PI/2));
const m3v=(n,v)=>[n[0]*v[0]+n[3]*v[1]+n[6]*v[2],n[1]*v[0]+n[4]*v[1]+n[7]*v[2],n[2]*v[0]+n[5]*v[1]+n[8]*v[2]];
function rotAxis(v,k,a){const c=Math.cos(a),s=Math.sin(a),kv=V3.cross(k,v),kd=V3.dot(k,v);return[v[0]*c+kv[0]*s+k[0]*kd*(1-c),v[1]*c+kv[1]*s+k[1]*kd*(1-c),v[2]*c+kv[2]*s+k[2]*kd*(1-c)]}
const bez3=(a,b,c,d,t)=>{const u=1-t;return[u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1],u*u*u*a[2]+3*u*u*t*b[2]+3*u*t*t*c[2]+t*t*t*d[2]]};
const sstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const mulberry32=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

export { M4, V3, bez3, chain, clamp, m3v, mulberry32, rotAxis, sstep, toX };
