/**
 * Standard Calculator, as a state machine over the *display* rather than over a
 * parsed expression — which is what calc.exe does, and why its quirks are worth
 * reproducing exactly:
 *
 * - `2 + 3 +` shows 5 and waits, because the second operator settles the first.
 * - `=` pressed twice repeats the last operation on the running total.
 * - `50 + 10 %` shows 5, not 0.1: percent reads the pending left operand.
 *
 * Everything here is pure. The component holds one `CalcState` and feeds it keys.
 */

export type Op = 'add' | 'sub' | 'mul' | 'div'

export type CalcKey =
  | { kind: 'digit'; value: string }
  | { kind: 'dot' }
  | { kind: 'op'; value: Op }
  | { kind: 'equals' }
  | { kind: 'negate' }
  | { kind: 'sqrt' }
  | { kind: 'percent' }
  | { kind: 'reciprocal' }
  | { kind: 'clear' }
  | { kind: 'clearEntry' }
  | { kind: 'back' }
  | { kind: 'memory'; value: 'clear' | 'recall' | 'store' | 'add' }

export interface CalcState {
  /** Always renderable as-is. Held as text so trailing dots and zeros survive. */
  display: string
  /** Left operand of the pending operation. */
  acc: number | null
  op: Op | null
  /** True while the display is an entry in progress rather than a result. */
  typing: boolean
  memory: number
  /** Set by divide-by-zero and friends; only C and CE clear it. */
  error: string | null
  /** What a second `=` should do again. */
  repeat: { op: Op; operand: number } | null
}

export const INITIAL: CalcState = {
  display: '0',
  acc: null,
  op: null,
  typing: false,
  memory: 0,
  error: null,
  repeat: null,
}

/** calc.exe's Standard mode carried 32 digits; 16 is where doubles stop lying. */
const MAX_DIGITS = 16

const DIVIDE_BY_ZERO = 'Cannot divide by zero'

/** Number to display text, with float noise trimmed off the end. */
function show(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '0'
  if (n === 0) return '0'
  // 0.1 + 0.2 must read as 0.3, not 0.30000000000000004.
  const trimmed = Number(n.toPrecision(15))
  return String(trimmed)
}

const value = (s: CalcState) => Number(s.display) || 0

function compute(a: number, op: Op, b: number): number | null {
  switch (op) {
    case 'add':
      return a + b
    case 'sub':
      return a - b
    case 'mul':
      return a * b
    case 'div':
      return b === 0 ? null : a / b
  }
}

/** Groups the integer part in threes, for View ▸ Digit grouping. */
export function groupDigits(display: string): string {
  const [whole, fraction] = display.split('.')
  const sign = whole.startsWith('-') ? '-' : ''
  const digits = sign ? whole.slice(1) : whole
  if (digits.length < 4 || !/^\d+$/.test(digits)) return display
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}${grouped}${fraction === undefined ? '' : `.${fraction}`}`
}

export function applyKey(state: CalcState, key: CalcKey): CalcState {
  // An error latches the display: only clearing gets you out.
  if (state.error && key.kind !== 'clear' && key.kind !== 'clearEntry') return state

  switch (key.kind) {
    case 'digit': {
      if (!state.typing) {
        return { ...state, display: key.value, typing: true, error: null }
      }
      const digits = state.display.replace(/[-.]/g, '').length
      if (digits >= MAX_DIGITS) return state
      const display = state.display === '0' ? key.value : state.display + key.value
      return { ...state, display }
    }

    case 'dot': {
      if (!state.typing) return { ...state, display: '0.', typing: true }
      if (state.display.includes('.')) return state
      return { ...state, display: `${state.display}.` }
    }

    case 'op': {
      // Only a typed operand settles the pending operation; pressing two
      // operators in a row just changes which one is pending.
      if (state.op && state.acc !== null && state.typing) {
        const result = compute(state.acc, state.op, value(state))
        if (result === null) return { ...state, error: DIVIDE_BY_ZERO, display: DIVIDE_BY_ZERO }
        return {
          ...state,
          display: show(result),
          acc: result,
          op: key.value,
          typing: false,
          repeat: null,
        }
      }
      return { ...state, acc: value(state), op: key.value, typing: false, repeat: null }
    }

    case 'equals': {
      if (state.op && state.acc !== null) {
        const operand = value(state)
        const result = compute(state.acc, state.op, operand)
        if (result === null) return { ...state, error: DIVIDE_BY_ZERO, display: DIVIDE_BY_ZERO }
        return {
          ...state,
          display: show(result),
          acc: null,
          op: null,
          typing: false,
          repeat: { op: state.op, operand },
        }
      }
      // A bare `=` after a completed sum runs the same operation again.
      if (state.repeat) {
        const result = compute(value(state), state.repeat.op, state.repeat.operand)
        if (result === null) return { ...state, error: DIVIDE_BY_ZERO, display: DIVIDE_BY_ZERO }
        return { ...state, display: show(result), typing: false }
      }
      return { ...state, typing: false }
    }

    case 'negate': {
      if (state.typing && state.display !== '0') {
        const display = state.display.startsWith('-')
          ? state.display.slice(1)
          : `-${state.display}`
        return { ...state, display }
      }
      return { ...state, display: show(-value(state)) }
    }

    case 'sqrt': {
      const n = value(state)
      if (n < 0) {
        return { ...state, error: 'Invalid input for function', display: 'Invalid input for function' }
      }
      // The result becomes the operand, so `9 + 16 sqrt =` gives 13.
      return { ...state, display: show(Math.sqrt(n)), typing: true }
    }

    case 'percent': {
      // Percent of the pending left operand — this is the one everybody trips on.
      const base = state.op && state.acc !== null ? state.acc : 1
      return { ...state, display: show((base * value(state)) / 100), typing: true }
    }

    case 'reciprocal': {
      const n = value(state)
      if (n === 0) return { ...state, error: DIVIDE_BY_ZERO, display: DIVIDE_BY_ZERO }
      return { ...state, display: show(1 / n), typing: true }
    }

    case 'back': {
      if (!state.typing) return state
      const display = state.display.slice(0, -1)
      return { ...state, display: display === '' || display === '-' ? '0' : display }
    }

    case 'clearEntry':
      return { ...state, display: '0', typing: false, error: null }

    case 'clear':
      return { ...INITIAL, memory: state.memory }

    case 'memory': {
      switch (key.value) {
        case 'clear':
          return { ...state, memory: 0 }
        case 'store':
          return { ...state, memory: value(state), typing: false }
        case 'add':
          return { ...state, memory: state.memory + value(state), typing: false }
        case 'recall':
          return { ...state, display: show(state.memory), typing: true }
      }
    }
  }
}
