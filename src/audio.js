/* ================= audio: recorded-style score, rain, real foley ================= */
const SND={ctx:null,buf:{},decoding:false,want:false,loops:[],holdMenu:true};
const SFX_GAIN={toll:1,card:.5,chip:.62,chips:.72,win:.55,bigwin:.7,lose:.5,boss:.6,paid:.7,stamp:.55,door:.45,gun:.9,heart:.7,pen:.5,tick:.22,whoosh:.35};
// a boss can bring their own song to their table; it replaces the room piano there
const BOSS_TRACKS={1:{key:'boss_pete',period:179,fade:3,vol:.28},2:{key:'boss_ma',period:174,fade:0,vol:.38},3:{key:'boss_iron',period:171.3,fade:0,vol:.3},4:{key:'boss_under',period:199.5,fade:0,vol:.3},5:{key:'boss_snake',period:195.5,fade:3,vol:.22},6:{key:'boss_banker',period:229,fade:2,vol:.24},7:{key:'boss_vesper',period:222,fade:0,vol:.22},8:{key:'boss_bicah',period:163,fade:3,vol:.24}};
const MUSIC_PERIOD=183.825, MENU_PERIOD=139.6, AMB_PERIOD=40, AMB_FADE=3;
const SALOON_MIX={1:3600,2:2800,3:2200,4:3200,5:2600,6:4500,7:3000,8:1900};
function ac(){
  if(!SND.ctx){
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return null;
    try{if(navigator.audioSession) navigator.audioSession.type='ambient'}catch(e){}  // game audio: no Now Playing widget, mixes with your music, follows the silent switch
    try{SND.ctx=new C()}catch(e){return null}
    const c=SND.ctx;
    c.onstatechange=()=>{if(c!==SND.ctx) return; if(c.state==='interrupted') SND.dead=true; const h=document.getElementById('tapSound'); if(h) h.hidden=c.state==='running'};
    SND.master=c.createGain(); SND.master.gain.value=0.9;
    const comp=c.createDynamicsCompressor(); comp.threshold.value=-10; comp.ratio.value=3; comp.attack.value=.01; comp.release.value=.25;
    SND.master.connect(comp).connect(c.destination);
    SND.fx=c.createGain(); SND.fx.gain.value=1; SND.fx.connect(SND.master);
    SND.music=c.createGain(); SND.music.gain.value=0; SND.music.connect(SND.master);
    SND.musF=c.createBiquadFilter(); SND.musF.type='lowpass'; SND.musF.frequency.value=9000; SND.musF.Q.value=.5;
    SND.dry=c.createGain(); SND.dry.gain.value=1; SND.wet=c.createGain(); SND.wet.gain.value=.12;
    const L=Math.floor(c.sampleRate*2.2), ir=c.createBuffer(2,L,c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch); for(let i=0;i<L;i++){const t=i/c.sampleRate; d[i]=(Math.random()*2-1)*Math.exp(-3.2*t)*(t<.012?0:1)}}
    SND.conv=c.createConvolver(); SND.conv.buffer=ir;
    SND.musF.connect(SND.dry).connect(SND.music); SND.musF.connect(SND.conv).connect(SND.wet).connect(SND.music);
    SND.mus=c.createGain(); SND.mus.gain.value=0; SND.mus.connect(SND.musF);
    SND.menu=c.createGain(); SND.menu.gain.value=0; SND.menu.connect(SND.music);
    SND.bossBus=c.createGain(); SND.bossBus.gain.value=0; SND.bossBus.connect(SND.music);
    SND.amb=c.createGain(); SND.amb.gain.value=0.22; SND.amb.connect(SND.music);
    musicLevel(); decodeAll();
  }
  if(SND.ctx.state==='suspended') SND.ctx.resume();
  return SND.ctx;
}
function b64buf(s){const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer}
// sound files are published next to the page and fetched on demand, so the page itself stays light.
// Licensed recordings live in audio/v as AES-256-GCM blobs under hashed names and are only ever decrypted in memory.
let VKEY=null;
function vaultKey(){
  if(!VKEY){const b=VAULT.b.slice().reverse(), raw=new Uint8Array(VAULT.a.map((x,i)=>x^b[i]));
    VKEY=crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt'])}
  return VKEY;
}
function fetchSound(k){
  const h=VAULT.n[k];
  if(!h) return fetch(new URL('audio/'+k+'.mp3',location.href).href).then(r=>r.ok?r.arrayBuffer():null);
  return Promise.all([fetch(new URL('audio/v/'+h+'.mp3',location.href).href).then(r=>r.ok?r.arrayBuffer():null),vaultKey()])
    .then(([buf,key])=>buf&&crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12)},key,new Uint8Array(buf,12)));
}
function decodeOne(k){
  if(SND.buf[k]||!(window.__DMR_SND_KEYS||[]).includes(k)) return Promise.resolve();
  return fetchSound(k).then(ab=>ab&&new Promise(res=>{try{SND.ctx.decodeAudioData(ab,b=>{SND.buf[k]=b; res()},()=>res())}catch(e){res()}})).catch(()=>{});
}
async function decodeAll(){
  if(SND.decoding) return; SND.decoding=true;
  const keys=(window.__DMR_SND_KEYS||[]).filter(k=>k!=='piano'&&k!=='menu'&&!/^boss_/.test(k)&&!/^amb/.test(k)&&!/^ev_/.test(k));
  await decodeOne('menu'); if(SND.want) startMusic();
  await Promise.all(keys.map(decodeOne));
  await decodeOne(ambKey()); if(SND.want) startMusic();
  await Promise.all((window.__DMR_SND_KEYS||[]).filter(k=>/^ev_/.test(k)).map(decodeOne));
  for(let n=1;n<=8;n++) await decodeOne('amb'+n); if(SND.want) startMusic();
  await decodeOne('piano'); if(SND.want) startMusic();
  for(const t of Object.values(BOSS_TRACKS)){await decodeOne(t.key); if(SND.want) startMusic()}
}
// haptics: the native app feels every chip, stamp and shot; the web falls back to vibrate where it exists
const HAPTIC_FOR={chip:'light',chips:'medium',card:'soft',stamp:'heavy',gun:'heavy',boss:'rigid',bigwin:'success',win:'light',paid:'success',lose:'error',toll:'error',heart:'soft',whoosh:'soft'};
let HAPT_T=0;
function haptic(kind){if(meta.haptics===false) return; const n=performance.now(); if(n-HAPT_T<35&&kind!=='heavy'&&kind!=='success'&&kind!=='error') return; HAPT_T=n;
  try{const h=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.haptic; if(h){h.postMessage(kind); return}
    if(navigator.vibrate) navigator.vibrate({light:8,soft:6,medium:14,rigid:18,heavy:26,success:[14,40,22],error:[30,50,30]}[kind]||10)}catch(e){}}
