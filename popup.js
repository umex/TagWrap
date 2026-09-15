// popup.js — XMLWrap settings UI
// Manages the ordered list of tags stored in chrome.storage.sync.
// The background script listens for changes and rebuilds the context menus.

const DEFAULT_TAGS = [
  "error",
  "code",
  "instruction",
  "context",
  "example",
  "question",
  "output",
  "note"
];

let tags = [];
let dragFromIndex = null;

const listEl = () => document.getElementById("tag-list");
const inputEl = () => document.getElementById("new-tag");

function clearDropTarget() {
  listEl().querySelectorAll(".tag-item.drop-target").forEach((el) => {
    el.classList.remove("drop-target");
  });
}

function sanitizeTag(raw) {
  if (!raw) return "";
  return raw.trim().replace(/[<>\/\s]/g, "").toLowerCase();
}

function saveTags(newTags) {
  tags = newTags;
  chrome.storage.sync.set({ tags: newTags });
  render();
}

function render() {
  const container = listEl();
  container.innerHTML = "";

  if (tags.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "8px 10px";
    empty.style.color = "#71717a";
    empty.style.fontSize = "12px";
    empty.textContent = "No tags yet. Add some above.";
    container.appendChild(empty);
    return;
  }

  tags.forEach((tag, index) => {
    const row = document.createElement("div");
    row.className = "tag-item";

    // Badge showing position type
    const badge = document.createElement("span");
    badge.className = "badge";
    if (index < 3) {
      badge.textContent = "direct";
      badge.style.background = "#052e16";
      badge.style.color = "#4ade80";
    } else if (index < 8) {
      badge.textContent = "submenu";
    } else {
      badge.textContent = "extra";
    }

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = `<${tag}>`;

    const controls = document.createElement("div");
    controls.className = "controls";

    row.draggable = true;
    row.dataset.index = String(index);
    row.title = "Drag to reorder";

    row.addEventListener("dragstart", (e) => {
      if (!row.draggable) {
        e.preventDefault();
        return;
      }
      dragFromIndex = index;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", tag);
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      clearDropTarget();
      dragFromIndex = null;
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.className = "danger";
    delBtn.title = "Remove tag";
    delBtn.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      row.draggable = false;
      const restore = () => {
        row.draggable = true;
      };
      window.addEventListener("mouseup", restore, { once: true });
    });
    delBtn.onclick = () => {
      row.draggable = true;
      const copy = tags.filter((_, i) => i !== index);
      saveTags(copy);
    };

    controls.appendChild(delBtn);

    row.appendChild(badge);
    row.appendChild(name);
    row.appendChild(controls);

    container.appendChild(row);
  });
}

function addTag() {
  const val = sanitizeTag(inputEl().value);
  if (!val) return;

  if (tags.includes(val)) {
    // already exists — just focus and clear
    inputEl().value = "";
    inputEl().focus();
    return;
  }

  const copy = [...tags, val];
  saveTags(copy);
  inputEl().value = "";
  inputEl().focus();
}

function setupAdd() {
  const addBtn = document.getElementById("add-btn");
  const input = inputEl();

  addBtn.onclick = addTag;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  });
}

function setupReset() {
  const resetBtn = document.getElementById("reset-btn");
  resetBtn.onclick = () => {
    if (confirm("Reset tags to the default list?")) {
      saveTags([...DEFAULT_TAGS]);
    }
  };
}

function setupDragDrop() {
  const container = listEl();

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const row = e.target.closest(".tag-item");
    clearDropTarget();
    if (row && !row.classList.contains("dragging")) {
      row.classList.add("drop-target");
    }
  });

  container.addEventListener("dragleave", (e) => {
    if (!container.contains(e.relatedTarget)) {
      clearDropTarget();
    }
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    const row = e.target.closest(".tag-item");
    clearDropTarget();
    if (!row || dragFromIndex == null) return;
    const toIndex = Number(row.dataset.index);
    if (Number.isNaN(toIndex) || toIndex === dragFromIndex) return;
    saveTags(moveTag(tags, dragFromIndex, toIndex));
  });
}

function load() {
  chrome.storage.sync.get({ tags: DEFAULT_TAGS }, (data) => {
    tags = Array.isArray(data.tags) && data.tags.length ? [...data.tags] : [...DEFAULT_TAGS];
    render();
  });
}

// Keyboard: allow adding even if focus is weird
function setupGlobalKeys() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName === "BODY") {
      e.preventDefault();
      inputEl().focus();
    }
  });
}

function init() {
  load();
  setupAdd();
  setupReset();
  setupDragDrop();
  setupGlobalKeys();

  // Keep in sync if storage changes from elsewhere
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.tags) {
      tags = Array.isArray(changes.tags.newValue) ? [...changes.tags.newValue] : [...DEFAULT_TAGS];
      render();
    }
  });
}

init();
