/* 보건플레이랩 브랜드 전용: 원본 app.js의 기능이나 저장 로직을 변경하지 않습니다. */
window.JHBrand = (() => {
  let currentRoot = null;
  let currentOverlay = null;
  let lastFocus = null;
  const logoPath = 'assets/brand-logo-small.png';

  function closeInfo() {
    if (!currentOverlay) return;
    currentOverlay.classList.remove('open');
    currentOverlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeyDown);
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }

  function onKeyDown(event) {
    if (!currentOverlay?.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInfo();
    } else if (event.key === 'Tab') {
      const controls = [...currentOverlay.querySelectorAll('button')];
      const first = controls[0], last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  function clear() {
    if (currentOverlay) {
      document.removeEventListener('keydown', onKeyDown);
      currentOverlay.remove();
      currentOverlay = null;
    }
    if (currentRoot) {
      currentRoot.remove();
      currentRoot = null;
    }
  }

  function openInfo() {
    if (!currentOverlay) return;
    lastFocus = document.activeElement;
    currentOverlay.classList.add('open');
    currentOverlay.setAttribute('aria-hidden', 'false');
    currentOverlay.querySelector('.jh-close').focus();
    document.addEventListener('keydown', onKeyDown);
  }

  function sync(screen) {
    clear();
    const app = document.getElementById('app');
    if (!app) return;
    const isWelcome = screen === 'home' && app.querySelector('.home-layout');
    currentRoot = document.createElement('div');
    currentRoot.id = 'jh-brand-root';
    if (isWelcome) {
      currentRoot.innerHTML = `<div class="jh-brand-home"><img src="${logoPath}" alt="보건플레이랩 by JH Studio"><button type="button" class="jh-info" aria-haspopup="dialog">ⓘ 저작권 안내</button></div>`;
      app.querySelector('.home-layout').appendChild(currentRoot);
      currentOverlay = document.createElement('div');
      currentOverlay.id = 'jh-brand-overlay';
      currentOverlay.setAttribute('aria-hidden', 'true');
      currentOverlay.innerHTML = `<section class="jh-brand-dialog" role="dialog" aria-modal="true" aria-labelledby="jh-info-title">
        <button type="button" class="jh-close" aria-label="저작권 안내 닫기">×</button>
        <img class="jh-dialog-logo" src="${logoPath}" alt="보건플레이랩 by JH Studio">
        <h2 id="jh-info-title">콘텐츠 저작권 및 이용 안내</h2>
        <p class="jh-description">본 웹앱은 초등학교 보건교육을 목적으로<br>보건교사가 기획·제작한 체험형 교육 콘텐츠입니다.</p>
        <div class="jh-warning"><span class="jh-warning-icon" aria-hidden="true">🚫</span><span>제작자의 사전 허락 없이 본 콘텐츠와 소스코드를 무단 복제·수정·재배포하거나 상업적으로 이용하는 것을 금지합니다.</span></div>
        <small class="jh-copyright">© 2026 JH Studio. All rights reserved.</small>
      </section>`;
      document.body.appendChild(currentOverlay);
      currentRoot.querySelector('.jh-info').addEventListener('click', openInfo);
      currentOverlay.querySelector('.jh-close').addEventListener('click', closeInfo);
      currentOverlay.addEventListener('click', (e) => { if (e.target === currentOverlay) closeInfo(); });
    } else {
      currentRoot.innerHTML = '<span class="jh-brand-game">© JH Studio</span>';
      document.body.appendChild(currentRoot);
    }
  }

  return { sync };
})();
