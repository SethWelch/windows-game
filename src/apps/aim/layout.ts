import type { Size } from '@/os/types.ts'

/**
 * Sign On and the Buddy List were two differently shaped windows in the same
 * program, and the window resized when you signed on. Aim.tsx drives that with
 * `wm.setSize` — the same call Minesweeper uses to fit its field.
 */
export const SIGN_ON_SIZE: Size = { width: 356, height: 372 }
export const BUDDY_LIST_SIZE: Size = { width: 216, height: 438 }

/** Text colours the IM formatting bar offers. */
export const IM_COLORS = [
  '#000000',
  '#0000ff',
  '#c00000',
  '#008000',
  '#800080',
  '#ff6a00',
]
