import json,re,sys
from PIL import Image, ImageDraw
G=json.load(open('hand/glyphs.json'))
def parse(d):
    toks=re.findall(r'[MC]|-?\d+\.?\d*',d); i=0; segs=[]; cur=None
    while i<len(toks):
        t=toks[i]
        if t=='M': cur=(float(toks[i+1]),float(toks[i+2])); i+=3; segs.append(('M',cur))
        elif t=='C':
            i+=1
            while i<len(toks) and toks[i] not in 'MC':
                p=[float(x) for x in toks[i:i+6]]; segs.append(('C',cur,(p[0],p[1]),(p[2],p[3]),(p[4],p[5]))); cur=(p[4],p[5]); i+=6
    return segs
def bez(p0,p1,p2,p3,n=30):
    out=[]
    for k in range(n+1):
        t=k/n; mt=1-t
        out.append((mt**3*p0[0]+3*mt*mt*t*p1[0]+3*mt*t*t*p2[0]+t**3*p3[0], mt**3*p0[1]+3*mt*mt*t*p1[1]+3*mt*t*t*p2[1]+t**3*p3[1]))
    return out
def layout(word):
    x=0; strokes=[]; extras=[]; prev=None
    for ch in word:
        if ch==' ': x+=G['_space']; prev=None; continue
        g=G[ch]; d=g['d']
        segs=parse(d)
        if prev and prev.get('exitY',0)!=0 and g.get('join',True):
            # high join: start this glyph at the previous exit height
            ey=prev['exitY']; s=segs[1]
            segs[0]=('M',(0,ey)); segs[1]=('C',(0,ey),(4,ey),s[3],s[4])
        pts=[]
        for s in segs:
            if s[0]=='M' and pts: strokes.append([(px+x,py) for px,py in pts]); pts=[]
            if s[0]=='C': pts+=bez(s[1],s[2],s[3],s[4])
        strokes.append([(px+x,py) for px,py in pts])
        if 'extra0' in g:
            ps=[]
            for s in parse(g['extra0']):
                if s[0]=='C': ps+=bez(s[1],s[2],s[3],s[4])
            strokes.append([(px+x,py) for px,py in ps])
        for e in g.get('extra',[]):
            ps=[]
            for s in parse(e):
                if s[0]=='C': ps+=bez(s[1],s[2],s[3],s[4])
            extras.append([(px+x,py) for px,py in ps])
        x+=g['w']; prev=g
    return strokes+extras, x
def render(words,out,scale=3):
    lines=[layout(w) for w in words]
    W=int(max(l[1] for l in lines)*scale+60); H=int(len(lines)*130*scale/1.3+40)
    im=Image.new('RGB',(W,H),(12,10,8)); dr=ImageDraw.Draw(im)
    for li,(strokes,w) in enumerate(lines):
        oy=90*scale+li*100*scale; ox=30
        dr.line([(ox,oy),(ox+w*scale,oy)],fill=(40,40,60)); dr.line([(ox,oy-30*scale),(ox+w*scale,oy-30*scale)],fill=(40,40,60))
        import math
        a=math.radians(38); nx,ny=math.cos(a),-math.sin(a)
        for st in strokes:
            for k in range(-6,7):
                o=k*0.33
                dr.line([(ox+(px-py*0.28+nx*o)*scale,oy+(py+ny*o)*scale) for px,py in st],fill=(250,238,210),width=max(2,int(0.9*scale)),joint='curve')
    im.save(out)
render(sys.argv[2:],sys.argv[1])
