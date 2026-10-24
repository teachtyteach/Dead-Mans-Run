/* ================= basics ================= */
const $=id=>document.getElementById(id);
document.documentElement.dataset.screen='sTitle';
const REDUCED=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let TOKEN=0, PAUSED=false;
function later(fn,ms){const t=TOKEN; const run=()=>{if(t!==TOKEN) return; if(PAUSED){setTimeout(run,250); return} fn()}; setTimeout(run,ms)}
function speedMul(){return meta.speed==='fast'?0.45:1}
const SCREENS=['sTitle','sChapter','sShop','sEvent','sGame','sEnd'];
function show(id){
  document.documentElement.dataset.screen=id;
  setScene(id);
  if(id!=='sGame') heartbeat(false);
  const was=SND.scene; SND.scene=id; musicLevel();
  if((id==='sGame')!==(was==='sGame')&&SND.ctx&&SND.want&&meta.music) startMusic();
  document.documentElement.classList.add('locked');
  SCREENS.forEach(s=>{const el=$(s), on=s===id;
    if(on&&el.hidden){el.hidden=false; el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter')}
    else if(!on) el.hidden=true});
  $('chapterBg').classList.toggle('on',id==='sChapter');
  window.scrollTo(0,0);
}
function shake(big){const g=$('sGame'); if(REDUCED||!g) return; g.classList.remove('shake','big'); void g.offsetWidth; g.classList.add('shake'); if(big) g.classList.add('big')}
function flash(red){if(REDUCED) return; const f=document.createElement('div'); f.className='flash'+(red?' red':''); document.body.appendChild(f); setTimeout(()=>f.remove(),800)}

/* ================= the air in each saloon: dust, embers, drips, sand, rain, sparkle, fireflies, ash ================= */
const AIR={mode:'dust'};
const SALOON_AIR=['dust','dust','embers','drips','sand','rain','sparkle','fireflies','ash'];
(function air(){
  const cv=$('dust'); if(!cv||REDUCED) return; const ctx=cv.getContext('2d');
  let W=0,H=0,DPR=1, motes=[], mode='', lastCol='';  // soft motes don't need retina pixels: 1x keeps the GPU cool
  function size(){lastCol='';W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
  size(); addEventListener('resize',size);
  const R0=Math.random;
  const spawn={
    dust:()=>({x:R0(),y:R0(),r:.4+R0()*1.6,s:.00004+R0()*.00012,p:R0()*6.28,a:.15+R0()*.45}),
    embers:()=>({x:.2+R0()*.6,y:1+R0()*.2,r:.6+R0()*1.4,s:.00008+R0()*.00016,p:R0()*6.28,a:.4+R0()*.5,life:R0()}),
    drips:()=>({x:R0(),y:-R0()*.5,r:.8+R0()*.8,s:.0003+R0()*.0003,p:0,a:.25+R0()*.3,wait:R0()*4000}),
    sand:()=>({x:-R0()*.3,y:R0(),r:.4+R0()*1.1,s:.00012+R0()*.0002,p:R0()*6.28,a:.15+R0()*.35}),
    rain:()=>({x:R0()*1.2,y:-R0(),r:10+R0()*14,s:.0011+R0()*.0007,p:0,a:.05+R0()*.09}),
    sparkle:()=>({x:R0(),y:R0(),r:.6+R0()*1.2,s:0,p:R0()*6.28,a:.5+R0()*.5,sp:.0015+R0()*.003}),
    fireflies:()=>({x:R0(),y:.3+R0()*.7,r:1.2+R0()*1.4,s:.00002,p:R0()*6.28,a:.6+R0()*.4,vx:(R0()-.5)*.00005,vy:(R0()-.5)*.00004}),
    ash:()=>({x:R0(),y:-R0(),r:.8+R0()*1.8,s:.00004+R0()*.00008,p:R0()*6.28,a:.25+R0()*.4})
  };
  const COUNT={dust:48,embers:34,drips:14,sand:70,rain:90,sparkle:40,fireflies:22,ash:46};
  function reseed(){mode=AIR.mode; motes=[]; for(let i=0;i<COUNT[mode];i++){const m=spawn[mode](); if(mode!=='embers'&&mode!=='drips') m.y=R0(); motes.push(m)}}
  let last=performance.now();
  function frame(now){
    const dt=Math.min(50,now-last); last=now;
    if(mode!==AIR.mode) reseed();
    if(!document.hidden){
      ctx.globalAlpha=1; ctx.clearRect(0,0,W,H);
      for(const m of motes){
        let col='255,226,170', a=m.a;
        if(mode==='dust'){m.y-=m.s*dt; m.p+=dt*.0006; m.x+=Math.sin(m.p)*.00006*dt; if(m.y<-.02){m.y=1.02;m.x=R0()}
          a*=(.25+(1-Math.min(1,Math.abs(m.x-.5)*2.2))*.85)*(.7+.3*Math.sin(m.p*3))}
        else if(mode==='embers'){m.y-=m.s*dt; m.p+=dt*.003; m.x+=Math.sin(m.p)*.00012*dt; m.life-=dt*.00012; col='255,'+(120+Math.round(80*Math.sin(m.p)))+',50'; a*=Math.max(0,m.life)*(.6+.4*Math.sin(m.p*2.3));
          if(m.y<-.02||m.life<=0) Object.assign(m,spawn.embers())}
        else if(mode==='drips'){if(m.wait>0){m.wait-=dt; continue} m.y+=m.s*dt; m.s+=.0000006*dt; col='200,225,255'; if(m.y>1.02) Object.assign(m,spawn.drips(),{y:-.02})}
        else if(mode==='sand'){m.x+=m.s*dt*(1.2+Math.sin(now*.0004)); m.p+=dt*.002; m.y+=Math.sin(m.p)*.00004*dt; col='230,170,110'; if(m.x>1.05){m.x=-.05; m.y=R0()}}
        else if(mode==='rain'){m.y+=m.s*dt; m.x-=m.s*dt*.18; if(m.y>1.05){m.y=-.05-R0()*.2; m.x=R0()*1.2}
          ctx.globalAlpha=m.a; if(lastCol!=='r'){ctx.strokeStyle='rgb(190,210,235)'; ctx.lineWidth=1; lastCol='r'} ctx.beginPath(); ctx.moveTo(m.x*W,m.y*H); ctx.lineTo(m.x*W+m.r*.18,m.y*H-m.r); ctx.stroke(); continue}
        else if(mode==='sparkle'){m.p+=m.sp*dt; a*=Math.max(0,Math.sin(m.p))**6; col='255,250,230'; if(m.p>6.28*3){Object.assign(m,spawn.sparkle())}
          if(a>.02){ctx.globalAlpha=a; if(lastCol!==col){ctx.fillStyle=`rgb(${col})`; lastCol=col} const s=m.r*2.4; ctx.fillRect(m.x*W-s,m.y*H-.5,s*2,1); ctx.fillRect(m.x*W-.5,m.y*H-s,1,s*2)}}
        else if(mode==='fireflies'){m.p+=dt*.0012; m.x+=m.vx*dt+Math.sin(m.p*.7)*.00003*dt; m.y+=m.vy*dt+Math.cos(m.p*.5)*.00003*dt; if(m.x<0||m.x>1) m.vx*=-1; if(m.y<.2||m.y>1) m.vy*=-1;
          a*=Math.max(0,Math.sin(m.p))**3; col='210,255,120'; if(a>.02){const g=ctx.createRadialGradient(m.x*W,m.y*H,0,m.x*W,m.y*H,m.r*6); g.addColorStop(0,`rgba(${col},${(a*.5).toFixed(3)})`); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.globalAlpha=1; ctx.fillStyle=g; lastCol=''; ctx.fillRect(m.x*W-m.r*6,m.y*H-m.r*6,m.r*12,m.r*12)}}
        else if(mode==='ash'){m.y+=m.s*dt; m.p+=dt*.001; m.x+=Math.sin(m.p)*.00008*dt; col='180,175,170'; if(m.y>1.02){m.y=-.02; m.x=R0()}}
        if(a<=.005) continue;
        ctx.globalAlpha=Math.min(1,a); if(lastCol!==col){ctx.fillStyle=`rgb(${col})`; lastCol=col} ctx.beginPath(); ctx.arc(m.x*W,m.y*H,m.r,0,6.283); ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
let BOLT=null;
window.onThunder=k=>{if(REDUCED||$('sGame').hidden&&$('sShop').hidden) return; if(SND.saloon===8||(SND.saloon===5&&k!=='ev_thunder2')){const b=$('bolt'); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on')}};
function lightning(on){
  clearTimeout(BOLT); BOLT=null; return;
  const fire=()=>{const b=$('bolt'); if(b&&!$('sGame').hidden){b.classList.remove('on'); void b.offsetWidth; b.classList.add('on')} BOLT=setTimeout(fire,9000+Math.random()*14000)};
  BOLT=setTimeout(fire,4000+Math.random()*6000);
}
function setScene(id){
  const sl=(R&&id!=='sTitle')?R.level:0;
  document.documentElement.dataset.saloon=sl||'';
  document.documentElement.dataset.back=(meta.back&&meta.back!=='auto')?meta.back:(sl||1);
  AIR.mode=SALOON_AIR[sl]||'dust';
  if(typeof setSaloon==='function') setSaloon(sl||5);
  lightning(sl===8);
}

/* ================= the vista: a living frontier backdrop behind every screen ================= */
function buildVista(){
  const v=$('vista'); if(!v||v.dataset.built) return; v.dataset.built=1;
  let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647; return seed/2147483647}, rr=(a,b)=>a+rnd()*(b-a);
  const W=1600, H=900;
  // ridgelines: flat-topped mesas and buttes, the way the desert actually looks
  const ridge=(base,amp,mesas)=>{let x=-40,y=base,d=`M-40 ${H} L-40 ${base}`;
    while(x<W+40){ if(rnd()<mesas){const s1=rr(18,46),w=rr(70,240),h=amp*rr(.55,1),s2=rr(18,46);
        d+=` L${(x+s1*.4).toFixed(0)} ${(base-h*.35).toFixed(0)} L${(x+s1).toFixed(0)} ${(base-h).toFixed(0)} L${(x+s1+w).toFixed(0)} ${(base-h+rr(-4,4)).toFixed(0)} L${(x+s1+w+s2*.6).toFixed(0)} ${(base-h*.4).toFixed(0)} L${(x+s1+w+s2).toFixed(0)} ${base}`; x+=s1+w+s2}
      else{const w=rr(60,160); d+=` Q${(x+w/2).toFixed(0)} ${(base-rr(4,amp*.25)).toFixed(0)} ${(x+w).toFixed(0)} ${base}`; x+=w}}
    return d+` L${W+40} ${H} Z`};
  const st=['','',''];
  for(let i=0;i<150;i++){const x=rr(0,W),y=rr(0,H*.62)**1.08,r=rnd()<.08?rr(1.4,2.1):rr(.5,1.2),k=rnd()<.3?1+Math.floor(rnd()*2):0; st[k]+=`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" opacity="${rr(.35,1).toFixed(2)}"/>`}
  // the town: false-front saloons, a church, a water tower, a windmill, lamplit windows
  let town='', win='', flick='', bx=470; const ground=792;
  const B=[[64,92,'step'],[48,70,'flat'],[96,128,'peak'],[58,84,'step'],[30,0,'gap'],[44,150,'church'],[30,0,'gap'],[110,118,'saloon'],[54,76,'flat'],[72,104,'step'],[40,62,'flat'],[88,96,'peak']];
  B.forEach(([w,h,k])=>{ if(k==='gap'){bx+=w; return}
    const y=ground-h;
    if(k==='church'){town+=`<path d="M${bx} ${ground} V${y+40} L${bx+w/2} ${y+12} L${bx+w} ${y+40} V${ground}Z M${bx+w/2-7} ${y+14} V${y-26} L${bx+w/2} ${y-40} L${bx+w/2+7} ${y-26} V${y+14}Z M${bx+w/2-1.5} ${y-58} h3 v18 h-3z M${bx+w/2-7} ${y-52} h14 v3 h-14z"/>`;
      win+=`<path d="M${bx+w/2-6} ${y+76} v-16 a6 6 0 0 1 12 0 v16z"/>`}
    else{let top=k==='step'?`V${y+14} H${bx+8} V${y} H${bx+w-8} V${y+14} H${bx+w}`:k==='peak'?`V${y+18} L${bx+w/2} ${y-8} L${bx+w} ${y+18}`:k==='saloon'?`V${y+10} H${bx+14} V${y-10} H${bx+w-14} V${y+10} H${bx+w}`:`V${y} H${bx+w}`;
      town+=`<path d="M${bx-3} ${ground} ${top.replace(/^V/,'V').replace(`V${y}`,`V${y}`)} V${ground}Z"/><rect x="${bx-6}" y="${ground-30}" width="${w+12}" height="4"/>`;
      const rows=h>100?2:1, cols=Math.max(2,Math.round(w/26));
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ if(rnd()<.32) continue;
        const wx=bx+(c+.5)*(w/cols)-5, wy=y+22+r*38; if(wy>ground-40) continue;
        const wr=`<rect x="${wx.toFixed(0)}" y="${wy}" width="10" height="15" rx="1" opacity="${rr(.7,1).toFixed(2)}"/>`; if(rnd()<.14) flick+=wr; else win+=wr}
      if(k==='saloon') win+=`<rect class="door" x="${bx+w/2-9}" y="${ground-26}" width="18" height="22"/>`;
    }
    bx+=w+rr(4,12)});
  // water tower and windmill on the edges of town
  const tw=`<g><path d="M392 ${ground} L404 712 M436 ${ground} L424 712 M398 750 L430 750 M402 730 L426 772" stroke-width="3.5" fill="none"/><path d="M394 712 h48 v-46 a24 8 0 0 0 -48 0z"/><path d="M390 668 L418 646 L446 668z"/></g>`;
  const mill=`<g><path d="M1248 ${ground} L1262 650 L1276 ${ground} M1252 740 h20 M1256 700 h12" stroke-width="3" fill="none"/><path d="M1262 650 l26 6 v4 l-26 -4z"/></g>`;
  const blades=`<svg viewBox="-34 -34 68 68"><g transform="scale(.72)">${Array.from({length:8},(_,i)=>`<path transform="rotate(${i*45})" d="M0 0 L-3 -44 L3 -44Z"/>`).join('')}<circle r="4"/></g></svg>`;
  const poles=[120,300,1130,1360,1520].map(x=>`<path d="M${x} ${ground+6} V${ground-74} M${x-14} ${ground-66} h28" stroke-width="3" fill="none"/>`).join('');
  const wire=`<path class="wire" d="M120 ${ground-66} Q210 ${ground-40} 300 ${ground-66} M1130 ${ground-66} Q1245 ${ground-40} 1360 ${ground-66} Q1440 ${ground-44} 1520 ${ground-66}" fill="none" stroke-width="1.2"/>`;
  const cactus=(x,s)=>`<path transform="translate(${x} ${ground+4}) scale(${s})" d="M-5 0 V-62 a5 5 0 0 1 10 0 V0z M-5 -30 h-10 a4 4 0 0 1 -4 -4 v-14 a4 4 0 0 1 8 0 v10 h6z M5 -22 h10 v-18 a4 4 0 0 1 8 0 v20 a6 6 0 0 1 -6 6 h-12z"/>`;
  const svg=(cls,inner,extra='')=>`<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" ${extra}>${inner}</svg>`;
  const TF='translate(800 792) scale(.72) translate(-800 -792)';
  v.innerHTML=`<div class="vs-sky"></div>`+
    svg('vs-stars',st[0])+svg('vs-stars vs-tw1',st[1])+svg('vs-stars vs-tw2',st[2])+
    `<div class="vs-orb"><i></i></div><i class="vs-shoot"></i>`+
    svg('vs-cloud',`<path d="M120 300 q120 -26 260 -6 t260 -2 q-140 14 -280 10 t-240 -2z M900 210 q160 -22 330 -4 t220 2 q-150 14 -320 8 t-230 -6z"/>`)+
    svg('vs-far',`<path d="${ridge(640,190,.55)}"/>`)+
    svg('vs-mid',`<path d="${ridge(720,120,.45)}"/>`)+
    `<div class="vs-haze"></div>`+
    `<div class="vs-nearw">`+
      svg('vs-near',`<path d="M-40 ${H} L-40 ${ground+8} Q400 ${ground-6} 800 ${ground+4} T1640 ${ground} L1640 ${H}Z"/>${poles}${wire}${cactus(250,1)}${cactus(1430,.8)}<g transform="${TF}">${tw}${mill}${town}${cactus(1050,.55)}<g class="vs-win">${win}</g></g>`)+
      svg('vs-lights',`<g transform="${TF}">${flick}</g>`)+
      `<div class="vs-mill">${blades}</div>`+
      `<div class="vs-weed"><i><svg viewBox="-30 -30 60 60"><g fill="none" stroke-width="2.4">${Array.from({length:11},(_,i)=>`<ellipse rx="${rr(14,26).toFixed(0)}" ry="${rr(8,22).toFixed(0)}" transform="rotate(${i*33})"/>`).join('')}</g></svg></i></div>`+
    `</div><div class="vs-dim"></div><div class="vs-floor"></div>`;
  // place the windmill blades and the tumbleweed on the same ground the town stands on (the art is "slice"-scaled)
  const nearw=v.querySelector('.vs-nearw'), millEl=v.querySelector('.vs-mill'), weed=v.querySelector('.vs-weed');
  const place=()=>{const w=nearw.clientWidth||innerWidth+140, h=nearw.clientHeight||innerHeight, s=Math.max(w/W,h/H), ox=(w-W*s)/2, oy=h-H*s;
    const hx=ox+(800+(1262-800)*.72)*s, hy=oy+(792+(650-792)*.72)*s, ms=68*s;
    Object.assign(millEl.style,{left:(hx-ms/2)+'px',top:(hy-ms/2)+'px',width:ms+'px',height:ms+'px'});
    const ws=Math.max(26,46*s); Object.assign(weed.style,{top:(oy+797*s-ws)+'px',width:ws+'px',height:ws+'px'}); weed.style.setProperty('--run',(w+ws*2)+'px')};
  place(); addEventListener('resize',place); if(window.visualViewport) visualViewport.addEventListener('resize',place);
  // parallax: the mouse moves the layers on desktop (transforms only, and only while moving); touch screens drift on their own in CSS
  const layers=[['.vs-stars',6,4],['.vs-far',14,5],['.vs-mid',28,8],['.vs-nearw',48,10]].map(([q,ax,ay])=>[v.querySelectorAll(q),ax,ay]);
  let tx=0,ty=0,cx=0,cy=0,run=false;
  const step=()=>{cx+=(tx-cx)*.08; cy+=(ty-cy)*.08; layers.forEach(([els,ax,ay])=>els.forEach(e=>e.style.transform=`translate3d(${(-cx*ax).toFixed(2)}px,${(-cy*ay).toFixed(2)}px,0)`));
    if(Math.abs(tx-cx)+Math.abs(ty-cy)>.0005) requestAnimationFrame(step); else run=false};
  if(!REDUCED&&matchMedia('(hover:hover) and (pointer:fine)').matches){v.classList.add('mouse');
    addEventListener('pointermove',e=>{if(e.pointerType!=='mouse') return; tx=e.clientX/innerWidth-.5; ty=e.clientY/innerHeight-.5; if(!run){run=true; requestAnimationFrame(step)}},{passive:true})}
}
buildVista();

/* ================= rendering helpers ================= */
let SOUNDQ=[];
// court cards are Western portraits: the Jack a young gun, the Queen a saloon lady, the King an old cattle baron
const COURT={};
function courtArt(r,s){
  const k=r+'-'+s; if(COURT[k]) return COURT[k].replace(/§§/g,'c'+(++PID));
  const red=s===1||s===2, ink=red?'#8e2418':'#22201e', paper=['#f6ead0','#d9c49a'];
  const base={bg:paper,rim:red?'#c0503f':'#6a6a6a',skin:['#e8c4a2','#a8805e'],scar:false,smoke:false,patch:false,mask:false,bandolier:false,badge:false,stubble:false,freckles:false};
  const looks={11:{hat:'cowboy',hatc:red?'#7a2418':'#2a2622',hatTilt:-6,fh:'stache',hair:'#5a3a22',age:0,neck:'scarf',scarf:ink,coat:red?'#6a1e16':'#2a2826',mouth:'smirk',brows:'cocked'},
    12:{fem:true,hat:'none',hairdo:'updo',hair:red?'#7a2a12':'#1a120c',dress:red?'#9a1e22':'#2a2630',choker:true,earring:'drop',lips:'#a01828',eyes:{lashes:true,liner:true,iris:'#3a5a4a'},brows:'arched',rose:false},
    13:{hat:'cattleman',hatc:red?'#5a1e16':'#1e1c1a',fh:'beard',hair:'#d6d0c4',age:2,hw:9.8,jaw:1.4,neck:'bolo',vest:red?'#6a1e16':'#2a2826',coat:'#1e1a18',mouth:'grim',brows:'flat'}};
  const svg=portrait('court'+k,Object.assign({},base,looks[r]),'square').replace(/pt\d+/g,'§§');
  COURT[k]=svg; return svg.replace(/§§/g,'c'+(++PID));
}
function cardHTML(c,up,extra='',loc=null,anim=null){
  let cls='', style='';
  if(loc){
    const key=loc+':'+c.id, prev=G.seen.get(key);
    if(prev===undefined){
      G.seen.set(key,up);
      if(!REDUCED){const a=anim||{}; cls=' deal'; style=` style="--fx:${a.fx||0}px;--fy:${a.fy==null?-40:a.fy}px;animation-delay:${a.delay||0}ms"`; SOUNDQ.push(a.delay||0)}
    } else if(prev!==up){G.seen.set(key,up); if(!REDUCED){cls=' flip'; SOUNDQ.push(0)}}
  }
  if(!up) return `<div class="card back${cls} ${extra}"${style}>${/marked/.test(extra)?`<span class="mk${c.s===1||c.s===2?' red':''}">${SUITS[c.s]}</span>`:''}</div>`;
  const red=c.s===1||c.s===2, rk=RN[c.r]||String(c.r), su=SUITS[c.s], face=c.r>=11&&c.r<=13;
  const ix=`<b${rk.length>1?' class="ten"':''}>${rk}</b><i>${su}</i>`, hot=G.winCards.has(c.id)?' hot':'';
  const gold=c.r>=11?' gold':'';
  return `<div class="card${red?' red':''}${hot}${gold}${cls} ${extra}"${style} role="img" aria-label="${SG[c.r]} of ${SUITN[c.s]}">`+
    `<div class="ix">${ix}</div>`+(face?`<div class="face court">${courtArt(c.r,c.s)}<i>${su}</i></div>`:c.r===14?`<div class="pip ace">${su}</div>`:`<div class="pip">${su}</div>`)+`<div class="ix br">${ix}</div></div>`;
}
function chipCls(a){return a>=500?'k':a>=150?'g':a>=50?'b':'r'}
function chipStack(a){const k=Math.max(1,Math.min(6,Math.ceil(Math.log10(a+1)*1.5))); let h=`<span class="stack" style="--n:${k-1}">`; for(let j=0;j<k;j++) h+=`<span class="chip ${chipCls(a)}" style="--i:${j}"></span>`; return h+'</span>'}
function drawFan(el){
  const cards=[{r:14,s:0,id:1},{r:14,s:3,id:2},{r:8,s:0,id:3},{r:8,s:3,id:4}];
  el.innerHTML=cards.map((c,i)=>cardHTML(c,true).replace('<div class="card',`<div style="transform:translateX(-50%) rotate(${-21+i*14}deg);animation-delay:${.1+i*.12}s" class="card`)).join('');
}
function charmIndex(k){return Object.keys(CHARMS).indexOf(k)}
function tarot(k,body,extraCls='',asUpgrade=false,priceTag=''){
  const c=CHARMS[k], lv2=asUpgrade||(R&&lvl(k)>=2);
  return `<div class="tarot ${extraCls}">${priceTag?`<span class="tag">${priceTag}</span>`:''}<div class="num">${NUMERALS[charmIndex(k)]}${lv2?' · Level II':''}</div><div class="art"><span class="glyph">${c.icon}︎</span></div><h3>${c.name}${lv2?' II':''}</h3><p>${lv2&&c.up?c.up:c.desc}</p>${body||''}</div>`;
}
function charmPills(withCurse){
  let h=(R?R.charms:[]).map(k=>`<span class="cpill" title="${CHARMS[k].desc}"><span class="gl">${CHARMS[k].icon}︎</span>${CHARMS[k].name}${lvl(k)>=2?' II':''}</span>`).join('');
  if(withCurse&&G.curse) h+=`<span class="cpill cursed"><span class="gl cursed">${CURSES[G.curse].icon}︎</span>${CURSES[G.curse].name}</span>`;
  return h;
}
const ROLLV={}, ROLLQ=[];
function roll(key,v,tag,fmt){fmt=fmt||money; const from=ROLLV[key]==null?v:ROLLV[key]; if(from!==v) ROLLQ.push({key,from,to:v,fmt}); ROLLV[key]=v;
  return tag==='chips'?`<span class="chips" data-roll="${key}">${fmt(from)}</span>`:(tag==='b'?`<b data-roll="${key}">${fmt(from)}</b>`:`<span data-roll="${key}">${fmt(from)}</span>`)}
function runRolls(){
  ROLLQ.splice(0).forEach(({key,from,to,fmt})=>{
    if(REDUCED){const el=document.querySelector(`[data-roll="${key}"]`); if(el) el.textContent=fmt(to); return}
    const t0=performance.now(), dur=Math.min(900,350+Math.abs(to-from)/4);
    {const el=document.querySelector(`[data-roll="${key}"]`); if(el){el.classList.remove('pop','up','down'); void el.offsetWidth; el.classList.add('pop',to>from?'up':'down'); setTimeout(()=>el.classList.remove('pop','up','down'),dur+500)}}
    const stepF=now=>{const k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,3); const el=document.querySelector(`[data-roll="${key}"]`); if(!el) return;
      el.textContent=fmt(Math.round(from+(to-from)*e)); if(k<1) requestAnimationFrame(stepF)};
    requestAnimationFrame(stepF);
  });
}
function bossName(bd,tag='span'){return `<${tag} class="bname" style="font-family:${bd.font},var(--f-display);font-size:${bd.fs||1}em">${bd.name}</${tag}>`}
/* no pinch zoom, no double-tap zoom, no rubber-banding: it should feel like an app, not a web page */
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
// a finger that wobbles a few pixels is still a tap: only a real drag is held still, so iOS never swallows the click
let T0=null; document.addEventListener('touchstart',e=>{const t=e.touches[0]; T0=t?[t.clientX,t.clientY]:null},{passive:true});
document.addEventListener('touchmove',e=>{if(e.touches.length>1){e.preventDefault(); return}
  const t=e.touches[0]; if(T0&&t&&Math.hypot(t.clientX-T0[0],t.clientY-T0[1])<12) return;
  const sc=e.target.closest&&e.target.closest('.sheet,.np-body,#ledger,#lastHand,.rklist,.deal-grid,.codex,.more-body,[data-scroll]');
  if(!sc||sc.scrollHeight<=sc.clientHeight+1) e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});

/* buttons answer the instant a finger lands, not when it lifts */
const PRESSABLE='.btn,.set-row,.seg button,.hunt-line,.chipbtn,.tabs button,.title-links button,.handsbtn,.iconbtn,.tg-choices button,[data-stab]';
// every press is guaranteed: if the browser drops the click (the button re-rendered under the finger, the layout
// shifted after a rotation, a tiny drag), the release itself fires it — once.
let TAP=null, CLICKED={t:0,el:null};
document.addEventListener('click',e=>{CLICKED={t:performance.now(),el:e.target}},true);
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest(PRESSABLE); if(!b||b.disabled) return; b.classList.add('press'); haptic('select');
  TAP={b,x:e.clientX,y:e.clientY,t:performance.now(),key:(b.id||'')+'|'+b.textContent.trim().slice(0,24)};
  const up=ev=>{b.classList.remove('press'); removeEventListener('pointerup',up); removeEventListener('pointercancel',up);
    if(ev.type!=='pointerup'||!TAP||TAP.b!==b) return; const tp=TAP, ux=ev.clientX, uy=ev.clientY; TAP=null;
    if(Math.hypot(ux-tp.x,uy-tp.y)>24||performance.now()-tp.t>900) return;
    setTimeout(()=>{if(CLICKED.t>tp.t&&CLICKED.el&&(tp.b.contains(CLICKED.el)||(CLICKED.el.closest&&CLICKED.el.closest(PRESSABLE)))) return;
      let tgt=tp.b.isConnected?tp.b:null;
      if(!tgt){const under=document.elementFromPoint(ux,uy), c=under&&under.closest&&under.closest(PRESSABLE); if(c&&((c.id||'')+'|'+c.textContent.trim().slice(0,24))===tp.key) tgt=c}
      if(tgt&&!tgt.disabled&&tgt.offsetParent!==null) tgt.click()},120)};
  addEventListener('pointerup',up); addEventListener('pointercancel',up)},{passive:true});

/* ================= daily table: one boss, one deck order, the same for everyone today ================= */
let DAILY=null;
function dayKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function seeded(str){let h=2166136261; for(const ch of str){h^=ch.charCodeAt(0); h=Math.imul(h,16777619)} return ()=>{h+=0x6D2B79F5; let t=h; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return((t^t>>>14)>>>0)/4294967296}}
function startDaily(){
  const dk=dayKey(), pick=seeded('boss'+dk), lvl=2+Math.floor(pick()*6);
  DAILY={key:dk,rng:seeded('deck'+dk)};
  const pool=Object.keys(CHARMS).filter(k=>CHARMS[k].tier===0), r2=seeded('charm'+dk);
  const charms=[]; while(charms.length<2&&pool.length) charms.push(pool.splice(Math.floor(r2()*pool.length),1)[0]);
  R={level:lvl,gold:0,charms,lv:{},deeds:[],tricks:[],curse:null,phase:'table',heat:0,temp:null,daily:dk};
  startTable();
}
function dailyDone(won){
  const dk=R.daily, hands=(G&&G.tableHands)||0; meta.daily=meta.daily||{}; const prev=meta.daily[dk];
  if(won&&(!prev||!prev.won||hands<prev.hands)) meta.daily[dk]={won:true,hands}; else if(!prev) meta.daily[dk]={won:false,hands};
  meta.dailyDone=(meta.dailyDone||0)+1; saveMeta();
  const bd=BOSSES[R.level-1], best=meta.daily[dk];
  $('poster').hidden=true;
  let v=$('dailyCard'); if(!v){v=document.createElement('div'); v.id='dailyCard'; v.className='modal'; document.body.appendChild(v)}
  v.innerHTML=`<div class="sheet daily-sheet"><div class="est">Daily table · ${dk}</div><h3 class="sheet-title">${won?'Taken down':'Dead man'}</h3>
    <p class="daily-line">${won?`You took down ${bossName(bd)} in <b>${hands}</b> hand${hands===1?'':'s'}.`:`${bossName(bd)} won today's table.`}</p>
    <p class="daily-line">${best.won?`Your best today: <b>${best.hands}</b> hands.`:'Come back and try again. Same deal, all day.'}</p>
    <div class="row"><button class="btn gold" id="dailyOk" style="flex:1">Back to the menu</button></div></div>`;
  v.hidden=false; sfx(won?'paid':'stamp');
  $('dailyOk').onclick=()=>{v.hidden=true; DAILY=null; R=null; hush(false); $('sGame').classList.remove('lost'); const lv=$('lossVeil'); if(lv){lv.hidden=true; lv.classList.remove('on','black')} renderTitle()};
}

/* ================= trophy room: wanted posters, card backs, achievements ================= */
const BACK_NAMES=['Dry Creek','Copper Bend','Hollow Rock','Red Mesa',"Cutter's Gulch",'Silver Fork','Bitterwater','Graves End','Gilded'];
function backUnlocked(n){const b=meta.beaten||{}; if(n===9) return meta.wins>0; if(n===1) return true; return !!b[BOSSES[n-2]&&BOSSES[n-2].key]||!!b[BOSSES[n-1].key]}
const ACH=[
  ['First blood','Take down your first boss',()=>meta.stats.bosses>=1],
  ['Halfway there','Reach the fifth saloon',()=>meta.best>=5],
  ['Territory clean','Win a whole run',()=>meta.wins>=1],
  ['Wanted everywhere','Take down all eight bosses at least once',()=>BOSSES.every(b=>(meta.beaten||{})[b.key])],
  ['Regular','Ride ten runs',()=>meta.runs>=10],
  ['Hundred hands','Play 100 hands',()=>meta.stats.hands>=100],
  ['High roller','Win a pot of 5,000 or more',()=>meta.stats.bigPot>=5000],
  ['Full house','Make a full house or better',()=>meta.stats.bestHand&&handCat(meta.stats.bestHand)>=6],
  ['Straight flush','Make a straight flush',()=>meta.stats.bestHand&&handCat(meta.stats.bestHand)>=8],
  ['Hired gun','Finish ten challenges',()=>meta.stats.challenges>=10],
  ['Daily rider','Play a daily table',()=>(meta.dailyDone||0)>=1],
  ['Collector','Unlock five card backs',()=>[1,2,3,4,5,6,7,8,9].filter(backUnlocked).length>=5]];
function renderTrophies(){
  const beaten=meta.beaten||{}, cur=meta.back||'auto';
  const posters=BOSSES.map(b=>beaten[b.key]?`<div class="tp-poster got"><span class="medal">${bossPortrait(b)}</span><b>${b.name}</b><em>Taken down ×${beaten[b.key]}</em></div>`
    :`<div class="tp-poster"><span class="medal locked">?</span><b>Wanted</b><em>${TOWNS[BOSSES.indexOf(b)]}</em></div>`).join('');
  const backs=[`<button class="tp-back${cur==='auto'?' on':''}" data-back="auto"><span class="bk-auto">Each saloon</span><em>Auto</em></button>`]
    .concat(BACK_NAMES.map((nm,i)=>{const n=i+1, ok=backUnlocked(n); return `<button class="tp-back${String(cur)===String(n)?' on':''}" data-back="${n}" ${ok?'':'disabled'}><span class="bk-swatch" data-bk="${n}"></span><em>${ok?nm:'Locked'}</em></button>`})).join('');
  const done=ACH.filter(a=>a[2]()).length;
  const ach=ACH.map(([t,d,f])=>{const ok=f(); return `<div class="tp-ach${ok?' got':''}"><i>${ok?'★':'☆'}</i><div><b>${t}</b><span>${d}</span></div></div>`}).join('');
  $('trophies').innerHTML=nemPanel()+`<div class="tp-h">Wanted posters <small>${Object.keys(beaten).length}/8</small></div><div class="tp-posters">${posters}</div>
    <div class="tp-h">Card backs <small>beat a saloon's boss to win its deck</small></div><div class="tp-backs">${backs}</div>
    <div class="tp-h">Achievements <small>${done}/${ACH.length}</small></div><div class="tp-achs">${ach}</div>`;
  $('trophies').querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{if(b.disabled) return; meta.back=b.dataset.back; saveMeta(); setScene(SND.scene||'sTitle'); sfx('card'); renderTrophies()});
}

/* ================= trail map ================= */
const MAPPTS=[[70,205],[170,125],[275,190],[375,100],[478,172],[572,88],[668,160],[742,78]];
function trailMap(level,victory){
  let d=`M${MAPPTS[0][0]} ${MAPPTS[0][1]}`;
  for(let i=1;i<MAPPTS.length;i++){const [x0,y0]=MAPPTS[i-1],[x1,y1]=MAPPTS[i]; const mx=(x0+x1)/2; d+=` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`}
  let s=`<svg class="map" viewBox="0 0 800 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trail map of the eight saloons">
  <g fill="none" stroke="#6b4a24" stroke-opacity=".35" stroke-width="1.5"><path d="M120 60 l18 -26 l18 26 M150 60 l14 -20 l14 20 M300 50 l20 -30 l20 30 M330 50 l14 -18 l14 18 M610 220 l18 -26 l18 26 M640 220 l14 -20 l14 20 M470 50 l16 -22 l16 22"/>
  <path d="M0 240 C80 225 140 250 220 236 S360 214 430 238 S560 250 600 236" stroke-dasharray="2 5"/></g>
  <g transform="translate(60 52)" stroke="#5a3b1e" fill="none"><circle r="20" stroke-opacity=".5"/><path d="M0 -26 L5 0 L0 26 L-5 0Z" fill="#5a3b1e" fill-opacity=".55"/></g>
  <text x="400" y="34" text-anchor="middle" font-size="22" style="font-family:'Playfair Display',Georgia,serif;font-weight:800">The Dead Man's Trail</text>
  <path d="${d}" fill="none" stroke="#5a3b1e" stroke-width="3" stroke-dasharray="7 7" stroke-linecap="round"/>`;
  MAPPTS.forEach(([x,y],i)=>{
    const L=i+1, done=victory||L<level, here=!victory&&L===level;
    if(here) s+=`<circle class="here" cx="${x}" cy="${y}" r="17" fill="none" stroke="#b3331f"/>`;
    s+=`<circle cx="${x}" cy="${y}" r="${L===8?13:10}" fill="${done?'#5a3b1e':here?'#b3331f':'#efe0b8'}" stroke="#5a3b1e" stroke-width="2.5"/>`;
    if(done) s+=`<path d="M${x-6} ${y-6} L${x+6} ${y+6} M${x+6} ${y-6} L${x-6} ${y+6}" stroke="#efe0b8" stroke-width="2.5" stroke-linecap="round"/>`;
    const ty=y>150?y+32:y-22;
    s+=`<text x="${x}" y="${ty}" text-anchor="middle" font-size="15">${TOWNS[i].replace("'","&#39;")}</text>`;
  });
  return s+'</svg>';
}

/* ================= toggles, tips ================= */
/* iPhone Duo: when the phone is open, the table sits on the left page and your controls on the right,
   so nothing important lands on the fold. Auto uses the fold the browser reports, or a near-square touch screen. */
function hingeV(){try{const p=document.createElement('div');p.style.cssText='position:fixed;top:env(viewport-segment-bottom 0 0,-1px);visibility:hidden';document.body.appendChild(p);const b=parseFloat(getComputedStyle(p).top);p.style.top='env(viewport-segment-top 0 1,-1px)';const t=parseFloat(getComputedStyle(p).top);p.remove();return b>0&&t>=b?{w:t-b}:null}catch(e){return null}}
function hingeW(){const v=hingeV(); if(v&&innerHeight>innerWidth) return v; try{const p=document.createElement('div');p.style.cssText='position:fixed;left:env(viewport-segment-right 0 0,-1px);visibility:hidden';document.body.appendChild(p);const r=parseFloat(getComputedStyle(p).left);p.style.left='env(viewport-segment-left 1 0,-1px)';const l=parseFloat(getComputedStyle(p).left);p.remove();return r>0&&l>=r?{w:l-r}:null}catch(e){return null}}
function duoAuto(){if(hingeW()) return true;
  // the inner screen of a foldable is nearly square; a normal iPhone is about twice as tall as it is wide.
  // Judge by the whole screen, not the window, so it still works half-folded like an L.
  const touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const sw=screen.width, sh=screen.height, sr=Math.min(sw,sh)/Math.max(sw,sh), smax=Math.max(sw,sh);
  const vr=Math.min(innerWidth,innerHeight)/Math.max(innerWidth,innerHeight);
  // split screen: the game only has part of the display, so the fold isn't inside our window: use the phone layout
  if(splitView()) return false;
  return touch&&smax<=1100&&(sr>=.6||vr>=.6)}
function splitView(){const sw=screen.width, sh=screen.height, L=Math.max(sw,sh), S=Math.min(sw,sh), wl=Math.max(innerWidth,innerHeight), ws=Math.min(innerWidth,innerHeight);
  return wl<L*.72||ws<S*.62}
function duoOn(){const m=meta.duo||'auto'; return (m==='on'&&!splitView())||(m==='auto'&&duoAuto())}
function applyDuo(){const on=duoOn(), d=document.documentElement, h=hingeW(), was=d.className; const land=innerWidth>innerHeight;
  // Duo postures: landscape (flat or folded like an L) puts the crease across the middle, so the game splits there —
  // the table up top, you below. Portrait puts the crease down the middle of one tall surface, so it stays whole.
  d.classList.toggle('duo',on); d.classList.toggle('duo-v',on); d.classList.toggle('duo-wide',on&&land); d.classList.toggle('duo-tall',on&&!land);
  const rs=$('raiseSheet'), con=document.querySelector('#sGame .console'); if(rs&&con){const want=d.classList.contains('duo-v')?con:$('table'); if(rs.parentElement!==want) want.appendChild(rs)} duoPoster(d.classList.contains('duo-v')); duoEvent(on&&land); d.style.setProperty('--hinge',(land||h?((h?h.w:0)+28):12)+'px'); if(d.className!==was&&typeof render==='function'&&G&&G.players&&G.players.length&&!$('sGame').hidden) render()}
/* Duo landscape: the telegram is read on the top screen, answered on the bottom one */
function duoEvent(v){const ch=$('evChoices'), rs=$('evResult'), bot=document.querySelector('#sEvent .dbot'), tg=document.querySelector('#sEvent .telegram'); if(!ch||!bot||!tg) return;
  if(v){if(ch.parentElement!==bot){bot.prepend(rs); bot.prepend(ch)}} else if(ch.parentElement!==tg){tg.appendChild(ch); tg.appendChild(rs)}}
/* Duo: wanted poster sits on the top screen, its bounty and button drop to the bottom screen */
function duoPoster(v){const m=$('poster'); if(!m) return; const pp=m.querySelector('.poster'); let bot=$('posterBot');
  if(!bot){bot=document.createElement('div'); bot.id='posterBot'; bot.className='p-bot'; m.appendChild(bot)}
  const parts=[$('posterTwist'),$('posterLine'),pp.querySelector('.reward')||bot.querySelector('.reward'),$('posterBtn')];
  const host=v?bot:pp; if(parts[3].parentElement!==host) parts.forEach(e=>e&&host.appendChild(e)); bot.hidden=!v}
const duoRefresh=()=>{clearTimeout(applyDuo.t); applyDuo.t=setTimeout(()=>{const was=document.documentElement.className; applyDuo(); if(document.documentElement.className!==was&&!$('more').hidden) renderToggles(); clearTimeout(applyDuo.t2); applyDuo.t2=setTimeout(applyDuo,450)},150)};
addEventListener('resize',duoRefresh); addEventListener('orientationchange',duoRefresh); document.addEventListener('visibilitychange',()=>{if(!document.hidden) duoRefresh()});
if(window.visualViewport) visualViewport.addEventListener('resize',duoRefresh);
setTimeout(applyDuo,0);
function renderToggles(){
  const sw=(k,label,sub,on)=>`<button class="set-row" data-audio="${k}" role="switch" aria-checked="${on}"><span class="set-l"><b>${label}</b>${sub?`<em>${sub}</em>`:''}</span><i class="sw${on?' on':''}"><i></i></i></button>`;
  const seg=(k,label,sub,opts,cur)=>`<div class="set-row seg-row"><span class="set-l"><b>${label}</b>${sub?`<em>${sub}</em>`:''}</span><span class="seg">${opts.map(([v,t])=>`<button data-audio="${k}" data-val="${v}" aria-pressed="${cur===v}">${t}</button>`).join('')}</span></div>`;
  const duoNow=duoOn()?(innerWidth>innerHeight?'Using: two screens, split at the fold':'Using: one tall screen'):(splitView()?'Split screen: using the phone layout':'Not detected');
  document.querySelectorAll('.audio-toggles').forEach(el=>{
    el.innerHTML=`<div class="set-group"><div class="set-h">Sound &amp; feel</div>
      ${sw('sound','Sound effects','Cards, chips, the bell',!!meta.sound)}
      ${sw('music','Music','Saloon songs and the room',!!meta.music)}
      ${sw('haptics','Haptics','Feel every chip and card',meta.haptics!==false)}</div>
      <div class="set-group"><div class="set-h">Play</div>
      ${seg('speed','Game speed','How fast the others act',[['normal','Normal'],['fast','Fast']],meta.speed==='fast'?'fast':'normal')}
      ${seg('duo','iPhone Duo layout',duoNow,[['auto','Auto'],['on','On'],['off','Off']],meta.duo||'auto')}</div>
`;
  });
  document.querySelectorAll('.set-foot').forEach(f=>f.textContent=`Dead Man's Run · Version 61 · ${screen.width}×${screen.height} · ${innerWidth}×${innerHeight}`);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-audio]'); if(!b) return;
  const k=b.dataset.audio, v=b.dataset.val;
  if(k==='speed') meta.speed=v||(meta.speed==='fast'?'normal':'fast');
  else if(k==='haptics'){meta.haptics=meta.haptics===false; haptic('medium')}
  else if(k==='duo'){meta.duo=v||{auto:'on',on:'off',off:'auto'}[meta.duo||'auto']; applyDuo()}
  else {meta[k]=!meta[k]; ac(); if(k==='music'){meta.music?startMusic():stopMusic()} if(k==='sound'&&meta.sound) sfx('chip')}
  haptic('select'); saveMeta(); renderToggles();
});
const TIPS={
  start:'<b>Goal:</b> take all of the boss\'s chips.',
  turn:'<b>Your turn.</b> Fold, call, or raise.'
};
let COACH=null;
function tip(k){if(TUT) return; if(!meta.tips[k]&&!COACH) COACH=k}
function renderCoach(){
  const el=$('coach');
  if(!COACH||meta.tips[COACH]||!$('raiseSheet').hidden){el.hidden=true; return}
  el.hidden=false;
  {const con=document.querySelector('#sGame .console'); if(con&&el.parentNode!==con) con.insertBefore(el,con.firstChild)}
  el.innerHTML=`<div style="flex:1">${TIPS[COACH]}</div><button class="btn small" id="coachOk">Got it</button>`;
  $('coachOk').onclick=()=>{meta.tips[COACH]=true; saveMeta(); COACH=null; renderCoach()};
}

/* ================= title ================= */
const RUMORS=["Bicah Mell hasn't lost a hand in eleven years.","Ma Spurlock charges rent on the chairs.","Somebody saw a masked rider out past Red Mesa.","The bank in Silver Fork never closes. Neither does the game.","Don't drink the water in Bitterwater. Don't play cards there either.","Nobody's walked out of Graves End with their boots on.","A good bluff is worth more than a fast horse.","They say the eighth saloon has no windows.","Cutter's Gulch deals in the rain. Every night.","Iron Jack Rourke has never folded. Not once."];
let RUMOR_T=null, RUMOR_I=Math.floor(Math.random()*10);
function rumorTick(){const el=$('rumor'); if(!el) return; clearTimeout(RUMOR_T); if($('sTitle').hidden) return;
  el.classList.add('out'); setTimeout(()=>{RUMOR_I=(RUMOR_I+1)%RUMORS.length; el.textContent=RUMORS[RUMOR_I]; el.classList.remove('out')},600); RUMOR_T=setTimeout(rumorTick,7000)}
function renderTitle(){
  setTimeout(rumorTick,400);
  DAILY=null; TOKEN++; PAUSED=false; R=null; $('poster').hidden=true; $('menu').hidden=true;
  drawFan($('fan')); renderToggles();
  const unlockedCount=Object.values(CHARMS).filter(c=>c.tier<=meta.unlock).length;
  $('metaPlaques').innerHTML=`
    <div class="plaque"><span>Best run</span><b>${meta.wins?'Won':meta.best?'Saloon '+meta.best:'—'}</b></div>
    <div class="plaque"><span>Runs</span><b>${meta.runs}</b></div>
    <div class="plaque"><span>Wins</span><b>${meta.wins}</b></div>
    <div class="plaque"><span>Charms</span><b>${unlockedCount} / ${Object.keys(CHARMS).length}</b></div>`;
  const saved=sget(RUN_KEY);
  const dk=dayKey(), dd=(meta.daily||{})[dk];
  const dlv=2+Math.floor(seeded('boss'+dk)()*6), dboss=BOSSES[dlv-1];
  $('titleActions').innerHTML=(saved?`<button class="btn gold big cont-btn" id="contBtn"><b>Continue</b><em>Saloon ${saved.level} · ${saved.gold||0}g · ${(saved.charms||[]).length} charm${(saved.charms||[]).length===1?'':'s'}</em></button>`:'')+
    `<button class="btn ${saved?'dark':'gold big'}" id="newBtn">${saved?'New run':'Start a run'}</button>`+
    `<button class="btn dark daily-btn" id="dailyBtn"><span class="medal">${bossPortrait(dboss)}</span><span class="db-t"><b>Daily table</b><em>${dd&&dd.won?`Beaten in ${dd.hands} hands`:dd?'Try again today':`Today: ${dboss.name}`}</em></span></button>`;
  if(saved) $('contBtn').onclick=()=>{ac(); continueRun(saved)};
  $('newBtn').onclick=()=>{ac(); startRun()};
  $('dailyBtn').onclick=()=>{ac(); startDaily()};
  const mh=maxHeat();
  $('heatPick').hidden=mh<1;
  { let h=$('huntLine'); if(!h){h=document.createElement('button'); h.id='huntLine'; h.className='hunt-line'; $('statLine').after(h); h.onclick=()=>{ac(); openMore('trophies')}}
    const n=meta.nemesis; h.hidden=!n; if(n) h.innerHTML=`<span class="medal">${portraitFor({name:n.name,fem:n.fem,tier:n.tier,nem:true,nemRank:n.rank})}</span><span>Hunted by <b>${nemName(n)}</b><em>${nemTitle(n)}</em></span>`; }
  $('statLine').innerHTML=meta.runs?`<span><em>Best</em><b>${meta.wins?'Won':meta.best?'Saloon '+meta.best:'—'}</b></span><span><em>Runs</em><b>${meta.runs}</b></span><span><em>Wins</em><b>${meta.wins}</b></span><span><em>Bosses</em><b>${Object.keys(meta.beaten||{}).length}/8</b></span>`:'';
  $('heatPick').innerHTML=HEAT.map((h,i)=>`<button data-heat="${i}" aria-pressed="${(meta.heatPick||0)===i}" ${i>mh?'disabled':''}><b>${h.name}</b><span>${i>mh?`Win ${i} run${i>1?'s':''} to unlock`:h.desc}</span></button>`).join('');
  $('heatPick').querySelectorAll('[data-heat]').forEach(b=>b.onclick=()=>{meta.heatPick=+b.dataset.heat; saveMeta(); renderTitle()});
  const st=meta.stats;
  $('statsGrid').innerHTML=[['Hands played',num(st.hands)],['Hands won',num(st.won)],['Win rate',st.hands?Math.round(st.won/st.hands*100)+'%':'—'],
    ['Biggest pot',money(st.bigPot)],['Best hand',st.bestHand?nameOf(st.bestHand):'—'],['Bosses taken down',num(st.bosses)],['Challenges',num(st.challenges)],['Runs won',num(meta.wins)]]
    .map(([a,b])=>`<div class="plaque"><span>${a}</span><b>${b}</b></div>`).join('');
  $('tipsBtn').onclick=()=>{meta.tips={}; saveMeta(); $('tipsBtn').textContent='Tips will show next run'};
  $('codex').innerHTML=Object.keys(CHARMS).map(k=>{
    const c=CHARMS[k];
    if(c.tier>meta.unlock) return `<div class="tarot locked"><div class="num">${NUMERALS[charmIndex(k)]}</div><div class="art"><span class="glyph">?</span></div><h3>Locked</h3><p>${TIER_NOTE[c.tier]}</p></div>`;
    return tarot(k,'','',false,`${c.price}g`);
  }).join('');
  document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>openMore(b.dataset.more));
  $('tutBtn').onclick=()=>{ac(); startTutorial(false)};
  if($('storyBtn')) $('storyBtn').onclick=()=>{ac(); $('more').hidden=true; playStory(null)};
  show('sTitle');
}
function openMore(tab){
  const names={howto:'How to play',trophies:'Trophies',records:'Records',charms:'Charms',settings:'Settings'};
  if(tab==='trophies') renderTrophies();
  document.querySelectorAll('#more [data-mtab]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.mtab===tab); b.onclick=()=>openMore(b.dataset.mtab)});
  document.querySelectorAll('#more [data-mpane]').forEach(p=>p.hidden=p.dataset.mpane!==tab);
  $('moreTitle').textContent=names[tab]; $('more').dataset.title=names[tab]; renderToggles(); $('more').hidden=false;
  $('moreClose').onclick=()=>{$('more').hidden=true};
}

/* ================= run flow ================= */
function saveRun(phase){if(!R||R.tutorial||R.daily) return; R.phase=phase; if(phase!=='table') delete R.table; sset(RUN_KEY,R)}
/* ================= the opening: a silent-film prologue before your very first ride ================= */
const STORY=[
  {k:'Territory of New Mexico · 1881',t:'Eight saloons stand between Dry Creek and Graves End.',art:'town'},
  {k:'Every table is rigged',t:'Each one is run by an outlaw the law won\'t touch.',art:'bosses'},
  {k:'At the end of the trail',t:'Bicah Mell. He owns them all, and he never loses.',art:'bicah'},
  {k:'Then a stranger rides in',t:'No name. A mask, a horse, and a thousand dollars in chips.',art:'rider'},
  {k:'',t:'Take every boss down. Collect every bounty.<br>Ride the Dead Man\'s Run.',art:'title'}];
function playStory(then){
  let v=$('story'); if(!v){v=document.createElement('div'); v.id='story'; document.body.appendChild(v)}
  let i=-1, t=null, gone=false;
  const art=a=>a==='bosses'?`<div class="st-row">${BOSSES.slice(0,7).map(b=>`<span class="medal">${bossPortrait(b)}</span>`).join('')}</div>`
    :a==='bicah'?`<span class="medal st-big">${bossPortrait(BOSSES[7])}</span>`:a==='rider'?`<span class="medal st-big">${portrait('You the rider',HUMAN_LOOK)}</span>`
    :a==='town'?`<div class="st-town">${TOWNS.map((n,k)=>`<i style="--k:${k}">${n}</i>`).join('')}</div>`:`<div class="st-logo">Dead Man's Run</div>`;
  const end=()=>{if(gone) return; gone=true; clearTimeout(t); meta.seenStory=true; saveMeta(); v.classList.add('out'); setTimeout(()=>{v.hidden=true; v.classList.remove('out')},700); then&&then()};
  const next=()=>{clearTimeout(t); i++; if(i>=STORY.length){end(); return} const sc=STORY[i];
    v.innerHTML=`<div class="st-grain"></div><div class="st-card" style="animation-delay:.05s"><div class="st-frame">${art(sc.art)}${sc.k?`<div class="st-k">${sc.k}</div>`:''}<p class="st-t">${sc.t}</p></div></div>
      <button class="st-skip">Skip</button><div class="st-dots">${STORY.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>`;
    v.querySelector('.st-skip').onclick=e=>{e.stopPropagation(); end()};
    sfx(i===STORY.length-1?'stamp':'whoosh'); t=setTimeout(next,i===STORY.length-1?3600:4300)};
  v.hidden=false; v.onclick=()=>next(); next();
}
function startRun(){
  if(!meta.seenStory){playStory(startRun); return}
  if(!meta.tutDone){startTutorial(true); return}
  R={level:1,gold:0,charms:[],lv:{},deeds:[],tricks:[],curse:null,phase:'pick',heat:Math.min(meta.heatPick||0,maxHeat()),temp:null};
  meta.runs++; saveMeta(); sset(RUN_KEY,null);
  openShop('pick');
}
function continueRun(saved){
  R=saved; R.deeds=R.deeds||[]; R.tricks=R.tricks||[]; R.lv=R.lv||{};
  if(R.phase==='shop'){openShop('shop',''); return}
  if(R.phase==='table'&&R.table){resumeTable(); return}
  openChapter();
}

/* ================= general store ================= */
const SHOP={offers:[],curse:null,curseTaken:false,mode:'shop',summary:'',tab:'charms',tricks:[],deed:null};
function unlockedPool(){return Object.keys(CHARMS).filter(k=>CHARMS[k].tier<=meta.unlock&&(!R.charms.includes(k)||(CHARMS[k].up&&lvl(k)<2)))}
function cost(p){return Math.max(1,Math.round(p*(hasDeed('credit')?.8:1)))}
function upPrice(k){return cost(Math.round(CHARMS[k].price*1.25/5)*5)}
function sellPrice(k){return Math.round(CHARMS[k].price*(lvl(k)>=2?.75:.5))}
function rerollCost(){return hasDeed('dealer')?5:15}
function openShop(mode,summary){
  TOKEN++; $('poster').hidden=true;
  SHOP.mode=mode; SHOP.tab='charms';
  if(mode==='pick'){SHOP.offers=shuffle(Object.keys(CHARMS).filter(k=>CHARMS[k].tier===0)).slice(0,3); SHOP.curse=null}
  else {
    SHOP.offers=shuffle(unlockedPool()).slice(0,3);
    const opts=Object.keys(CURSES).filter(k=>!(k==='crowd'&&LINEUPS[R.level-1].length>=6));
    SHOP.curse=R.curse||opts[Math.floor(Math.random()*opts.length)];
    SHOP.tricks=shuffle(Object.keys(TRICKS)).slice(0,3);
    const dl=Object.keys(DEEDS).filter(k=>!R.deeds.includes(k)); SHOP.deed=dl.length?dl[Math.floor(Math.random()*dl.length)]:null;
  }
  SHOP.curseTaken=!!R.curse; SHOP.anim='slap'; SHOP.gridH=0;
  SHOP.summary=summary||'';
  if(mode==='shop') saveRun('shop');
  renderShop(); show('sShop');
}
function card(icon,num,name,desc,body,cls,tag){
  return `<div class="tarot ${cls||''}">${tag?`<span class="tag">${tag}</span>`:''}<div class="num">${num}</div><div class="art"><span class="glyph">${icon}︎</span></div><h3>${name}</h3><p>${desc}</p>${body||''}</div>`;
}
function renderShop(){
  const pick=SHOP.mode==='pick', L=R.level, bd=BOSSES[L-1];
  $('shopEst').textContent=pick?'Before you ride':'Est. 1871';
  $('shopTitle').textContent=pick?'Pick a Lucky Charm':'General Store';
  $('shopMap').innerHTML=trailMap(L,false);
  const counts={d:0,g:0,v:0}; LINEUPS[L-1].forEach(t=>counts[t]++);
  const crowd=Object.entries(counts).filter(([,v])=>v).map(([t,v])=>`${v} ${TIERS[t].label}${v>1?'s':''}`).join(', ');
  $('shopBanner').innerHTML=(pick?'<div style="color:var(--muted)">One charm, on the house. Choose well.</div>':
      (SHOP.summary?`<div>${SHOP.summary}</div>`:'')+`<div class="goldline"><b>${num(R.gold)}g</b> · Charms ${R.charms.length}/${charmSlots()} · Tricks ${R.tricks.length}/${trickSlots()}</div>`)+
    `<div class="nextup"><span class="medal">${bossPortrait(bd)}</span><div>Next: <b>${TOWNS[L-1]}</b> · ${bossName(bd)}<em>${bd.twist}</em><span class="crowd" style="color:var(--muted);font-size:13.5px">With ${crowd}.</span></div></div>`;
  const tabs=$('shopTabs');
  tabs.hidden=pick; $('offerLabel').hidden=!pick; $('offerLabel').textContent='Free charms';
  if(!pick){
    const T=[['charms','Charms'],['tricks','Tricks'],['deed','Deed'],['gear','Gear']];
    tabs.innerHTML=T.map(([k,l])=>`<button data-stab="${k}" aria-selected="${SHOP.tab===k}">${l}</button>`).join('');
    tabs.querySelectorAll('[data-stab]').forEach(b=>b.onclick=()=>{SHOP.tab=b.dataset.stab; SHOP.anim='reflip'; renderShop()});
  }
  const tab=pick?'charms':SHOP.tab, full=R.charms.length>=charmSlots();
  let html='', curseHtml='';
  if(tab==='charms'){
    html=SHOP.offers.length?SHOP.offers.map(k=>{
      const c=CHARMS[k], owned=R.charms.includes(k), maxed=owned&&!(c.up&&lvl(k)<2), upg=owned&&!maxed, price=upg?upPrice(k):cost(c.price);
      const blocked=!upg&&!pick&&full;
      const btn=maxed?'':(pick?`<button class="btn gold" data-buy="${k}">Take it</button>`:`<button class="btn gold" data-buy="${k}" ${R.gold<price||blocked?'disabled':''}>${blocked?'Full':`${upg?'Upgrade':'Buy'} · ${price}g`}</button>`);
      return tarot(k,btn,(maxed?'owned':(upg?'upgrade':''))+(c.tier===1?' foil':c.tier>=2?' gold':''),upg,pick?'Free':`${price}g`);
    }).join(''):'<p class="sub">You own every charm you\'ve unlocked.</p>';
    if(!pick&&SHOP.curse){
      const c=CURSES[SHOP.curse];
      curseHtml=card(c.icon,'Curse',c.name,c.desc,`<button class="btn ${SHOP.curseTaken?'dark':'raise'}" id="curseBtn">${SHOP.curseTaken?'Give it back':'Take the deal'}</button>`,'curse'+(SHOP.curseTaken?' taken':''),`+${c.gold}g`);
    }
  } else if(tab==='tricks'){
    const tfull=R.tricks.length>=trickSlots();
    html=SHOP.tricks.map(k=>{const t=TRICKS[k], price=cost(t.price); return card(t.icon,'Trick · one use',t.name,t.desc,`<button class="btn gold" data-trick="${k}" ${R.gold<price||tfull?'disabled':''}>${tfull?'Full':`Buy · ${price}g`}</button>`,'trick',`${price}g`)}).join('');
  } else if(tab==='deed'){
    html=SHOP.deed?(()=>{const d=DEEDS[SHOP.deed], price=cost(d.price); return card('❦','Deed · lasts the run',d.name,d.desc,`<button class="btn gold" data-deed="${SHOP.deed}" ${R.gold<price?'disabled':''}>Buy · ${price}g</button>`,'deed',`${price}g`)})():'<p class="sub">You own every deed in the territory.</p>';
    if(R.deeds.length) html+=R.deeds.map(k=>card('❦','Owned deed',DEEDS[k].name,DEEDS[k].desc,'','deed owned')).join('');
  } else {
    html=R.charms.map(k=>tarot(k,`<button class="btn dark" data-sell="${k}">Sell · +${sellPrice(k)}g</button>`,'mine')).join('')+
      R.tricks.map(k=>card(TRICKS[k].icon,'Trick',TRICKS[k].name,TRICKS[k].desc,'','trick mine')).join('');
    if(!html) html='<p class="sub">Your saddlebags are empty.</p>';
  }
  $('offers').innerHTML=html; $('curseOffer').innerHTML=curseHtml; $('curseOffer').hidden=!curseHtml;
  // keep the store the same height across tabs so nothing jumps when you switch
  const dg=document.querySelector('#sShop .deal-grid');
  if(pick||SHOP.tab==='charms'){dg.style.minHeight=''; if(!pick) requestAnimationFrame(()=>{SHOP.gridH=dg.offsetHeight})} else if(SHOP.gridH) dg.style.minHeight=SHOP.gridH+'px';
  if(SHOP.anim&&!REDUCED){const cl=SHOP.anim; [...$('offers').children,...$('curseOffer').children].forEach((t,k)=>{t.classList.add(cl); t.style.setProperty('--sd',(k*130)+'ms'); sfx('card',120+k*130); if(cl==='slap') sfx('stamp',260+k*130)})}
  SHOP.anim=null;
  $('offers').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.buy; ac();
    if(pick){R.charms.push(k); sfx('stamp'); openChapter(); return}
    const upg=R.charms.includes(k), price=upg?upPrice(k):cost(CHARMS[k].price);
    if(R.gold<price||(!upg&&R.charms.length>=charmSlots())) return;
    R.gold-=price; if(upg) R.lv[k]=2; else R.charms.push(k);
    sfx('chip'); sfx('stamp',60); saveRun('shop'); renderShop();
  });
  $('offers').querySelectorAll('[data-trick]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.trick, price=cost(TRICKS[k].price); if(R.gold<price||R.tricks.length>=trickSlots()) return;
    R.gold-=price; R.tricks.push(k); SHOP.tricks.splice(SHOP.tricks.indexOf(k),1); sfx('chip'); saveRun('shop'); renderShop();
  });
  $('offers').querySelectorAll('[data-deed]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.deed, price=cost(DEEDS[k].price); if(R.gold<price) return;
    R.gold-=price; R.deeds.push(k); SHOP.deed=null; sfx('stamp'); sfx('bigwin',100); saveRun('shop'); renderShop();
  });
  $('offers').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.sell; R.gold+=sellPrice(k); R.charms.splice(R.charms.indexOf(k),1); delete R.lv[k]; sfx('chip'); saveRun('shop'); renderShop();
  });
  if($('curseBtn')) $('curseBtn').onclick=()=>{
    const c=CURSES[SHOP.curse];
    if(SHOP.curseTaken){SHOP.curseTaken=false; R.gold-=c.gold; R.curse=null}
    else {SHOP.curseTaken=true; R.gold+=c.gold; R.curse=SHOP.curse; sfx('boss')}
    saveRun('shop'); renderShop();
  };
  const rc=rerollCost();
  $('shopActions').innerHTML=pick?'':`${tab==='charms'?`<button class="btn small" id="rerollBtn" ${R.gold<rc||!unlockedPool().length?'disabled':''}>Reroll · ${rc}g</button>`:`<button class="btn small" style="visibility:hidden" tabindex="-1" aria-hidden="true">Reroll · ${rc}g</button>`}<button class="btn gold big" id="rideBtn">Ride to ${TOWNS[L-1]}</button>`;
  if(!pick){
    if($('rerollBtn')) $('rerollBtn').onclick=()=>{if(R.gold<rc) return; R.gold-=rc; SHOP.offers=shuffle(unlockedPool()).slice(0,3); SHOP.anim='reflip'; sfx('whoosh'); saveRun('shop'); renderShop()};
    $('rideBtn').onclick=()=>{ac(); openEvent()};
  }
}

