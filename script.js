// DOM Elements
const verCartaBtn = document.getElementById('verCartaBtn');
const llamarCamareroBtn = document.getElementById('llamarCamareroBtn');
const pedirCuentaBtn = document.getElementById('pedirCuentaBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceRow = document.querySelector('.voice-row');
const voiceHint = document.getElementById('voiceHint');
const enviarPeticionBtn = document.getElementById('enviarPeticionBtn');
const petitionInput = document.getElementById('petitionInput');
const cartaModal = document.getElementById('cartaModal');
const closeBtn = document.querySelector('.close');
const statusMessage = document.getElementById('statusMessage');
const mesaNumber = document.getElementById('mesaNumber');
const navCarta = document.getElementById('navCarta');
const navItems = document.querySelectorAll('.nav-item');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let textoAntesDeDictar = '';

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;   // para ver el texto mientras se habla
    recognition.maxAlternatives = 1;
}

// Event Listeners
verCartaBtn.addEventListener('click', openCarta);
llamarCamareroBtn.addEventListener('click', callWaiter);
pedirCuentaBtn.addEventListener('click', requestBill);
voiceBtn.addEventListener('click', toggleVoice);
enviarPeticionBtn.addEventListener('click', enviarPeticion);
closeBtn.addEventListener('click', closeCarta);
window.addEventListener('click', (e) => {
    if (e.target === cartaModal) closeCarta();
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCarta();
});

// Navigation events
if (navCarta) {
    navCarta.addEventListener('click', (e) => {
        e.preventDefault();
        openCarta();
        updateActiveNav('navCarta');
    });
}

// Functions
function openCarta() {
    cartaModal.style.display = 'block';
    updateActiveNav('navCarta');
}

function closeCarta() {
    cartaModal.style.display = 'none';
    updateActiveNav('navHome');
}

function callWaiter() {
    guardarMensaje(mesaNumber.textContent, '🔔 Solicitud: Llamar al camarero');
    showStatus('🔔 Aviso enviado, el camarero viene a la mesa ' + mesaNumber.textContent, 'success');
    vibrate();
    animateButton(llamarCamareroBtn);
}

function requestBill() {
    guardarMensaje(mesaNumber.textContent, '💳 Solicitud: Pedir la cuenta');
    showStatus('💳 Se ha enviado la solicitud de la cuenta', 'success');
    vibrate([100, 50, 100]);
    animateButton(pedirCuentaBtn);
}

function enviarPeticion() {
    const texto = petitionInput.value.trim();

    if (!texto) {
        showStatus('Escribe o dicta tu petición primero', 'error');
        petitionInput.focus();
        return;
    }

    if (isListening) stopListening();

    guardarMensaje(mesaNumber.textContent, '✏️ ' + texto);
    petitionInput.value = '';
    showStatus('✅ Petición enviada al camarero', 'success');
    vibrate();
    animateButton(enviarPeticionBtn);
}

function guardarMensaje(mesa, texto) {
    // Sync guarda en este dispositivo y, si hay Firebase configurado, avisa
    // además al móvil del camarero aunque tenga la app cerrada.
    if (typeof Sync !== 'undefined') {
        Sync.enviarPeticion(mesa, texto);
        return;
    }

    const mensajes = JSON.parse(localStorage.getItem('mensajes_clientes') || '{}');

    if (!mensajes[mesa]) {
        mensajes[mesa] = [];
    }

    mensajes[mesa].push({
        texto: texto,
        timestamp: Date.now(),
        leido: false
    });

    localStorage.setItem('mensajes_clientes', JSON.stringify(mensajes));
}

// --- Dictado ---

function toggleVoice() {
    if (!isListening) {
        startListening();
    } else {
        stopListening();
    }
}

function startListening() {
    // El navegador solo da acceso al micrófono en https (o en localhost)
    if (!window.isSecureContext) {
        showStatus('El dictado necesita una conexión segura (https)', 'error');
        return;
    }

    textoAntesDeDictar = petitionInput.value.trim();
    isListening = true;
    voiceRow.classList.add('listening');
    voiceBtn.classList.add('listening');
    voiceHint.textContent = 'Escuchando... pulsa para parar';

    recognition.onresult = (event) => {
        let definitivo = '';
        let provisional = '';

        for (let i = 0; i < event.results.length; i++) {
            const texto = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                definitivo += texto;
            } else {
                provisional += texto;
            }
        }

        // Se escribe en el cuadro mientras hablas, sin perder lo ya escrito
        const partes = [textoAntesDeDictar, (definitivo + provisional).trim()].filter(Boolean);
        petitionInput.value = partes.join(' ');
    };

    recognition.onerror = (event) => {
        const mensajes = {
            'not-allowed': 'No hay permiso para usar el micrófono. Actívalo en el navegador.',
            'service-not-allowed': 'No hay permiso para usar el micrófono.',
            'no-speech': 'No se escuchó nada. Inténtalo de nuevo.',
            'audio-capture': 'No se encontró ningún micrófono.',
            'network': 'Sin conexión para el reconocimiento de voz.',
            'aborted': ''
        };
        const mensaje = mensajes[event.error];
        if (mensaje !== '') {
            showStatus('🎤 ' + (mensaje || 'Error de dictado: ' + event.error), 'error');
        }
    };

    recognition.onend = () => {
        isListening = false;
        voiceRow.classList.remove('listening');
        voiceBtn.classList.remove('listening');
        voiceHint.textContent = 'Pulsa para dictar';

        if (petitionInput.value.trim() && petitionInput.value.trim() !== textoAntesDeDictar) {
            showStatus('Revisa el texto y pulsa "Enviar petición"', 'success');
        }
    };

    try {
        recognition.start();
    } catch (e) {
        // start() lanza error si ya estaba escuchando
        isListening = false;
        voiceRow.classList.remove('listening');
        voiceBtn.classList.remove('listening');
        voiceHint.textContent = 'Pulsa para dictar';
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;

    // Auto-clear después de 4 segundos
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 4000);
}

function animateButton(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

function vibrate(pattern = 200) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// --- Número de mesa ---
// Lo fija el QR de la mesa (index.html?mesa=7). El cliente ya no lo cambia:
// de trasladar una mesa a otra se encarga el camarero desde su panel.
function cargarMesa() {
    const desdeQR = new URLSearchParams(location.search).get('mesa');

    if (desdeQR && desdeQR.trim()) {
        const mesa = desdeQR.trim();
        localStorage.setItem('mesaNumber', mesa);
        mesaNumber.textContent = mesa;
        return;
    }

    const guardada = localStorage.getItem('mesaNumber');
    if (guardada) {
        mesaNumber.textContent = guardada;
    }
}

// Update active navigation
function updateActiveNav(id) {
    if (navItems) {
        navItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.getElementById(id);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarMesa();
    updateActiveNav('navHome');

    if (!recognition) {
        voiceBtn.disabled = true;
        voiceHint.textContent = 'Dictado no disponible en este navegador';
    } else if (!window.isSecureContext) {
        voiceHint.textContent = 'El dictado necesita https';
    }
});
