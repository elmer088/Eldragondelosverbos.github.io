/* ============================================================
   EL DRAGON DE LOS VERBOS — Duelo Arcano 2D
   ============================================================ */

/* ---------- 0. AUDIO (coloca rutas en los src="" del HTML) ---------- */
const AUDIO = {
  musicMenu: document.getElementById('music-menu'),
  musicBattle: document.getElementById('music-battle'),
  musicRage: document.getElementById('music-rage'),
  click: document.getElementById('sfx-click'),
  correct: document.getElementById('sfx-correct'),
  crit: document.getElementById('sfx-crit'),
  wrong: document.getElementById('sfx-wrong'),
  comodin: document.getElementById('sfx-comodin'),
  shield: document.getElementById('sfx-shield'),
  special: document.getElementById('sfx-special'),
  victoria: document.getElementById('sfx-victoria'),
  derrota: document.getElementById('sfx-derrota'),
};
const MUSICAS = [AUDIO.musicMenu, AUDIO.musicBattle, AUDIO.musicRage];
const EFECTOS = [AUDIO.click, AUDIO.correct, AUDIO.crit, AUDIO.wrong, AUDIO.comodin, AUDIO.shield, AUDIO.special, AUDIO.victoria, AUDIO.derrota];
const TODOS = [...MUSICAS, ...EFECTOS];

// VOLUMENES (ajusta aqui)
MUSICAS.forEach(m => { if (m) m.volume = 0.45; });
EFECTOS.forEach(s => { if (s) s.volume = 0.7; });

const CLICK_MAX_MS = 450; // corta el sfx de clic por si el archivo asignado es largo

let MUTE = false;
function tieneSrc(a) { if (!a) return false; const s = a.getAttribute('src'); return !!(s && s.trim()); }

/* Reproduce un efecto de sonido (reinicia desde 0). El clic se corta a los 450ms. */
function sfx(a) {
  if (MUTE || !tieneSrc(a)) return;
  try { a.currentTime = 0; a.play().catch(() => {}); } catch (e) {}
  if (a === AUDIO.click) {
    clearTimeout(a._cap);
    a._cap = setTimeout(() => { try { a.pause(); a.currentTime = 0; } catch (e) {} }, CLICK_MAX_MS);
  }
}

let musicaActual = null;
/* Cambia la musica: SIEMPRE detiene todas las demas pistas (nunca se superponen). */
function musica(modo) {
  const map = { menu: AUDIO.musicMenu, battle: AUDIO.musicBattle, rage: AUDIO.musicRage };
  const nueva = map[modo] || null;
  MUSICAS.forEach(m => { if (m && m !== nueva) { try { m.pause(); m.currentTime = 0; } catch (e) {} } });
  musicaActual = nueva;
  if (!MUTE && tieneSrc(nueva)) nueva.play().catch(() => {});
}

/* Boton de silencio: afecta A TODO el audio, incluso lo que ya esta sonando. */
const btnMute = document.getElementById('btn-mute');
btnMute.textContent = '🔊';
btnMute.addEventListener('click', () => {
  MUTE = !MUTE;
  btnMute.textContent = MUTE ? '🔇' : '🔊';
  TODOS.forEach(a => { if (a) a.muted = MUTE; });
  if (MUTE) {
    // corta de inmediato cualquier efecto que este sonando
    EFECTOS.forEach(a => { if (a) { try { a.pause(); a.currentTime = 0; } catch (e) {} } });
  } else if (tieneSrc(musicaActual)) {
    musicaActual.play().catch(() => {});
  }
});

/* Los navegadores bloquean el autoplay: arranca la musica de menu en el primer gesto del usuario. */
function primerGesto() {
  if (!musicaActual) musica('menu');
  window.removeEventListener('pointerdown', primerGesto);
  window.removeEventListener('keydown', primerGesto);
}
window.addEventListener('pointerdown', primerGesto);
window.addEventListener('keydown', primerGesto);

