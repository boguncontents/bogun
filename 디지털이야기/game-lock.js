(() => {
  'use strict';
  // Only the top-level page checks status. Embedded chat follows the parent lock.
  if (window !== window.top) return;
  const STATUS_URL = 'https://digital-safety-ai.choijihey.workers.dev/status';
  const CHECK_INTERVAL_MS = 15000;
  let overlay;
  let message;
  let indicator;
  let busy = false;
  let didCheck = false;
  let active = true;

  function setup() {
    if (document.getElementById('ds-game-lock')) return;
    const css = document.createElement('style');
    css.textContent = `
      #ds-game-lock{position:fixed;inset:0;z-index:2147483647;display:flex;justify-content:center;align-items:center;padding:24px max(20px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));background:#182d46;color:#193750;font-family:system-ui,-apple-system,'Noto Sans KR',sans-serif;box-sizing:border-box;text-align:center}
      #ds-game-lock[hidden]{display:none!important}
      #ds-game-lock *{box-sizing:border-box}
      #ds-game-lock .ds-lock-card{width:min(480px,100%);padding:clamp(26px,5vw,40px);border-radius:22px;background:#fff9ee;box-shadow:0 16px 65px #081c35aa}
      #ds-game-lock .ds-lock-title{font-weight:850;font-size:clamp(23px,3.2vw,33px);line-height:1.35;margin:0 0 18px}
      #ds-game-lock .ds-lock-copy{color:#496075;font-size:clamp(16px,2vw,20px);line-height:1.7;margin:0 0 20px;white-space:pre-line}
      #ds-game-lock .ds-lock-retry{background:#295982;border:0;border-radius:13px;padding:12px 22px;color:white;font-weight:750;font-size:17px;cursor:pointer;min-height:48px}
      #ds-game-lock .ds-lock-note{font-size:13px;color:#66798a;line-height:1.5;margin:16px 0 0}
      #ds-class-status{position:fixed;z-index:2147483646;top:calc(env(safe-area-inset-top) + 51px);right:calc(env(safe-area-inset-right) + 12px);padding:6px 10px;border:1px solid #ffffff80;border-radius:999px;background:#173e5ddd;color:#fff;font:700 12px/1.3 system-ui,-apple-system,'Noto Sans KR',sans-serif;box-shadow:0 3px 12px #10273d45;pointer-events:none;white-space:nowrap}
      #ds-class-status[hidden]{display:none!important}
    `;
    document.head.appendChild(css);
    overlay = document.createElement('section');
    overlay.id='ds-game-lock';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','수업 이용 안내');
    overlay.innerHTML='<div class="ds-lock-card"><h1 class="ds-lock-title">우리들의 디지털 안전 이야기</h1><p class="ds-lock-copy" id="ds-lock-message"></p><button class="ds-lock-retry" type="button">상태 다시 확인</button><p class="ds-lock-note">수업이 시작되면 선생님의 안내에 따라 접속해 주세요.</p></div>';
    document.body.appendChild(overlay);
    indicator=document.createElement('div');
    indicator.id='ds-class-status';
    indicator.setAttribute('role','status');
    indicator.setAttribute('aria-live','polite');
    indicator.hidden=true;
    document.body.appendChild(indicator);
    message = overlay.querySelector('#ds-lock-message');
    overlay.querySelector('button').addEventListener('click', check);
    show('수업 이용 가능 여부를 확인하고 있어요.');
    check();
    document.addEventListener('visibilitychange',()=>{if (!document.hidden) check();});
    window.addEventListener('focus',()=>check());
    window.setInterval(()=>{if(!document.hidden)check();},CHECK_INTERVAL_MS);
  }
  function show(copy){
    overlay.hidden=false;
    if(indicator) indicator.hidden=true;
    message.textContent=copy;
    // Prevent accidental interaction with game below the overlay.
    document.body.style.setProperty('overscroll-behavior','none');
  }
  function hide(){
    overlay.hidden=true;
    if(indicator){
      indicator.textContent='● 수업 ON · AI 사용 허용';
      indicator.hidden=false;
    }
  }
  async function check(){
    if (busy) return;
    busy=true;
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),8000);
    try {
      const res=await fetch(STATUS_URL,{method:'GET',cache:'no-store',headers:{'Accept':'application/json'},signal:controller.signal});
      if(!res.ok) throw new Error('status '+res.status);
      const data=await res.json();
      if (typeof data.enabled!=='boolean') throw new Error('Invalid status response');
      active=data.enabled;
      didCheck=true;
      if(active) hide();
      else show('오늘의 수업이 종료되었습니다.\n다음 수업 시간에 다시 만나요!');
    } catch(err) {
      // Fail closed at the UI level when status is unknown. The Worker also protects Gemini.
      show('수업 상태를 확인할 수 없어요.\n인터넷 연결을 확인하고 다시 시도해 주세요.');
    } finally {clearTimeout(timer);busy=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
