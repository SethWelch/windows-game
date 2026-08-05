export interface MenuAction {
  kind?: 'item'
  id: string
  /** `'&Save As...'` — the character after `&` becomes the underlined access key. */
  label: string
  /** Right-aligned grey hint, e.g. `'Ctrl+S'`. */
  accelerator?: string
  checked?: boolean
  disabled?: boolean
  onSelect?: () => void
  /** Renders a ▸ arrow. One level deep in v1. */
  submenu?: MenuNode[]
}

export interface MenuSeparator {
  kind: 'separator'
}

export type MenuNode = MenuAction | MenuSeparator

export interface Menu {
  id: string
  label: string
  items: MenuNode[]
}

export const isSeparator = (n: MenuNode): n is MenuSeparator =>
  n.kind === 'separator'
