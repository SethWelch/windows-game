import type { Saver } from './types.ts'

const TEXT = "Windows XP"
const SPEED = 0.11
/** Text height as a fraction of the buffer, matching the original's chunky default. */
const SIZE = 0.16

/**
 * Marquee. One line of text crossing the screen forever.
 *
 * XP let you set the words, the font and the colour in its Settings dialog; ours has no
 * Settings dialog yet, so the string is fixed here rather than faked behind a greyed
 * button. It measures the text once and reuses the width — `measureText` per frame would
 * be the most expensive thing in an otherwise free saver.
 */
export const marquee: Saver = {
  name: 'Marquee',
  create(w, h) {
    const size = Math.round(h * SIZE)
    const font = `bold ${size}px "XP Trebuchet", "Trebuchet MS", sans-serif`
    let width = 0
    let x = w
    let y = h / 2
    let hue = 210
    /** Which way it drifts vertically, flipped when it reaches an edge. */
    let drift = 1

    return (ctx, dt) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)

      ctx.font = font
      ctx.textBaseline = 'middle'
      // Measured on the first frame, once the context has the font. Doing it in `create`
      // would measure against whatever font the context happened to hold.
      if (!width) width = ctx.measureText(TEXT).width

      const step = dt / 1000
      x -= SPEED * w * step
      if (x < -width) {
        x = w
        // A new row each pass, so it doesn't trace the same line forever.
        drift = Math.random() < 0.5 ? -1 : 1
        y = size + Math.random() * (h - size * 2)
      }
      y += drift * step * h * 0.02
      if (y < size || y > h - size) drift = -drift

      hue = (hue + step * 18) % 360
      ctx.fillStyle = `hsl(${hue}, 85%, 62%)`
      ctx.fillText(TEXT, x, y)
    }
  },
}
