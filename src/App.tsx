import { Desktop } from '@/components/Desktop/Desktop.tsx'
import { BootScreen } from '@/components/Boot/BootScreen.tsx'
import { PowerScreen } from '@/components/Boot/PowerScreen.tsx'
import { DosScreen } from '@/components/Dos/DosScreen.tsx'
import { BsodScreen } from '@/components/Bsod/BsodScreen.tsx'
import { useBootState } from '@/os/boot.ts'

/**
 * The machine. Off, running its POST, in Windows, stopped on a bugcheck, or dropped to
 * a prompt because the shell could not start — see os/boot.ts for how you reach the
 * last two.
 */
export default function App() {
  switch (useBootState()) {
    case 'off':
      return <PowerScreen />
    case 'starting':
      return <BootScreen />
    case 'dos':
      return <DosScreen />
    case 'bsod':
      return <BsodScreen />
    default:
      return <Desktop />
  }
}
