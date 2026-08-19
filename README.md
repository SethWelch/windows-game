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
- **Desktop** — Bliss-style wallpaper, right-click menu with a working **Arrange Icons
  By** (Name, Size, Type, Modified — each sorting and reflowing column-major, the order XP
  filled the grid in). Type groups by what a thing *is* rather than by its node kind:
  every icon on a stock desktop is a shortcut, so grouping by kind would put all seven in
  one bucket and give the same answer as Name. System folders come first, then folders,
  then links, then documents named by extension — `typeLabel` in `src/os/fs.ts`, shared
  with Explorer's details pane and the Recycle Bin's Type column, **Auto Arrange** so the grid closes up behind every drop, and
  **Show Desktop Icons** to clear the lot. Align to Grid is ticked and greyed: every icon
  here lives in a cell, so there is no free positioning to align from. Plus rubber-band
  selection:
  drag a box over icons, Ctrl-click to add or remove, then drag or delete the whole
  group. Drop onto a folder to move, onto the Recycle Bin to delete.
- **Recycle Bin** — deleting from the desktop or Explorer moves the item here with
  its original location and date, and Restore puts it back. Emptying is the only
  thing that actually destroys anything. It also holds objects that belong to a
  *program* rather than the filesystem — see `src/os/discard.ts`, and the note on
  Solitaire below.
- **Switching off repairs the install** — Turn Off puts everything still in the bin back
  where it came from and rebuilds anything the machine shipped with that has been
  destroyed, so no amount of deleting leaves the desktop permanently broken. Only a real
  power-off does this: restarting, reloading the page, and `RESTART` at the DOS prompt
  all leave the damage alone, which is what makes switching off properly mean something.
  Files and folders *you* made are yours either way — they stay put, and one you
  destroyed for real by emptying the bin does not come back. The machine can only
  rebuild what it shipped with.
- **Turning it off and on again** — Turn Off Computer desaturates the whole desktop and
  raises the three-button panel, and the three genuinely differ. **Stand By** bugchecks
  with `DRIVER_POWER_STATE_FAILURE`, which is the real stop code for a device that
  wouldn't change power state and what these machines actually died of going into
  standby. **Restart** closes everything and runs the POST, repairing nothing — break
  the desktop and it is still broken on the other side. **Turn Off** powers down and
  puts the install right on the way out. Escape cancels.

  Turning off leaves the amber "safe to turn off" line on a black screen with a power
  button under it. Pressing that runs a
  1998-flavoured POST — and it reports your actual machine: cores, RAM, storage quota
  and usage, connection bandwidth and ping, platform and user agent, all read off the
  browser (`src/components/Boot/specs.ts`). It waits for ENTER, or M to start with the
  sound off, then `Starting Windows XP...` and the desktop. The machine comes up with
  nothing running on it.
- **SPAM** — a desktop icon that does exactly what it says. Double-click it and
  thirty-six pop-up advertisements arrive over the next few seconds, scattered across
  the desktop: forty-nine templates across four frames — a system dialog, a bare
  browser strip, a whole Internet Explorer window, and no frame at all — and
  twenty-four different body layouts, so no two look like the same program made them.
  You never get the same one twice; once all forty-nine are up, that's the ceiling.
  Twenty-eight carry a picture, seven sign themselves with an invented house mark, and
  nineteen refuse to sit still — a flashing wash over the content, a strobing frame,
  hues rolling through, or a banner scrolling forever. Three pretend to be a game you
  can win: two shooting galleries and a pick-a-box, none of which keep score, because
  whatever you hit gets you another advertisement. They aren't windows: no titlebar, no
  taskbar button, their own layer above the windows and below the taskbar. Each one
  closes on its X, Escape closes the lot, and the SpamBot window it leaves behind has a
  live count and a Remove All. Clicking an advertisement gets you another
  advertisement, which was always the deal. Filling the screen with all forty-nine
  bugchecks the machine, and the POST clears the layer and whatever was still queued to
  arrive — so a restart genuinely ends it rather than dropping you back into it.

  Imagery comes from two sets. Most slots take one of the ten photographs in
  [`images/`](src/components/Popups/images/) — freely-licensed stock, resized to 240px
  and reduced to a 128-colour palette, which is 96 KB for the set against 39 MB as
  supplied. [`images/SOURCES.md`](src/components/Popups/images/SOURCES.md) records what
  each one is. The rest is [`adArt.tsx`](src/components/Popups/adArt.tsx), original
  vector work covering the house marks, the system glyphs, and the few products no
  photograph here does: no real brands, nobody's likeness.