/* ---------- 1. BANCO DE 50 PREGUNTAS ---------- */
const BANCO = [
  { q: "¿Cuál de las siguientes palabras es un verbo?", o: ["Rápido", "Correr", "Mesa", "Azul"], c: 1, d: 1 },
  { q: "El verbo «cantar» pertenece a la conjugación:", o: ["Primera (-ar)", "Segunda (-er)", "Tercera (-ir)", "Ninguna"], c: 0, d: 1 },
  { q: "¿Cuál es el infinitivo del verbo «comía»?", o: ["Comer", "Comiendo", "Comido", "Come"], c: 0, d: 1 },
  { q: "¿Qué terminación tienen los verbos de la segunda conjugación?", o: ["-ar", "-er", "-ir", "-or"], c: 1, d: 1 },
  { q: "El verbo «vivir» termina en:", o: ["-ar", "-er", "-ir", "-ur"], c: 2, d: 1 },
  { q: "¿Cuál oración tiene un verbo en presente?", o: ["Yo comí pan", "Yo como pan", "Yo comeré pan", "Yo comería pan"], c: 1, d: 1 },
  { q: "El verbo «saltar» en pasado para «yo» es:", o: ["Salto", "Saltaré", "Salté", "Saltaba"], c: 2, d: 1 },
  { q: "Futuro de «hablar» para «ella»:", o: ["Habla", "Habló", "Hablará", "Hablaba"], c: 2, d: 1 },
  { q: "El gerundio del verbo «jugar» es:", o: ["Jugado", "Jugando", "Jugará", "Jugaría"], c: 1, d: 1 },
  { q: "El participio del verbo «romper» es:", o: ["Rompido", "Rompiendo", "Roto", "Rompe"], c: 2, d: 1 },
  { q: "¿Qué persona corresponde a «nosotros»?", o: ["1.ª singular", "2.ª plural", "1.ª plural", "3.ª plural"], c: 2, d: 1 },
  { q: "El verbo «ser» en presente para «tú» es:", o: ["Es", "Eres", "Soy", "Somos"], c: 1, d: 1 },
  { q: "¿Cuál es el verbo en «El perro ladra fuerte»?", o: ["El", "Perro", "Ladra", "Fuerte"], c: 2, d: 1 },
  { q: "El infinitivo de «iré» es:", o: ["Ir", "Irse", "Ido", "Yendo"], c: 0, d: 1 },
  { q: "¿Qué tiempo expresa una acción ya terminada?", o: ["Presente", "Pasado", "Futuro", "Condicional"], c: 1, d: 1 },
  { q: "«estudiar» en presente para «yo»:", o: ["Estudio", "Estudias", "Estudia", "Estudiamos"], c: 0, d: 1 },
  { q: "¿Cuál es el auxiliar en «he comido»?", o: ["Comido", "He", "Comer", "Comí"], c: 1, d: 1 },
  { q: "El verbo «tener» es un verbo:", o: ["Regular", "Irregular", "Reflexivo", "Impersonal"], c: 1, d: 1 },
  { q: "La raíz del verbo «cantar» es:", o: ["Cant-", "-ar", "Canta", "Cantar"], c: 0, d: 1 },
  { q: "¿Cuál de estos verbos es reflexivo?", o: ["Comer", "Bañarse", "Correr", "Leer"], c: 1, d: 1 },
  { q: "«poder» en pretérito para «yo» es:", o: ["Podí", "Pudí", "Pude", "Podía"], c: 2, d: 2 },
  { q: "Subjuntivo presente de «ir» para «yo»:", o: ["Voy", "Vaya", "Iré", "Iba"], c: 1, d: 2 },
  { q: "«decir» en futuro para «ellos» es:", o: ["Diciran", "Dirán", "Deciran", "Decerían"], c: 1, d: 2 },
  { q: "¿Qué modo expresa deseo o duda?", o: ["Indicativo", "Imperativo", "Subjuntivo", "Infinitivo"], c: 2, d: 2 },
  { q: "«hacer» en pretérito perfecto simple para «tú»:", o: ["Haciste", "Hiciste", "Haces", "Harás"], c: 1, d: 2 },
  { q: "Condicional simple de «salir» para «nosotros»:", o: ["Saldríamos", "Salíamos", "Saldremos", "Salimos"], c: 0, d: 2 },
  { q: "«venir» es irregular porque:", o: ["Cambia la raíz en algunos tiempos", "Nunca cambia", "Es reflexivo", "Es copulativo"], c: 0, d: 2 },
  { q: "¿Qué es «parecer» en «María parece cansada»?", o: ["Transitivo", "Intransitivo", "Copulativo", "Reflexivo"], c: 2, d: 2 },
  { q: "El pretérito imperfecto de «ver» para «yo» es:", o: ["Vía", "Veía", "Vi", "Veré"], c: 1, d: 2 },
  { q: "Gerundio compuesto de «leer»:", o: ["Leyendo", "Habiendo leído", "Leído", "Leerá"], c: 1, d: 2 },
  { q: "«construir» en presente para «él» es:", o: ["Construe", "Construye", "Construí", "Construirá"], c: 1, d: 2 },
  { q: "¿Qué son los verbos transitivos?", o: ["Llevan complemento directo", "No llevan complemento", "Son reflexivos", "Son auxiliares"], c: 0, d: 2 },
  { q: "El pluscuamperfecto de «comer» para «yo» es:", o: ["Había comido", "He comido", "Comí", "Comiera"], c: 0, d: 2 },
  { q: "«dormir» cambia «o» por «ue» en:", o: ["Todos los tiempos", "Solo el gerundio", "Presente e indefinido (parcial)", "Nunca"], c: 2, d: 2 },
  { q: "Imperativo afirmativo de «hablar» para «tú»:", o: ["Hablas", "Habla", "Hablarás", "Hables"], c: 1, d: 2 },
  { q: "El pretérito anterior de «salir» para «yo» es:", o: ["Hube salido", "Había salido", "Habré salido", "Habría salido"], c: 0, d: 3 },
  { q: "Futuro de subjuntivo de «amar» para «tú» (arcaico):", o: ["Hubieres amado", "Amares", "Amarías", "Habrás amado"], c: 1, d: 3 },
  { q: "«yacer» en presente para «yo» puede ser:", o: ["Yazco / Yazgo / Yago", "Yaceo", "Yaco", "Yací"], c: 0, d: 3 },
  { q: "¿Qué es un verbo defectivo?", o: ["Solo usa algunas formas/personas", "Siempre es regular", "No tiene infinitivo", "Tiene dos auxiliares"], c: 0, d: 3 },
  { q: "El participio irregular de «freír» es:", o: ["Freído", "Frito", "Ambas son válidas", "Freíto"], c: 2, d: 3 },
  { q: "Pluscuamperfecto de subjuntivo de «ver» (ellos):", o: ["Hubieran/hubiesen visto", "Habían visto", "Vieran", "Habrían visto"], c: 0, d: 3 },
  { q: "«placer» tiene una forma arcaica en indefinido:", o: ["Plugo", "Plació", "Plaza", "Plací"], c: 0, d: 3 },
  { q: "¿Qué son «llover», «nevar», «amanecer»?", o: ["Impersonales/unipersonales", "Reflexivos", "Copulativos", "Transitivos"], c: 0, d: 3 },
  { q: "«satisfacer» se conjuga como:", o: ["Hacer", "Poner", "Decir", "Tener"], c: 0, d: 3 },
  { q: "Condicional compuesto de «volver» (nosotros):", o: ["Habríamos vuelto", "Volveríamos", "Habíamos vuelto", "Volvimos"], c: 0, d: 3 },
  { q: "«erguir» en presente para «yo» puede ser:", o: ["Yergo / Irgo", "Ergo", "Erguezco", "Erguí"], c: 0, d: 3 },
  { q: "¿Qué expresa «tener que + infinitivo»?", o: ["Obligación", "Duda", "Gerundio continuo", "Pasado remoto"], c: 0, d: 3 },
  { q: "El pretérito indefinido de «caber» para «yo» es:", o: ["Cabí", "Cupe", "Cabo", "Caberé"], c: 1, d: 3 },
  { q: "Subjuntivo imperfecto (-se) de «tener» (ellos):", o: ["Tuvieran", "Tuviesen", "Tendrían", "Tenían"], c: 1, d: 3 },
  { q: "«abolir» es defectivo porque:", o: ["Solo se usaba en formas con «i» en la desinencia", "No tiene participio", "No tiene infinitivo", "Es siempre reflexivo"], c: 0, d: 3 },
];
const DIF_NOMBRE = { 1: 'Fácil', 2: 'Media', 3: 'Difícil' };

