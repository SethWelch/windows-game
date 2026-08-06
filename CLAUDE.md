# Working in this repo

A Windows XP desktop recreation. `README.md` describes what exists and is kept current
— read it for features, and the Architecture table there for where things live. This
file is only the things that are expensive to rediscover.

## Verifying

```sh
npx tsc -b && npm run lint     # every change
npm run build                  # additionally, if assets or CSS changed
```

Then hand over and say what to look at. **Do not write tests, install a browser driver,
or start the dev server to screenshot it.** Seth verifies visually himself — this is a
project about how the chrome looks and feels, and automated runs prove little here.

## Constraints that fail the first attempt

- `verbatimModuleSyntax` — imports carry the extension: `from './fs.ts'`,
  `from './Dialog.tsx'`. Type-only imports need `import type`.
- `erasableSyntaxOnly` — no `enum`, no constructor parameter properties. Use a union of
  string literals and a `Record` lookup.
- `noUnusedLocals` / `noUnusedParameters` are on.
- `@/*` maps to `./src/*`.
- **There are zero `eslint-disable` comments in this repo. Keep it that way** — if a
  rule complains, the design is wrong, not the rule. The four that bite:
  - `react-hooks/immutability` — never mutate a value from `useState`. A canvas or
    other mutable object belongs in a ref.
  - `react-hooks/refs` — don't pass a ref-reading function into a call during render.
    Lift the thing that reads it into its own component.
  - `react-hooks/set-state-in-effect` — derive it instead. Most "open this when X
    happens" state is `x && !dismissed`.
  - `react-refresh/only-export-components` — a module exporting a component exports
    nothing else. Constants and types go in a sibling file.
- State updaters must be pure; StrictMode double-invokes them. Don't read a decision
  out of a `setX(prev => ...)` callback — use the `latest` ref idiom from
  `src/hooks/useOutsideClick.ts`.

## Two bugs this codebase keeps producing

**1. `position: fixed` doesn't mean the viewport.** `Window.tsx` positions windows with
`transform: translate(...)`, which makes every window a containing block for fixed
descendants. Anything inside a window that positions itself from `clientX`/`clientY`
lands offset by the window's origin. This has been fixed locally three times before it
was fixed centrally: `fixedOrigin()` in `src/components/ui/ContextMenu.tsx` walks
ancestors for `transform`/`filter`/`perspective`/`will-change`/`contain` and subtracts
what it finds. Reuse that approach; `filter` animations count too.

**2. `z-index` on a child escapes into the wrong stacking context.** An absolutely
positioned element with `z-index: auto` creates no stacking context, so a child with
`z-index: 1` joins the nearest ancestor that does — and paints over that ancestor's
*later* siblings. `overflow: hidden` still clips it correctly, so the symptom is
correctly-shaped content in the wrong place. Give the parent `isolation: isolate`.

## Patterns

- **State** lives in module-level stores in `src/os/*.ts`, read through
  `useSyncExternalStore`. `commit()` builds a new object identity, persists, then
  notifies. Components are plain consumers.
- **Adding an app**: `APP_LIST` in `src/os/apps.ts` is the single edit point.
- **Gestures** use document listeners rather than pointer capture, because the grabbed
  element often unmounts mid-drag (see Solitaire). Write to the DOM during the gesture
  and re-render on release; keep a small threshold so `dblclick` still fires.
- **Assets**: icons are inline SVG components, all audio is synthesised at runtime by
  `src/os/audio.ts`. The only bitmaps are the desktop wallpaper and the ten ad photos
  in `src/components/Popups/images/`. Keep it that way — a new icon is a component.

## Comment voice

Comments say *why*, in prose, and are the main reason this codebase reads the way it
does. They record what the original did and where we knowingly departed from it — every
deliberate deviation from XP's behaviour is commented as such. Constants that must
agree across files say so ("must match X in Y.css"). Match the surrounding density; it
is higher than most codebases and that is intentional.

## Practical notes

- This became a git repository partway through its life, so anything from before the
  initial commit has no history behind it. The 2560px wallpaper original is kept as
  `src/images/background-2560-original.jpg` for that reason — from that era, it was the
  only copy. Unreferenced files under `src/` are never emitted by Vite, so keeping an
  original costs nothing in the build.
- This is a personal repo on an account that also has a work one, and it is **pinned**
  so the global `gh-switch` toggle can't touch it: `origin` is `git@github-personal:...`
  (an SSH alias that always uses the personal key) and `user.email` is set repo-locally.
  Leave both alone. If a push ever authenticates as the wrong account, check
  `git remote get-url origin` before touching `~/.ssh/config` — push *authorization*
  (the SSH key) and commit *attribution* (`user.email`) are separate mechanisms and
  fixing one does nothing for the other.
- **Optimising images**: macOS `sips` resizes and re-encodes JPEG but *cannot* write
  WebP and cannot quantize a palette. For PNG cutouts, resize with `sips -Z` and then
  reduce to a ≤128-colour palette with `tRNS` alpha — that took the ad photos from
  39 MB to 96 KB. Judge JPEG quality by sampling error against a losslessly-resized
  reference rather than by eye; for the wallpaper, everything from q55 to q78 measured
  the same because the loss was in the resize, not the quantizer.
- Nothing in the ad layer may use `Math.random()` during render — scatter and timing
  come from arithmetic on an index so re-renders don't move anything.
