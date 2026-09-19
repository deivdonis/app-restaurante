/*
 * auth.js - Sistema de acceso del personal
 *
 * Mismo modelo que el repo "soporte" (AuthContext + users.ts + ProtectedRoute),
 * traducido a JavaScript plano:
 *   - una lista de usuarios con su rol
 *   - una única clave de almacenamiento con el usuario de la sesión
 *   - "Recuérdame" => localStorage (persiste), si no => sessionStorage (se cierra al salir)
 *   - guardas de página equivalentes a ProtectedRoute / AdminRoute
 *
 * ⚠️ DEMO: las contraseñas viven en este archivo, que se descarga en el navegador.
 * Sirve para probar el flujo de roles, NO para producción. En una versión real el
 * login se valida en un servidor y devuelve un token.
 */

// Roles: 'camarero' | 'gerente' | 'dueno'
const USERS = [
    { id: 'u1', username: 'camarero1', password: '1234', name: 'Camarero 1', role: 'camarero', email: 'camarero1@restaurante.es', department: 'Sala' },
    { id: 'u2', username: 'camarero2', password: '1234', name: 'Camarero 2', role: 'camarero', email: 'camarero2@restaurante.es', department: 'Sala' },
    { id: 'u3', username: 'camarero3', password: '1234', name: 'Camarero 3', role: 'camarero', email: 'camarero3@restaurante.es', department: 'Sala' },
    { id: 'u4', username: 'camarero4', password: '1234', name: 'Camarero 4', role: 'camarero', email: 'camarero4@restaurante.es', department: 'Sala' },
    { id: 'u5', username: 'camarero5', password: '1234', name: 'Camarero 5', role: 'camarero', email: 'camarero5@restaurante.es', department: 'Sala' },
    { id: 'u6', username: 'gerente', password: 'gerente123', name: 'Gerente', role: 'gerente', email: 'gerencia@restaurante.es', department: 'Gerencia' },
    { id: 'u7', username: 'dueno', password: 'dueno123', name: 'Dueño', role: 'dueno', email: 'direccion@restaurante.es', department: 'Dirección' }
];

// Panel de inicio de cada rol
const DASHBOARDS = {
    camarero: 'dashboard-camarero.html',
    gerente: 'dashboard-gerente.html',
    dueno: 'dashboard-dueno.html'
};

const LOGIN_PAGE = 'login-camareros.html';
const STORAGE_KEY = 'restaurante-auth';

const Auth = {
    /**
     * Valida credenciales y abre sesión.
     * @returns {{ok: true, user: object} | {ok: false, error: string}}
     */
    login(username, password, remember = false) {
        const found = USERS.find(
            u => u.username === String(username || '').trim() && u.password === password
        );

        if (!found) {
            return { ok: false, error: 'Usuario o contraseña incorrectos' };
        }

        // La contraseña no se guarda en el almacenamiento del navegador
        const { password: _omitida, ...perfil } = found;
        const user = { ...perfil, lastLogin: new Date().toISOString() };

        // Recuérdame => persiste entre sesiones; si no, solo mientras la pestaña viva
        const storage = remember ? localStorage : sessionStorage;
        const otra = remember ? sessionStorage : localStorage;
        storage.setItem(STORAGE_KEY, JSON.stringify(user));
        otra.removeItem(STORAGE_KEY);

        return { ok: true, user };
    },

    /** Usuario de la sesión activa, o null. */
    getUser() {
        const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        try {
            const user = JSON.parse(stored);
            if (!user || !user.username || !DASHBOARDS[user.role]) throw new Error('sesión inválida');
            return user;
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    },

    isAuthenticated() {
        return this.getUser() !== null;
    },

    /** ¿La sesión actual tiene alguno de estos roles? */
    hasRole(roles) {
        const user = this.getUser();
        return !!user && [].concat(roles).includes(user.role);
    },

    /** Panel que le corresponde a un rol. */
    dashboardFor(role) {
        return DASHBOARDS[role] || LOGIN_PAGE;
    },

    /**
     * Equivalente a <ProtectedRoute>: exige sesión, sin importar el rol.
     * @returns {object|null} el usuario si puede pasar
     */
    requireAuth() {
        const user = this.getUser();
        if (!user) {
            location.replace(LOGIN_PAGE);
            return null;
        }
        return user;
    },

    /**
     * Equivalente a <AdminRoute>: exige sesión Y rol. Sin sesión va al login;
     * con el rol equivocado, al panel que sí le corresponde.
     * @param {string|string[]} rolesPermitidos
     * @returns {object|null} el usuario si puede pasar
     */
    requireRole(rolesPermitidos) {
        const user = this.requireAuth();
        if (!user) return null;

        if (![].concat(rolesPermitidos).includes(user.role)) {
            location.replace(this.dashboardFor(user.role));
            return null;
        }

        return user;
    },

    /** Cierra la sesión y vuelve al login. */
    logout() {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        location.replace(LOGIN_PAGE);
    },

    /** Usuario recordado en este dispositivo (para rellenar el formulario). */
    rememberedUser() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored).username : null;
        } catch {
            return null;
        }
    },

    /** Última entrada de la sesión actual, en formato legible. */
    ultimaEntrada() {
        const user = this.getUser();
        if (!user || !user.lastLogin) return null;
        return new Date(user.lastLogin).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    },

    /** Nombres de usuario de los demás camareros (para trasladar mesas). */
    otrosCamareros(excluir) {
        return USERS
            .filter(u => u.role === 'camarero' && u.username !== excluir)
            .map(u => u.username);
    },

    /** Nombre bonito de un usuario. */
    nombreDe(username) {
        const user = USERS.find(u => u.username === username);
        return user ? user.name : username;
    }
};

window.Auth = Auth;
