const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la raíz (para que index.html funcione localmente en localhost:3000)
app.use(express.static(path.join(__dirname)));

// Configurar destinatarios de notificaciones (socios)
const SOCIO_MAXIMO = process.env.SOCIO_MAXIMO_PHONE || '+5492614720776';
const SOCIO_PABLO = process.env.SOCIO_PABLO_PHONE || '+5492617094195';
const destinatarios = [SOCIO_MAXIMO, SOCIO_PABLO];

console.log('--- CONFIGURACIÓN DE NOTIFICACIONES BLEITOR ---');
console.log(`Proveedor seleccionado: ${process.env.WHATSAPP_PROVIDER || 'local (whatsapp-web.js)'}`);
console.log(`Socios a notificar: Maximo (${SOCIO_MAXIMO}), Pablo (${SOCIO_PABLO})`);
console.log('-----------------------------------------------\n');

// ==========================================
// 1. CONFIGURACIÓN DE PROVEEDOR DE WHATSAPP
// ==========================================

let localWhatsappClient = null;
let isLocalClientReady = false;

// Opción 1: Inicialización Autónoma (whatsapp-web.js)
if (!process.env.WHATSAPP_PROVIDER || process.env.WHATSAPP_PROVIDER === 'local') {
  try {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcode = require('qrcode-terminal');

    console.log('Iniciando proveedor autónomo whatsapp-web.js...');
    
    // Configuración para puppeteer (evitar problemas en Linux/Servidores)
    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    };

    // Si hay una ruta personalizada para Chromium en el servidor
    if (process.env.CHROMIUM_PATH) {
      puppeteerOptions.executablePath = process.env.CHROMIUM_PATH;
    }

    localWhatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
      }),
      puppeteer: puppeteerOptions
    });

    // Generar código QR en la consola
    localWhatsappClient.on('qr', (qr) => {
      console.log('\n====================================================================');
      console.log('🚨 SE REQUIERE AUTENTICACIÓN DE WHATSAPP 🚨');
      console.log('Escanea el siguiente código QR con la app de WhatsApp de tu celular:');
      console.log('====================================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n====================================================================\n');
    });

    localWhatsappClient.on('ready', () => {
      isLocalClientReady = true;
      console.log('✅ ¡Cliente de WhatsApp Web autónomo listo y conectado!');
    });

    localWhatsappClient.on('auth_failure', (msg) => {
      console.error('❌ Error de autenticación de WhatsApp Web:', msg);
    });

    localWhatsappClient.on('disconnected', (reason) => {
      isLocalClientReady = false;
      console.warn('⚠️ Cliente de WhatsApp Web desconectado. Motivo:', reason);
      // Intentar reconectar
      localWhatsappClient.initialize();
    });

    localWhatsappClient.initialize();

  } catch (error) {
    console.error('❌ Error al iniciar whatsapp-web.js. Verifica que las dependencias del sistema de Puppeteer estén instaladas:', error.message);
  }
}

// ==========================================
// 2. FUNCIONES DE ENVÍO DE WHATSAPP
// ==========================================

// Enviar vía whatsapp-web.js (Local)
async function sendWhatsAppLocal(numero, mensaje) {
  if (!localWhatsappClient || !isLocalClientReady) {
    throw new Error('El servicio local de WhatsApp no está listo aún. Escanea el código QR en la terminal.');
  }

  // Sanitizar número: mantener solo dígitos
  let cleaned = numero.replace(/\D/g, '');
  
  // Formatear como JID de WhatsApp (@c.us)
  const chatId = cleaned.endsWith('@c.us') ? cleaned : `${cleaned}@c.us`;
  
  await localWhatsappClient.sendMessage(chatId, mensaje);
  console.log(`[WhatsApp Local] Mensaje enviado con éxito a: ${numero}`);
}

// Enviar vía Twilio API
async function sendWhatsAppTwilio(numero, mensaje) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    throw new Error('Falta configuración de Twilio (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).');
  }

  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  // Sanitizar número para formato Twilio (E.164)
  let cleaned = numero.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  await client.messages.create({
    body: mensaje,
    from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
    to: `whatsapp:${cleaned}`
  });
  console.log(`[Twilio API] Mensaje enviado con éxito a: ${numero}`);
}

// Enviar vía API HTTP Genérica de Terceros (Axios)
async function sendWhatsAppHttpApi(numero, mensaje) {
  const url = process.env.HTTP_API_URL;
  const token = process.env.HTTP_API_TOKEN;

  if (!url) {
    throw new Error('Falta configuración del webhook/API externa (HTTP_API_URL).');
  }

  const axios = require('axios');
  
  // Sanitizar número: solo dígitos
  const cleaned = numero.replace(/\D/g, '');

  await axios.post(url, {
    to: cleaned,
    message: mensaje
  }, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
      'Content-Type': 'application/json'
    }
  });
  console.log(`[HTTP API] Mensaje enviado con éxito a: ${numero}`);
}

