import type { Menu } from '@/components/ui/menu.types.ts'

export interface SolitaireActions {
  deal: () => void
  undo: () => void
  deck: () => void
  options: () => void
  exit: () => void
  about: () => void
}

export const buildSolitaireMenus = (
  a: SolitaireActions,
  canUndo: boolean,
): Menu[] => [
  {
    id: 'game',
    label: '&Game',
    items: [
      { id: 'deal', label: '&Deal', accelerator: 'F2', onSelect: a.deal },
      { kind: 'separator' },
      // XP's Undo takes back the last move only — there is no move stack.
      { id: 'undo', label: '&Undo', disabled: !canUndo, onSelect: a.undo },
      { kind: 'separator' },
      { id: 'deck', label: 'Dec&k...', onSelect: a.deck },
      { id: 'options', label: 'O&ptions...', onSelect: a.options },
      { kind: 'separator' },
      { id: 'exit', label: 'E&xit', onSelect: a.exit },
    ],
  },
  {
    id: 'help',
    label: '&Help',
    items: [
      { id: 'contents', label: '&Contents', accelerator: 'F1', disabled: true },
      { id: 'search', label: '&Search for Help on...', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About Solitaire', onSelect: a.about },
    ],
  },
]
