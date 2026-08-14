import { useState } from 'react'
import { SKINS, skinName } from './skins.ts'
import type { SkinId } from './skins.ts'

/**
 * Skin Chooser, which used to say "No skins installed" and now doesn't.
 *
 * Browsing and applying are separate, as they were in the real one: picking a name in the
 * list only moves the preview, and nothing changes until Apply Skin. That matters more
 * here than it looks — the chooser is *inside* the thing it is re-colouring, so applying
 * on click would repaint the list out from under the pointer.
 *
 * The preview is painted by the same `data-wmp-skin` variables the player is, so it cannot
 * show you something the player would not produce. Same argument the screen saver preview
 * in Display Properties makes.
 */
export function SkinChooser({
  current,
  onApply,
}: {
  current: SkinId
  onApply: (id: SkinId) => void
}) {
  const [picked, setPicked] = useState<SkinId>(current)
  const skin = SKINS.find((s) => s.id === picked) ?? SKINS[0]

  return (
    <div className="wmp-skins">
      <div className="wmp-skin-list" role="listbox" aria-label="Skins">
        {SKINS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={picked === s.id}
            className="wmp-skin-row"
            onClick={() => setPicked(s.id)}
          >
            {s.name}
            {s.id === current && <span className="wmp-skin-current"> (current)</span>}
          </button>
        ))}
      </div>

      <div className="wmp-skin-detail">
        {/* The tile carries the *picked* skin, not the applied one — that is the whole
            job of a preview. Everything inside it reads the variables that attribute
            sets, so there is nothing here that knows a colour. */}
        <div className="wmp-skin-preview" data-wmp-skin={picked}>
          <div className="wmp-skin-screen" />
          <div className="wmp-skin-readout">Ready</div>
          <div className="wmp-skin-strip">
            <span className="wmp-skin-play" />
            <span className="wmp-skin-bar">
              <i />
            </span>
          </div>
        </div>

        <p className="wmp-skin-blurb">{skin.blurb}</p>

        <button
          type="button"
          className="wmp-toggle wmp-skin-apply"
          disabled={picked === current}
          onClick={() => onApply(picked)}
        >
          {picked === current ? `${skinName(current)} applied` : 'Apply Skin'}
        </button>
      </div>
    </div>
  )
}
