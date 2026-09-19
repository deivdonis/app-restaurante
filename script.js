// DOM Elements
const verCartaBtn = document.getElementById('verCartaBtn');
const llamarCamareroBtn = document.getElementById('llamarCamareroBtn');
const pedirCuentaBtn = document.getElementById('pedirCuentaBtn');
const voiceBtn = document.getElementById('voiceBtn');
const petitionInput = document.getElementById('petitionInput');
const cartaModal = document.getElementById('cartaModal');
const closeBtn = document.querySelector('.close');
const statusMessage = document.getElementById('statusMessage');
const mesaNumber = document.getElementById('mesaNumber');
const navCarta = document.getElementById('navCarta');
const navItems = document.querySelectorAll('.nav-item');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
}

// Event Listeners
verCartaBtn.addEventListener('click', openCarta);
llamarCamareroBtn.addEventListener('click', callWaiter);
pedirCuentaBtn.addEventListener('click', requestBill);
voiceBtn.addEventListener('click', toggleVoice);
closeBtn.addEventListener('click', closeCarta);
window.addEventListener('click', (e) => {
    if (e.target === cartaModal) closeCarta();
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
    showStatus('Abriendo carta...', 'info');
}

function closeCarta() {
    cartaModal.style.display = 'none';
}

function callWaiter() {
    showStatus('¡Camarero! Se le necesita en la mesa ' + mesaNumber.textContent, 'success');
    vibrate();
    animateButton(llamarCamareroBtn);
}

function requestBill() {
    showStatus('Se ha enviado la solicitud de la cuenta...', 'success');
    vibrate([100, 50, 100]);
    animateButton(pedirCuentaBtn);
}

function toggleVoice() {
    if (!recognition) {
        showStatus('Reconocimiento de voz no disponible en este navegador', 'error');
        return;
    }

    if (!isListening) {
        startListening();
    } else {
        stopListening();
    }
}

function startListening() {
    isListening = true;
    voiceBtn.classList.add('listening');
    showStatus('Escuchando...', 'info');

    recognition.onstart = () => {
        petitionInput.placeholder = 'Hablando...';
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        petitionInput.value += (petitionInput.value ? ' ' : '') + transcript;
        showStatus('Texto agregado: "' + transcript + '"', 'success');
    };

    recognition.onerror = (event) => {
        showStatus('Error en reconocimiento de voz: ' + event.error, 'error');
    };

    recognition.onend = () => {
        isListening = false;
        voiceBtn.classList.remove('listening');
        petitionInput.placeholder = 'Dictar o escribir petición...';
    };

    recognition.start();
}

function stopListening() {
    if (recognition) {
        recognition.stop();
        isListening = false;
        voiceBtn.classList.remove('listening');
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

// Local Storage para mesa
function setMesa(number) {
    localStorage.setItem('mesaNumber', number);
    mesaNumber.textContent = number;
}

function getMesa() {
    const saved = localStorage.getItem('mesaNumber');
    if (saved) {
        mesaNumber.textContent = saved;
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
    getMesa();
    updateActiveNav('navHome');

    // Permitir cambiar número de mesa con doble click
    mesaNumber.addEventListener('dblclick', () => {
        const newNumber = prompt('Número de mesa:', mesaNumber.textContent);
        if (newNumber && newNumber.trim()) {
            setMesa(newNumber.trim());
        }
    });
});
