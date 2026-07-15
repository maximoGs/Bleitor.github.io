# Bleitor - Sistema de Captación Logística e Inteligente

Este repositorio contiene la solución completa para **Bleitor**, un sistema de captación y cotización de servicios logísticos para el Gran Mendoza, Argentina. 

El proyecto consta de una interfaz de usuario web premium y un backend en Node.js/Express integrado con notificaciones inmediatas de WhatsApp para los socios fundadores (Maximo Gomez Saa y Pablo Carrasco Galdame).

---

## 🛠️ Ejecución Local

1. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
2. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre tu navegador en [http://localhost:3000](http://localhost:3000) para interactuar con la landing page y enviar pedidos.

---

## 🚀 Guía Rápida de Despliegue (4 Pasos)

Sigue estos cuatro sencillos pasos para tener el sistema completo en producción y funcionando de manera gratuita:

### Paso 1: Configurar y Desplegar el Backend en Render o Railway
1. Sube tu código (incluyendo `server.js`, `package.json` y `.env.example`) a un repositorio privado o público en GitHub.
2. Inicia sesión en **Render** (render.com) o **Railway** (railway.app) y conecta tu cuenta de GitHub.
3. Crea un nuevo **Web Service**:
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Define las variables de entorno en la configuración del servicio:
   * `PORT`: `3000` (o se asignará automáticamente)
   * `WHATSAPP_PROVIDER`: `local` (para escanear el QR en la consola de Render/Railway) o `api` (si usarás Twilio o una API HTTP).
   * Si usas Twilio (`WHATSAPP_PROVIDER=api`): Configura `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, y `TWILIO_FROM_NUMBER`.
   * Si usas whatsapp-web.js autónomo en Linux/Render, añade el buildpack de Puppeteer en la configuración para que el servidor tenga instalado Chromium y sus librerías compartidas.

### Paso 2: Desplegar el Frontend en GitHub Pages
1. El frontend está diseñado en un solo archivo autocontenido: `index.html`.
2. Para desplegarlo en GitHub Pages de forma independiente:
   * En tu repositorio de GitHub, ve a la pestaña **Settings** > **Pages**.
   * En la sección **Build and deployment**, selecciona la rama `main` (o `master`) y la carpeta `/` (root) y haz clic en **Save**.
   * GitHub te proporcionará una URL pública para tu web (ej. `https://tu-usuario.github.io/Bleitor/`).

### Paso 3: Conectar el Frontend con el Backend Desplegado
1. Una vez que tu backend en Render/Railway esté online, copia la URL pública generada (ej. `https://bleitor-backend.onrender.com`).
2. En tu archivo `index.html` del frontend, busca la función `fetch` que realiza el envío del formulario:
   * Cambia la ruta relativa `/api/pedidos` por la URL absoluta de tu backend desplegado:
     ```javascript
     // Cambiar esto:
     const response = await fetch('/api/pedidos', { ... })
     
     // Por la URL de tu servidor:
     const response = await fetch('https://bleitor-backend.onrender.com/api/pedidos', { ... })
     ```
3. Guarda, haz un commit y sube los cambios a tu repositorio de GitHub. Tu sitio en GitHub Pages se actualizará automáticamente.

### Paso 4: Escanear el QR de WhatsApp en el Backend
1. Si seleccionaste `WHATSAPP_PROVIDER=local` en el Paso 1:
   * Dirígete a los logs de consola de tu servicio web en la plataforma de despliegue (Render o Railway).
   * Al iniciar el servidor por primera vez, verás un código QR dibujado con caracteres ASCII.
   * Abre la aplicación de WhatsApp en tu dispositivo móvil, ve a **Dispositivos vinculados** > **Vincular un dispositivo** y escanea el QR de la consola.
   * ¡Listo! El sistema quedará autenticado y enviará notificaciones instantáneas de forma autónoma.
2. Si seleccionaste `WHATSAPP_PROVIDER=api`:
   * Verifica que las variables del paso 1 estén cargadas. La API se encargará del envío sin requerir escaneo de QR.
