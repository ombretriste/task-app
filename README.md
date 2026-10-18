# TaskCTRL

*by OmT Finance*

Versión **0.2.0** (se muestra en la pantalla de inicio). Las correcciones y ajustes suben el último número (0.1.1); las novedades, el del medio (0.2.0).

App web instalable (PWA) para apuntar tareas pendientes con fecha límite y prioridad, ordenadas por prioridad, con un tic de «hecha» y avisos que se repiten más a menudo cuanto más urgente es la tarea.

## Funcionamiento

- Pantalla de inicio con el logo; al pulsar **Entrar** se pasa a la app. Siempre en vertical.
- **Resumen**: cuántas tareas quedan, cuántas están vencidas o son para hoy, y una barra con el reparto por prioridad.
- **Lista agrupada por prioridad** (y dentro, por fecha límite). Tocar el círculo, o deslizar la tarea a la izquierda, la marca como hecha (con «Deshacer»). Deslizando un poco queda a la vista el botón «Hecho»; deslizando más de media tarjeta se marca al soltar; tocar la tarea la abre para editarla. Las hechas quedan plegadas al final y se borran solas al mes.
- **Nueva tarea**: texto, prioridad, fecha límite (Hoy, Mañana, El finde, En una semana u otra fecha) y notas opcionales.
- **Prioridades** (colores neón):
  - 🔴 *Pa' ayer, bro* — aviso cada hora.
  - 🟠 *No olvides esto, bro* — cada 3 horas.
  - 🟡 *Que no se te pase* — cada 6 horas.
  - 🟢 *Tranqui, sin agobios* — un aviso al día (por la tarde).
  - 🔵 *Si eso, ya tal* — solo en el resumen de la mañana.
  
  El día que vence una tarea, y si ya está vencida, sube un nivel.
- **Avisos** (menú ⋯ → Avisos): resumen cada mañana a la hora elegida (08:30 por defecto) y recordatorios durante el día hasta la hora de corte (22:00 por defecto). En Android, la notificación de una sola tarea tiene el botón «✓ Hecho».
- Menú ⋯: Avisos, Opciones de visualización (oscuro/claro/automático y cuatro fondos: Fucsia, Noche, Menta y Glaciar), Exportar copia e Importar copia.

Las tareas se guardan solo en el propio dispositivo (`localStorage` `taskctrl:v1`, con una copia en IndexedDB `taskctrl` para el service worker).

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

## Desarrollo

Sitio estático sin dependencias ni paso de compilación:

```bash
python3 -m http.server 8000
```

Al cambiar archivos, sube `APP_VERSION` en `app.js`, la línea de versión de este README y la versión de `CACHE` en `sw.js`.
