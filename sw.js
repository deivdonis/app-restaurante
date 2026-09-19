/*
 * sw.js - Service worker de la app de camareros
 *
 * Hace tres cosas:
 *   1. Guarda la app en caché para que abra sin conexión.
 *   2. Recibe los avisos push que manda el servidor (evento 'push').
 *   3. Abre el panel en la mesa correcta al tocar el aviso.
 */

const CACHE = 'sala-camareros-v1';

const ARCHIVOS = [
    './',
    'dashboard-camarero.html',
    'mapa.html',
    'login-camareros.html',
    'styles-dashboard-camarero.css',
    'styles-mapa.css',
    'styles-login.css',
    'script-dashboard-camarero.js',
    'script-mapa.js',
    'script-login.js',
    'auth.js',
    'notificaciones.js',
    'firebase-config.js',
    'manifest.json',
    'icon-192.png',
    'icon-512.png'
];

// Instalación: precargar la app
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            // Si algún archivo falla, la instalación sigue adelante
            .then(cache => Promise.allSettled(ARCHIVOS.map(a => cache.add(a))))
            .then(() => self.skipWaiting())
    );
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(claves => Promise.all(
                claves.filter(c => c !== CACHE).map(c => caches.delete(c))
            ))
            .then(() => self.clients.claim())
    );
});

// Red primero y caché de respaldo: el panel necesita datos frescos
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(respuesta => {
                const copia = respuesta.clone();
                caches.open(CACHE).then(cache => cache.put(event.request, copia)).catch(() => {});
                return respuesta;
            })
            .catch(() => caches.match(event.request).then(r => r || caches.match('dashboard-camarero.html')))
    );
});

// Aviso push enviado por el servidor
self.addEventListener('push', (event) => {
    let datos = {};

    try {
        datos = event.data ? event.data.json() : {};
    } catch {
        datos = { body: event.data ? event.data.text() : '' };
    }

    // Formato propio y formato de Firebase (notification: {...})
    const aviso = datos.notification || datos;
    const mesa = (datos.data && datos.data.mesa) || datos.mesa || null;

    const titulo = aviso.title || (mesa ? `🔔 Mesa ${mesa}` : '🔔 Nueva petición');
    const opciones = {
        body: aviso.body || 'Un cliente necesita atención',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: mesa ? `mesa-${mesa}` : 'sala',
        renotify: true,
        vibrate: [200, 100, 200],
        data: { mesa, url: mesa ? `dashboard-camarero.html?mesa=${mesa}` : 'dashboard-camarero.html' },
        actions: [{ action: 'abrir', title: 'Ver mesa' }]
    };

    event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// Al tocar el aviso: traer al frente la pestaña abierta, o abrir una nueva
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const destino = (event.notification.data && event.notification.data.url) || 'dashboard-camarero.html';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientes => {
            for (const cliente of clientes) {
                if (cliente.url.includes('dashboard-camarero') && 'focus' in cliente) {
                    if (event.notification.data && event.notification.data.mesa) {
                        cliente.postMessage({ tipo: 'abrir-mesa', mesa: event.notification.data.mesa });
                    }
                    return cliente.focus();
                }
            }
            return self.clients.openWindow(destino);
        })
    );
});
