/**
 * Klondike, kept pure and free of React.
 *
 * Piles are plain arrays where the **last element is the top** — the card you can
 * see and pick up. That one convention removes most of the index arithmetic:
 * drawing, dropping and flipping are all `push`/`pop` at the end of an array.
 */

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds'
export type Scoring = 'standard' | 'vegas' | 'none'

export interface Card {
  /** Stable across the whole game — React keys off it. */
  id: string
  suit: Suit
  /** 1 = Ace … 13 = King. */
  rank: number
  faceUp: boolean
}

export interface Rules {
  drawThree: boolean
  scoring: Scoring
}

export interface Game {
  stock: Card[]
  waste: Card[]
  /** Four piles, any suit may claim any of them. */
  foundations: Card[][]
  tableau: Card[][]
  rules: Rules
  score: number
  /** Completed trips through the stock. The first one is free. */
  passes: number
  status: 'playing' | 'won'
}

export type Source =
  | { pile: 'waste' }
  | { pile: 'foundation'; index: number }
  /** `from` is where in the pile the grab started — everything above comes too. */
  | { pile: 'tableau'; index: number; from: number }

export type Target =
  | { pile: 'foundation'; index: number }
  | { pile: 'tableau'; index: number }

export const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds']

export const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds'

/** Index by rank, so `RANKS[1]` is `'A'`. */
export const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const SUIT_KEY: Record<Suit, string> = {
  spades: 'S',
  hearts: 'H',
  clubs: 'C',
  diamonds: 'D',
}

// ---------------------------------------------------------------- scoring

/**
 * Windows Solitaire's published tables. Vegas pays per card and charges you 52
 * up front; Standard rewards progress and punishes taking cards back.
 */
const SCORES = {
  standard: {
    toFoundation: 10,
    wasteToTableau: 5,
    fromFoundation: -15,
    flip: 5,
    recycleOne: -100,
    recycleThree: -20,
  },
  vegas: {
    toFoundation: 5,
    wasteToTableau: 0,
    fromFoundation: -5,
    flip: 0,
    recycleOne: 0,
    recycleThree: 0,
  },
  none: {
    toFoundation: 0,
    wasteToTableau: 0,
    fromFoundation: 0,
    flip: 0,
    recycleOne: 0,
    recycleThree: 0,
  },
} as const

/** Standard can't go below zero; Vegas is a running balance and can. */
function addScore(g: Game, delta: number): Game {
  if (!delta) return g
  const score = g.score + delta
  return { ...g, score: g.rules.scoring === 'vegas' ? score : Math.max(0, score) }
}

// ---------------------------------------------------------------- dealing

function freshDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `${SUIT_KEY[suit]}${rank}`, suit, rank, faceUp: false })
    }
  }
  return deck
}

function shuffle(deck: Card[]): Card[] {
  const out = [...deck]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = out[i]
    out[i] = out[j]
    out[j] = swap
  }
  return out
}

export function deal(rules: Rules): Game {
  const deck = shuffle(freshDeck())
  const tableau: Card[][] = []
  for (let i = 0; i < 7; i++) {
    // Piles get 1..7 cards, only the last of each turned up.
    const pile = deck.splice(0, i + 1).map((card, j) => ({ ...card, faceUp: j === i }))
    tableau.push(pile)
  }
  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    rules,
    score: rules.scoring === 'vegas' ? -52 : 0,
    passes: 0,
    status: 'playing',
  }
}

// ---------------------------------------------------------------- reads

const top = (pile: Card[]): Card | undefined => pile[pile.length - 1]

/** The cards a drag from `source` picks up, top-of-pile last. */
export function cardsInFlight(g: Game, source: Source): Card[] {
  if (source.pile === 'waste') {
    const card = top(g.waste)
    return card ? [card] : []
  }
  if (source.pile === 'foundation') {
    const card = top(g.foundations[source.index])
    return card ? [card] : []
  }
  const pile = g.tableau[source.index]
  const card = pile[source.from]
  // Face-up tableau cards are always already a valid descending run — that is the
  // only way they can have got there — so a grab needs no further checking.
  return card?.faceUp ? pile.slice(source.from) : []
}

export function canDrop(g: Game, cards: Card[], target: Target): boolean {
  const card = cards[0]
  if (!card) return false

  if (target.pile === 'foundation') {
    // Foundations take one card at a time, never a run.
    if (cards.length !== 1) return false
    const onto = top(g.foundations[target.index])
    return onto ? onto.suit === card.suit && onto.rank === card.rank - 1 : card.rank === 1
  }

  const onto = top(g.tableau[target.index])
  if (!onto) return card.rank === 13
  return onto.faceUp && onto.rank === card.rank + 1 && isRed(onto.suit) !== isRed(card.suit)
}

/** The first foundation that would accept `card`, for double-click auto-play. */
export function foundationFor(g: Game, card: Card): number | null {
  for (let i = 0; i < g.foundations.length; i++) {
    if (canDrop(g, [card], { pile: 'foundation', index: i })) return i
  }
  return null
}

const won = (g: Game) => g.foundations.every((p) => p.length === 13)

// ---------------------------------------------------------------- writes

