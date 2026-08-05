import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import type { AppProps } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import {
  LEVELS,
  chord,
  chordTargets,
  createBoard,
  cycleMark,
  levelNameFor,
  minesLeft,
  reveal,
} from './engine.ts'
import type { Board, Cell, Level } from './engine.ts'
import { loadBestTimes, resetBestTimes, saveBestTimes } from './bestTimes.ts'
import type { ScoredLevel } from './bestTimes.ts'
import { LedDisplay, MineGlyph, FlagGlyph, SmileyFace } from './glyphs.tsx'
import type { FaceMood } from './glyphs.tsx'
import { CELL_PX, windowSizeFor } from './metrics.ts'
import { BestTimesDialog, CustomFieldDialog, NewRecordDialog } from './dialogs.tsx'
import { buildMinesweeperMenus } from './minesweeperMenus.ts'
import './Minesweeper.css'

type DialogName = 'custom' | 'best' | 'about'

/** What a cell looks like, which is not quite the same as its logical state. */
function cellFace(cell: Cell, board: Board, down: boolean) {
  if (cell.state === 'revealed') {
    return cell.mine ? (cell.detonated ? 'boom' : 'mine') : 'open'
  }
  // A flag still standing on a safe square once the game is lost was a wrong
  // guess — the only place the board shows you a mistake you didn't step on.
  if (cell.state === 'flagged') {
    return board.status === 'lost' && !cell.mine ? 'wrong' : 'flag'
  }
  if (cell.state === 'marked') return down ? 'mark-down' : 'mark'
  return down ? 'down' : 'up'
}

