import type { Menu } from '@/components/ui/menu.types.ts'

export interface NotepadActions {
  newDoc: () => void
  open: () => void
  save: () => void
  saveAs: () => void
  exit: () => void
  undo: () => void
  cut: () => void
  copy: () => void
  paste: () => void
  del: () => void
  selectAll: () => void
  timeDate: () => void
  toggleWrap: () => void
  toggleStatusBar: () => void
  about: () => void
}

export interface NotepadFlags {
  wordWrap: boolean
  statusBar: boolean
}

export const buildNotepadMenus = (
  a: NotepadActions,
  f: NotepadFlags,
): Menu[] => [
  {
    id: 'file',
    label: '&File',
    items: [
      { id: 'new', label: '&New', accelerator: 'Ctrl+N', onSelect: a.newDoc },
      { id: 'open', label: '&Open...', accelerator: 'Ctrl+O', onSelect: a.open },
      { id: 'save', label: '&Save', accelerator: 'Ctrl+S', onSelect: a.save },
      { id: 'saveas', label: 'Save &As...', onSelect: a.saveAs },
      { kind: 'separator' },
      { id: 'pagesetup', label: 'Page Set&up...', disabled: true },
      { id: 'print', label: '&Print...', accelerator: 'Ctrl+P', disabled: true },
      { kind: 'separator' },
      { id: 'exit', label: 'E&xit', onSelect: a.exit },
    ],
  },
  {
    id: 'edit',
    label: '&Edit',
    items: [
      { id: 'undo', label: '&Undo', accelerator: 'Ctrl+Z', onSelect: a.undo },
      { kind: 'separator' },
      { id: 'cut', label: 'Cu&t', accelerator: 'Ctrl+X', onSelect: a.cut },
      { id: 'copy', label: '&Copy', accelerator: 'Ctrl+C', onSelect: a.copy },
      { id: 'paste', label: '&Paste', accelerator: 'Ctrl+V', onSelect: a.paste },
      { id: 'delete', label: 'De&lete', accelerator: 'Del', onSelect: a.del },
      { kind: 'separator' },
      { id: 'find', label: '&Find...', accelerator: 'Ctrl+F', disabled: true },
      { id: 'findnext', label: 'Find &Next', accelerator: 'F3', disabled: true },
      { id: 'replace', label: '&Replace...', accelerator: 'Ctrl+H', disabled: true },
      { id: 'goto', label: '&Go To...', accelerator: 'Ctrl+G', disabled: true },
      { kind: 'separator' },
      {
        id: 'selectall',
        label: 'Select &All',
        accelerator: 'Ctrl+A',
        onSelect: a.selectAll,
      },
      {
        id: 'timedate',
        label: 'Time/&Date',
        accelerator: 'F5',
        onSelect: a.timeDate,
      },
    ],
  },
  {
    id: 'format',
    label: 'F&ormat',
    items: [
      {
        id: 'wrap',
        label: '&Word Wrap',
        checked: f.wordWrap,
        onSelect: a.toggleWrap,
      },
      { id: 'font', label: '&Font...', disabled: true },
    ],
  },
  {
    id: 'view',
    label: '&View',
    items: [
      {
        id: 'statusbar',
        label: '&Status Bar',
        checked: f.statusBar,
        // Real Notepad greys this out while Word Wrap is on.
        disabled: f.wordWrap,
        onSelect: a.toggleStatusBar,
      },
    ],
  },
  {
    id: 'help',
    label: '&Help',
    items: [
      { id: 'helptopics', label: '&Help Topics', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About Notepad', onSelect: a.about },
    ],
  },
]