/** Turn the stock over onto the waste, or the waste back into the stock. */
export function draw(g: Game): Game {
  if (g.status !== 'playing') return g
  const s = SCORES[g.rules.scoring]

  if (!g.stock.length) {
    if (!g.waste.length) return g
    const stock = [...g.waste].reverse().map((c) => ({ ...c, faceUp: false }))
    return addScore(
      { ...g, stock, waste: [], passes: g.passes + 1 },
      g.rules.drawThree ? s.recycleThree : s.recycleOne,
    )
  }

  const count = Math.min(g.rules.drawThree ? 3 : 1, g.stock.length)
  const stock = [...g.stock]
  // Flipping a packet reverses it: the stock's top card ends up underneath the
  // ones drawn after it, exactly as it does with a real deck in hand.
  const drawn = stock
    .splice(stock.length - count, count)
    .reverse()
    .map((c) => ({ ...c, faceUp: true }))
  return { ...g, stock, waste: [...g.waste, ...drawn] }
}

const SUIT_BY_KEY: Record<string, Suit> = {
  S: 'spades',
  H: 'hearts',
  C: 'clubs',
  D: 'diamonds',
}

/** Rebuilds a card from its id, which is all the Recycle Bin carries. */
export function cardFromId(id: string): Card | null {
  const suit = SUIT_BY_KEY[id[0]]
  const rank = Number(id.slice(1))
  if (!suit || !Number.isInteger(rank) || rank < 1 || rank > 13) return null
  return { id, suit, rank, faceUp: false }
}

/**
 * Takes the cards in flight out of the game altogether.
 *
 * This is `move` with nowhere to put them: the source pile is trimmed and a newly
 * exposed tableau card still turns up, but nothing receives them. It exists because
 * the Recycle Bin will accept a card dropped on it, and a card in the bin is not in
 * play. Returns null if there was nothing to take.
 */
export function discardFrom(
  g: Game,
  source: Source,
): { game: Game; cards: Card[] } | null {
  if (g.status !== 'playing') return null
  const cards = cardsInFlight(g, source)
  if (!cards.length) return null

  const foundations = g.foundations.map((p) => [...p])
  const tableau = g.tableau.map((p) => [...p])
  let waste = [...g.waste]

  if (source.pile === 'waste') waste = waste.slice(0, -1)
  else if (source.pile === 'foundation') foundations[source.index].pop()
  else tableau[source.index].length = source.from

  if (source.pile === 'tableau') {
    const pile = tableau[source.index]
    const exposed = pile[pile.length - 1]
    if (exposed && !exposed.faceUp) {
      pile[pile.length - 1] = { ...exposed, faceUp: true }
    }
  }

  return { game: { ...g, waste, foundations, tableau }, cards }
}

/**
 * Puts reclaimed cards back on top of the stock, face down, so the next click on the
 * deck turns them up. Any id already in play is dropped rather than duplicated — two
 * of the same card would make the rules unanswerable.
 *
 * Returns the same game object when nothing could come back, which is how the bin
 * knows to keep the item.
 */
export function returnToStock(g: Game, ids: string[]): Game {
  const inPlay = new Set(
    [
      ...g.stock,
      ...g.waste,
      ...g.foundations.flat(),
      ...g.tableau.flat(),
    ].map((c) => c.id),
  )
  const cards = ids
    .map(cardFromId)
    .filter((c): c is Card => !!c && !inPlay.has(c.id))
  if (!cards.length) return g

  // A card coming back means the deal isn't finished after all.
  return { ...g, stock: [...g.stock, ...cards], status: 'playing' }
}

/** `null` when the move isn't legal — callers use that to reject a drop. */
export function move(g: Game, source: Source, target: Target): Game | null {
  if (g.status !== 'playing') return null
  const cards = cardsInFlight(g, source)
  if (!cards.length || !canDrop(g, cards, target)) return null
  // Dropping a card back where it came from is a no-op, not a move.
  if (
    source.pile === 'tableau' &&
    target.pile === 'tableau' &&
    source.index === target.index
  ) {
    return null
  }

  const foundations = g.foundations.map((p) => [...p])
  const tableau = g.tableau.map((p) => [...p])
  let waste = [...g.waste]
  const s = SCORES[g.rules.scoring]
  let delta = 0

  if (source.pile === 'waste') waste = waste.slice(0, -1)
  else if (source.pile === 'foundation') foundations[source.index].pop()
  else tableau[source.index].length = source.from

  if (target.pile === 'foundation') {
    foundations[target.index].push(...cards)
    delta += s.toFoundation
  } else {
    tableau[target.index].push(...cards)
    if (source.pile === 'waste') delta += s.wasteToTableau
    if (source.pile === 'foundation') delta += s.fromFoundation
  }

  // Emptying down to a face-down card turns it up, which is worth points.
  if (source.pile === 'tableau') {
    const pile = tableau[source.index]
    const exposed = pile[pile.length - 1]
    if (exposed && !exposed.faceUp) {
      pile[pile.length - 1] = { ...exposed, faceUp: true }
      delta += s.flip
    }
  }

  const next: Game = { ...g, waste, foundations, tableau }
  return { ...addScore(next, delta), status: won(next) ? 'won' : 'playing' }
}
