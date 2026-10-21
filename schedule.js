// Código compartido por la app (app.js) y el service worker (sw.js): prioridades, cuándo toca
// avisar de cada tarea, el texto de las notificaciones y el estado guardado en IndexedDB.
// Sin DOM: el service worker lo carga con importScripts.
'use strict';

// Escala de prioridad, de la más alta (4) a la más baja (0). Los nombres dependen del tono (TONES).
// `every`: minutos entre avisos dentro del horario; `daily`: un aviso al día por la tarde.
const PRIOS = [
  { lvl: 4, freq: 'Aviso cada hora', dot: '🔴', every: 60 },
  { lvl: 3, freq: 'Aviso cada 3 horas', dot: '🟠', every: 180 },
  { lvl: 2, freq: 'Aviso cada 6 horas', dot: '🟡', every: 360 },
  { lvl: 1, freq: 'Un aviso al día', dot: '🟢', daily: true },
  { lvl: 0, freq: 'Solo en el resumen de la mañana', dot: '🔵' },
];
const PRIO = (lvl) => PRIOS[4 - lvl];

// Tono del lenguaje (menú ⋯ → Tono del lenguaje). `prios`: [nombre, explicación] de la 4 a la 0.
const TONES = {
  calle: {
    label: 'De la calle',
    sample: "«Pa' ayer, bro»",
    prios: [["Pa' ayer, bro", 'Urgente de verdad'], ['No olvides esto, bro', 'Importante'], ['Que no se te pase', 'Tenlo en el radar'], ['Tranqui, sin agobios', 'Cuando puedas'], ['Si eso, ya tal', 'Algún día']],
    things: (n) => (n === 1 ? 'cosa pendiente' : 'cosas pendientes'),
    doneMsgs: ['¡Hecho, máquina!', 'Uno menos, crack', 'Fuera de la lista 💪', 'Eso es, bro', 'Tachada. Así se hace'],
    added: 'Apuntada',
    addedTop: 'Apuntada. Esta no se te escapa 🔥',
    allDone: 'Todo hecho, máquina.<br>Nada pendiente.',
    noTasks: 'Aún no hay tareas.<br>Empieza cuando quieras.',
    emptyTitle: 'Nada por aquí, bro',
    emptyText: 'Apunta lo que tengas pendiente, ponle prioridad y fecha, y yo me encargo de recordártelo.',
    cta: 'Activa los avisos para que no se te pase nada',
    placeholder: '¿Qué tienes que hacer?',
    noPerm: 'Sin permiso no puedo avisarte, bro.',
    morning: 'Buenos días ☀️',
    nothing: 'Nada para hoy. Vas sobrado, crack.',
    tomorrow: 'Ojo, mañana toca',
    many: (n) => `${n} cosas que no puedes olvidar`,
    back: (when) => `¡Hecho! Vuelve el ${when}`,
  },
  estandar: {
    label: 'Estándar',
    sample: '«Urgente»',
    prios: [['Urgente', 'Hay que hacerlo ya'], ['Importante', 'No lo dejes pasar'], ['Normal', 'Tenlo presente'], ['Cuando puedas', 'Sin prisa'], ['Algún día', 'Sin plazo concreto']],
    things: (n) => (n === 1 ? 'tarea pendiente' : 'tareas pendientes'),
    doneMsgs: ['Tarea completada', '¡Bien hecho!', 'Hecho'],
    added: 'Tarea añadida',
    addedTop: 'Tarea añadida',
    allDone: 'Todo hecho.<br>Nada pendiente.',
    noTasks: 'Aún no hay tareas.<br>Empieza cuando quieras.',
    emptyTitle: 'No hay tareas',
    emptyText: 'Añade lo que tengas pendiente con su prioridad y fecha límite, y te lo recordaré.',
    cta: 'Activa los avisos para recibir recordatorios',
    placeholder: '¿Qué tienes que hacer?',
    noPerm: 'Sin permiso no puedo enviarte avisos.',
    morning: 'Buenos días',
    nothing: 'No tienes tareas para hoy.',
    tomorrow: 'Para mañana',
    many: (n) => `${n} tareas pendientes`,
    back: (when) => `Tarea completada. Vuelve el ${when}`,
  },
  formal: {
    label: 'Formal',
    sample: '«Prioridad máxima»',
    prios: [['Prioridad máxima', 'Requiere atención inmediata'], ['Prioridad alta', 'Requiere atención próxima'], ['Prioridad media', 'Atención ordinaria'], ['Prioridad baja', 'Puede posponerse'], ['Sin urgencia', 'Sin plazo definido']],
    things: (n) => (n === 1 ? 'tarea pendiente' : 'tareas pendientes'),
    doneMsgs: ['Tarea completada correctamente'],
    added: 'Tarea registrada',
    addedTop: 'Tarea registrada',
    allDone: 'No tiene tareas pendientes.',
    noTasks: 'Aún no ha registrado ninguna tarea.',
    emptyTitle: 'No hay tareas registradas',
    emptyText: 'Añada sus tareas pendientes indicando la prioridad y la fecha límite; se le recordarán oportunamente.',
    cta: 'Active los avisos para recibir recordatorios',
    placeholder: 'Descripción de la tarea',
    noPerm: 'Sin permiso no es posible enviarle avisos.',
    morning: 'Buenos días',
    nothing: 'No tiene tareas para hoy.',
    tomorrow: 'Tareas para mañana',
    many: (n) => `${n} tareas requieren su atención`,
    back: (when) => `Tarea completada. Próxima fecha: ${when}`,
  },
};
const toneOf = (state) => TONES[state && state.settings && state.settings.tone] || TONES.calle;
const prioName = (lvl, tone) => tone.prios[4 - lvl][0];
const prioHint = (lvl, tone) => tone.prios[4 - lvl][1];

