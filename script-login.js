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

    console.log('🔐 Intentando login:', usuario);

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

        console.log('✅ Login exitoso:', usuario, '| Rol:', userRole);

        // Guardar en sessionStorage PRIMERO
        sessionStorage.setItem('staff_authenticated', 'true');
        sessionStorage.setItem('staff_user', usuario);
        sessionStorage.setItem('staff_role', userRole);
        sessionStorage.setItem('staff_name', userName);

        // Guardar en localStorage si lo pide
        if (rememberCheckbox.checked) {
            localStorage.setItem('staff_user', usuario);
        }

        console.log('✅ Sesión guardada');
        showSuccess('✅ ¡Entrando!');

        // Determinar URL según rol
        let redirectUrl = 'dashboard-camarero.html';

        if (userRole === 'camarero') {
            redirectUrl = 'dashboard-camarero.html';
        } else if (userRole === 'gerente') {
            redirectUrl = 'dashboard-gerente.html';
        } else if (userRole === 'dueno') {
            redirectUrl = 'dashboard-dueno.html';
        }

        console.log('📍 Redirigiendo a:', redirectUrl);

        // Redirigir inmediatamente
        window.location.href = redirectUrl;

    } else {
        console.log('❌ Credenciales inválidas');
        showError('Usuario o contraseña incorrectos');
        passwordInput.value = '';
    }
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
    loginMessage.textContent = message;
    loginMessage.className = 'login-message success';
}

function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
}

// Auto-fill y redirección si ya hay sesión
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Página Login cargada');

    // Verificar sesión existente
    const isAuthenticated = sessionStorage.getItem('staff_authenticated') === 'true';
    const user = sessionStorage.getItem('staff_user');

    console.log('Sesión existente - Autenticado:', isAuthenticated, 'Usuario:', user);

    if (isAuthenticated && user) {
        const role = sessionStorage.getItem('staff_role');
        console.log('✅ Sesión activa, redirigiendo');

        let redirectUrl = 'dashboard-camarero.html';

        if (role === 'camarero') {
            redirectUrl = 'dashboard-camarero.html';
        } else if (role === 'gerente') {
            redirectUrl = 'dashboard-gerente.html';
        } else if (role === 'dueno') {
            redirectUrl = 'dashboard-dueno.html';
        }

        window.location.href = redirectUrl;
    }

    // Auto-fill usuario guardado
    const savedUser = localStorage.getItem('staff_user');
    if (savedUser) {
        usuarioInput.value = savedUser;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    }
});
