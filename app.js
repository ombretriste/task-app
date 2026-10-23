'use strict';

// Versión de la app (se ve en la pantalla de inicio). Arreglos y ajustes: 0.x.y; novedades: 0.x.0.
const APP_VERSION = '0.7.0';
// Página de donaciones (Ko-fi), la misma que en Up to 40%. Vacía: no se muestra el botón «Invítame a un café».
const DONATE_URL = 'https://ko-fi.com/omtapps';
const STORAGE_KEY = 'taskctrl:v1';
const DISPLAY_KEY = 'taskctrl:display';
const INSTALL_HINT_KEY = 'taskctrl:installHint';
const SYNC_KEY = 'taskctrl:sync';
const TRIP_LINK_KEY = 'taskctrl:tripLink';
const TRIP_APP_URL = 'https://trip-app-vfeg.vercel.app/';
const KEEP_DONE_DAYS = 30; // las tareas hechas se borran solas pasado un mes
const KEEP_DELETED_DAYS = 90; // cuánto se recuerda un borrado (para que la nube no lo resucite)

const ICONS = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bellOff: '<path d="M8.5 5.2A6 6 0 0 1 18 11v4M6 11v5.5l-1.5 2h13"/><path d="M10 20.5a2 2 0 0 0 4 0"/><path d="M4 4l16 16"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  note: '<path d="M5 4.5h14v15H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.1-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5z"/><path d="M12 11v5M9.5 13.5L12 11l2.5 2.5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  repeat: '<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>',
  chat: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/><path d="M8 10h8M8 13h5"/>',
  plane: '<path d="M10.5 13.5L4 11l1.5-1.5 7 .5 4-4c.8-.8 2.2-.8 3 0s.8 2.2 0 3l-4 4 .5 7L14.5 21 12 14.5"/><path d="M7 17l-2 2"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
};
const icon = (name, size = 22, sw = 1.4) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Logo de TaskCTRL: anillo fino, anillo discontinuo, arco y casilla marcada de líneas finas
let logoCount = 0;
function logoSVG(size) {
  const id = `tc-g${logoCount++}`;
  return `
    <svg class="logo-mark" viewBox="0 0 120 120" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#c026d3"/><stop offset=".55" stop-color="#e879f9"/><stop offset="1" stop-color="#f5d0fe"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#${id})" stroke-width="1.2" opacity=".55"/>
      <circle cx="60" cy="60" r="42" stroke="url(#${id})" stroke-width=".8" stroke-dasharray="2 5" opacity=".6"/>
      <path d="M60 8 A52 52 0 1 1 14.97 86" stroke="url(#${id})" stroke-width="3"/>
      <circle cx="14.97" cy="86" r="3" fill="#e879f9" stroke="none"/>
      <rect x="37" y="37" width="46" height="46" rx="10" stroke="url(#${id})" stroke-width="1.8"/>
      <path d="M47 61l9 9 18-19" stroke="url(#${id})" stroke-width="3"/>
    </svg>`;
}
document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoSVG(Number(el.dataset.logo)); });
document.getElementById('app-version').textContent = `Versión ${APP_VERSION}`;

// ---------- Utilidades ----------

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => isoOf(new Date());
const addDaysISO = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoOf(d); };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_) {
    return false;
  }
}

// Aviso breve, con un botón opcional (p. ej. Deshacer)
function toast(text, action) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(text)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').addEventListener('click', () => { el.remove(); action.run(); });
  document.body.append(el);
  setTimeout(() => el.remove(), action ? 4500 : 2600);
}

