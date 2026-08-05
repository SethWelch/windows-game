import type { AppDefinition } from '@/os/types.ts'
import { WordPad } from './WordPad.tsx'

export const wordPadApp: AppDefinition = {
  id: 'wordpad',
  title: 'Document - WordPad',
  label: 'WordPad',
  iconId: 'wordpad',
  component: WordPad,
  defaultSize: { width: 700, height: 520 },
  // Below this the format bar's selects and buttons stop fitting on one line.
  minSize: { width: 480, height: 300 },
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories'],
}
