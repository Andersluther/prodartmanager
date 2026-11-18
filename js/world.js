// Pro Dart Manager — verden: spillere, ranglister, turneringer, sæson og karriere
(function (G) {
  'use strict';
  const D = G.DartData, E = G.DartEngine;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ATTRS = ['scoring', 'doubles', 'consistency', 'nerve', 'stamina'];
  const ATTR_DA = { scoring: 'Scoring', doubles: 'Doubler', consistency: 'Stabilitet', nerve: 'Nerver', stamina: 'Udholdenhed' };
  const STAFF = {
    coach: { name: 'Dart-træner', desc: 'Hurtigere udvikling i træning', cost: [0, 300, 700, 1400], mult: [1, 1.3, 1.6, 2.0] },
    psych: { name: 'Mental coach', desc: 'Bedre nerver under pres og hurtigere formopbygning', cost: [0, 250, 600, 1200], mult: [0, 2, 4, 6] },
    fitness: { name: 'Fysisk træner', desc: 'Hurtigere restitution og mere udholdenhed', cost: [0, 200, 450, 900], mult: [1, 1.3, 1.6, 2.0] },
  };

  function ovr(p) {
    const a = p.attr;
    return a.scoring * 0.4 + a.doubles * 0.3 + a.consistency * 0.1 + a.nerve * 0.15 + a.stamina * 0.05;
  }
  const CAL = [[25, 46], [35, 56.5], [50, 68], [65, 78.5], [75, 86], [80, 90], [85, 94], [90, 99], [95, 104], [100, 109]];
  function expAvg(p) {
    const s = p.attr.scoring;
    if (s <= CAL[0][0]) return CAL[0][1];
    for (let i = 1; i < CAL.length; i++) if (s <= CAL[i][0]) {
      const [a0, v0] = CAL[i - 1], [a1, v1] = CAL[i];
      return v0 + ((s - a0) / (a1 - a0)) * (v1 - v0);
    }
    return 109;
  }

  function pickNat() {
    const tot = D.NAT_WEIGHTS.reduce((s, x) => s + x[1], 0);
    let r = Math.random() * tot;
    for (const [n, w] of D.NAT_WEIGHTS) { r -= w; if (r <= 0) return n; }
    return 'ENG';
  }

  function seedOrder(size) {
    let o = [1, 2];
    while (o.length < size) {
      const n = o.length * 2 + 1, next = [];
      for (const x of o) next.push(x, n - x);
      o = next;
    }
    return o;
  }

  function roundName(playersLeft) {
    if (playersLeft === 2) return 'Finale';
    if (playersLeft === 4) return 'Semifinale';
    if (playersLeft === 8) return 'Kvartfinale';
    return 'Sidste ' + playersLeft;
  }

  function fmtMoney(v) {
    return '£' + Math.round(v).toLocaleString('da-DK');
  }

  class World {
    constructor(state) { this.s = state; this._rk = null; }

    static create(opts) {
      const season = opts.season || 2027;
      const s = {
        version: 1, mode: opts.mode || 'career', season, week: 1, uid: 1,
        players: {}, stable: [], manager: opts.manager || 'Manager', difficulty: opts.difficulty || 'normal',
        money: opts.money != null ? opts.money : 25000, staff: { coach: 0, psych: 0, fitness: 0 },
        news: [], current: null, queue: [], weekStarted: false, pl: null, qs: {}, trophies: [], ledger: [],
        calendar: D.buildCalendar(), seasonLog: [],
      };
      const w = new World(s);
      w.populate();
      return w;
    }

    newId() { return 'p' + this.s.uid++; }

    makePlayer(o) {
      const p = Object.assign({
        id: this.newId(), name: 'Ukendt', nick: '', nat: 'ENG', born: this.s.season - 25,
        attr: { scoring: 60, doubles: 60, consistency: 60, nerve: 60, stamina: 60 }, pot: 70,
        real: false, own: false, tourCard: 0, earn: {}, form: 0, fatigue: 0, titles: [], wl: [0, 0],
        focus: 'scoring', plan: 'train', retired: false, best: { avg: 0, co: 0 },
      }, o);
      this.s.players[p.id] = p;
      return p;
    }

    genName(nat) {
      const f = D.FIRST[nat] || D.FIRST.ENG, l = D.LAST[nat] || D.LAST.ENG;
      for (let i = 0; i < 20; i++) {
        const n = f[Math.floor(Math.random() * f.length)] + ' ' + l[Math.floor(Math.random() * l.length)];
        if (!Object.values(this.s.players).some((p) => p.name === n)) return n;
      }
      return f[0] + ' ' + l[0] + ' ' + Math.floor(rnd(2, 99));
    }

    genPlayer(level, opt) {
      opt = opt || {};
      const nat = opt.nat || pickNat();
      const age = opt.age || Math.round(rnd(18, 45));
      const attr = {};
      for (const k of ATTRS) attr[k] = clamp(level + rnd(-5, 5), 15, 96);
      const youth = clamp((27 - age) / 9, 0, 1);
      const pot = clamp(Math.max(attr.scoring, attr.doubles) + youth * rnd(4, 20) + rnd(0, 3), 20, 98);
      return this.makePlayer({ name: this.genName(nat), nat, born: this.s.season - age, attr, pot });
    }

    populate() {
      const season = this.s.season;
      D.REAL.forEach((r, i) => {
        const [name, nick, nat, born, sc, db, co, ne, st] = r;
        const age = season - born;
        const top = Math.max(sc, db);
        const pot = clamp(top + (age < 22 ? 5 : age < 26 ? 3 : age < 30 ? 1 : 0), 0, 99);
        const p = this.makePlayer({ name, nick, nat, born, attr: { scoring: sc, doubles: db, consistency: co, nerve: ne, stamina: st }, pot, real: true });
        p.tourCard = season + (i % 2);
        const rank = i + 1;
        p.earn[season - 1] = { total: Math.round(3000000 * Math.pow(rank, -1.0) + 25000 + rnd(-5000, 5000)), pro: Math.round(150000 * Math.pow(rank, -0.6)), ct: 0 };
      });
      let n = D.REAL.length;
      // Fyld tourkort op til 128 med fiktive professionelle
      while (n < 128) {
        const p = this.genPlayer(rnd(70, 77), { age: Math.round(rnd(21, 42)) });
        p.tourCard = season + (n % 2);
        p.earn[season - 1] = { total: Math.round(rnd(15000, 40000)), pro: Math.round(rnd(8000, 25000)), ct: 0 };
        n++;
      }
      // Amatører og Challenge Tour-spillere
      for (let i = 0; i < 170; i++) {
        const lvl = i < 30 ? rnd(66, 73) : i < 90 ? rnd(57, 68) : rnd(45, 60);
        const p = this.genPlayer(lvl, { age: Math.round(rnd(17, 44)) });
        if (Math.random() < 0.3) p.earn[season - 1] = { total: 0, pro: 0, ct: Math.round(rnd(200, 4000)) };
      }
    }

    // ---------- Stald ----------
    addOwnPlayer(o) {
      const p = this.makePlayer(Object.assign({}, o, { own: true }));
      this.s.stable.push(p.id);
      return p;
    }
    addRealToStable(id) {
      if (!this.s.stable.includes(id)) this.s.stable.push(id);
      this.s.players[id].own = true;
    }
    isStable(id) { return this.s.stable.includes(id); }
    get stable() { return this.s.stable.map((id) => this.s.players[id]); }

    // ---------- Ranglister ----------
    active() { return Object.values(this.s.players).filter((p) => !p.retired); }
    oom(p) {
      const s = this.s.season;
      return ((p.earn[s - 1] && p.earn[s - 1].total) || 0) + ((p.earn[s] && p.earn[s].total) || 0);
    }
    pro(p) { const e = p.earn[this.s.season]; return (e && e.pro) || 0; }
    ct(p) { const e = p.earn[this.s.season]; return (e && e.ct) || 0; }
    invalidate() { this._rk = null; }
    rankings() {
      if (this._rk) return this._rk;
      const act = this.active();
      const oom = act.filter((p) => this.oom(p) > 0 || this.hasCard(p)).sort((a, b) => this.oom(b) - this.oom(a) || ovr(b) - ovr(a));
      const pro = act.filter((p) => this.hasCard(p)).sort((a, b) => this.pro(b) - this.pro(a) || this.oom(b) - this.oom(a));
      const ct = act.filter((p) => !this.hasCard(p)).sort((a, b) => this.ct(b) - this.ct(a) || ovr(b) - ovr(a));
      const pos = {};
      oom.forEach((p, i) => (pos[p.id] = i + 1));
      this._rk = { oom, pro, ct, pos };
      return this._rk;
    }
    rankOf(id) { return this.rankings().pos[id] || null; }
    hasCard(p) { return p.tourCard >= this.s.season; }
    tourPlayers() { return this.active().filter((p) => this.hasCard(p)); }

    // ---------- Turneringsfelt ----------
    fieldFor(type) {
      const t = D.T[type];
      const rk = this.rankings();
      const f = t.field;
      if (f === 'tour') return { list: rk.oom.filter((p) => this.hasCard(p)).map((p) => p.id), seeded: !t.unseeded };
      if (f.startsWith('oom:')) return { list: rk.oom.slice(0, +f.slice(4)).map((p) => p.id), seeded: true };
      if (f.startsWith('pro:')) return { list: rk.pro.slice(0, +f.slice(4)).map((p) => p.id), seeded: true };
      if (f === 'nontour') {
        const own = this.stable.filter((p) => !this.hasCard(p) && !p.retired);
        const rest = this.active().filter((p) => !this.hasCard(p) && !own.includes(p))
          .map((p) => ({ p, k: ovr(p) + rnd(-8, 8) })).sort((a, b) => b.k - a.k).map((x) => x.p);
        return { list: own.concat(rest).slice(0, t.size).map((p) => p.id), seeded: false };
      }
      if (f === 'worlds') {
        const chosen = new Set();
        const list = [];
        rk.oom.filter((p) => this.hasCard(p)).slice(0, 64).forEach((p) => { chosen.add(p.id); list.push(p.id); });
        rk.pro.filter((p) => !chosen.has(p.id)).slice(0, 32).forEach((p) => { chosen.add(p.id); list.push(p.id); });
        const quals = rk.ct.filter((p) => !chosen.has(p.id)).slice(0, 16);
        quals.forEach((p) => { chosen.add(p.id); list.push(p.id); });
        this.active().filter((p) => !chosen.has(p.id)).sort((a, b) => ovr(b) - ovr(a)).slice(0, 128 - list.length)
          .forEach((p) => { chosen.add(p.id); list.push(p.id); });
        return { list, seeded: true, seeds: 32 };
      }
      return { list: [], seeded: false };
    }

    eligible(type, id) {
      if (type === 'premier') return this.s.pl && this.s.pl.players.includes(id);
      return this.fieldFor(type).list.includes(id);
    }

    // ---------- Turneringer ----------
    createEvent(type, label, opt) {
      opt = opt || {};
      const t = D.T[type];
      let field = opt.field || this.fieldFor(type);
      let list = field.list.slice();
      if (opt.forceInclude && !list.includes(opt.forceInclude)) {
        list.pop();
        list.push(opt.forceInclude);
      }
      const size = opt.size || t.size;
      const slots = new Array(size).fill(null);
      const order = seedOrder(size);
      if (field.seeded) {
        const seeds = Math.min(field.seeds || list.length, list.length);
        const seeded = list.slice(0, seeds), rest = list.slice(seeds).sort(() => Math.random() - 0.5);
        const all = seeded.concat(rest);
        // seed n placeres på positionen hvor order[pos] === n
        const posOf = {};
        order.forEach((sd, pos) => (posOf[sd] = pos));
        if (seeds === list.length) all.forEach((id, i) => (slots[posOf[i + 1]] = id));
        else {
          seeded.forEach((id, i) => (slots[posOf[i + 1]] = id));
          const free = [];
          for (let i = 0; i < size; i++) if (slots[i] == null && order[i] <= list.length) free.push(i);
          free.sort(() => Math.random() - 0.5);
          rest.forEach((id, i) => (slots[free[i]] = id));
        }
      } else {
        const sh = list.slice().sort(() => Math.random() - 0.5);
        // fordel byes jævnt
        const posBy = order.map((sd, pos) => ({ sd, pos })).sort((a, b) => a.sd - b.sd);
        const pos = posBy.slice(0, sh.length).map((x) => x.pos).sort(() => Math.random() - 0.5);
        sh.forEach((id, i) => (slots[pos[i]] = id));
      }
      const R = Math.log2(size);
      const ev = {
        key: type + '-' + this.s.season + '-' + this.s.week + '-' + Math.floor(Math.random() * 1e6),
        type, label: label || t.name, season: this.s.season, week: this.s.week, size, R,
        sets: !!t.sets, doubleIn: !!t.doubleIn, rounds: (opt.rounds || t.rounds).slice(-R), prize: opt.prize || t.prize,
        round: 0, matches: [], done: false, out: {}, winner: null, entrants: list, special: opt.special || null,
      };
      ev.matches.push(this.pairRound(slots));
      this.autoByes(ev);
      return ev;
    }

    pairRound(slots) {
      const ms = [];
      for (let i = 0; i < slots.length; i += 2) {
        const a = slots[i], b = slots[i + 1];
        const m = { a, b, w: null, score: '' };
        if (a == null && b == null) { m.w = null; m.bye = true; m.empty = true; }
        else if (a == null || b == null) { m.w = a || b; m.bye = true; }
        ms.push(m);
      }
      return ms;
    }
    autoByes() {}

    fmtFor(ev, r) {
      const ft = ev.rounds[r];
      return ev.sets ? { type: 'sets', target: ft, legsPerSet: 3 } : { type: 'legs', target: ft };
    }
    fmtLabel(fmt) {
      return fmt.type === 'sets' ? `Best of ${fmt.target * 2 - 1} sets` : `Best of ${fmt.target * 2 - 1} legs`;
    }

    mods(p) {
      let m = 1 - (p.form || 0) * 0.006;
      m *= 1 + (p.fatigue || 0) * 0.0015;
      if (p.own) m *= 1 - this.s.staff.psych * 0.004;
      return m;
    }

    simMatch(aId, bId, fmt, doubleIn) {
      const A = this.s.players[aId], B = this.s.players[bId];
      const m = new E.Match(A, B, { format: fmt, doubleIn, mods: [this.mods(A), this.mods(B)] });
      m.simulate(200000);
      return this.resultFromMatch(m);
    }
    resultFromMatch(m) {
      const st = m.stats.map((s) => ({ avg: +E.avg(s).toFixed(2), co: +E.coPct(s).toFixed(1), t180: s.t180, hiCo: s.hiCo, legs: s.legs, dblHit: s.dblHit, dblAtt: s.dblAtt }));
      return { w: m.winner, score: m.resultString(), st };
    }

    // Registrér resultat for kamp idx i nuværende runde
    applyResult(ev, idx, res) {
      const m = ev.matches[ev.round][idx];
      m.w = res.w === 0 ? m.a : m.b;
      m.score = res.score;
      m.st = res.st;
      const W = this.s.players[m.w], L = this.s.players[m.w === m.a ? m.b : m.a];
      W.wl[0]++; L.wl[1]++;
      [m.a, m.b].forEach((id, i) => {
        const p = this.s.players[id];
        if (res.st[i].avg > (p.best.avg || 0)) p.best.avg = res.st[i].avg;
        if (res.st[i].hiCo > (p.best.co || 0)) p.best.co = res.st[i].hiCo;
        if (p.own) {
          p.form = clamp((p.form || 0) + (m.w === id ? 0.8 : -0.5) + (this.s.staff.psych * 0.1), -10, 10);
          p.fatigue = clamp((p.fatigue || 0) + 2 + ev.rounds[ev.round] * 0.3 / this.staffMult('fitness'), 0, 100);
          // match-erfaring
          const big = D.T[ev.type] && (D.T[ev.type].tier === 'Major' || D.T[ev.type].tier === 'VM');
          this.grow(p, 'nerve', big ? 0.08 : 0.03);
          this.grow(p, 'scoring', 0.015); this.grow(p, 'doubles', 0.015); this.grow(p, 'consistency', 0.02);
          if (ev.rounds[ev.round] >= 10) this.grow(p, 'stamina', 0.05);
        }
      });
      if (L.own || W.own) {
        const own = W.own ? W : L;
        const opp = own === W ? L : W;
        const i = m.a === own.id ? 0 : 1;
        const sc = m.a === own.id ? res.score : res.score.split('-').reverse().join('-');
        this.news(`${own.name} ${own === W ? 'slog' : 'tabte til'} ${opp.name} ${sc} (${ev.label}, ${this.roundLabel(ev)}) · snit ${res.st[i].avg}`, own === W ? 'win' : 'loss');
      }
    }

    roundLabel(ev, r) {
      r = r == null ? ev.round : r;
      if (ev.special === 'plnight') return 'Ligarunde ' + (this.s.pl ? this.s.pl.round + 1 : '');
      return roundName(ev.size / Math.pow(2, r));
    }

    ownMatchesPending(ev) {
      if (ev.done || ev.special === 'plnight' && false) return [];
      return ev.matches[ev.round].map((m, i) => ({ m, i })).filter((x) => x.m.w == null && !x.m.empty && (this.isStable(x.m.a) || this.isStable(x.m.b)));
    }

    simRest(ev, includeOwn) {
      const r = ev.round;
      ev.matches[r].forEach((m, i) => {
        if (m.w != null || m.empty) return;
        if (!includeOwn && (this.isStable(m.a) || this.isStable(m.b))) return;
        const res = this.simMatch(m.a, m.b, this.fmtFor(ev, r), ev.doubleIn);
        this.applyResult(ev, i, res);
      });
    }

    roundComplete(ev) { return ev.matches[ev.round].every((m) => m.w != null || m.empty); }

    // Gå videre til næste runde; returnerer true hvis turneringen er slut
    nextRound(ev) {
      if (!this.roundComplete(ev)) return false;
      const r = ev.round;
      if (ev.special === 'plnight') { this.finishPLNight(ev); return true; }
      ev.matches[r].forEach((m) => {
        if (m.bye || m.empty) return;
        const loser = m.w === m.a ? m.b : m.a;
        ev.out[loser] = r;
      });
      if (r === ev.R - 1) {
        const f = ev.matches[r][0];
        ev.winner = f.w;
        this.finishEvent(ev);
        return true;
      }
      const winners = ev.matches[r].map((m) => m.w);
      ev.matches.push(this.pairRound(winners));
      ev.round++;
      return false;
    }

    finishEvent(ev) {
      ev.done = true;
      const t = D.T[ev.type];
      const season = this.s.season;
      const pay = (id, amt) => {
        if (!amt) return;
        const p = this.s.players[id];
        const e = (p.earn[season] = p.earn[season] || { total: 0, pro: 0, ct: 0 });
        if (t.ct) e.ct += amt;
        else {
          if (t.ranked !== false) e.total += amt;
          if (t.pro) e.pro += amt;
        }
        if (p.own && this.s.mode === 'career') {
          this.s.money += amt;
          this.ledger(`Præmiepenge: ${p.name} – ${ev.label}`, amt);
        }
      };
      if (ev.special === 'plplayoff') {
        // PL præmier efter slutplacering
        const table = this.plTable();
        const prize = D.T.premier.prize;
        const finalists = ev.matches[1][0];
        pay(ev.winner, prize[0]);
        pay(finalists.w === finalists.a ? finalists.b : finalists.a, prize[1]);
        ev.matches[0].forEach((m) => pay(m.w === m.a ? m.b : m.a, prize[2]));
        table.slice(4).forEach((row, i) => pay(row.id, prize[4 + i]));
      } else {
        ev.entrants.forEach((id) => {
          const p = this.s.players[id];
          if (!p) return;
          const r = id === ev.winner ? ev.R : ev.out[id];
          if (r == null) return;
          const idx = ev.R - r; // 0 = vinder
          pay(id, ev.prize[idx] || 0);
        });
      }
      const W = this.s.players[ev.winner];
      if (ev.special !== 'plnight') {
        this.s.results = this.s.results || [];
        const fin = ev.matches[ev.R - 1] && ev.matches[ev.R - 1][0];
        this.s.results.push({ season, week: this.s.week, label: ev.label, type: ev.type, winner: ev.winner, score: fin ? fin.score : '', runner: fin ? (fin.w === fin.a ? fin.b : fin.a) : null });
        if (this.s.results.length > 400) this.s.results.splice(0, this.s.results.length - 400);
      }
      if (W) {
        W.titles.push({ season, name: ev.label, tier: t ? t.tier : '' });
        if (W.own) {
          this.s.trophies.push({ season, week: this.s.week, name: ev.label, player: W.name, tier: t ? t.tier : '' });
          this.news(`🏆 ${W.name} vinder ${ev.label}!`, 'trophy');
        } else if (t && (t.tier === 'Major' || t.tier === 'VM' || ev.special === 'plplayoff')) this.news(`${W.name} vinder ${ev.label}.`, 'info');
      }
      if (ev.type === 'qschool') {
        ev.entrants.forEach((id) => {
          const r = id === ev.winner ? ev.R : ev.out[id];
          this.s.qs[id] = Math.max(this.s.qs[id] || 0, r);
        });
      }
      this.invalidate();
    }

    // ---------- Premier League ----------
    startPL() {
      const ids = this.rankings().oom.filter((p) => this.hasCard(p)).slice(0, 8).map((p) => p.id);
      // round robin (cirkelmetoden), dobbelt
      const arr = ids.slice();
      const rounds = [];
      for (let r = 0; r < 7; r++) {
        const pairs = [];
        for (let i = 0; i < 4; i++) pairs.push([arr[i], arr[7 - i]]);
        rounds.push(pairs);
        arr.splice(1, 0, arr.pop());
      }
      const sched = rounds.concat(rounds.map((rr) => rr.map(([a, b]) => [b, a])));
      const table = {};
      ids.forEach((id) => (table[id] = { id, p: 0, w: 0, l: 0, lf: 0, la: 0, pts: 0 }));
      this.s.pl = { players: ids, sched, round: 0, table, season: this.s.season };
      this.news('Premier League-feltet er klar: ' + ids.map((id) => this.s.players[id].name).join(', '), 'info');
    }
    plTable() {
      if (!this.s.pl) return [];
      return Object.values(this.s.pl.table).sort((a, b) => b.pts - a.pts || (b.lf - b.la) - (a.lf - a.la) || b.lf - a.lf);
    }
    createPLNight() {
      const pl = this.s.pl;
      const pairs = pl.sched[pl.round];
      return {
        key: 'pl-' + this.s.season + '-' + pl.round, type: 'premier', label: 'Premier League – runde ' + (pl.round + 1), special: 'plnight',
        season: this.s.season, week: this.s.week, size: 8, R: 1, sets: false, doubleIn: false, rounds: [D.T.premier.legs], prize: [],
        round: 0, matches: [pairs.map(([a, b]) => ({ a, b, w: null, score: '' }))], done: false, out: {}, entrants: pl.players,
      };
    }
    finishPLNight(ev) {
      const pl = this.s.pl;
      ev.matches[0].forEach((m) => {
        const [la, lb] = m.score.split('-').map(Number);
        const A = pl.table[m.a], B = pl.table[m.b];
        A.p++; B.p++; A.lf += la; A.la += lb; B.lf += lb; B.la += la;
        if (m.w === m.a) { A.w++; B.l++; A.pts += 2; } else { B.w++; A.l++; B.pts += 2; }
      });
      pl.round++;
      ev.done = true;
    }
    createPLPlayoff() {
      const top = this.plTable().slice(0, 4).map((r) => r.id);
      return this.createEvent('premier', 'Premier League Play-Offs', { field: { list: top, seeded: true }, size: 4, rounds: D.T.premier.playoff, special: 'plplayoff' });
    }

    // ---------- Uge-flow (karriere) ----------
    weekEvents() {
      const evs = (this.s.calendar[this.s.week] || []).slice();
      const pl = this.s.pl;
      if (pl && pl.season === this.s.season && D.PL_WEEKS.includes(this.s.week) && pl.round < pl.sched.length) evs.push({ type: 'plnight', label: 'Premier League' });
      if (pl && pl.season === this.s.season && this.s.week === D.PL_PLAYOFF_WEEK) evs.push({ type: 'plplayoff', label: 'Premier League Play-Offs' });
      return evs;
    }

    startWeek() {
      if (this.s.week === 6 && (!this.s.pl || this.s.pl.season !== this.s.season)) this.startPL();
      this.s.queue = this.weekEvents();
      this.s.weekStarted = true;
      this.s.playedThisWeek = [];
    }

    // Kør køen indtil en turnering kræver brugeren. Returnerer 'event' eller 'week-done'.
    processQueue() {
      while (true) {
        if (this.s.current && !this.s.current.done) return 'event';
        if (this.s.current && this.s.current.done) {
          this.afterEventDone(this.s.current);
          this.s.lastEvent = this.summarize(this.s.current);
          this.s.current = null;
        }
        const next = this.s.queue.shift();
        if (!next) return 'week-done';
        let ev;
        if (next.type === 'plnight') ev = this.createPLNight();
        else if (next.type === 'plplayoff') ev = this.createPLPlayoff();
        else ev = this.createEvent(next.type, next.label);
        const ownIn = ev.entrants.filter((id) => this.isStable(id));
        if (next.type === 'qschool' && ev.label.endsWith('1')) this.s.qs = {};
        if (ownIn.length) {
          ownIn.forEach((id) => this.s.playedThisWeek.push(id));
          this.chargeTravel(ev, ownIn);
          this.s.current = ev;
          return 'event';
        }
        // ingen egne spillere: simulér hele turneringen
        this.simWhole(ev);
        if (next.type === 'qschool' && ev.label.endsWith('2')) this.awardQSchool();
      }
    }

    afterEventDone(ev) {
      if (ev.type === 'qschool' && ev.label.endsWith('2')) this.awardQSchool();
    }

    simWhole(ev) {
      while (!ev.done) {
        this.simRest(ev, true);
        this.nextRound(ev);
      }
    }

    summarize(ev) {
      return { label: ev.label, winner: ev.winner, special: ev.special };
    }

    chargeTravel(ev, ids) {
      if (this.s.mode !== 'career') return;
      const t = D.T[ev.type] || {};
      const per = ev.type === 'qschool' ? 450 : t.tier === 'Challenge Tour' ? 150 : t.tier === 'Pro Tour' ? 350 : t.tier === 'European Tour' ? 600 : 800;
      const cost = per * ids.length;
      this.s.money -= cost;
      this.ledger(`Rejse/indskud – ${ev.label}`, -cost);
    }

    awardQSchool() {
      const holders = this.tourPlayers().length;
      const cand = Object.entries(this.s.qs).map(([id, r]) => ({ id, r, k: r + Math.random() * 0.5 })).sort((a, b) => b.k - a.k);
      let slots = Math.max(8, 128 - holders);
      const winners = [];
      for (const c of cand) {
        if (slots <= 0) break;
        const p = this.s.players[c.id];
        if (this.hasCard(p)) continue;
        p.tourCard = this.s.season + 1;
        winners.push(p);
        slots--;
      }
      winners.filter((p) => p.own).forEach((p) => this.news(`🎉 ${p.name} har vundet et PDC Tour Card via Q-School!`, 'trophy'));
      const ownFail = this.stable.filter((p) => !this.hasCard(p) && this.s.qs[p.id] != null);
      ownFail.forEach((p) => this.news(`${p.name} fik ikke et tourkort på Q-School. Challenge Tour venter.`, 'loss'));
      this.news(`Q-School: ${winners.length} spillere har vundet tourkort.`, 'info');
      this.s.qs = {};
      this.invalidate();
    }

    staffMult(k) { return STAFF[k].mult[this.s.staff[k]]; }

    grow(p, k, amt) {
      const age = this.s.season - p.born;
      const ageF = age < 22 ? 1.4 : age < 27 ? 1.15 : age < 31 ? 0.9 : age < 35 ? 0.6 : 0.3;
      const room = clamp((p.pot + (k === 'scoring' || k === 'doubles' ? 0 : 4) - p.attr[k]) / 15, 0.05, 1.2);
      p.attr[k] = clamp(p.attr[k] + amt * ageF * room, 1, 99);
    }

    endWeek() {
      const s = this.s;
      if (s.mode === 'career') {
        // Træning / hvile / opvisning for egne spillere
        this.stable.forEach((p) => {
          const played = s.playedThisWeek.includes(p.id);
          const rec = 10 * this.staffMult('fitness');
          if (played) { p.fatigue = clamp(p.fatigue - rec * 0.3, 0, 100); return; }
          if (p.plan === 'rest') {
            p.fatigue = clamp(p.fatigue - rec * 2.2, 0, 100);
            p.form = p.form * 0.9;
          } else if (p.plan === 'exhibition') {
            const rk = this.rankOf(p.id) || 300;
            const fee = Math.round(clamp(9000 - rk * 60, 600, 9000));
            s.money += fee;
            this.ledger(`Opvisning: ${p.name}`, fee);
            p.fatigue = clamp(p.fatigue + 8, 0, 100);
            this.grow(p, 'nerve', 0.03);
          } else {
            const mult = this.staffMult('coach') * (p.plan === 'hard' ? 1.6 : 1);
            const fatF = 1 - p.fatigue / 150;
            this.grow(p, p.focus, 0.11 * mult * fatF);
            ATTRS.filter((k) => k !== p.focus).forEach((k) => this.grow(p, k, 0.015 * mult * fatF));
            if (p.focus === 'nerve' && s.staff.psych) this.grow(p, 'nerve', 0.05 * s.staff.psych);
            if (p.focus === 'stamina') this.grow(p, 'stamina', 0.05 * (this.staffMult('fitness') - 1));
            p.fatigue = clamp(p.fatigue + (p.plan === 'hard' ? 9 : 2) - rec * 0.5, 0, 100);
          }
          p.form = clamp(p.form * 0.85, -10, 10);
        });
        // Løn til stab
        const wages = Object.keys(STAFF).reduce((sum, k) => sum + STAFF[k].cost[s.staff[k]], 0);
        if (wages) { s.money -= wages; this.ledger('Løn til stab', -wages); }
        // Sponsorer
        const sp = this.sponsorIncome();
        if (sp) { s.money += sp; this.ledger('Sponsorindtægt', sp); }
        if (s.money < 0 && s.week % 4 === 0) this.news('⚠️ Økonomien er i minus. Skær ned på stab eller tag på opvisning.', 'loss');
      }
      s.weekStarted = false;
      s.week++;
      if (s.week > 52) this.endSeason();
      this.invalidate();
    }

    sponsorIncome() {
      let tot = 0;
      this.stable.forEach((p) => {
        const rk = this.rankOf(p.id);
        if (rk && rk <= 128) tot += Math.round(clamp(4000 - rk * 28, 150, 4000));
        else if (this.hasCard(p)) tot += 100;
      });
      return tot;
    }

    endSeason() {
      const s = this.s;
      const old = s.season;
      const rk = this.rankings();
      // Challenge Tour top 2 får tourkort
      rk.ct.slice(0, 2).forEach((p) => {
        p.tourCard = old + 2;
        this.news(`${p.name} vinder et tourkort via Challenge Tour-ranglisten.`, p.own ? 'trophy' : 'info');
      });
      // Tourkort: top 64 forlænges
      rk.oom.forEach((p, i) => {
        if (p.tourCard === old && i < 64) p.tourCard = old + 2;
      });
      const lost = this.active().filter((p) => p.tourCard === old);
      lost.filter((p) => p.own).forEach((p) => this.news(`${p.name} har mistet sit tourkort (rangeret ${this.rankOf(p.id) || '–'}). Q-School næste.`, 'loss'));
      s.seasonLog.push({ season: old, top: rk.oom.slice(0, 10).map((p) => ({ name: p.name, money: this.oom(p) })), stable: this.stable.map((p) => ({ name: p.name, rank: this.rankOf(p.id), titles: p.titles.filter((t) => t.season === old).length })) });
      // Ny sæson
      s.season++;
      s.week = 1;
      // Aldring og udvikling
      this.active().forEach((p) => {
        const age = s.season - p.born;
        ATTRS.forEach((k) => {
          let d = 0;
          if (!p.own) {
            if (age < 24) d = (p.pot - p.attr[k]) * rnd(0.05, 0.3);
            else if (age < 30) d = (p.pot - p.attr[k]) * rnd(0, 0.12) + rnd(-0.8, 0.8);
            else if (age < 36) d = rnd(-1, 0.6);
            else d = rnd(-1.8, 0.2) - (k === 'stamina' ? 0.6 : 0);
          } else if (age >= 34) d = rnd(-1.2, 0) - (k === 'stamina' ? 0.5 : 0);
          p.attr[k] = clamp(p.attr[k] + d, 10, 99);
        });
        if (!p.own && !this.hasCard(p) && age > 42 && Math.random() < 0.25) p.retired = true;
        if (!p.own && age > 55 && Math.random() < 0.4) p.retired = true;
      });
      // Nye talenter
      const amateurs = this.active().filter((p) => !this.hasCard(p)).length;
      for (let i = amateurs; i < 170; i++) {
        const young = Math.random() < 0.6;
        this.genPlayer(young ? rnd(50, 68) : rnd(50, 70), { age: young ? Math.round(rnd(16, 21)) : Math.round(rnd(22, 40)) });
      }
      s.pl = s.pl && s.pl.season === old ? null : s.pl;
      this.stable.forEach((p) => { p.fatigue = 0; });
      this.news(`Sæson ${s.season} begynder! Q-School spilles i uge 2.`, 'info');
      this.invalidate();
    }

    news(text, type) {
      this.s.news.unshift({ season: this.s.season, week: this.s.week, text, type: type || 'info' });
      if (this.s.news.length > 200) this.s.news.length = 200;
    }
    ledger(text, amt) {
      this.s.ledger.unshift({ season: this.s.season, week: this.s.week, text, amt });
      if (this.s.ledger.length > 300) this.s.ledger.length = 300;
    }
  }

  G.DartWorld = { World, ATTRS, ATTR_DA, STAFF, ovr, expAvg, roundName, fmtMoney, seedOrder };
})(typeof window !== 'undefined' ? window : globalThis);
