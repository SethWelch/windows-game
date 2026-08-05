import type { AppDefinition } from '@/os/types.ts'
import { Aim } from './Aim.tsx'
import { InstantMessage } from './InstantMessage.tsx'
import { SIGN_ON_SIZE } from './layout.ts'

export const aimApp: AppDefinition = {
  id: 'aim',
  title: 'Sign On',
  label: 'AOL Instant Messenger',
  iconId: 'aim',
  component: Aim,
  defaultSize: SIGN_ON_SIZE,
  minSize: { width: 200, height: 260 },
  // One client per machine, as it was: signing on twice made no sense.
  singleton: true,
  startMenuSection: 'pinned',
}

/**
 * Conversations are real windows, not panes — that's what AIM felt like, and the
 * window manager already does everything they need. Not in the Start menu or on
 * the desktop: the only way in is a buddy, via `wm.openApp('aimIm', { buddyId })`.
 */
export const aimImApp: AppDefinition = {
  id: 'aimIm',
  title: 'Instant Message',
  label: 'Instant Message',
  iconId: 'aim',
  component: InstantMessage,
  defaultSize: { width: 432, height: 348 },
  minSize: { width: 320, height: 240 },
}