// a big shove of chips: a rolling rumble whose length grows with the size of the bet (in big blinds)
function rumble(bbs,delay=0){if(meta.haptics===false) return; const n=Math.max(2,Math.min(7,Math.round(1+Math.log2(Math.max(1,bbs/4)))));
  const seq=['heavy'].concat(Array.from({length:n-1},(_,k)=>k%2?'rigid':'medium'));
  seq.forEach((k,j)=>setTimeout(()=>{HAPT_T=0; haptic(k)},delay+j*55))}
function sfx(type,delay=0,pitch=1){
  if(HAPTIC_FOR[type]){if(delay>0) setTimeout(()=>haptic(HAPTIC_FOR[type]),delay); else haptic(HAPTIC_FOR[type])}
  if(!meta.sound||!SND.ctx) return;
  if(SND.hush&&type!=='toll') return;
  const c=SND.ctx;
  let key=type;
  // real chips on felt: four set-downs for bets, one heavy throw for big pushes and payouts
  if(type==='chip'){key='chipd'+Math.floor(Math.random()*4); if(!SND.buf[key]) key='chip'+Math.floor(Math.random()*5)}
  else if(type==='chips'){key=SND.buf.chipt?'chipt':'chip'+Math.floor(Math.random()*5)}
  else if(type==='card') key='card'+Math.floor(Math.random()*4);
  else if(type==='gun') key='gun'+Math.floor(Math.random()*3);
  const b=SND.buf[key]; if(!b) return;
  const s=c.createBufferSource(); s.buffer=b;
  let rate=pitch;
  if(type==='chip'||type==='card') rate*=0.96+Math.random()*0.08;
  if(type==='tick') rate=0.85+(pitch-1)*0.35;
  s.playbackRate.value=rate;
  const g=c.createGain(); g.gain.value=(SFX_GAIN[type]||.5)*(type==='chip'||type==='card'?0.85+Math.random()*0.3:1);
  s.connect(g).connect(SND.fx); s.start(c.currentTime+delay/1000);
  const rec={s,g,at:performance.now()}; (SND.live=SND.live||new Set()).add(rec); s.onended=()=>SND.live.delete(rec);
}
// skip a screen, and its sounds go with it: fade out every effect that was set off more than `olderThan` ms ago
function sfxCut(olderThan=120){if(!SND.ctx||!SND.live) return; const c=SND.ctx, now=performance.now();
  SND.live.forEach(r=>{if(now-r.at<olderThan) return; try{r.g.gain.cancelScheduledValues(c.currentTime); r.g.gain.setValueAtTime(r.g.gain.value,c.currentTime); r.g.gain.linearRampToValueAtTime(0,c.currentTime+.12); r.s.stop(c.currentTime+.14)}catch(e){} SND.live.delete(r)})}
