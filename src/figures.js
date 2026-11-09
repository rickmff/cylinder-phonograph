// Illustrations for the tour and the docs. The curves are computed from the code's own filters and laws.

import { mulberry32 } from './math.js';
import { GWHU, RBU } from './constants.js';
import { Hof } from './contact.js';
import { BQ, Horn } from './acoustics.js';
import { coneG, govTau, offAxisFc } from './mechanics.js';

const TA=b=>'<svg class="ta" viewBox="0 0 520 200" aria-hidden="true">'+b+'</svg>';
const wav=(x0,x1,y,a,L)=>{let d='M'+x0+' '+y,k=0;for(let x=x0;x<x1;x+=L/2,k++)d+=' q'+L/4+' '+(k%2?-2*a:2*a)+' '+L/2+' 0';return d}; // a sine made of half-waves (positive = deeper)
const SINE='0 0;0 2.8;0 4;0 2.8;0 0;0 -2.8;0 -4;0 -2.8;0 0';
const anim=(v,dur,b='0s')=>'<animateTransform attributeName="transform" type="translate" values="'+v+'" dur="'+dur+'" begin="'+b+'" repeatCount="indefinite"/>';
const fade=(dur,b='0s')=>'<animate attributeName="opacity" values="0;1;0" dur="'+dur+'" begin="'+b+'" repeatCount="indefinite"/>';
const ART={
 horn:()=>TA([0,0.6,1.2].map(b=>'<path class="d" opacity="0" d="M38 56 Q72 100 38 144">'+anim('0 0;104 0','1.8s',b+'s')+fade('1.8s',b+'s')+'</path>').join('')+
  '<path class="g" d="M150 28 C235 72 300 93 392 96 H452 M150 172 C235 128 300 107 392 104 H452"/><ellipse class="g" cx="150" cy="100" rx="13" ry="72"/>'+
  ['M166 62 C250 88 330 98 450 100','M166 138 C250 112 330 102 450 100','M166 100 L450 100','M166 82 C250 95 330 99 450 100','M166 118 C250 105 330 101 450 100'].map((pth,k)=>'<circle class="gf" r="2.3" opacity="0"><animateMotion dur="1.5s" begin="'+(k*0.3)+'s" repeatCount="indefinite" path="'+pth+'"/>'+fade('1.5s',(k*0.3)+'s')+'</circle>').join('')+
  '<rect class="i" x="452" y="80" width="12" height="40" rx="4"/><line class="g" x1="458" y1="86" x2="458" y2="114">'+anim('0 0;2 0;0 0;-2 0;0 0','0.22s')+'</line>'),
 cut:()=>TA('<defs><clipPath id="tcL"><rect x="0" y="0" width="262" height="200"/></clipPath></defs><rect class="wax" x="0" y="124" width="520" height="76"/><rect class="waxt" x="262" y="122" width="258" height="4"/><line class="d" x1="262" y1="122" x2="520" y2="122"/>'+
  '<g clip-path="url(#tcL)"><path class="g" d="'+wav(-18,320,132,4,40)+'">'+anim('0 0;-40 0','0.5s')+'</path></g>'+
  '<g>'+anim(SINE,'0.5s')+'<ellipse class="i" cx="262" cy="34" rx="74" ry="9"/><line class="i" x1="262" y1="43" x2="262" y2="118"/><path class="sap" d="M255 112h14l-7 16z"/></g>'+
  '<g transform="translate(282 104)"><path class="g" d="M0 14c6-2 9-8 6-12s-10-3-10 3 7 9 13 6 9-10 6-16"><animateTransform attributeName="transform" type="rotate" values="0;-360" dur="1.2s" repeatCount="indefinite"/></path></g>'),
 data:()=>{let g='';const r=mulberry32(5);for(let y=0;y<8;y++)for(let x=0;x<12;x++){const v=0.25+0.6*Math.abs(Math.sin(x*0.7+y*1.3))*(0.6+0.4*r());g+='<rect class="gf" x="'+(36+x*14)+'" y="'+(38+y*16)+'" width="11" height="13" rx="2" opacity="'+v.toFixed(2)+'"/>'}
  let rings='';for(let y=62;y<=154;y+=5)rings+='<path class="d" d="M320 '+y+'a70 14 0 0 0 140 0"/>';
  return TA(g+'<rect x="34" y="36" width="16" height="132" rx="3" fill="none" stroke="#f0d39a" stroke-width="1.4">'+anim('0 0;154 0','2.4s')+'</rect>'+
   '<path class="g" d="M222 100h56M266 90l12 10-12 10"/><path class="g" d="M320 52v100a70 14 0 0 0 140 0V52"/><ellipse class="g" cx="390" cy="52" rx="70" ry="14"/>'+rings+
   '<path d="M320 100a70 14 0 0 0 140 0" fill="none" stroke="#f0d39a" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 -44;0 52;0 -44" dur="2.4s" repeatCount="indefinite"/></path>')},
 read:()=>TA('<rect class="wax" x="0" y="122" width="520" height="78"/><path class="g" d="'+wav(-60,600,130,4,40)+'">'+anim('0 0;-40 0','0.5s')+'</path>'+
  '<g>'+anim(SINE,'0.5s')+'<circle class="sap" cx="260" cy="119" r="7"/><line class="i" x1="260" y1="44" x2="260" y2="112"/><ellipse class="i" cx="260" cy="36" rx="74" ry="9"/></g>'+
  [0,0.45,0.9].map(b=>'<path class="d" opacity="0" d="M214 20 Q260 4 306 20">'+anim('0 0;0 -16','1.35s',b+'s')+fade('1.35s',b+'s')+'</path>').join('')),
 out:()=>TA('<circle class="i" cx="58" cy="100" r="14"/><path class="g" d="M72 96 H118 C210 93 275 72 352 28 M72 104 H118 C210 107 275 128 352 172"/><ellipse class="g" cx="352" cy="100" rx="13" ry="72"/>'+
  ['M76 100 L346 100','M76 100 C200 98 270 80 346 50','M76 100 C200 102 270 120 346 150'].map((pth,k)=>'<circle class="gf" r="2.3" opacity="0"><animateMotion dur="1.4s" begin="'+(k*0.45)+'s" repeatCount="indefinite" path="'+pth+'"/>'+fade('1.4s',(k*0.45)+'s')+'</circle>').join('')+
  [0,0.6,1.2].map(b=>'<path class="d" opacity="0" d="M372 52 Q402 100 372 148">'+anim('0 0;58 0','1.8s',b+'s')+fade('1.8s',b+'s')+'</path>').join('')+
  '<circle class="i" cx="468" cy="96" r="20"/><path class="i" d="M456 116c-4 10-4 20-4 30M480 116c4 10 4 20 4 30"/><path class="g" d="M447 92a4 6 0 0 0 0 10M489 92a4 6 0 0 1 0 10"/>'),
 clock:()=>{let sp='M90 100';for(let k=1;k<=60;k++){const a=k/60*5.2*Math.PI,r=3+k*0.62;sp+=' L'+(90+r*Math.cos(a)).toFixed(1)+' '+(100+r*Math.sin(a)).toFixed(1)}
  return TA('<g><path class="g" d="'+sp+'"/><animateTransform attributeName="transform" type="rotate" values="0 90 100;-360 90 100" dur="9s" repeatCount="indefinite"/></g>'+
   '<line class="i" x1="226" y1="44" x2="226" y2="156"/><path class="d" d="M226 70 L204 92 M226 70 L248 92"/>'+
   '<circle class="gf" cy="94" r="7"><animate attributeName="cx" values="200;252;200" dur="0.7s" repeatCount="indefinite"/><animate attributeName="r" values="7;5;7;9;7" dur="0.7s" repeatCount="indefinite"/></circle>'+
   '<circle class="gf" cy="94" r="7"><animate attributeName="cx" values="252;200;252" dur="0.7s" repeatCount="indefinite"/><animate attributeName="r" values="7;9;7;5;7" dur="0.7s" repeatCount="indefinite"/></circle>'+
   '<circle class="i" cx="318" cy="100" r="12"/><circle class="i" cx="436" cy="100" r="46"/><path class="g" stroke-dasharray="6 6" d="M318 88 L436 54 M318 112 L436 146"><animate attributeName="stroke-dashoffset" values="0;-24" dur="0.4s" repeatCount="indefinite"/></path>'+
   '<g><line class="g" x1="436" y1="100" x2="436" y2="62"/><animateTransform attributeName="transform" type="rotate" values="0 436 100;360 436 100" dur="2.2s" repeatCount="indefinite"/></g>'+
   '<path class="d" stroke-dasharray="3 5" d="M372 172 H504" stroke-width="5"><animate attributeName="stroke-dashoffset" values="0;-16" dur="0.6s" repeatCount="indefinite"/></path>')}};
