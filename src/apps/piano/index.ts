import type { AppDefinition } from '@/os/types.ts'
import { Piano } from './Piano.tsx'

/**
 * Not something XP shipped — but every machine had one of these on it, and the instrument
 * was already written for Media Player's library, so the only new part is the keys.
 *
 * Wide by default: three octaves want the room, and below the minimum the white keys get
 * narrower than a fingertip.
 */
export const pianoApp: AppDefinition = {
  id: 'piano',
  title: 'Piano',
  label: 'Piano',
  iconId: 'piano',
  component: Piano,
  defaultSize: { width: 620, height: 260 },
  minSize: { width: 380, height: 200 },
  singleton: true,
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories', 'Entertainment'],
}
