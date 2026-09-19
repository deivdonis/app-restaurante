# 🍽️ App Restaurante - Mesa Digital

Una aplicación web moderna para restaurantes que permite a los clientes interactuar con el servicio desde su mesa.

## ✨ Características

- 📋 **Ver Carta** - Visualiza el menú completo con precios
- 🔔 **Llamar Camarero** - Solicita asistencia del personal
- 💳 **Pedir Cuenta** - Solicita la factura
- 🎤 **Reconocimiento de Voz** - Dicta tus peticiones (disponible en navegadores modernos)
- ✏️ **Peticiones de Texto** - Escribe comentarios o solicitudes especiales
- 💾 **Persistencia** - Guarda el número de mesa automáticamente

## 🔒 Zona de personal y acceso por roles

Todo el personal entra por `login-camareros.html` y **cada rol aterriza en su propio panel**:

| Usuario | Contraseña | Rol | Panel |
|---|---|---|---|
| camarero1 … camarero5 | 1234 | camarero | `dashboard-camarero.html` + `mapa.html` |
| gerente | gerente123 | gerente | `dashboard-gerente.html` |
| dueno | dueno123 | dueño | `dashboard-dueno.html` |

El sistema vive en **`auth.js`**, compartido por todas las páginas de personal. Sigue el
mismo modelo que el proyecto [soporte](https://github.com/deivdonis/soporte)
(`AuthContext` + `users.ts` + `ProtectedRoute`), traducido a JavaScript plano:

- `USERS` — lista de usuarios con `id`, `username`, `name`, `role`, `email`, `department`.
- `Auth.login(usuario, password, recordar)` valida y guarda el perfil **sin la contraseña**
  bajo la clave `restaurante-auth`: con "Recuérdame" en `localStorage` (la sesión sobrevive
  al cierre del navegador) y sin él en `sessionStorage`.
- `Auth.requireAuth()` — equivale a `<ProtectedRoute>`: exige sesión.
- `Auth.requireRole('camarero')` — equivale a `<AdminRoute>`: exige sesión **y** rol; si el
  rol no corresponde, redirige al panel que sí le toca (un gerente que abra el panel de
  camarero acaba en el suyo).
- `Auth.logout()` limpia ambos almacenamientos y vuelve al login.

El **mapa de mesas** no es accesible para los clientes: se llega a él desde el dashboard
de camarero y exige sesión con rol `camarero`.

> ⚠️ La autenticación es de **demostración**: usuarios y contraseñas están en `auth.js`,
> que se descarga en el navegador. Para producción hay que validar en un servidor.

## 🚀 Cómo Usar

1. Accede a la aplicación en tu navegador
2. (Opcional) Cambia el número de mesa con doble click
3. Usa los botones para:
   - Ver la carta del restaurante
   - Solicitar asistencia del camarero
   - Pedir la cuenta
   - Usar reconocimiento de voz o escribir peticiones especiales

## 🎨 Diseño

- Interfaz moderna y oscura
- Totalmente responsiva (funciona en móvil, tablet y desktop)
- Botones de acción intuitivos
- Modal para visualizar la carta
- Animaciones suaves

## 💻 Tecnologías

- HTML5
- CSS3
- JavaScript Vanilla
- Web Speech API para reconocimiento de voz

## 📱 Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles

**Nota:** El reconocimiento de voz requiere un navegador moderno (Chrome, Edge, etc.)

## 🔧 Instalación Local

```bash
git clone https://github.com/deivdonis/app-restaurante.git
cd app-restaurante
# Abre index.html en tu navegador
```

## 📄 Licencia

MIT

---

Hecho con ❤️ para restaurantes modernos