// Texto corto de la fecha límite para la lista
function dueLabel(due) {
  if (!due) return null;
  const n = daysBetween(todayISO(), due);
  if (n < 0) return { cls: 'late', text: n === -1 ? 'Vencida ayer' : `Vencida hace ${-n} días` };
  if (n === 0) return { cls: 'today', text: 'Hoy' };
  if (n === 1) return { cls: '', text: 'Mañana' };
  const d = new Date(`${due}T12:00:00`);
  if (n < 7) return { cls: '', text: `${WEEKDAYS[d.getDay()][0].toUpperCase()}${WEEKDAYS[d.getDay()].slice(1)} ${d.getDate()}` };
  return { cls: '', text: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}${d.getFullYear() !== new Date().getFullYear() ? `/${d.getFullYear()}` : ''}` };
}

// ---------- Datos ----------
// localStorage `taskctrl:v1` = { tasks: [{ id, title, prio 0–4, due 'YYYY-MM-DD'|'', notes, repeat, lead, done, doneAt, created, upd }],
//                                deleted: { id: cuándo se borró }, settings: { on, morning 'HH:MM', end (hora), tone }, upd }
// `repeat`: se repite cada año; `lead`: días antes de la fecha en los que vuelve a aparecer.
// `upd` de cada tarea y `deleted` sirven para fusionar con la nube tarea a tarea (gana el cambio más reciente).
// Se copia también en IndexedDB para que el service worker pueda componer los avisos.

function cleanData(d) {
  const out = { tasks: [], deleted: {}, settings: { ...DEFAULT_SETTINGS }, upd: 0 };
  if (!d || typeof d !== 'object') return out;
  const limit = Date.now() - KEEP_DONE_DAYS * 864e5;
  for (const t of Array.isArray(d.tasks) ? d.tasks : []) {
    if (!t || !t.id || !String(t.title || '').trim()) continue;
    if (t.done && (t.doneAt || 0) < limit) continue;
    out.tasks.push({
      id: String(t.id),
      title: String(t.title).trim(),
      prio: Math.max(0, Math.min(4, Math.round(Number(t.prio)) || 0)),
      due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '',
      notes: String(t.notes || ''),
      repeat: !!t.repeat,
      // Tareas creadas desde TripCTRL: origen, nombre del viaje y cómo se generaron
      src: t.src === 'trip' ? 'trip' : '',
      trip: String(t.trip || ''),
      gen: String(t.gen || ''),
      lead: LEAD_OPTIONS.includes(Number(t.lead)) ? Number(t.lead) : DEFAULT_LEAD,
      done: !!t.done,
      doneAt: Number(t.doneAt) || 0,
      created: Number(t.created) || Date.now(),
      upd: Number(t.upd) || Number(t.created) || 0,
    });
  }
  const delLimit = Date.now() - KEEP_DELETED_DAYS * 864e5;
  for (const [id, at] of Object.entries(d.deleted || {})) if (Number(at) > delLimit) out.deleted[id] = Number(at);
  const s = d.settings || {};
  out.settings.on = !!s.on;
  if (/^\d{2}:\d{2}$/.test(s.morning || '')) out.settings.morning = s.morning;
  if (Number.isInteger(s.end) && s.end >= 12 && s.end <= 24) out.settings.end = s.end;
  if (TONES[s.tone]) out.settings.tone = s.tone;
  out.upd = Number(d.upd) || 0;
  return out;
}

let data = cleanData(load(STORAGE_KEY, null));
let meta = {}; // { device, subscribed, lastSlot } — en IndexedDB, compartido con el service worker
let showDone = false;

// Foto de cada tarea tal y como se guardó por última vez: al guardar, las que han cambiado reciben
// un `upd` nuevo y las que faltan quedan apuntadas como borradas. Así no hay que acordarse de
// marcarlo en cada sitio que modifica tareas.
let snap = new Map();
const taskSig = ({ upd, ...rest }) => JSON.stringify(rest);
function resetSnap() {
  snap = new Map(data.tasks.map((t) => [t.id, taskSig(t)]));
}
function stampChanges() {
  const now = Date.now();
  const seen = new Set();
  for (const t of data.tasks) {
    seen.add(t.id);
    const sig = taskSig(t);
    if (snap.get(t.id) !== sig) { t.upd = now; snap.set(t.id, sig); delete data.deleted[t.id]; }
  }
  for (const id of [...snap.keys()]) if (!seen.has(id)) { snap.delete(id); data.deleted[id] = now; }
}
resetSnap();

let scheduleTimer;
// Guarda en el dispositivo (y en IndexedDB para el service worker) y reprograma los avisos
function store() {
  data.upd = Date.now();
  save(STORAGE_KEY, data);
  kvSet('state', data).catch(() => {});
  clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(refreshSchedule, 1200);
  armLocalTimer();
}
// Tras un cambio hecho aquí: marca lo cambiado, guarda y lo sube a la nube
function persist() {
  stampChanges();
  store();
  queueSync();
}

// Si el service worker cambió algo (p. ej. «Hecho» desde la notificación), manda su copia
async function adoptIDBState() {
  try {
    const s = await kvGet('state');
    if (s && (s.upd || 0) > (data.upd || 0)) {
      data = cleanData(s);
      save(STORAGE_KEY, data);
      resetSnap();
      render();
      queueSync();
    } else {
      await kvSet('state', data);
    }
  } catch (_) { /* sin IndexedDB */ }
}

const pendingTasks = () => sortTasks(activeTasks(data, todayISO()));
// Tareas anuales que esperan a que se acerque su próxima fecha
const laterTasks = () => data.tasks.filter((t) => !t.done && isDormant(t, todayISO())).sort((a, b) => a.due.localeCompare(b.due));
const TT = () => toneOf(data); // textos del tono elegido
const fmtISO = (iso) => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
let showLater = false;

// ---------- Render ----------

function render() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const el = $('summary');
  const pending = pendingTasks();
  const today = todayISO();
  const late = pending.filter((t) => t.due && t.due < today).length;
  const forToday = pending.filter((t) => t.due === today).length;
  const notifOff = !data.settings.on || !('Notification' in window) || Notification.permission !== 'granted';
  const cta = notifOff
    ? `<button type="button" class="notif-cta" data-notif>${icon('bell', 20)}<span>${TT().cta}</span></button>`
    : '';
  if (!pending.length) {
    el.innerHTML = `
      <p class="label">Pendientes</p>
      <div class="big-stat"><span class="big-ok">${icon('check', 28, 1.6)}</span>
        <span class="big-label">${data.tasks.length ? TT().allDone : TT().noTasks}</span></div>
      ${cta}`;
    return;
  }
  const counts = PRIOS.map((p) => ({ p, n: pending.filter((t) => t.prio === p.lvl).length })).filter((c) => c.n);
  const extra = [late && `<b>${plural(late, 'vencida', 'vencidas')}</b>`, forToday && plural(forToday, 'para hoy', 'para hoy')].filter(Boolean).join(' · ');
  el.innerHTML = `
    <p class="label">Pendientes</p>
    <div class="big-stat">
      <span class="big-number">${pending.length}</span>
      <span class="big-label">${TT().things(pending.length)}${extra ? `<br>${extra}` : ''}</span>
    </div>
    <div class="prio-bar" aria-hidden="true">${counts.map((c) => `<i class="p${c.p.lvl}" style="flex:${c.n}"></i>`).join('')}</div>
    <div class="prio-legend">${counts.map((c) => `<span class="p${c.p.lvl}">${c.n} · ${esc(prioName(c.p.lvl, TT()))}</span>`).join('')}</div>
    ${cta}`;
}

function taskCard(t) {
  const due = dueLabel(t.due);
  const sub = [
    due && `<span class="due ${t.done ? '' : due.cls}">${icon('calendar', 13)}${esc(due.text)}</span>`,
    t.repeat && `<span class="due">${icon('repeat', 13)}Cada año</span>`,
    t.src === 'trip' && `<span class="due">${icon('plane', 13)}${esc(t.trip || 'TripCTRL')}</span>`,
    t.notes && `<span class="note-dot">${icon('note', 13)} ${esc(t.notes.split('\n')[0])}</span>`,
  ].filter(Boolean).join('');
  // Al deslizar la tarjeta a la izquierda aparece detrás el botón «Hecho» (o «Pendiente» si ya está hecha)
  return `
    <div class="swipe p${t.prio}" data-swipe="${t.id}">
    <button type="button" class="swipe-act ${t.done ? 'undo' : ''}" data-check="${t.id}" tabindex="-1">${icon(t.done ? 'undo' : 'check', 22, 2.2)}<span>${t.done ? 'Pendiente' : 'Hecho'}</span></button>
    <div class="task p${t.prio} ${t.done ? 'is-done' : ''}" data-task="${t.id}">
      <button type="button" class="check ${t.done ? 'on' : ''}" data-check="${t.id}" aria-label="${t.done ? 'Marcar como pendiente' : 'Marcar como hecha'}">${icon('check', 20, 2.4)}</button>
      <button type="button" class="task-main" data-edit="${t.id}">
        <span class="task-title">${esc(t.title)}</span>
        ${sub ? `<span class="task-sub">${sub}</span>` : ''}
      </button>
    </div>
    </div>`;
}

function renderList() {
  const el = $('list');
  openSwipe = null;
  const pending = pendingTasks();
  const done = data.tasks.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt);
  const later = laterTasks();
  let html = '';
  if (!pending.length && !done.length && !later.length) {
    html = `
      <div class="card empty">
        <span class="empty-logo">${logoSVG(64)}</span>
        <h2>${esc(TT().emptyTitle)}</h2>
        <p class="muted">${esc(TT().emptyText)}</p>
        <button type="button" class="done-btn" data-add>${icon('plus', 18)} Nueva tarea</button>
      </div>`;
  }
  for (const p of PRIOS) {
    const list = pending.filter((t) => t.prio === p.lvl);
    if (!list.length) continue;
    html += `
      <section>
        <h2 class="group-title"><span class="prio-pill p${p.lvl}">${esc(prioName(p.lvl, TT()))}</span><small>${list.length}</small></h2>
        <div class="tasks">${list.map(taskCard).join('')}</div>
      </section>`;
  }
  if (later.length) {
    html += `
      <section class="done-section">
        <button type="button" class="done-toggle ${showLater ? 'open' : ''}" data-toggle-later>${icon('next', 14)} Programadas · cada año<small>${later.length}</small></button>
        ${showLater ? `<p class="muted small later-note">Vuelven a la lista unos días antes de su fecha.</p><div class="tasks">${later.map(taskCard).join('')}</div>` : ''}
      </section>`;
  }
  if (done.length) {
    html += `
      <section class="done-section">
        <button type="button" class="done-toggle ${showDone ? 'open' : ''}" data-toggle-done>${icon('next', 14)} Hechas<small>${done.length}</small></button>
        ${showDone ? `<div class="tasks">${done.map(taskCard).join('')}</div>
          <button type="button" class="text-btn small-danger" data-clear-done>${icon('trash', 15)} Borrar las hechas</button>` : ''}
      </section>`;
  }
  el.innerHTML = html;
}

// ---------- Marcar como hecha ----------

// `swiped`: la tarjeta ya ha salido deslizando, así que no hace falta otra animación
function toggleDone(id, swiped = false) {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) return;
  const apply = () => {
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : 0;
    persist();
    render();
  };
  if (t.done) return apply();
  const finish = () => {
    const prevDue = t.due;
    const result = completeTask(t); // si es anual, pasa a la fecha del año siguiente
    persist();
    render();
    const msgs = TT().doneMsgs;
    if (result === 'rolled') {
      toast(TT().back(fmtISO(t.due)), { label: 'Deshacer', run: () => { t.due = prevDue; persist(); render(); } });
    } else {
      toast(msgs[Math.floor(Math.random() * msgs.length)], { label: 'Deshacer', run: () => { t.done = false; t.doneAt = 0; persist(); render(); } });
    }
  };
  if (swiped) return finish();
  // Pequeña animación antes de quitarla de la lista
  const card = document.querySelector(`[data-task="${id}"]`);
  card?.querySelector('.check')?.classList.add('on');
  card?.classList.add('leaving');
  setTimeout(finish, 380);
}

// ---------- Deslizar una tarea a la izquierda: «Hecho» ----------
// Deslizando un poco se queda abierto el botón; deslizando más de casi la mitad, se marca al soltar.

const SWIPE_OPEN = 96;  // ancho del botón cuando se queda abierto
const SWIPE_DONE = 0.45; // fracción del ancho a partir de la cual se marca al soltar
let swipe = null;       // gesto en curso
let openSwipe = null;   // tarjeta que se ha quedado abierta
let swipedAt = 0;       // para ignorar el clic que llega justo después de deslizar

function setSwipe(wrap, x, animate) {
  const card = wrap.querySelector('.task');
  const act = wrap.querySelector('.swipe-act');
  card.style.transition = act.style.transition = animate ? '' : 'none';
  card.style.transform = x ? `translateX(${x}px)` : '';
  act.style.width = `${Math.max(0, -x - 6)}px`;
  wrap.classList.toggle('armed', -x > wrap.offsetWidth * SWIPE_DONE);
}
function closeOpenSwipe() {
  if (!openSwipe) return;
  setSwipe(openSwipe, 0, true);
  openSwipe = null;
}
function completeBySwipe(wrap) {
  setSwipe(wrap, -wrap.offsetWidth, true);
  openSwipe = null;
  setTimeout(() => toggleDone(wrap.dataset.swipe, true), 220);
}

document.addEventListener('pointerdown', (e) => {
  const wrap = e.target.closest('.swipe');
  // Tocar fuera de la tarjeta abierta la cierra (y ese toque no abre nada más)
  if (openSwipe && wrap !== openSwipe) { closeOpenSwipe(); swipedAt = Date.now(); }
  if (!wrap || e.target.closest('.swipe-act') || e.button) return;
  swipe = { wrap, pid: e.pointerId, x0: e.clientX, y0: e.clientY, base: wrap === openSwipe ? -SWIPE_OPEN : 0, dx: 0, active: false };
});
document.addEventListener('pointermove', (e) => {
  if (!swipe || e.pointerId !== swipe.pid) return;
  const dx = e.clientX - swipe.x0;
  const dy = e.clientY - swipe.y0;
  if (!swipe.active) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { swipe = null; return; } // desplazamiento vertical
    if (Math.abs(dx) < 10) return;
    swipe.active = true;
    swipe.wrap.setPointerCapture?.(e.pointerId);
  }
  swipe.dx = Math.min(0, swipe.base + dx);
  setSwipe(swipe.wrap, swipe.dx, false);
});
function endSwipe(e) {
  if (!swipe || e.pointerId !== swipe.pid) return;
  const { wrap, dx, active } = swipe;
  swipe = null;
  if (!active) return;
  swipedAt = Date.now();
  if (e.type === 'pointerup' && -dx > wrap.offsetWidth * SWIPE_DONE) completeBySwipe(wrap);
  else if (e.type === 'pointerup' && -dx > SWIPE_OPEN * 0.6) { setSwipe(wrap, -SWIPE_OPEN, true); openSwipe = wrap; }
  else { setSwipe(wrap, 0, true); if (openSwipe === wrap) openSwipe = null; }
}
document.addEventListener('pointerup', endSwipe);
document.addEventListener('pointercancel', endSwipe);

// ---------- Hojas (ventanas inferiores) ----------

function openSheet(cls, label) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(label)}"></div>`;
  document.body.append(back);
  back.addEventListener('click', (e) => { if (e.target === back) closeSheet(); });
  return back.firstElementChild;
}
function closeSheet() {
  document.querySelector('.sheet-backdrop')?.remove();
}

