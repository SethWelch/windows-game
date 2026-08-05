import type { AppDefinition } from '@/os/types.ts'
import { Calculator } from './Calculator.tsx'

export const calculatorApp: AppDefinition = {
  id: 'calculator',
  title: 'Calculator',
  label: 'Calculator',
  iconId: 'calculator',
  component: Calculator,
  defaultSize: { width: 268, height: 250 },
  minSize: { width: 236, height: 216 },
  // calc.exe had one size and no grip. The keys stretch anyway, so this is a
  // choice about fidelity rather than a layout constraint.
  resizable: false,
  maximizable: false,
  startMenuSection: 'programs',
  startMenuFolder: ['Accessories'],
}
