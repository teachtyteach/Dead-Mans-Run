import numpy as np, scipy.io.wavfile as w
from fx import *
r=np.random.default_rng(3)
D=48.0; N=int(D*SR)
def pink(n):
    X=np.fft.rfft(r.standard_normal(n)); f=np.arange(len(X)); f[0]=1; return np.fft.irfft(X/np.sqrt(f),n)
out=np.zeros((2,N))
# steady rain on roof/window
for c in range(2):
    rain=pink(N); rain=lp(hp(rain,60),450,4); rain/=np.abs(rain).max()
    mod=1+0.18*np.sin(2*np.pi*np.arange(N)/SR/D*2+c)+0.08*np.sin(2*np.pi*np.arange(N)/SR/D*7)
    out[c]+=rain*mod*0.16
# heavier drips from the eaves
for k in range(int(D*0.35)):
    t=r.uniform(0,D-0.2); n=int(0.12*SR); tt=np.arange(n)/SR
    f0=r.uniform(500,1100); y=lp(np.sin(2*np.pi*f0*tt*(1+tt*4))*np.exp(-tt*40),1500)*r.uniform(.015,.03)
    place(out,y,t)
# room tone
out+=lp(np.stack([pink(N),pink(N)]),300)*0.05
# glass clinks + a chair creak, sparse
def clink():
    n=int(1.2*SR); tt=np.arange(n)/SR; y=np.zeros(n); f=r.uniform(1900,2600)
    for m,a,dec in [(1,1,6),(2.32,.6,9),(4.25,.35,14),(6.63,.2,20)]: y+=a*np.sin(2*np.pi*f*m*tt+r.uniform(0,6))*np.exp(-tt*dec)
    y*=np.minimum(tt/0.001,1); return y*0.05
def creak():
    n=int(0.7*SR); tt=np.arange(n)/SR; rate=40+60*np.sin(np.pi*tt/0.7)**2+r.uniform(-8,8)
    ph=np.cumsum(rate/SR); pulses=(np.diff(np.floor(ph),prepend=0)>0).astype(float)
    y=bp(pulses,500,1800,3)*np.sin(np.pi*tt/0.7)**0.7; return y/np.abs(y).max()*0.035
for t in [3.1,4.0,17.5,29.2,29.6,41.0]: place(out,clink(),t)
for t in [11.0,35.5]: place(out,creak(),t)
# distant thunder once
n=int(6*SR); tt=np.arange(n)/SR; th=lp(r.standard_normal(n),120,4)*(np.minimum(tt/1.2,1)*np.exp(-np.maximum(tt-1.2,0)*0.8))
th=th/np.abs(th).max()*0.35; place(out,th,22.0)
out=reverb(out,wet=.18,rt=1.2,bright=3000,seed=4)[:, :N]
loop=norm(out,0.6)
w.write('amb.wav',SR,(loop.T*32767).astype(np.int16))
print('AMB',N/SR)
