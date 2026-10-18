/* ================= portraits: gritty outlaw busts, lit like a Western ================= */
// Each portrait is a list of shapes {d, fill, op, stroke, sw, clip} drawn in a 64x64 box.
// fill: '#hex' | {lin:[x1,y1,x2,y2], stops:[[offset,'#hex',alpha],...]} | {rad:[cx,cy,r], stops:[...]}
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return ()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
const SKIN=[['#e9bf98','#b07a55'],['#d9a57c','#9a6440'],['#c48a5e','#86532f'],['#a06a44','#683e22'],['#7d4e2f','#4c2a14'],['#5e3a22','#331c0c'],['#e6d2bf','#a8917c']];
const HATC=['#2a1c13','#3f2c1e','#5c4129','#16120f','#6e5c46','#4a2318','#30302a','#7a6a52'];
const COAT=['#3a2a20','#22303a','#4a2620','#2a3828','#1c1a18','#56432e','#3a2c46','#62533f'];
const HAIR=['#120c08','#2e1c10','#5a3c22','#9a7448','#cfc6b4','#6e2a14','#262626'];
const BAND=['#8a241a','#23497e','#b8913a','#2b6b3f','#d9cdb4','#5a1d6e'];
function portraitShapes(name,o={}){
  const r=rng(name), pick=a=>a[Math.floor(r()*a.length)], chance=p=>r()<p;
  const fem=!!o.fem, boss=!!o.boss, human=!!o.human;
  const [skin,skinD]=o.skin||pick(SKIN);
  const hatc=o.hatc||pick(HATC), coat=o.coat||pick(COAT), hair=o.hair||pick(HAIR);
  const hat=o.hat||pick(['cowboy','cowboy','cowboy','cowboy','flat','bowler','top','none']);
  const fh=fem?'none':(o.fh||pick(['stubble','stubble','stache','horseshoe','beard','goatee','mutton','none']));
  const mask=o.mask!=null?o.mask:(!fem&&!boss&&chance(.18));
  const scar=o.scar!=null?o.scar:chance(boss?.5:.25);
  const patch=o.patch!=null?o.patch:(!fem&&chance(.08));
  const smoke=o.smoke!=null?o.smoke:(!mask&&chance(boss?.45:.25));
  const band=pick(BAND);
  const jaw=o.jaw||(fem?0:r()*1.6), gaunt=!!o.gaunt;
  const S=[];
  const add=(d,fill,extra)=>S.push(Object.assign({d,fill},extra||{}));
  const L=(x1,y1,x2,y2,stops)=>({lin:[x1,y1,x2,y2],stops});
  const RG=(cx,cy,rr,stops)=>({rad:[cx,cy,rr],stops});

  // backdrop: a lamp behind the subject, falling off into dark
  const bg=boss?['#7a1c10','#1a0503']:human?['#3c4a52','#0a0e10']:['#5a4028','#0d0805'];
  add('M0 0 H64 V64 H0 Z',RG(32,26,40,[[0,bg[0],1],[1,bg[1],1]]));
  add('M0 0 H64 V64 H0 Z',RG(30,22,20,[[0,boss?'#ff9a5a':'#ffd9a0',boss?.28:.18],[1,'#000',0]]));

  // long hair behind the head
  if(fem) add('M19.5 27 C19 13 45 13 44.5 27 C45.5 36 46.5 44 45 50 C40 52 24 52 19 50 C17.5 44 18.5 36 19.5 27 Z',hair);
  if(o.longHair&&!fem){add('M20 24 C19 34 19.4 42 18 49 C22 50.5 26 49 26.5 46 L37.5 46 C38 49 42 50.5 46 49 C44.6 42 45 34 44 24 Z',hair); add('M20 24 C19 34 19.4 42 18 49 C22 50.5 26 49 26.5 46 L37.5 46 C38 49 42 50.5 46 49 C44.6 42 45 34 44 24 Z',L(18,0,46,0,[[0,'#fff',.12],[.5,'#000',.1],[1,'#000',.5]])); add('M21 30 C21.4 38 20.6 44 19.6 48 M42.6 30 C43 38 43.6 44 44.4 48','none',{stroke:'#000',sw:.4,op:.25})}

  // duster coat, collar up, lit from the left
  add('M1 66 C3 52 13 46.5 24 45 L32 51 L40 45 C51 46.5 61 52 63 66 Z',L(10,46,54,64,[[0,coat,1],[1,'#000',1]]));
  add('M1 66 C3 52 13 46.5 24 45 L32 51 L40 45 C51 46.5 61 52 63 66 Z',L(0,50,64,50,[[0,'#ffffff',.10],[.45,'#000',0],[1,'#000',.45]]));
  if(o.collar==='preacher'){
    add('M24 45 L32 51 L40 45 L37 44.5 L32 47 L27 44.5 Z','#111');
    add('M30.5 46 L33.5 46 L33.2 48.4 L30.8 48.4 Z','#f2efe6');
  } else {
    add('M28 45 L32 53 L36 45 Z',o.shirt||'#d8ccb0');
    add('M24 44.6 L32 56 L28.6 45 Z','#000',{op:.45});
    add('M40 44.6 L32 56 L35.4 45 Z','#000',{op:.3});
    add('M23.5 44.2 L20.5 51 L28 46.5 Z',coat); add('M40.5 44.2 L43.5 51 L36 46.5 Z',coat);
    add('M23.5 44.2 L20.5 51 L28 46.5 Z','#000',{op:.25});
  }
  if(o.shawl){add('M2 66 C4 55 12 49 22 46.6 C26 50 29 52.5 32 53.5 C35 52.5 38 50 42 46.6 C52 49 60 55 62 66 Z',o.shawl); add('M2 66 C4 55 12 49 22 46.6 C26 50 29 52.5 32 53.5 C35 52.5 38 50 42 46.6 C52 49 60 55 62 66 Z',L(0,50,64,50,[[0,'#fff',.08],[.5,'#000',0],[1,'#000',.5]])); add('M10 58 C18 54 26 55 32 58 C38 55 46 54 54 58','none',{stroke:'#d8b070',sw:.5,op:.35})}
  // neck
  add('M27.6 37 L27.6 46.4 L36.4 46.4 L36.4 37 Z',skin);
  add('M27.6 37 L27.6 46.4 L36.4 46.4 L36.4 37 Z',L(0,38,0,46,[[0,'#000',.55],[1,'#000',.15]]));
  if(!mask&&chance(.45)&&o.collar!=='preacher') add('M25 44.4 C29 49.5 35 49.5 39 44.4 L36.6 49.4 C34 52.4 30 52.4 27.4 49.4 Z',band);
  // ears
  add('M22.4 27.5 C20.6 27.5 20.4 31.6 22.6 32.6 Z',skin); add('M41.6 27.5 C43.4 27.5 43.6 31.6 41.4 32.6 Z',skinD);
  if(fem&&o.earring!==false) add('M21.6 33.6 C21.6 32.8 22.6 32.8 22.6 33.6 C22.6 34.6 21.6 34.6 21.6 33.6 Z','#e8c060');

  // head: angular jaw, cheekbones
  const jw=1+jaw*.6, cx=32;
  const head=`M22.8 26 C22.8 19 26.8 15.4 32 15.4 C37.2 15.4 41.2 19 41.2 26 C41.2 ${31+jaw} ${40.6+jw*.2} ${34.5+jaw*.6} ${38.4+jaw*.4} ${38.4+jaw*.5} C36.6 ${41.4+jaw*.4} 34.4 ${42.8+jaw*.3} 32 ${42.8+jaw*.3} C29.6 ${42.8+jaw*.3} 27.4 ${41.4+jaw*.4} ${25.6-jaw*.4} ${38.4+jaw*.5} C${23.4-jw*.2} ${34.5+jaw*.6} 22.8 ${31+jaw} 22.8 26 Z`;
  const hi=S.length; add(head,skin);
  // key light from the left, deep shadow on the right
  add(head,L(22,0,42,0,[[0,'#fff3dc',.2],[.4,'#000',0],[.72,skinD,.5],[1,'#000',.6]]),{clip:hi});
  if(gaunt){add('M24.6 31 C25.6 33.4 27 35.4 28.4 36.6 C26.6 36.4 25 34.4 24.4 32 Z','#3a2e2a',{op:.3,clip:hi}); add('M39.4 31 C38.4 33.4 37 35.4 35.6 36.6 C37.4 36.4 39 34.4 39.6 32 Z','#1a1210',{op:.45,clip:hi})}
  // cheekbone + jaw shadow
  add('M35 32.5 C37 33.6 39 33.6 40.6 31.8 C40 35.5 38.6 38 36.8 39.6 C36.4 37 35.8 34.6 35 32.5 Z','#000',{op:.12,clip:hi});
  add(`M24 38 C27 ${42+jaw*.3} 37 ${42+jaw*.3} 40 38 L41 46 L23 46 Z`,'#000',{op:.18,clip:hi});
  if(boss) add(head,L(36,0,42,0,[[0,'#000',0],[.75,'#ff5a2a',0],[1,'#ff6a3a',.55]]),{clip:hi});

  // eyes: squinting slits that catch a single glint
  const eyeY=28.4;
  const eye=(x,flip)=>{const a=flip?-1:1, x0=x, x1=x+4.4*a;
    add(`M${x0} ${eyeY} C${x0+1.3*a} ${eyeY-1.15} ${x1-1.2*a} ${eyeY-1.15} ${x1} ${eyeY-.3} C${x1-1.3*a} ${eyeY+.75} ${x0+1.2*a} ${eyeY+.8} ${x0} ${eyeY} Z`,'#140b06');
    const gx=x+2.9*a; add(`M${gx-.38} ${eyeY-.3} C${gx-.38} ${eyeY-.82} ${gx+.38} ${eyeY-.82} ${gx+.38} ${eyeY-.3} C${gx+.38} ${eyeY+.22} ${gx-.38} ${eyeY+.22} ${gx-.38} ${eyeY-.3} Z`,boss?'#ffd0a0':'#fff',{op:.9});
  };
  eye(25.9,false); if(!patch) eye(38.1,true);
  // brows: heavy, angled hard on bosses
  const bIn=boss?27.9:27.2, bOut=boss?25.5:26.1;
  add(`M24.8 ${bOut} L30.9 ${bIn} L30.7 ${bIn+.9} L25 ${bOut+.8} Z`,hair==='#cfc6b4'?'#9a9284':hair);
  add(`M39.2 ${bOut} L33.1 ${bIn} L33.3 ${bIn+.9} L39 ${bOut+.8} Z`,hair==='#cfc6b4'?'#9a9284':hair);
  // nose
  add('M32.4 28.6 C32.9 31 33.7 33 34 34.2 C33.2 34.7 31.9 34.7 31.1 34.2 C31.8 33.6 32.2 31.2 32.4 28.6 Z','#000',{op:.24});
  if(o.redNose) add('M30.6 32.6 C30.6 31 34 31 34 32.6 C34 34.6 30.6 34.6 30.6 32.6 Z','#c0443a',{op:.55});
  // mouth
  const mY=37.4+jaw*.25;
  if(fem) add(`M29.4 ${mY} C30.6 ${mY-.9} 33.4 ${mY-.9} 34.6 ${mY} C33.4 ${mY+1} 30.6 ${mY+1} 29.4 ${mY} Z`,o.lips||'#8e2a22');
  else if(o.smirk) add(`M29.4 ${mY+.2} C31 ${mY+.4} 33 ${mY} 35.2 ${mY-1.1}`,'none',{stroke:'#2a120a',sw:.75,op:.9});
  else add(`M29.2 ${mY} C30.8 ${mY+.35} 33.2 ${mY+.35} 34.8 ${mY-.15}`,'none',{stroke:'#2a120a',sw:.75,op:.9});
  if(o.goldTooth) add(`M32.6 ${mY-.05} L33.5 ${mY-.05} L33.4 ${mY+.6} L32.7 ${mY+.6} Z`,'#e8c060');
  // facial hair
  const fhc=hair==='#cfc6b4'?'#b8b0a2':hair;
  if(fh==='stubble'||fh==='beard'||fh==='goatee'||fh==='horseshoe') add(`M23.6 31 C24 ${38+jaw} 28 ${43.4+jaw*.3} 32 ${43.4+jaw*.3} C36 ${43.4+jaw*.3} 40 ${38+jaw} 40.4 31 C39.4 35 37.6 36.2 36 36.2 C35 34.8 29 34.8 28 36.2 C26.4 36.2 24.6 35 23.6 31 Z`,fhc,{op:.3,clip:hi});
  if(fh==='beard') add(`M23.6 31.5 C24 ${39+jaw} 28 ${44.8+jaw*.3} 32 ${44.8+jaw*.3} C36 ${44.8+jaw*.3} 40 ${39+jaw} 40.4 31.5 C39 36 37 38.2 35.6 ${mY+.8} C34.6 ${mY+1.6} 29.4 ${mY+1.6} 28.4 ${mY+.8} C27 38.2 25 36 23.6 31.5 Z`,fhc);
  if(fh==='goatee') add(`M30 ${mY+.9} C30.6 ${mY+4.4} 33.4 ${mY+4.4} 34 ${mY+.9} C33 ${mY+1.6} 31 ${mY+1.6} 30 ${mY+.9} Z`,fhc);
  if(fh==='stache'||fh==='beard'||fh==='goatee') add(`M27.8 ${mY-.4} C29 ${mY-2.8} 35 ${mY-2.8} 36.2 ${mY-.4} C34.6 ${mY-1} 33 ${mY-.8} 32 ${mY-.3} C31 ${mY-.8} 29.4 ${mY-1} 27.8 ${mY-.4} Z`,fhc);
  if(fh==='horseshoe') add(`M28.2 ${mY-.2} C28.8 ${mY-2.8} 35.2 ${mY-2.8} 35.8 ${mY-.2} L36.1 ${mY+4.4} L35 ${mY+4.4} L34.7 ${mY+.2} C33.2 ${mY-.8} 30.8 ${mY-.8} 29.3 ${mY+.2} L29 ${mY+4.4} L27.9 ${mY+4.4} Z`,fhc);
  if(fh==='mutton'){add('M22.8 26 L23 35.5 C24.4 38.6 27.4 37.8 28.4 35.6 L25.4 30 Z',fhc); add('M41.2 26 L41 35.5 C39.6 38.6 36.6 37.8 35.6 35.6 L38.6 30 Z',fhc); add(`M28.4 ${mY-.4} C29.4 ${mY-2.2} 34.6 ${mY-2.2} 35.6 ${mY-.4} C34 ${mY-.9} 30 ${mY-.9} 28.4 ${mY-.4} Z`,fhc)}
  if(o.beautyMark) add('M34.9 34.4 C34.9 34 35.5 34 35.5 34.4 C35.5 34.8 34.9 34.8 34.9 34.4 Z','#2a120a');
  // scar across the brow and eye
  if(scar) add('M35.4 23.8 L37.2 27.2 M37.6 28.6 L38.6 31.4','none',{stroke:'#e2a08a',sw:.55,op:.85});
  if(patch){add('M35.8 28.6 C35.8 26.2 40.4 26.2 40.4 28.6 C40.4 31 35.8 31 35.8 28.6 Z','#0c0806'); add('M23 24.6 L36.6 27.4 M40 27.6 L41.6 26.6','none',{stroke:'#0c0806',sw:.6})}
  if(o.glasses){add('M26 28.4 C26 26.6 30.6 26.6 30.6 28.4 C30.6 30.2 26 30.2 26 28.4 Z','none',{stroke:'#c8b080',sw:.4}); add('M33.4 28.4 C33.4 26.6 38 26.6 38 28.4 C38 30.2 33.4 30.2 33.4 28.4 Z','none',{stroke:'#c8b080',sw:.4}); add('M30.6 28 L33.4 28','none',{stroke:'#c8b080',sw:.35})}
  if(o.monocle){add('M33.2 28.4 C33.2 26.2 38.6 26.2 38.6 28.4 C38.6 30.6 33.2 30.6 33.2 28.4 Z','none',{stroke:'#e8c060',sw:.5}); add('M36 30.6 C36.5 36 38 41 41 46','none',{stroke:'#e8c060',sw:.3,op:.8})}
  // bandana mask over the lower face
  if(mask){add('M22.6 31 C27 33.4 37 33.4 41.4 31 C41.4 37 38.6 42.4 32 46 C25.4 42.4 22.6 37 22.6 31 Z',band); add('M22.6 31 C27 33.4 37 33.4 41.4 31 C41.4 37 38.6 42.4 32 46 C25.4 42.4 22.6 37 22.6 31 Z',L(22,0,42,0,[[0,'#fff',.08],[.5,'#000',0],[1,'#000',.45]])); add('M26 35 C29 36 35 36 38 35 M27 38.6 C30 39.6 34 39.6 37 38.6','none',{stroke:'#000',sw:.35,op:.35})}
  // cigar, cigarette or toothpick
  if(smoke){
    add(`M34.6 ${mY+.1} L40.6 ${mY+1.9} L40.3 ${mY+2.9} L34.4 ${mY+1} Z`,o.cigarette?'#efe8d8':'#5a3a22');
    add(`M40.6 ${mY+2.4} C40.6 ${mY+1.6} 41.6 ${mY+1.6} 41.6 ${mY+2.4} C41.6 ${mY+3.2} 40.6 ${mY+3.2} 40.6 ${mY+2.4} Z`,'#ff7a30');
    add('M36 0 H64 V64 H36 Z',RG(41.1,mY+2.4,3.2,[[0,'#ff8a3a',.55],[1,'#ff6a20',0]]));
    add(`M41.6 ${mY+1.6} C44 ${mY-1} 43 ${mY-4} 46 ${mY-6} C49 ${mY-8} 48 ${mY-11} 51 ${mY-13}`,'none',{stroke:'#e8e2d8',sw:2.2,op:.08});
    add(`M41.6 ${mY+1.6} C44 ${mY-1} 43 ${mY-4} 46 ${mY-6} C49 ${mY-8} 48 ${mY-11} 51 ${mY-13}`,'none',{stroke:'#efe9df',sw:.7,op:.22});
  }
  // hair at the temples
  if(hat!=='none') {add('M22.6 20.5 L22.6 28 L24.4 26.4 L24.4 21 Z',hair); add('M41.4 20.5 L41.4 28 L39.6 26.4 L39.6 21 Z',hair)}
  if(hat==='none'&&!fem) add('M22.4 27.5 C21.6 10.5 42.4 10.5 41.6 27.5 C39.4 20.6 24.6 20.6 22.4 27.5 Z',hair);
  if(hat==='none'&&fem){add('M21.8 29 C20.8 10 43.2 10 42.2 29 C40 21.4 35 19.8 32 20 C29 19.8 24 21.4 21.8 29 Z',hair); add('M21.8 29 C20.8 10 43.2 10 42.2 29 C40 21.4 35 19.8 32 20 C29 19.8 24 21.4 21.8 29 Z',L(22,0,42,0,[[0,'#fff',.12],[.5,'#000',0],[1,'#000',.4]])); if(o.bun) add('M28 14.6 C28 10.4 36 10.4 36 14.6 C36 18 28 18 28 14.6 Z',hair); if(o.feather) add('M38 17 C42 10 46 6 50 4 C47 8 44 13 39.6 18 Z','#c8343a',{op:.9})}

  // the hat's shadow falls across the eyes
  if(hat!=='none') add(head,L(0,17,0,32,[[0,'#000',.9],[.62,'#000',.62],[1,'#000',0]]),{clip:hi});
  // hats
  const hatHi='#ffffff';
  if(hat==='cowboy'||hat==='flat'||hat==='bowler'||hat==='top'){
    if(hat==='cowboy'){
      add('M21.6 22 C21 12 25 6.8 32 8.6 C39 6.8 43 12 42.4 22 Z',L(22,0,42,0,[[0,hatc,1],[1,'#000',1]]));
      add('M21.6 22 C21 12 25 6.8 32 8.6 C39 6.8 43 12 42.4 22 Z',L(22,0,42,0,[[0,hatHi,.14],[.5,'#000',0],[1,'#000',.35]]));
      add('M32 9.4 C31 13 31 17 32 20','none',{stroke:'#000',sw:.7,op:.4});
    }
    if(hat==='flat') add('M21 22 L22.8 12.4 L41.2 12.4 L43 22 Z',L(21,0,43,0,[[0,hatc,1],[1,'#000',1]]));
    if(hat==='bowler') add('M22.4 22 C22.4 9 41.6 9 41.6 22 Z',L(22,0,42,0,[[0,hatc,1],[1,'#000',1]]));
    if(hat==='top') add('M23.6 22 L24 3 L40 3 L40.4 22 Z',L(24,0,40,0,[[0,hatc,1],[1,'#000',1]]));
    // band
    const by=hat==='top'?17.6:18.6;
    add(`M22 ${by} C28 ${by+1.6} 36 ${by+1.6} 42 ${by} L42.2 ${by+2.8} C36 ${by+4.2} 28 ${by+4.2} 21.8 ${by+2.8} Z`,o.hatband||'#120c08');
    // brim, curled up at the sides
    const w=hat==='cowboy'?25:hat==='flat'?20:hat==='bowler'?14:15, curl=hat==='cowboy'?4.6:hat==='bowler'?1.2:1.4;
    add(`M${32-w} ${24-curl} C${32-w*.7} ${20.6} ${32-w*.35} 20.4 32 20.8 C${32+w*.35} 20.4 ${32+w*.7} 20.6 ${32+w} ${24-curl} C${32+w*.6} 25.4 ${32+w*.3} 26 32 25.8 C${32-w*.3} 26 ${32-w*.6} 25.4 ${32-w} ${24-curl} Z`,L(0,20.4,0,26,[[0,hatc,1],[1,'#000',1]]));
    add(`M${32-w} ${24-curl} C${32-w*.7} ${20.6} ${32-w*.35} 20.4 32 20.8 C${32+w*.35} 20.4 ${32+w*.7} 20.6 ${32+w} ${24-curl}`,'none',{stroke:boss?'#ff8a5a':'#fff0d0',sw:.45,op:.4});
  }
  // human rider: bandana up, eyes lost in shadow
  // vignette
  add('M0 0 H64 V64 H0 Z',RG(32,30,36,[[.62,'#000',0],[1,'#000',.7]]));
  return S;
}
let PID=0;
function portraitSVG(shapes){
  const id='pt'+(++PID); let defs='', body='', gi=0;
  const clips={};
  shapes.forEach((s,i)=>{
    let fill=s.fill;
    if(fill&&typeof fill==='object'){
      const gid=`${id}g${gi++}`, st=fill.stops.map(([o,c,a])=>`<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
      if(fill.lin){const [x1,y1,x2,y2]=fill.lin; defs+=`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st}</linearGradient>`}
      else {const [cx,cy,rr]=fill.rad; defs+=`<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${rr}">${st}</radialGradient>`}
      fill=`url(#${gid})`;
    }
    let clip='';
    if(s.clip!=null){if(!clips[s.clip]){clips[s.clip]=`${id}c${s.clip}`; defs+=`<clipPath id="${clips[s.clip]}"><path d="${shapes[s.clip].d}"/></clipPath>`} clip=` clip-path="url(#${clips[s.clip]})"`}
    body+=`<path d="${s.d}" fill="${fill||'none'}"${s.op!=null?` opacity="${s.op}"`:''}${s.stroke?` stroke="${s.stroke}" stroke-width="${s.sw}" stroke-linecap="round"`:''}${clip}/>`;
  });
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}<clipPath id="${id}cc"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#${id}cc)">${body}</g></svg>`;
}
const PORTRAIT_CACHE=new Map();
function portrait(name,o={}){
  const key=name+'|'+JSON.stringify(o);
  if(!PORTRAIT_CACHE.has(key)) PORTRAIT_CACHE.set(key,portraitShapes(name,o));
  return portraitSVG(PORTRAIT_CACHE.get(key));
}
