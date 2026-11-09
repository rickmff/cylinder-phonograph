// Where the sapphire ball sits in the groove.
// Across the groove: a 70 µm ball resting on the walls of a parabolic cut (a lookup table, `Hof`).
// Along the groove: the ball cannot enter dips smaller than itself (morphological dilation, `TAPS`).

import { D0U, GWHU, RBU, RC } from './constants.js';

// cross-section contact: a ball of radius RB resting in a parabolic groove of depth d
const HLUT=new Float32Array(258);
for(let i=0;i<=257;i++){const d=i*0.5;let m=-1e9;for(let k=0;k<=128;k++){const x=-RBU+2*RBU*k/128,q=Math.min(1,Math.abs(x)/GWHU);m=Math.max(m,-d*(1-q*q)+Math.sqrt(Math.max(0,RBU*RBU-x*x)))}HLUT[i]=m-RBU}
const Hof=d=>{const f=Math.min(256,Math.max(0,d*2)),i=Math.floor(f);return HLUT[i]+(HLUT[i+1]-HLUT[i])*(f-i)};
const YC0=(Hof(D0U)+RBU)*1e-6; // ball centre above the land for the rest depth (m)
// along the groove the ball cannot enter features smaller than itself: morphological dilation
const TAPS=[];for(let k=-4;k<=4;k++){const s=k/4*RBU;TAPS.push([s/(2*Math.PI*RC*1e6),Math.sqrt(Math.max(0,RBU*RBU-s*s))-RBU])}

export { Hof, TAPS, YC0 };
