const SUITS=['♠︎','♥︎','♦︎','♣︎'];
const RN={10:'10',11:'J',12:'Q',13:'K',14:'A'};
const PL={2:'Twos',3:'Threes',4:'Fours',5:'Fives',6:'Sixes',7:'Sevens',8:'Eights',9:'Nines',10:'Tens',11:'Jacks',12:'Queens',13:'Kings',14:'Aces'};
const SG={2:'Two',3:'Three',4:'Four',5:'Five',6:'Six',7:'Seven',8:'Eight',9:'Nine',10:'Ten',11:'Jack',12:'Queen',13:'King',14:'Ace'};
const SUITN=['spades','hearts','diamonds','clubs'];
const STYLES={
  tight:{adj:0.08,aggr:0.35,bluff:0.03},
  reckless:{adj:-0.07,aggr:0.8,bluff:0.16},
  bluffer:{adj:-0.02,aggr:0.6,bluff:0.28},
  stubborn:{adj:-0.13,aggr:0.2,bluff:0.03},
  sharp:{adj:0.01,aggr:0.55,bluff:0.09}
};
const TIERS={
  d:{label:'Drifter',chips:600,noise:0.14,sims:70,adj:-0.05,styles:['stubborn','reckless','bluffer'],gold:5},
  g:{label:'Gunhand',chips:1000,noise:0.06,sims:150,adj:0,styles:['tight','reckless','bluffer','stubborn','sharp'],gold:10},
  v:{label:'Veteran',chips:1200,noise:0.02,sims:240,adj:0.01,styles:['sharp','sharp','tight'],gold:15}
};
const LINEUPS=[
  ['d','d'],
  ['d','d','g'],
  ['d','d','g','g'],
  ['d','g','g','g'],
  ['d','g','g','g'],
  ['d','g','g','v'],
  ['g','g','g','v','v'],
  ['g','g','v','v','v']
];
const BBS=[20,20,30,30,40,50,60,80];
const START=1000;
// the difficulty curve: a fair first fight, a real one by the end of the trail
const BOSS_CHIPS=[800,1000,1150,1300,1450,1600,1700,1850];
// bosses read the table better the further down the trail you ride
const BOSS_NOISE=[0.18,0.13,0.10,0.07,0.05,0.04,0.03,0.02];
const EARLY_EDGE=[500,400,300,200,200,200,200,300];
const BOSSES=[
  {key:'pete',font:"'Ranchers'",fs:1.0,name:'Whiskey Pete',title:'The Drunkard',twist:'Bluffs constantly. Half the time he has nothing.',style:'bluffer',hat:'cowboy',fh:'beard',
    tellB:'Pete taps his chips and grins.',tellS:'Pete goes quiet and sets down his glass.',
    lines:{shoot:'Hic. Nobody... nobody drinks my money but me.',intro:'Pull up a chair, friend. Drinks are on you.',win:['Ha! Another round!','That one goes on my tab.','Lady Luck loves a drunk.'],lose:['Aw, horse feathers.','That ain\'t fair, I was gonna win that.'],raise:['Let\'s make it interesting.','You scared? I\'m scared.'],bust:'Well... somebody pour me one more.'}},
  {key:'ma',font:"'Berkshire Swash'",fs:1.0,name:'Ma Spurlock',title:'The Landlady',twist:'Charges an ante. Everyone but her pays every hand.',style:'tight',fem:true,hat:'flat',
    tellB:'Ma smooths her apron.',tellS:'Ma stacks her chips real neat.',
    lines:{shoot:"Rent's overdue, darlin'. Permanently.",intro:'Rent\'s due every hand, sugar.',win:['That covers the rent.','Thank you kindly.','House always collects.'],lose:['Well, I never.','Don\'t get comfortable.'],raise:['Pay up or ride out.','My table, my rules.'],bust:'Fine. Take the room. Take the whole dang saloon.'}},
  {key:'iron',font:"'Alfa Slab One'",fs:0.92,name:'Iron Jack Rourke',title:'The Wall',twist:'Never folds. Not once.',style:'sharp',hat:'cowboy',fh:'stache',unlock:1,
    tellB:'Jack cracks his knuckles.',tellS:'Jack doesn\'t blink.',
    lines:{shoot:'Wrong table.',intro:'I don\'t fold. Never have. Never will.',win:['Told you.','Walls don\'t move.','Next.'],lose:['Lucky.','I\'m still sitting here.'],raise:['Call that.','More.'],bust:'...Huh.'}},
  {key:'under',font:"'Grenze Gotisch'",fs:1.08,name:'The Undertaker',title:'The Gravedigger',twist:'Blinds rise every 5 hands instead of 10.',style:'sharp',hat:'top',fh:'none',
    tellB:'The Undertaker hums a hymn.',tellS:'The Undertaker measures you with his eyes.',
    lines:{shoot:"I'll measure you myself.",intro:'I already measured you for a box.',win:['Another one for the ground.','Rest easy.','Clock\'s ticking.'],lose:['Death is patient.','A temporary reprieve.'],raise:['The hour grows late.','Dig deeper.'],bust:'Bury me face down.'}},
  {key:'snake',font:"'Smokum'",fs:1.22,name:'Snake Crane',title:'The Card Sharp',twist:'Peeks at your first hole card every hand.',style:'sharp',hat:'flat',fh:'goatee',
    tellB:'Snake licks his lips.',tellS:'Snake slides his hat brim down.',
    lines:{shoot:"Saw that one comin'. You didn't.",intro:'Nice cards. Real nice. Oh, did I say that out loud?',win:['Saw that coming.','I know what you\'re holding.','Ssssweet.'],lose:['You got lucky, friend.','Didn\'t see THAT one.'],raise:['I know what you\'ve got.','Go on, call.'],bust:'You cheated. I KNOW cheating.'}},
  {key:'banker',font:"'Cinzel Decorative'",fs:0.86,name:'Banker Ellsworth',title:'The Money',twist:'Sits with a mountain of chips and bets big.',style:'sharp',hat:'bowler',fh:'mutton',unlock:2,
    tellB:'Ellsworth checks his pocket watch.',tellS:'Ellsworth folds his hands on his belly.',
    lines:{shoot:'Consider your account closed.',intro:'I can lose all night. Can you?',win:['Compound interest.','Deposited.','Money finds money.'],lose:['A rounding error.','I have more.'],raise:['Let\'s raise the stakes.','Can you afford this?'],bust:'This bank... is closed.'}},
  {key:'vesper',font:"'Pinyon Script'",fs:1.32,name:'Lady Vesper',title:'The Charmed',twist:'Once per saloon, redeals the river when she is losing.',style:'sharp',fem:true,hat:'none',
    tellB:'Vesper twirls her necklace.',tellS:'Vesper stops smiling.',
    lines:{shoot:'Sorry, sugar. Luck ran out.',intro:'Fortune favors me, darling. Always has.',win:['Charmed, I\'m sure.','Fate is a lady.','Kiss your chips goodbye.'],lose:['How rude.','Luck is just resting.'],raise:['Feeling lucky?','Fate says raise.'],bust:'Well. I suppose even luck runs dry.'}},
  {key:'bicah',font:"'Pirata One'",fs:1.14,name:'Bicah Mell',title:'The Rat',twist:'Keeps a card up his sleeve. Every other hand, he plays three.',style:'sharp',hat:'cowboy',fh:'stache',
    tellB:'Bicah grins way too wide.',tellS:"Bicah stops talking. That's never good.",
    lines:{shoot:"Ain't nobody takes from Bicah Mell. Nobody!",intro:"Well, well. Pull up a chair, cowpoke. I'm the only honest man left out here.",win:['Ha! Survivor, me.','Told ya, cowpoke.','Loyalty pays. Mine, mostly.',"Not my fault you're slow."],lose:['That was a setup!','Somebody ratted me out.','Real cute, cowpoke.'],raise:['Go on, call me a liar.','I never bluff. Never.','You scared, cowpoke?'],bust:"This ain't over. I'll be back. I always come back."}}
];
const CHALLENGES=[
  {key:'flush',text:'Win a hand with a flush or better',gold:20,test:e=>e.won&&e.score>=pk(5)},
  {key:'big',text:'Win a pot of 1,000 or more',gold:15,test:e=>e.won&&e.pot>=1000},
  {key:'weak',text:'Win a showdown with a pair or worse',gold:15,test:e=>e.won&&e.showdown&&e.score<pk(2)},
  {key:'streak',text:'Win 3 hands in a row',gold:15,test:e=>e.streak>=3},
  {key:'pocket',text:'Win with a pocket pair',gold:15,test:e=>e.won&&e.pocket},
  {key:'bluff',text:'Win a pot by making everyone fold',gold:10,test:e=>e.won&&!e.showdown&&e.raised},
  {key:'ko',text:'Tap out an outlaw yourself',gold:15,test:e=>e.ko>0&&e.won}
];
const EVENTS=['shark','doctor','bandits','strongbox','peddler','rest','tent'];
const NAMES=[['Etta Boone',1],['Clem Hargrove',0],['Ro Pike',1],['Ezekiel Marsh',0],['Hank Tolliver',0],['Josie Lark',1],['Amos Reddick',0],['Lula Sweeney',1],['Virgil Oakes',0],['Cora Whitlock',1],['Otis Bramble',0],['Wade Kittredge',0],['Mae Calloway',1],['Jeb Fenwick',0],['Gus Pettibone',0],['Nell Ashby',1],['Bo Tanner',0],['Ruth Calder',1],['Cyrus Vane',0],['Hattie Bell',1],['Moses Drury',0],['Tom Yates',0]];
const TOWNS=['Dry Creek','Copper Bend','Hollow Rock','Red Mesa',"Cutter's Gulch",'Silver Fork','Bitterwater',"Graves End"];
const CHARMS={
  almanac:{name:"Gambler's Almanac",icon:'✦',desc:'Shows your win chance and pot odds on every decision.',price:30,tier:0},
  meter:{name:'Gut Feeling',icon:'♥',desc:'A meter shows how strong your hand is right now.',price:25,tier:0},
  hawk:{name:'Hawk Eye',icon:'◉',desc:'See one card from a random opponent each hand.',price:60,tier:0,up:'See cards from two opponents each hand.'},
  deep:{name:'Deep Pockets',icon:'$',desc:'Start every saloon with 300 extra chips.',price:45,tier:0,up:'Start every saloon with 600 extra chips.'},
  comped:{name:'Comped',icon:'½',desc:'You pay half price on blinds and antes.',price:40,tier:0,up:'You pay no blinds or antes at all.'},
  tie:{name:'Tiebreaker',icon:'=',desc:'You win every tied pot outright.',price:45,tier:0},
  face:{name:'Poker Face',icon:'◐',desc:'Opponents fold more often when you bet.',price:55,tier:0,up:'Opponents fold far more often when you bet.'},
  golden:{name:'Golden Touch',icon:'✶',desc:'Earn 50% more gold from bounties and knockouts.',price:40,tier:0,up:'Earn double gold from bounties and knockouts.'},
  tells:{name:'Tell Reader',icon:'◎',desc:'Boss tells are always honest, and you see them on every bet.',price:40,tier:0},
  steady:{name:'Steady Hand',icon:'≡',desc:'Blinds rise half as often.',price:35,tier:0},
  bartab:{name:'Bar Tab',icon:'¢',desc:'Get 100 free chips every time the blinds rise.',price:30,tier:0,up:'Get 250 free chips every time the blinds rise.'},
  bond:{name:'Savings Bond',icon:'§',desc:'Earn 10% interest on your gold after each saloon, up to 20.',price:35,tier:0,up:'Earn 20% interest, up to 40.'},
  mech:{name:'Card Mechanic',icon:'⇄',desc:'Swap one hole card before the flop, once per hand.',price:70,tier:1,up:'Swap both hole cards before the flop.'},
  wind:{name:'Second Wind',icon:'↺',desc:'Once per saloon, survive running out of chips with a quarter stack.',price:65,tier:1,up:'Survive it twice per saloon.'},
  horseshoe:{name:'Lucky Horseshoe',icon:'∩',desc:'Once per saloon, the river is redealt when you would lose a big pot.',price:70,tier:1},
  rabbit:{name:"Rabbit's Foot",icon:'❦',desc:'You are dealt pocket pairs far more often.',price:55,tier:1},
  cashout:{name:'Cashout',icon:'¤',desc:'Earn 1 gold per 100 chips you hold when you take down the boss.',price:45,tier:1},
  bounty:{name:'Bounty Hunter',icon:'✕',desc:'Collect 150 chips each time you knock a player out.',price:55,tier:2,up:'Collect 300 chips per knockout.'},
  teller:{name:'Fortune Teller',icon:'☾',desc:'See the next community card before it lands.',price:110,tier:2},
  silver:{name:'Silver Tongue',icon:'⁂',desc:'Talk every boss out of their special twist.',price:100,tier:2},
  ace:{name:'Ace in the Sleeve',icon:'A',desc:'Once per saloon, swap a hole card for an ace.',price:75,tier:2},
  notches:{name:'Notched Grip',icon:'†',desc:'Earn 1 gold every hand you win.',price:35,tier:0,up:'Earn 2 gold every hand you win.'},
  tooth:{name:'Gold Tooth',icon:'∩',desc:'Earn 1 gold every hand you play to the flop.',price:40,tier:0},
  flushfever:{name:'Flush Fever',icon:'♦',desc:'Win with a flush or better and the house pays 200 chips.',price:40,tier:0,up:'The house pays 400 chips.'},
  pairpay:{name:'Two-Bit Pair',icon:'≡',desc:'Win a showdown with exactly a pair and the house pays 60 chips.',price:30,tier:0,up:'The house pays 120 chips.'},
  bluffer:{name:'Bluff Master',icon:'▲',desc:'Win a pot with no showdown and the house pays 60 chips.',price:40,tier:0,up:'The house pays 120 chips.'},
  sevens:{name:'Lucky Sevens',icon:'7',desc:'Win a hand and every 7 on the board pays you 40 chips.',price:30,tier:0},
  deadhand:{name:"Dead Man's Hand",icon:'♠',desc:'Win holding only aces and eights and the house matches half the pot.',price:50,tier:0},
  streak:{name:'Hot Streak',icon:'♨',desc:'Each win in a row pays 50 more chips than the last, up to 300.',price:45,tier:0},
  marked:{name:'Marked Cards',icon:'◈',desc:'See the suit of every face-down card at the table.',price:60,tier:1},
  flask:{name:'Whiskey Flask',icon:'⬮',desc:'Once per saloon, see every opponent\'s cards for one hand.',price:55,tier:1},
  dynamite:{name:'Dynamite',icon:'✷',desc:'Once per saloon, blow up the flop and deal a new one.',price:60,tier:1},
  tongue:{name:'Silver Tongue',icon:'❝',desc:'Your talk lands more often and backfires less. Your quick draw gets faster.',price:40,tier:1},
  badge:{name:"Sheriff's Badge",icon:'★',desc:'Drifters and gunhands won\'t raise into you. They call instead.',price:55,tier:1},
  rattler:{name:'Rattlesnake',icon:'∿',desc:'Win a hand after going all in and the house pays 250 chips.',price:45,tier:1},
  shovel:{name:"Undertaker's Shovel",icon:'⚔',desc:'Every outlaw tapped out at your table pays you 100 chips.',price:60,tier:2},
  crown:{name:'Royal Crown',icon:'♛',desc:'Win with a straight or better and earn 15 gold.',price:55,tier:2},
  saddle:{name:'Saddlebags',icon:'⌂',desc:'Carry one more charm.',price:70,tier:2}
};
const NUMERALS=Array.from({length:40},(_,n)=>{let x=n+1,s='';[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].forEach(([v,r])=>{while(x>=v){s+=r;x-=v}});return s});
// Wanted levels: each one adds a rule and stacks with the ones before it. +10% gold per level.
const HEAT=[
  {name:'Fresh Rider',desc:'The standard run.'},
  {name:'Wanted',desc:'Bosses carry 25% more chips.'},
  {name:'Dead or Alive',desc:'Every outlaw plays sharper.'},
  {name:'Hot Trail',desc:'Blinds start 50% higher.'},
  {name:'Price on Your Head',desc:'The store charges 25% more. Win it for the Outlaw Gold deck.'},
  {name:'Bounty Hunters',desc:'A veteran bounty hunter sits at every table.'},
  {name:'Poker Faces',desc:'Bosses show no tells, unless you carry Tell Reader.'},
  {name:'Lean Times',desc:'Start every saloon with 20% fewer chips.'},
  {name:"Dead Man's Run",desc:'Blinds rise every 7 hands. Win it for the Black Hat deck.'}
];
// what each boss says when you meet again: beat = you took them down before, won = they put you in the ground
const BOSS_MEM={
  pete:{beat:"You again! You cleaned me out last time. Not tonight, friend.",won:"Back for another round? I'm buying. You're paying."},
  ma:{beat:"You owe me for last time, sugar. With interest.",won:"Back so soon? Your room's still warm."},
  iron:{beat:"Last time was luck. Walls don't fall twice.",won:"You again. Same result."},
  under:{beat:"I had your box measured. You wasted good pine.",won:"Still got your measurements on file."},
  snake:{beat:"Took me once. I've studied every card you played since.",won:"I remember your tells. Every one."},
  banker:{beat:"You made a withdrawal last time. The bank remembers.",won:"Your account's still overdrawn, friend."},
  vesper:{beat:"Fortune smiled on you once, darling. She's fickle.",won:"Back for more heartbreak?"},
  bicah:{beat:"You. Nobody beats Bicah Mell twice. Nobody!",won:"The cowpoke crawls back. Good. I need the money."}};