/* ================= telegrams ================= */
let EV=null, TYPE_T=null;
function typeInto(el,text,cb){
  clearInterval(TYPE_T);
  if(REDUCED){el.innerHTML=text; if(cb) cb(); return}
  let k=0; el.textContent='';
  TYPE_T=setInterval(()=>{k++; el.innerHTML=text.slice(0,k).replace(/STOP/g,'<span class="stop">STOP</span>'); if(k%3===0) sfx('tick',0,.7+Math.random()*.2); if(k>=text.length){clearInterval(TYPE_T); if(cb) cb()}},22);
}
function openEvent(){
  if(R.level<=1){openChapter(); return}
  let key=EVENTS[Math.floor(Math.random()*EVENTS.length)];
  const pool=Object.keys(CHARMS).filter(k=>CHARMS[k].tier<=meta.unlock&&!R.charms.includes(k));
  if(key==='peddler'&&!pool.length) key='strongbox';
  EV={key,done:false,result:'',offer:pool[Math.floor(Math.random()*pool.length)]};
  const h=1+Math.floor(Math.random()*11), m=Math.floor(Math.random()*60);
  $('tgStamp').textContent=`RECD ${h}:${String(m).padStart(2,'0')} ${Math.random()<.5?'AM':'PM'}`;
  show('sEvent'); renderEvent(true);
}
function evDone(html){EV.done=true; EV.result=html; saveRun('shop'); renderEvent(false)}
function renderEvent(fresh){
  const g=R.gold;
  const draw2=()=>{const d=shuffle(FULL.slice()); return [d[0],d[1]]};
  function sharkBet(amt){
    const [a,b]=draw2(), res=a.r===b.r?'push':(a.r>b.r?'win':'lose');
    if(res==='win'){R.gold+=amt; sfx('win')} else if(res==='lose'){R.gold-=amt; sfx('lose')}
    evDone(`<div class="event-cards"><div>${cardHTML(a,true)}You</div><div>vs</div><div>${cardHTML(b,true)}Shark</div></div>`+(res==='win'?`You win ${amt} gold.`:res==='lose'?`You lose ${amt} gold.`:'A tie. Nobody pays.'));
  }
  const E={
    shark:{title:'Card shark on the trail',text:'STRANGER FANS A DECK ON A STUMP STOP SAYS HIGH CARD WINS STOP DOUBLE OR NOTHING STOP',choices:[
      {label:'Bet 20 gold',dis:g<20,fn:()=>sharkBet(20)},{label:'Bet 50 gold',dis:g<50,fn:()=>sharkBet(50)},{label:'Ride past',fn:()=>evDone('You tip your hat and keep riding.')}]},
    doctor:{title:'Traveling doctor',text:'DOCTOR WITH A WAGON OF TONICS WAVES YOU DOWN STOP ONE SIP AND YOU GET BACK UP FROM ANYTHING STOP ONCE STOP',choices:[
      {label:'Buy a tonic · 25g',dis:g<25,fn:()=>{R.gold-=25; R.temp=Object.assign(R.temp||{},{wind:true}); sfx('chip'); evDone('You pocket the tonic. You\'ll survive running out of chips once next saloon.')}},
      {label:'Ride past',fn:()=>evDone('"Your funeral," he mutters.')}]},
    bandits:{title:'Bandits on the pass',text:'THREE RIDERS BLOCK THE PASS STOP TOLL ROAD STRANGER STOP PAY UP OR DRAW STOP',choices:[
      {label:`Pay ${Math.min(20,g)} gold`,fn:()=>{const t=Math.min(20,R.gold); R.gold-=t; evDone(`You hand over ${t} gold. They let you pass.`)}},
      {label:'Draw on them',fn:()=>{if(Math.random()<0.55){R.gold+=30; sfx('bigwin'); evDone('You\'re quicker. They scatter and drop their loot. +30 gold.')}else{const t=Math.min(35,R.gold); R.gold-=t; sfx('lose'); evDone(`Too slow. They take ${t} gold and your pride.`)}}}]},
    strongbox:{title:'Burned-out wagon',text:'WAGON BURNED OFF THE TRAIL STOP SOMETHING HEAVY STILL IN THE BACK STOP',choices:[
      {label:'Pry it open',fn:()=>{const t=15+Math.floor(Math.random()*26); R.gold+=t; sfx('chip'); evDone(`Coins spill out. +${t} gold.`)}}]},
    peddler:{title:'Peddler on the road',text:EV.offer?`PEDDLER OPENS HIS COAT STOP ${CHARMS[EV.offer].name.toUpperCase()} STOP HALF PRICE TODAY ONLY STOP`:'',choices:EV.offer?[
      {label:`Buy · ${Math.round(CHARMS[EV.offer].price/2)}g`,dis:g<Math.round(CHARMS[EV.offer].price/2),fn:()=>{R.gold-=Math.round(CHARMS[EV.offer].price/2); R.charms.push(EV.offer); sfx('stamp'); evDone(`${CHARMS[EV.offer].name} is yours.`)}},
      {label:'Ride past',fn:()=>evDone('"Your loss," he calls after you.')}]:[]},
    rest:{title:'Quiet night',text:'STARS OUT STOP COFFEE HOT STOP NOBODY CHASING YOU TONIGHT STOP',choices:[
      {label:'Rest up',fn:()=>{R.temp=Object.assign(R.temp||{},{chips:250}); evDone('You wake up sharp. Start next saloon with 250 extra chips.')}},
      {label:'Cards with a drifter',fn:()=>{R.gold+=15; sfx('chip'); evDone('You take him for 15 gold.')}}]},
    tent:{title:'The fortune teller',text:'PAINTED TENT GLOWS BY THE ROAD STOP CROSS MY PALM RIDER STOP I WILL BLESS WHAT YOU CARRY STOP',choices:(()=>{
      const ups=R.charms.filter(k=>CHARMS[k].up&&lvl(k)<2), c=[];
      if(ups.length) c.push({label:'Bless a charm · 30g',dis:g<30,fn:()=>{const k=ups[Math.floor(Math.random()*ups.length)]; R.gold-=30; R.lv[k]=2; sfx('bigwin'); evDone(`${CHARMS[k].name} glows. It's now level II.`)}});
      c.push({label:'Ask for luck · 15g',dis:g<15,fn:()=>{R.gold-=15; R.temp=Object.assign(R.temp||{},{chips:300}); evDone('"Fortune walks beside you." Start next saloon with 300 extra chips.')}});
      c.push({label:'Ride past',fn:()=>evDone('The tent flap falls shut behind you.')});
      return c})()}
  };
  const e=E[EV.key];
  $('evTitle').textContent=e.title;
  $('evGold').textContent=num(R.gold);
  const choices=()=>{
    $('evChoices').innerHTML=e.choices.map((c,i)=>`<button class="btn ${i===0?'gold':'dark'}" data-ev="${i}" ${c.dis?'disabled':''}>${c.label}</button>`).join('');
    $('evChoices').querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{ac(); e.choices[+b.dataset.ev].fn()});
  };
  if(EV.done){
    $('evChoices').innerHTML=''; $('evResult').hidden=false; $('evResult').innerHTML=EV.result;
    $('evRide').hidden=false; $('evRide').textContent=`Ride to ${TOWNS[R.level-1]}`; $('evRide').onclick=()=>{ac(); openChapter()};
  } else {
    $('evResult').hidden=true; $('evRide').hidden=true; $('evChoices').innerHTML='';
    if(fresh) typeInto($('evText'),e.text,choices); else choices();
  }
}

