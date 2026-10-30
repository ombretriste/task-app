# TaskCTRL

*by OmT Finance*

Versión **0.9.2** (se muestra en la pantalla de inicio). Las correcciones y ajustes suben el último número (0.1.1); las novedades, el del medio (0.2.0).

App web instalable (PWA) para apuntar tareas pendientes con fecha límite y prioridad, ordenadas por prioridad, con un tic de «hecha» y avisos que se repiten más a menudo cuanto más urgente es la tarea.

## Funcionamiento

- Pantalla de inicio con el logo; al pulsar **Entrar** se pasa a la app. Siempre en vertical.
- **Resumen**: cuántas tareas quedan, cuántas están vencidas o son para hoy, y una barra con el reparto por prioridad.
- **Lista agrupada por prioridad** (y dentro, por fecha límite). Tocar el círculo, o deslizar la tarea a la izquierda, la marca como hecha (con «Deshacer»). Deslizando un poco queda a la vista el botón «Hecho»; deslizando más de media tarjeta se marca al soltar; tocar la tarea la abre para editarla. Las hechas quedan plegadas al final y se borran solas al mes.
- **Nueva tarea**: texto, prioridad, fecha límite (Hoy, Mañana, El finde, En una semana u otra fecha) y notas opcionales.
- **Repetir cada año** (en el editor, necesita fecha límite): al completarla no se cierra, pasa a la misma fecha del año siguiente (el 29 de febrero, al 28) y queda en la sección plegada «Programadas», sin avisar, hasta que faltan 7, 14, 30 (por defecto) o 60 días. Sirve para cumpleaños, renovaciones, impuestos…
- **Vincular con TripCTRL** (menú ⋯): con la nube activada en las dos apps con el mismo usuario y la contraseña de TripCTRL (no se guarda; se derivan aquí sus claves y se leen sus viajes cifrados con `peer-pull` en `api/sync`), TaskCTRL crea solas las tareas de cada reserva de los viajes que no han terminado:
  - Vuelo: hacer el check-in y sacar la tarjeta de embarque, la víspera (prioridad alta).
  - Tren o bus: tener a mano el billete, la víspera.
  - Coche de alquiler: recogerlo (con carnet y tarjeta) el día de la recogida y devolverlo el de la devolución.
  - Alojamiento: confirmar la reserva y la hora de llegada, dos días antes.
  - Actividad con reserva o precio: llevar las entradas, ese día.
  - Del viaje: hacer la maleta la víspera; revisar DNI/pasaporte y tarjeta sanitaria europea 7 días antes (Europa) o pasaporte, visados y vacunas 30 días antes (resto del mundo).
  
  Se actualizan al abrir la app: si cambia la reserva, cambia la tarea (y vuelve a pendiente si cambia la fecha); si se quita, desaparece. Se pueden editar o borrar como cualquier otra; las borradas no vuelven. TripCTRL no se modifica.
- **Tono del lenguaje** (menú ⋯): *De la calle* (el de siempre), *Estándar* (Urgente · Importante · Cuando puedas) o *Formal* (Prioridad alta · media · baja). Cambia los nombres de las prioridades, los mensajes y el texto de los avisos; es de cada dispositivo.
- **Prioridades** (tres, con colores neón; nombres del tono *De la calle*):
  - 🔴 Alta, *Pa' ayer, bro* — aviso cada hora.
  - 🟠 Media, *No olvides esto, bro* — cada 3 horas.
  - 🟢 Baja, *Tranqui, sin agobios* — un aviso al día (por la tarde).
  
  El día que vence una tarea, y si ya está vencida, sube un nivel. Hasta la v0.7 había cinco; al abrir la v0.8 las tareas se convierten solas («Que no se te pase» pasa a media y «Si eso, ya tal», a baja).
