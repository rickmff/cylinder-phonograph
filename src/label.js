// The printed label on the cylinder box, drawn on a 2D canvas and uploaded as a texture.

import { extAniso, gl } from './context.js';
import { curCyl } from './cylinders.js';

const labelTex=gl.createTexture();
function makeLabel(cy){cy=cy||curCyl();const cv=document.createElement('canvas');cv.width=1024;cv.height=360;const c=cv.getContext('2d');
 c.fillStyle='#e6d6b0';c.fillRect(0,0,1024,360);
 const g=c.createLinearGradient(0,0,0,360);g.addColorStop(0,'rgba(110,70,25,.22)');g.addColorStop(.45,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(110,70,25,.28)');c.fillStyle=g;c.fillRect(0,0,1024,360);
 c.strokeStyle='#3a2313';c.lineWidth=7;c.strokeRect(20,22,984,316);c.lineWidth=2;c.strokeRect(34,36,956,288);
 c.fillStyle='#2a180c';c.textAlign='center';
 const fit=(txt,font,size,y)=>{let sz=size;c.font=font.replace('#',sz);while(c.measureText(txt).width>900&&sz>14){sz-=2;c.font=font.replace('#',sz)}c.fillText(txt,512,y)};
 fit(cy.head||'SOUND CYLINDER','600 #px "Cormorant Garamond", Georgia, serif',62,124);
 fit(cy.title+(cy.by?' — '+cy.by:''),'italic 500 #px "Cormorant Garamond", Georgia, serif',42,196);
 fit((cy.num?'No. '+cy.num+'  ·  ':'')+'160 R.P.M.'+(cy.year?'  ·  '+cy.year.toUpperCase():''),'500 #px "IBM Plex Mono", monospace',24,262);
 c.beginPath();c.moveTo(330,290);c.lineTo(694,290);c.lineWidth=1.5;c.stroke();
 for(let i=0;i<2200;i++){c.fillStyle=`rgba(85,55,25,${Math.random()*0.13})`;c.fillRect(Math.random()*1024,Math.random()*360,Math.random()*3+0.5,Math.random()*3+0.5)}
 gl.bindTexture(gl.TEXTURE_2D,labelTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);gl.generateMipmap(gl.TEXTURE_2D);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 if(extAniso)gl.texParameterf(gl.TEXTURE_2D,extAniso.TEXTURE_MAX_ANISOTROPY_EXT,8)}
gl.bindTexture(gl.TEXTURE_2D,labelTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([230,214,176,255]));

export { labelTex, makeLabel };
