import { useRef, useState } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick.ts'
import { MenuList } from './MenuList.tsx'
import { renderLabel } from './renderLabel.tsx'
import type { Menu } from './menu.types.ts'
import './MenuBar.css'

export function MenuBar({ menus }: { menus: Menu[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useOutsideClick([barRef], () => setOpenId(null), openId !== null)

  return (
    <div className="xp-menubar" ref={barRef}>
      {menus.map((menu) => (
        <div key={menu.id} className="xp-menubar-root">
          <button
            type="button"
            className="xp-menubar-item"
            data-open={openId === menu.id}
            onClick={() => setOpenId((v) => (v === menu.id ? null : menu.id))}
            // Once any menu is open, hovering a sibling switches to it without a
            // second click — classic Windows menu-bar behavior.
            onPointerEnter={() => openId !== null && setOpenId(menu.id)}
          >
            {renderLabel(menu.label)}
          </button>

          {openId === menu.id && (
            <MenuList
              items={menu.items}
              onDismiss={() => setOpenId(null)}
              className="xp-menu--dropdown"
            />
          )}
        </div>
      ))}
    </div>
  )
}
