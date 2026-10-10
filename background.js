// background.js — XMLWrap (Manifest V3 Service Worker)
// Dynamic context menu based on user settings.
// On menu click → tell the page to wrap + replace the selection in-place.
importScripts("tag-placement.js");

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

// Rebuilds the entire context menu from the current tag list in storage.
// Each tag has its own direct, submenu, or extra placement.
async function rebuildContextMenus() {
  await chrome.contextMenus.removeAll();

  const data = await chrome.storage.sync.get({ tags: DEFAULT_TAGS, tagPlacements: null });
  const tags = Array.isArray(data.tags) ? data.tags : DEFAULT_TAGS;
  const placements = normalizeTagPlacements(tags, data.tagPlacements);

  const directTags = tags.filter(tag => placements[tag] === "direct");
  const submenuTags = tags.filter(tag => placements[tag] === "submenu");

  // Direct top-level items
  for (const tag of directTags) {
    chrome.contextMenus.create({
      id: `wrap::${tag}`,
      title: `<${tag}>`,
      contexts: ["selection"]
    });
  }

  // Submenu for the rest (if any)
  if (submenuTags.length > 0) {
    const parentId = "more-xml-tags";

    chrome.contextMenus.create({
      id: parentId,
      title: "More XML tags ",
      contexts: ["selection"]
    });

    for (const tag of submenuTags) {
      chrome.contextMenus.create({
        id: `wrap::${tag}`,
        title: `<${tag}>`,
        parentId: parentId,
        contexts: ["selection"]
      });
    }
  }
}

// Ensure menus exist when extension is installed or browser starts
chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus();
});

chrome.runtime.onStartup?.addListener(() => {
  rebuildContextMenus();
});

// React to settings changes immediately
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.tags || changes.tagPlacements)) {
    return rebuildContextMenus();
  }
});

// Handle clicks from any context menu item
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId || typeof info.menuItemId !== "string") return;
  if (!info.menuItemId.startsWith("wrap::")) return;
  if (!tab?.id) return;

  const tag = info.menuItemId.split("::")[1];
  if (!tag) return;

  // Try to message an existing content script first
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: "wrapAndReplace",
      tag: tag
    });
  } catch (err) {
    // Not injected yet — inject on demand (activeTab permits this)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["wrap-selection.js", "content.js"]
      });

      // Give the script a moment to register its listener
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "wrapAndReplace",
          tag: tag
        }).catch(() => {});
      }, 80);
    } catch (injectErr) {
      console.warn("[XMLWrap] Failed to inject content script on this page:", injectErr);
    }
  }
});
