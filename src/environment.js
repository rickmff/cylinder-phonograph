// Image-based lighting: the studio environment rendered into cube maps, prefiltered for roughness.

import { HDRF, gl } from './context.js';
import { U, drawFS, use } from './gl-util.js';
import { KEYRAD, LDIR } from './constants.js';
import { P_env, P_irr, P_pref } from './programs.js';

function cubeTex(size,levels){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_CUBE_MAP,t);gl.texStorage2D(gl.TEXTURE_CUBE_MAP,levels,HDRF,size,size);
 gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,levels>1?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 for(const w of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T,gl.TEXTURE_WRAP_R])gl.texParameteri(gl.TEXTURE_CUBE_MAP,w,gl.CLAMP_TO_EDGE);return t}
const ENV_SIZE=512,SPEC_SIZE=256,SPEC_LEVELS=6;
function renderCube(tex,size,level,P,setup){const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,size,size);use(P);setup();
 for(let f=0;f<6;f++){gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_CUBE_MAP_POSITIVE_X+f,tex,level);U.i('uFace',f);drawFS()}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(fb)}
gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
const envSpec=cubeTex(ENV_SIZE,10),envDiff=cubeTex(ENV_SIZE,10);
renderCube(envSpec,ENV_SIZE,0,P_env,()=>{U.f('uKey',1);U.v3('uKdir',LDIR);U.v3('uKeyRad',KEYRAD)});
renderCube(envDiff,ENV_SIZE,0,P_env,()=>{U.f('uKey',0);U.v3('uKdir',LDIR);U.v3('uKeyRad',KEYRAD)});
gl.bindTexture(gl.TEXTURE_CUBE_MAP,envSpec);gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
gl.bindTexture(gl.TEXTURE_CUBE_MAP,envDiff);gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
const specTex=cubeTex(SPEC_SIZE,SPEC_LEVELS),irrTex=cubeTex(32,1);
for(let l=0;l<SPEC_LEVELS;l++){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_CUBE_MAP,envSpec);
 renderCube(specTex,SPEC_SIZE>>l,l,P_pref,()=>{U.i('uEnv',0);U.f('uRough',l/(SPEC_LEVELS-1));U.f('uSrc',ENV_SIZE)})}
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_CUBE_MAP,envDiff);renderCube(irrTex,32,0,P_irr,()=>{U.i('uEnv',0)});
gl.deleteTexture(envDiff);

export { SPEC_LEVELS, irrTex, specTex };
