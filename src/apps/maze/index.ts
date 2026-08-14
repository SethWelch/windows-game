import type { AppDefinition } from '@/os/types.ts'
import { Maze } from './Maze.tsx'

/**
 * The playable half of the maze. The screen saver's half is in screensavers/maze3d, and
 * they share every line of the engine between them.
 */
export const mazeApp: AppDefinition = {
  id: 'maze',
  title: '3D Maze',
  label: '3D Maze',
  iconId: 'maze',
  component: Maze,
  defaultSize: { width: 520, height: 400 },
  minSize: { width: 300, height: 240 },
  singleton: true,
  startMenuSection: 'programs',
  startMenuFolder: ['Games'],
}
