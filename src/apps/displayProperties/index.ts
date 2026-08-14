import type { AppDefinition } from '@/os/types.ts'
import { DisplayProperties } from './DisplayProperties.tsx'

export const displayPropertiesApp: AppDefinition = {
  id: 'displayProperties',
  title: 'Display Properties',
  label: 'Display',
  iconId: 'display',
  component: DisplayProperties,
  // A property sheet, so it is the size it is: fixed, and no maximize. The real one
  // couldn't be resized either.
  defaultSize: { width: 428, height: 512 },
  resizable: false,
  maximizable: false,
  singleton: true,
  startMenuSection: 'programs',
  startMenuFolder: ['Control Panel'],
}
