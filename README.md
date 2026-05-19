# Flashcards

A tiny PWA flashcard app for PyTorch / ML concepts. Installable to the iOS or
Android home screen; works fully offline once installed.

## Use

Visit the site, then on iPhone Safari: **Share → Add to Home Screen**. After
the first load it caches itself and runs without network.

- **Reveal** (or space / enter) shows the answer.
- **Right** (1) — you knew it. Card resurfaces less often.
- **Wrong** (2) — you didn't. Card resurfaces ~3x sooner.
- **Don't care** (3) — permanently hidden until you reset stats.
- **Topic dropdown** — filter to one section, or All.
- **Reset stats** — wipe everything and start over.

Stats live in `localStorage`. Per browser, per device.

## Add cards

Edit `cards.js`. Each entry:

```js
{
  id: "unique-kebab-case",
  topic: "topic-name",
  q: "Question text.",
  a: "Answer text. Use \\n for line breaks. Code stays readable in <pre>."
}
```

- `id` must be unique across the file. It keys the stats.
- `topic` can be anything. New topic strings show up in the dropdown
  automatically.
- After editing, bump `VERSION` in `service-worker.js` so installed clients
  pick up the new cards.

## Pick logic

Cards are drawn with replacement, weighted by `(wrong + 1) / (right + 1)`.
Cards you've never seen default to weight 1. Cards you've got wrong float up;
cards you've got right sink. Just-shown card is excluded unless it's the only
one in the pool.

## Layout

```
index.html              # markup + PWA meta tags
app.js                  # ~180 lines: storage, queue, render, SW registration
cards.js                # the cards (assigned to window.CARDS)
styles.css              # dark theme
manifest.webmanifest    # PWA manifest
service-worker.js       # offline cache
icon-180.png            # apple-touch-icon
icon-512.png            # PWA icon
```

No backend, no build step, no dependencies.

## Local dev

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Service workers don't run from `file://`, only from `http(s)://`.
