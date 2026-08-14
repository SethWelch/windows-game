# Desktop wallpapers

Five ship with the machine, listed under Background in Display Properties. All are
Microsoft's Windows XP wallpapers — which puts them in a different category from the
rest of this project's imagery, and worth keeping straight:

- **These** are Microsoft's, reproduced here for fidelity in a personal recreation.
- The ad photographs in [`../components/Popups/images/`](../components/Popups/images/)
  are freely-licensed stock, with their own `SOURCES.md`.
- Everything in [`../components/Popups/adArt.tsx`](../components/Popups/adArt.tsx) and
  every file under [`icons/`](icons/) is original vector work drawn for this project.

| File | Name in the list | Size | Notes |
| --- | --- | --- | --- |
| `background.jpg` | Bliss | 1920×1543, 338 KB | The default. Resized from 2560×2058 at q60. Has a CSS approximation of itself underneath it in `styles/wallpaper.css`, which doubles as its loading state and its fallback. |
| `autumn.jpg` | Autumn | 1600×900, 571 KB | Resized from a 3840×2160, 3.9 MB upscale at q68. Dense foliage is JPEG's worst case, so this one costs more than the others for the same visible quality. |
| `Azul.webp` | Azul | 800×600, 74 KB | |
| `Red_moon_desert.webp` | Red moon desert | 800×600, 74 KB | |
| `Wind.webp` | Wind | 800×600, 22 KB | |

The three `.webp` files stay `.webp`. Every current browser reads it, Vite treats it as
an asset with no configuration, and re-encoding them to JPEG measured **1.4× larger** at
q80 and **1.8× larger** at q90 while also adding generational loss to an already-lossy
source — worse on both counts.

Importing all five in `os/wallpaper.ts` costs nothing at load: an image import compiles
to a URL string, so the bundler emits the files but the browser only fetches the one the
settings name.

## Resizing

Both JPEGs here are resized from larger originals, which have been deleted — there is no
second copy. If either ever needs redoing from scratch, the numbers that produced these
are in the table above, and the method was `sips -Z <width> -s format jpeg -s
formatOptions <q>`, with quality chosen by measuring per-pixel error against a
losslessly-resized reference rather than by eye.
