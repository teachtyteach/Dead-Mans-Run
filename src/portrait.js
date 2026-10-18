/* ================= portraits: inked Western character busts ================= */
// Each portrait is a list of shapes drawn in a 64x64 box:
//   {d, fill, op, stroke, sw, dash, clip, fade, tf, cls}
// fill/stroke: '#hex' | {lin:[x1,y1,x2,y2],stops} | {rad:[cx,cy,r],stops} | {pat:[size,dot,'#hex'],kind:'dot'|'net'|'scale'}
// clip: index of an earlier shape to clip to. fade: a gradient used as a soft mask. tf: SVG transform. cls: CSS hook for idle motion.
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return ()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
const INK='#140b06';
const SKIN=[['#e9bf98','#b07a55'],['#d9a57c','#9a6440'],['#c48a5e','#86532f'],['#a06a44','#683e22'],['#7d4e2f','#4c2a14'],['#5e3a22','#331c0c'],['#e6d2bf','#a8917c']];
const HATC=['#2a1c13','#3f2c1e','#5c4129','#16120f','#6e5c46','#4a2318','#30302a','#7a6a52','#8a7a5e'];
const COAT=['#3a2a20','#22303a','#4a2620','#2a3828','#1c1a18','#56432e','#3a2c46','#62533f','#2e2a34'];
const HAIR=['#120c08','#2e1c10','#5a3c22','#9a7448','#6e2a14','#262626','#3a2414'];
const GREY=['#cfc6b4','#a9a49a','#dcd6ca'];
const BAND=['#8a241a','#23497e','#b8913a','#2b6b3f','#d9cdb4','#5a1d6e','#1a1a1a'];
const IRIS=['#5a3a1e','#3d5f7a','#4f6b3a','#2a1a10','#6f8494','#7a5a2a'];
const SHIRT=['#d8ccb0','#c8b89a','#b5a68a','#9aa2a8','#d0bfb4','#e2d8c4'];
const TIER_BG={d:[['#6e4e2e','#140b05'],'#ffc27a'],g:[['#284652','#05090c'],'#8fdcff'],v:[['#5e2232','#0c0306'],'#ff8f72']};
// rounds the numbers inside a path template so the markup stays small
const P=(s,...v)=>{let o=s[0];for(let i=0;i<v.length;i++){const x=v[i];o+=(typeof x==='number'?+x.toFixed(2):x)+s[i+1]}return o};
const E=(cx,cy,rx,ry=rx)=>P`M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z`;
const STAR=(cx,cy,R,r0)=>{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r0:R;d+=(i?'L':'M')+(+(cx+Math.cos(a)*q).toFixed(2))+' '+(+(cy+Math.sin(a)*q).toFixed(2))}return d+'Z'};
function shade(h,k){const n=parseInt(h.slice(1),16),t=k<0?0:255,a=Math.abs(k);const c=[n>>16,n>>8&255,n&255].map(v=>Math.round(v+(t-v)*a));return '#'+((1<<24)|(c[0]<<16)|(c[1]<<8)|c[2]).toString(16).slice(1)}

