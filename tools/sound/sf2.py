import struct, numpy as np
class SF2:
    def __init__(s,path):
        d=open(path,'rb').read(); s.d=d
        assert d[:4]==b'RIFF' and d[8:12]==b'sfbk'
        s.ch={}
        def walk(off,end):
            while off<end:
                cid=d[off:off+4]; sz=struct.unpack('<I',d[off+4:off+8])[0]
                if cid==b'LIST': walk(off+12,off+8+sz)
                else: s.ch[cid.decode()]=(off+8,sz)
                off+=8+sz+(sz&1)
        walk(12,len(d))
        o,n=s.ch['smpl']; s.smpl=np.frombuffer(d[o:o+n],dtype='<i2').astype(np.float32)/32768
        rec=lambda k,fmt: [struct.unpack(fmt,d[s.ch[k][0]+i*struct.calcsize(fmt):s.ch[k][0]+(i+1)*struct.calcsize(fmt)]) for i in range(s.ch[k][1]//struct.calcsize(fmt))]
        s.phdr=rec('phdr','<20sHHHIII'); s.pbag=rec('pbag','<HH'); s.pgen=rec('pgen','<Hh')
        s.inst=rec('inst','<20sH'); s.ibag=rec('ibag','<HH'); s.igen=rec('igen','<Hh')
        s.shdr=rec('shdr','<20sIIIIIBbHH')
    def gens(s,bags,gens,b0,b1):
        zones=[]
        for b in range(b0,b1):
            g0=bags[b][0]; g1=bags[b+1][0]; z={}
            for g in range(g0,g1):
                op,amt=gens[g]
                if op in (43,44): z[op]=(amt&0xff,(amt>>8)&0xff)
                else: z[op]=amt
            zones.append(z)
        return zones
    def preset(s,prog,bank=0):
        for i,p in enumerate(s.phdr[:-1]):
            if p[1]==prog and p[2]==bank:
                pz=s.gens(s.pbag,s.pgen,p[3],s.phdr[i+1][3]); out=[]
                gpz={} if 41 in pz[0] else pz[0]
                for z in pz:
                    if 41 not in z: continue
                    ins=z[41]; iz=s.gens(s.ibag,s.igen,s.inst[ins][1],s.inst[ins+1][1])
                    giz={} if 53 in iz[0] else iz[0]
                    for y in iz:
                        if 53 not in y: continue
                        m=dict(giz); m.update(y)
                        # preset generators add
                        add=dict(gpz); add.update({k:v for k,v in z.items() if k!=41})
                        out.append((m,add))
                return out
        raise KeyError(prog)
def tc(v): return 2**(v/1200.0)
class Inst:
    def __init__(s,sf,prog,sr=44100):
        s.sf=sf; s.sr=sr; s.z=sf.preset(prog)
    def note(s,key,vel,dur,rel=None):
        out=None; s.layers=0
        for m,add in s.z:
            kr=m.get(43,(0,127)); vr=m.get(44,(0,127))
            if 43 in add: kr=(max(kr[0],add[43][0]),min(kr[1],add[43][1]))
            if not(kr[0]<=key<=kr[1] and vr[0]<=vel<=vr[1]): continue
            g=lambda k,dv=0: m.get(k,dv)+add.get(k,0)
            sh=s.sf.shdr[m[53]]; name,st,en,ls,le,ssr,okey,corr,_,_=sh
            st+=g(0)+32768*g(4); en+=g(1)+32768*g(12); ls+=g(2)+32768*g(45); le+=g(3)+32768*g(50)
            root=m.get(58,-1); root=okey if root<0 else root
            cents=(key-root)*g(56,100)+g(51)*100+g(52)+corr
            ratio=tc(cents)*ssr/s.sr
            mode=m.get(54,0)
            att=g(48)/10.0  # cB->dB
            A=tc(g(34,-12000)); D=tc(g(36,-12000)); S=g(37)/10.0; Rl=tc(g(38,-12000)) if rel is None else rel
            tot=dur+min(Rl,3.0)
            N=int(tot*s.sr); pos=np.arange(N)*ratio
            data=s.sf.smpl
            if mode in (1,3) and le>ls+8:
                L=le-ls; p=pos.copy(); over=p>(le-st-1)
                p[over]=(ls-st)+np.mod(p[over]-(ls-st),L)
            else:
                p=pos; p=np.minimum(p,en-st-2)
            i=np.floor(p).astype(int); f=p-i
            y=data[st+i]*(1-f)+data[st+i+1]*f
            if not(mode in (1,3)): y[pos>=en-st-2]=0
            t=np.arange(N)/s.sr
            envl=np.ones(N)
            a=t<A; envl[a]=t[a]/max(A,1e-4)
            sus=10**(-S/20)
            dd=(t>=A)
            # decay in dB linear to sustain over D (SF2: time to fall 100dB)
            db=np.minimum((t[dd]-A)/max(D,1e-4)*100, S)
            envl[dd]=10**(-db/20)
            r=t>=dur
            if r.any():
                lvl=envl[np.searchsorted(t,dur)-1] if np.searchsorted(t,dur)>0 else 1
                envl[r]=lvl*10**(-(t[r]-dur)/max(Rl,1e-3)*100/20)
            velg=(vel/127.0)**1.6
            y=y*envl*10**(-att/20)*velg
            pan=g(17)/500.0
            pan=max(-1,min(1,pan)); st2=np.stack([y*np.sqrt((1-pan)/2),y*np.sqrt((1+pan)/2)])
            if out is None: out=st2
            else:
                n=max(out.shape[1],st2.shape[1]); o2=np.zeros((2,n)); o2[:,:out.shape[1]]+=out; o2[:,:st2.shape[1]]+=st2; out=o2
        return out
        raise KeyError(prog)
def tc(v): return 2**(v/1200.0)
class Inst:
    def __init__(s,sf,prog,sr=44100):
        s.sf=sf; s.sr=sr; s.z=sf.preset(prog)
    def note(s,key,vel,dur,rel=None):
        out=None; s.layers=0
        for m,add in s.z:
            kr=m.get(43,(0,127)); vr=m.get(44,(0,127))
            if 43 in add: kr=(max(kr[0],add[43][0]),min(kr[1],add[43][1]))
            if not(kr[0]<=key<=kr[1] and vr[0]<=vel<=vr[1]): continue
            g=lambda k,dv=0: m.get(k,dv)+add.get(k,0)
            sh=s.sf.shdr[m[53]]; name,st,en,ls,le,ssr,okey,corr,_,_=sh
            st+=g(0)+32768*g(4); en+=g(1)+32768*g(12); ls+=g(2)+32768*g(45); le+=g(3)+32768*g(50)
            root=m.get(58,-1); root=okey if root<0 else root
            cents=(key-root)*g(56,100)+g(51)*100+g(52)+corr
            ratio=tc(cents)*ssr/s.sr
            mode=m.get(54,0)
            att=g(48)/10.0  # cB->dB
            A=tc(g(34,-12000)); D=tc(g(36,-12000)); S=g(37)/10.0; Rl=tc(g(38,-12000)) if rel is None else rel
            tot=dur+min(Rl,3.0)
            N=int(tot*s.sr); pos=np.arange(N)*ratio
            data=s.sf.smpl
            if mode in (1,3) and le>ls+8:
                L=le-ls; p=pos.copy(); over=p>(le-st-1)
                p[over]=(ls-st)+np.mod(p[over]-(ls-st),L)
            else:
                p=pos; p=np.minimum(p,en-st-2)
            i=np.floor(p).astype(int); f=p-i
            y=data[st+i]*(1-f)+data[st+i+1]*f
            if not(mode in (1,3)): y[pos>=en-st-2]=0
            t=np.arange(N)/s.sr
            envl=np.ones(N)
            a=t<A; envl[a]=t[a]/max(A,1e-4)
            sus=10**(-S/20)
            dd=(t>=A)
            # decay in dB linear to sustain over D (SF2: time to fall 100dB)
            db=np.minimum((t[dd]-A)/max(D,1e-4)*100, S)
            envl[dd]=10**(-db/20)
            r=t>=dur
            if r.any():
                lvl=envl[np.searchsorted(t,dur)-1] if np.searchsorted(t,dur)>0 else 1
                envl[r]=lvl*10**(-(t[r]-dur)/max(Rl,1e-3)*100/20)
            velg=(vel/127.0)**1.6
            y=y*envl*10**(-att/20)*velg
            pan=g(17)/500.0
            pan=max(-1,min(1,pan)); st2=np.stack([y*np.sqrt((1-pan)/2),y*np.sqrt((1+pan)/2)])
            out=st2 if out is None else (out[:, :max(out.shape[1],st2.shape[1])] if out.shape[1]>=st2.shape[1] else np.pad(out,((0,0),(0,st2.shape[1]-out.shape[1]))))
            if out is not st2:
                out[:, :st2.shape[1]]+=st2
        return out
if __name__=='__main__':
    sf=SF2('/usr/share/sounds/sf2/TimGM6mb.sf2')
    for i,p in enumerate(sf.phdr[:-1]):
        if p[2]==0 and p[1] in (0,3,24,25,105,22,110,14,9,112): print(p[1],p[0].split(b'\0')[0])
    ins=Inst(sf,3)
    print(len(ins.z), [ (m.get(43),m.get(53)) for m,a in ins.z][:20])
