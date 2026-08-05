import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { renderLabel } from './renderLabel.tsx'
import { isSeparator } from './menu.types.ts'
import type { MenuNode } from './menu.types.ts'
import './MenuBar.css'

/**
 * The dropdown body itself, shared by MenuBar and ContextMenu so both get the
 * same checkmark gutter, accelerator column, and disabled treatment.
 */
export function MenuList({
  items,
  onDismiss,
  className = '',
}: {
  items: MenuNode[]
  onDismiss: () => void
  className?: string
}) {
  const [openSub, setOpenSub] = useState<string | null>(null)

  return (
    <div className={`xp-menu ${className}`}>
      {items.map((node, i) =>
        isSeparator(node) ? (
          <div key={`sep-${i}`} className="xp-menu-sep" />
        ) : (
          <div
            key={node.id}
            className="xp-menubar-root"
            onPointerEnter={() => setOpenSub(node.submenu ? node.id : null)}
          >
            <button
              type="button"
              className="xp-menu-item"
              data-disabled={!!node.disabled}
              onPointerDown={(e: ReactPointerEvent) => {
                // Keep a click on a greyed item from dismissing the menu.
                if (node.disabled) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onClick={() => {
                if (node.disabled || node.submenu) return
                node.onSelect?.()
                onDismiss()
              }}
            >
              {/* Rendered as nothing rather than an empty string, so the CSS can
                  match `:empty` and drop the accelerator column's padding. */}
              <span className="xp-menu-check">{node.checked ? '✓' : null}</span>
              <span>{renderLabel(node.label)}</span>
              <span className="xp-menu-accel">{node.accelerator}</span>
              <span className="xp-menu-arrow">{node.submenu ? '▶' : null}</span>
            </button>

            {node.submenu && openSub === node.id && (
              <MenuList
                items={node.submenu}
                onDismiss={onDismiss}
                className="xp-menu-sub"
              />
            )}
          </div>
        ),
      )}
    </div>
  )
}
