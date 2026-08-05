# Icon artwork

Genuine Windows XP icons, extracted from a `shell32.dll`-style dump and kept at
their native sizes. [`Icon.tsx`](../../icons/Icon.tsx) globs this folder at build
time, so there is no import list to maintain — add or remove a file and it just
works.

## Naming

`<iconId>-<size>.ico` (or `.png`), where `<iconId>` matches a key in
[`icons/registry.ts`](../../icons/registry.ts):

| iconId | Sizes present | Used by |
| --- | --- | --- |
| `notepad` | 16, 32, 48 | desktop, titlebar, taskbar, Start menu |
| `recycleBin` | 16, 32, 48 | desktop, titlebar |
| `myComputer` | 16, 24, 32, 48 | Start menu, All Programs |
| `textFile` | 16, 32 | Open / Save As rows, Start menu |

A sizeless `<iconId>.ico` also works and is used at any requested size.

## Why one file per size

These are not downscales of each other — XP's 16px icons were pixel-edited by
hand. `Icon.tsx` prefers an exact size match, then the next size *up*, then the
largest available, so it never invents detail that wasn't there.

For the same reason, avoid **multi-frame** `.ico` files: nothing in HTML or CSS
can select which frame the browser uses, and Chrome and Safari tend to take the
largest and scale it down. Every file here is single-frame.

`textFile` deliberately reuses Notepad's artwork — that is what XP itself shows
for a `.txt` file.

## Fallbacks

Any `iconId` without a file here falls back to the hand-drawn SVG component in
[`src/icons/`](../../icons/). Those are still wired up, so partial sets are fine.
