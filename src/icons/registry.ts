import { AimIcon } from './AimIcon.tsx'
import { CalculatorIcon } from './CalculatorIcon.tsx'
import { CommandPromptIcon } from './CommandPromptIcon.tsx'
import { FolderIcon } from './FolderIcon.tsx'
import { MediaPlayerIcon } from './MediaPlayerIcon.tsx'
import { MinesweeperIcon } from './MinesweeperIcon.tsx'
import { NetscapeIcon } from './NetscapeIcon.tsx'
import { MyComputerIcon } from './MyComputerIcon.tsx'
import { NotepadIcon } from './NotepadIcon.tsx'
import { PaintIcon } from './PaintIcon.tsx'
import { RecycleBinIcon } from './RecycleBinIcon.tsx'
import { ShortcutOverlay } from './ShortcutOverlay.tsx'
import { SoundRecorderIcon } from './SoundRecorderIcon.tsx'
import { SpamIcon } from './SpamIcon.tsx'
import { SolitaireIcon } from './SolitaireIcon.tsx'
import { WordPadIcon } from './WordPadIcon.tsx'
import { StartFlag } from './StartFlag.tsx'
import { GoIcon } from './ToolbarIcons.tsx'
import { TextFileIcon } from './TextFileIcon.tsx'

/**
 * Window state stores an `IconId` string rather than a component reference, so
 * the whole store stays serializable (and loggable).
 */
export const ICONS = {
  notepad: NotepadIcon,
  minesweeper: MinesweeperIcon,
  solitaire: SolitaireIcon,
  aim: AimIcon,
  calculator: CalculatorIcon,
  commandPrompt: CommandPromptIcon,
  netscape: NetscapeIcon,
  soundRecorder: SoundRecorderIcon,
  paint: PaintIcon,
  wordpad: WordPadIcon,
  mediaPlayer: MediaPlayerIcon,
  spam: SpamIcon,
  recycleBin: RecycleBinIcon,
  myComputer: MyComputerIcon,
  textFile: TextFileIcon,
  folder: FolderIcon,
  windowsxp: StartFlag,
  /** Composited over another icon, not used on its own. */
  shortcut: ShortcutOverlay,
  /** Hyphenated to match the supplied filename. */
  'go-arrow': GoIcon,
} as const

export type IconId = keyof typeof ICONS
