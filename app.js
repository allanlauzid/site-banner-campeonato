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
const modalPrev = document.querySelector("#modalPrev");
const modalNext = document.querySelector("#modalNext");
const modalCompare = document.querySelector("#modalCompare");
const compareToggle = document.querySelector("#compareToggle");
const compareMessage = document.querySelector("#compareMessage");
const compareMessageText = document.querySelector("#compareMessageText");
const compareRun = document.querySelector("#compareRun");
const galleryArea = document.querySelector(".gallery-area");
const compareModal = document.querySelector("#compareModal");
const compareStage = document.querySelector("#compareStage");
const compareHd = document.querySelector("#compareHd");
const compareLoading = document.querySelector("#compareLoading");

let modalItems = [];
let modalIndex = 0;
let modalPan;

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

  card.append(image);
  if (state.compareMode) {
    const selectMark = document.createElement("span");
    selectMark.className = "select-mark";
    selectMark.textContent = state.selected.has(item.file) ? "✓" : "";
    card.appendChild(selectMark);
  }
  card.appendChild(label);
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

function deactivateCompareMode() {
  state.compareMode = false;
  state.selected.clear();
  render();
}

function toggleSelection(item) {
  if (state.selected.has(item.file)) {
    state.selected.delete(item.file);
  } else if (state.selected.size < 4) {
    state.selected.add(item.file);
  } else {
    compareMessageText.textContent = "Limite de 4 imagens para comparar.";
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
  compareMessageText.textContent = state.selected.size
    ? `${state.selected.size}/4 selecionada(s). Escolha até 4 imagens para comparar.`
    : "Escolha até 4 imagens para comparar.";
}

function openCompareModal(useHd = false) {
  const selectedItems = items.filter((item) => state.selected.has(item.file));
  if (selectedItems.length < 2) return;
  compareHd.disabled = useHd;
  compareStage.innerHTML = "";
  selectedItems.forEach((item) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = useHd ? item.full : item.thumb;
    image.dataset.full = item.full;
    image.alt = item.label;
    const caption = document.createElement("figcaption");
    caption.textContent = item.label;
    figure.append(image, caption);
    compareStage.appendChild(figure);
    createZoomPan(figure, image);
  });
  compareModal.showModal();
}

async function loadCompareHd() {
  const images = [...compareStage.querySelectorAll("img")];
  if (!images.length) return;
  compareLoading.hidden = false;
  compareHd.disabled = true;
  await Promise.all(images.map((image) => new Promise((resolve) => {
    const full = image.dataset.full;
    if (!full || image.src.endsWith(full)) {
      resolve();
      return;
    }
    const loader = new Image();
    loader.onload = () => {
      image.src = full;
      resolve();
    };
    loader.onerror = resolve;
    loader.src = full;
  })));
  compareLoading.hidden = true;
}

function openModal(item) {
  modalItems = getVisibleItems();
  modalIndex = Math.max(0, modalItems.findIndex((visibleItem) => visibleItem.file === item.file));
  showModalItem(modalItems[modalIndex] || item);
  modal.showModal();
}

function showModalItem(item) {
  modalTitle.textContent = item.label;
  modalImage.src = item.full;
  modalImage.alt = item.label;
  modalPan.reset();
  updateModalNav();
}

function updateModalNav() {
  const hasNavigation = modalItems.length > 1;
  modalPrev.disabled = !hasNavigation;
  modalNext.disabled = !hasNavigation;
}

function moveModal(direction) {
  if (modalItems.length < 2) return;
  modalIndex = (modalIndex + direction + modalItems.length) % modalItems.length;
  showModalItem(modalItems[modalIndex]);
}

function compareFromModal() {
  const item = modalItems[modalIndex];
  if (!item) return;
  modal.close();
  state.compareMode = true;
  state.selected.clear();
  state.selected.add(item.file);
  render();
}