- **Bongo Buddy** — a desktop icon, like SPAM, and the same kind of mistake. Opening it
  installs a purple ape onto the wallpaper: he wanders about, blinks, glances around,
  swings his arms when he walks, and **talks out loud** through the browser's speech
  synthesis, which is as near as anything gets to the Microsoft Agent voice these
  shipped with. Which voice depends on your machine, so his window carries a Voice group
  picks the best it can find: Kathy on a Mac, one of the older compact voices — thin and
  clipped, which lands much closer to Agent than the modern high-quality ones do — or
  Zira or David on Windows, which have the same character. Never one of the novelty
  voices every Mac ships, and a machine with no speech engine at all just gets the
  balloons. The
  tray speaker silences him, because an assistant you can't mute would be a bug rather
  than a joke. Click him for a line, right-click for jokes, songs, and an
  offer to search the web that spawns advertisements. Hide works — for about six seconds.
  Roughly once a minute there's a chance he interferes on his own — and you can see it
  coming, because his eyes black out completely and whatever he says arrives in capitals
  until it's done. To close a window he says so, walks across the desktop, reaches up and
  presses the X — his palm lands on the
  button to the pixel, because the offset is derived from the artwork rather than
  eyeballed, and he uses the arm's *raised* position, which is thirty pixels of extra
  reach. A titlebar in the top 35px is out of his reach, so he picks a different window
  instead of closing one by telekinesis. Moving an icon is just as physical: he walks over,
  reaches down, holds it aloft in the same raised hand and marches it across the desktop
  before setting it down in a new cell. The icon rides his palm exactly — both are CSS
  transitions of identical duration, so they glide in step without either driving
  animation frames. Grab it off him mid-carry and he lets go.
  Announcing it first is the whole difference between a joke and a bug — and he won't touch a
  window with unsaved work in it, or Paint and Sound Recorder, which hold a document
  without marking the title for it.
  Uninstall never works: it refuses twice, and from the third attempt he starts bringing
  friends, up to four. A restart clears him and puts him straight back, because adding
  themselves to startup is the most accurate thing these ever did. A page reload is the
  one door he can't lock.

  He's original artwork rather than a copy of anyone: the originals were pre-rendered 3D
  sprite sheets, and this is vector, animated by CSS on separate groups — the arm swings
  from its shoulder, the eyelids drop over the eyes, the mouth stretches when he speaks.
- **Control Panel** — XP's category view, "Pick a category", with all nine categories and
  their compound icons (a palette *and* a brush, a clock *and* a calendar). It isn't an app
  of its own: the Control Panel was a shell folder, so it's a system folder inside My
  Computer and Explorer renders this body instead of a file list when you navigate there —
  which means the menu bar, toolbar, address bar, Back/Up and the task pane all work
  exactly as they do in any other folder, for free. The task pane swaps to Control Panel /
  See Also.

  **Appearance and Themes** works. It opens a category page rather than jumping straight to
  an applet, which is the whole idea of Category view: XP listed *tasks* phrased as things
  you wanted, with the applets underneath for anyone who already knew where to go. All four
  tasks are live and each lands on the right tab of Display Properties — "Choose a screen
  saver" opens it on Screen Saver, "Change the screen resolution" on Settings. The category
  is itself a folder under Control Panel, so Back and Up work without either page knowing
  the other exists. The other eight categories aren't wired yet, and aren't greyed for the
  same reason the Start menu's new entries aren't: greying marks what can't work, and these
  will.
- **Screen savers** — six of them, and they work: Blank, Starfield, Mystify, Beziers,
  Marquee and **3D Maze**. They come up on their own after the Wait you set and go away on
  any key, click or real mouse movement — a stationary mouse doesn't count, or the thing
  would dismiss itself the instant it appeared. The layer swallows whatever dismissed it, so
  the key that wakes the machine doesn't type into a Notepad behind it and the click doesn't
  press what was underneath.

  The maze is a raycaster, not a sprite loop: a 33×33 tile grid carved by a recursive
  backtracker, red brick with white mortar and a mustard ceiling as the original had, and a
  **cast floor** — pale speckled tiles with grout, in correct perspective, one division per
  screen row. Every texture is generated at runtime; no bitmaps ship. Perspective-correct
  with no cosine fudge, two-tone corners, barely any fog (the original had none — depth
  reads from the geometry), a head bob driven by distance walked, and rat posters on the odd
  wall. It heads for the END sign, and when it
  gets there it fades out and builds a new maze. Everything renders into a 480px buffer that
  CSS stretches up, which is both cheaper and more faithful — these ran on a CRT.
