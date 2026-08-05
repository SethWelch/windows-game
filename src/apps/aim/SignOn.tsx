import { useState } from 'react'
import { AimIcon } from '@/icons/AimIcon.tsx'
import { aim } from './store.ts'

/**
 * Sign On. Any screen name works and the password is never checked — there is no
 * server on the other end, which is the one thing this can't pretend about.
 */
export function SignOn() {
  const [screenName, setScreenName] = useState('CoolUser2001')
  const [password, setPassword] = useState('hunter2')

  const submit = () => aim.signOn(screenName)

  return (
    <div className="xp-window-content">
      <div className="xp-aim-signon">
        <div className="xp-aim-signon-hero">
          <AimIcon size={54} />
          <div className="xp-aim-wordmark">
            <strong>AOL</strong> Instant Messenger
            <span>SM</span>
          </div>
        </div>

        <div className="xp-aim-signon-form">
          <label htmlFor="aim-sn">Screen Name</label>
          <input
            id="aim-sn"
            className="xp-field"
            value={screenName}
            autoFocus
            spellCheck={false}
            onChange={(e) => setScreenName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          <label htmlFor="aim-pw">Password</label>
          <input
            id="aim-pw"
            className="xp-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          <label className="xp-choice">
            <input type="checkbox" className="xp-check" defaultChecked />
            Save password
          </label>
          <label className="xp-choice">
            <input type="checkbox" className="xp-check" />
            Auto-login
          </label>
        </div>

        <div className="xp-aim-signon-actions">
          <button type="button" className="xp-button" disabled>
            Setup
          </button>
          <button type="button" className="xp-button" disabled>
            Help
          </button>
          <button
            type="button"
            className="xp-button xp-button--default"
            disabled={!screenName.trim()}
            onClick={submit}
          >
            Sign On
          </button>
        </div>

        <p className="xp-aim-version">Version 5.1.3036</p>
      </div>
    </div>
  )
}
