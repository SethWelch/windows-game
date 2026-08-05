import { useEffect } from 'react'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { BuddyList } from './BuddyList.tsx'
import { SignOn } from './SignOn.tsx'
import { BUDDY_LIST_SIZE, SIGN_ON_SIZE } from './layout.ts'
import { useScreenName } from './store.ts'
import './Aim.css'

export function Aim({ windowId }: AppProps) {
  const screenName = useScreenName()

  useEffect(() => {
    wm.setSize(windowId, screenName ? BUDDY_LIST_SIZE : SIGN_ON_SIZE)
  }, [windowId, screenName])

  useEffect(() => {
    wm.setTitle(
      windowId,
      screenName ? `${screenName}'s Buddy List` : 'Sign On',
    )
  }, [windowId, screenName])

  return screenName ? (
    <BuddyList windowId={windowId} screenName={screenName} />
  ) : (
    <SignOn />
  )
}
