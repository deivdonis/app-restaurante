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

    console.log('Intentando login:', usuario, password);

    // Validar campos
    if (!usuario || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    // Verificar credenciales
    const user = VALID_USERS[usuario];

    if (user && user.password === password) {
        const userRole = user.role;
        const userName = user.nombre;

        console.log('Login exitoso:', usuario, 'Rol:', userRole);

        // Guardar sesión PRIMERO
        if (rememberCheckbox.checked) {
            localStorage.setItem('staff_user', usuario);
        }

        sessionStorage.setItem('staff_authenticated', 'true');
        sessionStorage.setItem('staff_user', usuario);
        sessionStorage.setItem('staff_role', userRole);
        sessionStorage.setItem('staff_name', userName);

        showSuccess('✅ ¡Bienvenido!');

        // Determinar URL según rol
        let redirectUrl = 'login-camareros.html';

        if (userRole === 'camarero') {
            redirectUrl = 'dashboard-camarero.html';
        } else if (userRole === 'gerente') {
            redirectUrl = 'dashboard-gerente.html';
        } else if (userRole === 'dueno') {
            redirectUrl = 'dashboard-dueno.html';
        }

        console.log('Redirigiendo a:', redirectUrl);

        // Redirigir INMEDIATAMENTE
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 300);

    } else {
        console.log('Credenciales inválidas');
        showError('Usuario o contraseña incorrectos');
        passwordInput.value = '';
    }
}

function showError(message) {
    loginMessage.textContent = '❌ ' + message;
    loginMessage.className = 'login-message error';
    console.log('Error:', message);

    setTimeout(() => {
        loginMessage.textContent = '';
        loginMessage.className = 'login-message';
    }, 4000);
}

function showSuccess(message) {
    loginMessage.textContent = message;
    loginMessage.className = 'login-message success';
    console.log('Éxito:', message);
}

function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
}

// Auto-fill recordarme
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Cargado - Login');

    const savedUser = localStorage.getItem('staff_user');
    if (savedUser) {
        usuarioInput.value = savedUser;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    }

    // Redirigir si ya está autenticado
    const isAuthenticated = sessionStorage.getItem('staff_authenticated') === 'true';
    if (isAuthenticated) {
        const role = sessionStorage.getItem('staff_role');
        console.log('Ya autenticado con rol:', role);

        let redirectUrl = 'login-camareros.html';
        if (role === 'camarero') {
            redirectUrl = 'dashboard-camarero.html';
        } else if (role === 'gerente') {
            redirectUrl = 'dashboard-gerente.html';
        } else if (role === 'dueno') {
            redirectUrl = 'dashboard-dueno.html';
        }

        window.location.href = redirectUrl;
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
