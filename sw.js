// Offline support: everything the game needs is cached on first visit, so it runs with no connection afterwards.
const CACHE='dmr-v60';
const CORE=[
"./",
"index.html",
"manifest.webmanifest",
"icons/apple-touch-icon.png",
"icons/icon-192.png",
"icons/icon-512.png",
"audio/bigwin.mp3",
"audio/boss.mp3",
"audio/card0.mp3",
"audio/card1.mp3",
"audio/card2.mp3",
"audio/card3.mp3",
"audio/chip0.mp3",
"audio/chip1.mp3",
"audio/chip2.mp3",
"audio/chip3.mp3",
"audio/chip4.mp3",
"audio/door.mp3",
"audio/heart.mp3",
"audio/lose.mp3",
"audio/paid.mp3",
"audio/pen.mp3",
"audio/piano.mp3",
"audio/stamp.mp3",
"audio/tick.mp3",
"audio/whoosh.mp3",
"audio/win.mp3",
"audio/v/11b9187a24ce2143c9d2.mp3",
"audio/v/1229c3cfbb22c7f4e4c0.mp3",
"audio/v/1751dd3347f62bc4e847.mp3",
"audio/v/2ecba41a4da2b1413675.mp3",
"audio/v/3e7908f9aae05dd99e59.mp3",
"audio/v/34d9f8d5a63d96c29e59.mp3",
"audio/v/fd94bfb601d17fc2ebfa.mp3",
"audio/v/9b475cb280df6e884fce.mp3",
"audio/v/0cfcad71ac27f0287802.mp3",
"audio/v/72eba37664dd2e9ce989.mp3",
"audio/v/34310f8947d6116b8841.mp3",
"audio/v/41af0f2bc944c4d2b2d0.mp3",
"audio/v/4af8f70dc8c118e3bbe8.mp3",
"audio/v/5b300d695260f005b043.mp3",
"audio/v/68dc3ec56e64993c37fb.mp3",
"audio/v/8e20f5612df92f388407.mp3",
"audio/v/a057c079bb9134b096d1.mp3",
"audio/v/a26dc9357e939be2ac4d.mp3",
"audio/v/ac1f1ddbdf0149e8d66e.mp3",
"audio/v/b2c485a1f7515257e722.mp3",
"audio/v/be3571a96f8e18b8044b.mp3",
"audio/v/c3f613a225625a513a1f.mp3",
"audio/v/c8bf61ca23cc1ae7ac13.mp3",
"audio/v/db2f62e78c08d58235ac.mp3",
"audio/v/de770a7fd09676186c37.mp3",
"audio/v/f0d4d1a841aa40f851b9.mp3"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  // the page itself: network first so updates show up right away, cached copy when offline
  if(req.mode==='navigate'||/index\.html$|\/$/.test(new URL(req.url).pathname)){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone(); caches.open(CACHE).then(c=>c.put('index.html',copy)); return res}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    // keep Google Fonts and anything else we fetch, so typography also works offline
    if(res&&(res.ok||res.type==='opaque')){const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy))}
    return res;
  }).catch(()=>caches.match('index.html'))));
});
