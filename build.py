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
      # home-screen app runs edge to edge: keep content clear of the notch, Dynamic Island and home bar
      '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:calc(env(safe-area-inset-bottom,0px)*0.45);background-color:#160d07}'
      # iOS draws a soft blur band under the status bar in home-screen apps; start the game below it so nothing important sits in the haze
      '@media (display-mode:standalone),(display-mode:fullscreen){:root{padding-top:calc(env(safe-area-inset-top,0px) + 30px)}}</style>\n'
      # iOS home-screen apps lay out ~70pt shorter than the screen and leave a dead strip under it.
      # Stretch the app to the real screen height and pin the scroll at the top so nothing slides under the clock.
      "<script>(function(){if(!(navigator.standalone||matchMedia('(display-mode: standalone)').matches))return;var d=document.documentElement;"
      "function f(){var p=innerHeight>=innerWidth,sh=p?Math.max(screen.height,screen.width):Math.min(screen.height,screen.width),sw=p?Math.min(screen.height,screen.width):Math.max(screen.height,screen.width),h=Math.max(sh,innerHeight),ch=d.clientHeight;if(Math.abs(sw-innerWidth)>24||h-innerHeight>140)h=innerHeight;window.__dims=[sh,innerHeight,ch,(visualViewport||{}).height|0];if(h>ch+2){d.style.setProperty('--appH',h+'px');d.classList.add('tall')}else{d.classList.remove('tall')}scrollTo(0,0)}"
      "f();addEventListener('resize',function(){f();setTimeout(f,300);setTimeout(f,900)});addEventListener('orientationchange',function(){setTimeout(f,350)});addEventListener('scroll',function(){if(scrollY&&d.classList.contains('locked'))scrollTo(0,0)},{passive:true})})();</script>\n"
      '<link rel="manifest" href="manifest.webmanifest">\n'
      '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
      +head+style+'</head>\n<body>\n'+s('body.html')+scripts+
      "<script>if('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n"
      '</body>\n</html>\n')
open('index.html','w',encoding='utf-8').write(page)
os.makedirs('dist',exist_ok=True); open('dist/artifact.html','w',encoding='utf-8').write(fragment)
open('d.js','w',encoding='utf-8').write(js)   # for `node --check d.js`
print('index.html',len(page),'bytes')

# the iPhone app bundles the same game: copy the page, sounds and icons into ios/DeadMansRun/www
import shutil, os
www=os.path.join(os.path.dirname(os.path.abspath(__file__)),'ios','DeadMansRun','www')
if os.path.isdir(os.path.dirname(www)):
    shutil.rmtree(www,ignore_errors=True); os.makedirs(www)
    base=os.path.dirname(os.path.abspath(__file__))
    shutil.copy(os.path.join(base,'index.html'),www)
    shutil.copytree(os.path.join(base,'audio'),os.path.join(www,'audio'))
    shutil.copytree(os.path.join(base,'icons'),os.path.join(www,'icons'))
    shutil.copy(os.path.join(base,'manifest.webmanifest'),www)
