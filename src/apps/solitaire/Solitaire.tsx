import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { MessageBox } from '@/components/ui/MessageBox.tsx'
import { discard } from '@/os/discard.ts'
import {
  clearDropHover,
  isRecycleTargetAt,
  trackRecycleHover,
} from '@/os/dnd.ts'
import type { AppProps } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import { CardView } from './Card.tsx'
import {
  RANKS,
  cardsInFlight,
  deal,
  discardFrom,
  draw,
  foundationFor,
  move,
  returnToStock,
} from './engine.ts'
import type { Card, Game, Source, Target } from './engine.ts'
import { loadOptions, saveOptions } from './options.ts'
import type { Options } from './options.ts'
import { DeckDialog, OptionsDialog } from './dialogs.tsx'
import { buildSolitaireMenus } from './solitaireMenus.ts'
import './Solitaire.css'

/** Must match `.xp-sol-card` in Solitaire.css. */
const CARD_W = 71
const CARD_H = 96
/** How much of a covered card stays visible. Face-down cards sit tighter. */
const FAN_UP = 19
const FAN_DOWN = 7
/** Horizontal spread of the waste in Draw Three. */
const FAN_X = 14
/** Manhattan pixels before a press becomes a drag rather than a click. */
const DRAG_SLOP = 4

interface DragState {
  source: Source
  cards: Card[]
  /** Where the layer mounts, so its first paint is already under the pointer. */
  x: number
  y: number
}

/** Live gesture bookkeeping. Never state — it changes many times per frame. */
interface Gesture {
  source: Source
  cards: Card[]
  pointerId: number
  /** Grab point inside the card, so it doesn't snap to a corner. */
  dx: number
  dy: number
  /** Pointer position at pointerdown, for the slop test. */
  fromX: number
  fromY: number
  /** The card's own top-left at pointerdown, in layer coordinates. */
  originX: number
  originY: number
  /** Top-left of the layer's containing block — see `beginGesture`. */
  frameX: number
  frameY: number
  started: boolean
  /** The Recycle Bin element currently lit up, if the card is over it. */
  binHover: Element | null
}

/** Stack positions for one pile, plus the height needed to hold them. */
function fan(cards: Card[]) {
  const layout: { card: Card; y: number }[] = []
  let y = 0
  for (const card of cards) {
    layout.push({ card, y })
    y += card.faceUp ? FAN_UP : FAN_DOWN
  }
  const last = layout[layout.length - 1]
  return { layout, height: (last?.y ?? 0) + CARD_H }
}

/**
 * Where a dragged card lands: the drop target its own rectangle covers most.
 *
 * Hit-testing the pointer instead is what the real game doesn't do, and it feels
 * wrong for a good reason — grab a card near its bottom corner and the pointer is
 * most of a card-width away from the card you are aiming. Overlap area is also
 * what settles a card straddling the gutter between two piles.
 */
function dropTargetFor(root: HTMLElement, left: number, top: number): Target | null {
  const card = { left, top, right: left + CARD_W, bottom: top + CARD_H }
  let best: { target: Target; area: number } | null = null

  for (const el of root.querySelectorAll<HTMLElement>('[data-drop]')) {
    const [pile, index] = (el.dataset.drop ?? '').split(':')
    if (pile !== 'foundation' && pile !== 'tableau') continue

    const box = el.getBoundingClientRect()
    const w = Math.min(card.right, box.right) - Math.max(card.left, box.left)
    const h = Math.min(card.bottom, box.bottom) - Math.max(card.top, box.top)
    if (w <= 0 || h <= 0) continue

    const area = w * h
    if (!best || area > best.area) {
      best = { target: { pile, index: Number(index) }, area }
    }
  }
  return best?.target ?? null
}

