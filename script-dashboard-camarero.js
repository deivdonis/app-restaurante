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
const detallesModal = document.getElementById('detallesModal');
const filterBtns = document.querySelectorAll('.filter-btn');
const closeButtons = document.querySelectorAll('.close');

// Estado
let camareroActual = 'camarero1';
let filtroActual = 'all';
let mesaTrasladoActual = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Camarero Cargado');

    // Sin autenticación - acceso directo
    camareroActual = 'camarero1';
    camareroNombre.textContent = 'Dashboard Camarero';

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

    // Inicializar
    generarMesas();
    cargarMensajes();

    // Refrescar cada 5 segundos
    setInterval(() => {
        generarMesas();
        cargarMensajes();
    }, 5000);
});

// Generar Mesas
function generarMesas() {
    mesasGrid.innerHTML = '';
    const mesasActivas = JSON.parse(localStorage.getItem('mesas_activas') || '{}');
    const mesasAsignadas = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');

    for (let i = 1; i <= TOTAL_MESAS; i++) {
        const estaActiva = mesasActivas[i] === true;
        const asignadaA = mesasAsignadas[i];
        const esOcupada = MESAS_OCUPADAS.includes(i);

        // Filtrar por estado
        if (filtroActual === 'active' && !estaActiva) continue;
        if (filtroActual === 'inactive' && estaActiva) continue;

        const card = document.createElement('div');
        card.className = `mesa-card ${!estaActiva ? 'inactive' : ''}`;

        card.innerHTML = `
            <div class="mesa-numero">${i}</div>
            <div class="mesa-estado ${!estaActiva ? 'inactive' : ''}">
                ${estaActiva ? '🟢 ACTIVA' : '⚫ INACTIVA'}
            </div>
            <div class="mesa-camarero">
                ${asignadaA ? `👤 ${asignadaA}` : '📌 Sin asignar'}
            </div>
            <div class="mesa-acciones">
                <button class="mesa-btn" onclick="toggleMesa(${i})" title="${estaActiva ? 'Desactivar' : 'Activar'}">
                    ${estaActiva ? '⏹️ Desact' : '▶️ Activ'}
                </button>
                <button class="mesa-btn trasladar" onclick="abrirTrasladar(${i})" title="Trasladar">
                    🔄 Trasf
                </button>
                <button class="mesa-btn" onclick="verDetalles(${i})" title="Detalles">
                    ℹ️ Info
                </button>
            </div>
        `;

        mesasGrid.appendChild(card);
    }
}

// Toggle Mesa (Activar/Desactivar)
function toggleMesa(mesa) {
    const mesasActivas = JSON.parse(localStorage.getItem('mesas_activas') || '{}');
    mesasActivas[mesa] = !mesasActivas[mesa];
    localStorage.setItem('mesas_activas', JSON.stringify(mesasActivas));
    generarMesas();
}

// Abrir Modal Trasladar
function abrirTrasladar(mesa) {
    mesaTrasladoActual = mesa;
    document.getElementById('mesaTrasladar').textContent = mesa;

    const camarerosList = document.getElementById('camarerosList');
    camarerosList.innerHTML = '';

    const camareros = ['camarero1', 'camarero2', 'camarero3', 'camarero4', 'camarero5'];

    camareros.forEach(camarero => {
        if (camarero !== camareroActual) {
            const div = document.createElement('div');
            div.className = 'camarero-option';
            div.textContent = camarero.toUpperCase();
            div.onclick = () => trasladarMesa(mesa, camarero);
            camarerosList.appendChild(div);
        }
    });

    trasladarModal.style.display = 'block';
}

// Trasladar Mesa
function trasladarMesa(mesa, camarero) {
    const mesasAsignadas = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');
    mesasAsignadas[mesa] = camarero;
    localStorage.setItem('mesas_asignadas', JSON.stringify(mesasAsignadas));

    trasladarModal.style.display = 'none';
    generarMesas();
    mostrarNotificacion(`✅ Mesa ${mesa} trasladada a ${camarero}`);
}

function cerrarTrasladar() {
    trasladarModal.style.display = 'none';
}

// Ver Detalles
function verDetalles(mesa) {
    const mesasActivas = JSON.parse(localStorage.getItem('mesas_activas') || '{}');
    const mesasAsignadas = JSON.parse(localStorage.getItem('mesas_asignadas') || '{}');
    const mensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');

    const estaActiva = mesasActivas[mesa];
    const asignadaA = mesasAsignadas[mesa] || 'Sin asignar';
    const mensajesMesa = mensajes[mesa] || [];

    const detallesInfo = document.getElementById('detallesInfo');
    detallesInfo.innerHTML = `
        <div class="detalles-item">
            <span class="detalles-label">📍 Mesa:</span>
            <span class="detalles-valor">${mesa}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">🟢 Estado:</span>
            <span class="detalles-valor">${estaActiva ? 'ACTIVA' : 'INACTIVA'}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">👤 Asignado a:</span>
            <span class="detalles-valor">${asignadaA}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">📬 Mensajes:</span>
            <span class="detalles-valor">${mensajesMesa.length}</span>
        </div>
        <div class="detalles-item">
            <span class="detalles-label">🕐 Hora Apertura:</span>
            <span class="detalles-valor">${new Date().toLocaleTimeString('es-ES')}</span>
        </div>
    `;

    detallesModal.style.display = 'block';
}

function cerrarDetalles() {
    detallesModal.style.display = 'none';
}

// Cargar Mensajes
function cargarMensajes() {
    const mensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');
    const todosLosMensajes = [];

    for (const mesa in mensajes) {
        mensajes[mesa].forEach(msg => {
            todosLosMensajes.push({
                mesa,
                ...msg
            });
        });
    }

    todosLosMensajes.sort((a, b) => b.timestamp - a.timestamp);

    if (todosLosMensajes.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No hay mensajes</p>';
    } else {
        messagesList.innerHTML = todosLosMensajes.slice(0, 20).map(msg => `
            <div class="message-item ${!msg.leido ? 'unread' : ''}">
                <div class="message-mesa">
                    <span>🪑 Mesa ${msg.mesa}</span>
                    <span>${new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="message-texto">${escapeHtml(msg.texto)}</div>
                <div class="message-time">Cliente</div>
            </div>
        `).join('');

        // Marcar como leídos
        for (const mesa in mensajes) {
            mensajes[mesa].forEach(msg => msg.leido = true);
        }
        localStorage.setItem('mensajes_clientes', JSON.stringify(mensajes));
    }
}

function limpiarMensajes() {
    localStorage.setItem('mensajes_clientes', JSON.stringify({}));
    cargarMensajes();
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
    console.log('Logout - Limpiando sesión');
    sessionStorage.clear();
    localStorage.removeItem('staff_user');
    window.location.href = 'login-camareros.html';
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
