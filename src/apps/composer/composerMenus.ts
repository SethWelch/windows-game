import type { Menu } from '@/components/ui/menu.types.ts'

/** Which panes the window is showing. Popping the preview out forces `source`. */
export type ViewMode = 'split' | 'source' | 'preview'

export interface ComposerActions {
  newDoc: () => void
  setView: (view: ViewMode) => void
  popOut: () => void
  bringBack: () => void
  about: () => void
  close: () => void
}

export interface ComposerState {
  view: ViewMode
  /** The preview has its own window, so this one only has room for source. */
  poppedOut: boolean
}

export const buildComposerMenus = (a: ComposerActions, s: ComposerState): Menu[] => [
  {
    id: 'file',
    label: '&File',
    items: [
      { id: 'new', label: '&New Page', onSelect: a.newDoc },
      { kind: 'separator' },
      // Greyed because there is nothing for it to do rather than because it is
      // unfinished: the draft is written to storage on every keystroke, so it is
      // already saved. Wiring these up means a real file in os/fs.ts.
      { id: 'open', label: '&Open Page...', disabled: true },
      { id: 'save', label: '&Save As...', disabled: true },
      { kind: 'separator' },
      // Composer's headline feature, and the one thing here that needs a web server.
      { id: 'publish', label: '&Publish...', disabled: true },
      { kind: 'separator' },
      { id: 'close', label: '&Close', onSelect: a.close },
    ],
  },
  {
    id: 'edit',
    label: '&Edit',
    items: [
      // The textareas get all of this from the browser already, including the
      // shortcuts. Listed and greyed the way Navigator's own Edit menu is.
      { id: 'undo', label: '&Undo', accelerator: 'Ctrl+Z', disabled: true },
      { kind: 'separator' },
      { id: 'cut', label: 'Cu&t', accelerator: 'Ctrl+X', disabled: true },
      { id: 'copy', label: '&Copy', accelerator: 'Ctrl+C', disabled: true },
      { id: 'paste', label: '&Paste', accelerator: 'Ctrl+V', disabled: true },
      { kind: 'separator' },
      { id: 'find', label: '&Find...', disabled: true },
    ],
  },
  {
    id: 'view',
    label: '&View',
    items: [
      {
        id: 'view-split',
        label: '&Split View',
        checked: !s.poppedOut && s.view === 'split',
        disabled: s.poppedOut,
        onSelect: () => a.setView('split'),
      },
      {
        id: 'view-source',
        label: '&HTML Source',
        checked: s.poppedOut || s.view === 'source',
        disabled: s.poppedOut,
        onSelect: () => a.setView('source'),
      },
      {
        id: 'view-preview',
        label: '&Preview',
        checked: !s.poppedOut && s.view === 'preview',
        disabled: s.poppedOut,
        onSelect: () => a.setView('preview'),
      },
      { kind: 'separator' },
      {
        id: 'popout',
        label: 'Preview in Separate &Window',
        checked: s.poppedOut,
        onSelect: s.poppedOut ? a.bringBack : a.popOut,
      },
    ],
  },
  {
    id: 'help',
    label: '&Help',
    items: [
      { id: 'contents', label: '&Help Contents', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About Composer', onSelect: a.about },
    ],
  },
]