function portraitShapes(name,o={}){
  const r=rng(name), pick=a=>a[Math.floor(r()*a.length)], chance=p=>r()<p, rr=(a,b)=>a+r()*(b-a);
  const fem=!!o.fem, boss=!!o.boss, human=!!o.human;
  const [skin,skinD]=o.skin||pick(SKIN), skinL=shade(skin,.22), skinDD=shade(skinD,-.4);
  const age=o.age!=null?o.age:(chance(.28)?(chance(.4)?2:1):0);
  const hair=o.hair||(age===2&&chance(.7)?pick(GREY):pick(HAIR)), browC=shade(hair,GREY.includes(hair)||hair==='#8a8a8a'?-.35:-.1);
  const hatc=o.hatc||pick(HATC), coat=o.coat||pick(COAT);
  const hat=o.hat||pick(fem?['cowboy','cowboy','none','none','none','bowler','flat']:['cowboy','cowboy','cowboy','cattleman','slouch','flat','gambler','bowler','top','none']);
  const tilt=o.hatTilt!=null?o.hatTilt:(hat==='none'?0:rr(-6,6));
  const fh=fem?'none':(o.fh||pick(['stubble','stubble','stache','horseshoe','beard','goatee','mutton','handlebar','walrus','pencil','scraggly','none','none']));
  const mask=o.mask!=null?o.mask:(!fem&&!boss&&chance(.14));
  let scar=o.scar!=null?o.scar:(chance(.28)?pick(['brow','cheek','lip']):false); if(scar===true) scar='brow';
  const patch=o.patch!=null?o.patch:(!fem&&!mask&&chance(.07));
  let smoke=o.smoke!=null?o.smoke:(!mask&&chance(.3)?pick(['cigar','cigarette','cigarette','toothpick','toothpick']):false); if(smoke===true) smoke='cigar';
  const mouth=o.mouth||(fem?'lips':pick(['grim','grim','smirk','smirk','sneer','grin']));
  const nose=o.nose||(fem?'button':pick(['straight','straight','straight','broken','hook','bulb']));
  const brows=o.brows||(fem?pick(['arched','flat','angry']):pick(['angry','angry','flat','cocked','worried']));
  const ey=Object.assign({open:fem?.78:rr(.5,.72),iris:pick(IRIS),gaze:0},o.eyes||{});
  const neck=o.neck||(fem?pick(['choker','none','scarf','none']):pick(['scarf','scarf','bolo','tie','none','none']));
  const vest=o.vest!==undefined?o.vest:(chance(.4)?pick(['#3a2a1e','#2a2a2e','#4a3a2a','#1e2a22','#5a2a22','#3a2440']):null);
  const bandolier=o.bandolier!=null?o.bandolier:(!fem&&!boss&&chance(.18));
  const badge=o.badge!=null?o.badge:(!boss&&chance(.04));
  const freckles=o.freckles!=null?o.freckles:(!boss&&chance(.12));
  const stubble=o.stubble!=null?o.stubble:(!fem&&(fh==='stubble'||(!boss&&fh!=='beard'&&chance(.25))));
  const band=o.band||pick(BAND), scarfC=o.scarf||pick(['#8a241a','#23497e','#b8913a','#2b6b3f','#5a1d6e','#7a2a1a']);
  const shirt=o.shirt||pick(SHIRT);
  const hairdo=o.hairdo||(fem?pick(['long','long','bun','braids','bob','ringlets']):(hat==='none'?pick(['crop','slick','bald','crop']):'crop'));
  const earring=o.earring!=null?o.earring:(fem&&chance(.6)?'hoop':false);
  const hw=o.hw||(fem?8.7:rr(8.7,9.8)), jaw=o.jaw!=null?o.jaw:(fem?0:r()*1.6);
  const tb=TIER_BG[o.tier]||(boss?[['#7a1c10','#160403'],'#ff8a5a']:human?[['#33454e','#05080a'],'#cfe6f0']:TIER_BG[pick(['d','g','v'])]);
  const bg=o.bg||tb[0], rim=o.rim||tb[1];
  const S=[];
  const add=(d,fill,x)=>{S.push(Object.assign({d,fill},x||{}));return S.length-1};
  const ink=(d,w,x)=>add(d,'none',Object.assign({stroke:INK,sw:w||1.3},x||{}));
  const line=(d,c,w,op,x)=>add(d,'none',Object.assign({stroke:c,sw:w,op},x||{}));
  const L=(x1,y1,x2,y2,stops)=>({lin:[x1,y1,x2,y2],stops:stops.map(s=>s.length===2?[s[0],s[1],1]:s)});
  const RG=(cx,cy,q,stops)=>({rad:[cx,cy,q],stops:stops.map(s=>s.length===2?[s[0],s[1],1]:s)});
  const fadeX=(x0,x1,a=1)=>L(x0,0,x1,0,[[0,'#fff',0],[1,'#fff',a]]);
  const rimOn=(d,ci,x0,x1,w,x)=>add(d,'none',Object.assign({stroke:rim,sw:w||1.8,clip:ci,fade:fadeX(x0,x1),op:.95},x||{}));
  const full='M0 0H64V64H0Z';
  const Lx=32-hw, Rx=32+hw, chinY=42.8+jaw*.3, mY=37.4+jaw*.25;
  const HT=(hat==='riding'?'translate(-3.6 .6) ':'')+`rotate(${+tilt.toFixed(2)} 32 21)`;

  /* ---------- backdrop: lamp glow, sunburst for the big names ---------- */
  add(full,RG(32,24,48,[[0,bg[0]],[1,bg[1]]]),{bg:1});
  if(boss||o.rays){let d='';for(let i=0;i<18;i++){const a0=i/18*Math.PI*2,a1=a0+Math.PI/18;d+=P`M32 22L${32+Math.cos(a0)*70} ${22+Math.sin(a0)*70}L${32+Math.cos(a1)*70} ${22+Math.sin(a1)*70}Z`} add(d,rim,{op:.08,cls:'pt-rays',bg:1})}
  add(full,RG(32,22,26,[[0,rim,.34],[1,rim,0]]),{bg:1});
  add(full,{pat:[1.4,.3,'#000'],kind:'dot'},{op:.16,bg:1});

  /* ---------- behind the head: long hair, mourning ribbons ---------- */
  const backHair=fem&&(hairdo==='long'||hairdo==='ringlets'||hairdo==='braids')?P`M${Lx-1.4} 26 C${Lx-1.8} 13 ${Rx+1.8} 13 ${Rx+1.4} 26 C${Rx+2.6} 36 ${Rx+3.8} 45 ${Rx+2.6} ${hairdo==='long'?55:50} C36 ${hairdo==='long'?57:52} 28 ${hairdo==='long'?57:52} ${Lx-2.6} ${hairdo==='long'?55:50} C${Lx-3.8} 45 ${Lx-2.6} 36 ${Lx-1.4} 26 Z`:null;
  if(backHair){ink(backHair,1.2); const bi=add(backHair,hair); add(backHair,L(Lx-3,0,Rx+3,0,[[0,'#fff',.14],[.5,'#000',0],[1,'#000',.55]]),{clip:bi}); line(P`M${Lx-.6} 32 C${Lx-1.2} 40 ${Lx-1.6} 46 ${Lx-1.4} 52 M${Rx+.6} 32 C${Rx+1.2} 40 ${Rx+1.8} 46 ${Rx+1.8} 52`,shade(hair,-.4),.45,.6)}
  if(o.longHair==='greasy'){const d=P`M${Lx-1} 22 C${Lx-2} 33 ${Lx-1.6} 42 ${Lx-3.4} 50 C${Lx+.6} 51.6 ${Lx+4} 50 ${Lx+4.6} 46 L${Rx-4.6} 46 C${Rx-4} 50 ${Rx-.6} 51.6 ${Rx+3.4} 50 C${Rx+1.6} 42 ${Rx+2} 33 ${Rx+1} 22 Z`; ink(d,1.2); const gi=add(d,hair); add(d,L(Lx-3,0,Rx+3,0,[[0,'#fff',.2],[.5,'#000',0],[1,'#000',.5]]),{clip:gi}); line(P`M${Lx+.2} 28 C${Lx-.4} 37 ${Lx-.6} 43 ${Lx-2} 49 M${Lx+1.6} 30 C${Lx+1.2} 38 ${Lx+1.6} 44 ${Lx+2.6} 48 M${Rx-.2} 28 C${Rx+.4} 37 ${Rx+.6} 43 ${Rx+2} 49 M${Rx-1.6} 30 C${Rx-1.2} 38 ${Rx-1.6} 44 ${Rx-2.6} 48`,shade(hair,-.45),.4,.7,{clip:gi}); line(P`M${Lx+.8} 26 C${Lx} 34 ${Lx} 40 ${Lx-1} 46`,'#fff6d8',.35,.35)}
  if(o.longHair==='side'){[-1,1].forEach(s=>{const x=s<0?Lx:Rx;const d=P`M${x-s*1.4} 21 C${x+s*1.2} 30 ${x+s*1.6} 39 ${x+s*1.2} 47 L${x-s*.8} 46 C${x-s*.4} 38 ${x-s*.6} 29 ${x-s*1.8} 22 Z`;ink(d,1);add(d,hair)})}
  if(o.crepe){const d='M24.6 19.6 C21.4 25 19.6 33 18.4 43 L20.6 43.6 L20.8 40 L22.6 44 C23 35 24.4 27 26.4 20.6 Z';ink(d,1);add(d,'#0a0909');line('M24.2 22 C22 28 21 34 20.4 40','#3a3838',.3,.6)}

  /* ---------- body: duster, shirt, vest, ties, gear ---------- */
  const bulk=o.bulk||0;
  const shD=fem?'M0 66C2 54.5 12 48.6 25.2 46.4L32 50L38.8 46.4C52 48.6 62 54.5 64 66Z':P`M-2 66C0 53 ${11-bulk} 47.2 24.2 45L32 50.5L39.8 45C${53+bulk} 47.2 64 53 66 66Z`;
  let ci;
  if(o.dress){ // bare shoulders, neckline of a dress
    ink(shD,1.3); const si=add(shD,skin); add(shD,L(0,50,64,50,[[0,skinL,.3],[.45,'#000',0],[1,skinDD,.6]]),{clip:si});
    line('M27 49.6 C29 51 35 51 37 49.6',skinD,.5,.6);
    const dr=P`M-1 66 C0 56 5 50.4 13.4 49 C18 51.8 23 54.2 32 54.4 C41 54.2 46 51.8 50.6 49 C59 50.4 64 56 65 66 Z`;
    ink(dr,1.2); ci=add(dr,L(0,52,0,66,[[0,o.dress],[1,shade(o.dress,-.6)]])); add(dr,L(0,58,64,58,[[0,'#fff',.14],[.5,'#000',0],[1,'#000',.5]]),{clip:ci});
    const nl='M13.4 49 C18 51.8 23 54.2 32 54.4 C41 54.2 46 51.8 50.6 49'; line(nl,'#0a0606',1.6,1,{dash:'.8 .45'}); line(nl,'#0a0606',.7,1); line('M10 52.6 C9 56 9.4 60 10.6 64 M54 52.6 C55 56 54.6 60 53.4 64','#000',.6,.35);
    line('M22.6 48.6 C25 49.4 27.6 49.2 29.4 48.2 M41.4 48.6 C39 49.4 36.4 49.2 34.6 48.2',skinDD,.4,.45);
    rimOn(dr,ci,44,62);
  } else {
    ink(shD,1.4); ci=add(shD,L(10,46,54,66,[[0,coat],[1,shade(coat,-.6)]]));
    add(shD,L(0,50,64,50,[[0,'#fff',.13],[.45,'#000',0],[1,'#000',.5]]),{clip:ci});
    rimOn(shD,ci,44,62);
    if(o.shawl){const d='M0 66 C3 56 11 50 22 47.2 C26 51 29 53 32 54 C35 53 38 51 42 47.2 C53 50 61 56 64 66 Z'; ink(d,1.2); const wi=add(d,o.shawl); add(d,L(0,52,64,52,[[0,'#fff',.1],[.5,'#000',0],[1,'#000',.5]]),{clip:wi}); add(d,{pat:[1.4,.22,'#e8c890'],kind:'net'},{clip:wi,op:.16}); line('M3 64 C7 58 14 53 22 50.6 M61 64 C57 58 50 53 42 50.6','#e8c890',.5,.35,{dash:'.3 .7'}); rimOn(d,wi,44,62)}
    else if(o.collar==='lace'){ // high-necked blouse
      const d='M22.6 46.6 C25 45 26.6 41 27.6 37 L36.4 37 C37.4 41 39 45 41.4 46.6 L38 58 L26 58 Z'; add(d,'#e6dccb'); line('M27.4 38.6 C30 39.6 34 39.6 36.6 38.6','#b8a890',.5,.8,{dash:'.4 .4'});
    } else if(o.collar==='wing'){
      add('M26.8 44.4 L32 58 L37.2 44.4 Z','#ebe6da'); add('M26.8 44.4 L32 58 L37.2 44.4 Z',L(0,44,0,58,[[0,'#000',.25],[1,'#000',0]]));
    } else if(o.collar==='preacher'){
      add('M24 45 L32 51 L40 45 L37 44.5 L32 47 L27 44.5 Z','#111'); add('M30.5 46 L33.5 46 L33.2 48.4 L30.8 48.4 Z','#f2efe6');
    } else {
      const opening='M27.2 45 L32 51.2 L36.8 45 L40.6 66 L23.4 66 Z';
      const oi=add(opening,L(0,45,0,66,[[0,shirt],[1,shade(shirt,-.45)]]));
      add(opening,L(23,0,41,0,[[0,'#000',0],[.55,'#000',0],[1,'#000',.35]]),{clip:oi});
      line('M32 51 L32 66','#000',.4,.25); // placket
      if(o.suspenders){line('M28.4 48 L27 66 M35.6 48 L37 66',o.suspenders===true?'#5a2a1a':o.suspenders,1.3,1); line('M28.4 48 L27 66 M35.6 48 L37 66','#000',1.3,.25,{dash:'.2 1.6'})}
      if(vest){const vl='M27.2 45 L32 56.4 L32 66 L23.4 66 Z', vr='M36.8 45 L32 56.4 L32 66 L40.6 66 Z';
        [vl,vr].forEach((d,k)=>{const vi=add(d,L(0,46,0,66,[[0,vest],[1,shade(vest,-.55)]])); if(o.vestPattern) add(d,{pat:[1.8,.35,shade(vest,.35)],kind:'scale'},{clip:vi,op:.5}); if(k) add(d,'#000',{op:.25})});
        ink('M32 56.4 L32 66',.5); [58.6,61.6,64.6].forEach(y=>{add(E(33,y,.55),RG(32.8,y-.2,.6,[[0,'#fff2c0'],[1,'#a07a2a']]))});
      }
      if(o.watch){line('M33.4 58.2 C35.8 61.6 39.2 61.4 41.2 58.4','#e8c060',.5,1); add(E(41.2,58.4,.7),'#e8c060')}
    }
    // upturned collar, lapels
    if(!o.shawl&&!o.dress&&o.collar!=='lace'){
      const cl='M24.4 45.4 C23.2 43 23.8 40.4 25.8 39.2 L28.6 45.8 Z', cr='M39.6 45.4 C40.8 43 40.2 40.4 38.2 39.2 L35.4 45.8 Z';
      if(o.collar!=='preacher'){ink(cl,1);add(cl,shade(coat,.08));ink(cr,1);add(cr,shade(coat,-.35))}
      const ll='M24.3 45 L27.3 45.1 L30.4 54.6 L27.2 52.4 L24.6 56.4 L22.8 49.6 Z', lr='M39.7 45 L36.7 45.1 L33.6 54.6 L36.8 52.4 L39.4 56.4 L41.2 49.6 Z';
      if(o.collar!=='preacher'&&o.collar!=='wing'||o.collar==='wing'){ink(ll,.9);add(ll,shade(coat,.1));ink(lr,.9);add(lr,shade(coat,-.3)); line('M27.3 45.1 L30.4 54.6','#fff',.35,.18)}
    }
  }
  // bandolier across the chest
  if(bandolier){const ax=16.5,ay=48.2,bx=47,by=67,ux=(bx-ax),uy=(by-ay),ln=Math.hypot(ux,uy),u=[ux/ln,uy/ln],n=[u[1],-u[0]];
    line(P`M${ax} ${ay} L${bx} ${by}`,'#3a2414',3.6,1,{clip:ci}); line(P`M${ax} ${ay} L${bx} ${by}`,'#000',3.6,.25,{clip:ci,dash:'.25 2.2'});
    for(let t=.1;t<.95;t+=.085){const px=ax+ux*t,py=ay+uy*t,q=(a,b)=>[px+u[0]*a+n[0]*b,py+u[1]*a+n[1]*b];
      const c=[q(-.42,-1.2),q(.42,-1.2),q(.42,1.3),q(-.42,1.3)], tip=[q(-.42,1.3),q(.42,1.3),q(0,2.3)];
      add('M'+c.map(p=>p.map(v=>+v.toFixed(2)).join(' ')).join('L')+'Z',L(0,40,0,66,[[0,'#f2cf72'],[1,'#9a6a22']]),{clip:ci});
      add('M'+tip.map(p=>p.map(v=>+v.toFixed(2)).join(' ')).join('L')+'Z','#c27a44',{clip:ci})}
  }
  if(badge){ink(STAR(42.6,56,2.5,1.1),.9); add(STAR(42.6,56,2.5,1.1),RG(42,55.2,2.6,[[0,'#fbf4e0'],[1,'#8a8a86']])); add(E(42.6,56,.55),'#6a6a66')}

  /* ---------- neck ---------- */
  const nw=o.neckW||(fem?3.5:4.3+(hw-9.2)*.6);
  const neckD=P`M${32-nw} 35 L${32-nw-.4} 46.8 L${32+nw+.4} 46.8 L${32+nw} 35 Z`;
  if(o.collar!=='lace'){
    ink(P`M${32-nw} 35 L${32-nw-.4} 46.8 M${32+nw} 35 L${32+nw+.4} 46.8`,1.1);
    const ni=add(neckD,skin); add(neckD,L(0,37,0,46,[[0,'#000',.55],[1,'#000',.1]]),{clip:ni}); add(neckD,L(32-nw,0,32+nw,0,[[0,'#000',0],[.55,'#000',0],[1,'#000',.4]]),{clip:ni});
    if(!fem) line('M32.6 41.6 C32.9 42.4 32.9 43.2 32.6 43.8',skinDD,.4,.5);
    if(o.tattoo){line(P`M${32+nw-.6} 46 C${32+nw-2.4} 44.6 ${32+nw+.2} 42.6 ${32+nw-1.4} 41 C${32+nw-2.6} 39.8 ${32+nw-.8} 38.4 ${32+nw-1.8} 37.6`,'#1e3a3a',.65,.85,{clip:ni}); add(E(32+nw-1.9,37.5,.5,.35),'#1e3a3a',{op:.85})}
  }
  // neckwear
  if(o.collar==='wing'){
    add('M27.4 41.6 L32 44 L36.6 41.6 L37.4 45.6 L32 46.6 L26.6 45.6 Z','#efebe0'); ink('M27.4 41.6 L32 44 L36.6 41.6',.5);
    add('M29.6 44.6 L32 46 L34.4 44.6 L34.2 47.6 L32 46.8 L29.8 47.6 Z',o.cravat||'#0a0a0a'); add('M31 46 L33 46 L33.6 53 L32 54.4 L30.4 53 Z',o.cravat||'#0a0a0a');
  }
  if(o.collar==='lace'){
    const d=P`M${32-nw-.6} 47 L${32-nw} 36.4 C30 37.6 34 37.6 ${32+nw} 36.4 L${32+nw+.6} 47 Z`; ink(d,.9); const li=add(d,'#ece2d0'); add(d,L(0,0,64,0,[[.4,'#000',0],[.62,'#000',.32]]),{clip:li});
    line(P`M${32-nw} 36.6 C30 37.8 34 37.8 ${32+nw} 36.6`,'#fff',.9,.9,{dash:'.5 .4'}); [39.6,42.2,44.8].forEach(y=>line(P`M${32-nw-.2} ${y} C30 ${y+1} 34 ${y+1} ${32+nw+.2} ${y}`,'#b0a088',.35,.7));
    if(o.brooch){ink(E(32,44.4,1.5,1.9),.8); add(E(32,44.4,1.5,1.9),RG(31.6,43.8,2,[[0,'#f4dc8a'],[1,'#8a6420']])); add(E(32,44.4,.95,1.3),'#f0e6dc'); add('M31.6 43.4 C32.4 43.2 32.8 44 32.4 44.6 C32.8 45 32.2 45.6 31.6 45.4 C31.2 44.8 31.8 44.4 31.4 44 Z','#5a2a3a',{op:.8})}
  }
  if(neck==='scarf'&&!mask&&!o.collar){const k=P`M${32-nw-.8} 43.4 C29.6 46.4 34.4 46.4 ${32+nw+.8} 43.4 L${32+nw-.2} 47.6 C34.6 49.4 29.4 49.4 ${32-nw+.2} 47.6 Z`, t='M29.4 47.8 L32 54.6 L34.6 47.8 Z';
    ink(t,.9); const ti=add(t,scarfC); add(t,L(29,0,35,0,[[0,'#fff',.12],[1,'#000',.4]]),{clip:ti});
    ink(k,.9); const ki=add(k,scarfC); add(k,L(0,43,0,49,[[0,'#fff',.12],[1,'#000',.45]]),{clip:ki}); add(k,{pat:[1.5,.28,'#f4e6c8'],kind:'dot'},{clip:ki,op:.35}); add(t,{pat:[1.5,.28,'#f4e6c8'],kind:'dot'},{clip:ti,op:.35});}
  if(neck==='bolo'&&!o.collar){line('M29.8 45.4 L31.3 54.4 M34.2 45.4 L32.7 54.4','#1a0e08',.4,1); add(E(32,48.4,1.2,1.5),RG(31.6,47.9,1.6,[[0,'#f0f0ea'],[1,'#7a7a74']])); add(E(32,48.4,.65,.85),'#3fa0a0'); add(E(31.3,54.6,.3,.5),'#c8c8c0'); add(E(32.7,54.6,.3,.5),'#c8c8c0')}
  if(neck==='tie'&&!o.collar){const c=o.tieC||'#1a1210'; add('M32 46 L28.6 44.6 L28.8 47.6 Z',c); add('M32 46 L35.4 44.6 L35.2 47.6 Z',c); add(E(32,46.1,.7),c); line('M31.6 46.6 L30.6 52 M32.4 46.6 L33.4 52',c,.6,1)}
  if(o.cravat&&o.collar!=='wing'){const d='M29.2 44.4 C30.4 47.2 33.6 47.2 34.8 44.4 L34.4 50.4 C33.4 52.8 30.6 52.8 29.6 50.4 Z'; ink(d,.9); const ri=add(d,o.cravat); add(d,L(29,0,35,0,[[0,'#fff',.25],[.5,'#fff',0],[1,'#000',.35]]),{clip:ri}); line('M30.4 47.6 C31.4 48.6 32.6 48.6 33.6 47.6','#000',.35,.4); if(o.pin){add(E(32,49.2,.55),'#fff'); add('M32 47.6 L32.3 49 L33.6 49.2 L32.3 49.4 L32 50.8 L31.7 49.4 L30.4 49.2 L31.7 49 Z','#fff',{cls:'pt-glint'})}}
  if(neck==='choker'||o.choker){const d=P`M${32-nw-.1} 40.6 C30 41.6 34 41.6 ${32+nw+.1} 40.6 L${32+nw+.2} 42 C34 43 30 43 ${32-nw-.2} 42 Z`; add(d,'#0c0808'); add(d,{pat:[.9,.18,'#5a4a4a'],kind:'net'},{op:.8}); ink(E(32,43.6,.9,1.2),.6); add(E(32,43.6,.9,1.2),RG(31.7,43.2,1.2,[[0,'#ff6a7a'],[1,'#7a0614']]),{cls:'pt-glint'})}
  if(o.tape){line('M27.4 45 C26.4 51 25.6 58 25 66','#d6c07a',2,1); line('M27.4 45 C26.4 51 25.6 58 25 66',INK,2,.75,{dash:'.14 .7'}); line('M36.6 45 C37.8 51 38.8 56 38.6 61.6','#d6c07a',2,1); line('M36.6 45 C37.8 51 38.8 56 38.6 61.6',INK,2,.75,{dash:'.14 .7'}); add('M37.4 61.4 L39.8 61.8 L39.6 63.4 L37.2 63 Z','#b8b8b0'); line('M28.2 44.2 C30.4 45.6 33.6 45.6 35.8 44.2','#d6c07a',1.8,1)}

  /* ---------- ears, head ---------- */
  [-1,1].forEach(s=>{const x=s<0?Lx:Rx; const d=P`M${x-s*.3} 27.2 C${x+s*2.3} 26 ${x+s*2.7} 31.8 ${x-s*.1} 33.1 Z`; ink(d,1); add(d,s<0?skin:skinD); line(P`M${x+s*.5} 28.4 C${x+s*1.8} 28.6 ${x+s*1.6} 31 ${x+s*.4} 31.8`,skinDD,.45,.6);
    if(earring==='hoop') line(E(x+s*.7,34.2,.75,.95),'#e8c060',.4,1); if(earring==='drop'){line(P`M${x+s*.6} 33 L${x+s*.6} 34.4`,'#e8c060',.3,1); add(E(x+s*.6,35.4,.55,.8),RG(x+s*.5,35.1,.9,[[0,'#ff6a7a'],[1,'#6a0612']]),{cls:'pt-glint'})}
    if(earring==='fang'&&s>0){line(P`M${x+s*.6} 33 L${x+s*.6} 33.8`,'#e8c060',.3,1); add(P`M${x+s*.2} 33.8 L${x+s} 33.8 L${x+s*.6} 36 Z`,'#efe6cc')}});
  const head=P`M${Lx} 26 C${Lx} 19 ${32-hw*.57} 15.4 32 15.4 C${32+hw*.57} 15.4 ${Rx} 19 ${Rx} 26 C${Rx} ${31+jaw} ${Rx-.6+jaw*.2} ${34.5+jaw*.6} ${Rx-2.8+jaw*.4} ${38.4+jaw*.5} C${32+hw*.5} ${41.4+jaw*.4} ${32+hw*.26} ${chinY} 32 ${chinY} C${32-hw*.26} ${chinY} ${32-hw*.5} ${41.4+jaw*.4} ${Lx+2.8-jaw*.4} ${38.4+jaw*.5} C${Lx+.6-jaw*.2} ${34.5+jaw*.6} ${Lx} ${31+jaw} ${Lx} 26 Z`;
  ink(head,1.5); const hi=add(head,skin);
  add(head,L(Lx,0,Rx,0,[[0,skinL,.6],[.4,skin,0],[.68,skinD,.55],[1,skinDD,.75]]),{clip:hi});
  add(head,{pat:[1.1,.3,skinDD],kind:'dot'},{clip:hi,fade:fadeX(35,Rx+.5,.7)});
  add(P`M${Lx} 36 C${Lx+3} ${chinY+.4} ${Rx-3} ${chinY+.4} ${Rx} 36 L${Rx} 48 L${Lx} 48 Z`,'#000',{op:.14,clip:hi});
  // cheekbones
  add(P`M${Rx-4.6} 32.4 C${Rx-2.8} 33.8 ${Rx-1} 33.6 ${Rx-.3} 31.6 C${Rx-.7} 35.6 ${Rx-2.2} 38 ${Rx-4.2} 39.6 C${Rx-4.6} 37 ${Rx-4.8} 34.6 ${Rx-4.6} 32.4 Z`,skinDD,{op:o.gaunt?.55:.22,clip:hi});
  add(P`M${Lx+4.6} 32.4 C${Lx+2.8} 33.8 ${Lx+1} 33.6 ${Lx+.3} 31.6 C${Lx+.7} 35.6 ${Lx+2.2} 38 ${Lx+4.2} 39.6 C${Lx+4.6} 37 ${Lx+4.8} 34.6 ${Lx+4.6} 32.4 Z`,skinDD,{op:o.gaunt?.4:.1,clip:hi});
  if(o.gaunt){add(E(Lx+1.4,23,1.6,3),skinDD,{op:.3,clip:hi}); add(E(Rx-1.4,23,1.6,3),skinDD,{op:.45,clip:hi})}
  if(o.chin2) line(P`M28.4 ${chinY+.4} C30 ${chinY+2} 34 ${chinY+2} 35.6 ${chinY+.4}`,skinDD,.6,.6);
  if(o.jowls){line(P`M${Lx+2.2} 35 C${Lx+2.6} 38 ${Lx+4} 40 ${Lx+5.6} 40.8`,skinDD,.5,.55); line(P`M${Rx-2.2} 35 C${Rx-2.6} 38 ${Rx-4} 40 ${Rx-5.6} 40.8`,skinDD,.5,.7)}
  // age lines
  if(age>=1){line(P`M29.6 ${mY-3.6} C28.8 ${mY-2.2} 28.6 ${mY-1} 28.8 ${mY+.2} M34.4 ${mY-3.6} C35.2 ${mY-2.2} 35.4 ${mY-1} 35.2 ${mY+.2}`,skinDD,.45,.55,{clip:hi}); line('M23.6 29.2 L22.6 28.6 M23.8 30.2 L22.7 30.4 M40.4 29.2 L41.4 28.6 M40.2 30.2 L41.3 30.4',skinDD,.35,.6,{clip:hi})}
  if(age>=2){line('M26.6 31.4 C27.6 32.2 29 32.2 30 31.4 M37.4 31.4 C36.4 32.2 35 32.2 34 31.4',skinDD,.4,.6); line('M27 19.6 C30 18.8 34 18.8 37 19.6 M27.6 21.4 C30 20.8 34 20.8 36.4 21.4',skinDD,.35,.45,{clip:hi})}
  if(o.rosy||o.rouge){add(E(26.6,33.2,2.6,1.8),RG(26.6,33.2,2.6,[[0,o.rosy?'#e0504a':'#d06a7a',o.rosy?.55:.4],[1,'#e0504a',0]])); add(E(37.4,33.2,2.6,1.8),RG(37.4,33.2,2.6,[[0,o.rosy?'#e0504a':'#d06a7a',o.rosy?.5:.35],[1,'#e0504a',0]]))}
  if(freckles){for(let k=0;k<12;k++){const x=k<6?rr(26,30):rr(34,38.4),y=rr(30.6,33.2);add(E(x,y,.22),skinDD,{op:.6})}}
  if(o.veins) line('M31.4 31.6 L30.6 32.4 M33 31.6 L33.8 32.6 M32.2 31 L32.4 30.2','#b0302a',.2,.7);

  /* ---------- nose ---------- */
  const noseTip=34.2;
  if(nose==='bulb'){add(E(32.1,33.2,2.1,1.8),RG(31.4,32.6,2.6,[[0,o.redNose?'#e4685a':skinL],[1,o.redNose?'#9a2a22':skinD]])); ink(P`M30 33.9 C30.6 35.3 33.6 35.3 34.2 33.9`,.6); add(E(31.3,32.4,.55,.4),'#fff',{op:.5}); if(o.veins) line('M32.6 32.4 L33.4 32.9 M31.2 33.6 L30.8 34.1','#7a1a14',.2,.8)}
  else {
    const bridge=nose==='hook'?P`M32.6 27.6 C33.8 29.8 34.4 31 34 ${noseTip-.4}`:nose==='broken'?P`M32.4 27.6 L33.2 29.8 L32.6 30.8 C33.6 32 34 33 33.8 ${noseTip-.4}`:P`M32.6 27.6 C33 30 33.6 32.4 33.7 ${noseTip-.4}`;
    line(bridge,skinDD,.75,.55);
    add(P`M32.3 28.4 C32.8 31 33.6 33 34 ${noseTip} C33.1 ${noseTip+.6} 31.7 ${noseTip+.6} 30.9 ${noseTip} C31.7 33.4 32.1 31 32.3 28.4 Z`,'#000',{op:.2});
    ink(P`M30.4 ${noseTip-.2} C30.8 ${noseTip+.9} 33.2 ${noseTip+.9} 33.8 ${noseTip-.3}`,nose==='button'?.4:.55,{op:.8});
    add(E(31.6,noseTip-.9,.5,.45),'#fff',{op:.32});
    if(nose==='broken') line('M32.2 29.6 L33.4 29.9','#7a2a20',.3,.6);
  }
  if(o.redNose&&nose!=='bulb') add(E(32.2,33.2,1.8,1.4),'#c0443a',{op:.4});

  /* ---------- mouth ---------- */
  const lipC=shade(skinD,-.25);
  if(mouth==='lips'){const lc=o.lips||'#8e2a22'; const up=P`M29.2 ${mY} C30.2 ${mY-.9} 31.4 ${mY-1.1} 32 ${mY-.6} C32.6 ${mY-1.1} 33.8 ${mY-.9} 34.8 ${mY} C33.4 ${mY+.15} 30.6 ${mY+.15} 29.2 ${mY} Z`, lo=P`M29.2 ${mY} C30.6 ${mY+.25} 33.4 ${mY+.25} 34.8 ${mY} C34 ${mY+1.6} 30 ${mY+1.6} 29.2 ${mY} Z`;
    add(up,shade(lc,-.2)); add(lo,lc); add(E(31.6,mY+.75,.9,.32),'#fff',{op:.35}); ink(P`M29 ${mY} C30.6 ${mY+.3} 33.4 ${mY+.3} 35 ${mY}`,.4)}
  else if(mouth==='pursed'){add(P`M30.4 ${mY} C31.2 ${mY-.6} 32.8 ${mY-.6} 33.6 ${mY} C32.8 ${mY+.9} 31.2 ${mY+.9} 30.4 ${mY} Z`,o.lips||lipC); ink(P`M30.2 ${mY} C31.4 ${mY+.2} 32.6 ${mY+.2} 33.8 ${mY}`,.45); line(P`M30.6 ${mY-.8} L30.3 ${mY-1.8} M31.6 ${mY-.9} L31.5 ${mY-2} M32.6 ${mY-.9} L32.7 ${mY-2} M33.5 ${mY-.8} L33.8 ${mY-1.8} M29.6 ${mY+.4} L28.8 ${mY+1.1} M34.4 ${mY+.4} L35.2 ${mY+1.1}`,skinDD,.3,.6)}
  else if(mouth==='grin'||mouth==='clench'){const op=mouth==='clench'?.9:1.9; const md=P`M28.8 ${mY-.4} C30.6 ${mY+.1} 33.4 ${mY+.1} 35.2 ${mY-.7} C34.4 ${mY+op} 29.8 ${mY+op} 28.8 ${mY-.4} Z`;
    ink(md,.6); const mi=add(md,'#2a0a06'); add(P`M28.8 ${mY-.4} C30.6 ${mY+.1} 33.4 ${mY+.1} 35.2 ${mY-.7} L35.2 ${mY+.65} C33.4 ${mY+1.1} 30.6 ${mY+1.1} 28.8 ${mY+.7} Z`,'#efe4c6',{clip:mi});
    line(P`M30.4 ${mY-.2} L30.4 ${mY+1} M31.6 ${mY} L31.6 ${mY+1.1} M32.8 ${mY} L32.8 ${mY+1.1} M34 ${mY-.2} L34 ${mY+1}`,'#8a7a5a',.2,.8,{clip:mi});
    if(o.goldTooth) add(P`M32.8 ${mY-.2} L34 ${mY-.4} L34 ${mY+1} L32.8 ${mY+1.1} Z`,RG(33.2,mY,1.4,[[0,'#fff2a0'],[1,'#b8861a']]),{clip:mi,cls:'pt-glint'});
    if(o.missingTooth) add(P`M30.4 ${mY-.2} L31.6 ${mY} L31.6 ${mY+1.1} L30.4 ${mY+1} Z`,'#2a0a06',{clip:mi});
    line(P`M29.6 ${mY+op+.2} C31 ${mY+op+.9} 33 ${mY+op+.9} 34.4 ${mY+op+.1}`,skinDD,.4,.45)}
  else if(mouth==='sneer'){const md=P`M29 ${mY+.2} C30.6 ${mY+.4} 32.2 ${mY+.2} 33.2 ${mY-.4} C34 ${mY-1.2} 35 ${mY-1.3} 35.6 ${mY-.8} C35.2 ${mY+.6} 33.6 ${mY+1} 32.2 ${mY+.8} C31 ${mY+.7} 29.8 ${mY+.6} 29 ${mY+.2} Z`;
    ink(md,.55); const mi=add(md,'#2a0a06'); add(P`M32.6 ${mY-.3} L35.4 ${mY-1} L35.4 ${mY+.1} L32.6 ${mY+.5} Z`,'#efe4c6',{clip:mi});
    if(o.goldTooth) add(P`M33.6 ${mY-.6} L34.6 ${mY-.9} L34.6 ${mY+.3} L33.6 ${mY+.5} Z`,RG(34,mY-.3,1.2,[[0,'#fff2a0'],[1,'#b8861a']]),{clip:mi,cls:'pt-glint'});
    line(P`M35.4 ${mY-1.6} C35.9 ${mY-2.4} 35.6 ${mY-3.2} 34.8 ${mY-3.6}`,skinDD,.4,.6); line(P`M29.6 ${mY+1.4} C31 ${mY+2} 33 ${mY+2} 34.2 ${mY+1.4}`,skinDD,.4,.4)}
  else if(mouth==='thin'){ink(P`M28.8 ${mY+.2} C30.6 ${mY-.1} 33.4 ${mY-.1} 35.2 ${mY+.4}`,.55); line(P`M29.4 ${mY+.9} C31 ${mY+1.2} 33 ${mY+1.2} 34.6 ${mY+.9}`,skinDD,.3,.5); line(P`M30 ${mY-.4} L30 ${mY+.8} M31.2 ${mY-.5} L31.2 ${mY+.8} M32.4 ${mY-.5} L32.4 ${mY+.8} M33.6 ${mY-.4} L33.6 ${mY+.8}`,'#3a3a34',.18,.5)}
  else if(mouth==='smirk'){ink(P`M29.2 ${mY+.3} C31 ${mY+.5} 33 ${mY+.1} 35.2 ${mY-1}`,.65); add(P`M29.6 ${mY+.6} C31 ${mY+1.6} 33.4 ${mY+1.2} 34.6 ${mY+.2} C33.6 ${mY+.8} 31.2 ${mY+1} 29.6 ${mY+.6} Z`,lipC,{op:.6}); line(P`M35.4 ${mY-1.4} C35.7 ${mY-1.9} 35.6 ${mY-2.4} 35.2 ${mY-2.8}`,skinDD,.35,.6)}
  else {ink(P`M29 ${mY+.1} C30.8 ${mY+.35} 33.2 ${mY+.35} 35 ${mY-.1}`,.65); add(P`M29.6 ${mY+.5} C31 ${mY+1.5} 33 ${mY+1.5} 34.4 ${mY+.4} C33.4 ${mY+.9} 30.6 ${mY+.9} 29.6 ${mY+.5} Z`,lipC,{op:.55})}

  /* ---------- facial hair ---------- */
  const fhc=GREY.includes(hair)?shade(hair,-.08):hair, fhD=shade(fhc,-.45), fhL=shade(fhc,.3);
  const stub=P`M${Lx+.8} 31 C${Lx+1.2} ${38+jaw} 28 ${chinY+.6} 32 ${chinY+.6} C36 ${chinY+.6} ${Rx-1.2} ${38+jaw} ${Rx-.8} 31 C${Rx-1.8} 35 ${Rx-3.6} 36.2 36 36.2 C35 34.8 29 34.8 28 36.2 C${Lx+3.6} 36.2 ${Lx+1.8} 35 ${Lx+.8} 31 Z`;
  if(stubble){add(stub,fhc,{op:.18,clip:hi}); add(stub,{pat:[.6,.13,fhD],kind:'dot'},{op:.7,clip:hi})}
  const hairy=(d,strands,cl)=>{ink(d,.9); const i=add(d,fhc,cl); add(d,L(Lx,0,Rx,0,[[0,fhL,.5],[.5,fhc,0],[1,'#000',.45]]),{clip:i}); if(strands) line(strands,fhD,.3,.75,{clip:i}); return i};
  if(fh==='beard'||fh==='scraggly'){const by=chinY+(fh==='scraggly'?3.6:2.2);
    const d=fh==='scraggly'?P`M${Lx+.6} 30.6 C${Lx+.8} ${36+jaw} ${Lx+2.2} ${39+jaw} ${Lx+4} ${by-.4}`+(()=>{let z='';for(let k=1;k<9;k++){const x=Lx+4+(Rx-Lx-8)*k/9;z+=P` L${x} ${by+(k%2?1.6:-.1)+Math.sin(k*2.3)*.35}`}return z})()+P` L${Rx-4} ${by-.4} C${Rx-2.2} ${39+jaw} ${Rx-.8} ${36+jaw} ${Rx-.6} 30.6 C${Rx-2} 35.4 37.4 37.8 35.6 ${mY+.9} C34.4 ${mY+1.8} 29.6 ${mY+1.8} 28.4 ${mY+.9} C26.6 37.8 ${Lx+2} 35.4 ${Lx+.6} 30.6 Z`
      :P`M${Lx+.6} 30.8 C${Lx+.8} ${39+jaw} 28 ${by+.6} 32 ${by+.6} C36 ${by+.6} ${Rx-.8} ${39+jaw} ${Rx-.6} 30.8 C${Rx-2} 35.6 37.2 38 35.6 ${mY+.9} C34.4 ${mY+1.8} 29.6 ${mY+1.8} 28.4 ${mY+.9} C26.8 38 ${Lx+2} 35.6 ${Lx+.6} 30.8 Z`;
    hairy(d,P`M26 37 L26.6 ${by-1} M28.4 39.4 L29 ${by} M31 40.4 L31 ${by+.4} M33.4 40.4 L33.6 ${by+.2} M36 39.4 L35.6 ${by-.2} M38.4 37 L37.8 ${by-1.4} M${Lx+1.6} 32 L${Lx+2.4} 37`)}
  if(fh==='goatee') hairy(P`M30.4 ${mY+1} C30.6 ${mY+3.6} 31.4 ${mY+5} 32 ${mY+5.8} C32.6 ${mY+5} 33.4 ${mY+3.6} 33.6 ${mY+1} C33 ${mY+1.6} 31 ${mY+1.6} 30.4 ${mY+1} Z`,P`M31.2 ${mY+1.6} L31.6 ${mY+4} M32.8 ${mY+1.6} L32.4 ${mY+4}`);
  if(fh==='pencil+goatee') hairy(P`M31.3 ${mY+1.3} C31.5 ${mY+3.4} 31.8 ${mY+5.4} 32 ${mY+6.6} C32.2 ${mY+5.4} 32.5 ${mY+3.4} 32.7 ${mY+1.3} C32.3 ${mY+1.6} 31.7 ${mY+1.6} 31.3 ${mY+1.3} Z`,'');
  if(fh==='stache'||fh==='beard'||fh==='goatee'||fh==='scraggly') hairy(P`M27.6 ${mY-.2} C28.8 ${mY-2.9} 35.2 ${mY-2.9} 36.4 ${mY-.2} C34.8 ${mY-1} 33 ${mY-.8} 32 ${mY-.3} C31 ${mY-.8} 29.2 ${mY-1} 27.6 ${mY-.2} Z`,P`M29.4 ${mY-1.6} L29 ${mY-.6} M30.8 ${mY-1.9} L30.6 ${mY-.8} M33.2 ${mY-1.9} L33.4 ${mY-.8} M34.6 ${mY-1.6} L35 ${mY-.6}`);
  if(fh==='pencil'||fh==='pencil+goatee'){ink(P`M29 ${mY-1} C30.4 ${mY-1.8} 31.4 ${mY-1.4} 32 ${mY-1.2} C32.6 ${mY-1.4} 33.6 ${mY-1.8} 35 ${mY-1}`,.5,{stroke:fhc})}
  if(fh==='handlebar'){const d=P`M27.2 ${mY-2.6} C26.2 ${mY-2.2} 26.2 ${mY-3.6} 27 ${mY-3.8} C26.4 ${mY-2.6} 27.6 ${mY-1.8} 29 ${mY-2.2} C30.4 ${mY-2.6} 31.4 ${mY-2.2} 32 ${mY-1.6} C32.6 ${mY-2.2} 33.6 ${mY-2.6} 35 ${mY-2.2} C36.4 ${mY-1.8} 37.6 ${mY-2.6} 37 ${mY-3.8} C37.8 ${mY-3.6} 37.8 ${mY-2.2} 36.8 ${mY-2.6} C35.6 ${mY-.6} 33.4 ${mY-.4} 32 ${mY-1} C30.6 ${mY-.4} 28.4 ${mY-.6} 27.2 ${mY-2.6} Z`; hairy(d,'')}
  if(fh==='walrus') hairy(P`M26.8 ${mY-.2} C27.2 ${mY-3.4} 30.6 ${mY-3.8} 32 ${mY-2.8} C33.4 ${mY-3.8} 36.8 ${mY-3.4} 37.2 ${mY-.2} C36.8 ${mY+1.8} 36.2 ${mY+2.8} 35.4 ${mY+3.2} C35 ${mY+1.2} 34 ${mY+.4} 32 ${mY+.6} C30 ${mY+.4} 29 ${mY+1.2} 28.6 ${mY+3.2} C27.8 ${mY+2.8} 27.2 ${mY+1.8} 26.8 ${mY-.2} Z`,P`M28.4 ${mY-1.8} L28.2 ${mY+1.8} M29.8 ${mY-2.4} L29.4 ${mY+.4} M31.2 ${mY-2.4} L31 ${mY+.2} M32.8 ${mY-2.4} L33 ${mY+.2} M34.2 ${mY-2.4} L34.6 ${mY+.4} M35.6 ${mY-1.8} L35.8 ${mY+1.8}`);
  if(fh==='horseshoe') hairy(P`M28 ${mY-.2} C28.6 ${mY-3} 35.4 ${mY-3} 36 ${mY-.2} L36.4 ${mY+4.8} L35 ${mY+4.8} L34.7 ${mY+.2} C33.2 ${mY-.8} 30.8 ${mY-.8} 29.3 ${mY+.2} L29 ${mY+4.8} L27.6 ${mY+4.8} Z`,P`M28.6 ${mY} L28.4 ${mY+4.4} M35.4 ${mY} L35.6 ${mY+4.4} M30.4 ${mY-1.6} L30.2 ${mY-.6} M33.6 ${mY-1.6} L33.8 ${mY-.6}`);
  if(fh==='mutton'){[-1,1].forEach(s=>{const x=s<0?Lx:Rx; hairy(P`M${x} 25.6 L${x+s*.1} 34.8 C${x-s*1.2} 38 ${x-s*3.8} 37.6 ${x-s*4.6} 35.4 L${x-s*2.2} 30.4 L${x-s*1.4} 25.6 Z`,P`M${x-s*.6} 28 L${x-s*.9} 34.6 M${x-s*1.8} 31 L${x-s*2.6} 36`)}); hairy(P`M28.2 ${mY-.4} C29.4 ${mY-2.4} 34.6 ${mY-2.4} 35.8 ${mY-.4} C34 ${mY-1} 30 ${mY-1} 28.2 ${mY-.4} Z`,'')}
  if(o.beautyMark) add(E(35.3,34.6,.32),'#2a120a');

  /* ---------- scars, iron plate ---------- */
  if(scar==='brow'||scar==='deep'){const d=scar==='deep'?'M34.8 18.6 L37.4 26 M37.8 29.6 L40 36.6':'M35.4 23.8 L37.2 27.2 M37.6 28.6 L38.6 31.4'; line(d,'#5a1a12',scar==='deep'?1:.75,.5); line(d,'#e8a890',scar==='deep'?.55:.45,.9); if(scar==='deep') line('M35 20.6 L36.4 20 M35.7 22.4 L37.1 21.8 M38.4 31.4 L39.8 30.8 M39 33.6 L40.4 33','#5a1a12',.3,.8)}
  if(scar==='cheek'){line('M24.6 31.6 L28.4 35.2','#5a1a12',.8,.4); line('M24.6 31.6 L28.4 35.2','#e8a890',.4,.85)}
  if(scar==='lip'){line(P`M33.6 ${mY-2.6} L34.4 ${mY+1.8}`,'#e8a890',.4,.85)}
  if(o.plate){const d=P`M35.4 30.6 L${Rx+.2} 29.2 L${Rx-.2} 34.6 L${Rx-2.6} 37.4 L35.6 36.6 Z`;
    ink(d,.9,{clip:hi}); const pi=add(d,L(35,29,Rx,38,[[0,'#c8d2d8'],[.45,'#6a767e'],[1,'#262c32']]),{clip:hi}); add(d,{pat:[1,.2,'#2a3036'],kind:'dot'},{clip:pi,op:.35}); line(P`M36 31.2 L${Rx-1} 30.1`,'#fff',.35,.7,{clip:pi});
    [[36.6,31.6],[Rx-1.2,30.6],[36.6,35.6],[Rx-2.8,35.8]].forEach(([x,y])=>{add(E(x,y,.42),RG(x-.15,y-.15,.5,[[0,'#ffffff'],[1,'#4a5056']]),{clip:hi})});
    add(d,L(0,0,0,64,[[0,'#7a2a14',0],[1,'#7a2a14',.25]]),{clip:pi})}

  /* ---------- in the mouth: cigar, cigarette, toothpick ---------- */
  let ember=null;
  if(smoke&&!mask){
    if(smoke==='toothpick') line(P`M34.4 ${mY+.2} L39.6 ${mY+1.6}`,'#d8b880',.45,1);
    else {const cig=smoke==='cigarette', len=cig?5.6:6.6, th=cig?.5:.85, x0=34.4, y0=mY+.3, x1=x0+len, y1=y0+1.7;
      const d=P`M${x0} ${y0-th} L${x1} ${y1-th} L${x1} ${y1+th} L${x0} ${y0+th} Z`; ink(d,.6); add(d,cig?L(0,y0-th,0,y0+th,[[0,'#ffffff'],[1,'#c8c0b0']]):L(0,y0-th,0,y0+th,[[0,'#8a5a32'],[1,'#3a2210']]));
      if(!cig){const bx=x0+1.4; add(P`M${bx} ${y0+.4-th} L${bx+.9} ${y0+.66-th} L${bx+.9} ${y0+.66+th} L${bx} ${y0+.4+th} Z`,o.cigarBand||'#c83a2a'); add(P`M${bx+.2} ${y0+.45-th} L${bx+.7} ${y0+.6-th} L${bx+.7} ${y0+.6+th} L${bx+.2} ${y0+.45+th} Z`,'#e8c060',{op:.9})}
      add(P`M${x1-.6} ${y1-.18-th} L${x1} ${y1-th} L${x1} ${y1+th} L${x1-.6} ${y1-.18+th} Z`,cig?'#9a948a':'#6a6660');
      ember=[x1+.15,y1]; add(E(x1+.15,y1,th*.9,th),'#ff6a1a',{cls:'pt-ember'}); add(full,RG(x1,y1,4,[[0,'#ff8a3a',.5],[1,'#ff6a20',0]]),{cls:'pt-ember'})}
  }

  /* ---------- bandana over the lower face ---------- */
  if(mask){const d=P`M${Lx-.4} 30.8 C27 33.4 37 33.4 ${Rx+.4} 30.8 C${Rx+.6} 37 38.8 42.6 32 46.4 C25.2 42.6 ${Lx-.6} 37 ${Lx-.4} 30.8 Z`; const mc=o.maskC||band;
    ink(d,1.2); const mi=add(d,mc); add(d,L(Lx,0,Rx,0,[[0,'#fff',.12],[.5,'#000',0],[1,'#000',.5]]),{clip:mi}); add(d,{pat:[1.8,.36,'#f2e4c4'],kind:'dot'},{clip:mi,op:.3});
    line('M25.6 35 C29 36.2 35 36.2 38.4 35 M26.6 38.6 C30 39.8 34 39.8 37.4 38.6 M29 42 C30.6 42.8 33.4 42.8 35 42','#000',.45,.35); line(P`M${Lx+.4} 31.6 C27 34 37 34 ${Rx-.4} 31.6`,'#fff',.35,.25)}

  /* ---------- the hat's shadow falls across the eyes ---------- */
  const tr=tilt*Math.PI/180, sx=-Math.sin(tr)*15, sy=Math.cos(tr)*15;
  if(hat!=='none'&&hat!=='riding') add(head,L(32,16,32+sx,16+sy,[[0,'#000',.85],[.5,'#000',.42],[.75,'#000',.12],[1,'#000',0]]),{clip:hi});

  /* ---------- eyes ---------- */
  const eyeY=28.5, shadowed=hat!=='none'&&hat!=='riding';
  const eye=(s)=>{
    const c=32+s*3.9, w=2.2, inner=c-s*w, outer=c+s*w, open=ey.open, up=1.6*open, dn=1.1*open, tl=ey.tilt||0, iy=eyeY, oy=eyeY-tl;
    add(E(c,eyeY-.1,3.2,2.2),'#000',{op:ey.hollow?.75:.18,clip:hi});
    if(ey.hollow){add(E(c,eyeY,2.4,1.7),'#050403',{clip:hi}); add(E(c+s*.2,eyeY+.1,1.6,1.2),RG(c+s*.2,eyeY+.1,1.6,[[0,ey.glow||'#cfff9a',.55],[1,ey.glow||'#cfff9a',0]]),{cls:'pt-glow'}); add(E(c+s*.2,eyeY+.1,.42),ey.glow||'#cfff9a',{cls:'pt-glow'}); return}
    const white=P`M${inner} ${iy} C${inner+s*1} ${iy-up} ${outer-s*1.2} ${oy-up} ${outer} ${oy} C${outer-s*1.1} ${oy+dn} ${inner+s*1} ${iy+dn} ${inner} ${iy} Z`;
    const wc=ey.white||(ey.bloodshot?'#ecbcac':shadowed?'#d6c8b2':'#efe5d2');
    const wi=add(white,wc);
    const gx=c+(ey.gaze||0), ir=ey.ir||1.1;
    add(E(gx,eyeY,ir),RG(gx-.2,eyeY-.3,ir*1.2,[[0,shade(ey.iris,.35)],[1,shade(ey.iris,-.45)]]),{clip:wi});
    if(ey.glow) add(E(gx,eyeY,ir*1.6),RG(gx,eyeY,ir*1.6,[[0,ey.iris,.6],[1,ey.iris,0]]),{clip:hi,cls:'pt-glow'});
    add(ey.slit?E(gx,eyeY,.24,ir*.95):E(gx,eyeY,ir*.46),'#050302',{clip:wi});
    if(ey.bloodshot) line(P`M${inner+s*.3} ${iy} L${inner+s*.9} ${iy-.3} M${outer-s*.2} ${oy} L${outer-s*.8} ${oy+.3}`,'#c02020',.15,.8,{clip:wi});
    add(white,L(0,eyeY-up,0,eyeY+dn,[[0,'#000',.6],[.55,'#000',0]]),{clip:wi});
    if(ey.cloudy&&s>0) add(E(gx,eyeY,ir),'#d8e0e4',{op:.7,clip:wi});
    if(ey.lid){const ld=P`M${inner-s*.4} ${iy-.2} C${inner+s*1} ${iy-up-.8} ${outer-s*1.2} ${oy-up-.8} ${outer+s*.5} ${oy-.1} C${outer-s*1.2} ${oy-up+ey.lid*up*1.6} ${inner+s*1} ${iy-up+ey.lid*up*1.6} ${inner-s*.4} ${iy-.2} Z`; add(ld,shadowed?shade(skin,-.45):skin); line(P`M${inner} ${iy-up*.3+ey.lid*.6} C${inner+s*1.2} ${iy-up+ey.lid*up*1.6} ${outer-s*1.2} ${oy-up+ey.lid*up*1.6} ${outer+s*.3} ${oy}`,INK,.55,.8)}
    ink(P`M${inner-s*.2} ${iy+.1} C${inner+s*1} ${iy-up-.12} ${outer-s*1.2} ${oy-up-.12} ${outer+s*.45} ${oy+.1}`,ey.liner?.95:.75);
    if(ey.liner) ink(P`M${outer} ${oy-.1} L${outer+s*1.3} ${oy-.9}`,.55);
    if(ey.lashes) line(P`M${outer-s*.3} ${oy-up*.6} L${outer+s*.5} ${oy-up*.6-.8} M${outer-s*1} ${oy-up*.9} L${outer-s*.6} ${oy-up-.9}`,INK,.3,1);
    line(P`M${inner+s*.6} ${iy+dn*.7} C${inner+s*1.6} ${iy+dn+.2} ${outer-s*1.2} ${oy+dn+.12} ${outer-s*.2} ${oy+.3}`,skinDD,.35,.6);
    add(E(gx-.38,eyeY-.42,.32),ey.glintC||'#fff',{op:.95,cls:'pt-glint'});
    // a lid that drops for the occasional blink
    add(P`M${inner-s*.4} ${iy-.1} C${inner+s*1} ${iy-up-.9} ${outer-s*1.2} ${oy-up-.9} ${outer+s*.5} ${oy} C${outer-s*1.1} ${oy+dn+.3} ${inner+s*1} ${iy+dn+.3} ${inner-s*.4} ${iy-.1} Z`,shadowed?shade(skin,-.42):shade(skin,-.08),{cls:'pt-lid',op:0});
  };
  eye(-1); if(!patch) eye(1);
  // brows
  const brow=(s,inY,outY,th)=>{const inn=32+s*1.25, out=32+s*6.9;
    const d=P`M${inn} ${inY} C${inn+s*2} ${inY-.7} ${out-s*2.2} ${outY-.9} ${out} ${outY+.25} C${out-s*2.2} ${outY+th*.45} ${inn+s*2} ${inY+th*.9} ${inn+s*.15} ${inY+th} Z`; ink(d,.5); add(d,browC)};
  const bt=boss?1.15:1, BW={angry:[[26.9,25.1],[26.9,25.1]],flat:[[26,25.8],[26,25.8]],worried:[[25.2,26.2],[25.2,26.2]],cocked:[[26.8,25.3],[25.2,24.6]],arched:[[25.9,25.4],[25.9,25.4]],stern:[[26.4,25.6],[26.4,25.6]]}[brows]||[[26.6,25.4],[26.6,25.4]];
  brow(-1,BW[0][0],BW[0][1],bt*(fem?.8:1.15)); brow(1,BW[1][0],BW[1][1],bt*(fem?.8:1.15));
  if(patch){const d='M35.6 28.6 C35.6 25.8 40.6 25.8 40.6 28.6 C40.6 31.4 35.6 31.4 35.6 28.6 Z'; ink(d,.6); add(d,L(35,26,40,31,[[0,'#2a1e16'],[1,'#050302']])); line('M22.8 24.4 L36.2 27.4 M40.4 27.6 L41.8 26.4','#0c0806',.65,1); line('M36.4 27.6 C37.6 26.8 39 26.8 39.8 27.6','#fff',.25,.25)}
  if(o.glasses==='half'||o.glasses==='round'){const gy=o.glasses==='half'?30:28.6, hr=o.glasses==='half'?1.1:2;
    [28.1,35.9].forEach(x=>{const d=o.glasses==='half'?P`M${x-2.2} ${gy-.5} L${x+2.2} ${gy-.5} C${x+2.2} ${gy+1.6} ${x-2.2} ${gy+1.6} ${x-2.2} ${gy-.5} Z`:E(x,gy,2.3,hr); add(d,'#cfe6f0',{op:.16}); line(d,'#c8a050',.45,1); line(P`M${x-1.4} ${gy+.1} L${x-.4} ${gy-.5}`,'#fff',.3,.5)});
    line(P`M30.3 ${gy-.3} C31.2 ${gy-1} 32.8 ${gy-1} 33.7 ${gy-.3}`,'#c8a050',.4,1);
    if(o.chain) line(P`M${25.9} ${gy} C24 ${gy+5} 24.6 ${gy+11} 27 ${gy+15} M${38.1} ${gy} C40 ${gy+5} 39.4 ${gy+11} 37 ${gy+15}`,'#c8a050',.25,.85,{dash:'.3 .25'})}
  if(o.monocle){add(E(35.9,28.5,2.6),RG(35,27.6,3,[[0,'#ffffff',.28],[1,'#cfe6f0',.05]])); ink(E(35.9,28.5,2.6),.9,{stroke:'#e8c060'}); line(E(35.9,28.5,2.6),'#fff7c8',.3,.8); add('M34.4 27 L35.2 26.6 L34.8 27.6 Z','#fff',{cls:'pt-glint'}); line('M37.6 30.6 C38.8 37 40 43 42.6 49.6','#e8c060',.35,.9,{dash:'.5 .25'})}
  if(o.veil){const d=P`M${Lx-1.6} 21 L37.4 19.8 C38 25 36.4 30.6 32.6 32.6 C28.4 33.6 ${Lx+1} 32.6 ${Lx-.6} 30.4 Z`; add(d,{pat:[1.1,.12,'#000'],kind:'net'},{op:.85}); line(P`M${Lx-.6} 30.4 C${Lx+1} 32.6 28.4 33.6 32.6 32.6 C36.4 30.6 38 25 37.4 19.8`,'#000',.5,.6,{dash:'.5 .3'})}

  /* ---------- hair in front: hairline, sideburns, buns, braids ---------- */
  const hairLit=(d,x)=>{ink(d,1); const i=add(d,hair,x); add(d,L(Lx-2,0,Rx+2,0,[[0,'#fff',.16],[.5,'#000',0],[1,'#000',.5]]),Object.assign({clip:i},x?{tf:x.tf}:{})); return i};
  if(!fem){
    if(hat!=='none'){add(P`M${Lx-.2} 20.5 L${Lx-.2} 28.4 L${Lx+1.7} 26.6 L${Lx+1.7} 21 Z`,hair); add(P`M${Rx+.2} 20.5 L${Rx+.2} 28.4 L${Rx-1.7} 26.6 L${Rx-1.7} 21 Z`,hair)}
    else if(hairdo==='bald'){add(E(28.6,18.8,2.6,1.2),'#fff',{op:.22}); add(P`M${Lx-.2} 21 L${Lx-.2} 28 L${Lx+1.6} 26.4 L${Lx+1.2} 21.6 Z`,hair); add(P`M${Rx+.2} 21 L${Rx+.2} 28 L${Rx-1.6} 26.4 L${Rx-1.2} 21.6 Z`,hair)}
    else {const d=P`M${Lx-.4} 27.5 C${Lx-1.4} 10 ${Rx+1.4} 10 ${Rx+.4} 27.5 C${Rx-1.6} 21 ${Rx-6} 19.4 32 19.6 C29.6 19.2 ${Lx+2} 20.4 ${Lx-.4} 27.5 Z`; const i=hairLit(d); if(hairdo==='slick'){line('M27.4 13.6 C26 16 26 18.4 26.6 20.2','#000',.5,.4,{clip:i}); line(P`M28.6 13.4 C31 12.4 35 12.6 38.6 15.4`,'#fff',.6,.3,{clip:i})} else line(P`M26 15 C27 17 26.6 19 25.2 21.2 M30 13.2 C31 15.4 30.6 17.6 29 19.6 M35.4 13.6 C36 15.8 35.6 17.6 34.2 19.4`,shade(hair,-.4),.35,.7,{clip:i})}
  } else {
    if(hat==='none'||hat==='riding'){
      if(hairdo==='updo'){const d=P`M${Lx-1.2} 29 C${Lx-3} 13 ${Rx+1} 6.4 ${Rx+2.6} 18 C${Rx+3} 22 ${Rx+1.6} 26 ${Rx+.8} 29 C${Rx-1.4} 22 36 19.4 31 19.8 C27.4 20.2 ${Lx+1.2} 22.4 ${Lx-1.2} 29 Z`; const i=hairLit(d); line(P`M${Lx+.6} 24 C27 16 33 13 ${Rx+1.4} 16.6 M${Lx+2.6} 21.2 C29 16.8 34 15.8 ${Rx} 19.4`,shade(hair,.25),.35,.6,{clip:i});
        for(let k=0;k<4;k++){const y=27+k*2.6,x=Rx+1.6-k*.1; ink(E(x,y,1.25,1.5),.6); add(E(x,y,1.25,1.5),hair); line(P`M${x-.6} ${y-.6} C${x+.4} ${y-1} ${x+.8} ${y+.4} ${x} ${y+.8}`,shade(hair,.3),.3,.6)}}
      else {const d=P`M${Lx-1} 29 C${Lx-2} 10 ${Rx+2} 10 ${Rx+1} 29 C${Rx-1.2} 21.4 35 19.8 32 20 C29 19.8 ${Lx+1.2} 21.4 ${Lx-1} 29 Z`; const i=hairLit(d); line(P`M31.2 14 C30.6 16.4 29 18.6 26.4 20.6 M32.8 14 C33.6 16.4 35.4 18.6 37.8 20.6`,shade(hair,-.35),.4,.6,{clip:i})}
      if(hairdo==='bun'){const d=E(32,13.2,4.2,3.4); ink(d,1); const i=add(d,hair); add(d,L(28,0,36,0,[[0,'#fff',.2],[1,'#000',.4]]),{clip:i}); line('M29 12.4 C31 11 33.6 11.4 35 13 M29.4 14.6 C31.4 15.4 33.6 15.2 35.2 14','#000',.35,.35,{clip:i}); line('M26.4 11.6 L29.4 12.6 M37.6 11.2 L34.6 12.4',o.pins||'#c8a050',.55,1); add(E(26.4,11.6,.55),o.pins||'#c8a050'); add(E(37.6,11.2,.55),o.pins||'#c8a050')}
    } else {[-1,1].forEach(s=>{const x=s<0?Lx:Rx; const d=P`M${x+s*.6} 21 C${x+s*1.6} 27 ${x+s*1.8} 33 ${x+s*.8} 37.6 L${x-s*1.2} 36 C${x-s*.4} 31 ${x-s*.4} 26 ${x-s*1.2} 21 Z`; ink(d,.8); add(d,s<0?hair:shade(hair,-.3)); line(P`M${x} 24 C${x+s*.6} 29 ${x+s*.6} 32 ${x} 35`,shade(hair,-.4),.3,.6)})}
    if(hairdo==='braids'){[-1,1].forEach(s=>{const x=s<0?Lx-.6:Rx+.6; for(let k=0;k<7;k++){const by=33+k*2.6,bx=x-s*(k*.25); ink(E(bx,by,1.3,1.6),.6); add(E(bx,by,1.3,1.6),hair); line(P`M${bx-1} ${by-.6} C${bx} ${by+.4} ${bx+.6} ${by+.4} ${bx+1} ${by-.4}`,shade(hair,-.4),.3,.7)} add(E(x-s*1.9,51.6,.9,.6),o.ribbon||'#b0302a')})}
    if(hairdo==='bob'){[-1,1].forEach(s=>{const x=s<0?Lx:Rx; const d=P`M${x+s*.4} 22 C${x+s*1.6} 28 ${x+s*1.6} 34 ${x+s*.6} 38.6 L${x-s*1.6} 37.8 C${x-s*.6} 33 ${x-s*.4} 27 ${x-s*.6} 22 Z`; ink(d,.8); add(d,s<0?hair:shade(hair,-.3))})}
    if(hairdo==='ringlets'){[-1,1].forEach(s=>{const x=s<0?Lx-.8:Rx+.8; for(let k=0;k<5;k++){const y=30+k*2.6; ink(E(x,y,1.2,1.5),.6); add(E(x,y,1.2,1.5),s<0?hair:shade(hair,-.25)); line(P`M${x-.6} ${y-.6} C${x+.4} ${y-1} ${x+.8} ${y+.4} ${x} ${y+.8}`,shade(hair,.3),.3,.6)}})}
  }
  if(o.flower){add(E(Lx+.6,20.6,1.6),'#f2d24a'); add(E(Lx+.6,20.6,.6),'#9a5a1a')}

  /* ---------- hats ---------- */
  const brimD=(w,curl,dy=0)=>P`M${32-w} ${24-curl+dy} C${32-w*.7} ${20.6+dy} ${32-w*.35} ${20.4+dy} 32 ${20.8+dy} C${32+w*.35} ${20.4+dy} ${32+w*.7} ${20.6+dy} ${32+w} ${24-curl+dy} C${32+w*.6} ${25.4+dy} ${32+w*.3} ${26+dy} 32 ${25.8+dy} C${32-w*.3} ${26+dy} ${32-w*.6} ${25.4+dy} ${32-w} ${24-curl+dy} Z`;
  if(hat!=='none'){
    const H={tf:HT};
    const crowns={cowboy:'M21.6 22 C21 12 25 6.8 32 8.6 C39 6.8 43 12 42.4 22 Z',cattleman:'M22.2 22 C21.4 11 24.6 5.4 32 7.6 C39.4 5.4 42.6 11 41.8 22 Z',slouch:'M21.4 22 C20.4 15 23 9.4 29 10.4 C32.6 8.4 40.8 9 42.8 22 Z',
      gambler:'M21.6 22 L22.6 11.6 C28 10.6 36 10.6 41.4 11.6 L42.4 22 Z',flat:'M21 22 L22.8 12.4 L41.2 12.4 L43 22 Z',bowler:'M22.4 22 C22.4 8.6 41.6 8.6 41.6 22 Z',top:'M23.4 22 L23.8 2.2 C28 1.4 36 1.4 40.2 2.2 L40.6 22 Z',riding:'M25.8 19.4 L26.4 10.8 C29.6 10 34.4 10 37.6 10.8 L38.2 19.4 Z'};
    const cr=crowns[hat]||crowns.cowboy, w={cowboy:25,cattleman:23,slouch:24,gambler:22,flat:20,bowler:14,top:15,riding:10.4}[hat]||22, curl={cowboy:4.6,cattleman:3.2,slouch:-1.8,gambler:.8,flat:1.4,bowler:1.6,top:1.2,riding:.9}[hat], dy=hat==='riding'?-2.4:0;
    const hcol=hatc, hd=shade(hatc,-.6);
    ink(cr,1.5,H); const ki=add(cr,L(20,0,44,0,[[0,shade(hcol,.12)],[.55,hcol],[1,hd]]),H);
    add(cr,L(0,2,0,22,[[0,'#fff',.08],[1,'#000',.25]]),{clip:ki,tf:HT});
    if(hat==='cowboy'||hat==='cattleman'){add('M25.2 11.8 C24.2 15 24.4 18.6 25.6 21 C26.6 18 26.6 15 25.2 11.8 Z','#000',{op:.32,tf:HT}); add('M38.8 11.8 C39.8 15 39.6 18.6 38.4 21 C37.4 18 37.4 15 38.8 11.8 Z','#000',{op:.42,tf:HT}); line(hat==='cattleman'?'M32 8 C31.6 11 31.6 14 32 16':'M28.2 9.4 C30 10.8 34 10.8 35.8 9.4','#000',.7,.45,H); add(E(27.4,13.6,1.6,4),'#fff',{op:.1,tf:HT})}
    if(hat==='slouch'){line('M24 14 C27 15.6 31 15 33 12.6','#000',.6,.45,H); add(E(26.4,15,2,4),'#fff',{op:.08,tf:HT}); line('M31 11.4 L33.4 13.6 M36 12 L36.6 15','#000',.35,.4,H)}
    if(hat==='bowler'){add(E(28,13.4,2.4,3),'#fff',{op:.14,tf:HT})}
    if(hat==='top'||hat==='riding'){add(hat==='top'?'M25.4 3 L25.6 21 L27.4 21 L27.2 2.6 Z':'M27 9 L27.2 19 L28.4 19 L28.2 8.8 Z','#fff',{op:.12,tf:HT}); add(hat==='top'?E(32,2.2,8.2,.9):E(32,10.6,5.6,.7),shade(hcol,.15),{tf:HT})}
    if(o.hatHole){add(E(36.6,13.4,.8,.9),'#050302',{tf:HT}); line(E(36.6,13.4,1,1.1),shade(hcol,.4),.3,.8,H); line('M37.2 12.2 L38 11.2 M35.6 14.4 L35 15.2','#000',.3,.5,H)}
    rimOn(cr,ki,36,44,1.6,{tf:HT});
    // band
    const by=hat==='top'?17.6:hat==='riding'?15.6:hat==='bowler'?18.4:18.6;
    const bd=P`M21.9 ${by} C28 ${by+1.6} 36 ${by+1.6} 42.1 ${by} L42.3 ${by+2.8} C36 ${by+4.2} 28 ${by+4.2} 21.7 ${by+2.8} Z`;
    const bandC=o.hatband||(o.crepe?'#0a0909':o.band==='snake'?'#6a7a2a':hat==='top'||hat==='bowler'?'#120c08':pick(['#120c08','#3a2414',band]));
    const bi=add(bd,bandC,{clip:ki,tf:HT}); add(bd,L(0,by,0,by+4,[[0,'#fff',.15],[1,'#000',.4]]),{clip:bi,tf:HT});
    if(o.band==='snake'){add(bd,{pat:[1.3,.5,'#1c2410'],kind:'scale'},{clip:bi,tf:HT,op:.85}); add(bd,{pat:[1.3,.18,'#e0e8a0'],kind:'dot'},{clip:bi,tf:HT,op:.35})}
    if(o.conchos){[25.6,32,38.4].forEach(x=>{add(E(x,by+1.7,1),RG(x-.3,by+1.3,1.2,[[0,'#ffffff'],[1,'#7a8088']]),{tf:HT}); line(E(x,by+1.7,1),'#2a2a2a',.25,.8,H)})}
    if(o.card){const t=`${HT} rotate(12 40 15)`; ink('M37.8 9.6 L42.4 9.6 L42.4 16.6 L37.8 16.6 Z',.7,{tf:t}); add('M37.8 9.6 L42.4 9.6 L42.4 16.6 L37.8 16.6 Z','#f4ecd8',{tf:t}); add('M40.1 11.4 C41.4 12.6 42 13.2 41.2 14 C40.6 14.4 40.2 14 40.1 13.7 C40 14 39.6 14.4 39 14 C38.2 13.2 38.8 12.6 40.1 11.4 Z M39.6 14.6 L40.6 14.6 L40.1 13.6 Z','#111',{tf:t}); line('M38.4 10.2 L38.4 11.4','#b01818',.5,1,{tf:t})}
    if(o.feather&&hat!=='none'){const fc=typeof o.feather==='string'?o.feather:'#b8342a', d=hat==='riding'?'M35.4 10 C40 3.6 48.6 1.2 56 3.6 C50 4.4 43.4 7.4 38.2 13 Z':'M38.6 19.6 C40.6 13 43.6 7.8 47.6 4.2 C46.2 9.4 43.6 14.8 40.2 20.2 Z';
      ink(d,.8,H); const fi=add(d,L(36,0,56,0,[[0,fc],[1,shade(fc,.25)]]),H); line(hat==='riding'?'M37 11.4 C42 5.6 49 3.4 55 3.8':'M39.4 19.8 C41.6 13.6 44 8.6 47.2 4.8',shade(fc,.5),.3,.9,H); add(d,{pat:[.8,.12,'#000'],kind:'net'},{clip:fi,tf:HT,op:.35})}
    if(o.rose){const rx=hat==='riding'?27.4:25.6, ry=hat==='riding'?17.6:19.6; add(`M${rx-3.2} ${ry+1} C${rx-2} ${ry-1} ${rx-.6} ${ry-.6} ${rx} ${ry+.4} C${rx-1.4} ${ry+1.6} ${rx-2.4} ${ry+1.8} ${rx-3.2} ${ry+1} Z`,'#2a5a2a',H); ink(E(rx,ry,2.3,2.1),.8,H); add(E(rx,ry,2.3,2.1),RG(rx-.5,ry-.6,2.6,[[0,'#ff4a5a'],[1,'#6a0614']]),H); line(`M${rx} ${ry} m-.4 .2 a.7 .7 0 1 1 1 .5 a1.3 1.3 0 1 1 -2.1 -1 a1.9 1.9 0 0 1 3.3 .2`,'#4a0410',.35,.9,H)}
    // brim
    const brim=brimD(w,curl,dy);
    ink(brim,1.4,H); const ri=add(brim,L(0,20.4+dy,0,26+dy,[[0,shade(hcol,.15)],[.45,hcol],[1,hd]]),H);
    add(brim,L(32-w,0,32+w,0,[[0,'#fff',.12],[.45,'#000',0],[1,'#000',.45]]),{clip:ri,tf:HT});
    line(P`M${32-w+.8} ${24-curl+dy-.5} C${32-w*.7} ${21.4+dy} ${32-w*.35} ${21.2+dy} 32 ${21.6+dy} C${32+w*.35} ${21.2+dy} ${32+w*.7} ${21.4+dy} ${32+w-.8} ${24-curl+dy-.5}`,shade(hcol,.45),.3,.6,{tf:HT,dash:'.5 .45'});
    line(P`M${32-w} ${24-curl+dy} C${32-w*.7} ${20.6+dy} ${32-w*.35} ${20.4+dy} 32 ${20.8+dy}`,'#fff4dc',.4,.35,H);
    rimOn(brim,ri,32+w*.3,32+w,1.4,{tf:HT});
  }

  /* ---------- props in the foreground ---------- */
  if(o.pocket==='bottle'){const t='rotate(10 44 52)'; const nk='M42.6 44.4 L45 44.4 L45.4 52.6 L42.2 52.6 Z'; ink(nk,.8,{tf:t}); const bi2=add(nk,L(42,0,46,0,[[0,'#f0a838'],[.5,'#a8601a'],[1,'#5a2a08']]),{tf:t}); line('M43.2 45.4 L43.1 51.8','#fff6d0',.45,.7,{tf:t}); add('M42.5 42.6 L45.1 42.6 L45 44.8 L42.6 44.8 Z','#c8a070',{tf:t}); line('M42.6 43.4 L45 43.4','#7a5a3a',.3,1,{tf:t});
    add('M42.5 47.6 L45.2 47.4 L45.3 50.2 L42.5 50.4 Z','#efe0b8',{tf:t}); line('M42.9 48.4 L44.8 48.3 M42.9 49.4 L44.8 49.3','#7a2a14',.3,1,{tf:t});
    const pk='M39.2 51.6 L48.4 51 L48.6 57.2 C46 58.8 42 59 39.6 57.8 Z'; ink(pk,.8); add(pk,shade(coat,-.15)); line('M39.4 52.6 L48.4 52','#000',.5,.4); line('M39.6 52.4 L48.4 51.8',shade(coat,.4),.25,.5,{dash:'.4 .3'})}
  if(o.keys){line(E(43.6,51.6,1.7),'#a8843a',.55,1); [[-28,42.6],[6,43.8],[34,45]].forEach(([a,x],k)=>{const t=`rotate(${a} 43.6 53.2)`; const d='M43.1 53.2 L44.1 53.2 L44.1 58.8 L45.2 58.8 L45.2 59.6 L44.1 59.6 L44.1 60.4 L45 60.4 L45 61.2 L43.1 61.2 Z'; ink(d,.5,{tf:t}); add(d,L(43,0,45,0,[[0,'#d8b468'],[1,'#7a5a1e']]),{tf:t}); add(E(43.6,53.2,1),'none',{stroke:'#c8a050',sw:.5,tf:t})})}
  if(o.rat){const rc='#6a5e54', rd=shade(rc,-.45);
    line('M8.6 52.8 C4 54.6 3.6 59 6.4 61.4 C8.4 63 6.6 65 4.2 66','#d89a90',.7,1,{cls:'pt-tail'});
    const body='M6.4 52.6 C5.6 47.4 10.6 44.6 15.4 45.6 C18.6 46.2 20.4 48 20.8 50.6 C17.8 53 10.6 54 6.4 52.6 Z'; ink(body,1); const rbi=add(body,L(6,0,21,0,[[0,shade(rc,.2)],[1,rd]])); add(body,{pat:[.9,.22,rd],kind:'dot'},{clip:rbi,op:.5}); rimOn(body,rbi,12,21,1.2);
    const g={cls:'pt-rat'}; const hd2='M15.2 47.4 C17.4 45.2 21 45.4 23.8 48.6 C22 50 18.8 50.6 16.2 50 Z'; ink(hd2,.9,g); add(hd2,L(15,0,24,0,[[0,shade(rc,.15)],[1,rd]]),g);
    add(E(17.6,45.6,1.4,1.5),rc,g); add(E(17.6,45.8,.8,.95),'#d88a90',g); line(E(17.6,45.6,1.4,1.5),INK,.4,1,g);
    add(E(20.4,47.4,.48),'#ff2a1a',Object.assign({},g)); add(E(20.3,47.25,.15),'#fff',g); add(E(23.8,48.6,.45),'#e08a90',g);
    line('M22.8 49 L26 48.2 M22.8 49.2 L25.8 50 M22.6 48.6 L25.4 46.8','#e8e0d8',.15,.8,g); line('M10 53 L9.6 54.6 M14.6 53.4 L14.6 55','#d89a90',.5,1)}

  /* ---------- smoke rising ---------- */
  if(ember){const [ex,ex2]=ember; const sm=P`M${ex} ${ex2-.6} C${ex+2.4} ${ex2-3} ${ex+1.2} ${ex2-6} ${ex+4} ${ex2-8.4} C${ex+7} ${ex2-11} ${ex+5.6} ${ex2-14} ${ex+8.6} ${ex2-16.4}`;
    line(sm,'#e8e2d8',2.6,.08,{cls:'pt-smoke'}); line(sm,'#efe9df',.8,.26,{cls:'pt-smoke'})}

  /* ---------- finish: vignette ---------- */
  add(full,RG(32,30,38,[[.62,'#000',0],[1,'#000',.66]]),{bg:2});
  return S;
}