/* ================= chapter card ================= */
function openChapter(){
  TOKEN++;
  const L=R.level, name=TOWNS[L-1];
  $('chNum').textContent=`Chapter ${NUMERALS[L-1]}`;
  $('chInk').innerHTML=handSVG(name);
  later(()=>writeHand($('chInk').firstElementChild),700);
  const words=CHAPTER_SUB[L-1].split(' ');
  $('chSub').innerHTML=words.map((w,k)=>`<span style="animation-delay:${4.1+k*.12}s">${w}</span>`).join(' ');
  const scr=$('sChapter'); scr.classList.remove('leaving');
  show('sChapter');
  sfx('whoosh');
  let done=false;
  const go=()=>{if(done) return; done=true; scr.classList.add('leaving'); setTimeout(()=>{if(R) startTable()},REDUCED?0:650)};
  scr.onclick=go;
  scr.onkeydown=e=>{if(e.key==='Enter'||e.key===' ') go()};
  later(go,8200);
}

/* ================= handwriting: a hand-drawn single-stroke cursive ================= */
function handParse(d){
  const t=d.match(/[MC]|-?\d*\.?\d+/g)||[], segs=[]; let i=0;
  while(i<t.length){
    if(t[i]==='M'){segs.push({M:[+t[i+1],+t[i+2]]}); i+=3}
    else if(t[i]==='C'){i++; while(i<t.length&&t[i]!=='M'&&t[i]!=='C'){const p=t.slice(i,i+6).map(Number); segs.push({C:[[p[0],p[1]],[p[2],p[3]],[p[4],p[5]]]}); i+=6}}
    else i++;
  }
  return segs;
}
function handSer(segs,ox){
  const out=[]; let cur='';
  segs.forEach(s=>{if(s.M){if(cur) out.push(cur); cur=`M${(s.M[0]+ox).toFixed(2)} ${s.M[1]}`} else cur+=' C'+s.C.map(p=>`${(p[0]+ox).toFixed(2)} ${p[1]}`).join(' ')});
  if(cur) out.push(cur); return out;
}
function handLayout(word){
  const main=[], late=[]; let x=0, prev=null;
  for(const ch of word){
    if(ch===' '){x+=HAND._space; prev=null; continue}
    const g=HAND[ch]; if(!g){x+=14; prev=null; continue}
    const segs=handParse(g.d);
    if(prev&&prev.exitY&&g.join!==false&&segs[1]&&segs[1].C){const ey=prev.exitY; segs[0]={M:[0,ey]}; segs[1]={C:[[4,ey],segs[1].C[1],segs[1].C[2]]}}
    handSer(segs,x).forEach(d=>main.push(d));
    if(g.extra0) handSer(handParse(g.extra0),x).forEach(d=>main.push(d));
    (g.extra||[]).forEach(e=>handSer(handParse(e),x).forEach(d=>late.push(d)));
    x+=g.w; prev=g;
  }
  return {paths:main.concat(late),width:x};
}
function handSVG(name){
  const L=handLayout(name), minX=-8, maxX=L.width+24, w=maxX-minX;
  const a=38*Math.PI/180, offs=[];
  for(let k=-4;k<=4;k++){const o=k*0.42; offs.push([(Math.cos(a)*o).toFixed(2),(-Math.sin(a)*o).toFixed(2)])}
  const paths=L.paths.map(d=>`<path d="${d}" fill="none" stroke="#fff3dc" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 9999" visibility="hidden"/>`).join('');
  return `<svg class="ch-hand" viewBox="${minX} -80 ${w} 124" style="max-width:${Math.round(w*3)}px" role="img" aria-label="${name.replace(/"/g,'')}">
    <defs><g id="hw" transform="skewX(-15.6)">${paths}</g>
      <radialGradient id="nibG"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".4" stop-color="#ffe7b0" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient></defs>
    ${offs.map(([dx,dy])=>`<use href="#hw" transform="translate(${dx} ${dy})"/>`).join('')}
    <g transform="skewX(-15.6)"><circle class="hnib" r="4.5" fill="url(#nibG)" opacity="0"/></g>
  </svg>`;
}
function writeHand(svg){
  if(!svg||!svg.isConnected) return;
  const ps=[...svg.querySelectorAll('#hw path')], nib=svg.querySelector('.hnib');
  const lens=ps.map(p=>p.getTotalLength());
  if(REDUCED){ps.forEach((p,i)=>{p.setAttribute('stroke-dasharray',`${lens[i]+1} 0`); p.setAttribute('visibility','visible')}); return}
  // steady pen speed; lift between strokes that don't connect
  const total=lens.reduce((s,v)=>s+v,0), writeMs=Math.max(1900,Math.min(3300,total*3.1)), speed=total/writeMs;
  let t=0;
  const tl=ps.map((p,i)=>{
    const s={t0:t,dur:lens[i]/speed}; t+=s.dur;
    if(i<ps.length-1){
      const e=p.getPointAtLength(lens[i]), n=ps[i+1].getPointAtLength(0);
      const gap=Math.hypot(e.x-n.x,e.y-n.y); s.lift=gap>1.5?Math.min(260,90+gap*2.2):0; t+=s.lift;
    }
    return s;
  });
  const T=t;
  ps.forEach(p=>{p.setAttribute('stroke-dasharray','0 9999'); p.setAttribute('visibility','hidden')});
  nib.setAttribute('opacity','1');
  sfx('pen'); const penT=setInterval(()=>{if(!svg.isConnected){clearInterval(penT); return} sfx('pen')},1350);
  const t0=performance.now();
  const frame=now=>{
    if(!svg.isConnected){clearInterval(penT); return}
    const el=now-t0;
    let cur=null;
    for(let i=0;i<ps.length;i++){
      const s=tl[i], p=Math.max(0,Math.min(1,(el-s.t0)/s.dur)), drawn=lens[i]*p;
      ps[i].setAttribute('visibility',drawn>0.05?'visible':'hidden');
      ps[i].setAttribute('stroke-dasharray',p>=1?`${lens[i]+1} 0`:`${drawn.toFixed(2)} 9999`);
      if(el>=s.t0&&el<s.t0+s.dur) cur={i,len:drawn,lift:false};
      else if(s.lift&&el>=s.t0+s.dur&&el<s.t0+s.dur+s.lift) cur={i,len:lens[i],lift:true,k:(el-s.t0-s.dur)/s.lift};
    }
    if(cur){
      let pt=ps[cur.i].getPointAtLength(cur.len);
      if(cur.lift){const n=ps[cur.i+1].getPointAtLength(0); pt={x:pt.x+(n.x-pt.x)*cur.k,y:pt.y+(n.y-pt.y)*cur.k-Math.sin(cur.k*Math.PI)*6}}
      nib.setAttribute('cx',pt.x.toFixed(2)); nib.setAttribute('cy',pt.y.toFixed(2)); nib.setAttribute('opacity',cur.lift?'.3':'1');
    }
    if(el<T) requestAnimationFrame(frame);
    else {clearInterval(penT); nib.animate([{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}); svg.classList.add('done')}
  };
  requestAnimationFrame(frame);
}

/* ================= table start ================= */
function posterFor(bd,mode){
  $('posterPortrait').innerHTML=bossPortrait(bd,'square');
  $('poster').querySelector('.poster').classList.remove('stamped');
  $('posterName').innerHTML=bossName(bd);
  $('posterTitle').textContent=bd.title;
  $('stamp').hidden=true;
  if(mode==='intro'){
    $('posterQuote').textContent=`"${bd.lines.intro}"`;
    $('posterTwist').textContent=bd.twist;
    const counts={d:0,g:0,v:0}; G.lineup.forEach(t=>counts[t]++);
    $('posterLine').textContent='Rides with '+Object.entries(counts).filter(([,v])=>v).map(([t,v])=>`${v} ${TIERS[t].label.toLowerCase()}${v>1?'s':''}`).join(', ')+'.';
    $('posterBtn').textContent='Take a seat'; $('posterBtn').className='btn raise big';
  }
  $('posterReward').textContent=`${G.bounty} gold`;
}
function startTable(){
  TOKEN++;
  setupTable();
  const bd=BOSSES[R.level-1];
  show('sGame'); renderToggles(); quote(''); render();
  posterFor(bd,'intro');
  $('poster').hidden=false;
  later(()=>sfx('boss'),150); later(()=>sfx('door'),700);
  $('posterBtn').onclick=()=>{ac(); $('poster').hidden=true; sfx('card'); if(!R.daily){R.table=serializeTable(); saveRun('table'); R.table=serializeTable(); sset(RUN_KEY,R)} const go=()=>{say(bd.lines.intro); later(newHand,350)}; if(G.nemIntro){const n=G.nemIntro; G.nemIntro=null; nemAmbush(n,go)} else go()};
}
function resumeTable(){
  TOKEN++;
  restoreTable(R.table);
  show('sGame'); renderToggles(); quote(''); render();
  log('You pick up where you left off.');
  later(newHand,600);
}

/* ================= hand flow ================= */
function newHand(){
  closeRaise(); hideReveal();
  startHand();
  G.dealUntil=performance.now()+G.dealCount*70+500;
  if(G.risen) shake(false);
  tip('start');
  step();
  sfx('chip');
}
function step(){
  render();
  if(live().length===1){later(()=>collectThen(()=>handEnd(resolveUncontested())),450); return}
  if(G.turn===-1){
    // everyone's in and the cards just run out: slow it right down
    const lv=live(), me=human(), runout=lv.length>=2&&lv.filter(q=>!q.allIn).length<=1&&me.inHand&&!me.folded&&G.board.length<5&&!REDUCED;
    if(runout&&!G.slowmo){G.slowmo=true; lv.forEach(q=>q.show=true); $('sGame').classList.add('slowmo'); heartbeat(true); haptic('heavy'); render()}
    later(()=>collectThen(()=>{
      const st=advanceStreet();
      if(G.slowmo){sfx('whoosh'); haptic('medium'); const bd=$('board'); bd.classList.remove('slam'); void bd.offsetWidth; bd.classList.add('slam')}
      if(st==='showdown'&&G.slowmo){G.slowmo=false; later(()=>{$('sGame').classList.remove('slowmo'); heartbeat(false)},900)}
      if(st==='showdown'){
        const ev=revealShowdown();
        render(); sfx('whoosh');
        ev.forEach(x=>{if(x.type==='redeal') say(x.line); if(x.type==='horseshoe'){stampAt(50,46,'Lucky!','#f4cb5c',36); flash()}});
        later(()=>handEnd(resolveShowdown()),1100*Math.max(.6,speedMul()));
      } else {
        G.dealUntil=performance.now()+(G.board.length===3?270:0)+450;
        step();
      }
    }),G.slowmo?1700:650);
    return;
  }
  const p=G.players[G.turn];
  if(p.isHuman&&TUT) later(tutTurn,Math.max(350,G.dealUntil-performance.now()+300));
  if(!p.isHuman&&TUT){
    const t=G.turn; later(()=>{if(G.turn!==t) return; const toCall=G.currentBet-p.bet; doAct(t,toCall>0?(t===1&&G.street!=='preflop'?'fold':'call'):'check')},900*speedMul());
    return;
  }
  if(!p.isHuman){
    const t=G.turn, base=((human().folded||human().allIn||!human().inHand?320:820)+(p.bossDef?520:0))*speedMul();
    later(()=>{if(G.turn!==t) return; const d=aiDecide(t); if(d.tell||d.line) say(d.line||'',d.tell||''); doAct(t,d.type,d.to)}, Math.max(base,G.dealUntil-performance.now()+120));
  }
}
function doAct(i,type,to){
  if(i===0&&TUT) tutHide();
  const p=G.players[i];
  const put=applyAction(i,type,to);
  step();
  if(put>0){
    fly(seatEl(i,'.plate'),document.querySelector(`.bet[data-i="${i}"]`),2,280,chipCls(put)); sfx(p.allIn||put>=G.bb*10?'chips':'chip'); if(p.allIn||put>=G.bb*10) rumble(put/G.bb);
    if(p.allIn){const c=centerOfSeat(i); if(c) stampAt(c[0],c[1],'All in','#d8341f',p.isHuman?34:26); sfx('stamp',80); shake(false)}
  }
}
function collectThen(fn){
  const bets=[...document.querySelectorAll('#seats .bet,#duoHand .bet')];
  if(!bets.length||REDUCED){fn(); return}
  const pot=$('potrow');
  bets.forEach(b=>{fly(b,pot,2,340,'g'); b.style.visibility='hidden'});
  sfx('chip'); later(fn,360);
}
function handEnd(res){
  // remember where everyone sat before busted seats disappear
  const where={}; G.players.forEach((p,i)=>{const c=centerOfSeat(i); if(c) where[i]=c});
  const goldBefore=R.gold;
  const ev=finishHand(res);
  render();
  const me=human(), potEl=$('potrow');
  res.winners.forEach(w=>fly(potEl,seatEl(w.i,'.plate'),Math.min(10,4+Math.round(w.amt/G.bb/3)),560,chipCls(w.amt)));
  if(res.winners.length) sfx('chips',60);
  {const big=res.pot/G.bb; if(big>=12) rumble(big,120)}
  res.winners.forEach(w=>{const c=where[w.i]; if(c) floatNum(c[0],c[1]-4,'+'+money(w.amt),false,450)});
  if(me.inHand&&!me.winner&&me.total>0&&where[0]) floatNum(where[0][0],where[0][1]-4,'−'+money(me.total),true,450);
  ev.kos.forEach((i,k)=>{const c=where[i]; if(c) later(()=>{stampAt(c[0],c[1],G.players[i].bossDef?'Taken Down':'Tapped Out','#d8341f',G.players[i].bossDef?40:26); sfx('stamp'); shake(!!G.players[i].bossDef)},500+k*250)});
  if(ev.revenge){
    const rv=ev.revenge, c=where[rv.victim], bEl=seatEl(rv.boss,'.plate');
    later(()=>{sfx('boss')},350);
    later(()=>{
      sfx('gun'); flash(true); shake(true);
      if(c){stampAt(c[0],c[1],'Shot Dead','#d8341f',34);
        const ghost=document.createElement('div'); ghost.style.cssText=`position:absolute;left:${c[0]}%;top:${c[1]}%;width:2px;height:2px`; $('fx').appendChild(ghost);
        later(()=>{fly(ghost,bEl,10,700,chipCls(rv.amt)); sfx('chips',150); setTimeout(()=>ghost.remove(),1200)},500)}
      say(ev.bossLine.text);
    },1300);
  } else if(ev.bossLine&&ev.bossLine.nem) later(()=>seatSay(ev.bossLine.i,ev.bossLine.text),ev.kos.length?900:500);
  else if(ev.bossLine) later(()=>say(ev.bossLine.text),ev.kos.length?900:500);
  if(ev.nemSlain){const c=where[ev.nemSlain.i]; later(()=>{if(c){stampAt(c[0],c[1]-6,'Score Settled','#f4cb5c',30); seatSay(ev.nemSlain.i,ev.nemSlain.line,c)} sfx('gun'); flash(true); shake(true); haptic('heavy')},1100)}
  if(ev.nemFled!=null){const c=where[ev.nemFled]; later(()=>{if(c) stampAt(c[0],c[1]-6,'Fled','#c9a24e',24)},1200)}
  if(R.gold>goldBefore) bumpGold();
  showReveal(res);
  const meWon=res.winners.some(w=>w.i===0);
  if(G.outcome==='win'){sfx('bigwin',300); flash(); burst(seatEl(0,'.plate'),46); $('table').classList.add('bust'); later(()=>bossOut(showPaid),1300)}
  else if(G.outcome==='lose'&&!TUT){loseRun(); return}
  else if(G.outcome==='lose'){sfx('lose',300); flash(true); shake(true); if(where[0]) later(()=>{stampAt(where[0][0],where[0][1]-6,'Dead Man','#d8341f',40); sfx('stamp')},400)}
  else if(meWon){sfx('win',250); if(res.pot>=G.bb*8){flash(); shake(false); burst(seatEl(0,'.plate'),30)}}
  procChain(ev.bonus||[],where[0]||[50,85],1500);
  if(ev.challenge){later(()=>{stampAt(50,30,'Challenge!','#f4cb5c',28); sfx('win'); bumpGold()},ev.kos.length?2000:900)}
  if(ev.wind) later(()=>{stampAt(50,60,'Second Wind','#7fcf8f',30); sfx('bigwin')},700);
  if(TUT){later(tutFinale,2600); return}
  if(!G.outcome&&!R.daily){R.table=serializeTable(); R.phase='table'; sset(RUN_KEY,R)}
  renderCoach();
}

/* ================= endings ================= */
/* ================= boss send-off =================
   A freeze-frame title card per boss, in the spirit of a comic-book boss intro but closing the book on them:
   their own colours, prop, particles, stamp word and a one-line epitaph. */
const BOSS_FX={
  pete:  {acc:'#e8a536',deep:'#4a2306',ang:-7, side:'r',prop:'bottle', fx:'glass', stamp:'Cut Off',  epi:'Bet the bar tab. Lost the bar.'},
  ma:    {acc:'#d0608e',deep:'#3a0c22',ang:6,  side:'l',prop:'key',    fx:'dust',  stamp:'Evicted',  epi:'Thrown out of her own saloon.'},
  iron:  {acc:'#a9c2d6',deep:'#16222c',ang:-9, side:'r',prop:'anvil',  fx:'sparks',stamp:'Broken',   epi:'Never folded. Finally did.'},
  under: {acc:'#9cc27e',deep:'#0e1a0b',ang:8,  side:'l',prop:'coffin', fx:'dirt',  stamp:'Buried',   epi:'Dug his own grave. Lay right down in it.'},
  snake: {acc:'#6fd07a',deep:'#08200f',ang:-6, side:'r',prop:'snake',  fx:'cards', stamp:'Dealt Out',epi:'Got out-cheated. Hated every second.'},
  banker:{acc:'#e2c264',deep:'#2a2208',ang:7,  side:'l',prop:'bag',    fx:'bills', stamp:'Bankrupt', epi:'Account closed. Insufficient funds.'},
  vesper:{acc:'#e0435f',deep:'#33060f',ang:-8, side:'r',prop:'rose',   fx:'petals',stamp:'Unlucky',  epi:'Her luck ran out. Took her with it.'},
  bicah: {acc:'#ef3a1d',deep:'#220403',ang:9,  side:'l',prop:'rat',    fx:'smoke', stamp:'Dead',     epi:'Said he always comes back. He won\'t.'}
};
const BOSS_PROPS={
  bottle:'<path d="M43 4h14v7l-2 2v13c0 5 13 9 13 23v41c0 4-3 6-6 6H38c-3 0-6-2-6-6V49c0-14 13-18 13-23V13l-2-2z"/><rect x="36" y="56" width="28" height="22" rx="2" class="p2"/><text x="50" y="71" class="pt">XXX</text>',
  key:'<circle cx="27" cy="50" r="17" fill="none" stroke-width="9"/><rect x="42" y="45" width="52" height="10" rx="2"/><rect x="70" y="53" width="7" height="14"/><rect x="84" y="53" width="7" height="19"/>',
  anvil:'<path d="M6 30h68c9 0 17 4 20 11-9 0-15 2-19 6-6 6-8 11-8 17v5h9v11H24V69h9v-5c0-9-5-15-13-19C14 42 9 37 6 30z"/>',
  coffin:'<path d="M36 3h28l16 25-14 69H34L20 28z"/><rect x="47" y="22" width="6" height="40" class="p2"/><rect x="38" y="32" width="24" height="6" class="p2"/>',
  snake:'<path d="M14 88C40 98 74 84 58 64S18 44 38 26 78 16 86 8" fill="none" stroke-width="13" stroke-linecap="round"/><ellipse cx="86" cy="9" rx="9" ry="6" transform="rotate(-35 86 9)"/><path d="M93 4l6-3M93 4l5 3" fill="none" stroke-width="2" class="p3"/>',
  bag:'<path d="M38 22l-7-12h38l-7 12c17 8 29 26 29 45 0 19-15 30-41 30S9 86 9 67c0-19 12-37 29-45z"/><rect x="34" y="20" width="32" height="6" rx="3" class="p2"/><text x="50" y="74" class="pt big">$</text>',
  rose:'<path d="M50 52c3 16 0 30-4 44" fill="none" stroke-width="5"/><path d="M48 76c-12-6-20-2-24 4 10 4 18 2 24-4z"/><circle cx="50" cy="34" r="17"/><circle cx="38" cy="28" r="11"/><circle cx="62" cy="28" r="11"/><circle cx="50" cy="20" r="11"/><path d="M42 34c4-8 12-8 16 0" fill="none" stroke-width="3" class="p3"/>',
  rat:'<ellipse cx="46" cy="60" rx="30" ry="18"/><path d="M70 52l22 8-20 10z"/><circle cx="68" cy="44" r="9"/><path d="M18 64C4 70 6 88 22 90s28 2 34 8" fill="none" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="58" r="2.5" class="p3"/>'
};
function boFx(type,ov){
  if(REDUCED) return;
  const W=innerWidth, H=parseFloat(getComputedStyle(ov).height)||innerHeight, n={glass:26,dust:30,sparks:36,dirt:28,cards:18,bills:20,petals:26,smoke:14}[type]||20;
  const ox=W*0.5, oy=H*0.56;
  for(let k=0;k<n;k++){
    const e=document.createElement('i'); e.className='bp bp-'+type; ov.appendChild(e);
    const rnd=(a,b)=>a+Math.random()*(b-a), ang=rnd(0,6.283), sp=rnd(.35,1);
    let kf, dur=rnd(1300,2400), delay=rnd(0,250);
    if(type==='glass'||type==='sparks'||type==='cards'){
      const dx=Math.cos(ang)*W*.55*sp, dy=Math.sin(ang)*H*.32*sp, g=type==='sparks'?H*.05:H*.35;
      if(type==='cards'){e.textContent=['♠︎','♥︎','♦︎','♣︎'][k%4]; if(k%4===1||k%4===2) e.classList.add('red')}
      if(type==='sparks') e.style.rotate=(ang*57.3)+'deg';
      kf=[{transform:`translate(${ox}px,${oy}px) rotate(0deg) scale(.6)`,opacity:1},{transform:`translate(${ox+dx}px,${oy+dy*.6}px) rotate(${rnd(-400,400)}deg) scale(1)`,opacity:1,offset:.45},
          {transform:`translate(${ox+dx*1.3}px,${oy+dy+g}px) rotate(${rnd(-720,720)}deg) scale(.9)`,opacity:0}];
      if(type==='sparks') dur=rnd(500,900);
    } else if(type==='dirt'){
      const x=rnd(0,W); kf=[{transform:`translate(${x}px,-30px)`,opacity:1},{transform:`translate(${x+rnd(-30,30)}px,${H*rnd(.55,.95)}px)`,opacity:1,offset:.8},{transform:`translate(${x+rnd(-40,40)}px,${H*rnd(.55,.95)-12}px)`,opacity:0}];
      dur=rnd(900,1500); e.style.width=e.style.height=rnd(4,11)+'px';
    } else if(type==='bills'||type==='petals'){
      const x=rnd(0,W), sw=rnd(30,80); kf=[{transform:`translate(${x}px,-40px) rotate(0deg)`,opacity:0},{opacity:1,offset:.1},
        {transform:`translate(${x+sw}px,${H*.4}px) rotate(${rnd(90,260)}deg)`,offset:.5},{transform:`translate(${x-sw}px,${H+40}px) rotate(${rnd(300,600)}deg)`,opacity:.9}];
      dur=rnd(2600,4200); delay=rnd(0,1400);
    } else if(type==='dust'||type==='smoke'){
      const x=rnd(-.1,1.1)*W, y=rnd(.3,.9)*H, s=type==='smoke'?rnd(80,180):rnd(3,8);
      e.style.width=e.style.height=s+'px';
      kf=[{transform:`translate(${x}px,${y}px) scale(.3)`,opacity:0},{opacity:type==='smoke'?.35:.8,offset:.3},{transform:`translate(${x+rnd(-60,60)}px,${y-rnd(60,180)}px) scale(1.4)`,opacity:0}];
      dur=rnd(2200,3800); delay=rnd(0,900);
    }
    e.animate(kf,{duration:dur,delay,easing:type==='dirt'?'cubic-bezier(.5,0,.9,.5)':'cubic-bezier(.15,.7,.3,1)',fill:'both'}).onfinish=()=>e.remove();
  }
}
// shrink a line of type until it fits a share of its poster's width
function fitWidth(el,share){if(!el) return; el.style.fontSize=''; const box=el.closest('.bo-sheet,.poster'); if(!box) return; const w=el.scrollWidth||el.getBoundingClientRect().width, max=box.clientWidth*share; if(w>max) el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*max/w).toFixed(2)+'px'}
function inkSplat(seed,cls='splat'){
  const r=rng(seed+'#ink'); let d='';
  const f=v=>+v.toFixed(1);
  for(let i=0;i<38;i++){
    const a=r()*Math.PI*2, k=.72+r()*.5, x=100+Math.cos(a)*82*k, y=60+Math.sin(a)*(Math.sin(a)<0?9:26)*k, q=.7+r()*r()*5.2;
    d+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(q)}"/>`;
    if(r()<.4){const l=5+r()*12, cx=x+Math.cos(a)*l*.55, cy=y+Math.sin(a)*l*.55; d+=`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(l*.5)}" ry="${f(Math.max(.5,q*.4))}" transform="rotate(${Math.round(a*180/Math.PI)} ${f(cx)} ${f(cy)})"/>`}
  }
  return `<svg class="${cls}" viewBox="0 0 200 120" aria-hidden="true">${d}</svg>`;
}
function bossOut(next){
  const bd=BOSSES[R.level-1], th=BOSS_FX[bd.key]||BOSS_FX.pete, sg=$('sGame');
  let ov=$('bossOut'); if(!ov){ov=document.createElement('div'); ov.id='bossOut'; document.body.appendChild(ov)}
  ov.className='bo side-'+th.side+' bo-'+bd.key;
  ov.style.cssText=`--acc:${th.acc};--deep:${th.deep};--ang:${th.ang}deg`;
  const hr=rng(bd.key+'#holes'), holes=[[12+hr()*12,8+hr()*6],[93+hr()*2.5,30+hr()*22],[5+hr()*2.5,58+hr()*16]];
  const letters=bd.name.split(' ').map((w,wi,arr)=>`<span class="bo-word">${[...w].map((ch,ci)=>`<span class="bo-l" style="--d:${(arr.slice(0,wi).join('').length+ci)*45}ms">${ch}</span>`).join('')}</span>`).join(' ');
  ov.innerHTML=`<div class="bo-rays"></div>
    <div class="bo-ghost">${bd.title.toUpperCase()}</div>
    <svg class="bo-prop" viewBox="0 0 100 100" aria-hidden="true">${BOSS_PROPS[th.prop]||''}</svg>
    <div class="bo-portrait"><div class="bo-sheet">
      <i class="bo-nail"></i>
      <div class="bo-w1">Wanted</div>
      <div class="bo-w2"><i></i><span>Dead or Alive</span><i></i></div>
      <div class="bo-frame pt-live">${bossPortrait(bd,'square')}</div>
      <div class="bo-reward"><span>Reward</span><b>${num(G.bounty)} gold</b></div>
      ${holes.map(([x,y],k)=>`<i class="bo-hole" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--k:${k}"></i>`).join('')}
      ${inkSplat(bd.key)}
      <div class="bo-stamp"><span>${th.stamp}</span></div>
    </div></div>
    <div class="bo-stripe"></div><div class="bo-band"></div>
    <div class="bo-text">
      <div class="bo-kicker"><b>${TOWNS[R.level-1]}</b><i></i><span>Taken down</span></div>
      <div class="bo-name" style="font-family:${bd.font},var(--f-display);--fs:${bd.fs||1}">${letters}</div>
      <div class="bo-tag"><span id="boTag"></span><em class="bo-caret"></em></div>
    </div>
    <div class="bo-tap">Tap to collect the bounty</div>`;
  ov.hidden=false; void ov.offsetWidth; ov.classList.add('go');
  const fitAll=()=>{if(!ov.isConnected) return; fitWidth(ov.querySelector('.bo-w1'),.86); fitWidth(ov.querySelector('.bo-reward b'),.8); fitWidth(ov.querySelector('.bo-stamp span'),.66)};
  fitAll(); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fitAll);
  sg.classList.add('frozen'); sfx('gun'); shake(true);
  if(bd.key==='bicah'){later(()=>sfx('gun'),320); later(()=>sfx('gun'),560)}
  later(()=>{sfx('boss'); boFx(th.fx,ov)},520);
  // three shots punch through the poster
  later(()=>{ov.classList.add('shot'); [0,140,280].forEach((d,k)=>later(()=>sfx('gun',0,1.08+k*.07),d))},760);
  // epitaph types itself out like a telegraph tape
  later(()=>{const el=$('boTag'); if(!el) return; let i=0; const t=th.epi; const step=()=>{if(!el.isConnected) return; el.textContent=t.slice(0,++i); if(i%2===0) sfx('tick',0,1.6); if(i<t.length) setTimeout(step,28)}; step()},1150);
  later(()=>{sfx('stamp'); shake(false); ov.classList.add('stamped')},1900);
  later(()=>sfx('bigwin'),2150);
  let done=false; const close=()=>{if(done) return; done=true; ov.classList.add('out'); setTimeout(()=>{ov.hidden=true; ov.classList.remove('go','out','stamped','shot'); sg.classList.remove('frozen')},420); next()};
  setTimeout(()=>{ov.onclick=close},1200);
}
function showPaid(){
  const bd=BOSSES[R.level-1];
  posterFor(bd,'paid');
  $('posterQuote').textContent=`"${bd.lines.bust}"`; $('posterTwist').textContent='';
  $('posterLine').textContent=`Taken down in ${TOWNS[R.level-1]}.`;
  const st=$('stamp'), pp=$('poster').querySelector('.poster'); st.hidden=false; st.classList.remove('hit'); void st.offsetWidth; st.classList.add('hit');
  let sp=pp.querySelector('.psplat'); if(!sp){pp.insertAdjacentHTML('beforeend',inkSplat('paid','splat psplat')); sp=pp.querySelector('.psplat')}
  setTimeout(()=>pp.classList.add('stamped'),280);
  $('posterBtn').textContent='Collect the bounty'; $('posterBtn').className='btn gold big';
  $('posterBtn').onclick=()=>{ac(); $('poster').hidden=true; $('table').classList.remove('bust'); tableWon()};
  $('poster').hidden=false;
  sfx('paid',350); later(()=>sfx('stamp'),150); coinRain();
}
function coinRain(){
  if(REDUCED) return;
  const m=$('poster');
  for(let k=0;k<36;k++){
    const c=document.createElement('span'); c.className='coinfall'; c.style.left=(Math.random()*100)+'%'; m.appendChild(c);
    const a=c.animate([{transform:'translateY(-10vh) rotateY(0deg)',opacity:0},{opacity:1,offset:.1},{transform:`translateY(110vh) rotateY(${720+Math.random()*720}deg)`,opacity:1}],
      {duration:1600+Math.random()*1400,delay:300+Math.random()*900,easing:'cubic-bezier(.4,.1,.7,1)',fill:'both'});
    a.onfinish=()=>c.remove();
  }
}
function tableWon(){
  TOKEN++;
  const L=R.level, bd=BOSSES[L-1], me=human();
  meta.beaten=meta.beaten||{}; meta.beaten[bd.key]=(meta.beaten[bd.key]||0)+1;
  if(R.daily){dailyDone(true); return}
  R.gold+=G.bounty; meta.stats.bosses++;
  let extra='';
  if(has('cashout')){const g=Math.floor(me.chips/100); R.gold+=g; extra+=` Cashout +${g}.`}
  if(has('bond')){const hi=lvl('bond')>=2; const g=Math.min(hi?40:20,Math.round(R.gold*(hi?0.2:0.1))); R.gold+=g; extra+=` Interest +${g}.`}
  let unlockMsg='';
  if(bd.unlock&&bd.unlock>meta.unlock){meta.unlock=bd.unlock; unlockMsg=' New charms unlocked for every future run.'}
  meta.best=Math.max(meta.best,Math.min(8,L+1));
  if(L===8){meta.wins++; saveMeta(); sset(RUN_KEY,null); endRun(true); return}
  saveMeta();
  R.level++;
  openShop('shop',`You took down <b>${bd.name}</b>. Bounty <b>${G.bounty}g</b>${G.koGold?`, knockouts <b>${G.koGold}g</b>`:''}.${extra}${unlockMsg}`);
}
// losing: one bell, the world drains and goes silent, then back to the main menu
function loseRun(){
  const sg=$('sGame'); hush(true); heartbeat(false); sfx('toll',60);
  let v=$('lossVeil'); if(!v){v=document.createElement('div'); v.id='lossVeil'; v.className='lv'; document.body.appendChild(v)}
  const ne=G.nemEv, nn=ne&&ne.who;
  const nemLine=!nn?'':ne.born?`<div class="lv-nem">${portraitFor({name:nn.name,fem:nn.fem,tier:nn.tier,nem:true,nemRank:1})}<span><b>${nn.name}</b> took the last pot. ${nn.fem?'She':'He'}'ll remember you.<em>Word is they call ${nn.fem?'her':'him'} ${nn.epi} now</em></span></div>`
    :`<div class="lv-nem">${portraitFor({name:nn.name,fem:nn.fem,tier:nn.tier,nem:true,nemRank:nn.rank})}<span><b>${nemName(nn)}</b> got you again.<em>Rises to ${nemTitle(nn)} · ${nn.kills} kills</em></span></div>`;
  v.innerHTML=`<div class="lv-stamp">Dead Man</div><div class="lv-sub">The ride ends in ${TOWNS[R.level-1]}</div>${nemLine}`;
  v.classList.remove('on','black'); v.hidden=false;
  const fitStamp=()=>{const st=v.querySelector('.lv-stamp'); if(!st) return; st.style.fontSize=''; const mw=Math.min(innerWidth,v.clientWidth||innerWidth)*.84; if(st.offsetWidth>mw) st.style.fontSize=(parseFloat(getComputedStyle(st).fontSize)*mw/st.offsetWidth).toFixed(1)+'px'};
  fitStamp(); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fitStamp);
  void v.offsetWidth; v.classList.add('on');
  sg.classList.add('lost'); R.phase='over'; sset(RUN_KEY,null);
  let gone=false; const go=()=>{if(gone) return; gone=true; leaveLost()};
  setTimeout(()=>{v.onclick=go},1800);
  later(go,nn?7200:5200);
}
function leaveLost(){
  const v=$('lossVeil'), fin=()=>{runOver(true); $('sGame').classList.remove('lost'); if(v){v.classList.remove('black','on'); setTimeout(()=>{if(!v.classList.contains('on')) v.hidden=true},900)}};
  if(v&&!v.hidden){v.onclick=null; v.classList.add('black'); setTimeout(fin,950)} else fin();
}
function runOver(toMenu){TOKEN++; if(R&&R.daily){dailyDone(false); return} meta.best=Math.max(meta.best,R.level); saveMeta(); sset(RUN_KEY,null); if(toMenu){hush(false); renderTitle(); return} endRun(false)}
const NP_ADS=[
  ['Dr. Hatch\'s Tonic','Cures tilt, bad beats &amp; the shakes. Sold at every saloon.','25 cents'],
  ['Wanted: Bicah Mell','For crimes against honest card players.','$5,000 reward'],
  ['Undertaker','Pine boxes made to measure. No job too small.','Graves End'],
  ['Lessons in Poker','Taught by a gentleman. Discretion assured.','Inquire within'],
  ['Lost','One fortune, last seen at a card table. Finder keep it.','No reward'],
  ['Fresh Decks','Sealed &amp; unmarked. Mostly.','Silver Fork']
];
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function endRun(victory){
  const L=R.level, town=TOWNS[L-1], bd=BOSSES[L-1], d=new Date();
  const hands=(G&&G.tableHands)||0, ch=R.charms.map(k=>CHARMS[k].name);
  const chText=ch.length?(ch.length===1?`a ${ch[0]}`:ch.slice(0,-1).join(', ')+' and '+ch[ch.length-1]):'nothing but nerve';
  $('endDate').textContent=`Vol. XII · No. ${meta.runs||1}`;
  $('npDate').textContent=`${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, 1881`;
  $('npWeather').textContent=['Fair & Dusty','Hot, Wind from the West','Clear & Cold','Dust Storms Likely'][meta.runs%4|0];
  const won=bd.lines.win||[], quip=won[(meta.runs||0)%Math.max(1,won.length)]||'';
  if(victory){
    $('npKicker').textContent='The Territory Is Clean';
    $('endTitle').textContent='Masked Rider Takes the Territory';
    $('endSub').textContent='Bicah Mell Falls at Graves End · Eight Bosses Taken Down · Bounties Paid in Full';
    $('npCut').innerHTML=portrait('You the rider',HUMAN_LOOK);
    $('npCap').innerHTML='The Rider.<em>No name was given.</em>';
    $('npStamp').textContent='Paid'; $('npStamp').className='np-stamp paid';
    $('npStory').innerHTML=`<p><span class="cap">G</span><span class="dl">raves End.</span> A masked stranger finished what no lawman could last night, taking down Bicah Mell at the final table and riding out with ${num(R.gold)} in gold.</p><p>The rider came up the trail from Dry Creek with ${chText}, and left every boss between here and there flat broke.</p><p>Asked for comment, Mell said only <q>${bd.lines.bust}</q> Witnesses report the rider tipped a hat and said nothing at all.</p><p>The Marshal's office says the reward will be paid in full.</p>`;
  } else {
    $('npKicker').textContent=`Trouble at ${town}`;
    $('endTitle').textContent=`Rider Falls in ${town}`;
    $('endSub').textContent=`${bd.name} Takes the Last of the Stranger's Chips${hands?` · ${hands} Hands Played`:''}`;
    $('npCut').innerHTML=bossPortrait(bd);
    $('npCap').innerHTML=`${bossName(bd)}.<em>${bd.title}. From a sketch.</em>`;
    $('npStamp').textContent='Dead Man'; $('npStamp').className='np-stamp';
    $('npStory').innerHTML=`<p><span class="cap">${town[0]}</span><span class="dl">${town.slice(1)}.</span> A masked stranger who rode in with ${chText} was sent packing last night by ${bd.name}, ${bd.title.toLowerCase()} of the ${town} saloon.</p><p>${bd.name.split(' ')[0]} took the last of the rider's chips${hands?` after ${hands} hands`:''}, and was heard to remark <q>${quip}</q></p><p>The rider made it ${L} saloon${L>1?'s':''} down the trail and leaves town with ${num(R.gold)} gold. Regulars say the stranger will be back. They always come back.</p>`;
  }
  const rows=[['Saloons ridden',victory?'8 of 8':`${L} of 8`],['Gold in pocket',num(R.gold)],['Charms carried',R.charms.length],['Best ride',meta.wins?`Won ×${meta.wins}`:`Saloon ${meta.best}`]];
  $('endPlaques').innerHTML=rows.map(([a,b])=>`<div class="np-row"><span>${a}</span><i></i><b>${b}</b></div>`).join('');
  const ad=NP_ADS[(meta.runs||0)%NP_ADS.length];
  $('npAd').innerHTML=`<b>${ad[0]}</b><span>${ad[1]}</span><small>${ad[2]}</small>`;
  const pp=$('paper'); pp.style.animation='none'; void pp.offsetWidth; pp.style.animation='';
  show('sEnd'); sfx(victory?'paid':'stamp',300); later(()=>sfx('stamp'),1000);
}

