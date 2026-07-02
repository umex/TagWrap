# XMLWrap

Fast, minimal Manifest V3 extension. Right-click selected text and instantly wrap it with XML-style tags **directly in the page** 

## How it works now

- Right-click any selection → see up to **3 direct** "Wrap with `<tag>`" options.
- A **"More XML tags"** submenu contains the **next 5** tags.
- Choosing any item **immediately replaces** the selected text with `<tag>…</tag>` on the page.
- Click the extension icon (or puzzle piece) to open **settings** and manage your tags.

## Settings (click the extension icon)

- Add / remove tags freely
- Drag order with ↑ ↓ buttons
- **Order is important**:
  - Positions 1–3 → appear as direct context menu items
  - Positions 4–8 → appear inside the "More XML tags" submenu
- Changes save automatically and update the right-click menu instantly.

## Default tags (you can change them)

```
error, code, instruction, context, example, question, output, note
```

## Installation

1. `chrome://extensions` → enable Developer mode
2. "Load unpacked" → select this folder
3. (Optional) Replace the placeholder icons in `/icons`

## Permissions used

- `contextMenus` — to show the right-click options
- `activeTab` + `scripting` — to perform the in-place replacement only on the tab you right-clicked
- `storage` — to remember your custom tag list

No data ever leaves your browser.

## Tips

- Works on most normal pages, textareas, and many contenteditable areas (ChatGPT, Claude, docs, etc.).
- Reorder tags in settings until your most-used ones are in the first three positions.
- Tags are lower-cased and cleaned automatically.

Built for people who wrap things in `<instruction>`, `<error>`, `<context>` etc. all day.
