import type { AppDefinition } from '@/os/types.ts'
import { Notepad } from './Notepad.tsx'

export const notepadApp: AppDefinition = {
  id: 'notepad',
  title: 'Untitled - Notepad',
  label: 'Notepad',
  iconId: 'notepad',
  component: Notepad,
  defaultSize: { width: 620, height: 440 },
  minSize: { width: 300, height: 190 },
  showOnDesktop: true,
  startMenuSection: 'pinned',
  startMenuFolder: ['Accessories'],
}
