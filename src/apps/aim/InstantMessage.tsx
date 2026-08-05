import { useEffect, useRef, useState } from 'react'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { getBuddy } from './buddies.ts'
import { Emoticon, MessageText } from './Emoticon.tsx'
import { EMOTICONS } from './emoticons.ts'
import { IM_COLORS as COLORS } from './layout.ts'
import { aim, useChat, useIsTyping, useScreenName } from './store.ts'
import type { Message, Style } from './store.ts'
import './Aim.css'

interface ImArgs {
  buddyId?: string
}

const clock = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function Line({ message }: { message: Message }) {
  if (message.kind === 'system') {
    return <p className="xp-aim-line xp-aim-line--system">{message.text}</p>
  }
  return (
    <p className="xp-aim-line">
      <span className="xp-aim-who" data-mine={message.mine}>
        {message.from}
      </span>
      <span className="xp-aim-stamp"> ({clock(message.at)}): </span>
      <span
        className="xp-aim-said"
        data-auto={message.kind === 'away'}
        style={{
          fontWeight: message.style?.bold ? 700 : undefined,
          fontStyle: message.style?.italic ? 'italic' : undefined,
          textDecoration: message.style?.underline ? 'underline' : undefined,
          color: message.style?.color,
        }}
      >
        <MessageText text={message.text} />
      </span>
    </p>
  )
}

export function InstantMessage({ windowId, args }: AppProps) {
  const { buddyId } = (args ?? {}) as ImArgs
  const buddy = buddyId ? getBuddy(buddyId) : undefined

  const screenName = useScreenName()
  const history = useChat(buddyId ?? '')
  const typing = useIsTyping(buddyId ?? '')

  const [draft, setDraft] = useState('')
  const [style, setStyle] = useState<Style>({
    bold: false,
    italic: false,
    underline: false,
    color: COLORS[0],
  })
  const [smileys, setSmileys] = useState(false)

  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    wm.setTitle(windowId, buddy ? `${buddy.screenName} - Instant Message` : 'Instant Message')
  }, [windowId, buddy])

  // Pin to the newest line, which is where a conversation lives.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [history, typing])

  if (!buddy) {
    return (
      <div className="xp-window-content">
        <p className="xp-aim-empty">No buddy selected.</p>
      </div>
    )
  }

  if (!screenName) {
    return (
      <div className="xp-window-content">
        <p className="xp-aim-empty">
          You are signed off. Sign back on to continue this conversation.
        </p>
      </div>
    )
  }

  const send = () => {
    if (!draft.trim()) return
    aim.send(buddy.id, draft, style)
    setDraft('')
    inputRef.current?.focus()
  }

  const insert = (token: string) => {
    setDraft((d) => (d && !d.endsWith(' ') ? `${d} ${token}` : `${d}${token}`))
    setSmileys(false)
    inputRef.current?.focus()
  }

  const toggle = (key: 'bold' | 'italic' | 'underline') =>
    setStyle((s) => ({ ...s, [key]: !s[key] }))

  return (
    <div className="xp-aim-im">
      <div className="xp-window-content">
        <div className="xp-aim-im-body">
          <div className="xp-aim-log" ref={logRef}>
            {(history ?? []).map((message) => (
              <Line key={message.id} message={message} />
            ))}
          </div>

          <div className="xp-aim-toolbar">
            <button
              type="button"
              className="xp-aim-fmt"
              data-on={style.bold}
              onClick={() => toggle('bold')}
              title="Bold"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              className="xp-aim-fmt"
              data-on={style.italic}
              onClick={() => toggle('italic')}
              title="Italic"
            >
              <i>I</i>
            </button>
            <button
              type="button"
              className="xp-aim-fmt"
              data-on={style.underline}
              onClick={() => toggle('underline')}
              title="Underline"
            >
              <u>U</u>
            </button>

            <span className="xp-aim-tb-sep" />

            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="xp-aim-swatch"
                data-on={style.color === color}
                style={{ background: color }}
                onClick={() => setStyle((s) => ({ ...s, color }))}
                title={`Text colour ${color}`}
                aria-label={`Text colour ${color}`}
              />
            ))}

            <span className="xp-aim-tb-sep" />

            <div className="xp-aim-smiley-wrap">
              <button
                type="button"
                className="xp-aim-fmt"
                data-on={smileys}
                onClick={() => setSmileys((v) => !v)}
                title="Insert a smiley"
              >
                <Emoticon face="smile" />
              </button>
              {smileys && (
                <div className="xp-aim-smiley-menu">
                  {EMOTICONS.slice(0, 7).map(([token, face]) => (
                    <button
                      key={token}
                      type="button"
                      className="xp-aim-smiley-pick"
                      onClick={() => insert(token)}
                      title={token}
                      aria-label={token}
                    >
                      <Emoticon face={face} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <textarea
            ref={inputRef}
            className="xp-aim-input"
            value={draft}
            autoFocus
            spellCheck={false}
            style={{
              fontWeight: style.bold ? 700 : undefined,
              fontStyle: style.italic ? 'italic' : undefined,
              textDecoration: style.underline ? 'underline' : undefined,
              color: style.color,
            }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter is how you got a second line.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
        </div>
      </div>

      <div className="xp-aim-im-footer">
        <span className="xp-aim-typing">
          {typing ? `${buddy.screenName} is typing...` : ''}
        </span>
        <button type="button" className="xp-button" disabled>
          Warn
        </button>
        <button type="button" className="xp-button" disabled>
          Info
        </button>
        <button
          type="button"
          className="xp-button xp-button--default"
          disabled={!draft.trim()}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  )
}
