import type { AppDefinition } from '@/os/types.ts'
import { Netscape } from './Netscape.tsx'

export const netscapeApp: AppDefinition = {
  id: 'netscape',
  title: 'Netscape',
  label: 'Netscape Navigator',
  iconId: 'netscape',
  component: Netscape,
  // Navigator opened at roughly 640x480 of page, plus four bars of chrome.
  defaultSize: { width: 728, height: 580 },
  minSize: { width: 420, height: 300 },
  showOnDesktop: true,
  startMenuSection: 'pinned',
}
