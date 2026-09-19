// Login del personal - usa el sistema compartido de auth.js

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usuarioInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberCheckbox = document.getElementById('remember');
const loginMessage = document.getElementById('loginMessage');
const submitBtn = loginForm.querySelector('.btn-login');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

// Login Handler
function handleLogin(e) {
    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value;

    if (!usuario || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    const resultado = Auth.login(usuario, password, rememberCheckbox.checked);

    if (!resultado.ok) {
        showError(resultado.error);
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }

    const { user } = resultado;
    const destino = Auth.dashboardFor(user.role);

    submitBtn.disabled = true;
    showSuccess(`✅ Bienvenido, ${user.name}`);

    // Cada rol entra a su propio panel
    setTimeout(() => location.replace(destino), 350);
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
    passwordInput.focus();
}

// Rellenar credenciales desde la tarjeta de demo
function activarAtajosDemo() {
    document.querySelectorAll('.demo-user').forEach(chip => {
        chip.addEventListener('click', () => {
            usuarioInput.value = chip.dataset.user;
            passwordInput.value = chip.dataset.pass;
            passwordInput.focus();
        });
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión, directo a su panel
    const user = Auth.getUser();
    if (user) {
        location.replace(Auth.dashboardFor(user.role));
        return;
    }

    activarAtajosDemo();

    // Auto-fill del usuario recordado
    const savedUser = Auth.rememberedUser();
    if (savedUser) {
        usuarioInput.value = savedUser;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    } else {
        usuarioInput.focus();
    }
});
