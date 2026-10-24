/* ================= storage + meta ================= */
function sget(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function sset(k,v){const t=Date.now(); try{if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,JSON.stringify(v)); localStorage.setItem(k+'@t',t)}catch(e){}
  // in the iPhone app, saves also go to iCloud so a run carries between your devices
  try{const c=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.cloud; if(c) c.postMessage({k,v:v===null?null:JSON.stringify(v),t})}catch(e){}}
// on launch the app hands over whatever iCloud holds; take it when it is newer than this device's copy
(function(){try{const cl=window.__cloud; if(!cl) return;
  Object.keys(cl).forEach(k=>{const c=cl[k], lt=+(localStorage.getItem(k+'@t')||0); if(c&&c.t>lt){if(c.v==null) localStorage.removeItem(k); else localStorage.setItem(k,c.v); localStorage.setItem(k+'@t',c.t)}})}catch(e){}})();
const META_KEY='deadmans-run-meta-v2', RUN_KEY='deadmans-run-save-v3';
const meta=Object.assign({best:0,runs:0,wins:0,unlock:0,sound:true,music:true,speed:'normal',heatPick:0,tips:{}},sget(META_KEY)||{});
meta.stats=Object.assign({hands:0,won:0,bigPot:0,bestHand:0,bosses:0,showdowns:0,challenges:0},meta.stats||{});
meta.tips=meta.tips||{};
function saveMeta(){sset(META_KEY,meta)}

/* ================= state ================= */
let R=null;
const G={players:[],deck:[],board:[],dealer:0,street:'idle',currentBet:0,minRaise:20,turn:-1,log:[],handLog:[],lastHandLog:[],winCards:new Set(),seen:new Map(),lastWinners:[]};
const EMIT={};
function on(t,f){EMIT[t]=f}
function emit(t,...a){if(EMIT[t]) return EMIT[t](...a)}
function log(t){G.log.unshift(t); if(G.log.length>40) G.log.pop(); G.handLog.push(t)}

