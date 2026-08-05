import { Desktop } from '@/components/Desktop/Desktop.tsx'
import { BootScreen } from '@/components/Boot/BootScreen.tsx'
import { PowerScreen } from '@/components/Boot/PowerScreen.tsx'
import { DosScreen } from '@/components/Dos/DosScreen.tsx'
import { useBootState } from '@/os/boot.ts'

/**
 * The machine. Off, running its POST, in Windows, or dropped to a prompt because the
 * shell could not start — see os/boot.ts for how you reach that last one.
 */
export default function App() {
  switch (useBootState()) {
    case 'off':
      return <PowerScreen />
    case 'starting':
      return <BootScreen />
    case 'dos':
      return <DosScreen />
    default:
      return <Desktop />
  }
}
