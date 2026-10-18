import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
SR=44100
rng=np.random.default_rng(7)
def lp(x,f,o=2): return sosfilt(butter(o,f/(SR/2),'low',output='sos'),x,axis=-1)
def hp(x,f,o=2): return sosfilt(butter(o,f/(SR/2),'high',output='sos'),x,axis=-1)
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo/(SR/2),hi/(SR/2)],'band',output='sos'),x,axis=-1)
def shelf_warm(x): return x+0.35*lp(x,260)
def ir(rt=1.5,pre=0.012,bright=5000,seed=1):
    r=np.random.default_rng(seed); n=int(rt*1.3*SR); t=np.arange(n)/SR
    out=np.zeros((2,n))
    for c in range(2):
        e=r.standard_normal(n)*np.exp(-6.9*t/rt)
        # damping: blend progressively lowpassed
        e=e*(1-t/t[-1])**0.2
        e1=lp(e,bright); e2=lp(e,1400)
        w=np.clip(t/(rt*0.6),0,1)
        e=e1*(1-w)+e2*w
        # early reflections
        for k in range(8):
            d=int((pre+r.uniform(0.004,0.06))*SR); e[d]+=r.uniform(.2,.6)*(-1)**k
        e[:int(pre*SR)]=0
        out[c]=e
    return out/np.abs(out).sum(axis=1,keepdims=True).max()*3
def reverb(x,wet=.25,rt=1.5,bright=5000,seed=1):
    h=ir(rt,bright=bright,seed=seed)
    if x.ndim==1: x=np.stack([x,x])
    y=np.stack([fftconvolve(x[c],h[c])[:x.shape[1]+h.shape[1]-1] for c in range(2)])
    xx=np.pad(x,((0,0),(0,y.shape[1]-x.shape[1])))
    return xx*(1-wet)+y*wet
def norm(x,peak=0.9): return x/np.abs(x).max()*peak
def place(buf,x,t):
    i=int(t*SR)
    if x.ndim==1: x=np.stack([x,x])
    n=min(x.shape[1],buf.shape[1]-i)
    if n>0: buf[:,i:i+n]+=x[:,:n]
def soft(x,d=1.4): return np.tanh(x*d)/np.tanh(d)
