const assets = {
  azul: [
    "azul_a1_g55-6.webp",
    "azul_a2_g65-1.webp",
    "azul_a3_g56-5.webp",
    "azul_a4_g12-2-4.webp",
    "azul_a5_g10-3-3.webp",
    "azul_b1_g57-7.webp",
    "azul_b2_g13-5-4.webp",
    "azul_b3_g58-4.webp",
    "azul_b4_g14-2-5.webp",
    "azul_b5_g36-9.webp",
    "azul_c1_g59-3.webp",
    "azul_c2_g66-3.webp",
    "azul_c3_g60-2.webp",
    "azul_c4_g16-3-8.webp",
    "azul_c5_g33-7.webp"
  ],
  preto: [
    "preto_a1_g208.webp",
    "preto_a2_g212.webp",
    "preto_a3_g233.webp",
    "preto_a4_g211.webp",
    "preto_a5_g234.webp",
    "preto_b1_g112.webp",
    "preto_b2_g204.webp",
    "preto_b3_g115.webp",
    "preto_b4_g205.webp",
    "preto_b5_g232.webp",
    "preto_c1_g201.webp",
    "preto_c1_g206.webp",
    "preto_c3_g213.webp",
    "preto_c4_g207.webp",
    "preto_c5_g225.webp"
  ]
};

const filters = {
  type: [
    ["todos", "Todos"],
    ["a", "A"],
    ["b", "B"],
    ["c", "C"],
    ["d", "D"]
  ],
  gender: [
    ["todos", "Todos"],
    ["homem", "Homem"],
    ["mulher", "Mulher"],
    ["ambos", "Ambos"]
  ],
  position: [
    ["todos", "Todos"],
    ["perto", "Perto"],
    ["longe", "Longe"]
  ]
};

const state = {
  view: "azul",
  type: "todos",
  gender: "todos",
  position: "todos",
  compareMode: false,
  selected: new Set()
};

const gallery = document.querySelector("#galeria");
const grid = document.querySelector("#galleryGrid");
const title = document.querySelector("#galleryTitle");
const summary = document.querySelector("#activeSummary");
const modal = document.querySelector("#imageModal");
const modalTitle = document.querySelector("#modalTitle");
const modalImage = document.querySelector("#modalImage");
const modalStage = document.querySelector("#modalStage");
const compareToggle = document.querySelector("#compareToggle");
const compareMessage = document.querySelector("#compareMessage");
const compareRun = document.querySelector("#compareRun");
const galleryArea = document.querySelector(".gallery-area");
const compareModal = document.querySelector("#compareModal");
const compareStage = document.querySelector("#compareStage");

let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };

function parseItem(color, file) {
  const match = file.match(/^(azul|preto)_([a-d])(\d)/i);
  const type = match ? match[2].toLowerCase() : "";
  const number = match ? match[3] : "";
  const label = type && number ? `${type}${number}`.toUpperCase() : file;
  const code = `${type}${number}`;

  return {
    color,
    file,
    type,
    number,
    code,
    label,
    gender: getGender(code),
    position: getPosition(code),
    thumb: `assets/mini/${file.replace(".webp", "_mini.webp")}`,
    full: `assets/arte_${color === "azul" ? "azul" : "preta"}/${file}`
  };
}

function getGender(code) {
  if (["a1", "a2", "b1", "b2", "c1", "c2"].includes(code)) return "homem";
  if (["a3", "a4", "b3", "b4", "c3", "c4"].includes(code)) return "mulher";
  if (["a5", "b5", "c5"].includes(code)) return "ambos";
  return "";
}

function getPosition(code) {
  if (["a1", "a3", "b1", "b3", "c1", "c3"].includes(code)) return "perto";
  if (["a2", "a4", "b2", "b4", "c2", "c4"].includes(code)) return "longe";
  return "";
}

const items = Object.entries(assets).flatMap(([color, files]) => files.map((file) => parseItem(color, file)));

function setupFilters() {
  Object.entries(filters).forEach(([group, options]) => {
    const row = document.querySelector(`[data-filter-group="${group}"]`);
    row.innerHTML = "";
    options.forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.dataset.group = group;
      button.dataset.value = value;
      button.textContent = label;
      button.addEventListener("click", () => {
        state[group] = value;
        render();
      });
      row.appendChild(button);
    });
  });
}

function setView(view) {
  state.view = view;
  state.type = "todos";
  state.gender = "todos";
  state.position = "todos";
  state.compareMode = false;
  state.selected.clear();
  gallery.hidden = false;
  document.body.classList.add("gallery-open");
  window.scrollTo({ top: 0, behavior: "auto" });
  render();
}

function getVisibleItems() {
  return items.filter((item) => {
    const viewMatch = state.view === "todos" || item.color === state.view;
    const typeMatch = state.type === "todos" || item.type === state.type;
    const genderMatch = state.gender === "todos" || item.gender === state.gender;
    const positionMatch = state.position === "todos" || item.position === state.position;
    return viewMatch && typeMatch && genderMatch && positionMatch;
  });
}

