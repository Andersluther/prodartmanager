// Pro Dart Manager — interaktiv kampskærm (sigte, sving, kast, AI-modstander, caller)
(function (G) {
  'use strict';
  const E = G.DartEngine;
  const D = G.DartData;
  const SEG = E.SEG;
  const VIEW_R = 228; // mm synligt fra centrum

  const settings = (() => {
    try { return Object.assign({ caller: true, speed: 1 }, JSON.parse(localStorage.getItem('pdm-settings') || '{}')); }
    catch (e) { return { caller: true, speed: 1 }; }
  })();
  function saveSettings() { try { localStorage.setItem('pdm-settings', JSON.stringify(settings)); } catch (e) {} }

  function say(text) {
    if (!settings.caller || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = 0.95;
      u.pitch = 0.9;
      const v = speechSynthesis.getVoices().find((x) => x.lang === 'en-GB');
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  const flag = (nat) => (D.NATIONS[nat] ? D.NATIONS[nat].flag : '🏳️');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function drawBoard(ctx, size) {
    const sc = size / 2 / VIEW_R, cx = size / 2, cy = size / 2;
    ctx.clearRect(0, 0, size, size);
    // ydre ring med tal
    ctx.beginPath(); ctx.arc(cx, cy, 226 * sc, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
    const ring = (r0, r1, colorFn) => {
      for (let i = 0; i < 20; i++) {
        const c = (-90 + i * 18) * Math.PI / 180, a0 = c - Math.PI / 20, a1 = c + Math.PI / 20;
        ctx.beginPath();
        ctx.arc(cx, cy, r1 * sc, a0, a1);
        ctx.arc(cx, cy, r0 * sc, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = colorFn(i);
        ctx.fill();
      }
    };
    const dark = '#1b1b1b', cream = '#efe3c2', red = '#d6262f', green = '#0f8a4b';
    ring(E.BR.dIn, E.BR.dOut, (i) => (i % 2 ? green : red));
    ring(E.BR.tOut, E.BR.dIn, (i) => (i % 2 ? cream : dark));
    ring(E.BR.tIn, E.BR.tOut, (i) => (i % 2 ? green : red));
    ring(E.BR.obull, E.BR.tIn, (i) => (i % 2 ? cream : dark));
    ctx.beginPath(); ctx.arc(cx, cy, E.BR.obull * sc, 0, Math.PI * 2); ctx.fillStyle = green; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, E.BR.bull * sc, 0, Math.PI * 2); ctx.fillStyle = red; ctx.fill();
    // tråde
    ctx.strokeStyle = 'rgba(200,200,210,.55)'; ctx.lineWidth = Math.max(0.6, sc * 0.9);
    [E.BR.bull, E.BR.obull, E.BR.tIn, E.BR.tOut, E.BR.dIn, E.BR.dOut].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, r * sc, 0, Math.PI * 2); ctx.stroke(); });
    for (let i = 0; i < 20; i++) {
      const a = (-90 + i * 18 - 9) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * E.BR.obull * sc, cy + Math.sin(a) * E.BR.obull * sc);
      ctx.lineTo(cx + Math.cos(a) * E.BR.dOut * sc, cy + Math.sin(a) * E.BR.dOut * sc);
      ctx.stroke();
    }
    // tal
    ctx.fillStyle = '#f5f5f5';
    ctx.font = `700 ${Math.round(24 * sc)}px "Barlow Condensed", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 20; i++) {
      const a = (-90 + i * 18) * Math.PI / 180;
      ctx.fillText(String(SEG[i]), cx + Math.cos(a) * 198 * sc, cy + Math.sin(a) * 198 * sc);
    }
  }

  function open(cfg, onDone) {
    const root = document.createElement('div');
    root.className = 'match-screen';
    document.body.appendChild(root);
    document.body.classList.add('no-scroll');
    const P = [cfg.pA, cfg.pB];
    const human = cfg.human || [true, false];
    const m = new E.Match(cfg.pA, cfg.pB, { format: cfg.fmt, doubleIn: cfg.doubleIn, mods: cfg.mods, startScore: cfg.startScore || 501 });
    const sets = cfg.fmt.type === 'sets';
    const fmtTxt = sets ? `Best of ${cfg.fmt.target * 2 - 1} sets` : `Best of ${cfg.fmt.target * 2 - 1} legs`;

    root.innerHTML = `
      <div class="ms-top">
        <div class="ms-title"><b>${esc(cfg.title || 'Kamp')}</b><span>${esc(cfg.subtitle || '')} · ${fmtTxt}${cfg.doubleIn ? ' · Double-in' : ''}</span></div>
        <div class="ms-top-btns">
          <button class="btn ghost sm" data-act="caller">${settings.caller ? '🔊 Caller' : '🔇 Caller'}</button>
          <button class="btn ghost sm" data-act="help">❔ Sådan kaster du</button>
        </div>
      </div>
      <div class="ms-body">
        <div class="ms-left">
          <div class="scoreboard">
            <div class="sb-head"><span></span>${sets ? '<span>Sets</span>' : ''}<span>Legs</span><span></span></div>
            ${[0, 1].map((i) => `
              <div class="sb-row" data-i="${i}">
                <div class="sb-name"><span class="sb-arrow">▶</span><span class="flag">${flag(P[i].nat)}</span><div><b>${esc(P[i].name)}</b><small>${esc(P[i].nick || (human[i] ? 'Dig' : ''))}${human[i] ? ' · 🎯 dig' : ''}</small></div></div>
                ${sets ? '<div class="sb-num sb-sets">0</div>' : ''}
                <div class="sb-num sb-legs">0</div>
                <div class="sb-rem">501</div>
              </div>`).join('')}
          </div>
          <div class="ms-stats"></div>
          <div class="ms-log"></div>
        </div>
        <div class="ms-center"><div class="board-wrap"><canvas class="board-bg"></canvas><canvas class="board-fg"></canvas><div class="callout"></div></div></div>
        <div class="ms-right">
          <div class="panel visit-panel">
            <div class="vp-who"></div>
            <div class="vp-darts"><span></span><span></span><span></span></div>
            <div class="vp-total"></div>
            <div class="vp-hint"></div>
          </div>
          <div class="panel steady">
            <div class="steady-label">Ro på hånden</div>
            <div class="steady-bar"><div></div></div>
            <small>Hold musen/fingeren nede for at fokusere – slip for at kaste. Bedst ved den grønne zone; holder du for længe, begynder hånden at ryste.</small>
          </div>
          <div class="ms-actions">
            <button class="btn sm" data-act="auto">🤖 Auto-kast min tur</button>
            <button class="btn sm" data-act="simleg">⏩ Simulér leg</button>
            <button class="btn sm danger" data-act="simall">⏭ Simulér resten af kampen</button>
          </div>
        </div>
      </div>`;

    const bg = root.querySelector('.board-bg'), fg = root.querySelector('.board-fg');
    const wrap = root.querySelector('.board-wrap');
    const callout = root.querySelector('.callout');
    let size = 600, dpr = window.devicePixelRatio || 1, sc = 1;
    function resize() {
      const c = root.querySelector('.ms-center');
      const s = Math.floor(Math.max(260, Math.min(c.clientWidth - 8, c.clientHeight - 8)));
      size = s; sc = size / 2 / VIEW_R;
      wrap.style.width = wrap.style.height = s + 'px';
      [bg, fg].forEach((cv) => { cv.width = s * dpr; cv.height = s * dpr; cv.style.width = cv.style.height = s + 'px'; });
      const bctx = bg.getContext('2d');
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBoard(bctx, s);
    }
    const toPx = (x, y) => ({ x: size / 2 + x * sc, y: size / 2 - y * sc });
    const toMM = (px, py) => ({ x: (px - size / 2) / sc, y: -(py - size / 2) / sc });

    // ---------- tilstand ----------
    let aim = { x: 0, y: 103 }; // T20
    let holding = false, holdStart = 0, pointerIn = false, touchOffset = 0;
    let boardDarts = []; // {x,y,who}
    let aiTarget = null;
    let busy = false; // animation/pause
    let t0 = performance.now();
    const ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6, Math.random() * 6];
    let destroyed = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!destroyed) fn(); }, ms / (settings.speed || 1)); timers.push(id); };
    const log = [];

    function focusAt(th) {
      if (th < 0.6) return 1 - (th / 0.6) * 0.62;      // 1 -> 0.38
      if (th < 1.1) return 0.38;
      return Math.min(1.8, 0.38 + (th - 1.1) * 0.7);
    }
    function currentFocus() { return holding ? focusAt((performance.now() - holdStart) / 1000) : 1; }
    function humanTurn() { return !m.over && human[m.turn] && !busy; }

    function guessTarget() {
      const h = E.hitAt(aim.x, aim.y);
      return { n: h.n || 20, m: h.m === 2 ? 2 : h.m === 0 ? 1 : h.m };
    }
    function swayAmp() { return m.sigmaFor(guessTarget()) * 1.35; }
    function swayVec(t) {
      return {
        x: 0.7 * Math.sin(1.3 * t + ph[0]) + 0.3 * Math.sin(3.1 * t + ph[1]),
        y: 0.7 * Math.cos(1.05 * t + ph[2]) + 0.3 * Math.sin(2.7 * t + ph[3]),
      };
    }
    function displayedAim() {
      const t = (performance.now() - t0) / 1000;
      const a = swayAmp() * currentFocus();
      const v = swayVec(t);
      return { x: aim.x + v.x * a, y: aim.y + v.y * a };
    }

    // ---------- tegning ----------
    const fctx = fg.getContext('2d');
    function drawDart(x, y, who, fresh) {
      const p = toPx(x, y);
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.strokeStyle = 'rgba(0,0,0,.6)'; fctx.lineWidth = 3;
      fctx.beginPath(); fctx.moveTo(0, 0); fctx.lineTo(16, -20); fctx.stroke();
      fctx.strokeStyle = who === 0 ? '#38bdf8' : '#facc15'; fctx.lineWidth = 2;
      fctx.beginPath(); fctx.moveTo(0, 0); fctx.lineTo(16, -20); fctx.stroke();
      fctx.fillStyle = who === 0 ? '#38bdf8' : '#facc15';
      fctx.beginPath(); fctx.moveTo(16, -20); fctx.lineTo(25, -22); fctx.lineTo(19, -29); fctx.closePath(); fctx.fill();
      fctx.fillStyle = '#fff'; fctx.beginPath(); fctx.arc(0, 0, fresh ? 3 : 2.2, 0, Math.PI * 2); fctx.fill();
      fctx.restore();
    }
    function frame() {
      if (destroyed) return;
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.clearRect(0, 0, size, size);
      boardDarts.forEach((d, i) => drawDart(d.x, d.y, d.who, i === boardDarts.length - 1));
      if (aiTarget) {
        const p = toPx(aiTarget.x, aiTarget.y);
        fctx.strokeStyle = 'rgba(250,204,21,.9)'; fctx.lineWidth = 2;
        fctx.beginPath(); fctx.arc(p.x, p.y, 10, 0, Math.PI * 2); fctx.stroke();
      }
      const steadyBar = root.querySelector('.steady-bar div');
      if (humanTurn()) {
        const d = displayedAim();
        const p = toPx(d.x, d.y);
        const f = currentFocus();
        const amp = swayAmp();
        const r = Math.max(6, (amp * f * 0.75 + m.sigmaFor(guessTarget()) * 0.5) * sc);
        const good = holding && f < 0.5;
        fctx.strokeStyle = good ? 'rgba(74,222,128,.95)' : holding && f > 1 ? 'rgba(248,113,113,.95)' : 'rgba(255,255,255,.9)';
        fctx.lineWidth = 2;
        fctx.beginPath(); fctx.arc(p.x, p.y, r, 0, Math.PI * 2); fctx.stroke();
        fctx.beginPath();
        fctx.moveTo(p.x - r - 6, p.y); fctx.lineTo(p.x - 3, p.y); fctx.moveTo(p.x + 3, p.y); fctx.lineTo(p.x + r + 6, p.y);
        fctx.moveTo(p.x, p.y - r - 6); fctx.lineTo(p.x, p.y - 3); fctx.moveTo(p.x, p.y + 3); fctx.lineTo(p.x, p.y + r + 6);
        fctx.stroke();
        const lbl = E.hitAt(aim.x, aim.y);
        fctx.font = '600 13px system-ui'; fctx.fillStyle = '#fff'; fctx.textAlign = 'left';
        fctx.fillText(lbl.label === '25' ? 'Outer bull' : lbl.label, p.x + r + 8, p.y - r - 4);
        if (steadyBar) {
          const pct = holding ? Math.max(0, Math.min(1, (1.8 - f) / 1.42)) : 0;
          steadyBar.style.width = (pct * 100).toFixed(0) + '%';
          steadyBar.className = good ? 'good' : holding && f > 1 ? 'bad' : '';
        }
      } else if (steadyBar) steadyBar.style.width = '0%';
      requestAnimationFrame(frame);
    }

    // ---------- UI-opdatering ----------
    function updateBoard() {
      root.querySelectorAll('.sb-row').forEach((row) => {
        const i = +row.dataset.i;
        row.classList.toggle('active', m.turn === i && !m.over);
        row.querySelector('.sb-rem').textContent = m.needsDoubleIn(i) ? m.rem[i] : m.rem[i];
        row.querySelector('.sb-legs').textContent = m.legs[i];
        if (sets) row.querySelector('.sb-sets').textContent = m.sets[i];
      });
      const st = root.querySelector('.ms-stats');
      const rows = [
        ['3-dart snit', (s) => E.avg(s).toFixed(2)],
        ['Første 9', (s) => (s.first9darts ? (s.first9pts / s.first9darts * 3).toFixed(2) : '–')],
        ['180', (s) => s.t180], ['140+', (s) => s.t140], ['100+', (s) => s.t100],
        ['Checkout', (s) => (s.dblAtt ? `${E.coPct(s).toFixed(0)}% (${s.dblHit}/${s.dblAtt})` : '–')],
        ['Højeste CO', (s) => s.hiCo || '–'],
      ];
      st.innerHTML = `<table><tr><th></th><th>${esc(P[0].name.split(' ').slice(-1)[0])}</th><th>${esc(P[1].name.split(' ').slice(-1)[0])}</th></tr>${rows.map(([l, f]) => `<tr><td>${l}</td><td>${f(m.stats[0])}</td><td>${f(m.stats[1])}</td></tr>`).join('')}</table>`;
      root.querySelector('.ms-log').innerHTML = log.slice(0, 9).map((l) => `<div class="log-${l.who}">${l.html}</div>`).join('');
      // besøgspanel
      const i = m.turn;
      const vp = root.querySelector('.visit-panel');
      vp.querySelector('.vp-who').innerHTML = m.over ? 'Kampen er slut' : `${flag(P[i].nat)} <b>${esc(P[i].name)}</b> kaster ${human[i] ? '<span class="tag">din tur</span>' : ''}`;
      const ds = vp.querySelectorAll('.vp-darts span');
      ds.forEach((el, k) => { const d = m.visit.darts[k]; el.textContent = d ? d.hit.label : '·'; el.className = d ? 'on' : ''; });
      vp.querySelector('.vp-total').textContent = m.visit.score ? m.visit.score : '';
      let hint = '';
      if (m.needsDoubleIn()) hint = 'Double-in: start leget på en double';
      else {
        const route = E.checkoutRoute(m.rem[i], m.dartsLeft);
        if (route) hint = 'Checkout: <b>' + route.join(' · ') + '</b>';
        else if (m.rem[i] <= 170) hint = m.rem[i] > 1 ? 'Ingen checkout med ' + m.dartsLeft + ' pil(e) – stil op' : '';
      }
      vp.querySelector('.vp-hint').innerHTML = hint;
      root.querySelectorAll('[data-act="auto"]').forEach((b) => (b.disabled = !human[m.turn] || m.over || busy));
    }

    function showCallout(text, cls, ms) {
      callout.textContent = text;
      callout.className = 'callout show ' + (cls || '');
      later(() => (callout.className = 'callout'), ms || 1100);
    }

    function addLog(who, html) { log.unshift({ who, html }); }

    // ---------- kast ----------
    function registerThrow(x, y, viaAI) {
      const hit = E.hitAt(x, y);
      const who = m.turn;
      boardDarts.push({ x, y, who });
      const ev = m.throwDart(hit, { x, y });
      handleEvent(ev, who);
    }

    function handleEvent(ev, who) {
      updateBoard();
      if (ev.type === 'dart') { schedule(); return; }
      busy = true;
      const visitDarts = ev.darts || [];
      const labels = (visitDarts.length ? visitDarts : []).map((d) => d.hit.label).join(' ');
      if (ev.type === 'visit') {
        const s = ev.score;
        addLog(who, `${esc(P[who].name.split(' ').slice(-1)[0])}: <b>${s}</b> <small>${labels}</small>`);
        showCallout(s === 180 ? 'ONE HUNDRED AND EIGHTY!' : String(s), s === 180 ? 'big' : s >= 100 ? 'mid' : '', 1000);
        say(s === 0 ? 'No score' : s === 180 ? 'One hundred and eighty!' : String(s));
      } else if (ev.type === 'bust') {
        addLog(who, `${esc(P[who].name.split(' ').slice(-1)[0])}: <b class="neg">Bust</b> <small>${labels}</small>`);
        showCallout('BUST', 'bust', 1000);
        say('No score');
      } else if (ev.type === 'leg') {
        const what = ev.match ? 'the match' : ev.set ? 'the set' : 'the leg';
        addLog(who, `🎯 <b>${esc(P[who].name)}</b> checker <b>${ev.checkout}</b> ud (${ev.darts} pile)${ev.set ? ' – vinder sættet' : ''}`);
        showCallout(ev.match ? 'GAME SHOT – AND THE MATCH!' : `GAME SHOT · ${ev.checkout}`, 'big', ev.match ? 1800 : 1500);
        say(`Game shot, and ${what}!`);
        updateBoard();
      }
      const pause = ev.type === 'leg' ? 1700 : 1100;
      later(() => {
        boardDarts = [];
        busy = false;
        aiTarget = null;
        if (m.over) return finish();
        updateBoard();
        schedule();
      }, pause);
    }

    function schedule() {
      if (m.over || busy) return;
      if (!human[m.turn]) {
        busy = true;
        const th = m.aiThrow();
        const tp = E.targetPoint(th.target);
        aiTarget = tp;
        later(() => {
          aiTarget = null;
          busy = false;
          registerThrow(th.x, th.y, true);
        }, 520);
      }
    }

    function humanThrow() {
      if (!humanTurn()) return;
      const d = displayedAim();
      const s = m.sigmaFor(guessTarget()) * 0.5;
      const x = d.x + E.gauss() * s, y = d.y + E.gauss() * s * 1.1;
      holding = false;
      registerThrow(x, y, false);
    }

    function autoVisit() {
      if (!humanTurn()) return;
      const who = m.turn;
      const step = () => {
        if (m.over || m.turn !== who || busy) return;
        const th = m.aiThrow();
        registerThrow(th.x, th.y, true);
        if (!busy && m.turn === who) later(step, 380);
      };
      step();
    }

    function simLeg() {
      if (m.over) return;
      const legsBefore = m.legsTotal;
      let n = 0;
      while (!m.over && m.legsTotal === legsBefore && n < 5000) { const th = m.aiThrow(); m.throwDart(th.hit); n++; }
      boardDarts = []; busy = false; aiTarget = null;
      addLog(m.legStarter, '<i>Leg simuleret</i>');
      updateBoard();
      if (m.over) finish(); else schedule();
    }
    function simAll() {
      m.simulate(500000);
      timers.forEach(clearTimeout);
      busy = false;
      finish();
    }

    // ---------- input ----------
    function setAimFromEvent(e) {
      const r = fg.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top - touchOffset;
      aim = toMM(px, py);
    }
    fg.addEventListener('pointermove', (e) => { touchOffset = e.pointerType === 'touch' ? 60 : 0; setAimFromEvent(e); pointerIn = true; });
    fg.addEventListener('pointerdown', (e) => {
      if (!humanTurn()) return;
      e.preventDefault();
      touchOffset = e.pointerType === 'touch' ? 60 : 0;
      setAimFromEvent(e);
      fg.setPointerCapture(e.pointerId);
      holding = true; holdStart = performance.now();
    });
    fg.addEventListener('pointerup', (e) => { if (holding) { setAimFromEvent(e); humanThrow(); } });
    fg.addEventListener('pointercancel', () => { holding = false; });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      if (a === 'auto') autoVisit();
      if (a === 'simleg') simLeg();
      if (a === 'simall') { if (confirm('Simulér resten af kampen?')) simAll(); }
      if (a === 'caller') { settings.caller = !settings.caller; saveSettings(); b.textContent = settings.caller ? '🔊 Caller' : '🔇 Caller'; }
      if (a === 'help') alert('Sådan kaster du:\n\n1. Flyt musen hen over det felt, du sigter efter (T20, D16 osv.).\n2. Sigtekornet svajer – jo dårligere spiller, træthed og pres, jo mere.\n3. Hold venstre museknap nede: hånden falder til ro, og cirklen bliver grøn.\n4. Slip i det grønne vindue for at kaste. Holder du for længe, begynder hånden at ryste (rød).\n\nPå mobil/tablet: sæt fingeren på skiven, træk for at sigte (sigtekornet sidder lidt over fingeren), og slip for at kaste.');
    });
    const onKey = (e) => {
      if (e.key === 'Escape') return;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);

    function finish() {
      const res = {
        w: m.winner, score: m.resultString(),
        st: m.stats.map((s) => ({ avg: +E.avg(s).toFixed(2), co: +E.coPct(s).toFixed(1), t180: s.t180, hiCo: s.hiCo, legs: s.legs, dblHit: s.dblHit, dblAtt: s.dblAtt, t140: s.t140, t100: s.t100, best: s.best, f9: s.first9darts ? s.first9pts / s.first9darts * 3 : 0 })),
      };
      const W = P[res.w];
      const ov = document.createElement('div');
      ov.className = 'ms-result';
      const row = (l, f) => `<tr><td>${f(res.st[0])}</td><th>${l}</th><td>${f(res.st[1])}</td></tr>`;
      ov.innerHTML = `<div class="card">
        <div class="res-kicker">${esc(cfg.title || '')}</div>
        <h2>${flag(W.nat)} ${esc(W.name)} vinder</h2>
        <div class="res-score"><span>${esc(P[0].name)}</span><b>${sets ? m.sets[0] : m.legs[0]} – ${sets ? m.sets[1] : m.legs[1]}</b><span>${esc(P[1].name)}</span></div>
        <table class="res-table">
          ${row('3-dart snit', (s) => s.avg.toFixed(2))}
          ${row('Første 9 snit', (s) => s.f9.toFixed(2))}
          ${row('180', (s) => s.t180)}
          ${row('140+', (s) => s.t140)}
          ${row('100+', (s) => s.t100)}
          ${row('Checkout %', (s) => s.dblAtt ? s.co.toFixed(1) + '% (' + s.dblHit + '/' + s.dblAtt + ')' : '–')}
          ${row('Højeste checkout', (s) => s.hiCo || '–')}
          ${row('Bedste leg (pile)', (s) => s.best || '–')}
        </table>
        <button class="btn primary" data-close>Fortsæt</button></div>`;
      root.appendChild(ov);
      if (human.some(Boolean)) say(`${W.name} wins the match`);
      ov.querySelector('[data-close]').onclick = () => {
        destroy();
        onDone && onDone(res);
      };
    }

    function destroy() {
      destroyed = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      try { speechSynthesis.cancel(); } catch (e) {}
      root.remove();
      document.body.classList.remove('no-scroll');
    }

    requestAnimationFrame(() => {
      resize();
      updateBoard();
      const st = m.turn;
      addLog(st, `${esc(P[st].name)} starter. ${cfg.doubleIn ? 'Double-in!' : 'Game on!'}`);
      updateBoard();
      say("Game on!");
      frame();
      later(schedule, 900);
    });
    return { destroy };
  }

  G.MatchScreen = { open, drawBoard, settings, saveSettings };
})(window);