/* --- illustrations of the model itself: block diagrams with the code's own numbers, curves computed from the code's own filters --- */
const svgBox=(x,y,w,h,a,b)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="7" fill="rgba(210,172,98,.07)" stroke="#d2ac62" stroke-width="1.3"/><text x="'+(x+w/2)+'" y="'+(y+(b?h/2-2:h/2+4))+'" text-anchor="middle" class="tl">'+a+'</text>'+(b?'<text x="'+(x+w/2)+'" y="'+(y+h/2+11)+'" text-anchor="middle" class="ts">'+b+'</text>':'');
const svgArr=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1),h=6;return '<path class="d" d="M'+x1+' '+y1+'L'+x2+' '+y2+'M'+(x2-h*Math.cos(a-0.45))+' '+(y2-h*Math.sin(a-0.45))+'L'+x2+' '+y2+'L'+(x2-h*Math.cos(a+0.45))+' '+(y2-h*Math.sin(a+0.45))+'"/>'};
const RESP={};
function respCurve(key,make,fs=48000,N=8192){if(RESP[key])return RESP[key];const sys=make(fs),h=new Float32Array(N);for(let i=0;i<N;i++)h[i]=sys(i===0?1:0);   // impulse through the very same code, then a DFT
 const pts=[];let mx=-1e9;for(let k=0;k<=110;k++){const f=60*Math.pow(10000/60,k/110),w=2*Math.PI*f/fs;let re=0,im=0;for(let i=0;i<N;i++){re+=h[i]*Math.cos(w*i);im-=h[i]*Math.sin(w*i)}const db=10*Math.log10(re*re+im*im+1e-20);pts.push([f,db]);if(db>mx)mx=db}
 return RESP[key]=pts.map(([f,db])=>[f,db-mx])}
