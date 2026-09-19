// Configuración de mesas
const TOTAL_MESAS = 20;
const MESAS_OCUPADAS = [3, 7, 12, 15];

// DOM Elements
const mesasGrid = document.getElementById('mesasGrid');
const messagesList = document.getElementById('messagesList');
const clearMessagesBtn = document.getElementById('clearMessagesBtn');
const camareroNombre = document.getElementById('camareroNombre');
const logoutBtn = document.getElementById('logoutBtn');
const notifBtn = document.getElementById('notifBtn');

// Estado
let camareroActual = '';
let mesasAsignadas = [];

// Generar mesas
function generarMesas() {
    mesasGrid.innerHTML = '';
    const mesasAsignadasJson = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');

    for (let i = 1; i <= TOTAL_MESAS; i++) {
        const mesaDiv = document.createElement('div');
        mesaDiv.className = 'mesa-item';
        mesaDiv.dataset.mesa = i;

        const isOccupied = MESAS_OCUPADAS.includes(i);
        const asignadaA = mesasAsignadasJson[i];

        if (isOccupied) {
            mesaDiv.classList.add('occupied');
        }

        if (asignadaA === camareroActual) {
            mesaDiv.classList.add('assigned');
        }

        mesaDiv.innerHTML = `
            <span class="mesa-icon">🪑</span>
            <span class="mesa-number">${i}</span>
            <span class="mesa-status">${
                asignadaA === camareroActual ? 'Mía' :
                asignadaA ? Auth.nombreDe(asignadaA) :
                isOccupied ? 'Ocupada' : 'Libre'
            }</span>
        `;

        mesaDiv.addEventListener('click', () => selectMesa(i));
        mesasGrid.appendChild(mesaDiv);
    }
}

function selectMesa(number) {
    const mesaElement = document.querySelector(`[data-mesa="${number}"]`);
    const mesasAsignadasJson = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');

    // Solo camareros: asignar/liberar mesa
    const estaAsignada = mesasAsignadasJson[number] === camareroActual;

    if (estaAsignada) {
        delete mesasAsignadasJson[number];
        localStorage.setItem('mesas_asignadas', JSON.stringify(mesasAsignadasJson));
        mesaElement.classList.remove('assigned');
        showConfirmation(`✅ Mesa ${number} liberada`);
    } else if (!mesasAsignadasJson[number]) {
        mesasAsignadasJson[number] = camareroActual;
        localStorage.setItem('mesas_asignadas', JSON.stringify(mesasAsignadasJson));
        mesaElement.classList.add('assigned');
        showConfirmation(`✅ Mesa ${number} asignada`);
    } else {
        showConfirmation(`❌ Mesa ${number} ya está asignada a ${Auth.nombreDe(mesasAsignadasJson[number])}`);
        return;
    }

    generarMesas();
    cargarMensajesDeMesasAsignadas();
}

function showConfirmation(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${message.includes('✅') ? '#4caf50' : '#ff6b6b'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Cargar mensajes de mesas asignadas
function cargarMensajesDeMesasAsignadas() {
    const todosLosMensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
    const mesasAsignadasJson = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');

    // Obtener mesas asignadas al camarero actual
    const misMesas = Object.keys(mesasAsignadasJson).filter(mesa => mesasAsignadasJson[mesa] === camareroActual);

    const mensajesFiltrados = [];

    misMesas.forEach(mesa => {
        if (todosLosMensajes[mesa]) {
            todosLosMensajes[mesa].forEach(msg => {
                mensajesFiltrados.push({
                    mesa,
                    ...msg
                });
            });
        }
    });

    // Ordenar por timestamp descendente
    mensajesFiltrados.sort((a, b) => b.timestamp - a.timestamp);

    // Mostrar mensajes
    if (mensajesFiltrados.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No hay mensajes en tus mesas</p>';
    } else {
        messagesList.innerHTML = mensajesFiltrados.map(msg => `
            <div class="message-item ${!msg.leido ? 'unread' : ''}">
                <div class="message-mesa">
                    <span>Mesa ${msg.mesa}</span>
                    <span>${new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="message-text">${escapeHtml(msg.texto)}</div>
                <div class="message-time">Cliente</div>
            </div>
        `).join('');

        // Marcar como leídos
        misMesas.forEach(mesa => {
            if (todosLosMensajes[mesa]) {
                todosLosMensajes[mesa].forEach(msg => msg.leido = true);
            }
        });
        localStorage.setItem('mensajes_clientes', JSON.stringify(todosLosMensajes));
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Mesas asignadas a este camarero, que son las que generan avisos. */
function misMesas() {
    const asignadas = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');
    return Object.keys(asignadas).filter(mesa => asignadas[mesa] === camareroActual);
}

function pintarBotonAvisos() {
    const estado = Notificaciones.permiso;

    if (estado === 'granted') {
        notifBtn.textContent = '🔔 Avisos activos';
        notifBtn.classList.add('activo');
        notifBtn.disabled = true;
    } else if (estado === 'denied' || estado === 'no-soportado') {
        notifBtn.textContent = '🔕 Sin avisos';
        notifBtn.classList.add('bloqueado');
    }
}

// Event Listeners
clearMessagesBtn.addEventListener('click', () => {
    const todosLosMensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
    const mesasAsignadasJson = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');
    const misMesas = Object.keys(mesasAsignadasJson).filter(mesa => mesasAsignadasJson[mesa] === camareroActual);

    misMesas.forEach(mesa => {
        delete todosLosMensajes[mesa];
    });

    localStorage.setItem('mensajes_clientes', JSON.stringify(todosLosMensajes));
    cargarMensajesDeMesasAsignadas();
    showConfirmation('✅ Mensajes limpiados');
});

logoutBtn.addEventListener('click', () => Auth.logout());

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Zona de personal: la página ya está protegida en el <head>
    const user = Auth.requireRole("camarero");
    if (!user) return;

    camareroActual = user.username;
    camareroNombre.textContent = user.name;

    // Avisos de las mesas asignadas a este camarero
    notifBtn.addEventListener('click', async () => {
        const resultado = await Notificaciones.pedirPermiso();
        if (resultado === 'denied') {
            showConfirmation('❌ Avisos bloqueados en el navegador');
        } else if (resultado === 'no-soportado') {
            showConfirmation('❌ Este navegador no admite avisos');
        } else if (resultado === 'granted') {
            showConfirmation('✅ Avisos activados');
        }
        pintarBotonAvisos();
    });

    Notificaciones.init(misMesas).then(() => {
        pintarBotonAvisos();
        Notificaciones.vigilar(5000);
    });

    // Peticiones compartidas entre dispositivos (si hay Firebase configurado)
    Sync.escuchar();
    window.addEventListener('peticiones-actualizadas', () => {
        generarMesas();
        cargarMensajesDeMesasAsignadas();
        Notificaciones.revisar();
    });

    generarMesas();
    cargarMensajesDeMesasAsignadas();

    // Refrescar cada 5 segundos
    setInterval(() => {
        generarMesas();
        cargarMensajesDeMesasAsignadas();
    }, 5000);

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});