export function Minesweeper({ windowId }: AppProps) {
  const [level, setLevel] = useState<Level>(LEVELS.beginner)
  const [board, setBoard] = useState<Board>(() => createBoard(LEVELS.beginner))
  const [seconds, setSeconds] = useState(0)
  const [marks, setMarks] = useState(true)
  const [times, setTimes] = useState(loadBestTimes)

  /** Cells drawn depressed while the pointer is held — one cell, or a chord's 3x3. */
  const [pressed, setPressed] = useState<number[]>([])
  const gesture = useRef<{ chordish: boolean } | null>(null)

  const [dialog, setDialog] = useState<DialogName | null>(null)
  const [record, setRecord] = useState<ScoredLevel | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const focused = useIsFocused(windowId)
  const over = board.status === 'won' || board.status === 'lost'

  const newGame = useCallback(
    (next: Level = level) => {
      setLevel(next)
      setBoard(createBoard(next))
      setSeconds(0)
      setPressed([])
    },
    [level],
  )

  // The field is fixed-size artwork, so the window is sized to fit it rather than
  // the other way round. Switching level is the whole reason this exists: an
  // Expert field is nearly three times the width of a Beginner one.
  const { rows, cols } = board
  useEffect(() => {
    wm.setSize(windowId, windowSizeFor({ rows, cols }))
  }, [windowId, rows, cols])

  useEffect(() => {
    if (board.status !== 'playing') return
    const id = window.setInterval(
      () => setSeconds((s) => Math.min(s + 1, 999)),
      1000,
    )
    return () => window.clearInterval(id)
  }, [board.status])

  // F2 is a window accelerator, not a field shortcut, so it hangs off the
  // document and is gated on this window having focus.
  useEffect(() => {
    if (!focused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return
      if ((e.target as HTMLElement).closest?.('.xp-dialog')) return
      e.preventDefault()
      newGame()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focused, newGame])

  const commit = (next: Board) => {
    setBoard(next)
    if (next.status !== 'won') return
    const name = levelNameFor(next)
    // Custom fields keep no record — there would be nothing to compare against.
    if (name === 'custom') return
    if (seconds < times[name].time) setRecord(name)
  }

  const storeRecord = (name: string) => {
    if (!record) return
    const next = { ...times, [record]: { time: seconds, name } }
    setTimes(next)
    saveBestTimes(next)
    setRecord(null)
  }

  // ------------------------------------------------------------- pointer

  /**
   * Hit-tested through the document rather than from the event target: the grid
   * holds pointer capture for the whole gesture, so `e.target` stays the grid no
   * matter which cell the pointer is actually over.
   */
  const cellAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.xp-ms-cell')
    // A dialog or another window over the grid must not register as a cell.
    if (!el || !gridRef.current?.contains(el)) return null
    const i = Number(el.dataset.i)
    return Number.isInteger(i) ? i : null
  }

  /** Which cells a press at `i` should depress. */
  const pressTargets = (i: number, chordish: boolean): number[] => {
    const cell = board.cells[i]
    if (chordish || cell.state === 'revealed') return chordTargets(board, i)
    return cell.state === 'hidden' ? [i] : []
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (over) return
    const i = cellAt(e.clientX, e.clientY)
    if (i === null) return

    // Middle button, or the classic both-buttons grip, means "chord".
    const bothButtons = (e.buttons & 1) !== 0 && (e.buttons & 2) !== 0
    const chordish = e.button === 1 || bothButtons

    if (e.button === 2 && !chordish) {
      setBoard(cycleMark(board, i, marks))
      return
    }
    if (e.button !== 0 && !chordish) return

    gesture.current = { chordish }
    setPressed(pressTargets(i, chordish))
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g) return
    const i = cellAt(e.clientX, e.clientY)
    setPressed(i === null ? [] : pressTargets(i, g.chordish))
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    gesture.current = null
    setPressed([])
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (!g || over) return

    const i = cellAt(e.clientX, e.clientY)
    if (i === null) return

    // Left-clicking a revealed number chords too. Real winmine wanted both
    // buttons, which a trackpad cannot express at all.
    if (g.chordish || board.cells[i].state === 'revealed') {
      commit(chord(board, i))
      return
    }
    // The clock starts at 1 the instant the first cell opens, as it did in XP.
    if (board.status === 'ready' && board.cells[i].state === 'hidden') setSeconds(1)
    commit(reveal(board, i))
  }

  const cancelPress = () => {
    gesture.current = null
    setPressed([])
  }

  // ------------------------------------------------------------- render

  const mood: FaceMood =
    board.status === 'lost'
      ? 'dead'
      : board.status === 'won'
        ? 'cool'
        : pressed.length > 0
          ? 'ooh'
          : 'smile'

  const menus = buildMinesweeperMenus(
    {
      newGame: () => newGame(),
      setLevel: (name) => newGame(LEVELS[name]),
      custom: () => setDialog('custom'),
      toggleMarks: () => setMarks((v) => !v),
      bestTimes: () => setDialog('best'),
      exit: () => wm.close(windowId),
      about: () => setDialog('about'),
    },
    { level: levelNameFor(level), marks },
  )

  const down = new Set(pressed)

  return (
    <div className="xp-minesweeper">
      <MenuBar menus={menus} />

      <div className="xp-window-content">
        <div className="xp-ms-panel">
          <div className="xp-ms-status">
            <LedDisplay value={minesLeft(board)} label="Mines remaining" />
            <button
              type="button"
              className="xp-ms-face"
              onClick={() => newGame()}
              aria-label="New game"
            >
              <SmileyFace mood={mood} />
            </button>
            <LedDisplay value={seconds} label="Elapsed seconds" />
          </div>

          <div
            className="xp-ms-grid"
            ref={gridRef}
            style={{ gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
          >
            {board.cells.map((cell, i) => {
              const face = cellFace(cell, board, down.has(i))
              return (
                <div key={i} className="xp-ms-cell" data-i={i} data-face={face}>
                  {face === 'open' && cell.adjacent > 0 && (
                    <span className="xp-ms-count" data-n={cell.adjacent}>
                      {cell.adjacent}
                    </span>
                  )}
                  {(face === 'mine' || face === 'boom') && <MineGlyph />}
                  {face === 'wrong' && <MineGlyph crossed />}
                  {face === 'flag' && <FlagGlyph />}
                  {(face === 'mark' || face === 'mark-down') && (
                    <span className="xp-ms-mark">?</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {dialog === 'custom' && (
        <CustomFieldDialog
          level={level}
          onCancel={() => setDialog(null)}
          onConfirm={(next) => {
            setDialog(null)
            newGame(next)
          }}
        />
      )}

      {dialog === 'best' && (
        <BestTimesDialog
          times={times}
          onReset={() => setTimes(resetBestTimes())}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'about' && (
        <Dialog title="About Minesweeper" onClose={() => setDialog(null)}>
          <div className="xp-ms-about">
            <strong>Minesweeper</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            Clear the field without uncovering a mine. Right-click to flag one;
            click a number once its flags are all placed to open the rest.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setDialog(null)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}

      {record && (
        <NewRecordDialog
          level={record}
          currentName={times[record].name}
          onSubmit={storeRecord}
        />
      )}
    </div>
  )
}