function svgCurve(pts,x,y,w,h,lo=-36){const X=f=>x+w*Math.log(f/60)/Math.log(10000/60),Y=db=>y+h*Math.min(1,Math.max(0,db/lo));
 let g='<path class="d" stroke-dasharray="2 4" d="M'+x+' '+(y+h)+'H'+(x+w)+'"/>';for(const[f,l]of[[100,'100'],[1000,'1k'],[10000,'10k']])g+='<path class="d" stroke-opacity=".35" d="M'+X(f)+' '+y+'V'+(y+h)+'"/><text x="'+X(f)+'" y="'+(y+h+12)+'" text-anchor="middle" class="ts">'+l+'</text>';
 const fl=pts.map(([,db])=>db<=lo),keep=fl.map((v,k)=>!v||(k>0&&!fl[k-1])||(k<fl.length-1&&!fl[k+1]));let d='';
 pts.forEach(([f,db],k)=>{if(keep[k])d+=(k>0&&keep[k-1]?'L':'M')+X(f).toFixed(1)+' '+Y(db).toFixed(1)});
 return g+'<path class="g" d="'+d+'"/><text x="'+(x-4)+'" y="'+(y+4)+'" text-anchor="end" class="ts">0 dB</text><text x="'+(x-4)+'" y="'+(y+h+3)+'" text-anchor="end" class="ts">'+lo+'</text>'}