function createZoomPan(stage, image) {
  const pan = {
    zoom: 1,
    x: 0,
    y: 0,
    pointers: new Map(),
    start: null
  };

  function apply() {
    image.style.setProperty("--zoom", pan.zoom);
    image.style.setProperty("--x", `${pan.x}px`);
    image.style.setProperty("--y", `${pan.y}px`);
  }

  function reset() {
    pan.zoom = 1;
    pan.x = 0;
    pan.y = 0;
    pan.pointers.clear();
    pan.start = null;
    stage.classList.remove("is-dragging");
    apply();
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function center(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function points() {
    return [...pan.pointers.values()];
  }

  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    stage.setPointerCapture(event.pointerId);
    pan.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.classList.add("is-dragging");

    const active = points();
    if (active.length === 1) {
      pan.start = { mode: "drag", x: event.clientX, y: event.clientY, offsetX: pan.x, offsetY: pan.y };
    } else if (active.length === 2) {
      const initialCenter = center(active[0], active[1]);
      pan.start = {
        mode: "pinch",
        distance: distance(active[0], active[1]),
        center: initialCenter,
        zoom: pan.zoom,
        offsetX: pan.x,
        offsetY: pan.y
      };
    }
  });

  stage.addEventListener("pointermove", (event) => {
    if (!pan.pointers.has(event.pointerId)) return;
    pan.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const active = points();

    if (active.length === 2) {
      const currentCenter = center(active[0], active[1]);
      if (!pan.start || pan.start.mode !== "pinch") {
        pan.start = {
          mode: "pinch",
          distance: distance(active[0], active[1]),
          center: currentCenter,
          zoom: pan.zoom,
          offsetX: pan.x,
          offsetY: pan.y
        };
      }
      const ratio = distance(active[0], active[1]) / Math.max(1, pan.start.distance);
      pan.zoom = Math.min(4, Math.max(0.6, Number((pan.start.zoom * ratio).toFixed(3))));
      pan.x = pan.start.offsetX + currentCenter.x - pan.start.center.x;
      pan.y = pan.start.offsetY + currentCenter.y - pan.start.center.y;
      apply();
      return;
    }

    if (active.length === 1 && pan.start?.mode === "drag") {
      pan.x = pan.start.offsetX + event.clientX - pan.start.x;
      pan.y = pan.start.offsetY + event.clientY - pan.start.y;
      apply();
    }
  });

  function endPointer(event) {
    pan.pointers.delete(event.pointerId);
    const active = points();
    if (!active.length) {
      stage.classList.remove("is-dragging");
      pan.start = null;
    } else if (active.length === 1) {
      pan.start = { mode: "drag", x: active[0].x, y: active[0].y, offsetX: pan.x, offsetY: pan.y };
    }
  }

  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 0.12 : -0.12);
  }, { passive: false });

  function zoomBy(delta) {
    pan.zoom = Math.min(4, Math.max(0.6, Number((pan.zoom + delta).toFixed(2))));
    apply();
  }

  return { reset, apply, zoomBy };
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelector("#closeGallery").addEventListener("click", () => {
  if (state.compareMode) {
    deactivateCompareMode();
    return;
  }
  gallery.hidden = true;
  document.body.classList.remove("gallery-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

compareToggle.addEventListener("click", toggleCompareMode);
compareRun.addEventListener("click", () => openCompareModal(false));
modalCompare.addEventListener("click", compareFromModal);
compareHd.addEventListener("click", loadCompareHd);
document.querySelector("#compareClose").addEventListener("click", () => compareModal.close());
document.querySelector("#modalClose").addEventListener("click", () => modal.close());
modalPrev.addEventListener("pointerdown", (event) => event.stopPropagation());
modalNext.addEventListener("pointerdown", (event) => event.stopPropagation());
modalPrev.addEventListener("click", (event) => {
  event.stopPropagation();
  moveModal(-1);
});
modalNext.addEventListener("click", (event) => {
  event.stopPropagation();
  moveModal(1);
});
document.querySelector("#zoomIn").addEventListener("click", () => modalPan.zoomBy(0.2));
document.querySelector("#zoomOut").addEventListener("click", () => modalPan.zoomBy(-0.2));
document.querySelector("#zoomReset").addEventListener("click", () => modalPan.reset());

window.addEventListener("keydown", (event) => {
  if (modal.open && event.key === "ArrowLeft") {
    event.preventDefault();
    moveModal(-1);
    return;
  }
  if (modal.open && event.key === "ArrowRight") {
    event.preventDefault();
    moveModal(1);
    return;
  }
  if (event.key === "Escape" && modal.open) {
    modal.close();
    return;
  }
  if (event.key === "Escape" && state.compareMode) {
    event.preventDefault();
    deactivateCompareMode();
  }
});

modalPan = createZoomPan(modalStage, modalImage);
setupFilters();
