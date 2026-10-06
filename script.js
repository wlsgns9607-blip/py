/* =========================================================
   유틸
   ========================================================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* =========================================================
   1. 상단 진행바 + 네비게이션 스크롤 상태
   ========================================================= */
(function scrollChrome() {
  const bar = $('#signalProgress');
  const nav = $('#topnav');

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
    nav.classList.toggle('is-scrolled', scrollTop > 40);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

/* =========================================================
   2. 스크롤 등장 애니메이션
   ========================================================= */
(function revealOnScroll() {
  const targets = $$(
    '.why__col, .stack__layer, .sim__layout, .apikey__stage, .tl-item, .role-card, .summary__card'
  );
  targets.forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  targets.forEach((el) => io.observe(el));
})();

/* =========================================================
   3. 히어로 다이어그램 - 신호가 파이프를 타고 흐르는 루프
   ========================================================= */
(function heroDiagram() {
  const diagram = $('#heroDiagram');
  if (!diagram) return;

  const nodes = {
    user: $('[data-node="user"]', diagram),
    browser: $('[data-node="browser"]', diagram),
    react: $('[data-node="react"]', diagram),
    python: $('[data-node="python"]', diagram),
    db: $('[data-node="db"]', diagram),
    ai: $('[data-node="ai"]', diagram),
  };
  const pipes = {
    p0: $('[data-pipe="0"]', diagram),
    p1: $('[data-pipe="1"]', diagram),
    p2: $('[data-pipe="2"]', diagram),
    p3a: $('[data-pipe="3a"]', diagram),
    p3b: $('[data-pipe="3b"]', diagram),
  };

  function clearActive() {
    Object.values(nodes).forEach((n) => n && n.classList.remove('is-active'));
  }

  function firePacket(pipeEl, fromNode, toNode, duration = 700) {
    return new Promise((resolve) => {
      if (!pipeEl) return resolve();
      const packet = $('.hd-packet', pipeEl);
      fromNode && fromNode.classList.add('is-active');
      if (packet) {
        packet.style.transition = 'none';
        packet.style.left = '0%';
        packet.style.opacity = '1';
        // force reflow
        void packet.offsetWidth;
        packet.style.transition = `left ${duration}ms linear`;
        packet.style.left = '100%';
      }
      setTimeout(() => {
        fromNode && fromNode.classList.remove('is-active');
        toNode && toNode.classList.add('is-active');
        if (packet) packet.style.opacity = '0';
        resolve();
      }, duration);
    });
  }

  async function runLoop() {
    clearActive();
    await firePacket(pipes.p0, nodes.user, nodes.browser);
    await firePacket(pipes.p1, nodes.browser, nodes.react);
    await firePacket(pipes.p2, nodes.react, nodes.python);
    await Promise.all([
      firePacket(pipes.p3a, nodes.python, nodes.db, 600),
      firePacket(pipes.p3b, nodes.python, nodes.ai, 600),
    ]);
    await new Promise((r) => setTimeout(r, 900));
    nodes.db && nodes.db.classList.remove('is-active');
    nodes.ai && nodes.ai.classList.remove('is-active');
    await new Promise((r) => setTimeout(r, 500));
  }

  let running = true;
  let visible = true;

  async function loop() {
    while (running) {
      if (visible) {
        await runLoop();
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (visible = e.isIntersecting));
    },
    { threshold: 0.15 }
  );
  heroObserver.observe(diagram);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) loop();
})();

/* =========================================================
   4. 레이어 스택 아코디언 (프론트/파이썬/DB/AI)
   ========================================================= */
(function layerStack() {
  const stack = $('#stack');
  if (!stack) return;

  const layers = $$('.stack__layer', stack);

  layers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.layer;
      const panel = $(`.stack__panel[data-panel="${key}"]`, stack);
      const isOpen = btn.classList.contains('is-open');

      // 다른 패널 닫기
      layers.forEach((b) => b.classList.remove('is-open'));
      $$('.stack__panel', stack).forEach((p) => p.classList.remove('is-open'));

      if (!isOpen) {
        btn.classList.add('is-open');
        panel.classList.add('is-open');
      }
    });
  });

  // 첫 번째 레이어는 기본으로 열어 둔다
  layers[0] && layers[0].click();
})();

/* =========================================================
   5. AI 챗봇 흐름 시뮬레이션
   ========================================================= */
(function chatbotSim() {
  const input = $('#simInput');
  const sendBtn = $('#simSend');
  const chatBody = $('#simChatBody');
  const steps = $$('#simSteps li');
  const hint = $('#simHint');
  const presets = $$('.sim__preset');

  if (!input || !sendBtn) return;

  let isRunning = false;

  function addBubble(text, cls) {
    const div = document.createElement('div');
    div.className = 'sim__bubble ' + cls;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  function addLoadingBubble() {
    const div = document.createElement('div');
    div.className = 'sim__bubble sim__bubble--ai sim__bubble--loading';
    div.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  function resetSteps() {
    steps.forEach((li) => li.classList.remove('is-active', 'is-done'));
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function playSteps() {
    for (let i = 0; i < steps.length; i++) {
      steps.forEach((li, idx) => {
        li.classList.toggle('is-active', idx === i);
        if (idx < i) li.classList.add('is-done');
      });
      await wait(620);
    }
    steps.forEach((li) => li.classList.add('is-done'));
    steps[steps.length - 1] && steps[steps.length - 1].classList.add('is-active');
  }

  function buildAnswer(question) {
    if (question.includes('식비')) {
      return '이번 달 식비는 총 342,500원을 사용하셨어요. 지난달보다 8% 늘었어요.';
    }
    if (question.includes('카드')) {
      return '지난주 카드 사용액은 128,900원이에요. 가장 큰 지출은 카페였어요.';
    }
    return 'DB에서 관련 거래내역을 찾아 정리해드릴게요. 잠시만요!';
  }

  async function handleSend() {
    const value = input.value.trim();
    if (!value || isRunning) return;
    isRunning = true;
    sendBtn.disabled = true;
    hint.textContent = '요청을 서버로 전송하는 중...';

    addBubble(value, 'sim__bubble--user');
    input.value = '';
    resetSteps();

    const loadingBubble = addLoadingBubble();
    const stepsPromise = playSteps();
    await stepsPromise;

    loadingBubble.remove();
    addBubble(buildAnswer(value), 'sim__bubble--ai');
    hint.textContent = '완료! React → Python → DB/AI → React 순으로 데이터가 오갔습니다.';

    isRunning = false;
    sendBtn.disabled = false;
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });
  presets.forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.q;
      handleSend();
    });
  });
})();

/* =========================================================
   6. API Key 구조 비교 다이어그램
   ========================================================= */
(function apiKeyDiagram() {
  const diagramEl = $('#apikeyDiagram');
  const explainEl = $('#apikeyExplain');
  const tabs = $$('.apikey__tab');
  if (!diagramEl) return;

  const content = {
    wrong: {
      html: `
        <div class="ak-box ak-box--neutral">React<br>(브라우저)</div>
        <span class="ak-arrow">→</span>
        <div class="ak-box ak-box--danger">AI API Key<br>가 코드 안에 그대로</div>
        <span class="ak-arrow">→</span>
        <div class="ak-box ak-box--neutral">AI API</div>
      `,
      text: '<b>문제점:</b> React 코드는 브라우저에서 그대로 내려받아지기 때문에, 개발자 도구만 열어도 API Key가 그대로 보입니다. 누구든 이 Key를 복사해 무단으로 사용할 수 있어요.',
    },
    right: {
      html: `
        <div class="ak-box ak-box--neutral">React<br>(브라우저)</div>
        <span class="ak-arrow">→</span>
        <div class="ak-box ak-box--safe">Python<br>Backend</div>
        <span class="ak-arrow">→</span>
        <div class="ak-box ak-box--safe">환경변수 속<br>API Key</div>
        <span class="ak-arrow">→</span>
        <div class="ak-box ak-box--neutral">AI API</div>
      `,
      text: '<b>왜 안전한가:</b> API Key는 브라우저로 절대 전달되지 않고, 서버(Python) 안의 환경변수에만 저장됩니다. 브라우저는 오직 “질문”만 서버로 보내고, Key를 이용한 실제 호출은 서버가 대신 해줍니다.',
    },
  };

  function render(mode) {
    diagramEl.innerHTML = content[mode].html;
    explainEl.innerHTML = content[mode].text;
    diagramEl.dataset.mode = mode;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      render(tab.dataset.mode);
    });
  });

  render('wrong');
})();

/* =========================================================
   7. 커리큘럼 타임라인 데이터 렌더링
   ========================================================= */
(function curriculumTimeline() {
  const container = $('#timeline');
  if (!container) return;

  const data = [
    {
      title: '웹의 기본 구조 — HTML/CSS',
      tag: 'STEP 01',
      desc: '화면을 이루는 가장 기본 단위를 배웁니다.',
      list: ['HTML 기본 구조, Semantic HTML, Form, Table', 'CSS 선택자, Box Model, Flex, Grid, 반응형 레이아웃'],
    },
    {
      title: 'JavaScript',
      tag: 'STEP 02',
      desc: '정적인 화면을 실제로 동작하는 페이지로 만듭니다.',
      list: ['변수, 조건문, 반복문, 함수, 배열, 객체', 'DOM, Event, 비동기 처리, Fetch API, JSON'],
    },
    {
      title: '실제 프로젝트 제작',
      tag: 'STEP 03',
      desc: '가계부처럼 실제 서비스를 서버 없이 먼저 만들어 봅니다.',
      list: ['거래 등록 → 수입/지출 계산 → 통계 표시', '브라우저의 LocalStorage로 프로토타입 제작'],
    },
    {
      title: 'React',
      tag: 'STEP 04',
      desc: 'HTML/CSS/JS로 만든 화면을 컴포넌트 구조로 발전시킵니다.',
      list: ['Component, Props, State, Hook', '조건부 렌더링, 리스트 렌더링, API 통신'],
    },
    {
      title: 'Python 기초',
      tag: 'STEP 05',
      desc: '문법을 “백엔드 어디에 쓰이는가”와 함께 배웁니다.',
      list: ['변수, 자료형, 조건문, 반복문, 함수', '리스트/딕셔너리, 예외처리, 클래스'],
    },
    {
      title: 'Python Backend',
      tag: 'STEP 06',
      desc: 'FastAPI로 실제 API 서버를 만듭니다.',
      list: ['HTTP, REST API, GET/POST/PUT/DELETE', 'Request/Response, 데이터 검증, 에러 처리'],
    },
    {
      title: 'Database',
      tag: 'STEP 07',
      desc: '데이터를 안전하게 저장하고 꺼내오는 방법을 배웁니다.',
      list: ['SQL 기본, 테이블, Primary/Foreign Key, CRUD', 'Python과 DB 연결'],
    },
    {
      title: '인증 / 보안',
      tag: 'STEP 08',
      desc: '회원가입부터 로그인, 외부 로그인까지 다룹니다.',
      list: ['Authentication/Authorization, Session, Token, OAuth', '네이버·카카오 로그인, API Key 보호, CORS'],
    },
    {
      title: 'AI API',
      tag: 'STEP 09',
      desc: 'AI 챗봇 프로젝트로 AI API 연동을 실습합니다.',
      list: ['프롬프트 전달, 응답 처리, 대화 기록 관리', 'API 사용량 관리, API Key 보호'],
    },
    {
      title: '최종 프로젝트 — AI 가계부',
      tag: 'STEP 10',
      desc: '지금까지 배운 모든 것을 하나의 서비스로 완성합니다.',
      list: ['"이번 달 식비 얼마 썼어?" 같은 질문에 DB 조회 + AI 응답으로 답하기', '로그인부터 통계, AI 상담까지 전체 구조 완성'],
    },
  ];

  container.innerHTML = data
    .map(
      (step, i) => `
    <div class="tl-item" data-index="${i}">
      <button class="tl-item__head">
        <span class="tl-item__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="tl-item__title">${step.title}</span>
        <span class="tl-item__tag">${step.tag}</span>
      </button>
      <div class="tl-item__body">
        <div class="tl-item__body-inner">
          <div class="tl-item__desc">
            <p>${step.desc}</p>
            <ul>${step.list.map((l) => `<li>${l}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  $$('.tl-item', container).forEach((item) => {
    $('.tl-item__head', item).addEventListener('click', () => {
      item.classList.toggle('is-open');
    });
  });
})();

/* =========================================================
   8. 기술별 역할 카드 렌더링
   ========================================================= */
(function rolesGrid() {
  const grid = $('#rolesGrid');
  if (!grid) return;

  const roles = [
    ['HTML', '웹 페이지의 구조를 만든다', 'var(--amber-soft)', 'var(--ink)'],
    ['CSS', '디자인과 레이아웃을 담당한다', 'var(--amber-soft)', 'var(--ink)'],
    ['JavaScript', '웹 페이지를 동작하게 만든다', 'var(--amber-soft)', 'var(--ink)'],
    ['React', '프론트엔드 UI와 컴포넌트를 관리한다', 'var(--amber-soft)', 'var(--ink)'],
    ['Python', '백엔드 서버의 로직을 처리한다', 'var(--teal-soft)', 'var(--ink)'],
    ['FastAPI', 'Python으로 API 서버를 구축한다', 'var(--teal-soft)', 'var(--ink)'],
    ['Database', '서비스의 모든 데이터를 저장한다', 'var(--violet-soft)', 'var(--ink)'],
    ['OAuth', '네이버·카카오 같은 외부 로그인을 연결한다', 'var(--violet-soft)', 'var(--ink)'],
    ['AI API', 'AI 기능을 서비스에 제공한다', 'var(--violet-soft)', 'var(--ink)'],
    ['API Key', '외부 서비스 인증 정보, 서버에서만 보관', 'var(--teal-soft)', 'var(--ink)'],
    ['환경변수', '서버의 비밀 정보를 코드 밖에서 관리한다', 'var(--teal-soft)', 'var(--ink)'],
    ['Git/GitHub', '코드의 버전을 기록하고 관리한다', 'var(--amber-soft)', 'var(--ink)'],
  ];

  grid.innerHTML = roles
    .map(
      ([name, desc, bg, fg]) => `
    <div class="role-card">
      <span class="role-card__name" style="background:${bg}; color:${fg};">${name}</span>
      <p class="role-card__desc">${desc}</p>
    </div>
  `
    )
    .join('');
})();


/* ================================================
   추가: 학습 로드맵 / OAuth 애니메이션 / 스크롤 등장
================================================ */

// ── 학습 로드맵 ──────────────────────────────────
(function () {
  var steps = [
    { num: '①', name: 'HTML / CSS', tag: '기초', detail: '웹 화면의 구조(HTML)와 디자인(CSS)을 만드는 방법을 배웁니다. 가장 먼저 시작해야 할 기술입니다.' },
    { num: '②', name: 'JavaScript', tag: '기초', detail: '화면에서 일어나는 동작(클릭, 입력, 애니메이션 등)을 처리하는 언어입니다.' },
    { num: '③', name: 'React', tag: '프론트엔드', detail: '복잡한 웹 화면을 효율적으로 만들기 위한 JavaScript 라이브러리입니다. 컴포넌트 단위로 화면을 구성합니다.' },
    { num: '④', name: 'Python 기초', tag: '백엔드', detail: '변수, 조건문, 함수, 딕셔너리 등 Python의 기본 문법을 배웁니다. 서버 개발의 출발점입니다.' },
    { num: '⑤', name: 'FastAPI', tag: '백엔드', detail: 'Python으로 백엔드 서버(API 서버)를 만드는 프레임워크입니다. 로그인, 데이터 처리 등의 기능을 구현합니다.' },
    { num: '⑥', name: 'Database', tag: '데이터', detail: '사용자 정보, 서비스 데이터를 저장하고 조회합니다. PostgreSQL, MySQL 등이 대표적입니다.' },
    { num: '⑦', name: 'OAuth / 소셜 로그인', tag: 'API', detail: '네이버, 카카오, 구글 등 외부 서비스의 로그인 기능을 연동하는 방법을 배웁니다.' },
    { num: '⑧', name: 'AI API', tag: 'AI', detail: 'ChatGPT, Gemini 같은 AI 기능을 서비스에 연결합니다. Python 서버가 API Key를 안전하게 관리합니다.' },
    { num: '⑨', name: '보안', tag: '보안', detail: '인증, 인가, 입력값 검증, 비밀정보 관리 등 서비스를 안전하게 만드는 방법을 배웁니다.' },
    { num: '⑩', name: '배포', tag: '운영', detail: '만든 서비스를 실제 인터넷에 올리는 방법입니다. AWS, Vercel, Railway 등의 플랫폼을 활용합니다.' }
  ];

  var container = document.getElementById('roadmapSteps');
  if (!container) return;

  steps.forEach(function (s, i) {
    var step = document.createElement('div');
    step.className = 'roadmap-edu__step';
    step.innerHTML =
      '<div class="roadmap-edu__connector">' +
        '<div class="roadmap-edu__num">' + s.num + '</div>' +
        '<div class="roadmap-edu__line"></div>' +
      '</div>' +
      '<div class="roadmap-edu__content">' +
        '<button class="roadmap-edu__btn">' +
          '<span class="roadmap-edu__name">' + s.name + '</span>' +
          '<span class="roadmap-edu__tag">' + s.tag + '</span>' +
        '</button>' +
        '<div class="roadmap-edu__detail">' + s.detail + '</div>' +
      '</div>';
    container.appendChild(step);

    var btn = step.querySelector('.roadmap-edu__btn');
    btn.addEventListener('click', function () {
      step.classList.toggle('is-open');
    });
  });
})();

// ── OAuth 순서 애니메이션 ──────────────────────────
(function () {
  var steps = document.querySelectorAll('#oauthFlow .oauth__step');
  if (!steps.length) return;
  var idx = 0;

  function activate() {
    steps.forEach(function (s) { s.classList.remove('is-active'); });
    steps[idx].classList.add('is-active');
    idx = (idx + 1) % steps.length;
  }

  activate();
  setInterval(activate, 1200);
})();

// ── 스크롤 등장 애니메이션 (추가 섹션 대상) ──────────
(function () {
  var targets = document.querySelectorAll(
    '.pybasic__card, .security__concept, .donts__card, .keymsg__clarify'
  );
  if (!('IntersectionObserver' in window)) return;

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
    obs.observe(el);
  });
})();

// ── WHY PYTHON 섹션: 스크롤 시 역할 카드 등장 ──────────
(function () {
  var roles = document.querySelectorAll('.why-role');
  if (!roles.length || !('IntersectionObserver' in window)) return;

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () {
          entry.target.classList.add('is-visible');
        }, i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  roles.forEach(function (el) { obs.observe(el); });
})();

// ── WHY PYTHON 스택 카드: 호버 시 설명 강조 ──────────
(function () {
  var stackItems = document.querySelectorAll('.why-stack__item');
  stackItems.forEach(function (item) {
    item.setAttribute('title', item.querySelector('.why-stack__badge') ? item.querySelector('.why-stack__badge').textContent : '');
  });
})();

/* =========================================================
   9. 날짜별 학습일지 (09/26, 09/23, 09/22, 09/21) 인터랙티브 폼 & 뷰어
   ========================================================= */