- **Avisos** (menú ⋯ → Avisos): a la hora del resumen (08:30 por defecto) llega uno con las tareas del día: las que vencen hoy, las vencidas y las que no tienen fecha. Durante el día, esas tareas avisan según su prioridad hasta la hora de corte (22:00 por defecto). Las tareas con fecha futura no avisan hasta su día: la víspera, media hora antes de la hora de corte (o un poco antes si coincide con otro aviso), llega uno con lo que vence mañana. En Android, la notificación de una sola tarea tiene el botón «✓ Hecho».
- **Sincronización en la nube** (menú ⋯): cuenta con usuario y contraseña (crearla pide la misma clave de registro que UnderCTRL y PayCTRL) para tener las tareas en varios dispositivos. Se cifran en el dispositivo (PBKDF2 + AES-256-GCM) antes de subirse a `api/sync`; el servidor solo guarda un bloque ilegible. Si se cambian cosas en dos dispositivos a la vez se fusionan tarea a tarea (gana el cambio más reciente de cada una y los borrados se respetan). Los avisos y su horario se configuran en cada dispositivo.
- **Invítame a un café**: al final de la pantalla, un botón discreto lleva a la página de donaciones (ko-fi.com/omtapps), igual que en Up to 40%. En el iPhone con la app instalada intenta abrirla en Safari, donde funciona el pago.
- Menú ⋯: Avisos, Sincronización en la nube, Vincular con TripCTRL, Tono del lenguaje, Opciones de visualización (oscuro/claro/automático y cuatro fondos: Fucsia, Noche, Menta y Glaciar), Exportar copia e Importar copia.

Las tareas se guardan en el propio dispositivo (`localStorage` `taskctrl:v1`, con una copia en IndexedDB `taskctrl` para el service worker) y, si se activa, en la nube cifradas (`tsk:acct:*` en Upstash).

## Cómo funcionan los avisos

Una web no puede programar notificaciones locales, así que con la app cerrada hace falta un servidor push:

1. La app calcula a qué horas toca avisar durante los próximos 7 días (`schedule.js`) y sube **solo esas horas** a `api/push` (nunca el texto de las tareas).
2. Un cron llama a `/api/push?run` cada 5 minutos; el servidor manda un push vacío a cada dispositivo al que le toca.
3. El service worker recibe el push, lee las tareas guardadas en el móvil, compone la notificación y vuelve a subir las horas de los próximos días (así la cadena sigue aunque no se abra la app).

Sin servidor, la app avisa solo mientras está abierta. En iPhone/iPad los avisos requieren iOS 16.4 o posterior y la app añadida a la pantalla de inicio.

### Puesta en marcha (una vez)

1. Importa el repositorio en [Vercel](https://vercel.com/new) con el preset **Other** (sin comando de compilación).
2. En el proyecto de Vercel → **Storage**, conecta la base de datos **Upstash Redis** (puede ser la misma de UnderCTRL y PayCTRL: aquí todas las claves empiezan por `tsk:`). Vuelve a desplegar.
3. Comprueba abriendo `https://<tu-app>.vercel.app/api/push`: debe decir `"configured": true`. Si dice `false`, la lista `vars` muestra qué variables de base de datos ve el servidor (solo nombres). Sirve cualquier par `…REST_API_URL` / `…REST_API_TOKEN`, tenga el prefijo que tenga. Tras conectar la base hay que volver a desplegar (Deployments → ⋯ → Redeploy).
4. Crea un cron gratuito en [cron-job.org](https://cron-job.org) que abra `https://<tu-app>.vercel.app/api/push?run` cada 5 minutos. (El cron de Vercel en el plan gratuito solo permite una vez al día.)

Las claves VAPID se generan solas la primera vez y se guardan en Redis (`tsk:vapid`).

## Analítica

Vercel Web Analytics (se activa en la pestaña Analytics del proyecto de Vercel, sin cookies). La app es una sola página, así que cada función se cuenta como una página virtual con `track()` en `app.js`. Solo se envía el nombre de la función, nunca datos de la app, y `beforeSend` (en `index.html`) quita de la dirección lo que va tras `?` o `#`.

## Desarrollo

Sitio estático sin dependencias ni paso de compilación:

```bash
python3 -m http.server 8000
```

Al cambiar archivos, sube `APP_VERSION` en `app.js`, la línea de versión de este README y la versión de `CACHE` en `sw.js`.
