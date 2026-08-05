import { useWM } from './windowStore.ts'

export const useWindows = () => useWM((s) => s.windows)
export const useFocusedId = () => useWM((s) => s.focusedId)
export const useIsFocused = (id: string) => useWM((s) => s.focusedId === id)
export const useStartMenuOpen = () => useWM((s) => s.startMenuOpen)
