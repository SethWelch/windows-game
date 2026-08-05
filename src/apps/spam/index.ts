import type { AppDefinition } from '@/os/types.ts'
import { Spam } from './Spam.tsx'

/**
 * Reachable only from its desktop shortcut. Deliberately absent from the Start menu:
 * nothing you would find by browsing your own programs, which is how it got there.
 */
export const spamApp: AppDefinition = {
  id: 'spam',
  title: 'SpamBot 2001',
  label: 'SPAM',
  iconId: 'spam',
  component: Spam,
  defaultSize: { width: 330, height: 190 },
  minSize: { width: 280, height: 170 },
  resizable: false,
  maximizable: false,
  singleton: true,
}
