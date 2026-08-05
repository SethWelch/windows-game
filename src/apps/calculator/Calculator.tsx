import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import type { Menu } from '@/components/ui/menu.types.ts'
import type { AppProps } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { INITIAL, applyKey, groupDigits } from './calc.ts'
import type { CalcKey, CalcState } from './calc.ts'
import './Calculator.css'

/** One button: its face, the key it sends, and which colour group it belongs to. */
interface Button {
  face: string
  key: CalcKey
  tone?: 'memory' | 'operator' | 'clear'
  wide?: boolean
  title?: string
}

const digit = (d: string): Button => ({ face: d, key: { kind: 'digit', value: d } })

/**
 * The Standard layout, as a 6-column grid read left to right, top to bottom —
 * memory down the first column, digits in the middle, operators on the right.
 */
const KEYS: Button[][] = [
  [
    { face: 'MC', key: { kind: 'memory', value: 'clear' }, tone: 'memory' },
    digit('7'),
    digit('8'),
    digit('9'),
    { face: '/', key: { kind: 'op', value: 'div' }, tone: 'operator' },
    { face: 'sqrt', key: { kind: 'sqrt' }, tone: 'operator', title: 'Square root' },
  ],
  [
    { face: 'MR', key: { kind: 'memory', value: 'recall' }, tone: 'memory' },
    digit('4'),
    digit('5'),
    digit('6'),
    { face: '*', key: { kind: 'op', value: 'mul' }, tone: 'operator' },
    { face: '%', key: { kind: 'percent' }, tone: 'operator' },
  ],
  [
    { face: 'MS', key: { kind: 'memory', value: 'store' }, tone: 'memory' },
    digit('1'),
    digit('2'),
    digit('3'),
    { face: '-', key: { kind: 'op', value: 'sub' }, tone: 'operator' },
    { face: '1/x', key: { kind: 'reciprocal' }, tone: 'operator' },
  ],
  [
    { face: 'M+', key: { kind: 'memory', value: 'add' }, tone: 'memory' },
    digit('0'),
    { face: '+/-', key: { kind: 'negate' } },
    { face: '.', key: { kind: 'dot' } },
    { face: '+', key: { kind: 'op', value: 'add' }, tone: 'operator' },
    { face: '=', key: { kind: 'equals' }, tone: 'operator' },
  ],
]

const TOP: Button[] = [
  { face: 'Backspace', key: { kind: 'back' }, tone: 'clear', wide: true },
  { face: 'CE', key: { kind: 'clearEntry' }, tone: 'clear' },
  { face: 'C', key: { kind: 'clear' }, tone: 'clear' },
]

/** Keyboard equivalents, using calc.exe's own bindings where it had them. */
function keyFor(e: KeyboardEvent): CalcKey | null {
  if (e.key >= '0' && e.key <= '9') return { kind: 'digit', value: e.key }
  switch (e.key) {
    case '.':
    case ',':
      return { kind: 'dot' }
    case '+':
      return { kind: 'op', value: 'add' }
    case '-':
      return { kind: 'op', value: 'sub' }
    case '*':
      return { kind: 'op', value: 'mul' }
    case '/':
      return { kind: 'op', value: 'div' }
    case '=':
    case 'Enter':
      return { kind: 'equals' }
    case '%':
      return { kind: 'percent' }
    case '@':
      return { kind: 'sqrt' }
    case 'r':
    case 'R':
      return { kind: 'reciprocal' }
    case 'F9':
      return { kind: 'negate' }
    case 'Backspace':
      return { kind: 'back' }
    case 'Delete':
      return { kind: 'clearEntry' }
    case 'Escape':
      return { kind: 'clear' }
    default:
      return null
  }
}

export function Calculator({ windowId }: AppProps) {
  const [state, setState] = useState<CalcState>(INITIAL)
  const [grouping, setGrouping] = useState(false)
  const [about, setAbout] = useState(false)
  const focused = useIsFocused(windowId)

  const press = (key: CalcKey) => setState((s) => applyKey(s, key))

  useEffect(() => {
    if (!focused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.('.xp-dialog')) return
      // Leave the copy/paste accelerators to the Edit menu's own handlers.
      if (e.ctrlKey || e.metaKey) return
      const key = keyFor(e)
      if (!key) return
      e.preventDefault()
      press(key)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focused])

  const shown = state.error
    ? state.display
    : grouping
      ? groupDigits(state.display)
      : state.display

  const menus: Menu[] = [
    {
      id: 'edit',
      label: '&Edit',
      items: [
        {
          id: 'copy',
          label: '&Copy',
          accelerator: 'Ctrl+C',
          onSelect: () => {
            void navigator.clipboard?.writeText(state.display).catch(() => {})
          },
        },
        {
          id: 'paste',
          label: '&Paste',
          accelerator: 'Ctrl+V',
          onSelect: () => {
            void navigator.clipboard
              ?.readText()
              .then((text) => {
                const n = Number(text.trim().replace(/,/g, ''))
                if (Number.isFinite(n)) {
                  setState((s) => ({ ...s, display: String(n), typing: true, error: null }))
                }
              })
              .catch(() => {})
          },
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        { id: 'standard', label: '&Standard', checked: true },
        // Scientific is a different keypad, a different state machine, and a
        // different window size. Standard is the one people actually reach for.
        { id: 'scientific', label: 'S&cientific', disabled: true },
        { kind: 'separator' },
        {
          id: 'grouping',
          label: '&Digit grouping',
          checked: grouping,
          onSelect: () => setGrouping((v) => !v),
        },
      ],
    },
    {
      id: 'help',
      label: '&Help',
      items: [
        { id: 'topics', label: '&Help Topics', disabled: true },
        { kind: 'separator' },
        { id: 'about', label: '&About Calculator', onSelect: () => setAbout(true) },
      ],
    },
  ]

  const button = (b: Button) => (
    <button
      key={b.face}
      type="button"
      className="xp-calc-key"
      data-tone={b.tone}
      data-wide={b.wide}
      title={b.title}
      onClick={() => press(b.key)}
    >
      {b.face}
    </button>
  )

  return (
    <div className="xp-calculator">
      <MenuBar menus={menus} />

      <div className="xp-window-content">
        <div className="xp-calc-body">
          <output className="xp-calc-display" data-error={!!state.error}>
            {shown}
          </output>

          <div className="xp-calc-row xp-calc-row--top">
            {/* The little box that told you something was in memory. */}
            <span className="xp-calc-flag">{state.memory !== 0 ? 'M' : ''}</span>
            {TOP.map(button)}
          </div>

          <div className="xp-calc-keys">{KEYS.flat().map(button)}</div>
        </div>
      </div>

      {about && (
        <Dialog title="About Calculator" onClose={() => setAbout(false)}>
          <div className="xp-calc-about">
            <strong>Calculator</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            Standard mode, including the percent key's habit of reading whatever
            you were already adding to.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setAbout(false)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
