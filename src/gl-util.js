// Thin WebGL2 helpers: shader programs, uniforms, buffers, textures and render targets.

import { gl } from './context.js';

function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);console.error(log+'\n'+src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n'));throw new Error(log)}return s}
function program(vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
 for(let i=0;i<n;i++){const nm=gl.getActiveUniform(p,i).name.replace(/\[0\]$/,'');u[nm]=gl.getUniformLocation(p,nm)}return{p,u}}
let CUR=null;const use=P=>{if(CUR!==P){gl.useProgram(P.p);CUR=P}};
const U={f(n,v){const l=CUR.u[n];if(l)gl.uniform1f(l,v)},i(n,v){const l=CUR.u[n];if(l)gl.uniform1i(l,v)},v2(n,a,b){const l=CUR.u[n];if(l)gl.uniform2f(l,a,b)},
 v3(n,a){const l=CUR.u[n];if(l)gl.uniform3fv(l,a)},v4(n,a){const l=CUR.u[n];if(l)gl.uniform4fv(l,a)},m3(n,m){const l=CUR.u[n];if(l)gl.uniformMatrix3fv(l,false,m)},m4(n,m){const l=CUR.u[n];if(l)gl.uniformMatrix4fv(l,false,m)}};
function upload(mb){const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 const buf=(d,loc,sz)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,sz,gl.FLOAT,false,0,0)};
 buf(mb.P,0,3);buf(mb.N,1,3);buf(mb.U,2,2);const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(mb.I),gl.STATIC_DRAW);
 gl.bindVertexArray(null);return{vao,count:mb.I.length}}
function tex2D(w,h,f,filter=gl.LINEAR){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,f,w,h);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
function fbOf(t,depth){const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
 if(depth)gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);return f}
function rbo(fmt,w,h,s=0){const r=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,r);if(s>0)gl.renderbufferStorageMultisample(gl.RENDERBUFFER,s,fmt,w,h);else gl.renderbufferStorage(gl.RENDERBUFFER,fmt,w,h);return r}
const VAO0=gl.createVertexArray();const drawFS=()=>{gl.bindVertexArray(VAO0);gl.drawArrays(gl.TRIANGLES,0,3)};

export { CUR, U, drawFS, fbOf, program, rbo, tex2D, upload, use };
