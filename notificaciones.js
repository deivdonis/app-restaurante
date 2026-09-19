/*
 * notificaciones.js - Avisos para la app de camareros
 *
 * Funciona en dos niveles, y elige solo el que esté disponible:
 *
 *   1. LOCAL (siempre): el service worker avisa al propio dispositivo cuando
 *      entra una petición nueva en una mesa del camarero. Funciona con la app
 *      abierta o minimizada, sin servidor ni claves.
 *
 *   2. PUSH (cuando firebase-config.js tenga las claves): el móvil se registra
 *      en Firebase Cloud Messaging y recibe el aviso aunque la app esté
 *      cerrada, lo mande quien lo mande.
 *
 * Requisitos del navegador: https (o localhost) y permiso del usuario.
 */

const Notificaciones = {
    swRegistro: null,
    tokenPush: null,
    mesasVigiladas: () => [],

    /** ¿El navegador puede dar avisos? */
    get soportado() {
        return 'serviceWorker' in navigator && 'Notification' in window && window.isSecureContext;
    },

    /** 'default' (sin decidir) | 'granted' | 'denied' | 'no-soportado' */
    get permiso() {
        if (!this.soportado) return 'no-soportado';
        return Notification.permission;
    },

    get activas() {
        return this.permiso === 'granted';
    },

    /**
     * Registra el service worker y, si ya había permiso, reengancha el push.
     * @param {() => string[]} mesasVigiladas función que devuelve las mesas a vigilar
     */
    async init(mesasVigiladas) {
        if (typeof mesasVigiladas === 'function') {
            this.mesasVigiladas = mesasVigiladas;
        }

        if (!this.soportado) return false;

        try {
            this.swRegistro = await navigator.serviceWorker.register('sw.js');
        } catch (e) {
            console.warn('No se pudo registrar el service worker:', e);
            return false;
        }

        // El service worker avisa cuando se toca una notificación
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.tipo === 'abrir-mesa' && typeof window.abrirFicha === 'function') {
                window.abrirFicha(Number(event.data.mesa));
            }
        });

        if (this.activas) {
            await this.conectarPush();
        }

        return true;
    },

    /** Pide permiso al usuario. Devuelve el estado final. */
    async pedirPermiso() {
        if (!this.soportado) return 'no-soportado';

        const resultado = await Notification.requestPermission();

        if (resultado === 'granted') {
            if (!this.swRegistro) await this.init();
            await this.conectarPush();
            this.avisar('🔔 Avisos activados', {
                body: firebaseConfigurado()
                    ? 'Recibirás las peticiones aunque cierres la app.'
                    : 'Te avisaremos de las peticiones de tus mesas.',
                tag: 'bienvenida'
            });
            // Desde ahora solo avisamos de lo que llegue nuevo
            this.marcarTodoVisto();
        }

        return resultado;
    },

    /** Muestra un aviso en este dispositivo. */
    async avisar(titulo, opciones = {}) {
        if (!this.activas) return;

        const config = {
            icon: 'icon-192.png',
            badge: 'icon-192.png',
            vibrate: [200, 100, 200],
            renotify: true,
            tag: 'sala',
            ...opciones
        };

        try {
            if (this.swRegistro) {
                await this.swRegistro.showNotification(titulo, config);
            } else {
                new Notification(titulo, config);
            }
        } catch (e) {
            console.warn('No se pudo mostrar el aviso:', e);
        }
    },

    // --- Nivel 2: push real con Firebase ---

    /** Registra este dispositivo en Firebase Cloud Messaging. */
    async conectarPush() {
        if (!firebaseConfigurado() || !this.activas) return null;

        try {
            await cargarFirebaseSDK(['messaging', 'firestore']);

            const messaging = firebase.messaging();

            this.tokenPush = await messaging.getToken({
                vapidKey: FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.register('firebase-messaging-sw.js')
            });

            if (this.tokenPush) {
                await this.guardarToken(this.tokenPush);
            }

            // Aviso recibido con la app en primer plano
            messaging.onMessage((payload) => {
                const aviso = payload.notification || {};
                const mesa = (payload.data && payload.data.mesa) || null;
                this.avisar(aviso.title || `🔔 Mesa ${mesa || ''}`.trim(), {
                    body: aviso.body || 'Nueva petición',
                    tag: mesa ? `mesa-${mesa}` : 'sala',
                    data: { mesa }
                });
            });

            return this.tokenPush;
        } catch (e) {
            console.warn('Push no disponible, se usan avisos locales:', e);
            return null;
        }
    },

    /**
     * Guarda el token del dispositivo para que el servidor sepa a quién enviar.
     * Colección 'tokens_camareros', un documento por camarero.
     */
    async guardarToken(token) {
        const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
        if (!user) return;

        localStorage.setItem('push_token', token);

        try {
            const db = firebase.firestore();
            await db.collection('tokens_camareros').doc(user.username).set({
                token,
                nombre: user.name,
                rol: user.role,
                actualizado: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.warn('No se pudo guardar el token en Firestore:', e);
        }
    },

    // --- Vigilancia de peticiones nuevas (nivel local) ---

    /** A partir de ahora, lo que ya existe no genera aviso. */
    marcarTodoVisto() {
        const mensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
        let ultimo = 0;

        Object.values(mensajes).forEach(lista => {
            lista.forEach(m => { if (m.timestamp > ultimo) ultimo = m.timestamp; });
        });

        localStorage.setItem('notif_ultimo_ts', String(ultimo));
    },

    /**
     * Busca peticiones nuevas en las mesas vigiladas y avisa.
     * Se puede llamar tan a menudo como se quiera: solo avisa de lo nuevo.
     */
    revisar() {
        if (!this.activas) return;

        const desde = Number(localStorage.getItem('notif_ultimo_ts') || 0);
        const mensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
        const mias = this.mesasVigiladas();
        const vigilarTodas = !mias || mias.length === 0;

        const nuevas = [];
        let ultimo = desde;

        Object.keys(mensajes).forEach(mesa => {
            if (!vigilarTodas && !mias.includes(String(mesa))) return;

            mensajes[mesa].forEach(m => {
                if (m.timestamp > desde) {
                    nuevas.push({ mesa, ...m });
                    if (m.timestamp > ultimo) ultimo = m.timestamp;
                }
            });
        });

        if (!nuevas.length) return;

        localStorage.setItem('notif_ultimo_ts', String(ultimo));
        nuevas.sort((a, b) => a.timestamp - b.timestamp);

        if (nuevas.length === 1) {
            const n = nuevas[0];
            this.avisar(`🔔 Mesa ${n.mesa}`, {
                body: n.texto,
                tag: `mesa-${n.mesa}`,
                data: { mesa: n.mesa, url: `dashboard-camarero.html?mesa=${n.mesa}` }
            });
        } else {
            const mesasAfectadas = [...new Set(nuevas.map(n => n.mesa))];
            this.avisar(`🔔 ${nuevas.length} peticiones nuevas`, {
                body: `Mesas ${mesasAfectadas.join(', ')}`,
                tag: 'varias'
            });
        }
    },

    /** Vigila en segundo plano: cambios de otra pestaña + repaso periódico. */
    vigilar(intervaloMs = 5000) {
        window.addEventListener('storage', (e) => {
            if (e.key === 'mensajes_clientes') this.revisar();
        });

        setInterval(() => this.revisar(), intervaloMs);
    }
};

window.Notificaciones = Notificaciones;