// Atajos de fecha: hoy, mañana, el finde (sábado; si ya es finde, hoy) y en una semana
function dateShortcuts() {
  const dow = new Date().getDay();
  const toSat = dow === 6 || dow === 0 ? 0 : 6 - dow;
  return [['', 'Sin fecha'], [todayISO(), 'Hoy'], [addDaysISO(1), 'Mañana'], [addDaysISO(toSat), 'El finde'], [addDaysISO(7), 'En una semana']];
}

function openEditor(id) {
  const t = id ? data.tasks.find((x) => x.id === id) : null;
  const draft = { title: t?.title || '', prio: t ? t.prio : 2, due: t?.due || '', notes: t?.notes || '', repeat: !!t?.repeat, lead: t?.lead || DEFAULT_LEAD };
  const sheet = openSheet('tall', t ? 'Editar tarea' : 'Nueva tarea');
  sheet.innerHTML = `
    <div class="sheet-head">
      <h2 class="sheet-title">${t ? 'Editar tarea' : 'Nueva tarea'}</h2>
      <button type="button" class="icon-btn sm" data-close aria-label="Cerrar">${icon('close', 18)}</button>
    </div>
    <input class="title-input" id="ed-title" type="text" placeholder="${esc(TT().placeholder)}" autocomplete="off" enterkeyhint="done" maxlength="200" value="${esc(draft.title)}" />
    <p class="opt-label">Prioridad</p>
    <div class="prio-pick" id="ed-prio"></div>
    <p class="opt-label">Fecha límite</p>
    <div class="date-chips" id="ed-dates"></div>
    <div id="ed-repeat"></div>
    <label class="fld"><span>Notas (opcional)</span><textarea id="ed-notes" rows="2" placeholder="Detalles, teléfono, dirección…">${esc(draft.notes)}</textarea></label>
    <div class="editor-actions">
      ${t ? `<button type="button" class="ghost-btn danger" id="ed-delete">${icon('trash', 18)} Eliminar</button>` : '<span></span>'}
      <button type="button" class="done-btn" id="ed-save">${icon('check', 18, 2)} ${t ? 'Guardar' : 'Añadir'}</button>
    </div>`;

  const drawPrio = () => {
    sheet.querySelector('#ed-prio').innerHTML = PRIOS.map((p) => `
      <button type="button" class="prio-opt p${p.lvl} ${draft.prio === p.lvl ? 'on' : ''}" data-prio="${p.lvl}" aria-pressed="${draft.prio === p.lvl}">
        <i></i><span><b>${esc(prioName(p.lvl, TT()))}</b><small>${esc(prioHint(p.lvl, TT()))} · ${esc(p.freq.toLowerCase())}</small></span>
      </button>`).join('');
  };
  const drawDates = () => {
    const shortcuts = dateShortcuts();
    const custom = draft.due && !shortcuts.some(([v]) => v === draft.due);
    sheet.querySelector('#ed-dates').innerHTML = shortcuts.map(([v, l]) =>
      `<button type="button" class="chip ${draft.due === v && !custom ? 'on' : ''}" data-due="${v}">${l}</button>`).join('') +
      `<label class="chip date-other ${custom ? 'on' : ''}">${icon('calendar', 15)} ${custom ? esc(dueLabel(draft.due).text) : 'Otra fecha'}
        <input type="date" id="ed-date" value="${draft.due}" /></label>`;
    sheet.querySelector('#ed-date').addEventListener('change', (e) => { draft.due = e.target.value || ''; drawDates(); });
    drawRepeat();
  };
  // Repetir cada año: necesita fecha; se elige con cuánta antelación vuelve a aparecer
  const LEAD_LABELS = { 7: '7 días', 14: '14 días', 30: '1 mes', 60: '2 meses' };
  const drawRepeat = () => {
    const el = sheet.querySelector('#ed-repeat');
    el.innerHTML = `
      <button type="button" class="repeat-toggle ${draft.repeat ? 'on' : ''}" data-repeat aria-pressed="${draft.repeat}">
        ${icon('repeat', 18)}<span><b>Repetir cada año</b><small>${draft.repeat
          ? (draft.due ? `Al completarla pasa al ${esc(fmtISO(nextYearISO(draft.due)).slice(0, 5))} del año siguiente` : 'Elige una fecha límite para que se pueda repetir')
          : 'Cumpleaños, renovaciones, impuestos…'}</small></span><i></i>
      </button>
      ${draft.repeat ? `
        <p class="opt-label">Vuelve a la lista con</p>
        <div class="seg wrap" role="group" aria-label="Antelación">
          ${LEAD_OPTIONS.map((d) => `<button type="button" data-lead="${d}" class="${draft.lead === d ? 'on' : ''}">${LEAD_LABELS[d]}</button>`).join('')}
        </div>
        <p class="muted small">de antelación. Hasta entonces queda en «Programadas» y no avisa.</p>` : ''}`;
  };
  drawPrio();
  drawDates();

  const titleEl = sheet.querySelector('#ed-title');
  const saveBtn = sheet.querySelector('#ed-save');
  const sync = () => { saveBtn.disabled = !titleEl.value.trim(); };
  sync();
  titleEl.addEventListener('input', sync);
  titleEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } });
  if (!t) setTimeout(() => titleEl.focus(), 60);

  sheet.addEventListener('click', (e) => {
    const p = e.target.closest('[data-prio]');
    if (p) { draft.prio = Number(p.dataset.prio); drawPrio(); return; }
    const d = e.target.closest('[data-due]');
    if (d) { draft.due = d.dataset.due; drawDates(); return; }
    if (e.target.closest('[data-repeat]')) { draft.repeat = !draft.repeat; drawRepeat(); return; }
    const l = e.target.closest('[data-lead]');
    if (l) { draft.lead = Number(l.dataset.lead); drawRepeat(); return; }
    if (e.target.closest('[data-close]')) closeSheet();
  });
  saveBtn.addEventListener('click', () => {
    const title = titleEl.value.trim();
    if (!title) return;
    if (draft.repeat && !draft.due) { toast('Ponle una fecha límite para que se repita cada año'); return; }
    const notes = sheet.querySelector('#ed-notes').value.trim();
    const fields = { title, prio: draft.prio, due: draft.due, notes, repeat: draft.repeat, lead: draft.lead };
    let task = t;
    if (t) Object.assign(t, fields);
    else data.tasks.push(task = { id: uid(), ...fields, done: false, doneAt: 0, created: Date.now() });
    persist();
    closeSheet();
    render();
    if (isDormant(task, todayISO())) {
      const back = new Date(`${task.due}T12:00:00`);
      back.setDate(back.getDate() - task.lead);
      toast(`Guardada en Programadas: vuelve a la lista el ${fmtISO(isoOf(back))}`);
    } else if (!t) toast(draft.prio === 4 ? TT().addedTop : TT().added);
  });
  sheet.querySelector('#ed-delete')?.addEventListener('click', () => {
    if (!confirm(`¿Eliminar «${t.title}»?`)) return;
    data.tasks = data.tasks.filter((x) => x.id !== t.id);
    persist();
    closeSheet();
    render();
    toast('Tarea eliminada');
  });
}

// ---------- Avisos (notificaciones) ----------

const ua = navigator.userAgent;
// El iPad con iPadOS se identifica como Mac, pero tiene pantalla táctil
const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const canNotify = () => 'Notification' in window && 'serviceWorker' in navigator;
const canPush = () => canNotify() && 'PushManager' in window;
let serverOK = null; // null: sin comprobar · true/false

async function checkServer() {
  try {
    const res = await fetch('api/push', { cache: 'no-store' });
    serverOK = res.ok && (await res.json()).configured === true;
  } catch (_) {
    serverOK = false;
  }
  return serverOK;
}

const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function saveMeta(patch) {
  meta = { ...meta, ...patch };
  await kvSet('meta', meta).catch(() => {});
}

