// Pro Dart Manager — tegnede spillerfigurer (tegneserie, ikke portrætter af rigtige personer)
(function (G) {
  'use strict';
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  const SKIN = ['#f6d3b8', '#eec1a0', '#e0a98a', '#c98e6b', '#a8704f', '#7d4f36'];
  const HAIR = ['#1f1a17', '#3b2a20', '#5b3a24', '#8a5a2b', '#c49a5a', '#e4c98b', '#9ca3af', '#d6d3d1'];
  const SHIRT = [['#e11d48', '#111827'], ['#2563eb', '#fbbf24'], ['#16a34a', '#f8fafc'], ['#f97316', '#1f2937'], ['#7c3aed', '#22d3ee'], ['#facc15', '#111827'], ['#0f172a', '#ef4444'], ['#db2777', '#f9a8d4'], ['#0891b2', '#f8fafc'], ['#111827', '#a3e635'], ['#dc2626', '#fde047'], ['#1d4ed8', '#f472b6']];
  const NAT_SKIN = { JPN: [0, 1, 2], PHI: [2, 3, 4], RSA: [1, 2, 3, 4, 5], USA: [0, 1, 2, 3, 4, 5], AUS: [0, 1, 2, 3], NZL: [1, 2, 3, 4] };

  function look(p) {
    if (p.look) return p.look;
    const r = rng(hash(p.name + '|' + (p.nick || '')));
    const age = p.born ? new Date().getFullYear() - p.born : 30;
    const skinPool = NAT_SKIN[p.nat] || [0, 0, 1, 1, 2];
    const grey = age > 50 ? 0.6 : age > 42 ? 0.3 : 0;
    const hairCol = r() < grey ? (r() < 0.5 ? 6 : 7) : Math.floor(r() * 6);
    const bald = age > 38 && r() < 0.35;
    return {
      skin: SKIN[skinPool[Math.floor(r() * skinPool.length)]],
      hair: HAIR[hairCol],
      style: bald ? 'bald' : ['short', 'short', 'quiff', 'spiky', 'side', 'long', 'buzz'][Math.floor(r() * 7)],
      beard: r() < (age > 28 ? 0.45 : 0.2) ? (r() < 0.5 ? 'full' : 'stubble') : 'none',
      glasses: r() < 0.15,
      shirt: SHIRT[Math.floor(r() * SHIRT.length)],
      pattern: ['flames', 'stripes', 'chevron', 'plain', 'side'][Math.floor(r() * 5)],
      build: 0.9 + r() * 0.35,
    };
  }

  function hairSvg(L) {
    const c = L.hair;
    switch (L.style) {
      case 'bald': return '';
      case 'buzz': return `<path d="M30 40 Q50 18 70 40 Q66 30 50 28 Q34 30 30 40Z" fill="${c}" opacity=".75"/>`;
      case 'quiff': return `<path d="M29 42 Q27 22 46 18 Q62 12 72 26 Q74 34 71 42 Q66 30 50 30 Q36 30 29 42Z" fill="${c}"/>`;
      case 'spiky': return `<path d="M29 42 L30 26 L36 30 L39 18 L45 27 L50 15 L55 27 L61 18 L64 30 L70 26 L71 42 Q64 31 50 31 Q36 31 29 42Z" fill="${c}"/>`;
      case 'side': return `<path d="M28 44 Q26 22 50 20 Q74 22 72 44 Q70 32 58 29 Q44 34 30 36Z" fill="${c}"/>`;
      case 'long': return `<path d="M27 60 Q22 24 50 20 Q78 24 73 60 L69 60 Q70 36 58 31 Q44 36 31 38 Q30 50 31 60Z" fill="${c}"/>`;
      default: return `<path d="M29 42 Q28 22 50 21 Q72 22 71 42 Q68 30 50 29 Q32 30 29 42Z" fill="${c}"/>`;
    }
  }
  function beardSvg(L) {
    if (L.beard === 'none') return '';
    const op = L.beard === 'stubble' ? 0.35 : 0.95;
    return `<path d="M31 50 Q32 70 50 74 Q68 70 69 50 Q66 62 58 63 Q50 60 42 63 Q34 62 31 50Z" fill="${L.hair}" opacity="${op}"/>`;
  }
  function shirtPattern(L, id) {
    const [, acc] = L.shirt;
    switch (L.pattern) {
      case 'flames': return `<path d="M14 120 Q20 100 26 108 Q28 94 36 104 Q40 92 46 106 L40 120Z M86 120 Q80 100 74 108 Q72 94 64 104 Q60 92 54 106 L60 120Z" fill="${acc}" clip-path="url(#c${id})"/>`;
      case 'stripes': return `<g clip-path="url(#c${id})" fill="${acc}"><rect x="0" y="92" width="100" height="5"/><rect x="0" y="104" width="100" height="5"/></g>`;
      case 'chevron': return `<path d="M10 92 L50 110 L90 92 L90 99 L50 117 L10 99Z" fill="${acc}" clip-path="url(#c${id})"/>`;
      case 'side': return `<g clip-path="url(#c${id})" fill="${acc}"><rect x="10" y="80" width="12" height="40"/><rect x="78" y="80" width="12" height="40"/></g>`;
      default: return '';
    }
  }

  let uid = 0;
  // Hoved og skuldre (til kort, lister, stillingslinje)
  function head(p, size) {
    const L = look(p);
    const id = 'a' + ++uid;
    const [shirt, acc] = L.shirt;
    const w = 26 * L.build;
    return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <defs><clipPath id="c${id}"><path d="M${50 - w - 12} 100 Q${50 - w - 10} 78 ${50 - w + 6} 76 L${50 + w - 6} 76 Q${50 + w + 10} 78 ${50 + w + 12} 100Z"/></clipPath><clipPath id="r${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>
      <g clip-path="url(#r${id})">
        <rect width="100" height="100" fill="${acc}" opacity=".18"/>
        <path d="M${50 - w - 12} 100 Q${50 - w - 10} 78 ${50 - w + 6} 76 L${50 + w - 6} 76 Q${50 + w + 10} 78 ${50 + w + 12} 100Z" fill="${shirt}"/>
        ${shirtPattern(L, id)}
        <path d="M43 70 L57 70 L56 79 Q50 83 44 79Z" fill="${L.skin}"/>
        <path d="M44 77 L50 84 L56 77" fill="none" stroke="${acc}" stroke-width="2.5"/>
        <ellipse cx="29" cy="50" rx="4" ry="6" fill="${L.skin}"/><ellipse cx="71" cy="50" rx="4" ry="6" fill="${L.skin}"/>
        <ellipse cx="50" cy="48" rx="21" ry="25" fill="${L.skin}"/>
        ${beardSvg(L)}
        ${hairSvg(L)}
        <circle cx="42" cy="47" r="2.2" fill="#1f2937"/><circle cx="58" cy="47" r="2.2" fill="#1f2937"/>
        <path d="M38 41 Q42 39 46 41 M54 41 Q58 39 62 41" stroke="${L.hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${L.glasses ? '<g fill="none" stroke="#111" stroke-width="1.6"><circle cx="42" cy="47" r="5.5"/><circle cx="58" cy="47" r="5.5"/><path d="M47.5 47 L52.5 47"/></g>' : ''}
        <path d="M50 50 Q48 55 50 56" stroke="#00000040" stroke-width="1.5" fill="none"/>
        <path d="M44 61 Q50 64 56 61" stroke="#7f1d1d" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g></svg>`;
  }

  // Hel figur set fra siden, stående ved oche og vendt mod skiven (højre)
  function thrower(p) {
    const L = look(p);
    const id = 'a' + ++uid;
    const [shirt, acc] = L.shirt;
    const b = L.build; // mave/bredde
    const belly = 92 + (b - 0.9) * 40;
    const torso = `M52 74 Q44 76 42 100 Q40 128 46 148 L84 148 Q${belly} 124 ${belly - 6} 100 Q86 80 76 74Z`;
    const hairBack = L.style === 'bald' ? '' : L.style === 'long'
      ? `<path d="M48 40 Q50 18 72 18 Q88 22 86 36 L84 30 Q76 26 66 28 Q56 30 54 48 Q54 64 50 70 Q44 60 48 40Z" fill="${L.hair}"/>`
      : L.style === 'spiky'
      ? `<path d="M50 44 L50 30 L56 32 L58 20 L64 28 L68 16 L72 27 L78 19 L80 30 L86 30 Q80 26 70 28 Q60 30 56 44Z" fill="${L.hair}"/>`
      : L.style === 'quiff'
      ? `<path d="M50 46 Q48 26 64 20 Q80 14 90 26 Q84 26 76 28 Q62 30 58 46Z" fill="${L.hair}"/>`
      : `<path d="M50 46 Q48 24 68 21 Q84 21 86 32 Q78 28 68 29 Q58 31 56 46Z" fill="${L.hair}" opacity="${L.style === 'buzz' ? 0.7 : 1}"/>`;
    const beard = L.beard === 'none' ? '' : `<path d="M60 54 Q62 68 74 70 Q84 68 86 58 Q80 62 74 60 Q66 60 60 54Z" fill="${L.hair}" opacity="${L.beard === 'stubble' ? 0.4 : 0.95}"/>`;
    return `<svg class="thrower" viewBox="0 0 120 240" aria-hidden="true">
      <defs><clipPath id="c${id}"><path d="${torso}"/></clipPath></defs>
      <ellipse cx="62" cy="234" rx="40" ry="5" fill="#000" opacity=".45"/>
      <!-- ben -->
      <path d="M50 146 L44 190 L40 228" stroke="#1e293b" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M76 146 L82 188 L88 228" stroke="#273449" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M30 232 Q32 224 42 224 L48 226 L48 234 L30 234Z" fill="#0b0b0b"/>
      <path d="M82 224 L98 226 Q106 228 106 234 L82 234Z" fill="#0b0b0b"/>
      <!-- bagerste arm -->
      <path d="M56 84 Q46 110 52 136" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round" filter="brightness(.8)"/>
      <circle cx="52" cy="138" r="5.5" fill="${L.skin}"/>
      <!-- krop -->
      <path d="${torso}" fill="${shirt}"/>
      <g clip-path="url(#c${id})" fill="${acc}">
        ${L.pattern === 'stripes' ? '<rect x="30" y="104" width="80" height="6"/><rect x="30" y="118" width="80" height="6"/>' : ''}
        ${L.pattern === 'flames' ? '<path d="M40 150 Q44 126 52 134 Q54 116 62 128 Q66 112 72 130 Q78 118 80 136 Q88 128 90 150Z"/>' : ''}
        ${L.pattern === 'chevron' ? '<path d="M30 96 L64 112 L100 96 L100 104 L64 120 L30 104Z"/>' : ''}
        ${L.pattern === 'side' ? '<rect x="40" y="70" width="12" height="80"/>' : ''}
      </g>
      <path d="M40 146 L88 146" stroke="#111827" stroke-width="5"/>
      <!-- hals og hoved (profil) -->
      <path d="M62 62 L74 62 L76 78 L62 78Z" fill="${L.skin}"/>
      <path d="M60 76 L70 82 L78 74" fill="none" stroke="${acc}" stroke-width="3"/>
      <ellipse cx="70" cy="44" rx="17" ry="20" fill="${L.skin}"/>
      <path d="M86 40 Q93 47 87 51" fill="${L.skin}"/>
      <ellipse cx="62" cy="46" rx="3.5" ry="5" fill="${L.skin}" stroke="#00000030"/>
      ${beard}
      ${hairBack}
      <circle cx="80" cy="41" r="2" fill="#1f2937"/>
      <path d="M76 35 Q80 33 84 35" stroke="${L.hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${L.glasses ? '<path d="M74 41 L86 40 M66 40 L74 41" stroke="#111" stroke-width="1.6" fill="none"/><circle cx="80" cy="41" r="4.5" fill="none" stroke="#111" stroke-width="1.6"/>' : ''}
      <path d="M80 57 Q84 58 86 56" stroke="#7f1d1d" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- kastearm: overarm frem, underarm op mod øjet -->
      <path d="M70 84 L100 80" stroke="${shirt}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <g class="forearm">
        <path d="M100 80 L98 50" stroke="${L.skin}" stroke-width="8.5" fill="none" stroke-linecap="round"/>
        <circle cx="98" cy="47" r="5.5" fill="${L.skin}"/>
        <g class="held-dart"><path d="M96 47 L114 44" stroke="#cbd5e1" stroke-width="2.4"/><path d="M90 48 L96 47" stroke="#64748b" stroke-width="3.2"/><path d="M90 48 L84 44 L85 52Z" fill="${acc}"/></g>
      </g>
    </svg>`;
  }

  G.Avatar = { head, thrower, look };
})(window);
