import { useEffect } from 'react'
import { popups, useAds } from '@/os/popups.ts'
import type { Ad } from '@/os/popups.ts'
import { AdContent } from './adBodies.tsx'
import { BrandMark } from './adArt.tsx'
import './PopupLayer.css'

/**
 * Draws whatever advertisements are currently on screen.
 *
 * The layer itself is `pointer-events: none` so it never swallows a click meant for
 * the desktop underneath — only the ads themselves take input. The frame comes from
 * the template's `chrome` and the contents from its `kind`, which is what lets a
 * certificate turn up inside a whole browser window and a wall of words turn up with
 * no frame at all.
 */
export function PopupLayer() {
  const ads = useAds()

  // Escape clears the lot. There has to be one key that always works.
  useEffect(() => {
    if (!ads.length) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') popups.closeAll()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [ads.length])

  if (!ads.length) return null

  return (
    <div className="ad-layer">
      {ads.map((ad) => (
        <AdWindow key={ad.id} ad={ad} />
      ))}
    </div>
  )
}

function AdWindow({ ad }: { ad: Ad }) {
  const { template } = ad
  const close = () => popups.close(ad.id)

  return (
    <div
      className="ad"
      data-kind={template.kind}
      data-chrome={template.chrome}
      style={{ left: ad.x, top: ad.y, width: ad.width, height: ad.height }}
    >
      {template.chrome === 'xp' && (
        <div className="ad-bar">
          <span className="ad-bar-text">{template.title}</span>
          <button type="button" className="ad-x" aria-label="Close" onClick={close}>
            ✕
          </button>
        </div>
      )}

      {template.chrome === 'thin' && (
        <div className="ad-thinbar">
          <span className="ad-thinbar-text">{template.title}</span>
          <span className="ad-boxes">
            <i />
            <i />
            <i data-close onClick={close} />
          </span>
        </div>
      )}

      {/* The full article: caption, menu bar, toolbar, address bar — and a status bar
          at the bottom, below the content. */}
      {template.chrome === 'ie' && (
        <>
          <div className="ad-bar ad-bar--ie">
            <span className="ad-bar-text">{template.title}</span>
            <span className="ad-ie-buttons">
              <i />
              <i />
            </span>
            <button type="button" className="ad-x" aria-label="Close" onClick={close}>
              ✕
            </button>
          </div>
          <div className="ad-ie-menus">
            {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="ad-ie-tools">
            <span className="ad-ie-back">◀</span>
            <span className="ad-ie-fwd">▶</span>
            <span className="ad-ie-stop">✕</span>
            <span className="ad-ie-reload">⟳</span>
            <span className="ad-ie-home">⌂</span>
          </div>
          <div className="ad-ie-address">
            <label>Address</label>
            <span className="ad-ie-url">{template.url}</span>
            <span className="ad-ie-go">Go</span>
          </div>
        </>
      )}

      <div className="ad-body">
        {/* The search column that installed itself and could not be uninstalled. */}
        {template.sidebar && (
          <div className="ad-sidebar">
            <div className="ad-sidebar-head">sideFind</div>
            <div className="ad-sidebar-form">
              <input type="text" defaultValue="search" />
              <button type="button" onClick={() => popups.spawn()}>
                Find
              </button>
            </div>
            <div className="ad-sidebar-links">
              <span>Top Sites</span>
              <span>Best Prices</span>
              <span>Find Anyone</span>
            </div>
          </div>
        )}
        <AdContent body={template} art={template.art} />
      </div>

      {/* The house mark along the bottom. Every one of these was signed by a company
          nobody had heard of before that afternoon. */}
      {template.brand && (
        <div className="ad-brandstrip">
          <BrandMark mark={template.brand.mark} />
          <span className="ad-brandstrip-name">{template.brand.name}</span>
          <span className="ad-brandstrip-tag">an advertising partner</span>
        </div>
      )}

      {template.chrome === 'ie' && (
        <div className="ad-ie-status">
          <span>Done</span>
          <span className="ad-ie-zone">Internet</span>
        </div>
      )}

      {ad.badge && <span className="ad-badge">{ad.badge}</span>}
    </div>
  )
}
