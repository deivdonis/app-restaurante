// Usuarios con roles
const VALID_USERS = {
    'camarero1': { password: '1234', role: 'camarero', nombre: 'Camarero 1' },
    'camarero2': { password: '1234', role: 'camarero', nombre: 'Camarero 2' },
    'camarero3': { password: '1234', role: 'camarero', nombre: 'Camarero 3' },
    'camarero4': { password: '1234', role: 'camarero', nombre: 'Camarero 4' },
    'camarero5': { password: '1234', role: 'camarero', nombre: 'Camarero 5' },
    'gerente': { password: 'gerente123', role: 'gerente', nombre: 'Gerente' },
    'dueno': { password: 'dueno123', role: 'dueno', nombre: 'Dueño' }
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usuarioInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberCheckbox = document.getElementById('remember');
const loginMessage = document.getElementById('loginMessage');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

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
    if (VALID_USERS[usuario] && VALID_USERS[usuario].password === password) {
        const userRole = VALID_USERS[usuario].role;
        const userName = VALID_USERS[usuario].nombre;

        // Login exitoso
        authenticateUser(usuario, userRole);
        showSuccess('¡Bienvenido! Redirigiendo...');

        // Guardar sesión
        if (rememberCheckbox.checked) {
            localStorage.setItem('staff_user', usuario);
        }

        sessionStorage.setItem('staff_authenticated', 'true');
        sessionStorage.setItem('staff_user', usuario);
        sessionStorage.setItem('staff_role', userRole);
        sessionStorage.setItem('staff_name', userName);

        // Redirigir según rol
        setTimeout(() => {
            if (userRole === 'camarero') {
                window.location.href = 'dashboard-camarero.html';
            } else if (userRole === 'gerente') {
                window.location.href = 'dashboard-gerente.html';
            } else if (userRole === 'dueno') {
                window.location.href = 'dashboard-dueno.html';
            }
        }, 1500);
    } else {
        showError('Usuario o contraseña incorrectos');
        passwordInput.value = '';
    }
}

function authenticateUser(usuario, role) {
    console.log('✅ Usuario autenticado:', usuario, 'Rol:', role);
}

function isAuthenticated() {
    return sessionStorage.getItem('staff_authenticated') === 'true';
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
    const savedUser = localStorage.getItem('staff_user');
    if (savedUser) {
        usuarioInput.value = savedUser;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    }

    // Redirigir si ya está autenticado
    if (isAuthenticated()) {
        const role = sessionStorage.getItem('staff_role');
        if (role === 'camarero') {
            window.location.href = 'dashboard-camarero.html';
        } else if (role === 'gerente') {
            window.location.href = 'dashboard-gerente.html';
        } else if (role === 'dueno') {
            window.location.href = 'dashboard-dueno.html';
        }
    }
});

// Logout cuando cierre la pestaña/navegador
window.addEventListener('beforeunload', () => {
    if (!window.location.href.includes('dashboard')) {
        sessionStorage.removeItem('staff_authenticated');
        sessionStorage.removeItem('staff_user');
        sessionStorage.removeItem('staff_role');
        sessionStorage.removeItem('staff_name');
    }
});
