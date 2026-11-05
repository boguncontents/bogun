/* Integrate at the appropriate screen transition; do not automatically inject on every page. */
window.JHBrand = (() => {
 let current=null;
 function mount({mode='home',logo='small',target=document.body,assetBase='assets/'}={}) {
  if(current) current.remove();
  const host=document.createElement('div'); host.id='jh-brand-root';
  if(mode==='game') host.innerHTML='<span class="jh-brand-game">© JH Studio</span>';
  else {
   const logoFile=logo==='large'?'brand-logo-large.png':'brand-logo-small.png';
   host.innerHTML=`<div class="jh-brand-home ${logo==='large'?'large':''}"><img src="${assetBase}${logoFile}" alt="보건플레이랩 by JH Studio"><button type="button" class="jh-info">ⓘ 저작권 안내</button></div><div class="jh-brand-overlay"><section class="jh-brand-dialog" role="dialog" aria-modal="true" aria-label="저작권 안내"><button class="jh-close" type="button" aria-label="닫기">×</button><img src="${assetBase}brand-logo-small.png" alt="보건플레이랩 by JH Studio"><h2>콘텐츠 저작권 및 이용 안내</h2><p>본 웹앱은 초등학교 보건교육을 목적으로 보건교사가 기획·제작한 체험형 교육 콘텐츠입니다.</p><p class="jh-warning">제작자의 사전 허락 없이 본 콘텐츠와 소스코드를 무단 복제·수정·재배포하거나 상업적으로 이용하는 것을 금지합니다.</p><small>© 2026 JH Studio. All rights reserved.</small></section></div>`;
   const overlay=host.querySelector('.jh-brand-overlay');
   const close=()=>overlay.classList.remove('open');
   host.querySelector('.jh-info').addEventListener('click',()=>overlay.classList.add('open'));
   host.querySelector('.jh-close').addEventListener('click',close);
   overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  }
  target.appendChild(host);current=host;return host;
 }
 return {mount};
})();