// Suscribe este dispositivo al servidor de avisos (si existe) y le sube las horas
async function subscribePush() {
  if (!canPush() || !(await checkServer())) { await saveMeta({ subscribed: false }); return false; }
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { publicKey } = await pushApi({ action: 'key' });
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(publicKey) });
    }
    const device = meta.device || randomHex(16);
    await pushApi({ action: 'subscribe', device, sub: sub.toJSON() });
    await saveMeta({ device, subscribed: true });
    await syncSchedule(data);
    return true;
  } catch (_) {
    await saveMeta({ subscribed: false });
    return false;
  }
}

async function enableNotifications() {
  if (!canNotify()) {
    alert(isIOS && !isStandalone()
      ? 'En el iPhone y el iPad los avisos solo funcionan con la app añadida a la pantalla de inicio. Añádela desde Safari (Compartir → Añadir a pantalla de inicio), ábrela desde su icono y actívalos ahí.'
      : 'Este navegador no permite notificaciones.');
    return false;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    alert(`${TT().noPerm} Puedes darlo en los ajustes del navegador o del móvil (Notificaciones → TaskCTRL).`);
    return false;
  }
  data.settings.on = true;
  persist();
  const pushed = await subscribePush();
  const reg = await navigator.serviceWorker.ready;
  reg.showNotification('Avisos activados ✅', {
    body: pushed ? 'Te iré recordando lo pendiente, más a menudo cuanto más urgente sea.' : 'De momento solo puedo avisarte con la app abierta.',
    icon: 'icons/icon-192.png',
    tag: 'taskctrl-test',
  });
  render();
  return true;
}

async function disableNotifications() {
  data.settings.on = false;
  persist();
  render();
}

// Refresca las horas de aviso en el servidor (al cambiar algo y al abrir la app)
async function refreshSchedule() {
  if (!meta.subscribed) return;
  try { await syncSchedule(data); } catch (_) { /* sin conexión: se reintentará */ }
}

// Sin servidor de avisos: avisa mientras la app está abierta
let localTimer;
function armLocalTimer() {
  clearTimeout(localTimer);
  if (meta.subscribed || !data.settings.on || !canNotify() || Notification.permission !== 'granted') return;
  const now = Date.now();
  const next = computeSlots(data, now, now + 864e5)[0];
  if (!next) return;
  localTimer = setTimeout(async () => {
    const n = buildNotification(next, data) || buildNotification(null, data);
    (await navigator.serviceWorker.ready).showNotification(n.title, { body: n.body, tag: n.tag, icon: 'icons/icon-192.png', data: { ids: n.ids } });
    armLocalTimer();
  }, Math.min(next.t - now, 2 ** 31 - 1));
}

async function sendTest() {
  if (meta.subscribed) {
    try {
      await pushApi({ action: 'test', device: meta.device });
      toast('Aviso enviado: llega en unos segundos');
      return;
    } catch (_) {
      toast('El servidor no ha podido enviarlo');
    }
  }
  const n = buildNotification(null, data);
  (await navigator.serviceWorker.ready).showNotification(n.title, { body: n.body, tag: n.tag, icon: 'icons/icon-192.png', data: { ids: [] } });
}

function openNotifSheet() {
  const sheet = openSheet('tall', 'Avisos');
  const draw = () => {
    const s = data.settings;
    const perm = canNotify() ? Notification.permission : 'unsupported';
    const active = s.on && perm === 'granted';
    let status;
    if (perm === 'unsupported') {
      status = ['bad', 'Este navegador no puede mostrar avisos', isIOS && !isStandalone()
        ? 'En iPhone/iPad: añade TaskCTRL a la pantalla de inicio desde Safari y ábrela desde su icono.' : 'Prueba con Chrome o Safari actualizados.'];
    } else if (perm === 'denied') {
      status = ['bad', 'Avisos bloqueados', 'Permite las notificaciones de TaskCTRL en los ajustes del móvil o del navegador.'];
    } else if (!active) {
      status = ['', 'Avisos desactivados', 'Actívalos y te iré recordando lo pendiente.'];
    } else if (meta.subscribed) {
      status = ['ok', 'Avisos activados', 'Llegan aunque la app esté cerrada.'];
    } else {
      status = ['bad', 'Avisos activados solo con la app abierta', serverOK === false
        ? 'El servidor de avisos no está disponible (falta configurarlo en Vercel).' : 'Comprobando el servidor de avisos…'];
    }
    const hours = Array.from({ length: 13 }, (_, i) => 12 + i);
    sheet.innerHTML = `
      <div class="sheet-head">
        <h2 class="sheet-title">Avisos</h2>
        <button type="button" class="icon-btn sm" data-close aria-label="Cerrar">${icon('close', 18)}</button>
      </div>
      <div class="notif-status ${status[0]}">${icon(active ? 'bell' : 'bellOff', 22)}<span><b>${status[1]}</b><small>${status[2]}</small></span></div>
      <div class="row-btns">
        ${active
          ? `<button type="button" class="ghost-btn" data-test>${icon('send', 17)} Probar aviso</button><button type="button" class="ghost-btn danger" data-off>${icon('bellOff', 17)} Desactivar</button>`
          : perm !== 'unsupported' ? `<button type="button" class="done-btn" data-on>${icon('bell', 18)} Activar avisos</button>` : ''}
      </div>
      <p class="opt-label">Horario</p>
      <div class="two-col">
        <label class="fld"><span>Resumen de la mañana</span><input type="time" id="nt-morning" value="${s.morning}" /></label>
        <label class="fld"><span>Sin avisos a partir de</span><select id="nt-end">${hours.map((h) => `<option value="${h}" ${h === s.end ? 'selected' : ''}>${pad(h % 24)}:00</option>`).join('')}</select></label>
      </div>
      <p class="muted small">Cada mañana llega un resumen con las tareas del día (las que vencen hoy, las vencidas y las que no tienen fecha). Durante el día, esas tareas avisan según su prioridad:</p>
      <ul class="freq-list">
        ${PRIOS.map((p) => `<li><span class="prio-pill p${p.lvl}">${esc(prioName(p.lvl, TT()))}</span><small>${esc(p.freq)}</small></li>`).join('')}
      </ul>
      <p class="muted small">Las tareas con fecha no avisan hasta su día: la víspera, media hora antes de la hora de corte, llega un aviso con lo que toca mañana. El día que vence una tarea, y si ya está vencida, sube un nivel y avisa más a menudo.</p>
      <div class="body-actions"><button class="done-btn" type="button" data-close>Listo</button></div>`;
  };
  draw();
  if (serverOK === null) checkServer().then(draw);
  sheet.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) return closeSheet();
    if (e.target.closest('[data-on]')) { await enableNotifications(); draw(); }
    if (e.target.closest('[data-off]')) { await disableNotifications(); draw(); }
    if (e.target.closest('[data-test]')) sendTest();
  });
  sheet.addEventListener('change', (e) => {
    if (e.target.id === 'nt-morning' && /^\d{2}:\d{2}$/.test(e.target.value)) data.settings.morning = e.target.value;
    else if (e.target.id === 'nt-end') data.settings.end = Number(e.target.value);
    else return;
    persist();
  });
}

// ---------- Copia de seguridad (JSON) ----------

