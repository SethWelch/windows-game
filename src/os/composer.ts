import { useSyncExternalStore } from 'react'

/**
 * The one document Netscape Composer is editing.
 *
 * A store rather than component state for two reasons. The preview can be popped out
 * into its own window, and two windows cannot share a `useState`; and a draft you spent
 * ten minutes on should not evaporate because you closed the window, which is what
 * every other persisted store here already gets right.
 *
 * One document, not a list. Composer opened a window per document, but a file picker,
 * a dirty flag and a Save As dialog are a filesystem feature, and this is the editor —
 * the draft persisting on its own is why Save is greyed rather than broken.
 *
 * HTML and CSS are kept apart rather than as one blob because they are two panes and
 * two languages; joining them would mean parsing the `<style>` block back out to know
 * which one you were typing in.
 */

export interface Draft {
  html: string
  css: string
}

const KEY = 'xp:composer'

/**
 * What a new document starts as. Deliberately not empty: an editor whose preview is a
 * blank grey rectangle teaches you nothing about what it does, and this shows both
 * panes doing their job in the first second. It is also the page everyone's first
 * home page actually was.
 */
const STARTER_HTML = `<h1>My Home Page</h1>

<p>Welcome to my <b>brand new</b> web page! I made it myself
in <i>Netscape Composer</i>.</p>

<h2>Things I like</h2>
<ul>
  <li>The World Wide Web</li>
  <li>My cat</li>
  <li>Animated GIFs</li>
</ul>

<p class="note">Best viewed at 800 x 600.</p>
`

const STARTER_CSS = `body {
  background: #ffffcc;
  font-family: Verdana, Arial, sans-serif;
  font-size: 13px;
  margin: 14px;
}

h1 {
  color: #000080;
  font-family: Georgia, "Times New Roman", serif;
  border-bottom: 2px solid #000080;
}

h2 {
  color: #800000;
}

.note {
  color: #808080;
  font-style: italic;
}
`

const DEFAULTS: Draft = { html: STARTER_HTML, css: STARTER_CSS }

function load(): Draft {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Draft>
    // Field by field, and typed rather than `??`-defaulted: a half-written payload
    // would otherwise hand a non-string to a controlled `<textarea>`, which throws.
    return {
      html: typeof parsed.html === 'string' ? parsed.html : DEFAULTS.html,
      css: typeof parsed.css === 'string' ? parsed.css : DEFAULTS.css,
    }
  } catch {
    return DEFAULTS
  }
}

let draft = load()
const listeners = new Set<() => void>()

function commit(next: Draft) {
  draft = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Quota or private mode. The draft holds for this session; see fs.isPersisted.
  }
  listeners.forEach((l) => l())
}

export const composer = {
  get: () => draft,
  setHtml(html: string) {
    commit({ ...draft, html })
  },
  setCss(css: string) {
    commit({ ...draft, css })
  },
  /** File ▸ New. Back to the starter page rather than to nothing. */
  reset: () => commit(DEFAULTS),
}

export function useComposer(): Draft {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => draft,
    () => draft,
  )
}
