/**
 * Clasificador de Animales IA
 * Nutrias, Pingüinos, Focas y Leopardos
 * Powered by Google Teachable Machine & TensorFlow.js
 */

// Model URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/_ow2ckGpd/";

// Animal Metadata & Facts
const ANIMAL_DATA = {
  Nutrias: {
    name: "Nutria",
    plural: "Nutrias",
    emoji: "🦦",
    colorClass: "fill-nutrias",
    desc: "Mamíferos semiacuáticos conocidos por su gran inteligencia, comportamiento juguetón y habilidad para usar piedras como herramientas.",
    habitat: "Ríos, lagos de agua dulce y costas marinas",
    diet: "Peces, cangrejos, moluscos y anfibios"
  },
  Pinguinos: {
    name: "Pingüino",
    plural: "Pingüinos",
    emoji: "🐧",
    colorClass: "fill-pinguinos",
    desc: "Aves marinas no voladoras con alas evolucionadas como aletas para nadar a gran velocidad. Poseen plumaje denso que las protege de aguas heladas.",
    habitat: "Hemisferio Sur, Antártida, costas de Chile y Sudáfrica",
    diet: "Krill, calamares y pequeños peces"
  },
  Focas: {
    name: "Foca",
    plural: "Focas",
    emoji: "🦭",
    colorClass: "fill-focas",
    desc: "Mamíferos marinos adaptados para el buceo profundo con cuerpo hidrodinámico. Salen a tierra o a bloques de hielo para descansar y dar a luz.",
    habitat: "Aguas frías del Ártico, Antártida y costas templadas",
    diet: "Peces, calamares, crustáceos y pulpos"
  },
  Leopardos: {
    name: "Leopardo",
    plural: "Leopardos",
    emoji: "🐆",
    colorClass: "fill-leopardos",
    desc: "Félidos solitarios caracterizados por su patrón de rosetas en el pelaje, velocidad sigilosa y tremenda fuerza para subir presas a las copas de los árboles.",
    habitat: "Sabanas, selvas tropicales y montañas de África y Asia",
    diet: "Antílopes, gacelas, monos, liebres y roedores"
  }
};

// Application State
let model = null;
let maxPredictions = 0;
let classLabels = [];
let webcam = null;
let isWebcamRunning = false;
let isWebcamFlipped = true;
let isVoiceEnabled = false;
let lastSpokenClass = null;
let lastSpeechTime = 0;
let animationFrameId = null;

// DOM Elements
const statusPill = document.getElementById("model-status");
const statusText = document.getElementById("model-status-text");
const btnToggleCam = document.getElementById("btn-toggle-cam");
const btnFlipCam = document.getElementById("btn-flip-cam");
const btnCamText = document.getElementById("btn-cam-text");
const webcamContainer = document.getElementById("webcam-container");
const webcamPlaceholder = document.getElementById("webcam-placeholder");
const webcamScanner = document.getElementById("webcam-scanner");

const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("file-input");
const imagePreviewContainer = document.getElementById("image-preview-container");
const staticPreviewImg = document.getElementById("static-preview-img");
const btnRemoveImage = document.getElementById("btn-remove-image");

const probabilitiesContainer = document.getElementById("probabilities-container");
const topMatchCard = document.getElementById("top-match-card");
const winnerEmoji = document.getElementById("winner-emoji");
const winnerName = document.getElementById("winner-name");
const winnerConfidence = document.getElementById("winner-confidence");
const winnerCertainty = document.getElementById("winner-certainty");

const animalInfoCard = document.getElementById("animal-info-card");
const infoCardTitle = document.getElementById("info-card-title");
const infoCardDesc = document.getElementById("info-card-desc");
const infoHabitat = document.getElementById("info-habitat");
const infoDiet = document.getElementById("info-diet");

const btnSpeech = document.getElementById("btn-speech");
const historyList = document.getElementById("history-list");
const btnClearHistory = document.getElementById("btn-clear-history");
const tabButtons = document.querySelectorAll(".tab-btn");

