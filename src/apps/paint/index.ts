import type { AppDefinition } from '@/os/types.ts'
import { Paint } from './Paint.tsx'

export const paintApp: AppDefinition = {
  id: 'paint',
  title: 'untitled - Paint',
  label: 'Paint',
  iconId: 'paint',
  component: Paint,
  defaultSize: { width: 620, height: 486 },
  // Below this the tool box and the colour box stop fitting side by side.
  minSize: { width: 460, height: 320 },
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories'],
}
