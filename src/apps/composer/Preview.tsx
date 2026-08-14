import { useEffect, useRef } from 'react'

/**
 * The rendered half of Composer — one sandboxed frame showing the draft.
 *
 * Shared by the split view and by the popped-out window, so the two cannot drift into
 * rendering the draft differently.
 */

/**
 * How long typing has to stop before the frame reloads.
 *
 * Some delay is structural rather than an optimisation: `srcdoc` has no way to amend a
 * document, only to replace it, so every keystroke would tear the page down and build
 * it again — losing the scroll position and flashing white between the two. 350ms is
 * short enough to feel live and long enough that a burst of typing costs one reload.
 */
const SETTLE_MS = 350

export function Preview({ doc, label }: { doc: string; label: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  /**
   * The document currently in the frame. The frame is deliberately uncontrolled —
   * React never writes `srcdoc`, because a prop would reload it on every render and
   * re-keying it would do the same. This is what React is comparing against instead.
   */
  const applied = useRef<string | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || doc === applied.current) return

    let restore: (() => void) | null = null

    const apply = () => {
      // Read the scroll before the teardown and put it back once the new document has
      // landed. Without this, every pause in typing throws you to the top of the page,
      // which makes the bottom of a long draft impossible to work on.
      const top = frame.contentWindow?.scrollY ?? 0
      applied.current = doc
      frame.srcdoc = doc
      restore = () => frame.contentWindow?.scrollTo(0, top)
      frame.addEventListener('load', restore, { once: true })
    }

    // The first document goes straight in — there is nothing on screen yet to flicker,
    // and waiting would leave the frame blank for the first third of a second.
    let timer = 0
    if (applied.current === null) apply()
    else timer = window.setTimeout(apply, SETTLE_MS)

    return () => {
      if (timer) window.clearTimeout(timer)
      if (restore) frame.removeEventListener('load', restore)
    }
  }, [doc])

  return (
    <iframe
      ref={frameRef}
      className="comp-frame"
      /* `aria-label`, not `title`: both name the frame, but `title` also renders as a
         tooltip whenever the pointer rests anywhere over the page. Same reason
         Netscape's viewport uses it. */
      aria-label={label}
      /* No `allow-scripts`, which is a decision and not an oversight: the brief is HTML
         and CSS, and a draft that could run script would be running it inside the
         shell. `allow-same-origin` is what lets the scroll position above be read. */
      sandbox="allow-same-origin"
    />
  )
}