/* ================= helpers ================= */
function shuffleWith(a,rnd){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function money(n){return '$'+Math.round(n).toLocaleString('en-US')}
function num(n){return Math.round(n).toLocaleString('en-US')}
function has(k){return !!(R&&R.charms.includes(k))}
function lvl(k){return has(k)?((R.lv&&R.lv[k])||1):0}
function human(){return G.players[0]}
function boss(){return G.players.find(p=>p.bossDef)}
function twistOn(key){const b=boss(); return !!(b&&b.boss===key&&!has('silver'))}
function heatGoldMul(){return 1+0.1*(R?R.heat||0:0)}
function goldMul(){return (has('golden')?(lvl('golden')>=2?2:1.5):1)*heatGoldMul()}
function bountyFor(L){return 40+15*L}
function maxHeat(){return Math.min(3,meta.wins)}
function hasDeed(k){return !!(R&&R.deeds&&R.deeds.includes(k))}
function charmSlots(){return 6+(hasDeed('satchel')?1:0)+(has('saddle')?1:0)}
function trickSlots(){return 2+(hasDeed('belt')?1:0)}
const nP=()=>G.players.length;
function put(p,a){a=Math.max(0,Math.min(a,p.chips)); p.chips-=a; p.bet+=a; p.total+=a; if(p.chips===0) p.allIn=true; return a}
function potTotal(){return G.players.reduce((s,p)=>s+(p.total||0),0)}
function nextIn(i){for(let k=1;k<=nP();k++){const j=(i+k)%nP(); if(G.players[j].inHand) return j} return i}
function needsAction(p){return p.inHand&&!p.folded&&!p.allIn&&(!p.acted||p.bet<G.currentBet)}
function findNext(from){for(let k=1;k<=nP();k++){const j=(from+k)%nP(); if(needsAction(G.players[j])) return j} return -1}
function live(){return G.players.filter(p=>p.inHand&&!p.folded)}
function draw(){return G.deck.pop()}
function pickLine(a){return a[Math.floor(Math.random()*a.length)]}
function shortName(p){if(p.isHuman) return 'You'; if(p.bossDef) return p.name; return p.name.split(' ')[0]}

/* ================= hand evaluation ================= */
function pk(cat,...a){let v=cat;for(let i=0;i<5;i++) v=v*16+(a[i]||0);return v}
function strTop(m){if(m&(1<<14)) m|=2; for(let t=14;t>=5;t--){const need=31<<(t-4); if((m&need)===need) return t} return 0}
function evalHand(cs){
  const cnt=new Array(15).fill(0), sm=[0,0,0,0], sc=[0,0,0,0]; let mask=0;
  for(const c of cs){cnt[c.r]++; sc[c.s]++; sm[c.s]|=1<<c.r; mask|=1<<c.r}
  let fm=0; for(let s=0;s<4;s++) if(sc[s]>=5) fm=sm[s];
  if(fm){const sf=strTop(fm); if(sf) return pk(8,sf)}
  let quad=0; const trips=[],pairs=[];
  for(let r=14;r>=2;r--){const n=cnt[r]; if(n===4)quad=r; else if(n===3)trips.push(r); else if(n===2)pairs.push(r)}
  if(quad){let k=0; for(let r=14;r>=2;r--) if(r!==quad&&cnt[r]){k=r;break} return pk(7,quad,k)}
  if(trips.length&&(trips.length>1||pairs.length)) return pk(6,trips[0],Math.max(trips[1]||0,pairs[0]||0));
  if(fm){const t=[]; for(let r=14;r>=2&&t.length<5;r--) if(fm&(1<<r)) t.push(r); return pk(5,...t)}
  const st=strTop(mask); if(st) return pk(4,st);
  if(trips.length){const k=[]; for(let r=14;r>=2&&k.length<2;r--) if(cnt[r]&&r!==trips[0]) k.push(r); return pk(3,trips[0],...k)}
  if(pairs.length>=2){let k=0; for(let r=14;r>=2;r--) if(cnt[r]&&r!==pairs[0]&&r!==pairs[1]){k=r;break} return pk(2,pairs[0],pairs[1],k)}
  if(pairs.length){const k=[]; for(let r=14;r>=2&&k.length<3;r--) if(cnt[r]&&r!==pairs[0]) k.push(r); return pk(1,pairs[0],...k)}
  const t=[]; for(let r=14;r>=2&&t.length<5;r--) if(cnt[r]) t.push(r); return pk(0,...t);
}
function handCat(v){return Math.floor(v/Math.pow(16,5))}
function nameOf(v){
  const d=[]; let x=v; for(let i=0;i<5;i++){d.unshift(x%16); x=Math.floor(x/16)}
  switch(x){
    case 8: return d[0]===14?'Royal Flush':`Straight Flush, ${SG[d[0]]} high`;
    case 7: return `Four ${PL[d[0]]}`;
    case 6: return `Full House, ${PL[d[0]]} over ${PL[d[1]]}`;
    case 5: return `Flush, ${SG[d[0]]} high`;
    case 4: return `Straight, ${SG[d[0]]} high`;
    case 3: return `Three ${PL[d[0]]}`;
    case 2: return `Two Pair, ${PL[d[0]]} and ${PL[d[1]]}`;
    case 1: return `Pair of ${PL[d[0]]}`;
    default: return `${SG[d[0]]} High`;
  }
}
const CAT_SHORT=['High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush'];
function bestFive(cs){
  let best=-1, pick=cs; const n=cs.length, combo=[];
  (function rec(start){
    if(combo.length===5){const f=combo.map(i=>cs[i]); const v=evalHand(f); if(v>best){best=v;pick=f} return}
    for(let i=start;i<n;i++){combo.push(i); rec(i+1); combo.pop()}
  })(0);
  return pick;
}
function equity(hand,board,opps,sims,pin){
  if(opps<=0) return 1;
  const known=new Set(hand.concat(board).map(c=>c.id)); if(pin) known.add(pin.id);
  const rest=FULL.filter(c=>!known.has(c.id));
  const need=5-board.length, take=need+2*opps-(pin?1:0); let total=0;
  for(let s=0;s<sims;s++){
    const d=rest.slice();
    for(let k=0;k<take;k++){const j=k+Math.floor(Math.random()*(d.length-k)); const t=d[k]; d[k]=d[j]; d[j]=t}
    const b=board.concat(d.slice(0,need));
    const me=evalHand(hand.concat(b)); let best=true, ties=1, ptr=need;
    for(let o=0;o<opps;o++){
      let oh; if(pin&&o===0){oh=[pin,d[ptr]]; ptr+=1} else {oh=[d[ptr],d[ptr+1]]; ptr+=2}
      const sc=evalHand(oh.concat(b));
      if(sc>me){best=false;break} if(sc===me) ties++;
    }
    if(best) total+=1/ties;
  }
  return total/sims;
}
// side pots: [{amt, elig:[players]}]
function pots(){
  const L=live();
  const levels=[...new Set(G.players.filter(p=>p.total>0).map(p=>p.total))].sort((a,b)=>a-b);
  const out=[]; let prev=0, carry=0;
  for(const lv of levels){
    let amt=carry; G.players.forEach(p=>{amt+=Math.max(0,Math.min(p.total,lv)-prev)}); prev=lv;
    const elig=L.filter(p=>p.total>=lv);
    if(!elig.length){carry=amt; continue} carry=0;
    const last=out[out.length-1];
    if(last&&last.elig.length===elig.length) last.amt+=amt; else out.push({amt,elig});
  }
  if(carry&&out.length) out[out.length-1].amt+=carry;
  return out;
}

/* ================= table setup ================= */
function setupTable(){
  const L=R.level, bd=BOSSES[L-1];
  G.curse=R.curse; R.curse=null;
  const heat=R.heat||0;
  const lineup=LINEUPS[L-1].slice(); if(G.curse==='crowd'&&lineup.length<6) lineup.push('g');
  G.lineup=lineup;
  G.bb=Math.round(BBS[L-1]*(G.curse==='heavy'?2:1)*(heat>=3?1.5:1)/10)*10;
  G.riseEvery=(bd.key==='under'&&!has('silver'))?5:10; if(has('steady')) G.riseEvery*=2;
  let start=START+(has('deep')?(lvl('deep')>=2?600:300):0)+((R.temp&&R.temp.chips)||0)+(hasDeed('stake')?200:0);
  if(G.curse==='short') start=Math.round(start*0.67/10)*10;
  G.start=start; G.tempWind=!!(R.temp&&R.temp.wind); R.temp=null;
  const used=new Set(), pool=shuffle(NAMES.slice());
  const minors=shuffle(lineup).map(t=>{
    const [name,fem]=pool.find(([nm])=>!used.has(nm)); used.add(name);
    const T=TIERS[t]; return {name,fem:!!fem,tier:t,style:T.styles[Math.floor(Math.random()*T.styles.length)],chips:T.chips,isHuman:false,tilt:0};
  });
  const bChips=Math.round(((bd.key==='banker'&&!has('silver'))?3000:1500+100*(L-1))*(heat>=1?1.25:1)/10)*10;
  const bp={name:bd.name,bossDef:bd,boss:bd.key,style:bd.style,chips:bChips,isHuman:false,fem:!!bd.fem,tilt:0};
  minors.splice(Math.floor(minors.length/2),0,bp);
  G.players=[{name:'You',isHuman:true,chips:start,tilt:0}].concat(minors);
  G.players.forEach(p=>{p.out=false; p.hand=[]; p.bet=0; p.total=0});
  G.bossStart=bChips;
  G.dealer=Math.floor(Math.random()*G.players.length);
  G.tableHands=0; G.flaskUsed=false; G.dynUsed=false; G.windUsed=0; G.vesperUsed=false; G.horseUsed=false; G.aceUsed=false; G.streak=0; G.koGold=0;
  G.outcome=null; G.log=[]; G.handLog=[]; G.lastHandLog=[]; G.board=[]; G.street='idle'; G.seen=new Map(); G.winCards=new Set(); G.lastWinners=[];
  G.challenge=CHALLENGES[Math.floor(Math.random()*CHALLENGES.length)]; G.challengeDone=false;
  G.bounty=Math.round(bountyFor(L)*goldMul());
  log(`You ride into ${TOWNS[L-1]}. ${bd.name} is waiting.`);
  if(G.curse) log(`Cursed: ${CURSES[G.curse].name}.`);
}
function serializeTable(){
  return {players:G.players.map(p=>({name:p.name,fem:p.fem,tier:p.tier,style:p.style,chips:p.chips,out:p.out,tilt:p.tilt||0,boss:p.boss||null,isHuman:!!p.isHuman})),
    dealer:G.dealer,bb:G.bb,riseEvery:G.riseEvery,tableHands:G.tableHands,start:G.start,bossStart:G.bossStart,curse:G.curse,lineup:G.lineup,
    challenge:G.challenge&&G.challenge.key,challengeDone:G.challengeDone,windUsed:G.windUsed,vesperUsed:G.vesperUsed,horseUsed:G.horseUsed,aceUsed:G.aceUsed,
    streak:G.streak,koGold:G.koGold,bounty:G.bounty,tempWind:G.tempWind,log:G.log.slice(0,12)};
}
function restoreTable(t){
  G.players=t.players.map(p=>{const q=Object.assign({hand:[],bet:0,total:0},p); if(p.boss){q.bossDef=BOSSES.find(b=>b.key===p.boss)||BOSSES[7]; q.boss=q.bossDef.key} return q});
  ['dealer','bb','riseEvery','tableHands','start','bossStart','curse','lineup','challengeDone','windUsed','vesperUsed','horseUsed','aceUsed','streak','koGold','bounty','tempWind'].forEach(k=>G[k]=t[k]);
  G.challenge=CHALLENGES.find(c=>c.key===t.challenge)||CHALLENGES[0];
  G.log=t.log||[]; G.handLog=[]; G.lastHandLog=[]; G.board=[]; G.street='idle'; G.outcome=null; G.seen=new Map(); G.winCards=new Set(); G.lastWinners=[];
}

/* ================= hand flow ================= */
function startHand(){
  G.risen=false;
  if(G.tableHands>0&&G.tableHands%G.riseEvery===0){
    G.bb=Math.round(G.bb*1.5/10)*10; G.risen=true; log(`Blinds rise to ${money(G.bb/2)} / ${money(G.bb)}.`);
    if(has('bartab')){const b=lvl('bartab')>=2?250:100; human().chips+=b; log(`Bar Tab: ${money(b)} on the house.`)}
  }
  G.handLog=[];
  G.winCards=new Set(); G.outcome=null; G.seen=new Map(); G.lastWinners=[];
  G.players.forEach(p=>Object.assign(p,{hand:[],folded:false,allIn:false,bet:0,total:0,acted:false,action:'',show:false,result:'',winner:false,peek:-1,handName:'',score:0,tell:'',startChips:p.chips,inHand:!p.out&&p.chips>0}));
  G.board=[]; G.deck=(typeof DAILY!=='undefined'&&DAILY&&DAILY.rng)?shuffleWith(FULL.map(c=>Object.assign({},c)),DAILY.rng):shuffle(FULL.map(c=>Object.assign({},c)));
  // a scripted deal (tutorial): rigDeck lists [rank,suit] in the order cards come off the deck
  if(G.rigDeck){const pick=G.rigDeck.map(([r,s])=>G.deck.find(c=>c.r===r&&c.s===s)); G.deck=G.deck.filter(c=>!pick.includes(c)).concat(pick.reverse()); G.rigDeck=null}
  G.dealer=nextIn(G.dealer);
  const count=G.players.filter(p=>p.inHand).length;
  const bp=boss();
  if(bp&&twistOn('ma')&&!bp.out){
    const ante=Math.max(5,Math.round(G.bb/5/5)*5);
    G.players.forEach(p=>{if(p.inHand&&!p.bossDef){let a=ante; if(p.isHuman&&has('comped')) a=lvl('comped')>=2?0:Math.ceil(a/2); a=Math.min(a,p.chips); p.chips-=a; p.total+=a; if(p.chips===0) p.allIn=true}});
  }
  const sbI=count===2?G.dealer:nextIn(G.dealer), bbI=nextIn(sbI);
  const blind=(i,amt,label)=>{const p=G.players[i]; if(p.isHuman&&has('comped')) amt=lvl('comped')>=2?0:Math.ceil(amt/2); put(p,amt); p.action=label};
  blind(sbI,G.bb/2,'Small blind'); blind(bbI,G.bb,'Big blind');
  G.currentBet=G.bb; G.minRaise=G.bb; G.aggressor=-1; G.meRaised=false;
  let order=0;
  for(let r=0;r<2;r++){let i=G.dealer; for(let k=0;k<count;k++){i=nextIn(i); const c=draw(); c.order=order++; G.players[i].hand.push(c)}}
  G.players.forEach(p=>{if(p.inHand&&p.boss==='bicah'&&!has('silver')){const c=draw(); c.order=order++; p.hand.push(c)}});
  G.dealCount=order;
  const me=human();
  if(has('rabbit')&&me.inHand&&me.hand[0].r!==me.hand[1].r&&Math.random()<0.35){
    const k=G.deck.findIndex(c=>c.r===me.hand[0].r); if(k>=0){const c=G.deck.splice(k,1)[0]; c.order=me.hand[1].order; G.deck.push(me.hand[1]); shuffle(G.deck); me.hand[1]=c}
  }
  G.mechSwaps=lvl('mech')>=2?2:1; G.reveal=false; G.spook=false; G.mirror=0; G.sawFlop=false;
  if(has('hawk')){const opp=shuffle(G.players.filter(p=>!p.isHuman&&p.inHand)); opp.slice(0,lvl('hawk')>=2?2:1).forEach(p=>p.peek=0)}
  G.street='preflop';
  G.turn=findNext(bbI);
}
function applyAction(i,type,to){
  const p=G.players[i]; if(G.turn!==i) return 0;
  const toCall=G.currentBet-p.bet, name=p.isHuman?'You':p.name;
  let putIn=0;
  if(type==='fold'){p.folded=true; p.action='Fold'; log(`${name} ${p.isHuman?'fold':'folds'}.`)}
  else if(type==='check'||(type==='call'&&toCall<=0)){p.action='Check'; log(`${name} ${p.isHuman?'check':'checks'}.`)}
  else if(type==='call'){
    putIn=put(p,toCall);
    p.action=p.allIn?`All in ${money(p.bet)}`:`Call ${money(putIn)}`;
    log(`${name} ${p.isHuman?'call':'calls'} ${money(putIn)}${p.allIn?' and is all in':''}.`);
  }
  else if(type==='raise'){
    to=Math.min(to,p.bet+p.chips);
    const wasOpen=G.currentBet===0;
    putIn=put(p,to-p.bet);
    const raiseBy=to-G.currentBet;
    if(raiseBy>=G.minRaise){G.minRaise=raiseBy; G.players.forEach(q=>{if(q!==p) q.acted=false})}
    if(to>G.currentBet){G.currentBet=to; G.aggressor=i}
    if(i===0) G.meRaised=true;
    p.action=p.allIn?`All in ${money(to)}`:(wasOpen?`Bet ${money(to)}`:`Raise ${money(to)}`);
    log(p.allIn?`${name} ${p.isHuman?'go':'goes'} all in for ${money(to)}.`:`${name} ${wasOpen?(p.isHuman?'bet':'bets'):(p.isHuman?'raise to':'raises to')} ${money(to)}.`);
  }
  p.acted=true;
  G.turn=findNext(i);
  return putIn;
}
// one-shot tricks and active charms, used on your turn
function useTrick(k){
  const me=human(); const i=R.tricks.indexOf(k); if(i<0||G.turn!==0) return false;
  if(k==='peek'){const opp=shuffle(live().filter(p=>!p.isHuman)); if(!opp.length) return false; opp[0].peekAll=true; log(`You sneak a look at ${opp[0].name}'s cards.`)}
  else if(k==='swap'){const j=me.hand[0].r<=me.hand[1].r?0:1; const c=draw(); c.order=0; me.hand[j]=c; log('A little sleight of hand.')}
  else if(k==='smoke'){const back=me.total; me.chips+=back; me.total=0; me.bet=0; log(`Smoke Bomb! You slip away with ${money(back)}.`); R.tricks.splice(i,1); applyAction(0,'fold'); return true}
  else if(k==='whiskey'){me.chips+=150; log('A shot of whiskey. +$150.')}
  else if(k==='spook'){G.spook=true; log('You give the table a cold stare.')}
  else if(k==='mirror'){G.mirror=2; log('You catch the deck in your mirror.')}
  R.tricks.splice(i,1); return true;
}
function useFlask(){if(!has('flask')||G.flaskUsed) return false; G.flaskUsed=true; G.reveal=true; log('A pull from the flask. Everything looks clear.'); return true}
function useDynamite(){if(!has('dynamite')||G.dynUsed||G.street!=='flop'||G.board.length!==3) return false; G.dynUsed=true; G.board=[draw(),draw(),draw()]; log('Dynamite! The flop is blown away and dealt again.'); return true}
function advanceStreet(){
  G.players.forEach(p=>{p.bet=0; p.acted=false; p.tell=''; if(!p.folded&&!p.allIn) p.action=''});
  G.currentBet=0; G.minRaise=G.bb; G.aggressor=-1;
  if(G.street==='preflop'){G.board.push(draw(),draw(),draw()); G.street='flop'; if(human().inHand&&!human().folded) G.sawFlop=true}
  else if(G.street==='flop'){G.board.push(draw()); G.street='turn'}
  else if(G.street==='turn'){G.board.push(draw()); G.street='river'}
  else return 'showdown';
  const canAct=live().filter(p=>!p.allIn).length;
  G.turn=canAct<=1?-1:findNext(G.dealer);
  return G.street;
}
// flips cards and applies river-redeal effects; returns list of special events
function revealShowdown(){
  G.street='showdown';
  const L=live(), pot=potTotal(), ev=[];
  const score=()=>L.forEach(p=>{p.score=evalHand(p.hand.concat(G.board)); p.handName=nameOf(p.score)});
  score();
  const ves=has('silver')?null:L.find(p=>p.boss==='vesper');
  if(ves&&!G.vesperUsed&&ves.total>=G.bb*3){
    const top=Math.max(...L.map(p=>p.score));
    if(ves.score<top){G.vesperUsed=true; G.board[4]=draw(); score(); log('Lady Vesper smiles and redeals the river.'); ev.push({type:'redeal',who:G.players.indexOf(ves),line:'Not tonight, darling.'})}
  }
  const me=L.includes(human())?human():null;
  if(me&&has('horseshoe')&&!G.horseUsed&&pot>=G.bb*8){
    const top=Math.max(...L.map(p=>p.score));
    if(me.score<top){G.horseUsed=true; G.board[4]=draw(); score(); log('Lucky Horseshoe! The river is redealt.'); ev.push({type:'horseshoe'})}
  }
  L.forEach(p=>{p.show=true; p.action=p.handName});
  return ev;
}
function resolveShowdown(){
  const L=live(), pot=potTotal(), won=new Map();
  for(const sp of pots()){
    const elig=sp.elig.filter(p=>L.includes(p)); if(!elig.length) continue;
    const top=Math.max(...elig.map(p=>p.score));
    let ws=elig.filter(p=>p.score===top);
    if(ws.length>1&&has('tie')&&ws.includes(human())) ws=[human()];
    const share=Math.floor(sp.amt/ws.length), rem=sp.amt-share*ws.length;
    ws.forEach(w=>won.set(w,(won.get(w)||0)+share));
    if(rem){let i=G.dealer; for(let k=0;k<nP();k++){i=(i+1)%nP(); if(ws.includes(G.players[i])){won.set(G.players[i],won.get(G.players[i])+rem); break}}}
  }
  const winners=[];
  won.forEach((amt,p)=>{
    p.chips+=amt; p.winner=true; p.result=`Wins ${money(amt)}`;
    winners.push({i:G.players.indexOf(p),amt});
    bestFive(p.hand.concat(G.board)).forEach(c=>G.winCards.add(c.id));
    log(`${p.isHuman?'You win':p.name+' wins'} ${money(amt)} with ${p.handName}.`);
  });
  return {pot,winners,showdown:true};
}
function resolveUncontested(){
  const p=live()[0], pot=potTotal();
  p.chips+=pot; p.winner=true; p.result=`Wins ${money(pot)}`;
  log(`${p.isHuman?'You take':p.name+' takes'} the ${money(pot)} pot.`);
  return {pot,winners:[{i:G.players.indexOf(p),amt:pot}],showdown:false};
}
// after chips move: knockouts, tilt, stats, challenge, outcome. returns events for the UI.
function finishHand(res){
  G.street='done'; G.turn=-1; G.lastPot=res.pot; G.tableHands++;
  G.lastWinners=res.winners.map(w=>w.i);
  const me=human(), bp=boss(), ev={kos:[],challenge:null,wind:false,bossLine:null};
  let myKo=0;
  // a minor outlaw busts the boss while you sat it out: the boss settles it the old way
  if(bp&&!bp.out&&bp.chips<=0&&!me.winner){
    const w=res.winners.filter(w=>!G.players[w.i].isHuman&&!G.players[w.i].bossDef&&G.players[w.i].chips>0).sort((a,b)=>b.amt-a.amt)[0];
    if(w){const v=G.players[w.i], amt=v.chips; bp.chips+=amt; v.chips=0; v.out=true; v.shot=true;
      ev.revenge={boss:G.players.indexOf(bp),victim:w.i,amt};
      log(`${bp.name} won't be cleaned out by a ${TIERS[v.tier].label.toLowerCase()}. ${v.name} is shot dead, and ${bp.name} takes the ${money(amt)}.`);
      ev.bossLine={i:G.players.indexOf(bp),text:bp.bossDef.lines.shoot||'Outside. Now.'}}
  }
  G.players.forEach((p,i)=>{
    if(!p.isHuman&&!p.out&&p.chips<=0){
      p.out=true; if(me.winner) myKo++;
      ev.kos.push(i);
      if(p.bossDef){log(`${p.name} is taken down. The bounty is yours.`); ev.bossLine={i,text:p.bossDef.lines.bust}}
      else {
        const g=Math.round(TIERS[p.tier].gold*goldMul());
        if(me.winner){R.gold+=g; G.koGold+=g; log(`${p.name} is tapped out. +${g} gold.`)} else log(`${p.name} is tapped out.`);
      }
    }
  });
  if(myKo&&has('bounty')){const b=(lvl('bounty')>=2?300:150)*myKo; me.chips+=b; log(`Bounty Hunter pays ${money(b)}.`)}
  ev.bonus=[];
  const bonus=(label,chips,gold)=>{if(chips){me.chips+=chips} if(gold){R.gold+=gold} ev.bonus.push({label,chips:chips||0,gold:gold||0}); log(`${label}: ${chips?money(chips):''}${chips&&gold?' and ':''}${gold?gold+' gold':''}.`)};
  if(has('shovel')&&ev.kos.length&&!me.out&&me.chips>0) bonus("Undertaker's Shovel",100*ev.kos.length,0);
  if(me.inHand&&me.sawFlopFlag!==false&&G.sawFlop&&has('tooth')) bonus('Gold Tooth',0,1);
  if(me.winner){
    const cat=me.show?handCat(me.score):-1;
    if(has('notches')) bonus('Notched Grip',0,lvl('notches')>=2?2:1);
    if(has('flushfever')&&cat>=5) bonus('Flush Fever',lvl('flushfever')>=2?400:200,0);
    if(has('pairpay')&&res.showdown&&cat===1) bonus('Two-Bit Pair',lvl('pairpay')>=2?120:60,0);
    if(has('bluffer')&&!res.showdown) bonus('Bluff Master',lvl('bluffer')>=2?120:60,0);
    if(has('sevens')){const n=G.board.filter(c=>c.r===7).length; if(n) bonus('Lucky Sevens',40*n,0)}
    if(has('deadhand')&&me.hand.length===2&&me.hand.every(c=>c.r===14||c.r===8)) bonus("Dead Man's Hand",Math.round(res.pot/2),0);
    if(has('streak')) bonus('Hot Streak',Math.min(300,50*(G.streak+1)),0);
    if(has('rattler')&&me.allIn) bonus('Rattlesnake',250,0);
    if(has('crown')&&cat>=4) bonus('Royal Crown',0,15);
  }
  G.players.forEach(p=>{
    if(p.isHuman||p.bossDef||p.out) return;
    if(p.tilt>0) p.tilt--;
    if(p.inHand&&!p.winner&&p.total>=Math.max(G.bb*4,p.startChips*0.35)){p.tilt=3; log(`${p.name} is on tilt.`)}
  });
  if(bp&&!bp.out&&bp.inHand&&!ev.bossLine){
    if(bp.winner&&res.pot>=G.bb*4&&Math.random()<0.6) ev.bossLine={i:G.players.indexOf(bp),text:pickLine(bp.bossDef.lines.win)};
    else if(!bp.winner&&bp.total>=G.bb*4&&Math.random()<0.6) ev.bossLine={i:G.players.indexOf(bp),text:pickLine(bp.bossDef.lines.lose)};
  }
  if(me.inHand){
    const st=meta.stats; st.hands++;
    if(me.winner){st.won++; G.streak++; if(res.pot>st.bigPot) st.bigPot=res.pot} else G.streak=0;
    if(me.show) st.showdowns++;
    const score=me.show?me.score:0;
    if(me.winner&&score>st.bestHand) st.bestHand=score;
    const e={won:me.winner,pot:res.pot,score,showdown:res.showdown&&me.show,streak:G.streak,pocket:me.hand.length>=2&&me.hand[0].r===me.hand[1].r,raised:G.meRaised,ko:myKo};
    if(G.challenge&&!G.challengeDone&&G.challenge.test(e)){
      G.challengeDone=true; const g=Math.round(G.challenge.gold*heatGoldMul()); R.gold+=g; st.challenges++;
      log(`Challenge complete: ${G.challenge.text}. +${g} gold.`); ev.challenge=g;
    }
  }
  if(me.chips<=0){
    const winds=(has('wind')?(lvl('wind')>=2?2:1):0)+(G.tempWind?1:0);
    if(G.windUsed<winds){G.windUsed++; me.chips=Math.round(G.start/4/10)*10; log('Second Wind. You claw back to your feet.'); ev.wind=true}
    else G.outcome='lose';
  }
  if(G.outcome!=='lose'&&bp&&bp.out) G.outcome='win';
  G.lastHandLog=G.handLog.slice();
  saveMeta();
  return ev;
}

/* ================= AI ================= */
// returns {type,to,bluff,tell,line}
function aiDecide(i){
  const p=G.players[i], s=STYLES[p.style], T=p.tier?TIERS[p.tier]:{noise:0.01,sims:240,adj:0};
  const opps=live().length-1, me=human();
  const tw=k=>p.boss===k&&!has('silver');
  const pin=(tw('snake')&&me.inHand&&!me.folded)?me.hand[0]:null;
  const heat=R.heat||0;
  const noise=heat>=2?T.noise*0.5:T.noise;
  let eq=equity(p.hand,G.board,opps,opps>4?Math.min(T.sims,140):T.sims,pin);
  const trueEq=eq;
  eq=Math.max(0,Math.min(1,eq+(Math.random()-0.5)*2*noise));
  const toCall=G.currentBet-p.bet, pot=potTotal();
  const odds=toCall>0?toCall/(pot+toCall):0;
  const fair=1/(opps+1), r=Math.random(), tilt=p.tilt>0;
  const pre=G.street==='preflop'&&opps>=3&&p.tier!=='d'?0.03:0;
  const adj=s.adj+T.adj+(tw('pete')?-0.04:0)+(tilt?-0.1:0)+(heat>=2?0.02:0)+pre;
  const bluff=s.bluff+(tw('pete')?0.16:0)+(tilt?0.12:0);
  const aggr=s.aggr+(tw('banker')?0.25:0)+(p.bossDef?0.05:0)+(tilt?0.3:0);
  const sizeMul=tw('banker')?1.6:1;
  const strongBar=Math.min(0.86,fair*1.6)+adj;
  const canRaise=p.chips>toCall;
  const raiseTo=mult=>Math.min(p.bet+p.chips, G.currentBet+Math.max(G.minRaise, Math.round((pot+toCall)*mult*sizeMul/10)*10));
  const bigCall=toCall>p.chips*0.5;
  const R_=(to,isBluff)=>{
    const d={type:'raise',to,bluff:isBluff};
    if(p.bossDef){
      if(has('tells')||Math.random()<0.6){
        const honest=has('tells')||Math.random()<0.75;
        const strong=isBluff?!honest:honest;
        d.tell=strong?p.bossDef.tellS:p.bossDef.tellB;
      }
      if(Math.random()<0.35) d.line=pickLine(p.bossDef.lines.raise);
    }
    return d;
  };
  const tame=(p.tier==='d'||p.tier==='g')&&me.inHand&&!me.folded;
  if(tame&&G.spook&&G.aggressor===0&&toCall>0) return {type:'fold'};
  if(tame&&has('badge')){
    if(toCall===0) return eq>fair*1.3+adj&&canRaise&&Math.random()<.2?{type:'check'}:{type:'check'};
    return eq>odds+adj*0.6?{type:'call'}:{type:'fold'};
  }
  if(canRaise&&eq>strongBar&&r<aggr+0.2){
    if(eq>0.82&&Math.random()<0.25) return R_(p.bet+p.chips,false);
    return R_(raiseTo(0.5+Math.random()*0.6),false);
  }
  if(toCall===0){
    if(canRaise&&(r<bluff||(eq>fair*1.25+adj&&r<aggr*0.6))) return R_(raiseTo(0.4+Math.random()*0.4),trueEq<fair);
    return {type:'check'};
  }
  let callBar=odds+adj*0.6+(bigCall?0.06:0);
  if(has('face')&&G.aggressor===0) callBar+=lvl('face')>=2?0.14:0.07;
  if(eq>callBar||tw('iron')) return {type:'call'};
  if(canRaise&&!bigCall&&r<bluff*0.5) return R_(raiseTo(0.7),true);
  return {type:'fold'};
}
