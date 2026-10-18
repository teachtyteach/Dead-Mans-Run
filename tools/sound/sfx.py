import numpy as np, scipy.io.wavfile as w, subprocess, os
from fx import *
from sf2 import SF2, Inst
sf=SF2('/usr/share/sounds/sf2/TimGM6mb.sf2'); P=Inst(sf,0); CEL=Inst(sf,42); STR=Inst(sf,49)
r=np.random.default_rng(5)
os.makedirs('sfx',exist_ok=True)
def T(d): return np.arange(int(d*SR))/SR
def save(name,x,peak=0.85,room=.12,rt=.5):
    if x.ndim==1: x=np.stack([x,x])
    x=reverb(x,wet=room,rt=rt,bright=7000,seed=hash(name)%100) if room else x
    # trim silence
    a=np.abs(x).max(0); idx=np.where(a>1e-4*a.max())[0]; x=x[:, :idx[-1]+200]
    x=norm(x,peak); fade=min(400,x.shape[1]); x[:,-fade:]*=np.linspace(1,0,fade)
    w.write(f'sfx/{name}.wav',SR,(x.T*32767).astype(np.int16))
def noise(d): return r.standard_normal(int(d*SR))
def chipclick(scale=1.0):
    t=T(.06); y=np.zeros(len(t)); f0=r.uniform(2300,3000)*scale
    for m,a,dec in [(1,1,90),(1.58,.7,120),(2.37,.5,150),(3.1,.3,200)]:
        y+=a*np.sin(2*np.pi*f0*m*t+r.uniform(0,6))*np.exp(-t*dec)
    y+=bp(noise(.06),2000,9000)*np.exp(-t*400)*1.2
    y+=lp(noise(.06),600)*np.exp(-t*250)*0.6
    return y*np.minimum(t/0.0004,1)
# chips
for v in range(5):
    out=np.zeros(int(.45*SR)); t0=0
    for k in range(r.integers(2,5)):
        c=chipclick()*r.uniform(.5,1); i=int(t0*SR); out[i:i+len(c)]+=c[:len(out)-i]; t0+=r.uniform(.025,.075)
    save(f'chip{v}',out,0.7,room=.1)
# card: slide + snap on felt
for v in range(4):
    d=.16; t=T(d); s=bp(noise(d),900,6000)
    sw=np.exp(-((t-.03)/.025)**2)*0.6
    tap=lp(noise(d),900)*np.exp(-np.maximum(t-.06,0)*120)*(t>.06)*1.4
    snap=bp(noise(d),2500,7000)*np.exp(-np.maximum(t-.06,0)*300)*(t>.06)*0.7
    save(f'card{v}',s*sw+tap+snap,0.6,room=.08)
# piano helpers
def pchord(notes,t0s,vels,dur):
    L=int((max(t0s)+dur+3)*SR); out=np.zeros((2,L))
    for n,t0,v in zip(notes,t0s,vels): place(out,P.note(n,v,dur),t0)
    return lp(out,7000)
# win: rolled major chord, soft top note
n=[48,55,64,67,72,76]; save('win',pchord(n,[i*.045 for i in range(6)],[60,58,62,64,70,74],1.6),0.8,room=.3,rt=1.6)
# bigwin: little ragtime run up into a full chord
run=[67,69,71,72,74,76,79]; ch=[36,48,55,64,72,76,79,84]
x=pchord(run+ch,[i*.07 for i in range(7)]+[.52+i*.02 for i in range(8)],[60,62,64,66,68,70,74]+[70,62,58,60,66,72,76,80],2.2)
L=x.shape[1]; jing=np.zeros(L)
for k in range(18):
    c=chipclick(r.uniform(1.6,2.2))*r.uniform(.2,.5); i=int((.55+r.uniform(0,.9))*SR); jing[i:i+len(c)]+=c[:L-i]
