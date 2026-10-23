/* 우리반 약국 — v9: 보건 Firebase 연결 + 보건실 PC 교사 로그인 유지 */
(() => {
  'use strict';
  const cfg = window.PHARMACY_CONFIG || {};
  const classes = cfg.classes || ['6-1','6-2','6-3'];
  const connected = !!(cfg.firebase?.apiKey && cfg.firebase?.authDomain && cfg.firebase?.projectId && cfg.firebase?.appId);
  const app = document.querySelector('#app');
  const toastNode = document.querySelector('#toast');
  const AS = 'assets/';
  const boxColors = [
    { id:'mint',name:'민트',hex:'#91d0be'},
    { id:'yellow',name:'노랑',hex:'#ffda77'},
    { id:'coral',name:'살구',hex:'#f6b3a6'},
    { id:'purple',name:'보라',hex:'#b8b0e9'},
    { id:'blue',name:'하늘',hex:'#a4d3f0'},
  ];
  const extraDecos = ['✨','⭐','🌼','🍀','💗','🌈','☁️','🌙','🌱','🎀'];
  const fields = [
    {key:'medicineName',label:'약 이름',icon:'💊',max:20,rows:1,help:'내가 상상한 약의 특징이 드러나도록 짧고 기억하기 쉬운 이름을 지어 보세요.'},
    {key:'effect',label:'효능·효과',icon:'🧠',max:120,rows:3,help:'이 약을 먹으면 어떤 도움을 받을 수 있는지 설명해 보세요. 상상 속 약이므로 재미있는 효과도 좋아요.'},
    {key:'dosage',label:'용법·용량',icon:'📅',max:75,rows:2,help:'한 번에 몇 알, 하루에 몇 번 먹는지처럼 복용하는 양과 횟수를 적어 보세요.'},
    {key:'method',label:'복용 방법',icon:'🥛',max:100,rows:3,help:'약을 어떻게 먹는지 적는 곳이에요. 상상 속 약만의 특별한 방법도 더할 수 있어요.'},
    {key:'caution',label:'주의사항',icon:'⚠️',max:175,rows:4,help:'많이 먹으면 생길 일이나 주의할 점을 적어 보세요. 부작용이나 복용을 멈춰야 할 상황 등 두 가지 정도를 적으면 좋아요.'},
    {key:'storage',label:'보관 방법',icon:'🏠',max:100,rows:2,help:'어디에, 어떤 상태로 보관해야 하는지 설명해 보세요.'},
  ];
  const example = {
    studentName:'12번',medicineName:'똑똑이',
    effect:'집중하는 힘을 높여 공부할 때 생각이 잘 떠오르게 도와주는 약이에요. 새로운 것을 배우고 기억하는 데 도움을 줄 수 있어요.',
    dosage:'하루에 한 번, 공부하기 전에 한 알 먹어요.',
    method:'물과 함께 천천히 삼킨 후, 잘 기억하고 싶은 과목이나 내용을 떠올려 보세요. ✨',
    caution:'① 정해진 양보다 많이 먹으면 잠이 잘 오지 않을 수 있어요.\n② 복용 후 악몽을 꾸는 경우 복용을 중단하세요.',
    storage:'햇빛이 없는 서늘한 곳에 보관해요.'
  };
  const makeDraft = () => ({studentName:'',medicineName:'',effect:'',dosage:'',method:'',caution:'',storage:'',boxDesign:'mint',pillDesign:'01',decorations:[]});
  // 학급은 첫 입장 화면에서 학생이 선택합니다.
  // 홈 화면으로 돌아와도 유지되고, 새로고침·새 탭 접속 시 다시 선택합니다.
  // 옛 QR의 ?class= 값은 더 이상 학급을 지정하지 않습니다.
  let currentClass = null;
  const draftKey = () => `pharmacy-draft:${currentClass}`;
  const postedKey = () => `pharmacy-posted:${currentClass}`;
  const loadDraft = () => { try {return {...makeDraft(),...JSON.parse(sessionStorage.getItem(draftKey()) || '{}')};} catch {return makeDraft();} };
  let draft = makeDraft();
  let screen = 'home', editReturn = 'design', modal = '', galleryItems = [], postedId = '', currentAdmin = false;
  let showingHint = new Set();
  let galleryLoaded = false;
  let firebaseApi;
  let galleryAuthorized = false;
  let galleryClass = null;
  const h = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const toast = (s) => {toastNode.textContent=s;toastNode.classList.add('visible');clearTimeout(toastNode._timer);toastNode._timer=setTimeout(()=>toastNode.classList.remove('visible'),3200)};
  const persist = () => sessionStorage.setItem(draftKey(),JSON.stringify(draft));
  const clsLabel = (c) => c.replace('-', '학년 ')+'반';
  const pageTop = () => {window.scrollTo(0,0)};
  const goto = (next) => {screen=next;render();pageTop()};
  const btn = (label,act,cl='')=>`<button class="btn ${cl}" type="button" data-action="${act}">${label}</button>`;
  function topbar(){return `<header class="topbar"><div class="topbar-inner"><button type="button" class="brand" data-action="home"><span class="brand-icon">✚</span>우리반 약국</button><div class="head-tools"><span class="tag ${connected?'':'demo'}">${connected?'학급 공유 모드':'시연 모드 · 이 기기만 저장'}</span><span class="class-badge" aria-label="현재 학급">${h(clsLabel(currentClass))}</span>${screen === 'home' ? '' : `<button class="admin-link" data-action="home">⌂ 첫 화면</button>`}</div></div></header>`;}
  function home(){return `<main class="home"><div class="home-layout"><img class="home-art" src="${AS}outside.webp" alt="따뜻한 햇살 속의 우리반 약국 외관과 유리문"/><div class="home-class-badge" aria-label="접속한 학급">${h(clsLabel(currentClass))}</div><section class="home-panel" aria-label="우리반 약국 메뉴"><h1 class="sr-only">우리반 약국</h1><div class="home-buttons"><button type="button" class="home-card" data-action="intro"><strong>💊 약국에 들어가기</strong><small>나만의 약상자와 복약지도서 만들기</small></button><button type="button" class="home-card gallery" data-action="gallery-login"><strong>🏪 우리반 약장 감상하기 🔒</strong><small>친구들이 만든 약 살펴보기</small></button></div></section><button type="button" class="home-admin" data-action="admin-login">⚙ 관리자</button></div></main>`}
  function classGate(){return `<main class="home class-gate"><div class="home-layout"><img class="home-art" src="${AS}outside.webp" alt="우리반 약국의 따뜻한 외관"/><section class="class-gate-panel" aria-labelledby="class-gate-title"><span class="class-gate-kicker">💚 우리반 약국에 오신 것을 환영해요!</span><h1 id="class-gate-title">우리 반을 선택해 주세요</h1><p>우리 반을 누르면 약국으로 들어갈 수 있어요.</p><div class="class-gate-buttons">${classes.map(c=>`<button type="button" class="class-gate-btn" data-action="choose-class" data-value="${h(c)}"><span class="class-gate-icon">🏫</span><strong>${h(clsLabel(c))}</strong><small>이 반으로 입장 →</small></button>`).join('')}</div><div class="class-gate-note">선택한 반의 복약지도서와 약장을 이용해요.<br>잘못 선택했다면 새로고침 후 다시 골라 주세요.</div></section><button type="button" class="home-admin" data-action="admin-login">⚙ 관리자</button></div></main>`}
  function intro(){return `<main class="main intro-page"><section class="intro-scene"><img class="intro-bg" src="${AS}inside.webp" alt="파스텔톤 우리반 약국 내부, 약 진열대와 카운터"/><div class="intro-shade"></div><div class="intro-content"><img class="pharmacist" src="${AS}pharmacist.webp" alt="친절하게 안내하는 약사"/><div class="speech"><h2>어서 오세요! 💚</h2><p>안녕하세요! 저는 우리반 약국의 약사예요.<br>오늘은 내가 상상한 특별한 약을 만들고, <strong>복약지도서</strong>를 작성해 볼 거예요.<br>나만의 약을 만들어 우리반 약국에 전시해 봅시다.</p>${btn('복약지도서 만들기 시작 →','worksheet')}</div></div></section></main>`}
  function fieldHTML(f){const v=draft[f.key]||'';const isShown=showingHint.has(f.key);return `<div class="row-field" data-field="${f.key}"><div class="field-label"><span>${f.icon} ${f.label}</span><button type="button" class="help" aria-label="${f.label} 도움말" aria-expanded="${isShown}" data-action="help" data-key="${f.key}">?</button></div><div class="field-input">${f.rows===1?`<input autocomplete="off" name="${f.key}" maxlength="${f.max}" value="${h(v)}" placeholder="예: 내가 상상한 약 이름">`:`<textarea name="${f.key}" maxlength="${f.max}" rows="${f.rows}" placeholder="여기에 내용을 써 보세요">${h(v)}</textarea>`}<div class="field-meta"><span>${f.rows===1?'약 이름을 지어 보세요':'상상 속 약의 정보를 문장으로 작성해요'}</span><span class="counter" data-counter="${f.key}">${v.length}/${f.max}자</span></div><div class="field-hint ${isShown?'show':''}">${h(f.help)}</div></div></div>`}
  function exampleSheet(item=example,displayName=true){return `<div class="example-sheet"><div class="example-heading"><div class="kicker">✚ 우리반 약국</div><div class="title">나만의 <strong>복약지도서</strong></div></div>${displayName?`<div class="example-person">👩‍🎓 ${h(item.studentName || '학급 번호 미선택')}</div>`:''}${fields.map(f=>`<div class="example-item"><div class="example-label">${f.icon}<br>${f.label}</div><div class="val">${h(item[f.key]||'—').replaceAll('\n','<br>')}</div></div>`).join('')}<div class="disclaimer">※ 학생이 상상해서 만든 가상의 약입니다. 실제 의약품이 아닙니다.</div></div>`}
  function worksheet(){return `${topbar()}<main class="main worksheet-page"><div class="kicker">STEP 1 · 가장 중요한 활동</div><h1 class="page-title">📄 나만의 복약지도서 만들기</h1><p class="subtitle">왼쪽에 내 생각을 쓰고, 오른쪽 <b>「똑똑이」 예시</b>를 참고해 보세요. 항목 옆 <b>?</b>를 누르면 설명이 나와요.</p><div class="work-grid"><section class="worksheet-col"><div class="worksheet"><div class="sheet-header"><div class="kicker">✚ 우리반 약국</div><h2>나만의 복약지도서</h2><p>나만의 특별한 상상 약을 소개해 보세요!</p><label class="name-label" for="studentName">학년 · 반 · 학급 번호</label><div class="student-name"><span>${h(clsLabel(currentClass))}</span><select id="studentName" name="studentName" aria-label="본인의 학급 번호 선택" style="min-width:130px;max-width:100%;padding:12px;border:1px solid #b3cdc3;border-radius:10px;background:white;font:inherit"><option value="">번호 선택</option>${Array.from({length:30},(_,i)=>`${i+1}번`).map(num=>`<option value="${num}" ${draft.studentName===num?'selected':''}>${num}</option>`).join('')}</select></div></div><div class="sheet-fields">${fields.map(fieldHTML).join('')}</div></div><div class="actions">${btn('← 첫 화면','home','outline')}${btn(editReturn==='finish'?'수정 완료 · 완성 화면으로 →':'작성 완료 · 약상자 꾸미기로 →','submit-worksheet')}</div></section><aside class="example-wrap" aria-label="스크롤되지 않는 전체 복약지도서 예시"><div class="example-visual"><div class="example-banner">💡 항상 볼 수 있는 작성 예시 · 똑똑이</div>${exampleSheet(example,false)}</div></aside></div></main>`}
  function boxHTML(item,{mini=false}={}){let p=String(item.pillDesign||'01').padStart(2,'0');let color=boxColors.find(b=>b.id===item.boxDesign)?item.boxDesign:'mint';return `<div class="box-product ${mini?'mini':''}" role="img" aria-label="${h(item.medicineName||'이름 없는 약')} 약상자"><img class="box-bg" src="${AS}box_${color}.webp" alt=""><div class="med-title">${h(item.medicineName||'나의 특별한 약')}</div><img class="pill-art" src="${AS}pill_${p}.webp" alt="">${['a','b','c','d','e'].map((slot,i)=>`<span class="deco ${slot}">${h(item.decorations?.[i]||'')}</span>`).join('')}</div>`}
  function design(){return `${topbar()}<main class="main"><div class="kicker">STEP 2 · 내 약을 담는 포장 만들기</div><h1 class="page-title">💊 나만의 약상자 꾸미기</h1><p class="subtitle">지도서에 쓴 <strong>약 이름이 자동으로 들어가요.</strong> 이름 칸은 가리지 않고 알약과 스티커를 골라 꾸며 보세요!</p><div class="design-grid"><div class="design-settings"><section class="surface"><h2 class="option-title">① 약상자 색 고르기</h2><div class="choice-grid">${boxColors.map(b=>`<button class="choice ${draft.boxDesign===b.id?'selected':''}" data-action="color" data-value="${b.id}" aria-pressed="${draft.boxDesign===b.id}"><span class="swatch" style="background:${b.hex}"></span>${b.name}</button>`).join('')}</div></section><section class="surface"><h2 class="option-title">② 알약 스티커 고르기</h2><div class="pill-choices">${Array.from({length:10},(_,i)=>String(i+1).padStart(2,'0')).map(v=>`<button type="button" class="pill-choice ${draft.pillDesign===v?'selected':''}" data-action="pill" data-value="${v}" aria-label="알약 스티커 ${Number(v)}" aria-pressed="${draft.pillDesign===v}"><img src="${AS}pill_${v}.webp" alt=""></button>`).join('')}</div></section><section class="surface"><h2 class="option-title">③ 추가 꾸미기 <small>(최대 5개)</small></h2><p class="subtitle">원하는 스티커를 고르면 약 이름을 가리지 않는 지정 위치에 붙어요.</p><div class="deco-choices">${extraDecos.map(v=>`<button type="button" class="deco-choice ${draft.decorations.includes(v)?'selected':''}" aria-pressed="${draft.decorations.includes(v)}" data-action="deco" data-value="${v}">${v}</button>`).join('')}</div></section><div class="actions">${btn('📄 복약지도서 수정하기','edit-from-design','outline')}${btn('꾸미기 완료 →','finish')}</div></div><aside class="surface design-preview"><div class="preview-caption">✨ 내 약상자 미리보기</div><div class="product-holder" id="productPreview">${boxHTML(draft)}</div><p class="display-note">가운데 약 이름이 가장 크게 보이고, 스티커는 이름 칸을 침범하지 않아요.<br>복약지도서의 다른 정보는 약상자에 표시되지 않아요.</p></aside></div></main>`}
  function finish(){return `${topbar()}<main class="main"><div class="surface" style="max-width:1080px;margin:30px auto"><div class="finish-grid"><div class="product-holder">${boxHTML(draft)}</div><div class="finish-text"><div class="kicker">STEP 3 · 최종 확인</div><h2>🎉 나만의 약이 완성되었어요!</h2><p><strong>${h(draft.medicineName)}</strong> 약의 복약지도서와 포장을 확인하고 전시해 보세요.</p>${postedId?'<p class="inline-alert">✅ 이 작품을 약장에 전시했어요.</p>':''}<div class="actions" style="justify-content:flex-start">${btn('📄 내 복약지도서 보기','own-detail','secondary')}${btn('✏️ 복약지도서 수정하기','edit-from-finish','outline')}${btn('🎨 약상자 다시 꾸미기','design','outline')}${btn(postedId?'✅ 전시된 내용 다시 저장':'🏪 약장에 전시하기','publish')}${postedId?btn('🔒 우리반 약장 감상하기','gallery-login','secondary'):''}</div><p class="place-info">약장과 약상자에는 작성자 이름을 표시하지 않아요. <strong>복약지도서를 펼칠 때만</strong> 이름이 보여요.</p></div></div></div></main>`}
  function gallery(){const n=galleryItems.length;const perRow=window.matchMedia('(max-width:650px)').matches?2:3;let rows=[];for(let i=0;i<Math.max(1,Math.ceil(n/perRow));i++){const group=galleryItems.slice(i*perRow,i*perRow+perRow);rows.push(`<div class="shelf-row ${perRow===2?'two':''}">${group.map(it=>`<button type="button" class="shelf-product" data-action="open-item" data-id="${h(it.id)}" title="${h(it.medicineName)} 복약지도서 펼치기">${boxHTML(it,{mini:true})}</button>`).join('')}</div>`)}return `${topbar()}<main class="gallery-shell"><div class="gallery-header"><div class="gallery-heading"><h1>우리반 약장 <small>· ${h(clsLabel(currentClass))}</small></h1><div class="gallery-count">${n}개 전시 중</div></div><p>💊 <strong>궁금한 약상자를 눌러</strong> 친구들이 만든 약과 복약지도서를 확인해 보세요!</p><div class="gallery-refresh-row"><span>새 작품이 궁금하다면</span><button type="button" data-action="reload-gallery" class="refresh-btn">↻ 새 작품 불러오기</button></div></div><div class="gallery-scroll"><div class="gallery-body"><div class="shelf-toptrim" aria-hidden="true"></div>${rows.join('')}${n?'':`<div class="empty-shelf">아직 진열된 약이 없어요. 첫 작품을 기다리고 있어요! 💚</div>`}</div><p class="gallery-footer">학생들의 상상으로 만든 가상 의약품을 전시하는 공간입니다.</p></div></main>`}
  function render(){
    app.classList.toggle('worksheet-mode',Boolean(currentClass && screen==='worksheet'));
    app.classList.toggle('intro-mode',Boolean(currentClass && screen==='intro'));
    if(!currentClass){app.innerHTML=classGate();return}
    if(screen==='home')app.innerHTML=home();
    else if(screen==='intro')app.innerHTML=topbar()+intro();
    else if(screen==='worksheet')app.innerHTML=worksheet();
    else if(screen==='design')app.innerHTML=design();
    else if(screen==='finish')app.innerHTML=finish();
    else if(screen==='gallery')app.innerHTML=gallery();
    if(screen==='worksheet')requestAnimationFrame(fitFixedWorksheetExample);
  }
  // 오른쪽 작성 예시는 휠/터치 스크롤 없이 전체 내용이 항상 화면 안에 보입니다.
  // iPad 가로/세로 및 사파리 주소창 높이 변화에서도 비율만 조정합니다.
  function fitFixedWorksheetExample(){
    const pane=app.querySelector('.worksheet-mode .example-wrap');
    const visual=app.querySelector('.worksheet-mode .example-visual');
    if(!pane || !visual)return;
    visual.style.transform='none';
    const usableW=pane.clientWidth;
    const usableH=pane.clientHeight;
    if(usableW<1 || usableH<1)return;
    const fullW=visual.offsetWidth;
    const fullH=visual.offsetHeight;
    const factor=Math.min(1, usableW/fullW, usableH/fullH);
    visual.style.left=Math.max(0,(usableW-fullW*factor)/2)+'px';
    visual.style.top='0px';
    visual.style.transform=`scale(${factor})`;
  }
  function closeModal(){const root=document.querySelector('#modal-root');if(root)root.remove();modal='';document.body.classList.remove('modal-open')}
  function openModal(content,wide=false){closeModal();modal='open';const root=document.createElement('div');root.id='modal-root';root.className='dialog-backdrop';root.innerHTML=`<section class="dialog ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="대화 상자"><button type="button" class="dialog-close" data-action="close-modal" aria-label="닫기">✕</button>${content}</section>`;document.body.appendChild(root);document.body.classList.add('modal-open');root.querySelector('input')?.focus()}
  function showPassword(kind){const gallery=kind==='gallery';openModal(`<h2>${gallery?'🏪 약장 감상하기':'⚙ 관리자 인증'}</h2><p>${gallery?'친구들이 만든 약을 구경하려면 약장 비밀번호를 입력하세요.':'선생님만 이용할 수 있는 학급 데이터 관리 메뉴입니다.'}</p><form id="loginForm" data-role="${kind}"><label for="loginPassword">${gallery?'약장 비밀번호':'관리자 비밀번호'}</label><input type="password" id="loginPassword" name="password" autocomplete="off" required placeholder="비밀번호 입력"><div id="modalError" class="error" role="alert"></div><div class="actions"><button class="btn" type="submit">${gallery?'약장 들어가기 →':'관리자 메뉴 열기 →'}</button></div></form>${connected?'':`<p class="place-info">시연 모드: 약장 비밀번호 1234 / 관리자 비밀번호 0504 (실제 공유·보안 아님)</p>`}`)}
  const setErr = text => {const n=document.querySelector('#modalError');if(n)n.textContent=text};
  // 학생용 Firebase 익명 세션과 교사용 Firebase 이메일 세션을 별도의 앱으로 분리합니다.
  // Firebase 교사 계정은 별도 앱으로 보건실 PC 브라우저에 로그인 상태를 유지합니다.
  // 실제 로그인 비밀번호는 파일에 적거나 저장하지 않습니다.
  async function getFb(){
    if(firebaseApi) return firebaseApi;
    const [a,b,c]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
    ]);
    const fbApp=a.getApps().find(x=>x.name==='class-pharmacy-student') || a.initializeApp(cfg.firebase,'class-pharmacy-student');
    const adminApp=a.getApps().find(x=>x.name==='class-pharmacy-admin') || a.initializeApp(cfg.firebase,'class-pharmacy-admin');
    const auth=b.getAuth(fbApp), adminAuth=b.getAuth(adminApp);
    await Promise.all([
      b.setPersistence(auth,b.browserSessionPersistence),
      b.setPersistence(adminAuth,b.browserLocalPersistence)
    ]);
    firebaseApi={auth,db:c.getFirestore(fbApp),adminAuth,adminDb:c.getFirestore(adminApp),authMod:b,storeMod:c};
    return firebaseApi;
  }
  async function ensureStudentAuth(){
    const api=await getFb();
    if(api.auth.authStateReady) await api.auth.authStateReady();
    if(!api.auth.currentUser || !api.auth.currentUser.isAnonymous){
      await api.authMod.signInAnonymously(api.auth);
    }
    return api;
  }
  async function getTeacherSession(){
    if(!connected) return null;
    const api=await getFb();
    if(api.adminAuth.authStateReady) await api.adminAuth.authStateReady();
    return api.adminAuth.currentUser;
  }
  // 약장(1234)과 관리자 메뉴(0504)는 학생 실수 방지용 화면 잠금입니다.
  // 실제 Firebase 삭제 권한은 Firestore 규칙과 교사의 별도 Firebase 계정으로 확인합니다.
  async function authRole(kind,pwd){
    const expected=kind==='gallery'?'1234':'0504';
    if(pwd!==expected) throw Error('비밀번호가 맞지 않아요.');
    return true;
  }
  async function loadGallery(){if(!connected){try{return JSON.parse(localStorage.getItem('pharmacy-gallery:'+currentClass)||'[]')}catch{return []}}const {db,storeMod}=await ensureStudentAuth();const q=storeMod.query(storeMod.collection(db,'classes',currentClass,'medicines'),storeMod.orderBy('createdAt','desc'),storeMod.limit(120));const snap=await storeMod.getDocs(q);return snap.docs.map(x=>({id:x.id,...x.data()}));}
  async function enterGallery(){galleryItems=await loadGallery();galleryLoaded=true;galleryClass=currentClass;goto('gallery')}
  async function refreshGallery(){const old=document.querySelector('.gallery-scroll');const y=old?.scrollTop||0;galleryItems=await loadGallery();render();const scroller=document.querySelector('.gallery-scroll');if(scroller)scroller.scrollTop=Math.min(y,scroller.scrollHeight-scroller.clientHeight)}
  async function publish(){const record={...draft,studentName:draft.studentName.trim(),medicineName:draft.medicineName.trim(),classId:currentClass};if(!/^(?:[1-9]|[12][0-9]|30)번$/.test(record.studentName) || !record.medicineName)throw Error('학급 번호와 약 이름을 확인해 주세요.');if(fields.some(f=>!String(record[f.key]||'').trim()))throw Error('복약지도서의 모든 항목을 작성해 주세요.');if(!connected){const key='pharmacy-gallery:'+currentClass;const items=await loadGallery();let id=postedId || `demo-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;const idx=items.findIndex(x=>x.id===id);const item={...record,id,createdAt:Date.now()};if(idx>=0)items[idx]=item;else items.unshift(item);localStorage.setItem(key,JSON.stringify(items));postedId=id;sessionStorage.setItem(postedKey(),id);return}
    const {auth,db,storeMod}=await ensureStudentAuth();
    const ownerUid=auth.currentUser.uid;
    const payload={...record,ownerUid,updatedAt:storeMod.serverTimestamp()};
    if(postedId && postedId.indexOf('demo-')!==0){try{await storeMod.updateDoc(storeMod.doc(db,'classes',currentClass,'medicines',postedId),payload);sessionStorage.setItem(postedKey(),postedId);return}catch(err){if(err.code!=='permission-denied')throw err;postedId=''}}
    const entry=await storeMod.addDoc(storeMod.collection(db,'classes',currentClass,'medicines'),{...payload,createdAt:storeMod.serverTimestamp()});postedId=entry.id;sessionStorage.setItem(postedKey(),postedId);
  }
  function enterNewActivity(){
    if(fields.some(f => String(draft[f.key]||'').trim()) || String(draft.studentName||'').trim()){
      openModal(`<h2>💊 약 만들기</h2><p>이 기기에 이전에 작성하던 복약지도서가 남아 있어요. 어떻게 시작할까요?</p><div class="actions">${btn('✏️ 이어서 만들기','continue-draft','secondary')}${btn('✨ 새로운 약 만들기','new-draft')}</div><p class="place-info">새로 만들기를 선택하면 이 기기의 이전 작성 내용은 지워져요. 이미 약장에 전시한 작품은 그대로 남아요.</p>`);
    } else {postedId='';sessionStorage.removeItem(postedKey());goto('intro')}
  }
  function detail(item){const expanded={...makeDraft(),...item};openModal(`<h2>📄 ${h(expanded.medicineName)} · 복약지도서</h2><p>약상자의 이름을 눌러 펼친 복약지도서예요.</p><div class="detail-grid"><div>${boxHTML(expanded,{mini:false})}</div>${exampleSheet({...expanded,studentName:`${clsLabel(expanded.classId||currentClass)} · ${expanded.studentName||'번호 미입력'}`},true)}</div>`,true)}
  function teacherAuthForm(){
    openModal(`<h2>🔐 교사 계정 최초 로그인</h2><p>보건실 PC에서 한 번 로그인하면 <strong>같은 브라우저에 로그인 상태가 유지</strong>돼요.<br>이후에는 관리자 비밀번호 0504만 입력해 초기화할 수 있어요.</p><form id="teacherAuthForm"><label for="teacherEmail">Firebase 교사 계정 이메일</label><input type="email" id="teacherEmail" autocomplete="username" required placeholder="Firebase에 등록한 교사 이메일"><label for="teacherPassword">Firebase 교사 계정 비밀번호</label><input type="password" id="teacherPassword" autocomplete="current-password" required placeholder="비밀번호를 입력하세요"><div id="modalError" class="error" role="alert"></div><div class="actions"><button class="btn outline" type="button" data-action="return-admin">취소</button><button class="btn" type="submit">로그인하고 유지하기 →</button></div></form><p class="place-info">이메일과 비밀번호는 코드나 Firestore 문서에 저장되지 않아요. 로그아웃하거나 브라우저 데이터를 지우면 다시 로그인해야 해요.</p>`);
  }
  async function adminMenu(){
    currentAdmin=true;
    openModal(`<h2>⚙ 학급 데이터 관리</h2><p>초기화할 반을 선택해 주세요. <strong>다른 반의 작품은 그대로 유지돼요.</strong></p>${connected?'<p class="place-info">Firebase 교사 계정 로그인 상태를 확인하고 있어요…</p>':''}<label for="adminClass">초기화할 학급</label><select id="adminClass">${classes.map(c=>`<option value="${h(c)}" ${currentClass===c?'selected':''}>${h(clsLabel(c))}</option>`).join('')}</select><div class="inline-alert" style="margin-top:15px">주의: 초기화하면 해당 학급에 저장된 작품이 모두 삭제됩니다.</div><div id="teacherAccountStatus" class="place-info"></div><div class="actions"><button class="btn warn" type="button" data-action="ask-clear">선택한 반 초기화</button></div>`);
    // 로그인 상태 확인은 비동기이며, 화면이 바뀐 뒤에는 옛 화면을 덮어쓰지 않습니다.
    if(connected){
      try{
        const user=await getTeacherSession();
        const node=document.querySelector('#teacherAccountStatus');
        if(node && document.querySelector('#adminClass')){
          node.innerHTML=user
            ? '<strong>✅ Firebase 계정 로그인 중</strong> · 보건실 PC에서는 다시 로그인할 필요 없어요. <button type="button" class="admin-account-button" data-action="teacher-logout">로그아웃</button>'
            : '<strong>🔐 첫 사용 시 교사 계정 로그인이 필요해요.</strong> <button type="button" class="admin-account-button" data-action="teacher-login">교사 계정 로그인</button>';
        }
      }catch(e){const node=document.querySelector('#teacherAccountStatus');if(node)node.textContent='Firebase 로그인 상태 확인 실패: '+(e.message||'');}
    }
  }
  async function confirmClear(){
    const classToClear=document.querySelector('#adminClass')?.value||currentClass;
    if(connected && !await getTeacherSession()){
      teacherAuthForm();
      return;
    }
    openModal(`<h2>⚠️ 초기화 최종 확인</h2><p><strong>${h(clsLabel(classToClear))}</strong>의 작품을 모두 삭제할까요?</p><p class="inline-alert">삭제된 데이터는 되돌릴 수 없습니다. 다른 반의 작품은 유지됩니다.</p><label for="confirmText">확인하려면 <strong>초기화</strong>라고 입력하세요.</label><input id="confirmText" autocomplete="off" placeholder="초기화"><div id="modalError" class="error" role="alert"></div><div class="actions"><button class="btn outline" type="button" data-action="cancel-clear">취소</button><button class="btn warn" type="button" data-action="clear-class" data-class="${h(classToClear)}">선택한 반 전체 삭제</button></div>`);
  }
  async function clearClass(cls){
    if(!currentAdmin) throw Error('관리자 메뉴 비밀번호가 필요합니다.');
    if(!classes.includes(cls)) throw Error('학급 정보를 확인해 주세요.');
    if(!connected){localStorage.removeItem('pharmacy-gallery:'+cls);return;}
    const {adminAuth,adminDb,storeMod}=await getFb();
    if(adminAuth.authStateReady) await adminAuth.authStateReady();
    if(!adminAuth.currentUser) throw Error('보건실 PC에서 Firebase 교사 계정으로 먼저 로그인해 주세요.');
    // Firestore 규칙에서 등록된 교사 UID만 실제 삭제를 승인합니다.
    while(true){
      const q=storeMod.query(storeMod.collection(adminDb,'classes',cls,'medicines'),storeMod.limit(200));
      const snap=await storeMod.getDocs(q);
      if(snap.empty)break;
      const batch=storeMod.writeBatch(adminDb);
      snap.docs.forEach(x=>batch.delete(x.ref));
      await batch.commit();
      if(snap.size<200)break;
    }
  }
  function isComplete(){return /^(?:[1-9]|[12][0-9]|30)번$/.test(draft.studentName.trim()) && fields.every(f=>String(draft[f.key]||'').trim())}
  function ensureComplete(){if(!isComplete()){toast('학급 번호와 복약지도서의 모든 항목을 먼저 작성해 주세요.');goto('worksheet');return false}return true}
  document.addEventListener('change',(e)=>{if(e.target?.name==='studentName'){draft.studentName=e.target.value;persist();}});
  document.addEventListener('input',(e)=>{const n=e.target?.name;if(n && Object.hasOwn(draft,n)){draft[n]=e.target.value;persist();const counter=document.querySelector(`[data-counter="${n}"]`);const field=fields.find(f=>f.key===n);if(counter && field)counter.textContent=`${e.target.value.length}/${field.max}자`}});
  // 학급 선택은 앱 첫 입장에서만 표시됩니다. 홈·약장 이동 중에는 반을 바꿀 수 없습니다.
  document.addEventListener('submit',async(e)=>{if(e.target.id!=='loginForm')return;e.preventDefault();const role=e.target.dataset.role;const pwd=e.target.querySelector('[name=password]').value;const b=e.target.querySelector('button[type=submit]');b.disabled=true;b.textContent='확인 중...';setErr('');try{await authRole(role,pwd);if(role==='gallery'){galleryAuthorized=true;closeModal();await enterGallery()}else{adminMenu()}}catch(err){setErr(err.message || '비밀번호를 다시 확인해 주세요.')}finally{if(b.isConnected){b.disabled=false;b.textContent=role==='gallery'?'약장 들어가기 →':'관리자 메뉴 열기 →'}}});
  document.addEventListener('submit',async(e)=>{
    if(e.target.id!=='teacherAuthForm')return;
    e.preventDefault();
    const form=e.target, button=form.querySelector('button[type="submit"]');
    const email=form.querySelector('#teacherEmail').value.trim(), password=form.querySelector('#teacherPassword').value;
    button.disabled=true;button.textContent='인증 중…';setErr('');
    try{
      const {adminAuth,authMod}=await getFb();
      await authMod.signInWithEmailAndPassword(adminAuth,email,password);
      adminMenu();toast('이 PC에 Firebase 로그인 상태를 유지할게요.');
    }catch(err){setErr('로그인 실패: Firebase에서 등록한 교사 계정을 확인해 주세요. ('+(err.code||err.message||'')+')');}
    finally{if(button.isConnected){button.disabled=false;button.textContent='로그인하고 유지하기 →';}}
  });
  document.addEventListener('click',async(e)=>{const control=e.target.closest('[data-action]');if(!control)return;const act=control.dataset.action;
   try{
    if(!currentClass && !['choose-class','home','admin-login','close-modal','ask-clear','cancel-clear','clear-class'].includes(act)){toast('먼저 우리 반을 선택해 주세요.');return}
    if(act==='choose-class'){
      const cls=control.dataset.value;
      if(!classes.includes(cls)){toast('올바른 학급을 선택해 주세요.');return}
      currentClass=cls;
      draft=loadDraft();
      postedId=sessionStorage.getItem(postedKey()) || '';
      galleryItems=[];galleryLoaded=false;galleryAuthorized=false;galleryClass=null;currentAdmin=false;
      closeModal();goto('home');
    }
    else if(act==='home'){closeModal();goto('home')}
    else if(act==='intro'){editReturn='design';enterNewActivity()}
    else if(act==='continue-draft'){closeModal();goto('intro')}
    else if(act==='new-draft'){draft=makeDraft();persist();postedId='';sessionStorage.removeItem(postedKey());showingHint.clear();closeModal();goto('intro')}
    else if(act==='worksheet'){editReturn='design';goto('worksheet')}
    else if(act==='submit-worksheet'){if(ensureComplete()){persist();goto(editReturn==='finish'?'finish':'design')}}
    else if(act==='help'){const key=control.dataset.key;const p=control.closest('.row-field').querySelector('.field-hint');const visible=p.classList.toggle('show');control.setAttribute('aria-expanded',String(visible));visible?showingHint.add(key):showingHint.delete(key)}
    else if(act==='color'){draft.boxDesign=control.dataset.value;persist();render()}
    else if(act==='pill'){draft.pillDesign=control.dataset.value;persist();render()}
    else if(act==='deco'){const v=control.dataset.value;if(draft.decorations.includes(v))draft.decorations=draft.decorations.filter(d=>d!==v);else if(draft.decorations.length<5)draft.decorations.push(v);else{toast('추가 스티커는 최대 5개까지 붙일 수 있어요.');return}persist();render()}
    else if(act==='design'){if(ensureComplete())goto('design')}
    else if(act==='finish'){if(ensureComplete())goto('finish')}
    else if(act==='edit-from-design'){editReturn='design';goto('worksheet')}
    else if(act==='edit-from-finish'){editReturn='finish';goto('worksheet')}
    else if(act==='publish'){if(!ensureComplete())return;control.disabled=true;control.textContent='전시 중...';await publish();toast('우리반 약장에 작품을 전시했어요! 🎉');goto('finish')}
    else if(act==='own-detail')detail({...draft,classId:currentClass})
    else if(act==='gallery-login')showPassword('gallery')
    else if(act==='admin-login')showPassword('admin')
    else if(act==='close-modal')closeModal()
    else if(act==='reload-gallery'){control.disabled=true;control.textContent='불러오는 중…';await refreshGallery();toast('새로 올라온 작품을 확인했어요!')}
    else if(act==='open-item'){const it=galleryItems.find(x=>x.id===control.dataset.id);if(it)detail(it)}
    else if(act==='teacher-login')teacherAuthForm()
    else if(act==='teacher-logout'){const {adminAuth,authMod}=await getFb();await authMod.signOut(adminAuth);adminMenu();toast('교사 계정을 로그아웃했어요.')}
    else if(act==='return-admin')adminMenu()
    else if(act==='ask-clear')await confirmClear()
    else if(act==='cancel-clear')adminMenu()
    else if(act==='clear-class'){if(document.querySelector('#confirmText')?.value.trim()!=='초기화'){setErr('확인란에 초기화라고 정확하게 입력해 주세요.');return}control.disabled=true;control.textContent='삭제 중...';await clearClass(control.dataset.class);closeModal();toast(`${clsLabel(control.dataset.class)} 작품을 초기화했어요.`);if(screen==='gallery' && currentClass===control.dataset.class)goto('home')}
   }catch(err){toast('작업을 완료하지 못했어요. '+(err?.message||''));console.error(err);if(control.isConnected)control.disabled=false}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && modal)closeModal()});
  document.addEventListener('click',e=>{if(e.target?.id==='modal-root')closeModal()});
  let lastGalleryCols = window.matchMedia('(max-width:650px)').matches?2:3;
  window.addEventListener('resize',()=>{if(screen==='worksheet')requestAnimationFrame(fitFixedWorksheetExample);const cols=window.matchMedia('(max-width:650px)').matches?2:3;if(screen==='gallery'&&cols!==lastGalleryCols){lastGalleryCols=cols;const old=document.querySelector('.gallery-scroll')?.scrollTop||0;render();const scroll=document.querySelector('.gallery-scroll');if(scroll)scroll.scrollTop=old;}else{lastGalleryCols=cols;}});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{if(screen==='worksheet')requestAnimationFrame(fitFixedWorksheetExample)});
  if(document.fonts?.ready)document.fonts.ready.then(()=>{if(screen==='worksheet')requestAnimationFrame(fitFixedWorksheetExample)});
  render();
})();
