// Configuración
const TOTAL_MESAS = 20;
const MESAS_OCUPADAS = [3, 7, 12, 15];

// DOM Elements
const mesasGrid = document.getElementById('mesasGrid');
const messagesList = document.getElementById('messagesList');
const clearMessagesBtn = document.getElementById('clearMessagesBtn');
const logoutBtn = document.getElementById('logoutBtn');
const camareroNombre = document.getElementById('camareroNombre');
const trasladarModal = document.getElementById('trasladarModal');
const fichaModal = document.getElementById('fichaModal');
const cambiarModal = document.getElementById('cambiarModal');
const filterBtns = document.querySelectorAll('.filter-btn');
const closeButtons = document.querySelectorAll('.close');
const notifBtn = document.getElementById('notifBtn');

// Estado
let camareroActual = null;
let filtroActual = 'all';
let mesaFicha = null;        // mesa abierta en la ficha
let mesaTrasladoActual = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // La página ya está protegida en el <head>; aquí tomamos la sesión real
    const user = Auth.requireRole("camarero");
    if (!user) return;

    camareroActual = user.username;
    camareroNombre.textContent = user.name;

    // Event Listeners
    logoutBtn.addEventListener('click', logout);
    clearMessagesBtn.addEventListener('click', limpiarMensajes);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filtroActual = e.target.dataset.filter;
            generarMesas();
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Acciones de la ficha de mesa
    document.getElementById('fichaToggleBtn').addEventListener('click', () => toggleMesa(mesaFicha));
    document.getElementById('fichaTrasladarBtn').addEventListener('click', () => abrirTrasladar(mesaFicha));
    document.getElementById('fichaCambiarBtn').addEventListener('click', () => abrirCambiar(mesaFicha));
    document.getElementById('fichaLimpiarBtn').addEventListener('click', () => limpiarMensajesDeMesa(mesaFicha));
    document.getElementById('fichaCerrarBtn').addEventListener('click', cerrarFicha);

    // Peticiones compartidas entre dispositivos (si hay Firebase configurado)
    Sync.escuchar();
    window.addEventListener('peticiones-actualizadas', () => {
        generarMesas();
        cargarMensajes();
        if (mesaFicha !== null && fichaModal.style.display === 'block') pintarFicha(mesaFicha);
        Notificaciones.revisar();
    });

    // Avisos: vigilan las mesas de este camarero
    notifBtn.addEventListener('click', activarAvisos);
    Notificaciones.init(misMesas).then(() => {
        pintarBotonAvisos();
        Notificaciones.vigilar(5000);
    });

    // Si el aviso trae mesa (?mesa=7 o al tocar la notificación), abrir su ficha
    const mesaPedida = new URLSearchParams(location.search).get('mesa');
    if (mesaPedida) abrirFicha(Number(mesaPedida));

    // Inicializar
    generarMesas();
    cargarMensajes();

    // Refrescar cada 5 segundos
    setInterval(() => {
        generarMesas();
        cargarMensajes();
        if (mesaFicha !== null && fichaModal.style.display === 'block') {
            pintarFicha(mesaFicha);
        }
    }, 5000);
});

// --- Avisos ---

/** Mesas de este camarero; si no tiene ninguna asignada, vigila todas. */
function misMesas() {
    const asignadas = leerMesasAsignadas();
    return Object.keys(asignadas).filter(mesa => asignadas[mesa] === camareroActual);
}

async function activarAvisos() {
    const resultado = await Notificaciones.pedirPermiso();

    if (resultado === 'no-soportado') {
        mostrarNotificacion('⚠️ Este navegador no admite avisos (hace falta https)');
    } else if (resultado === 'denied') {
        mostrarNotificacion('⚠️ Avisos bloqueados: actívalos en los ajustes del navegador');
    } else if (resultado === 'granted') {
        mostrarNotificacion('🔔 Avisos activados');
    }

    pintarBotonAvisos();
}

