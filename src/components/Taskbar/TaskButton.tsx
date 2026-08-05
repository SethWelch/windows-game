import { Icon } from '@/icons/Icon.tsx'
import type { WindowInstance } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'

export function TaskButton({ win }: { win: WindowInstance }) {
  const focused = useIsFocused(win.id)
  const pressed = focused && win.status !== 'minimized'

  return (
    <button
      type="button"
      className="xp-task-btn"
      data-active={pressed}
      title={win.title}
      onClick={() => wm.taskbarClick(win.id)}
    >
      <span className="xp-task-btn-icon">
        <Icon id={win.iconId} size={16} />
      </span>
      <span>{win.title}</span>
    </button>
  )
}