- **3D Maze** — the same engine with you steering instead. Arrow keys or WASD, a solved
  counter, and New Maze. Under All Programs ▸ Games.
- **A shell you can delete** — My Computer is the one seeded item that Delete will
  accept. Empty the Recycle Bin with it inside and Windows won't come back: you get a
  DOS prompt, which tells you to type `WINDOWS`. `HELP` lists the rest, `RESTORE`
  puts the icon back, and `RESTART` always works, because the boot state is the one
  thing here that isn't persisted.
- **A stop screen** — the real XP bugcheck, text mode and all, with the memory dump
  counting up before anything responds to a key. Two ways in, both deliberate: fill the
  screen with every advertisement there is (the wave brings thirty-six of the
  forty-nine, so the rest is on you), or end a critical process from the command prompt
  — `taskkill /f /im csrss.exe` is how you blue-screened XP on purpose, and it works
  here. Any key restarts, which runs the POST properly.
- **Display Properties** — right-click the desktop and choose Properties, the way
  everyone actually opened it, or find it under Control Panel in All Programs. Five tabs,
  and what's on them either works or is honestly greyed. It behaves like a real property
  sheet: every control edits a **draft**, so nothing reaches the desktop until you press
  **OK** or **Apply**, **Cancel** (and the titlebar X, as in XP) throws the lot away, and
  Apply greys itself when there is nothing pending. The little monitor previews the draft,
  which is the point of having one — including the Screen Saver tab's Preview button,
  which runs the saver you just picked rather than the one still applied. **Appearance** switches between
  all three of Luna's colour schemes — Default (blue), Olive Green, Silver — which reach
  the titlebars, taskbar, Start button, tray and menus, because getting there meant
  promoting the shell's own gradients into `styles/tokens.css` so a scheme could reach
  them at all. Font size does XP's three steps too. **Desktop** picks the background:
  five wallpapers that ship with the machine (Bliss, Autumn, Azul, Red moon desert,
  Wind), a plain colour, or *any image in the filesystem* — which makes Paint's
  `Set As Background (Tiled)` a real menu item instead of a greyed one. Draw something,
  set it, and the desktop points at that file: edit it again and the wall follows, delete
  it and it falls back to the colour. The little preview monitor on each tab is built
  from the same background builder and the same tokens as the real thing, so it can't
  drift from what you get. **Screen Saver** picks one of six, sets the
  wait in minutes, and Preview starts it for real; the little monitor runs the actual saver
  rather than showing a picture of one. Only its Settings button stays greyed — none of the
  savers have anything to configure. **Settings** reports the display it's actually running
  on.
- **Taskbar** — task buttons that track window state, system tray with a live clock and a
  working volume control.
- **Start menu** — two groups down the left, as XP had: your pinned programs, then the
  frequently-used list (a fixed order for now — the real one counted launches). Down the
  right, the full set of places in XP's order and grouping: My Documents, My Pictures, My
  Music, My Computer, Recycle Bin, My Recent Documents, then Control Panel and Printers
  and Faxes, then Search, Help and Support and Run. My Documents, My Computer and the
  Recycle Bin open, and so does **Control Panel**; the rest are **there to be looked at,
  not clicked** — deliberately not
  greyed, since greying is how this project marks something that can't work and these are
  things that will. Right-click any program for Send To ▸ Desktop and Pin/Unpin; the
  pinned list is yours and persists. If a write stops
  reaching `localStorage` — Paint saves each canvas as a data URL, and a few of those
  will exhaust the quota — a warning appears in the tray and raises a balloon tip
  saying so. Everything keeps working from memory; the point is that it no longer
  says it saved when it didn't.
- **Sound** — every tone is synthesised at runtime by `src/os/audio.ts`; no audio
  files ship with this project. Message boxes, minimize/maximize, emptying the
  Recycle Bin and an incoming AIM message all make a noise, and the tray speaker
  sets the level or mutes it.
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
  working out there. `theoldnet.com/get` is a front end to the Wayback Machine and
  answers with a redirect, so the document is based on where the response *came from*
  rather than what was asked for — otherwise every relative link and image on an
  archived page resolves against theoldnet and clicking one takes you off the archive.
