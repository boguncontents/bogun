/* Character expressions only; no game logic, scoring or layouts. */
window.DSExpressions = (() => {
  const root = 'assets/expressions/';
  const available = {
    harin:['smile','worry','surprise'],
    yuna:['worry','sad','relief'],
    doyun:['worry','surprise','sad','relief'],
    mom:['worry','smile'],
    teacher:['listening','smile']
  };
  const bases = {harin:'assets/harin.png',yuna:'assets/yuna.png',doyun:'assets/doyun.png',mom:'assets/mom.png',teacher:'assets/teacher.png'};
  for (const [character,moods] of Object.entries(available)) {
    for(const mood of moods){ const img=new Image(); img.src=root+character+'_'+mood+'.png'; }
  }
  function set(el,character,mood='base'){
    if(!el) return;
    const src = mood!=='base' && available[character]?.includes(mood) ? root+character+'_'+mood+'.png' : bases[character];
    if(!src) return;
    if(el.getAttribute('src')!==src) el.setAttribute('src',src);
  }
  return {set};
})();
