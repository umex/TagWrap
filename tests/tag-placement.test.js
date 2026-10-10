const { it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

function popup(data) {
  const dom = new JSDOM(fs.readFileSync("popup.html", "utf8"), { runScripts: "outside-only" });
  dom.window.chrome = {
    storage: {
      sync: {
        get(defaults, callback) { callback({ ...defaults, ...data }); },
        set(value) { Object.assign(data, JSON.parse(JSON.stringify(value))); }
      },
      onChanged: { addListener() {} }
    }
  };
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const script of dom.window.document.querySelectorAll("script[src]")) {
    dom.window.eval(fs.readFileSync(script.getAttribute("src"), "utf8"));
  }
  return dom.window;
}

it("cycles a badge through all placements and persists it across reopening", () => {
  const data = { tags: ["a", "b", "c", "d"] };
  const win = popup(data);
  for (const expected of ["submenu", "extra", "direct"]) {
    const badge = win.document.querySelector(".badge");
    assert.equal(badge.tagName, "BUTTON");
    badge.click();
    assert.equal(win.document.querySelector(".badge").textContent, expected);
    assert.equal(data.tagPlacements.a, expected);
    assert.equal(popup(data).document.querySelector(".badge").textContent, expected);
  }
});

it("keeps placements when reordered and starts new tags as extra", () => {
  const data = { tags: ["a", "b", "c", "d"] };
  const win = popup(data);
  const rows = win.document.querySelectorAll(".tag-item");
  const start = new win.Event("dragstart", { bubbles: true });
  start.dataTransfer = { setData() {} };
  rows[0].dispatchEvent(start);
  rows[3].dispatchEvent(new win.Event("drop", { bubbles: true, cancelable: true }));
  assert.deepEqual(Array.from(win.document.querySelectorAll(".badge"), b => b.textContent),
    ["direct", "direct", "submenu", "direct"]);
  win.document.getElementById("new-tag").value = "new";
  win.document.getElementById("add-btn").click();
  assert.equal(win.document.querySelector(".tag-item:last-child .badge").textContent, "extra");
});

it("keeps an empty tag list empty after reopening", () => {
  const win = popup({ tags: [] });
  assert.equal(win.document.querySelectorAll(".tag-item").length, 0);
});

async function menus(data) {
  const created = [];
  let changed;
  const context = vm.createContext({
    chrome: {
      contextMenus: { removeAll: async () => { created.length = 0; }, create: item => created.push(item), onClicked: { addListener() {} } },
      storage: { sync: { get: async defaults => ({ ...defaults, ...data }) }, onChanged: { addListener(fn) { changed = fn; } } },
      runtime: { onInstalled: { addListener() {} }, onStartup: { addListener() {} } }
    }
  });
  context.importScripts = (...paths) => paths.forEach(path => vm.runInContext(fs.readFileSync(path, "utf8"), context));
  vm.runInContext(fs.readFileSync("background.js", "utf8"), context);
  await vm.runInContext("rebuildContextMenus()", context);
  return { created, changed };
}

it("builds arbitrary direct and submenu counts and omits extra tags", async () => {
  const tags = Array.from({ length: 12 }, (_, i) => `tag${i}`);
  const tagPlacements = Object.fromEntries(tags.map((tag, i) => [tag, i < 4 ? "direct" : i < 11 ? "submenu" : "extra"]));
  const { created } = await menus({ tags, tagPlacements });
  assert.equal(created.filter(item => item.id.startsWith("wrap::") && !item.parentId).length, 4);
  assert.equal(created.filter(item => item.parentId).length, 7);
  assert.equal(created.some(item => item.id === "wrap::tag11"), false);
});

it("rebuilds menus when only placements change", async () => {
  const data = { tags: ["a"], tagPlacements: { a: "direct" } };
  const { created, changed } = await menus(data);
  data.tagPlacements.a = "extra";
  await changed({ tagPlacements: { newValue: data.tagPlacements } }, "sync");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(created.length, 0);
});

it("preserves legacy placements and allows an empty context menu", async () => {
  const legacy = await menus({ tags: ["a", "b", "c", "d", "e", "f", "g", "h", "i"] });
  assert.equal(legacy.created.filter(item => item.parentId).length, 5);
  assert.equal(legacy.created.some(item => item.id === "wrap::i"), false);
  assert.equal((await menus({ tags: [] })).created.length, 0);
});
