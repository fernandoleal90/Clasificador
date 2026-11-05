# 🐾 Clasificador de Animales con Inteligencia Artificial

Aplicación web interactiva que utiliza un modelo de visión por computadora entrenado con **Google Teachable Machine** y ejecutado en el navegador con **TensorFlow.js**.

---

## 🎯 Animales Clasificados
1. 🦦 **Nutrias**
2. 🐧 **Pingüinos**
3. 🦭 **Focas**
4. 🐆 **Leopardos**

🔗 **Enlace al modelo:** [https://teachablemachine.withgoogle.com/models/_ow2ckGpd/](https://teachablemachine.withgoogle.com/models/_ow2ckGpd/)

---

## ✨ Características Principales

- **📹 Cámara Web en Vivo**: Clasificación en tiempo real cuadro a cuadro con indicador de confianza y efecto visual de escaneo.
- **📁 Subida de Imágenes**: Arrastra y suelta imágenes (`.png`, `.jpg`, `.webp`) o selecciónalas desde tu explorador de archivos.
- **📋 Pegado desde Portapapeles**: Presiona `Ctrl + V` en cualquier momento para clasificar capturas de pantalla o imágenes copiadas.
- **🖼️ Galería de Muestras Rápidas**: Prueba el clasificador con un solo clic usando fotos de muestra integradas.
- **📊 Barras de Probabilidad Dinámicas**: Visualización en porcentaje y colores representativos para cada clase.
- **🔊 Síntesis de Voz (Audio)**: Botón para activar o desactivar la lectura hablada del animal detectado en español.
- **💡 Ficha Informativa**: Curiosidades, hábitat y dieta del animal clasificado.
- **📜 Historial de Predicciones**: Registro temporal de los últimos animales detectados.

---

## 🚀 Cómo Ejecutar la Aplicación

### Método 1: Servidor Local (Recomendado para usar la Cámara Web)
Por políticas de seguridad de los navegadores modernos (Chrome, Edge, Firefox), el acceso a la cámara web (`getUserMedia`) requiere ejecutarse desde `http://localhost` o `https://`.

Puedes iniciar un servidor en la carpeta del proyecto con cualquiera de estas opciones:

#### Con Python:
```bash
python -m http.server 3000
```
Luego abre en tu navegador: [http://localhost:3000](http://localhost:3000)

#### Con Node.js / npx:
```bash
npx serve
```

#### Con la extensión Live Server de VS Code:
Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

---

### Método 2: Abrir directamente `index.html`
Si solo deseas probar subiendo imágenes desde tu computadora o mediante la pestaña de muestras, simplemente haz doble clic en el archivo `index.html` para abrirlo en cualquier navegador web.

---

## 🛠️ Tecnologías Utilizadas
- **HTML5 & CSS3 Moderno** (Diseño responsivo, Glassmorphism, animaciones fluidas).
- **JavaScript ES6+** (Async/Await, FileReader API, Web Speech API).
- **TensorFlow.js** (`@tensorflow/tfjs`).
- **Teachable Machine Image Library** (`@teachablemachine/image`).
- **FontAwesome & Google Fonts (Outfit, Plus Jakarta Sans)**.
