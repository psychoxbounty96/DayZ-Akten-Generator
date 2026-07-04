// DayZ RP – Akten Generator
// Vollständig clientseitig: keine Speicherung, keine Datenbank, keine Serverkommunikation.

"use strict";

const CONFIG = {
  assetPath: "assets/akte_blank.png",

  // Alle Schreibpositionen liegen zentral hier.
  // Die Koordinaten beziehen sich auf das Originalbild: 1536 x 1152 px.
  positions: {
    subjectNumber: { x: 1055, y: 118 },
    name: { x: 905, y: 185 },
    talent1: { x: 850, y: 1020 },
    talent2: { x: 850, y: 1050 }
  },

  text: {
    fontFamily: '"Courier New", "Lucida Console", monospace',
    color: "#17130f",
    subjectFont: "700 28px",
    nameFont: "700 25px",
    talentFont: "700 24px",
    maxSubjectWidth: 190,
    maxNameWidth: 330,
    maxTalentWidth: 350
  }
};

const TALENTS = [
  "Sanitäter",
  "Mechaniker",
  "Handwerker",
  "Jäger",
  "Landwirt",
  "Fischer",
  "Schneider",
  "Schuhmacher",
  "Waffenschmied"
];

const elements = {
  form: document.querySelector("#recordForm"),
  subjectNumber: document.querySelector("#subjectNumber"),
  characterName: document.querySelector("#characterName"),
  talentList: document.querySelector("#talentList"),
  statusText: document.querySelector("#statusText"),
  createBtn: document.querySelector("#createBtn"),
  previewCanvas: document.querySelector("#previewCanvas")
};

const state = {
  blankImage: null
};

init();

async function init() {
  renderTalentCheckboxes();
  bindEvents();

  state.blankImage = await loadImage(CONFIG.assetPath);
  drawPreview();
  updateFormState();
}

function renderTalentCheckboxes() {
  elements.talentList.innerHTML = TALENTS.map((talent, index) => {
    const id = `talent-${index}`;

    return `
      <label class="talent-option" for="${id}">
        <input id="${id}" type="checkbox" value="${escapeHtml(talent)}" />
        <span>${escapeHtml(talent)}</span>
      </label>
    `;
  }).join("");
}

function bindEvents() {
  elements.form.addEventListener("input", () => {
    updateFormState();
    drawPreview();
  });

  elements.form.addEventListener("change", () => {
    enforceTalentLimit();
    updateFormState();
    drawPreview();
  });

  elements.form.addEventListener("submit", event => {
    event.preventDefault();

    const data = getFormData();

    if (!isValidRecord(data)) {
      showStatus("Bitte Namen, Subjektnummer und genau zwei Talente eintragen.", true);
      return;
    }

    downloadRecord(data);
  });
}

function getTalentCheckboxes() {
  return Array.from(elements.talentList.querySelectorAll('input[type="checkbox"]'));
}

function getSelectedTalents() {
  return getTalentCheckboxes()
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);
}

function enforceTalentLimit() {
  const selectedCount = getSelectedTalents().length;

  getTalentCheckboxes().forEach(checkbox => {
    checkbox.disabled = selectedCount >= 2 && !checkbox.checked;
  });
}

function updateFormState() {
  const data = getFormData();
  const valid = isValidRecord(data);

  elements.createBtn.disabled = !valid;

  if (data.talents.length < 2) {
    showStatus(`Noch ${2 - data.talents.length} Talent(e) auswählen.`, false);
  } else if (valid) {
    showStatus("Bereit zum Erstellen.", false);
  } else {
    showStatus("Bitte Name und Subjektnummer eintragen.", true);
  }
}

function showStatus(message, isError) {
  elements.statusText.textContent = message;
  elements.statusText.classList.toggle("error", isError);
}

function getFormData() {
  return {
    subjectNumber: elements.subjectNumber.value.trim(),
    name: elements.characterName.value.trim(),
    talents: getSelectedTalents()
  };
}

function isValidRecord(data) {
  return Boolean(data.subjectNumber && data.name && data.talents.length === 2);
}

function drawPreview() {
  if (!state.blankImage) return;

  const data = getFormData();
  const canvas = elements.previewCanvas;

  canvas.width = state.blankImage.naturalWidth;
  canvas.height = state.blankImage.naturalHeight;

  drawRecord(canvas, data);
}

function drawRecord(canvas, data) {
  const ctx = canvas.getContext("2d");
  const { positions, text } = CONFIG;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.blankImage, 0, 0);

  ctx.fillStyle = text.color;
  ctx.textBaseline = "alphabetic";

  writeText(ctx, data.subjectNumber, positions.subjectNumber, `${text.subjectFont} ${text.fontFamily}`, text.maxSubjectWidth);
  writeText(ctx, data.name, positions.name, `${text.nameFont} ${text.fontFamily}`, text.maxNameWidth);
  writeText(ctx, data.talents[0] ?? "", positions.talent1, `${text.talentFont} ${text.fontFamily}`, text.maxTalentWidth);
  writeText(ctx, data.talents[1] ?? "", positions.talent2, `${text.talentFont} ${text.fontFamily}`, text.maxTalentWidth);
}

function writeText(ctx, value, position, font, maxWidth) {
  if (!value) return;

  ctx.font = font;
  ctx.fillText(value, position.x, position.y, maxWidth);
}

function downloadRecord(data) {
  const canvas = document.createElement("canvas");

  canvas.width = state.blankImage.naturalWidth;
  canvas.height = state.blankImage.naturalHeight;

  drawRecord(canvas, data);

  const link = document.createElement("a");
  link.download = `Akte_${sanitizeFileName(data.name)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
    image.src = src;
  });
}

function sanitizeFileName(value) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_äöüÄÖÜß-]/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