async function exportBackup() {
  const json = JSON.stringify({ app: 'TaskCTRL', version: APP_VERSION, exported: new Date().toISOString(), data });
  const name = `taskctrl-copia-${todayISO()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  // En el móvil, el menú Compartir permite «Guardar en Archivos» o enviarlo
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia de TaskCTRL' });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$('import-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const obj = JSON.parse(await file.text());
    if (obj.app !== 'TaskCTRL' || !obj.data) throw new Error('formato');
    const next = cleanData(obj.data);
    if (!confirm(`Se importarán ${plural(next.tasks.length, 'tarea', 'tareas')} y se sustituirá todo lo guardado en este dispositivo. ¿Continuar?`)) return;
    next.settings.on = data.settings.on; // los avisos dependen del permiso de este dispositivo
    data = next;
    persist();
    render();
    toast('Copia importada');
  } catch (_) {
    alert('El archivo no es una copia válida de TaskCTRL.');
  }
});

// ---------- Sincronización en la nube ----------
// Igual que en UnderCTRL y PayCTRL: cuenta con usuario y contraseña (crearla pide la misma clave de
// registro) y cifrado de extremo a extremo: las tareas se cifran aquí (PBKDF2 + AES-256-GCM) antes
// de subirse; el servidor solo guarda un bloque ilegible. Las claves derivan con sal propia
// («taskctrl-…»): mismo usuario que en las otras apps, cuenta distinta.
// En vez de elegir entre «nube» o «dispositivo», se fusiona tarea a tarea: gana el cambio más
// reciente de cada una y los borrados se respetan. Los avisos y su horario son de cada dispositivo.
const SYNC_API = 'api/sync';
const SYNC_EVERY_MS = 3 * 60 * 1000; // sincronización periódica mientras la app está abierta
const PBKDF2_ITERATIONS = 310000;
const utf8 = new TextEncoder();

let sync = load(SYNC_KEY, null); // { username, user, auth, key, at }
const saveSync = () => { if (sync) save(SYNC_KEY, sync); else { try { localStorage.removeItem(SYNC_KEY); } catch (_) {} } };
let pushTimer = null;
let syncBusy = false;
let syncAgain = false;
let syncError = '';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256hex = async (text) => hex(await crypto.subtle.digest('SHA-256', utf8.encode(text)));
const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (str) => Uint8Array.from(atob(str), (ch) => ch.charCodeAt(0));

async function deriveAccount(username, password) {
  const u = username.trim().toLowerCase();
  const base = await crypto.subtle.importKey('raw', utf8.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = (salt) => crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: utf8.encode(salt), iterations: PBKDF2_ITERATIONS }, base, 256);
  // Dos claves independientes: una para identificarse y otra (que nunca sale de aquí) para cifrar.
  const [auth, key] = await Promise.all([bits(`taskctrl-auth:${u}`), bits(`taskctrl-enc:${u}`)]);
  return { username: u, user: await sha256hex(`taskctrl-user:${u}`), auth: hex(auth), key: toB64(key) };
}

const aesKey = (account) => crypto.subtle.importKey('raw', fromB64(account.key), 'AES-GCM', false, ['encrypt', 'decrypt']);
async function encryptData(obj, account = sync) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(account), utf8.encode(JSON.stringify(obj)));
  return `${toB64(iv)}.${toB64(ct)}`;
}
async function decryptData(blob, account = sync) {
  const [iv, ct] = blob.split('.');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await aesKey(account), fromB64(ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

async function syncCall(action, extra = {}, account = sync) {
  const body = JSON.stringify({ action, user: account.user, auth: account.auth, ...extra });
  const res = await fetch(SYNC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    // Al salir de la app, que la subida termine aunque se cierre (Safari lo limita a 64 KB).
    keepalive: document.hidden && body.length < 60000,
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(out.error || `http ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return out;
}

const syncErrorText = (err) => ({
  auth: 'Usuario o contraseña incorrectos.',
  exists: 'Ese nombre de usuario ya existe. Elige otro o entra con tu cuenta.',
  'too-many': 'Demasiados intentos. Espera 15 minutos.',
  invite: 'La clave de registro no es correcta.',
  'not-configured': 'Falta conectar la base de datos en Vercel (Storage → Upstash Redis).',
  OperationError: 'No se han podido descifrar los datos de la nube.',
}[err.message || err.name] || 'No se pudo conectar con la nube. Se reintentará.');

// Fusión tarea a tarea: de cada tarea, la versión con el `upd` más reciente; un borrado gana si
// es posterior al último cambio de la tarea.
function mergeTasks(a, b) {
  const deleted = { ...(a.deleted || {}) };
  for (const [id, at] of Object.entries(b.deleted || {})) if (!(deleted[id] >= at)) deleted[id] = at;
  const byId = new Map();
  for (const t of [...(a.tasks || []), ...(b.tasks || [])]) {
    const cur = byId.get(t.id);
    if (!cur || (t.upd || 0) > (cur.upd || 0)) byId.set(t.id, t);
  }
  const tasks = [...byId.values()].filter((t) => !(deleted[t.id] >= (t.upd || 0)));
  return { tasks, deleted };
}
// Forma comparable (sin orden) de lo que se sincroniza
const syncSig = (x) => JSON.stringify([
  (x.tasks || []).slice().sort((p, q) => (p.id < q.id ? -1 : 1)),
  Object.entries(x.deleted || {}).sort(),
]);

// Hay cambios locales: se suben en unos segundos (se agrupan)
function queueSync() {
  if (!sync) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => syncNow(), 1500);
}

async function syncNow({ interactive = false } = {}) {
  if (!sync) return false;
  if (syncBusy) { syncAgain = true; return false; }
  syncBusy = true;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const remote = await syncCall('pull');
      const cloud = remote.blob ? cleanData(await decryptData(remote.blob)) : { tasks: [], deleted: {} };
      const merged = mergeTasks(data, cloud);
      // Lo nuevo de la nube se aplica aquí (sin marcarlo como cambio local)
      if (syncSig(merged) !== syncSig(data)) {
        data = cleanData({ ...data, ...merged });
        resetSnap();
        store();
        render();
      }
      // Y lo nuevo de aquí se sube
      const mine = { tasks: data.tasks, deleted: data.deleted };
      if (remote.blob && syncSig(mine) === syncSig(cloud)) break;
      try {
        await syncCall('push', { blob: await encryptData(mine), baseRev: remote.rev });
        break;
      } catch (err) {
        if (err.status !== 409) throw err; // otro dispositivo subió justo antes: se vuelve a fusionar
      }
    }
    sync.at = Date.now();
    syncError = '';
    saveSync();
    return true;
  } catch (err) {
    console.warn(err);
    syncError = syncErrorText(err);
    if (interactive) toast(syncError);
    return false;
  } finally {
    syncBusy = false;
    if (syncAgain) { syncAgain = false; queueSync(); }
  }
}

function syncStatusText() {
  if (!sync) return 'Desactivada';
  if (syncError) return syncError;
  if (!sync.at) return 'Pendiente';
  const mins = Math.round((Date.now() - sync.at) / 60000);
  return `Al día · ${mins < 1 ? 'hace un momento' : mins < 60 ? `hace ${mins} min` : new Date(sync.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`;
}

function openSyncSheet() {
  const sheet = openSheet('tall', 'Sincronización en la nube');
  const head = `
    <div class="sheet-head">
      <h2 class="sheet-title">Sincronización en la nube</h2>
      <button type="button" class="icon-btn sm" data-close aria-label="Cerrar">${icon('close', 18)}</button>
    </div>`;

  const renderConnected = () => {
    sheet.innerHTML = `${head}
      <div class="notif-status ${syncError ? 'bad' : 'ok'}">${icon('cloud', 22)}<span><b>Conectado como ${esc(sync.username)}</b><small class="s-status">${esc(syncStatusText())}</small></span></div>
      <p class="muted small">Tus tareas se cifran en este dispositivo antes de subirse. Entra con el mismo usuario y contraseña en tu otro móvil, tablet u ordenador para tenerlas también allí. Si cambias algo en dos sitios a la vez, se juntan los cambios: no se pierde nada.</p>
      <p class="muted small">Los avisos se activan en cada dispositivo por separado (⋯ → Avisos), por si no quieres que suenen en todos.</p>
      <div class="row-btns">
        <button type="button" class="done-btn" data-now>${icon('refresh', 17)} Sincronizar ahora</button>
        <button type="button" class="ghost-btn danger" data-logout>${icon('logout', 17)} Desconectar</button>
      </div>`;
  };

  const renderForm = (mode = 'login') => {
    sheet.innerHTML = `${head}
      <p class="muted small">Para tener tus tareas en varios dispositivos. Se cifran aquí con tu contraseña antes de subirse: nadie más puede leerlas, ni siquiera el servidor. <b>Si olvidas la contraseña no se pueden recuperar.</b></p>
      <div class="seg" role="group" aria-label="Cuenta">
        <button type="button" data-mode="login" class="${mode === 'login' ? 'on' : ''}">Ya tengo cuenta</button>
        <button type="button" data-mode="create" class="${mode === 'create' ? 'on' : ''}">Crear cuenta</button>
      </div>
      <label class="fld"><span>Usuario</span><input id="s-user" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" /></label>
      <label class="fld"><span>Contraseña</span><input id="s-pass" type="password" autocomplete="${mode === 'create' ? 'new-password' : 'current-password'}" maxlength="128" /></label>
      ${mode === 'create' ? `
      <label class="fld"><span>Repite la contraseña</span><input id="s-pass2" type="password" autocomplete="new-password" maxlength="128" /></label>
      <label class="fld"><span>Clave de registro</span><input id="s-invite" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="64" placeholder="Clave administrador" /></label>` : ''}
      <p class="form-error" id="s-error" role="alert"></p>
      <div class="body-actions"><button type="button" class="done-btn" id="s-go">${mode === 'create' ? 'Crear cuenta' : 'Entrar'}</button></div>`;
    const q = (sel) => sheet.querySelector(sel);
    q('#s-go').addEventListener('click', async () => {
      const err = q('#s-error');
      const username = q('#s-user').value.trim();
      const password = q('#s-pass').value;
      if (username.length < 3) return void (err.textContent = 'El usuario debe tener al menos 3 caracteres.');
      if (password.length < 8) return void (err.textContent = 'La contraseña debe tener al menos 8 caracteres.');
      if (mode === 'create' && password !== q('#s-pass2').value) return void (err.textContent = 'Las contraseñas no coinciden.');
      if (mode === 'create' && !q('#s-invite').value.trim()) return void (err.textContent = 'Introduce la clave de registro.');
      const btn = q('#s-go');
      btn.disabled = true;
      btn.textContent = 'Un momento…';
      err.textContent = '';
      try {
        const account = await deriveAccount(username, password);
        if (mode === 'create') await syncCall('register', { invite: q('#s-invite').value.trim() }, account);
        else await syncCall('pull', {}, account); // comprueba usuario y contraseña
        sync = { ...account, at: null };
        saveSync();
        const ok = await syncNow({ interactive: true });
        if (ok) toast(mode === 'create' ? 'Cuenta creada. Tus tareas ya están en la nube' : 'Conectado. Tareas sincronizadas');
        renderConnected();
      } catch (e) {
        console.warn(e);
        err.textContent = syncErrorText(e);
        btn.disabled = false;
        btn.textContent = mode === 'create' ? 'Crear cuenta' : 'Entrar';
      }
    });
    q('#s-user').focus();
  };

  sheet.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) return closeSheet();
    const m = e.target.closest('[data-mode]');
    if (m) return renderForm(m.dataset.mode);
    if (e.target.closest('[data-now]')) {
      sheet.querySelector('.s-status').textContent = 'Sincronizando…';
      await syncNow({ interactive: true });
      renderConnected();
    }
    if (e.target.closest('[data-logout]')) {
      if (!confirm('¿Desconectar este dispositivo? Las tareas se quedan en él, pero dejarán de sincronizarse.')) return;
      sync = null;
      saveSync();
      renderForm();
      toast('Sincronización desactivada en este dispositivo');
    }
  });
  if (sync) renderConnected();
  else renderForm();
}

