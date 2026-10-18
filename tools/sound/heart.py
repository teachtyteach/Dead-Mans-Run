exec(open('sfx.py').read().split('# chips')[0])
L=int(0.7*SR); x=np.zeros(L)
for tt,a in [(0,1.0),(0.24,0.7)]:
    d=.25; t=T(d); y=np.sin(2*np.pi*(62*t-30*t*t))*np.exp(-t*22)*np.minimum(t/0.006,1)+lp(noise(d),120,4)*np.exp(-t*30)*0.8
    i=int(tt*SR); x[i:i+len(y)]+=y[:L-i]*a
save('heart',lp(x,300),0.8,room=.1,rt=.6)
