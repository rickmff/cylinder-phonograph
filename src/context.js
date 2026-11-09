// The page's handles: the WebGL2 context, its extensions and the URL options.
// Everything else draws through `gl`; without WebGL2 the app stops here.

const $=s=>document.querySelector(s);
const canvas=$('#gl');
const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,depth:true,stencil:false,powerPreference:'high-performance'});
if(!gl){$('#loading').textContent='This browser does not support WebGL2.';throw new Error('WebGL2 is not available');}
const QS=new URLSearchParams(location.search);
const FIXED=QS.has('fixed');const MAXF=QS.has('frames')?+QS.get('frames'):Infinity;if(QS.has('frames'))document.getElementById('loading').style.display='none';
const extCB=gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float');
gl.getExtension('OES_texture_float_linear');
const extAniso=gl.getExtension('EXT_texture_filter_anisotropic');
const HDRF=extCB?gl.RGBA16F:gl.RGBA8;

export { $, FIXED, HDRF, MAXF, QS, canvas, extAniso, gl };