(function dailyLearningArchive() {
  const container = document.getElementById('dailyContents');
  const dateSelect = document.getElementById('dateSelect');
  const searchInput = document.getElementById('dailySearch');
  const clearSearchBtn = document.getElementById('dailySearchClear');
  const pills = document.querySelectorAll('.daily-pill');
  const tags = document.querySelectorAll('.daily-tag');

  if (!container) return;

  // 전체 날짜별 학습 데이터 (10/06, 10/04, 10/02, 10/01, 09/30, 09/29, 09/28_pm, 09/28, 09/24, 09/23, 09/22)
  const logsData = [
    {
      id: '1006',
      date: '10/06 (화)',
      badge: 'LATEST',
      title: '🚀 머신러닝 vs 딥러닝 완성 · AI 3대 트렌드(RAG/파인튜닝) · 피지컬AI & 지도학습 4단계',
      subtitle: '정형·비정형 데이터별 AI 모델(XGBoost vs Transformer), 과대·과소적합 극복, 기업의 AI 활용 3트렌드, 5대 AI 프로젝트 직군, 지도학습 4단계 & Pandas 실습 · 레모네이드 판매 예측(TensorFlow 회귀)',
      tags: ['1006실무', '레모네이드_판매예측', 'TensorFlow_Keras', 'fit_predict', '회귀모델_실습', '머신러닝', '딥러닝', 'MLOps_서빙', 'FastAPI_Docker', 'AI레스토랑_5대직군', '사내AI구축', 'LoRA_포스트잇튜닝', '지식그래프', 'CNN', '비정형데이터', '의사결정나무', '대출승인분류', '피지컬AI', 'RAG_파인튜닝', '지도학습4단계', '판다스기초', '펑션콜_벡터DB', '과대적합_Overfitting', '실습'],
      sections: [
        {
          secTitle: '🧠 1. 머신러닝 vs 딥러닝 개념 요약 & 3대 학습 방식',
          icon: '🧠',
          desc: '사람이 특징(Feature) 힌트를 주는 머신러닝과 뇌신경망으로 스스로 특징을 뽑아내는 딥러닝, 그리고 3가지 학습 방법 완벽 비교',
          cards: [
            {
              title: '🤖 머신러닝 (Machine Learning)',
              detail: '• 컴퓨터에게 문제(원인)와 정답을 주고 숨겨진 규칙을 스스로 찾게 하는 기술.<br>• <strong>특징 추출(Feature Engineering):</strong> 사진에서 개/고양이를 구분할 때 사람이 직접 <i>"얼굴형, 눈 크기, 다리 개수"</i> 같은 힌트를 줘야 합니다.'
            },
            {
              title: '🧬 딥러닝 (Deep Learning)',
              detail: '• 머신러닝의 끝판왕으로 인간 뇌의 신경세포(뉴런)를 모방한 <strong>인공신경망(ANN)</strong> 기반.<br>• 사람이 일일이 힌트를 주지 않아도 대규모 데이터를 쏟아부으면 AI가 스스로 특징을 추출 (이미지/자연어 처리에 압도적).'
            },
            {
              title: '📊 머신러닝의 3가지 학습 방법',
              detail: '• <strong>1. 지도 학습(Supervised):</strong> 정답지(레이블)를 주고 가르침<br>&nbsp;&nbsp;- <b>회귀(Regression):</b> 판매량, 집값 등 연속된 숫자 예측<br>&nbsp;&nbsp;- <b>분류(Classification):</b> 개/고양이 판별, 품종 맞추기 등 객관식 범주 선택<br>• <strong>2. 비지도 학습(Unsupervised):</strong> 정답 없이 데이터만 주고 학습<br>&nbsp;&nbsp;- <b>군집화(Clustering):</b> 고객 타겟팅, 추천 시스템<br>&nbsp;&nbsp;- <b>차원 축소:</b> 복잡한 데이터를 핵심만 남겨 압축<br>• <strong>3. 강화 학습(Reinforcement):</strong> 보상과 벌점으로 게임하듯 최적 행동 터득 (알파고, 자율주행)'
            },
            {
              title: '🧠 딥러닝 핵심 3대 신경망 & 훈련 사이클',
              detail: '• <strong>DNN (심층 신경망):</strong> 엑셀 표 데이터의 기본 뼈대<br>• <strong>CNN (합성곱 신경망):</strong> 돋보기로 윤곽선을 찾는 이미지/영상 스페셜리스트<br>• <strong>RNN (순환 신경망):</strong> 시간 흐름과 순서를 기억하는 언어/주가/음악 처리 모델<br>• <strong>훈련 3단계:</strong> <code>fit()</code>(반복 학습) → <code>evaluate()</code>(시험지 채점) → <code>predict()</code>(실전 예측)'
            }
          ]
        },
        {
          secTitle: '📊 2. 엑셀 표와 이미지를 다루는 AI 모델 & 과대적합/과소적합 극복',
          icon: '📊',
          desc: '정형 표 데이터의 제왕 트리 모델 vs 비정형 딥러닝 모델의 영역 구분과 모델 최적화 치트키',
          cards: [
            {
              title: '📈 엑셀 표 데이터 (정형 머신러닝)',
              detail: '• <strong>의사결정나무:</strong> 스무고개 방식으로 참/거짓 분기<br>• <strong>랜덤 포레스트:</strong> 나무 수십 개의 결과를 취합하는 전문가 다수결 투표<br>• <strong>XGBoost / LightGBM:</strong> 이전 오차를 집중 보완하는 오답 노트 마스터 (현업 정형 데이터 1위)'
            },
            {
              title: '🖼️ 사진과 글자 (비정형 딥러닝)',
              detail: '• <strong>CNN:</strong> 돋보기 필터로 윤곽선과 시각 패턴 추출<br>• <strong>RNN / LSTM:</strong> 문맥과 시계열 순서를 기억<br>• <strong>트랜스포머 (Transformer):</strong> 문맥 전체의 관계를 한 번에 파악하는 최신 거대 언어 모델의 뇌 구조 (ChatGPT의 기반)'
            },
            {
              title: '⚠️ 과대적합 (Overfitting) 해결책',
              detail: '• <strong>상태:</strong> 모의고사는 100점인데 수능은 50점 (사소한 노이즈까지 통째로 외움)<br>• <strong>해결책:</strong> 너무 오래 학습하기 전 멈추는 <b>조기 종료(Early Stopping)</b>, 신경망 일부를 쉬게 하는 <b>드롭아웃(Dropout)</b>으로 응용력 향상'
            },
            {
              title: '📉 과소적합 (Underfitting) 해결책',
              detail: '• <strong>상태:</strong> 공부를 하다 만 수포자 (뇌 구조가 너무 단순하거나 학습량 부족)<br>• <strong>해결책:</strong> 학습 횟수(Epoch)를 늘리거나 신경망 층(Layer)을 더 깊게 쌓기'
            }
          ]
        },
        {
          secTitle: '💼 3. 요즘 기업들이 AI를 써먹는 3가지 트렌드 (월세·오픈북·직무교육)',
          icon: '💼',
          desc: '수십억을 들여 바닥부터 만들지 않고 검증된 파운데이션 모델을 똑똑하게 빌려 쓰는 실무 3대 방식',
          cards: [
            {
              title: '🌐 1. API 호출 ("천재의 뇌를 월세 내고 빌려 쓰기")',
              detail: '• OpenAI, Google 등의 초거대 AI에 인터넷(API)으로 질문하고 답변 건당 과금(종량제).<br>• 인프라 구축 없이 가장 빠르고 저렴하게 사내 챗봇, 자동 요약, 번역 서비스 구축.'
            },
            {
              title: '📚 2. RAG (검색 증강 생성) ("천재에게 기밀문서 쥐어주고 오픈북 테스트")',
              detail: '• 외부 AI는 우리 회사 규정이나 매뉴얼을 모르므로, 질문 시 사내 DB에서 관련 문서를 검색해 프롬프트에 첨부.<br>• <strong>장점:</strong> 모델 재학습 없이 <b>환각(거짓말) 완벽 방지</b>, 최신 정보 즉시 반영 (기업 고객 CS/법률 1위 선호 방식).'
            },
            {
              title: '🎯 3. 파인튜닝 (미세조정) ("천재에게 직장인 실무 직무 교육 시키기")',
              detail: '• 이미 똑똑한 기본 모델에 회사의 특화 말투, 전문 용어 데이터셋을 추가 학습시켜 가중치를 미세 개조.<br>• 프롬프트에 길게 설명하지 않아도 우리 회사 서식과 업무 규칙을 찰떡같이 준수.'
            }
          ]
        },
        {
          secTitle: '🤖 4. 피지컬 AI · 모델 계층(Base vs Chat) · 에이전트 도구',
          icon: '🤖',
          desc: '화면을 뚫고 나온 AI, 기본 엔진(Base) vs 실무용 튜닝(Chat) 모델 차이, 에이전트 핵심 도구(펑션 콜 & 벡터 DB)',
          cards: [
            {
              title: '🦾 피지컬 AI (Physical AI)',
              detail: '• 화면 속 소프트웨어를 넘어 로봇, 자동차, 드론 등 <b>물리적 강철 몸통</b>을 얻은 AI.<br>• <strong>예시:</strong> 도로를 보고 스스로 주행하는 로보택시, 스스로 걸음마와 부품 조립을 배우는 테슬라 옵티머스 휴머노이드.'
            },
            {
              title: '🧠 Base Model vs Chat/Instruct Model',
              detail: '• <strong>기본 엔진(Base Model):</strong> 방대한 글을 읽었지만 눈치 없는 앵무새 ("사과가 뭐야?" 물으면 "바나나가 뭐야?"로 문장만 이어붙임)<br>• <strong>실무용 튜닝(Chat/Instruct):</strong> 대화 족집게 과외(파인튜닝)를 거쳐 사람처럼 친절하고 유용하게 대답하는 ChatGPT'
            },
            {
              title: '🛠️ 에이전트 필수 키워드 (펑션 콜 & 벡터 DB)',
              detail: '• <strong>펑션 콜 (Function Call):</strong> AI에게 계산기, 날씨 API, DB 쿼리 버튼을 쥐어줘 필요할 때 스스로 누르게 하는 기술.<br>• <strong>벡터 DB (Vector DB):</strong> 글자 일치가 아닌 <b>\'의미(뜻)\'</b>을 좌표로 변환해 찾는 도서관 ("원숭이" 검색 시 관련 깊은 "바나나" 추출).'
            }
          ]
        },
        {
          secTitle: '🧪 5. 머신러닝 기초 · 지도학습 4단계 & 판다스(Pandas) 기초 실습',
          practiceTitle: '지도학습 4단계 & Pandas 데이터 핸들링 Lab',
          icon: '🧪',
          isPractice: true,
          desc: '레모네이드 가게 예시로 배우는 독립/종속변수와 지도학습 4단계 워크플로우, 그리고 구글 코랩 & 판다스 삼총사 실습 코드',
          cards: [
            {
              title: '🗺️ 지도학습 4단계 빅픽처 (레모네이드 가게)',
              detail: '• <strong>1단계 과거 데이터 준비:</strong> 독립변수(원인: 온도 X)와 종속변수(결과: 판매량 y) 분리<br>• <strong>2단계 모델 구조 만들기:</strong> 온도를 넣으면 판매량을 뱉는 예측 기계 틀 설계<br>• <strong>3단계 모델 학습(Fit):</strong> 컴퓨터가 "온도 × 2 = 판매량이네!" 규칙을 스스로 깨우침<br>• <strong>4단계 모델 이용(Predict):</strong> 내일 예보(15도)를 넣으면 예상 판매량(30개) 척척 예측!'
            },
            {
              title: '🐼 구글 코랩(Colab) & 판다스(Pandas) 핵심 도구',
              detail: '• <strong>구글 코랩:</strong> 설치 없이 웹브라우저에서 GPU/파이썬을 바로 돌리는 클라우드 환경<br>• <strong>판다스:</strong> 엑셀 표(CSV) 데이터를 파이썬에서 자유자재로 다루는 마법의 라이브러리'
            }
          ],
          code: `# ========================================================
# 10/06 머신러닝 지도학습 4단계 & Pandas 기초 실습 코드
# ========================================================
import pandas as pd
from sklearn.linear_model import LinearRegression

# --------------------------------------------------------
# [실습 1] 판다스 삼총사: 파일 불러오기, 크기 확인, 미리보기
# --------------------------------------------------------
# 1. 파일 불러오기: CSV 데이터를 표(DataFrame)로 로드
data = pd.read_csv('lemonade.csv')

# 2. 데이터 크기 확인: 몇 행 몇 열인지 파악
print("데이터 크기 (행, 열):", data.shape)  # 예: (100, 2)

# 3. 맛보기 미리보기: 상위 5개 데이터 확인
print("상위 5개 데이터:")
print(data.head())

# --------------------------------------------------------
# [실습 2] 지도학습 4단계 파이프라인
# --------------------------------------------------------
# 1단계: 과거 데이터 준비 (독립변수 X, 종속변수 y)
X = data[['온도']]    # 원인 (독립변수)
y = data['판매량']     # 결과 (종속변수)

# 2단계: 모델의 구조 만들기 (회귀 모델 뼈대 설계)
model = LinearRegression()

# 3단계: 데이터로 모델 학습(Fit)시키기 - 규칙 스스로 깨우치기
model.fit(X, y)
print("학습 완료! (가중치 기울기 W:", model.coef_[0], ", 절편 b:", model.intercept_, ")")

# 4단계: 모델 이용하기 (Predict) - 내일 온도로 판매량 예측
tomorrow_temp = pd.DataFrame({'온도': [25, 28, 30]})
prediction = model.predict(tomorrow_temp)

for temp, pred in zip(tomorrow_temp['온도'], prediction):
    print(f"🌡️ 기온 {temp}도 일 때 예상 레모네이드 판매량: {int(round(pred))}잔")
`,
          summary: 'pd.read_csv, .shape, .head() 삼총사로 데이터를 탐색하고, X(독립변수)와 y(종속변수)를 분리하여 fit() 학습 후 predict()로 미래를 예측하는 지도학습 표준 파이프라인입니다.'
        },
        {
          secTitle: '🌲 6. [실습 Lab] 의사결정나무(Decision Tree) 기반 대출 승인 분류 실습',
          practiceTitle: '스무고개 의사결정나무(DecisionTreeClassifier) 대출 승인 분류 Lab',
          icon: '🌲',
          isPractice: true,
          desc: '나이와 연봉(원인 X)으로 대출 승인 여부(정답 Y, 0/1)를 예측하는 3단계 머신러닝 분류(Classification) 파이프라인 실전 실습',
          cards: [
            {
              title: '📑 # 1. 데이터 준비 (원인 X vs 정답 Y)',
              detail: '• <strong>독립변수 (X_원인):</strong> 나이와 연봉 데이터를 엑셀 표(DataFrame) 형태로 준비.<br>• <strong>종속변수 (Y_정답):</strong> 대출 승인 여부(0: 거절, 1: 승인) 정답지 라벨 세팅.'
            },
            {
              title: '🧠 # 2. 모델 학습 (스무고개 기계에 .fit)',
              detail: '• <strong>DecisionTreeClassifier:</strong> "스무고개 하듯 조건을 나누어 판단하는 기계" 생성.<br>• <code>model.fit(X, Y)</code>로 준비한 원인과 정답 데이터를 주며 규칙을 스스로 깨우치도록 피팅(학습).'
            },
            {
              title: '🚀 # 3. 예측 및 적용 (.predict로 신규 고객 판별)',
              detail: '• 공부가 끝난 기계에 새로운 고객 정보(예: 나이 35세, 연봉 5000)를 <code>model.predict(new)</code>로 전달.<br>• 과거 학습 패턴을 바탕으로 <i>"이 고객은 대출이 승인될까, 거절될까?"</i> 척척 판별.'
            }
          ],
          code: `# ========================================================
# [실습] 의사결정나무(DecisionTree) 대출 승인 분류 모델
# ========================================================
import pandas as pd
from sklearn.tree import DecisionTreeClassifier

# --------------------------------------------------------
# 1단계: 데이터 준비 (# 1)
# (나이와 연봉: X_원인, 대출 승인 여부 0/1: Y_정답)
# --------------------------------------------------------
data = pd.DataFrame({
    '나이': [25, 30, 45, 22, 50, 38],
    '연봉': [3000, 4500, 8000, 2400, 9500, 5200],
    '승인여부': [0, 1, 1, 0, 1, 1]  # 0: 거절, 1: 승인
})

X_원인 = data[['나이', '연봉']]   # 원인 (독립변수)
Y_정답 = data['승인여부']        # 정답 (종속변수)

print("--- [1단계] 준비된 학습 데이터 표 ---")
print(data)

# --------------------------------------------------------
# 2단계: 모델 학습 (# 2)
# (DecisionTreeClassifier "스무고개 판단 기계"에 .fit)
# --------------------------------------------------------
model = DecisionTreeClassifier(random_state=42)
model.fit(X_원인, Y_정답)
print("\\n--- [2단계] 의사결정나무 모델 학습(.fit) 완료! ---")

# --------------------------------------------------------
# 3단계: 예측 및 적용 (# 3)
# (신규 고객 정보를 .predict로 전달하여 승인/거절 판별)
# --------------------------------------------------------
new_customer = pd.DataFrame({
    '나이': [35, 23],
    '연봉': [5000, 2100]
})

predictions = model.predict(new_customer)

print("\\n--- [3단계] 신규 고객 대출 심사 결과 (.predict) ---")
for i, (idx, row) in enumerate(new_customer.iterrows()):
    result_text = "✅ 대출 승인(1)" if predictions[i] == 1 else "❌ 대출 거절(0)"
    print(f"고객 {i+1} [나이: {row['나이']}세, 연봉: {row['연봉']}만원] → 판정: {result_text}")
`,
          summary: 'DecisionTreeClassifier(스무고개)를 활용해 원인(나이, 연봉)과 정답(승인 여부 0/1)으로 규칙을 학습(.fit)하고, 신규 고객 데이터를 .predict()하여 승인/거절을 판별하는 분류(Classification) 실전 파이프라인입니다.'
        },
        {
          secTitle: '🔍 7. [딥러닝 Lab] CNN(합성곱 신경망): 돋보기 든 명탐정과 Keras 비정형 이미지 분류',
          practiceTitle: 'CNN 돋보기 이미지 분류 & Keras 코드 한눈에 읽기 Lab',
          icon: '🔍',
          isPractice: true,
          desc: '표 데이터를 넘어선 사진·목소리·글 비정형 데이터 정복! 돋보기(Conv2D)와 요약(MaxPool2D)으로 옷/사물을 판별하는 실전 Keras 딥러닝',
          cards: [
            {
              title: '📸 1. 딥러닝이 잘하는 것: 비정형 데이터 (사진, 목소리, 글)',
              detail: '• 엑셀 같은 정형 숫자 데이터와 달리 세상에는 사진, 목소리, 문장처럼 규칙이 복잡한 데이터가 훨씬 많습니다.<br>• 사람이 일일이 규칙을 짤 수 없는 비정형 데이터에서 컴퓨터가 스스로 고차원 패턴을 찾도록 학습시키는 핵심 기술이 <strong>딥러닝</strong>입니다.'
            },
            {
              title: '🔍 2. CNN (합성곱 신경망): 돋보기 든 명탐정',
              detail: '• <strong>원리:</strong> 사진을 통째로 주면 어디가 눈/코인지 모릅니다. 그래서 작은 <b>돋보기(필터/Kernel)</b>로 구석구석 훑으며 선, 윤곽선, 무늬 같은 특징을 찾아냅니다.<br>• <strong>활용:</strong> 자율주행차가 보행자와 신호등을 감지하는 눈의 역할을 수행합니다.'
            },
            {
              title: '💡 3. 복잡해 보이는 Keras 코드의 실체 (치트키)',
              detail: '• <code>Conv2D / MaxPool2D</code>: <i>"돋보기로 특징 싹 훑고, 핵심만 남기고 크기를 확 줄여서 요약해!"</i><br>• <code>Flatten / Dense</code>: <i>"요약된 조각들을 한 줄로 쫙 펴서, 이게 어떤 옷(카테고리)인지 최종 정답을 맞춰봐!"</i><br>• <code>model.fit(epochs=5)</code>: <i>"사진이랑 정답지 줄 테니까 5번 반복해서 열심히 공부(훈련)해!"</i>'
            }
          ],
          code: `# ========================================================
# [실습] TensorFlow Keras 기반 CNN 의류 이미지 분류 모델
# (돋보기 Conv2D -> 요약 MaxPool2D -> 1열 펴기 Flatten -> 분류 Dense)
# ========================================================
import tensorflow as tf
from tensorflow.keras import layers, models

# --------------------------------------------------------
# 1. 돋보기 든 명탐정 CNN 모델 구조 조립
# --------------------------------------------------------
model = models.Sequential([
    # [Conv2D / MaxPool2D]: 돋보기로 윤곽선 훑고, 핵심만 요약해!
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),

    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),

    # [Flatten]: 2차원 이미지 조각들을 1줄로 쫙 펴기!
    layers.Flatten(),

    # [Dense]: 요약 조각을 조합해 어떤 옷인지 10개 보기 중 최종 맞추기!
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')  # 의류 10개 클래스 확률 출력
])

# --------------------------------------------------------
# 2. 컴파일: 채점관(Loss)과 내비게이션(Optimizer) 규칙 설정
# --------------------------------------------------------
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
print("--- [CNN 모델 구조 요약] ---")
model.summary()

# --------------------------------------------------------
# 3. model.fit(): 사진과 정답지로 5번 반복해서 열공(훈련)해!
# --------------------------------------------------------
# (X_train: 의류 사진 데이터, y_train: 의류 종류 정답 번호)
# model.fit(X_train, y_train, epochs=5, batch_size=64)
print("\\n[알림] model.fit(epochs=5) 실행 시 5회 반복 학습을 통해 이미지 인식률이 점진적으로 향상됩니다!")
`,
          summary: 'Conv2D(돋보기)와 MaxPool2D(크기 압축)로 시각 특징을 추출하고, Flatten/Dense로 1열 정렬 후 분류하며, model.fit(epochs=5)로 5회 반복 학습하는 Keras 딥러닝 이미지 처리 표준 파이프라인입니다.'
        },
        {
          secTitle: '🏢 8. [기업 실무] 회사 전용 AI를 만드는 5단계 핵심 파이프라인 (LoRA & 지식그래프)',
          icon: '🏢',
          desc: '허깅페이스 깡통 뇌 다운로드부터 지식 그래프 데이터 구축, LoRA 포스트잇 가성비 튜닝, 모의고사 검증 및 사내 서빙까지의 전 과정',
          cards: [
            {
              title: '📥 Step 1. 깡통 뇌 다운로드 (Model Load)',
              detail: '• 전 세계 천재들이 만들어 둔 무료 오픈소스 기본 모델(Hugging Face 등) 중 우리 회사 서버 사정과 VRAM 용량에 맞는 것을 쇼핑하듯 선별 다운로드하는 단계입니다.'
            },
            {
              title: '📑 Step 2. 맞춤형 훈련 데이터 구축 (Dataset Prep - 가장 힘든 과정!)',
              detail: '• AI에게 먹일 <i>"사내 업무 질문-정답"</i> 짝꿍 데이터를 수만 개 정제 (Garbage In, Garbage Out).<br>• <strong>★ 지식 그래프(Knowledge Graph)의 맹활약:</strong> <i>"이재용 → 회장 → 삼성전자"</i>처럼 단어 간의 관계를 거미줄처럼 정리해 둔 지식 DB를 엮어주면, 단순 암기를 넘어 복잡한 기업 구조를 완벽히 추론하는 \'명탐정\'으로 진화합니다.'
            },
            {
              title: '🏷️ Step 3. 가성비 튜닝 시작 (Training with LoRA - 포스트잇 과외법)',
              detail: '• 수백 GB짜리 AI 전체 뇌를 다 뜯어고치려면 슈퍼컴퓨터가 필요합니다.<br>• <strong>LoRA 기적의 가성비:</strong> 원래 모델의 거대 뇌는 가만히 두고(Freeze), 꼭 필요한 뉴런 옆에 얇은 <b>\'포스트잇(가중치 어댑터)\'</b>만 덧붙여 사내 특수 지식을 주입! 일반 그래픽 카드 몇 개만으로도 튜닝 가능.'
            },
            {
              title: '📝 Step 4. 모의고사 채점 및 안전 검사 (Evaluation & Safety)',
              detail: '• AI가 헛소리(환각, Hallucination)를 하거나 사내 보안 규정을 어기고 엉뚱한 대답을 하지 않는지 깐깐하게 평가하고 가드레일(Guardrail)을 적용하는 단계입니다.'
            },
            {
              title: '🚀 Step 5. 사내 배포 (Serving & Production)',
              detail: '• 훈련이 끝난 \'우리 회사 전용 커스텀 모델\'을 사내망/서버에 올려, 전 직원이 사내 메신저나 웹에서 사내용 챗GPT처럼 안심하고 쓸 수 있게 오픈하는 최종 단계입니다.'
            }
          ],
          code: `# ========================================================
# [실무 가이드] Hugging Face & LoRA(PEFT) 사내 전용 AI 파이프라인
# ========================================================
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model

# --------------------------------------------------------
# Step 1. 깡통 뇌 다운로드 (Model Load)
# --------------------------------------------------------
model_id = "meta-llama/Llama-3-8B-Instruct"  # 회사 서버 규모에 맞는 오픈소스 모델
base_model = AutoModelForCausalLM.from_pretrained(model_id, load_in_4bit=True)
tokenizer = AutoTokenizer.from_pretrained(model_id)
print("[Step 1] 오픈소스 기본 모델 다운로드 및 로드 완료!")

# --------------------------------------------------------
# Step 2. 맞춤형 훈련 데이터 구축 (Dataset Prep & 지식 그래프)
# (단어 간 거미줄 관계: "이재용 -> 회장 -> 삼성전자" 구조화)
# --------------------------------------------------------
qa_dataset = [
    {"instruction": "출장비 청구 기한이 언제인가요?", "output": "출장 복귀 후 영업일 기준 7일 이내에 영수증을 첨부해야 합니다."},
    {"instruction": "사내 보안 원칙 1조는?", "output": "외부 클라우드에 API 키나 고객 개인정보를 평문으로 업로드하는 행위를 엄격히 금지합니다."}
]
print("[Step 2] 사내 지식 그래프 연계 업무 QA 데이터셋 준비 완료!")

# --------------------------------------------------------
# Step 3. 가성비 튜닝 시작 (Training with LoRA - 포스트잇 과외법)
# (원래 뇌는 고정하고, 얇은 포스트잇 어댑터만 덧붙여 튜닝)
# --------------------------------------------------------
lora_config = LoraConfig(
    r=8,                            # 포스트잇 두께 (작은 랭크로 GPU 메모리 절약)
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

company_custom_model = get_peft_model(base_model, lora_config)
print("\\n[Step 3] LoRA 포스트잇 가성비 튜닝 구조 세팅 완료:")
company_custom_model.print_trainable_parameters()  # 전체 중 약 0.1%만 학습!

# --------------------------------------------------------
# Step 4 & 5. 모의고사 채점(환각/보안 검사) & 사내 배포(Serving)
# --------------------------------------------------------
print("\\n[Step 4] 사내 규정 QA 테스트셋으로 환각 및 보안 규정 위반 모의고사 검증")
print("[Step 5] vLLM / FastAPI 기반으로 사내 메신저 및 인트라넷에 안전 배포 완료!")
`,
          summary: 'Hugging Face 기본 모델 선택부터 사내 지식 그래프 데이터셋 구축, LoRA 포스트잇 가성비 튜닝, 안전성 검증 및 사내 서빙까지 이어지는 기업 전용 프라이빗 AI 5단계 핵심 파이프라인입니다.'
        },
        {
          secTitle: '🍳 9. AI 레스토랑의 5가지 핵심 직군과 협업 구조 (최고급 레스토랑 비유)',
          icon: '🍳',
          desc: '신선한 식재료 운반부터 썩은 양파 골라내기, 메인 셰프의 뇌 조립, 말귀 조련사, 홀 서빙 관리자까지 5대 전문 직군의 유기적 협업 파이프라인',
          cards: [
            {
              title: '🚚 데이터 엔지니어: "신선한 식재료를 실어나르는 물류 기사님"',
              detail: '• 회사 곳곳(엑셀, 사내 게시판, DB 등)에 흩어진 데이터들을 자동으로 모아서 창고(서버)로 배달하는 길(파이프라인)을 닦는 사람입니다.<br>• <strong>💡 생존 원칙:</strong> 이들이 없으면 AI 요리사는 식재료가 없어 굶어 죽습니다.'
            },
            {
              title: '🧅 데이터 분석가: "썩은 양파를 골라내는 깐깐한 주방 보조"',
              detail: '• 배달된 식재료 중에서 AI가 배우면 안 되는 쓸모없는 정보나 불량/노이즈 데이터를 깐깐하게 걸러내고, 진짜 영양가 있는 핵심 요약본과 피처(Feature)만 쏙쏙 추려냅니다.'
            },
            {
              title: '👨‍🍳 AI / ML 엔지니어: "불 조절로 최고의 맛을 내는 메인 셰프"',
              detail: '• 수학과 코딩을 이용해 AI의 뇌 구조(신경망 모델)를 직접 만지고 조립하며, 학습 속도와 메모리를 조절해 가장 똑똑하고 깊은 맛의 모델로 구워냅니다.'
            },
            {
              title: '🐕 프롬프트 엔지니어: "AI계의 강형욱 (전문 조련사)"',
              detail: '• 코딩보다는 AI의 말귀를 알아듣게 훈련시킵니다. AI가 헛소리나 거짓말(환각)을 하지 않도록 <i>"친절하게 존댓말해", "모르면 모른다고 솔직히 말해"</i>라며 룰과 성향을 잡아줍니다.'
            },
            {
              title: '🛡️ 백엔드 / MLOps 엔지니어: "레스토랑 매니저 (홀 서빙 관리자)"',
              detail: '• 완성된 요리(AI 모델)를 직원들이 편하게 먹을 수 있도록 예쁜 그릇(웹사이트, 메신저 등 UI)에 담아 서빙(API)하고, 손님이 수백 명 몰려와도 식당(서버)이 무너지지 않게 24시간 관리합니다.'
            }
          ],
          table: {
            headers: ['직군 (AI 역할)', '레스토랑 비유', '핵심 임무 & 책임', '상호 연계 파이프라인'],
            rows: [
              ['데이터 엔지니어', '물류 기사님', '분산된 사내 데이터 자동 수집 및 DB 파이프라인 구축', '신선한 원천 데이터를 분석가 창고로 전달'],
              ['데이터 분석가', '주방 보조', '불량·결측 데이터 필터링, 정제, 핵심 피처 추출', '깨끗하게 손질된 데이터를 ML 셰프에게 전달'],
              ['AI / ML 엔지니어', '메인 셰프', '인공신경망 설계, 모델 학습(fit), 가중치 최적화', '완성된 모델을 서빙 매니저에게 전달'],
              ['프롬프트 엔지니어', '전문 조련사', '시스템 지침 설계, Few-shot 프롬프팅, 환각 방지', '사용자가 원하는 최적의 답변 톤앤매너 완성'],
              ['백엔드 / MLOps', '홀 서빙 매니저', 'FastAPI 모델 서빙, 동시 접속 방어, 24시간 모니터링', '직원/고객에게 안정적인 무중단 AI 서비스 제공']
            ]
          }
        },
        {
          secTitle: '🚀 10. 사내 배포(Serving) & MLOps 4대 인프라 스택 (FastAPI · Docker · Cloud · vLLM)',
          icon: '🚀',
          desc: '"서버가 죽으면 우리도 죽는다!" 무중단 사내 AI 서비스를 위한 백엔드/MLOps 수문장 마인드와 실무 포트폴리오의 실체',
          cards: [
            {
              title: '🛡️ 역할 (백엔드 / MLOps 엔지니어)',
              detail: '• <strong>"서버가 죽으면 우리도 죽는다!"</strong>는 마인드로, 수천 명이 동시에 접속해도 서버가 뻗지 않게 튼튼한 방어벽을 치는 인프라 전문가입니다.'
            },
            {
              title: '⚡ FastAPI: 초고속 비동기 웹 API 도구',
              detail: '• 파이썬으로 가볍고 빠르게 웹 서버를 만들어 주는 도구입니다.<br>• 비동기(async) 지원과 Pydantic 기반의 자동 데이터 검증으로 AI/LLM 서빙 표준으로 쓰입니다.'
            },
            {
              title: '📦 Docker (도커): 마법의 환경 격리 상자',
              detail: '• 프로그램을 실행할 때 필요한 모든 환경(파이썬, 라이브러리, 의존성)을 <b>\'컨테이너(상자)\'</b>에 깔끔하게 포장해서, 어디서든 오류 없이 똑같이 실행되게 해주는 마법의 상자입니다.'
            },
            {
              title: '☁️ AWS / GCP: 거대한 클라우드 공간',
              detail: '• 아마존(AWS)이나 구글(GCP)이 빌려주는 거대한 가상 컴퓨터 서버 공간으로, 오토스케일링을 통해 대규모 트래픽을 유연하게 감당합니다.'
            },
            {
              title: '🏎️ vLLM / Ollama: 초고속 AI 모델 실행 엔진',
              detail: '• AI 대형 언어 모델을 서버에서 메모리 낭비 없이 빠르고 안정적으로 돌리게 해주는 실무 전용 초고속 추론 엔진입니다.'
            },
            {
              title: '💼 포트폴리오 예시가 뜻하는 실무적 실체',
              detail: '• <i>"내가 만든 커스텀 AI 모델을 도커와 FastAPI로 잘 포장해서 클라우드 서버에 올린 뒤, 동시 접속자 100명이 몰려와도 서버가 안 뻗고 잘 버티는지(스트레스 테스트) 직접 검증해 본 무중단 서비스 시스템입니다"</i>라는 뜻의 실무 결과물 예시입니다.'
            }
          ],
          code: `# ========================================================
# [실무 서빙 코드] FastAPI + Pydantic 기반 사내 AI 서빙 API
# ========================================================
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Company Private AI Serving API", version="1.0")

# 1. 요청/응답 데이터 규격 정의 (Pydantic 스키마)
class PromptRequest(BaseModel):
    query: str
    department: str = "전사공통"
    max_tokens: int = 256

class AIResponse(BaseModel):
    status: str
    answer: str
    served_by: str

# 2. 사내 AI 모델 서빙 엔드포인트
@app.post("/v1/chat/completions", response_model=AIResponse)
async def generate_response(req: PromptRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="질문 내용을 입력해주세요.")
    
    # 실제 환경: vLLM 엔진 호출 (예: await vllm_engine.generate(req.query))
    simulated_answer = f"[사내 AI 답변] '{req.query}'에 대해 사내 규정 DB를 기반으로 생성된 답변입니다."
    
    return AIResponse(
        status="success",
        answer=simulated_answer,
        served_by="FastAPI + Docker Container (vLLM Engine)"
    )

# --------------------------------------------------------
# 3. Dockerfile 포장 예시:
# FROM python:3.11-slim
# RUN pip install fastapi uvicorn vllm
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# --------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
`,
          summary: 'FastAPI와 Docker로 커스텀 AI 모델을 격리 패키징하고, AWS/GCP 클라우드 및 vLLM 엔진 환경에서 동시 접속 부하를 방어하며 무중단으로 안정 서빙하는 MLOps 인프라 구축 핵심 파이프라인입니다.'
        }
      ]
    },
    {
      id: '1004',
      date: '10/04 (일)',
      badge: '10/04',
      title: '🧠 룰 기반 vs 머신러닝 vs 딥러닝 완벽 비교 & 테크 PM 필수 AI 파이프라인 가이드',
      subtitle: '지도학습/비지도학습 분류·회귀·군집, ML 핵심 5대 용어, 딥러닝 활성화함수, SQL+Python+JSON 3대 결합 파이프라인, SLM 온디바이스 & 파인튜닝 실무 전략',
      tags: ['1004실무', '머신러닝', '딥러닝', '지도학습', '비지도학습', '과적합_Overfitting', '활성화함수', 'SQL_Python_JSON', '파이프라인', 'SLM', '파인튜닝', 'PM아키텍처', '실습'],
      sections: [
        {
          secTitle: '⚡ 1. 한 줄 개념 비교: 룰 기반 vs 머신러닝 vs 딥러닝',
          secDesc: '규칙을 사람이 직접 작성하는가, 데이터에서 기계가 스스로 찾는가, 뇌신경망으로 비정형 데이터를 정복하는가의 핵심 차이',
          content: `
            <div class="dl-card" style="border-radius: 12px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
                
                <div style="background: #f8fafc; border-top: 4px solid #64748b; padding: 18px; border-radius: 8px;">
                  <span style="display: inline-block; padding: 3px 8px; background: #e2e8f0; color: #475569; font-weight: 700; font-size: 0.8rem; border-radius: 4px; margin-bottom: 8px;">전통적 코딩</span>
                  <h4 style="margin: 0 0 10px; color: #1e293b; font-size: 1.1rem;">룰 기반 (Rule-based)</h4>
                  <p style="font-size: 0.92rem; color: #334155; margin-bottom: 8px;"><b>"사람이 규칙을 일일이 짬"</b></p>
                  <p style="font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.6;">
                    개발자/기획자가 직접 <code>if-else</code> 조건문을 작성합니다.<br>
                    <i>예: "예약 후 15일 이상 지났고 10대 환자면 노쇼로 분류해라."</i>
                  </p>
                </div>

                <div style="background: #eff6ff; border-top: 4px solid #3b82f6; padding: 18px; border-radius: 8px;">
                  <span style="display: inline-block; padding: 3px 8px; background: #dbeafe; color: #1d4ed8; font-weight: 700; font-size: 0.8rem; border-radius: 4px; margin-bottom: 8px;">기계학습 (정형 데이터)</span>
                  <h4 style="margin: 0 0 10px; color: #1e293b; font-size: 1.1rem;">머신러닝 (ML)</h4>
                  <p style="font-size: 0.92rem; color: #1d4ed8; margin-bottom: 8px;"><b>"데이터(CSV/표)를 주면 컴퓨터가 규칙(패턴)을 찾아냄"</b></p>
                  <p style="font-size: 0.88rem; color: #475569; margin: 0; line-height: 1.6;">
                    환자 11만 명의 나이, 예약 간격, 문자 수신 여부(<code>X</code>)와 노쇼 여부(<code>Y</code>)를 던져주면 가중치를 스스로 계산하여 <i>"예약 간격 15일 초과 시 노쇼 확률 32% 상승"</i> 패턴을 학습합니다.
                  </p>
                </div>

                <div style="background: #faf5ff; border-top: 4px solid #8b5cf6; padding: 18px; border-radius: 8px;">
                  <span style="display: inline-block; padding: 3px 8px; background: #f3e8ff; color: #6d28d9; font-weight: 700; font-size: 0.8rem; border-radius: 4px; margin-bottom: 8px;">심층학습 (비정형 데이터)</span>
                  <h4 style="margin: 0 0 10px; color: #1e293b; font-size: 1.1rem;">딥러닝 (DL)</h4>
                  <p style="font-size: 0.92rem; color: #6d28d9; margin-bottom: 8px;"><b>"인간의 뇌신경망을 본떠 비정형 데이터를 직접 정복"</b></p>
                  <p style="font-size: 0.88rem; color: #475569; margin: 0; line-height: 1.6;">
                    차량 도장면 사진을 보고 스크래치 등급을 자동 판별하거나, 의사의 녹취록 음성을 듣고 진료 요약본을 생성하는 고난도 영역입니다.
                  </p>
                </div>

              </div>

              <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5;">
                <h5 style="margin: 0 0 6px; color: #312e81; font-size: 0.98rem;">🎯 PM 관점에서의 핵심 차이 &amp; 비유</h5>
                <p style="margin: 0 0 6px; color: #475569; font-size: 0.9rem;">
                  • <b>머신러닝 (특징을 사람이 알려줌):</b> 아이에게 자전거를 가르칠 때 <i>"바퀴가 2개고 페달이 달린 것이 자전거란다"</i> 하고 핵심 Feature를 직접 지정해 짚어주는 방식. (엑셀/CSV 정형 데이터에 가성비 최상)<br>
                  • <b>딥러닝 (AI가 스스로 특징을 깨우침):</b> 사람의 설명 없이 자전거 사진 수만 장을 던져주면 AI 스스로 공통점과 미세 특징을 깨우치는 방식. (이미지, 음성, 텍스트 등 방대한 데이터와 막대한 컴퓨팅 파워 필요)
                </p>
              </div>
            </div>
          `
        },
        {
          secTitle: '🗺️ 2. 머신러닝(ML) 핵심 지도: 지도학습 vs 비지도학습',
          secDesc: '실무와 기획의 80%는 정답(Y)이 존재하는 지도학습! 분류(Classification), 회귀(Regression), 군집화(Clustering)',
          content: `
            <div class="dl-card" style="border-radius: 12px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0;">
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div style="border: 2px solid #3b82f6; border-radius: 10px; padding: 18px; background: rgba(59, 130, 246, 0.02);">
                  <div style="font-weight: 700; color: #1d4ed8; font-size: 1.05rem; margin-bottom: 10px;">① 지도학습 (Supervised Learning) : 정답(Y)이 있는 데이터</div>
                  
                  <div style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">
                    <b style="color: #0f172a;">● 분류 (Classification) : O냐 X냐 / 범주 맞히기</b>
                    <p style="margin: 4px 0 6px; font-size: 0.88rem; color: #475569;">
                      예: <code>medical.csv</code>에서 다음 주 화요일 환자가 <b>"올 것인가(No), 안 올 것인가(Yes)?"</b> 예측
                    </p>
                    <div style="font-size: 0.82rem; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                      대표 모델: 로지스틱 회귀, 랜덤 포레스트, <b>XGBoost / LightGBM</b> (현업 정형 데이터의 제왕)
                    </div>
                  </div>

                  <div>
                    <b style="color: #0f172a;">● 회귀 (Regression) : 구체적인 숫자(연속값) 맞히기</b>
                    <p style="margin: 4px 0 6px; font-size: 0.88rem; color: #475569;">
                      예: 행복지도 데이터에서 특정 구의 1인당 GRDP와 예산을 보고 <b>"내년도 행복지수 몇 점(0.00~1.00)일까?"</b> 예측
                    </p>
                    <div style="font-size: 0.82rem; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                      대표 모델: 선형 회귀(Linear Regression), Lasso, Ridge
                    </div>
                  </div>
                </div>

                <div style="border: 2px solid #10b981; border-radius: 10px; padding: 18px; background: rgba(16, 185, 129, 0.02);">
                  <div style="font-weight: 700; color: #047857; font-size: 1.05rem; margin-bottom: 10px;">② 비지도학습 (Unsupervised Learning) : 정답 없이 묶기</div>
                  
                  <b style="color: #0f172a;">● 군집화 (Clustering) : 유사한 성격끼리 그룹화</b>
                  <p style="margin: 6px 0 10px; font-size: 0.88rem; color: #475569; line-height: 1.6;">
                    정답 라벨이 없어도 데이터의 거리(유사도)를 계산하여 성격이 비슷한 그룹끼리 자동 클러스터링합니다.<br>
                    <i>예: 전국 229개 시군구를 건강/경제/안전 점수에 따라 <b>"고소득·의료특화형 구", "친환경·여가특화형 군"</b> 등 4~5개 그룹으로 자동 분류</i>
                  </p>
                  <div style="font-size: 0.82rem; color: #047857; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    대표 모델: K-Means 군집화, DBSCAN
                  </div>
                </div>
              </div>

              <div style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.88rem;">
                <span style="color: #94a3b8;"># 기획자 관점의 실전 3줄 코딩 흐름 (Scikit-Learn)</span><br>
                <span style="color: #f43f5e;">from</span> sklearn.ensemble <span style="color: #f43f5e;">import</span> RandomForestClassifier<br><br>
                model = RandomForestClassifier()  <span style="color: #64748b;"># 1. 모델 부르기</span><br>
                model.fit(X_train, y_train)        <span style="color: #64748b;"># 2. 공부시키기 (fit: 패턴 학습)</span><br>
                pred = model.predict(X_test)      <span style="color: #64748b;"># 3. 예측하기 (predict: 추론)</span>
              </div>

            </div>
          `
        },
        {
          secTitle: '📖 3. 머신러닝 필수 용어 5개 (이것만 알면 실무 대화 끝)',
          secDesc: 'Feature, Target, Train/Test 분리, Overfitting, 평가지표(정확도 vs 재현율)',
          content: `
            <div class="dl-card" style="border-radius: 12px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0;">
              <div style="display: flex; flex-direction: column; gap: 14px;">
                
                <div style="padding: 12px 16px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
                  <strong style="color: #1e293b; font-size: 0.98rem;">1. 특징 (Feature, X)</strong>
                  <p style="margin: 4px 0 0; color: #475569; font-size: 0.88rem;">예측에 쓰이는 입력 재료 (예: 환자 나이, 예약 선행일수, SMS 수신 여부, 이전 노쇼 횟수)</p>
                </div>

                <div style="padding: 12px 16px; background: #f8fafc; border-left: 4px solid #10b981; border-radius: 6px;">
                  <strong style="color: #1e293b; font-size: 0.98rem;">2. 타깃/라벨 (Target/Label, y)</strong>
                  <p style="margin: 4px 0 0; color: #475569; font-size: 0.88rem;">맞혀야 하는 최종 정답 (예: 노쇼 여부 1 or 0, 내년도 매출액)</p>
                </div>

                <div style="padding: 12px 16px; background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 6px;">
                  <strong style="color: #1e293b; font-size: 0.98rem;">3. 학습/테스트 분리 (Train / Test Split)</strong>
                  <p style="margin: 4px 0 0; color: #475569; font-size: 0.88rem;">
                    전체 11만 건 중 8만 건으로 공부(Train)시키고, 모델이 한 번도 본 적 없는 나머지 3만 건(Test)으로 모의고사를 봐서 실전 성능을 검증합니다.
                  </p>
                </div>

                <div style="padding: 12px 16px; background: #f8fafc; border-left: 4px solid #ef4444; border-radius: 6px;">
                  <strong style="color: #1e293b; font-size: 0.98rem;">4. 과적합 (Overfitting)</strong>
                  <p style="margin: 4px 0 0; color: #475569; font-size: 0.88rem;">
                    연습문제 정답만 달달 외워 학습용 데이터에서는 100점 맞지만, 실전(새로운 환자 데이터)에 들어가면 엉뚱한 오답을 내는 상태 (일반화 성능 결여).
                  </p>
                </div>

                <div style="padding: 12px 16px; background: #f8fafc; border-left: 4px solid #8b5cf6; border-radius: 6px;">
                  <strong style="color: #1e293b; font-size: 0.98rem;">5. 평가지표 (정확도 vs 재현율 Recall &amp; F1-Score)</strong>
                  <p style="margin: 4px 0 0; color: #475569; font-size: 0.88rem; line-height: 1.5;">
                    전체 10명 중 8명이 정상 방문(No)하는 불균형 데이터에서는 무조건 "다 옵니다"라고 찍어도 정확도는 80%가 나옵니다.<br>
                    따라서 <b>"진짜 노쇼할 환자를 얼마나 안 놓치고 잡아냈는가(재현율, Recall)"</b>와 <b>F1-Score / AUC-ROC</b> 지표를 반드시 함께 봐야 합니다.
                  </p>
                </div>

              </div>
            </div>
          `
        },
        {
          secTitle: '🔬 4. 딥러닝(DL) 기초 개념 뼈대: 활성화함수 &amp; 3대 분야',
          secDesc: '인공신경망(ANN), 순전파/역전파 경사하강법, 비선형 활성화함수(ReLU/Sigmoid), CNN/RNN/Transformer',
          content: `
            <div class="dl-card" style="border-radius: 12px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0;">
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div style="background: #faf5ff; padding: 16px; border-radius: 8px;">
                  <h5 style="margin: 0 0 8px; color: #6d28d9; font-size: 1rem;">인공신경망(ANN) 학습 원리</h5>
                  <ol style="margin: 0; padding-left: 18px; color: #475569; font-size: 0.88rem; line-height: 1.6;">
                    <li><b>순전파:</b> 데이터를 넣고 예측값을 뽑음</li>
                    <li><b>손실 계산:</b> 실제 정답과 비교해 오차(Loss) 산출</li>
                    <li><b>역전파/경사하강법:</b> 오차를 줄이는 방향으로 신경망 가중치를 거꾸로 수정</li>
                  </ol>
                </div>

                <div style="background: #eff6ff; padding: 16px; border-radius: 8px;">
                  <h5 style="margin: 0 0 8px; color: #1e40af; font-size: 1rem;">핵심 무기: 활성화 함수 (Activation)</h5>
                  <p style="margin: 0; color: #475569; font-size: 0.88rem; line-height: 1.6;">
                    선형 계산만 반복하면 아무리 층을 깊게 쌓아도 1개의 직선 계산과 같습니다.<br>
                    데이터를 구부리고 꺾어주는 <b>비선형 활성화 함수(시그모이드, ReLU 등)</b>를 각 층마다 통과시켜야 복잡한 이미지·음성 패턴을 학습할 수 있습니다.
                  </p>
                </div>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 14px;">
                <h5 style="margin: 0 0 10px; color: #0f172a; font-size: 0.95rem;">실무 3대 딥러닝 아키텍처</h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                  <div style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <b style="color: #0284c7;">CNN (컴퓨터 비전)</b>
                    <p style="margin: 4px 0 0; font-size: 0.82rem; color: #64748b;">이미지 및 영상 처리, 객체 탐지, 차량 도장 스크래치 판별</p>
                  </div>
                  <div style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <b style="color: #d97706;">RNN / LSTM (시계열)</b>
                    <p style="margin: 4px 0 0; font-size: 0.82rem; color: #64748b;">순서가 있는 데이터, 주가/센서 시계열 (현재 트랜스포머로 진화)</p>
                  </div>
                  <div style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <b style="color: #7c3aed;">Transformer (LLM 언어모델)</b>
                    <p style="margin: 4px 0 0; font-size: 0.82rem; color: #64748b;">ChatGPT, Gemini, Claude 등 현대 생성형 AI의 기반 아키텍처</p>
                  </div>
                </div>
              </div>

            </div>
          `
        },
        {
          secTitle: '🔗 5. 왜 [SQL + Python + JSON] 조합이어야만 하는가?',
          secDesc: '대용량 데이터 저장(SQL) ➔ 추론 두뇌(Python) ➔ 웹/앱 통신(JSON)으로 이어지는 엔터프라이즈 파이프라인 아키텍처',
          content: `
            <div class="dl-card" style="border-radius: 12px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0;">
              
              <!-- 아키텍처 도식 -->
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; background: #f8fafc; padding: 18px; border-radius: 10px; border: 1px solid #cbd5e1;">
                <div style="flex: 1; min-width: 180px; background: #3b82f6; color: white; padding: 14px; border-radius: 8px; text-align: center;">
                  <div style="font-weight: 700; font-size: 1.05rem;">1. SQL DB</div>
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">대용량 로그 안전 저장 &amp; 0.1초 고속 필터링</div>
                </div>
                <div style="font-size: 1.3rem; color: #94a3b8; font-weight: bold;">➔</div>
                <div style="flex: 1; min-width: 180px; background: #10b981; color: white; padding: 14px; border-radius: 8px; text-align: center;">
                  <div style="font-weight: 700; font-size: 1.05rem;">2. Python Engine</div>
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">머신러닝/DL 모델 학습 &amp; 실시간 추론 API</div>
                </div>
                <div style="font-size: 1.3rem; color: #94a3b8; font-weight: bold;">➔</div>
                <div style="flex: 1; min-width: 180px; background: #f59e0b; color: white; padding: 14px; border-radius: 8px; text-align: center;">
                  <div style="font-weight: 700; font-size: 1.05rem;">3. JSON Payload</div>
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">프론트엔드 만능 데이터 통신 규격</div>
                </div>
                <div style="font-size: 1.3rem; color: #94a3b8; font-weight: bold;">➔</div>
                <div style="flex: 1; min-width: 180px; background: #6366f1; color: white; padding: 14px; border-radius: 8px; text-align: center;">
                  <div style="font-weight: 700; font-size: 1.05rem;">4. 웹 / 앱 UI</div>
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">위험도 뱃지 및 액션 버튼 시각화</div>
                </div>
              </div>

              <div style="display: grid; gap: 14px;">
                <div style="padding: 14px; border-left: 4px solid #3b82f6; background: #eff6ff; border-radius: 4px;">
                  <b style="color: #1e40af;">1. SQL (정확하고 안전한 데이터 추출)</b>
                  <p style="margin: 4px 0 0; color: #334155; font-size: 0.88rem; line-height: 1.6;">
                    파이썬은 10만, 100만 건 데이터를 직접 메모리에 다 올리면 RAM이 부족해 터집니다. 수백만 건의 병원 예약 로그에서 <i>"최근 6개월간 부도 이력이 있는 20대 환자"</i>만 0.1초 만에 깔끔하게 필터링해 뽑아오는 것은 SQL의 역할입니다.
                  </p>
                </div>

                <div style="padding: 14px; border-left: 4px solid #10b981; background: #ecfdf5; border-radius: 4px;">
                  <b style="color: #065f46;">2. Python (두뇌 역할: 모델 학습 및 추론)</b>
                  <p style="margin: 4px 0 0; color: #334155; font-size: 0.88rem; line-height: 1.6;">
                    SQL이 전달한 데이터를 받아 머신러닝 알고리즘(RandomForest, XGBoost)을 학습시키고, 학습된 모델 가중치(<code>.pkl</code>)를 바탕으로 새로운 예약이 들어올 때마다 실시간으로 <b>"노쇼 확률 78%"</b>를 연산합니다.
                  </p>
                </div>

                <div style="padding: 14px; border-left: 4px solid #f59e0b; background: #fffbeb; border-radius: 4px;">
                  <b style="color: #92400e;">3. JSON (웹/앱 프론트엔드와의 만능 통신 언어)</b>
                  <p style="margin: 4px 0 0; color: #334155; font-size: 0.88rem; line-height: 1.6;">
                    파이썬 데이터프레임 객체는 브라우저(React/HTML/JS)가 이해할 수 없습니다. 따라서 양방향 통신을 위해 국제 표준인 <b>JSON 포맷</b>으로 감싸서 송수신합니다:
                  </p>
                  <pre style="background: #1e293b; color: #38bdf8; padding: 10px; border-radius: 6px; font-size: 0.82rem; margin: 8px 0 0; overflow-x: auto;">
// 보낼 때 (React ➔ FastAPI)
{ "patient_id": 5642903, "age": 24, "lead_time": 18, "sms_received": 0 }

// 모델 예측 결과 반환 (FastAPI ➔ React)
{ "no_show_probability": 0.78, "risk_level": "HIGH", "action_required": "SEND_REMINDER" }
                  </pre>
                </div>
              </div>

            </div>
          `
        },
        {
          secTitle: '🚀 6. SLM (소형 언어 모델) &amp; 파인튜닝(Fine-Tuning) 전략',
          secDesc: '거대 클라우드 LLM을 넘어 온디바이스(On-Device) 초경량화와 사내 맞춤형 파인튜닝으로 완성하는 AX 기획',
          content: `
            <div class="dl-card" style="border-radius: 12px; padding: 22px; background: #ffffff; border: 1px solid #e2e8f0;">
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div style="padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                  <h5 style="margin: 0 0 10px; color: #166534; font-size: 1.05rem;">💡 SLM (Small Language Model)이란?</h5>
                  <p style="margin: 0; color: #374151; font-size: 0.88rem; line-height: 1.6;">
                    거대 LLM이 수천억 개의 파라미터를 가지고 무거운 클라우드 서버에서 돌아간다면, <b>SLM은 수십억(몇 B) 이하의 파라미터로 체급을 줄여 가볍고 효율적으로 만든 AI 모델</b>입니다.
                  </p>
                  <ul style="margin: 10px 0 0; padding-left: 18px; color: #166534; font-size: 0.84rem; line-height: 1.6;">
                    <li><b>압도적 비용 절감:</b> 호출당 API 과금 없이 빠른 추론 속도</li>
                    <li><b>온디바이스(On-Device):</b> 스마트폰, PC, 차량 기기 자체에서 오프라인 구동</li>
                    <li><b>특화 도메인 최적화:</b> 사내 업무/특정 기기 제어에 가성비 최고</li>
                  </ul>
                </div>

                <div style="padding: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px;">
                  <h5 style="margin: 0 0 10px; color: #6b21a8; font-size: 1.05rem;">🎯 기본 모델 vs 파인튜닝 (Fine-Tuning)</h5>
                  <p style="margin: 0 0 10px; color: #374151; font-size: 0.88rem; line-height: 1.6;">
                    • <b>기본 모델(Base Model):</b> 일반 지식을 광범위하게 알고 있는 '갓 졸업한 똑똑한 신입사원'<br>
                    • <b>파인튜닝(Fine-Tuning):</b> 신입사원에게 <b>우리 서비스 기획서, 전용 매뉴얼, 도메인 전문 데이터</b>를 집중 온보딩 교육시키는 과정
                  </p>
                  <ul style="margin: 0; padding-left: 18px; color: #6b21a8; font-size: 0.84rem; line-height: 1.6;">
                    <li><b>말투 및 포맷 고정:</b> 무조건 요약문 + 지정된 JSON 구조로만 출력</li>
                    <li><b>환각(Hallucination) 방지:</b> 엉뚱한 거짓 답변 확률 최소화</li>
                    <li><b>비용 절감:</b> 수백억 파운데이션 개발 대비 소자본 고성능 달성</li>
                  </ul>
                </div>
              </div>

              <div style="background: #1e1b4b; color: #e0e7ff; padding: 14px 18px; border-radius: 8px; font-size: 0.92rem; text-align: center; font-weight: 600;">
                ✨ 테크 PM 핵심 요약: <b>단순 코더는 accuracy 숫자만 보지만, 기획자는 [SQL 데이터 추출 ➔ Python 실시간 추론 ➔ JSON 통신 ➔ SLM 온디바이스 파이프라인] 전체를 설계합니다.</b>
              </div>

            </div>
          `
        },
        {
          isPractice: true,
          practiceTitle: '🍋 레모네이드 판매 예측 코드 한눈에 보기 (지도학습 회귀 모델)',
          secTitle: '🍋 7. 레모네이드 판매 예측 코드 한눈에 보기 (pandas & TensorFlow 회귀)',
          icon: '🍋',
          desc: '인터넷의 레모네이드 장사 기록(온도와 판매량 표)을 pandas로 원인과 결과로 분리하고, TensorFlow 1-Input 1-Output 신경망을 만들어 10회 학습(fit) 후 15도일 때의 판매량을 예측(predict)하는 3단계 전 과정',
          cards: [
            {
              title: '📥 1. 데이터 불러오기 (pandas)',
              detail: '인터넷에 있는 레모네이드 장사 기록(온도와 판매량 표)을 프로그램 안으로 가져와서, <b>원인(온도)</b>과 <b>결과(판매량)</b> 데이터로 싹 분리합니다.<br>• <strong>원인 (독립변수 X):</strong> <code>레모네이드[[\'온도\']]</code><br>• <strong>결과 (종속변수 Y):</strong> <code>레모네이드[[\'판매량\']]</code>'
            },
            {
              title: '🏗️ 2. AI 모델 뼈대 만들기 (TensorFlow)',
              detail: '<i>"온도(입력 1개)를 넣으면 판매량(출력 1개)을 뱉어내는 아주 단순한 형태의 예측 기계(모델)를 만들어라"</i>라고 설정하는 코드입니다.<br>• <strong>입력층(Input):</strong> <code>tf.keras.layers.Input(shape=[1])</code><br>• <strong>출력층(Dense):</strong> <code>tf.keras.layers.Dense(1)(X)</code><br>• <strong>컴파일(compile):</strong> <code>model.compile(loss=\'mse\')</code>'
            },
            {
              title: '🎯 3. 학습시키고 예측하기 (fit & predict)',
              detail: '• <strong>반복 학습(fit):</strong> <code>model.fit</code>을 눌러 컴퓨터에게 데이터를 10번(<code>epochs=10</code>) 반복해서 공부시킵니다.<br>• <strong>실전 예측(predict):</strong> 공부가 끝나면 <code>model.predict</code>를 이용해 <i>"그럼 온도가 15도일 때는 레모네이드가 몇 잔 팔릴까?"</i> 하고 물어보고, AI가 계산한 예측값(<code>[[25.681463]]</code>)을 화면에 띄워 확인합니다.'
            }
          ],
          code: `# ==============================================================================
# 🍋 레모네이드 판매 예측 코드 한눈에 보기 (지도학습 - 회귀 실습)
# ==============================================================================

# [1단계] 데이터 불러오기 (pandas)
# 인터넷에 있는 레모네이드 장사 기록(온도와 판매량 표)을 프로그램 안으로 가져와서,
# 원인(온도)과 결과(판매량) 데이터로 싹 분리합니다.
import pandas as pd

# 인터넷 장사 기록(온도, 판매량) 불러오기
레모네이드 = pd.read_csv('https://raw.githubusercontent.com/blackdew/tensorflow1/master/csv/lemonade.csv')
print("--- [데이터 미리보기] ---")
print(레모네이드.head())

# 원인(독립변수)과 결과(종속변수)로 싹 분리
독립 = 레모네이드[['온도']]
종속 = 레모네이드[['판매량']]
print("\n독립변수(원인) 형태:", 독립.shape)
print("종속변수(결과) 형태:", 종속.shape)


# [2단계] AI 모델 뼈대 만들기 (TensorFlow)
# "온도(입력 1개)를 넣으면 판매량(출력 1개)을 뱉어내는 아주 단순한 형태의 예측 기계(모델)를 만들어라"
import tensorflow as tf

X = tf.keras.layers.Input(shape=[1]) # 원인(온도 1개) 입력
Y = tf.keras.layers.Dense(1)(X)      # 결과(판매량 1개) 출력
model = tf.keras.models.Model(X, Y)
model.compile(loss=\'mse\')            # 평균제곱오차(MSE)로 공부 기준(오차 측정) 설정


# [3단계] 학습시키고 예측하기 (fit & predict)
# model.fit을 눌러 컴퓨터에게 데이터를 10번(epochs=10) 반복해서 공부시킵니다.
print("\n--- [10회 반복 학습 시작] ---")
model.fit(독립, 종속, epochs=10)

# 공부가 끝나면 model.predict를 이용해
# "그럼 온도가 15도일 때는 레모네이드가 몇 잔 팔릴까?" 하고 물어보고,
# AI가 계산한 예측값([[25.681463]])을 화면에 띄워 확인합니다.
예측값 = model.predict([[15]])
print("\n[AI 최종 예측 결과] 온도가 15도일 때 예상 판매량:")
print(예측값)
# 출력 예시: [[25.681463]] 잔`,
          table: {
            headers: ['단계', '핵심 도구 / 함수', '역할 비유', '실행 내용'],
            rows: [
              ['1단계', 'pandas (read_csv, [[\'칼럼명\']])', '재료 손질', '인터넷 장사 기록에서 원인(온도)과 결과(판매량) 표 분리'],
              ['2단계', 'TensorFlow (Input, Dense, compile)', '예측 기계 설계', '입력 1개(온도) ➔ 출력 1개(판매량) 뼈대 조립 및 loss 설정'],
              ['3단계', 'model.fit(독립, 종속, epochs=10)', '반복 특훈 (공부)', '데이터를 10번 반복해서 보며 온도-판매량 간 수학적 공식 터득'],
              ['4단계', 'model.predict([[15]])', '실전 예측 질의', '온도 15도 입력 시 AI 연산 결과 [[25.681463]] 잔 화면 출력']
            ]
          },
          summary: '원인(독립변수: 온도)과 결과(종속변수: 판매량)를 pandas로 분리하고, TensorFlow로 1입력-1출력 신경망을 구성한 뒤 fit(10회 반복 공부)과 predict(15도 입력 ➔ 25.681463 잔 예측)로 이어지는 완벽한 지도학습 회귀 파이프라인 완성!',
          note: '💡 <strong>지도학습 회귀 핵심:</strong> <code>epochs</code>(학습 횟수)를 늘릴수록 손실값(loss)이 줄어들며, AI가 기온과 레모네이드 판매량 사이의 숨겨진 규칙(수학 공식)을 정교하게 터득합니다.'
        }
      ]
    },
    {
      id: '1002',
      date: '10/02 (금)',
      badge: 'ARCHIVE',
      title: '🐍 초보자를 위한 파이썬 기초 개념 & 실전 프로젝트 완벽 가이드',
      subtitle: '모듈(Module)과 import, 필수 내장함수, time/os 표준모듈, 문자열 조작, 클래스/객체/상속, 연락처 관리 실전 프로젝트, 파일 입출력까지 비전공자 맞춤 마스터',
      tags: ['1002실무', '모듈', 'import', '내장함수', '표준모듈_time_os', '클래스_객체_self', '상속', '연락처프로젝트', '파일입출력_with_open', 'if_name_main', 'plot_savefig', 'ML_DL시각화', 'R시각화', 'barplot', 'hist_pie', 'igraph_treemap', '실습'],
      sections: [

        {
          secTitle: '🚀 데이터 프로젝트 성공을 위한 3단계 로드맵',
          secDesc: '프로젝트는 [목표 정하기(계획) ➔ 알고리즘 짜고 코딩하기(구현) ➔ 그래프 보고 의미 찾기(분석)] 흐름으로 완성됩니다.',
          content: `
            <div class="dl-card" style="border: 2px solid #6366f1; border-radius: 12px; padding: 20px; background: rgba(99, 102, 241, 0.04);">
              <h4 style="color: #4f46e5; margin-bottom: 16px; font-size: 1.15rem;">📌 데이터 프로젝트 3단계 로드맵 상세 가이드</h4>
              
              <div style="display: grid; gap: 16px; margin-bottom: 18px;">
                <div style="background: #ffffff; padding: 16px; border-radius: 10px; border-left: 5px solid #3b82f6; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                  <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem; margin-bottom: 6px;">🎯 1단계: 프로젝트 목표 수립 (목적지와 지도 정하기)</div>
                  <p style="margin: 0 0 6px; color: #475569; font-size: 0.93rem;"><b>무엇을 하는 단계인가요?</b> 프로젝트를 통해 정확히 무엇을 알아낼 것인지 목적지를 확실하게 정하는 단계입니다.</p>
                  <p style="margin: 0; color: #64748b; font-size: 0.88rem;"><b>핵심 내용:</b> "10~12월 카드 내역을 분석해 불필요한 지출을 잡겠다" 같은 명확한 목표를 세우고, 그 목표에 맞는 데이터(예: 3개월치 카드 이용내역 파일)를 선정하고 가져옵니다.</p>
                </div>

                <div style="background: #ffffff; padding: 16px; border-radius: 10px; border-left: 5px solid #10b981; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                  <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem; margin-bottom: 6px;">🛠️ 2단계: 프로그램 구현 (설계도 짜고 코드 만들기)</div>
                  <p style="margin: 0 0 6px; color: #475569; font-size: 0.93rem;"><b>무엇을 하는 단계인가요?</b> 세운 목표를 실제 컴퓨터가 알아듣는 코드로 구현하는 단계입니다.</p>
                  <p style="margin: 0; color: #64748b; font-size: 0.88rem;"><b>핵심 내용:</b><br>
                  • <b>알고리즘 작성:</b> 무작정 코딩부터 하면 막막하므로, 문제를 해결할 절차를 한국어 순서도(알고리즘)로 먼저 정리합니다.<br>
                  • <b>코드 작성:</b> 정리된 알고리즘을 그대로 파이썬 코드로 옮겨서 그래프(막대, 꺾은선 등)를 그려냅니다.</p>
                </div>

                <div style="background: #ffffff; padding: 16px; border-radius: 10px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                  <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem; margin-bottom: 6px;">💡 3단계: 결과 분석 (인사이트 도출하기)</div>
                  <p style="margin: 0 0 6px; color: #475569; font-size: 0.93rem;"><b>무엇을 하는 단계인가요?</b> 컴퓨터가 뽑아준 그래프와 결과를 보며 의미 있는 결론을 내는 마무리 단계입니다.</p>
                  <p style="margin: 0; color: #64748b; font-size: 0.88rem;"><b>핵심 내용:</b> 그래프를 분석해 "11월달에 왜 지출이 두 배나 많았을까?", "택시보다 배달음식에 돈을 더 많이 썼네?" 같은 실질적인 원인과 소비 패턴을 유추해 냅니다.</p>
                </div>
              </div>

              <div style="background: #e0e7ff; padding: 12px 16px; border-radius: 8px; font-weight: 700; color: #3730a3; font-size: 0.95rem; text-align: center;">
                ✨ 한 줄 요약: 프로젝트는 [목표 정하기(계획) ➔ 알고리즘 짜고 코딩하기(구현) ➔ 그래프 보고 의미 찾기(분석)]
              </div>
            </div>
          `
        },
        {
          secTitle: '🧩 1. 모듈(Module)이란? & import 사용법',
          icon: '🧩',
          desc: '모든 기능을 한 파일에 모으지 않고 기능별(계산, 로그인, 결제 등)로 나눠 재사용하는 모듈의 필요성과 다양한 import 패턴을 이해합니다.',
          cards: [
            {
              title: '💡 모듈(Module)의 핵심 개념',
              detail: '• 다른 파이썬 파일(.py)에 미리 작성해 둔 기능(함수, 변수)을 필요할 때 가져다 쓰는 구조입니다.<br>• <strong>예시:</strong> <code>module_test.py</code>에 <code>cal_upper(price)</code>, <code>cal_lower(price)</code>, <code>author="pystock"</code> 작성 후 <code>module_use.py</code>에서 <code>import module_test</code>로 재사용!'
            },
            {
              title: '🔑 import의 3가지 활용법',
              detail: '① <strong>기본 import:</strong> <code>import os</code> → <code>os.listdir()</code><br>② <strong>특정 기능만 추출:</strong> <code>from os import listdir</code> → <code>listdir()</code><br>③ <strong>별칭(Alias) 지정:</strong> <code>import os as winos</code> → <code>winos.listdir()</code>'
            }
          ]
        },
        {
          secTitle: '⚙️ 2. 자주 사용하는 내장 함수 & 표준 모듈 (time / os)',
          icon: '⚙️',
          desc: '별도 설치 없이 사용할 수 있는 파이썬 기본 제공 내장 함수와 필수 표준 모듈(time, os)의 실무 활용 패턴입니다.',
          table: {
            headers: ['종류', '함수/메서드', '설명 및 핵심 역할', '사용 예시'],
            rows: [
              ['내장 함수', 'len()', '데이터의 요소 개수 또는 문자열의 길이 산출', 'len(["철수", "영희"]) → 2'],
              ['내장 함수', 'max() / min()', '데이터 집합에서 최대 / 최솟값 탐색', 'max([10, 30, 20]) → 30'],
              ['내장 함수', 'abs() / sorted()', '숫자의 절댓값 계산 / 데이터를 오름차순 정렬', 'sorted([10, 2, 5]) → [2, 5, 10]'],
              ['내장 함수', 'enumerate()', '반복문 순회 시 (순서 번호 인덱스, 값) 쌍 자동 생성', 'for i, name in enumerate(names):'],
              ['표준 모듈', 'time.time() / time.ctime()', '1970-01-01 이후 경과 초(UNIX timestamp) / 사람 읽기 가능 형태로 변환', 'print(time.ctime())'],
              ['표준 모듈', 'time.sleep(초)', '지정한 초 단위 시간 동안 프로그램 실행 일시 정지', 'time.sleep(3) # 3초 대기'],
              ['표준 모듈', 'os.getcwd() / os.listdir()', '현재 실행 폴더 경로 확인 / 폴더 내 파일 및 서브폴더 목록 조회', 'os.listdir()'],
              ['표준 모듈', 'endswith(확장자)', '문자열이 특정 확장자로 끝나는지 검사하여 필터링', 'if x.endswith(".exe"): print(x)']
            ]
          },
          cards: [
            {
              title: '🔤 문자열 기능 & 실습: 도시 이름 3글자 대문자화',
              detail: '• <code>.upper()</code>(대문자 변환)와 <code>[:3]</code>(앞 3글자 슬라이싱) 조합 실습:<br><code>def get_abbr(data): return [x[:3].upper() for x in data]</code><br>• 결과: <code>["Seoul", "Daegu", "Kwangju", "Jeju"]</code> → <code>["SEO", "DAE", "KWA", "JEJ"]</code>'
            }
          ]
        },
        {
          secTitle: '📈 3. ML / DL 시각화 & 리포트 저장 (plot() & savefig())',
          icon: '📈',
          desc: '머신러닝(ML)과 딥러닝(DL) 모델 학습 시 손실/정확도 변화를 추적하는 plot()과 결과 그래프를 리포트용 파일로 저장하는 savefig()를 학습합니다.',
          cards: [
            {
              title: '📊 plot() — ML / DL 모델 학습 추이 시각화',
              detail: '• <strong>ML / DL 활용:</strong> 딥러닝 모델의 에포크(Epoch)별 <code>Loss</code>(손실) 감소 곡선 및 <code>Accuracy</code>(정확도) 변화 추이를 선 그래프로 그릴 때 핵심으로 쓰입니다.<br>• <strong>과적합(Overfitting) 진단:</strong> 훈련 손실과 검증 손실 그래프 차이를 시각적으로 파악하여 모델 상태를 모니터링합니다.<br>• <code>plt.plot(epochs, loss, label="Training Loss")</code>'
            },
            {
              title: '🖼️ savefig() — 분석 결과 리포트(Report) 자동화 저장',
              detail: '• <strong>리포트/보고서 활용:</strong> <code>plt.savefig("loss_report.png", dpi=300)</code>를 사용해 생성한 시각화 차트를 이미지/PDF 파일로 로컬 디스크에 저장합니다.<br>• <strong>자동화 연결:</strong> 모델 분석 결과를 보고서(Report) 파일에 자동으로 포함하거나 웹/대시보드 보고 자료 생성을 자동화할 때 핵심 역할을 합니다.'
            }
          ]
        },
        {
          secTitle: '📊 4. R 언어 기반 그래픽 시각화 핵심 요소',
          icon: '📊',
          desc: 'R 언어를 활용한 기초 2차원 시각화부터 범주형 막대그래프, 통계 히스토그램, 고급 소셜 네트워크 관계도(igraph) 및 계층 트리맵(treemap)까지 완벽 정리합니다.',
          table: {
            headers: ['시각화 기법', '주요 함수 / 옵션', '시각화 형태 및 핵심 역할', '주요 파라미터 / 실무 예시'],
            rows: [
              ['기본 그래픽', 'plot()', '2차원 산점도 및 꺾은선 그래프 시각화', 'x, y축 지정, type(형태), lty(선모양), col(색상)'],
              ['막대그래프', 'barplot()', '범주형 데이터를 세로/가로 막대로 비교 표현', 'beside=T (그룹별 병렬 배치), horiz=T (가로 배치)'],
              ['히스토그램', 'hist()', '수치형 연속 데이터를 구간별 빈도수로 분할 표현', 'breaks(구간 설정), main(제목), col(색상)'],
              ['파이 차트', 'pie()', '전체 데이터 대비 항목별 비율을 원형 부채꼴로 전달', 'labels(범주 이름표), col(색상 팔레트)'],
              ['관계도', 'igraph', '노드(Node)와 선(Link)으로 소셜 네트워크/조직도 표현', '상사-부하 관계, 인맥 네트워크 구조 시각화'],
              ['트리맵', 'treemap', '계층적 데이터를 면적 및 구역별 사각형으로 시각화', '대분류-소분류 비율 구조를 사각형 면적으로 표현']
            ]
          },
          cards: [
            {
              title: '🎨 plot() 기본 옵션 & barplot 그룹 비교',
              detail: '• <code>plot(x, y, type="o", lty=2, col="blue")</code>: 데이터 포인트를 점과 선으로 연결하여 추세 시각화.<br>• <code>barplot(data, beside=TRUE, horiz=TRUE)</code>: 범주형 데이터를 옆으로 나란히 배치하거나 가로 방향으로 정렬하여 그룹 비교.'
            },
            {
              title: '🕸️ igraph & treemap 고급 다차원 데이터 시각화',
              detail: '• <code>igraph</code>: 조직 내 상사/부하 관계, 사용자 소셜 네트워크 구조를 노드간 커넥션으로 시각화.<br>• <code>treemap</code>: 복잡한 예산 비율이나 계층별 매출 비중을 면적 크기와 색상 농도로 명확히 직관 전달.'
            }
          ]
        },
        {
          secTitle: '🏛️ 5. 클래스(Class) · 객체(Object) · 상속(Inheritance)',
          icon: '🏛️',
          desc: '붕어빵 틀(클래스)과 붕어빵(객체)의 명확한 개념 비유로 객체지향 프로그래밍(OOP) 기초를 완벽 정리합니다.',
          cards: [
            {
              title: '🏗️ 클래스 기본 구조 (__init__ & self)',
              detail: '• <strong>붕어빵 틀 = 클래스 / 붕어빵 = 객체(인스턴스)</strong><br>• <code>__init__(self, name, email, addr)</code>: 객체 생성 시 자동 호출되어 초기값을 설정하는 함수입니다.<br>• <code>self</code>: 지금 막 만들어지고 있는 객체 자기 자신을 가리키는 변수입니다.'
            },
            {
              title: '🔄 클래스 변수 vs 인스턴스 변수',
              detail: '• <strong>인스턴스 변수(self.name):</strong> 각각의 객체가 독립적으로 갖는 고유 데이터.<br>• <strong>클래스 변수(Account.num_account):</strong> 모든 객체가 함께 공유하여 계좌 수 카운팅 등에 누적 사용되는 데이터.'
            },
            {
              title: '🧬 상속(Inheritance)의 개념',
              detail: '• 부모 클래스의 검증된 기능(메서드)을 자식 클래스가 물려받아 재작성 없이 확장 사용하는 기법.<br>• <code>class ChildClass(ParentClass): pass</code> → 자식 객체에서 <code>c.can()</code> 호출 가능!'
            }
          ]
        },
        {
          secTitle: '📱 6. 실전 프로젝트: 연락처 관리 & 파일 입출력 (File I/O)',
          icon: '📱',
          desc: 'Contact 클래스와 리스트 구조를 바탕으로 연락처 CRUD 기능을 만들고 파일(db.txt) 저장을 통해 영구 보관합니다.',
          cards: [
            {
              title: '💾 파일 입출력 & with open 권장 패턴',
              detail: '• <code>open("db.txt", "w")</code>로 저장, <code>open("db.txt", "r")</code>로 다시 읽기.<br>• <strong>권장 패턴:</strong> <code>with open("db.txt", "r") as file:</code> 구문을 사용하면 파일 작업을 마친 후 <code>file.close()</code>를 자동으로 처리해 줍니다.'
            },
            {
              title: '🛡️ if __name__ == "__main__": 원리와 필수 이유',
              detail: '• "해당 파일을 직접 실행했을 때만 <code>run()</code>을 구동하라."는 의미입니다.<br>• 메인 실행 파일일 때는 정상 작동하고, 다른 파일에서 모듈로 <code>import</code>될 때는 불필요한 자동 실행을 방지합니다.'
            },
            {
              title: '💡 초보자를 위한 핵심 요약 & 백엔드/AI 연결',
              detail: '• 파이썬은 변수 → 함수 → 리스트 → 모듈 → 클래스 → 파일/DB 저장을 조합하여 웹 백엔드, API, 데이터 처리, AI 챗봇 서비스로 확장되는 핵심 연결 고리입니다.'
            }
          ]
        }
      ]
    },
    {
      id: '1001',
      date: '10/01 (목)',
      badge: 'BEST',
      title: '📊 파이썬 판다스(Pandas) 기초 뼈대 & 실무 데이터 분석 3대 패턴',
      subtitle: 'Series vs DataFrame 핵심 구조부터 빅데이터 3V, .loc/.iloc 인덱싱, .describe() 건강검진, 파생변수 생성 완벽 정리',
      tags: ['1001실무', 'pandas', 'Series_DataFrame', 'loc_iloc', 'describe', '파생변수', '불리언인덱싱', '빅데이터3V', '개발팁', '실습'],
      sections: [
        {
          secTitle: '📦 1. 왜 파이썬 리스트 대신 Pandas를 쓰는가?',
          icon: '📦',
          desc: '주식 시세 데이터처럼 날짜와 숫자가 짝을 이루는 빅데이터를 기본 리스트/딕셔너리로 관리하는 한계를 극복하기 위해 Pandas를 사용합니다.',
          cards: [
            {
              title: '💡 리스트/딕셔너리의 한계',
              detail: '• 단순 파이썬 기본 구조(리스트, 딕셔너리)는 데이터가 수만~수천만 행으로 커지면 연산 속도가 급격히 떨어지고 행/열 관리가 매우 어렵습니다.'
            },
            {
              title: '⚡ Pandas의 등장 이유',
              detail: '• 거대한 주식 시장 시세 데이터를 일관된 1차원/2차원 구조로 묶어 고속 계산 및 편리한 인덱싱을 지원하는 파이썬 대표 데이터 분석 도구입니다.'
            }
          ]
        },
        {
          secTitle: '🏗️ 2. Pandas의 2대 핵심 뼈대: Series vs DataFrame',
          icon: '🏗️',
          desc: 'Pandas 데이터를 구성하는 1차원 Series와 2차원 DataFrame의 개념과 차이점을 완벽하게 이해합니다.',
          table: {
            headers: ['구분', 'Series (시리즈)', 'DataFrame (데이터프레임)'],
            rows: [
              ['차원 구조', '1차원 구조 (엑셀의 한 줄/열)', '2차원 구조 (엑셀 표 전체)'],
              ['구성 요소', '값(Values) + 이름표(Index)', '행 인덱스(Index) + 열 이름(Columns) + 값'],
              ['핵심 특징', '인덱스가 뒤죽박죽이어도 자동으로 맞추어 덧셈 연산 수행', '여러 개의 Series들이 모여 얽혀 있는 바둑판 모양 전체 표'],
              ['실무 예시', '특정 날짜 기준 종가 목록 (data["close"])', '시가(open), 고가(high), 저가(low), 종가(close) 종합 표']
            ]
          },
          cards: [
            {
              title: '📊 1. Series (시리즈)',
              detail: '• <strong>1차원 데이터</strong> 구조로 엑셀의 한 줄(열) 또는 딕셔너리처럼 값과 인덱스가 쌍으로 묶인 형태입니다.<br>• 날짜(2016-02-19)를 인덱스로 지정해 두면 주가(92,600원)를 곧바로 꺼내올 수 있으며, 인덱스가 섞여 있어도 알아서 인덱스끼리 맞춰 덧셈 연산을 처리해 줍니다.'
            },
            {
              title: '📋 2. DataFrame (데이터프레임)',
              detail: '• <strong>2차원 데이터</strong> 구조로 엑셀 표 전체(행과 열이 얽힌 형태)입니다.<br>• 시가/고가/저가/종가 칼럼과 날짜별 로우가 바둑판처럼 구성되며, 세부 칼럼 하나를 뜯어보면 결국 Series들이 모여 있는 형태입니다.'
            }
          ]
        },
        {
          secTitle: '📌 3. 데이터 조회 및 기본 인덱싱: .loc와 .iloc',
          icon: '📌',
          desc: '옛날 문법(.ix 등 최신 버전에서 영구 삭제됨)은 버리고 실무에서 사용하는 행/열 추출 표준 패턴을 익힙니다.',
          table: {
            headers: ['구분', '🗑️ 버릴 것', '⚡ 실무에서 쓰는 것 (표준)', '💡 주요 활용 예시'],
            rows: [
              ['이름표 인덱싱', '.ix (구버전 혼용 문법, 영구 삭제됨)', '.loc (날짜, 종목코드 등 이름표로 행 추출)', 'df.loc["2026-10-01"]'],
              ['순서(숫자) 인덱싱', '수작업 for문 위치 탐색', '.iloc (몇 번째 행인지 순서 숫자로 행 추출)', 'df.iloc[0:10]'],
              ['컬럼(열) 추출', 'complex lookup', 'df["컬럼명"] (직관적 대괄호 컬럼 추출)', 'df["close"], df[["open", "close"]]']
            ]
          },
          cards: [
            {
              title: '🏷️ 1. 이름표 행 추출 -> 무조건 .loc',
              detail: '날짜("2026-10-01"), 종목코드("005930"), ID 등 라벨명으로 행을 고를 때는 무조건 <code>.loc</code>를 사용합니다.'
            },
            {
              title: '🔢 2. 순서 숫자 행 추출 -> 무조건 .iloc',
              detail: '위치값 기반으로 첫 번째부터 N번째 행까지 순서(숫자)로 뽑아낼 때는 무조건 <code>.iloc</code>를 사용합니다.'
            },
            {
              title: '📊 3. 컬럼 추출 -> 직관적인 df["컬럼명"]',
              detail: '열(Column)을 선택할 때는 복잡한 메서드 없이 직관적으로 <code>df["컬럼명"]</code>을 사용합니다.'
            }
          ]
        },
        {
          secTitle: '🩺 4. 데이터 건강검진 (Sanity Check): .describe() 및 통계 메서드',
          icon: '🩺',
          desc: '수작업 평균/편차 계산을 버리고, SQL로 긁어온 데이터의 누락값과 이상치를 1초 만에 요약 진단합니다.',
          cards: [
            {
              title: '⚡ 1. 1초 전체 판 요약 (Sanity Check)',
              detail: 'SQL로 거대한 데이터를 긁어오자마자 <code>df.describe()</code>를 때려서 누락된 데이터(Missing value)가 있는지, 엉뚱한 이상치(Outlier)가 꼈는지 전체 판을 1초 만에 훑어보는 용도로 광적으로 씁니다.'
            },
            {
              title: '📈 2. 개별 통계 메서드',
              detail: '수작업 계산 대신 <code>mean()</code>(평균), <code>std()</code>(표준편차) 정도만 데이터 특징 파악용으로 가끔 조합하여 사용합니다.'
            }
          ],
          summary: '데이터 개수(count), 평균(mean), 표준편차(std), 25/50/75% 사분위수, 최솟값/최댓값을 한 방에 확인하여 이상치를 즉시 판별합니다.'
        },
        {
          secTitle: '⚡ 5. 파생변수 생성과 조건부 필터링 (데이터 가공)',
          icon: '⚡',
          desc: 'for 반복문 계산을 버리고, 벡터 연산으로 파생변수를 뚝딱 만들고 SQL WHERE절처럼 불리언 인덱싱을 수행합니다.',
          cards: [
            {
              title: '🚀 1. 벡터 연산 파생변수 생성',
              detail: 'for 반복문을 돌리지 않고 <code>df["high"] - df["low"]</code>처럼 컬럼 통째로 사칙연산/퍼센트 계산을 수행하여 새로운 파생변수를 뚝딱 만듭니다.'
            },
            {
              title: '🔍 2. 불리언 인덱싱 (조건부 필터링)',
              detail: 'SQL의 WHERE 절처럼 조건에 맞는 데이터만 고속으로 걸러냅니다 (예: <code>df[df["close"] > df["open"]]</code>).'
            }
          ],
          code: `# 파이썬 판다스(Pandas) 시리즈 & 데이터프레임 실무 예시
import pandas as pd

# 1. Series (시리즈) 생성 예시 (날짜 인덱스 + 종가)
s_close = pd.Series([92600, 93000, 91500], index=['2026-10-01', '2026-10-02', '2026-10-03'])
print("--- Series 출력 ---")
print(s_close)
print("특정 날짜 조회:", s_close['2026-10-01'])

# 2. DataFrame (데이터프레임) 생성 예시
df = pd.DataFrame({
    'open': [92000, 92500, 91000],
    'high': [93500, 93800, 92000],
    'low': [91500, 92000, 90500],
    'close': [92600, 93000, 91500]
}, index=['2026-10-01', '2026-10-02', '2026-10-03'])

# 3. .loc / .iloc 사용
print("--- .loc 이름표 추출 ---")
print(df.loc['2026-10-01'])

# 4. 파생변수 (변동폭 diff) 벡터 연산
df['diff'] = df['high'] - df['low']

# 5. 데이터 건강검진 (Sanity Check)
print("--- describe() 건강검진 ---")
print(df.describe())`,
          summary: 'SQL 데이터 수집 -> DataFrame 담기 -> Series/컬럼 단위 벡터 연산 -> .loc & .describe() 검증 흐름 하나면 실무 개발 준비 완벽!'
        },
        {
          secTitle: '📈 6. 주식 시장이 왜 진짜 "빅데이터" 판인가? (빅데이터 3요소: 3V)',
          icon: '📈',
          desc: '1초에도 수만 개씩 쏟아지는 주식 시세 데이터의 Volume, Velocity, Variety 3V 특성과 판다스(Pandas)의 필요성을 정리합니다.',
          cards: [
            {
              title: '📦 1. Volume (규모 — 어마어마한 양)',
              detail: '• 수천 개 상장 종목의 일봉, 분봉, 초 단위 틱 데이터 누적 ➔ <strong>일반 엑셀(약 104만 행 한계)로는 감당 불가능</strong>.'
            },
            {
              title: '⚡ 2. Velocity (속도 — 눈 깜짝할 새 변하는 속도)',
              detail: '• 정규장 운영 시간(09:00~15:30) 동안 <strong>1초에도 수십~수백 건의 체결과 호가 갱신</strong> 발생.'
            },
            {
              title: '🎨 3. Variety (다양성 — 복잡한 형태)',
              detail: '• 단순 가격/거래량 숫자 외에도 <strong>공시 문서, 재무제표 텍스트, 뉴스 기사, 투자 심리 지표</strong> 등 복합 데이터 결합.'
            }
          ],
          summary: '💡 1초에도 수만 개씩 쏟아지고 종류도 복잡한 주식 빅데이터(3V)를 엑셀이나 일반 리스트로 감당할 수 없기 때문에 Pandas 전문 도구가 필연적입니다.'
        },
        {
          secTitle: '💻 7. 실무 개발 환경 팁 (Python Console 활용)',
          icon: '💻',
          desc: '초보자 및 실무 데이터 분석 시 생산성을 극대화하는 개발 팁입니다.',
          cards: [
            {
              title: '🖥️ 1. Python Console 즉시 실행',
              detail: '• 코드를 일일이 파일로 만들어서 실행할 필요 없이, PyCharm 하단의 <strong>Python Console</strong>을 열어 드래그 후 즉시 실행하면 결과값을 눈으로 바로 확인해 공부하기 편합니다.'
            },
            {
              title: '⚠️ 2. 데이터 접근 문법 주의사항',
              detail: '• 열(컬럼) 선택 시: 직관적인 <code>df["close"]</code> 대괄호 활용.<br>• 행(로우) 선택 시: 구버전 <code>.ix</code>는 최신 파이썬에서 삭제되었으므로 무조건 <code>.loc</code> 또는 <code>.iloc</code>를 사용합니다.'
            }
          ]
        },
        {
          secTitle: '💡 실무 요약 (진훈형님 관점)',
          icon: '💡',
          desc: '진훈형님을 위한 핵심 실무 원칙 요약입니다.',
          note: '결국 교재에서 가져갈 건 "SQL로 가져온 데이터를 DataFrame에 담고, .loc나 컬럼 연산으로 필요한 지표(파생변수)를 만든 뒤, .describe()로 데이터가 정상인지 검증한다" 요 흐름 딱 요거 하나면 충분합니다! 파일로 저장하는 to_excel() 같은 건 실무에선 거의 안 쓰니 대충 눈으로만 보시고 넘어가셔도 됩니다, 형님.'
        }
      ]
    },
    {
      id: '0930',
      date: '09/30 (수)',
      badge: '',
      title: '⚡ 파이썬 실무 종합 총정리 (12종 실무 함수 카싱크 번역 · CSS동적협업 · 보안금고 · 클래스)',
      subtitle: '견적합산·감가율·부품코드·break/continue·이중for문 스케줄러 · 지휘관 파이썬&페인트통 CSS · .env보안금고 & 마스킹 · 6장 클래스 설계도',
      tags: ['0930실무종합', '12종실무함수', 'break_continue', '파이썬CSS협업', '보안금고', '개인정보마스킹', '백엔드3대역할', '객체지향', '클래스상속', 'CarSync실무', '실습'],
      sections: [
        {
          secTitle: '🎨 1. 파이썬 & CSS 동적 협업 구조 (지휘관 파이썬 & 페인트통 CSS)',
          icon: '🎨',
          desc: '파이썬 백엔드가 비즈니스 룰을 계산하여 화면에 적용할 CSS 꼬리표를 결정하고, CSS 페인트 통이 시각적인 색상을 칠하는 협업 원리입니다.',
          table: {
            headers: ['역할 레이어', '🏫 시스템 내부 역할', '🏢 테크 PM (조진훈) 실무 시스템 번역', '💼 CarSync 실무 적용 사례'],
            rows: [
              [
                '1. 파이썬 (판단 & 계산)',
                '지휘관 (Commander)',
                '주행거리/연식 데이터를 판단하여 화면에 적용할 UI 테마 꼬리표 선택',
                '아반떼 AD 85,000km 조회 후 "미션오일 교체 주기 초과" 판단 ➡️ `status_class = "danger-box"` 꼬리표 생성'
              ],
              [
                '2. HTML (뼈대)',
                '조립장 (Skeleton)',
                '파이썬이 보낸 테마 꼬리표를 DOM 요소 박스에 바인딩',
                '`<div class="danger-box">미션오일 교체 시급</div>` 뼈대 구조 완성'
              ],
              [
                '3. CSS (스타일 & 색상)',
                '페인트 통 (Paint Bucket)',
                '꼬리표를 감지하여 시각적 디자인(배경/테두리/글자색) 칠하기',
                '`.danger-box` 꼬리표 감지 ➡️ 연한 빨간 배경(#FFEEEE) + 쨍한 테두리(#FF3B30) + 경고 글자(#D32F2F) 색칠'
              ]
            ]
          },
          cards: [
            {
              title: '🎖️ 1. 파이썬 = 지금 무슨 페인트를 칠할지 명령하는 지휘관',
              detail: '• <strong>PM 번역:</strong> 주행거리 85,000km를 계산하여 <code>if current_km >= target_km: css_theme = "danger-box"</code> 형태로 화면에 칠할 페인트(CSS 클래스명)를 결정하고 HTML로 신호를 던집니다.'
            },
            {
              title: '🎨 2. CSS = 미리 준비해 둔 빨간 페인트통 (.danger-box) vs 초록 페인트통 (.safe-box)',
              detail: '• <strong>.danger-box (빨간 페인트):</strong> 배경 <code>rgba(255, 59, 48, 0.14)</code>, 테두리 <code>#FF3B30</code>, 경고 글자 <code>#FF6B6B</code><br>• <strong>.safe-box (초록 페인트):</strong> 배경 <code>rgba(76, 175, 80, 0.14)</code>, 테두리 <code>#4CAF50</code>, 안전 글자 <code>#4ADE80</code>'
            },
            {
              title: '💡 3. 테크 PM을 위한 한마디 정리',
              detail: '• <strong>결론:</strong> CSS는 "빨간 페인트, 초록 페인트"를 미리 준비해 둔 페인트 통이고, 파이썬은 차량 주행거리를 계산해서 <strong>"지금은 빨간 페인트(danger-box CSS)를 발라라!"</strong>하고 신호를 주는 <strong>지휘관</strong>입니다.'
            }
          ]
        },
        {
          secTitle: '🛡️ 2. 파이썬 보안 금고 (.env) & 개인정보 마스킹 파이프라인',
          icon: '🔒',
          desc: '외부 노출 0%를 유지하는 백엔드 비밀키 환경변수(.env) 보안과 차주 개인정보 마스킹, 그리고 파이썬 백엔드의 3대 핵심 역할을 정리했습니다.',
          table: {
            headers: ['구분 레이어', '🏫 일반 코더/교재 방식', '🏢 테크 PM (조진훈) 실무 시스템 번역', '💼 CarSync & 플랫폼 적용 사례'],
            rows: [
              [
                '1. API 키 다루는 방식 (보안 금고)',
                '코드에 API 키 문자열 직접 하드코딩',
                '프론트엔드 노출 0%! 서버 환경변수(.env)에 은닉 후 파이썬 백엔드만 로드',
                '`PAYMENT_SECRET_KEY = os.getenv("TOSS_PAYMENTS_SECRET_KEY")`로 결제/알림톡 키 완벽 보호'
              ],
              [
                '2. 개인정보 (전화번호/차량) 보호',
                '입력받은 문자열 그대로 DB 저장 및 화면 출력',
                'DB 저장 전 외계어 암호화(e8b7d6...) 후 화면 전달 시 마스킹 껍데기만 전송',
                '차주 전화번호 `010-1234-5678` ➡️ 암호화 DB 저장 ➡️ 화면에는 `010-****-5678`로 마스킹 안전 노출'
              ],
              [
                '3. 파이썬 백엔드 3대 핵심 역할',
                '단순 코딩 작업',
                '① 판단&계산 (지휘관) / ② 보안&금고 (.env/암호화) / ③ 외부중개 (알림톡/결제/AI)',
                '위험 등급 계산 + API 키 금고 보호 + 카카오 알림톡/카드사 결제/Whisper AI 통신 총괄'
              ]
            ]
          },
          cards: [
            {
              title: '🔒 1. API 키 다루는 방식 = 보안 금고 (.env)',
              detail: '• <strong>프론트엔드:</strong> 결제 API 키나 카카오 알림톡 비밀키의 존재 자체를 모릅니다.<br>• <strong>파이썬 백엔드:</strong> 서버 깊은 곳의 환경 변수 파일(<code>.env</code>)에 API 키를 꽁꽁 숨겨두고, 파이썬 혼자서만 <code>os.getenv()</code>로 안전하게 로드합니다.'
            },
            {
              title: '🛡️ 2. 개인정보 보호 & 마스킹 껍데기 전송',
              detail: '• 차주가 입력한 전화번호/차량 정보는 파이썬이 받아 외계어 암호(<code>e8b7d6...</code>)로 변환해 DB 금고에 보관하고, 화면에 노출할 때는 뒤 4자리를 가려 <code>010-****-5678</code> 마스킹 껍데기만 전송합니다.'
            }
          ]
        },
        {
          secTitle: '🛠️ 3. 12종 파이썬 실무 함수 카싱크(CarSync) 완벽 번역',
          icon: '⚙️',
          desc: '주식/기초 예제 함수 12종을 CarSync 정비 견적, 소모품 감가율, 부품 코드 파싱, break/continue 휴무일 건너뛰기, 이중 반복문 작업 베이 스케줄러로 재해석했습니다.',
          table: {
            headers: ['함수 예제 번호', '🏫 예제 코드 원리', '🏢 테크 PM (조진훈) 카싱크(CarSync) 실무 번역'],
            rows: [
              ['1. 총액 계산 함수', '부품 가격×수량 곱해서 총합 도출', '엔진오일 단가×수량 + 브레이크 패드 단가×수량을 합산해 최종 정비 견적서 도출'],
              ['2. 손실액 계산 함수', '특정 하락 비율 적용 손실금 계산', '타이어/배터리 장착 후 주행거리 감가율을 계산하여 소모품 수명 임박 수치화'],
              ['3. 연속 종가 계산 함수', 'for 문으로 비율 연속 곱셈', '매일 주행거리에 따른 엔진오일/소모품 잔여 수명 깎여나가는 누적 예측 시뮬레이션'],
              ['4. 문자열 단어 교환', 'split()으로 문자열 쪼개고 순서 변경', '지역명/번호체계가 다르게 들어와도 차량 번호판 포맷을 정돈하여 DB 표준 저장'],
              ['5~6. 문자열 변경/회전', '슬라이싱 및 글자 위치 회전', '정비 코드 약어(`ENG_OIL_CHG`)를 화면 표시용 한글 명칭("엔진오일 교환")으로 변환'],
              ['7~9. 최고/최저가 계산', '리스트에서 max / min 추출', '우리 동네 디테일링 샵 광택/코팅 시술 최고가, 최저가, 평균 가격 범위 한눈에 산출'],
              ['10~11. break & continue', '조건 충족 시 탈출(break) 또는 건너뜀(continue)', '`continue`: 이미 예약 마감된 시간대/휴무일 건너뛰기 / `break`: 조건 맞는 샵 찾으면 즉시 검색 종료하여 앱 속도 극대화'],
              ['12. 중첩 반복문 (이중 for)', '2차원 리스트 이중 순회', '바깥쪽 `for`: 제휴 디테일링 샵 순회 / 안쪽 `for`: 샵별 시간대 베이(Bay) 예약 현황 체크하여 비어있는 작업 베이만 예약창 노출']
            ]
          },
          cards: [
            {
              title: '🧮 1~3. 총 정비 견적 · 감가율 · 누적 수명 시뮬레이션',
              detail: '• 단가×수량 정비 견적 합산 + 주행거리에 따른 소모품 수명 감가율 계산 + daily 누적 주행에 따른 잔여 수명 감쇄 시뮬레이션 엔진.'
            },
            {
              title: '🔤 4~6. 차량 번호판 정돈 (`split`) & 정비 약어 한글 변환 파서',
              detail: '• 입력 양식이 제각각인 번호판 텍스트를 `split()`으로 정제해 DB에 정규화 저장하고, `ENG_OIL_CHG` 같은 시스템 약어를 사용자용 한글 명칭으로 변환.'
            },
            {
              title: '⚡ 10~11. `break` & `continue` ➡️ 휴무일 건너뛰기 & 앱 속도 극대화 꿀조합',
              detail: '• <strong>continue:</strong> 이미 예약이 꽉 찬 시간대나 매장 휴무일은 싹 건너뛰고 빈 자리만 렌더링.<br>• <strong>break:</strong> 고객 조건에 딱 맞는 샵을 발견하는 즉시 탐색 루프를 탈출하여 불필요한 연산 방지.'
            },
            {
              title: '🏢 12. 중첩 반복문 (이중 for문) ➡️ 제휴 샵별 층별/작업 베이(Bay) 실시간 스케줄러',
              detail: '• 바깥 `for`문으로 제휴 매장을 순회하고, 안쪽 `for`문으로 매장 내 1호 베이/2호 베이 실시간 예약 여부를 점검하여 빈 베이만 예약 창에 바인딩.'
            }
          ]
        },
        {
          secTitle: '🏗️ 4. [6장 클래스 & 객체지향] CarSync 설계도 · 생성자 · 네임스페이스 · 상속',
          icon: '🚙',
          desc: '데이터와 기능을 묶은 시스템 설계도(클래스), 회원가입 시 자동 초기화 장치(`__init__`), 인스턴스 네임스페이스 메모리 독립, 전기차 클래스 상속 총정리입니다.',
          cards: [
            {
              title: '🚗 1. 클래스(Class) & 인스턴스(Instance) ➡️ 붕어빵 틀과 찍어낸 차량 객체',
              detail: '• <code>Car</code> 클래스(설계도) 하나를 정의해 두면, 고객이 앱에 차를 등록할 때 찍혀 나오는 개별 차량 데이터가 인스턴스(<code>member1</code>, <code>member2</code>)가 됩니다.'
            },
            {
              title: '⚡ 2. 생성자 (__init__)와 self ➡️ 차 등록 시 자동 초기화 세팅',
              detail: '• 인스턴스 생성 즉시 자동으로 실행되어 이름, 차종, 주행거리를 <code>self</code>(바로 지금 생성되는 객체 자신)의 전용 메모리 방에 딱 착지시킵니다.'
            },
            {
              title: '🔒 3. 네임스페이스 (Namespace) ➡️ 공용 클래스 변수 vs 내 차 고유 인스턴스 변수',
              detail: '• <strong>클래스 변수:</strong> 플랫폼 공통 수수료율이나 시장 구분(<code>market="kospi"</code>)<br>• <strong>인스턴스 변수:</strong> <code>member1</code>의 내 차 고유 주행거리나 엔진오일 수명'
            },
            {
              title: '🧬 4. 클래스 상속 (Inheritance) & 연습문제 (6-1, 6-2, 6-4)',
              detail: '• 부모 <code>Car</code> 클래스를 상속받아 배터리 관리 기능만 얹은 <code>ElectricCar</code> 자식 클래스로 쉽게 확장.<br>• <code>a.market = "kosdaq"</code>으로 인스턴스 값을 바꿔도 부모 <code>Stock.market</code> 원본은 유지되는 메모리 규칙.'
            }
          ]
        },
        {
          secTitle: '📁 5. [파일 입출력 & CRM 아키텍처] open() · while 1 루프 · __name__ == "__main__"',
          icon: '📂',
          desc: '데이터를 파일에 영구 기록하는 `open()` 함수, 메뉴 반복 `while 1` 루프, 메인 실행 검증 `if __name__ == "__main__"` 문법을 정비소 CRM 아키텍처로 해석했습니다.',
          table: {
            headers: ['핵심 아키텍처 개념', '🏫 기존 교재/학원 시각', '🏢 테크 PM (조진훈) 실무 아키텍처 번역', '💼 실제 서비스 구현 예시'],
            rows: [
              [
                '1. 파일 입출력 open() / close()',
                'txt 파일 쓰기(w)/읽기(r) 기본 함수',
                '프로그램이 종료되어도 정비/고객 데이터를 영구 영속화(Persistence)하는 DB 파일 로더',
                '`file = open("db.txt", "w")` ➡️ `file.write("철수,010-1111-1111")` ➡️ `file.close()`'
              ],
              [
                '2. CRM 아키텍처 (Contact & contact_list)',
                '클래스로 데이터 묶고 리스트에 append',
                '고객/정비소 1개의 객체(`Contact`)를 생성하여 인메모리 리스트(`contact_list`)에 차곡차곡 스택 관리',
                '`contact_list = []` ➔ `contact1 = Contact(...)` ➔ `contact_list.append(contact1)`'
              ],
              [
                '3. while 1 & break 메뉴 제어',
                'while 1 무한 반복문',
                '유저가 [4. 저장 후 종료]를 누르기 전까지 메인 뷰 메뉴(추가/조회/삭제)를 멈추지 않는 앱 UI 룰 엔진',
                '`while 1:` 실행 중 유저가 메뉴 4번 입력 시 `file.write()`로 저장하고 `break`로 루프 정상 탈출'
              ],
              [
                '4. if __name__ == "__main__":',
                '의미 없는 자동 완성 문법',
                '외부 모듈에서 `import` 시 실행 코드가 제어 없이 자동 폭발하는 것을 막는 메인 엔트리포인트 검증 장치',
                '오직 해당 `.py` 파일이 직접 클릭 실행될 때만 `run()` 메인 메서드를 켜주는 아키텍처 방화벽'
              ]
            ]
          },
          cards: [
            {
              title: '💾 1. open() ➡️ 데이터 영속성 (Persistence) 확보',
              detail: '• 프로그램 종료 시 데이터가 날아가지 않도록 <code>file = open("db.txt", "w")</code>로 파일을 열고 <code>file.write()</code> 후 <code>file.close()</code>로 영구 보관합니다.'
            },
            {
              title: '📱 2. Contact 클래스 & contact_list ➡️ 정비소/고객 CRM 데이터 구조',
              detail: '• 고객 프로필 객체(<code>Contact</code>)를 <code>__init__</code>으로 생성하여 <code>contact_list.append()</code>로 묶어 관리하는 인메모리 데이터베이스 아키텍처입니다.'
            },
            {
              title: '🛡️ 3. if __name__ == "__main__": ➡️ 메인 실행 방화벽',
              detail: '• 다른 파일에서 <code>import contact</code>를 했다고 해서 전체 프로그램이 자동 구동되는 일을 방지하고, 메인으로 직접 실행했을 때만 <code>run()</code>을 구동시키는 엔터프라이즈 안전 검증 장치입니다.'
            }
          ]
        },
        {
          secTitle: '⭐ 6. [30대 비전공자 PM] 파이썬 문제해결 10대 커리큘럼 & 성장 로드맵',
          icon: '🚀',
          desc: '문법 암기가 아닌 비즈니스 문제 정의에서 출발하여 파이썬 10대 무기로 매핑하는 테크 PM의 직무 성장 로드맵입니다.',
          table: {
            headers: ['단계', '💡 비전공자 PM의 질문', '🛠️ 매핑되는 파이썬 핵심 무기', '🚀 실무 서비스 확장'],
            rows: [
              ['1단계', '"차량 및 고객 정보를 저장하고 싶은데?"', '변수 (Variable) & 리스트 (List)', '고객 프로필 & 주행거리 데이터 저장'],
              ['2단계', '"반복 계산하는 정비 공임 로직을 만들고 싶은데?"', '함수 (Function) & return', '정비 견적 계산 및 감가율 수치화'],
              ['3단계', '"다른 개발자가 만든 결제/알림톡 기능을 가져오고 싶은데?"', 'import & 모듈 (Module)', '외부 라이브러리 및 마이크로서비스 연동'],
              ['4단계', '"고객/차량 데이터와 기능을 하나로 깔끔하게 묶고 싶은데?"', '클래스 (Class) & 객체 (Object)', 'Car / Contact 객체지향 아키텍처 구축'],
              ['5단계', '"프로그램을 껐다 켜도 데이터가 유지되게 하고 싶은데?"', 'open() & 파일 입출력', 'db.txt 파일 저장 및 DB 영속화'],
              ['6단계', '"사용자가 종료할 때까지 메뉴를 계속 보여주고 싶은데?"', 'while 1 & break', '키오스크 & 대시보드 메뉴 무한 루프 제어']
            ]
          },
          cards: [
            {
              title: '🎯 10대 핵심 개념 매핑 정리',
              detail: '• <strong>변수:</strong> 데이터 상자 | <strong>함수:</strong> 작업 기능 | <strong>return:</strong> 결과 반환 | <strong>import:</strong> 기능 연결 | <strong>모듈:</strong> .py 부품 파일<br>• <strong>list:</strong> 여러 데이터 묶음 | <strong>class:</strong> 시스템 설계도 | <strong>object:</strong> 실제 데이터 | <strong>self:</strong> 현재 객체 자신 | <strong>open():</strong> 파일 쓰기/읽기'
            },
            {
              title: '🚀 최종 테크 PM 성장 로드맵',
              detail: '<code>변수/함수 ➔ 리스트/모듈 ➔ 클래스 ➔ 파일 입출력 ➔ 업무 자동화 ➔ 웹 챗봇 ➔ AI API 서비스</code>'
            }
          ]
        },
        {
          isPractice: true,
          practiceTitle: '🧪 [09/30 실습 코드] 룰 엔진 + 12종 실무 함수 + 파일입출력 open() + CRM 종합',
          secTitle: '💻 [실습 코드] 9/30 파이썬 실무 종합 파이프라인 (open/CRM/main 포함)',
          icon: '🧪',
          desc: '9월 30일 배운 전체 실무 내용 (CSS동적바인딩, 보안금고, 12종 실무함수, open 파일저장, Contact CRM, __main__) 코드를 직접 실행해 보세요.',
          code: `# =========================================================
# 💡 [9/30 테크 PM 파이썬 실무 종합 파이프라인 코드]
# =========================================================

import os
import datetime
import random

# [1] 변수 & 데이터 스키마 (CarSync 디테일링 샵)
shop_name = "진훈 디테일링 샵 (판교점)"
print(f"🏢 [데이터 스키마] {shop_name} 데이터 등록 완료")

# [2] 파이썬 & CSS 동적 협업 룰 엔진 (지휘관 파이썬 -> CSS 페인트통)
current_km = 85000
target_km = 60000

if current_km >= target_km:
    css_theme = "danger-box"  # 초과 시 빨간 페인트 꼬리표
    status_msg = "🚨 미션오일 교체 시급 (위험 등급)"
else:
    css_theme = "safe-box"    # 여유 시 초록 페인트 꼬리표
    status_msg = "💚 정상 소모품 상태 (안전 등급)"

print(f"🎨 [CSS 동적 바인딩] 파이썬 선택 꼬리표 -> {css_theme} | HTML -> <div class='{css_theme}'>{status_msg}</div>")

# [3] 보안 금고 (.env) & 개인정보 마스킹
PAYMENT_SECRET_KEY = os.getenv("TOSS_PAYMENTS_SECRET_KEY", "sk_live_sec_xxxx9876")
raw_phone = "010-1234-5678"
masked_phone = raw_phone[:4] + "****" + raw_phone[8:]
print(f"🔒 [보안 금고] 결제키: {PAYMENT_SECRET_KEY[:7]}*** | 마스킹 전화번호: {masked_phone}")

# [4] Contact 클래스 & 파일 입출력 (open / write / close)
class Contact:
    def __init__(self, name, phone, email, address):
        self.name = name
        self.phone = phone
        self.email = email
        self.address = address

contact_list = []
c1 = Contact("조진훈", "010-1234-5678", "jinhun@carsync.com", "서울 판교")
contact_list.append(c1)

print(f"📱 [CRM 아키텍처] 인메모리 고객 등록: {contact_list[0].name} ({contact_list[0].email})")

# open() 파일 저장 시뮬레이션
dummy_db_line = f"{c1.name},{c1.phone},{c1.email},{c1.address}\n"
print(f"💾 [open() 파일 저장] db.txt 기록 라인 -> {dummy_db_line.strip()}")

# [5] 메인 엔트리포인트 검증 (__name__ == '__main__')
def main_run():
    print("🚀 [if __name__ == '__main__'] 카싱크 통합 파이프라인 직접 실행 완료!")

if __name__ == '__main__':
    main_run()`,
          summary: '9월 30일 학습을 통해 파이썬과 CSS 동적 협업, 보안금고(.env), 12종 실무 함수, CRM 클래스 아키텍처, open() 파일 저장 및 __main__ 메인 엔트리포인트를 완벽히 완성했습니다.'
        }
      ]
    },
    {
      id: '0929',
      date: '09/29 (화)',
      badge: 'LATEST',
      title: '💡 파이썬 기초 문법, 테크 PM의 시각으로 번역하기 (기획서 스키마 · 룰 엔진 · JSON API 표준)',
      subtitle: '변수(데이터 스키마) · 조건문(비즈니스 룰 엔진) · 리스트(데이터 풀 추출) · 딕셔너리(JSON API 연동) · 인터프리터 & 디버깅 무기',
      tags: ['파이썬기초', '테크PM분석', '비즈니스룰엔진', '5장문제풀이', '객체지향', '클래스상속', '모듈과import', '내장함수6종', '파이썬CSS협업', '보안금고', '개인정보마스킹', '백엔드3대역할', '데이터스키마', 'JSONAPI', 'CarSync실무', '실습', 'Python문법'],
      sections: [
        {
          secTitle: '💡 1. 파이썬 기초 문법, 테크 PM의 시각으로 번역하기',
          icon: '🔄',
          desc: '개발자와 통하는 테크 PM 조진훈의 핵심 시각: 단순 문법 암기를 넘어 <strong>기획서 데이터 스키마, 비즈니스 룰 엔진, API 연동 표준 규격</strong>으로 재해석합니다.',
          table: {
            headers: ['파이썬 핵심 문법', '🏫 일반 코더/학원 시각', '🏢 테크 PM (조진훈) 시각 번역', '💼 실무 기획 및 비즈니스 적용 사례'],
            rows: [
              [
                '1. [3장 변수와 데이터 타입]',
                '값을 저장하는 상자/메모리 공간',
                '기획서의 "데이터 스키마(규격)" 정의',
                'CarSync 기획 시 출장 세차 배제, 오직 오프라인 매장 주소·숙련도·장비 보유 변수만 수집하여 퀄리티 통제'
              ],
              [
                '2. [4장 조건문 if / elif]',
                '조건에 따라 실행 흐름 분기',
                '"비즈니스 룰 엔진"의 핵심 심장',
                'CarSync 1.6T 건식DCT 6만km 경고 푸시 / 코코넛사일로 연속 8시간 운행 시 쿨타임(배차 수락 버튼 Lock)'
              ],
              [
                '3. [6장 리스트]',
                '여러 데이터를 순서대로 모아둔 집합',
                '"타겟 유저 / 데이터 풀(Pool)" 추출 & 슬라이싱',
                '전체 화주 중 "상하차 까대기 강요 3회 이상" 악성 화주만 슬라이싱하여 블랙리스트 분류'
              ],
              [
                '4. [7장 딕셔너리 (Key-Value)]',
                '키와 값의 쌍으로 이뤄진 자료구조',
                'API 연동의 전 세계 표준 규격 (JSON 형식)',
                '개발자 연동 오더: "공업사 정보 넘길 때 {\'업체명\': \'진훈모터스\', \'도색방식\': \'부분도색\'} Key-Value로 쏴주세요"'
              ]
            ]
          },
          cards: [
            {
              title: '📌 1. [변수/데이터 타입] = 기획서의 데이터 스키마(규격) 정의',
              detail: '기획자가 시스템에 입력받을 데이터의 <strong>명칭과 형태를 정의</strong>하는 과정입니다.<br>• <strong>CarSync 적용 사례:</strong> 근본 없는 \'출장 세차\' 여부는 아예 스키마에서 배제해 버리고, 오직 \'오프라인 매장형 디테일링 샵\'의 <code>shop_address</code>, <code>worker_skill_level</code>, <code>has_detailing_equipment</code>만을 변수로 정의하여 시스템 퀄리티를 통제합니다.'
            },
            {
              title: '📌 2. [조건문 if / elif] = 비즈니스 룰 엔진의 심장',
              detail: '형님이 구상하신 <strong>수익화 및 리스크 방어 로직이 코드로 구현되는 핵심 구간</strong>입니다.<br>• <strong>CarSync 룰 엔진:</strong> <code>if powertrain == "1.6T 건식DCT" and mileage >= 60000:</code> ➡️ 120만 원 미션 수리 사전 경고 푸시 발송!<br>• <strong>코코넛사일로 룰 엔진:</strong> <code>if continuous_driving_hours >= 8:</code> ➡️ 졸음운전 방지 안전 쿨타임 발동 (배차 수락 버튼 Lock).'
            },
            {
              title: '📌 3. [리스트] = 타겟 유저 / 데이터 풀(Pool) 추출',
              detail: 'DB에 쌓인 수만 개의 데이터를 한 줄로 세워놓고 <strong>원하는 타겟만 쏙쏙 뽑아내는 논리</strong>입니다.<br>• <strong>물류 기획 적용 사례:</strong> 전체 화주 리스트 중 \'상하차 까대기 강요 3회 이상\' 신고 누적된 악성 화주 리스트만 썰어내어(슬라이싱) <strong>블랙리스트로 자동 분류</strong>하는 기획과 정확히 맞닿아 있습니다.'
            },
            {
              title: '📌 4. [딕셔너리] = API 연동의 전 세계 표준 규격 (JSON)',
              detail: '프론트엔드(앱 화면)와 백엔드(서버)가 데이터를 주고받을 때 사용하는 <strong>전 세계 표준 규격인 JSON 형식</strong>이 바로 이 딕셔너리 구조(<code>{키: 값}</code>)입니다.<br>• <strong>개발자 오더 팁:</strong> "공업사 정보 넘길 때 <code>{\'업체명\': \'진훈모터스\', \'도색방식\': \'부분도색\'}</code> 형태로 Key-Value 묶어서 쏴주세요"라고 완벽하게 개발자의 언어로 오더를 내릴 수 있습니다.'
            }
          ]
        },
        {
          secTitle: '⚙️ 2. 프로그래밍과 파이썬의 본질 & PM의 디버깅 무기',
          icon: '💻',
          desc: '파이썬의 강점과 개발 세팅 시 주의할 점, 그리고 에러 발생 시 개발자와 대화하기 위한 PM의 디버깅 무기입니다.',
          cards: [
            {
              title: '📜 프로그래밍과 파이썬의 본질 (왜 파이썬인가?)',
              detail: '• <strong>작업 지시서:</strong> 프로그래밍은 컴퓨터에게 "무엇을 어떻게 해라"라고 논리적으로 명령을 내리는 작업 지시서입니다. 기획서의 논리를 컴퓨터 언어로 번역한 것입니다.<br>• <strong>파이썬의 강점 (인터프리터 언어):</strong> 복잡한 변환 과정(컴파일) 없이 코드를 한 줄 쓰면 엔터 치는 즉시 실행 결과를 보여줍니다. 코드가 직관적이어서 PM이 로직을 검증하거나 개발자 코드를 눈치껏 읽어내기에 최적의 언어입니다.'
            },
            {
              title: '⚙️ 환경 세팅 핵심 (버전 & PATH)',
              detail: '• <strong>버전 3.x 필수:</strong> 2.x와 3.x 버전은 서로 호환되지 않습니다. 현재는 무조건 3.x 버전을 씁니다.<br>• <strong>Add to PATH 체크 필수:</strong> 설치 시 이 체크박스를 반드시 눌러야 컴퓨터가 어디서든 파이썬을 인식하고 실행할 수 있습니다. (안 하면 개발 환경 세팅부터 꼬입니다.)'
            },
            {
              title: '🖥️ 코드를 실행하는 2가지 방식',
              detail: '• <strong>파이썬 쉘 (Shell 모드 `>>>`):</strong> 한 줄씩 입력하고 바로 결과를 확인하는 임시 연습장. 짧은 로직이나 계산을 빠르게 테스트할 때 씁니다.<br>• <strong>스크립트 모드 (Script 모드 `.py`):</strong> 코드가 길어질 때 텍스트 파일로 작성한 뒤 한 번에 실행하는 방식입니다. 실무 소스 파일은 모두 이 방식으로 작성됩니다.'
            },
            {
              title: '🐞 오류(Error)의 2가지 종류 (PM의 디버깅 무기)',
              detail: '• <strong>문법 오류 (Syntax Error):</strong> 오타가 나거나 따옴표를 빼먹는 등 파이썬 문법 규칙을 어겼을 때 발생 (기획서 오타).<br>• <strong>실행 오류 (Runtime Error):</strong> 문법은 맞는데 논리가 꼬였을 때 발생. 에러 메시지의 <code>line 번호</code>를 보면 소스 코드 어디서 시스템이 멈췄는지 즉시 추적 가능합니다.<br>※ <strong>참고 (터틀 그래픽):</strong> 거북이 시각화 입문용이므로 물류/CarSync 시스템을 기획하는 진훈 형님은 과감하게 무시하셔도 됩니다.'
            }
          ]
        },
        {
          secTitle: '🎯 3. [5장 실문제 풀이] 테크 PM의 실무 시스템 시각 번역',
          icon: '🛠️',
          desc: '5장 대표 문제(5-1 ~ 5-8)를 단순 코딩이 아닌 <strong>CarSync & 물류 정비 플랫폼 비즈니스 시스템 구현 관점</strong>으로 완벽 번역했습니다.',
          table: {
            headers: ['파이썬 문제 및 핵심 문법', '🏫 학원/교재 시각', '🏢 테크 PM (조진훈) 실무 시스템 번역', '💼 실제 서비스 구현 예시'],
            rows: [
              [
                '문제 5-1 (평균 구하기 sum/len)',
                '숫자 리스트 합을 개수로 나눔',
                '제휴 매장들의 시술 비용 및 대기 시간 평균 산출',
                'CarSync 지역별 디테일링 샵 average_price 및 주말 average_wait_time 실시간 통계'
              ],
              [
                '문제 5-2 (최댓값/최솟값 max/min)',
                '가장 큰 수 / 가장 작은 수 탐색',
                '디테일링 샵 광택/코팅 최고가 vs 최저가 추출',
                '플랫폼 내 "최저가 15만 원 ~ 최고가 80만 원" 가격 구간 노출 및 가성비/프리미엄 샵 뱃지'
              ],
              [
                '문제 5-3 (TXT 목록 추출 os 모듈)',
                '폴더 내 .txt 확장자 파일 출력',
                '특정 정비 매장의 로그 파일 / 견적서 문서 배치 로더',
                '정비소 로컬 서버에 저장된 일일 견적서 TXT/PDF 파일 수집 및 DB 자동 배치 인덱싱'
              ],
              [
                '문제 5-4 & 5-5 (BMI & 무한루프)',
                'BMI 수치 및 while True 입력',
                '차량 주행거리/연식 기반 소모품 상태 실시간 진단',
                '실시간 진단 앱 키오스크: 주행거리 입력 시 (안전/주의/위험) 3단계 상태 자동 판정'
              ],
              [
                '문제 5-6 (삼각형 면적 0.5*b*h)',
                '밑변·높이 삼각형 면적 계산',
                '부품 규격 및 디테일링 샵 작업 공간(베이) 동선 계산',
                '차량 1대당 작업 베이 필요 최소 면적(m²) 계산기 및 특수 도색 부품 면적 산출'
              ],
              [
                '문제 5-7 (누적 합산 total+=cost)',
                'for 문으로 누적 합계 구하기',
                '특정 기간 동안 누적된 주행거리 및 정비 비용 합산',
                '고객 차계부 리포트: 지난 1년간 누적 수리 비용 및 주행거리 통계 대시보드'
              ],
              [
                '문제 5-8 (문자열 슬라이싱 code[:3])',
                '문자열 앞 3자리 떼어내기',
                '정비 부품 코드 및 모델명 카테고리 자동 파싱',
                'OEM 부품 코드 (`HYU_ENG_001`) 앞 3자리 슬라이싱으로 현대/기아 브랜드별 카테고리 정렬'
              ]
            ]
          },
          cards: [
            {
              title: '📊 문제 5-1 (평균 구하기) ➡️ 제휴 매장 단가 & 대기 시간 평균 산출',
              detail: '• <strong>PM 번역:</strong> 단순한 <code>sum() / len()</code> 연산이 아니라, CarSync 제휴 매장들의 평균 시술 단가와 주말 평균 대기 시간을 실시간 산출하여 고객 앱 메인 대시보드에 시각화하는 통계 로직입니다.'
            },
            {
              title: '🔝 문제 5-2 (최댓값/최솟값) ➡️ 디테일링 샵 최고가 vs 가성비 최저가 추출',
              detail: '• <strong>PM 번역:</strong> <code>max()</code>와 <code>min()</code>으로 광택/코팅 상품 중 최상위 프리미엄 케어 샵과 최저가 가성비 샵을 산출하고, "최저 15만 원부터~" 가격 구간 뱃지를 부여하는 필터링 엔진입니다.'
            },
            {
              title: '📂 문제 5-3 (os 모듈 TXT 목록) ➡️ 정비 매장 견적서 문서 배치 로더',
              detail: '• <strong>PM 번역:</strong> <code>os.listdir()</code>을 활용해 제휴 정비소 로컬 서버의 일일 견적서(`.txt`, `.pdf`) 파일들을 한 번에 스크래핑하여 서버 DB로자동 인덱싱하는 배치 작업 파이프라인입니다.'
            },
            {
              title: '🔄 문제 5-4 & 5-5 (BMI & 무한루프) ➡️ 주행거리 기반 소모품 상태 실시간 진단',
              detail: '• <strong>PM 번역:</strong> <code>while True:</code> 입출력 루프를 통해 고객의 차량 주행거리를 continuous하게 입력받아 <strong>(안전 / 주의 / 위험)</strong> 3단계 상태를 자동 진단해 주는 실시간 룰 진단기입니다.'
            },
            {
              title: '📐 문제 5-6 (삼각형 면적) ➡️ 작업 공간 베이 & 부품 면적 산출 엔진',
              detail: '• <strong>PM 번역:</strong> 디테일링 샵 내 차량 대형 작업 베이(Bay) 공간 동선이나 특수 부품 부분 도색 시 필요 자재 면적(m²)을 계산해 주는 견적 산출기 모듈입니다.'
            },
            {
              title: '➕ 문제 5-7 (누적 합산) ➡️ 누적 주행거리 & 수리비 차계부 대시보드',
              detail: '• <strong>PM 번역:</strong> <code>total += cost</code> 패턴으로 고객의 연도별 누적 차량 유지비와 누적 주행거리를 실시간 집계하여 통계 카드에 보여주는 차계부 시스템입니다.'
            },
            {
              title: '✂️ 문제 5-8 (문자열 슬라이싱) ➡️ 부품 코드 파싱 & 카테고리 자동 정렬',
              detail: '• <strong>PM 번역:</strong> OEM 부품 코드(예: <code>"HYU_ENG_001"</code>)의 앞 3자리(<code>code[:3]</code>) 제조사 식별자를 슬라이싱하여 현대/기아/제네시스 브랜드별 부품 카테고리로 자동 정렬해 주는 파서(Parser)입니다.'
            }
          ]
        },
        {
          secTitle: '🏗️ 4. [6장 클래스 & 객체지향] 테크 PM의 시각으로 번역하기',
          icon: '🚙',
          desc: '클래스와 객체지향 문법을 <strong>CarSync 플랫폼의 차량 설계도, 개별 인스턴스 메모리 격리, 전기차 클래스 상속</strong> 관점으로 번역했습니다.',
          table: {
            headers: ['6장 핵심 개념 및 문법', '🏫 교재/학원 방식', '🏢 테크 PM (조진훈) 실무 번역', '💼 CarSync 실무 적용 사례'],
            rows: [
              [
                '1. 클래스(Class) & 인스턴스(Instance)',
                '붕어빵 틀 vs 찍어낸 붕어빵',
                '데이터(속성)와 기능(메서드)을 묶은 시스템 설계도 vs 유저별 개별 차량 데이터 객체',
                '`Car` 설계도 작성 ➡️ 앱에 차 등록 시 `member1`, `member2` 인스턴스 생성 (100명이면 100개 독립 객체 생성)'
              ],
              [
                '2. 생성자 (__init__) & self',
                '인스턴스 생성 시 자동 실행되는 함수 / 자기 자신 객체',
                '차량 등록 시 빈 데이터가 아닌 초기 정보를 데이터 공간에 즉시 할당하는 자동 초기화 장치',
                '고객이 차를 등록하는 순간 이름, 차종, 주행거리, 연락처가 해당 인스턴스 전용 메모리 방에 즉시 배치'
              ],
              [
                '3. 네임스페이스 (Namespace)',
                '변수와 값이 저장되는 독립된 방/공간',
                '플랫폼 공용 정책(클래스 변수) vs 내 차 고유 데이터(인스턴스 변수) 격리 저장소',
                '클래스 변수: 공통 플랫폼 수수료율 / 인스턴스 변수: `member1`의 내 차 고유 주행거리 및 엔진오일 잔수명'
              ],
              [
                '4. 클래스 상속 (Inheritance)',
                '부모 클래스의 기능을 물려받음',
                '기존 기본 정비 차량 구조를 그대로 물려받고 전기차 전용 기능만 확장 개발',
                '일반 차량 `Car` 부모 클래스를 상속받아 배터리 효율 관리만 추가한 `ElectricCar` 자식 클래스로 빠른 파생 확장'
              ],
              [
                '연습문제 6-1, 6-2 & 6-4',
                'Point 좌표 이동 & a.market="kosdaq" 네임스페이스',
                '차량 실시간 위치/정비 주기 업데이트 및 인스턴스별 독립 값 유지 메모리 규칙',
                '`a.market="kosdaq"`으로 인스턴스 값을 바꿔도 부모 `Stock.market` 원본 클래스 변수는 안전하게 유지됨'
              ]
            ]
          },
          cards: [
            {
              title: '🚗 1. 클래스(Class) & 인스턴스(Instance) ➡️ 붕어빵 틀과 찍어낸 차량 데이터',
              detail: '• <strong>PM 번역:</strong> 데이터(속성)와 데이터를 다루는 함수(메서드)를 하나의 묶음으로 정의한 기획 설계도입니다.<br>• <strong>CarSync 적용:</strong> <code>Car</code>라는 클래스(틀)를 만들어 두면, 고객이 앱에 차를 등록할 때 설계도를 바탕으로 찍혀 나오는 개별 차량 데이터가 인스턴스(<code>member1</code>, <code>member2</code>)가 됩니다. 회원이 100명이면 인스턴스도 100개가 독립적으로 생깁니다.'
            },
            {
              title: '⚡ 2. 생성자 (__init__)와 self ➡️ 차량 등록 시 자동 초기화 세팅',
              detail: '• <strong>PM 번역:</strong> 인스턴스가 생성되는 순간 자동으로 실행되어 초기 데이터를 세팅해 주는 특별한 메서드이며, <code>self</code>는 바로 지금 만들어지고 있는 개별 인스턴스 자신입니다.<br>• <strong>CarSync 적용:</strong> 빈 차로 만든 뒤 정보를 나중에 채우는 게 아니라, 차 등록 버튼을 누르는 순간 <code>__init__</code>을 통해 차종, 연식, 주행거리가 전용 공간에 딱 착지합니다.'
            },
            {
              title: '🔒 3. 네임스페이스 (Namespace) ➡️ 공용 플랫폼 수수료 vs 내 차 고유 데이터',
              detail: '• <strong>PM 번역:</strong> 변수와 값이 저장되는 독립된 방(공간)입니다. 인스턴스 방에 없으면 클래스 방으로 올라가서 찾아오는 메모리 구조입니다.<br>• <strong>클래스 변수:</strong> 모든 제휴 세차장에 공통 적용되는 기본 플랫폼 수수료율이나 공통 시스템 값.<br>• <strong>인스턴스 변수:</strong> <code>member1</code>이 가진 내 차 고유 주행거리나 잔여 엔진오일 수명처럼 개별 차마다 가지는 독립 데이터.'
            },
            {
              title: '🧬 4. 클래스 상속 (Inheritance) ➡️ 기본 차량을 물려받아 전기차로 파생 확장',
              detail: '• <strong>PM 번역:</strong> 부모 클래스의 모든 기능을 그대로 물려받고 자식 클래스에서 필요한 기능(플러스 알파)을 추가하는 기법입니다.<br>• <strong>CarSync 적용:</strong> 기본 일반 차량 <code>Car</code>(부모)가 있다면, 이를 상속받아 전기차 고유의 배터리 효율 관리 기능만 얹은 <code>ElectricCar</code>(자식)를 쉽고 빠르게 파생시켜 확장할 수 있습니다.'
            },
            {
              title: '🧩 5. 연습문제 (6-1, 6-2, 6-4) ➡️ 인스턴스 독립 변수와 객체지향 메모리 규칙',
              detail: '• <strong>PM 번역:</strong> <code>a.market = "kosdaq"</code>처럼 인스턴스에서 값을 변경하면 해당 인스턴스 방(네임스페이스)에만 새로 생성되어 저장되고, 부모 원본 <code>Stock.market</code> 클래스 변수는 그대로 유지됩니다. 현장의 복잡한 데이터와 기능들을 덩어리로 깔끔하게 묶어 관리하는 설계도 기법입니다.'
            }
          ]
        },
        {
          secTitle: '📦 5. [모듈 · import · 내장 함수] 테크 PM의 시각으로 번역하기',
          icon: '⚙️',
          desc: '모듈화 설계와 `import` 패턴, 자주 쓰이는 6대 내장 함수(`len`, `max`, `min`, `abs`, `sorted`, `enumerate`) 및 표준 모듈을 <strong>마이크로서비스 및 비즈니스 데이터 처리 관점</strong>으로 번역했습니다.',
          table: {
            headers: ['핵심 개념 및 문법', '🏫 교재/학원 기본 방식', '🏢 테크 PM (조진훈) 실무 번역', '💼 실제 서비스 구현 적용 사례'],
            rows: [
              [
                '1. 모듈 (Module)',
                '다른 파이썬 파일에 만들어 놓은 기능을 가져다 씀',
                '단일 대형 파일(Monolith)을 피하고 기능별로 쪼개는 마이크로서비스/컴포넌트 설계 방식',
                '`car_pricing.py`, `user_auth.py`, `dispatch_rule.py`, `payment_gateway.py`로 모듈 분리하여 독립 관리'
              ],
              [
                '2. import와 패턴 3가지',
                '이 파일의 기능을 가져와서 사용함',
                '외부 유틸리티 및 전역 라이브러리 패키지 바인딩',
                '① `import os` (전체 로딩) / ② `from os import listdir` (필수 메서드 핀포인트 로딩) / ③ `import os as winos` (별칭으로 충돌 방지)'
              ],
              [
                '3. 내장 함수 (Built-in Functions)',
                '파이썬 설치 시 기본으로 제공되는 함수',
                '시스템 구축 시 즉시 활용하는 엔진 자체 내장 비즈니스 유틸리티 모음',
                '`len` (가용기사/데이터 수 확인) / `max/min` (최고/최저 시술가) / `abs` (거리 오차 절대치) / `sorted` (정렬) / `enumerate` (순번 부여)'
              ],
              [
                '4. enumerate() 함수',
                'for 문에서 순서 번호와 값을 동시에 가져옴',
                '배차 대기 목록 및 큐(Queue) 시스템에서 유저에게 실시간 순번 부여 로직',
                '`for idx, order in enumerate(orders):` ➡️ "[1순위] 화주: (주)화물원" 형태로 실시간 배차 순번 자동 맵핑'
              ],
              [
                '5. 표준 모듈 (Standard Modules)',
                '파이썬이 기본 제공하는 라이브러리 (time, os, math, random, datetime)',
                '비즈니스 타이머, 랜덤 추첨, 일자 계산을 위한 검증된 빌트인 무기',
                '`datetime`으로 엔진오일 교체 주기 일수 계산, `random`으로 긴급 출동 기사 무작위 맵핑, `time`으로 요청 쿨다운 적용'
              ]
            ]
          },
          cards: [
            {
              title: '🧩 1. 모듈 (Module) ➡️ 마이크로서비스 & 컴포넌트 분리 설계',
              detail: '• <strong>PM 번역:</strong> 모든 코드를 파일 하나에 넣으면 수 만 줄이 되어 관리가 불가능합니다. <code>계산.py</code>, <code>로그인.py</code>, <code>회원관리.py</code>처럼 기능별로 쪼개어 모듈화(Module)하는 것은 테크 PM이 시스템 아키텍처를 설계하는 근본적인 이유입니다.'
            },
            {
              title: '📥 2. import 3가지 패턴 ➡️ 외부 마이크로서비스 패키지 바인딩',
              detail: '• <strong>① import os:</strong> 모듈 전체를 가져옴 (기본 형태)<br>• <strong>② from os import listdir:</strong> 필요한 메서드만 핀포인트로 가져와 메모리 절약<br>• <strong>③ import os as winos:</strong> 모듈에 앨리어스(별칭)를 부여하여 다른 변수와의 네임스페이스 충돌을 방지'
            },
            {
              title: '🛠️ 3. 자주 쓰는 6대 내장 함수 ➡️ 비즈니스 데이터 자동 가공 엔진',
              detail: '• <strong>len():</strong> 현재 가용 가능한 배차 기사 수/화주 오더 수 확인<br>• <strong>max() / min():</strong> 제휴 매장 시술 최고가 및 최저가 밴드 산출<br>• <strong>abs():</strong> GPS 위치 오차 및 주행거리 차이 절대치 계산<br>• <strong>sorted():</strong> 화주 평점순 / 기사 거리순 정렬 데이터 파이프라인'
            },
            {
              title: '🔢 4. enumerate() ➡️ 배차 대기 순번 및 큐(Queue) 자동 할당',
              detail: '• <strong>PM 번역:</strong> 반복문에서 데이터와 함께 `0, 1, 2...` 순서 번호를 자동으로 할당해 주는 기능입니다. CarSync 및 물류 플랫폼에서 "현재 고객님의 배차 대기 순번은 1번입니다"를 구현할 때 필수적으로 쓰입니다.'
            },
            {
              title: '⏰ 5. 표준 모듈 (datetime, random, time) ➡️ 시간계산 & 무작위 추출 유틸',
              detail: '• <strong>PM 번역:</strong> `datetime` 모듈로 소모품 교체 후 경과 일수를 계산하고, `random` 모듈로 이벤트 쿠폰 발급 대상 차주나 무작위 긴급 출동 기사를 할당하는 표준 시스템 모듈입니다.'
            }
          ]
        },
        {
          secTitle: '🎨 6. [파이썬 & CSS 협업] 테크 PM의 시각으로 번역하기',
          icon: '🎨',
          desc: '백엔드 파이썬의 비즈니스 룰 판단과 프론트엔드 CSS 디자인 표현이 <strong>지휘관 파이썬과 페인트통 CSS</strong>로 협업하는 실제 동적 UI 렌더링 원리입니다.',
          table: {
            headers: ['역할 레이어', '🏫 시스템 내부 역할', '🏢 테크 PM (조진훈) 실무 시스템 번역', '💼 CarSync 실무 적용 사례'],
            rows: [
              [
                '1. 파이썬 (판단 & 계산)',
                '지휘관 (Commander)',
                '주행거리/연식 데이터를 판단하여 화면에 적용할 UI 테마 꼬리표 선택',
                '아반떼 AD 85,000km 조회 후 "미션오일 교체 주기 초과" 판단 ➡️ `status_class = "danger-box"` 꼬리표 생성'
              ],
              [
                '2. HTML (뼈대)',
                '조립장 (Skeleton)',
                '파이썬이 보낸 테마 꼬리표를 돔(DOM) 요소 박스에 바인딩',
                '`<div class="danger-box">미션오일 교체 시급</div>` 뼈대 구조 완성'
              ],
              [
                '3. CSS (스타일 & 색상)',
                '페인트 통 (Paint Bucket)',
                '꼬리표를 감지하여 시각적 디자인(배경/테두리/글자색) 칠하기',
                '`.danger-box` 꼬리표 감지 ➡️ 연한 빨간 배경(#FFEEEE) + 쨍한 테두리(#FF3B30) + 경고 글자(#D32F2F) 색칠'
              ]
            ]
          },
          cards: [
            {
              title: '🎖️ 1. 파이썬 = 지금 무슨 페인트를 칠할지 명령하는 지휘관',
              detail: '• <strong>PM 번역:</strong> 주행거리 85,000km를 계산하여 <code>if current_km >= target_km: css_theme = "danger-box"</code> 형태로 화면에 칠할 페인트(CSS 클래스명)를 결정하고 HTML로 신호를 던집니다.'
            },
            {
              title: '🎨 2. CSS = 미리 준비해 둔 빨간 페인트통 (.danger-box) vs 초록 페인트통 (.safe-box)',
              detail: '• <strong>.danger-box (빨간 페인트):</strong> 배경 <code>rgba(255, 59, 48, 0.14)</code>, 테두리 <code>#FF3B30</code>, 경고 글자 <code>#FF6B6B</code><br>• <strong>.safe-box (초록 페인트):</strong> 배경 <code>rgba(76, 175, 80, 0.14)</code>, 테두리 <code>#4CAF50</code>, 안전 글자 <code>#4ADE80</code>'
            },
            {
              title: '💡 3. 테크 PM을 위한 한마디 정리',
              detail: '• <strong>결론:</strong> CSS는 "빨간 페인트, 초록 페인트"를 미리 준비해 둔 페인트 통이고, 파이썬은 차량 주행거리를 계산해서 <strong>"지금은 빨간 페인트(danger-box CSS)를 발라라!"</strong>하고 신호를 주는 <strong>지휘관</strong>입니다.'
            }
          ]
        },
        {
          secTitle: '🛡️ 7. [보안 금고 & 파이썬 3대 역할] 테크 PM의 시각으로 번역하기',
          icon: '🔒',
          desc: 'API 키를 환경 변수(.env)에 은닉하는 보안 금고 방식과 개인정보 마스킹, 그리고 <strong>파이썬의 백엔드 핵심 3대 역할(판단·보안·중개)</strong>을 정리했습니다.',
          table: {
            headers: ['구분 레이어', '🏫 일반 코더/교재 방식', '🏢 테크 PM (조진훈) 실무 시스템 번역', '💼 CarSync & 플랫폼 적용 사례'],
            rows: [
              [
                '1. API 키 다루는 방식 (보안 금고)',
                '코드에 API 키 문자열 직접 하드코딩',
                '프론트엔드 노출 0%! 서버 환경변수(.env)에 은닉 후 파이썬 백엔드만 로드',
                '`PAYMENT_SECRET_KEY = os.getenv("TOSS_PAYMENTS_SECRET_KEY")`로 결제/알림톡 키 완벽 보호'
              ],
              [
                '2. 개인정보 (전화번호/차량) 보호',
                '입력받은 문자열 그대로 DB 저장 및 화면 출력',
                'DB 저장 전 외계어 암호화(e8b7d6...) 후 화면 전달 시 마스킹 껍데기만 전송',
                '차주 전화번호 `010-1234-5678` ➡️ 암호화 DB 저장 ➡️ 화면에는 `010-****-5678`로 마스킹 안전 노출'
              ],
              [
                '3. 파이썬의 핵심 역할 ① (판단 & 계산)',
                '단순 사칙연산 및 조건문 처리',
                '주행거리/연식을 계산하여 화면에 위험 등급 빨간불(CSS danger-box)을 켤지 결정하는 지휘관',
                '미션오일 교체 주기 초과 판단 및 사전 경고 트리거'
              ],
              [
                '4. 파이썬의 핵심 역할 ② (보안 & 금고)',
                '변수 저장소',
                '외부에 절대 노출되면 안 되는 API 비밀키 안전 보관 및 개인정보 암호화 총괄',
                '결제 비밀키, 알림톡 토큰, 고객 개인정보 DB 암호화 금고 관리'
              ],
              [
                '5. 파이썬의 핵심 역할 ③ (외부 중개)',
                '외부 라이브러리 호출',
                '카카오 알림톡, 카드사 결제 승인, AI(Whisper STT/LLM) 호출 등 외부 세상 통신 총괄',
                '알림톡 푸시 발송, PG 결제 승인, 음성인식 AI 엔진 중개'
              ]
            ]
          },
          cards: [
            {
              title: '🔒 1. 파이썬이 API 키를 다루는 방식 (보안 금고)',
              detail: '• <strong>프론트엔드(화면):</strong> 결제 API 키나 카카오 알림톡 비밀키의 존재 자체를 모릅니다.<br>• <strong>파이썬(백엔드):</strong> 서버 깊은 곳의 환경 변수 파일(<code>.env</code>)에 API 키를 꽁꽁 숨겨두고, 파이썬 혼자서만 <code>os.getenv()</code>로 안전하게 꺼내 씁니다.'
            },
            {
              title: '🛡️ 2. 개인정보(전화번호, 차량번호) 보호 & 마스킹 파이프라인',
              detail: '• <strong>암호화 DB 보관:</strong> 차주가 "010-1234-5678"을 입력하면 파이썬이 알아볼 수 없는 외계어 암호(<code>e8b7d6...</code>)로 변환하여 DB 금고에 보관합니다.<br>• <strong>화면 전달 마스킹:</strong> 화면에 다시 보여줄 때는 뒤 4자리를 가려서(<code>010-****-5678</code>) 안전한 껍데기만 프론트엔드로 전달합니다.'
            },
            {
              title: '⚡ 3. 테크 PM을 위한 파이썬의 핵심 역할 3줄 요약',
              detail: '• <strong>① 판단 & 계산:</strong> 주행거리를 계산해 화면에 빨간불(CSS danger-box)을 켤지 결정하는 지휘관.<br>• <strong>② 보안 & 금고:</strong> API 비밀키 보관, 개인정보 암호화 및 마스킹 처리.<br>• <strong>③ 외부 중개:</strong> 카카오 알림톡 발송, 카드사 결제 승인, AI(Whisper STT/LLM) 호출 등 외부 세상과의 통신 총괄.'
            }
          ]
        },
        {
          isPractice: true,
          practiceTitle: '🧪 PM 실무 룰 엔진 & 파이썬 종합 실습 코드 (기초+5/6장+보안금고+백엔드3대역할)',
          secTitle: '💻 [실습 코드] 파이썬 기초 + 룰엔진 + 5/6장 + 보안금고 + 백엔드 3대 역할',
          icon: '🧪',
          desc: '9월 29일 배운 전체 내용과 .env 비밀키 로드, 개인정보 마스킹, 백엔드 3대 역할 시뮬레이션 코드를 실행해 보세요.',
          code: `# =========================================================
# 💡 [9/29 테크 PM 실무 파이썬 종합 코드] 룰 엔진 & 보안금고 파이프라인
# =========================================================

import os
import datetime
import random

# [1] 변수 & 데이터 스키마 (CarSync 오프라인 샵 스키마)
shop_name = "진훈 디테일링 샵 (판교점)"
worker_skill_level = "Master"
has_detailing_equipment = True
print(f"🏢 [데이터 스키마] {shop_name} | 숙련도: {worker_skill_level} | 장비: {has_detailing_equipment}")

# [2] 파이썬 & CSS 동적 협업 룰 엔진 (지휘관 파이썬 -> CSS 페인트통)
car_model = "아반떼 AD"
current_km = 85000
target_km = 60000

if current_km >= target_km:
    css_theme = "danger-box"  # 초과 시 빨간 페인트 꼬리표
    status_msg = "🚨 미션오일 교체 시급 (위험 등급)"
else:
    css_theme = "safe-box"    # 여유 시 초록 페인트 꼬리표
    status_msg = "💚 정상 소모품 상태 (안전 등급)"

dynamic_html = f'<div class="{css_theme}">{status_msg}</div>'
print(f"🎨 [파이썬 지휘관 판단] 선택된 CSS 페인트 꼬리표 -> {css_theme}")
print(f"🖥️ [HTML 뼈대 바인딩] 최종 동적 HTML 요소 -> {dynamic_html}")

# [3] 보안 금고 (.env) & 개인정보 마스킹 파이프라인
PAYMENT_SECRET_KEY = os.getenv("TOSS_PAYMENTS_SECRET_KEY", "sk_live_sec_xxxx9876")
KAKAO_ALIMTALK_KEY = os.getenv("KAKAO_API_KEY", "kakao_secret_key_1234")
print(f"🔒 [보안 금고 .env] 토스 결제 비밀키: {PAYMENT_SECRET_KEY[:7]}*** | 카카오키: 안전 로드 완료")

raw_phone = "010-1234-5678"
masked_phone = raw_phone[:4] + "****" + raw_phone[8:]
print(f"🛡️ [개인정보 보호] 원본: {raw_phone} -> 암호화 DB 보관 -> 화면 마스킹 노출: {masked_phone}")

# [4] 백엔드 3대 핵심 역할 시뮬레이션
print("⚡ [파이썬 백엔드 3대 핵심 역할 Summary]")
print("  1) 판단 & 계산: 주행거리 85,000km 경고 판단 -> CSS danger-box 선택")
print("  2) 보안 & 금고: .env 비밀키 보호 & 개인정보 암호화/마스킹 처리")
print("  3) 외부 중개: 카카오 알림톡 발송 & 카드사 결제 연동 & AI(Whisper/LLM) 중개")`,
          summary: '파이썬 백엔드는 판단·계산(지휘관), 보안·금고(.env/암호화), 외부 중개(알림톡/결제/AI)라는 3대 핵심 축으로 전체 서비스 시스템을 지휘합니다.'
        }
      ]
    },
    {
      id: '0928_pm',
      date: '09/28 (월) [단독]',
      badge: 'PM FOCUS',
      title: '⚡ [조진훈 테크 PM 실전 해석] 삼항 연산자 & 리스트 컴프리헨션 (따로보기)',
      subtitle: '일반 학생의 해석 vs 조진훈의 해석 (PM 관점) · 상태 전환(Status Transition) 룰 엔진 & 악성 화주 데이터 정제 파이프라인',
      tags: ['실습', '조진훈PM해석', '리스트컴프리헨션', '테크PM분석', 'Python문법'],
      sections: [
        {
          isPractice: true,
          practiceTitle: '삼항 연산자 & 리스트 컴프리헨션 PM 실무 룰 엔진 실습',
          secTitle: '💡 일반 학생의 해석 vs 조진훈의 해석 (테크 PM 관점) 극적 대비',
          icon: '🎯',
          desc: '같은 코드를 보더라도 일반 코더 학생과 실무 테크 PM 조진훈의 뇌구조는 완전히 다르게 작동합니다.',
          cards: [
            {
              title: '1. 삼항 연산자: result = "합격" if score >= 80 else "불합격"',
              detail: '• 🏫 <strong>일반 학생의 해석:</strong> "점수가 80 이상이면 합격, 아니면 불합격을 변수에 넣습니다."<br>• 🏢 <strong>조진훈의 해석 (PM 관점):</strong> "이건 코코넛사일로에서 기사의 신뢰도 점수(score)가 특정 임계치(80점)를 넘으면 <strong>\'우수 차주(합격)\' 등급과 우선 배차권을 부여</strong>하고, 미만이면 <strong>\'일반 등급(불합격)\'으로 분류</strong>하는 <em>\'상태 전환(Status Transition) 룰 엔진\'</em>입니다."'
            },
            {
              title: '2. 리스트 컴프리헨션: [i for i in range(10) if i % 2 == 0]',
              detail: '• 🏫 <strong>일반 학생의 해석:</strong> "0부터 9까지 숫자 중 짝수만 리스트로 묶는 코드입니다."<br>• 🏢 <strong>조진훈의 해석 (PM 관점):</strong> "수많은 화주 오더 데이터베이스(range) 중에서, 특정 조건(예: <strong>까대기 강요 3회 이상 신고 누적</strong>)에 해당하는 악성 화주 데이터만 정밀 필터링(if)하여, <strong>블랙리스트(list)로 묶어내는 \'데이터 정제 파이프라인\'</strong>입니다."'
            }
          ],
          table: {
            headers: ['핵심 코드 문법', '🏫 일반 학생의 해석 (코더 관점)', '🏢 조진훈의 해석 (테크 PM 관점)', '실무 비즈니스 시스템 적용'],
            rows: [
              [
                'result = "합격" if score >= 80 else "불합격"',
                '점수가 80 이상이면 합격, 아니면 불합격을 변수에 대입',
                '신뢰도 점수 80점 임계치 기준 우수 차주 승급 & 우선 배차권 부여',
                '상태 전환 (Status Transition) 자동화 룰'
              ],
              [
                '[i for i in range(10) if i % 2 == 0]',
                '0부터 9까지 숫자 중 짝수만 리스트로 묶어냄',
                '수만 개 오더 중 "까대기 강요 3회 이상" 악성 화주만 걸러내는 필터',
                '블랙리스트 자동 격리 & 리스크 방어 파이프라인'
              ],
              [
                'target_drivers = [d for d in drivers if d.dist <= 10]',
                '거리 조건 10 이하인 기사 딕셔너리를 리스트에 담음',
                '판교 반경 10km 이내 5톤 공차 대기 기사 실시간 긴급 배차군 추출',
                '24시간 실시간 배차 매칭 시스템 엔진'
              ]
            ]
          },
          code: `# =========================================================
# ⚡ [조진훈 PM 실무 코드] 룰 엔진 & 데이터 정제 파이프라인
# =========================================================

# [1] 상태 전환 룰 엔진: 신뢰도 기반 우선 배차권 자동 부여
driver_trust_score = 85
# 일반 학생: 80점 이상이면 합격, 아니면 불합격
# 조진훈 PM: 신뢰도 점수 80점 임계치 기반 "우수 차주 우선 배차권" 부여 룰
dispatch_status = "우수 차주 (우선 배차권)" if driver_trust_score >= 80 else "일반 차주"
print(f"기사님 신뢰도: {driver_trust_score}점 -> 배차 등급: {dispatch_status}")

# [2] 데이터 정제 파이프라인: 악성 화주 블랙리스트 필터링
shippers_orders = [
    {"shipper_id": "SP_001", "name": "(주)화물원", "abuse_reports": 4},  # 까대기 강요 3회 이상
    {"shipper_id": "SP_002", "name": "성수물류", "abuse_reports": 1},
    {"shipper_id": "SP_003", "name": "판교유통", "abuse_reports": 5},  # 까대기 강요 3회 이상
    {"shipper_id": "SP_004", "name": "한남상사", "abuse_reports": 0}
]

# 까대기 강요 3회 이상 악성 화주만 필터링하여 블랙리스트로 격리
blacklist_shippers = [s["name"] for s in shippers_orders if s["abuse_reports"] >= 3]
print("🚨 배차 제한 블랙리스트 화주:", blacklist_shippers)  # ['(주)화물원', '판교유통']

# [3] 실시간 반경 10km & 5톤 트럭 공차 기사 즉시 매칭
drivers_db = [
    {"name": "김기사", "truck": "5톤", "dist_km": 4.5},
    {"name": "이기사", "truck": "1톤", "dist_km": 3.0},
    {"name": "박기사", "truck": "5톤", "dist_km": 15.0},
    {"name": "최기사", "truck": "5톤", "dist_km": 8.2}
]
target_drivers = [d["name"] for d in drivers_db if d["truck"] == "5톤" and d["dist_km"] <= 10.0]
print("🎯 실시간 배차 대상 기사님:", target_drivers)  # ['김기사', '최기사']`,
          summary: '코더는 "문법과 짝수"를 보지만, 테크 PM 조진훈은 "악성 화주를 거르는 데이터 정제 파이프라인과 우선 배차 상태 전환 룰 엔진"을 봅니다.'
        }
      ]
    },
    {
      id: '0928',
      date: '09/28 (월)',
      badge: 'LATEST',
      title: '파이썬 기초 총정리(초등학생 버전) & 점프 투 파이썬 핵심 & [현업 vs 학원] 테크 PM 데이터 분석',
      subtitle: '라면 레시피 비유·12대 문법 트리·가계부 연결도·변수·데이터구조·삼항연산자·리스트컴프리헨션·룰 엔진 실무',
      tags: ['실습', 'Python문법', '파이썬기초', '테크PM분석', '리스트컴프리헨션', '데이터구조', '현장변수규격', 'CarSync실무', '클래스'],
      sections: [
        {
          secTitle: '📊 [현업 vs 학원] 테크 PM의 실전 데이터 분석 차이점',
          icon: '💼',
          desc: '💡 <strong>PM 요약:</strong> 학원식 코딩 교육의 한계를 벗어나, 실무 테크 PM 관점에서 데이터를 비즈니스 무기(24시간 룰 엔진)로 활용하는 실전 프로세스입니다.',
          table: {
            headers: ['비교 항목', '🏫 학원 (코더 방식)', '🏢 현업 (PM 방식)'],
            rows: [
              ['목적', '파이썬 문법 암기 및 1회성 그래프 시각화', '시스템 룰 엔진을 통한 수익 창출 및 리스크 방어'],
              ['시작점', '무작정 데이터를 열어보고 "무엇이 있을까" 관찰', '명확한 타겟(사냥감)을 먼저 설정하고 데이터 추적'],
              ['데이터 종류', '정제되어 있는 장난감 데이터 (타이타닉 등)', '현장의 변수가 섞인 날것의 데이터 (정비소 꼼수, 출장 세차 환경)'],
              ['결측치(빈칸) 처리', '에러 방지를 위해 단순 삭제하거나 0을 채워 넣음', '도메인 지식으로 역산 추정 (예: 누락된 주행거리 추정)'],
              ['툴 활용법', '백지부터 for, if문을 독수리 타법으로 타이핑', 'AI에게 로직을 던져 코드를 뽑아내고 검수만 진행 (레버리지)'],
              ['최종 산출물', '엑셀, PPT에 들어갈 정적인 차트와 보고서', '24시간 백엔드에서 돌아가는 자동화 룰 엔진']
            ]
          },
          summary: '현업 테크 PM은 코드를 외워 치는 사람이 아니라, 도메인 지식으로 비즈니스 룰을 정의하고 AI/개발자를 레버리지하여 24시간 수익/방어 시스템을 구축하는 기획자입니다.'
        },
        {
          isPractice: true,
          practiceTitle: 'CarSync 6만km 미션 수리비 방어 타겟팅 파이썬 필터링 실습',
          secTitle: '🎯 현업 테크 PM의 실전 데이터 분석 3단계 프로세스',
          icon: '🚀',
          desc: '현업의 데이터 분석은 차트 그리기로 끝나지 않으며, 반드시 비즈니스 액션(시스템 제어 및 수익화/리스크 방어)으로 이어져야 합니다.',
          cards: [
            {
              title: 'Step 1. 타겟 룰 설정 (도메인 지식)',
              detail: '• <strong>CarSync 예시:</strong> 현기차 1.6T 차주 중 건식 DCT 미션오일 고착 시점인 "주행거리 6만km" 도달 유저 추적<br>• <strong>코코넛사일로 예시:</strong> 최근 1개월 내 기사님들에게 "상하차 까대기"를 강요하여 피드백 신고 3회 이상 누적된 악성 화주 추적'
            },
            {
              title: 'Step 2. 데이터 추출 및 필터링 (AI·개발자 위임)',
              detail: '• <strong>실무 지시:</strong> "유저 DB에서 코나/셀토스 차주 중 현재 주행거리 5만 8천~6만 2천km 사이 유저만 필터링하는 SQL/파이썬 쿼리문 작성해 줘."<br>• 단순 추출 작업은 AI와 백엔드 개발자에게 철저히 위임'
            },
            {
              title: 'Step 3. 비즈니스 액션 전환 (수익화 & 리스크 방어)',
              detail: '• <strong>CarSync 액션:</strong> 6만km 도달 유저에게 "120만 원 수리비 사전 방어" 푸시 발송 및 제휴 공업사 예약 링크 연결<br>• <strong>코코넛사일로 액션:</strong> 기사님 연속 8시간 운행 감지 시 안전 쿨타임 동안 신규 배차 수락 버튼 강제 잠금(Lock)'
            }
          ],
          code: `# [Step 2 실무 코드 예시] 테크 PM의 타겟 룰 기반 필터링 & 액션 트리거
def process_carsync_target_action(user_db):
    """
    타겟: 코나/셀토스(1.6T) 차주 중 주행거리 58,000km ~ 62,000km 도달 차량
    액션: 120만원 수리비 방어 알림톡 발송 및 정비 예약 전환
    """
    target_users = []
    
    for user in user_db:
        model = user.get("차종", "")
        mileage = user.get("주행거리", 0)
        
        # 도메인 타겟 조건 검사
        if model in ["코나 1.6T", "셀토스 1.6T"] and (58000 <= mileage <= 62000):
            target_users.append({
                "user_id": user["id"],
                "차량번호": user["차량번호"],
                "주행거리": mileage,
                "action": "120만원 미션 수리비 방어 알림 발송",
                "reserve_link": f"https://carsync.app/book?car={user['차량번호']}"
            })
            
    return target_users`,
          note: '💡 <strong>비즈니스 무기화:</strong> 데이터 추출에 그치지 않고, 예약 전환(매출 증대) 또는 안전 쿨타임 잠금(리스크 차단)으로 연결됩니다.'
        },
        {
          isPractice: true,
          practiceTitle: '초등학생도 이해하는 파이썬 기초 종합 실습 (print, 변수, if, for)',
          secTitle: '🧒 🐍 파이썬 기초 — 초등학생도 이해하는 쉬운 개념 총정리 (1장~7장)',
          icon: '🐣',
          desc: '💡 <strong>파이썬 = 컴퓨터에게 일을 시키는 언어!</strong> 사람이 "10 더하기 20 계산해줘"라고 말하면 사람은 알아듣지만 컴퓨터는 못 알아듣습니다. 그래서 <code>print(10 + 20)</code>이라고 명령하면 컴퓨터가 <code>30</code>을 보여줍니다. 어려운 수학이 아니라 라면 레시피처럼 컴퓨터에게 순서대로 일을 시키는 과정입니다.',
          table: {
            headers: ['핵심 용어', '아주 쉽게 (비유)', '설명 및 컴퓨터와의 관계'],
            rows: [
              ['프로그램', '완성된 요리 레시피', '어떤 문제를 해결하기 위해 컴퓨터가 실행해야 하는 명령어들의 순서 모음'],
              ['프로그래밍', '레시피를 구상하고 요리하는 전체 과정', '프로그램을 기획하고 완성해 나가는 모든 과정'],
              ['코딩', '실제 레시피 명령어를 적는 행위', '소스 코드를 직접 타이핑하여 작성하는 구체적인 작업'],
              ['소스 코드', '컴퓨터에게 전달할 명령서', '사람이 파이썬 등의 문법 규칙에 맞추어 작성한 텍스트 파일'],
              ['파이썬 (Python)', '사람 ↔ 컴퓨터 사이의 통역사', '문법이 직관적이고 쉬우며, 남이 만든 라이브러리를 마음껏 가져다 쓰는 대화 언어'],
              ['IDE (작업 공간)', '코딩 전용 조리대 / 실험실', 'Google Colab, Jupyter Notebook 등 파이썬을 설치 없이 바로 실행하는 환경']
            ]
          },
          cards: [
            {
              title: '1장. 프로그램이란? (라면 요리 레시피)',
              detail: '• <strong>순서가 있는 명령:</strong> 냄비에 물 붓기 → 물 끓이기 → 면 넣기 → 스프 넣기 → 기다리기 → 먹기<br>• 컴퓨터에게도 "이것 해 → 그리고 이것 해 → 그다음 이것 해" 명령을 모아놓은 것이 프로그램입니다.'
            },
            {
              title: '2장. 컴퓨터에게 입력하고 결과 받기 (print vs input)',
              detail: '• <strong>print():</strong> 컴퓨터야! 화면에 보여줘! (컴퓨터 → 사람)<br>• <strong>input():</strong> 사람아! 정보 좀 입력해줘! (사람 → 컴퓨터)<br>• <strong>연산자:</strong> +(더하기), -(빼기), *(곱하기), /(나누기), //(몫), %(나머지), **(거듭제곱)<br>• <strong>⚠️ 따옴표 주의:</strong> <code>"100"</code>(글자)과 <code>100</code>(숫자)은 다름! <code>input()</code>으로 받은 값은 무조건 문자열이므로 계산 시 <code>int()</code> 변환 필수!'
            },
            {
              title: '3장. 변수 = 물건을 넣어두는 이름표 상자',
              detail: '• <strong>개념:</strong> <code>name = "진훈"</code>은 name 상자에 "진훈"을 보관하라는 뜻.<br>• <code>age = 31</code>을 저장해두면 나중에 <code>print(age)</code>로 언제든 다시 꺼내 쓸 수 있음.<br>• 아주 길고 복잡한 데이터를 매번 치지 않고 상자 이름만 불러 재사용!'
            },
            {
              title: '4장. 조건문 (if / elif / else / and / or)',
              detail: '• <strong>if (만약):</strong> 만약 비가 오면 우산을 챙긴다.<br>• <strong>else (그렇지 않으면):</strong> 비가 안 오면 우산을 안 챙긴다.<br>• <strong>elif (또 다른 조건):</strong> 90점 이상 A, 80점 이상 B, 70점 이상 C...<br>• <strong>and:</strong> 둘 다 만족 (사탕도 있고 돈도 있다)<br>• <strong>or:</strong> 둘 중 하나만 만족 (현금 있거나 카드 있다)'
            },
            {
              title: '5장. 반복문 (for / while / break)',
              detail: '• 사람에게 "안녕하세요" 100번 쓰라면 힘들지만 컴퓨터는 1초 컷!<br>• <strong>for:</strong> 정해진 범위만큼 반복해! (<code>for i in range(5):</code>)<br>• <strong>while:</strong> 조건 맞는 동안 계속 반복해! (<code>while money > 0:</code>)<br>• <strong>break:</strong> 반복문아! 이제 그만 멈춰!'
            },
            {
              title: '6장 & 7장. 리스트 & 딕셔너리',
              detail: '• <strong>리스트 [ ]:</strong> 여러 물건을 한 바구니에 담기 (0번부터 시작! <code>.append()</code> 추가, <code>.remove()</code> 삭제, 슬라이싱)<br>• <strong>딕셔너리 { }:</strong> 진짜 영어사전처럼 <code>Key(이름표) : Value(값)</code> 연결 (예: <code>{"apple": "사과", "name": "진훈"}</code>)'
            }
          ],
          code: `# =========================================================
# 🐣 [초등학생도 이해하는 파이썬 기초 종합 실습]
# =========================================================

# 1. print & 계산기
print("안녕하세요! 컴퓨터에게 일을 시켜봅시다.")
print("10 + 20 =", 10 + 20)          # 결과: 30
print("10 // 3 몫 =", 10 // 3)       # 몫: 3
print("10 % 3 나머지 =", 10 % 3)     # 나머지: 1

# 2. 변수와 형변환 (int)
user_name = "진훈"                   # 문자열 상자
str_age = "31"                       # 따옴표가 있어 문자 "31"
real_age = int(str_age)              # 숫자로 변환 (int)
print(f"{user_name}님의 내년 나이는 {real_age + 1}살입니다.")

# 3. 조건문 (if / elif / else)
score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"                      # 85점이므로 B 선택
else:
    grade = "C"
print(f"점수: {score}점 -> 등급: {grade}")

# 4. 반복문 (for & while & break)
print("--- 5번 인사하기 ---")
for i in range(5):
    print(f"{i+1}번째: 파이썬 참 쉽다!")

count = 1
while True:
    if count > 3:
        break                        # 3번 출력 후 강제 멈춤!
    print(f"while문 반복 중: {count}")
    count += 1

# 5. 리스트 & 딕셔너리
food = ["치킨", "피자", "햄버거"]
food.append("라면")                  # 맨 뒤 추가
food.remove("피자")                  # 피자 삭제
print("0번 음식:", food[0])          # 치킨

person = {"name": "진훈", "age": 31, "role": "테크 PM"}
print("이름표로 값 꺼내기:", person["role"])  # 테크 PM`,
          summary: '파이썬은 어려운 수학이 아니라, 컴퓨터에게 "무엇을 → 언제 → 몇 번 → 어떻게" 하라고 순서대로 명령을 내리는 말하기 규칙입니다.'
        },
        {
          isPractice: true,
          practiceTitle: '12대 문법 관통 실전 미니 AI 가계부 프로그램 실습',
          secTitle: '🎯 파이썬 12대 핵심 트리 구조 & 실전 가계부 프로그램 연결도',
          icon: '🗺️',
          desc: '💡 <strong>한눈에 보는 파이썬 구조도:</strong> 130페이지 책도 사실 아래 12개 키워드가 전부입니다. 처음부터 문법을 달달 외우지 말고, "가계부 프로그램을 컴퓨터에게 어떻게 지시할까?" 생각하면 모든 코드가 한 줄기로 연결됩니다.',
          cards: [
            {
              title: '파이썬 12대 개념 한 줄 트리 구조도',
              detail: '파이썬<br>├── <strong>print()</strong> → 보여줘<br>├── <strong>input()</strong> → 입력받아<br>├── <strong>변수</strong> → 상자에 기억해<br>├── <strong>데이터 타입</strong> → 숫자야? 문자야?<br>├── <strong>if / else / elif</strong> → 만약 / 아니면 / 다른 조건<br>├── <strong>for / while</strong> → 정해진 만큼 / 맞는 동안 반복해<br>├── <strong>break</strong> → 반복 당장 멈춰<br>├── <strong>list [ ]</strong> → 여러 데이터를 순서대로 묶어<br>└── <strong>dictionary { }</strong> → 이름표(Key)와 내용(Value) 연결해'
            },
            {
              title: '실전 가계부 프로그램 하나로 12대 개념 관통하기',
              detail: '• <strong>1. 금액을 입력받는다</strong> → <code>input()</code><br>• <strong>2. 입력받은 금액을 저장한다</strong> → <code>변수 (amount = int(...))</code><br>• <strong>3. 식비 / 교통비 / 월세 등을 묶는다</strong> → <code>list</code> 또는 <code>dictionary</code><br>• <strong>4. 금액이 10만원 이상이면 경고한다</strong> → <code>if amount >= 100000:</code><br>• <strong>5. 여러 지출을 계속 반복 입력받는다</strong> → <code>for / while</code> (종료 시 <code>break</code>)<br>• <strong>6. 화면에 총 지출 결과를 보여준다</strong> → <code>print()</code>'
            }
          ],
          table: {
            headers: ['번호', '파이썬 핵심 문법', '컴퓨터에게 시키는 말 (한마디)', '실제 역할 및 비즈니스 비유'],
            rows: [
              ['①', '프로그램', '"이 완성된 레시피대로 움직여!"', '컴퓨터에게 일을 시키는 명령어들의 모음'],
              ['②', '파이썬', '"사람 말과 컴퓨터 말 사이 통역해줘!"', '컴퓨터에게 명령을 전달하기 위한 대화 언어'],
              ['③', '변수', '"이 이름 붙은 상자에 데이터 담아둬!"', '데이터를 넣어놓는 저장 공간'],
              ['④', 'print()', '"화면에 이것 좀 예쁘게 보여줘!"', '컴퓨터가 사람에게 결과를 출력'],
              ['⑤', 'input()', '"사용자한테 데이터 좀 입력받아와!"', '사람이 컴퓨터에게 값을 전달'],
              ['⑥', 'if', '"만약 이 조건이 맞으면 실행해!"', '참/거짓 조건 판단 및 분기'],
              ['⑦', 'else', '"조건이 아니면 다른 것 실행해!"', 'if 조건이 거짓일 때 기본 처리'],
              ['⑧', 'elif', '"앞 조건 아니고 새로운 조건이면 실행해!"', '다중 조건 분기 판별'],
              ['⑨', 'for', '"정해진 횟수만큼 똑같이 반복해!"', '범위(range)나 목록 순회 반복'],
              ['⑩', 'while', '"조건 맞는 동안 지치지 말고 계속 반복해!"', '조건 충족 시 지속 반복'],
              ['⑪', 'break', '"반복문아! 이제 그만 멈춰!"', '반복 루프 즉시 탈출'],
              ['⑫', 'list / dict', '"여러 개 바구니에 담거나 이름표 달아줘!"', '목록 묶기 [ ] 및 Key:Value 매핑 { }']
            ]
          },
          code: `# =========================================================
# 💰 [12대 문법이 한 번에 결합된 실전 가계부 프로그램]
# =========================================================

# 1. 지출 내역을 저장할 리스트와 딕셔너리 (list, dict, 변수)
expense_list = []
total_spent = 0

# 가계부 프로그램 시작 (print)
print("=== 👛 미니 AI 가계부 프로그램 시작 ===")

# 가상의 지출 입력 데이터 (input() 대신 실습용 리스트 시뮬레이션)
raw_inputs = [
    {"category": "식비", "cost": "25000"},
    {"category": "교통비", "cost": "1500"},
    {"category": "쇼핑", "cost": "120000"},  # 10만원 이상 고액 지출
    {"category": "종료", "cost": "0"}
]

# 2. 여러 지출을 계속 처리하는 반복문 (while & break)
idx = 0
while True:
    data = raw_inputs[idx]
    category = data["category"]
    cost_str = data["cost"]
    
    # 종료 조건 (if & break)
    if category == "종료":
        print("지출 입력을 종료합니다.")
        break
        
    # 문자를 숫자로 변환 (int 형변환)
    amount = int(cost_str)
    
    # 3. 10만원 이상 과소비 판별 조건문 (if / elif / else)
    if amount >= 100000:
        alert = "🚨 [경고] 10만원 이상 고액 지출 발생!"
    elif amount >= 30000:
        alert = "⚠️ 주의: 다소 큰 지출입니다."
    else:
        alert = "✅ 알뜰 지출입니다."
        
    # 4. 내역을 딕셔너리로 묶어 리스트에 추가 (.append)
    record = {"항목": category, "금액": amount, "진단": alert}
    expense_list.append(record)
    total_spent += amount
    
    idx += 1

# 5. 최종 가계부 리포트 출력 (for & print)
print("\\n================ [오늘의 가계부 정산] ================")
for item in expense_list:
    print(f"• [{item['항목']}] {item['금액']:,}원 -> {item['진단']}")
    
print(f"총 누적 지출 합계: {total_spent:,}원")
print("======================================================")`,
          summary: '가계부의 "입력 → 변환 → 조건 판단 → 리스트 저장 → 반복 정산 → 출력" 파이프라인처럼, 모든 IT 서비스는 파이썬 기초 문법의 조합으로 완성됩니다.'
        },
        {
          secTitle: '⭐ 프로그래밍 언어의 본질은 딱 4단어입니다',
          icon: '💡',
          desc: '파이썬, 자바, C언어 등 모든 프로그래밍 언어의 실체는 아래 4가지 동작을 컴퓨터에 시키는 것이 전부입니다.',
          cards: [
            { title: '1. 저장한다', detail: '변수, 리스트, 딕셔너리 (차량번호, 주행거리 담아두기)' },
            { title: '2. 판단한다', detail: 'if 조건문 (1만km 넘었으면 교체 알림 쏘기)' },
            { title: '3. 반복한다', detail: 'for 반복문 (오늘 입고된 차 20대 순서대로 점검하기)' },
            { title: '4. 묶어둔다', detail: 'def 함수 (부품 교체 시 0km 리셋 작업을 버튼 하나로 묶기)' }
          ],
          note: '🚀 <strong>Top-Down (역방향) 방식</strong>: CarSync 화면과 비즈니스 로직(목표)을 먼저 세우고, 필요한 문법을 역으로 배치합니다.'
        },
        {
          isPractice: true,
          practiceTitle: '정비 데이터 변수·자료형·수수료 연산 실무 실습',
          secTitle: '1. 변수와 자료형: 정비 데이터의 기본 규격',
          icon: '📦',
          desc: '차량의 모델명, 시공 종류, 주행거리, 정비 희망 예산, 수수료율 등 카센타/플랫폼 비즈니스를 구성하는 기본 데이터 규격입니다.',
          cards: [
            {
              title: '📝 문자열 (str): 텍스트 데이터',
              detail: '• <strong>차량 모델명:</strong> <code>"셀토스 1.6T"</code>, <code>"코나 하이브리드"</code><br>• <strong>시공 종류:</strong> <code>"덴트"</code>, <code>"랩핑"</code>, <code>"판금도색"</code><br>• <strong>사용자 리뷰:</strong> <code>"정비 속도가 빠르고 볼트 고착 설명이 친절해요!"</code>'
            },
            {
              title: '🔢 숫자형 (int, float): 연산 가능한 수치 데이터',
              detail: '• <strong>누적 주행거리 (int):</strong> <code>60000</code> km (미션오일 교체 트리거)<br>• <strong>정비 희망 예산 (int):</strong> <code>350000</code> 원 (견적 매칭 기준)<br>• <strong>플랫폼 수수료율 (float):</strong> <code>0.08</code> (8% 정산 수수료율)'
            }
          ],
          code: `# [1] 문자열(str): 텍스트 데이터 (차량 모델명, 시공 종류, 사용자 리뷰)
car_model = "셀토스 1.6T"                       # 차량 모델명 (str)
service_type = "덴트 및 랩핑"                   # 시공 종류: 덴트, 랩핑 등 (str)
user_review = "판금 도색이 깔끔하고 친절해요!"   # 사용자 리뷰 텍스트 (str)

# [2] 숫자형(int, float): 연산 가능한 수치 데이터 (주행거리, 희망 예산, 수수료율)
current_mileage = 60000                        # 정수형(int): 누적 주행거리 (60,000km)
repair_budget = 350000                         # 정수형(int): 정비 희망 예산 (원)
fee_rate = 0.08                                # 실수형(float): 플랫폼 수수료율 (8%)

# [PM 실무 연산] 희망 예산 기반 플랫폼 수수료 계산
platform_fee = int(repair_budget * fee_rate)
print(f"[{car_model} / {service_type}] 정비 예산: {repair_budget:,}원 -> 수수료: {platform_fee:,}원 (수수료율: {fee_rate * 100}%)")

# [3] 리스트 (List, []): 교체할 부품들의 순서 목록 (추가/삭제 가능)
parts_to_replace = ["엔진오일", "에어컨필터", "브레이크패드"]
parts_to_replace.append("미션오일")            # 부품 추가

# [4] 딕셔너리 (Dict, {키: 값}): [PM 핵심] 차량 1대의 종합 정비 프로필 규격
car_profile = {
    "car_model": car_model,
    "service_type": service_type,
    "current_mileage": current_mileage,
    "repair_budget": repair_budget,
    "user_review": user_review,
    "is_completed": True
}`,
          summary: '문자열(str)은 설명/명칭을 담고, 숫자형(int/float)은 주행거리 임계치 판정 및 수수료/예산 연산의 기반이 됩니다.'
        },
        {
          isPractice: true,
          practiceTitle: '카싱크 list·tuple·dict 복합 자료구조 실습',
          secTitle: '📦 복잡한 데이터 구조, PM의 언어로 10초 컷 해체 (list · tuple · dict · table)',
          icon: '🎁',
          desc: '💡 <strong>PM 핵심 관점:</strong> 복잡한 데이터 구조도 결국 데이터를 담는 "상자의 종류"일 뿐입니다. PM은 <em>"어떤 상자에 데이터를 담으라고 개발자에게 지시(오더)할지"</em>만 알면 시스템의 무결성과 비즈니스 로직을 완벽히 통제할 수 있습니다.',
          cards: [
            {
              title: '1. list (리스트 / 대괄호 [ ]) = 순서대로 적어둔 부품 목록',
              detail: '• <strong>비유:</strong> 사장님 정비 체크리스트 메모지<br>• <strong>개념:</strong> 부품이나 항목을 순서대로 죽 나열해 둘 때 씁니다. 자유롭게 넣었다 뺐다 할 수 있습니다.<br>• <strong>카싱크 실무:</strong> 고속도로 7대 위험 부품 리스트 관리 (겉벨트, 미션오일, 냉각수 등)'
            },
            {
              title: '2. tuple (튜플 / 소괄호 ( )) = 절대 수정 불가능한 고정 스펙',
              detail: '• <strong>비유:</strong> 차량등록증에 찍힌 차대번호나 바코드 (위변조 불가)<br>• <strong>개념:</strong> 리스트와 똑같이 순서가 있지만, 한 번 적어두면 내용을 절대 지우거나 바꿀 수 없습니다.<br>• <strong>카싱크 실무:</strong> 외제차 5개사 고정 규격 브랜드 (벤츠, bmw, 아우디 등 불변 방어)'
            },
            {
              title: '3. dict (딕셔너리 / 중괄호 { }) = 이름표(Key)와 내용(Value) 세트',
              detail: '• <strong>비유:</strong> 부품 창고의 서랍 (서랍 라벨을 열면 내용물이 들어있음)<br>• <strong>개념:</strong> "이름표 : 실제 데이터"를 짝지어 둘 때 쓰며, 파이썬에서 가장 많이 쓰고 중요한 상자입니다.<br>• <strong>카싱크 실무:</strong> 차량 한 대의 정비 정보 프로필 규격 및 프론트-백엔드 표준 API(JSON)'
            },
            {
              title: '4. table (테이블) = 엑셀 시트 그 자체 (빅데이터 DataFrame)',
              detail: '• <strong>비유:</strong> 엑셀 표 (가로줄 행 Row × 세로줄 열 Column)<br>• <strong>개념:</strong> 위의 dict(딕셔너리)들을 모아서 엑셀 표처럼 행과 열로 만든 데이터 표입니다.<br>• <strong>카싱크 실무:</strong> 빅데이터 분석 시 판다스(Pandas)의 DataFrame으로 변환되어 차량 수만 대 분석'
            }
          ],
          table: {
            headers: ['데이터 상자', '문법 기호', '실무 비유', '데이터 특성', '카싱크 실무 적용 예시', '핵심 요약 공식'],
            rows: [
              ['list (리스트)', '[ ] 대괄호', '📋 정비 체크리스트 메모지', '자유롭게 추가/삭제 가능 (Mutable)', '고속도로 7대 부품 목록 (danger_parts)', '여러 개를 순서대로 나열할 때'],
              ['tuple (튜플)', '( ) 소괄호', '🔒 차량등록증 바코드 (금고)', '절대 수정/삭제 불가 (Immutable)', '외제차 5개사 고정 규격 (import_car_brands)', '절대 변하면 안 되는 고정값'],
              ['dict (딕셔너리)', '{ Key: Value }', '🏷️ 부품 창고 약통 서랍', 'Key 이름표 기반 빠른 조회/수정', '차량 1대 정비 프로필 규격 (car_info)', '이름표 달아서 짝지어둘 때'],
              ['table (테이블)', '행(Row) × 열(Col)', '📊 엑셀 시트 / 판다스 DataFrame', 'dict들을 모아 2차원 표로 정형화', '전체 등록 차량 수만 대 빅데이터 분석', '엑셀 시트 그 자체 (분석용)']
            ]
          },
          code: `# =========================================================
# 🛠️ [카싱크 실무] list · tuple · dict · table 실무 활용 코드
# =========================================================

# 1. list (리스트 / 대괄호 [ ]) : 사장님 정비 체크리스트 메모지
# 카싱크 고속도로 7대 부품 리스트
danger_parts = ["겉벨트", "미션오일", "냉각수", "로워암", "브레이크오일", "점화플러그", "패드"]

# 부품 하나 꺼내기 (0부터 시작)
print("첫 번째 점검 부품:", danger_parts[0])  # 결과: 겉벨트


# 2. tuple (튜플 / 소괄호 ( )) : 절대 수정하면 안 되는 고정 스펙
# 절대 바뀌면 안 되는 외제차 5개사 고정 규격
import_car_brands = ("벤츠", "bmw", "아우디", "폭스바겐", "도요타")

# import_car_brands[0] = "현대"  
# -> 이렇게 바꾸려고 하면 TypeError를 뿜으며 시스템을 안전하게 보호합니다!


# 3. dict (딕셔너리 / 중괄호 { }) : 이름표(Key)와 내용(Value) 세트
# 차량 한 대의 정비 정보 (Key: Value)
car_info = {
    "car_name": "셀토스",        # "car_name"이라는 Key(이름표)에 "셀토스"라는 Value(값)
    "transmission": "건식 dct",  # "transmission" Key에 "건식 dct" Value
    "current_km": 62000          # "current_km" Key에 62000 Value
}

# 이름표(Key)를 부르면 내용(Value)이 바로 튀어나옵니다.
print("변속기 종류:", car_info["transmission"])  # 결과: 건식 dct


# 4. 카싱크에서 실제 한 번에 합쳐서 쓰는 실무 올인원 결합 코드
# 딕셔너리(dict) 안에 리스트(list)와 튜플(tuple) 담기
repair_card = {
    "car_model": "코나 1.6 터보",                            # 문자열
    "warning_km": 60000,                                      # 숫자
    "photo_urls": ["/img/bolt_01.jpg", "/img/bolt_02.jpg"],   # list: 사진 2장 목록
    "allowed_brands": ("bmw", "benz", "audi")                 # tuple: 고정된 브랜드
}

# 데이터 꺼내 쓰기
print("차종 모델:", repair_card["car_model"])            # 코나 1.6 터보
print("첫 번째 사진:", repair_card["photo_urls"][0])       # /img/bolt_01.jpg (첫 번째 사진)`,
          summary: '💡 [PM 3대 요약 공식] 여러 개를 순서대로 나열할 땐 list [ ] | 절대 변하면 안 되는 고정값은 tuple ( ) | 이름표 달아서 짝지어둘 땐 dict { "key": "value" }'
        },
        {
          isPractice: true,
          practiceTitle: '카싱크 현장 변수 & 10초 음성 리포트 데이터 모델 실습',
          secTitle: '📋 카싱크 현장 변수 & 주소 데이터 저장 변수 규격 (all_lower_snake_case)',
          icon: '🗂️',
          desc: '💡 <strong>PM 데이터 표준화:</strong> 정비소 주소(Address), 사장님 10초 음성 리포트 및 사진(Report & Voice), 차종/파워트레인 스펙(Car Specs)을 저장하는 소문자 스네이크 케이스 표준 규격과 실무 딕셔너리 모델입니다.',
          table: {
            headers: ['분류', '변수명 (all_lower_snake_case)', '데이터 타입 / 예시', '설명 및 비즈니스 목적'],
            rows: [
              ['1. 주소 및 위치', 'shop_address_full', 'str ("서울시 성동구 성수동2가 123")', '정비소 전체 지번/도로명 주소'],
              ['1. 주소 및 위치', 'shop_address_road', 'str ("성수이로 20길")', '도로명 주소'],
              ['1. 주소 및 위치', 'shop_address_detail', 'str ("1층 101호")', '상세 주소'],
              ['1. 주소 및 위치', 'shop_address_zonecode', 'str ("04780")', '우편번호 5자리'],
              ['1. 주소 및 위치', 'user_address_region', 'str ("성동구")', '차주 희망 지역/구 단위'],
              ['2. 현장 변수 리포트', 'repair_record_id', 'str ("rec_20261015_001")', '정비 작업 고유 식별 번호 (PK)'],
              ['2. 현장 변수 리포트', 'field_issue_detected', 'bool (true / false)', '현장 변수(볼트 고착 등) 발생 여부'],
              ['2. 현장 변수 리포트', 'issue_image_url_1', 'str ("/uploads/images/bolt_rust_01.jpg")', '현장 사진 1 저장 경로 (고착 부위)'],
              ['2. 현장 변수 리포트', 'issue_image_url_2', 'str ("/uploads/images/lower_arm_02.jpg")', '현장 사진 2 저장 경로 (손상 부품)'],
              ['2. 현장 변수 리포트', 'voice_record_file', 'str ("/uploads/voice/voice_10sec_01.mp3")', '사장님 10초 음성 녹음 원본 파일 경로'],
              ['2. 현장 변수 리포트', 'voice_stt_text', 'str ("로워암 볼트가 부식으로 고착...")', 'AI가 음성을 텍스트로 변환한 원본 내용'],
              ['2. 현장 변수 리포트', 'ai_summary_note', 'str ("로워암 볼트 고착 해제 특수 공임...")', 'AI가 고객용으로 정제한 작업 설명 요약'],
              ['2. 현장 변수 리포트', 'extra_labor_cost', 'int (20000)', '현장 변수로 인한 추가 공임비 금액 (숫자)'],
              ['2. 현장 변수 리포트', 'customer_approval_status', 'str ("pending" / "approved" / "rejected")', '고객 승인 상태'],
              ['2. 현장 변수 리포트', 'approval_timestamp', 'str / datetime', '고객 승인 완료 일시'],
              ['3. 차종 및 제원', 'car_model_name', 'str ("seltos")', '차종 모델명'],
              ['3. 차종 및 제원', 'engine_type', 'str ("gasoline_1_6t", "diesel_2_0")', '엔진 형식'],
              ['3. 차종 및 제원', 'transmission_type', 'str ("dct_7speed_dry", "cvt_ivt")', '변속기 형식'],
              ['3. 차종 및 제원', 'current_mileage', 'int (62000)', '누적 주행거리 (숫자)']
            ]
          },
          code: `# 모든 변수명과 키값을 소문자 + 언더바(all lower)로 구성한 현장 변수 레코드
add_repair_record = {
    "repair_record_id": "rec_20261015_001",
    "shop_address_road": "seoul_seongdong_seongsu_ro_20",
    "car_model_name": "seltos",
    "transmission_type": "dct_7speed_dry",
    "current_mileage": 62000,
    "issue_image_url_1": "/uploads/images/bolt_rust_01.jpg",
    "issue_image_url_2": "/uploads/images/lower_arm_02.jpg",
    "voice_record_file": "/uploads/voice/voice_10sec_01.mp3",
    "voice_stt_text": "로워암 볼트가 부식으로 고착되어 산소 작업이 필요합니다.",
    "ai_summary_note": "로워암 볼트 고착 해제 및 특수 탈거 공임 안내",
    "extra_labor_cost": 20000,
    "customer_approval_status": "approved"
}

# [PM 데이터 활용 로직] 고객 승인 여부에 따른 실시간 공임비 확정 및 알림
if add_repair_record["customer_approval_status"] == "approved":
    base_cost = 50000  # 기본 공임비
    total_cost = base_cost + add_repair_record["extra_labor_cost"]
    print(f"[{add_repair_record['car_model_name']}] 고객 승인 완료! 최종 청구 금액: {total_cost:,}원")
else:
    print("고객 승인 대기(pending) 상태이므로 추가 정비 작업을 안전하게 보류합니다.")`,
          summary: '정비 현장의 돌발 변수(볼트 고착 등)를 10초 음성과 AI 요약으로 정제하고, 차주 승인(approved)과 연동하여 분쟁 없이 추가 매출을 확보하는 핵심 데이터 규격입니다.'
        },
        {
          secTitle: '🚨 [CarSync PRD v2.1] 고속도로 2차 사고 방지 핵심 7대 소모품 감각 진단 DB & 와이어프레임',
          icon: '🚦',
          desc: '💡 <strong>서비스 정의:</strong> 대기업 공임 거품과 5,000km 단순 소모품 매몰을 타파하고, 10만km 고속도로 멈춤 유발 7대 고위험 소모품을 운전자의 감각 증상(소리/냄새/조작감)으로 역추적 진단하는 안전 플랫폼입니다.',
          cards: [
            {
              title: '1. 신호등 체계(🔴/🟡/🟢) 홈 대시보드',
              detail: '• <strong>비로그인 UI/UX:</strong> 로그인 없이 누적 주행거리 숫자(예: 112,000km)만 입력하면 7대 핵심 부품의 위험 상태가 신호등으로 즉시 렌더링<br>• <strong>🔴 위험:</strong> 구동 겉벨트(10만km), 미션오일(10만km), 냉각수(5만km)<br>• <strong>🟡 경고:</strong> 하체 로워암/부싱(10만km)<br>• <strong>🟢 정상:</strong> 브레이크 오일, 점화플러그, 브레이크 패드'
            },
            {
              title: '2. 기존 모빌리티 앱(마이클·카닥) 역기획 격차 분석',
              detail: '• <strong>기존 결함:</strong> 5,000km 엔진오일 최저가 출혈 경쟁 매몰, 현장 변수(볼트 고착) 외면으로 바가지 시비 다발, 수입차 회피<br>• <strong>카싱크 솔루션:</strong> 10만km 7대 고위험 부품 집중, 파이썬 룰 엔진 가변 주기 매핑, 현장 사진 2장+음성 10초 AI 원터치 모바일 승인, 소액 예약금(1만원)+현장 후결제'
            }
          ],
          table: {
            headers: ['부품명', '권장 주기', '주행 중 발생하는 소리 (청각)', '주행 중 발생하는 냄새/질감 (후각/촉각)', '방치 시 2차 사고 위험 메커니즘'],
            rows: [
              ['구동 겉벨트 세트', '8만~10만km', '"끼익- / 찌르르르-" 쇳소리, 베어링 "찰찰찰"', '마찰열로 인한 매캐한 고무 탄내', '발전기 및 워터펌프 정지로 고속도로 주행 중 엔진 완전 멈춤'],
              ['자동변속기 오일', '8만~10만km', '가속 시 "위잉-" 기계음, 변속 시 "쿵! 덜컹!" 충격음', '슬러지 산화로 인한 시큼하고 역한 탄내 (오징어 탄내)', '고속 주행 중 슬립(동력 전달 불가) 및 밸브바디 고착으로 가속 불가'],
              ['냉각수 (부동액)', '4만~5만km', '대시보드 물 흐르는 "꾸르륵-", 오버히트 "쉭- 쉭-"', '송풍구로 퍼지는 달콤한 냄새 (한약/시럽 탄내)', '엔진 냉각 상실로 헤드 변형 파손 및 고속도로 주행 중 엔진 정지'],
              ['하체 로워암/부싱', '10만~12만km', '방지턱 넘을 때 "찌걱- 찌그덕-", 요철 "덜커덕"', '냄새 없음 (핸들 유격 및 차체 쏠림)', '고무 경화/파열로 고속 밸런스 붕괴 및 급제동 시 차선 이탈'],
              ['브레이크 오일', '4만~5만km', '소음 없음 (페달 바람 빠지는 소리)', '캘리퍼 누유 시 화학약품 냄새 / 페달 푹 꺼짐', '수분 과다로 베이퍼 록 발생, 고속 제동 시 페달 먹통 사고'],
              ['점화플러그/코일', '8만~10만km', '엔진 부조 시 경운기처럼 "두두두두", 머플러 "푸득-"', '머플러 뒤 독한 생가솔린 냄새', '실린더 실화로 급격한 감속 및 고속도로 후미 추돌 사고 유발'],
              ['브레이크 패드', '4만~5만km', '칠판 긁듯 "끼이익- 삐이익-", 패드 한계 시 "그르르륵"', '과열 시 날카로운 쇳가루 탄 냄새', '제동 밀림 현상, 브레이크 디스크 파손 및 고속 추돌 사고']
            ]
          },
          summary: '운전자가 정비 용어를 몰라도 소리, 냄새, 조작감으로 원인 부품을 역추적할 수 있는 카싱크 핵심 감각 진단 DB입니다.'
        },
        {
          isPractice: true,
          practiceTitle: '카싱크 가변 정비 공임 및 정산 엔진 시뮬레이션 (billing_engine.py)',
          secTitle: '💵 [CarSync 실무 실습] 가변 정비 공임 및 정산 엔진 (billing_engine.py)',
          icon: '🧾',
          desc: '💡 <strong>PM 정산 룰 엔진:</strong> 노쇼 방지 선결제 예약금(10,000원)을 차감하고, 파트너 정비소 10% 우대 할인(float 연산) 및 현장 변수 추가 공임을 반영하여 최종 현장 후결제 금액을 자동 계산하는 카싱크 백엔드 핵심 정산 모듈입니다.',
          cards: [
            {
              title: '1. 변하지 않는 요소 (고정값)',
              detail: '• <strong>예약금 (DEPOSIT_AMOUNT):</strong> 10,000원 (정비소 노쇼 방지 및 차주 예약 확정)<br>• <strong>파트너 할인율 (PARTNER_DISCOUNT_RATE):</strong> 0.90 (10% 우대 할인 실수형 float)<br>• <strong>플랫폼 수수료율:</strong> 0.04 (4.0%)'
            },
            {
              title: '2. 변하는 요소 (현장 가변 입력값)',
              detail: '• <strong>현재 주행거리:</strong> 차주 입력값 (str ➔ int 변환)<br>• <strong>기본 표준 공임:</strong> 작업 항목별 기준 공임 (미션오일 80,000원)<br>• <strong>현장 승인 변수 공임:</strong> 사장님 음성/사진 승인 공임 (볼트 고착 20,000원)'
            }
          ],
          code: `# =========================================================
# 🚗 카싱크 (CarSync) 가변 정비 공임 및 정산 엔진
# 파일명: billing_engine.py
# 기획/작성: 조진훈 (AX 전략가 / PM)
# =========================================================

# 1. 변하지 않는 고정 요소 (단가 및 상수 설정)
DEPOSIT_AMOUNT = 10000        # 노쇼 방지 선결제 예약금 (10,000원)
PARTNER_DISCOUNT_RATE = 0.90  # 카싱크 파트너 정비소 기본 공임 10% 우대 할인율 (float)

# 2. 변하는 요소 입력 (차주 입력 및 현장 변수)
def run_billing_simulation(mileage_input="62000", extra_cost_input="20000"):
    # input()으로 들어오는 문자열 데이터는 int()로 즉시 정수형 변환
    user_mileage = int(mileage_input)           # 예: 62000 km (코나/셀토스 건식 DCT 미션오일 교체 주기)
    base_labor_cost = 80000                     # 기본 작업 공임 (미션오일 교환)
    extra_variable_cost = int(extra_cost_input) # 예: 20000 (하부 볼트 부식 고착 산소 작업 추가 공임)

    # 3. 사칙연산 및 할인 정산 프로세스
    # (1) 현장 총 작업 비용 계산 (덧셈 연산)
    total_work_cost = base_labor_cost + extra_variable_cost

    # (2) 파트너 정비소 우대 할인 적용 (곱셈 연산 후 float 변환)
    discounted_cost = float(total_work_cost * PARTNER_DISCOUNT_RATE)

    # (3) 최종 후결제 청구 금액 계산 (기납부 예약금 뺄셈 연산)
    final_payment = int(discounted_cost - DEPOSIT_AMOUNT)

    # 4. 차주 전용 알림톡 및 영수증 출력
    print("-" * 45)
    print(f"차량 확인 주행거리: {user_mileage:,} km")
    print(f"기본 표준 공임: {base_labor_cost:,} 원")
    print(f"현장 승인 변수 공임: {extra_variable_cost:,} 원")
    print(f"총 정비 금액: {total_work_cost:,} 원")
    print(f"카싱크 회원 우대 적용가: {discounted_cost:,.0f} 원")
    print(f"기납부 예약금 차감: -{DEPOSIT_AMOUNT:,} 원")
    print(f"👉 현장 최종 후결제 금액: {final_payment:,} 원")
    print("-" * 45)
    
    return final_payment

# 실행 결과 테스트
if __name__ == "__main__":
    final_amount = run_billing_simulation("62000", "20000")
    # 결과: 80,000원 확정 후결제 청구!`,
          summary: '소액 예약금(1만원 선결제)으로 노쇼를 방지하고, 현장 변수(볼트 고착)를 사진/음성 승인 후 최종 후결제에 정밀 합산하여 시비 없는 상생 정산을 완성합니다.'
        },
        {
          isPractice: true,
          practiceTitle: '부품 잔여 수명 판별 및 당일 입고 차량 자동화 제어 실습',
          secTitle: '2. 제어문: 카센타 자동화 시스템의 두뇌',
          icon: '🧠',
          desc: '부품 잔여 수명에 따른 알림톡 트리거 조건문과 당일 입고 차량 전수 조사 반복문입니다.',
          code: `# [1] 조건문 (if / elif / else): 부품 수명 판별 및 알림 발송 조건
oil_life_ratio = 0.08  # 엔진오일 수명 8% 남음

if oil_life_ratio <= 0.10:
    status = "긴급 교체 권장 알림 발송"
elif oil_life_ratio <= 0.20:
    status = "정기 점검 안내 대상"
else:
    status = "정상 주행 가능"
print("상태 진단:", status)

# [2] 반복문 (for): 오늘 입고된 차량 목록 전수 조사
today_cars = ["12가3456", "34나7890", "56다1234"]
for car in today_cars:
    print(f"{car} 차량의 정비 리포트를 생성합니다.")`,
          summary: '조건문은 업무 규칙을 자동화하고, 반복문은 대량의 입고 차량을 일괄 처리합니다.'
        },
        {
          isPractice: true,
          practiceTitle: '실무 한 줄 코딩: 삼항 연산자 & 리스트 컴프리헨션 실습',
          secTitle: '⚡ 파이썬 실무 압축 스킬: 삼항 연산자 & 리스트 컴프리헨션 (한 줄 코딩의 미학)',
          icon: '⚡',
          desc: '💡 <strong>PM 실무 스킬:</strong> 조건문과 반복문 코드가 여러 줄로 늘어지는 것을 한 줄로 압축하여 대량의 유저/화물 기사 데이터를 실시간으로 필터링하고 분류하는 개발자들의 핵심 테크닉입니다.',
          cards: [
            {
              title: '1. 삼항 연산자 (조건 분기를 한 줄로 치우기)',
              detail: '• <strong>문법 구조:</strong> <code>[참일 때 반환값] if [조건문] else [거짓일 때 반환값]</code><br>• <strong>예시:</strong> 80점 이상 "합격", 아니면 "불합격"을 여러 줄 없이 <code>result = "합격" if score >= 80 else "불합격"</code>으로 압축.<br>• <strong>PM 실무 관점:</strong> 화물 시스템 룰 엔진 기획 시 "기사님의 이번 달 운행 건수가 30건 이상이면 \'우수 기사\', 아니면 \'일반 기사\'로 등급을 나눠라" 같은 양자택일 비즈니스 로직에 활용.'
            },
            {
              title: '2. 내포 리스트 / 리스트 컴프리헨션 (데이터 뭉치 한방에 걸러내기)',
              detail: '• <strong>문법 구조:</strong> <code>[표현식 for 항목 in 반복가능객체 if 조건문]</code><br>• <strong>예시:</strong> 짝수만 추출 <code>evens = [i for i in range(10) if i % 2 == 0]</code> → <code>[0, 2, 4, 6, 8]</code>.<br>• <strong>PM 실무 관점:</strong> 전체 화물 기사 1만 명 DB에서 "현재 판교 반경 10km 이내(if 조건) + 5톤 트럭 모는 기사만 쫙 뽑아서 대기자 리스트로 만들어라"는 대량 데이터 필터링 오더의 실체!'
            }
          ],
          table: {
            headers: ['핵심 코드 문법', '🏫 일반 학생의 해석 (코더 관점)', '🏢 조진훈의 해석 (테크 PM 관점)', '실무 비즈니스 시스템 적용'],
            rows: [
              [
                'result = "합격" if score >= 80 else "불합격"',
                '점수가 80 이상이면 합격, 아니면 불합격을 변수에 넣음',
                '신뢰도 점수 80점 임계치 기준 우선 배차권/우수 차주 승급 룰 엔진',
                '상태 전환 (Status Transition) 자동화 룰'
              ],
              [
                '[i for i in range(10) if i % 2 == 0]',
                '0부터 9까지 숫자 중 짝수만 리스트로 묶어냄',
                '수만 개 오더 중 "까대기 강요 3회 이상" 악성 화주만 걸러내는 데이터 파이프라인',
                '블랙리스트 자동 격리 & 리스크 방어 필터'
              ]
            ]
          },
          code: `# =========================================================
# ⚡ [실무 한 줄 코딩] 삼항 연산자 & 리스트 컴프리헨션
# =========================================================

# 1. 삼항 연산자: [조진훈 PM 관점] 상태 전환 (Status Transition) 룰 엔진
driver_trust_score = 85
dispatch_status = "우수 차주 (우선 배차권)" if driver_trust_score >= 80 else "일반 차주"
print(f"기사님 신뢰도: {driver_trust_score}점 -> 배차 등급: {dispatch_status}")

# 2. 리스트 컴프리헨션: [조진훈 PM 관점] 악성 화주 블랙리스트 데이터 정제 파이프라인
shippers_orders = [
    {"shipper_id": "SP_001", "name": "(주)화물원", "abuse_reports": 4},
    {"shipper_id": "SP_002", "name": "성수물류", "abuse_reports": 1},
    {"shipper_id": "SP_003", "name": "판교유통", "abuse_reports": 5},
    {"shipper_id": "SP_004", "name": "한남상사", "abuse_reports": 0}
]
blacklist_shippers = [s["name"] for s in shippers_orders if s["abuse_reports"] >= 3]
print("🚨 배차 제한 블랙리스트 화주:", blacklist_shippers)

# 3. 0~9 짝수 추출 예시
evens = [i for i in range(10) if i % 2 == 0]
print("짝수 리스트:", evens)`,
          summary: '코더는 "문법과 짝수"를 보지만, 테크 PM 조진훈은 "악성 화주를 거르는 데이터 정제 파이프라인과 우선 배차 상태 전환 룰 엔진"을 봅니다.'
        },
        {
          isPractice: true,
          practiceTitle: '부품 교체 시 수명 0km 리셋 함수 실습',
          secTitle: '3. 함수 (def): 반복되는 정비 비즈니스 로직 무인화',
          icon: '⚙️',
          desc: '카센타 사장님이 버튼 하나 눌렀을 때 백엔드에서 자동으로 돌아가는 묶음 작업입니다.',
          code: `# CarSync 핵심 로직: 부품 교체 시 수명 0km 리셋 함수
def reset_part_life(part_name, current_mileage):
    """
    정비사가 부품 교체 승인을 누르면 해당 부품의 누적 주행거리를 0km로 리셋하고
    다음 교체 주기를 계산함
    """
    part_lifespan_km = 10000  # 엔진오일 기준 1만km 교체 주기
    next_service_km = current_mileage + part_lifespan_km
    
    return {
        "교체부품": part_name,
        "리셋_주행거리": 0,
        "다음정비_목표km": next_service_km,
        "상태": "정상 초기화 완료"
    }

# 실행 예시 (현재 주행거리 85,000km에 교체 시)
result = reset_part_life("엔진오일", 85000)
print(result)`,
          summary: '함수를 사용하면 복잡한 다음 정비 주기 산출 공식을 한 번에 모듈화할 수 있습니다.'
        },
        {
          isPractice: true,
          practiceTitle: '차량 객체 생성 및 정비 완료 모델링 클래스 실습',
          secTitle: '4. 클래스 (class): 차량 객체 모델링',
          icon: '🚗',
          desc: '차량이라는 틀(붕어빵 틀)을 만들고, 입고되는 차들마다 독립적인 데이터를 관리하는 구조입니다.',
          code: `class CarSyncVehicle:
    def __init__(self, car_num, mileage):
        self.car_num = car_num
        self.mileage = mileage
        self.oil_reset = False

    def complete_maintenance(self):
        self.oil_reset = True
        return f"{self.car_num} 정비 완료: 부품 수명 0km 리셋"

# 차주 입고 시 객체 생성
my_car = CarSyncVehicle("12가3456", 85000)
print(my_car.complete_maintenance())
# 출력: 12가3456 정비 완료: 부품 수명 0km 리셋`,
          summary: '차량 100대가 입고되어도 각각의 고유 주행거리와 정비 상태를 안전하게 격리 관리합니다.'
        },
        {
          isPractice: true,
          practiceTitle: '정비사 수기 입력 오류 방어 예외 처리 실습',
          secTitle: '5. 예외 처리 (try - except): 시스템 뻗는 것 방어하기',
          icon: '🛡️',
          desc: '현장에서 정비사가 실수로 문자를 넣거나 잘못된 입력을 했을 때 서버 다운을 막는 안전망입니다.',
          code: `user_input = "팔만오천"  # 잘못된 입력값

try:
    mileage_num = int(user_input)
    print(f"입력 주행거리: {mileage_num}km")
except ValueError:
    # 시스템이 뻗지 않고 오류 메시지로 방어 (HITL 원칙: Human In The Loop)
    print("[시스템 방어] 주행거리는 숫자만 입력 가능합니다. 정비사 수기 입력을 요청합니다.")`,
          summary: '예외 처리는 24시간 무중단 백엔드 운영을 위한 필수 방어벽입니다.'
        }
      ]
    },
    {
      id: '0924',
      date: '09/24 (수)',
      badge: 'LLM & DISTRIBUTED',
      title: 'LLM 한계 극복 6대 핵심 기술 · 실무 AI 3개 이상 조합 & 분산 저장',
      subtitle: '프롬프트/파인튜닝/RAG/펑션콜링/랭체인/랭그래프, 모델별 특징, 분산 저장(샤딩/복제/합의)',
      tags: ['실습', 'LLM핵심기술', '분산저장', 'AI조합', 'LangChain'],
      sections: [
        {
          secTitle: '1. LLM의 한계를 보완하는 6가지 핵심 기술',
          icon: '🛠️',
          desc: '환각(Hallucination), 최신성 부족, 시스템 미연동 문제를 해결하는 6대 기술 스택',
          cards: [
            { title: '1. 프롬프트 엔지니어링', detail: '업무 매뉴얼(지시문)을 설계하여 원하는 형식과 정밀도 유도' },
            { title: '2. 파인 튜닝 (Fine-Tuning)', detail: '사전학습 모델에 특정 도메인 전용 데이터를 추가 학습시켜 특화' },
            { title: '3. RAG (검색 증강 생성)', detail: '사내 DB/문서를 먼저 검색(Retrieval)한 후 근거 기반으로 답변 생성' },
            { title: '4. 펑션 콜링 (Function Calling)', detail: 'AI가 계산기, 날씨 API, DB 조회 등 실제 시스템 코드를 직접 실행' },
            { title: '5. 랭체인 (LangChain)', detail: '모델 선언부만 바꾸면 GPT↔Claude↔Gemini를 자유자재로 교체하는 표준 프레임워크' },
            { title: '6. 랭그래프 (LangGraph)', detail: '다양한 역할을 가진 복수 AI들을 결합하여 멀티 에이전트 워크플로우 제어' }
          ]
        },
        {
          secTitle: '2. 실무 관점의 핵심: AI 3개 이상 조합 (Mix & Match) & 라우팅',
          icon: '🧩',
          desc: '단일 모델에 의존하지 않고 각 모델의 장점을 결합하여 비용과 성능을 최적화합니다.',
          cards: [
            { title: '기획 / 실시간 검색', detail: 'Perplexity, Gemini (웹 검색 및 대용량 컨텍스트 처리에 강력)' },
            { title: '코드 작성 / 정교한 추론', detail: 'Claude (문맥 유지력과 코딩 생성 능력이 최고 수준)' },
            { title: '단순 파싱 / 저비용 처리', detail: 'Llama, Qwen, Mini/Flash 계열 (빠르고 비용이 저렴한 SLM)' }
          ],
          note: '컨텍스트가 길어질 때의 정보 손실(Lost in the Middle)과 비용 폭탄을 방어하기 위해 똑똑한 모델 라우팅이 필수적입니다.'
        },
        {
          secTitle: '3. 분산 저장 (Distributed Storage): "보물지도 조각내어 나눠 보관하기"',
          icon: '🗺️',
          desc: '중요한 보물지도를 4조각으로 나누어 친구들에게 나눠 보관하면 안전하고 유실되지 않습니다.',
          cards: [
            { title: '1. 안전성 (복제)', detail: '컴퓨터 한두 대가 고장 나도 다른 곳에 복사본이 있어 데이터 손실 없음' },
            { title: '2. 무한한 확장성', detail: '비싼 슈퍼컴퓨터 대신 저렴한 일반 서버를 옆에 계속 추가 연결' },
            { title: '3. 빠른 속도 (병렬 처리)', detail: '1명이 100MB를 보내는 것보다 10명이 10MB씩 동시에 나눠 보내는 것이 빠름' }
          ],
          table: {
            headers: ['핵심 작동 방식', '설명', '실제 대표 기술'],
            rows: [
              ['샤딩 (Sharding)', '큰 데이터를 작은 조각 단위로 쪼개는 작업', 'Hadoop, HDFS'],
              ['복제 (Replication)', '장애에 대비해 2~3곳 이상의 서버에 동일 복사본 보관', 'AWS S3, Google Cloud Storage'],
              ['합의 알고리즘 (Consensus)', '여러 컴퓨터가 동일한 데이터를 올바르게 유지하는지 상호 검증', 'IPFS (Web3 분산 네트워크)']
            ]
          }
        },
        {
          isPractice: true,
          practiceTitle: 'LLM 펑션 콜링 & 스마트 모델 라우터 파이썬 실습',
          secTitle: '4. [실습] LLM 펑션 콜링 & 스마트 모델 라우팅 파이썬 시뮬레이션',
          icon: '⚡',
          desc: '질문의 난이도와 목적에 따라 저비용 모델(Flash)과 정밀 추론 모델(GPT-4o)로 자동 분기하는 라우팅 실습 코드입니다.',
          code: `# =========================================================
# 🤖 [실무 실습] 비용 최적화 스마트 AI 라우터 시뮬레이션
# =========================================================

def smart_ai_router(user_query: str):
    """
    쿼리의 복잡도에 따라 최적의 AI 모델을 자동 선택(라우팅)하는 파이프라인
    """
    # 1. 단순 질의 / 인사 / FAQ -> 저비용 고속 모델(SLM)
    simple_keywords = ["안녕", "시간", "날씨", "요약해줘"]
    is_simple = any(k in user_query for k in simple_keywords)
    
    if is_simple and len(user_query) < 30:
        model_name = "gpt-4o-mini (저비용 초고속 SLM)"
        estimated_cost = "0.001$"
    else:
        model_name = "gpt-4o / Claude 3.5 Sonnet (고성능 추론)"
        estimated_cost = "0.03$"
        
    return {
        "query": user_query,
        "selected_model": model_name,
        "estimated_cost": estimated_cost,
        "status": "라우팅 성공"
    }

# 실행 테스트
print(smart_ai_router("오늘 서울 날씨 어때?"))
print(smart_ai_router("코코넛사일로 5톤 트럭 룰 엔진의 예외 처리 아키텍처를 설계해줘."))`,
          summary: '실무에서는 모든 요청을 고가 모델에 던지지 않고, 룰 기반 라우팅을 거쳐 API 비용을 80% 이상 절감합니다.'
        }
      ]
    },
    {
      id: '0923',
      date: '09/23 (화)',
      badge: 'AI & STREAMLIT',
      title: '04장. PDF 문서를 읽고 요약해주는 AI 만들기 & Streamlit 웹 챗봇',
      subtitle: 'PyMuPDF 전처리 파이프라인, 프롬프트 엔지니어링, 원샷/퓨샷 비교, 멀티턴 대화 구현',
      tags: ['실습', 'PDF요약AI', 'Streamlit챗봇', '프롬프트', 'PyMuPDF'],
      sections: [
        {
          secTitle: '1. PDF 요약 AI의 핵심 구조 & 머신러닝 기초 비유',
          icon: '📄',
          desc: 'PDF 파일 입력 → 전처리(불필요 내용 제거) → AI 전달 → 포맷팅 요약 결과 TXT 저장 자동화',
          cards: [
            { title: '오차 확인 (Loss)', detail: '현재 AI 모델의 예측값과 실제 정답 사이의 오차를 나타내는 계곡 모양 지형' },
            { title: '기울기로 방향 결정 (미분)', detail: '오차가 줄어드는 가장 가파른 내리막길의 경사(기울기)를 계산' },
            { title: '가중치 자동 갱신', detail: '내리막 방향으로 파라미터를 조금씩 이동시켜 최적의 골짜기 바닥(오차 최소)에 도달' }
          ],
          note: '사람이 하던 [PDF 열기 → 읽기 → Header/Footer 제거 → 요약 → 저장] 작업을 100% 자동화'
        },
        {
          isPractice: true,
          practiceTitle: 'PyMuPDF 논문 여백 제거 및 본문 텍스트 추출 실습',
          secTitle: '2. PyMuPDF 전처리: Header / Footer 제거 및 clip 영역 지정',
          icon: '✂️',
          desc: 'PDF의 논문명, 페이지 번호 등 불필요한 노이즈를 제거하고 본문만 추출합니다.',
          code: `import pymupdf

# PDF 파일 열기
doc = pymupdf.open("research_paper.pdf")
full_text = ""

# 여백 제외 높이 설정 (상단 80, 하단 80 제외)
header_height = 80
footer_height = 80

for page in doc:
    # page.rect: 전체 페이지 크기 확인
    rect = page.rect
    clip_area = pymupdf.Rect(rect.x0, rect.y0 + header_height, rect.x1, rect.y1 - footer_height)
    
    # clip 영역 안의 본문 글자만 추출
    text = page.get_text(clip=clip_area)
    full_text += text + "\\n------------------------------------\\n"

# UTF-8 텍스트 파일로 저장
with open("extracted_clean.txt", "w", encoding="utf-8") as f:
    f.write(full_text)`,
          summary: '페이지 구분자(----)를 넣어 AI가 문맥의 단락과 페이지 경계를 정확히 인지하도록 돕습니다.'
        },
        {
          isPractice: true,
          practiceTitle: 'OpenAI API 학술 논문 자동 요약 파이프라인 실습',
          secTitle: '3. OpenAI API 연동 & 프롬프트 엔지니어링 (3개 함수 파이프라인)',
          icon: '🔗',
          desc: 'pdf_to_text() → summarize_txt() → summarize_pdf()로 연결되는 자동화 파이프라인',
          code: `from openai import OpenAI

def summarize_pdf(pdf_path, api_key):
    client = OpenAI(api_key=api_key)
    
    # 1단계: PDF 읽고 전처리
    text = pdf_to_text(pdf_path)
    
    # 2단계: 프롬프트 구성 및 OpenAI 요약 (temperature=0.1로 사실 충실도 극대화)
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.1,  # 논문 요약이므로 창작을 억제하고 원문에 충실
        messages=[
            {"role": "system", "content": "너는 학술 논문 전문 요약 봇이다. 저자의 문제 인식과 주장을 명확히 정리하라."},
            {"role": "user", "content": f"다음 문서를 # 제목, ## 저자 주장, ## 주요 내용 형식으로 요약해줘:\\n\\n{text}"}
        ]
    )
    
    # 3단계: 결과 파일 저장
    summary = response.choices[0].message.content
    with open("summary_result.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    return summary`,
          summary: '회사에서 100개의 논문/보고서를 1분 만에 일괄 요약 정리할 수 있는 구조입니다.'
        },
        {
          secTitle: '4. 원샷(One-shot) vs 퓨샷(Few-shot) 프롬프팅 상세 비교',
          icon: '🦆',
          desc: 'AI에게 원하는 답변 패턴과 형식을 예시로 주입하는 기법입니다.',
          table: {
            headers: ['구분', '원샷 프롬프팅 (One-shot)', '퓨샷 프롬프팅 (Few-shot)'],
            rows: [
              ['예시 개수', '1개 제공', '여러 개(3~5개 이상) 제공'],
              ['목적', '간단하고 빠른 패턴 전달', '복잡하거나 명확한 기업 전용 CS 답변 스타일 전달'],
              ['예시', '참새 → 짹짹 / 오리 → ? (꽥꽥)', '참새→짹짹, 말→히이잉, 개구리→개굴개굴 / 오리 → ?'],
              ['실무 활용', '고객센터 단답형 규격 안내', '환불/배송/파손 등 복합 유형별 맞춤 CS 상담 톤 앤 매너']
            ]
          },
          summary: '원샷은 "예시 하나 보여줄게", 퓨샷은 "여러 사례를 보여줄 테니 공통 패턴을 맞춰봐"의 의미입니다.'
        },
        {
          isPractice: true,
          practiceTitle: 'Streamlit 멀티턴 대화형 웹 챗봇 구현 실습',
          secTitle: '5. 멀티턴(Multi-turn) 대화 & AI 기억의 원리 & Streamlit 웹 챗봇',
          icon: '💬',
          desc: 'AI는 스스로 기억하는 것이 아니라, 프로그램이 messages 대화 기록을 누적하여 전달하는 구조입니다.',
          code: `# Streamlit을 활용한 멀티턴 웹 챗봇 핵심 코드
import streamlit as st
from openai import OpenAI

st.title("🤖 AI 어시스턴트 챗봇")

# 세션 상태에 대화 기록 초기화
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "system", "content": "너는 친절한 전문 상담사야."}
    ]

# 이전 대화 내용 화면에 출력
for msg in st.session_state.messages[1:]:
    st.chat_message(msg["role"]).write(msg["content"])

# 사용자 입력 처리
if prompt := st.chat_input("질문을 입력하세요"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)

    # 이전 대화 기록 전체(messages)를 AI에 전달하여 문맥 유지
    client = OpenAI(api_key="sk-...")
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=st.session_state.messages
    )
    ai_reply = response.choices[0].message.content

    st.session_state.messages.append({"role": "assistant", "content": ai_reply})
    st.chat_message("assistant").write(ai_reply)`,
          summary: '쳇봇 로컬 접속 주소: http://localhost:8501'
        }
      ]
    },
    {
      id: '0922',
      date: '09/22 (월)',
      badge: 'SECURITY & SETUP',
      title: '.env 환경변수 보안 · 가상환경(venv) 3단계 · GPT API 시작하기',
      subtitle: '비밀 금고(.env), VS Code & PowerShell 권한 잠금 해제, get_basic.py 호출, 웹 전체 계층 구조',
      tags: ['실습', '환경변수보안', 'GPT-API', '개발환경', '웹구조'],
      sections: [
        {
          secTitle: '1. .env(이앤브이)와 보안: "안방 금고 속 비밀 쪽지"',
          icon: '🔐',
          desc: 'GitHub에 API Key가 노출되면 해커들에 의해 수백만 원의 과금 폭탄이 발생합니다.',
          cards: [
            { title: '일반 코드 파일 (main.py)', detail: '거실 벽에 걸어둔 게시판 (누구나 지나가며 볼 수 있는 오픈 공간)' },
            { title: '.env 파일', detail: '안방 옷장 깊숙한 곳의 비밀 금고 (API Key, DB 비밀번호만 보관)' },
            { title: 'PM의 한마디', detail: '"API 키는 프론트에 노출하지 말고 .env 환경변수로 빼서 백엔드에서 안전하게 처리해 주세요."' }
          ],
          note: '.gitignore에 .env, .venv, venv/를 반드시 등록하여 깃허브 업로드를 원천 차단합니다.'
        },
        {
          isPractice: true,
          practiceTitle: '가상환경(venv) 구축 및 PowerShell 권한 해제 실습',
          secTitle: '2. 가상환경(venv) 세팅 & PowerShell 권한 에러 해결',
          icon: '🎒',
          desc: '프로젝트마다 패키지가 충돌하지 않도록 전용 가방을 만들고 실행 권한을 엽니다.',
          code: `# 1단계: 가상환경 가방 만들기
python -m venv venv

# 2단계: 가상환경 활성화 (가방 메기)
.\\venv\\Scripts\\Activate
# 정상 동작 시 프롬프트 앞에 (venv) 가 표시됨

# 🚨 빨간색 권한 에러(Restricted) 발생 시 윈도우 잠금 해제 (관리자 권한 PowerShell에서 1회 실행)
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
# 물어보면 'Y' 입력 후 엔터`,
          summary: '가상환경은 레고 상자와 미니카 상자를 따로 담아두어 부품이 섞이지 않게 하는 원리입니다.'
        },
        {
          isPractice: true,
          practiceTitle: 'Python GPT-4o API 호출 및 토큰 추적 기본 실습',
          secTitle: '3. GPT API 기본 호출 코드 & 핵심 파라미터 (get_basic.py)',
          icon: '🤖',
          desc: 'OpenAI API 키를 발급받아 내 컴퓨터에서 파이썬 코드로 GPT 호출하기',
          code: `import os
from dotenv import load_dotenv
from openai import OpenAI

# 1. .env 파일에서 API 키 로드
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 2. 모델 호출 및 파라미터 설정
response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.1,  # 0에 가까울수록 사실적/일관된 답변, 1~2는 창의적 답변
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "2022년 월드컵 우승팀은 어디야?"}
    ]
)

# 3. 순수 답변 텍스트만 추출
print(response.choices[0].message.content)
# 토큰 사용량 확인 (과금 기준): response.usage.total_tokens`,
          summary: 'choices[0].message.content 형태로 답변을 추출하며, usage를 통해 소모 토큰을 추적합니다.'
        },
        {
          secTitle: '4. 프론트엔드 · Python 백엔드 · DB · AI API 전체 웹 구조',
          icon: '🌐',
          desc: '웹 서비스의 각 계층이 왜 필요한지 명확한 역할 분리를 이해합니다.',
          cards: [
            { title: '프론트엔드 (React)', detail: '사용자가 보고 조작하는 UI 화면, 대화창, 입력 폼 구현' },
            { title: 'Python (FastAPI)', detail: '로그인 인증, 권한 확인, DB 쿼리, API Key 보호, 외부 AI 호출' },
            { title: 'Database', detail: '회원 정보, 거래 내역, 대화 기록을 안전하게 격리 보관' },
            { title: '외부 / AI API', detail: 'ChatGPT, Gemini, 네이버/카카오 OAuth 소셜 로그인 연동' }
          ]
        }
      ]
    }
  ];

  // 현재 필터 상태
  let currentFilter = {
    date: '1006',
    keyword: '',
    tag: 'all'
  };

  // 렌더링 함수
  function renderLogs() {
    let filtered = logsData;
    const kw = currentFilter.keyword.trim().toLowerCase();
    const isPracticeFilter = currentFilter.date === 'practice' || currentFilter.tag === '실습' || kw === '실습';

    // 1. 날짜 필터 (실습 모드 아닐 때)
    if (currentFilter.date !== 'all' && currentFilter.date !== 'practice') {
      filtered = filtered.filter(item => item.id === currentFilter.date);
    }

    // 2. 태그 필터 (실습 태그 아닐 때)
    if (currentFilter.tag !== 'all' && currentFilter.tag !== '실습') {
      filtered = filtered.filter(item => item.tags.includes(currentFilter.tag));
    }

    // 3. 키워드 검색 필터 (일반 검색어)
    if (kw !== '' && kw !== '실습') {
      filtered = filtered.map(item => {
        const itemStr = (item.title + ' ' + item.subtitle + ' ' + item.tags.join(' ')).toLowerCase();
        if (itemStr.includes(kw)) return item;

        // 섹션 내부에 키워드가 포함된 것만 추출
        const matchedSecs = item.sections.filter(sec => {
          const secStr = JSON.stringify(sec).toLowerCase();
          return secStr.includes(kw);
        });

        if (matchedSecs.length > 0) {
          return { ...item, sections: matchedSecs };
        }
        return null;
      }).filter(Boolean);
    }

    // 4. 실습 모드일 때: 각 날짜에서 실습(isPractice === true 또는 code 보유) 섹션만 추출
    if (isPracticeFilter) {
      filtered = filtered.map(item => {
        const practiceSecs = item.sections.filter(sec => sec.isPractice || (sec.code && sec.code.trim().length > 0));
        return practiceSecs.length > 0 ? { ...item, sections: practiceSecs } : null;
      }).filter(Boolean);
    }

    // 검색 결과가 없는 경우
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="daily-empty">
          <div class="daily-empty__icon">🔍</div>
          <h3>일치하는 실습 또는 학습 내용이 없습니다</h3>
          <p>검색어나 필터 조건을 변경해 보세요.</p>
          <button type="button" class="daily-pill" id="resetFiltersBtn">모든 조건 초기화</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetFiltersBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          currentFilter = { date: 'all', keyword: '', tag: 'all' };
          syncUI();
          renderLogs();
        });
      }
      return;
    }

    // 총 실습 섹션 개수 카운트
    const totalPracticeCount = filtered.reduce((acc, log) => {
      return acc + log.sections.filter(s => s.isPractice || s.code).length;
    }, 0);

    // 실습 모아보기 배너
    let practiceBannerHtml = '';
    if (isPracticeFilter) {
      practiceBannerHtml = `
        <div class="daily-practice-summary-bar">
          <div class="daily-practice-summary-icon">🧪</div>
          <div class="daily-practice-summary-text">
            <strong>실습(Hands-on Lab) 전용 모아보기 활성화</strong>
            <span>전체 학습 과정 중 총 <strong>${totalPracticeCount}개</strong>의 실무 실습 섹션을 찾았습니다. 모든 실습 코드가 펼쳐져 있습니다.</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = practiceBannerHtml + filtered.map(log => `
      <article class="daily-card" id="log-${log.id}">
        <!-- 상단 헤더 바 -->
        <div class="daily-card__head">
          <div class="daily-card__meta">
            <span class="daily-card__badge">${log.badge}</span>
            <span class="daily-card__date">${log.date}</span>
          </div>
          <div class="daily-card__tags">
            ${log.tags.map(t => `<span class="daily-card__tag ${t === '실습' ? 'daily-tag--practice' : ''}">#${t}</span>`).join('')}
          </div>
        </div>

        <h3 class="daily-card__title">${log.title}</h3>
        <p class="daily-card__sub">${log.subtitle}</p>

        <!-- 세부 섹션 목록 -->
        <div class="daily-card__sections">
          ${log.sections.map((sec, secIdx) => {
            const isPractice = sec.isPractice || (sec.code && sec.code.trim().length > 0);
            return `
            <div class="daily-sec is-open ${isPractice ? 'daily-sec--practice-card' : ''}" data-sec="${secIdx}">
              <!-- 섹션 토글 헤더 -->
              <button type="button" class="daily-sec__toggle ${isPractice ? 'daily-sec__toggle--practice' : ''}">
                <span class="daily-sec__icon">${isPractice ? '🧪' : (sec.icon || '📌')}</span>
                ${isPractice ? `
                  <h2 class="daily-sec__h2">
                    <span class="daily-practice-badge">실습</span>
                    <span>${escapeHtml(sec.practiceTitle || sec.secTitle)}</span>
                  </h2>
                ` : `
                  <span class="daily-sec__name">${escapeHtml(sec.secTitle)}</span>
                `}
                <span class="daily-sec__arrow">▾</span>
              </button>

              <div class="daily-sec__body">
                <!-- 실습 공식 h2 헤더 배너 (요구사항: 따로 '실습' 이라고 h2로 제목을 걸기) -->
                ${isPractice ? `
                  <div class="daily-practice-banner">
                    <div class="daily-practice-banner__top">
                      <h2 class="daily-practice-h2">🧪 실습</h2>
                      <span class="daily-practice-badge-sub">Hands-on Lab</span>
                    </div>
                    <p class="daily-practice-title-sub">
                      <strong>실습 주제:</strong> ${escapeHtml(sec.practiceTitle || sec.secTitle)}
                    </p>
                  </div>
                ` : ''}

                ${sec.desc ? `<p class="daily-sec__desc">${sec.desc}</p>` : ''}

                <!-- 카드 리스트 그리드 -->
                ${sec.cards ? `
                  <div class="daily-mini-grid">
                    ${sec.cards.map(c => `
                      <div class="daily-mini-card">
                        <h4>${c.title}</h4>
                        <p>${c.detail}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- 코드 블록 (실습 코드) -->
                ${sec.code ? `
                  <div class="daily-code-wrap">
                    <div class="daily-code-header">
                      <span class="daily-code-lang">${isPractice ? '🧪 PYTHON / LAB CODE' : 'PYTHON / BASH'}</span>
                      <button type="button" class="daily-copy-btn">📋 코드 복사</button>
                    </div>
                    <pre class="code-block"><code>${escapeHtml(sec.code)}</code></pre>
                  </div>
                ` : ''}

                <!-- 비교 표 -->
                ${sec.table ? `
                  <div class="daily-table-wrap">
                    <table class="daily-table">
                      <thead>
                        <tr>
                          ${sec.table.headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${sec.table.rows.map(row => `
                          <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}

                ${sec.summary ? `<div class="daily-sec__summary">💡 <strong>핵심 요점:</strong> ${sec.summary}</div>` : ''}
                ${sec.note ? `<div class="daily-sec__note">${sec.note}</div>` : ''}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </article>
    `).join('');

    // 아코디언 토글 이벤트 바인딩
    container.querySelectorAll('.daily-sec__toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.closest('.daily-sec');
        sec.classList.toggle('is-open');
      });
    });

    // 코드 복사 버튼 이벤트 바인딩
    container.querySelectorAll('.daily-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.daily-code-wrap').querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
          const prev = btn.textContent;
          btn.textContent = '✅ 복사 완료!';
          btn.classList.add('is-copied');
          setTimeout(() => {
            btn.textContent = prev;
            btn.classList.remove('is-copied');
          }, 2000);
        });
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // UI 상태 동기화
  function syncUI() {
    if (dateSelect) dateSelect.value = currentFilter.date;

    pills.forEach(p => {
      p.classList.toggle('is-active', p.dataset.date === currentFilter.date);
    });

    tags.forEach(t => {
      t.classList.toggle('is-active', t.dataset.tag === currentFilter.tag);
    });

    if (searchInput) searchInput.value = currentFilter.keyword;
  }

  // 이벤트 바인딩: 드롭다운 폼
  if (dateSelect) {
    dateSelect.addEventListener('change', (e) => {
      currentFilter.date = e.target.value;
      if (e.target.value === 'practice') {
        currentFilter.tag = '실습';
      }
      syncUI();
      renderLogs();
    });
  }

  // 이벤트 바인딩: 빠른 날짜 및 실습 모아보기 알약 버튼들
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      currentFilter.date = pill.dataset.date;
      if (pill.dataset.date === 'practice') {
        currentFilter.tag = '실습';
      } else {
        if (currentFilter.tag === '실습') currentFilter.tag = 'all';
      }
      syncUI();
      renderLogs();
    });
  });

  // 이벤트 바인딩: 태그 버튼들
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      currentFilter.tag = tag.dataset.tag;
      if (tag.dataset.tag === '실습') {
        currentFilter.date = 'practice';
      } else {
        if (currentFilter.date === 'practice') currentFilter.date = 'all';
      }
      syncUI();
      renderLogs();
    });
  });

  // 이벤트 바인딩: 실시간 검색 폼
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilter.keyword = e.target.value;
      renderLogs();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      currentFilter.keyword = '';
      if (searchInput) searchInput.value = '';
      renderLogs();
    });
  }

  // 초기 렌더링
  syncUI();
  renderLogs();
})();