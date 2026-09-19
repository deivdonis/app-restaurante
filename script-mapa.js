// Configuración de mesas
const TOTAL_MESAS = 20;
const MESAS_OCUPADAS = [3, 7, 12, 15]; // Mesas ocupadas de ejemplo

// DOM Elements
const mesasGrid = document.getElementById('mesasGrid');
const cartaModal = document.getElementById('cartaModal');
const closeBtn = document.querySelector('.close');
const navCarta = document.getElementById('navCarta');
const navItems = document.querySelectorAll('.nav-item');

// Generar mesas
function generarMesas() {
    mesasGrid.innerHTML = '';

    for (let i = 1; i <= TOTAL_MESAS; i++) {
        const mesaDiv = document.createElement('div');
        mesaDiv.className = 'mesa-item';
        mesaDiv.dataset.mesa = i;

        const isOccupied = MESAS_OCUPADAS.includes(i);
        if (isOccupied) {
            mesaDiv.classList.add('occupied');
        }

        const currentMesa = localStorage.getItem('mesaNumber');
        if (currentMesa == i) {
            mesaDiv.classList.add('selected');
        }

        mesaDiv.innerHTML = `
            <span class="mesa-icon">🪑</span>
            <span class="mesa-number">${i}</span>
            <span class="mesa-status">${isOccupied ? 'Ocupada' : 'Libre'}</span>
        `;

        mesaDiv.addEventListener('click', () => selectMesa(i, isOccupied));
        mesasGrid.appendChild(mesaDiv);
    }
}

function selectMesa(number, isOccupied) {
    if (isOccupied) {
        alert('❌ Esta mesa está ocupada');
        return;
    }

    // Actualizar selección visual
    document.querySelectorAll('.mesa-item').forEach(mesa => {
        mesa.classList.remove('selected');
    });
    document.querySelector(`[data-mesa="${number}"]`).classList.add('selected');

    // Guardar en localStorage
    localStorage.setItem('mesaNumber', number);

    // Actualizar índice.html
    if (window.mesaNumber) {
        window.mesaNumber.textContent = number;
    }

    // Mostrar confirmación
    showConfirmation(`✅ Mesa ${number} seleccionada`);
}

function showConfirmation(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
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

// Modal de carta
function openCarta() {
    cartaModal.style.display = 'block';
}

function closeCarta() {
    cartaModal.style.display = 'none';
}

// Event Listeners
navCarta.addEventListener('click', (e) => {
    e.preventDefault();
    openCarta();
    updateActiveNav('navCarta');
});

closeBtn.addEventListener('click', closeCarta);

window.addEventListener('click', (e) => {
    if (e.target === cartaModal) {
        closeCarta();
    }
});

// Actualizar nav activo
function updateActiveNav(id) {
    navItems.forEach(item => item.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Mantener activo el mapa
document.addEventListener('DOMContentLoaded', () => {
    generarMesas();
    updateActiveNav('navMapa');

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

// Refrescar mesas cada 30 segundos (simulación)
setInterval(() => {
    // En una app real, aquí harías un fetch a la API
    generarMesas();
}, 30000);