// Enrutador de envío
async function enviarWhatsApp(numero, mensaje) {
  const provider = process.env.WHATSAPP_PROVIDER || 'local';

  if (provider === 'local') {
    await sendWhatsAppLocal(numero, mensaje);
  } else if (provider === 'api') {
    // Si se configuró Twilio, priorizar Twilio. De lo contrario, intentar la API HTTP genérica.
    if (process.env.TWILIO_ACCOUNT_SID) {
      await sendWhatsAppTwilio(numero, mensaje);
    } else if (process.env.HTTP_API_URL) {
      await sendWhatsAppHttpApi(numero, mensaje);
    } else {
      throw new Error('Se configuró proveedor "api" pero no se encontraron variables de Twilio ni de HTTP API.');
    }
  } else {
    throw new Error(`Proveedor de WhatsApp no soportado: ${provider}`);
  }
}

// ==========================================
// 3. ENDPOINT DE PEDIDOS (POST /api/pedidos)
// ==========================================

app.post('/api/pedidos', async (req, res) => {
  const { nombre, email, telefono, descripcion } = req.body;

  // 1. VALIDACIÓN
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });
  }

  // Validación de email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Por favor, ingrese un email de contacto válido.' });
  }

  // Validación de teléfono simple (sólo dígitos, espacios, guiones y +, mínimo 8 dígitos)
  const cleanPhone = telefono ? telefono.replace(/[^\d+]/g, '') : '';
  if (!telefono || cleanPhone.length < 8) {
    return res.status(400).json({ success: false, error: 'Por favor, ingrese un número de teléfono válido (mínimo 8 dígitos).' });
  }

  if (!descripcion || descripcion.trim() === '') {
    return res.status(400).json({ success: false, error: 'La descripción del trabajo es obligatoria.' });
  }

  try {
    // 2. OBTENER HORA LOCAL DE GRAN MENDOZA, ARGENTINA
    const formatOptions = {
      timeZone: 'America/Argentina/Mendoza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('es-AR', formatOptions);
    const fechaHoraMendoza = formatter.format(new Date());

    // 3. CONSTRUIR ESTRUCTURA DEL MENSAJE DE WHATSAPP
    const mensajeWhatsApp = `🚨 *NUEVO PEDIDO EN BLEITOR* 🚨

👤 *Cliente:* ${nombre.trim()}
📧 *Email:* ${email.trim()}
📞 *Teléfono:* ${telefono.trim()}

📝 *Detalle del Trabajo:*
${descripcion.trim()}

📅 *Fecha/Hora:* ${fechaHoraMendoza}`;

    // 4. DISPARAR NOTIFICACIONES EN PARALELO (Promise.all)
    console.log(`[Pedido Recibido] Procesando notificaciones para ${destinatarios.length} socios...`);
    
    // Mapeamos los envíos a promesas para ejecutarlas concurrentemente
    const promesasEnvio = destinatarios.map(socioNumber => 
      enviarWhatsApp(socioNumber, mensajeWhatsApp)
        .catch(err => {
          // Loggear el error de un socio en particular pero no interrumpir la promesa de los demás
          console.error(`❌ Error al notificar al socio ${socioNumber}:`, err.message);
          return { error: true, socio: socioNumber, message: err.message };
        })
    );

    const resultados = await Promise.all(promesasEnvio);
    
    // Verificar si fallaron todos los envíos o solo algunos
    const errores = resultados.filter(r => r && r.error);
    if (errores.length === destinatarios.length) {
      // Si fallaron absolutamente todos los envíos de notificaciones
      throw new Error(`No se pudo enviar ninguna notificación por WhatsApp. Detalle del primer error: ${errores[0].message}`);
    }

    // Responder con éxito
    return res.status(200).json({
      success: true,
      message: 'Pedido registrado con éxito. Socios notificados.',
      timestamp: fechaHoraMendoza,
      details: {
        alertasFallidas: errores.map(e => e.socio)
      }
    });

  } catch (error) {
    console.error('❌ Error en el procesamiento del pedido:', error);
    return res.status(500).json({
      success: false,
      error: 'Ocurrió un error al procesar el pedido y enviar las notificaciones.',
      details: error.message
    });
  }
});

// Ruta raíz que confirma funcionamiento si se accede directo por navegador
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    brand: 'Bleitor Logistics',
    whatsapp_provider: process.env.WHATSAPP_PROVIDER || 'local',
    local_whatsapp_connected: isLocalClientReady,
    timezone: 'America/Argentina/Mendoza',
    timestamp: new Date().toISOString()
  });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`💡 Para enviar un pedido, realiza un POST a http://localhost:${PORT}/api/pedidos`);
});
