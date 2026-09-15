// content.js — XMLWrap
// Receives wrap requests from the background and performs in-place replacement
// of the current selection on the page. No modals, no overlays, minimal UI.

(() => {
  // Core replacement logic.
  // Supports:
  // - Regular page selections (most content, contenteditable, etc.)
  // - <textarea> and text <input> fields
  function wrapSelectionWithTag(tag) {
    if (!tag || typeof tag !== "string") return false;

    const cleanTag = tag.replace(/[<>\/\s]/g, "").trim();
    if (!cleanTag) return false;

    const active = document.activeElement;

    // === Textarea / text input support ===
    if (
      active &&
      (active.tagName === "TEXTAREA" ||
        (active.tagName === "INPUT" &&
          (active.type === "text" || active.type === "search" || !active.type)))
    ) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      const value = active.value ?? "";

      const before = value.slice(0, start);
      const selected = value.slice(start, end);
      const after = value.slice(end);

      if (!selected) return false;

      const wrapped = `<${cleanTag}>${selected}</${cleanTag}>`;
      active.value = before + wrapped + after;

      // Position cursor right after the closing tag
      const newPos = start + wrapped.length;
      try {
        active.selectionStart = active.selectionEnd = newPos;
        active.focus();
      } catch (_) {}
      return true;
    }

    // === Regular DOM selection (preserve existing formatting) ===
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return false;

    const doc = range.startContainer.ownerDocument || document;
    const htmlSnapshot = serializeWrappedHtml(doc, range.cloneContents(), cleanTag);

    try {
      const endNode = wrapRangeWithTag(range, cleanTag);

      sel.removeAllRanges();
      const afterRange = document.createRange();
      afterRange.setStartAfter(endNode);
      afterRange.collapse(true);
      sel.addRange(afterRange);

      return true;
    } catch (err) {
      try {
        document.execCommand("insertHTML", false, htmlSnapshot);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  // Listen for commands from the background service worker
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === "wrapAndReplace" && msg.tag) {
      wrapSelectionWithTag(msg.tag);
    }
  });
})();
