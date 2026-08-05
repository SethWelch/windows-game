import type { AppDefinition } from '@/os/types.ts'
import { Solitaire } from './Solitaire.tsx'

export const solitaireApp: AppDefinition = {
  id: 'solitaire',
  title: 'Solitaire',
  label: 'Solitaire',
  iconId: 'solitaire',
  component: Solitaire,
  defaultSize: { width: 700, height: 540 },
  // Seven 71px columns with 12px gutters and the table's padding come to 593,
  // plus the window's 6px of frame. Below that the tableau would clip.
  minSize: { width: 600, height: 420 },
  startMenuSection: 'programs',
  startMenuFolder: ['Games'],
}
