import {
  AccessibilityIcon,
  AddRemoveIcon,
  AppearanceIcon,
  DateTimeIcon,
  HardwareIcon,
  NetworkIcon,
  PerformanceIcon,
  SoundsIcon,
  UserAccountsIcon,
} from '@/icons/ControlPanelIcons.tsx'
import { CP_APPEARANCE_ID } from '@/os/fs.ts'
import './ControlPanelView.css'

/**
 * The Control Panel's category view — "Pick a category".
 *
 * Not a window of its own: XP's Control Panel *was* a shell folder, so this is a body
 * Explorer renders in place of a file list when you navigate to it. That way the menu bar,
 * toolbar, address bar and task pane all come for free and behave exactly as they do
 * anywhere else, which is also how the real one worked.
 *
 * Appearance and Themes opens; it is a folder under this one, so Back and Up work without
 * either page knowing about the other. The remaining eight are not wired yet, and are
 * deliberately not greyed: greying is how this project marks something that cannot work,
 * and every one of these is a thing that will.
 */

const CATEGORIES: { label: string; Art: () => React.ReactElement; nodeId?: string }[] = [
  { label: 'Appearance and Themes', Art: AppearanceIcon, nodeId: CP_APPEARANCE_ID },
  { label: 'Printers and Other Hardware', Art: HardwareIcon },
  { label: 'Network and Internet Connections', Art: NetworkIcon },
  { label: 'User Accounts', Art: UserAccountsIcon },
  { label: 'Add or Remove Programs', Art: AddRemoveIcon },
  { label: 'Date, Time, Language, and Regional Options', Art: DateTimeIcon },
  { label: 'Sounds, Speech, and Audio Devices', Art: SoundsIcon },
  { label: 'Accessibility Options', Art: AccessibilityIcon },
  { label: 'Performance and Maintenance', Art: PerformanceIcon },
]

export function ControlPanelView({
  onNavigate,
}: {
  /** Categories are folders, so opening one is a navigation like any other. */
  onNavigate: (nodeId: string) => void
}) {
  return (
    <div className="cp">
      <h1 className="cp-heading">Pick a category</h1>

      <div className="cp-grid">
        {CATEGORIES.map(({ label, Art, nodeId }) => (
          <button
            key={label}
            type="button"
            className="cp-category"
            onClick={() => nodeId && onNavigate(nodeId)}
          >
            <span className="cp-category-art">
              <Art />
            </span>
            <span className="cp-category-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