const ENDING=[
  {k:'Graves End · Last hand',t:"Bicah Mell's chips spill across the felt. The room goes very quiet.",art:'bicahdown'},
  {k:'Eight saloons',t:'Eight bosses. Eight wanted posters. Every one stamped PAID.',art:'posters'},
  {k:'At dawn',t:'The stranger cashes out, tips the barkeep, and rides east.',art:'rider'},
  {k:'',t:'Nobody ever learned their name.<br>But every table in the territory knows the story.',art:'end'}];
const TIER_NOTE={1:'Beat Iron Jack Rourke to unlock',2:'Beat Banker Ellsworth to unlock'};
const CURSES={
  blind:{name:'Blindfold',icon:'⊘',desc:'Your cards stay hidden until the flop next saloon.',gold:45},
  heavy:{name:'Heavy Blinds',icon:'↑',desc:'Blinds start doubled next saloon.',gold:40},
  short:{name:'Short Stack',icon:'↓',desc:'Start the next saloon with a third fewer chips.',gold:40},
  crowd:{name:'Crowded House',icon:'+',desc:'An extra gunhand joins the next table.',gold:35}
};
const FULL=[]; for(let r=2;r<=14;r++) for(let s=0;s<4;s++) FULL.push({r,s,id:r*4+s});
const CHAPTER_SUB=['wherein our rider sits down with a drunk','wherein the landlady collects her rent','wherein a man refuses to fold','wherein the clock runs out','wherein a cheat shows his hand','wherein money talks','wherein luck wears a dress','wherein the rat shows his face'];
const HAND_RANKS=[['Royal Flush','A K Q J 10, same suit'],['Straight Flush','Five in a row, same suit'],['Four of a Kind','Four cards of one rank'],['Full House','Three of a kind plus a pair'],['Flush','Any five of one suit'],['Straight','Five ranks in a row'],['Three of a Kind','Three cards of one rank'],['Two Pair','Two different pairs'],['Pair','Two cards of one rank'],['High Card','Nothing else, highest card plays']];
const HAND={"_space":18,"a":{"w":29,"d":"M0 0 C5 -8 13 -22 21 -28 C15 -31 5 -28 3 -17 C1 -7 6 -1 11 -2 C16 -3 19 -14 21.5 -29 C20 -18 19.5 -5 21.5 -1.5 C23 1 26 1 29 0"},"c":{"w":22,"d":"M0 0 C6 -9 12 -20 17 -27 C18 -28.5 18 -30 16.5 -30 C10 -30 4 -23 4 -14 C4 -5 9 -1 14 -1 C17 -1 20 -1 22 0"},"d":{"w":29,"d":"M0 0 C5 -8 12 -22 20 -28 C14 -31 5 -27 3 -16 C1 -6 7 -1 12 -3 C16 -5 19 -14 22 -30 C24 -44 26 -60 27 -68 C25 -50 22 -22 22 -6 C22 -1 25 1 29 0"},"e":{"w":21,"d":"M0 0 C6 -3 15 -11 17 -19 C18 -25 13 -28 9 -25 C3 -20 3 -7 8 -3 C12 0 17 1 21 0"},"h":{"w":29,"d":"M0 0 C6 -15 12 -40 14 -56 C15 -66 10 -70 8 -62 C6 -50 5 -20 5 0 C6 -14 10 -26 16 -28 C21 -29 22 -24 21 -16 C20 -9 20 -3 22 -1 C24 1 27 1 29 0"},"i":{"w":15,"d":"M0 0 C3 -8 7 -22 9 -30 C8 -20 7 -8 8 -3 C9 0 12 1 15 0","extra":["M9 -42 C9.5 -42 10 -41.5 10 -41"]},"k":{"w":26,"d":"M0 0 C6 -15 12 -40 14 -56 C15 -66 10 -70 8 -62 C6 -50 5 -20 5 0 C6 -14 10 -27 17 -29 C22 -30 22 -22 15 -19 C12 -18 10 -17 9 -17 C14 -14 16 -4 19 -1 C21 1 24 1 26 0"},"l":{"w":14,"d":"M0 0 C6 -15 12 -40 14 -56 C15 -66 10 -70 8 -62 C6 -50 5 -20 6 -6 C7 -1 10 1 14 0"},"n":{"w":27,"d":"M0 0 C2 -10 4 -24 6 -28 C6 -18 5 -8 5 0 C6 -14 9 -26 14 -28 C19 -29 20 -24 19 -16 C18 -9 18 -3 20 -1 C22 1 25 1 27 0"},"o":{"w":24,"exitY":-24,"d":"M0 0 C5 -8 10 -22 16 -28 C10 -31 3 -25 3 -15 C3 -6 8 -1 13 -2 C18 -4 20 -14 19 -22 C18 -28 14 -30 13 -27 C15 -25 19 -24 24 -24"},"p":{"w":24,"d":"M0 0 C3 -10 6 -24 7 -30 C7 -10 6 10 6 32 C6 10 7 -20 14 -28 C19 -31 22 -25 20 -14 C18 -5 12 -1 7 -3 C12 -2 18 0 24 0"},"r":{"w":23,"d":"M0 0 C3 -10 6 -24 8 -30 C11 -28 14 -27 17 -29 C16 -20 15 -8 16 -2 C17 0 20 1 23 0"},"s":{"w":20,"d":"M0 0 C4 -10 9 -22 11 -30 C15 -23 19 -13 18 -7 C17 -2 12 0 7 -1 C4 -2 3 -4 4 -5 C8 -3 13 0 20 0"},"t":{"w":16,"d":"M0 0 C6 -18 10 -40 12 -52 C10 -36 9 -16 9 -6 C9 -1 12 1 16 0","extra":["M3 -31 C8 -31 13 -32 18 -32"]},"u":{"w":26,"d":"M0 0 C2 -10 4 -24 5 -30 C4 -20 3 -8 6 -3 C9 1 14 -2 16 -10 C17 -18 18 -26 18 -30 C17 -20 17 -6 19 -2 C21 1 24 1 26 0"},"v":{"w":24,"exitY":-27,"d":"M0 0 C3 -10 5 -24 6 -30 C7 -20 9 -8 11 0 C14 -10 18 -22 20 -30 C21 -32 23 -30 21 -28 C22 -27 23 -27 24 -27"},"w":{"w":34,"exitY":-26,"d":"M0 0 C2 -10 4 -24 5 -30 C4 -20 3 -8 6 -3 C9 1 13 -2 15 -10 C15 -2 19 1 22 -3 C25 -8 26 -20 26 -29 C27 -31 29 -29 28 -27 C30 -26 32 -26 34 -26"},"y":{"w":26,"d":"M0 0 C2 -10 4 -24 5 -30 C4 -20 3 -8 6 -3 C9 1 14 -2 16 -10 C17 -18 18 -26 18 -30 C17 -10 17 10 15 22 C13 32 8 33 7 26 C6 18 14 6 20 2 C22 1 24 0 26 0"},"'":{"w":8,"join":false,"d":"M5 -66 C5 -62 4 -58 2 -54"},"D":{"w":44,"d":"M10 -60 C13 -46 12 -22 10 -6 C9 0 3 2 1 -2 C0 -5 4 -6 9 -4 C14 -2 20 0 26 -2 C40 -8 46 -26 42 -42 C38 -58 22 -66 9 -62 C3 -60 0 -55 4 -53"},"C":{"w":34,"d":"M24 -50 C26 -58 33 -63 31 -57 C29 -63 22 -65 16 -62 C6 -57 0 -44 1 -28 C2 -12 10 -2 20 -1 C26 0 30 0 34 0"},"H":{"w":36,"d":"M8 -60 C9 -44 8 -20 4 0 M32 -62 C30 -44 28 -20 28 -6 C28 -1 31 1 36 0","extra0":"M1 -30 C12 -34 24 -32 36 -35"},"R":{"w":36,"d":"M7 -60 C9 -44 8 -20 5 0 M6 -58 C18 -66 34 -62 32 -48 C30 -36 16 -32 8 -34 C16 -26 22 -8 27 -2 C29 1 32 1 36 0"},"M":{"w":44,"d":"M2 0 C6 -20 10 -44 12 -62 C14 -44 18 -24 21 -10 C25 -26 31 -48 35 -62 C35 -40 34 -18 35 -6 C36 -1 39 1 44 0"},"S":{"w":34,"d":"M33 -55 C31 -63 20 -65 15 -59 C10 -52 18 -45 25 -39 C33 -31 33 -17 27 -9 C21 -1 9 -1 4 -6 C2 -9 4 -12 8 -10"},"G":{"w":34,"d":"M30 -54 C30 -62 22 -64 16 -62 C6 -58 0 -42 1 -26 C2 -11 11 -3 18 -4 C24 -5 27 -14 28 -24 C27 -10 26 4 23 16 C20 28 12 32 10 26 C8 19 20 6 28 2 C30 1 32 0 34 0"},"B":{"w":36,"d":"M9 -60 C11 -44 10 -20 7 0 M6 -58 C18 -66 32 -62 30 -50 C28 -40 16 -36 10 -36 C24 -36 34 -28 32 -16 C30 -4 18 0 8 -2 C14 0 26 0 36 0"},"F":{"w":34,"d":"M0 -60 C12 -65 28 -61 42 -66 M22 -62 C20 -44 18 -22 14 -5 C12 2 5 2 3 -2","extra0":"M8 -34 C13 -34 18 -35 23 -36"},"E":{"w":36,"d":"M30 -56 C28 -64 14 -64 12 -54 C10 -46 20 -38 26 -38 C12 -38 2 -30 3 -18 C4 -6 14 -1 24 -2 C28 -1 32 0 36 0"}};

