import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import type { Menu } from '@/components/ui/menu.types.ts'
import { wm } from '@/os/windowStore.ts'
import { BUDDIES, GROUPS } from './buddies.ts'
import type { Buddy, Group } from './buddies.ts'
import { aim, openConversation, useAway } from './store.ts'

/** The status suffix AIM tacked onto a name: `(Away)`, `(Idle)`, or nothing. */
function statusOf(buddy: Buddy): string {
  if (!buddy.online) return ''
  if (buddy.away) return ' (Away)'
  if (buddy.idle) return ` (Idle ${buddy.idle}m)`
  return ''
}

export function BuddyList({
  windowId,
  screenName,
}: {
  windowId: string
  screenName: string
}) {
  const away = useAway()
  const [selected, setSelected] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [awayDialog, setAwayDialog] = useState(false)
  const [awayDraft, setAwayDraft] = useState(
    'I am away from my computer right now.',
  )

  const openIm = openConversation

  const online = BUDDIES.filter((b) => b.online)
  const offline = BUDDIES.filter((b) => !b.online)

  const menus: Menu[] = [
    {
      id: 'my-aim',
      label: '&My AIM',
      items: [
        {
          id: 'away',
          label: away ? 'I&m Back' : 'Away &Message...',
          onSelect: () => (away ? aim.setAway(null) : setAwayDialog(true)),
        },
        { id: 'profile', label: 'Edit &Profile...', disabled: true },
        { kind: 'separator' },
        { id: 'signoff', label: '&Sign Off', onSelect: () => aim.signOff() },
        { id: 'exit', label: 'E&xit', onSelect: () => wm.close(windowId) },
      ],
    },
    {
      id: 'people',
      label: '&People',
      items: [
        {
          id: 'im',
          label: 'Send &Instant Message',
          disabled: !selected,
          onSelect: () => selected && openIm(selected),
        },
        { id: 'chat', label: 'Send &Chat Invitation...', disabled: true },
        { kind: 'separator' },
        { id: 'find', label: '&Find a Buddy...', disabled: true },
      ],
    },
    {
      id: 'help',
      label: '&Help',
      items: [{ id: 'about', label: '&About AIM', disabled: true }],
    },
  ]

  /** One group heading plus its rows. Offline buddies get their own group. */
  const renderGroup = (label: string, members: Buddy[]) => {
    const shut = !!collapsed[label]
    const up = members.filter((b) => b.online).length
    return (
      <div key={label} className="xp-aim-group">
        <button
          type="button"
          className="xp-aim-group-head"
          onClick={() => setCollapsed((c) => ({ ...c, [label]: !shut }))}
        >
          <span className="xp-aim-twisty" data-open={!shut}>
            ▶
          </span>
          {label} ({up}/{members.length})
        </button>

        {!shut &&
          members.map((buddy) => (
            <button
              key={buddy.id}
              type="button"
              className="xp-aim-buddy"
              data-selected={selected === buddy.id}
              data-offline={!buddy.online}
              data-idle={!!buddy.idle || !!buddy.away}
              onClick={() => setSelected(buddy.id)}
              onDoubleClick={() => openIm(buddy.id)}
            >
              {buddy.screenName}
              <span className="xp-aim-buddy-status">{statusOf(buddy)}</span>
            </button>
          ))}
      </div>
    )
  }

  return (
    <div className="xp-aim">
      <MenuBar menus={menus} />

      {/* AIM's tab strip. Only Online ever had anything in it here. */}
      <div className="xp-aim-tabs">
        <span className="xp-aim-tab" data-active>
          Online
        </span>
        <span className="xp-aim-tab" data-disabled>
          List
        </span>
        <span className="xp-aim-tab" data-disabled>
          Chat
        </span>
      </div>

      <div className="xp-window-content">
        <div className="xp-aim-list">
          {GROUPS.map((group: Group) =>
            renderGroup(
              group,
              online.filter((b) => b.group === group),
            ),
          )}
          {renderGroup('Offline', offline)}
        </div>
      </div>

      {away && (
        <div className="xp-aim-awaybar" title={away}>
          Away: {away}
        </div>
      )}

      <div className="xp-aim-footer">
        <button
          type="button"
          className="xp-button xp-aim-tool"
          disabled={!selected}
          onClick={() => selected && openIm(selected)}
        >
          IM
        </button>
        <button type="button" className="xp-button xp-aim-tool" disabled>
          Chat
        </button>
        <button type="button" className="xp-button xp-aim-tool" disabled>
          Info
        </button>
        <span className="xp-aim-me">{screenName}</span>
      </div>

      {awayDialog && (
        <Dialog title="Away Message" onClose={() => setAwayDialog(false)}>
          <div className="xp-aim-awayform">
            <label htmlFor="aim-away">
              Everyone who messages you gets this back, once:
            </label>
            <textarea
              id="aim-away"
              className="xp-field xp-aim-awaytext"
              value={awayDraft}
              autoFocus
              onChange={(e) => setAwayDraft(e.target.value)}
            />
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => {
                aim.setAway(awayDraft)
                setAwayDialog(false)
              }}
            >
              I'm Away
            </button>
            <button
              type="button"
              className="xp-button"
              onClick={() => setAwayDialog(false)}
            >
              Cancel
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
