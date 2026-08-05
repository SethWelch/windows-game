# windows-game

A Windows XP desktop, rebuilt in the browser. Frontend only — React 19 + Vite +
TypeScript, plain CSS, zero runtime dependencies beyond React itself.

Every pixel of chrome is hand-drawn: the Luna titlebars, taskbar, and Start
button are CSS gradients, and every icon is an inline SVG component. No XP
bitmaps ship with this project.

```sh
npm install
npm run dev
```

## What's here

- **Window manager** — drag by the titlebar, resize from all 8 edges and
  corners, focus/raise, minimize, maximize (double-click the titlebar), close.
- **Desktop** — Bliss-style wallpaper, right-click menu, and rubber-band selection:
  drag a box over icons, Ctrl-click to add or remove, then drag or delete the whole
  group. Drop onto a folder to move, onto the Recycle Bin to delete.
- **Recycle Bin** — deleting from the desktop or Explorer moves the item here with
  its original location and date, and Restore puts it back. Emptying is the only
  thing that actually destroys anything. It also holds objects that belong to a
  *program* rather than the filesystem — see `src/os/discard.ts`, and the note on
  Solitaire below.
- **Turning it off and on again** — Turn Off Computer leaves the amber "safe to turn
  off" line on a black screen with a power button under it. Pressing that runs a
  1998-flavoured POST — and it reports your actual machine: cores, RAM, storage quota
  and usage, connection bandwidth and ping, platform and user agent, all read off the
  browser (`src/components/Boot/specs.ts`). It waits for ENTER, or M to start with the
  sound off, then `Starting Windows XP...` and the desktop. The machine comes up with
  nothing running on it.
- **SPAM** — a desktop icon that does exactly what it says. Double-click it and
  fifteen pop-up advertisements arrive over the next few seconds, scattered across
  the desktop, all invented nonsense from 2001. They aren't windows: no titlebar, no
  taskbar button, their own layer above the windows and below the taskbar. Each one
  closes on its X, Escape closes the lot, and the SpamBot window it leaves behind has
  a live count and a Remove All. Clicking an advertisement gets you another
  advertisement, which was always the deal.
- **A shell you can delete** — My Computer is the one seeded item that Delete will
  accept. Empty the Recycle Bin with it inside and Windows won't come back: you get a
  DOS prompt, which tells you to type `WINDOWS`. `HELP` lists the rest, `RESTORE`
  puts the icon back, and `RESTART` always works, because the boot state is the one
  thing here that isn't persisted.
- **Taskbar** — Start menu with All Programs, task buttons that track window
  state, system tray with a live clock and a working volume control.
- **Sound** — every tone is synthesised at runtime by `src/os/audio.ts`; no audio
  files ship with this project. Message boxes, minimize/maximize, emptying the
  Recycle Bin and an incoming AIM message all make a noise, and the tray speaker
  sets the level or mutes it. Right-click a program for Send To ▸ Desktop
  and Pin/Unpin; the pinned list is yours and persists.
- **Notepad** — working menus, Word Wrap, Ln/Col status bar, and Save/Open
  against a virtual `My Documents` persisted in `localStorage`.
- **Minesweeper** — the full game: three presets plus Custom Field, `?` marks,
  chording, LED counters, the four smiley moods, and a persisted Fastest Mine
  Sweepers table. Under All Programs.
- **Solitaire** — Klondike, with drag-and-drop, double-click to send a card home,
  Draw One/Three, Standard and Vegas scoring, timed play, one-level Undo, and four
  card backs. Cards are drawn with real pip layouts, not bitmaps. Cards can also be
  dragged out of the window and dropped on the Recycle Bin, which takes them out of
  play — restore one and it comes back on top of the deck, which is a way to unstick
  a dead deal. That is a bug, and it is meant to be.
- **Netscape Navigator** — Communicator 4's chrome, a throbber that flies while a
  page loads, Stop, session history under **Go**, and View Source. Two period
  websites that link to each other, written in the HTML people actually wrote:
  `<center>`, `<font>`, layout tables, `<blink>`, body colour attributes and a hit
  counter. Anything else you type gets a 1997 Apache 404 — except the hosts in
  `LIVE_HOSTS`, which Navigator really does go and fetch. `theoldnet.com` is
  bookmarked on the personal toolbar; its pages are fetched with `fetch()` and
  rendered as our own document, so the Location bar, Back and View Source keep
  working out there.
- **Windows Media Player** — the blue Corona look, with the feature bar, a working
  transport over an invented library, shuffle/repeat, and Bars and Waves
  visualizations that animate entirely in CSS. No audio device: Media Guide and
  Radio Tuner say so in their own words.
- **WordPad** — real rich text in a `contentEditable`: bold/italic/underline, font
  family and size, text colour, alignment, bullets, Date/Time, plus the toolbar,
  format bar, ruler and status bar as four independent View toggles. Saves `.rtf`
  into the virtual tree.
- **Paint** — ten working tools (pencil, brush, airbrush, eraser, line, rectangle,
  rounded rectangle, ellipse, fill, pick colour), the real 28-colour palette,
  right-drag to draw in the background colour, three levels of undo, Invert Colors,
  Flip/Rotate, Attributes, and `.bmp` files in the virtual tree.
