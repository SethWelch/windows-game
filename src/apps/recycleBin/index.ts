import type { AppDefinition } from '@/os/types.ts'
import { RecycleBin } from './RecycleBin.tsx'

export const recycleBinApp: AppDefinition = {
  id: 'recycleBin',
  title: 'Recycle Bin',
  label: 'Recycle Bin',
  iconId: 'recycleBin',
  component: RecycleBin,
  defaultSize: { width: 480, height: 340 },
  showOnDesktop: true,
  singleton: true,
}
