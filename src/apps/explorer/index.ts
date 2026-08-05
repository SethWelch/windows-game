import type { AppDefinition } from '@/os/types.ts'
import { Explorer } from './Explorer.tsx'

export const explorerApp: AppDefinition = {
  id: 'explorer',
  title: 'My Computer',
  label: 'Windows Explorer',
  iconId: 'folder',
  component: Explorer,
  defaultSize: { width: 720, height: 520 },
  // Below this the task pane and tiles stop fitting side by side.
  minSize: { width: 480, height: 300 },
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories'],
}
