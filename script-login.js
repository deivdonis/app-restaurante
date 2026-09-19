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
    console.log('Usuario encontrado:', !!user);

    if (user && user.password === password) {
        const userRole = user.role;
        const userName = user.nombre;

        console.log('✅ Login exitoso:', usuario, '| Rol:', userRole);

        // Guardar sesión
        if (rememberCheckbox.checked) {
            localStorage.setItem('staff_user', usuario);
            console.log('Guardado en localStorage');
        }

        // Guardar en sessionStorage
        sessionStorage.setItem('staff_authenticated', 'true');
        sessionStorage.setItem('staff_user', usuario);
        sessionStorage.setItem('staff_role', userRole);
        sessionStorage.setItem('staff_name', userName);
        console.log('Sesión guardada en sessionStorage');

        showSuccess('✅ ¡Entrando!');

        // Determinar URL según rol
        let redirectUrl = '';

        if (userRole === 'camarero') {
            redirectUrl = '/app-restaurante/dashboard-camarero.html';
        } else if (userRole === 'gerente') {
            redirectUrl = '/app-restaurante/dashboard-gerente.html';
        } else if (userRole === 'dueno') {
            redirectUrl = '/app-restaurante/dashboard-dueno.html';
        }

        console.log('📍 Redirigiendo a:', redirectUrl);

        // Redirigir SIN delay
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

// Auto-fill recordarme
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Página de Login cargada');

    const savedUser = localStorage.getItem('staff_user');
    if (savedUser) {
        usuarioInput.value = savedUser;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    }

    // Redirigir si ya está autenticado
    const isAuthenticated = sessionStorage.getItem('staff_authenticated') === 'true';
    const user = sessionStorage.getItem('staff_user');

    console.log('Verificando sesión existente - Autenticado:', isAuthenticated, 'Usuario:', user);

    if (isAuthenticated && user) {
        const role = sessionStorage.getItem('staff_role');
        console.log('✅ Sesión activa con rol:', role);

        let redirectUrl = '';
        if (role === 'camarero') {
            redirectUrl = '/app-restaurante/dashboard-camarero.html';
        } else if (role === 'gerente') {
            redirectUrl = '/app-restaurante/dashboard-gerente.html';
        } else if (role === 'dueno') {
            redirectUrl = '/app-restaurante/dashboard-dueno.html';
        }

        if (redirectUrl) {
            console.log('Redirigiendo a:', redirectUrl);
            window.location.href = redirectUrl;
        }
    }
});

// Logout cuando cierre la pestaña
window.addEventListener('beforeunload', () => {
    if (!window.location.href.includes('dashboard')) {
        sessionStorage.clear();
    }
});
