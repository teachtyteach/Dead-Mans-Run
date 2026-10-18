# Builds the game from src/ into two outputs:
#   index.html          a full standalone page (GitHub Pages, any static host)
#   dist/artifact.html  the fragment version published as a Claude artifact (the host adds <html>/<head>)
import os
s=lambda f:open('src/'+f,encoding='utf-8').read()
js='\n'.join(s(f) for f in ['data.js','engine.js','portrait.js','vault.js','audio.js','ui.js'])
head=s('head.html'); style='<style>\n'+s('style.css')+'\n</style>\n'
scripts='\n<script>'+s('sounds.js')+'</script>\n<script>\n(function(){\n'+js+'\n})();\n</script>\n'
fragment=head+style+s('body.html')+scripts
page=('<!doctype html>\n<html lang="en">\n<head>\n'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
      '<meta name="theme-color" content="#0c0805">\n'
      '<link rel="manifest" href="manifest.webmanifest">\n'
      '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
      +head+style+'</head>\n<body>\n'+s('body.html')+scripts+
      "<script>if('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n"
      '</body>\n</html>\n')
open('index.html','w',encoding='utf-8').write(page)
os.makedirs('dist',exist_ok=True); open('dist/artifact.html','w',encoding='utf-8').write(fragment)
open('d.js','w',encoding='utf-8').write(js)   # for `node --check d.js`
print('index.html',len(page),'bytes')