// Mientras la app está abierta, trae cada poco lo cambiado en otros dispositivos
setInterval(() => { if (!document.hidden) syncNow(); }, SYNC_EVERY_MS);

// ---------- Vínculo con TripCTRL ----------
// TaskCTRL lee los viajes de TripCTRL y crea solas las tareas de cada reserva (tarjeta de embarque,
// recoger el coche, la maleta…). Hace falta la nube activada en las dos apps con el mismo usuario;
// la contraseña de TripCTRL se pide una vez para derivar aquí sus claves (nunca se guarda).
// Las tareas creadas llevan `src: 'trip'` y `gen` (cómo se generaron): si el viaje cambia se
// actualizan, si desaparece la reserva se quitan, y si las borras a mano no vuelven a crearse.

let tripLink = load(TRIP_LINK_KEY, null); // { username, user, auth, key, at }
let tripError = '';
let tripBusy = false;

async function deriveTripAccount(username, password) {
  const u = username.trim().toLowerCase();
  const base = await crypto.subtle.importKey('raw', utf8.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = (salt) => crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: utf8.encode(salt), iterations: PBKDF2_ITERATIONS }, base, 256);
  const [auth, key] = await Promise.all([bits(`tripctrl-auth:${u}`), bits(`tripctrl-enc:${u}`)]);
  return { username: u, user: await sha256hex(`tripctrl-user:${u}`), auth: hex(auth), key: toB64(key) };
}
const tripErrorText = (err) => ({
  'peer-missing': 'No se encuentra tu cuenta de TripCTRL en la nube. Comprueba que el usuario es el mismo y que las dos apps usan la misma base de datos en Vercel.',
  'peer-auth': 'La contraseña de TripCTRL no es correcta.',
  'too-many': 'Demasiados intentos. Espera 15 minutos.',
}[err.message] || syncErrorText(err));

// Qué tareas salen de cada viaje (solo de los que no han terminado). Fechas: `due` es el día de la tarea.
function tripTaskList(trips) {
  const today = todayISO();
  const out = [];
  const add = (trip, key, title, due, prio, notes, when) => {
    if (!due || when < today) return; // la reserva ya pasó
    out.push({ id: `trip-${trip.id}-${key}`, title, due: due < today ? today : due, prio, notes, trip: trip.name });
  };
  const at = (p) => [p.time && `a las ${p.time}`, p.place, p.ref && `reserva ${p.ref}`].filter(Boolean).join(' · ');
  for (const trip of trips || []) {
    if (!trip?.id || !trip.end || trip.end < today) continue;
    for (const p of trip.plan || []) {
      if (!p.date) continue;
      const name = p.title || '';
      const label = (s) => (name ? `${s} · ${name}` : s);
      if (p.kind === 'flight') {
        add(trip, `${p.id}-boarding`, label('Hacer el check-in y sacar la tarjeta de embarque'), addDaysToISO(p.date, -1), 3,
          `Vuelo el ${fmtISO(p.date)}${at(p) ? ` ${at(p)}` : ''}. El check-in online suele abrir 24–48 h antes.`, p.date);
      } else if (p.kind === 'train') {
        add(trip, `${p.id}-ticket`, label('Tener a mano el billete'), addDaysToISO(p.date, -1), 2,
          `Sale el ${fmtISO(p.date)}${at(p) ? ` ${at(p)}` : ''}.`, p.date);
      } else if (p.kind === 'car') {
        add(trip, `${p.id}-pickup`, label('Recoger el coche de alquiler (lleva carnet y tarjeta de crédito)'), p.date, 3,
          `Recogida${at(p) ? ` ${at(p)}` : ''}${p.until ? `. Devolución el ${fmtISO(p.until)}` : ''}.`, p.date);
        if (p.until) add(trip, `${p.id}-return`, label('Devolver el coche de alquiler (con el depósito como toque)'), p.until, 3, at(p), p.until);
      } else if (p.kind === 'hotel') {
        add(trip, `${p.id}-confirm`, label('Confirmar la reserva del alojamiento y la hora de llegada'), addDaysToISO(p.date, -2), 1,
          `Entrada el ${fmtISO(p.date)}${at(p) ? ` ${at(p)}` : ''}.`, p.date);
      } else if (p.kind === 'activity' && (p.ref || p.cost)) {
        add(trip, `${p.id}-tickets`, label('Llevar las entradas'), p.date, 2, at(p), p.date);
      }
    }
    // Del viaje entero
    const pending = (trip.pack || []).filter((x) => !x.done).length;
    add(trip, 'pack', `Hacer la maleta · ${trip.name}`, addDaysToISO(trip.start, -1), 3,
      pending ? `Quedan ${pending} cosas por preparar en la lista de TripCTRL.` : '', trip.start);
    if (trip.region === 'world') {
      add(trip, 'docs', `Revisar pasaporte, visados y vacunas · ${trip.name}`, addDaysToISO(trip.start, -30), 2, 'Mira la pestaña Papeles de TripCTRL.', trip.start);
    } else if (trip.region === 'eu') {
      add(trip, 'docs', `Revisar DNI o pasaporte y la tarjeta sanitaria europea · ${trip.name}`, addDaysToISO(trip.start, -7), 2, 'Mira la pestaña Papeles de TripCTRL.', trip.start);
    }
  }
  return out;
}

// Junta las tareas de los viajes con las de aquí. Devuelve si ha cambiado algo.
function applyTripTasks(trips) {
  const want = tripTaskList(trips);
  const wantIds = new Set(want.map((w) => w.id));
  let changed = false;
  for (const w of want) {
    if (data.deleted[w.id]) continue; // la borraste a mano: no vuelve
    const gen = JSON.stringify([w.title, w.due, w.prio, w.notes]);
    const t = data.tasks.find((x) => x.id === w.id);
    if (!t) {
      data.tasks.push({ id: w.id, title: w.title, prio: w.prio, due: w.due, notes: w.notes, repeat: false, lead: DEFAULT_LEAD,
        done: false, doneAt: 0, created: Date.now(), src: 'trip', trip: w.trip, gen });
      changed = true;
    } else if (t.gen !== gen || t.trip !== w.trip) {
      // El viaje ha cambiado: se actualiza (si cambia la fecha, vuelve a estar pendiente)
      if (t.due !== w.due) { t.done = false; t.doneAt = 0; }
      Object.assign(t, { title: w.title, prio: w.prio, due: w.due, notes: w.notes, trip: w.trip, gen });
      changed = true;
    }
  }
  // Reservas quitadas o viajes borrados: fuera sus tareas pendientes (las hechas se quedan en «Hechas»)
  const before = data.tasks.length;
  data.tasks = data.tasks.filter((t) => t.src !== 'trip' || t.done || wantIds.has(t.id));
  if (data.tasks.length !== before) changed = true;
  if (changed) { persist(); render(); }
  return changed;
}

async function refreshTrips({ interactive = false } = {}) {
  if (!sync || !tripLink || tripBusy) return false;
  tripBusy = true;
  try {
    const out = await syncCall('peer-pull', { peer: { user: tripLink.user, auth: tripLink.auth } });
    const trip = out.blob ? await decryptData(out.blob, tripLink) : { trips: [] };
    applyTripTasks(trip.trips || []);
    tripLink.at = Date.now();
    tripLink.trips = (trip.trips || []).filter((t) => t.end >= todayISO()).length;
    save(TRIP_LINK_KEY, tripLink);
    tripError = '';
    return true;
  } catch (err) {
    console.warn(err);
    tripError = tripErrorText(err);
    if (interactive) toast(tripError);
    return false;
  } finally {
    tripBusy = false;
  }
}

