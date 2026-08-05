import { DESKTOP_ID, DOCS_ID, fs } from '@/os/fs.ts'
import { startMenu } from '@/os/startMenu.ts'
import type { AppDefinition } from '@/os/types.ts'
import type { MenuNode } from '@/components/ui/menu.types.ts'

/**
 * Right-click on a program in the Start menu.
 *
 * XP's version of this menu was mostly filesystem operations on the `.lnk` behind
 * the item. Our Start menu is built from `APP_LIST` rather than from a Start Menu
 * folder, so Delete and Rename have nothing to act on and are left out instead of
 * faked. Send To and pinning do map onto something real.
 */
export function programContextMenu(
  app: AppDefinition,
  actions: { onOpen: () => void; onDone: () => void; onPinChange: () => void },
): MenuNode[] {
  const pinned = startMenu.isPinned(app.id)

  const sendTo = (parentId: string) => {
    // XP named these after the program, not "Shortcut to <program>".
    fs.createShortcut(parentId, { kind: 'app', appId: app.id }, app.label)
    actions.onDone()
  }

  return [
    { id: 'open', label: '&Open', onSelect: actions.onOpen },
    { kind: 'separator' },
    {
      id: 'sendto',
      label: 'Se&nd To',
      submenu: [
        {
          id: 'send-desktop',
          label: '&Desktop (create shortcut)',
          onSelect: () => sendTo(DESKTOP_ID),
        },
        {
          id: 'send-docs',
          label: 'My D&ocuments',
          onSelect: () => sendTo(DOCS_ID),
        },
        { kind: 'separator' },
        { id: 'send-mail', label: '&Mail Recipient', disabled: true },
        { id: 'send-floppy', label: '3½ &Floppy (A:)', disabled: true },
      ],
    },
    { kind: 'separator' },
    {
      id: 'pin',
      label: pinned ? 'Unpin from Start men&u' : 'Pin to Start men&u',
      onSelect: () => {
        if (pinned) startMenu.unpin(app.id)
        else startMenu.pin(app.id)
        actions.onPinChange()
      },
    },
    { kind: 'separator' },
    { id: 'properties', label: 'P&roperties', disabled: true },
  ]
}
