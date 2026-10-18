# physically-modelled ambience: rain from individual drop impacts, rolling thunder from many reflections,
# FM birdsong, a distant steam train. Beds loop; events are one-shots scheduled at random by the game.
import numpy as np, scipy.io.wavfile as w, os
from fx import *
exec(open('amb2.py').read().split('def build(n):')[0].replace("D=40.0; N=int(D*SR)","D=40.0; N=int(D*SR)"))
os.makedirs('ev',exist_ok=True)
def save(path,x,peak=.7):
    if x.ndim==1: x=np.stack([x,x])
    x=x/np.abs(x).max()*peak; w.write(path,SR,(x.T*32767).astype(np.int16))
# ---------- rain on a wooden roof, built drop by drop ----------
def roof_rain(r,dur,rate,heavy=0.0):
    n=int(dur*SR); out=np.zeros((2,n))
    # drop sizes lognormal; small drops = bright ticks, big = duller taps with a low thump
    k=int(dur*rate); t0=np.sort(r.uniform(0,dur-.05,k))
    # clustering: modulate acceptance with slow gusts
    gust=lp(r.standard_normal(n),0.3,2); gust=(gust-gust.min())/(np.ptp(gust)+1e-9)
    bank={}
    def drop(size):
        L=int(SR*(0.006+0.02*size)); t=np.arange(L)/SR
        f=r.uniform(1800,5200)*(1.2-0.6*size); dec=r.uniform(260,520)*(1.3-0.7*size)
        y=np.sin(2*np.pi*f*t+r.uniform(0,6))*np.exp(-t*dec)
        y+=r.standard_normal(L)*np.exp(-t*dec*2.5)*0.6
        if size>0.6: y+=np.sin(2*np.pi*r.uniform(140,260)*t)*np.exp(-t*90)*0.8*size
        return y*np.minimum(t/0.0002,1)
    for t in t0:
        i=int(t*SR)
        if r.random()>0.35+0.65*gust[i]: continue
        size=min(1,r.lognormal(-1.6,0.6)); a=(0.15+size)*r.uniform(.4,1)
        y=drop(size)*a; p=r.uniform(.1,.9)
        m=min(len(y),n-i); out[0,i:i+m]+=y[:m]*np.sqrt(1-p); out[1,i:i+m]+=y[:m]*np.sqrt(p)
    out=lp(out,6500)
    # soft wash of distant rain for body (very low, no hiss)
    wash=np.stack([lp(hp(pink(r,n),80),900,2),lp(hp(pink(r,n),80),900,2)]); wash/=np.abs(wash).max()
    out=out/np.abs(out).max()+wash*(0.12+0.25*heavy)
    return out
def gutter(r,dur,every_s):
    n=int(dur*SR); out=np.zeros((2,n)); t=r.uniform(0,every_s)
    while t<dur-.3:
        L=int(.18*SR); tt=np.arange(L)/SR; f0=r.uniform(700,1400)
        y=np.sin(2*np.pi*f0*tt*(1+tt*9))*np.exp(-tt*28)*np.minimum(tt/0.001,1)  # Minnaert bubble
        y+=r.standard_normal(L)*np.exp(-tt*400)*.3
        i=int(t*SR); place(out,pan(y*r.uniform(.5,1),.75),t); t+=every_s*r.uniform(.5,1.5)
    return out
# ---------- rolling thunder: many delayed, filtered bursts ----------
def thunder_real(r,dist=0.5,dur=9.0):
    n=int(dur*SR); y=np.zeros(n)
    nb=int(40+60*(1-dist))
    for k in range(nb):
        t=r.gamma(2.0,0.35+dist*0.5); 
        if t>dur-1.5: continue
        L=int(SR*r.uniform(.15,.9)); seg=r.standard_normal(L)*np.exp(-np.arange(L)/SR*r.uniform(3,9))
        seg=lp(seg,r.uniform(80,400 if dist>.5 else 900),2)
        i=int(t*SR); y[i:i+L]+=seg[:n-i]*np.exp(-t*0.35)*r.uniform(.3,1)
    if dist<0.4:  # close: sharp crack first
        L=int(.08*SR); y[:L]+=bp(r.standard_normal(L),600,5000)*np.exp(-np.arange(L)/SR*40)*1.5
    y=lp(y,1800 if dist<.4 else 700); y=y/np.abs(y).max()
    env=np.minimum(np.arange(n)/SR/0.05,1)*np.minimum((n-np.arange(n))/SR/1.5,1); y*=env
    st=np.stack([y,np.roll(y,int(.012*SR))]); return reverb(st,wet=.35,rt=3.0,bright=1500,seed=int(dist*100))[:, :n]
