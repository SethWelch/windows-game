import type { AppDefinition } from '@/os/types.ts'
import { Minesweeper } from './Minesweeper.tsx'
import { LEVELS } from './engine.ts'
import { windowSizeFor } from './metrics.ts'

export const minesweeperApp: AppDefinition = {
  id: 'minesweeper',
  title: 'Minesweeper',
  label: 'Minesweeper',
  iconId: 'minesweeper',
  component: Minesweeper,
  // Opens at exactly the Beginner field's size, so the first paint is already
  // correct — nothing has to settle after mount.
  defaultSize: windowSizeFor(LEVELS.beginner),
  minSize: { width: 120, height: 120 },
  // The field is fixed-size artwork — there is nothing to stretch.
  resizable: false,
  maximizable: false,
  startMenuSection: 'programs',
  startMenuFolder: ['Games'],
}
