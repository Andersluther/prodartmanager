// Pro Dart Manager — skærme: menu, hurtig kamp, turneringsmode, karriere
(function (G) {
  'use strict';
  const D = G.DartData, E = G.DartEngine, W = G.DartWorld;
  const { World, ATTRS, ATTR_DA, STAFF, ovr, expAvg, fmtMoney } = W;
  const app = document.getElementById('app');
  const SAVE_KEY = 'pdm-career-v1';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const flag = (nat) => (D.NATIONS[nat] ? D.NATIONS[nat].flag : '🏳️');
  const natName = (nat) => (D.NATIONS[nat] ? D.NATIONS[nat].name : nat);

  let career = null; // World
  let dbWorld = null; // til hurtig kamp / database
  function db() { return dbWorld || (dbWorld = World.create({ mode: 'db' })); }

  // ---------- gem ----------
  function save() {
    if (!career) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(career.s)); }
    catch (e) { toast('Kunne ikke gemme: ' + e.message, 'bad'); }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return new World(JSON.parse(raw));
    } catch (e) { return null; }
  }

  function toast(msg, cls) {
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3800);
  }

  function modal(html, onMount) {
    const ov = document.createElement('div');
    ov.className = 'modal';
    ov.innerHTML = `<div class="modal-card"><button class="modal-x" aria-label="Luk">✕</button>${html}</div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('.modal-x')) close(); });
    onMount && onMount(ov, close);
    return close;
  }

  function attrBar(k, v) {
    const c = v >= 88 ? 'a5' : v >= 80 ? 'a4' : v >= 70 ? 'a3' : v >= 58 ? 'a2' : 'a1';
    return `<div class="attr"><span>${ATTR_DA[k]}</span><div class="bar"><div class="${c}" style="width:${v}%"></div></div><b>${Math.floor(v)}</b></div>`;
  }
  function stars(pot) {
    const n = Math.max(0.5, Math.min(5, (pot - 50) / 9));
    let s = '';
    for (let i = 1; i <= 5; i++) s += n >= i ? '★' : n >= i - 0.5 ? '⯪' : '☆';
    return `<span class="stars" title="Potentiale">${s}</span>`;
  }
  function ovrBadge(p) {
    const o = Math.round(ovr(p));
    return `<span class="ovr ${o >= 86 ? 'o5' : o >= 80 ? 'o4' : o >= 72 ? 'o3' : o >= 62 ? 'o2' : 'o1'}">${o}</span>`;
  }
  function pName(p, w) {
    if (!p) return '<i>Bye</i>';
    const own = w && w.isStable(p.id);
    return `<span class="pn ${own ? 'own' : ''}" data-pid="${p.id}">${flag(p.nat)} ${esc(p.name)}</span>`;
  }

  function playerModal(w, id) {
    const p = w.s.players[id];
    const age = w.s.season - p.born;
    const rk = w.rankOf(id);
    const seasons = Object.keys(p.earn).sort().reverse();
    modal(`
      <div class="pm-head">${G.Avatar.head(p, 72)}${ovrBadge(p)}<div><h2>${flag(p.nat)} ${esc(p.name)}</h2><div class="muted">${p.nick ? '“' + esc(p.nick) + '” · ' : ''}${natName(p.nat)} · ${age} år ${stars(p.pot)}</div></div></div>
      <div class="pm-grid">
        <div>${ATTRS.map((k) => attrBar(k, p.attr[k])).join('')}
          <div class="muted small" style="margin-top:8px">Forventet 3-dart snit: <b>${expAvg(p).toFixed(1)}</b></div></div>
        <div class="kv">
          <div><span>Order of Merit</span><b>${rk ? '#' + rk : '–'}</b></div>
          <div><span>Ranglistepenge</span><b>${fmtMoney(w.oom(p))}</b></div>
          <div><span>Tourkort</span><b>${w.hasCard(p) ? 'Til og med ' + p.tourCard : 'Nej'}</b></div>
          <div><span>Kampe (V-T)</span><b>${p.wl[0]}-${p.wl[1]}</b></div>
          <div><span>Bedste snit</span><b>${p.best.avg ? p.best.avg.toFixed(2) : '–'}</b></div>
          <div><span>Højeste checkout</span><b>${p.best.co || '–'}</b></div>
        </div>
      </div>
      <h3>Titler (${p.titles.length})</h3>
      <div class="titles">${p.titles.length ? p.titles.slice().reverse().map((t) => `<span class="chip ${t.tier === 'VM' || t.tier === 'Major' ? 'gold' : ''}">${t.season} · ${esc(t.name)}</span>`).join('') : '<span class="muted">Ingen titler i spillet endnu</span>'}</div>
      ${seasons.length ? `<h3>Præmiepenge</h3><table class="tbl"><tr><th>Sæson</th><th>Rangeret</th><th>Pro Tour</th><th>Challenge</th></tr>${seasons.map((s) => `<tr><td>${s}</td><td>${fmtMoney(p.earn[s].total)}</td><td>${fmtMoney(p.earn[s].pro)}</td><td>${fmtMoney(p.earn[s].ct)}</td></tr>`).join('')}</table>` : ''}
    `);
  }

  document.addEventListener('click', (e) => {
    const pn = e.target.closest('.pn[data-pid]');
    if (pn && !e.target.closest('.modal')) {
      const w = currentWorld();
      if (w && w.s.players[pn.dataset.pid]) playerModal(w, pn.dataset.pid);
    }
  });
  let activeWorld = null;
  const currentWorld = () => activeWorld;

  function header(extra) {
    return `<header class="topbar"><a class="logo" href="#" data-go="home"><span class="logo-dart">🎯</span><span>PRO DART <b>MANAGER</b></span></a><div class="topbar-extra">${extra || ''}</div></header>`;
  }
  function bindGo(el) {
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const g = b.dataset.go;
      if (g === 'home') home();
      if (g === 'quick') quick();
      if (g === 'tour') tournaments();
      if (g === 'career') { career = career || load(); career ? hub() : careerNew(); }
      if (g === 'newcareer') careerNew();
      if (g === 'db') database();
    }));
  }

  // ================= HJEM =================
  function home() {
    activeWorld = null;
    const saved = career || load();
    app.innerHTML = header() + `
      <main class="home">
        <section class="hero">
          <div class="hero-text">
            <div class="kicker">Manager + skydespil i én</div>
            <h1>Fra Q-School til<br><span>Alexandra Palace</span></h1>
            <p>Kast selv hver pil med et sigte, der svajer efter spillerens evner, nerver og træthed – eller led en stald af spillere gennem en hel PDC-sæson med træning, økonomi, ranglister og rigtige turneringer.</p>
            <div class="hero-btns">
              ${saved ? `<button class="btn primary lg" data-go="career">▶ Fortsæt karriere <small>${esc(saved.s.manager)} · sæson ${saved.s.season}, uge ${saved.s.week}</small></button>` : `<button class="btn primary lg" data-go="newcareer">★ Start karriere</button>`}
              ${saved ? '<button class="btn lg" data-go="newcareer">Ny karriere</button>' : ''}
            </div>
          </div>
          <canvas class="hero-board" width="460" height="460"></canvas>
        </section>
        <section class="mode-grid">
          <a class="mode" href="#" data-go="career"><div class="mode-ico">🏆</div><h3>Karriere</h3><p>Opret dine egne spillere eller tag rigtige stjerner under dine vinger. Q-School, tourkort, Pro Tour, majors, Premier League og VM. Træning, stab, sponsorer og økonomi.</p></a>
          <a class="mode" href="#" data-go="tour"><div class="mode-ico">🎪</div><h3>Turnering</h3><p>Vælg en rigtig turnering – VM, World Matchplay, Grand Prix med double-in og flere – og spil dig igennem lodtrækningen med en rigtig spiller.</p></a>
          <a class="mode" href="#" data-go="quick"><div class="mode-ico">🎯</div><h3>Hurtig kamp</h3><p>Én kamp mod computeren eller en ven ved samme skærm. Vælg format, legs/sets, 501/301 og double-in.</p></a>
          <a class="mode" href="#" data-go="db"><div class="mode-ico">📋</div><h3>Spillerdatabase</h3><p>${D.REAL.length} rigtige PDC-spillere med vurderinger af scoring, doubler, stabilitet, nerver og udholdenhed.</p></a>
        </section>
        <p class="disclaimer"><a href="#" id="credits">Fotos og licenser</a> · Spillervurderinger, præmiepenge og kalender er skøn baseret på PDC-touren og er ikke officielle data. Ikke tilknyttet PDC.</p>
      </main>`;
    bindGo(app);
    app.querySelector('#credits').addEventListener('click', (e) => {
      e.preventDefault();
      const ph = G.PLAYER_PHOTOS || {};
      modal(`<h2>Fotos og licenser</h2><p class="muted">Spillerfotos er frit licenserede billeder fra Wikimedia Commons og bruges under de angivne licenser. Klik for at se originalen, fotografen og licensen.</p><table class="tbl">${Object.entries(ph).sort().map(([n, x]) => `<tr><td>${G.Avatar.head({ name: n }, 30)} ${esc(n)}</td><td class="small">${esc(x.author || 'ukendt')}</td><td class="small"><a href="${esc(x.page)}" target="_blank" rel="noopener">${esc(x.license)}</a></td></tr>`).join('')}</table>`);
    });
    const cv = app.querySelector('.hero-board');
    G.MatchScreen.drawBoard(cv.getContext('2d'), 460);
  }

  // ================= HURTIG KAMP =================
  function playerOptions(list, sel) {
    return list.map((p) => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)} (${Math.round(ovr(p))})</option>`).join('');
  }
  function quick() {
    const w = db();
    activeWorld = w;
    const reals = Object.values(w.s.players).filter((p) => p.real).sort((a, b) => ovr(b) - ovr(a));
    app.innerHTML = header('<button class="btn ghost sm" data-go="home">← Menu</button>') + `
      <main class="page narrow">
        <h1>Hurtig kamp</h1>
        <div class="card form">
          <div class="vs-pick">
            ${[0, 1].map((i) => `
              <div class="pick">
                <label>Spiller ${i + 1}</label>
                <select id="q-p${i}">${playerOptions(reals, reals[i].id)}</select>
                <div class="seg" id="q-h${i}">
                  <button data-v="1" class="${i === 0 ? 'on' : ''}">🎯 Menneske</button><button data-v="0" class="${i === 1 ? 'on' : ''}">🤖 Computer</button>
                </div>
                <div class="pick-card" id="q-c${i}"></div>
              </div>`).join('<div class="vs">VS</div>')}
          </div>
          <div class="row3">
            <div><label>Format</label><select id="q-type"><option value="legs">Legs</option><option value="sets">Sets (bedst af 5 legs pr. sæt)</option></select></div>
            <div><label>First to</label><input id="q-target" type="number" min="1" max="18" value="3"></div>
            <div><label>Startscore</label><select id="q-start"><option>501</option><option>301</option><option>701</option></select></div>
          </div>
          <label class="check"><input type="checkbox" id="q-di"> Double-in (som World Grand Prix)</label>
          <button class="btn primary lg" id="q-go">Game on ▶</button>
        </div>
      </main>`;
    bindGo(app);
    const card = (i) => {
      const p = w.s.players[app.querySelector('#q-p' + i).value];
      app.querySelector('#q-c' + i).innerHTML = `<div class="pick-head">${G.Avatar.head(p, 64)}${ovrBadge(p)}</div> <span class="muted">${flag(p.nat)} ${natName(p.nat)} · forventet snit ${expAvg(p).toFixed(1)}</span>${ATTRS.map((k) => attrBar(k, p.attr[k])).join('')}`;
    };
    [0, 1].forEach((i) => {
      app.querySelector('#q-p' + i).addEventListener('change', () => card(i));
      card(i);
      app.querySelectorAll('#q-h' + i + ' button').forEach((b) => b.addEventListener('click', () => {
        app.querySelectorAll('#q-h' + i + ' button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      }));
    });
    app.querySelector('#q-go').addEventListener('click', () => {
      const a = w.s.players[app.querySelector('#q-p0').value], b = w.s.players[app.querySelector('#q-p1').value];
      if (a === b) return toast('Vælg to forskellige spillere', 'bad');
      const human = [0, 1].map((i) => app.querySelector('#q-h' + i + ' .on').dataset.v === '1');
      const type = app.querySelector('#q-type').value;
      const target = Math.max(1, Math.min(18, +app.querySelector('#q-target').value || 3));
      G.MatchScreen.open({
        pA: a, pB: b, human, fmt: type === 'sets' ? { type: 'sets', target, legsPerSet: 3 } : { type: 'legs', target },
        doubleIn: app.querySelector('#q-di').checked, startScore: +app.querySelector('#q-start').value, title: 'Hurtig kamp', subtitle: `${a.name} vs ${b.name}`,
      }, () => quick());
    });
  }

  // ================= DATABASE =================
  function database(w) {
    w = w || db();
    activeWorld = w;
    app.innerHTML = header('<button class="btn ghost sm" data-go="home">← Menu</button>') + `<main class="page"><h1>Spillerdatabase</h1>${dbTable(w)}</main>`;
    bindGo(app);
    bindDbTable(w, app);
  }
  function dbTable(w) {
    return `<div class="toolbar"><input type="search" placeholder="Søg spiller…" class="db-q"><select class="db-f"><option value="real">Rigtige spillere</option><option value="tour">Alle med tourkort</option><option value="all">Alle</option></select><select class="db-s"><option value="ovr">Sortér: samlet</option><option value="scoring">Scoring</option><option value="doubles">Doubler</option><option value="nerve">Nerver</option><option value="rank">Rangliste</option><option value="age">Alder</option><option value="pot">Potentiale</option></select></div><div class="db-list"></div>`;
  }
  function bindDbTable(w, el) {
    const render = () => {
      const q = el.querySelector('.db-q').value.toLowerCase();
      const f = el.querySelector('.db-f').value, s = el.querySelector('.db-s').value;
      let list = w.active().filter((p) => (f === 'real' ? p.real || p.own : f === 'tour' ? w.hasCard(p) : true) && (!q || p.name.toLowerCase().includes(q) || (p.nick || '').toLowerCase().includes(q)));
      const key = { ovr: (p) => -ovr(p), rank: (p) => w.rankOf(p.id) || 9999, age: (p) => w.s.season - p.born, pot: (p) => -p.pot };
      list.sort((a, b) => (key[s] ? key[s](a) - key[s](b) : b.attr[s] - a.attr[s]));
      el.querySelector('.db-list').innerHTML = `<table class="tbl hover"><tr><th>Spiller</th><th>Alder</th><th>Rang</th><th>Samlet</th>${ATTRS.map((k) => `<th class="hide-sm">${ATTR_DA[k].slice(0, 5)}</th>`).join('')}<th class="hide-sm">Pot.</th></tr>${list.slice(0, 250).map((p) => `<tr><td><span class="db-av">${G.Avatar.head(p, 26)}</span>${pName(p, w)}${p.nick ? `<small class="muted"> ${esc(p.nick)}</small>` : ''}</td><td>${w.s.season - p.born}</td><td>${w.rankOf(p.id) || '–'}</td><td>${ovrBadge(p)}</td>${ATTRS.map((k) => `<td class="hide-sm">${Math.floor(p.attr[k])}</td>`).join('')}<td class="hide-sm">${stars(p.pot)}</td></tr>`).join('')}</table>`;
    };
    el.querySelectorAll('.db-q,.db-f,.db-s').forEach((x) => x.addEventListener('input', render));
    render();
  }

  // ================= TURNERINGSMODE =================
  function tournaments() {
    const w = db();
    activeWorld = w;
    const types = ['worlds', 'matchplay', 'grandprix', 'ukopen', 'masters', 'eurochamp', 'grandslam', 'pcfinals', 'et', 'pc'];
    const reals = Object.values(w.s.players).filter((p) => p.real).sort((a, b) => ovr(b) - ovr(a));
    app.innerHTML = header('<button class="btn ghost sm" data-go="home">← Menu</button>') + `
      <main class="page">
        <h1>Turnering</h1>
        <p class="muted">Vælg en turnering og den spiller, du vil styre. Feltet sammensættes efter ranglisten – din spiller er altid med.</p>
        <div class="card form">
          <label>Din spiller</label>
          <select id="t-p">${playerOptions(reals, reals[0].id)}</select>
          <label class="check"><input type="checkbox" id="t-sim"> Simulér mine kampe automatisk (manager-tilstand)</label>
        </div>
        <div class="tour-grid">${types.map((k) => {
          const t = D.T[k];
          return `<button class="tcard" data-t="${k}" style="--tc:${t.color}"><span class="tier">${t.tier}</span><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p><div class="tmeta"><span>${t.field.startsWith('oom:') || t.field.startsWith('pro:') ? t.field.split(':')[1] : t.size} spillere</span><span>${t.sets ? 'Sets' : 'Legs'}</span><span>Vinder ${fmtMoney(t.prize[0])}</span></div></button>`;
        }).join('')}</div>
      </main>`;
    bindGo(app);
    app.querySelectorAll('.tcard').forEach((b) => b.addEventListener('click', () => {
      const pid = app.querySelector('#t-p').value;
      const tw = World.create({ mode: 'tournament' });
      const name = w.s.players[pid].name;
      const p = Object.values(tw.s.players).find((x) => x.name === name);
      tw.addRealToStable(p.id);
      const ev = tw.createEvent(b.dataset.t, D.T[b.dataset.t].name + ' ' + tw.s.season, { forceInclude: p.id });
      tw.s.autoSim = app.querySelector('#t-sim').checked;
      eventScreen(tw, ev, () => tournaments());
    }));
  }

  // ================= TURNERINGSSKÆRM =================
  function eventScreen(w, ev, onExit) {
    activeWorld = w;
    const t = D.T[ev.type];
    const isCareer = w.s.mode === 'career';
    const persist = () => { if (isCareer) save(); };

    function render() {
      if (!ev.done) w.simRest(ev, false);
      const r = ev.round;
      const pending = ev.done ? [] : w.ownMatchesPending(ev);
      const ownAlive = !ev.done && ev.matches[r].some((m) => !m.empty && (w.isStable(m.a) || w.isStable(m.b)) && (m.w == null || w.isStable(m.w)));
      const fmt = w.fmtFor(ev, Math.min(r, ev.rounds.length - 1));
      const roundLbl = w.roundLabel(ev);
      let body = '';
      if (ev.done) body = doneView();
      else {
        body += `<div class="round-head"><div><span class="kicker">${roundLbl}</span><h2>${w.fmtLabel(fmt)}${ev.doubleIn ? ' · double-in' : ''}</h2></div>
          <div class="round-btns">${pending.length ? '' : ev.special === 'plnight' ? '<button class="btn primary" data-a="next">Afslut aftenen ▶</button>' : ownAlive ? '<button class="btn primary" data-a="next">Næste runde ▶</button>' : '<button class="btn primary" data-a="finish">Simulér resten af turneringen ⏭</button>'}</div></div>`;
        if (pending.length) {
          body += `<div class="own-matches">${pending.map(({ m, i }) => {
            const A = w.s.players[m.a], B = w.s.players[m.b];
            return `<div class="own-match card">
              <div class="om-vs"><div><span class="om-av">${G.Avatar.head(A, 56)}${ovrBadge(A)}</span>${pName(A, w)}<small class="muted">#${w.rankOf(A.id) || '–'} · snit ~${expAvg(A).toFixed(0)}</small></div><span class="vs">VS</span><div><span class="om-av">${G.Avatar.head(B, 56)}${ovrBadge(B)}</span>${pName(B, w)}<small class="muted">#${w.rankOf(B.id) || '–'} · snit ~${expAvg(B).toFixed(0)}</small></div></div>
              <div class="om-btns"><button class="btn primary" data-play="${i}">🎯 Spil selv</button><button class="btn" data-sim="${i}">⚡ Simulér</button></div></div>`;
          }).join('')}</div>`;
        }
        if (ev.special === 'plnight') body += plTableHtml(w);
        body += `<h3>Resultater – ${roundLbl}</h3>${matchList(ev.matches[r], w)}`;
      }
      if (ev.round > 0 || ev.done) {
        body += `<details class="prev"><summary>Tidligere runder</summary>${ev.matches.slice(0, ev.done ? ev.matches.length : r).map((ms, k) => `<h4>${w.roundLabel(ev, k)}</h4>${matchList(ms, w)}`).reverse().join('')}</details>`;
      }
      app.innerHTML = header(`<span class="muted hide-sm">${isCareer ? `Sæson ${w.s.season} · uge ${w.s.week}` : 'Turneringsmode'}</span>`) + `
        <main class="page">
          <div class="ev-banner" style="--tc:${t ? t.color : '#a855f7'}"><span class="tier">${t ? t.tier : ''}</span><h1>${esc(ev.label)}</h1><p>${t ? esc(t.desc) : ''}</p></div>
          ${body}
        </main>`;
      bindGo(app);
      app.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => play(+b.dataset.play)));
      app.querySelectorAll('[data-sim]').forEach((b) => b.addEventListener('click', () => sim(+b.dataset.sim)));
      const nb = app.querySelector('[data-a="next"]');
      if (nb) nb.addEventListener('click', () => { w.nextRound(ev); persist(); render(); window.scrollTo(0, 0); });
      const fb = app.querySelector('[data-a="finish"]');
      if (fb) fb.addEventListener('click', () => { w.simWhole(ev); persist(); render(); window.scrollTo(0, 0); });
      const xb = app.querySelector('[data-a="exit"]');
      if (xb) xb.addEventListener('click', () => onExit && onExit());
      if (w.s.autoSim && pending.length) setTimeout(() => { pending.forEach(({ i }) => sim(i, true)); render(); }, 50);
    }

    function play(i) {
      const m = ev.matches[ev.round][i];
      const A = w.s.players[m.a], B = w.s.players[m.b];
      G.MatchScreen.open({
        pA: A, pB: B, human: [w.isStable(A.id), w.isStable(B.id)], fmt: w.fmtFor(ev, ev.round), doubleIn: ev.doubleIn,
        mods: [w.mods(A), w.mods(B)], title: ev.label, subtitle: w.roundLabel(ev),
      }, (res) => { w.applyResult(ev, i, res); persist(); render(); });
    }
    function sim(i, quiet) {
      const m = ev.matches[ev.round][i];
      if (m.w != null) return;
      const res = w.simMatch(m.a, m.b, w.fmtFor(ev, ev.round), ev.doubleIn);
      w.applyResult(ev, i, res);
      persist();
      if (!quiet) {
        const own = w.isStable(m.a) ? 0 : 1;
        const won = res.w === own;
        const ownP = w.s.players[own === 0 ? m.a : m.b];
        toast(`${won ? '✅' : '❌'} ${esc(ownP.name)} ${won ? 'vinder' : 'taber'} ${own === 0 ? res.score : res.score.split('-').reverse().join('-')} · snit ${res.st[own].avg}`, won ? 'good' : 'bad');
        render();
      }
    }

    function doneView() {
      const win = w.s.players[ev.winner];
      const own = ev.entrants.filter((id) => w.isStable(id)).map((id) => {
        const p = w.s.players[id];
        const r = id === ev.winner ? ev.R : ev.out[id];
        const idx = ev.R - r;
        const place = id === ev.winner ? 'Vinder 🏆' : idx === 1 ? 'Finale' : 'Ude i ' + w.roundLabel(ev, r).toLowerCase();
        const prize = ev.special === 'plplayoff' || ev.special === 'plnight' ? null : ev.prize[idx] || 0;
        return `<div class="own-res">${pName(p, w)} <b>${place}</b>${prize != null ? ` <span class="money">${fmtMoney(prize)}</span>` : ''}</div>`;
      }).join('');
      if (ev.special === 'plnight') return `${plTableHtml(w)}<h3>Aftenens resultater</h3>${matchList(ev.matches[0], w)}<button class="btn primary lg" data-a="exit">Fortsæt ▶</button>`;
      const fin = ev.matches[ev.R - 1][0];
      return `<div class="champion card"><div class="champ-av">${G.Avatar.head(win, 110)}<div class="trophy">🏆</div></div><div class="kicker">Vinder</div><h2>${flag(win.nat)} ${esc(win.name)}</h2><p class="muted">Finale: ${pName(w.s.players[fin.a], w)} ${fin.score} ${pName(w.s.players[fin.b], w)}</p>${own ? `<h3>Din stald</h3>${own}` : ''}<button class="btn primary lg" data-a="exit">Fortsæt ▶</button></div>`;
    }

    render();
  }

  function matchList(ms, w) {
    const rows = ms.filter((m) => !m.empty).map((m) => {
      const A = w.s.players[m.a], B = w.s.players[m.b];
      const own = (A && w.isStable(A.id)) || (B && w.isStable(B.id));
      if (m.bye) return `<div class="ml ${own ? 'own' : ''}"><span class="${'win'}">${pName(A || B, w)}</span><span class="sc">bye</span><span></span></div>`;
      const sc = m.w ? m.score : 'vs';
      return `<div class="ml ${own ? 'own' : ''}"><span class="${m.w === m.a ? 'win' : m.w ? 'lose' : ''}">${pName(A, w)}</span><span class="sc">${sc}${m.st ? `<small>${m.st[0].avg.toFixed(1)} · ${m.st[1].avg.toFixed(1)}</small>` : ''}</span><span class="${m.w === m.b ? 'win' : m.w ? 'lose' : ''} r">${pName(B, w)}</span></div>`;
    });
    return `<div class="mlist">${rows.join('')}</div>`;
  }

  function plTableHtml(w) {
    const tb = w.plTable();
    if (!tb.length) return '<p class="muted">Premier League starter i uge 6 med de 8 bedste på ranglisten.</p>';
    return `<table class="tbl pl"><tr><th>#</th><th>Spiller</th><th>K</th><th>V</th><th>T</th><th>Legs</th><th>+/-</th><th>Point</th></tr>${tb.map((r, i) => `<tr class="${i < 4 ? 'q' : ''} ${w.isStable(r.id) ? 'own' : ''}"><td>${i + 1}</td><td>${pName(w.s.players[r.id], w)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.l}</td><td>${r.lf}-${r.la}</td><td>${r.lf - r.la}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table><p class="muted small">Top 4 går videre til play-offs i uge ${D.PL_PLAYOFF_WEEK}.</p>`;
  }

  // ================= NY KARRIERE =================
  const DIFF = {
    let: { name: 'Let', money: 100000, pool: 160, pot: 96, base: 50 },
    normal: { name: 'Normal', money: 30000, pool: 115, pot: 92, base: 47 },
    svaer: { name: 'Svær', money: 8000, pool: 70, pot: 88, base: 44 },
  };
  function careerNew() {
    const w0 = db();
    activeWorld = w0;
    const reals = Object.values(w0.s.players).filter((p) => p.real).sort((a, b) => ovr(b) - ovr(a));
    const stable = []; // {kind:'own', data} | {kind:'real', name}
    app.innerHTML = header('<button class="btn ghost sm" data-go="home">← Menu</button>') + `
      <main class="page narrow">
        <h1>Ny karriere</h1>
        <div class="card form">
          <div class="row2"><div><label>Managernavn / stald</label><input id="c-man" value="Min stald" maxlength="40"></div>
          <div><label>Sværhedsgrad</label><select id="c-diff">${Object.entries(DIFF).map(([k, d]) => `<option value="${k}" ${k === 'normal' ? 'selected' : ''}>${d.name} – startkapital ${fmtMoney(d.money)}</option>`).join('')}</select></div></div>
        </div>
        <h2>Din stald <small class="muted">(1–4 spillere)</small></h2>
        <div id="c-stable" class="stable-list"></div>
        <div class="card form" id="c-create">
          <h3>Opret egen spiller</h3>
          <div class="row2"><div><label>Navn</label><input id="n-name" placeholder="Fx Mads Kjær" maxlength="30"></div><div><label>Kælenavn</label><input id="n-nick" placeholder="Fx The Viking" maxlength="30"></div></div>
          <div class="row2"><div><label>Nation</label><select id="n-nat">${Object.entries(D.NATIONS).map(([k, n]) => `<option value="${k}" ${k === 'DEN' ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}</select></div><div><label>Alder</label><input id="n-age" type="number" min="16" max="45" value="20"></div></div>
          <label>Fordel evnepoint <span id="n-pool" class="tag"></span></label>
          <div id="n-attrs"></div>
          <button class="btn" id="n-add">+ Tilføj spiller til stalden</button>
        </div>
        <div class="card form">
          <h3>…eller tag en rigtig spiller under dine vinger</h3>
          <div class="row2"><select id="r-p">${playerOptions(reals, reals[20].id)}</select><button class="btn" id="r-add">+ Tilføj</button></div>
        </div>
        <button class="btn primary lg" id="c-go">Start karrieren ▶</button>
        <p class="muted small">Egne spillere starter uden tourkort og skal gennem Q-School (uge 2) eller Challenge Tour. Rigtige spillere starter med deres tourkort og rangliste.</p>
      </main>`;
    bindGo(app);
    const vals = {};
    const diff = () => DIFF[app.querySelector('#c-diff').value];
    function resetVals() { ATTRS.forEach((k) => (vals[k] = diff().base)); drawAttrs(); }
    function used() { return ATTRS.reduce((s, k) => s + (vals[k] - diff().base), 0); }
    function drawAttrs() {
      const left = diff().pool - used();
      app.querySelector('#n-pool').textContent = left + ' point tilbage';
      app.querySelector('#n-attrs').innerHTML = ATTRS.map((k) => `<div class="alloc"><span>${ATTR_DA[k]}</span><button data-k="${k}" data-d="-1">−</button><div class="bar"><div class="a3" style="width:${vals[k]}%"></div></div><button data-k="${k}" data-d="1">+</button><b>${vals[k]}</b></div>`).join('') +
        `<div class="muted small">Forventet snit nu: ~${expAvg({ attr: vals }).toFixed(0)} · potentiale op til ${diff().pot}</div>`;
      app.querySelectorAll('#n-attrs button').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.k, d = +b.dataset.d * 2;
        const nv = vals[k] + d;
        if (nv < diff().base - 10 || nv > 80) return;
        if (d > 0 && used() + d > diff().pool) return;
        vals[k] = nv;
        drawAttrs();
      }));
    }
    function drawStable() {
      app.querySelector('#c-stable').innerHTML = stable.length ? stable.map((s, i) => `<div class="stable-item card">${s.kind === 'own' ? `${flag(s.data.nat)} <b>${esc(s.data.name)}</b> <span class="muted">egen spiller · ${s.data.age} år · forventet snit ~${expAvg({ attr: s.data.attr }).toFixed(0)}</span>` : `${flag(s.p.nat)} <b>${esc(s.p.name)}</b> <span class="muted">rigtig spiller · ${Math.round(ovr(s.p))} samlet</span>`}<button class="btn ghost sm" data-rm="${i}">Fjern</button></div>`).join('') : '<p class="muted">Ingen spillere endnu.</p>';
      app.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { stable.splice(+b.dataset.rm, 1); drawStable(); }));
    }
    app.querySelector('#c-diff').addEventListener('change', resetVals);
    app.querySelector('#n-add').addEventListener('click', () => {
      if (stable.length >= 4) return toast('Højst 4 spillere i stalden', 'bad');
      const name = app.querySelector('#n-name').value.trim();
      if (!name) return toast('Giv spilleren et navn', 'bad');
      const age = Math.max(16, Math.min(45, +app.querySelector('#n-age').value || 20));
      stable.push({ kind: 'own', data: { name, nick: app.querySelector('#n-nick').value.trim(), nat: app.querySelector('#n-nat').value, age, attr: Object.assign({}, vals) } });
      app.querySelector('#n-name').value = ''; app.querySelector('#n-nick').value = '';
      resetVals(); drawStable();
    });
    app.querySelector('#r-add').addEventListener('click', () => {
      if (stable.length >= 4) return toast('Højst 4 spillere i stalden', 'bad');
      const p = w0.s.players[app.querySelector('#r-p').value];
      if (stable.some((s) => s.p && s.p.name === p.name)) return;
      stable.push({ kind: 'real', p });
      drawStable();
    });
    app.querySelector('#c-go').addEventListener('click', () => {
      if (!stable.length) return toast('Tilføj mindst én spiller til stalden', 'bad');
      const old = load();
      if (old && !confirm('Du har allerede en karriere. Vil du overskrive den?')) return;
      const d = diff();
      const w = World.create({ mode: 'career', manager: app.querySelector('#c-man').value.trim() || 'Manager', difficulty: app.querySelector('#c-diff').value, money: d.money });
      stable.forEach((s) => {
        if (s.kind === 'own') {
          const youth = Math.max(0, Math.min(1, (27 - s.data.age) / 9));
          w.addOwnPlayer({ name: s.data.name, nick: s.data.nick, nat: s.data.nat, born: w.s.season - s.data.age, attr: Object.assign({}, s.data.attr), pot: Math.round(d.pot - (1 - youth) * 8) });
        } else {
          const p = Object.values(w.s.players).find((x) => x.name === s.p.name);
          w.addRealToStable(p.id);
        }
      });
      w.news(`Velkommen, ${w.s.manager}! Sæson ${w.s.season} begynder. ${w.stable.some((p) => !w.hasCard(p)) ? 'Dine nye spillere skal kæmpe om tourkort på Q-School i uge 2.' : ''}`, 'info');
      career = w;
      save();
      hub();
    });
    resetVals();
    drawStable();
  }

  // ================= KARRIERE-HUB =================
  let hubTab = 'overview';
  function hub(tab) {
    const w = career;
    activeWorld = w;
    if (tab) hubTab = tab;
    const s = w.s;
    const tabs = [['overview', 'Oversigt'], ['stable', 'Mine spillere'], ['calendar', 'Kalender'], ['rank', 'Ranglister'], ['pl', 'Premier League'], ['players', 'Spillere'], ['money', 'Økonomi'], ['trophies', 'Trofæer'], ['save', 'Gem']];
    const inEvent = s.current && !s.current.done;
    const nextEvs = s.weekStarted ? s.queue : w.weekEvents();
    app.innerHTML = header(`<div class="cbar"><span class="hide-sm">${esc(s.manager)}</span><span>📅 ${s.season} · uge ${s.week} <small class="muted">(${D.weekToDate(s.season, s.week)})</small></span><span class="money ${s.money < 0 ? 'neg' : ''}">${fmtMoney(s.money)}</span></div>`) + `
      <main class="page">
        <div class="continue-bar">
          <div><div class="kicker">${inEvent ? 'Turnering i gang' : 'Denne uge'}</div><b>${inEvent ? esc(s.current.label) : nextEvs.length ? nextEvs.map((e) => esc(e.label)).join(' · ') : 'Ingen turneringer – træningsuge'}</b></div>
          <button class="btn primary lg" id="cont">${inEvent ? 'Til turneringen ▶' : 'Fortsæt ▶'}</button>
        </div>
        <nav class="tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${hubTab === k ? 'on' : ''}">${l}</button>`).join('')}</nav>
        <section class="tab-body">${renderTab(w, hubTab)}</section>
      </main>`;
    bindGo(app);
    app.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => hub(b.dataset.tab)));
    app.querySelector('#cont').addEventListener('click', advance);
    bindTab(w, hubTab);
  }

  function advance() {
    const w = career;
    if (!w.s.weekStarted) w.startWeek();
    const r = w.processQueue();
    save();
    if (r === 'event') {
      eventScreen(w, w.s.current, () => advance());
      return;
    }
    // ugen er slut
    const before = w.s.season;
    const wk = w.s.week;
    const res = (w.s.results || []).filter((x) => x.season === w.s.season && x.week === wk);
    w.endWeek();
    save();
    hub();
    if (res.length) toast(res.map((x) => `🏆 ${esc(x.label)}: <b>${esc(w.s.players[x.winner].name)}</b>`).join('<br>'));
    if (w.s.season !== before) seasonReview(before);
  }

  function seasonReview(season) {
    const w = career;
    const log = w.s.seasonLog.find((l) => l.season === season);
    if (!log) return;
    modal(`<h2>Sæson ${season} er slut</h2>
      <h3>Din stald</h3>${log.stable.map((x) => `<div class="own-res"><b>${esc(x.name)}</b> rangliste #${x.rank || '–'} · ${x.titles} titler</div>`).join('')}
      <h3>Top 10 – Order of Merit</h3><ol>${log.top.map((x) => `<li>${esc(x.name)} – ${fmtMoney(x.money)}</li>`).join('')}</ol>
      <p class="muted">Spillere er blevet et år ældre, unge talenter er udviklet, og nye amatører er kommet til. Tourkort uden for top 64 er udløbet.</p>`);
  }

  function renderTab(w, tab) {
    const s = w.s;
    if (tab === 'overview') {
      const cards = w.stable.map((p) => stableCardMini(w, p)).join('');
      const upcoming = [];
      for (let k = s.week; k <= Math.min(52, s.week + 6); k++) (s.calendar[k] || []).forEach((e) => upcoming.push({ week: k, ...e }));
      return `<div class="grid2">
        <div><h2>Stalden</h2><div class="mini-cards">${cards}</div>
          <h2>Kommende turneringer</h2><div class="upcoming">${upcoming.map((e) => `<div class="up"><span class="wk">Uge ${e.week}</span><span class="dot" style="background:${D.T[e.type].color}"></span><b>${esc(e.label)}</b><span class="elig">${w.stable.map((p) => w.eligible(e.type, p.id) ? `<span class="chip ok" title="Kvalificeret">${esc(p.name.split(' ')[0])} ✓</span>` : '').join('')}</span></div>`).join('') || '<p class="muted">Ingen</p>'}</div>
        </div>
        <div><h2>Nyheder</h2><div class="news">${s.news.slice(0, 30).map((n) => `<div class="nw ${n.type}"><small>${n.season} · uge ${n.week}</small>${esc(n.text)}</div>`).join('')}</div></div>
      </div>`;
    }
    if (tab === 'stable') {
      return `<div class="stable-cards">${w.stable.map((p) => {
        const age = s.season - p.born;
        return `<div class="card pcard" data-id="${p.id}">
          <div class="pm-head">${G.Avatar.head(p, 64)}${ovrBadge(p)}<div><h2>${pName(p, w)}</h2><div class="muted">${p.nick ? '“' + esc(p.nick) + '” · ' : ''}${age} år · ${stars(p.pot)}</div></div></div>
          <div class="kv small">
            <div><span>Rangliste</span><b>#${w.rankOf(p.id) || '–'}</b></div>
            <div><span>Tourkort</span><b>${w.hasCard(p) ? 'til ' + p.tourCard : '❌ nej'}</b></div>
            <div><span>Form</span><b class="${p.form >= 0 ? 'pos' : 'neg'}">${p.form >= 0 ? '+' : ''}${p.form.toFixed(1)}</b></div>
            <div><span>Træthed</span><b class="${p.fatigue > 50 ? 'neg' : ''}">${Math.round(p.fatigue)}%</b></div>
            <div><span>Kampe</span><b>${p.wl[0]}-${p.wl[1]}</b></div>
            <div><span>Forv. snit</span><b>${expAvg(p).toFixed(1)}</b></div>
          </div>
          ${ATTRS.map((k) => attrBar(k, p.attr[k])).join('')}
          <div class="photo-row"><label class="btn sm">📷 ${p.photo ? 'Skift foto' : 'Tilføj foto'}<input type="file" accept="image/*" data-photo="${p.id}" hidden></label>${p.photo ? `<button class="btn ghost sm" data-nophoto="${p.id}">Fjern foto</button>` : ''}<span class="muted small">${G.Avatar.photoOf(p) ? (p.photo ? 'Eget foto' : 'Foto fra Wikimedia Commons') : 'Intet foto – vis en silhuet'}</span></div>
          <div class="row2 plan">
            <div><label>Ugeplan (uden turnering)</label><select data-plan="${p.id}">
              <option value="train" ${p.plan === 'train' ? 'selected' : ''}>Træning – normal</option>
              <option value="hard" ${p.plan === 'hard' ? 'selected' : ''}>Træning – hård (+udvikling, +træthed)</option>
              <option value="rest" ${p.plan === 'rest' ? 'selected' : ''}>Hvile (−træthed)</option>
              <option value="exhibition" ${p.plan === 'exhibition' ? 'selected' : ''}>Opvisning (penge, +træthed)</option></select></div>
            <div><label>Træningsfokus</label><select data-focus="${p.id}">${ATTRS.map((k) => `<option value="${k}" ${p.focus === k ? 'selected' : ''}>${ATTR_DA[k]}</option>`).join('')}</select></div>
          </div>
          ${p.titles.length ? `<div class="titles">${p.titles.slice(-6).reverse().map((t) => `<span class="chip ${t.tier === 'VM' || t.tier === 'Major' ? 'gold' : ''}">${t.season} ${esc(t.name)}</span>`).join('')}</div>` : ''}
        </div>`;
      }).join('')}</div>`;
    }
    if (tab === 'calendar') {
      let html = '<div class="cal">';
      for (let k = 1; k <= 52; k++) {
        const evs = s.calendar[k] || [];
        const pl = D.PL_WEEKS.includes(k) ? 'PL' : k === D.PL_PLAYOFF_WEEK ? 'PL Play-Offs' : '';
        const res = (s.results || []).filter((x) => x.season === s.season && x.week === k);
        html += `<div class="cw ${k === s.week ? 'now' : k < s.week ? 'past' : ''}"><span class="wk">Uge ${k}<small>${D.weekToDate(s.season, k)}</small></span><div>${evs.map((e) => {
          const r = res.find((x) => x.label === e.label);
          return `<div class="ce"><span class="dot" style="background:${D.T[e.type].color}"></span>${esc(e.label)}${r ? ` <span class="muted">– ${esc(s.players[r.winner].name)}</span>` : k >= s.week ? w.stable.map((p) => w.eligible(e.type, p.id) ? ` <span class="chip ok">${esc(p.name.split(' ')[0])}</span>` : '').join('') : ''}</div>`;
        }).join('')}${pl ? `<div class="ce"><span class="dot" style="background:${D.T.premier.color}"></span>${pl}</div>` : ''}${!evs.length && !pl ? '<span class="muted">Træningsuge</span>' : ''}</div></div>`;
      }
      return html + '</div>';
    }
    if (tab === 'rank') {
      return `<div class="seg rk-seg"><button data-rk="oom" class="on">PDC Order of Merit</button><button data-rk="pro">Pro Tour</button><button data-rk="ct">Challenge Tour</button></div><div class="rk-list"></div>`;
    }
    if (tab === 'pl') return `<h2>Premier League ${s.season}</h2>${plTableHtml(w)}`;
    if (tab === 'players') return dbTable(w);
    if (tab === 'money') {
      const wages = Object.keys(STAFF).reduce((sum, k) => sum + STAFF[k].cost[s.staff[k]], 0);
      return `<div class="grid2"><div>
        <div class="kv big"><div><span>Kassebeholdning</span><b class="${s.money < 0 ? 'neg' : 'pos'}">${fmtMoney(s.money)}</b></div><div><span>Sponsorer pr. uge</span><b>${fmtMoney(w.sponsorIncome())}</b></div><div><span>Løn pr. uge</span><b>${fmtMoney(wages)}</b></div></div>
        <h2>Stab</h2>${Object.entries(STAFF).map(([k, st]) => `<div class="card staff"><div><b>${st.name}</b><div class="muted small">${st.desc}</div></div><div class="lvl">${[0, 1, 2, 3].map((l) => `<button data-staff="${k}" data-l="${l}" class="${s.staff[k] === l ? 'on' : ''}">${l === 0 ? 'Ingen' : 'Niveau ' + l}<small>${l ? fmtMoney(st.cost[l]) + '/uge' : ''}</small></button>`).join('')}</div></div>`).join('')}
        <p class="muted small">Sponsorindtægter afhænger af dine spilleres placering på ranglisten. Præmiepenge går til stalden.</p>
      </div><div><h2>Posteringer</h2><table class="tbl">${s.ledger.slice(0, 60).map((l) => `<tr><td class="muted">${l.season}/${l.week}</td><td>${esc(l.text)}</td><td class="${l.amt < 0 ? 'neg' : 'pos'} r">${fmtMoney(l.amt)}</td></tr>`).join('')}</table></div></div>`;
    }
    if (tab === 'trophies') {
      return `<h2>Trofæskab</h2>${s.trophies.length ? `<div class="trophies">${s.trophies.slice().reverse().map((t) => `<div class="trophy-card ${t.tier === 'VM' || t.tier === 'Major' ? 'gold' : ''}"><div>🏆</div><b>${esc(t.name)}</b><span>${esc(t.player)}</span><small>${t.season}</small></div>`).join('')}</div>` : '<p class="muted">Ingen trofæer endnu. Kom i gang!</p>'}
        ${s.seasonLog.length ? `<h2>Sæsoner</h2><table class="tbl"><tr><th>Sæson</th><th>Stalden</th><th>Nr. 1</th></tr>${s.seasonLog.slice().reverse().map((l) => `<tr><td>${l.season}</td><td>${l.stable.map((x) => `${esc(x.name)} #${x.rank || '–'} (${x.titles} titler)`).join(', ')}</td><td>${esc(l.top[0].name)}</td></tr>`).join('')}</table>` : ''}`;
    }
    if (tab === 'save') {
      return `<div class="card form"><h3>Gem og indlæs</h3><p class="muted">Karrieren gemmes automatisk i browseren efter hver kamp og uge. Du kan også eksportere en fil som backup.</p>
        <div class="row3"><button class="btn" id="exp">⬇ Eksportér karriere</button><label class="btn">⬆ Importér<input type="file" id="imp" accept=".json" hidden></label><button class="btn danger" id="del">🗑 Slet karriere</button></div></div>
        <div class="card form"><h3>Indstillinger</h3><label class="check"><input type="checkbox" id="set-caller" ${G.MatchScreen.settings.caller ? 'checked' : ''}> Caller-stemme (engelsk)</label>
        <label>AI-tempo</label><select id="set-speed"><option value="0.7">Langsomt</option><option value="1">Normalt</option><option value="1.8">Hurtigt</option><option value="3">Meget hurtigt</option></select></div>`;
    }
    return '';
  }

  function stableCardMini(w, p) {
    return `<div class="mini card">${G.Avatar.head(p, 40)}${ovrBadge(p)}<div><b>${pName(p, w)}</b><small class="muted">#${w.rankOf(p.id) || '–'} · ${w.hasCard(p) ? 'tourkort' : 'uden tourkort'} · form ${p.form >= 0 ? '+' : ''}${p.form.toFixed(1)} · træthed ${Math.round(p.fatigue)}%</small></div></div>`;
  }

  function bindTab(w, tab) {
    const s = w.s;
    if (tab === 'stable') {
      app.querySelectorAll('[data-plan]').forEach((el) => el.addEventListener('change', () => { s.players[el.dataset.plan].plan = el.value; save(); }));
      app.querySelectorAll('[data-focus]').forEach((el) => el.addEventListener('change', () => { s.players[el.dataset.focus].focus = el.value; save(); }));
      app.querySelectorAll('[data-nophoto]').forEach((b) => b.addEventListener('click', () => { delete s.players[b.dataset.nophoto].photo; save(); hub('stable'); }));
      app.querySelectorAll('[data-photo]').forEach((el) => el.addEventListener('change', () => {
        const f = el.files[0];
        if (!f) return;
        const img = new Image();
        img.onload = () => {
          // beskær til 3:4 portræt, 360x480
          const W = 360, H = 480, cv = document.createElement('canvas');
          cv.width = W; cv.height = H;
          const r = Math.max(W / img.width, H / img.height);
          const w = img.width * r, h = img.height * r;
          cv.getContext('2d').drawImage(img, (W - w) / 2, Math.min(0, (H - h) * 0.25), w, h);
          s.players[el.dataset.photo].photo = cv.toDataURL('image/jpeg', 0.82);
          URL.revokeObjectURL(img.src);
          save();
          hub('stable');
          toast('Foto gemt', 'good');
        };
        img.onerror = () => toast('Kunne ikke læse billedet', 'bad');
        img.src = URL.createObjectURL(f);
      }));
    }
    if (tab === 'rank') {
      const draw = (k) => {
        const rk = w.rankings();
        const list = rk[k].slice(0, 160);
        const val = (p) => (k === 'oom' ? w.oom(p) : k === 'pro' ? w.pro(p) : w.ct(p));
        app.querySelector('.rk-list').innerHTML = `<table class="tbl hover"><tr><th>#</th><th>Spiller</th><th>Præmiepenge</th><th class="hide-sm">Tourkort</th><th>Samlet</th></tr>${list.map((p, i) => `<tr class="${w.isStable(p.id) ? 'own' : ''} ${k === 'oom' && i === 63 ? 'cut' : ''}"><td>${i + 1}</td><td>${pName(p, w)}</td><td>${fmtMoney(val(p))}</td><td class="hide-sm">${w.hasCard(p) ? p.tourCard : '–'}</td><td>${ovrBadge(p)}</td></tr>`).join('')}</table>
          <p class="muted small">${k === 'oom' ? 'Order of Merit = rangerede præmiepenge fra sidste og indeværende sæson. Top 64 beholder tourkortet ved sæsonafslutning.' : k === 'pro' ? 'Pro Tour = Players Championship + European Tour i år. Afgør adgang til European Tour, European Championship og Players Championship Finals.' : 'Challenge Tour for spillere uden tourkort. Top 2 ved sæsonafslutning får tourkort.'}</p>`;
      };
      app.querySelectorAll('[data-rk]').forEach((b) => b.addEventListener('click', () => {
        app.querySelectorAll('[data-rk]').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        draw(b.dataset.rk);
      }));
      draw('oom');
    }
    if (tab === 'players') bindDbTable(w, app.querySelector('.tab-body'));
    if (tab === 'money') {
      app.querySelectorAll('[data-staff]').forEach((b) => b.addEventListener('click', () => {
        s.staff[b.dataset.staff] = +b.dataset.l;
        save();
        hub('money');
      }));
    }
    if (tab === 'save') {
      app.querySelector('#exp').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(s)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pro-dart-manager-${s.season}-uge${s.week}.json`;
        a.click();
      });
      app.querySelector('#imp').addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        f.text().then((txt) => {
          try { career = new World(JSON.parse(txt)); save(); hub('overview'); toast('Karriere indlæst', 'good'); }
          catch (err) { toast('Ugyldig fil', 'bad'); }
        });
      });
      app.querySelector('#del').addEventListener('click', () => {
        if (!confirm('Slet karrieren permanent?')) return;
        localStorage.removeItem(SAVE_KEY);
        career = null;
        home();
      });
      app.querySelector('#set-caller').addEventListener('change', (e) => { G.MatchScreen.settings.caller = e.target.checked; G.MatchScreen.saveSettings(); });
      const sp = app.querySelector('#set-speed');
      sp.value = String(G.MatchScreen.settings.speed || 1);
      sp.addEventListener('change', () => { G.MatchScreen.settings.speed = +sp.value; G.MatchScreen.saveSettings(); });
    }
  }

  // start
  career = load();
  if (career && career.s.current && !career.s.current.done) hub();
  else home();
  G.PDM = { home, hub, get career() { return career; } };
})(window);
