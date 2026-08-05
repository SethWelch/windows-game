import { useEffect, useRef, useState } from 'react'
import { boot } from '@/os/boot.ts'
import { fs } from '@/os/fs.ts'
import './DosScreen.css'

/**
 * Where you end up after emptying the Recycle Bin with My Computer in it.
 *
 * The banner names one way out on its own line, because a black screen with a
 * blinking cursor and no instructions is a dead end rather than a joke. `HELP` lists
 * the rest, and `RESTART` always works — the boot state isn't persisted, so a reload
 * comes up in Windows no matter what.
 */
const BANNER = [
  'A required system object was deleted.',
  '',
  'Windows could not start because My Computer is missing from the desktop.',
  'The graphical shell has been closed. Your files have not been touched.',
  '',
  'Microsoft(R) MS-DOS(R)  Version 8.00',
  '    (C)Copyright Microsoft Corp 1981-2001.',
  '',
  'Type WINDOWS to start the graphical shell, or HELP for the other options.',
  '',
]

const HELP = [
  '',
  'WINDOWS   Start the Windows graphical shell.',
  'RESTORE   Put My Computer back on the desktop, then start Windows.',
  'RESTART   Restart the computer.',
  'CLS       Clear the screen.',
  'VER       Display the MS-DOS version.',
  '',
]

const PROMPT = 'C:\\>'

export function DosScreen() {
  const [lines, setLines] = useState<string[]>(BANNER)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState<number | null>(null)

  const screenRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const screen = screenRef.current
    if (screen) screen.scrollTop = screen.scrollHeight
  }, [lines])

  const submit = () => {
    const entered = input
    setInput('')
    setCursor(null)

    const echoed = [...lines, `${PROMPT}${entered}`]
    const verb = entered.trim().toLowerCase()
    if (!verb) {
      setLines(echoed)
      return
    }
    setHistory((h) => [...h.filter((c) => c !== entered), entered])

    switch (verb) {
      case 'windows':
      case 'win':
        boot.start()
        return
      case 'restore':
        // Puts the shortcut back before handing control over, so the desktop it
        // starts into is the one that was there before.
        fs.restoreMyComputer()
        boot.start()
        return
      case 'restart':
        setLines([...echoed, '', 'Restarting...'])
        // The real POST, not a page reload — the boot state isn't persisted, so a
        // manual refresh is still the last resort if this ever went wrong.
        window.setTimeout(() => boot.restart(), 500)
        return
      case 'cls':
        setLines([])
        return
      case 'help':
        setLines([...echoed, ...HELP])
        return
      case 'ver':
        setLines([...echoed, '', 'MS-DOS Version 8.00', ''])
        return
      default:
        setLines([...echoed, 'Bad command or file name', ''])
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
      return
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    if (!history.length) return
    const at = cursor ?? history.length
    const next =
      e.key === 'ArrowUp' ? Math.max(0, at - 1) : Math.min(history.length, at + 1)
    setCursor(next)
    setInput(next === history.length ? '' : history[next])
  }

  return (
    <div
      className="dos"
      // There is nothing else on screen to click, so any click goes to the prompt.
      onPointerDown={(e) => {
        if (window.getSelection()?.isCollapsed !== false) {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }}
    >
      <div className="dos-screen" ref={screenRef}>
        {lines.map((line, i) => (
          <div key={i} className="dos-line">
            {line}
          </div>
        ))}

        <div className="dos-entry">
          <span className="dos-prompt">{PROMPT}</span>
          <input
            ref={inputRef}
            className="dos-input"
            value={input}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            aria-label="Command"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  )
}