/* ---------- 2. CONFIG + ESTADO ---------- */
const CFG = {
  hpDragonMax: 150, hpHeroMax: 100, porRonda: 10, tiempo: 20, umbralFuria: 0.40,
  danoBase: { 1: 8, 2: 11, 3: 15 }, danoHero: 12, danoCargado: 24, cargas: 2,
  cargaEspecialPorAcierto: 16, danoEspecial: 46,
};
const S = {
  ronda: 1, idx: 0, preguntas: [], hpDragon: CFG.hpDragonMax, hpHero: CFG.hpHeroMax,
  buenas: 0, malas: 0, combo: 0, mejorCombo: 0, score: 0,
  cargas: CFG.cargas, escudo: false, furia: false, cargaEspecial: 0,
  peligro: false, bloqueado: false, timerId: null, t: CFG.tiempo,
};

/* ---------- 3. DOM ---------- */
const screens = { start: 'screen-start', intro: 'screen-intro', battle: 'screen-battle', roundEnd: 'screen-round-end', end: 'screen-end' };
const $ = id => document.getElementById(id);
const btnHome = $('btn-home');
function show(name) {
  Object.values(screens).forEach(s => $(s).classList.remove('active'));
  $(screens[name]).classList.add('active');
  btnHome.classList.toggle('visible', ['battle', 'roundEnd', 'intro'].includes(name));
}
const el = {
  dialog: $('dialog-text'), caret: $('dialog-cursor'),
  hpD: $('hp-dragon'), hpDg: $('hp-dragon-ghost'), hpDt: $('hp-dragon-text'),
  hpH: $('hp-player'), hpHg: $('hp-player-ghost'), hpHt: $('hp-player-text'),
  round: $('round-indicator'), counter: $('question-counter'), score: $('score-display'),
  dragonBadges: $('dragon-badges'), heroBadges: $('hero-badges'),
  timer: $('timer-bar'), arena: $('arena'), combo: $('combo-badge'), danger: $('danger-ribbon'),
  pill: $('difficulty-pill'), question: $('question-text'),
  answers: Array.from(document.querySelectorAll('.answer')),
  btnComodin: $('btn-comodin'), charges: $('comodin-charges'),
  btnSpecial: $('btn-special'), chargeFill: $('charge-fill'),
  statGood: $('stat-good'), statBad: $('stat-bad'), statCombo: $('stat-combo'), statScore: $('stat-score'), roundHp: $('round-hp'),
  endEmblem: $('end-emblem'), endTitle: $('end-title'), endMsg: $('end-message'), finalScore: $('final-score'), finalCombo: $('final-combo'),
  banner: $('banner'), cine: $('cine'), cineIcon: $('cine-icon'), cineTitle: $('cine-title'), cineDesc: $('cine-desc'), flash: $('flash'),
};