- **Netscape Composer** — Communicator's HTML editor, and the item in Navigator's
  **Communicator** menu that used to be greyed out. Source on one side, the rendered
  page on the other, over a divider you can drag; or **Pop Out Preview** and the page
  gets its own window you can size to whatever you are designing for. HTML and a
  Style Sheet tab, no scripting. The preview is built through Navigator's own default
  stylesheet, so a draft cannot look one way in the editor and another way in the
  browser. The real Composer was WYSIWYG and had no idea what CSS was — both
  departures are commented where they are made.
- **Windows Media Player** — the blue Corona look, with the feature bar, shuffle/repeat,
  and four visualizations. **The library is real music.** Five public-domain pieces — Bach's
  Prelude in C, Pachelbel's Canon, Für Elise, Ode to Joy and the tune Mozart varied in
  K. 265 — written out as notes in `music/pieces.ts` and played by two oscillators and an
  a falling filter — a struck string the way a subtractive synth builds one, which is roughly
  what a PC without a wavetable card sounded like. No `.mid`
  files and no soundfont: the project still ships no binary assets, and a hand transcription
  of a public-domain composition is nobody else's arrangement. That makes the transport
  honest — the seek bar seeks, the clock is read off the audio clock rather than counted,
  and the length of a track is how long it takes to play.
  **Skin Chooser works**: five skins — Corona (the blue it ships in), a brushed-silver
  Roundlet, gold Pyrite, violet Headspace and green QuickPlay — chosen from a list with a
  live preview, and remembered. They are palettes rather than the bitmap-and-XML bundles
  the real ones were, which is the honest CSS equivalent: every colour in the player is
  one hue at some saturation and lightness, each keeping its own offset from the base, so
  a skin is three numbers and the highlights stay highlights. Copy from CD and Copy to CD
  are gone from the feature bar — there is no drive and never will be, and a permanently
  dead button is worse than no button.

  **Ambience** is the smoky one, built the way the real ones were: each frame redraws
  the last one slightly enlarged, rotated and faded, so every stroke smears outward into
  cloud. It rotates through three presets — *X Marks the Spot*, a green *Water* whose
  waveform is bent into a ring, and a banded *Ripple* — holding each for half a minute
  and then dissolving into the next through the same trail, so the outgoing shape is
  still smouldering while the new one draws over it. Bars, Waves and Album Art animate entirely in CSS; Ambience
  is the one thing in the project CSS genuinely cannot do, and the only render loop
  outside the screen savers.

  **Radio Tuner really works.** It lists SomaFM's channels by genre and plays them —
  actual streaming audio, the only real sound in the project, since everything else is
  synthesised by `os/audio.ts` and the library in `library.ts` is invented. Tuning a
  station takes the transport off the library: play/pause drives the stream, next and
  previous walk the station list, the seek bar greys out because a live stream has no
  length, and the clock counts how long you have been listening. Now-playing artist and
  title come from their API and refresh while it runs, next to the station's own logo —
  laid over the visualization rather than above it, so Ambience keeps the whole pane.
  Album Art shows the station logo too, since a station is the nearest thing to an album
  the radio has. The list beside the visualization follows whatever the transport is
  driving — the library's tracks, or the rest of the dial once a station is on, so you can
  move between stations without going back to Radio Tuner. SomaFM is credited with a link
  wherever one of their streams is what you are hearing — they take no advertising and
  run on donations. Media Guide, Copy from CD and the rest still say why they can't work.
- **Piano** — three octaves that play the same instrument Media Player's library does. Click
  a key, drag across them to run up the keyboard, or type: the `z`/`q`-row layout every
  soft-synth has used since the nineties, printed on the keys so it needs no explaining.
  There's a sustain pedal and an octave shift, and **Play** hands one of the library's pieces
  to the sequencer and lights the keys as it goes — which is the only thing here that shows
  you what a piece looks like under the hands. It exists because the sound already did:
  `os/instrument.ts` was written for the library, and a struck string you can only listen to
  is a waste of one.
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
  `tasklist` shows what's running, and `taskkill` respects `/f` the way the real one
  does — refusing without it, bugchecking the machine with it if you pick one of the
  three processes the kernel needs. Ending `sfindsvc.exe` is the only thing in here
  that clears the advertisements without closing them one at a time.