# ---------- birdsong (FM syllables) ----------
def syll(f0,f1,d,vib=0,vibf=0,am=1.0):
    t=np.arange(int(d*SR))/SR; f=f0+(f1-f0)*(t/d)
    f=f*(1+vib*np.sin(2*np.pi*vibf*t))
    ph=2*np.pi*np.cumsum(f)/SR; y=np.sin(ph)+0.12*np.sin(2*ph)
    env=np.sin(np.pi*t/d)**1.4; return y*env*am
def bird(r,kind):
    parts=[]; 
    if kind==0:  # "fee-bee" whistle (chickadee-like)
        parts=[syll(3900,3850,.32),np.zeros(int(.06*SR)),syll(3300,3250,.34)]
    elif kind==1:  # rapid trill
        for k in range(r.integers(8,14)): parts+=[syll(4200,3000,.035),np.zeros(int(.018*SR))]
    elif kind==2:  # warble phrase
        for k in range(r.integers(4,7)): f=r.uniform(2600,4600); parts+=[syll(f,f*r.uniform(.8,1.25),r.uniform(.06,.14),vib=.03,vibf=40),np.zeros(int(r.uniform(.02,.06)*SR))]
    elif kind==3:  # two chirps
        parts=[syll(5200,3600,.07),np.zeros(int(.09*SR)),syll(5200,3500,.07)]
    elif kind==4:  # meadowlark-ish descending flute
        for f in (3100,2700,3400,2500,2200): parts+=[syll(f*1.02,f,.11,vib=.01,vibf=25),np.zeros(int(.03*SR))]
    else:  # dove coo, low
        parts=[syll(520,560,.35),np.zeros(int(.12*SR)),syll(600,480,.55),np.zeros(int(.1*SR)),syll(500,470,.4),syll(470,450,.35)]
    y=np.concatenate(parts); y=bp(y,300,8000)*r.uniform(.6,1)
    st=pan(y,r.uniform(.15,.85)); return reverb(st,wet=.3,rt=1.2,bright=7000,seed=kind)
# ---------- distant steam train passing ----------
def train(r,dur=28.0):
    n=int(dur*SR); t=np.arange(n)/SR
    # pass-by envelope: approaches, passes ~11s, recedes
    tc=11.0; d=np.sqrt(1+((t-tc)/4.5)**2); amp=1/d**1.3
    # chuffs: speed constant ~4/s; each chuff is a filtered noise puff
    ch=np.zeros(n); k=0.0
    while k<dur-.3:
        L=int(.16*SR); puff=r.standard_normal(L)*np.exp(-np.arange(L)/SR*22)*r.uniform(.7,1)
        i=int(k*SR); ch[i:i+L]+=puff[:n-i]; k+=0.23*r.uniform(.96,1.04)
    ch=bp(ch,120,900,2)
    # rail clacks in pairs
    cl=np.zeros(n); k=0.4
    while k<dur-.2:
        for off in (0,.11):
            L=int(.05*SR); c=r.standard_normal(L)*np.exp(-np.arange(L)/SR*90); i=int((k+off)*SR); cl[i:i+L]+=c[:n-i]
        k+=1.05
    cl=bp(cl,400,2500,2)*.5
    # whistle: three-chime steam whistle with breath, doppler drop as it passes
    wh=np.zeros(n)
    for ws,wl in ((5.0,1.6),(7.2,2.8)):
        m=(t>=ws)&(t<ws+wl); tt=t[m]-ws; dop=1+0.035*np.tanh((tc-t[m])/2.0)
        env=np.minimum(tt/.18,1)*np.minimum((wl-tt)/.4,1)
        for f,a in ((415,1),(523,.8),(622,.7)):
            ph=2*np.pi*np.cumsum(f*dop*(1+.003*np.sin(2*np.pi*5*tt)))/SR
            wh[m]+=a*(np.sin(ph)+.35*np.sin(2*ph)+.15*np.sin(3*ph))*env
        wh[m]+=bp(r.standard_normal(m.sum()),300,2500)*env*.25
    y=(ch*1.0+cl*0.8)*amp+wh*0.55*amp
    y=lp(y,2200); y/=np.abs(y).max()
    fade=np.minimum(t/3,1)*np.minimum((dur-t)/4,1); y*=fade
    # stereo pan left->right as it passes
    p=np.clip(0.5+0.4*np.tanh((t-tc)/5),0,1)
    st=np.stack([y*np.sqrt(1-p),y*np.sqrt(p)]); return reverb(st,wet=.35,rt=2.4,bright=2500,seed=7)[:, :n]
def owl2(r):
    st=pan(owl(r),.25); return reverb(st,wet=.35,rt=1.8,bright=3000,seed=3)
