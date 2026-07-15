# Bleitor - Logística Industrial Inteligente

Este repositorio contiene la solución web estática premium de **Bleitor**, diseñada específicamente para la captación y cotización de servicios logísticos en el Gran Mendoza, Argentina.

## ✨ Características

- **Diseño Ultra Premium:** Paleta industrial en tonos azul oscuro, azul eléctrico y cian con efectos de glassmorphism y sombras neon.
- **Camino de Luces:** Un asistente interactivo (wizard) paso a paso en donde el usuario describe su necesidad logística de manera fluida y profesional.
- **Redirección Directa a WhatsApp:** Al completar el formulario, los datos se compilan en un mensaje estructurado y se redirige automáticamente al cliente al chat de WhatsApp de Pablo Carrasco Galdame (`+54 9 2617 09-4195`).
- **Favicon Personalizado:** Un mini logotipo vectorial integrado directamente en la cabecera HTML (en formato SVG).

---

## 🚀 Despliegue en GitHub Pages (Paso a Paso)

Dado que es un sitio estático de un solo archivo, desplegarlo en GitHub Pages es inmediato y 100% gratuito:

1. Asegúrate de que el archivo `index.html` y este `README.md` estén en la raíz de tu repositorio en GitHub (`maximoGs/Bleitor.github.io`).
2. Entra a tu repositorio en GitHub y ve a **Settings** (Configuración) > **Pages** en el menú izquierdo.
3. En la sección **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: Selecciona **`main`** (o `master`) y la carpeta **`/ (root)`**.
   - Haz clic en **Save**.
4. ¡Listo! En 1 o 2 minutos, GitHub publicará tu web. La URL oficial de tu sitio será:  
   👉 **`https://maximoGs.github.io/Bleitor.github.io/`** (o tu dominio de usuario principal si es un repositorio especial).

---

## ⚙️ Cómo Cambiar el Número de WhatsApp de Destino

Si en el futuro deseas cambiar el número de teléfono que recibe las cotizaciones:

1. Abre el archivo `index.html`.
2. Busca la función `sendToWhatsApp()`.
3. Edita la variable `targetPhone` con el nuevo número (debe incluir el código de país y área sin espacios, guiones ni el signo `+`):
   ```javascript
   const targetPhone = '5492617094195'; // Cambia por el nuevo número
   ```
4. Guarda los cambios y haz un push a tu repositorio de GitHub.