ART.hornf=()=>TA('<text x="6" y="45" class="tl">in</text>'+svgArr(24,41,40,41)+svgBox(40,24,82,34,'bass cut','270 Hz')+svgArr(122,41,140,41)+svgBox(140,24,82,34,'bass cut','167 Hz')+svgArr(222,41,248,41)+
 '<circle cx="258" cy="41" r="10" fill="none" stroke="#ecdfc6" stroke-width="1.4"/><path class="i" d="M252 41h12M258 35v12"/>'+svgArr(268,41,300,41)+'<text x="285" y="33" text-anchor="middle" class="tl">out</text>'+
 '<path class="d" d="M286 41V82H226"/>'+svgBox(150,66,76,32,'echo','2.45 ms')+'<path class="d" d="M150 82H132"/>'+svgBox(64,66,68,32,'wall loss','1.7 kHz')+'<path class="d" d="M64 82H52V100"/>'+
 '<text x="40" y="114" class="ts">20 %</text><path class="d" d="M52 100V108"/>'+'<path class="d" d="M52 108V116H258V51"/><path class="d" d="M254 56L258 51L262 56"/>'+
 svgCurve(respCurve('horn',fs=>{const H=new Horn(fs,270,0.20);return x=>H.run(x)}),340,30,168,118)+'<text x="424" y="18" text-anchor="middle" class="ts">computed from Horn()</text>');
ART.cutter=()=>{const cx=372,cy=100,sx=0.78,sy=0.95,X=z=>(cx+z*sx).toFixed(1),Y=v=>(cy-v*sy).toFixed(1);let sat='';for(let k=0;k<=60;k++){const z=-130+260*k/60;sat+=(k?'L':'M')+X(z)+' '+Y(44*Math.tanh(z/44))}
 return TA(svgCurve(respCurve('dia',fs=>{const d=new BQ().lp(2300,1.3,fs),a=new BQ().lp(Math.min(4300,fs*0.4),0.7,fs);return x=>a.run(d.run(x))}),44,30,190,120)+'<text x="139" y="16" text-anchor="middle" class="ts">glass disc, rings at 2.3 kHz</text>'+
  '<path class="d" stroke-opacity=".35" d="M'+X(-130)+' '+cy+'H'+X(130)+'M'+cx+' 26V174"/><path class="d" stroke-dasharray="3 4" d="M'+X(-72)+' '+Y(-72)+'L'+X(72)+' '+Y(72)+'"/>'+
  '<path class="d" stroke-dasharray="2 3" d="M'+X(-130)+' '+Y(44)+'H'+X(130)+'M'+X(-130)+' '+Y(-44)+'H'+X(130)+'"/><path class="g" d="'+sat+'"/>'+
  '<text x="'+(+X(130)+4)+'" y="'+(+Y(44)+3)+'" class="ts">+44 µm</text><text x="'+(+X(130)+4)+'" y="'+(+Y(-44)+3)+'" class="ts">−44 µm</text>'+
  '<text x="'+cx+'" y="16" text-anchor="middle" class="ts">soft clipping</text><text x="'+X(130)+'" y="'+(cy+14)+'" text-anchor="end" class="ts">sound</text><text x="'+(cx+6)+'" y="36" class="ts">cut</text>')};
