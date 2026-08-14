import type { AppDefinition } from '@/os/types.ts'
import { BuddyPanel } from './BuddyPanel.tsx'

/**
 * Reachable only from its desktop shortcut, like SPAM. Nothing you would come across
 * by browsing your own programs — which is how both of them got there.
 */
export const buddyApp: AppDefinition = {
  id: 'buddy',
  title: 'Bongo Buddy',
  label: 'Bongo Buddy',
  iconId: 'buddy',
  component: BuddyPanel,
  // Outer size, so it carries TITLEBAR_H and the frame gutter on top of the content.
  // The head and the buttons are the only unshrinkable parts — about 150px — and the
  // hint absorbs the rest, which is what keeps the buttons inside the frame.
  defaultSize: { width: 348, height: 244 },
  resizable: false,
  maximizable: false,
  singleton: true,
}