/* ================= effects ================= */
function charmKeyByName(n){return Object.keys(CHARMS).find(k=>CHARMS[k].name===n)}
function procChain(list,at,start){
  list.forEach((b,k)=>later(()=>{
    const key=charmKeyByName(b.label), c=key?CHARMS[key]:null;
    const el=document.createElement('div'); el.className='proc'+(c&&c.tier>=2?' gold':c&&c.tier===1?' foil':'');
    el.style.left=at[0]+'%'; el.style.top=(at[1]-12-k*10)+'%'; el.style.setProperty('--k',k);
    el.innerHTML=`<span class="pi">${c?c.icon+'\uFE0E':'\u2726'}</span><span class="pt"><b>${b.label}</b><em>${b.chips?'+'+money(b.chips):''}${b.chips&&b.gold?' · ':''}${b.gold?'+'+b.gold+'g':''}</em></span>${k?`<span class="px">×${k+1}</span>`:''}`;
    $('fx').appendChild(el); setTimeout(()=>el.remove(),2300);
    const ic=key&&document.querySelector(`#charmRow .gl[data-k="${key}"]`); if(ic){ic.classList.remove('fire'); void ic.offsetWidth; ic.classList.add('fire')}
    sfx('chip',0,1+k*0.12); if(k) sfx('tick',60,1+k*0.5); if(b.gold) bumpGold();
  },start+k*480));
}