ART.texture=()=>{let cells='';const r=mulberry32(9);for(let x=0;x<14;x++)cells+='<rect class="gf" x="'+(22+x*11)+'" y="88" width="9" height="22" rx="1.5" opacity="'+(0.25+0.7*r()).toFixed(2)+'"/>';
 let grid='';for(let y=0;y<6;y++)for(let x=0;x<6;x++)grid+='<rect class="gf" x="'+(216+x*14)+'" y="'+(58+y*14)+'" width="12" height="12" rx="1.5" opacity="'+(0.2+0.7*r()).toFixed(2)+'"/>';
 let par='M352 70';for(let k=0;k<=40;k++){const q=-1+2*k/40;par+='L'+(392+q*58).toFixed(1)+' '+(70+52*(1-q*q)).toFixed(1)}
 return TA(cells+'<text x="99" y="76" text-anchor="middle" class="ts">depths · 4096 per turn</text>'+svgArr(184,99,208,99)+grid+'<text x="258" y="160" text-anchor="middle" class="ts">GPU texture</text>'+svgArr(310,99,334,99)+
  '<path class="d" d="M326 70H352M432 70H470"/><path class="g" d="'+par+'L432 70"/><path class="d" stroke-dasharray="2 3" d="M392 70V122"/><text x="398" y="100" class="ts">depth</text><text x="401" y="160" text-anchor="middle" class="tl">groove</text><text x="401" y="176" text-anchor="middle" class="ts">carved by the GPU</text>')};
ART.playback=()=>{const B=[['needle','speed'],['ring','2 kHz'],['weight','650 Hz'],['dull','3.5 kHz'],['horn','280 Hz'],['box','480 Hz'],['room','16 %']];let g='';
 B.forEach(([a,b],k)=>{const x=8+k*64;g+=svgBox(x,14,56,32,a,b);if(k<B.length-1)g+=svgArr(x+56,30,x+64,30)});
 return TA(g+svgCurve(respCurve('play',fs=>{const d=new BQ().pk(2000,1.1,fs,2.2),tk=1-Math.exp(-2*Math.PI*650/fs),l1=new BQ().lp(3500,0.5412,fs),l2=new BQ().lp(3500,1.3066,fs),l3=new BQ().lp(4800,0.7071,fs),H=new Horn(fs,280,0.20),b=new BQ().pk(480,0.9,fs,2.5);let tl=0;
  return x=>{let o=d.run(x);tl+=(o-tl)*tk;return b.run(H.run(l3.run(l2.run(l1.run(tl)))))}}),70,64,380,100)+'<text x="260" y="196" text-anchor="middle" class="ts">computed from AcousticPlayer()</text>')};
/* ---- the docs: written once, figures drawn from the code's own functions on first open ---- */
const FIG={horn:()=>ART.hornf(),texture:()=>ART.texture(),playback:()=>ART.playback()};
FIG.pipeline=()=>{let g='<text x="14" y="15" class="ts">CUT</text><text x="14" y="194" class="ts">PLAY</text>';
 const top=[[14,58,'sound','mic, file'],[92,66,'horn','filters'],[178,78,'diaphragm','2.3 kHz'],[276,66,'cutter','soft clip']];
 top.forEach(([x,w,a,b],k)=>{g+=svgBox(x,24,w,34,a,b);if(k<top.length-1)g+=svgArr(x+w,41,top[k+1][0],41)});
 g+=svgArr(342,41,428,41)+'<text x="385" y="34" text-anchor="middle" class="ts">cuts</text>';
 g+='<rect x="430" y="24" width="78" height="150" rx="9" fill="rgba(210,172,98,.07)" stroke="#d2ac62" stroke-width="1.3"/>';
 const r=mulberry32(5);for(let y=0;y<7;y++)for(let x=0;x<4;x++)g+='<rect class="gf" x="'+(445+x*13)+'" y="'+(62+y*11)+'" width="10" height="8" rx="1.5" opacity="'+(0.18+0.62*r()).toFixed(2)+'"/>';
 g+='<text x="469" y="47" text-anchor="middle" class="tl">depths</text><text x="469" y="160" text-anchor="middle" class="ts">µm</text>';
 const bot=[[338,70,'ball','70 µm'],[254,64,'needle','can jump'],[166,70,'filters','disc, horn'],[96,52,'room','echoes'],[14,64,'3D','your ears']];
 g+=svgArr(430,157,408,157);bot.forEach(([x,w,a,b],k)=>{g+=svgBox(x,140,w,34,a,b);if(k<bot.length-1){const n=bot[k+1];g+=svgArr(x,157,n[0]+n[1],157)}});
 g+=svgBox(176,82,110,36,'clockwork','where we are')+svgArr(286,100,428,100)+'<text x="357" y="93" text-anchor="middle" class="ts">position</text>';
 return TA(g)};