const TRICKS={
  peek:{name:'Peek',icon:'\u2299',desc:'See one opponent\'s whole hand.',price:15},
  swap:{name:'Sleight of Hand',icon:'⇄',desc:'Swap your lower hole card for a fresh one.',price:20},
  smoke:{name:'Smoke Bomb',icon:'≈',desc:'Fold and take back every chip you put in this hand.',price:20},
  whiskey:{name:'Shot of Whiskey',icon:'▽',desc:'Gain 150 chips right now.',price:15},
  spook:{name:'Spook',icon:'✵',desc:'Drifters and gunhands fold to your next bet this hand.',price:25},
  mirror:{name:"Sharp's Mirror",icon:'◑',desc:'See the next two community cards.',price:30}
};
const DEEDS={
  satchel:{name:'Bigger Satchel',desc:'Carry one more charm for the rest of the run.',price:70},
  credit:{name:'Line of Credit',desc:'Everything in the store costs 20% less.',price:60},
  stake:{name:'Grubstake',desc:'Start every saloon with 200 extra chips.',price:65},
  belt:{name:'Bandolier',desc:'Carry one more trick.',price:50},
  dealer:{name:'Friendly Clerk',desc:'Rerolls cost only 5 gold.',price:45}
};

/* ---- chapter cards: a few lines of dime-novel narration for each town ---- */
const CHAPTER_TEXT=[
  "Dry Creek ain't seen rain in three years, but the whiskey never runs out. The man at the back table has been drunk since spring, and somehow he's still winning.",
  "Copper Bend is one long street, and Ma Spurlock owns every door on it. Out here the rent comes due every hand.",
  "In Hollow Rock they tell you about a man who has never folded. They tell you twice, because nobody believes it the first time.",
  "The sun sets red over the mesa and the undertaker is already outside, measuring. The blinds climb fast here. Nobody stays long.",
  "Every mirror in Cutter's Gulch hangs at just the right angle. Snake Crane likes to see your cards before you do.",
  "The bank in Silver Fork never closes. Banker Ellsworth sits behind a wall of chips, waiting to find out what you're worth.",
  "Bitterwater is a river town, and the river decides everything. Lady Vesper has never once lost to the river.",
  "Graves End. The end of the line. Every road you've ridden led here, to a rat with an extra card up his sleeve."];