function pintarBotonAvisos() {
    const estado = Notificaciones.permiso;

    if (estado === 'granted') {
        const conPush = typeof firebaseConfigurado === 'function' && firebaseConfigurado();
        notifBtn.textContent = conPush ? '🔔 Avisos push activos' : '🔔 Avisos activos';
        notifBtn.classList.add('activo');
        notifBtn.disabled = true;
        notifBtn.title = conPush
            ? 'Recibes las peticiones aunque cierres la app'
            : 'Avisos en este dispositivo. Para recibirlos con la app cerrada, configura Firebase.';
    } else if (estado === 'denied') {
        notifBtn.textContent = '🔕 Avisos bloqueados';
        notifBtn.classList.add('bloqueado');
        notifBtn.title = 'Permite las notificaciones en los ajustes del navegador para este sitio';
    } else if (estado === 'no-soportado') {
        notifBtn.textContent = '🔕 Avisos no disponibles';
        notifBtn.classList.add('bloqueado');
        notifBtn.disabled = true;
        notifBtn.title = 'Los avisos necesitan https y un navegador compatible';
    } else {
        notifBtn.textContent = '🔔 Activar avisos';
    }
}

// --- Utilidades de almacenamiento ---
const leerMesasActivas = () => JSON.parse(localStorage.getItem('mesas_activas') || '{}');
const leerMesasAsignadas = () => JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');
const leerMensajes = () => JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
const guardarMesasActivas = (v) => localStorage.setItem('mesas_activas', JSON.stringify(v));
const guardarMesasAsignadas = (v) => localStorage.setItem('mesas_asignadas', JSON.stringify(v));
const guardarMensajes = (v) => localStorage.setItem('mensajes_clientes', JSON.stringify(v));

