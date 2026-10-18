import numpy as np, subprocess, scipy.io.wavfile as w
from sf2 import SF2, Inst
from fx import *
sf=SF2('/usr/share/sounds/sf2/TimGM6mb.sf2')
PIANO=Inst(sf,0); GTR=Inst(sf,24); STR=Inst(sf,49); CELLO=Inst(sf,42)
rng=np.random.default_rng(11)
BPM=64; B=60/BPM; BAR=3*B
cache={}
def note(inst,key,vel,dur,detune=0):
    k=(id(inst),key,vel,round(dur,2))
    if k not in cache: cache[k]=inst.note(key,vel,dur)
    return cache[k]
# chords: (bass, [chord tones])
CH={'Am':(45,[57,60,64]),'Am/G':(43,[57,60,64]),'F':(41,[57,60,65]),'E7':(40,[56,59,62,64]),'Dm':(38,[57,62,65]),
    'C':(48,[55,60,64]),'G':(43,[55,59,62]),'Em':(40,[55,59,64]),'Dm/F':(41,[57,62,65]),'E':(40,[56,59,64])}
A1=[('Am',[(76,2),(72,1)]),('Am/G',[(71,1.5),(69,.5),(71,1)]),('F',[(72,2),(69,1)]),('E7',[(68,3)]),
    ('Am',[(69,1),(72,1),(76,1)]),('Dm',[(77,2),(76,.5),(74,.5)]),('E7',[(74,1),(72,1),(71,1)]),('Am',[(69,3)])]
A2=A1[:4]+[('Am',[(76,1.5),(74,.5),(72,1)]),('Dm',[(74,2),(77,1)]),('E7',[(76,1),(74,1),(68,1)]),('Am',[(69,3)])]
Bs=[('C',[(76,2),(79,1)]),('G',[(74,3)]),('Am',[(72,1.5),(71,.5),(69,1)]),('Em',[(71,3)]),
    ('F',[(69,1),(72,1),(77,1)]),('C',[(76,2),(72,1)]),('Dm',[(77,1.5),(76,.5),(74,1)]),('E7',[(71,2),(68,1)])]
FORM=[(A1,'full'),(A2,'full'),(Bs,'full'),(A2,'full'),(A1,'sparse'),(Bs,'gtr'),(A2,'gtr'),(A1,'end')]
nbars=sum(len(s) for s,_ in FORM)
T=nbars*BAR+6
mix={k:np.zeros((2,int(T*SR))) for k in ('pno','gtr','pad','cel')}
t=0.5; bi=0
for sec,mode in FORM:
    for j,(cn,mel) in enumerate(sec):
        bass,ch=CH[cn]
        rit=1.0+(0.12 if j==7 else 0)+(0.05 if j==6 else 0)
        bl=BAR*rit
        hum=lambda: rng.normal(0,0.012)
        # left hand
        if mode!='end' or j<7:
            v=rng.integers(62,72)
            place(mix['pno'],note(PIANO,bass,int(v),B*1.6)*1.0,t+hum())
            if mode in('full','gtr','end'):
                for b in (1,2):
                    vv=int(rng.integers(36,46)); tt=t+b*B*rit+hum()
                    for q,n in enumerate(ch): place(mix['pno'],note(PIANO,n,vv,B*0.7)*0.8,tt+q*0.006)
            else:
                vv=int(rng.integers(34,42))
                for q,n in enumerate(ch): place(mix['pno'],note(PIANO,n,vv,B*2.4)*0.8,t+B*rit+q*0.03)
        else:
            for q,n in enumerate([bass-12,bass]+ch): place(mix['pno'],note(PIANO,n,52,BAR*2.5),t+q*0.045)
        # melody
        if mode in('full','sparse','end') or (mode=='gtr' and j%2==1):
            tm=t
            thin = mode=='sparse' and j%2==1
            for n,d in mel:
                if not thin:
                    v=int(rng.integers(66,80)) if mode!='sparse' else int(rng.integers(52,62))
                    if d>=2 and rng.random()<.25: # grace note
                        place(mix['pno'],note(PIANO,n-1,v-20,.08),tm-.07)
                    place(mix['pno'],note(PIANO,n,v,d*B*rit*0.95),tm+hum())
                    if mode=='full' and d>=1.5 and rng.random()<.5: place(mix['pno'],note(PIANO,n-12,v-22,d*B*.9),tm+hum()+.01)
                tm+=d*B*rit
        # guitar arpeggio
        if mode in('gtr','sparse'):
            pat=[bass+12]+[c for c in ch[:3]]+[ch[1]+12 if len(ch)>1 else ch[0]+12, ch[2]]
            for k,n in enumerate(pat):
                place(mix['gtr'],note(GTR,n,int(rng.integers(55,68)),B*1.2),t+k*B*rit/2+hum())
        # pad + cello
        if mode in ('full','gtr','sparse'):
            for n in ch[:3]: place(mix['pad'],note(STR,n-12 if n>60 else n,46,bl*1.02),t)
        if sec is Bs or mode=='end':
            place(mix['cel'],note(CELLO,bass if bass>=36 else bass+12,58,bl*0.98),t+0.05)
        t+=bl; bi+=1
L=int((t+0.3)*SR)
p=mix['pno'][:, :int(T*SR)]
p=lp(p,6500); p=shelf_warm(p)*0.85
p=p+0.004*np.sign(p)*0 
# subtle honky-tonk: chorus copy detuned by short modulated delay
n=np.arange(p.shape[1]); d=(0.012+0.0008*np.sin(2*np.pi*0.7*n/SR))*SR
idx=np.clip(n-d,0,None); i0=idx.astype(int); fr=idx-i0
ch=p[:,i0]*(1-fr)+p[:,np.minimum(i0+1,p.shape[1]-1)]*fr
p=p+0.28*ch
g=lp(mix['gtr'],3500)*0.9
pad=lp(mix['pad'],1600)*0.55
cel=lp(mix['cel'],2200)*0.6
dry=p*1.0+g*0.8+pad+cel
x=reverb(dry,wet=.3,rt=2.0,bright=6000)
x=x[:, :int((t+2.5)*SR)]
x=hp(x,40)
x=soft(norm(x,0.95),1.2)
x=norm(x,0.89)
LOOP=t  # seconds of musical content; tail overlaps start on loop
print('len',t, 'bars',bi)
x=norm(x,0.89)
w.write('music.wav',SR,(x.T*32767).astype(np.int16))
print('PERIOD',t)
