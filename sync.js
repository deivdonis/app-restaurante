/*
 * sync.js - Puente entre los dispositivos
 *
 * Sin claves de Firebase, la app guarda las peticiones en el navegador
 * (localStorage): cliente y camarero solo se ven si comparten dispositivo.
 *
 * Con las claves puestas, este módulo comparte esas mismas peticiones por
 * Firestore, sin tocar el resto de la app: la pantalla del camarero sigue
 * leyendo de localStorage, y aquí lo mantenemos al día con lo que llega de
 * la nube. Es también lo que dispara el aviso push, porque la Cloud Function
 * escucha la colección 'peticiones'.
 */

const Sync = {
    COLECCION: 'peticiones',
    LIMITE: 200,
    escuchando: false,

    get activo() {
        return typeof firebaseConfigurado === 'function' && firebaseConfigurado();
    },

    /**
     * Registra una petición del cliente. Siempre la guarda en local y, si hay
     * Firebase, la publica para el resto de dispositivos.
     */
    async enviarPeticion(mesa, texto) {
        this.guardarEnLocal(mesa, texto, Date.now());

        if (!this.activo) return false;

        try {
            const fb = await cargarFirebaseSDK(['firestore']);
            await fb.firestore().collection(this.COLECCION).add({
                mesa: String(mesa),
                texto,
                timestamp: Date.now(),
                leido: false,
                creado: fb.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (e) {
            console.warn('La petición se guardó en local, pero no se pudo enviar:', e);
            return false;
        }
    },

    /** Guarda en el almacén que ya usa toda la app. */
    guardarEnLocal(mesa, texto, timestamp) {
        const mensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
        if (!mensajes[mesa]) mensajes[mesa] = [];

        // No duplicar si ya llegó por Firestore
        const repetido = mensajes[mesa].some(m => m.timestamp === timestamp && m.texto === texto);
        if (!repetido) {
            mensajes[mesa].push({ texto, timestamp, leido: false });
            localStorage.setItem('mensajes_clientes', JSON.stringify(mensajes));
        }
    },

    /**
     * Escucha las peticiones de la nube y las vuelca en localStorage, que es
     * de donde pintan el panel y el mapa. Conserva el estado de leído local.
     */
    async escuchar() {
        if (!this.activo || this.escuchando) return false;

        try {
            const fb = await cargarFirebaseSDK(['firestore']);
            this.escuchando = true;

            fb.firestore()
                .collection(this.COLECCION)
                .orderBy('timestamp', 'desc')
                .limit(this.LIMITE)
                .onSnapshot(snapshot => {
                    const locales = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
                    const leidos = new Set();

                    // Recordar qué estaba leído antes de reconstruir
                    Object.keys(locales).forEach(mesa => {
                        locales[mesa].forEach(m => {
                            if (m.leido) leidos.add(mesa + '|' + m.timestamp);
                        });
                    });

                    const mensajes = {};
                    snapshot.forEach(doc => {
                        const d = doc.data();
                        const mesa = String(d.mesa);
                        if (!mensajes[mesa]) mensajes[mesa] = [];
                        mensajes[mesa].push({
                            texto: d.texto,
                            timestamp: d.timestamp,
                            leido: d.leido === true || leidos.has(mesa + '|' + d.timestamp),
                            mesaOriginal: d.mesaOriginal
                        });
                    });

                    Object.keys(mensajes).forEach(mesa => {
                        mensajes[mesa].sort((a, b) => a.timestamp - b.timestamp);
                    });

                    localStorage.setItem('mensajes_clientes', JSON.stringify(mensajes));

                    // El panel refresca cada 5s; esto le avisa antes
                    window.dispatchEvent(new CustomEvent('peticiones-actualizadas'));
                }, error => {
                    console.warn('Se perdió la conexión con Firestore:', error);
                    this.escuchando = false;
                });

            return true;
        } catch (e) {
            console.warn('Sin sincronización en la nube, se usa solo este dispositivo:', e);
            return false;
        }
    }
};

window.Sync = Sync;
