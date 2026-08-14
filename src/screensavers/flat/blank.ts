import type { Saver } from './types.ts'

/**
 * Blank. Which XP really did ship, and which is the honest thing to select if you only
 * want the screen to go dark — every other saver here is decoration.
 */
export const blank: Saver = {
  name: 'Blank',
  create: (w, h) => (ctx) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
  },
}
