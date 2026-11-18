// Pro Dart Manager — spillerbilleder: rigtige, frit licenserede fotos (Wikimedia Commons),
// egne uploadede fotos eller en neutral silhuet.
(function (G) {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function photoOf(p) {
    if (!p) return null;
    if (p.photo) return { url: p.photo, own: true };
    const ph = (G.PLAYER_PHOTOS || {})[p.name];
    return ph && ph.url ? ph : null;
  }
  function credit(p) {
    const ph = photoOf(p);
    if (!ph || ph.own) return '';
    return `Foto: ${ph.author || 'ukendt'} · ${ph.license} · Wikimedia Commons`;
  }

  const SIL = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="silg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4560"/><stop offset="1" stop-color="#151b2b"/></linearGradient></defs><rect width="100" height="100" fill="#0d1322"/><path d="M50 18c11 0 19 9 19 21 0 9-4 16-9 20 15 4 27 13 30 41H10c3-28 15-37 30-41-5-4-9-11-9-20 0-12 8-21 19-21z" fill="url(#silg)"/></svg>`;

  // Lille rundt billede (lister, kort, stillingslinje)
  function head(p, size) {
    const ph = photoOf(p);
    const st = `width:${size}px;height:${size}px`;
    if (ph) return `<span class="avatar" style="${st}"><img src="${esc(ph.url)}" alt="" loading="lazy" referrerpolicy="no-referrer" style="object-position:${ph.pos || '50% 22%'}" onerror="this.parentNode.innerHTML=window.Avatar.silhouette()"></span>`;
    return `<span class="avatar" style="${st}">${SIL}</span>`;
  }

  // Stort portræt ved kastelinjen (kampskærm)
  function thrower(p) {
    const ph = photoOf(p);
    const img = ph
      ? `<img src="${esc(ph.url)}" alt="${esc(p.name)}" referrerpolicy="no-referrer" style="object-position:${ph.pos || '50% 22%'}" onerror="this.outerHTML=window.Avatar.silhouette()">`
      : SIL;
    const cr = credit(p);
    return `<div class="oche-photo">${img}<div class="oche-glow"></div></div>${cr ? `<div class="oche-credit" title="${esc(cr)}">${esc(cr)}</div>` : ''}`;
  }

  G.Avatar = { head, thrower, photoOf, credit, silhouette: () => SIL };
})(window);