def bell2(r): return reverb(pan(lp(bell(r,196,7),2200),.3),wet=.35,rt=2.5,bright=2500,seed=5)
def clinks(r): return reverb(pan(clink(r)*.6,r.uniform(.3,.7)),wet=.25,rt=1.0,bright=6000,seed=9)
# ---------- render events ----------
r=np.random.default_rng(2026)
save('ev/train.wav',train(r),.75)
for i,dist in enumerate((0.25,0.6,0.85)): save(f'ev/thunder{i}.wav',thunder_real(np.random.default_rng(40+i),dist),.85 if dist<.5 else .7)
for k in range(6): save(f'ev/bird{k}.wav',bird(np.random.default_rng(60+k),k),.6)
save('ev/owl.wav',owl2(r),.6); save('ev/bell.wav',bell2(r),.6); save('ev/clink.wav',clinks(r),.5)
# ---------- render beds (40s + 3s tail for crossfade) ----------
DUR=43.0
def bedsave(n,x):
    x=x[:, :int(DUR*SR)]; rms=np.sqrt((x**2).mean()); g=min(10**(-24/20)/rms,0.7/np.abs(x).max()); w.write(f'bed{n}.wav',SR,((x*g).T*32767).astype(np.int16)); print('bed',n)
def fit(x): 
    L=int(DUR*SR); return x[:, :L] if x.shape[1]>=L else np.pad(x,((0,0),(0,L-x.shape[1])))
R_=lambda s: np.random.default_rng(s)
# 1 Dry Creek morning: soft breeze + far room
b=pan(wind(R_(1),150,600,.5),.45)+pan(wind(R_(2),150,600,.5),.55); bedsave(1,fit(reverb(b*.6+roomtone(R_(3),.6),wet=.15,rt=1,bright=3000)))
# 2 Copper Bend: light rain on the roof + gutter + stove
x=roof_rain(R_(4),DUR,260)+gutter(R_(5),DUR,2.2)*.5; x+=pan(crackle(R_(6),40,DUR),.3)*.05/ max(1e-9,np.abs(crackle(R_(6),40,DUR)).max())*0
bedsave(2,fit(reverb(x,wet=.18,rt=1.2,bright=5000)))
# 3 Hollow Rock: cave drips + draught
x=np.zeros((2,int(DUR*SR)))+pan(lp(pink(R_(7),int(DUR*SR)),140),.5)*.4
for t in np.cumsum(R_(8).exponential(1.6,40)):
    if t<DUR-.5: place(x,pan(drip(R_(int(t*100)))*.5,R_(int(t*7)).uniform(.2,.8)),t)
bedsave(3,fit(reverb(x,wet=.5,rt=3.2,bright=3000)))
# 4 Red Mesa night: crickets + low wind
x=pan(cricket(R_(9),4400,DUR),.25)*.5+pan(cricket(R_(10),4900,DUR),.75)*.4+pan(cricket(R_(11),3900,DUR),.5)*.3+pan(wind(R_(12),120,500,.4)[:int(DUR*SR)] if False else lp(pink(R_(12),int(DUR*SR)),300)*.4,.5)
bedsave(4,fit(reverb(x,wet=.25,rt=1.6,bright=6000)))
# 5 Cutter's Gulch: steady storm rain on the roof
x=roof_rain(R_(13),DUR,700,heavy=.6)+gutter(R_(14),DUR,1.2)*.6; bedsave(5,fit(reverb(x,wet=.2,rt=1.3,bright=4500)))
# 6 Silver Fork: clock + fire + light rain outside
x=roof_rain(R_(15),DUR,120)*.35
for k,t in enumerate(np.arange(.4,DUR-1,1.0)): place(x,pan(tick(R_(k),1500 if k%2 else 1150)*.25,.3),t)
cr=crackle(R_(16),35,DUR); x+=pan(lp(cr,2500)/np.abs(cr).max(),.7)*.18
bedsave(6,fit(reverb(x,wet=.22,rt=1.4,bright=5000)))
# 7 Bitterwater: river + frogs
x=np.zeros((2,int(DUR*SR)))
for t in np.cumsum(R_(17).exponential(0.06,int(DUR/0.06)+50)):
    if t<DUR-.2: place(x,pan(bubble(R_(int(t*1000)))*R_(int(t*999)).uniform(.2,1),R_(int(t*77)).uniform(.1,.9)),t)
x=x*.5+pan(lp(pink(R_(18),int(DUR*SR)),300),.5)*.3
for t in np.arange(1,DUR-2,3.3):
    for j in range(2): place(x,pan(frog(R_(int(t*10+j)))*.25,R_(int(t)).uniform(.15,.85)),t+j*.42)
bedsave(7,fit(reverb(x,wet=.2,rt=1.3,bright=5000)))
# 8 Graves End: howling storm + heavy rain
x=pan(wind(R_(19),0,0,1,howl=True),.4)*.5+pan(wind(R_(20),0,0,1,howl=True),.6)*.45
x=x[:, :int(DUR*SR)] if x.shape[1]>=int(DUR*SR) else np.pad(x,((0,0),(0,int(DUR*SR)-x.shape[1])))
x=x+roof_rain(R_(21),DUR,900,heavy=1.0)*.8
bedsave(8,fit(reverb(x,wet=.25,rt=2.0,bright=3500)))