- **Sound Recorder** — no microphone, but the waveform is real data: Add Echo,
  Reverse, and the volume and speed effects all transform it and you can see each
  one land. Records up to 60 seconds like the original, saves `.wav` files into the
  virtual tree, and reports a plausible byte count under File ▸ Properties.
- **Calculator** — Standard mode, memory keys, keyboard entry, digit grouping,
  and the display-based state machine calc.exe actually had, quirks included.
- **Command Prompt** — `dir`, `cd`, `type`, `md`, `del`, `copy`, `move`, `ren`,
  `tree`, `echo > file` and about a dozen more, all operating on the same virtual
  filesystem Explorer and Notepad use. Command history and tab completion work.
- **AOL Instant Messenger** — sign on with any screen name, then a buddy list of
  seven people who answer. Each conversation is its own window; buddies type at
  their own speed, go away, and one of them IMs you first. Away messages, the
  B/I/U colour bar, and emoticons that turn into faces.

## Architecture

| Path | Role |
| --- | --- |
| `src/os/windowStore.ts` | The window manager. A tiny external store read via `useSyncExternalStore`. |
| `src/os/apps.ts` | `APP_LIST` — the single edit point for adding an app. |
| `src/apps/aim/store.ts` | AIM's session, shared across windows. The pattern to copy when one app owns several windows. |
| `src/os/dnd.ts` | What dropping one shell item onto another means. Shared by the desktop and Explorer so the rules can't drift. |
| `src/os/boot.ts` | Windows, or the DOS prompt it falls back to. Not persisted, so a reload is always a way out. |
| `src/os/audio.ts` | Volume, mute, and every sound the shell makes — oscillators and envelopes, built at runtime. |
| `src/os/startMenu.ts` | The pinned programs list. `startMenuSection: 'pinned'` only seeds it; pinning is a user decision, so it can't live in code. |
| `src/apps/netscape/sites.ts` | The two websites, plus Navigator's default stylesheet. The grey canvas belongs to the browser, not the pages. |
| `src/hooks/useWindowGesture.ts` | Pointer-capture drag/resize. Writes to the DOM during the gesture and commits to the store once on release, so a drag costs one render. |
| `src/styles/tokens.css` | Every XP colour and font stack. |
| `src/components/ui/MenuBar.tsx` | Declarative XP menus, shared with `ContextMenu`. |

### Wallpaper

`src/images/background.jpg` is 2560×2058, ~996 KB — downscaled from a 4510×3627
original (2.5 MB), which was ~4× more pixels than a 1440p display can show:

```sh
sips -Z 2560 --setProperty formatOptions 80 in.jpg --out background.jpg
```

`.xp-wallpaper` layers the photo over a CSS-gradient approximation of the same
scene, which serves as the load-in state and the fallback if the asset goes
missing. Don't drop the gradients when editing that rule.

### Adding an app

Create `src/apps/<name>/`, export an `AppDefinition` from its `index.ts`, and add
it to `APP_LIST`. Desktop icons, the Start menu, and window chrome all derive
from that one entry — including where it lands in All Programs, which comes from
`startMenuFolder: ['Accessories', 'Entertainment']` and nothing else.

Two conventions worth knowing before you edit:

- `windows[]` is kept in **creation order** and stacked with `zIndex`. Reordering
  it would remount app content — Notepad would lose the user's text.
- `overflow: hidden` belongs on `.xp-window-content`, never on `.xp-window`, so
  menu dropdowns can spill outside the frame the way real XP menus did.
- An app that owns more than one kind of window registers one `AppDefinition` per
  kind and leaves the extra ones out of `startMenuSection`/`showOnDesktop`, so the
  only way in is code — AIM's conversations open via `wm.openApp('aimIm', …)`.
  Anything those windows share belongs in a store beside them, not in a component.
- An app whose content has one correct size sets `resizable: false` and calls
  `wm.setSize`, which keeps the top-left corner put and slides the window back
  on-screen if it grew past the edge. Compute that size from constants the way
  `minesweeper/metrics.ts` does rather than measuring the DOM in an effect —
  measuring costs a commit, so the new board paints clipped for one frame.

## Scripts

```sh
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

## Not implemented

A logon chime — browsers won't let a page make noise before the user has clicked
something, so there is nothing to play it on. Sound Recorder still has no
microphone and Media Player no audio device: those are silent by design, not for
want of an audio path. Also boot/login screens, window snapping, Alt+Tab, taskbar
grouping, and layout persistence. Calculator has no Scientific mode, and the Command Prompt has
no pipes, wildcards or batch files — and `del` bypasses the Recycle Bin, as it
does for real. Paint's Select, Free-Form Select, Text, Magnifier, Curve and Polygon
are drawn in the tool box but greyed; its `.bmp` files hold a PNG data URL, since
nothing else in the shell decodes an image. WordPad's `.rtf` files hold HTML for the
same reason, and its Font, Paragraph and Tabs dialogs aren't built — the format bar
covers what they set. The desktop icon doesn't switch to the full bin when something is in
it: the empty one is real XP artwork, and a hand-drawn full one beside it would
look like a mistake. Solitaire has no
bouncing-card cascade on a win — just the dialog — and its court cards are ruled
letter panels rather than painted figures. Touch and small screens are out of
scope — this is mouse-first, and Minesweeper's chord in particular wants a real
two-button mouse (it also accepts a plain left-click on a satisfied number, which
the original didn't).
