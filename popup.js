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

const listEl = () => document.getElementById("tag-list");
const inputEl = () => document.getElementById("new-tag");

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

    // Move up
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.title = "Move up";
    upBtn.disabled = index === 0;
    upBtn.onclick = () => {
      const copy = [...tags];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      saveTags(copy);
    };

    // Move down
    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.title = "Move down";
    downBtn.disabled = index === tags.length - 1;
    downBtn.onclick = () => {
      const copy = [...tags];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      saveTags(copy);
    };

    // Delete
    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.className = "danger";
    delBtn.title = "Remove tag";
    delBtn.onclick = () => {
      const copy = tags.filter((_, i) => i !== index);
      saveTags(copy);
    };

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
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
