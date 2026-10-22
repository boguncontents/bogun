/* Shared 16:9 stage scaler. Leave phone overlay native-sized for iPad Safari keyboard focus. */
(()=>{
 const W=1365,H=768;
 const app=document.querySelector('body > .app');
 if(!app)return;
 const resize=()=>{
  const vv=window.visualViewport;
  const width=vv?vv.width:window.innerWidth;
  const height=vv?vv.height:window.innerHeight;
  const offsetX=vv?vv.offsetLeft:0, offsetY=vv?vv.offsetTop:0;
  const scale=Math.min(width/W,height/H);
  document.body.style.setProperty('--scene-scale',String(scale));
  document.body.style.setProperty('--scene-x',`${offsetX+(width-W*scale)/2}px`);
  document.body.style.setProperty('--scene-y',`${offsetY+(height-H*scale)/2}px`);
  document.body.classList.add('scene-viewport-ready');
 };
 resize();
 window.addEventListener('resize',resize,{passive:true});
 window.visualViewport?.addEventListener('resize',resize,{passive:true});
 window.visualViewport?.addEventListener('scroll',resize,{passive:true});
})();
