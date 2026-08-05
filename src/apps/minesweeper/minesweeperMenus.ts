import type { Menu } from '@/components/ui/menu.types.ts'
import type { LevelName } from './engine.ts'

export interface MinesweeperActions {
  newGame: () => void
  setLevel: (name: 'beginner' | 'intermediate' | 'expert') => void
  custom: () => void
  toggleMarks: () => void
  bestTimes: () => void
  exit: () => void
  about: () => void
}

export interface MinesweeperFlags {
  level: LevelName
  marks: boolean
}

export const buildMinesweeperMenus = (
  a: MinesweeperActions,
  f: MinesweeperFlags,
): Menu[] => [
  {
    id: 'game',
    label: '&Game',
    items: [
      { id: 'new', label: '&New', accelerator: 'F2', onSelect: a.newGame },
      { kind: 'separator' },
      {
        id: 'beginner',
        label: '&Beginner',
        checked: f.level === 'beginner',
        onSelect: () => a.setLevel('beginner'),
      },
      {
        id: 'intermediate',
        label: '&Intermediate',
        checked: f.level === 'intermediate',
        onSelect: () => a.setLevel('intermediate'),
      },
      {
        id: 'expert',
        label: '&Expert',
        checked: f.level === 'expert',
        onSelect: () => a.setLevel('expert'),
      },
      {
        id: 'custom',
        label: '&Custom...',
        checked: f.level === 'custom',
        onSelect: a.custom,
      },
      { kind: 'separator' },
      {
        id: 'marks',
        label: '&Marks (?)',
        checked: f.marks,
        onSelect: a.toggleMarks,
      },
      // Colour was for 16-colour displays and sound needs a WAV set; both stay
      // greyed rather than pretending.
      { id: 'color', label: 'C&olor', checked: true, disabled: true },
      { id: 'sound', label: '&Sound', disabled: true },
      { kind: 'separator' },
      { id: 'best', label: 'Best &Times...', onSelect: a.bestTimes },
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
      { id: 'usinghelp', label: '&Using Help', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About Minesweeper', onSelect: a.about },
    ],
  },
]