export function Solitaire({ windowId }: AppProps) {
  const [options, setOptions] = useState(loadOptions)
  const [game, setGame] = useState<Game>(() =>
    deal({ drawThree: options.drawThree, scoring: options.scoring }),
  )
  /** One level of undo, which is all XP's Solitaire ever offered. */
  const [prev, setPrev] = useState<Game | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dialog, setDialog] = useState<'options' | 'deck' | 'about' | null>(null)
  const [wonPrompt, setWonPrompt] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  /** Tears down the in-flight gesture's listeners, whoever ends it. */
  const endGesture = useRef<(() => void) | null>(null)

  const focused = useIsFocused(windowId)

  const newDeal = useCallback(
    (rules = { drawThree: options.drawThree, scoring: options.scoring }) => {
      setGame(deal(rules))
      setPrev(null)
      setSeconds(0)
      setDrag(null)
      setWonPrompt(false)
    },
    [options.drawThree, options.scoring],
  )

  /** Every state-advancing path goes through here, so undo is always armed. */
  const commit = useCallback(
    (next: Game | null) => {
      if (!next || next === game) return
      setPrev(game)
      setGame(next)
      if (next.status === 'won') setWonPrompt(true)
    },
    [game],
  )

  useEffect(() => {
    if (game.status !== 'playing') return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [game.status])

  useEffect(() => {
    if (!focused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return
      if ((e.target as HTMLElement).closest?.('.xp-dialog')) return
      e.preventDefault()
      newDeal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focused, newDeal])

  // Closing the window mid-drag must not leave listeners on the document.
  useEffect(() => () => endGesture.current?.(), [])

  /**
   * A card dropped on the Recycle Bin leaves play, and restoring it puts it back on
   * the deck — which is a way to unstick a dead deal, and precisely the kind of
   * thing you could get away with in a game that never checked.
   */
  const binCards = (from: Game, source: Source) => {
    const taken = discardFrom(from, source)
    if (!taken) return
    const names = taken.cards.map(
      (c) => `${RANKS[c.rank]} of ${c.suit[0].toUpperCase()}${c.suit.slice(1)}`,
    )
    discard.add({
      appId: 'solitaire',
      iconId: 'solitaire',
      label: names.length === 1 ? names[0] : `${names.length} cards`,
      kind: 'Playing Card',
      origin: 'Solitaire',
      payload: taken.cards.map((c) => c.id).join(','),
    })
    commit(taken.game)
  }

  /**
   * Registered for as long as the window is open.
   *
   * The bin needs a synchronous yes or no, so the current game is read through a ref
   * rather than out of a `setGame` updater — an updater has to stay pure, and React
   * gives no promise about having run it by the time the setter returns.
   */
  const latestGame = useRef(game)
  useEffect(() => {
    latestGame.current = game
  })

  useEffect(
    () =>
      discard.handle('solitaire', (payload) => {
        const before = latestGame.current
        const next = returnToStock(before, payload.split(','))
        // Unchanged means every card was already back in play. Nothing to take.
        if (next === before) return false
        setPrev(before)
        setGame(next)
        return true
      }),
    [],
  )

  // ------------------------------------------------------------- dragging

  /**
   * The gesture runs on document listeners rather than pointer capture.
   *
   * Capture would be the obvious choice, but the card that receives pointerdown
   * is removed from its pile the moment the drag starts — it's being carried, so
   * it can't also still be sitting on the pile — and a detached element loses
   * capture, which strands the cards mid-table.
   *
   * The drag also doesn't begin until the pointer has travelled `DRAG_SLOP`. That
   * keeps the card mounted through a plain click, which is what lets `dblclick`
   * fire at all: the browser needs both clicks to land on the same element.
   *
   * Positions are held in viewport coordinates and converted to the layer's own
   * space on the way out. The layer is absolute against `.xp-solitaire` rather
   * than fixed to the viewport on purpose: `.xp-window` carries a `transform`,
   * which makes it the containing block for anything `position: fixed` inside it
   * — so a "fixed" layer silently sat at the window's offset, and stopped doing
   * that when the window was maximized and the transform went away.
   */
  const beginGesture = (e: ReactPointerEvent<HTMLDivElement>, source: Source) => {
    if (e.button !== 0 || game.status !== 'playing' || endGesture.current) return
    const cards = cardsInFlight(game, source)
    const root = rootRef.current
    if (!cards.length || !root) return

    const box = e.currentTarget.getBoundingClientRect()
    const layerOrigin = root.getBoundingClientRect()
    const g: Gesture = {
      source,
      cards,
      pointerId: e.pointerId,
      dx: e.clientX - box.left,
      dy: e.clientY - box.top,
      fromX: e.clientX,
      fromY: e.clientY,
      originX: box.left - layerOrigin.left,
      originY: box.top - layerOrigin.top,
      frameX: layerOrigin.left,
      frameY: layerOrigin.top,
      started: false,
      binHover: null,
    }

    let frame = 0
    let at = { x: g.originX, y: g.originY }
    // Board and root are captured here: neither can change while a drag is in
    // flight, and the annotation is what carries the null check into the hoisted
    // handlers below.
    const board = game
    const table: HTMLElement = root

    function paint() {
      frame = 0
      if (layerRef.current) {
        layerRef.current.style.transform = `translate(${at.x}px, ${at.y}px)`
      }
    }

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== g.pointerId) return
      at = { x: ev.clientX - g.dx - g.frameX, y: ev.clientY - g.dy - g.frameY }

      if (!g.started) {
        const travelled =
          Math.abs(ev.clientX - g.fromX) + Math.abs(ev.clientY - g.fromY)
        if (travelled <= DRAG_SLOP) return
        g.started = true
        // Mounts already positioned, so there is no first-frame jump.
        setDrag({ source: g.source, cards: g.cards, x: at.x, y: at.y })
        return
      }
      // A high-rate pointer fires several times per frame; one write is enough.
      if (!frame) frame = requestAnimationFrame(paint)
      // Light the Recycle Bin up when the card is over it, so the drop isn't a
      // surprise. It's the only target outside the table that will take one.
      g.binHover = trackRecycleHover(ev.clientX, ev.clientY, g.binHover)
    }

    function onUp(ev: PointerEvent) {
      if (ev.pointerId !== g.pointerId) return
      const dragged = g.started
      cleanup()
      if (!dragged) return
      setDrag(null)

      // The card's viewport rectangle, not the pointer, decides the pile.
      const target = dropTargetFor(table, ev.clientX - g.dx, ev.clientY - g.dy)
      if (target) {
        commit(move(board, g.source, target))
        return
      }

      // Nothing in the game wanted it. The Recycle Bin will take it — the pointer
      // decides that one, because a bin icon is something you aim at.
      if (isRecycleTargetAt(ev.clientX, ev.clientY)) binCards(board, g.source)
    }

    function onCancel(ev: PointerEvent) {
      if (ev.pointerId !== g.pointerId) return
      cleanup()
      setDrag(null)
    }

    function cleanup() {
      if (frame) cancelAnimationFrame(frame)
      clearDropHover(g.binHover)
      g.binHover = null
      endGesture.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
    }

    endGesture.current = () => {
      cleanup()
      setDrag(null)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onCancel)
  }

  /** Double-click: send a card straight to whichever foundation will take it. */
  const autoPlay = (card: Card, source: Source) => {
    const index = foundationFor(game, card)
    if (index !== null) commit(move(game, source, { pile: 'foundation', index }))
  }

  const cardHandlers = (source: Source, card: Card) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => beginGesture(e, source),
    onDoubleClick: () => autoPlay(card, source),
  })

  // ------------------------------------------------------------- display

  // Cards in hand are hidden at their origin, so they read as lifted off it.
  const heldWaste = drag?.source.pile === 'waste'
  const heldFoundation = drag?.source.pile === 'foundation' ? drag.source.index : -1

  const wasteAll = heldWaste ? game.waste.slice(0, -1) : game.waste
  const wasteShown = wasteAll.slice(options.drawThree ? -3 : -1)

  const timePenalty = options.timed ? Math.floor(seconds / 10) * 2 : 0
  const timeBonus =
    options.timed && game.status === 'won' && seconds > 30
      ? Math.floor(700_000 / seconds)
      : 0
  const rawScore = game.score - timePenalty + timeBonus
  const score = options.scoring === 'vegas' ? rawScore : Math.max(0, rawScore)

  const applyOptions = (next: Options) => {
    const restart =
      next.drawThree !== options.drawThree || next.scoring !== options.scoring
    setOptions(next)
    saveOptions(next)
    setDialog(null)
    if (restart) newDeal({ drawThree: next.drawThree, scoring: next.scoring })
  }

  const menus = buildSolitaireMenus(
    {
      deal: () => newDeal(),
      undo: () => {
        if (!prev) return
        setGame(prev)
        setPrev(null)
        setWonPrompt(false)
      },
      deck: () => setDialog('deck'),
      options: () => setDialog('options'),
      exit: () => wm.close(windowId),
      about: () => setDialog('about'),
    },
    !!prev,
  )

  return (
    <div className="xp-solitaire" ref={rootRef}>
      <MenuBar menus={menus} />

      <div className="xp-window-content">
        <div className="xp-sol-table">
          <div className="xp-sol-row">
            {/* Stock. Not a drop target — cards only ever leave it. */}
            <div
              className="xp-sol-slot xp-sol-stock"
              data-empty={game.stock.length === 0}
              onClick={() => commit(draw(game))}
              title={game.stock.length ? 'Draw' : 'Turn the deck over'}
            >
              {game.stock.length > 0 && (
                <CardView
                  card={game.stock[game.stock.length - 1]}
                  back={options.back}
                />
              )}
            </div>

            <div className="xp-sol-slot xp-sol-waste">
              {wasteShown.map((card, i) => (
                <CardView
                  key={card.id}
                  card={card}
                  back={options.back}
                  style={{ left: i * FAN_X }}
                  {...(i === wasteShown.length - 1
                    ? cardHandlers({ pile: 'waste' }, card)
                    : {})}
                />
              ))}
            </div>

            {/* Column three stayed empty in XP, giving the waste room to fan. */}
            <div className="xp-sol-gap" />

            {game.foundations.map((pile, index) => {
              const shown = (
                heldFoundation === index ? pile.slice(0, -1) : pile
              ).slice(-1)
              return (
                <div
                  key={index}
                  className="xp-sol-slot"
                  data-drop={`foundation:${index}`}
                >
                  {shown.map((card) => (
                    <CardView
                      key={card.id}
                      card={card}
                      back={options.back}
                      {...cardHandlers({ pile: 'foundation', index }, card)}
                    />
                  ))}
                </div>
              )
            })}
          </div>

          <div className="xp-sol-row xp-sol-tableau">
            {game.tableau.map((pile, index) => {
              const cut =
                drag?.source.pile === 'tableau' && drag.source.index === index
                  ? drag.source.from
                  : pile.length
              const { layout, height } = fan(pile.slice(0, cut))
              return (
                <div
                  key={index}
                  className="xp-sol-pile"
                  data-drop={`tableau:${index}`}
                  style={{ height }}
                >
                  {layout.map(({ card, y }, j) => (
                    <CardView
                      key={card.id}
                      card={card}
                      back={options.back}
                      style={{ top: y }}
                      {...(card.faceUp
                        ? cardHandlers({ pile: 'tableau', index, from: j }, card)
                        : {})}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {options.statusBar && (
        <div className="xp-statusbar xp-sol-status">
          <span className="xp-statusbar-cell">
            {options.scoring === 'none' ? '' : `Score: ${score}`}
          </span>
          <span className="xp-statusbar-cell">Time: {seconds}</span>
        </div>
      )}

      {/* Fixed to the viewport and untouchable, so the drop hit-test underneath
          it sees the pile rather than the cards being carried. */}
      {drag && (
        <div
          ref={layerRef}
          className="xp-sol-drag"
          style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
        >
          {drag.cards.map((card, i) => (
            <CardView
              key={card.id}
              card={card}
              back={options.back}
              style={{ top: i * FAN_UP }}
            />
          ))}
        </div>
      )}

      {dialog === 'options' && (
        <OptionsDialog
          options={options}
          onConfirm={applyOptions}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === 'deck' && (
        <DeckDialog
          back={options.back}
          onCancel={() => setDialog(null)}
          onConfirm={(back) => {
            const next = { ...options, back }
            setOptions(next)
            saveOptions(next)
            setDialog(null)
          }}
        />
      )}

      {dialog === 'about' && (
        <Dialog title="About Solitaire" onClose={() => setDialog(null)}>
          <div className="xp-sol-about">
            <strong>Solitaire</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            Klondike. Drag a card onto the next one down in the other colour, or
            double-click to send it home. Aces first.
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

      {wonPrompt && (
        <MessageBox
          title="Solitaire"
          variant="info"
          message={`Congratulations! You have won the game.\n\n${
            options.scoring === 'none' ? '' : `Final score: ${score}\n\n`
          }Deal again?`}
          buttons={[
            { label: 'Yes', primary: true, onClick: () => newDeal() },
            { label: 'No', onClick: () => setWonPrompt(false) },
          ]}
          onClose={() => setWonPrompt(false)}
        />
      )}
    </div>
  )
}
