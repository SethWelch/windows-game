/**
 * The colour box and the tool list.
 *
 * These twenty-eight colours are mspaint's own default palette, in its own order:
 * the darks along the top row and their bright counterparts underneath.
 */

export const PALETTE: string[] = [
  // Top row — darks.
  '#000000',
  '#808080',
  '#800000',
  '#808000',
  '#008000',
  '#008080',
  '#000080',
  '#800080',
  '#808040',
  '#004040',
  '#0080ff',
  '#004080',
  '#8000ff',
  '#804000',
  // Bottom row — brights.
  '#ffffff',
  '#c0c0c0',
  '#ff0000',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#ff00ff',
  '#ffff80',
  '#00ff80',
  '#80ffff',
  '#8080ff',
  '#ff0080',
  '#ff8040',
]

export type ToolId =
  | 'freeSelect'
  | 'select'
  | 'eraser'
  | 'fill'
  | 'pick'
  | 'zoom'
  | 'pencil'
  | 'brush'
  | 'airbrush'
  | 'text'
  | 'line'
  | 'curve'
  | 'rect'
  | 'polygon'
  | 'ellipse'
  | 'roundRect'

export interface Tool {
  id: ToolId
  label: string
  /** How the pointer behaves: a continuous stroke, a rubber-banded shape, or a hit. */
  kind: 'freehand' | 'shape' | 'click'
  /** False for the tools that aren't built yet — drawn, but greyed. */
  ready: boolean
}

/**
 * Two columns, read left to right and top to bottom — the order the real tool box
 * had, which is worth keeping even for the tools that don't work yet: the shape of
 * that grid is most of how it's recognised.
 */
export const TOOLS: Tool[] = [
  { id: 'freeSelect', label: 'Free-Form Select', kind: 'shape', ready: false },
  { id: 'select', label: 'Select', kind: 'shape', ready: false },
  { id: 'eraser', label: 'Eraser', kind: 'freehand', ready: true },
  { id: 'fill', label: 'Fill With Color', kind: 'click', ready: true },
  { id: 'pick', label: 'Pick Color', kind: 'click', ready: true },
  { id: 'zoom', label: 'Magnifier', kind: 'click', ready: false },
  { id: 'pencil', label: 'Pencil', kind: 'freehand', ready: true },
  { id: 'brush', label: 'Brush', kind: 'freehand', ready: true },
  { id: 'airbrush', label: 'Airbrush', kind: 'freehand', ready: true },
  { id: 'text', label: 'Text', kind: 'click', ready: false },
  { id: 'line', label: 'Line', kind: 'shape', ready: true },
  { id: 'curve', label: 'Curve', kind: 'shape', ready: false },
  { id: 'rect', label: 'Rectangle', kind: 'shape', ready: true },
  { id: 'polygon', label: 'Polygon', kind: 'shape', ready: false },
  { id: 'ellipse', label: 'Ellipse', kind: 'shape', ready: true },
  { id: 'roundRect', label: 'Rounded Rectangle', kind: 'shape', ready: true },
]

export const toolById = (id: ToolId): Tool =>
  TOOLS.find((t) => t.id === id) ?? TOOLS[6]

/** Which tools take a size, and which take a fill style. */
export const TAKES_SIZE: ToolId[] = ['eraser', 'brush', 'airbrush', 'line']
export const TAKES_FILL: ToolId[] = ['rect', 'ellipse', 'roundRect']

export type FillStyle = 'outline' | 'filled' | 'both'

export const SIZES = [1, 2, 3, 4, 5]
