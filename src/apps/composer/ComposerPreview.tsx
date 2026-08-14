import { useEffect } from 'react'
import { draftDocument, titleIn } from '@/apps/netscape/sites.ts'
import { useComposer } from '@/os/composer.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { Preview } from './Preview.tsx'
import './Composer.css'

/**
 * The popped-out preview: the draft on its own, in a window you can put anywhere and
 * size to whatever you are designing for.
 *
 * A real window rather than a pane, on the same argument AIM's conversations make — the
 * window manager already does everything this needs, and the point of popping it out is
 * to get it away from the editor. Both halves read `os/composer.ts`, so there is one
 * document and no synchronising to get wrong.
 *
 * Nothing closes this when Composer closes. It stays valid on its own — it is a view of
 * a persisted draft, not a child dialog — and closing a window you didn't close is worse
 * than leaving one open.
 */
export function ComposerPreview({ windowId }: AppProps) {
  const draft = useComposer()
  const title = titleIn(draft.html) ?? 'Untitled'

  useEffect(() => {
    // Captioned like Navigator rather than like Composer, because that is what this is:
    // the page as the browser would show it.
    wm.setTitle(windowId, `${title} - Netscape`)
  }, [windowId, title])

  return (
    <div className="comp-previewwin">
      <Preview doc={draftDocument(draft.html, draft.css, title)} label={title} />
    </div>
  )
}
