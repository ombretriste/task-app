'use strict';

// Versión de la app (se ve en la pantalla de inicio). Arreglos y ajustes: 0.x.y; novedades: 0.x.0.
const APP_VERSION = '0.1.1';
const STORAGE_KEY = 'taskctrl:v1';
const DISPLAY_KEY = 'taskctrl:display';
const INSTALL_HINT_KEY = 'taskctrl:installHint';
const KEEP_DONE_DAYS = 30; // las tareas hechas se borran solas pasado un mes

const ICONS = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
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
// localStorage `taskctrl:v1` = { tasks: [{ id, title, prio 0–4, due 'YYYY-MM-DD'|'', notes, done, doneAt, created }],
//                                settings: { on, morning 'HH:MM', end (hora) }, upd }
// Se copia también en IndexedDB para que el service worker pueda componer los avisos.

function cleanData(d) {
  const out = { tasks: [], settings: { ...DEFAULT_SETTINGS }, upd: 0 };
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
      done: !!t.done,
      doneAt: Number(t.doneAt) || 0,
      created: Number(t.created) || Date.now(),
    });
  }
  const s = d.settings || {};
  out.settings.on = !!s.on;
  if (/^\d{2}:\d{2}$/.test(s.morning || '')) out.settings.morning = s.morning;
  if (Number.isInteger(s.end) && s.end >= 12 && s.end <= 24) out.settings.end = s.end;
  out.upd = Number(d.upd) || 0;
  return out;
}

let data = cleanData(load(STORAGE_KEY, null));
let meta = {}; // { device, subscribed, lastSlot } — en IndexedDB, compartido con el service worker
let showDone = false;

let syncTimer;
function persist() {
  data.upd = Date.now();
  save(STORAGE_KEY, data);
  kvSet('state', data).catch(() => {});
  clearTimeout(syncTimer);
  syncTimer = setTimeout(refreshSchedule, 1200);
  armLocalTimer();
}

// Si el service worker cambió algo (p. ej. «Hecho» desde la notificación), manda su copia
async function adoptIDBState() {
  try {
    const s = await kvGet('state');
    if (s && (s.upd || 0) > (data.upd || 0)) {
      data = cleanData(s);
      save(STORAGE_KEY, data);
      render();
    } else {
      await kvSet('state', data);
    }
  } catch (_) { /* sin IndexedDB */ }
}

const pendingTasks = () => sortTasks(data.tasks.filter((t) => !t.done));

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
    ? `<button type="button" class="notif-cta" data-notif>${icon('bell', 20)}<span>Activa los avisos para que no se te pase nada</span></button>`
    : '';
  if (!pending.length) {
    el.innerHTML = `
      <p class="label">Pendientes</p>
      <div class="big-stat"><span class="big-ok">${icon('check', 28, 1.6)}</span>
        <span class="big-label">${data.tasks.length ? 'Todo hecho, máquina.<br>Nada pendiente.' : 'Aún no hay tareas.<br>Empieza cuando quieras.'}</span></div>
      ${cta}`;
    return;
  }
  const counts = PRIOS.map((p) => ({ p, n: pending.filter((t) => t.prio === p.lvl).length })).filter((c) => c.n);
  const extra = [late && `<b>${plural(late, 'vencida', 'vencidas')}</b>`, forToday && plural(forToday, 'para hoy', 'para hoy')].filter(Boolean).join(' · ');
  el.innerHTML = `
    <p class="label">Pendientes</p>
    <div class="big-stat">
      <span class="big-number">${pending.length}</span>
      <span class="big-label">${pending.length === 1 ? 'cosa pendiente' : 'cosas pendientes'}${extra ? `<br>${extra}` : ''}</span>
    </div>
    <div class="prio-bar" aria-hidden="true">${counts.map((c) => `<i class="p${c.p.lvl}" style="flex:${c.n}"></i>`).join('')}</div>
    <div class="prio-legend">${counts.map((c) => `<span class="p${c.p.lvl}">${c.n} · ${esc(c.p.name)}</span>`).join('')}</div>
    ${cta}`;
}

function taskCard(t) {
  const due = dueLabel(t.due);
  const sub = [
    due && `<span class="due ${t.done ? '' : due.cls}">${icon('calendar', 13)}${esc(due.text)}</span>`,
    t.notes && `<span class="note-dot">${icon('note', 13)} ${esc(t.notes.split('\n')[0])}</span>`,
  ].filter(Boolean).join('');
  return `
    <div class="task p${t.prio} ${t.done ? 'is-done' : ''}" data-task="${t.id}">
      <button type="button" class="check ${t.done ? 'on' : ''}" data-check="${t.id}" aria-label="${t.done ? 'Marcar como pendiente' : 'Marcar como hecha'}">${icon('check', 20, 2.4)}</button>
      <button type="button" class="task-main" data-edit="${t.id}">
        <span class="task-title">${esc(t.title)}</span>
        ${sub ? `<span class="task-sub">${sub}</span>` : ''}
      </button>
    </div>`;
}

