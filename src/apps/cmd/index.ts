import type { AppDefinition } from '@/os/types.ts'
import { CommandPrompt } from './CommandPrompt.tsx'

export const commandPromptApp: AppDefinition = {
  id: 'cmd',
  title: 'Command Prompt',
  label: 'Command Prompt',
  iconId: 'commandPrompt',
  component: CommandPrompt,
  // 80x25 of Lucida Console, which is the shape every console window started at.
  defaultSize: { width: 604, height: 396 },
  minSize: { width: 320, height: 180 },
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories'],
}