// ==========================================================================
// Initialization & Model Loading
// ==========================================================================
async function initApp() {
  setupTabs();
  setupFileUpload();
  setupSampleCards();
  setupSpeechToggle();
  setupHistory();

  try {
    statusText.textContent = "Cargando modelo IA...";
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    // Load Teachable Machine model
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    classLabels = model.getClassLabels();

    // Model loaded successfully
    statusPill.className = "status-pill status-ready";
    statusText.textContent = "Modelo Activo";
    btnToggleCam.disabled = false;

    // Render initial probability bars placeholder
    renderInitialBars();
    console.log("Modelo cargado con éxito. Clases:", classLabels);
  } catch (error) {
    console.error("Error al cargar el modelo:", error);
    statusPill.className = "status-pill status-error";
    statusText.textContent = "Error al cargar modelo";
    alert("No se pudo cargar el modelo desde Teachable Machine. Revisa tu conexión a internet.");
  }
}

// Render the 4 progress bar cards
function renderInitialBars() {
  probabilitiesContainer.innerHTML = "";
  classLabels.forEach((label) => {
    const meta = ANIMAL_DATA[label] || {
      name: label,
      emoji: "🐾",
      colorClass: "fill-nutrias"
    };

    const row = document.createElement("div");
    row.className = "prob-row";
    row.id = `prob-row-${label}`;

    row.innerHTML = `
      <div class="prob-header">
        <span class="prob-label">
          <span>${meta.emoji}</span>
          <span>${meta.name}</span>
        </span>
        <span class="prob-percent" id="prob-val-${label}">0.0%</span>
      </div>
      <div class="prob-track">
        <div class="prob-fill ${meta.colorClass}" id="prob-bar-${label}" style="width: 0%"></div>
      </div>
    `;

    probabilitiesContainer.appendChild(row);
  });
}

// ==========================================================================
// Webcam Controls & Live Inferencing
// ==========================================================================
btnToggleCam.addEventListener("click", async () => {
  if (isWebcamRunning) {
    await stopWebcam();
  } else {
    await startWebcam();
  }
});

btnFlipCam.addEventListener("click", () => {
  isWebcamFlipped = !isWebcamFlipped;
  if (webcam && isWebcamRunning) {
    stopWebcam().then(() => startWebcam());
  }
});

async function startWebcam() {
  try {
    btnToggleCam.disabled = true;
    btnCamText.textContent = "Iniciando...";

    const size = 380;
    webcam = new tmImage.Webcam(size, size, isWebcamFlipped);

    // Request camera access
    await webcam.setup();
    await webcam.play();

    isWebcamRunning = true;
    btnToggleCam.disabled = false;
    btnFlipCam.disabled = false;
    btnToggleCam.classList.add("danger");
    btnCamText.textContent = "Detener Cámara";

    // Show scanner & canvas
    webcamScanner.classList.remove("hidden");
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);

    // Start predict loop
    animationFrameId = window.requestAnimationFrame(webcamLoop);
  } catch (err) {
    console.error("Error al acceder a la cámara:", err);
    btnToggleCam.disabled = false;
    btnCamText.textContent = "Iniciar Cámara";
    alert("No se pudo acceder a la cámara web. Asegúrate de otorgar los permisos necesarios en tu navegador.");
  }
}

async function stopWebcam() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (webcam) {
    try {
      await webcam.stop();
    } catch (e) {
      console.warn("Webcam stop warning:", e);
    }
  }

  isWebcamRunning = false;
  btnToggleCam.classList.remove("danger");
  btnCamText.textContent = "Iniciar Cámara";
  btnFlipCam.disabled = true;
  webcamScanner.classList.add("hidden");

  webcamContainer.innerHTML = `
    <div id="webcam-placeholder" class="placeholder-msg">
      <i class="fa-solid fa-camera"></i>
      <p>Presiona <strong>Iniciar Cámara</strong> para comenzar la clasificación en vivo</p>
    </div>
  `;
}

async function webcamLoop() {
  if (!isWebcamRunning) return;
  webcam.update();
  await predict(webcam.canvas, true);
  animationFrameId = window.requestAnimationFrame(webcamLoop);
}

