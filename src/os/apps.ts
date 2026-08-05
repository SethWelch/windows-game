import { aimApp, aimImApp } from '@/apps/aim/index.ts'
import { calculatorApp } from '@/apps/calculator/index.ts'
import { commandPromptApp } from '@/apps/cmd/index.ts'
import { explorerApp } from '@/apps/explorer/index.ts'
import { netscapeApp } from '@/apps/netscape/index.ts'
import { mediaPlayerApp } from '@/apps/mediaPlayer/index.ts'
import { minesweeperApp } from '@/apps/minesweeper/index.ts'
import { notepadApp } from '@/apps/notepad/index.ts'
import { paintApp } from '@/apps/paint/index.ts'
import { recycleBinApp } from '@/apps/recycleBin/index.ts'
import { soundRecorderApp } from '@/apps/soundRecorder/index.ts'
import { wordPadApp } from '@/apps/wordpad/index.ts'
import { spamApp } from '@/apps/spam/index.ts'
import { solitaireApp } from '@/apps/solitaire/index.ts'
import type { AppDefinition } from './types.ts'

/**
 * The single edit point for new apps — the Start menu, All Programs, and window
 * content all derive from this array. Desktop icons now come from the Desktop
 * folder in os/fs.ts instead.
 */
export const APP_LIST: AppDefinition[] = [
  notepadApp,
  recycleBinApp,
  explorerApp,
  minesweeperApp,
  solitaireApp,
  calculatorApp,
  commandPromptApp,
  soundRecorderApp,
  paintApp,
  wordPadApp,
  mediaPlayerApp,
  netscapeApp,
  aimApp,
  // Opened only by a buddy, never from the shell — see apps/aim/index.ts.
  aimImApp,
  // Not in any menu — its desktop shortcut is the only way in.
  spamApp,
]
