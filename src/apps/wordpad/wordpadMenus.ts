import type { Menu } from '@/components/ui/menu.types.ts'

export interface WordPadActions {
  newDoc: () => void
  open: () => void
  save: () => void
  saveAs: () => void
  exit: () => void
  undo: () => void
  cut: () => void
  copy: () => void
  paste: () => void
  selectAll: () => void
  dateTime: () => void
  bullets: () => void
  about: () => void
  toggleBar: (bar: 'toolbar' | 'format' | 'ruler' | 'status') => void
}

export interface WordPadFlags {
  bars: { toolbar: boolean; format: boolean; ruler: boolean; status: boolean }
  bullets: boolean
}

export const buildWordPadMenus = (
  a: WordPadActions,
  f: WordPadFlags,
): Menu[] => [
  {
    id: 'file',
    label: '&File',
    items: [
      { id: 'new', label: '&New...', accelerator: 'Ctrl+N', onSelect: a.newDoc },
      { id: 'open', label: '&Open...', accelerator: 'Ctrl+O', onSelect: a.open },
      { id: 'save', label: '&Save', accelerator: 'Ctrl+S', onSelect: a.save },
      { id: 'saveas', label: 'Save &As...', onSelect: a.saveAs },
      { kind: 'separator' },
      { id: 'print', label: '&Print...', accelerator: 'Ctrl+P', disabled: true },
      { id: 'preview', label: 'Print Pre&view', disabled: true },
      { id: 'pagesetup', label: 'Page Set&up...', disabled: true },
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
      { kind: 'separator' },
      {
        id: 'selectall',
        label: 'Select &All',
        accelerator: 'Ctrl+A',
        onSelect: a.selectAll,
      },
      { kind: 'separator' },
      { id: 'find', label: '&Find...', accelerator: 'Ctrl+F', disabled: true },
      { id: 'replace', label: 'R&eplace...', disabled: true },
      { kind: 'separator' },
      { id: 'object', label: '&Object Properties', disabled: true },
    ],
  },
  {
    id: 'view',
    label: '&View',
    items: [
      {
        id: 'toolbar',
        label: '&Toolbar',
        checked: f.bars.toolbar,
        onSelect: () => a.toggleBar('toolbar'),
      },
      {
        id: 'formatbar',
        label: '&Format Bar',
        checked: f.bars.format,
        onSelect: () => a.toggleBar('format'),
      },
      {
        id: 'ruler',
        label: '&Ruler',
        checked: f.bars.ruler,
        onSelect: () => a.toggleBar('ruler'),
      },
      {
        id: 'statusbar',
        label: '&Status Bar',
        checked: f.bars.status,
        onSelect: () => a.toggleBar('status'),
      },
      { kind: 'separator' },
      { id: 'options', label: '&Options...', disabled: true },
    ],
  },
  {
    id: 'insert',
    label: '&Insert',
    items: [
      { id: 'datetime', label: '&Date and Time...', onSelect: a.dateTime },
      { id: 'object', label: '&Object...', disabled: true },
    ],
  },
  {
    id: 'format',
    label: 'F&ormat',
    items: [
      { id: 'font', label: '&Font...', disabled: true },
      {
        id: 'bullet',
        label: '&Bullet Style',
        checked: f.bullets,
        onSelect: a.bullets,
      },
      { id: 'paragraph', label: '&Paragraph...', disabled: true },
      { id: 'tabs', label: '&Tabs...', disabled: true },
    ],
  },
  {
    id: 'help',
    label: '&Help',
    items: [
      { id: 'topics', label: '&Help Topics', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About WordPad', onSelect: a.about },
    ],
  },
]