function openTripSheet() {
  const sheet = openSheet('tall', 'Vincular con TripCTRL');
  const draw = () => {
    const head = `
      <div class="sheet-head">
        <h2 class="sheet-title">Vincular con TripCTRL</h2>
        <button type="button" class="icon-btn sm" data-close aria-label="Cerrar">${icon('close', 18)}</button>
      </div>
      <p class="muted small">TaskCTRL lee tus viajes de TripCTRL y crea solas las tareas de cada reserva: sacar la tarjeta de embarque la víspera del vuelo, recoger y devolver el coche, confirmar el alojamiento, llevar las entradas, hacer la maleta y revisar los documentos.</p>`;
    if (!sync) {
      sheet.innerHTML = `${head}
        <p class="muted small">Primero activa la <b>sincronización en la nube</b> aquí, con el mismo usuario que usas en TripCTRL.</p>
        <div class="body-actions"><button class="done-btn" type="button" data-go-sync>${icon('cloud', 17)} Ir a la nube</button></div>`;
      return;
    }
    const n = data.tasks.filter((t) => t.src === 'trip' && !t.done).length;
    sheet.innerHTML = `${head}
      ${tripLink ? `
        <div class="notif-status ${tripError ? 'bad' : 'ok'}">${icon('plane', 22)}<span><b>Vinculado como ${esc(tripLink.username)}</b><small>${esc(tripError || (tripLink.at ? `${plural(tripLink.trips || 0, 'viaje próximo', 'viajes próximos')} · ${plural(n, 'tarea pendiente', 'tareas pendientes')} · actualizado ${new Date(tripLink.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}` : 'Pendiente'))}</small></span></div>
        <p class="muted small">Se actualiza al abrir la app. Si cambias una reserva en TripCTRL, su tarea cambia; si la quitas, desaparece. Puedes editar o borrar estas tareas como cualquier otra: las que borres no vuelven.</p>
        <div class="row-btns">
          <button class="done-btn" type="button" data-now>${icon('refresh', 17)} Actualizar ahora</button>
          <a class="ghost-btn" href="${TRIP_APP_URL}" target="_blank" rel="noopener">${icon('plane', 17)} Abrir TripCTRL</a>
          <button class="ghost-btn danger" type="button" data-off>Desvincular</button>
        </div>` : `
        <p class="muted small">Se usará la cuenta de la nube <b>${esc(sync.username)}</b>: introduce la contraseña de TripCTRL de ese mismo usuario. No se guarda: solo sirve para derivar aquí la clave que descifra tus viajes.</p>
        <label class="fld"><span>Contraseña de TripCTRL</span><input id="l-pass" type="password" autocomplete="current-password" maxlength="128" /></label>
        <p class="form-error" id="l-err" role="alert"></p>
        <div class="body-actions"><button class="done-btn" type="button" data-go>Vincular</button></div>`}`;
    sheet.querySelector('#l-pass')?.focus();
  };
  draw();
  sheet.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) return closeSheet();
    if (e.target.closest('[data-go-sync]')) return openSyncSheet();
    if (e.target.closest('[data-now]')) { await refreshTrips({ interactive: true }); return draw(); }
    if (e.target.closest('[data-off]')) {
      if (!confirm('¿Desvincular de TripCTRL? Las tareas ya creadas se quedan, pero dejarán de actualizarse con tus viajes.')) return;
      tripLink = null;
      tripError = '';
      try { localStorage.removeItem(TRIP_LINK_KEY); } catch (_) {}
      draw();
      return toast('Desvinculado de TripCTRL');
    }
    const go = e.target.closest('[data-go]');
    if (go) {
      const pass = sheet.querySelector('#l-pass').value;
      if (!pass) return void (sheet.querySelector('#l-err').textContent = 'Introduce la contraseña.');
      go.disabled = true;
      go.textContent = 'Un momento…';
      tripLink = await deriveTripAccount(sync.username, pass);
      if (await refreshTrips()) {
        const n = data.tasks.filter((t) => t.src === 'trip' && !t.done).length;
        toast(n ? `Vinculado: ${plural(n, 'tarea creada', 'tareas creadas')} de tus viajes` : 'Vinculado con TripCTRL');
        draw();
      } else {
        const msg = tripError;
        tripLink = load(TRIP_LINK_KEY, null);
        draw();
        sheet.querySelector('#l-err').textContent = msg;
      }
    }
  });
}

// ---------- Tono del lenguaje (menú ⋯) ----------

function openToneSheet() {
  const sheet = openSheet('', 'Tono del lenguaje');
  const draw = () => {
    const cur = data.settings.tone;
    sheet.innerHTML = `
      <h2 class="sheet-title">Tono del lenguaje</h2>
      <p class="muted small">Cambia cómo se llaman las prioridades y cómo te hablan los mensajes y los avisos.</p>
      <div class="tone-list">
        ${Object.entries(TONES).map(([k, tn]) => `
          <button type="button" class="tone-opt ${cur === k ? 'on' : ''}" data-tone="${k}" aria-pressed="${cur === k}">
            <span class="tone-head"><b>${esc(tn.label)}</b>${cur === k ? icon('check', 18, 2) : ''}</span>
            <span class="tone-pills">${PRIOS.slice(0, 3).map((p) => `<span class="prio-pill p${p.lvl}">${esc(prioName(p.lvl, tn))}</span>`).join('')}</span>
            <small>${esc(tn.doneMsgs[0])} · ${esc(tn.nothing)}</small>
          </button>`).join('')}
      </div>
      <div class="body-actions"><button class="done-btn" type="button" data-done>Listo</button></div>`;
  };
  draw();
  sheet.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tone]');
    if (b) {
      data.settings.tone = b.dataset.tone;
      persist(); // también llega al service worker, que escribe los avisos
      render();
      draw();
    }
    if (e.target.closest('[data-done]')) closeSheet();
  });
}

// ---------- Invítame a un café ----------
function openDonateSheet() {
  closeSheet();
  // En el iPhone con la app instalada, iOS abre los enlaces en un navegador interno donde el
  // pago de Ko-fi falla: se intenta abrir Safari y, si no se puede, se explica cómo pasar a él.
  const iosApp = isIOS && isStandalone();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop center';
  back.innerHTML = `
    <div class="sheet donate-sheet" role="dialog" aria-modal="true" aria-label="Invítame a un café">
      <span class="donate-hero">${document.querySelector('.donate-icon').innerHTML.replace('width="20" height="20"', 'width="34" height="34"')}</span>
      <h2 class="sheet-title">¿Te salva de algún despiste?</h2>
      <p class="muted small">TaskCTRL es gratis y sin anuncios. Si te resulta útil y quieres apoyar que siga mejorando, puedes invitarme a un café. Cualquier cantidad ayuda.</p>
      <a class="done-btn donate-go" href="${DONATE_URL}" target="_blank" rel="noopener">${iosApp ? 'Abrir en Safari' : 'Invitar a un café'}</a>
      ${iosApp ? `<p class="muted small donate-tip">Si se abre dentro de la app, pulsa el icono de Safari (abajo a la derecha) para hacer el pago allí.</p>
      <button class="text-btn donate-copy" type="button">Copiar enlace</button>` : ''}
      <button class="text-btn donate-later" type="button">Ahora no</button>
    </div>`;
  back.addEventListener('click', (e) => { if (e.target === back) closeSheet(); });
  back.querySelector('.donate-later').addEventListener('click', closeSheet);
  back.querySelector('.donate-go').addEventListener('click', (e) => {
    if (!iosApp) return void setTimeout(closeSheet, 300);
    e.preventDefault();
    // Atajo de iOS para abrir directamente en Safari; si no responde, enlace normal
    let left = false;
    const onHide = () => { left = true; };
    document.addEventListener('visibilitychange', onHide, { once: true });
    location.href = DONATE_URL.replace(/^https:\/\//, 'x-safari-https://');
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      if (!left && document.visibilityState === 'visible') window.open(DONATE_URL, '_blank', 'noopener');
    }, 1200);
  });
  back.querySelector('.donate-copy')?.addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(DONATE_URL);
      e.target.textContent = 'Enlace copiado: pégalo en Safari';
    } catch (_) {
      e.target.textContent = DONATE_URL.replace('https://', '');
    }
  });
  document.body.append(back);
}
if (DONATE_URL) {
  $('donate-btn').hidden = false;
  $('donate-btn').addEventListener('click', openDonateSheet);
}

// ---------- Menú ⋯ ----------

const MENU = [
  { label: 'Avisos', icon: 'bell', run: () => openNotifSheet() },
  { label: 'Sincronización en la nube', icon: 'cloud', run: () => openSyncSheet() },
  { label: 'Vincular con TripCTRL', icon: 'plane', run: () => openTripSheet() },
  { label: 'Tono del lenguaje', icon: 'chat', run: () => openToneSheet() },
  { label: 'Opciones de visualización', icon: 'palette', run: () => openDisplaySheet() },
  { label: 'Exportar copia', icon: 'download', run: () => exportBackup() },
  { label: 'Importar copia', icon: 'upload', run: () => $('import-input').click() },
];