let PID=0;
function portraitSVG(shapes,frame,zoom=frame==='square'?1.12:1.28){
  let defs='', body='', gi=0;
  const clips={};
  const paint=f=>{
    if(!f||typeof f!=='object') return f||'none';
    const gid=`§g${gi++}`;
    if(f.pat){const [w,q,c]=f.pat, h=+(w/2).toFixed(2);
      const inner=f.kind==='net'?`<path d="M0 0L${w} ${w}M${w} 0L0 ${w}" stroke="${c}" stroke-width="${q}"/>`:f.kind==='scale'?`<path d="M${h} 0L${w} ${h}L${h} ${w}L0 ${h}Z" fill="none" stroke="${c}" stroke-width="${q*.5}"/>`:`<circle cx="${h}" cy="${h}" r="${q}" fill="${c}"/>`;
      defs+=`<pattern id="${gid}" width="${w}" height="${w}" patternUnits="userSpaceOnUse" patternTransform="rotate(${f.kind==='dot'?30:0})">${inner}</pattern>`;
      return `url(#${gid})`}
    const st=f.stops.map(([o,c,a])=>`<stop offset="${o}" stop-color="${c}"${a!==1?` stop-opacity="${a}"`:''}/>`).join('');
    if(f.lin){const [x1,y1,x2,y2]=f.lin.map(v=>+v.toFixed(2)); defs+=`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st}</linearGradient>`}
    else {const [cx,cy,q]=f.rad.map(v=>+v.toFixed(2)); defs+=`<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${q}">${st}</radialGradient>`}
    return `url(#${gid})`;
  };
  let open=false;
  shapes.forEach(s=>{
    if(!s.bg&&!open){body+=`<g transform="translate(32 36) scale(${zoom}) translate(-32 -36)">`; open=true}
    if(s.bg===2&&open){body+='</g>'; open=false}
    const fill=paint(s.fill);
    let a='';
    if(s.stroke) a+=` stroke="${paint(s.stroke)}" stroke-width="${s.sw}" stroke-linecap="round" stroke-linejoin="round"${s.dash?` stroke-dasharray="${s.dash}"`:''}`;
    if(s.op!=null) a+=` opacity="${s.op}"`;
    if(s.clip!=null){if(!clips[s.clip]){clips[s.clip]=`§c${s.clip}`; const c=shapes[s.clip]; defs+=`<clipPath id="${clips[s.clip]}"><path d="${c.d}"/></clipPath>`} a+=` clip-path="url(#${clips[s.clip]})"`}
    if(s.fade){const mid=`§m${gi++}`; defs+=`<mask id="${mid}" maskUnits="userSpaceOnUse" x="-8" y="-8" width="80" height="80"><rect x="-8" y="-8" width="80" height="80" fill="${paint(s.fade)}"/></mask>`; a+=` mask="url(#${mid})"`}
    if(s.tf) a+=` transform="${s.tf}"`;
    if(s.cls) a+=` class="${s.cls}"`;
    body+=`<path d="${s.d}" fill="${fill}"${a}/>`;
  });
  if(open) body+='</g>';
  const clip=frame==='square'?'':` clip-path="url(#§cc)"`;
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}<clipPath id="§cc"><circle cx="32" cy="32" r="32"/></clipPath></defs><g${clip}>${body}</g></svg>`;
}
const PORTRAIT_CACHE=new Map();
function portrait(name,o={},frame){
  const key=name+'|'+JSON.stringify(o)+'|'+(frame||'');
  if(!PORTRAIT_CACHE.has(key)) PORTRAIT_CACHE.set(key,portraitSVG(portraitShapes(name,o),frame));
  return PORTRAIT_CACHE.get(key).replace(/§/g,'pt'+(++PID));
}

/* ================= the cast ================= */
const BOSS_LOOK={
  pete:{bg:['#7a4a14','#160902'],rim:'#ffb547',skin:['#e2a682','#a0603e'],hat:'slouch',hatc:'#6a4a2c',hatTilt:-8,hatHole:true,hatband:'#3a2414',fh:'scraggly',hair:'#7a5232',nose:'bulb',redNose:true,veins:true,rosy:true,
    eyes:{open:.66,lid:.8,bloodshot:true,iris:'#4a6a8a',gaze:-.2},brows:'worried',mouth:'grin',missingTooth:true,suspenders:'#6a2a1a',vest:null,shirt:'#c8b48e',coat:'#4a3220',pocket:'bottle',stubble:true,smoke:false,scar:false,neck:'none',age:1},
  ma:{fem:true,bg:['#6a2440','#12040a'],rim:'#ff8ab8',skin:['#e8c4a8','#a8806a'],hat:'none',hairdo:'bun',hair:'#d8d0c2',pins:'#2a2a2a',glasses:'half',chain:true,mouth:'pursed',lips:'#9a4a52',age:2,rouge:true,collar:'lace',brooch:true,shawl:'#3a1e30',keys:true,brows:'stern',
    eyes:{open:.55,iris:'#5a6a7a',gaze:.15},earring:false,neck:'none',smoke:false,scar:false},
  iron:{bg:['#2c3e4c','#04080b'],rim:'#bfe0ff',skin:['#c28a62','#7a4e30'],hat:'cattleman',hatc:'#1e1a18',conchos:true,hatTilt:2,hw:10.2,jaw:1.9,neckW:5.6,bulk:2,fh:'horseshoe',hair:'#7a7a76',nose:'broken',plate:true,scar:'deep',
    eyes:{open:.48,cloudy:true,iris:'#5a6a6a'},smoke:'cigar',mouth:'clench',bandolier:true,neck:'scarf',scarf:'#5a1a14',brows:'angry',vest:'#2a2420',coat:'#2a2622',stubble:true,age:1},
  under:{bg:['#2a3a24','#030602'],rim:'#bff59a',hat:'top',hatc:'#0e0c0c',crepe:true,hatTilt:0,hw:8.2,jaw:1.2,gaunt:true,skin:['#d6d2c4','#7e7a6e'],hair:'#141414',longHair:'side',fh:'none',
    eyes:{hollow:true,glow:'#d4ff9a'},mouth:'thin',collar:'wing',cravat:'#0a0a0a',tape:true,coat:'#121212',brows:'flat',nose:'hook',smoke:false,scar:false,neck:'none',age:2},
  snake:{bg:['#1e4a2c','#020804'],rim:'#7dff9a',skin:['#c8956a','#82552f'],hat:'gambler',hatc:'#141210',hatTilt:6,band:'snake',card:true,fh:'pencil+goatee',hair:'#141008',
    eyes:{slit:true,iris:'#d8e04a',glow:true,gaze:.5,open:.6,white:'#e8e2b0'},brows:'cocked',mouth:'sneer',goldTooth:true,smoke:'cigarette',tattoo:true,vest:'#1e4a30',vestPattern:true,earring:'fang',neck:'bolo',coat:'#161816',shirt:'#d8d0b8',scar:false},
  banker:{bg:['#5a4612','#0d0902'],rim:'#ffe08a',skin:['#ecc0a0','#ae7a5c'],hat:'bowler',hatc:'#1a1614',hatTilt:-3,hw:10.4,jaw:1.4,neckW:5.8,bulk:4,jowls:true,chin2:true,fh:'mutton',hair:'#9a968e',monocle:true,smoke:'cigar',cigarBand:'#c8a040',
    mouth:'grin',goldTooth:true,cravat:'#6a1a2a',pin:true,vest:'#3a2c22',watch:true,brows:'cocked',coat:'#1c1a1e',shirt:'#f0ebe0',neck:'none',rosy:true,eyes:{open:.55,iris:'#4a3a2a'},scar:false,age:1},
  vesper:{fem:true,bg:['#6a0e22','#0e0205'],rim:'#ff5a7a',skin:['#ecc8b0','#a8806a'],hat:'riding',hatc:'#120e10',hatTilt:-14,veil:true,feather:'#1c1416',rose:true,hairdo:'updo',hair:'#160c08',
    eyes:{lashes:true,liner:true,iris:'#3a7a4a',open:.72,tilt:.4},lips:'#c0142a',beautyMark:true,dress:'#7a0e1e',choker:true,earring:'drop',brows:'arched',rouge:true,neck:'none',smoke:false,scar:false},
  bicah:{bg:['#6a1408','#0e0302'],rim:'#ff6a3a',skin:['#eac3a0','#a57758'],hat:'cowboy',hatc:'#d8cba8',hatTilt:7,conchos:true,hatband:'#3a2a1a',fh:'walrus',longHair:'greasy',hair:'#c9a35a',
    eyes:{iris:'#9ac0d8',open:.52,gaze:-.4},brows:'angry',mouth:'sneer',goldTooth:true,neck:'scarf',scarf:'#8a1a12',vest:'#3a2a1c',coat:'#2a2622',shirt:'#b8a888',rat:true,stubble:true,smoke:false,scar:'cheek'}
};
const HUMAN_LOOK={human:true,hat:'cowboy',hatTilt:-3,hatc:'#3a2a1e',mask:true,maskC:'#7a2218',scar:false,patch:false,smoke:false,coat:'#4a3a2a',fh:'stubble',neck:'none',eyes:{open:.5,iris:'#6f8494'},brows:'angry',feather:'#c8b8a0',vest:null};
// the regulars on the trail, each with a look of their own
const OUTLAW_LOOK={
  'Etta Boone':{hairdo:'braids',hat:'cowboy',bandolier:true,ribbon:'#2a4a6a'},
  'Clem Hargrove':{age:2,fh:'beard',hat:'slouch',hatHole:true,smoke:'toothpick',hair:'#dcd6ca'},
  'Ro Pike':{hairdo:'bob',hat:'flat',neck:'scarf',brows:'angry'},
  'Ezekiel Marsh':{collar:'preacher',hat:'top',fh:'mutton',brows:'worried',age:1},
  'Hank Tolliver':{hat:'none',hairdo:'bald',fh:'beard',hw:10,jaw:1.8,bulk:3,neckW:5.6,mouth:'grim'},
  'Josie Lark':{hat:'cowboy',flower:true,freckles:true,hairdo:'long'},
  'Amos Reddick':{patch:true,fh:'beard',hair:'#8a3a1a',mouth:'grim'},
  'Lula Sweeney':{hairdo:'ringlets',hat:'none',hair:'#7a2a12',freckles:true},
  'Virgil Oakes':{badge:true,fh:'walrus',age:1,hat:'cattleman',mouth:'grim'},
  'Cora Whitlock':{glasses:'round',hairdo:'bun',hat:'none'},
  'Otis Bramble':{age:2,fh:'mutton',hat:'bowler',chin2:true,hw:10},
  'Wade Kittredge':{mask:true,hat:'cowboy',maskC:'#23497e'},
  'Mae Calloway':{hat:'cowboy',hairdo:'long',earring:'hoop',smoke:'cigarette'},
  'Jeb Fenwick':{smoke:'toothpick',fh:'stubble',hat:'slouch',mouth:'smirk'},
  'Gus Pettibone':{hat:'bowler',fh:'handlebar',neck:'tie',vest:'#4a2a22'},
  'Nell Ashby':{hairdo:'braids',hat:'none',flower:true},
  'Bo Tanner':{hat:'flat',fh:'goatee',bandolier:true,mouth:'sneer'},
  'Ruth Calder':{age:2,hairdo:'bun',hat:'none',shawl:'#2a3a46',hair:'#cfc6b4'},
  'Cyrus Vane':{hat:'top',fh:'pencil',neck:'tie',vest:'#3a2a46',mouth:'smirk',brows:'cocked'},
  'Hattie Bell':{hat:'bowler',hairdo:'bob',smoke:'cigarette'},
  'Moses Drury':{fh:'beard',hat:'cattleman',age:1,hw:10},
  'Tom Yates':{fh:'none',freckles:true,hat:'cowboy',jaw:0,age:0,mouth:'grin',stubble:false,smoke:false}
};
function bossPortrait(bd,frame){return portrait(bd.key,Object.assign({boss:true},BOSS_LOOK[bd.key]||{}),frame)}
function portraitFor(p,frame){
  if(p.isHuman) return portrait('You the rider',HUMAN_LOOK,frame);
  if(p.bossDef) return bossPortrait(p.bossDef,frame);
  return portrait(p.name,Object.assign({fem:p.fem,tier:p.tier},OUTLAW_LOOK[p.name]?{mask:false,badge:false}:{},OUTLAW_LOOK[p.name]||{},p.tier==='v'&&!(OUTLAW_LOOK[p.name]||{}).scar?{scar:'brow'}:{}),frame);
}
