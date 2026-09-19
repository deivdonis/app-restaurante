/*
 * Cloud Function: avisa a los camareros cuando entra una petición.
 *
 * El navegador no puede mandarse notificaciones push a otro dispositivo por su
 * cuenta: hace falta algo en el servidor que las envíe. Esto es ese algo.
 *
 * Cada vez que la app del cliente crea un documento en la colección
 * 'peticiones', esta función busca los tokens guardados en 'tokens_camareros'
 * y les manda el aviso.
 *
 * Desplegar:
 *   npm install -g firebase-tools
 *   firebase login
 *   firebase init functions      (elegir el proyecto, JavaScript)
 *   firebase deploy --only functions
 *
 * No hay que rellenar claves aquí: en el servidor, el SDK de administrador se
 * autentica solo con las credenciales del proyecto.
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

exports.avisarPeticion = onDocumentCreated(
    { document: 'peticiones/{peticionId}', region: 'europe-west1' },
    async (event) => {
        const peticion = event.data && event.data.data();
        if (!peticion) return;

        const mesa = String(peticion.mesa || '?');
        const texto = peticion.texto || 'Un cliente necesita atención';

        const db = getFirestore();

        // ¿Esta mesa tiene camarero asignado? Se avisa solo a él.
        let destinatarios = [];
        const asignacion = await db.collection('mesas').doc(mesa).get();
        const camareroMesa = asignacion.exists ? asignacion.data().camarero : null;

        const tokensSnap = await db.collection('tokens_camareros').get();
        tokensSnap.forEach(doc => {
            const d = doc.data();
            if (!d.token) return;
            if (!camareroMesa || doc.id === camareroMesa) {
                destinatarios.push(d.token);
            }
        });

        if (destinatarios.length === 0) {
            console.log(`Mesa ${mesa}: no hay dispositivos registrados`);
            return;
        }

        const mensaje = {
            notification: {
                title: `🔔 Mesa ${mesa}`,
                body: texto
            },
            data: {
                mesa,
                url: `dashboard-camarero.html?mesa=${mesa}`
            },
            webpush: {
                notification: {
                    icon: 'icon-192.png',
                    badge: 'icon-192.png',
                    tag: `mesa-${mesa}`,
                    renotify: true,
                    vibrate: [200, 100, 200]
                },
                fcmOptions: {
                    link: `dashboard-camarero.html?mesa=${mesa}`
                }
            },
            tokens: destinatarios
        };

        const respuesta = await getMessaging().sendEachForMulticast(mensaje);
        console.log(`Mesa ${mesa}: ${respuesta.successCount} avisos enviados, ${respuesta.failureCount} fallidos`);

        // Limpiar tokens caducados (móviles que ya no existen)
        const caducados = [];
        respuesta.responses.forEach((r, i) => {
            if (!r.success) {
                const codigo = r.error && r.error.code;
                if (codigo === 'messaging/registration-token-not-registered') {
                    caducados.push(destinatarios[i]);
                }
            }
        });

        if (caducados.length) {
            const porBorrar = await db.collection('tokens_camareros')
                .where('token', 'in', caducados.slice(0, 10))
                .get();
            await Promise.all(porBorrar.docs.map(d => d.ref.delete()));
            console.log(`${caducados.length} token(s) caducados eliminados`);
        }
    }
);
