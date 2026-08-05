import { useEffect, useRef, useState } from 'react'
import { DOCS_ID, getChildren, getNode, useFsVersion } from '@/os/fs.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { run, tokenize } from './commands.ts'
import { displayPath, resolve } from './paths.ts'
import './CommandPrompt.css'

const BANNER = [
  'Microsoft Windows XP [Version 5.1.2600]',
  '(C) Copyright 1985-2001 Microsoft Corp.',
  '',
]

interface CmdArgs {
  /** Node id to start in, for a future "Open command window here". */
  nodeId?: string
}

export function CommandPrompt({ windowId, args }: AppProps) {
  const { nodeId } = (args ?? {}) as CmdArgs
  useFsVersion()

  const [cwd, setCwd] = useState(nodeId ?? DOCS_ID)
  const [lines, setLines] = useState<string[]>(BANNER)
  const [input, setInput] = useState('')
  /** Newest last. `cursor` is where Up/Down currently sits. */
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState<number | null>(null)

  const screenRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // A deleted cwd (from Explorer, say) would leave the prompt pointing at nothing.
  const folder = getNode(cwd) ?? getNode(DOCS_ID)!
  const prompt = `${displayPath(folder.id)}>`

  useEffect(() => {
    const screen = screenRef.current
    if (screen) screen.scrollTop = screen.scrollHeight
  }, [lines])

  const submit = () => {
    const entered = input
    setInput('')
    setCursor(null)

    // The echoed command line becomes part of the scrollback, as it does for real.
    const echoed = [...lines, `${prompt}${entered}`]
    if (!entered.trim()) {
      setLines(echoed)
      return
    }
    setHistory((h) => [...h.filter((c) => c !== entered), entered])

    let cleared = false
    const output = run(
      {
        cwd: folder.id,
        chdir: setCwd,
        cls: () => {
          cleared = true
        },
        exit: () => wm.close(windowId),
        setTitle: (title) => wm.setTitle(windowId, title),
      },
      entered,
    )
    setLines(cleared ? [] : [...echoed, ...output, ''])
  }

  /** Up/Down walk the history; Tab completes the last token against the tree. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      if (!history.length) return
      const at = cursor ?? history.length
      const next =
        e.key === 'ArrowUp'
          ? Math.max(0, at - 1)
          : Math.min(history.length, at + 1)
      setCursor(next)
      setInput(next === history.length ? '' : history[next])
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const { args: tokens } = tokenize(input)
      const partial = tokens[tokens.length - 1] ?? ''
      // Complete within whatever directory the partial name already points into.
      const slash = Math.max(partial.lastIndexOf('\\'), partial.lastIndexOf('/'))
      const dir = slash >= 0 ? partial.slice(0, slash + 1) : ''
      const stem = slash >= 0 ? partial.slice(slash + 1) : partial
      const base = dir ? resolve(folder.id, dir) : folder
      if (!base || base.kind !== 'folder') return

      const hit = getChildren(base.id).find((n) =>
        n.name.toLowerCase().startsWith(stem.toLowerCase()),
      )
      if (!hit) return
      const quoted = hit.name.includes(' ') ? `"${dir}${hit.name}"` : `${dir}${hit.name}`
      setInput(input.slice(0, input.length - partial.length) + quoted)
    }
  }

  return (
    <div
      className="xp-cmd"
      // Clicking anywhere in a console puts you back at the prompt.
      onPointerDown={(e) => {
        if (window.getSelection()?.isCollapsed !== false) {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }}
    >
      <div className="xp-window-content">
        <div className="xp-cmd-screen" ref={screenRef}>
          {lines.map((line, i) => (
            <div key={i} className="xp-cmd-line">
              {line}
            </div>
          ))}

          <div className="xp-cmd-entry">
            <span className="xp-cmd-prompt">{prompt}</span>
            <input
              ref={inputRef}
              className="xp-cmd-input"
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
    </div>
  )
}
