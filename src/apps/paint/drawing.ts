import type { FillStyle, ToolId } from './palette.ts'

/**
 * The pixel work. Everything here takes a 2D context and mutates it — canvases are
 * imperative and there is no honest way to pretend otherwise — but nothing here
 * knows about React, which keeps the component down to state and event wiring.
 */

export interface Point {
  x: number
  y: number
}

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

/**
 * Fill With Color: a four-way flood from the clicked pixel, matching the colour
 * under it exactly. No tolerance, which is why filling an anti-aliased edge in the
 * real Paint always left a halo — and it does here too, for the same reason.
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  hex: string,
) {
  const { width, height } = ctx.canvas
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return

  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  const start = (startY * width + startX) * 4
  const target = [px[start], px[start + 1], px[start + 2], px[start + 3]]
  const [r, g, b] = rgb(hex)

  // Already that colour: the fill would spin over the whole region for nothing.
  if (target[0] === r && target[1] === g && target[2] === b && target[3] === 255) {
    return
  }

  // A flat stack of x,y pairs — one array for the whole fill instead of an
  // allocation per pixel.
  const stack: number[] = [startX, startY]
  while (stack.length) {
    const y = stack.pop()!
    const x = stack.pop()!
    const i = (y * width + x) * 4
    if (
      px[i] !== target[0] ||
      px[i + 1] !== target[1] ||
      px[i + 2] !== target[2] ||
      px[i + 3] !== target[3]
    ) {
      continue
    }
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
    px[i + 3] = 255

    if (x > 0) stack.push(x - 1, y)
    if (x < width - 1) stack.push(x + 1, y)
    if (y > 0) stack.push(x, y - 1)
    if (y < height - 1) stack.push(x, y + 1)
  }
  ctx.putImageData(image, 0, 0)
}

/** The colour under a pixel, as `#rrggbb`, for Pick Color. */
export function pickColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): string {
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Airbrush: a scatter of single pixels, denser toward the middle. */
export function spray(
  ctx: CanvasRenderingContext2D,
  at: Point,
  radius: number,
  hex: string,
) {
  ctx.fillStyle = hex
  for (let i = 0; i < radius * 3; i++) {
    const angle = Math.random() * Math.PI * 2
    // sqrt keeps the scatter even across the disc instead of clumping at the rim.
    const distance = Math.sqrt(Math.random()) * radius
    ctx.fillRect(
      Math.round(at.x + Math.cos(angle) * distance),
      Math.round(at.y + Math.sin(angle) * distance),
      1,
      1,
    )
  }
}

/** A freehand segment. Round caps so a fast drag stays a continuous stroke. */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  hex: string,
  lineWidth: number,
) {
  ctx.strokeStyle = hex
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // Odd widths straddle a pixel boundary; the half-pixel offset lands them on one.
  const half = lineWidth % 2 === 1 ? 0.5 : 0
  ctx.beginPath()
  ctx.moveTo(from.x + half, from.y + half)
  ctx.lineTo(to.x + half, to.y + half)
  ctx.stroke()
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  // Written out rather than using `roundRect`, which is newer than it needs to be.
  const r = Math.min(8, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export interface ShapeOptions {
  stroke: string
  fill: string
  lineWidth: number
  style: FillStyle
}

/** Line, rectangle, ellipse and rounded rectangle, from one corner to the other. */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: ToolId,
  from: Point,
  to: Point,
  o: ShapeOptions,
) {
  ctx.strokeStyle = o.stroke
  ctx.fillStyle = o.fill
  ctx.lineWidth = o.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'miter'

  if (tool === 'line') {
    drawSegment(ctx, from, to, o.stroke, o.lineWidth)
    return
  }

  const half = o.lineWidth % 2 === 1 ? 0.5 : 0
  const x = Math.min(from.x, to.x) + half
  const y = Math.min(from.y, to.y) + half
  const w = Math.abs(to.x - from.x)
  const h = Math.abs(to.y - from.y)

  if (tool === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  } else if (tool === 'roundRect') {
    roundRectPath(ctx, x, y, w, h)
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
  }

  // The three fill styles the tool box offered, in that order.
  if (o.style !== 'outline') ctx.fill()
  if (o.style !== 'filled') ctx.stroke()
}

/** Image ▸ Invert Colors. */
export function invert(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas
  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  for (let i = 0; i < px.length; i += 4) {
    px[i] = 255 - px[i]
    px[i + 1] = 255 - px[i + 1]
    px[i + 2] = 255 - px[i + 2]
  }
  ctx.putImageData(image, 0, 0)
}

/**
 * Paints a stored image over a fresh white ground. Decoding is asynchronous, so
 * this returns before anything appears — which is fine, nothing waits on it.
 */
export function blitImage(canvas: HTMLCanvasElement | null, dataUrl: string) {
  if (!canvas || !dataUrl) return
  const image = new Image()
  image.onload = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
  }
  image.src = dataUrl
}

/** A detached copy of the current bitmap, for flips and rotations to draw from. */
export function copyOf(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const copy = document.createElement('canvas')
  copy.width = canvas.width
  copy.height = canvas.height
  copy.getContext('2d')?.drawImage(canvas, 0, 0)
  return copy
}

/** Mirrors in place; neither axis changes the bitmap's size. */
export function flip(canvas: HTMLCanvasElement, axis: 'horizontal' | 'vertical') {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const source = copyOf(canvas)
  ctx.save()
  ctx.setTransform(
    axis === 'horizontal' ? -1 : 1,
    0,
    0,
    axis === 'vertical' ? -1 : 1,
    axis === 'horizontal' ? canvas.width : 0,
    axis === 'vertical' ? canvas.height : 0,
  )
  ctx.drawImage(source, 0, 0)
  ctx.restore()
}