// --- Generar Mesas ---
// La tarjeta entera abre la ficha de la mesa; los botones viven dentro de la ficha.
function generarMesas() {
    mesasGrid.innerHTML = '';
    const mesasActivas = leerMesasActivas();
    const mesasAsignadas = leerMesasAsignadas();
    const mensajes = leerMensajes();

    for (let i = 1; i <= TOTAL_MESAS; i++) {
        const estaActiva = mesasActivas[i] === true;
        const asignadaA = mesasAsignadas[i];
        const sinLeer = (mensajes[i] || []).filter(m => !m.leido).length;

        // Filtrar por estado
        if (filtroActual === 'active' && !estaActiva) continue;
        if (filtroActual === 'inactive' && estaActiva) continue;

        const card = document.createElement('div');
        card.className = `mesa-card ${!estaActiva ? 'inactive' : ''} ${asignadaA === camareroActual ? 'mia' : ''}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.title = `Ver ficha de la mesa ${i}`;

        card.innerHTML = `
            ${sinLeer > 0 ? `<span class="mesa-aviso">${sinLeer}</span>` : ''}
            <div class="mesa-numero">${i}</div>
            <div class="mesa-estado ${!estaActiva ? 'inactive' : ''}">
                ${estaActiva ? '🟢 ACTIVA' : '⚫ INACTIVA'}
            </div>
            <div class="mesa-camarero">
                ${asignadaA ? `👤 ${Auth.nombreDe(asignadaA)}` : '📌 Sin asignar'}
            </div>
            <div class="mesa-abrir">Ver ficha ›</div>
        `;

        card.addEventListener('click', () => abrirFicha(i));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirFicha(i);
            }
        });

        mesasGrid.appendChild(card);
    }
}

// --- Ficha de Mesa ---
function abrirFicha(mesa) {
    mesaFicha = mesa;
    pintarFicha(mesa);
    fichaModal.style.display = 'block';
}

function cerrarFicha() {
    fichaModal.style.display = 'none';
    mesaFicha = null;
}

function pintarFicha(mesa) {
    const mesasActivas = leerMesasActivas();
    const mesasAsignadas = leerMesasAsignadas();
    const mensajes = leerMensajes();

    const estaActiva = mesasActivas[mesa] === true;
    const asignadaA = mesasAsignadas[mesa];
    const esOcupada = MESAS_OCUPADAS.includes(Number(mesa));
    const historial = (mensajes[mesa] || []).slice().sort((a, b) => b.timestamp - a.timestamp);
    const sinLeer = historial.filter(m => !m.leido).length;
    const primero = historial.length ? historial[historial.length - 1] : null;

    document.getElementById('fichaNumero').textContent = mesa;

    document.getElementById('fichaInfo').innerHTML = `
        <div class="detalles-item">
            <span class="detalles-label">Estado</span>
            <span class="detalles-valor">${estaActiva ? '🟢 Activa' : '⚫ Inactiva'}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">Ocupación</span>
            <span class="detalles-valor">${esOcupada ? '🍽️ Ocupada' : '🪑 Libre'}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">Camarero</span>
            <span class="detalles-valor">${asignadaA ? Auth.nombreDe(asignadaA) : 'Sin asignar'}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">Peticiones</span>
            <span class="detalles-valor">${historial.length}${sinLeer ? ` (${sinLeer} sin leer)` : ''}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">Primera petición</span>
            <span class="detalles-valor">${primero ? hora(primero.timestamp) : '—'}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">Última petición</span>
            <span class="detalles-valor">${historial.length ? hora(historial[0].timestamp) : '—'}</span>
        </div>
    `;

    document.getElementById('fichaMensajes').innerHTML = historial.length
        ? historial.map(msg => `
            <div class="message-item ${!msg.leido ? 'unread' : ''}">
                <div class="message-mesa">
                    <span>${!msg.leido ? '🔴 Sin leer' : 'Leído'}</span>
                    <span>${hora(msg.timestamp)}</span>
                </div>
                <div class="message-texto">${escapeHtml(msg.texto)}</div>
            </div>
        `).join('')
        : '<p class="no-messages">Esta mesa no ha pedido nada todavía</p>';

    document.getElementById('fichaToggleBtn').textContent = estaActiva ? '⏹️ Desactivar mesa' : '▶️ Activar mesa';

    // Marcar como leídos los mensajes de esta mesa
    if (sinLeer > 0) {
        const todos = leerMensajes();
        (todos[mesa] || []).forEach(m => m.leido = true);
        guardarMensajes(todos);
    }
}

function hora(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// --- Acciones de la ficha ---
function toggleMesa(mesa) {
    if (mesa === null) return;
    const mesasActivas = leerMesasActivas();
    mesasActivas[mesa] = !mesasActivas[mesa];
    guardarMesasActivas(mesasActivas);

    generarMesas();
    pintarFicha(mesa);
    mostrarNotificacion(mesasActivas[mesa] ? `🟢 Mesa ${mesa} activada` : `⚫ Mesa ${mesa} desactivada`);
}

function limpiarMensajesDeMesa(mesa) {
    if (mesa === null) return;
    const mensajes = leerMensajes();
    const cuantos = (mensajes[mesa] || []).length;

    if (!cuantos) {
        mostrarNotificacion('No hay mensajes que limpiar');
        return;
    }

    delete mensajes[mesa];
    guardarMensajes(mensajes);

    generarMesas();
    cargarMensajes();
    pintarFicha(mesa);
    mostrarNotificacion(`🧹 ${cuantos} mensaje(s) de la mesa ${mesa} eliminados`);
}

// --- Trasladar a otro camarero ---
function abrirTrasladar(mesa) {
    if (mesa === null) return;
    mesaTrasladoActual = mesa;
    document.getElementById('mesaTrasladar').textContent = mesa;

    const camarerosList = document.getElementById('camarerosList');
    camarerosList.innerHTML = '';

    // Los demás camareros, según la lista del sistema de acceso
    Auth.otrosCamareros(camareroActual).forEach(camarero => {
        const div = document.createElement('div');
        div.className = 'camarero-option';
        div.textContent = Auth.nombreDe(camarero);
        div.onclick = () => trasladarMesa(mesa, camarero);
        camarerosList.appendChild(div);
    });

    trasladarModal.style.display = 'block';
}

function trasladarMesa(mesa, camarero) {
    const mesasAsignadas = leerMesasAsignadas();
    mesasAsignadas[mesa] = camarero;
    guardarMesasAsignadas(mesasAsignadas);

    trasladarModal.style.display = 'none';
    generarMesas();
    if (mesaFicha !== null) pintarFicha(mesaFicha);
    mostrarNotificacion(`✅ Mesa ${mesa} trasladada a ${Auth.nombreDe(camarero)}`);
}

function cerrarTrasladar() {
    trasladarModal.style.display = 'none';
}

// --- Cambiar de mesa: los clientes se mueven y se llevan su historial ---
function abrirCambiar(mesa) {
    if (mesa === null) return;
    document.getElementById('cambiarOrigen').textContent = mesa;

    const mesasActivas = leerMesasActivas();
    const mesasAsignadas = leerMesasAsignadas();
    const mensajes = leerMensajes();
    const destinos = document.getElementById('mesasDestino');
    destinos.innerHTML = '';

    for (let i = 1; i <= TOTAL_MESAS; i++) {
        if (i === Number(mesa)) continue;

        const ocupadaPorOtro = mesasAsignadas[i] && mesasAsignadas[i] !== camareroActual;
        const tieneHistorial = (mensajes[i] || []).length > 0;
        const activa = mesasActivas[i] === true;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mesa-destino ${ocupadaPorOtro ? 'bloqueada' : ''}`;
        btn.innerHTML = `
            <span class="destino-num">${i}</span>
            <span class="destino-info">${
                ocupadaPorOtro ? Auth.nombreDe(mesasAsignadas[i]) :
                tieneHistorial ? 'con pedidos' :
                activa ? 'activa' : 'libre'
            }</span>
        `;

        if (ocupadaPorOtro) {
            btn.disabled = true;
            btn.title = `La lleva ${Auth.nombreDe(mesasAsignadas[i])}`;
        } else {
            btn.addEventListener('click', () => moverMesa(Number(mesa), i));
        }

        destinos.appendChild(btn);
    }

    cambiarModal.style.display = 'block';
}