function openMenu() {
  const menu = $('menu');
  menu.innerHTML = MENU.map((m, i) =>
    `<button class="menu-item" role="menuitem" data-i="${i}">${icon(m.icon, 20)}<span>${m.label}</span></button>`).join('');
  menu.querySelectorAll('.menu-item').forEach((b) => b.addEventListener('click', () => {
    closeMenu();
    MENU[b.dataset.i].run();
  }));
  const r = $('menu-btn').getBoundingClientRect();
  menu.style.top = `${r.bottom + 6}px`;
  menu.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
  menu.hidden = false;
  $('menu-btn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  $('menu').hidden = true;
  $('menu-btn').setAttribute('aria-expanded', 'false');
}
$('menu-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  if ($('menu').hidden) openMenu();
  else closeMenu();
});
document.addEventListener('click', (e) => {
  if (!$('menu').hidden && !e.target.closest('#menu')) closeMenu();
});
window.addEventListener('resize', closeMenu);

// ---------- Opciones de visualización (modo y fondo) ----------

const WALLS = {
  fucsia: { name: 'Fucsia', c: ['232 121 249', '245 208 254', '192 38 211', '236 72 153'] },
  noche: { name: 'Noche', c: ['129 140 248', '196 181 253', '99 102 241', '79 70 229'] },
  menta: { name: 'Menta', c: ['52 211 153', '134 239 172', '45 212 191', '22 163 74'] },
  glaciar: { name: 'Glaciar', c: ['96 165 250', '186 230 253', '56 189 248', '37 99 235'] },
};
const lightQuery = matchMedia('(prefers-color-scheme: light)');
let display = { theme: 'auto', wall: 'fucsia', ...load(DISPLAY_KEY, {}) };
if (!WALLS[display.wall]) display.wall = 'fucsia';

function applyDisplay() {
  const light = display.theme === 'light' || (display.theme === 'auto' && lightQuery.matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.documentElement.dataset.wall = display.wall;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', light ? '#fcf4fd' : '#0f0810');
}
lightQuery.addEventListener('change', () => { if (display.theme === 'auto') applyDisplay(); });

function wallPreview(key) {
  const [c1, c2, c3, c4] = WALLS[key].c;
  const light = document.documentElement.dataset.theme === 'light';
  const a = light ? 0.4 : 0.5;
  const base = light ? '#fcf4fd' : '#0f0810';
  return `radial-gradient(70% 60% at 15% 10%, rgb(${c1} / ${a}), transparent 70%), radial-gradient(60% 55% at 90% 25%, rgb(${c2} / ${a * 0.8}), transparent 72%),
    radial-gradient(70% 60% at 75% 95%, rgb(${c3} / ${a * 0.85}), transparent 70%), radial-gradient(60% 55% at 5% 85%, rgb(${c4} / ${a * 0.8}), transparent 72%), ${base}`;
}

function openDisplaySheet() {
  const sheet = openSheet('', 'Opciones de visualización');
  const draw = () => {
    sheet.innerHTML = `
      <h2 class="sheet-title">Opciones de visualización</h2>
      <p class="opt-label">Modo</p>
      <div class="seg" role="group" aria-label="Modo">
        ${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Automático']].map(([v, l]) =>
          `<button type="button" data-theme-opt="${v}" class="${display.theme === v ? 'on' : ''}" aria-pressed="${display.theme === v}">${l}</button>`).join('')}
      </div>
      <p class="muted small">${display.theme === 'auto' ? 'Sigue el modo claro u oscuro del sistema.' : '&nbsp;'}</p>
      <p class="opt-label">Fondo</p>
      <div class="walls">
        ${Object.entries(WALLS).map(([k, w]) =>
          `<button type="button" class="wall ${display.wall === k ? 'on' : ''}" data-wall-opt="${k}" style="background:${wallPreview(k)}" aria-pressed="${display.wall === k}">${w.name}</button>`).join('')}
      </div>
      <div class="body-actions"><button class="done-btn" type="button" data-done>Listo</button></div>`;
    sheet.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => {
      display.theme = b.dataset.themeOpt;
      save(DISPLAY_KEY, display);
      applyDisplay();
      draw();
    }));
    sheet.querySelectorAll('[data-wall-opt]').forEach((b) => b.addEventListener('click', () => {
      display.wall = b.dataset.wallOpt;
      save(DISPLAY_KEY, display);
      applyDisplay();
      draw();
    }));
    sheet.querySelector('[data-done]').addEventListener('click', closeSheet);
  };
  draw();
}

// ---------- Eventos de la pantalla principal ----------

$('add-btn').addEventListener('click', () => openEditor());
document.querySelector('main').addEventListener('click', (e) => {
  if (Date.now() - swipedAt < 400) return;
  const act = e.target.closest('.swipe-act');
  if (act) return completeBySwipe(act.parentElement);
  const check = e.target.closest('[data-check]');
  if (check) return toggleDone(check.dataset.check);
  const edit = e.target.closest('[data-edit]');
  if (edit) return openEditor(edit.dataset.edit);
  if (e.target.closest('[data-add]')) return openEditor();
  if (e.target.closest('[data-notif]')) return openNotifSheet();
  if (e.target.closest('[data-toggle-done]')) { showDone = !showDone; return renderList(); }
  if (e.target.closest('[data-toggle-later]')) { showLater = !showLater; return renderList(); }
  if (e.target.closest('[data-clear-done]') && confirm('¿Borrar todas las tareas hechas?')) {
    data.tasks = data.tasks.filter((t) => !t.done);
    persist();
    render();
  }
});

// ---------- Pantalla de inicio ----------

$('enter-btn').addEventListener('click', () => {
  const body = document.body;
  if (body.classList.contains('entering')) return;
  body.classList.add('entering');
  setTimeout(() => {
    $('splash').remove();
    body.classList.remove('booting', 'entering');
    maybeShowInstallHint();
  }, 820);
});

// ---------- Aviso: añadir a la pantalla de inicio (solo móvil y tablet) ----------

const HINT_ICONS = {
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>',
  more: '<circle cx="12" cy="5.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="18.5" r="1.5" fill="currentColor"/>',
  add: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const hintIcon = (name) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HINT_ICONS[name]}</svg>`;

function maybeShowInstallHint() {
  if (!(isIOS || isAndroid) || isStandalone()) return;
  if (load(INSTALL_HINT_KEY, null) === 'off') return;
  const steps = isIOS
    ? [
        ['share', 'Pulsa el botón <b>Compartir</b> de Safari (abajo en el iPhone, arriba en el iPad).'],
        ['add', 'Desliza hacia abajo y elige <b>Añadir a pantalla de inicio</b>.'],
        ['check', 'Pulsa <b>Añadir</b>. El icono de TaskCTRL aparecerá junto a tus apps.'],
      ]
    : [
        ['more', 'Pulsa el menú <b>⋮</b> de Chrome, arriba a la derecha.'],
        ['add', 'Elige <b>Añadir a pantalla de inicio</b> o <b>Instalar aplicación</b>.'],
        ['check', 'Confirma con <b>Instalar</b>. El icono de TaskCTRL aparecerá junto a tus apps.'],
      ];
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-backdrop center';
  back.innerHTML = `
    <div class="sheet install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <span class="install-logo">${logoSVG(56)}</span>
      <h2 class="sheet-title" id="install-title">Añade TaskCTRL a tu pantalla de inicio</h2>
      <p class="muted small">Así la abrirás como una app más, a pantalla completa y con un solo toque.</p>
      <ol class="install-steps">
        ${steps.map(([ic, text]) => `<li><span class="step-icon">${hintIcon(ic)}</span><span>${text}</span></li>`).join('')}
      </ol>
      <div class="install-footer">
        <label class="no-more"><input type="checkbox" id="install-no-more" /> No mostrar más</label>
        <button class="done-btn" type="button" id="install-ok">Aceptar</button>
      </div>
    </div>`;
  document.body.append(back);
  back.querySelector('#install-ok').addEventListener('click', () => {
    if (back.querySelector('#install-no-more').checked) save(INSTALL_HINT_KEY, 'off');
    closeSheet();
  });
}

// ---------- Siempre en vertical y sin zoom ----------

try { screen.orientation?.lock?.('portrait').catch(() => {}); } catch (_) { /* no compatible */ }
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

// Pide al navegador que no borre los datos guardados si falta espacio
navigator.storage?.persist?.().catch(() => {});

applyDisplay();
render();

// La fecha cambia a medianoche y con la app en segundo plano: se repinta al volver
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  adoptIDBState().then(() => { render(); syncNow().then(() => refreshTrips()); });
  refreshSchedule();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'state-changed') adoptIDBState(); });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

(async () => {
  try { meta = (await kvGet('meta')) || {}; } catch (_) { meta = {}; }
  await adoptIDBState();
  syncNow().then(() => refreshTrips());
  // Si el permiso sigue concedido, renueva la suscripción y las horas de los próximos días
  if (data.settings.on && canPush() && Notification.permission === 'granted') {
    if (meta.subscribed) refreshSchedule();
    else subscribePush().then(armLocalTimer);
  }
  armLocalTimer();
})();