- **AOL Instant Messenger** — sign on with any screen name, then a buddy list of
  seven people who answer. Each conversation is its own window; buddies type at
  their own speed, go away, and one of them IMs you first. Away messages, the
  B/I/U colour bar, and emoticons that turn into faces.

## Deploying

`.github/workflows/pages.yml` builds on a push to `main` and publishes `dist/` to GitHub
Pages. It needs **Settings → Pages → Source: GitHub Actions** — on "Deploy from a branch"
Pages serves the repository as it stands, and the repository's `index.html` is the
development one that points at `/src/main.tsx`. That gives a white screen and a console
error about a disallowed `text/html` MIME type, which is Pages' own 404 page being refused
rather than anything wrong with the build.

Assets are built with `base: './'` so the same output works at a domain root, under
`/<repo>/`, or opened straight off disk. Nothing here reads the address bar, so there is no
history fallback to configure.

The bundled faces are freely licensed and safe to publish: **DejaVu Sans Condensed** and
**Fira Sans**, standing in for Tahoma and Trebuchet MS, picked by measuring width and
x-height rather than by eye — see the note at the top of `src/styles/fonts.css`. The stacks
in `tokens.css` list installed fonts *first*, so anyone on Windows or macOS still gets the
real thing and most visitors download no font at all. Both licences ship in
`public/licenses/`, because both require it.

## Architecture

| Path | Role |
| --- | --- |
| `src/os/windowStore.ts` | The window manager. A tiny external store read via `useSyncExternalStore`. |
| `src/os/apps.ts` | `APP_LIST` — the single edit point for adding an app. |
| `src/screensavers/` | Screen savers. Not apps: no window, no `AppDefinition`, no taskbar button. `maze3d/` is a shared engine the playable `apps/maze` imports too. |
| `src/apps/aim/store.ts` | AIM's session, shared across windows. The pattern to copy when one app owns several windows. |
| `src/os/dnd.ts` | What dropping one shell item onto another means. Shared by the desktop and Explorer so the rules can't drift. |
| `src/os/boot.ts` | Windows, or the DOS prompt it falls back to. Not persisted, so a reload is always a way out. |
| `src/os/audio.ts` | Volume, mute, and every sound the shell makes — oscillators and envelopes, built at runtime. |
| `src/os/startMenu.ts` | The pinned programs list. `startMenuSection: 'pinned'` only seeds it; pinning is a user decision, so it can't live in code. |
| `src/apps/mediaPlayer/skins.ts` | The skins. Palettes, not bitmaps — MediaPlayer.css derives every colour from `--wmp-hue`/`--wmp-sat`/`--wmp-lift`, so a skin is three numbers. |
| `src/os/mediaPlayer.ts` | Media Player's own volume and skin, persisted. Separate from the shell mixer in `os/audio.ts` because they were separate things, and multiplied together for what you actually hear. |
| `src/apps/mediaPlayer/music/notation.ts` | The notation the library is written in, and the bar-line check that catches a dropped beat in a transcription. |
| `src/os/instrument.ts` | The struck-string voice, shared by Media Player and the Piano. Records the four separate reasons the first version sounded flat. A sequencer wants a note of known length; a keyboard wants one that sounds until released — hence both `strike` and `press`. |
| `src/apps/mediaPlayer/synth.ts` | The sequencer. Scheduled on the audio clock with a lookahead — never on a timer, or every note would jitter. |
| `src/apps/mediaPlayer/somafm.ts` | The station list, and the only place real audio enters the project. Records why SomaFM rather than a directory: every channel is HTTPS, which an HTTPS page requires, and its streams send CORS, which is what a real analyser would need. |
| `src/apps/mediaPlayer/ambience.ts` | The frame-feedback visualization, as a table of presets over one engine. Every rate is per second and raised to the power of `dt`, because feedback compounds; expansion and ink are per preset, because they are what make one look different from another. |
| `src/apps/netscape/sites.ts` | The two websites, plus Navigator's default stylesheet. The grey canvas belongs to the browser, not the pages. `draftDocument` lends that stylesheet to Composer, so editor and browser cannot disagree. |
| `src/os/composer.ts` | Composer's one draft. A store, not component state: the popped-out preview is a second window reading the same document. |
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
