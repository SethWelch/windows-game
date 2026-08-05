import type { Menu } from '@/components/ui/menu.types.ts'

export interface PaintActions {
  newImage: () => void
  open: () => void
  save: () => void
  saveAs: () => void
  exit: () => void
  undo: () => void
  flipRotate: () => void
  invert: () => void
  attributes: () => void
  clearImage: () => void
  about: () => void
  togglePane: (pane: 'tools' | 'colors' | 'status') => void
}

export interface PaintFlags {
  canUndo: boolean
  panes: { tools: boolean; colors: boolean; status: boolean }
}

export const buildPaintMenus = (a: PaintActions, f: PaintFlags): Menu[] => [
  {
    id: 'file',
    label: '&File',
    items: [
      { id: 'new', label: '&New', accelerator: 'Ctrl+N', onSelect: a.newImage },
      { id: 'open', label: '&Open...', accelerator: 'Ctrl+O', onSelect: a.open },
      { id: 'save', label: '&Save', accelerator: 'Ctrl+S', onSelect: a.save },
      { id: 'saveas', label: 'Save &As...', onSelect: a.saveAs },
      { kind: 'separator' },
      { id: 'print', label: '&Print...', accelerator: 'Ctrl+P', disabled: true },
      { kind: 'separator' },
      { id: 'wallpaper', label: 'Set As &Background (Tiled)', disabled: true },
      { kind: 'separator' },
      { id: 'exit', label: 'E&xit', onSelect: a.exit },
    ],
  },
  {
    id: 'edit',
    label: '&Edit',
    items: [
      {
        id: 'undo',
        label: '&Undo',
        accelerator: 'Ctrl+Z',
        disabled: !f.canUndo,
        onSelect: a.undo,
      },
      { id: 'repeat', label: '&Repeat', accelerator: 'F4', disabled: true },
      { kind: 'separator' },
      { id: 'cut', label: 'Cu&t', accelerator: 'Ctrl+X', disabled: true },
      { id: 'copy', label: '&Copy', accelerator: 'Ctrl+C', disabled: true },
      { id: 'paste', label: '&Paste', accelerator: 'Ctrl+V', disabled: true },
      { kind: 'separator' },
      { id: 'selectall', label: 'Select &All', accelerator: 'Ctrl+A', disabled: true },
    ],
  },
  {
    id: 'view',
    label: '&View',
    items: [
      {
        id: 'toolbox',
        label: '&Tool Box',
        accelerator: 'Ctrl+T',
        checked: f.panes.tools,
        onSelect: () => a.togglePane('tools'),
      },
      {
        id: 'colorbox',
        label: '&Color Box',
        accelerator: 'Ctrl+L',
        checked: f.panes.colors,
        onSelect: () => a.togglePane('colors'),
      },
      {
        id: 'statusbar',
        label: '&Status Bar',
        checked: f.panes.status,
        onSelect: () => a.togglePane('status'),
      },
      { kind: 'separator' },
      { id: 'zoom', label: '&Zoom', disabled: true },
      { id: 'bitmap', label: 'View &Bitmap', accelerator: 'Ctrl+F', disabled: true },
    ],
  },
  {
    id: 'image',
    label: '&Image',
    items: [
      {
        id: 'fliprotate',
        label: '&Flip/Rotate...',
        accelerator: 'Ctrl+R',
        onSelect: a.flipRotate,
      },
      { id: 'stretch', label: '&Stretch/Skew...', accelerator: 'Ctrl+W', disabled: true },
      {
        id: 'invert',
        label: '&Invert Colors',
        accelerator: 'Ctrl+I',
        onSelect: a.invert,
      },
      {
        id: 'attributes',
        label: '&Attributes...',
        accelerator: 'Ctrl+E',
        onSelect: a.attributes,
      },
      {
        id: 'clear',
        label: '&Clear Image',
        accelerator: 'Ctrl+Shft+N',
        onSelect: a.clearImage,
      },
    ],
  },
  {
    id: 'colors',
    label: '&Colors',
    items: [{ id: 'edit-colors', label: '&Edit Colors...', disabled: true }],
  },
  {
    id: 'help',
    label: '&Help',
    items: [
      { id: 'topics', label: '&Help Topics', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About Paint', onSelect: a.about },
    ],
  },
]
