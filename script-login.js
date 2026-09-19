// Usuarios válidos (en una app real, esto vendría de una base de datos)
const VALID_USERS = {
    'camarero': '1234',
    'admin': 'admin123',
    'jefe': 'jefe2024'
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usuarioInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberCheckbox = document.getElementById('remember');
const loginMessage = document.getElementById('loginMessage');
const navCarta = document.getElementById('navCarta');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

if (navCarta) {
    navCarta.addEventListener('click', (e) => {
        e.preventDefault();
        // Mostrar carta si está autenticado
        if (isAuthenticated()) {
            alert('Funcionalidad en desarrollo');
        } else {
            showError('Debes iniciar sesión primero');
        }
    });
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value;

    // Validar campos
    if (!usuario || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    // Verificar credenciales
    if (VALID_USERS[usuario] === password) {
        // Login exitoso
        authenticateUser(usuario);
        showSuccess('¡Bienvenido! Redirigiendo...');

        // Guardar sesión
        if (rememberCheckbox.checked) {
            localStorage.setItem('camarero_user', usuario);
        }

        sessionStorage.setItem('camarero_authenticated', 'true');
        sessionStorage.setItem('camarero_user', usuario);

        // Redirigir a mapa después de 1.5 segundos
        setTimeout(() => {
            window.location.href = 'mapa.html';
        }, 1500);
    } else {
        showError('Usuario o contraseña incorrectos');
        passwordInput.value = '';
    }
}

function authenticateUser(usuario) {
    console.log('✅ Usuario autenticado:', usuario);
}

function isAuthenticated() {
    return sessionStorage.getItem('camarero_authenticated') === 'true';
}

function showError(message) {
    loginMessage.textContent = '❌ ' + message;
    loginMessage.className = 'login-message error';

    setTimeout(() => {
        loginMessage.textContent = '';
        loginMessage.className = 'login-message';
    }, 4000);
}

function showSuccess(message) {
    loginMessage.textContent = '✅ ' + message;
    loginMessage.className = 'login-message success';
}

function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';

    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
}

// Auto-fill recordarme
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('camarero_user');
    if (savedUser) {
        usuarioInput.value = savedUser;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    }

    // Redirigir si ya está autenticado
    if (isAuthenticated()) {
        window.location.href = 'mapa.html';
    }
});

// Logout cuando cierre la pestaña/navegador
window.addEventListener('beforeunload', () => {
    // Mantener sesión si está en mapa.html
    if (!window.location.href.includes('mapa.html')) {
        sessionStorage.removeItem('camarero_authenticated');
        sessionStorage.removeItem('camarero_user');
    }
});