FIG.contact=()=>{const d=96,s=0.82,x0=135,yL=60,w=GWHU,R=RBU,h=-Hof(d),gap=d-h,cy=yL+(h-R)*s;   // h: how deep the ball's lowest point gets in a d-deep cut
 let wax='M18 '+yL+'L'+(x0-w*s).toFixed(1)+' '+yL;for(let k=0;k<=40;k++){const x=-w+2*w*k/40;wax+='L'+(x0+x*s).toFixed(1)+' '+(yL+d*(1-(x/w)*(x/w))*s).toFixed(1)}wax+='L252 '+yL+'L252 200L18 200Z';
 let g='<path class="wax" d="'+wax+'"/><circle class="sap" cx="'+x0+'" cy="'+cy.toFixed(1)+'" r="'+(R*s).toFixed(1)+'" opacity=".9"/>'+
  '<path class="d" stroke-dasharray="3 3" d="M'+(x0-44)+' '+(yL+d*s).toFixed(1)+'H'+(x0+66)+'"/><text x="'+(x0+70)+'" y="'+(yL+d*s+3).toFixed(1)+'" class="ts">d = '+d+' µm</text>'+
  '<path class="i" d="M'+x0+' '+(yL+h*s+1.5).toFixed(1)+'V'+(yL+d*s-1.5).toFixed(1)+'"/><text x="'+(x0-6)+'" y="'+(yL+(h+gap/2)*s+3).toFixed(1)+'" text-anchor="end" class="ts">'+gap.toFixed(0)+' µm</text>'+
  '<text x="135" y="190" text-anchor="middle" class="ts">true scale · 70 µm ball</text>';
 const px=306,py=34,pw=190,ph=134,X=v=>px+pw*v/100,Y=v=>py+ph*v/100,kn=GWHU*GWHU/(2*RBU);
 g+='<path class="d" stroke-opacity=".35" d="M'+px+' '+py+'V'+(py+ph)+'H'+(px+pw)+'"/><path class="d" stroke-dasharray="3 4" d="M'+X(0)+' '+Y(0)+'L'+X(100)+' '+Y(100)+'"/>';
 let cur='';for(let k=0;k<=98;k++)cur+=(k?'L':'M')+X(k).toFixed(1)+' '+Y(-Hof(k)).toFixed(1);g+='<path class="g" d="'+cur+'"/>';
 g+='<path class="d" stroke-opacity=".5" d="M'+X(kn).toFixed(1)+' '+(py+ph)+'v5"/><text x="'+X(kn).toFixed(1)+'" y="'+(py+ph+15)+'" text-anchor="middle" class="ts">'+kn.toFixed(0)+'</text><text x="'+(px+pw)+'" y="'+(py+ph+15)+'" text-anchor="end" class="ts">cut depth (µm)</text>'+
  '<text x="'+px+'" y="'+(py-12)+'" class="ts">how deep the ball gets</text><text x="'+X(98)+'" y="'+(Y(-Hof(98))-8).toFixed(1)+'" text-anchor="end" class="tl">ball</text><text x="'+X(70)+'" y="'+(Y(70)+16).toFixed(1)+'" class="ts">floor</text>';
 return TA(g)};
