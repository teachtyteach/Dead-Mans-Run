const fs=require('fs'),vm=require('vm');
const ctx={console,Math,JSON,Set,Map,performance:{now:()=>Date.now()}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../src/data.js','utf8')+'\n'+fs.readFileSync(__dirname+'/../src/engine.js','utf8')+`
;globalThis.T={G,setupTable,startHand,applyAction,advanceStreet,revealShowdown,resolveShowdown,resolveUncontested,finishHand,aiDecide,live,potTotal,pots,serializeTable,restoreTable,setR:r=>{R=r},getR:()=>R,evalHand,nameOf,pk,useTrick,useFlask,useDynamite};`,ctx);
const T=ctx.T; let hands=0,tables=0,bossWins=0,losses=0,errs=0;
const allCharms=['notches','tooth','flushfever','pairpay','bluffer','sevens','deadhand','streak','marked','flask','dynamite','badge','rattler','shovel','crown','saddle','almanac','hawk','deep','comped','tie','face','golden','tells','steady','bartab','bond','mech','wind','horseshoe','rabbit','cashout','bounty','teller','silver','ace'];
for(let run=0;run<400;run++){
  const level=1+run%8;
  const charms=allCharms.filter(()=>Math.random()<0.3);
  T.setR({level,gold:0,charms,lv:{},deeds:['stake','satchel'].filter(()=>Math.random()<.5),tricks:[],heat:run%4,temp:Math.random()<.3?{chips:250,wind:true}:null,curse:['blind','heavy','short','crowd',null][run%5]});
  T.setupTable(); tables++;
  const G=T.G; const total0=()=>G.players.reduce((s,p)=>s+p.chips,0);
  let guard=0;
  while(!G.outcome&&guard++<400){
    const before=total0();
    T.startHand(); hands++;
    let steps=0;
    while(true){
      if(steps++>500) throw new Error('stuck');
      if(T.live().length===1){const res=T.resolveUncontested(); T.finishHand(res); break}
      if(G.turn===-1){const r=T.advanceStreet(); if(r==='showdown'){T.revealShowdown(); const res=T.resolveShowdown(); T.finishHand(res); break} continue}
      const p=G.players[G.turn];
      if(p.isHuman&&Math.random()<.08){const R=T.getR(); R.tricks=[['peek','swap','smoke','whiskey','spook','mirror'][Math.floor(Math.random()*6)]]; const before2=G.turn; if(T.useTrick(R.tricks[0])&&G.turn!==before2) continue}
      if(p.isHuman&&Math.random()<.05){T.useFlask(); T.useDynamite()}
      if(p.isHuman){const toCall=G.currentBet-p.bet; const x=Math.random();
        if(x<0.15) T.applyAction(G.turn,'fold'); else if(x<0.75) T.applyAction(G.turn,toCall>0?'call':'check'); else T.applyAction(G.turn,'raise',G.currentBet+G.minRaise+Math.floor(Math.random()*5)*G.bb);}
      else {const d=T.aiDecide(G.turn); T.applyAction(G.turn,d.type,d.to)}
    }
    const after=total0();
    // allowed differences: bartab, bounty hunter, second wind add chips
    if(after<before-0.5){errs++; if(errs<5) console.log('chips lost',before,after,'level',level)}
    G.players.forEach(p=>{if(p.chips<0||!Number.isFinite(p.chips)){errs++;console.log('bad chips',p)}});
    if(Math.random()<0.05){const snap=JSON.parse(JSON.stringify(T.serializeTable())); T.restoreTable(snap)}
  }
  if(G.outcome==='win') bossWins++; else if(G.outcome==='lose') losses++;
}
console.log({tables,hands,bossWins,losses,errs});
// side pot sanity
console.log(T.nameOf(T.evalHand([{r:14,s:0},{r:13,s:0},{r:12,s:0},{r:11,s:0},{r:10,s:0},{r:2,s:1},{r:3,s:2}])));