// ==========================================================================
// Prediction Engine
// ==========================================================================
async function predict(imageSource, isLive = false) {
  if (!model) return;

  const predictions = await model.predict(imageSource);

  // Find winner
  let topPrediction = predictions[0];
  predictions.forEach((p) => {
    if (p.probability > topPrediction.probability) {
      topPrediction = p;
    }
  });

  // Update Progress Bars
  predictions.forEach((p) => {
    const percent = (p.probability * 100).toFixed(1);
    const barEl = document.getElementById(`prob-bar-${p.className}`);
    const valEl = document.getElementById(`prob-val-${p.className}`);
    const rowEl = document.getElementById(`prob-row-${p.className}`);

    if (barEl) barEl.style.width = `${percent}%`;
    if (valEl) valEl.textContent = `${percent}%`;

    if (rowEl) {
      if (p.className === topPrediction.className && topPrediction.probability >= 0.45) {
        rowEl.classList.add("winner");
      } else {
        rowEl.classList.remove("winner");
      }
    }
  });

  // Update Top Match Winner Box
  const topProb = topPrediction.probability;
  const topMeta = ANIMAL_DATA[topPrediction.className] || {
    name: topPrediction.className,
    plural: topPrediction.className,
    emoji: "🐾",
    desc: "Animal clasificado por el modelo de IA.",
    habitat: "No especificado",
    diet: "No especificado"
  };

  if (topProb >= 0.40) {
    topMatchCard.classList.remove("empty");
    winnerEmoji.textContent = topMeta.emoji;
    winnerName.textContent = topMeta.plural;
    winnerConfidence.textContent = `${(topProb * 100).toFixed(1)}% coincidencia`;

    // Certainty Badge
    if (topProb >= 0.80) {
      winnerCertainty.className = "certainty-badge high";
      winnerCertainty.textContent = "Certeza Alta";
    } else if (topProb >= 0.55) {
      winnerCertainty.className = "certainty-badge medium";
      winnerCertainty.textContent = "Certeza Media";
    } else {
      winnerCertainty.className = "certainty-badge low";
      winnerCertainty.textContent = "Certeza Baja";
    }

    // Animal Info Card
    animalInfoCard.classList.remove("hidden");
    infoCardTitle.textContent = `${topMeta.emoji} Información sobre ${topMeta.plural}`;
    infoCardDesc.textContent = topMeta.desc;
    infoHabitat.innerHTML = `<i class="fa-solid fa-earth-americas"></i> Hábitat: ${topMeta.habitat}`;
    infoDiet.innerHTML = `<i class="fa-solid fa-utensils"></i> Dieta: ${topMeta.diet}`;

    // Voice Feedback (throttled to avoid stutter in live video)
    if (isVoiceEnabled) {
      speakResult(topMeta.name, topProb, isLive);
    }

    // Add to history if it's a static image or a stable high confidence live detection
    if (!isLive) {
      addHistoryItem(topMeta.emoji, topMeta.name, (topProb * 100).toFixed(1));
    }
  } else {
    topMatchCard.classList.add("empty");
    winnerEmoji.textContent = "🔍";
    winnerName.textContent = "Buscando animal...";
    winnerConfidence.textContent = "Apunte la cámara a un animal";
    winnerCertainty.className = "certainty-badge";
    winnerCertainty.textContent = "Indeterminado";
    animalInfoCard.classList.add("hidden");
  }
}

// Voice synthesis in Spanish
function speakResult(animalName, prob, isLive) {
  const now = Date.now();
  if (isLive) {
    // Only speak once every 4 seconds or when animal changes
    if (lastSpokenClass === animalName && now - lastSpeechTime < 4000) return;
    if (prob < 0.70) return; // Only speak confident live classifications
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`¡Es un ${animalName}!`);
    utterance.lang = "es-ES";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    lastSpokenClass = animalName;
    lastSpeechTime = now;
  }
}

