import json,re,sys,numpy as np
from PIL import Image
S=256; K=S/64
def hexc(h):
    h=h.lstrip('#'); h=''.join(c*2 for c in h) if len(h)==3 else h
    return np.array([int(h[i:i+2],16) for i in (0,2,4)],float)
def toks(d): return re.findall(r'[MLHVCZ]|-?\d*\.?\d+',d)
def subpaths(d):
    t=toks(d); i=0; out=[]; cur=None; pts=[]; cmd=None
    def num(): 
        nonlocal i; v=float(t[i]); i+=1; return v
    while i<len(t):
        if t[i] in 'MLHVCZ': cmd=t[i]; i+=1
        if cmd=='M':
            if pts: out.append(pts)
            cur=(num(),num()); pts=[cur]; cmd='L'
        elif cmd=='L': cur=(num(),num()); pts.append(cur)
        elif cmd=='H': cur=(num(),cur[1]); pts.append(cur)
        elif cmd=='V': cur=(cur[0],num()); pts.append(cur)
        elif cmd=='C':
            p1=(num(),num());p2=(num(),num());p3=(num(),num())
            for k in range(1,25):
                u=k/24; m=1-u
                pts.append((m**3*cur[0]+3*m*m*u*p1[0]+3*m*u*u*p2[0]+u**3*p3[0], m**3*cur[1]+3*m*m*u*p1[1]+3*m*u*u*p2[1]+u**3*p3[1]))
            cur=p3
        elif cmd=='Z': 
            cmd=None
    if pts: out.append(pts)
    return out
from PIL import ImageDraw
def maskof(d,stroke=None):
    im=Image.new('L',(S,S),0); dr=ImageDraw.Draw(im)
    for sp in subpaths(d):
        P=[(x*K,y*K) for x,y in sp]
        if stroke: dr.line(P,fill=255,width=max(1,int(stroke*K+.5)),joint='curve')
        elif len(P)>2: dr.polygon(P,fill=255)
    return np.asarray(im,float)/255
yy,xx=np.mgrid[0:S,0:S]; ux=(xx+.5)/K; uy=(yy+.5)/K
def paint(fill):
    if isinstance(fill,str): c=hexc(fill); return np.broadcast_to(c,(S,S,3)), np.ones((S,S))
    st=fill['stops']
    if 'lin' in fill:
        x1,y1,x2,y2=fill['lin']; dx,dy=x2-x1,y2-y1; L=dx*dx+dy*dy or 1
        t=((ux-x1)*dx+(uy-y1)*dy)/L
    else:
        cx,cy,r=fill['rad']; t=np.hypot(ux-cx,uy-cy)/r
    t=np.clip(t,0,1)
    offs=[s[0] for s in st]; cols=[hexc(s[1]) for s in st]; als=[s[2] for s in st]
    col=np.zeros((S,S,3)); a=np.interp(t,offs,als)
    for ch in range(3): col[...,ch]=np.interp(t,offs,[c[ch] for c in cols])
    return col,a
def render(shapes):
    img=np.zeros((S,S,3))
    masks={}
    for i,s in enumerate(shapes):
        if s.get('fill') in (None,'none') and s.get('stroke'):
            m=maskof(s['d'],s['sw']); col=np.broadcast_to(hexc(s['stroke']),(S,S,3)); a=np.ones((S,S))
        else:
            m=maskof(s['d']); col,a=paint(s['fill'])
        masks[i]=m
        if s.get('clip') is not None: m=m*masks[s['clip']]
        a=a*m*s.get('op',1)
        img=img*(1-a[...,None])+col*a[...,None]
    circ=(np.hypot(ux-32,uy-32)<=32).astype(float)
    out=np.dstack([img,circ*255]).clip(0,255).astype('uint8')
    return Image.fromarray(out,'RGBA')
data=json.load(open(sys.argv[1]))
n=len(data); cols=4; rows=(n+cols-1)//cols
sheet=Image.new('RGBA',(cols*(S+16)+16,rows*(S+16)+16),(30,24,20,255))
for k,sh in enumerate(data):
    sheet.alpha_composite(render(sh),(16+(k%cols)*(S+16),16+(k//cols)*(S+16)))
sheet.save(sys.argv[2])
