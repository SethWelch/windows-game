import type { AppDefinition } from '@/os/types.ts'
import { MediaPlayer } from './MediaPlayer.tsx'

export const mediaPlayerApp: AppDefinition = {
  id: 'mediaPlayer',
  title: 'Windows Media Player',
  label: 'Windows Media Player',
  iconId: 'mediaPlayer',
  component: MediaPlayer,
  defaultSize: { width: 660, height: 470 },
  // Below this the feature bar, the visualization and the playlist stop coexisting.
  minSize: { width: 480, height: 340 },
  startMenuSection: 'pinned',
  startMenuFolder: ['Accessories', 'Entertainment'],
}