/* Sprites */
const tplDragon = $('tpl-dragon'), tplHero = $('tpl-hero');
let __uid = 0;
/* Da IDs únicos a los degradados/filtros de cada SVG clonado para que
   cada instancia use SU propio degradado (si no, al ocultarse una pantalla
   los degradados compartidos dejan de renderizar y el sprite se ve oscuro). */
function uniquificar(svg) {
  const suf = '_' + (__uid++);
  svg.querySelectorAll('[id]').forEach(n => { n.id = n.id + suf; });
  const attrs = ['fill', 'stroke', 'filter', 'clip-path', 'mask'];
  svg.querySelectorAll('*').forEach(n => {
    attrs.forEach(a => {
      const v = n.getAttribute(a);
      if (v && v.indexOf('url(#') !== -1) n.setAttribute(a, v.replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}${suf})`));
    });
  });
}
function montar(tpl, slot, opts = {}) {
  slot.appendChild(tpl.content.cloneNode(true));
  const svg = slot.querySelector('svg');
  uniquificar(svg);
  if (opts.dormido) { svg.querySelector('.eyes').style.display = 'none'; svg.querySelector('.lids').style.display = 'block';
    svg.querySelectorAll('.wing-l,.wing-r').forEach(w => w.style.animation = 'none'); }
  return svg;
}
montar(tplDragon, $('dragon-sleep'), { dormido: true });
montar(tplDragon, $('dragon-intro'));
const dragonSVG = montar(tplDragon, $('dragon-battle'));
const heroSVG = montar(tplHero, $('hero-battle'));

/* ---------- 4. FONDO: motas flotantes + parallax ---------- */
(function motas() {
  const cont = $('motes'); const colores = ['#b79bff', '#ffd15c', '#4fe3c1', '#ff8a3d'];
  for (let i = 0; i < 34; i++) {
    const m = document.createElement('div'); m.className = 'mote';
    const s = 3 + Math.random() * 6;
    m.style.width = m.style.height = s + 'px';
    m.style.left = Math.random() * 100 + '%';
    m.style.bottom = '-10px';
    m.style.background = colores[i % colores.length];
    m.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    m.style.setProperty('--o', (0.3 + Math.random() * 0.5).toFixed(2));
    m.style.animationDuration = (10 + Math.random() * 14) + 's';
    m.style.animationDelay = (-Math.random() * 20) + 's';
    cont.appendChild(m);
  }
})();
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5), y = (e.clientY / window.innerHeight - 0.5);
  const layers = document.querySelectorAll('#scene .layer');
  layers.forEach((l, i) => { const f = (i + 1) * 3; l.style.transform = `translate(${x * f}px, ${y * f}px)`; });
}, { passive: true });

/* ---------- 5. UTILIDADES ---------- */
function mezclar(a) { const c = [...a]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }
function seleccionar() {
  const f = mezclar(BANCO.filter(p => p.d === 1)).slice(0, 4);
  const m = mezclar(BANCO.filter(p => p.d === 2)).slice(0, 3);
  const d = mezclar(BANCO.filter(p => p.d === 3)).slice(0, 3);
  let sel = [...f, ...m, ...d];
  const r = mezclar(BANCO); let i = 0;
  while (sel.length < CFG.porRonda && i < r.length) { if (!sel.includes(r[i])) sel.push(r[i]); i++; }
  return sel.slice(0, CFG.porRonda);
}
function typewriter(txt, node, v = 26) { return new Promise(res => { node.textContent = ''; let i = 0; const t = setInterval(() => { node.textContent += txt[i++]; if (i >= txt.length) { clearInterval(t); res(); } }, v); }); }

function pintarVida() {
  const pd = Math.max(0, S.hpDragon / CFG.hpDragonMax * 100), ph = Math.max(0, S.hpHero / CFG.hpHeroMax * 100);
  el.hpD.style.width = pd + '%'; el.hpDg.style.width = pd + '%';
  el.hpH.style.width = ph + '%'; el.hpHg.style.width = ph + '%';
  el.hpDt.textContent = `${Math.max(0, S.hpDragon)} / ${CFG.hpDragonMax}`;
  el.hpHt.textContent = `${Math.max(0, S.hpHero)} / ${CFG.hpHeroMax}`;
}
function anim(node, cls, ms = 700) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); setTimeout(() => node.classList.remove(cls), ms); }
function aShake() { anim(el.arena, 'shake', 420); }
function flash() { el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go'); }

function badges() {
  el.dragonBadges.innerHTML = S.furia ? '<span class="badge" title="Furia">🔥</span>' : '';
  el.dragonBadges.innerHTML += S.peligro ? '<span class="badge" title="Cargando">⚡</span>' : '';
  el.heroBadges.innerHTML = S.escudo ? '<span class="badge" title="Escudo">🛡️</span>' : '';
}

function comboBadge() {
  if (S.combo >= 2) { el.combo.textContent = `¡Combo ×${S.combo}!`; el.combo.classList.remove('show'); void el.combo.offsetWidth; el.combo.classList.add('show'); }
  else el.combo.classList.remove('show');
}
function pintarCargas() { el.charges.textContent = S.cargas; el.btnComodin.disabled = S.cargas <= 0 || S.bloqueado; }
function pintarEspecial() {
  el.chargeFill.style.width = Math.min(100, S.cargaEspecial) + '%';
  const listo = S.cargaEspecial >= 100;
  el.btnSpecial.disabled = !listo || S.bloqueado;
  el.btnSpecial.classList.toggle('ready', listo && !S.bloqueado);
}

/* Coordenadas aproximadas dentro de la arena */
function puntoDragon() { return { x: el.arena.clientWidth * 0.20, y: el.arena.clientHeight * 0.42 }; }
function puntoHero() { return { x: el.arena.clientWidth * 0.80, y: el.arena.clientHeight * 0.46 }; }

function textoCombate(destino, texto, color, grande = false) {
  const p = destino === 'dragon' ? puntoDragon() : puntoHero();
  const s = document.createElement('div'); s.className = 'combat-text';
  s.textContent = texto; s.style.color = color;
  s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; s.style.fontSize = grande ? '1.7rem' : '1.15rem';
  el.arena.appendChild(s); setTimeout(() => s.remove(), 1000);
}
function chispas(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const sp = document.createElement('div'); sp.className = 'spark';
    const size = 3 + Math.random() * 5; sp.style.width = sp.style.height = size + 'px';
    sp.style.background = color; sp.style.left = x + 'px'; sp.style.top = y + 'px';
    sp.style.boxShadow = `0 0 8px ${color}`;
    const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 60;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    el.arena.appendChild(sp);
    sp.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 }],
      { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(() => sp.remove(), 820);
  }
}
/* Proyectil que viaja de origen a destino y estalla */
function proyectil(desde, hasta, color, size, onHit) {
  const a = desde === 'hero' ? puntoHero() : puntoDragon();
  const b = hasta === 'dragon' ? puntoDragon() : puntoHero();
  const p = document.createElement('div'); p.className = 'projectile';
  p.style.width = p.style.height = size + 'px'; p.style.background = color; p.style.color = color;
  p.style.left = a.x + 'px'; p.style.top = a.y + 'px';
  el.arena.appendChild(p);
  const anima = p.animate([{ left: a.x + 'px', top: a.y + 'px', opacity: 1 }, { left: b.x + 'px', top: b.y + 'px', opacity: 1 }],
    { duration: 340, easing: 'cubic-bezier(.4,0,.7,1)', fill: 'forwards' });
  anima.onfinish = () => { chispas(b.x, b.y, color, 16); p.remove(); if (onHit) onHit(); };
}

/* ---------- 6. TIMER ---------- */
function tick() {
  S.t -= 0.1; const pct = Math.max(0, S.t / CFG.tiempo * 100);
  el.timer.style.width = pct + '%';
  el.timer.classList.toggle('warn', pct <= 55 && pct > 28);
  el.timer.classList.toggle('danger', pct <= 28);
  if (S.t <= 0) { pararTimer(); tiempoFuera(); }
}
function iniciarTimer() { pararTimer(); S.t = CFG.tiempo; el.timer.className = 'timer-bar'; el.timer.style.width = '100%'; S.timerId = setInterval(tick, 100); }
function reanudarTimer() { pararTimer(); S.timerId = setInterval(tick, 100); }
function pararTimer() { if (S.timerId) { clearInterval(S.timerId); S.timerId = null; } }
function tiempoFuera() {
  if (S.bloqueado) return; S.bloqueado = true;
  el.answers.forEach(b => b.disabled = true);
  const c = el.answers.find(b => b.dataset.correcta === '1'); if (c) c.classList.add('correct');
  resolverFallo();
}

/* ---------- 7. INICIO / INTRO ---------- */
$('btn-start').addEventListener('click', async () => {
  sfx(AUDIO.click); musica('menu'); show('intro');
  el.caret.style.display = 'none';
  await typewriter("¿Quién se atreve a molestar al Dragón de los Verbos? Por tu osadía te reto a un duelo de preguntas… que gane el mejor.", el.dialog, 26);
  el.caret.style.display = 'inline';
});
$('btn-skip-intro').addEventListener('click', () => { sfx(AUDIO.click); iniciarPartida(); });
btnHome.addEventListener('click', () => {
  sfx(AUDIO.click);
  if (!confirm('¿Volver al inicio? Se perderá el progreso de esta partida.')) return;
  pararTimer(); S.bloqueado = false; S.furia = false; S.escudo = false; S.peligro = false;
  dragonSVG.classList.remove('enraged', 'charging'); el.danger.classList.remove('show');
  el.cine.classList.remove('show'); musica('menu'); show('start');
});

/* ---------- 8. PARTIDA / RONDA ---------- */
function iniciarPartida() {
  S.ronda = 1; S.hpDragon = CFG.hpDragonMax; S.hpHero = CFG.hpHeroMax; S.score = 0; S.mejorCombo = 0;
  S.cargas = CFG.cargas; S.furia = false; S.cargaEspecial = 0;
  dragonSVG.classList.remove('enraged'); iniciarRonda();
}
function iniciarRonda() {
  S.idx = 0; S.buenas = 0; S.malas = 0; S.combo = 0; S.escudo = false; S.peligro = false;
  S.preguntas = seleccionar();
  el.round.textContent = 'Ronda ' + S.ronda;
  pintarVida(); pintarCargas(); pintarEspecial(); comboBadge(); badges();
  el.score.textContent = S.score + ' pts';
  musica(S.furia ? 'rage' : 'battle'); show('battle');
  el.danger.classList.remove('show');
  anim(dragonSVG, 'roar', 900); aShake();
  mostrarPregunta();
}

/* ---------- 9. PREGUNTAS Y COMBATE ---------- */
function mostrarPregunta() {
  S.bloqueado = false;
  const p = S.preguntas[S.idx];
  el.counter.textContent = (S.idx + 1) + ' / ' + S.preguntas.length;
  el.pill.textContent = DIF_NOMBRE[p.d]; el.pill.className = 'pill d' + p.d;
  el.question.textContent = p.q;

  // ¿Pregunta de peligro? (el dragon carga un ataque devastador)
  S.peligro = ((S.idx + 1) % 4 === 0) || (S.furia && (S.idx + 1) % 3 === 0);
  el.danger.classList.toggle('show', S.peligro);
  dragonSVG.classList.toggle('charging', S.peligro);
  badges();

  const opc = mezclar(p.o.map((t, i) => ({ t, ok: i === p.c })));
  el.answers.forEach((btn, i) => {
    btn.querySelector('.txt').textContent = opc[i].t;
    btn.dataset.correcta = opc[i].ok ? '1' : '0';
    btn.disabled = false;
    btn.classList.remove('correct', 'wrong', 'faded');
  });
  pintarCargas(); pintarEspecial();
  iniciarTimer();
}

el.answers.forEach(btn => btn.addEventListener('click', () => responder(btn)));
function responder(btn) {
  if (S.bloqueado) return; S.bloqueado = true; pararTimer(); sfx(AUDIO.click);
  const ok = btn.dataset.correcta === '1';
  el.answers.forEach(b => b.disabled = true);
  if (ok) { btn.classList.add('correct'); resolverAcierto(); }
  else { btn.classList.add('wrong'); const c = el.answers.find(b => b.dataset.correcta === '1'); if (c) c.classList.add('correct'); resolverFallo(); }
}

function resolverAcierto() {
  S.buenas++; S.combo++; S.mejorCombo = Math.max(S.mejorCombo, S.combo);
  const p = S.preguntas[S.idx];
  let dano = CFG.danoBase[p.d] + Math.min(S.combo, 5) * 2 + Math.round(S.t / CFG.tiempo * 6);
  const crit = S.combo >= 3;
  if (crit) dano = Math.floor(dano * 1.5);
  if (S.peligro) dano += 8; // interrumpes el ataque cargado -> bonus
  S.score += dano * 10 + (S.peligro ? 200 : 0);
  el.score.textContent = S.score + ' pts';

  // Carga arcana sube
  S.cargaEspecial = Math.min(100, S.cargaEspecial + CFG.cargaEspecialPorAcierto + (crit ? 8 : 0));

  sfx(crit ? AUDIO.crit : AUDIO.correct);
  anim(heroSVG, 'atk', 620); comboBadge();
  if (S.peligro) { dragonSVG.classList.remove('charging'); el.danger.classList.remove('show'); S.peligro = false; badges(); }

  setTimeout(() => {
    proyectil('hero', 'dragon', crit ? '#ffd15c' : '#4fe3c1', crit ? 26 : 18, () => {
      anim(dragonSVG, 'recoil', 550); anim(dragonSVG, 'hurt', 500);
      if (crit) { flash(); aShake(); } else aShake();
      textoCombate('dragon', (crit ? '¡CRÍTICO! -' : '-') + dano, crit ? '#ffd15c' : '#4fe3c1', crit);
      S.hpDragon = Math.max(0, S.hpDragon - dano); pintarVida(); pintarEspecial(); comprobarFuria();
    });
  }, 220);
  setTimeout(avanzar, 1050);
}

function resolverFallo() {
  S.malas++; S.combo = 0; comboBadge();
  // Escudo bloquea
  if (S.escudo) {
    S.escudo = false; badges(); sfx(AUDIO.shield);
    anim(dragonSVG, 'atk', 620);
    setTimeout(() => { chispas(puntoHero().x, puntoHero().y, '#4fe3c1', 18); textoCombate('hero', 'BLOQUEADO', '#4fe3c1'); }, 240);
    setTimeout(avanzar, 950); return;
  }
  let dano = CFG.danoHero;
  if (S.peligro) dano = CFG.danoCargado;         // ataque cargado devastador
  if (S.furia) dano = Math.floor(dano * 1.5);

  sfx(AUDIO.wrong);
  if (S.peligro) { mostrarBanner('¡ALIENTO DEVASTADOR!', 'linear-gradient(90deg,#ff5d73,#ff8a3d)'); dragonSVG.classList.remove('charging'); el.danger.classList.remove('show'); S.peligro = false; badges(); }
  anim(dragonSVG, 'atk', 620);
  setTimeout(() => {
    proyectil('dragon', 'hero', S.furia ? '#ff2a00' : '#ff5d73', S.peligro ? 34 : 24, () => {
      anim(heroSVG, 'recoil', 550); anim(heroSVG, 'hurt', 500); aShake(); flash();
      textoCombate('hero', '-' + dano, '#ff5d73');
      S.hpHero = Math.max(0, S.hpHero - dano); pintarVida();
    });
  }, 240);
  setTimeout(avanzar, 1050);
}

function comprobarFuria() {
  if (!S.furia && S.hpDragon > 0 && S.hpDragon / CFG.hpDragonMax <= CFG.umbralFuria) {
    S.furia = true; dragonSVG.classList.add('enraged'); badges();
    mostrarBanner('¡EL DRAGÓN SE ENFURECE!', 'linear-gradient(90deg,#ff2a00,#ff8a3d)'); aShake(); flash(); musica('rage');
  }
}

function avanzar() {
  if (S.hpDragon <= 0) return finJuego(true);
  if (S.hpHero <= 0) return finJuego(false);
  S.idx++;
  if (S.idx >= S.preguntas.length) finRonda();
  else mostrarPregunta();
}

/* ---------- 10. HECHIZO ESPECIAL (Carga Arcana) ---------- */
el.btnSpecial.addEventListener('click', async () => {
  if (S.cargaEspecial < 100 || S.bloqueado) return;
  S.bloqueado = true; pararTimer(); S.cargaEspecial = 0; pintarEspecial();
  sfx(AUDIO.special);
  await cinematica('#ff8a3d', '☄', 'METEORO ARCANO', 'Concentras toda tu energía y la descargas sobre el dragón.');
  flash(); aShake();
  proyectil('hero', 'dragon', '#ff8a3d', 40, () => {
    chispas(puntoDragon().x, puntoDragon().y, '#ffd15c', 26);
    anim(dragonSVG, 'recoil', 550); anim(dragonSVG, 'hurt', 500);
    textoCombate('dragon', '-' + CFG.danoEspecial, '#ff8a3d', true);
    S.hpDragon = Math.max(0, S.hpDragon - CFG.danoEspecial); S.score += CFG.danoEspecial * 12;
    el.score.textContent = S.score + ' pts'; pintarVida(); comprobarFuria();
  });
  S.bloqueado = false;
  setTimeout(() => {
    if (S.hpDragon <= 0) finJuego(true);
    else { pintarEspecial(); pintarCargas(); reanudarTimer(); }
  }, 900);
});

/* ---------- 11. COMODIN CON CINEMATICA ---------- */
el.btnComodin.addEventListener('click', async () => {
  if (S.cargas <= 0 || S.bloqueado) return;
  S.bloqueado = true; pararTimer(); S.cargas--; pintarCargas(); sfx(AUDIO.comodin);
  const efectos = ['5050', 'pista', 'escudo'];
  const ef = efectos[Math.floor(Math.random() * efectos.length)];
  const p = S.preguntas[S.idx];

  if (ef === '5050') {
    await cinematica('#31a8ff', '✂', 'HECHIZO 50/50', 'Dos respuestas incorrectas se desvanecerán ante ti.');
    const malas = el.answers.filter(b => b.dataset.correcta === '0' && !b.classList.contains('faded'));
    mezclar(malas).slice(0, 2).forEach(b => { b.classList.add('faded'); b.disabled = true; });
  } else if (ef === 'pista') {
    const letra = p.o[p.c].charAt(0).toUpperCase();
    await cinematica('#ffd15c', '🔮', 'PISTA ARCANA', `La respuesta correcta comienza con la letra «${letra}».`);
  } else {
    await cinematica('#4fe3c1', '🛡', 'ESCUDO RÚNICO', 'Un aura protectora bloqueará el próximo ataque del dragón.');
    S.escudo = true; badges(); sfx(AUDIO.shield); chispas(puntoHero().x, puntoHero().y, '#4fe3c1', 16);
  }
  S.bloqueado = false; pintarCargas(); pintarEspecial(); reanudarTimer();
});

function cinematica(accent, icon, title, desc) {
  return new Promise(res => {
    el.cine.style.setProperty('--accent', accent);
    el.cineIcon.textContent = icon; el.cineTitle.textContent = title; el.cineDesc.textContent = desc;
    flash(); el.cine.classList.add('show');
    setTimeout(() => { el.cine.classList.remove('show'); res(); }, 1700);
  });
}

function mostrarBanner(txt, bg) { el.banner.textContent = txt; el.banner.style.background = bg; el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show'); }

/* ---------- 12. FIN DE RONDA / JUEGO ---------- */
function finRonda() {
  pararTimer();
  el.statGood.textContent = S.buenas; el.statBad.textContent = S.malas;
  el.statCombo.textContent = S.mejorCombo; el.statScore.textContent = S.score;
  el.roundHp.textContent = `Dragón: ${Math.max(0, S.hpDragon)} HP  ·  Tú: ${Math.max(0, S.hpHero)} HP`;
  show('roundEnd');
}
$('btn-next-round').addEventListener('click', () => {
  sfx(AUDIO.click); S.ronda++; S.cargas = Math.min(CFG.cargas, S.cargas + 1); iniciarRonda();
});

function finJuego(gano) {
  pararTimer(); musica('menu');
  el.finalScore.textContent = S.score; el.finalCombo.textContent = S.mejorCombo;
  if (gano) {
    sfx(AUDIO.victoria); el.endEmblem.textContent = '🏆';
    el.endTitle.textContent = '¡Victoria!'; el.endTitle.style.filter = '';
    el.endMsg.textContent = 'Has derrotado al Dragón de los Verbos. Tu dominio de la conjugación es legendario.';
  } else {
    sfx(AUDIO.derrota); el.endEmblem.textContent = '💀';
    el.endTitle.textContent = 'Derrota';
    el.endMsg.textContent = 'El dragón te ha vencido esta vez. Repasa tus verbos y regresa por la revancha.';
  }
  show('end');
}
$('btn-restart').addEventListener('click', () => {
  sfx(AUDIO.click); S.furia = false; dragonSVG.classList.remove('enraged'); el.dialog.textContent = ''; musica('menu'); show('start');
});

/* ============================================================
   13. COMPARTIR / CÓDIGO QR
   ============================================================ */

/* ┌────────────────────────────────────────────────────────────┐
   │  PEGA AQUÍ EL LINK DONDE SUBISTE EL JUEGO A INTERNET.        │
   │  Ej: "https://tuusuario.github.io/dragon-verbos/"           │
   │  Debe empezar con https://  y ser una página pública.       │
   │  (Un archivo local de tu compu NO sirve para el QR.)        │
   └────────────────────────────────────────────────────────────┘ */
const URL_DEL_JUEGO = "https://elmer088.github.io/Eldragondelosverbos.github.io/";

const qrModal = $('qr-modal');
const qrBox = $('qr-box');
const qrUrlText = $('qr-url');
const qrNote = $('qr-note');

function generarQR(texto) {
  qrBox.innerHTML = '';
  try {
    const qr = qrcode(0, 'M');      // 0 = tamaño automático, 'M' = corrección media
    qr.addData(texto);
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0 });
  } catch (e) {
    qrBox.textContent = '⚠';
  }
}

function abrirQR() {
  sfx(AUDIO.click);
  const url = (URL_DEL_JUEGO || '').trim();
  if (url) {
    generarQR(url);
    qrUrlText.textContent = url;
    qrUrlText.style.display = 'block';
    qrNote.textContent = 'Escanea este código con la cámara del celular para jugar.';
  } else {
    // Aún no hay link configurado: guía al usuario
    qrBox.innerHTML = '<span style="color:#8b5cf6;font-size:2.4rem">📱</span>';
    qrUrlText.style.display = 'none';
    qrNote.innerHTML = 'Para crear el QR primero sube el juego a internet (GitHub Pages, Netlify, itch.io…) y pega tu link en la variable <b>URL_DEL_JUEGO</b> dentro de <b>script.js</b>.';
  }
  qrModal.classList.add('show');
}
function cerrarQR() { qrModal.classList.remove('show'); }

function conectar(id, evento, fn) {
  const elx = document.getElementById(id);
  if (elx) elx.addEventListener(evento, fn);
}
conectar('btn-share', 'click', abrirQR);
conectar('btn-share-end', 'click', abrirQR);
conectar('qr-close', 'click', cerrarQR);
if (qrModal) qrModal.addEventListener('click', (e) => { if (e.target === qrModal) cerrarQR(); });