function render() {
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("is-active", state[chip.dataset.group] === chip.dataset.value);
  });

  const visible = getVisibleItems();
  title.textContent = state.view === "azul" ? "Artes azuis" : state.view === "preto" ? "Artes pretas" : "Todas as artes";
  summary.textContent = `${visible.length} imagem(ns) encontrada(s)`;
  grid.innerHTML = "";
  syncCompareUi();

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhuma imagem encontrada para este filtro.";
    grid.appendChild(empty);
    return;
  }

  const groupOrder = ["a", "b", "c", "d"];
  groupOrder.forEach((type) => {
    const groupItems = visible.filter((item) => item.type === type);
    if (!groupItems.length) return;

    const section = document.createElement("section");
    section.className = "collection-group";

    const heading = document.createElement("h2");
    heading.className = "group-title";
    heading.textContent = `Tipo ${type.toUpperCase()}`;
    section.appendChild(heading);

    const cards = document.createElement("div");
    cards.className = "cards";
    groupItems.forEach((item) => cards.appendChild(createCard(item)));
    section.appendChild(cards);
    grid.appendChild(section);
  });
}

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "art-card";
  card.dataset.key = item.file;
  card.setAttribute("aria-label", `Abrir imagem ${item.label}`);
  card.classList.toggle("is-selected", state.selected.has(item.file));

  const image = document.createElement("img");
  image.src = item.thumb;
  image.alt = item.label;
  image.loading = "lazy";
  image.decoding = "async";

  const label = document.createElement("span");
  label.textContent = item.label;

  const selectMark = document.createElement("span");
  selectMark.className = "select-mark";
  selectMark.textContent = state.selected.has(item.file) ? "✓" : "";

  card.append(image, selectMark, label);
  card.addEventListener("click", () => {
    if (state.compareMode) {
      toggleSelection(item);
      return;
    }
    openModal(item);
  });
  return card;
}

function toggleCompareMode() {
  state.compareMode = !state.compareMode;
  state.selected.clear();
  render();
}

function toggleSelection(item) {
  if (state.selected.has(item.file)) {
    state.selected.delete(item.file);
  } else if (state.selected.size < 4) {
    state.selected.add(item.file);
  } else {
    compareMessage.textContent = "Limite de 4 imagens para comparar.";
    return;
  }
  render();
}

function syncCompareUi() {
  document.body.classList.toggle("compare-mode", state.compareMode);
  compareToggle.classList.toggle("is-active", state.compareMode);
  compareToggle.setAttribute("aria-pressed", String(state.compareMode));
  galleryArea.classList.toggle("is-comparing", state.compareMode);
  compareMessage.hidden = !state.compareMode;
  compareRun.hidden = !state.compareMode;
  compareRun.disabled = state.selected.size < 2;
  compareMessage.textContent = state.selected.size
    ? `${state.selected.size}/4 selecionada(s). Escolha até 4 imagens para comparar.`
    : "Escolha até 4 imagens para comparar.";
}

function openCompareModal() {
  const selectedItems = items.filter((item) => state.selected.has(item.file));
  if (selectedItems.length < 2) return;
  compareStage.innerHTML = "";
  selectedItems.forEach((item) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = item.full;
    image.alt = item.label;
    const caption = document.createElement("figcaption");
    caption.textContent = item.label;
    figure.append(image, caption);
    compareStage.appendChild(figure);
  });
  compareModal.showModal();
}

function openModal(item) {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  modalTitle.textContent = item.label;
  modalImage.src = item.full;
  modalImage.alt = item.label;
  applyTransform();
  modal.showModal();
}

function applyTransform() {
  modalImage.style.setProperty("--zoom", zoom);
  modalImage.style.setProperty("--x", `${offsetX}px`);
  modalImage.style.setProperty("--y", `${offsetY}px`);
}

function changeZoom(delta) {
  zoom = Math.min(4, Math.max(0.6, Number((zoom + delta).toFixed(2))));
  applyTransform();
}

function resetZoom() {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  applyTransform();
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelector("#closeGallery").addEventListener("click", () => {
  gallery.hidden = true;
  state.compareMode = false;
  state.selected.clear();
  syncCompareUi();
  document.body.classList.remove("gallery-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

compareToggle.addEventListener("click", toggleCompareMode);
compareRun.addEventListener("click", openCompareModal);
document.querySelector("#compareClose").addEventListener("click", () => compareModal.close());
document.querySelector("#modalClose").addEventListener("click", () => modal.close());
document.querySelector("#zoomIn").addEventListener("click", () => changeZoom(0.2));
document.querySelector("#zoomOut").addEventListener("click", () => changeZoom(-0.2));
document.querySelector("#zoomReset").addEventListener("click", resetZoom);

modalStage.addEventListener("pointerdown", (event) => {
  dragging = true;
  modalStage.setPointerCapture(event.pointerId);
  modalStage.classList.add("is-dragging");
  dragStart = { x: event.clientX, y: event.clientY, offsetX, offsetY };
});

modalStage.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  offsetX = dragStart.offsetX + event.clientX - dragStart.x;
  offsetY = dragStart.offsetY + event.clientY - dragStart.y;
  applyTransform();
});

modalStage.addEventListener("pointerup", () => {
  dragging = false;
  modalStage.classList.remove("is-dragging");
});

modalStage.addEventListener("wheel", (event) => {
  event.preventDefault();
  changeZoom(event.deltaY < 0 ? 0.12 : -0.12);
}, { passive: false });

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.open) modal.close();
});

setupFilters();
