import numpy as np, scipy.io.wavfile as w
exec(open('real.py').read().split('# ---------- render events')[0])
from walla import crowd
DUR=43.0; L=int(DUR*SR)
def fitL(x): return x[:, :L] if x.shape[1]>=L else np.pad(x,((0,0),(0,L-x.shape[1])))
def foley(r,clinks=6,steps=4,chairs=2):
    out=np.zeros((2,L))
    for t in r.uniform(1,DUR-3,clinks): place(out,pan(clink(r)*r.uniform(.15,.35),r.uniform(.15,.85)),t)
    for t in r.uniform(1,DUR-4,chairs): place(out,pan(scrape(r)*.25,r.uniform(.2,.8)),t)
    for t in r.uniform(1,DUR-4,steps):   # boots on boards: a few heavy steps
        p=r.uniform(.2,.8)
        for j in range(r.integers(3,6)):
            n=int(.12*SR); s=lp(r.standard_normal(n),350,4)*np.exp(-np.arange(n)/SR*35)
            place(out,pan(s*.5,p),t+j*r.uniform(.45,.6))
    return out
CFG={1:dict(near=1,far=5,fr=.3,lg=.05,rt=1.2,cl=6),2:dict(near=1,far=7,fr=.2,lg=.07,rt=1.3,cl=7),3:dict(near=0,far=3,fr=.25,lg=.03,rt=2.6,cl=3),
     4:dict(near=0,far=4,fr=.3,lg=.03,rt=1.4,cl=4),5:dict(near=1,far=5,fr=.3,lg=.04,rt=1.3,cl=5),6:dict(near=1,far=4,fr=.5,lg=.03,rt=1.5,cl=8),
     7:dict(near=1,far=5,fr=.35,lg=.05,rt=1.3,cl=5),8:dict(near=0,far=3,fr=.2,lg=.01,rt=1.8,cl=2)}
for n,c in CFG.items():
    r=np.random.default_rng(500+n)
    x=crowd(r,DUR,c['near'],c['far'],c['fr'],1.0,c['lg']); x=x/np.abs(x).max()*0.45
    x=x+foley(r,c['cl'])*1.0
    room=reverb(x,wet=.3,rt=c['rt'],bright=4000,seed=n)[:, :L]
    # light world outside, heard through the walls
    R_=lambda s: np.random.default_rng(s)
    if n==2: room+=fitL(roof_rain(R_(70),DUR,140))*.18
    if n==5: room+=fitL(roof_rain(R_(71),DUR,240))*.28
    if n==4: room+=pan(cricket(R_(72),4400,DUR)[:L],.8)*.03
    if n==7:
        for t in np.arange(2,DUR-2,4.1): place(room,pan(frog(R_(int(t*10)))*.05,.85),t)
    if n==8: room+=fitL(pan(lp(wind(R_(73),0,0,1,howl=True),900),.5))*.12
    if n==6:
        for k,t in enumerate(np.arange(.4,DUR-1,1.0)): place(room,pan(tick(R_(k),1500 if k%2 else 1150)*.035,.2),t)
    room=lp(room,7000)
    rms=np.sqrt((room**2).mean()); g=min(10**(-28/20)/rms,0.7/np.abs(room).max())
    w.write(f'bed{n}.wav',SR,((room*g).T*32767).astype(np.int16)); print('bed',n)