/* ---- more to say: every boss gets more lines, and new moments to say them ---- */
const BOSS_MORE={
  pete:{win:["Drinks on me! ...On you, I mean.","I had nothin'. Or somethin'. Can't remember.","Barkeep! Celebration whiskey!"],
    lose:["Who moved my chips?","I'm seein' two of you, and you're both lucky.","That's fine. I got a flask."],
    raise:["I'm all... wait, how much is all?","Raise! I think. Did I say raise?","Bet you don't believe me."],
    fold:["Nah. Too sober for that hand.","Fold. Gotta save for whiskey."],call:["Sure, why not.","I'll see that. Barely."],
    allin:["Everything! Even the boots!","All of it. Hic. Every last coin."],
    idle:["Anyone seen my hat? I'm wearin' it? Huh.","This deck's spinnin' a little.","Deal 'em slow. Real slow."],
    hurt:["Gettin' thin over here, friends.","Don't tell my horse about this."],cocky:["Look at all these pretty chips!","Drunk and winnin'. Best kind of night."]},
  ma:{win:["Every penny accounted for.","Late fees, sugar.","Ma always gets paid."],
    lose:["That's coming out of your deposit.","I'll remember that come rent day."],
    raise:["Rent just went up.","Can you afford the neighborhood?","Pay up or move out."],
    fold:["I'll let that one go. This once.","Not worth the paperwork."],call:["I'll cover it.","Put it on my ledger."],
    allin:["I'm putting the whole house on it.","Every room, every bed. All in."],
    idle:["Boots off the table, please.","Breakfast ain't included, by the way.","Somebody's behind on their ante."],
    hurt:["Don't you dare evict me from my own table.","I've had worse tenants than you."],cocky:["I own this town, sugar. And now your chips.","Shall I draw you up a lease?"]},
  iron:{win:["Still standing.","Hit me again. See what happens.","Stone don't bend."],
    lose:["Doesn't hurt.","I've been shot worse."],raise:["Push.","Harder.","Again."],
    call:["Called.","I'm here.","Not moving."],allin:["All of it. Same as always.","Come and take it."],
    idle:["...","Deal.","You talk a lot."],hurt:["Still here.","Walls crack. They don't fall."],cocky:["Told you I don't move.","You're running out of hammer."]},
  under:{win:["Dust to dust.","I'll send flowers.","One more stone for the yard."],
    lose:["I can wait. I'm good at waiting.","The ground is patient."],
    raise:["Time's shorter than you think.","Let's hurry this along.","Tick. Tock."],
    fold:["Not your time yet.","I'll bury that one later."],call:["I'll see it through.","To the end."],
    allin:["I dug a hole big enough for both of us.","Everything. You won't need yours."],
    idle:["The blinds go up soon. Everything ends.","You look pale, friend.","I measured the whole table this morning."],
    hurt:["Even gravediggers die. Not tonight.","Interesting. Most men don't fight back."],cocky:["You're already cold.","I've picked out a nice spot for you."]},
  snake:{win:["Read you like a newspaper.","Ssso predictable.","I had a feeling. A real good feeling."],
    lose:["You hid that well. Don't do it again.","Hm. My eyes must be tired."],
    raise:["I know you've got nothing.","Your card says fold.","Let's see you sweat."],
    fold:["I saw what you had. Smart of me.","Not this time, friend."],call:["I already know how this ends.","Show me what I already saw."],
    allin:["I know every card on this table. All in.","Ssseen enough. Everything."],
    idle:["Lovely hands you got. Real steady.","Shuffle it again. I insist.","Your left eye twitches when you bluff. Did you know?"],
    hurt:["Somebody's been peeking back.","Snakes bite hardest in a corner."],cocky:["I see right through you, friend.","This is too easy. Almost boring."]},
  banker:{win:["Added to your debt.","The vault grows.","Thank you for your deposit."],
    lose:["Petty cash.","I'll write that off."],raise:["Let's adjust the rate.","Can you cover the margin?","A modest investment."],
    fold:["A poor investment. Declined.","The bank doesn't chase losses."],call:["Approved.","Funds available."],
    allin:["The whole vault, then.","I'm liquidating everything. Your move."],
    idle:["Do you know what I paid for this cigar?","Interest compounds while we wait.","Everyone in this room owes me something."],
    hurt:["This is... irregular.","Someone audit this table."],cocky:["I could buy this town twice.","Your whole run is my pocket change."]},
  vesper:{win:["Did you think luck was on your side?","Lucky me. As always.","The stars adore me, darling."],
    lose:["Luck is only lending to you.","A small favor. I'll want it back."],
    raise:["Shall we tempt fate?","Feeling lucky, darling?","The cards whisper to me."],
    fold:["Not tonight, darling.","Fate says no."],call:["Fate says yes.","I'll indulge you."],
    allin:["Fortune, don't fail me now.","Everything, darling. Luck never leaves me."],
    idle:["You have a lucky face. Pity.","I've never lost a river I cared about.","Cut the deck for me, would you?"],
    hurt:["Luck is fickle tonight. How unusual.","Don't get used to this, darling."],cocky:["You can't beat fate, darling.","Luck is a lady, and she's mine."]},
  bicah:{win:["Ha! Read 'em and weep!","Old Bicah's still got it!","That's what you get for trustin' folks."],
    lose:["Somebody's cheatin'! ...Besides me.","You'll regret that, cowpoke."],
    raise:["Bet you ain't got the stones.","Whatcha gonna do about it?","Raise. Cry about it."],
    fold:["Fine! Take it. For now.","I'm savin' my bullets."],call:["Sure, sure. Let's see it.","I'll call that bluff, rat."],
    allin:["Everything! I ain't scared of you!","All in. And I got a few extra up my sleeve."],
    idle:["Every one of you's a rat. Not me, though.","Somebody check that deck. Not me.","Loyalty's for dogs, cowpoke."],
    hurt:["This ain't over! Ain't nothin' over!","I've crawled outta worse holes."],cocky:["Look at ya! All sad and broke!","Bicah Mell, king of the West!"]}};
for(const b of BOSSES){const m=BOSS_MORE[b.key]; if(m) for(const k in m) b.lines[k]=(Array.isArray(b.lines[k])?b.lines[k]:[]).concat(m[k])}

/* ---- the regulars talk too ---- */
const REG_LINES={win:["Well, I'll be.","Come to papa.","Finally!","That's supper paid for.","Don't mind if I do."],
  bigwin:["Yee-haw!","Drinks on me tonight!","Somebody write that one down!"],
  lose:["Dang it.","Every time.","Should've stayed home."],
  bust:["That's me done.","Well, it was fun while it lasted.","Good luck, stranger. You'll need it.","Back to diggin' ditches."],
  idle:["Long ride in today.","Heard the boss here cheats.","My horse is smarter than me.","Who shuffled this mess?"]};