function renderList() {
  const el = $('list');
  const pending = pendingTasks();
  const done = data.tasks.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt);
  let html = '';
  if (!pending.length && !done.length) {
    html = `
      <div class="card empty">
        <span class="empty-logo">${logoSVG(64)}</span>
        <h2>Nada por aquí, bro</h2>
        <p class="muted">Apunta lo que tengas pendiente, ponle prioridad y fecha, y yo me encargo de recordártelo.</p>
        <button type="button" class="done-btn" data-add>${icon('plus', 18)} Nueva tarea</button>
      </div>`;
  }
  for (const p of PRIOS) {
    const list = pending.filter((t) => t.prio === p.lvl);
    if (!list.length) continue;
    html += `
      <section>
        <h2 class="group-title"><span class="prio-pill p${p.lvl}">${esc(p.name)}</span><small>${list.length}</small></h2>
        <div class="tasks">${list.map(taskCard).join('')}</div>
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

const DONE_MSGS = ['¡Hecho, máquina!', 'Uno menos, crack', 'Fuera de la lista 💪', 'Eso es, bro', 'Tachada. Así se hace'];

function toggleDone(id) {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) return;
  const apply = () => {
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : 0;
    persist();
    render();
  };
  if (t.done) return apply();
  // Pequeña animación antes de quitarla de la lista
  const card = document.querySelector(`[data-task="${id}"]`);
  card?.querySelector('.check')?.classList.add('on');
  card?.classList.add('leaving');
  setTimeout(() => {
    apply();
    toast(DONE_MSGS[Math.floor(Math.random() * DONE_MSGS.length)], { label: 'Deshacer', run: () => { t.done = false; t.doneAt = 0; persist(); render(); } });
  }, 380);
}

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
  const draft = { title: t?.title || '', prio: t ? t.prio : 2, due: t?.due || '', notes: t?.notes || '' };
  const sheet = openSheet('tall', t ? 'Editar tarea' : 'Nueva tarea');
  sheet.innerHTML = `
    <div class="sheet-head">
      <h2 class="sheet-title">${t ? 'Editar tarea' : 'Nueva tarea'}</h2>
      <button type="button" class="icon-btn sm" data-close aria-label="Cerrar">${icon('close', 18)}</button>
    </div>
    <input class="title-input" id="ed-title" type="text" placeholder="¿Qué tienes que hacer?" autocomplete="off" enterkeyhint="done" maxlength="200" value="${esc(draft.title)}" />
    <p class="opt-label">Prioridad</p>
    <div class="prio-pick" id="ed-prio"></div>
    <p class="opt-label">Fecha límite</p>
    <div class="date-chips" id="ed-dates"></div>
    <label class="fld"><span>Notas (opcional)</span><textarea id="ed-notes" rows="2" placeholder="Detalles, teléfono, dirección…">${esc(draft.notes)}</textarea></label>
    <div class="editor-actions">
      ${t ? `<button type="button" class="ghost-btn danger" id="ed-delete">${icon('trash', 18)} Eliminar</button>` : '<span></span>'}
      <button type="button" class="done-btn" id="ed-save">${icon('check', 18, 2)} ${t ? 'Guardar' : 'Añadir'}</button>
    </div>`;

  const drawPrio = () => {
    sheet.querySelector('#ed-prio').innerHTML = PRIOS.map((p) => `
      <button type="button" class="prio-opt p${p.lvl} ${draft.prio === p.lvl ? 'on' : ''}" data-prio="${p.lvl}" aria-pressed="${draft.prio === p.lvl}">
        <i></i><span><b>${esc(p.name)}</b><small>${esc(p.hint)} · ${esc(p.freq.toLowerCase())}</small></span>
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
    if (e.target.closest('[data-close]')) closeSheet();
  });
  saveBtn.addEventListener('click', () => {
    const title = titleEl.value.trim();
    if (!title) return;
    const notes = sheet.querySelector('#ed-notes').value.trim();
    if (t) Object.assign(t, { title, prio: draft.prio, due: draft.due, notes });
    else data.tasks.push({ id: uid(), title, prio: draft.prio, due: draft.due, notes, done: false, doneAt: 0, created: Date.now() });
    persist();
    closeSheet();
    render();
    if (!t) toast(draft.prio === 4 ? 'Apuntada. Esta no se te escapa 🔥' : 'Apuntada');
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
    alert('Sin permiso no puedo avisarte, bro. Puedes darlo en los ajustes del navegador o del móvil (Notificaciones → TaskCTRL).');
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
      <p class="muted small">Cada mañana llega un resumen con todo lo pendiente. Durante el día, cada tarea avisa según su prioridad:</p>
      <ul class="freq-list">
        ${PRIOS.map((p) => `<li><span class="prio-pill p${p.lvl}">${esc(p.name)}</span><small>${esc(p.freq)}</small></li>`).join('')}
      </ul>
      <p class="muted small">El día que vence una tarea, y si ya está vencida, sube un nivel y avisa más a menudo.</p>
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

// ---------- Menú ⋯ ----------

const MENU = [
  { label: 'Avisos', icon: 'bell', run: () => openNotifSheet() },
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
  const check = e.target.closest('[data-check]');
  if (check) return toggleDone(check.dataset.check);
  const edit = e.target.closest('[data-edit]');
  if (edit) return openEditor(edit.dataset.edit);
  if (e.target.closest('[data-add]')) return openEditor();
  if (e.target.closest('[data-notif]')) return openNotifSheet();
  if (e.target.closest('[data-toggle-done]')) { showDone = !showDone; return renderList(); }
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
  adoptIDBState().then(render);
  refreshSchedule();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'state-changed') adoptIDBState(); });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

(async () => {
  try { meta = (await kvGet('meta')) || {}; } catch (_) { meta = {}; }
  await adoptIDBState();
  // Si el permiso sigue concedido, renueva la suscripción y las horas de los próximos días
  if (data.settings.on && canPush() && Notification.permission === 'granted') {
    if (meta.subscribed) refreshSchedule();
    else subscribePush().then(armLocalTimer);
  }
  armLocalTimer();
})();