x=x+jing*0.5; save('bigwin',x,0.85,room=.32,rt=1.8)
# lose: soft low minor chord + sigh
x=pchord([45,52,57,60,64,62,60],[0,.03,.06,.09,.12,.7,1.05],[50,44,44,42,46,48,44],1.6); save('lose',x,0.65,room=.35,rt=1.8)
# boss: low piano strike, dark and soft, with a felt-muted low rumble (no horn-like sustain)
L=int(4.0*SR); x=np.zeros((2,L))
place(x,P.note(33,78,2.2)*1.0,0); place(x,P.note(45,70,2.2)*0.9,0.012); place(x,P.note(52,48,1.8)*0.6,0.03)
place(x,P.note(51,40,1.6)*0.5,0.75); place(x,P.note(40,44,1.6)*0.6,0.76)
t=T(4.0); rum=lp(noise(4.0),90,4)*np.minimum(t/0.05,1)*np.exp(-t*1.1); place(x,rum/np.abs(rum).max()*0.25,0)
save('boss',lp(x,3500),0.75,room=.38,rt=2.2)
# paid: register clunk + bell + coins
L=int(2.5*SR); x=np.zeros(L); t=T(2.5)
clunk=lp(noise(.12),1500)*np.exp(-T(.12)*45); x[:len(clunk)]+=clunk*0.8
bell=np.zeros(L); f=2093
for m,a,dec in [(1,1,2.2),(2.0,.4,3),(2.76,.35,4),(5.4,.15,7),(8.93,.08,10)]: bell+=a*np.sin(2*np.pi*f*m*t)*np.exp(-t*dec)
i=int(.09*SR); x[i:]+=bell[:L-i]*0.45
for k in range(14):
    c=chipclick(r.uniform(1.7,2.3))*r.uniform(.2,.45); j=int((.25+r.uniform(0,.7))*SR); x[j:j+len(c)]+=c[:L-j]
save('paid',x,0.85,room=.25,rt=1.2)
# stamp: wooden thud
d=.35; t=T(d); y=np.sin(2*np.pi*(95*t-60*t*t))*np.exp(-t*18)+lp(noise(d),900)*np.exp(-t*60)*1.2+bp(noise(d),1500,5000)*np.exp(-t*200)*.3
save('stamp',y,0.8,room=.15,rt=.7)
# door: saloon batwing doors flapping shut, wood on wood, no creak tone
L=int(1.4*SR); x=np.zeros(L)
for tt,a in [(0.0,1.0),(0.28,0.55),(0.5,0.32),(0.66,0.18),(0.77,0.1)]:
    d=.18; t=T(d); n=noise(d)
    knock=lp(n,700,4)*np.exp(-t*45)*1.4+bp(n,900,2600)*np.exp(-t*120)*0.5
    wood=np.zeros(len(t))
    for f,dec in [(r.uniform(180,230),30),(r.uniform(420,520),45),(r.uniform(900,1100),70)]: wood+=np.sin(2*np.pi*f*t)*np.exp(-t*dec)*0.35
    y=(knock+wood)*np.minimum(t/0.001,1)*a; i=int(tt*SR); x[i:i+len(y)]+=y[:L-i]
save('door',x,0.5,room=.22,rt=.9)
# pen: quill on paper
d=1.4; t=T(d); s=bp(noise(d),1800,7000)
strokes=np.zeros(len(t)); pos=0
while pos<d-.08:
    L2=r.uniform(.05,.14); m=(t>=pos)&(t<pos+L2); strokes[m]=np.sin(np.pi*(t[m]-pos)/L2)*r.uniform(.4,1); pos+=L2+r.uniform(.0,.05)
grain=1+0.8*lp(np.abs(noise(d)),60)
save('pen',s*strokes*grain,0.35,room=.05)
# tick: soft wood tick
d=.05; t=T(d); y=np.sin(2*np.pi*1400*t)*np.exp(-t*160)+bp(noise(d),1500,5000)*np.exp(-t*500)*.5; save('tick',y,0.4,room=0)
# whoosh: soft paper/cloth swish
d=.5; t=T(d); s=noise(d); env=np.exp(-((t-.2)/.11)**2); y=bp(s,500,3000)*env*.7+bp(s,3000,8000)*env*.25; save('whoosh',y,0.4,room=.05)
print(sorted(os.listdir('sfx')))
# gunshot: sharp crack, chest-thump body, long room tail
d=2.5; t=T(d); n=noise(d)
crack=bp(n,1500,9000)*np.exp(-t*90)*1.0
body=lp(n,500,4)*np.exp(-t*14)*2.2+np.sin(2*np.pi*(70*t-25*t*t))*np.exp(-t*10)*0.8
y=(crack+body)*np.minimum(t/0.0003,1); y=soft(y/np.abs(y).max()*1.6,2.0)
save('gun',y,0.95,room=.45,rt=2.2)
