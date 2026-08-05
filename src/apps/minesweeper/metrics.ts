import { FRAME_GUTTER, TITLEBAR_H } from '@/os/constants.ts'
import type { Size } from '@/os/types.ts'
import type { Level } from './engine.ts'

/**
 * The field's pixel metrics, and the window size that follows from them.
 *
 * Every number here must match Minesweeper.css — the same standing arrangement
 * os/constants.ts has with tokens.css. The window size is *computed* from them
 * rather than measured off the rendered panel: a measurement would have to happen
 * in an effect, one commit after the board changed, which puts a frame of clipped
 * board on screen and makes the whole thing depend on layout timing.
 */
const M = {
  /** `.xp-ms-cell` width/height, and the field's grid pitch. */
  cell: 16,
  /** `.xp-ms-grid` border — the sunken frame around the field. */
  fieldBorder: 3,
  /** `.xp-ms-panel` padding. */
  panelPad: 6,
  /** `.xp-ms-panel` border — the raised frame around everything. */
  panelBorder: 3,
  /** `.xp-ms-status` height, borders included (`box-sizing: border-box`). */
  statusH: 33,
  /** `.xp-ms-status` margin-bottom. */
  statusGap: 6,
  /** `.xp-menubar` height in components/ui/MenuBar.css. */
  menuBarH: 20,
} as const

export const CELL_PX = M.cell

/** Everything around the field, on both axes. */
const PANEL_FRAME = 2 * (M.panelBorder + M.panelPad)

/** The exact window size for a field of this shape. */
export function windowSizeFor(field: Pick<Level, 'rows' | 'cols'>): Size {
  const fieldW = 2 * M.fieldBorder + field.cols * M.cell
  const fieldH = 2 * M.fieldBorder + field.rows * M.cell
  return {
    width: PANEL_FRAME + fieldW + 2 * FRAME_GUTTER,
    height:
      PANEL_FRAME +
      M.statusH +
      M.statusGap +
      fieldH +
      M.menuBarH +
      TITLEBAR_H +
      FRAME_GUTTER,
  }
}
