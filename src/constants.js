// The machine in numbers (metres, seconds): cylinder, feed screw, groove, stylus, horn and key light.
// A 100-thread-per-inch screw at 160 rpm, a 70 µm sapphire ball, grooves cut 52 µm deep at rest.

import { V3, sstep } from './math.js';

const YM=0.205,ZM=0.035,RC=0.0278,CYL0=-0.070,CYLL=0.108;
const XA=-0.064,XREC=0.094,PITCH=0.000254,D0=0.000052,DA=0.000036,GW=0.64;
const YB=0.236,ZB=-0.045,YF=0.2215,ZF=-0.0255,PLY=0.145,REPY=0.2470;
const N0=8;const OMEGA=160/60*Math.PI*2;
const RB=0.000070,GWH=GW*0.5*PITCH;
const D0U=D0*1e6,DMAXU=98,RBU=RB*1e6,GWHU=GWH*1e6;
const LDIR=V3.norm([-0.52,0.80,0.30]);
const KEYE=[3.1,2.86,2.55]; // key irradiance
const KEYRAD=[30,27.6,24.6]; // key softbox radiance (for reflections)
const SPOTC=[-0.07,-0.03];
const HORN_D=V3.norm([-1.0,0.13,-0.42]);
const HORN_S0=[0,0.2600,ZM];
const HORN_E=V3.add(V3.add(HORN_S0,[0,0.036,0]),V3.mul(HORN_D,0.024));
const HORN_L=0.36,S_BAL=0.16;
const hornR=sh=>{if(sh<0)return 0.0068;const x=Math.min(1,sh/HORN_L);let r=0.0068+0.034*x+0.058*Math.pow(x,5);
 r+=0.0011*sstep(0,0.0016,sh)*(1-sstep(0.0125,0.0145,sh));for(const b of[0.13,0.25])r+=0.00075*Math.exp(-(((sh-b)/0.0016)**2));return r};

export { CYL0, CYLL, D0, D0U, DA, DMAXU, GW, GWHU, HORN_D, HORN_E, HORN_L, HORN_S0, KEYE, KEYRAD, LDIR, N0, OMEGA, PITCH, PLY, RB, RBU, RC, REPY, SPOTC, S_BAL, XA, XREC, YB, YF, YM, ZB, ZF, ZM, hornR };
