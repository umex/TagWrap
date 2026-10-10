# XMLWrap

Fast, minimal Manifest V3 extension. Right-click selected text and instantly wrap it with XML-style tags **directly in the page** 

## How it works now

- Right-click any selection → see the tags you set to **direct**.
- A **"More XML tags"** submenu contains the tags you set to **submenu**.
- Tags set to **extra** stay in settings and are hidden from the context menu.
- Choosing any item **immediately replaces** the selected text with `<tag>…</tag>` on the page.
- Click the extension icon (or puzzle piece) to open **settings** and manage your tags.

## Settings (click the extension icon)

- Add / remove tags freely
- Drag tags to reorder
- Click a tag's badge to cycle **direct → submenu → extra → direct**.
- Choose any number of tags for each placement. Dragging changes their order within each menu without changing their placement.
- Existing tags keep their previous placements; newly added tags start as **extra**.
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
- Set your most-used tags to **direct** and drag them into your preferred order.
- Tags are lower-cased and cleaned automatically.

Built for people who wrap things in `<instruction>`, `<error>`, `<context>` etc. all day.
