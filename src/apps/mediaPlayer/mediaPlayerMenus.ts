import type { Menu } from '@/components/ui/menu.types.ts'
import type { Visualization } from './visualizer.tsx'

export interface PlayerActions {
  playPause: () => void
  stop: () => void
  previous: () => void
  next: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleMute: () => void
  setVisualization: (kind: Visualization) => void
  toggleFeatures: () => void
  about: () => void
  exit: () => void
}

export interface PlayerFlags {
  playing: boolean
  shuffle: boolean
  repeat: boolean
  muted: boolean
  features: boolean
  visualization: Visualization
}

export const buildPlayerMenus = (a: PlayerActions, f: PlayerFlags): Menu[] => [
  {
    id: 'file',
    label: '&File',
    items: [
      { id: 'open', label: '&Open...', accelerator: 'Ctrl+O', disabled: true },
      { id: 'openurl', label: 'Open &URL...', accelerator: 'Ctrl+U', disabled: true },
      { kind: 'separator' },
      { id: 'addlib', label: '&Add to Library', disabled: true },
      { id: 'props', label: '&Properties', disabled: true },
      { kind: 'separator' },
      { id: 'exit', label: 'E&xit', onSelect: a.exit },
    ],
  },
  {
    id: 'view',
    label: '&View',
    items: [
      {
        id: 'taskbar',
        label: '&Taskbar',
        checked: f.features,
        onSelect: a.toggleFeatures,
      },
      { id: 'fullscreen', label: '&Full Screen', accelerator: 'Alt+Enter', disabled: true },
      { id: 'skinmode', label: 'Skin &Mode', accelerator: 'Ctrl+2', disabled: true },
      { kind: 'separator' },
      {
        id: 'visualizations',
        label: '&Visualizations',
        submenu: [
          {
            id: 'vis-ambience',
            label: '&Ambience',
            checked: f.visualization === 'ambience',
            onSelect: () => a.setVisualization('ambience'),
          },
          {
            id: 'vis-bars',
            label: '&Bars',
            checked: f.visualization === 'bars',
            onSelect: () => a.setVisualization('bars'),
          },
          {
            id: 'vis-waves',
            label: '&Waves',
            checked: f.visualization === 'waves',
            onSelect: () => a.setVisualization('waves'),
          },
          {
            id: 'vis-art',
            label: '&Album Art',
            checked: f.visualization === 'art',
            onSelect: () => a.setVisualization('art'),
          },
        ],
      },
      { kind: 'separator' },
      { id: 'stats', label: '&Statistics', disabled: true },
    ],
  },
  {
    id: 'play',
    label: '&Play',
    items: [
      {
        id: 'playpause',
        label: f.playing ? '&Pause' : '&Play',
        accelerator: 'Ctrl+P',
        onSelect: a.playPause,
      },
      { id: 'stop', label: '&Stop', accelerator: 'Ctrl+S', onSelect: a.stop },
      { kind: 'separator' },
      {
        id: 'previous',
        label: 'P&revious',
        accelerator: 'Ctrl+B',
        onSelect: a.previous,
      },
      { id: 'next', label: '&Next', accelerator: 'Ctrl+F', onSelect: a.next },
      { kind: 'separator' },
      {
        id: 'shuffle',
        label: 'S&huffle',
        accelerator: 'Ctrl+H',
        checked: f.shuffle,
        onSelect: a.toggleShuffle,
      },
      {
        id: 'repeat',
        label: 'Repea&t',
        accelerator: 'Ctrl+T',
        checked: f.repeat,
        onSelect: a.toggleRepeat,
      },
      { kind: 'separator' },
      {
        id: 'mute',
        label: '&Mute',
        checked: f.muted,
        onSelect: a.toggleMute,
      },
    ],
  },
  {
    id: 'tools',
    label: '&Tools',
    items: [
      { id: 'search', label: '&Search for Media...', disabled: true },
      { id: 'license', label: '&License Management...', disabled: true },
      { kind: 'separator' },
      { id: 'options', label: '&Options...', disabled: true },
    ],
  },
  {
    id: 'help',
    label: '&Help',
    items: [
      { id: 'topics', label: '&Help Topics', disabled: true },
      { kind: 'separator' },
      { id: 'about', label: '&About Windows Media Player', onSelect: a.about },
    ],
  },
]
