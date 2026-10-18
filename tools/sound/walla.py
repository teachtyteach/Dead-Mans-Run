# Saloon walla: a crowd of formant-synthesised voices (pitched, with intonation, vowels, consonants, laughs),
# blurred by distance and the room. Nobody is intelligible, which is exactly what walla is.
import numpy as np
from scipy.signal import butter, sosfilt
from fx import SR, lp, hp, bp, reverb, place
V={'a':(730,1090,2440),'e':(530,1840,2480),'i':(300,2200,2950),'o':(570,840,2410),'u':(320,870,2240),'ae':(660,1720,2410),'uh':(520,1190,2390),'er':(490,1350,1690)}
VK=list(V)
def glottal(f0,n):
    ph=np.cumsum(f0/SR)%1.0
    # Rosenberg-ish pulse: rising then quick fall, then closed phase
    op=0.6; y=np.where(ph<op*0.7, 0.5*(1-np.cos(np.pi*ph/(op*0.7))), np.where(ph<op, np.cos(np.pi/2*(ph-op*0.7)/(op*0.3)), 0.0))
    y=np.diff(y,prepend=0)*SR/ (f0.mean()*8)  # flow derivative = brighter source
    return y
def reson(x,f,bw):
    lo=max(60,f-bw/2); hi=min(SR/2-100,f+bw/2)
    return sosfilt(butter(2,[lo/(SR/2),hi/(SR/2)],'band',output='sos'),x)
def syllable(r,f0a,f0b,dur,vowel,scale,breath=0.0):
    n=int(dur*SR); f0=np.linspace(f0a,f0b,n)*(1+0.012*np.sin(2*np.pi*r.uniform(4,6)*np.arange(n)/SR))
    src=glottal(f0,n)+breath*r.standard_normal(n)*0.3
    F=V[vowel]; y=reson(src,F[0]*scale,90)*1.0+reson(src,F[1]*scale,120)*0.55+reson(src,F[2]*scale,170)*0.25
    a=int(.025*SR); env=np.ones(n); env[:a]=np.linspace(0,1,a); env[-a:]=np.linspace(1,0,a)
    return y*env
def consonant(r,kind):
    if kind=='s': n=int(r.uniform(.05,.09)*SR); return bp(r.standard_normal(n),3500,7000)*np.hanning(n)*.07
    if kind=='sh': n=int(r.uniform(.05,.09)*SR); return bp(r.standard_normal(n),1800,4500)*np.hanning(n)*.08
    if kind=='p': n=int(.02*SR); return bp(r.standard_normal(n),500,3000)*np.exp(-np.arange(n)/SR*200)*.3
    n=int(r.uniform(.03,.06)*SR); return lp(r.standard_normal(n),900)*np.hanning(n)*.15  # voiced murmur (m/n/l)
def voice(r,dur,female=False,energy=1.0,laughy=0.08):
    n=int(dur*SR); out=np.zeros(n)
    base=r.uniform(175,235) if female else r.uniform(92,140); scale=r.uniform(1.12,1.2) if female else r.uniform(.94,1.04)
    t=r.uniform(0,2.5)
    while t<dur-0.5:
        if r.random()<laughy:  # a laugh: breathy "ha ha ha"
            k=r.integers(3,7); p=base*r.uniform(1.25,1.6)
            for j in range(k):
                s=syllable(r,p*(1-j*.03),p*(1-j*.03)*.92,r.uniform(.09,.13),'a',scale,breath=.6)*r.uniform(.8,1.2)*(1-j*.08)
                place_mono(out,s,t); t+=r.uniform(.17,.22)
            t+=r.uniform(.4,1.2); continue
        phrase=r.uniform(.8,3.2); p0=base*r.uniform(1.0,1.25); end=t+phrase; k=0
        while t<min(end,dur-.4):
            frac=(t-(end-phrase))/phrase; p=p0*(1-0.22*frac)*r.uniform(.94,1.08)   # declination
            if r.random()<.2: c=consonant(r,r.choice(['s','sh','p','m','m','p'])); place_mono(out,c*energy,t); t+=len(c)/SR*0.8
            d=r.uniform(.08,.22); v=r.choice(VK)
            s=syllable(r,p*r.uniform(.98,1.06),p*r.uniform(.92,1.0),d,v,scale)*r.uniform(.6,1)*energy
            if r.random()<.15: s*=1.5  # stressed
            place_mono(out,s,t); t+=d*r.uniform(.85,1.0); k+=1
        if end>dur-.4: break
        if frac>.8 and r.random()<.4:  # question rise sometimes
            pass
        t+=r.uniform(.35,2.2)  # pause / listening
    return out
def place_mono(buf,x,t):
    i=int(t*SR); m=min(len(x),len(buf)-i)
    if m>0: buf[i:i+m]+=x[:m]
def crowd(r,dur,near=2,far=12,female_ratio=.3,energy=1.0,laughy=.06):
    n=int(dur*SR); out=np.zeros((2,n))
    for k in range(near):
        v=voice(r,dur,r.random()<female_ratio,1.0,laughy)
        v=lp(v,2400); p=r.uniform(.15,.85); out+=np.stack([v*np.sqrt(1-p),v*np.sqrt(p)])*0.32
    for k in range(far):
        v=voice(r,dur,r.random()<female_ratio,1.0,laughy*.7)
        v=lp(v,r.uniform(1100,1700)); p=r.uniform(0,1); out+=np.stack([v*np.sqrt(1-p),v*np.sqrt(p)])*r.uniform(.2,.38)
    return hp(out,90)*energy