FIG.governor=()=>{const dt=1/60,T1=0.3,T2=3.6,TE=5.4,rpm=160;let om=0;const pts=[],tg=[];
 for(let n=0;n*dt<=TE+1e-9;n++){const t=n*dt,run=t>=T1&&t<T2,tgt=run?rpm/60*2*Math.PI:0;om+=(tgt-om)*(1-Math.exp(-dt/govTau(tgt,om,run)));if(!run&&Math.abs(om)<0.02)om=0;pts.push([t,om*60/(2*Math.PI)]);tg.push([t,run?rpm:0])}   // mechStep's update
 const x0=44,x1=500,y0=30,y1=168,X=t=>x0+(x1-x0)*t/TE,Y=v=>y1-(y1-y0)*v/180,P=a=>a.map(([t,v],k)=>(k?'L':'M')+X(t).toFixed(1)+' '+Y(v).toFixed(1)).join('');
 let g='<path class="d" stroke-opacity=".35" d="M'+x0+' '+y0+'V'+y1+'H'+x1+'"/><path class="d" stroke-dasharray="3 4" d="'+P(tg)+'"/><path class="g" d="'+P(pts)+'"/>';
 for(let t=0;t<=5;t++)g+='<text x="'+X(t)+'" y="'+(y1+14)+'" text-anchor="middle" class="ts">'+t+(t===5?' s':'')+'</text>';
 g+='<text x="'+(x0-6)+'" y="'+(Y(160)+3)+'" text-anchor="end" class="ts">160</text><text x="'+(x0-6)+'" y="'+(Y(0)+3)+'" text-anchor="end" class="ts">0</text><text x="'+(x0-6)+'" y="'+(Y(160)-12)+'" text-anchor="end" class="ts">rpm</text>';
 g+='<text x="'+X(T1)+'" y="'+(y0-14)+'" text-anchor="middle" class="ts">lever: run</text><text x="'+X(T2)+'" y="'+(y0-14)+'" text-anchor="middle" class="ts">lever: stop</text>';
 g+='<text x="'+(X(T1+0.75))+'" y="'+Y(92)+'" class="tl">speeds up</text><text x="'+(X(T2+0.42))+'" y="'+Y(92)+'" class="tl">brakes</text>';
 return TA(g)};
FIG.cone=()=>{const cx=168,cy=100,R0=80;let lv='',fc='';
 for(let k=0;k<=240;k++){const a=k/240*2*Math.PI,deg=Math.abs((a*180/Math.PI+180)%360-180),r=R0*coneG(deg),rf=R0*(0.22+0.78*Math.log(offAxisFc(Math.cos(a))/1800)/Math.log(9));
  lv+=(k?'L':'M')+(cx+r*Math.cos(a)).toFixed(1)+' '+(cy-r*Math.sin(a)).toFixed(1);fc+=(k?'L':'M')+(cx+rf*Math.cos(a)).toFixed(1)+' '+(cy-rf*Math.sin(a)).toFixed(1)}
 let g='<path class="d" stroke-opacity=".25" d="M'+(cx-R0-18)+' '+cy+'H'+(cx+R0+18)+'M'+cx+' '+(cy-R0-8)+'V'+(cy+R0+8)+'"/>';
 g+='<path d="'+lv+'Z" fill="rgba(210,172,98,.11)" stroke="#d2ac62" stroke-width="1.8"/><path class="d" stroke-dasharray="3 4" d="'+fc+'Z"/>';
 g+='<path class="i" fill="rgba(16,12,9,.9)" d="M'+(cx-30)+' '+(cy-3.5)+'L'+(cx-4)+' '+(cy-15)+'V'+(cy+15)+'L'+(cx-30)+' '+(cy+3.5)+'Z"/>';
 const L=(deg,x,y,anc)=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anc+'" class="ts">'+coneG(deg).toFixed(2).replace(/0$/,'')+' · '+(offAxisFc(Math.cos(deg*Math.PI/180))/1000).toFixed(1)+' kHz</text>';
 g+=L(0,cx+R0+8,cy-8,'start')+L(90,cx+8,cy-R0*coneG(90)-8,'start')+L(180,cx-R0*0.6-8,cy-8,'end');
 g+='<path d="M352 70h22" stroke="#d2ac62" stroke-width="1.8"/><text x="382" y="74" class="tl">loudness</text><path class="d" stroke-dasharray="3 4" d="M352 96h22"/><text x="382" y="100" class="tl">brightness</text><text x="352" y="130" class="ts">seen from above</text><text x="352" y="145" class="ts">the horn points right</text>';
 return TA(g)};

export { ART, FIG };
