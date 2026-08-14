import type { Menu, MenuNode } from '@/components/ui/menu.types.ts'
import { BOOKMARKS } from './sites.ts'

export interface NetscapeActions {
  back: () => void
  forward: () => void
  reload: () => void
  home: () => void
  stop: () => void
  go: (url: string) => void
  viewSource: () => void
  composer: () => void
  about: () => void
  close: () => void
  toggleBar: (bar: 'navigation' | 'location' | 'personal') => void
}

export interface NetscapeState {
  canBack: boolean
  canForward: boolean
  loading: boolean
  /** False for a live page, whose markup belongs to another origin. */
  canViewSource: boolean
  bars: { navigation: boolean; location: boolean; personal: boolean }
  /** Most recent last; rendered newest-first under Go. */
  history: { url: string; title: string }[]
}

export const buildNetscapeMenus = (
  a: NetscapeActions,
  s: NetscapeState,
): Menu[] => {
  // Go listed the session's history, which is where you actually went hunting for
  // the page you'd just closed.
  const historyItems: MenuNode[] = s.history
    .slice(-10)
    .reverse()
    .map((entry, i) => ({
      id: `hist-${i}`,
      label: entry.title,
      onSelect: () => a.go(entry.url),
    }))

  return [
    {
      id: 'file',
      label: '&File',
      items: [
        { id: 'new', label: '&New Navigator Window', disabled: true },
        { id: 'open', label: '&Open Page...', disabled: true },
        { kind: 'separator' },
        { id: 'save', label: '&Save As...', disabled: true },
        { id: 'print', label: '&Print...', disabled: true },
        { kind: 'separator' },
        { id: 'close', label: '&Close', onSelect: a.close },
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [
        { id: 'undo', label: '&Undo', disabled: true },
        { kind: 'separator' },
        { id: 'cut', label: 'Cu&t', disabled: true },
        { id: 'copy', label: '&Copy', disabled: true },
        { id: 'paste', label: '&Paste', disabled: true },
        { kind: 'separator' },
        { id: 'find', label: '&Find in Page...', disabled: true },
        { kind: 'separator' },
        { id: 'prefs', label: 'P&references...', disabled: true },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        { id: 'reload', label: '&Reload', onSelect: a.reload },
        { id: 'stop', label: '&Stop Page Loading', disabled: !s.loading, onSelect: a.stop },
        { kind: 'separator' },
        {
          id: 'show',
          label: 'Sho&w',
          submenu: [
            {
              id: 'bar-nav',
              label: '&Navigation Toolbar',
              checked: s.bars.navigation,
              onSelect: () => a.toggleBar('navigation'),
            },
            {
              id: 'bar-loc',
              label: '&Location Toolbar',
              checked: s.bars.location,
              onSelect: () => a.toggleBar('location'),
            },
            {
              id: 'bar-per',
              label: '&Personal Toolbar',
              checked: s.bars.personal,
              onSelect: () => a.toggleBar('personal'),
            },
          ],
        },
        { kind: 'separator' },
        {
          id: 'source',
          label: 'Page Sou&rce',
          disabled: !s.canViewSource,
          onSelect: a.viewSource,
        },
        { id: 'info', label: 'Page &Info', disabled: true },
      ],
    },
    {
      id: 'go',
      label: '&Go',
      items: [
        { id: 'back', label: '&Back', disabled: !s.canBack, onSelect: a.back },
        {
          id: 'forward',
          label: '&Forward',
          disabled: !s.canForward,
          onSelect: a.forward,
        },
        { id: 'home', label: '&Home', onSelect: a.home },
        ...(historyItems.length
          ? ([{ kind: 'separator' }, ...historyItems] as MenuNode[])
          : []),
      ],
    },
    {
      id: 'communicator',
      label: '&Communicator',
      items: [
        { id: 'nav', label: '&Navigator', checked: true },
        { id: 'messenger', label: '&Messenger Mailbox', disabled: true },
        { id: 'composer', label: 'Page &Composer', onSelect: a.composer },
        { kind: 'separator' },
        {
          id: 'bookmarks',
          label: '&Bookmarks',
          submenu: BOOKMARKS.map((b) => ({
            id: `bm-${b.url}`,
            label: b.label,
            onSelect: () => a.go(b.url),
          })),
        },
      ],
    },
    {
      id: 'help',
      label: '&Help',
      items: [
        { id: 'contents', label: '&Help Contents', disabled: true },
        { kind: 'separator' },
        { id: 'about', label: '&About Communicator', onSelect: a.about },
      ],
    },
  ]
}
