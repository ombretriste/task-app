// Cambia la versión al modificar archivos para que los móviles descarguen la nueva versión
const CACHE = 'taskctrl-v15';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'schedule.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

importScripts('schedule.js');

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Red primero (para recibir actualizaciones); caché si no hay conexión. La API nunca se cachea.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.includes('/api/')) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ---------- Avisos ----------

// El push llega vacío: se busca el momento de aviso que acaba de cumplirse y se muestra su texto.
// Siempre se muestra algo (Safari retira el permiso si un push no enseña notificación).
async function handlePush() {
  const state = (await kvGet('state')) || { tasks: [], settings: {} };
  const meta = (await kvGet('meta')) || {};
  const now = Date.now();
  const slots = computeSlots(state, now - 25 * 60e3, now + 5 * 60e3).filter((s) => s.t > (meta.lastSlot || 0));
  const slot = slots[slots.length - 1];
  const n = (slot && buildNotification(slot, state, now)) || buildNotification(null, state, now);
  if (slot) await kvSet('meta', { ...meta, lastSlot: slot.t });
  await self.registration.showNotification(n.title, {
    body: n.body,
    tag: n.tag,
    renotify: true,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    data: { ids: n.ids },
    actions: n.ids.length === 1 ? [{ action: 'done', title: '✓ Hecho' }] : [],
  });
  // Se vuelven a subir las horas de los próximos días: la cadena de avisos sigue aunque no se abra la app
  try { await syncSchedule(state); } catch (_) { /* sin conexión: se reintentará */ }
}
self.addEventListener('push', (event) => event.waitUntil(handlePush()));

async function markDone(id) {
  const state = await kvGet('state');
  const task = state && state.tasks.find((t) => t.id === id);
  if (!task || task.done) return;
  completeTask(task); // si es anual pasa al año siguiente; marca `upd` para la fusión con la nube
  state.upd = Date.now();
  await kvSet('state', state);
  try { await syncSchedule(state); } catch (_) { /* sin conexión */ }
  const wins = await self.clients.matchAll({ type: 'window' });
  wins.forEach((w) => w.postMessage({ type: 'state-changed' }));
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const ids = (event.notification.data && event.notification.data.ids) || [];
  if (event.action === 'done' && ids[0]) {
    event.waitUntil(markDone(ids[0]));
    return;
  }
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) return wins[0].focus();
    return self.clients.openWindow('./');
  })());
});
