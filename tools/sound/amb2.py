import numpy as np, scipy.io.wavfile as w, sys
from fx import *
D=43.0; N=int(D*SR)
def R(seed): return np.random.default_rng(seed)
def pink(r,n):
    X=np.fft.rfft(r.standard_normal(n)); f=np.arange(len(X)); f[0]=1; return np.fft.irfft(X/np.sqrt(f),n)
def T(d): return np.arange(int(d*SR))/SR
def pan(y,p): return np.stack([y*np.sqrt(1-p),y*np.sqrt(p)])
def wind(r,lo,hi,amt=1.0,howl=False):
    n=pink(r,N); out=np.zeros(N)
    # slow gust envelope
    g=lp(r.standard_normal(N),0.15,2); g=(g-g.min())/(g.max()-g.min()); g=0.35+0.65*g
    if howl:
        # resonant sweep via several narrow bands following the gust
        for f0 in (320,470,610):
            seg=4096; 
            for s in range(0,N,seg):
                fc=f0*(0.8+0.5*g[s]); out[s:s+seg]+=bp(n[max(0,s-2048):s+seg],fc*0.93,fc*1.07,2)[-min(seg,N-s):]*0.9
        out=lp(out,1200)
    else: out=bp(n,lo,hi,2)
    return out/np.abs(out).max()*g*amt
def clink(r,f=None):
    t=T(1.2); f=f or r.uniform(1900,2600); y=np.zeros(len(t))
    for m,a,dec in [(1,1,6),(2.32,.6,9),(4.25,.35,14)]: y+=a*np.sin(2*np.pi*f*m*t+r.uniform(0,6))*np.exp(-t*dec)
    return y*np.minimum(t/0.001,1)
def crackle(r,density,dur=D):
    out=np.zeros(int(dur*SR))
    for k in range(int(dur*density)):
        i=r.integers(0,len(out)-400); L=r.integers(20,300); y=r.standard_normal(L)*np.exp(-np.arange(L)/r.uniform(8,60))*r.uniform(.1,1)
        out[i:i+L]+=y
    return bp(out,300,4000)
def bell(r,f,dur=6):
    t=T(dur); y=np.zeros(len(t))
    for m,a,dec in [(0.5,.6,.5),(1,1,.8),(1.19,.5,1.1),(1.5,.35,1.4),(2.0,.3,1.8),(2.74,.15,2.6)]: y+=a*np.sin(2*np.pi*f*m*t)*np.exp(-t*dec)
    return y*np.minimum(t/0.003,1)
def thunder(r,dur=6):
    t=T(dur); th=lp(r.standard_normal(len(t)),110,4)*np.minimum(t/r.uniform(.3,1.2),1)*np.exp(-t*r.uniform(.6,1.0))
    return th/np.abs(th).max()
def drip(r):
    t=T(.25); f0=r.uniform(900,1700); y=np.sin(2*np.pi*f0*t*(1+t*6))*np.exp(-t*30)*np.minimum(t/0.0008,1); return y
def cricket(r,f=4300,dur=D,rate=None,amp=1.0):
    t=np.arange(int(dur*SR))/SR; rate=rate or r.uniform(1.4,2.2)
    car=np.sin(2*np.pi*f*t)
    ph=(t*rate+r.uniform(0,1))%1
    env=((ph<0.18)*(np.sin(2*np.pi*ph/0.06*1.0)>0)).astype(float)
    env=lp(env,250); on=lp((r.standard_normal(len(t))>-.3).astype(float),.3)
    return car*env*np.clip(on,0,1)*amp
def owl(r):
    t=T(1.6); y=np.zeros(len(t))
    for st,L,f in [(0,.32,410),(.45,.6,395)]:
        m=(t>=st)&(t<st+L); tt=t[m]-st; y[m]+=np.sin(2*np.pi*f*tt+3*np.sin(2*np.pi*5*tt)/5)*np.sin(np.pi*tt/L)**1.5
    return lp(y,900)
def tick(r,f=1800):
    t=T(.06); return (np.sin(2*np.pi*f*t)*np.exp(-t*120)+lp(r.standard_normal(len(t)),3000)*np.exp(-t*300)*.4)
def pick(r):
    t=T(1.5); f=r.uniform(1300,1700); y=np.zeros(len(t))
    for m,a,dec in [(1,1,8),(2.7,.5,12),(4.1,.3,18)]: y+=a*np.sin(2*np.pi*f*m*t)*np.exp(-t*dec)
    y+=lp(r.standard_normal(len(t)),2500)*np.exp(-t*80)*.6; return y*np.minimum(t/0.0005,1)
def bubble(r):
    t=T(.12); f0=r.uniform(350,900); y=np.sin(2*np.pi*f0*t*(1+t*14))*np.exp(-t*45)*np.minimum(t/0.002,1); return y
def frog(r):
    t=T(.35); rate=r.uniform(18,30); ph=np.cumsum(np.full(len(t),rate)/SR); pul=(np.diff(np.floor(ph),prepend=0)>0).astype(float)
    y=bp(pul,350,900,2)*np.sin(np.pi*t/.35)**.8; return y/np.abs(y).max()
