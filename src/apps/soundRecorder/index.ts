import type { AppDefinition } from '@/os/types.ts'
import { SoundRecorder } from './SoundRecorder.tsx'

export const soundRecorderApp: AppDefinition = {
  id: 'soundRecorder',
  title: 'Sound - Sound Recorder',
  label: 'Sound Recorder',
  iconId: 'soundRecorder',
  component: SoundRecorder,
  // Short and wide, the way the real window sat: one row of readouts and wave, a
  // slider, and the transport.
  defaultSize: { width: 344, height: 176 },
  minSize: { width: 300, height: 160 },
  // sndrec32 had one size and no grip.
  resizable: false,
  maximizable: false,
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories', 'Entertainment'],
}