const DEFAULT_SETTINGS = { on: false, morning: '08:30', end: 22, tone: 'calle' };
const HORIZON_DAYS = 7;   // se programan los avisos de los próximos 7 días
const MAX_SLOTS = 400;
const DAILY_AFTER_H = 9;  // el aviso diario de «Tranqui» llega 9 h después del resumen
const EVENING_BEFORE_MIN = 30; // el aviso de lo de mañana llega 30 min antes de la hora de corte
const LEAD_OPTIONS = [7, 14, 30, 60]; // días de antelación con los que reaparece una tarea anual
const DEFAULT_LEAD = 30;

const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function daysBetween(fromISO, toISO) {
  const [a, b, c] = fromISO.split('-').map(Number);
  const [x, y, z] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(x, y - 1, z) - Date.UTC(a, b - 1, c)) / 864e5);
}
// La misma fecha un año después (el 29 de febrero pasa al 28)
function nextYearISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const last = new Date(Date.UTC(y + 1, m, 0)).getUTCDate();
  return `${y + 1}-${String(m).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

// Una tarea anual «duerme» hasta que faltan `lead` días para su fecha: no sale en pendientes ni avisa
const isDormant = (task, dayISO) => !!(task.repeat && task.due && daysBetween(dayISO, task.due) > (task.lead || DEFAULT_LEAD));
const activeTasks = (state, dayISO) => ((state && state.tasks) || []).filter((t) => !t.done && !isDormant(t, dayISO));
// Tareas que tocan ese día: las que vencen ese día, las vencidas y las que no tienen fecha.
// Las de fecha futura no avisan hasta su día (solo un aviso la víspera por la noche).
const todayTasks = (state, dayISO) => activeTasks(state, dayISO).filter((t) => !t.due || t.due <= dayISO);
const addDaysToISO = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoOf(d); };

// Marca una tarea como hecha. Si se repite cada año no se cierra: pasa a su fecha del año siguiente
// (la primera que quede en el futuro) y se queda dormida hasta que se acerque.
function completeTask(task, now = Date.now()) {
  task.upd = now;
  if (task.repeat && task.due) {
    const today = isoOf(new Date(now));
    let next = nextYearISO(task.due);
    while (next <= today) next = nextYearISO(next);
    task.due = next;
    return 'rolled';
  }
  task.done = true;
  task.doneAt = now;
  return 'done';
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

// Momentos de aviso entre `from` y `to` (ms): [{ t, kind: 'morning'|'remind'|'evening', ids: [...] }]
// · morning: resumen con las tareas del día, a la hora elegida.
// · remind: durante el día, cada tarea del día según su prioridad.
// · evening: antes de la hora de corte, lo que vence mañana.
function computeSlots(state, from, to) {
  const s = { ...DEFAULT_SETTINGS, ...(state && state.settings) };
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
    const pending = todayTasks(state, dayISO);
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
    // La víspera por la noche: lo que vence mañana. Si cae cerca de otro aviso, se adelanta hasta
    // tener 10 minutos libres alrededor (para no recibir dos notificaciones seguidas).
    const tomorrowISO = addDaysToISO(dayISO, 1);
    const tomorrow = activeTasks(state, dayISO).filter((t) => t.due === tomorrowISO);
    if (tomorrow.length) {
      let t = end - EVENING_BEFORE_MIN * 60e3;
      while ([...slots.keys()].some((k) => Math.abs(k - t) < 10 * 60e3)) t -= 5 * 60e3;
      if (t > morning) add(t, 'evening', tomorrow.map((x) => x.id));
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
  const tone = toneOf(state);
  const pending = sortTasks(todayTasks(state, today));
  const line = (t) => `${PRIO(t.prio).dot} ${t.title}${t.due ? ` · ${dueText(t.due, today)}` : ''}`;
  const list = (arr) => arr.slice(0, 5).map(line).join('\n') + (arr.length > 5 ? `\n…y ${arr.length - 5} más` : '');
  if (!slot || slot.kind === 'morning') {
    const morning = !!slot;
    if (!pending.length) {
      return { title: morning ? tone.morning : 'TaskCTRL', body: tone.nothing, tag: 'taskctrl-summary', ids: [] };
    }
    const late = pending.filter((t) => t.due && t.due < today).length;
    return {
      title: `${morning ? `${tone.morning} · ` : ''}${pending.length} ${tone.things(pending.length)} hoy${late ? ` (${late} vencida${late > 1 ? 's' : ''})` : ''}`,
      body: list(pending),
      tag: 'taskctrl-summary',
      ids: [],
    };
  }
  if (slot.kind === 'evening') {
    const tomorrowISO = addDaysToISO(today, 1);
    const next = sortTasks(activeTasks(state, today).filter((t) => slot.ids.includes(t.id) && t.due === tomorrowISO));
    if (!next.length) return null;
    return {
      title: `🌙 ${tone.tomorrow} · ${next.length} ${tone.things(next.length).replace(/ pendientes?$/, '')}`,
      body: next.slice(0, 5).map((t) => `${PRIO(t.prio).dot} ${t.title}`).join('\n') + (next.length > 5 ? `\n…y ${next.length - 5} más` : ''),
      tag: 'taskctrl-evening',
      ids: next.length === 1 ? [next[0].id] : [],
    };
  }
  const tasks = sortTasks(slot.ids.map((id) => pending.find((t) => t.id === id)).filter(Boolean));
  if (!tasks.length) return null;
  const top = effLevel(tasks[0], today);
  if (tasks.length === 1) {
    const t = tasks[0];
    return { title: `${PRIO(top).dot} ${prioName(top, tone)}`, body: t.title + (t.due ? ` — ${dueText(t.due, today)}` : ''), tag: 'taskctrl-remind', ids: [t.id] };
  }
  return { title: `${PRIO(top).dot} ${tone.many(tasks.length)}`, body: list(tasks), tag: 'taskctrl-remind', ids: tasks.map((t) => t.id) };
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