function loopTrack(key,period,bus,fade,startAt){
  const c=SND.ctx, b=SND.buf[key]; if(!b) return;
  const sub=c.createGain(); sub.gain.value=1; sub.connect(bus); bus=sub;
  const st={key,next:startAt||c.currentTime+0.05,timer:null,srcs:[],bus:sub};
  const sched=()=>{
    while(st.next<c.currentTime+4){
      const s=c.createBufferSource(); s.buffer=b; const g=c.createGain(); s.connect(g).connect(bus);
      const t=st.next;
      if(fade){g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1,t+fade); g.gain.setValueAtTime(1,t+period); g.gain.linearRampToValueAtTime(0,t+period+fade)}
      s.start(t); st.srcs.push(s); s.onended=()=>{st.srcs=st.srcs.filter(x=>x!==s)};
      st.next+=period;
    }
  };
  sched(); st.timer=setInterval(sched,1000); SND.loops.push(st);
}
function musicLevel(){
  if(!SND.ctx) return; ambEvents(); const c=SND.ctx, game=SND.scene==='sGame';
  const menu=!SND.scene||SND.scene==='sTitle';
  if(SND.hush){[SND.menu,SND.mus,SND.bossBus,SND.amb].forEach(n=>{if(!n) return; n.gain.cancelScheduledValues(c.currentTime); n.gain.setValueAtTime(n.gain.value,c.currentTime); n.gain.linearRampToValueAtTime(0,c.currentTime+.12)}); return}
  const tg=(n,v)=>{n.cancelScheduledValues(c.currentTime); n.setValueAtTime(n.value,c.currentTime); n.linearRampToValueAtTime(v,c.currentTime+1.5)};
  tg(SND.musF.frequency,menu?9000:(SALOON_MIX[SND.saloon]||3000)); tg(SND.wet.gain,menu?.12:.7); tg(SND.dry.gain,menu?1:.55);
  // music only at the table; the store, trail and events get the saloon's ambience alone
  const bt=game&&BOSS_TRACKS[SND.saloon]&&SND.buf[BOSS_TRACKS[SND.saloon].key]?BOSS_TRACKS[SND.saloon]:null;
  [[SND.menu,menu?0.5:0],[SND.mus,!game||bt?0:0.16],[SND.bossBus,bt?bt.vol:0],[SND.amb,menu?0:(bt?0.3:0.42)*(AMB_TRIM[SND.saloon]||1)]].forEach(([n,v])=>{n.gain.cancelScheduledValues(c.currentTime); n.gain.setValueAtTime(n.gain.value,c.currentTime); n.gain.linearRampToValueAtTime(v,c.currentTime+1.5)});
}
// the whole world goes quiet: music, ambience and every sound but the bell
function hush(on){SND.hush=!!on; musicLevel()}
// per-saloon ambience trim (Ma's room recording runs hot)
const AMB_TRIM={2:.5};
function ambKey(){return 'amb'+(SND.saloon||5)}
// one-shot world sounds, scheduled at random per saloon so the loop never feels like a loop
const AMB_EVENTS={};
const AMB_EVENTS_OLD={
  1:[[['bird0','bird1','bird2','bird3','bird4'],5,12,.55],[['bird5'],18,35,.4],[['train'],80,150,.7]],
  2:[[['thunder2'],50,110,.55],[['clink'],22,45,.5]],
  3:[[['clink'],40,80,.25]],
  4:[[['owl'],22,48,.5],[['train'],110,200,.55]],
  5:[[['thunder0','thunder1','thunder2'],14,32,.75]],
  6:[[['clink'],14,30,.45],[['train'],100,180,.4]],
  7:[[['bird2','bird4','bird5'],9,20,.4]],
  8:[[['thunder0','thunder1'],10,24,.85],[['bell'],28,55,.45]]
};
function ambEvents(){
  clearTimeout(SND.evT); SND.evT=null; (SND.evTs||[]).forEach(clearTimeout); SND.evTs=[];
  const menu=!SND.scene||SND.scene==='sTitle'; if(menu||SND.hush||!meta.music||!SND.ctx) return;
  (AMB_EVENTS[SND.saloon]||[]).forEach(([keys,lo,hi,vol])=>{
    const go=()=>{
      const k='ev_'+keys[Math.floor(Math.random()*keys.length)], b=SND.buf[k];
      if(b&&!document.hidden&&SND.ctx.state==='running'){
        const s=SND.ctx.createBufferSource(); s.buffer=b; const g=SND.ctx.createGain(); g.gain.value=vol*(.75+Math.random()*.35);
        s.playbackRate.value=k.startsWith('ev_bird')?(.92+Math.random()*.16):1; s.connect(g).connect(SND.amb); s.start();
        if(k.startsWith('ev_thunder')&&window.onThunder) window.onThunder(k);
      }
      SND.evTs.push(setTimeout(go,(lo+Math.random()*(hi-lo))*1000));
    };
    SND.evTs.push(setTimeout(go,(lo*.35+Math.random()*lo*.6)*1000));
  });
}
function stopLoop(l,fade){
  SND.loops=SND.loops.filter(x=>x!==l); clearInterval(l.timer);
  const c=SND.ctx; l.srcs.forEach(s=>{try{s.stop(c.currentTime+fade)}catch(e){}});
  if(l.bus){l.bus.gain.setValueAtTime(l.bus.gain.value,c.currentTime); l.bus.gain.linearRampToValueAtTime(0,c.currentTime+fade)}
}
function setSaloon(n){if(SND.saloon===n) return; SND.saloon=n; if(SND.ctx&&SND.want&&meta.music) startMusic()}
function startMusic(){
  SND.want=true;
  if(!meta.music||!SND.ctx) return;
  const c=SND.ctx;
  const ak=ambKey();
  SND.loops.filter(l=>/^amb/.test(l.key)&&l.key!==ak).forEach(l=>stopLoop(l,2));
  if(SND.buf[ak]&&!SND.loops.some(l=>l.key===ak)) loopTrack(ak,SND.buf[ak].duration-AMB_FADE,SND.amb,AMB_FADE);
  musicLevel();
  if(SND.buf.menu&&!SND.holdMenu&&!SND.loops.some(l=>l.key==='menu')){
    loopTrack('menu',MENU_PERIOD,SND.menu,0);
    if(!SND.scene||SND.scene==='sTitle'){const m=SND.menu.gain; m.cancelScheduledValues(0); m.value=0.5; m.setValueAtTime(0.5,c.currentTime)}
  }
  if(SND.buf.piano&&!SND.loops.some(l=>l.key==='piano')) loopTrack('piano',MUSIC_PERIOD,SND.mus,0);
  // the boss's song starts from the top when you sit down, and stops when you leave the table
  const bt=BOSS_TRACKS[SND.saloon], atTable=SND.scene==='sGame';
  SND.loops.filter(l=>/^boss_/.test(l.key)&&(!atTable||!bt||l.key!==bt.key)).forEach(l=>stopLoop(l,2));
  if(atTable&&bt&&SND.buf[bt.key]&&!SND.loops.some(l=>l.key===bt.key)) loopTrack(bt.key,bt.period,SND.bossBus,bt.fade||0);
  const g=SND.music.gain; g.cancelScheduledValues(0); g.value=1; g.setValueAtTime(1,c.currentTime);
}
function stopMusic(){
  SND.want=false; if(!SND.ctx) return; (SND.evTs||[]).forEach(clearTimeout); SND.evTs=[];
  const c=SND.ctx, g=SND.music.gain; g.cancelScheduledValues(c.currentTime); g.setValueAtTime(g.value,c.currentTime); g.linearRampToValueAtTime(0,c.currentTime+0.8);
  const L=SND.loops; SND.loops=[];
  setTimeout(()=>L.forEach(l=>{clearInterval(l.timer); l.srcs.forEach(s=>{try{s.stop()}catch(e){}})}),900);
}
// browsers only allow sound after a tap; any first interaction unlocks it. Files start loading right away.
['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,()=>{if((SND.dead||SND.kick)&&SND.ctx){SND.kick=false; reviveAudio(); return} const c=ac(); if(c){if(c.state!=='running') c.resume(); if(meta.music) startMusic()}},{passive:true}));
setTimeout(()=>{try{ac()}catch(e){}},0);
// iOS can leave Web Audio dead after the phone sleeps or a call interrupts it: a "running" context that makes no sound.
// So after any real absence we rebuild the audio graph from scratch (decoded sounds are kept) and pick the music back up.
function reviveAudio(){
  const old=SND.ctx; if(!old) return; const want=SND.want;
  (SND.loops||[]).forEach(l=>{clearInterval(l.timer); (l.srcs||[]).forEach(x=>{try{x.stop()}catch(e){}})}); SND.loops=[];
  clearTimeout(SND.evT); (SND.evTs||[]).forEach(clearTimeout); SND.evTs=[];
  try{old.onstatechange=null; old.close()}catch(e){}
  SND.ctx=null; SND.dead=false; const c=ac(); if(!c) return;
  const go=()=>{if(want&&meta.music) startMusic()};
  if(c.state==='running') go(); else c.resume().then(go).catch(()=>{});
}
let AWAY=0;
function awayBack(){
  if(!SND.ctx) return;
  if(document.hidden){AWAY=Date.now(); try{SND.ctx.suspend()}catch(e){} return}
  if(SND.dead||(AWAY&&Date.now()-AWAY>1500)){reviveAudio(); SND.kick=true} else SND.ctx.resume().catch(()=>{});
  AWAY=0;
}
document.addEventListener('visibilitychange',awayBack);
addEventListener('pageshow',e=>{if(e.persisted&&SND.ctx){reviveAudio(); SND.kick=true}});
document.addEventListener('resume',()=>{if(SND.ctx){reviveAudio(); SND.kick=true}});
addEventListener('focus',()=>{if(SND.ctx&&SND.ctx.state!=='running'&&!document.hidden) SND.ctx.resume().catch(()=>{SND.dead=true})});

// the intro starts the menu song itself, from its first beat, and returns the AudioContext time of that beat
const MENU_TRUE_LEN=143.832;
function introMusic(){
  const c=SND.ctx; SND.want=true; SND.holdMenu=false;
  const t=c.currentTime+0.15;
  loopTrack('menu',MENU_PERIOD,SND.menu,0,t);
  startMusic();
  // full volume from the first beat: no fade (startMusic schedules ramps, so pin these after it)
  [[SND.music.gain,1],[SND.menu.gain,0.5],[SND.amb.gain,0]].forEach(([g,v])=>{g.cancelScheduledValues(0); g.value=v; g.setValueAtTime(v,c.currentTime)});
  // some decoders keep the mp3 encoder's ~25ms of leading silence; account for it so the hits line up
  const pad=(SND.buf.menu.duration-MENU_TRUE_LEN)>0.02?0.025:0;
  return t+pad+(c.outputLatency||c.baseLatency||0);
}
