// Código compartido por la app (app.js) y el service worker (sw.js): prioridades, cuándo toca
// avisar de cada tarea, el texto de las notificaciones y el estado guardado en IndexedDB.
// Sin DOM: el service worker lo carga con importScripts.
'use strict';

// Escala de prioridad, de la más alta (4) a la más baja (0).
// `every`: minutos entre avisos dentro del horario; `daily`: un aviso al día por la tarde.
const PRIOS = [
  { lvl: 4, name: "Pa' ayer, bro", hint: 'Urgente de verdad', freq: 'Aviso cada hora', dot: '🔴', every: 60 },
  { lvl: 3, name: 'No olvides esto, bro', hint: 'Importante', freq: 'Aviso cada 3 horas', dot: '🟠', every: 180 },
  { lvl: 2, name: 'Que no se te pase', hint: 'Tenlo en el radar', freq: 'Aviso cada 6 horas', dot: '🟡', every: 360 },
  { lvl: 1, name: 'Tranqui, sin agobios', hint: 'Cuando puedas', freq: 'Un aviso al día', dot: '🟢', daily: true },
  { lvl: 0, name: 'Si eso, ya tal', hint: 'Algún día', freq: 'Solo en el resumen de la mañana', dot: '🔵' },
];
const PRIO = (lvl) => PRIOS[4 - lvl];
const DEFAULT_SETTINGS = { on: false, morning: '08:30', end: 22 };
const HORIZON_DAYS = 7;   // se programan los avisos de los próximos 7 días
const MAX_SLOTS = 400;
const DAILY_AFTER_H = 9;  // el aviso diario de «Tranqui» llega 9 h después del resumen

const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function daysBetween(fromISO, toISO) {
  const [a, b, c] = fromISO.split('-').map(Number);
  const [x, y, z] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(x, y - 1, z) - Date.UTC(a, b - 1, c)) / 864e5);
}

// Orden de la lista: prioridad, luego fecha límite (sin fecha al final), luego antigüedad
function sortTasks(list) {
  return list.slice().sort((a, b) =>
    b.prio - a.prio || (a.due || '9999').localeCompare(b.due || '9999') || a.created - b.created);
}

// Prioridad efectiva para avisar: sube un nivel el día que vence y si ya está vencida
function effLevel(task, dayISO) {
  return task.due && task.due <= dayISO ? Math.min(4, task.prio + 1) : task.prio;
}

// Momentos de aviso entre `from` y `to` (ms): [{ t, kind: 'morning'|'remind', ids: [...] }]
function computeSlots(state, from, to) {
  const s = { ...DEFAULT_SETTINGS, ...(state && state.settings) };
  const pending = ((state && state.tasks) || []).filter((t) => !t.done);
  if (!s.on) return [];
  const [mh, mm] = String(s.morning).split(':').map(Number);
  const slots = new Map();
  const add = (t, kind, ids) => {
    if (t <= from || t > to) return;
    const slot = slots.get(t) || { t, kind, ids: [] };
    if (kind === 'morning') slot.kind = 'morning';
    for (const id of ids) if (!slot.ids.includes(id)) slot.ids.push(id);
    slots.set(t, slot);
  };
  const day = new Date(from);
  day.setHours(0, 0, 0, 0);
  for (; day.getTime() <= to; day.setDate(day.getDate() + 1)) {
    const morning = new Date(day.getFullYear(), day.getMonth(), day.getDate(), mh, mm).getTime();
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.end, 0).getTime();
    const dayISO = isoOf(day);
    // El resumen de la mañana sale siempre (aunque no haya nada: así se mantiene la cadena de avisos)
    add(morning, 'morning', pending.map((t) => t.id));
    for (const task of pending) {
      const p = PRIO(effLevel(task, dayISO));
      if (p.every) {
        for (let t = morning + p.every * 60e3; t < end; t += p.every * 60e3) add(t, 'remind', [task.id]);
      } else if (p.daily) {
        const t = Math.min(morning + DAILY_AFTER_H * 3600e3, end - 3600e3);
        if (t > morning) add(t, 'remind', [task.id]);
      }
    }
  }
  return [...slots.values()].sort((a, b) => a.t - b.t).slice(0, MAX_SLOTS);
}

function dueText(due, todayISO) {
  if (!due) return '';
  const n = daysBetween(todayISO, due);
  if (n < -1) return `vencida hace ${-n} días`;
  if (n === -1) return 'vencida ayer';
  if (n === 0) return 'vence hoy';
  if (n === 1) return 'vence mañana';
  if (n < 7) return `vence en ${n} días`;
  return `vence el ${due.slice(8)}/${due.slice(5, 7)}`;
}

// Texto de la notificación de un momento de aviso (o el resumen si no hay ninguno)
function buildNotification(slot, state, now = Date.now()) {
  const today = isoOf(new Date(now));
  const pending = sortTasks(((state && state.tasks) || []).filter((t) => !t.done));
  const line = (t) => `${PRIO(t.prio).dot} ${t.title}${t.due ? ` · ${dueText(t.due, today)}` : ''}`;
  const list = (arr) => arr.slice(0, 5).map(line).join('\n') + (arr.length > 5 ? `\n…y ${arr.length - 5} más` : '');
  if (!slot || slot.kind === 'morning') {
    const morning = !!slot;
    if (!pending.length) {
      return { title: morning ? 'Buenos días ☀️' : 'TaskCTRL', body: 'Nada pendiente. Hoy vas sobrado, crack.', tag: 'taskctrl-summary', ids: [] };
    }
    const late = pending.filter((t) => t.due && t.due < today).length;
    return {
      title: `${morning ? 'Buenos días ☀️ · ' : ''}${pending.length === 1 ? '1 cosa pendiente' : `${pending.length} cosas pendientes`}${late ? ` (${late} vencida${late > 1 ? 's' : ''})` : ''}`,
      body: list(pending),
      tag: 'taskctrl-summary',
      ids: [],
    };
  }
  const tasks = sortTasks(slot.ids.map((id) => pending.find((t) => t.id === id)).filter(Boolean));
  if (!tasks.length) return null;
  const top = PRIO(effLevel(tasks[0], today));
  if (tasks.length === 1) {
    const t = tasks[0];
    return { title: `${top.dot} ${top.name}`, body: t.title + (t.due ? ` — ${dueText(t.due, today)}` : ''), tag: 'taskctrl-remind', ids: [t.id] };
  }
  return { title: `${top.dot} ${tasks.length} cosas que no puedes olvidar`, body: list(tasks), tag: 'taskctrl-remind', ids: tasks.map((t) => t.id) };
}

// ---------- IndexedDB: copia del estado para el service worker ----------

let tcDB;
function tcOpen() {
  tcDB = tcDB || new Promise((resolve, reject) => {
    const req = indexedDB.open('taskctrl', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return tcDB;
}
async function kvGet(key) {
  const db = await tcOpen();
  return new Promise((resolve, reject) => {
    const r = db.transaction('kv').objectStore('kv').get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function kvSet(key, value) {
  const db = await tcOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- Servidor de avisos (api/push.js) ----------

async function pushApi(body) {
  const res = await fetch('api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// Sube al servidor los momentos de aviso de los próximos días (solo horas, nunca el texto de las tareas)
async function syncSchedule(state) {
  const meta = (await kvGet('meta')) || {};
  if (!meta.device || !meta.subscribed) return false;
  const now = Date.now();
  const times = computeSlots(state, now, now + HORIZON_DAYS * 864e5).map((s) => s.t);
  await pushApi({ action: 'schedule', device: meta.device, times });
  return true;
}
