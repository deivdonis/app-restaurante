/*
 * firebase-messaging-sw.js - Avisos push con la app cerrada
 *
 * Firebase Cloud Messaging exige que este archivo esté en la raíz del sitio y
 * se llame exactamente así. Toma las claves de firebase-config.js, así que no
 * hay que rellenar nada aquí.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('firebase-config.js');

if (typeof firebaseConfigurado === 'function' && firebaseConfigurado()) {
    firebase.initializeApp(FIREBASE_CONFIG);

    const messaging = firebase.messaging();

    // Aviso recibido con la app cerrada o en segundo plano
    messaging.onBackgroundMessage((payload) => {
        const aviso = payload.notification || {};
        const mesa = (payload.data && payload.data.mesa) || null;

        self.registration.showNotification(
            aviso.title || (mesa ? `🔔 Mesa ${mesa}` : '🔔 Nueva petición'),
            {
                body: aviso.body || 'Un cliente necesita atención',
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: mesa ? `mesa-${mesa}` : 'sala',
                renotify: true,
                vibrate: [200, 100, 200],
                data: { mesa, url: mesa ? `dashboard-camarero.html?mesa=${mesa}` : 'dashboard-camarero.html' }
            }
        );
    });
}

// Tocar el aviso abre el panel en la mesa correcta
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
