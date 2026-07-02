// background.js — XMLWrap (Manifest V3 Service Worker)
// Dynamic context menu based on user settings.
// On menu click → tell the page to wrap + replace the selection in-place.

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
// First 3 tags → top-level items
// Next 5 tags → inside a "More XML tags" submenu
async function rebuildContextMenus() {
  await chrome.contextMenus.removeAll();

  const data = await chrome.storage.sync.get({ tags: DEFAULT_TAGS });
  const tags = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : DEFAULT_TAGS;

  const directTags = tags.slice(0, 3);
  const submenuTags = tags.slice(3, 8); // up to 5 more

  // Direct top-level items (first 3)
  for (const tag of directTags) {
    chrome.contextMenus.create({
      id: `wrap::${tag}`,
      title: `Wrap with <${tag}>`,
      contexts: ["selection"]
    });
  }

  // Submenu for the rest (if any)
  if (submenuTags.length > 0) {
    const parentId = "more-xml-tags";

    chrome.contextMenus.create({
      id: parentId,
      title: "More XML tags ▶",
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
  if (area === "sync" && changes.tags) {
    rebuildContextMenus();
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
        files: ["content.js"]
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
