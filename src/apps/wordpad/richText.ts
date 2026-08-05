/**
 * The formatting layer, such as it is: `document.execCommand`.
 *
 * It has been deprecated for years and there is still nothing else that edits rich
 * text in a contenteditable without hand-rolling a document model — Notepad already
 * reaches for it to keep the textarea's native undo stack, for the same reason. It
 * is confined to this file so the component never touches it directly.
 */

export type Mark = 'bold' | 'italic' | 'underline'
export type Align = 'left' | 'center' | 'right'

/** Fonts worth offering. The bundled subsets are Tahoma and Trebuchet; the rest
 *  fall through to whatever the machine has, which is the point of a font list. */
export const FONTS = [
  'Arial',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
]

/**
 * `fontSize` only understands the legacy 1-7 scale, and these are the point sizes
 * browsers actually map it onto — so offering exactly these seven means the dropdown
 * never lies about what it did. WordPad's own list was longer.
 */
export const SIZES: { label: string; value: string }[] = [
  { label: '8', value: '1' },
  { label: '10', value: '2' },
  { label: '12', value: '3' },
  { label: '14', value: '4' },
  { label: '18', value: '5' },
  { label: '24', value: '6' },
  { label: '36', value: '7' },
]

/** The sixteen the colour dropdown offered. */
export const TEXT_COLORS = [
  '#000000',
  '#800000',
  '#008000',
  '#808000',
  '#000080',
  '#800080',
  '#008080',
  '#808080',
  '#c0c0c0',
  '#ff0000',
  '#00ff00',
  '#ffff00',
  '#0000ff',
  '#ff00ff',
  '#00ffff',
  '#ffffff',
]

const run = (command: string, value?: string) => {
  try {
    document.execCommand(command, false, value)
  } catch {
    // Nothing to report: an unsupported command just leaves the text as it was.
  }
}

export const toggleMark = (mark: Mark) => run(mark)

export const setAlign = (align: Align) =>
  run(align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight')

export const setFont = (family: string) => run('fontName', family)
export const setSize = (value: string) => run('fontSize', value)
export const setColor = (color: string) => run('foreColor', color)
export const bulletList = () => run('insertUnorderedList')
export const undo = () => run('undo')
export const redo = () => run('redo')
export const cut = () => run('cut')
export const copy = () => run('copy')
export const insertText = (text: string) => run('insertText', text)
export const selectAll = () => run('selectAll')

/** Paste has to come through the async clipboard — `execCommand('paste')` is barred. */
export function paste() {
  void navigator.clipboard
    ?.readText()
    .then((text) => insertText(text))
    .catch(() => {})
}

export interface Formatting {
  bold: boolean
  italic: boolean
  underline: boolean
  align: Align
  bullets: boolean
}

/** What the caret is sitting in, so the format bar can show it pressed. */
export function currentFormatting(): Formatting {
  const state = (command: string) => {
    try {
      return document.queryCommandState(command)
    } catch {
      return false
    }
  }
  return {
    bold: state('bold'),
    italic: state('italic'),
    underline: state('underline'),
    align: state('justifyCenter')
      ? 'center'
      : state('justifyRight')
        ? 'right'
        : 'left',
    bullets: state('insertUnorderedList'),
  }
}

/** `3:42 PM 8/4/2026`, the string Insert ▸ Date and Time dropped in. */
export function stamp(): string {
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const date = now.toLocaleDateString([], {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
  return `${time} ${date}`
}
