/* 보건플레이랩 by JH Studio — additive mount, no game behavior modifications. */
window.JHBrand = (() => {
  let root = null;
  let overlay = null;
  let lastFocus = null;
  function close() {
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.body.removeAttribute('data-jh-brand-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }
  function mount({mode='home',target=document.body,assetBase='assets/'}={}) {
    if (root) root.remove();
    if (overlay) overlay.remove();
    root = document.createElement('div');
    root.id = 'jh-brand-root';
    overlay = null;
    if (mode === 'game') {
      root.innerHTML = '<span class="jh-brand-game" aria-label="저작권 JH Studio">© JH Studio</span>';
      target.appendChild(root);
      return root;
    }
    const brand = document.createElement('div');
    brand.className = 'jh-brand-home';
    brand.innerHTML = `<img src="${assetBase}brand-logo-small.png" alt="보건플레이랩 by JH Studio"><button type="button" class="jh-info" aria-haspopup="dialog">ⓘ 저작권 안내</button>`;
    root.appendChild(brand);
    target.appendChild(root);
    overlay = document.createElement('div');
    overlay.className = 'jh-brand-overlay';
    overlay.innerHTML = `<section class="jh-brand-dialog" role="dialog" aria-modal="true" aria-labelledby="jh-brand-title" tabindex="-1">
      <button class="jh-close" type="button" aria-label="저작권 안내 닫기">×</button>
      <img class="jh-popup-logo" src="${assetBase}brand-logo-small.png" alt="보건플레이랩 by JH Studio">
      <h2 id="jh-brand-title">콘텐츠 저작권 및 이용 안내</h2>
      <p>본 웹앱은 초등학교 보건교육을 목적으로<br>보건교사가 기획·제작한 체험형 교육 콘텐츠입니다.</p>
      <div class="jh-warning"><span class="jh-warning-symbol" aria-hidden="true">⊘</span><span>제작자의 사전 허락 없이 본 콘텐츠와 소스코드를 무단 복제·수정·재배포하거나 상업적으로 이용하는 것을 금지합니다.</span></div>
      <small class="jh-copyright">© 2026 JH Studio. All rights reserved.</small>
    </section>`;
    document.body.appendChild(overlay);
    const info = root.querySelector('.jh-info');
    const closeButton = overlay.querySelector('.jh-close');
    info.addEventListener('click', () => {
      lastFocus = document.activeElement;
      overlay.classList.add('open');
      document.body.setAttribute('data-jh-brand-open','true');
      closeButton.focus();
    });
    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', e => {if (e.target === overlay) close();});
    document.addEventListener('keydown', e => {
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        // Only one action inside the modal: keep keyboard focus on the close control.
        e.preventDefault(); closeButton.focus();
      }
    });
    return root;
  }
  return {mount,close};
})();
