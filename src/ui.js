/* ================= basics ================= */
const $=id=>document.getElementById(id);
const REDUCED=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let TOKEN=0, PAUSED=false;
function later(fn,ms){const t=TOKEN; const run=()=>{if(t!==TOKEN) return; if(PAUSED){setTimeout(run,250); return} fn()}; setTimeout(run,ms)}
function speedMul(){return meta.speed==='fast'?0.45:1}
const SCREENS=['sTitle','sChapter','sShop','sEvent','sGame','sEnd'];
function show(id){
  setScene(id);
  if(id!=='sGame') heartbeat(false);
  SND.scene=id; musicLevel();
  document.documentElement.classList.toggle('locked',id!=='sTitle');
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
  let W=0,H=0,DPR=Math.min(2,window.devicePixelRatio||1), motes=[], mode='';
  function size(){W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
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
      ctx.clearRect(0,0,W,H);
      for(const m of motes){
        let col='255,226,170', a=m.a;
        if(mode==='dust'){m.y-=m.s*dt; m.p+=dt*.0006; m.x+=Math.sin(m.p)*.00006*dt; if(m.y<-.02){m.y=1.02;m.x=R0()}
          a*=(.25+(1-Math.min(1,Math.abs(m.x-.5)*2.2))*.85)*(.7+.3*Math.sin(m.p*3))}
        else if(mode==='embers'){m.y-=m.s*dt; m.p+=dt*.003; m.x+=Math.sin(m.p)*.00012*dt; m.life-=dt*.00012; col='255,'+(120+Math.round(80*Math.sin(m.p)))+',50'; a*=Math.max(0,m.life)*(.6+.4*Math.sin(m.p*2.3));
          if(m.y<-.02||m.life<=0) Object.assign(m,spawn.embers())}
        else if(mode==='drips'){if(m.wait>0){m.wait-=dt; continue} m.y+=m.s*dt; m.s+=.0000006*dt; col='200,225,255'; if(m.y>1.02) Object.assign(m,spawn.drips(),{y:-.02})}
        else if(mode==='sand'){m.x+=m.s*dt*(1.2+Math.sin(now*.0004)); m.p+=dt*.002; m.y+=Math.sin(m.p)*.00004*dt; col='230,170,110'; if(m.x>1.05){m.x=-.05; m.y=R0()}}
        else if(mode==='rain'){m.y+=m.s*dt; m.x-=m.s*dt*.18; if(m.y>1.05){m.y=-.05-R0()*.2; m.x=R0()*1.2}
          ctx.strokeStyle=`rgba(190,210,235,${m.a})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(m.x*W,m.y*H); ctx.lineTo(m.x*W+m.r*.18,m.y*H-m.r); ctx.stroke(); continue}
        else if(mode==='sparkle'){m.p+=m.sp*dt; a*=Math.max(0,Math.sin(m.p))**6; col='255,250,230'; if(m.p>6.28*3){Object.assign(m,spawn.sparkle())}
          if(a>.02){ctx.fillStyle=`rgba(${col},${a.toFixed(3)})`; const s=m.r*2.4; ctx.fillRect(m.x*W-s,m.y*H-.5,s*2,1); ctx.fillRect(m.x*W-.5,m.y*H-s,1,s*2)}}
        else if(mode==='fireflies'){m.p+=dt*.0012; m.x+=m.vx*dt+Math.sin(m.p*.7)*.00003*dt; m.y+=m.vy*dt+Math.cos(m.p*.5)*.00003*dt; if(m.x<0||m.x>1) m.vx*=-1; if(m.y<.2||m.y>1) m.vy*=-1;
          a*=Math.max(0,Math.sin(m.p))**3; col='210,255,120'; if(a>.02){const g=ctx.createRadialGradient(m.x*W,m.y*H,0,m.x*W,m.y*H,m.r*6); g.addColorStop(0,`rgba(${col},${(a*.5).toFixed(3)})`); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(m.x*W-m.r*6,m.y*H-m.r*6,m.r*12,m.r*12)}}
        else if(mode==='ash'){m.y+=m.s*dt; m.p+=dt*.001; m.x+=Math.sin(m.p)*.00008*dt; col='180,175,170'; if(m.y>1.02){m.y=-.02; m.x=R0()}}
        if(a<=.005) continue;
        ctx.beginPath(); ctx.arc(m.x*W,m.y*H,m.r,0,6.283); ctx.fillStyle=`rgba(${col},${Math.min(1,a).toFixed(3)})`; ctx.fill();
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
  AIR.mode=SALOON_AIR[sl]||'dust';
  if(typeof setSaloon==='function') setSaloon(sl||5);
  lightning(sl===8);
}

/* ================= rendering helpers ================= */
let SOUNDQ=[];
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
  return `<div class="card${red?' red':''}${hot}${cls} ${extra}"${style} role="img" aria-label="${SG[c.r]} of ${SUITN[c.s]}">`+
    `<div class="ix">${ix}</div>`+(face?`<div class="face"><i>${su}</i><span>${rk}</span></div>`:`<div class="pip">${su}</div>`)+`<div class="ix br">${ix}</div></div>`;
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
const BOSS_LOOK={pete:{hat:'cowboy',fh:'beard',redNose:true,smoke:false,scar:false},ma:{fem:true,hat:'none',bun:true,hair:'#cfc6b4',glasses:true,shawl:'#4a2a3a',smoke:false,scar:false},
  iron:{hat:'cowboy',fh:'horseshoe',jaw:1.6,scar:true,smoke:true},under:{hat:'top',fh:'none',gaunt:true,skin:['#d8cfc4','#8a8278'],smoke:false,hair:'#1a1a1a',scar:false},
  snake:{hat:'flat',fh:'goatee',goldTooth:true,smoke:true,cigarette:true},banker:{hat:'bowler',fh:'mutton',monocle:true,smoke:true,jaw:1.2,scar:false},
  vesper:{fem:true,hat:'none',feather:true,beautyMark:true,lips:'#a0202a',hair:'#120c08',scar:false,smoke:false},bicah:{hat:'cowboy',hatc:'#d6c8a8',fh:'stache',longHair:true,hair:'#c9a35a',skin:['#ebc7a4','#a87a58'],coat:'#2a2622',smirk:true,scar:false,smoke:false,hatband:'#3a2a1a'}};
const HUMAN_LOOK={human:true,hat:'cowboy',mask:true,scar:false,patch:false,smoke:false,coat:'#56432e',fh:'stubble'};
function bossName(bd,tag='span'){return `<${tag} class="bname" style="font-family:${bd.font},var(--f-display);font-size:${bd.fs||1}em">${bd.name}</${tag}>`}
function bossPortrait(bd){return portrait(bd.key,Object.assign({boss:true},BOSS_LOOK[bd.key]||{}))}
function portraitFor(p){
  if(p.isHuman) return portrait('You the rider',HUMAN_LOOK);
  if(p.bossDef) return bossPortrait(p.bossDef);
  return portrait(p.name,{fem:p.fem,scar:p.tier==='v'?true:undefined});
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
function renderToggles(){
  document.querySelectorAll('.audio-toggles').forEach(el=>{
    el.innerHTML=`<button class="btn small" data-audio="sound" aria-pressed="${meta.sound}">Sound ${meta.sound?'on':'off'}</button><button class="btn small" data-audio="music" aria-pressed="${meta.music}">Music ${meta.music?'on':'off'}</button><button class="btn small" data-audio="speed" aria-pressed="${meta.speed==='fast'}">Speed: ${meta.speed==='fast'?'Fast':'Normal'}</button>`;
  });
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-audio]'); if(!b) return;
  const k=b.dataset.audio;
  if(k==='speed') meta.speed=meta.speed==='fast'?'normal':'fast';
  else {meta[k]=!meta[k]; ac(); if(k==='music'){meta.music?startMusic():stopMusic()} if(k==='sound'&&meta.sound) sfx('chip')}
  saveMeta(); renderToggles();
});
const TIPS={
  start:'<b>Goal:</b> take all of the boss\'s chips.',
  turn:'<b>Your turn.</b> Fold, call, or raise.'
};
let COACH=null;
function tip(k){if(!meta.tips[k]&&!COACH) COACH=k}
function renderCoach(){
  const el=$('coach');
  if(!COACH||meta.tips[COACH]||!$('raiseSheet').hidden){el.hidden=true; return}
  el.hidden=false;
  {const h=document.querySelector('#sGame .hud'); if(h){const b=h.getBoundingClientRect().bottom; if(b>0) el.style.top=(b+6)+'px'}}
  el.innerHTML=`<div style="flex:1">${TIPS[COACH]}</div><button class="btn small" id="coachOk">Got it</button>`;
  $('coachOk').onclick=()=>{meta.tips[COACH]=true; saveMeta(); COACH=null; renderCoach()};
}

/* ================= title ================= */
function renderTitle(){
  TOKEN++; PAUSED=false; R=null; $('poster').hidden=true; $('menu').hidden=true;
  drawFan($('fan')); renderToggles();
  const unlockedCount=Object.values(CHARMS).filter(c=>c.tier<=meta.unlock).length;
  $('metaPlaques').innerHTML=`
    <div class="plaque"><span>Best run</span><b>${meta.wins?'Won':meta.best?'Saloon '+meta.best:'—'}</b></div>
    <div class="plaque"><span>Runs</span><b>${meta.runs}</b></div>
    <div class="plaque"><span>Wins</span><b>${meta.wins}</b></div>
    <div class="plaque"><span>Charms</span><b>${unlockedCount} / ${Object.keys(CHARMS).length}</b></div>`;
  const saved=sget(RUN_KEY);
  $('titleActions').innerHTML=(saved?`<button class="btn gold big" id="contBtn">Continue · Saloon ${saved.level}</button>`:'')+
    `<button class="btn ${saved?'dark':'gold big'}" id="newBtn">${saved?'New run':'Start a run'}</button>`;
  if(saved) $('contBtn').onclick=()=>{ac(); continueRun(saved)};
  $('newBtn').onclick=()=>{ac(); startRun()};
  const mh=maxHeat();
  $('heatPick').hidden=mh<1;
  $('statLine').innerHTML=meta.runs?`Best <b>${meta.wins?'Won':meta.best?'Saloon '+meta.best:'—'}</b> · Runs <b>${meta.runs}</b> · Wins <b>${meta.wins}</b>`:'';
  $('heatPick').innerHTML=HEAT.map((h,i)=>`<button data-heat="${i}" aria-pressed="${(meta.heatPick||0)===i}" ${i>mh?'disabled':''}><b>${h.name}</b><span>${i>mh?`Win ${i} run${i>1?'s':''} to unlock`:h.desc}</span></button>`).join('');
  $('heatPick').querySelectorAll('[data-heat]').forEach(b=>b.onclick=()=>{meta.heatPick=+b.dataset.heat; saveMeta(); renderTitle()});
  const st=meta.stats;
  $('statsGrid').innerHTML=[['Hands played',num(st.hands)],['Hands won',num(st.won)],['Win rate',st.hands?Math.round(st.won/st.hands*100)+'%':'—'],
    ['Biggest pot',money(st.bigPot)],['Best hand',st.bestHand?nameOf(st.bestHand):'—'],['Bosses busted',num(st.bosses)],['Challenges',num(st.challenges)],['Runs won',num(meta.wins)]]
    .map(([a,b])=>`<div class="plaque"><span>${a}</span><b>${b}</b></div>`).join('');
  $('tipsBtn').onclick=()=>{meta.tips={}; saveMeta(); $('tipsBtn').textContent='Tips will show next run'};
  $('codex').innerHTML=Object.keys(CHARMS).map(k=>{
    const c=CHARMS[k];
    if(c.tier>meta.unlock) return `<div class="tarot locked"><div class="num">${NUMERALS[charmIndex(k)]}</div><div class="art"><span class="glyph">?</span></div><h3>Locked</h3><p>${TIER_NOTE[c.tier]}</p></div>`;
    return tarot(k,'','',false,`${c.price}g`);
  }).join('');
  document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>openMore(b.dataset.more));
  show('sTitle');
}
function openMore(tab){
  const names={howto:'How to play',records:'Records',charms:'Charms',settings:'Settings'};
  document.querySelectorAll('#more [data-mtab]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.mtab===tab); b.onclick=()=>openMore(b.dataset.mtab)});
  document.querySelectorAll('#more [data-mpane]').forEach(p=>p.hidden=p.dataset.mpane!==tab);
  $('moreTitle').textContent=names[tab]; renderToggles(); $('more').hidden=false;
  $('moreClose').onclick=()=>{$('more').hidden=true};
}

/* ================= run flow ================= */
function saveRun(phase){if(!R) return; R.phase=phase; if(phase!=='table') delete R.table; sset(RUN_KEY,R)}
function startRun(){
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
  SHOP.curseTaken=!!R.curse; SHOP.anim='slap';
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
  $('shopActions').innerHTML=pick?'':`${tab==='charms'?`<button class="btn small" id="rerollBtn" ${R.gold<rc||!unlockedPool().length?'disabled':''}>Reroll · ${rc}g</button>`:''}<button class="btn gold big" id="rideBtn">Ride to ${TOWNS[L-1]}</button>`;
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
      {label:'Buy a tonic · 25g',dis:g<25,fn:()=>{R.gold-=25; R.temp=Object.assign(R.temp||{},{wind:true}); sfx('chip'); evDone('You pocket the tonic. You\'ll survive busting once next saloon.')}},
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
  $('posterPortrait').innerHTML=bossPortrait(bd);
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
  $('posterBtn').onclick=()=>{ac(); $('poster').hidden=true; sfx('card'); R.table=serializeTable(); saveRun('table'); R.table=serializeTable(); sset(RUN_KEY,R); say(bd.lines.intro); later(newHand,350)};
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
    later(()=>collectThen(()=>{
      const st=advanceStreet();
      if(st==='showdown'){
        const ev=revealShowdown();
        render(); sfx('whoosh');
        ev.forEach(x=>{if(x.type==='redeal') say(x.line); if(x.type==='horseshoe'){stampAt(50,46,'Lucky!','#f4cb5c',36); flash()}});
        later(()=>handEnd(resolveShowdown()),1100*Math.max(.6,speedMul()));
      } else {
        G.dealUntil=performance.now()+(G.board.length===3?270:0)+450;
        step();
      }
    }),650);
    return;
  }
  const p=G.players[G.turn];
  if(!p.isHuman){
    const t=G.turn, base=((human().folded||human().allIn||!human().inHand?320:820)+(p.bossDef?520:0))*speedMul();
    later(()=>{if(G.turn!==t) return; const d=aiDecide(t); if(d.tell||d.line) say(d.line||'',d.tell||''); doAct(t,d.type,d.to)}, Math.max(base,G.dealUntil-performance.now()+120));
  }
}
function doAct(i,type,to){
  const p=G.players[i];
  const put=applyAction(i,type,to);
  step();
  if(put>0){
    fly(seatEl(i,'.plate'),document.querySelector(`.bet[data-i="${i}"]`),2,280,chipCls(put)); sfx('chip');
    if(p.allIn){const c=centerOfSeat(i); if(c) stampAt(c[0],c[1],'All in','#d8341f',p.isHuman?34:26); sfx('stamp',80); shake(false)}
  }
}
function collectThen(fn){
  const bets=[...document.querySelectorAll('#seats .bet')];
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
  if(res.winners.length) sfx('chip',60);
  res.winners.forEach(w=>{const c=where[w.i]; if(c) floatNum(c[0],c[1]-4,'+'+money(w.amt),false,450)});
  if(me.inHand&&!me.winner&&me.total>0&&where[0]) floatNum(where[0][0],where[0][1]-4,'−'+money(me.total),true,450);
  ev.kos.forEach((i,k)=>{const c=where[i]; if(c) later(()=>{stampAt(c[0],c[1],'Busted','#d8341f',G.players[i].bossDef?42:28); sfx('stamp'); shake(!!G.players[i].bossDef)},500+k*250)});
  if(ev.revenge){
    const rv=ev.revenge, c=where[rv.victim], bEl=seatEl(rv.boss,'.plate');
    later(()=>{sfx('boss')},350);
    later(()=>{
      sfx('gun'); flash(true); shake(true);
      if(c){stampAt(c[0],c[1],'Shot Dead','#d8341f',34);
        const ghost=document.createElement('div'); ghost.style.cssText=`position:absolute;left:${c[0]}%;top:${c[1]}%;width:2px;height:2px`; $('fx').appendChild(ghost);
        later(()=>{fly(ghost,bEl,10,700,chipCls(rv.amt)); sfx('chip',150); setTimeout(()=>ghost.remove(),1200)},500)}
      say(ev.bossLine.text);
    },1300);
  } else if(ev.bossLine) later(()=>say(ev.bossLine.text),ev.kos.length?900:500);
  if(R.gold>goldBefore) bumpGold();
  showReveal(res);
  const meWon=res.winners.some(w=>w.i===0);
  if(G.outcome==='win'){sfx('bigwin',300); flash(); burst(seatEl(0,'.plate'),46); $('table').classList.add('bust'); later(showPaid,1700)}
  else if(G.outcome==='lose'){sfx('lose',300); flash(true); shake(true); if(where[0]) later(()=>{stampAt(where[0][0],where[0][1]-6,'Busted','#d8341f',40); sfx('stamp')},400)}
  else if(meWon){sfx('win',250); if(res.pot>=G.bb*8){flash(); shake(false); burst(seatEl(0,'.plate'),30)}}
  procChain(ev.bonus||[],where[0]||[50,85],1500);
  if(ev.challenge){later(()=>{stampAt(50,30,'Challenge!','#f4cb5c',28); sfx('win'); bumpGold()},ev.kos.length?2000:900)}
  if(ev.wind) later(()=>{stampAt(50,60,'Second Wind','#7fcf8f',30); sfx('bigwin')},700);
  if(!G.outcome){R.table=serializeTable(); R.phase='table'; sset(RUN_KEY,R)}
  renderCoach();
}

/* ================= endings ================= */
function showPaid(){
  const bd=BOSSES[R.level-1];
  posterFor(bd,'paid');
  $('posterQuote').textContent=`"${bd.lines.bust}"`; $('posterTwist').textContent='';
  $('posterLine').textContent=`Busted in ${TOWNS[R.level-1]}.`;
  const st=$('stamp'); st.hidden=false; st.classList.remove('hit'); void st.offsetWidth; st.classList.add('hit');
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
  openShop('shop',`You busted <b>${bd.name}</b>. Bounty <b>${G.bounty}g</b>${G.koGold?`, knockouts <b>${G.koGold}g</b>`:''}.${extra}${unlockMsg}`);
}
function runOver(){TOKEN++; meta.best=Math.max(meta.best,R.level); saveMeta(); sset(RUN_KEY,null); endRun(false)}
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
    $('endSub').textContent='Bicah Mell Falls at Graves End · Eight Saloons Busted · Bounties Paid in Full';
    $('npCut').innerHTML=portrait('You the rider',HUMAN_LOOK);
    $('npCap').innerHTML='The Rider.<em>No name was given.</em>';
    $('npStamp').textContent='Paid'; $('npStamp').className='np-stamp paid';
    $('npStory').innerHTML=`<p><span class="cap">G</span><span class="dl">raves End.</span> A masked stranger finished what no lawman could last night, busting Bicah Mell at the final table and riding out with ${num(R.gold)} in gold.</p><p>The rider came up the trail from Dry Creek with ${chText}, and left every boss between here and there flat broke.</p><p>Asked for comment, Mell said only <q>${bd.lines.bust}</q> Witnesses report the rider tipped a hat and said nothing at all.</p><p>The Marshal's office says the reward will be paid in full.</p>`;
  } else {
    $('npKicker').textContent=`Trouble at ${town}`;
    $('endTitle').textContent=`Rider Busted in ${town}`;
    $('endSub').textContent=`${bd.name} Takes the Last of the Stranger's Chips${hands?` · ${hands} Hands Played`:''}`;
    $('npCut').innerHTML=bossPortrait(bd);
    $('npCap').innerHTML=`${bossName(bd)}.<em>${bd.title}. From a sketch.</em>`;
    $('npStamp').textContent='Busted'; $('npStamp').className='np-stamp';
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
function centerOfSeat(i){const el=seatEl(i,'.plate'); if(!el) return null; const t=$('table').getBoundingClientRect(); const [x,y]=relCenter(el); return [x/t.width*100,y/t.height*100]}
function fly(fromEl,toEl,count,dur,cls){
  if(REDUCED||!fromEl||!toEl) return;
  const [x1,y1]=relCenter(fromEl), [x2,y2]=relCenter(toEl);
  for(let k=0;k<count;k++){
    const s=document.createElement('span'); s.className='chip fly '+(cls||'g'); s.style.left=(x1-10)+'px'; s.style.top=(y1-10)+'px'; $('fx').appendChild(s);
    const jx=(Math.random()-.5)*18, jy=(Math.random()-.5)*12;
    const a=s.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${(x2-x1)/2+jx}px,${(y2-y1)/2-28+jy}px) scale(1.1)`,offset:.5},{transform:`translate(${x2-x1+jx}px,${y2-y1+jy}px) scale(.85)`}],
      {duration:dur,delay:k*45,easing:'cubic-bezier(.3,.6,.3,1)',fill:'both'});
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
function stampAt(xPct,yPct,text,color,size){
  const s=document.createElement('div'); s.className='stampfx'; s.textContent=text;
  s.style.left=xPct+'%'; s.style.top=yPct+'%';
  s.style.setProperty('--sc',color||'#d8341f'); s.style.setProperty('--sz',(size||30)+'px'); s.style.setProperty('--rot',(-10+Math.random()*8)+'deg');
  $('fx').appendChild(s); setTimeout(()=>s.remove(),1800);
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
function positions(N,narrow){
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
  $('town').textContent=TOWNS[L-1];
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

  const narrow=innerWidth<640&&innerHeight>innerWidth, N=nP();
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
  let html='';
  G.players.forEach((p,i)=>{
    if(p.out) return;
    const [x,y]=pos[i], fx=(50-x)/100*W, fy=(48-y)/100*H;
    const cards=(p.hand||[]).map((c,k)=>{
      const anim={fx,fy,delay:(c.order||0)*70};
      if(p.isHuman) return cardHTML(c,!blindfold,(snakeOn&&k===0&&!blindfold)?'watched':'','h'+i,anim);
      if(p.show||G.reveal||p.peekAll) return cardHTML(c,true,(G.reveal||p.peekAll)&&!p.show?'peek':'','h'+i,anim);
      if(p.peek===k) return cardHTML(c,true,'peek','h'+i,anim);
      return cardHTML(c,false,has('marked')?'marked':'','h'+i,anim);
    }).join('');
    const cls=['seat',y<35?'top':'',p.isHuman?'human':'',p.bossDef?'boss':'',p.bossDef&&mood?'mood-'+mood:'',G.turn===i&&G.street!=='done'?'turn':'',p.folded?'folded':'',p.winner?'winner':''].join(' ');
    const pill=p.result||(/blind|ante/i.test(p.action||'')?'':p.action)||'';
    const pcls=p.result?'win':(p.folded?'fold':(p.allIn&&/All in/.test(pill)?'allin':''));
    const tilted=p.tilt>0&&!p.isHuman&&!p.bossDef;
    const tier=tilted?'On tilt':'';
    html+=`<div class="${cls}" data-i="${i}" style="left:${x}%;top:${y}%">
      <div class="cards">${cards}</div>
      <div class="plate">
        <span class="medal">${portraitFor(p)}</span>
        <div class="who"><div class="nm" title="${p.name}">${p.bossDef?bossName(p.bossDef):(narrow&&!p.isHuman?p.name.split(' ')[0]:p.name)}</div>
          <div class="line">${roll('s'+i,p.chips,'chips')}${tier?`<span class="tier${tilted?' tilt':''}">${tier}</span>`:''}</div>
          ${p.isHuman&&madeName?`<div class="handname">${madeName}</div>`:''}</div>
        ${G.dealer===i&&G.street!=='idle'?'<div class="dealer" title="Dealer">D</div>':''}
        ${p.bossDef?`<div class="bossmeter"><i style="width:${Math.max(0,Math.min(100,p.chips/G.bossStart*100))}%"></i></div>`:''}
        ${pill?`<div class="pill ${pcls}"${pillLife(i,pill,!!p.result||pcls==='allin')}>${pill}</div>`:''}
      </div>
    </div>`;
    if(p.bet>0){
      let bx=x+(50-x)*0.5, by=y+(48-y)*0.5;
      if(y<35){bx=x+(x<=50?16:-16); by=y+15}
      if(p.isHuman){bx=x+20; by=y-15}
      const landed=BETV[i]!==p.bet; BETV[i]=p.bet;
      html+=`<div class="bet${landed&&!REDUCED?' land':''}" data-i="${i}" style="left:${bx}%;top:${by}%">${chipStack(p.bet)}${money(p.bet)}</div>`;
    }
  });
  $('seats').innerHTML=html;
  $('seats').querySelectorAll('.seat').forEach(s=>{const w=s.offsetWidth, x=parseFloat(s.style.left)/100*W, m=w/2+4; if(W>2*m){const cx=Math.max(m,Math.min(W-m,x)); if(Math.abs(cx-x)>.5) s.style.left=cx+'px'}});
  const tellerOn=has('teller')&&['preflop','flop','turn'].includes(G.street)&&G.deck.length;
  let b='';
  for(let k=0;k<5;k++){
    if(G.board[k]) b+=cardHTML(G.board[k],true,'','b',{fx:0,fy:-50,delay:k<3?k*90:0});
    else if(G.street!=='done'&&G.street!=='showdown'&&k>=G.board.length&&k<G.board.length+Math.max(tellerOn?1:0,G.mirror||0)&&G.deck.length>k-G.board.length) b+=cardHTML(G.deck[G.deck.length-1-(k-G.board.length)],true,'ghost');
    else b+='<div class="slot"></div>';
  }
  $('board').innerHTML=b;
  const pot=G.street==='done'?(G.lastPot||0):potTotal();
  $('potrow').innerHTML=(pot>0?chipStack(pot):'')+`<div class="pot">Pot ${roll('pot',pot,'b')}</div>`;
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
function renderControls(){
  const me=human(), st=$('status'), ac2=$('actions'), od=$('odds');
  od.hidden=true;
  if(G.turn!==0||G.street==='done'||G.street==='idle') closeRaise();
  const one=(cls,label,id)=>`<div class="actrow" style="--cols:1"><button class="btn ${cls}" id="${id}">${label}</button></div>`;
  if(G.street==='idle'){st.textContent='Pulling up a chair…'; ac2.innerHTML=`<div class="actrow ghosted" style="--cols:3"><button class="btn fold" disabled>Fold</button><button class="btn call" disabled>Call</button><button class="btn raise" disabled>Raise</button></div>`; return}
  if(G.street==='showdown'){st.innerHTML='<span class="dots">Showdown</span>'; ac2.innerHTML=`<div class="actrow ghosted" style="--cols:3"><button class="btn fold" disabled>Fold</button><button class="btn call" disabled>Call</button><button class="btn raise" disabled>Raise</button></div>`; return}
  if(G.street==='done'){
    if(G.outcome==='win'){st.innerHTML=`<b>${boss().name} is busted.</b>`; ac2.innerHTML=one('gold','Collect the bounty','nextBtn'); $('nextBtn').onclick=()=>{$('poster').hidden=true; $('table').classList.remove('bust'); tableWon()}; return}
    if(G.outcome==='lose'){st.innerHTML='<b>You\'re busted.</b> The run ends here.'; ac2.innerHTML=one('raise','Read the Gazette','nextBtn'); $('nextBtn').onclick=runOver; return}
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
    ac2.innerHTML=`<div class="actrow ghosted" style="--cols:3"><button class="btn fold" disabled>Fold</button><button class="btn call" disabled>Call</button><button class="btn raise" disabled>Raise</button></div>`;
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
    <div class="actrow" style="--cols:${canRaise?3:2}"><button class="btn fold" id="bFold">Fold</button><button class="btn call" id="bCall">${callTxt}</button>${canRaise?`<button class="btn raise" id="bRaise">${label}…</button>`:''}</div>`;
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
  $('bRaise').onclick=()=>{RAISE_OPEN=!RAISE_OPEN; if(RAISE_OPEN) raiseVal=minTo; renderRaise(minTo,maxTo,toCall,pot,label); renderCoach()};
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
  $('rsCancel').onclick=()=>{closeRaise(); renderCoach()};
  go.onclick=()=>{const v=raiseVal; closeRaise(); doAct(0,'raise',v)};
}

/* ================= pause menu ================= */
function openMenu(){
  const bd=BOSSES[R.level-1];
  PAUSED=true;
  $('menuTitle').textContent=TOWNS[R.level-1];
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
$('resumeBtn').onclick=closeMenu;
$('quitBtn').onclick=()=>{closeMenu(); renderTitle()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('menu').hidden) closeMenu()});
$('againBtn').onclick=()=>{ac(); startRun()};
$('homeBtn').onclick=renderTitle;
let rz; addEventListener('resize',()=>{clearTimeout(rz); rz=setTimeout(()=>{if(!$('sGame').hidden) render()},120)});
renderTitle();

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
    started=true; ov.classList.add('go');
    const c=ac(); if(c&&c.state!=='running'){try{await c.resume()}catch(e){}}
    let t0=0, useAudio=false;
    if(c&&c.state==='running'&&meta.music){
      const t1=performance.now(); while(!SND.buf.menu&&performance.now()-t1<5000) await new Promise(r=>setTimeout(r,60));
      if(SND.buf.menu){t0=introMusic(); useAudio=true} else SND.holdMenu=false;
    } else SND.holdMenu=false;
    play(t0,useAudio);
  }
  ov.addEventListener('pointerdown',begin);
  ov.addEventListener('keydown',begin);
  document.addEventListener('keydown',e=>{if(!ov.hidden&&!started) begin()},{once:true});
  // if this browser already lets the page play sound, don't make anyone tap
  setTimeout(()=>{const c=ac(); if(!c) return; c.resume().then(()=>{if(!started&&c.state==='running') begin()}).catch(()=>{})},60);
})();
