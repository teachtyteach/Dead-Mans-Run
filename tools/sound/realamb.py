import numpy as np, scipy.io.wavfile as w, subprocess, glob
from scipy.signal import butter, sosfilt
U='/root/.claude/uploads/7bf3b0a1-439d-5fac-b914-f4c1f2ed1665/'
def load(prefix,start,dur):
    f=glob.glob(U+prefix+'*')[0]
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-t',str(dur),'-i',f,'-ar','44100','-ac','2','tmp.wav'],check=True)
    sr,x=w.read('tmp.wav'); return sr,x.astype(np.float32).T/32768
def lp(x,sr,f): return sosfilt(butter(2,f/(sr/2),output='sos'),x,axis=-1)
def verb(x,sr,wet,rt):
    from scipy.signal import fftconvolve
    n=int(rt*sr); t=np.arange(n)/sr; r=np.random.default_rng(1)
    h=np.stack([r.standard_normal(n)*np.exp(-6.9*t/rt) for _ in range(2)]); h=lp(h,sr,3000); h/=np.abs(h).sum(1,keepdims=True).max()/3
    y=np.stack([fftconvolve(x[c],h[c])[:x.shape[1]] for c in range(2)]); return x*(1-wet)+y*wet
D=78  # 75s loop + 3s crossfade tail
CFG={1:('e41df2f8',20,None,None,-31),2:('0b5ff133',10,9000,None,-30),3:('ddec9ed2',60,2600,(.45,2.4),-31),4:('75e3beeb',5,None,None,-31),
     5:('a7729f7e',8,None,None,-29),6:('0b5ff133',100,3800,(.25,1.2),-32),7:('ddec9ed2',0,None,None,-31),8:('10f55456',5,5000,None,-28)}
for n,(p,st,lpf,rv,target) in CFG.items():
    sr,x=load(p,st,D if p!='10f55456' else 84.8)
    if lpf: x=lp(x,sr,lpf)
    if rv: x=verb(x,sr,*rv)
    rms=np.sqrt((x**2).mean()); g=10**(target/20)/rms; g=min(g,0.85/np.abs(x).max()); x=x*g
    w.write('tmp2.wav',sr,(x.T*32767).astype(np.int16))
    subprocess.run(['ffmpeg','-v','error','-y','-i','tmp2.wav','-c:a','libmp3lame','-b:a','96k','../audio/amb%d.mp3'%n],check=True)
    print(n, round(x.shape[1]/sr,1),'s gain dB',round(20*np.log10(g),1))
# revolver: three variations, trimmed with natural tail
for k,st in enumerate((0,3,6)):
    sr,x=load('dd8b263a',st,2.9); x=x/np.abs(x).max()*.9
    fade=int(.3*sr); x[:,-fade:]*=np.linspace(1,0,fade)
    w.write('tmp2.wav',sr,(x.T*32767).astype(np.int16))
    subprocess.run(['ffmpeg','-v','error','-y','-i','tmp2.wav','-c:a','libmp3lame','-b:a','128k','../audio/gun%d.mp3'%k],check=True)
print('ok')