function setupSpeechToggle() {
  btnSpeech.addEventListener("click", () => {
    isVoiceEnabled = !isVoiceEnabled;
    btnSpeech.classList.toggle("active", isVoiceEnabled);
    btnSpeech.setAttribute("title", isVoiceEnabled ? "Desactivar voz" : "Activar lectura por voz");
    if (isVoiceEnabled && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance("Voz activada");
      u.lang = "es-ES";
      window.speechSynthesis.speak(u);
    }
  });
}

// ==========================================================================
// Static Image Handling (Upload, Drag-and-Drop, Clipboard Paste)
// ==========================================================================
function setupFileUpload() {
  // Drag and drop
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropArea.classList.remove("dragover");
    });
  });

  dropArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleImageFile(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  });

  btnRemoveImage.addEventListener("click", resetStaticPreview);

  // Global Paste from Clipboard (Ctrl+V)
  window.addEventListener("paste", (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        const file = item.getAsFile();
        if (file) {
          // Switch to upload tab automatically
          activateTab("upload-tab");
          handleImageFile(file);
          break;
        }
      }
    }
  });
}

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    processImageSrc(event.target.result);
  };
  reader.readAsDataURL(file);
}

function processImageSrc(src) {
  dropArea.classList.add("hidden");
  imagePreviewContainer.classList.remove("hidden");

  // Handle CORS for external images vs local data URLs
  if (src.startsWith("data:")) {
    staticPreviewImg.removeAttribute("crossorigin");
  } else {
    staticPreviewImg.setAttribute("crossorigin", "anonymous");
  }

  staticPreviewImg.onload = async () => {
    try {
      await predict(staticPreviewImg, false);
    } catch (err) {
      console.error("Error al clasificar imagen estática:", err);
    }
  };
  staticPreviewImg.src = src;
}

function resetStaticPreview() {
  fileInput.value = "";
  staticPreviewImg.src = "";
  imagePreviewContainer.classList.add("hidden");
  dropArea.classList.remove("hidden");
  renderInitialBars();

  topMatchCard.classList.add("empty");
  winnerEmoji.textContent = "🔍";
  winnerName.textContent = "Esperando imagen...";
  winnerConfidence.textContent = "0.0%";
  winnerCertainty.className = "certainty-badge";
  winnerCertainty.textContent = "En espera";
  animalInfoCard.classList.add("hidden");
}

// ==========================================================================
// Quick Sample Presets
// ==========================================================================
function setupSampleCards() {
  const cards = document.querySelectorAll(".sample-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");
      const targetUrl = card.dataset.url || (img ? img.src : null);
      if (targetUrl) {
        // Load in upload preview
        activateTab("upload-tab");
        processImageSrc(targetUrl);
      }
    });
  });
}

// ==========================================================================
// Tabs Navigation
// ==========================================================================
function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.dataset.tab;
      activateTab(targetTabId);
    });
  });
}

function activateTab(tabId) {
  tabButtons.forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.toggle("active", content.id === tabId);
  });

  // If user moves away from webcam tab, stop webcam to preserve performance
  if (tabId !== "webcam-tab" && isWebcamRunning) {
    stopWebcam();
  }
}

// ==========================================================================
// History Management
// ==========================================================================
function setupHistory() {
  btnClearHistory.addEventListener("click", () => {
    historyList.innerHTML = '<p class="history-empty">Historial limpiado.</p>';
  });
}

function addHistoryItem(emoji, animalName, percent) {
  const emptyMsg = historyList.querySelector(".history-empty");
  if (emptyMsg) {
    emptyMsg.remove();
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const item = document.createElement("div");
  item.className = "history-item";
  item.innerHTML = `
    <div class="history-item-left">
      <span>${emoji}</span>
      <strong>${animalName}</strong>
      <span class="history-item-time">${timeStr}</span>
    </div>
    <span class="top-match-confidence" style="font-size: 0.8rem">${percent}%</span>
  `;

  historyList.prepend(item);

  // Keep max 8 items
  while (historyList.children.length > 8) {
    historyList.removeChild(historyList.lastChild);
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