def scrape(r):
    t=T(.5); y=bp(r.standard_normal(len(t)),200,1200)*np.sin(np.pi*t/.5)**2; return lp(y,1500)
def roomtone(r,a=.04): return lp(np.stack([pink(r,N),pink(r,N)]),250)*a
def sprinkle(out,fn,times,r,amp,pans=None):
    for k,t in enumerate(times):
        y=fn(r)*amp; p=r.uniform(.2,.8) if pans is None else pans
        place(out,pan(y,p),t)
def every(r,mean,jit=.4,start=0.5):
    ts=[]; t=start
    while t<D-3: ts.append(t); t+=mean*(1+r.uniform(-jit,jit))
    return ts
def build(n):
    r=R(100+n); out=np.zeros((2,N)); rt=1.1; wet=.18; bright=4500
    if n==1:   # Dry Creek: dusty afternoon wind, sparse saloon life
        out+=pan(wind(r,150,700,.18),.4)+pan(wind(R(9),150,700,.18),.6)
        sprinkle(out,clink,every(r,9),r,.05); sprinkle(out,scrape,every(r,14,start=6),r,.05)
    elif n==2: # Copper Bend: stove crackle, picks ringing from the mine
        out+=pan(crackle(r,60),.35)*.05+roomtone(r,.05)
        out+=pan(lp(pink(r,N),120),.5)*.08
        sprinkle(out,pick,every(r,2.6,.15,1.0),r,.03,.85)
        sprinkle(out,clink,every(r,13,start=5),r,.04)
        rt=1.6; wet=.25
    elif n==3: # Hollow Rock: cave drips echoing, low draught
        out+=pan(lp(pink(r,N),140),.5)*.12
        sprinkle(out,drip,every(r,1.7,.6),r,.06)
        rt=3.2; wet=.5; bright=3000
    elif n==4: # Red Mesa: desert night, crickets, an owl
        out+=pan(cricket(r,4400,amp=1),.25)*.025+pan(cricket(R(4),4900,amp=1),.75)*.02+pan(cricket(R(5),3900,amp=1),.5)*.015
        out+=pan(wind(r,120,500,.08),.5)
        sprinkle(out,owl,[7.0,25.0],r,.08,.2)
        rt=1.6; wet=.25
    elif n==5: # Cutter's Gulch: muffled rain, thunder (existing feel)
        for c in range(2): out[c]+=lp(hp(pink(R(20+c),N),60),450,4)/1.0*0
        rain=np.stack([lp(hp(pink(R(20),N),60),450,4),lp(hp(pink(R(21),N),60),450,4)]); rain/=np.abs(rain).max(); out+=rain*.16
        sprinkle(out,drip,every(r,3.5),r,.03)
        sprinkle(out,clink,[4.0,19.5,31.0],r,.04)
        place(out,thunder(r)*.35,15.0)
        bright=3000
    elif n==6: # Silver Fork: polished parlour, grandfather clock, fire
        out+=roomtone(r,.04)+pan(crackle(r,35),.7)*.035
        for k,t in enumerate(np.arange(0.4,D-1,1.0)): place(out,pan(tick(r,1500 if k%2 else 1150)*.07,.3),t)
        sprinkle(out,clink,every(r,8,start=3),r,.04)
        rt=1.4; wet=.22
    elif n==7: # Bitterwater: river bubbling, frogs, crickets
        b=np.zeros((2,N))
        for t in np.cumsum(r.exponential(0.07,int(D/0.07)+50)):
            if t<D-.2: place(b,pan(bubble(r)*r.uniform(.2,1),r.uniform(.1,.9)),t)
        out+=b*.025+pan(lp(pink(r,N),300),.5)*.06
        for t in every(r,3.2,.7,1): 
            for j in range(r.integers(1,4)): place(out,pan(frog(r)*.04,r.uniform(.15,.85)),t+j*.42)
        out+=pan(cricket(r,4600),.6)*.012
        rt=1.3; wet=.2
    elif n==8: # Graves End: storm howl, thunder, a bell tolling
        out+=pan(wind(r,0,0,.32,howl=True),.4)+pan(wind(R(88),0,0,.28,howl=True),.6)
        rain=np.stack([lp(hp(pink(R(30),N),60),500,4),lp(hp(pink(R(31),N),60),500,4)]); rain/=np.abs(rain).max(); out+=rain*.12
        for t in (6.0,21.0,33.0): place(out,thunder(r)*r.uniform(.35,.5),t)
        for t in (2.0,14.0,26.0): place(out,pan(lp(bell(r,196),2000)*.07,.3),t)
        rt=2.0; wet=.28; bright=3000
    out=reverb(out,wet=wet,rt=rt,bright=bright,seed=n)
    out=out[:, :N+int(3*SR)] if out.shape[1]>N+3*SR else np.pad(out,((0,0),(0,N+int(3*SR)-out.shape[1])))
    # fold the tail onto the head so the loop is seamless; JS crossfades 3s too
    rms=np.sqrt((out**2).mean()); g=min(10**(-26/20)/rms, 0.7/np.abs(out).max()); out=out*g
    w.write(f'amb{n}.wav',SR,(out.T*32767).astype(np.int16))
    print(n, round(20*np.log10(np.abs(out).max()),1))
for n in range(1,9): build(n)
