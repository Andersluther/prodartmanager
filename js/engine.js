// Pro Dart Manager — dartmotor: skive-geometri, kast-fysik, checkout-logik og kamp-tilstand
(function (G) {
  'use strict';
  const SEG = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  const SEGIDX = {};
  SEG.forEach((n, i) => (SEGIDX[n] = i));
  // Officielle mål i mm (radius)
  const BR = { bull: 6.35, obull: 15.9, tIn: 99, tOut: 107, dIn: 162, dOut: 170 };

  function hitAt(x, y) {
    // x mod højre, y op (mm fra centrum)
    const r = Math.hypot(x, y);
    if (r <= BR.bull) return { n: 25, m: 2, v: 50, label: 'BULL' };
    if (r <= BR.obull) return { n: 25, m: 1, v: 25, label: '25' };
    if (r > BR.dOut) return { n: 0, m: 0, v: 0, label: 'Miss' };
    let a = (Math.atan2(x, y) * 180) / Math.PI;
    a = (a + 9 + 360) % 360;
    const n = SEG[Math.floor(a / 18) % 20];
    let m = 1;
    if (r >= BR.dIn) m = 2;
    else if (r >= BR.tIn && r <= BR.tOut) m = 3;
    return { n, m, v: n * m, label: (m === 3 ? 'T' : m === 2 ? 'D' : '') + n };
  }

  function targetPoint(t) {
    if (t.n === 25) return { x: 0, y: 0 };
    const ang = (SEGIDX[t.n] * 18 * Math.PI) / 180;
    const r = t.m === 3 ? 103 : t.m === 2 ? 166 : t.inner ? 58 : 134;
    return { x: r * Math.sin(ang), y: r * Math.cos(ang) };
  }

  function tLabel(t) {
    if (!t) return '';
    if (t.n === 25) return t.m === 2 ? 'Bull' : '25';
    return (t.m === 3 ? 'T' : t.m === 2 ? 'D' : 'S') + t.n;
  }

  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Attribut (0-100) -> spredning i mm. Kalibreret: 99 ≈ 107 i snit, 90 ≈ 96, 75 ≈ 85, 50 ≈ 67, 25 ≈ 50.
  function sigmaFromAttr(a) {
    a = Math.max(1, Math.min(100, a));
    const d = 100 - a;
    return 5.4 + 0.12 * d + 0.0055 * Math.pow(Math.max(0, d - 50), 2);
  }

  // ---------- Checkout-planlægning ----------
  const isDoubleFinish = (r) => (r > 0 && r <= 40 && r % 2 === 0) || r === 50;
  function dq(r) {
    if (r === 50) return 4;
    let base = 5, h = r / 2;
    while (h % 2 === 0 && h > 0) { base += 0.8; h /= 2; }
    if (r === 40) base += 2.4;
    if (r === 32) base += 2.0;
    if (r === 36 || r === 24) base += 0.6;
    if (r < 8) base -= 1;
    return base;
  }
  const THROWS = [];
  for (let n = 20; n >= 1; n--) {
    THROWS.push({ n, m: 3, v: 3 * n, c: n >= 17 ? 3.15 + (20 - n) * 0.03 : 3.35 });
    THROWS.push({ n, m: 1, v: n, c: 3.0 });
  }
  THROWS.push({ n: 25, m: 1, v: 25, c: 4.2 });
  THROWS.push({ n: 25, m: 2, v: 50, c: 4.8 });

  const memo = {};
  function plan(rem, k) {
    const key = rem * 4 + k;
    if (memo[key]) return memo[key];
    let best = { q: -99, t: null };
    if (rem < 2) return (memo[key] = best);
    if (isDoubleFinish(rem) && !(rem === 50 && k > 1)) {
      best = { q: dq(rem) + (k - 1) * 0.5, t: rem === 50 ? { n: 25, m: 2 } : { n: rem / 2, m: 2 } };
      return (memo[key] = best);
    }
    if (k > 1 && rem <= 170) {
      for (const t of THROWS) {
        const left = rem - t.v;
        if (left < 2) continue;
        const sub = plan(left, k - 1);
        if (sub.q <= -99) continue;
        const q = sub.q - t.c;
        if (q > best.q) best = { q, t: { n: t.n, m: t.m } };
      }
    }
    if (rem === 50 && best.q <= -99) best = { q: dq(50), t: { n: 25, m: 2 } };
    return (memo[key] = best);
  }

  function chooseTarget(rem, k, needDoubleIn) {
    if (needDoubleIn) return { n: 20, m: 2 };
    const p = plan(rem, k);
    if (p.t) return p.t;
    // Ikke muligt at checke ud: scor eller stil op
    let best = null, bv = -1e9;
    for (const t of THROWS) {
      if (t.m === 2 && t.n !== 25) continue;
      if (t.m === 1 && t.n !== 25 && rem > 120) continue;
      const left = rem - t.v;
      if (left < 2) continue;
      let val;
      if (left <= 170) {
        const pp = plan(left, 3);
        val = pp.q > -99 ? 4 + pp.q * 0.6 : -3;
        if (left <= 40 && isDoubleFinish(left)) val += 2;
      } else val = 0;
      val += t.v * 0.03 - (t.m === 3 ? 0 : 0.2);
      if (t.n === 20 && t.m === 3) val += 0.15;
      if (val > bv) { bv = val; best = { n: t.n, m: t.m }; }
    }
    return best || { n: 20, m: 3 };
  }

  function checkoutRoute(rem, k) {
    if (rem > 170 || rem < 2) return null;
    const route = [];
    let r = rem;
    for (let d = k; d >= 1; d--) {
      const p = plan(r, d);
      if (!p.t) return null;
      route.push(tLabel(p.t));
      r -= p.t.n * p.t.m;
      if (r === 0) return route;
    }
    return null;
  }

  // ---------- Spillerkræfter ----------
  function effAttr(p, key) {
    return p.attr[key];
  }

  function newStats() {
    return { darts: 0, points: 0, t180: 0, t140: 0, t100: 0, dblAtt: 0, dblHit: 0, hiCo: 0, legs: 0, first9pts: 0, first9darts: 0, best: 0 };
  }

  // ---------- Kamp ----------
  class Match {
    constructor(pA, pB, opts) {
      opts = opts || {};
      this.p = [pA, pB];
      this.fmt = opts.format || { type: 'legs', target: 6 };
      this.doubleIn = !!opts.doubleIn;
      this.startScore = opts.startScore || 501;
      this.sets = [0, 0];
      this.legs = [0, 0];
      this.legsTotal = 0;
      this.setStarter = opts.firstThrow != null ? opts.firstThrow : Math.random() < 0.5 ? 0 : 1;
      this.legStarter = this.setStarter;
      this.stats = [newStats(), newStats()];
      this.form = [0, 1].map((i) => {
        const p = this.p[i];
        const cons = p.attr.consistency;
        return Math.exp(gauss() * (0.02 + 0.1 * (1 - cons / 100)));
      });
      this.mods = opts.mods || [1, 1];
      this.over = false;
      this.winner = null;
      this.log = [];
      this.newLeg();
    }
    newLeg() {
      this.rem = [this.startScore, this.startScore];
      this.started = [!this.doubleIn, !this.doubleIn];
      this.turn = this.legStarter;
      this.legDarts = [0, 0];
      this.legVisits = [0, 0];
      this.startVisit();
    }
    startVisit() {
      this.visit = { darts: [], startRem: this.rem[this.turn], startStarted: this.started[this.turn], score: 0 };
    }
    get dartsLeft() { return 3 - this.visit.darts.length; }
    needsDoubleIn(i) { return this.doubleIn && !this.started[i == null ? this.turn : i]; }
    isLegDart() { return isDoubleFinish(this.rem[this.turn]) && !this.needsDoubleIn(); }
    isMatchDart() {
      if (!this.isLegDart()) return false;
      const i = this.turn;
      if (this.fmt.type === 'legs') return this.legs[i] + 1 >= this.fmt.target;
      return this.legs[i] + 1 >= (this.fmt.legsPerSet || 3) && this.sets[i] + 1 >= this.fmt.target;
    }
    sigmaFor(target, i) {
      i = i == null ? this.turn : i;
      const p = this.p[i];
      const dbl = target && target.m === 2;
      let s = G.DartEngine.sigmaFromAttr(dbl ? effAttr(p, 'doubles') : effAttr(p, 'scoring'));
      s *= this.form[i] * this.mods[i];
      // Træthed i lange kampe
      const extra = Math.max(0, this.legsTotal - 8);
      s *= 1 + extra * (1 - p.attr.stamina / 100) * 0.006;
      // Pres
      const nerve = p.attr.nerve;
      if (dbl && this.isLegDart()) {
        const md = this.isMatchDart();
        s *= 1 + (1 - nerve / 100) * (md ? 0.5 : 0.22);
      } else if (this.rem[1 - i] <= 100 && !this.needsDoubleIn(1 - i)) {
        s *= 1 + (1 - nerve / 100) * 0.08;
      }
      return s;
    }
    aiTarget() {
      return chooseTarget(this.rem[this.turn], this.dartsLeft, this.needsDoubleIn());
    }
    aiThrow() {
      const t = this.aiTarget();
      const tp = targetPoint(t);
      const s = this.sigmaFor(t);
      const x = tp.x + gauss() * s;
      const y = tp.y + gauss() * s * 1.12;
      return { target: t, x, y, hit: hitAt(x, y) };
    }
    // Registrér en pil. Returnerer hændelse.
    throwDart(hit, pos) {
      if (this.over) return { type: 'over' };
      const i = this.turn;
      const st = this.stats[i];
      const legDart = this.isLegDart();
      if (legDart) st.dblAtt++;
      this.visit.darts.push({ hit, pos });
      this.legDarts[i]++;
      let v = hit.v;
      if (this.needsDoubleIn(i)) {
        if (hit.m === 2) this.started[i] = true;
        else v = 0;
      }
      const nr = this.rem[i] - v;
      if (nr < 0 || nr === 1 || (nr === 0 && hit.m !== 2)) {
        // Bust
        this.rem[i] = this.visit.startRem;
        this.started[i] = this.visit.startStarted;
        const n = this.visit.darts.length;
        this.recordVisit(i, 0, n);
        const ev = { type: 'bust', player: i, darts: this.visit.darts.slice() };
        this.endVisit();
        return ev;
      }
      this.rem[i] = nr;
      this.visit.score += v;
      if (nr === 0) {
        st.dblHit++;
        const co = this.visit.startRem;
        if (co > st.hiCo) st.hiCo = co;
        this.recordVisit(i, this.visit.score, this.visit.darts.length);
        const legDartsUsed = this.legDarts[i];
        if (!st.best || legDartsUsed < st.best) st.best = legDartsUsed;
        return this.legWon(i, co, legDartsUsed);
      }
      if (this.visit.darts.length >= 3) {
        const sc = this.visit.score;
        this.recordVisit(i, sc, 3);
        const ev = { type: 'visit', player: i, score: sc, darts: this.visit.darts.slice() };
        this.endVisit();
        return ev;
      }
      return { type: 'dart', player: i };
    }
    recordVisit(i, score, n) {
      const st = this.stats[i];
      st.darts += n;
      st.points += score;
      this.legVisits[i]++;
      if (this.legVisits[i] <= 3) { st.first9pts += score; st.first9darts += n; }
      if (score === 180) st.t180++;
      else if (score >= 140) st.t140++;
      else if (score >= 100) st.t100++;
    }
    endVisit() {
      this.lastVisit = this.lastVisit || [null, null];
      this.lastVisit[this.turn] = this.visit;
      this.turn = 1 - this.turn;
      this.startVisit();
    }
    legWon(i, checkout, darts) {
      this.legs[i]++;
      this.legsTotal++;
      this.stats[i].legs++;
      const ev = { type: 'leg', player: i, checkout, darts };
      if (this.fmt.type === 'legs') {
        if (this.legs[i] >= this.fmt.target) return this.finish(i, ev);
        this.legStarter = 1 - this.legStarter;
      } else {
        const lps = this.fmt.legsPerSet || 3;
        if (this.legs[i] >= lps) {
          this.sets[i]++;
          ev.set = true;
          if (this.sets[i] >= this.fmt.target) return this.finish(i, ev);
          this.legs = [0, 0];
          this.setStarter = 1 - this.setStarter;
          this.legStarter = this.setStarter;
        } else this.legStarter = 1 - this.legStarter;
      }
      this.lastVisit = [null, null];
      this.newLeg();
      return ev;
    }
    finish(i, ev) {
      this.over = true;
      this.winner = i;
      ev.match = true;
      return ev;
    }
    simulate(maxDarts) {
      let n = 0;
      while (!this.over && n < (maxDarts || 1e7)) {
        const th = this.aiThrow();
        this.throwDart(th.hit);
        n++;
      }
      return this;
    }
    scoreText(i) {
      return this.fmt.type === 'sets' ? `${this.sets[i]}` : `${this.legs[i]}`;
    }
    resultString() {
      if (this.fmt.type === 'sets') return `${this.sets[0]}-${this.sets[1]}`;
      return `${this.legs[0]}-${this.legs[1]}`;
    }
  }

  function avg(st) { return st.darts ? (st.points / st.darts) * 3 : 0; }
  function coPct(st) { return st.dblAtt ? (st.dblHit / st.dblAtt) * 100 : 0; }

  G.DartEngine = { SEG, SEGIDX, BR, hitAt, targetPoint, tLabel, gauss, sigmaFromAttr, chooseTarget, checkoutRoute, isDoubleFinish, Match, avg, coPct, newStats };
})(typeof window !== 'undefined' ? window : globalThis);
