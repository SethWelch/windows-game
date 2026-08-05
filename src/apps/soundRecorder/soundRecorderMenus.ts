import type { Menu } from '@/components/ui/menu.types.ts'

export interface RecorderActions {
  newFile: () => void
  open: () => void
  save: () => void
  saveAs: () => void
  properties: () => void
  exit: () => void
  deleteBefore: () => void
  deleteAfter: () => void
  louder: () => void
  quieter: () => void
  faster: () => void
  slower: () => void
  echo: () => void
  reverse: () => void
  about: () => void
}

export interface RecorderFlags {
  /** Nothing recorded: everything that transforms the sound is greyed out. */
  empty: boolean
  /** Playing or recording — no editing mid-transport. */
  busy: boolean
}

export const buildRecorderMenus = (
  a: RecorderActions,
  f: RecorderFlags,
): Menu[] => {
  const locked = f.empty || f.busy

  return [
    {
      id: 'file',
      label: '&File',
      items: [
        { id: 'new', label: '&New', disabled: f.busy, onSelect: a.newFile },
        { id: 'open', label: '&Open...', disabled: f.busy, onSelect: a.open },
        { id: 'save', label: '&Save', disabled: locked, onSelect: a.save },
        { id: 'saveas', label: 'Save &As...', disabled: locked, onSelect: a.saveAs },
        { kind: 'separator' },
        { id: 'revert', label: '&Revert...', disabled: true },
        { kind: 'separator' },
        { id: 'props', label: 'P&roperties', onSelect: a.properties },
        { kind: 'separator' },
        { id: 'exit', label: 'E&xit', onSelect: a.exit },
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [
        { id: 'copy', label: '&Copy', disabled: true },
        { id: 'paste-insert', label: 'Paste &Insert', disabled: true },
        { id: 'paste-mix', label: 'Paste &Mix', disabled: true },
        { kind: 'separator' },
        { id: 'insert-file', label: 'I&nsert File...', disabled: true },
        { id: 'mix-file', label: 'Mi&x with File...', disabled: true },
        { kind: 'separator' },
        {
          id: 'del-before',
          label: 'Delete &Before Current Position',
          disabled: locked,
          onSelect: a.deleteBefore,
        },
        {
          id: 'del-after',
          label: 'Delete &After Current Position',
          disabled: locked,
          onSelect: a.deleteAfter,
        },
        { kind: 'separator' },
        { id: 'audio-props', label: 'Audio Propert&ies', disabled: true },
      ],
    },
    {
      id: 'effects',
      label: 'E&ffects',
      items: [
        {
          id: 'louder',
          label: '&Increase Volume (by 25%)',
          disabled: locked,
          onSelect: a.louder,
        },
        {
          id: 'quieter',
          label: '&Decrease Volume',
          disabled: locked,
          onSelect: a.quieter,
        },
        { kind: 'separator' },
        {
          id: 'faster',
          label: 'Increase &Speed (by 100%)',
          disabled: locked,
          onSelect: a.faster,
        },
        {
          id: 'slower',
          label: 'Decrease Sp&eed',
          disabled: locked,
          onSelect: a.slower,
        },
        { kind: 'separator' },
        { id: 'echo', label: '&Add Echo', disabled: locked, onSelect: a.echo },
        { id: 'reverse', label: '&Reverse', disabled: locked, onSelect: a.reverse },
      ],
    },
    {
      id: 'help',
      label: '&Help',
      items: [
        { id: 'topics', label: '&Help Topics', disabled: true },
        { kind: 'separator' },
        { id: 'about', label: '&About Sound Recorder', onSelect: a.about },
      ],
    },
  ]
}
