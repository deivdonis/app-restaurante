/*
 * firebase-config.js - Claves del proyecto de Firebase
 *
 * Mientras estos campos estén vacíos, la app funciona igual: los avisos se
 * muestran en el propio dispositivo (el navegador del camarero se avisa a sí
 * mismo). Al rellenarlos se activan los avisos push de verdad, que llegan al
 * móvil del camarero aunque tenga la app cerrada.
 *
 * Dónde sacar cada valor:
 *   - Los seis primeros: consola de Firebase → ⚙️ Configuración del proyecto →
 *     Tus apps → App web → Configuración del SDK.
 *   - vapidKey: misma pantalla → pestaña "Cloud Messaging" → Web Push
 *     certificates → Par de claves (la clave PÚBLICA).
 *
 * Este archivo se descarga en el navegador: estas claves son públicas por
 * diseño y no dan acceso por sí solas. La clave privada del servidor NO va
 * aquí nunca, va en las Cloud Functions.
 */

const FIREBASE_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
};

// Clave pública de Web Push (VAPID)
const FIREBASE_VAPID_KEY = '';

// ¿Están rellenos los campos imprescindibles?
function firebaseConfigurado() {
    return Boolean(
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.messagingSenderId &&
        FIREBASE_CONFIG.appId &&
        FIREBASE_VAPID_KEY
    );
}

const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

/**
 * Carga el SDK de Firebase desde su CDN y arranca la app. Solo se descarga
 * si hay claves, así que sin configurar no pesa nada.
 * @param {string[]} modulos p.ej. ['firestore', 'messaging']
 */
function cargarFirebaseSDK(modulos = ['firestore']) {
    if (!firebaseConfigurado()) return Promise.reject(new Error('Firebase sin configurar'));

    const necesarios = ['app'].concat(modulos)
        .map(m => `${FIREBASE_SDK}/firebase-${m}-compat.js`);

    const cadena = necesarios.reduce(
        (previo, src) => previo.then(() => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const el = document.createElement('script');
            el.src = src;
            el.onload = resolve;
            el.onerror = () => reject(new Error('No se pudo cargar ' + src));
            document.head.appendChild(el);
        })),
        Promise.resolve()
    );

    return cadena.then(() => {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        return firebase;
    });
}

// Disponible tanto en las páginas como dentro del service worker
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
    window.FIREBASE_VAPID_KEY = FIREBASE_VAPID_KEY;
    window.firebaseConfigurado = firebaseConfigurado;
    window.cargarFirebaseSDK = cargarFirebaseSDK;
}