function seatEl(i,sel){return document.querySelector(`.seat[data-i="${i}"] ${sel||''}`)}
function relCenter(el){const t=$('table').getBoundingClientRect(), r=el.getBoundingClientRect(); return [r.left+r.width/2-t.left, r.top+r.height/2-t.top]}
function centerOfSeat(i){if(i===0&&isDuoV()) return [50,90]; const el=seatEl(i,'.plate'); if(!el) return null; const t=$('table').getBoundingClientRect(); const [x,y]=relCenter(el); return [x/t.width*100,y/t.height*100]}
function fly(fromEl,toEl,count,dur,cls){
  if(REDUCED||!fromEl||!toEl) return;
  const [x1,y1]=relCenter(fromEl), [x2,y2]=relCenter(toEl);
  for(let k=0;k<count;k++){
    const s=document.createElement('span'); s.className='chip fly '+(cls||'g'); s.style.left=(x1-10)+'px'; s.style.top=(y1-10)+'px'; $('fx').appendChild(s);
    // chips have weight: they arc, tumble edge-over-edge, land a touch short and settle onto the stack
    const jx=(Math.random()-.5)*18, jy=(Math.random()-.5)*12, dx=x2-x1+jx, dy=y2-y1+jy, lift=Math.min(70,26+Math.hypot(dx,dy)*.12), spin=(Math.random()<.5?-1:1)*(360+Math.random()*360);
    const a=s.animate([
      {transform:'translate(0,0) rotateX(0deg) rotateZ(0deg) scale(1)',filter:'drop-shadow(0 2px 2px rgba(0,0,0,.5))'},
      {transform:`translate(${dx*.5}px,${dy*.5-lift}px) rotateX(${spin*.6}deg) rotateZ(${spin*.15}deg) scale(1.16)`,filter:'drop-shadow(0 14px 8px rgba(0,0,0,.35))',offset:.48},
      {transform:`translate(${dx*.97}px,${dy*.97}px) rotateX(${spin}deg) rotateZ(${spin*.2}deg) scale(.95)`,filter:'drop-shadow(0 2px 2px rgba(0,0,0,.55))',offset:.86},
      {transform:`translate(${dx}px,${dy-3}px) rotateX(${spin}deg) rotateZ(${spin*.2}deg) scale(.9)`,offset:.93},
      {transform:`translate(${dx}px,${dy}px) rotateX(${spin}deg) rotateZ(${spin*.2}deg) scale(.86)`,filter:'drop-shadow(0 1px 1px rgba(0,0,0,.6))'}],
      {duration:dur*1.15,delay:k*55,easing:'cubic-bezier(.33,.0,.35,1)',fill:'both'});
    if(k===count-1) a.onfinish=()=>{s.remove(); const t=toEl.closest&&toEl.closest('.potrow,.plate,.bet'); if(t){t.classList.remove('thud'); void t.offsetWidth; t.classList.add('thud')}}; else
    a.onfinish=()=>s.remove();
  }
}
function burst(el,count){
  if(REDUCED||!el) return;
  const [x,y]=relCenter(el);
  for(let k=0;k<count;k++){
    const s=document.createElement('span'); s.className='spark'; s.style.left=x+'px'; s.style.top=y+'px'; $('fx').appendChild(s);
    const ang=Math.random()*Math.PI*2, d=40+Math.random()*120;
    const a=s.animate([{transform:'translate(-50%,-50%) rotate(45deg) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(ang)*d}px), calc(-50% + ${Math.sin(ang)*d+40}px)) rotate(${200+Math.random()*300}deg) scale(.3)`,opacity:0}],
      {duration:800+Math.random()*600,easing:'cubic-bezier(.15,.7,.4,1)',fill:'forwards'});
    a.onfinish=()=>s.remove();
  }
}
/* ---- nemesis presentation ---- */
function seatSay(i,text,c){
  const fx=$('fx'); if(!fx||!text) return; const pos=c||centerOfSeat(i); if(!pos) return;
  const d=document.createElement('div'); d.className='seat-say'; d.textContent=`“${text}”`; d.style.left=Math.max(14,Math.min(86,pos[0]))+'%'; d.style.top=pos[1]+'%'; fx.appendChild(d); setTimeout(()=>d.remove(),3600)}
function nemAmbush(n,then){
  let v=$('nemCard'); if(!v){v=document.createElement('div'); v.id='nemCard'; v.className='modal nem-modal'; document.body.appendChild(v)}
  const lines=NEM_LINES.back, said=lines[Math.min(lines.length-1,(n.met||1)-1+Math.floor(Math.random()*2))];
  const split=document.documentElement.classList.contains('duo-wide');
  v.innerHTML=`<div class="nem-sheet nem-top" role="dialog" aria-label="An old face"><div class="nem-k">${n.fem?'She':'He'} remembers you</div>
    <div class="nem-face">${portraitFor({name:n.name,fem:n.fem,tier:n.tier,nem:true,nemRank:n.rank})}</div>
    <div class="nem-name">${nemName(n)}</div><div class="nem-rank">${nemTitle(n)}${'<i>★</i>'.repeat(n.rank)}</div>
    <p class="nem-q">“${said}”</p>${split?'</div><div class="nem-sheet nem-bot">':''}
    <div class="nem-facts"><span>Kills<b>${n.kills}×</b></span><span>Last seen<b>${n.last}</b></span><span>Bounty<b>${25*n.rank}g</b></span></div>
    <p class="nem-note">${n.rank>=4?'Plays like a veteran. Never tilts. Deep pockets.':n.rank>=3?'Sharp now. Never tilts.':n.rank>=2?'Tougher than last time. Never tilts.':'Take ' + (n.fem?'her':'him') + ' out yourself to collect.'}</p>
    <button class="btn raise big" id="nemGo">Settle it</button></div>`;
  v.hidden=false; sfx('boss'); haptic('heavy'); setTimeout(()=>sfx('stamp'),500);
  $('nemGo').onclick=()=>{ac(); v.hidden=true; sfx('card'); then&&then()};
}
function nemPanel(){
  const n=meta.nemesis, gv=meta.graves||[];
  const cur=n?`<div class="tp-nem"><span class="medal">${portraitFor({name:n.name,fem:n.fem,tier:n.tier,nem:true,nemRank:n.rank})}</span><div><b>${nemName(n)}</b><em>${nemTitle(n)} · took you down ${n.kills}× · first at ${n.first}</em></div></div>`
    :`<p class="hint" style="margin:4px 0 0">Nobody's hunting you. Yet. Whoever takes your last chip will remember.</p>`;
  const graves=gv.length?`<div class="tp-graves">${gv.map(g=>`<div class="tp-grave"><span class="medal">${portraitFor({name:g.name,fem:g.fem,tier:g.tier,nem:true,nemRank:g.rank})}</span><b>${g.name.split(' ')[0]} "${g.epi}"</b><em>Buried in ${g.town}</em></div>`).join('')}</div>`:'';
  return `<div class="tp-h">Bad blood <small>${gv.length} buried</small></div>${cur}${graves}`;
}
function stampAt(xPct,yPct,text,color,size){
  const s=document.createElement('div'); s.className='stampfx'; s.textContent=text;
  s.style.left=xPct+'%'; s.style.top=yPct+'%';
  s.style.setProperty('--sc',color||'#d8341f'); s.style.setProperty('--sz',(size||30)+'px'); s.style.setProperty('--rot',(-10+Math.random()*8)+'deg');
  $('fx').appendChild(s); setTimeout(()=>s.remove(),1800);
  const W=$('fx').clientWidth, w=s.offsetWidth;
  if(W&&w){if(w>W-12) s.style.setProperty('--sz',((size||30)*(W-12)/w).toFixed(1)+'px');
    const ww=Math.min(w,W-12), cx=Math.max(ww/2+6,Math.min(W-ww/2-6,xPct/100*W)); s.style.left=cx+'px'}
}
function floatNum(xPct,yPct,text,neg,delay){
  setTimeout(()=>{const s=document.createElement('div'); s.className='floatnum'+(neg?' neg':''); s.textContent=text; s.style.left=xPct+'%'; s.style.top=yPct+'%'; $('fx').appendChild(s); setTimeout(()=>s.remove(),1600)},delay||0);
}
function bumpGold(){const g=$('goldchip'); g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); sfx('chip')}
let REVEAL_T=null;
function showReveal(res){
  const w=res.winners[0]; if(!w) return;
  const p=G.players[w.i], el=$('reveal');
  const mine=res.winners.some(x=>x.i===0);
  const handTxt=res.showdown?CAT_SHORT[handCat(p.score)]:'';
  $('rvHand').innerHTML=handTxt.split('').map((ch,k)=>`<span style="animation-delay:${k*45}ms">${ch===' '?'&nbsp;':ch}</span>`).join('');
  $('rvWho').textContent=res.winners.length>1?'Split pot':(p.isHuman?'You win':`${shortName(p)} wins`);
  el.className='reveal'+(mine?' mine':''); el.hidden=false;
  const amtEl=$('rvAmt'), to=res.winners.length>1?Math.round(res.pot/res.winners.length):w.amt;
  const hot=REDUCED?[]:[...document.querySelectorAll('#board .card.hot, .seat .card.hot')];
  hot.forEach((c,k)=>{c.style.setProperty('--ld',(k*150)+'ms'); c.classList.add('lift'); sfx('card',k*150,0.9+k*0.07)});
  const big=to/Math.max(1,G.bb), tier=big>=60?3:big>=25?2:big>=10?1:0;
  el.dataset.tier=tier;
  const t0=performance.now(), dur=REDUCED?0:Math.min(2000,500+to/5)*(1+tier*0.15), delay=Math.max(handTxt.length*45,hot.length*150)+260;
  let lastTick=0;
  amtEl.textContent=money(0);
  const tick=now=>{const k=dur?Math.max(0,Math.min(1,(now-t0-delay)/dur)):1, v=Math.round(to*(1-Math.pow(1-k,3)));
    amtEl.textContent=money(v)+(res.winners.length>1?' each':'');
    if(k>0&&k<1&&now-lastTick>55){lastTick=now; sfx('tick',0,1+k*1.2)}
    if(k<1) requestAnimationFrame(tick);
    else if(!amtEl.dataset.done){amtEl.dataset.done=1; amtEl.classList.remove('slam'); void amtEl.offsetWidth; amtEl.classList.add('slam'); sfx(tier>=2?'stamp':'chip'); if(tier>=2) shake(tier>=3); if(mine&&tier) burst(seatEl(0,'.plate'),12+tier*14)}};
  delete amtEl.dataset.done; amtEl.classList.remove('slam');
  requestAnimationFrame(tick);
  clearTimeout(REVEAL_T);
  if(!G.outcome) REVEAL_T=setTimeout(()=>{el.classList.add('out'); setTimeout(()=>{if(el.classList.contains('out')) el.hidden=true},500)},(delay+dur+1500)*Math.max(.7,speedMul()));
}
function hideReveal(){clearTimeout(REVEAL_T); const el=$('reveal'); el.hidden=true; el.classList.remove('out')}

/* ================= boss voice ================= */
let QUOTE_T=null, QUOTE_FADE=null;
function quote(text,tell){
  const el=$('bossQuote'), rb=$('ribbon'), rq=$('ribbonQuote');
  clearInterval(QUOTE_T); clearTimeout(QUOTE_FADE);
  if(!text&&!tell){el.className='quote'; el.innerHTML=''; rb.classList.remove('speaking'); return}
  el.className='quote on';
  el.innerHTML=`${text?'<span class="qt"></span>':''}${tell?`<span class="qtell">${tell}</span>`:''}`;
  rq.innerHTML=`${text?'<span class="rq"></span>':''}${tell?`<span class="rt">${tell}</span>`:''}`;
  rb.classList.add('speaking');
  if(text){
    const full=`“${text}”`, a=el.querySelector('.qt'), b=rq.querySelector('.rq');
    if(REDUCED){a.textContent=full; b.textContent=full}
    else {let k=0; QUOTE_T=setInterval(()=>{k++; const s=full.slice(0,k); a.textContent=s; b.textContent=s; if(k>=full.length) clearInterval(QUOTE_T)},24)}
  }
  QUOTE_FADE=setTimeout(()=>{el.classList.remove('on'); rb.classList.remove('speaking')},(4200+(text||'').length*30)*Math.max(.6,speedMul()));
}
function say(text,tell){quote(text,tell)}

/* ================= table rendering ================= */
document.addEventListener('pointermove',e=>{
  const cs=e.target.closest&&e.target.closest('.seat.human .cards'); 
  document.querySelectorAll('.seat.human .cards.tilt').forEach(x=>{if(x!==cs){x.classList.remove('tilt'); x.style.removeProperty('--rx'); x.style.removeProperty('--ry')}});
  if(!cs||REDUCED) return; const r=cs.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
  cs.classList.add('tilt'); cs.style.setProperty('--ry',(px*22)+'deg'); cs.style.setProperty('--rx',(-py*18)+'deg'); cs.style.setProperty('--mx',(px*100+50)+'%');
},{passive:true});
document.addEventListener('pointerleave',()=>document.querySelectorAll('.cards.tilt').forEach(x=>x.classList.remove('tilt')));

const NARROW_SEATS={
  2:[[50,8]],3:[[16,64],[84,64]],4:[[14,66],[50,7],[86,66]],5:[[14,66],[26,8],[74,8],[86,66]],
  6:[[14,66],[17,8],[50,6],[83,8],[86,66]],7:[[14,88],[14,66],[24,8],[76,8],[86,66],[86,88]],8:[[14,88],[14,66],[17,8],[50,6],[83,8],[86,66],[86,88]]
};
// Duo upright: the top screen is the table without you; opponents ride the far arc of the oval
const isDuoV=()=>document.documentElement.classList.contains('duo-v');
function positionsDuo(N){const out=[[50,112]], k=N-1; for(let j=0;j<k;j++){const a=(k===1?270:150+240*j/(k-1))*Math.PI/180; out.push([50+43*Math.cos(a),50+40*Math.sin(a)])} return out}
function positions(N,narrow){
  if(isDuoV()) return positionsDuo(N);
  if(narrow&&NARROW_SEATS[N]) return [[50,88]].concat(NARROW_SEATS[N]);
  const out=[]; for(let i=0;i<N;i++){const a=Math.PI/2+2*Math.PI*i/N; out.push([50+42*Math.cos(a),48+38*Math.sin(a)])} return out;
}
const PILLS=new Map(), BETV={};
let HEART=null;
function heartbeat(on){if(on&&!HEART){sfx('heart'); HEART=setInterval(()=>sfx('heart'),880)} else if(!on&&HEART){clearInterval(HEART); HEART=null}}
function pillLife(i,text,keep){
  if(!text||keep) return '';
  const prev=PILLS.get(i), now=performance.now();
  if(!prev||prev.text!==text){PILLS.set(i,{text,at:now}); return ''}
  return ` style="animation-delay:-${Math.round(now-prev.at)}ms"`;
}
function render(){
  if(!R||!G.players.length) return;
  const L=R.level, bd=BOSSES[L-1], bp=boss(), me=human();
  const toRise=G.riseEvery-(G.tableHands%G.riseEvery);
  $('lvl').textContent=`Saloon ${L} of 8`;
  $('town').textContent=R.tutorial?'Practice Table':TOWNS[L-1]; if(R.tutorial) $('lvl').textContent='No boss · just practice';
  $('gold').innerHTML=roll('gold',R.gold,'s',num);
  if(bp){
    $('bountyPortrait').innerHTML=portraitFor(bp);
    $('bountyName').innerHTML=bossName(bp.bossDef);
    $('bountyChips').innerHTML=`${roll('boss',bp.chips,'s',num)} chips`;
    $('meterFill').style.width=Math.max(0,Math.min(100,bp.chips/G.bossStart*100))+'%';
    $('bossbar').title=bd.twist;
  }
  let t=''; for(let k=1;k<=8;k++) t+=(k>1?'<em></em>':'')+`<i class="${k<L?'done':k===L?'here':''}" title="${TOWNS[k-1]}"></i>`;
  $('trail').innerHTML=t;
  $('charmRow').innerHTML=R.charms.map(k=>`<span class="gl" data-k="${k}" title="${CHARMS[k].name}">${CHARMS[k].icon}︎</span>`).join('')+R.tricks.map(k=>`<span class="gl trick" title="${TRICKS[k].name}">${TRICKS[k].icon}︎</span>`).join('')+(G.curse?`<span class="gl cursed" title="${CURSES[G.curse].name}">${CURSES[G.curse].icon}︎</span>`:'');
  $('print').textContent=`${TOWNS[L-1]} Saloon`;
  const ch=$('challenge');
  ch.className='challenge'+(G.challengeDone?' done':''); ch.hidden=true; ch.innerHTML=G.challenge?`<b>Challenge</b><span>${G.challenge.text} · +${G.challenge.gold}g</span>`:'';

  const duoV=isDuoV(), narrow=!duoV&&((innerWidth<640&&innerHeight>innerWidth)||document.documentElement.classList.contains('duo')), N=nP();
  const tb=$('table'); tb.classList.toggle('narrow',narrow); tb.classList.toggle('crowded',N>=6);
  tb.classList.toggle('showdown',G.street==='done'&&G.winCards.size>0);
  const sg=$('sGame'), live2=G.street!=='done'&&G.street!=='idle';
  sg.classList.toggle('danger',!me.out&&me.chips>0&&me.chips+me.bet<G.bb*8&&!G.outcome);
  const tense=live2&&bp&&bp.allIn&&!bp.folded&&me.inHand&&!me.folded;
  sg.classList.toggle('tension',!!tense); heartbeat(!!tense);
  const mood=bp?(bp.chips>G.bossStart*1.3?'smug':bp.chips<G.bossStart*0.35?'sweat':''):'';
  $('bossbar').dataset.mood=mood;
  const W=tb.clientWidth, H=tb.clientHeight, pos=positions(N,narrow);
  const blindfold=G.curse==='blind'&&G.board.length<3&&G.street!=='showdown'&&G.street!=='done';
  const snakeOn=bp&&twistOn('snake')&&bp.inHand&&!bp.folded;
  const madeName=G.board.length>=3&&!me.folded&&me.inHand&&!blindfold?nameOf(evalHand(me.hand.concat(G.board))):'';
  // seats are kept between renders and only the parts that changed are rebuilt, so portraits, glows,
  // deals and number rolls never restart mid-animation
  const seatsEl=$('seats'), SM=seatsEl._m||(seatsEl._m=new Map()), live=new Set(), quiet=h=>h.replace(/ (deal|flip)(?=[ "])/g,'').replace(/ style="(--fx|animation-delay)[^"]*"/g,'');
  let bets='', duoBet='';
  G.players.forEach((p,i)=>{
    if(p.out) return;
    live.add(i);
    const me0=duoV&&i===0, [x,y]=pos[i], fx=me0?0:(50-x)/100*W, fy=me0?-H*.75:(48-y)/100*H;
    const cards=(p.hand||[]).map((c,k)=>{
      const anim={fx,fy,delay:(c.order||0)*70};
      if(p.isHuman) return cardHTML(c,!blindfold,(snakeOn&&k===0&&!blindfold)?'watched':'','h'+i,anim);
      if(p.show||G.reveal||p.peekAll) return cardHTML(c,true,(G.reveal||p.peekAll)&&!p.show?'peek':'','h'+i,anim);
      if(p.peek===k) return cardHTML(c,true,'peek','h'+i,anim);
      return cardHTML(c,false,has('marked')?'marked':'','h'+i,anim);
    }).join('');
    const cls=['seat',y<35?'top':'',p.isHuman?'human':'',p.bossDef?'boss':'',p.nem?'nem':'',p.bossDef&&mood?'mood-'+mood:'',G.turn===i&&G.street!=='done'?'turn':'',p.folded?'folded':'',p.winner?'winner':''].filter(Boolean).join(' ');
    const pill=p.result||(/blind|ante/i.test(p.action||'')?'':p.action)||'';
    const pcls=p.result?'win':(p.folded?'fold':(p.allIn&&/All in/.test(pill)?'allin':''));
    const tilted=p.tilt>0&&!p.isHuman&&!p.bossDef;
    const tier=tilted?'On tilt':p.nem?NEM_RANKS[Math.min(5,p.nemRank||1)]:'';
    const rest=`<div class="who"><div class="nm" title="${p.name}">${p.bossDef?bossName(p.bossDef):((narrow||N>=6)&&!p.isHuman?p.name.split(' ')[0]:p.name)}</div>
          <div class="line">${roll('s'+i,p.chips,'chips')}${tier?`<span class="tier${tilted?' tilt':''}${p.nem&&!tilted?' nemtag':''}">${tier}</span>`:''}</div>
          ${p.isHuman&&madeName?`<div class="handname">${madeName}</div>`:''}</div>
        ${G.dealer===i&&G.street!=='idle'?'<div class="dealer" title="Dealer">D</div>':''}
        ${p.bossDef?`<div class="bossmeter"><i style="width:${Math.max(0,Math.min(100,p.chips/G.bossStart*100))}%"></i></div>`:''}
        ${pill?`<div class="pill ${pcls}"${pillLife(i,pill,!!p.result||pcls==='allin')}>${pill}</div>`:''}`;
    let m=SM.get(i); const home=me0?$('duoHand'):seatsEl;
    if(m&&(!m.el.isConnected||m.el.parentElement!==home)){m.el.remove(); SM.delete(i); m=null}
    if(!m){const el=document.createElement('div'); el.dataset.i=i; el.innerHTML='<div class="cards"></div><div class="plate"><span class="medal"></span><span class="pr"></span></div>'; home.appendChild(el);
      m={el,cardsEl:el.firstElementChild,medalEl:el.querySelector('.medal'),restEl:el.querySelector('.pr'),cards:null,medal:null,rest:null}; SM.set(i,m)}
    const cls2=me0?cls+' duo-me':cls; if(m.el.className!==cls2) m.el.className=cls2;
    if(me0){m.el.style.left=''; m.el.style.top=''} else {m.el.style.left=x+'%'; m.el.style.top=y+'%'}
    const cq=quiet(cards); if(m.cards!==cq){m.cards=cq; m.cardsEl.innerHTML=cards}
    const mk=p.isHuman?'rider':p.bossDef?'boss:'+p.bossDef.key:'out:'+p.name+':'+p.tier+':'+(p.nemRank||0); if(m.medal!==mk){m.medal=mk; m.medalEl.innerHTML=portraitFor(p)}
    const rq=rest.replace(/ style="animation-delay:[^"]*"/g,''); if(m.rest!==rq){m.rest=rq; m.restEl.innerHTML=rest}
    if(p.bet>0){
      let bx=x+(50-x)*0.5, by=y+(48-y)*0.5;
      if(y<35){bx=x+(x<=50?16:-16); by=y+15}
      else if(isDuoV()&&Math.abs(x-50)>25){bx=x+(50-x)*0.3; by=y-3}  // Duo: side seats keep their chips clear of the board
      if(p.isHuman){bx=50; by=y-(narrow?25:24)}
      const landed=BETV[i]!==p.bet; BETV[i]=p.bet;
      if(me0){duoBet=`<div class="bet duo-bet${landed&&!REDUCED?' land':''}" data-i="0">${chipStack(p.bet)}${money(p.bet)}</div>`} else bets+=`<div class="bet${landed&&!REDUCED?' land':''}" data-i="${i}" style="left:${bx}%;top:${by}%">${chipStack(p.bet)}${money(p.bet)}</div>`;
    }
  });
  SM.forEach((m,i)=>{if(!live.has(i)){m.el.remove(); SM.delete(i)}});
  document.querySelectorAll('#seats .bet,#duoHand .bet').forEach(b=>b.remove());
  if(bets) seatsEl.insertAdjacentHTML('beforeend',bets);
  if(duoBet) $('duoHand').insertAdjacentHTML('beforeend',duoBet);  seatsEl.querySelectorAll('.seat:not(.duo-me)').forEach(s=>{const w=s.offsetWidth, x=parseFloat(s.style.left)/100*W, m=w/2+4; if(W>2*m){const cx=Math.max(m,Math.min(W-m,x)); if(Math.abs(cx-x)>.5) s.style.left=cx+'px'}});
  const tellerOn=has('teller')&&['preflop','flop','turn'].includes(G.street)&&G.deck.length;
  const bparts=[];
  for(let k=0;k<5;k++){
    let b='';
    if(G.board[k]) b+=cardHTML(G.board[k],true,'','b',{fx:0,fy:-50,delay:k<3?k*90:0});
    else if(G.street!=='done'&&G.street!=='showdown'&&k>=G.board.length&&k<G.board.length+Math.max(tellerOn?1:0,G.mirror||0)&&G.deck.length>k-G.board.length) b+=cardHTML(G.deck[G.deck.length-1-(k-G.board.length)],true,'ghost');
    else b+='<div class="slot"></div>';
    bparts.push(b);
  }
  const boardEl=$('board'), bq=bparts.map(quiet);
  if(boardEl.children.length!==5||!boardEl._q){boardEl.innerHTML=bparts.join(''); boardEl._q=bq}
  else bq.forEach((q,k)=>{if(boardEl._q[k]!==q){boardEl._q[k]=q; boardEl.children[k].outerHTML=bparts[k]}});
  const pot=G.street==='done'?(G.lastPot||0):potTotal();
  const potH=(pot>0?chipStack(pot):'')+`<div class="pot">Pot ${roll('pot',pot,'b')}</div>`, potEl2=$('potrow'); if(potEl2._h!==potH||!potEl2.firstChild){potEl2._h=potH; potEl2.innerHTML=potH}
  const sp=G.street!=='done'&&G.street!=='idle'&&G.players.some(p=>p.allIn&&p.inHand)?pots():[];
  $('sidepots').innerHTML=sp.length>1?sp.map((x,k)=>`${k?'Side':'Main'} <b>${money(x.amt)}</b>`).join(' · '):'';
  renderControls();
  runRolls();
  renderCoach();
  if(SOUNDQ.length){const q=SOUNDQ.slice(0,18); SOUNDQ=[]; q.forEach(d=>sfx('card',d))}
}
$('seats').addEventListener('click',e=>{
  const c=e.target.closest('.seat.human .card:not(.back)'); if(!c||c.classList.contains('deal')) return;
  c.classList.remove('wobble'); void c.offsetWidth; c.classList.add('wobble'); sfx('card'); setTimeout(()=>c.classList.remove('wobble'),520);
});

/* ================= controls ================= */
let raiseVal=0, RAISE_OPEN=false;
function closeRaise(){RAISE_OPEN=false; const rs=$('raiseSheet'); rs.classList.remove('open'); rs.hidden=true}
let WASMY=false;
function renderControls(){
  const me=human(), st=$('status'), ac2=$('actions'), od=$('odds'), wasMy=WASMY; WASMY=false;
  od.hidden=true;
  if(G.turn!==0||G.street==='done'||G.street==='idle') closeRaise();
  const one=(cls,label,id)=>`<div class="actrow" style="--cols:1"><button class="btn ${cls}" id="${id}">${label}</button></div>`;
  if(G.street==='idle'){st.textContent='Pulling up a chair…'; ac2.innerHTML=`<div class="actrow ghosted" style="--cols:3"><button class="btn fold" disabled>Fold</button><button class="btn raise" disabled>Raise</button><button class="btn call" disabled>Call</button></div>`; return}
  if(G.street==='showdown'){st.innerHTML='<span class="dots">Showdown</span>'; ac2.innerHTML=`<div class="actrow ghosted" style="--cols:3"><button class="btn fold" disabled>Fold</button><button class="btn raise" disabled>Raise</button><button class="btn call" disabled>Call</button></div>`; return}
  if(G.street==='done'){
    if(G.outcome==='win'){st.innerHTML=`<b>${boss().name} is taken down.</b>`; ac2.innerHTML=one('gold','Collect the bounty','nextBtn'); $('nextBtn').onclick=()=>{$('poster').hidden=true; $('table').classList.remove('bust'); tableWon()}; return}
    if(G.outcome==='lose'){st.innerHTML='<b>Dead man.</b> The run ends here.'; ac2.innerHTML=one('dark','Main menu','nextBtn'); $('nextBtn').onclick=leaveLost; return}
    const auto=me.folded&&!me.winner;
    st.innerHTML=me.winner?`<b>You ${me.result.toLowerCase().replace(/^wins\b/,'win').replace(/^splits\b/,'split')}</b>`:(auto?'<span class="dots">Next hand deals in a moment</span>':(me.handName?`You had ${me.handName}`:'Hand over'));
    ac2.innerHTML=one('gold','Deal next hand','nextBtn'); $('nextBtn').onclick=newHand;
    if(auto&&G.autoFor!==G.tableHands){const h=G.tableHands; G.autoFor=h; later(()=>{if(G.street==='done'&&!G.outcome&&G.tableHands===h) newHand()},2100)}
    return;
  }
  const blindfold=G.curse==='blind'&&G.board.length<3;
  if(G.turn!==0){
    const p=G.players[G.turn];
    st.innerHTML=`<span class="dots">${p?`${me.folded?'You folded · ':''}${shortName(p)} is thinking`:'Dealing'}</span>`;
    ac2.innerHTML=`<div class="actrow ghosted" style="--cols:3"><button class="btn fold" disabled>Fold</button><button class="btn raise" disabled>Raise</button><button class="btn call" disabled>Call</button></div>`;
    return;
  }
  const toCall=G.currentBet-me.bet, pot=potTotal();
  st.innerHTML=toCall?`<b>${money(toCall)}</b> to call · pot ${money(pot)}`:`Your move · pot ${money(pot)}`;
  if((has('almanac')||has('meter'))&&!blindfold){
    const opps=live().length-1, eq=equity(me.hand,G.board,opps,500), po=toCall?toCall/(pot+toCall):0;
    let h='';
    if(has('meter')){const ratio=eq*(opps+1), lab=ratio<0.7?'Weak':ratio<1.1?'Fair':ratio<1.7?'Strong':'Monster'; h+=`<span class="gut"><span class="bar"><i style="width:${Math.min(100,ratio/2.4*100)}%"></i></span><b>${lab}</b></span>`}
    if(has('almanac')) h+=`<span>Win <b>${Math.round(eq*100)}%</b>${toCall?` · needs <b>${Math.round(po*100)}%</b>`:''}</span>`;
    od.innerHTML=h; od.hidden=false;
  }
  tip('turn');
  const maxTo=me.bet+me.chips, minTo=Math.min(maxTo,G.currentBet+G.minRaise), canRaise=me.chips>toCall, label=G.currentBet===0?'Bet':'Raise';
  const callTxt=toCall===0?'Check':(toCall>=me.chips?'All in':`Call ${money(toCall)}`);
  const canSwap=has('mech')&&G.street==='preflop'&&G.mechSwaps>0&&!blindfold;
  const canAce=has('ace')&&!G.aceUsed&&G.street==='preflop'&&!blindfold&&G.deck.some(c=>c.r===14)&&!me.hand.every(c=>c.r===14);
  const canFlask=has('flask')&&!G.flaskUsed&&!blindfold, canDyn=has('dynamite')&&!G.dynUsed&&G.street==='flop'&&G.board.length===3&&G.currentBet===0;
  const trickBtns=[...new Set(R.tricks)].filter(k=>!(k==='swap'&&blindfold)).map(k=>{const n=R.tricks.filter(x=>x===k).length; return `<button class="chipbtn trickbtn" data-tk="${k}" title="${TRICKS[k].desc}"><span class="ti">${TRICKS[k].icon}\uFE0E</span>${TRICKS[k].name}${n>1?` ×${n}`:''}</button>`}).join('')
    +(canFlask?`<button class="chipbtn trickbtn" id="flaskBtn" title="${CHARMS.flask.desc}"><span class="ti">${CHARMS.flask.icon}\uFE0E</span>Flask</button>`:'')
    +(canDyn?`<button class="chipbtn trickbtn" id="dynBtn" title="${CHARMS.dynamite.desc}"><span class="ti">${CHARMS.dynamite.icon}\uFE0E</span>Dynamite</button>`:'');
  ac2.innerHTML=`${canSwap||canAce||trickBtns?`<div class="swaprow">${canSwap?'<button class="chipbtn" data-swap="0">Swap left</button><button class="chipbtn" data-swap="1">Swap right</button>':''}${canAce?'<button class="chipbtn" id="aceBtn">Ace in the Sleeve</button>':''}${trickBtns}</div>`:''}
    <div class="actrow" style="--cols:${canRaise?3:2}"><button class="btn fold" id="bFold">Fold</button>${canRaise?`<button class="btn raise" id="bRaise">${label}…</button>`:''}<button class="btn call" id="bCall">${callTxt}</button></div>`;
  WASMY=true; if(!wasMy){const r=ac2.querySelector('.actrow'); if(r) r.classList.add('rise')}
  ac2.querySelectorAll('[data-swap]').forEach(b=>b.onclick=()=>{
    const k=+b.dataset.swap, old=me.hand[k], c=draw(); c.order=0; me.hand[k]=c; G.mechSwaps--; sfx('card');
    log(`You swap out the ${SG[old.r]} of ${SUITN[old.s]}.`); render();
  });
  if(canAce) $('aceBtn').onclick=()=>{
    const k=me.hand[0].r<=me.hand[1].r?0:1, idx=G.deck.findIndex(c=>c.r===14);
    const a=G.deck.splice(idx,1)[0]; a.order=0; G.deck.unshift(me.hand[k]); me.hand[k]=a; G.aceUsed=true;
    log('You slip an ace out of your sleeve.'); sfx('card'); render();
  };
  ac2.querySelectorAll('[data-tk]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.tk; closeRaise(); if(!useTrick(k)) return; ac();
    sfx(k==='smoke'?'whoosh':k==='whiskey'?'chip':'card'); stampAt(50,62,TRICKS[k].name,'#f4cb5c',24); saveRun('table');
    if(k==='smoke'){render(); later(step,500)} else render();
  });
  if($('flaskBtn')) $('flaskBtn').onclick=()=>{if(useFlask()){sfx('whoosh'); stampAt(50,62,'Whiskey Flask','#f4cb5c',24); render()}};
  if($('dynBtn')) $('dynBtn').onclick=()=>{if(useDynamite()){sfx('boss'); shake(true); flash(); stampAt(50,46,'Boom!','#d8341f',40); render()}};
  $('bFold').onclick=()=>{closeRaise(); doAct(0,'fold')};
  $('bCall').onclick=()=>{closeRaise(); doAct(0,toCall===0?'check':'call')};
  if(!canRaise) return;
  $('bRaise').onclick=()=>{RAISE_OPEN=!RAISE_OPEN; if(RAISE_OPEN) raiseVal=minTo; renderRaise(minTo,maxTo,toCall,pot,label); renderCoach(); if(TUT&&RAISE_OPEN) tutRaise()};
  if(RAISE_OPEN) renderRaise(minTo,maxTo,toCall,pot,label);
}
function renderRaise(minTo,maxTo,toCall,pot,label){
  const rs=$('raiseSheet');
  if(!RAISE_OPEN){closeRaise(); return}
  if(!(raiseVal>=minTo&&raiseVal<=maxTo)) raiseVal=minTo;
  const q=[['Min',minTo],['½ Pot',G.currentBet+Math.round((pot+toCall)*0.5)],['Pot',G.currentBet+pot+toCall],['All in',maxTo]];
  rs.innerHTML=`<div class="rs-head"><span>${label==='Bet'?'Bet':'Raise to'}</span><b id="rsAmt">${money(raiseVal)}</b></div>
    <div class="rs-quick">${q.map(([t,v])=>`<button class="chipbtn" data-qv="${Math.max(minTo,Math.min(maxTo,v))}">${t}</button>`).join('')}</div>
    <input type="range" id="rSlider" min="${minTo}" max="${maxTo}" step="10" value="${raiseVal}" aria-label="Raise amount">
    <div class="rs-actions"><button class="btn dark" id="rsCancel">Cancel</button><button class="btn raise" id="rsGo">${label} ${money(raiseVal)}</button></div>`;
  rs.hidden=false; requestAnimationFrame(()=>rs.classList.add('open'));
  const sl=$('rSlider'), go=$('rsGo'), amt=$('rsAmt');
  const setV=v=>{v=Math.max(minTo,Math.min(maxTo,v)); if(v!==maxTo) v=Math.max(minTo,Math.round(v/10)*10); raiseVal=v; sl.value=v;
    amt.textContent=money(v); go.textContent=v===maxTo?`All in ${money(v)}`:`${label} ${money(v)}`;
    rs.querySelectorAll('[data-qv]').forEach(b=>b.classList.toggle('on',+b.dataset.qv===v))};
  setV(raiseVal);
  sl.oninput=()=>setV(+sl.value);
  rs.querySelectorAll('[data-qv]').forEach(b=>b.onclick=()=>{setV(+b.dataset.qv); sfx('chip')});
  $('rsCancel').onclick=()=>{closeRaise(); renderCoach(); if(TUT&&TUT.back) tutStep(TUT.back)};
  go.onclick=()=>{const v=raiseVal; closeRaise(); doAct(0,'raise',v)};
}

/* ================= pause menu ================= */
function openMenu(){
  const bd=BOSSES[R.level-1];
  PAUSED=true;
  $('menuTitle').textContent=TOWNS[R.level-1]; $('menu').dataset.title=TOWNS[R.level-1];
  $('menuBoss').innerHTML=`<span class="medal">${bossPortrait(bd)}</span><div>${bossName(bd,'b')}<em>${bd.twist}</em>${G.challenge?`<em class="mchal">Challenge: ${G.challenge.text} · +${G.challenge.gold}g${G.challengeDone?' ✓':''}</em>`:''}<em class="mchal">Blinds ${num(G.bb/2)}/${num(G.bb)}, rising every ${G.riseEvery} hands</em></div>`;
  $('menuCharms').innerHTML=charmPills(true)||'<span class="hint">No charms yet.</span>';
  $('ledger').innerHTML=G.log.slice(0,11).map(t=>`<div>${t}</div>`).join('');
  $('lastHand').innerHTML=(G.lastHandLog.length?G.lastHandLog:['No hands finished yet.']).slice(-14).map(t=>`<div>${t}</div>`).join('');
  $('ranks').innerHTML=HAND_RANKS.map(([a,b])=>`<b>${a}</b><span>${b}</span>`).join('');
  renderToggles(); setTab('table');
  $('menu').hidden=false; $('resumeBtn').focus();
}
function setTab(name){
  document.querySelectorAll('#menu .tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===name));
  document.querySelectorAll('#menu .pane').forEach(p=>p.hidden=p.dataset.pane!==name);
}
document.querySelectorAll('#menu .tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function closeMenu(){$('menu').hidden=true; PAUSED=false}
$('menuBtn').onclick=openMenu;
$('ranksBtn').onclick=openRanks;
function openRanks(){
  const me=human(), cat=G.board&&G.board.length>=3&&me&&me.inHand&&!me.folded?CAT_SHORT[handCat(evalHand(me.hand.concat(G.board)))]:'';
  $('ranksList').innerHTML=HAND_RANKS.map(([a,b],i)=>`<div class="rk${cat&&CAT_SHORT[9-i]===cat?' mine':''}"><i>${i+1}</i><b>${a}</b><span>${b}</span></div>`).join('');
  PAUSED=true; $('ranksModal').hidden=false; sfx('card');
}
$('ranksClose').onclick=()=>{$('ranksModal').hidden=true; PAUSED=false};
$('resumeBtn').onclick=closeMenu;
$('quitBtn').onclick=()=>{closeMenu(); renderTitle()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('menu').hidden) closeMenu()});
$('againBtn').onclick=()=>{ac(); startRun()};
$('homeBtn').onclick=renderTitle;
let rz; addEventListener('resize',()=>{clearTimeout(rz); rz=setTimeout(()=>{if(!$('sGame').hidden) render()},120)});
renderTitle();

/* ================= tutorial: one guided hand at a practice table =================
   Two easy drifters, no boss, a scripted deal (you hold pocket Kings and flop a set).
   Plays automatically before the very first run, and any time from the Tutorial link. */
let TUT=null;
const TUT_SCRIPT={
  preflop:[
    {t:'.seat.human .cards',txt:'These are your two cards. Only you can see them. A pair of Kings is a great start.'},
    {t:'#potrow',txt:'Every bet goes into the pot. Win the hand and the pot is yours.'},
    {t:'#bCall',wait:true,txt:'Tap <b>Call</b> to match the bet and see more cards.'}
  ],
  flop:[
    {t:'#board',txt:'The flop: three shared cards everyone can use. Your hand is the best five cards from your two plus these.'},
    {t:'.seat.human .handname',txt:'You made <b>Three of a Kind</b>. That is a very strong hand.'},
    {t:'#bRaise',wait:'raise',txt:'Tap <b>Bet</b> to put chips in and grow the pot.'}
  ],
  turn:[
    {t:'#board .card:nth-child(4)',txt:'The turn: a fourth shared card.'},
    {t:['#bCall','#bRaise'],wait:true,txt:'Your move. <b>Check</b> to stay in for free, or <b>Bet</b> again.'}
  ],
  river:[
    {t:'#board .card:nth-child(5)',txt:'The river: the last card. After this, everyone still in shows their hand.'},
    {t:['#bCall','#bRaise'],wait:true,txt:'Last move. Check or bet.'}
  ]
};
const RAISE_STEP={t:'#raiseSheet',wait:true,txt:'Pick an amount, then tap the red button.'};
function startTutorial(thenRun){
  TOKEN++; hideReveal(); closeRaise();
  TUT={thenRun,seen:{},q:[],i:0,back:null};
  R={level:1,gold:0,charms:[],lv:{},deeds:[],tricks:[],curse:null,phase:'table',heat:0,temp:null,tutorial:true};
  const st=Object.keys(STYLES)[0];
  G.players=[{name:'You',isHuman:true,chips:1000,tilt:0},{name:'Slim',tier:'d',style:st,chips:600,tilt:0},{name:'Ada',fem:true,tier:'d',style:st,chips:600,tilt:0}];
  G.players.forEach(p=>{p.out=false; p.hand=[]; p.bet=0; p.total=0});
  Object.assign(G,{curse:null,lineup:['d','d'],bb:20,riseEvery:999,start:1000,tempWind:false,bossStart:1,dealer:1,tableHands:0,flaskUsed:false,dynUsed:false,windUsed:0,
    vesperUsed:false,horseUsed:false,aceUsed:false,streak:0,koGold:0,outcome:null,log:[],handLog:[],lastHandLog:[],board:[],street:'idle',seen:new Map(),
    winCards:new Set(),lastWinners:[],challenge:null,challengeDone:false,bounty:0});
  // pop order: you, Slim, Ada, you, Slim, Ada, flop x3, turn, river   (suits: 0♠ 1♥ 2♦ 3♣)
  G.rigDeck=[[13,0],[12,3],[7,2],[13,1],[9,2],[3,3],[13,2],[8,3],[2,1],[9,0],[4,2]];
  show('sGame'); renderToggles(); quote(''); render();
  tutShow(null,'<b>Practice table.</b> No boss here, just two easy drifters. Let\'s play one hand together.',false,'Deal me in',()=>{tutHide(); newHand()});
}
function tutTurn(){
  if(!TUT||G.turn!==0||G.street==='done') return;
  const s=G.street;
  if(!TUT.seen[s]){TUT.seen[s]=true; TUT.q=(TUT_SCRIPT[s]||[]).slice(); TUT.i=0}
  if(TUT.i<TUT.q.length) tutStep(TUT.q[TUT.i]);
}
function tutStep(st){
  if(!TUT) return;
  if(!st.wait){tutShow(st.t,st.txt,false,'Next',()=>{TUT.i++; tutHide(); tutTurn()}); return}
  TUT.back=st.wait==='raise'?st:TUT.back;
  tutShow(st.t,st.txt,true);
}
function tutRaise(){if(!TUT) return; requestAnimationFrame(()=>requestAnimationFrame(()=>tutShow(RAISE_STEP.t,RAISE_STEP.txt,true)))}
function tutRect(t){
  const els=(Array.isArray(t)?t:[t]).map(s=>document.querySelector(s)).filter(Boolean);
  if(!els.length) return null;
  let l=1e9,tp=1e9,r=-1e9,b=-1e9; els.forEach(e=>{const q=e.getBoundingClientRect(); l=Math.min(l,q.left); tp=Math.min(tp,q.top); r=Math.max(r,q.right); b=Math.max(b,q.bottom)});
  const pad=8; return {l:l-pad,t:tp-pad,r:r+pad,b:b+pad};
}
function tutShow(target,html,wait,btn,onNext){
  const ov=$('tut'), ring=$('tutRing'), block=$('tutBlock'), bub=$('tutBubble');
  ov.hidden=false; ov.classList.toggle('waiting',!!wait);
  $('tutText').innerHTML=html;
  const nb=$('tutNext'); nb.hidden=!!wait; nb.textContent=btn||'Next'; nb.onclick=()=>{sfx('card'); onNext&&onNext()};
  const sk=$('tutSkip'); sk.textContent=TUT&&TUT.done?'Main menu':'Skip tutorial'; sk.hidden=!sk.textContent; sk.onclick=tutSkip;
  const place=()=>{
    const r=target?tutRect(target):null, W=innerWidth, H=innerHeight;
    if(!r){ring.hidden=true; block.style.clipPath='none'; block.classList.add('dim');
      bub.style.left=Math.max(12,(W-bub.offsetWidth)/2)+'px'; bub.style.top=Math.max(20,(H-bub.offsetHeight)/2)+'px'; return}
    block.classList.remove('dim'); ring.hidden=false;
    Object.assign(ring.style,{left:r.l+'px',top:r.t+'px',width:(r.r-r.l)+'px',height:(r.b-r.t)+'px'});
    block.style.clipPath=wait?`path(evenodd,'M0 0H${W}V${H}H0Z M${r.l} ${r.t}H${r.r}V${r.b}H${r.l}Z')`:'none';
    const bw=bub.offsetWidth, bh=bub.offsetHeight;
    // put the note on the side with more room, so it never sits on top of what it's explaining or your own seat
    const above=(r.t+r.b)/2>H*0.5;
    let top=above?r.t-14-bh:r.b+14;
    if(above&&top<12) top=r.b+14; if(!above&&top+bh>H-12) top=r.t-14-bh;
    top=Math.max(12,Math.min(H-bh-12,top));
    bub.style.left=Math.max(12,Math.min(W-bw-12,(r.l+r.r)/2-bw/2))+'px'; bub.style.top=top+'px';
  };
  place(); TUT&&(TUT.place=place);
}
addEventListener('resize',()=>{if(TUT&&TUT.place&&!$('tut').hidden) TUT.place()});
function tutHide(){const ov=$('tut'); if(ov) ov.hidden=true}
function tutEnd(goRun){
  const thenRun=TUT&&TUT.thenRun; TUT=null; tutHide(); TOKEN++; R=null;
  meta.tutDone=true; saveMeta();
  if(goRun&&thenRun!==null) startRun(); else renderTitle();
}
function tutSkip(){const thenRun=TUT&&TUT.thenRun; if(TUT&&TUT.done){tutEnd(false); return} tutEnd(!!thenRun)}
function tutFinale(){
  if(!TUT) return; TUT.done=true;
  const won=human().winner;
  const msg=(won?'<b>You won the pot!</b> The best five cards always win.':'<b>That\'s a hand.</b> The best five cards always win.')+
    '<br><br>In a real run, every saloon has a <b>boss</b>. Take all of their chips to ride on. Between saloons, spend gold on charms that help every hand.';
  tutShow(null,msg,false,TUT.thenRun?'Start the run':'Play for real',()=>tutEnd(true));
}

/* ================= opening sequence =================
   Synced to the menu song's first three hits (measured from the track): ~0.03s, 0.42s, 0.84s.
   Browsers refuse to play sound until the viewer touches the page, so when that rule applies
   a single tap starts everything; where sound is already allowed the intro runs on its own. */
(function intro(){
  const ov=$('intro'); if(!ov) return;
  $('sTitle').classList.add('under-intro');
  let started=false, done=false, timers=[];
  const at=(ms,fn)=>timers.push(setTimeout(fn,Math.max(0,ms)));
  const finish=()=>{if(done) return; done=true; timers.forEach(clearTimeout); $('sTitle').classList.remove('under-intro'); ov.hidden=true};
  function sparks(n){for(let k=0;k<n;k++){const s=document.createElement('span'); s.className='in-spark'; ov.appendChild(s);
    const a=Math.random()*6.283, d=120+Math.random()*Math.min(innerWidth,innerHeight)*.55;
    s.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d}px)) scale(.2)`,opacity:0}],{duration:700+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).onfinish=()=>s.remove()}}
  // hits measured from the song: 0.017s, 0.389s, 0.819s. Driven by the audio clock, not timers, so they stay locked to the sound.
  function fitLogo(){
    const logo=$('inLogo'); let fs=Math.min(140,innerWidth*0.16); logo.style.setProperty('font-size',fs+'px','important');
    for(let k=0;k<30&&logo.scrollWidth>innerWidth*0.88;k++){fs*=0.94; logo.style.setProperty('font-size',fs+'px','important')}
  }
  function play(audioT0,useAudio){
    const card=$('inCard'), logo=$('inLogo'), fl=$('inFlash'), c=SND.ctx;
    fitLogo();
    if(REDUCED){logo.style.opacity=1; setTimeout(land,800); return}
    const perf0=performance.now()+150;
    const clock=()=>useAudio&&c?(c.currentTime-audioT0):((performance.now()-perf0)/1000);
    const cues=[
      [0.0,()=>{card.classList.add('fire'); fl.classList.remove('small'); void fl.offsetWidth; fl.classList.add('small')}],
      [0.389,()=>{card.classList.remove('fire'); card.style.opacity=1; card.classList.add('hit'); $('inHole').classList.add('on'); ov.classList.remove('shake-s'); void ov.offsetWidth; ov.classList.add('shake-s'); fl.classList.remove('small'); void fl.offsetWidth; fl.classList.add('small'); sparks(8)}],
      [0.819,()=>{card.style.opacity=0; card.classList.remove('hit'); ['inHalfL','inHalfR'].forEach(id=>$(id).classList.add('blow'));
        fl.classList.remove('pop'); void fl.offsetWidth; fl.classList.add('pop'); ov.classList.add('shake'); sparks(34); logo.classList.add('slam')}],
      [2.9,land]
    ];
    let i=0;
    const tick=()=>{if(done) return; const t=clock(); while(i<cues.length&&t>=cues[i][0]-0.008){cues[i][1](); i++} if(i<cues.length) requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  }
  function land(){
    if(done) return;
    const logo=$('inLogo'), target=document.querySelector('#sTitle h1.brass');
    ov.classList.add('clear');
    if(!target||REDUCED){setTimeout(finish,500); return}
    const a=logo.getBoundingClientRect(), b=target.getBoundingClientRect();
    const s=b.height/a.height, dx=(b.left+b.width/2)-(a.left+a.width/2), dy=(b.top+b.height/2)-(a.top+a.height/2);
    logo.classList.remove('slam'); logo.style.opacity=1;
    logo.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}px,${dy}px) scale(${s})`}],{duration:950,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards'}).onfinish=finish;
  }
  async function begin(){
    if(started){finish(); return}   // a second tap skips the rest
    started=true; if(!SND.buf.menu&&meta.music){const s=document.querySelector('#inPrompt span'); if(s) s.textContent='Loading…'} else ov.classList.add('go');
    const c=ac(); if(c&&c.state!=='running'){try{await c.resume()}catch(e){}}
    let t0=0, useAudio=false;
    if(c&&c.state==='running'&&meta.music){
      const t1=performance.now(); while(!SND.buf.menu&&performance.now()-t1<15000) await new Promise(r=>setTimeout(r,60));
      ov.classList.add('go');
      if(SND.buf.menu){t0=introMusic(); useAudio=true} else SND.holdMenu=false;
    } else SND.holdMenu=false;
    ov.classList.add('go');
    play(t0,useAudio);
  }
  ov.addEventListener('pointerdown',begin);
  ov.addEventListener('keydown',begin);
  document.addEventListener('keydown',e=>{if(!ov.hidden&&!started) begin()},{once:true});
  // if this browser already lets the page play sound, don't make anyone tap
  setTimeout(()=>{const c=ac(); if(!c) return; c.resume().then(()=>{if(!started&&c.state==='running') begin()}).catch(()=>{})},60);
})();