function cerrarCambiar() {
    cambiarModal.style.display = 'none';
}

/**
 * Mueve una mesa entera a otra: historial de pedidos, estado y camarero.
 * Si la mesa destino ya tenía pedidos, los dos historiales se fusionan por hora.
 */
function moverMesa(origen, destino) {
    const mensajes = leerMensajes();
    const mesasActivas = leerMesasActivas();
    const mesasAsignadas = leerMesasAsignadas();

    const historialOrigen = mensajes[origen] || [];
    const historialDestino = mensajes[destino] || [];

    // Historial: se traslada completo y se ordena por hora
    const fusionado = historialDestino
        .concat(historialOrigen.map(m => ({ ...m, mesaOriginal: m.mesaOriginal || origen })))
        .sort((a, b) => a.timestamp - b.timestamp);

    if (fusionado.length) {
        mensajes[destino] = fusionado;
    }
    delete mensajes[origen];
    guardarMensajes(mensajes);

    // Estado: el destino hereda el de origen, el origen queda libre
    mesasActivas[destino] = mesasActivas[origen] === true;
    delete mesasActivas[origen];
    guardarMesasActivas(mesasActivas);

    // Camarero: sigue siendo el mismo
    if (mesasAsignadas[origen]) {
        mesasAsignadas[destino] = mesasAsignadas[origen];
        delete mesasAsignadas[origen];
    }
    guardarMesasAsignadas(mesasAsignadas);

    cambiarModal.style.display = 'none';
    generarMesas();
    cargarMensajes();

    // La ficha pasa a seguir a los clientes en su nueva mesa
    mesaFicha = destino;
    pintarFicha(destino);

    mostrarNotificacion(
        `✅ Mesa ${origen} → ${destino}` +
        (historialOrigen.length ? ` con ${historialOrigen.length} petición(es)` : '')
    );
}

// --- Mensajes (panel lateral) ---
function cargarMensajes() {
    const mensajes = leerMensajes();
    const todosLosMensajes = [];

    for (const mesa in mensajes) {
        mensajes[mesa].forEach(msg => {
            todosLosMensajes.push({ mesa, ...msg });
        });
    }

    todosLosMensajes.sort((a, b) => b.timestamp - a.timestamp);

    if (todosLosMensajes.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No hay mensajes</p>';
        return;
    }

    messagesList.innerHTML = todosLosMensajes.slice(0, 20).map(msg => `
        <div class="message-item ${!msg.leido ? 'unread' : ''}" data-mesa="${msg.mesa}">
            <div class="message-mesa">
                <span>🪑 Mesa ${msg.mesa}</span>
                <span>${hora(msg.timestamp)}</span>
            </div>
            <div class="message-texto">${escapeHtml(msg.texto)}</div>
            <div class="message-time">Cliente${msg.mesaOriginal ? ` · venía de la mesa ${msg.mesaOriginal}` : ''}</div>
        </div>
    `).join('');

    // Tocar un mensaje abre la ficha de su mesa
    messagesList.querySelectorAll('.message-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => abrirFicha(Number(item.dataset.mesa)));
    });
}

function limpiarMensajes() {
    guardarMensajes({});
    cargarMensajes();
    generarMesas();
    if (mesaFicha !== null) pintarFicha(mesaFicha);
    mostrarNotificacion('✅ Mensajes limpiados');
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarNotificacion(mensaje) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = mensaje;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2500);
}

function logout() {
    Auth.logout();
}

// Estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
