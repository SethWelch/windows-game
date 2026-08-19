import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { MessageBox } from '@/components/ui/MessageBox.tsx'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import {
  BackIcon,
  BrokenKey,
  ClosedLock,
  ForwardIcon,
  HomeIcon,
  PrintIcon,
  ReloadIcon,
  SearchIcon,
  StopIcon,
  Throbber,
  Tool,
} from './chrome.tsx'
import { buildNetscapeMenus } from './netscapeMenus.ts'
import {
  BOOKMARKS,
  HOME_URL,
  canonicalUrl,
  documentFor,
  findPage,
  isLive,
  notFoundPage,
  sourceFor,
  titleIn,
  withBase,
} from './sites.ts'
import './Netscape.css'

interface NetscapeArgs {
  url?: string
}

/**
 * Loading is faked, but not skipped. A page that appears the instant you click is
 * the one thing that would give the whole illusion away — and without a load there
 * is nothing for the throbber, the progress meter or the Stop button to do.
 */
const CONNECT_MS = 260
const TRANSFER_MS = 320

/** Attempts at a live page before giving up and letting the frame load it blind. */
const FETCH_TRIES = 3

/** Multiplied by the attempt number, so the second wait is longer than the first. */
const RETRY_MS = 400

type LoadPhase = 'connect' | 'transfer' | 'done'

export function Netscape({ windowId, args }: AppProps) {
  const { url: launchUrl } = (args ?? {}) as NetscapeArgs

  /** Visited urls, oldest first; `at` is the current position within it. */
  const [history, setHistory] = useState<string[]>([launchUrl ?? HOME_URL])
  const [at, setAt] = useState(0)
  /** Null until the user edits the Location bar, so it follows the page by default. */
  const [typed, setTyped] = useState<string | null>(null)
  /** The href under the pointer, which outranks whatever the load is saying. */
  const [hovered, setHovered] = useState<string | null>(null)
  const [bars, setBars] = useState({
    navigation: true,
    location: true,
    personal: true,
  })
  const [source, setSource] = useState<string | null>(null)
  const [about, setAbout] = useState(false)
  const [mailTo, setMailTo] = useState<string | null>(null)

  /** Bumped to re-run a load of the same url; also re-keys the iframe. */
  const [loadToken, setLoadToken] = useState(0)
  /** Set by Stop, the only thing that cancels a load in progress. */
  const [stopped, setStopped] = useState(false)
  /** How far the load identified by `key` got. A key we haven't seen is at the start. */
  const [progress, setProgress] = useState<{ key: string; phase: LoadPhase }>({
    key: '',
    phase: 'done',
  })
  /**
   * A live page we fetched ourselves. `html: null` means the request was refused —
   * no CORS header, most likely — and the frame has to load it opaquely instead.
   */
  const [fetched, setFetched] = useState<{
    key: string
    html: string | null
    title?: string
    /**
     * Where the response actually came from, after redirects.
     *
     * Not the same as what was asked for, and the difference was a real bug.
     * `theoldnet.com/get?url=...` is a front end to the Wayback Machine: it answers with a
     * 302 to `web.archive.org/web/<timestamp>/http://...`. Using the requested URL as the
     * document's `<base>` made every root-relative link in an archived page — and the
     * Wayback Machine rewrites them all to `/web/<timestamp>/...` — resolve against
     * theoldnet instead, so clicking one went to a theoldnet URL that does not exist.
     */
    url?: string
  } | null>(null)

  const frameRef = useRef<HTMLIFrameElement>(null)

  const url = history[at]
  /**
   * A live address goes out to the real internet. `page` is null for those: there
   * is no document of ours to serve, so one gets fetched below instead.
   */
  const live = isLive(url)
  const page = live ? null : (findPage(url) ?? notFoundPage(url))
  const canBack = at > 0
  const canForward = at < history.length - 1
  const loadKey = `${url}#${loadToken}`
  const address = canonicalUrl(url)
  const host = address.replace(/^https?:\/\//, '').split('/')[0]
  const secure = address.startsWith('https://')

  /** Has the fetch for *this* load settled? */
  const liveReady = live && fetched?.key === loadKey
  /** String: ours to render. Null: refused. Undefined: still in flight. */
  const liveHtml = liveReady ? fetched.html : undefined

  /**
   * The document being rendered, when it's one we hold the markup for — either a
   * page out of `sites.ts` or a live page we fetched. That's the condition for all
   * the chrome that needs to read the DOM: link interception, the hover status, our
   * own history, View Source.
   */
  /**
   * Where the page we are holding actually came from, which is what its relative links
   * have to resolve against. Only different from `address` when the server redirected —
   * see `fetched.url`. Also what the Location bar shows, because a browser that has
   * followed a redirect shows you where you ended up, not where you asked to go.
   */
  const origin = liveReady && fetched.url ? fetched.url : address

  const ownDoc = page
    ? documentFor(page)
    : typeof liveHtml === 'string'
      ? withBase(origin, liveHtml)
      : null
  /** The fetch was refused, so hand the address to the frame and go blind. */
  const opaque = live && liveHtml === null

  /**
   * Everything about the load is derived rather than stored. A url or reload that
   * `progress` hasn't caught up with reads as `connect` on its own, so nothing has
   * to be written on the way in — which is what keeps navigation out of an effect
   * and the state honest about having one source. A live load is simpler still: it
   * is over exactly when its fetch settles, which is a real duration, not a guess.
   */
  const phase: LoadPhase = stopped
    ? 'done'
    : live
      ? liveReady
        ? 'done'
        : 'connect'
      : progress.key === loadKey
        ? progress.phase
        : 'connect'
  const loading = phase !== 'done'

  const status =
    hovered ??
    (phase === 'connect'
      ? `Connecting to ${host}...`
      : phase === 'transfer'
        ? `Transferring data from ${host}...`
        : opaque
          ? // Worth saying out loud: in this mode the frame owns its own history, so Back
            // returns to the last page *we* loaded and skips anything followed inside it.
            `Opened directly from ${host} — Back cannot follow links inside this page.`
          : 'Document: Done')

  const title = page?.title ?? (liveReady ? fetched.title : undefined) ?? host

  useEffect(() => {
    wm.setTitle(windowId, `${title} - Netscape`)
  }, [windowId, title])

  /**
   * Advances the fake load. The timeouts belong to the effect and are cleared by
   * its own teardown, so Stop is just a flag: setting it re-runs this, which
   * cancels what was pending on the way in and then bails.
   *
   * Live addresses opt out — their load has a real duration, ended by the fetch
   * below rather than by a stopwatch.
   */
  useEffect(() => {
    if (stopped || live) return
    const connected = window.setTimeout(
      () => setProgress({ key: loadKey, phase: 'transfer' }),
      CONNECT_MS,
    )
    const done = window.setTimeout(
      () => setProgress({ key: loadKey, phase: 'done' }),
      CONNECT_MS + TRANSFER_MS,
    )
    return () => {
      window.clearTimeout(connected)
      window.clearTimeout(done)
    }
  }, [loadKey, stopped, live])

  /**
   * Fetches a live page so we can render it ourselves. This is the whole reason
   * the Location bar and Back work on the real web: a page loaded by the frame is
   * cross-origin and its navigations are invisible to us, but a page we fetched is
   * our own document, and every link in it comes back through `go`.
   *
   * Only works where the host allows it — no `Access-Control-Allow-Origin`, no
   * markup — so the refusal path falls back to letting the frame do it.
   *
   * A 5xx is retried rather than treated as a refusal, because falling back to the frame
   * costs the thing this whole path exists for. The Wayback Machine, which is where
   * theoldnet's links end up, answers 503 under load often enough that a single attempt
   * dropped us into the blind path most of the time — and in the blind path Back walks our
   * history while the *frame* has been quietly building its own, which is exactly how
   * pressing Back ends up somewhere you never were.
   */
  useEffect(() => {
    if (!live || stopped) return
    const abort = new AbortController()
    let cancelled = false

    const attempt = async () => {
      for (let tries = 1; ; tries++) {
        const res = await fetch(address, { signal: abort.signal, redirect: 'follow' })
        // `res.url` is where we ended up, which is what the document has to be based on.
        if (res.ok) return { html: await res.text(), url: res.url }
        // A 4xx is an answer; a 5xx is usually the archive being busy.
        if (res.status < 500 || tries >= FETCH_TRIES) throw new Error(String(res.status))
        await new Promise((settle) => window.setTimeout(settle, RETRY_MS * tries))
      }
    }

    attempt()
      .then(({ html, url }) => {
        if (!cancelled) setFetched({ key: loadKey, html, title: titleIn(html), url })
      })
      .catch((err: Error) => {
        // Stop aborts the request; that isn't a failure to fall back from.
        if (cancelled || err.name === 'AbortError') return
        setFetched({ key: loadKey, html: null })
      })

    return () => {
      cancelled = true
      abort.abort()
    }
  }, [live, stopped, address, loadKey])

  const go = (target: string) => {
    const next = canonicalUrl(target)
    setStopped(false)
    setTyped(null)
    setHovered(null)
    if (next === url) {
      // Same address: treat it as a reload rather than a history entry.
      setLoadToken((t) => t + 1)
      return
    }
    // A new destination truncates anything forward of here, as it should.
    setHistory((h) => [...h.slice(0, at + 1), next])
    setAt(at + 1)
  }

  /** Back and Forward re-run the load for wherever they land. */
  const jump = (to: number) => {
    setAt(to)
    setStopped(false)
    setTyped(null)
    setHovered(null)
  }

  const actions = {
    back: () => canBack && jump(at - 1),
    forward: () => canForward && jump(at + 1),
    reload: () => {
      setStopped(false)
      setLoadToken((t) => t + 1)
    },
    home: () => go(HOME_URL),
    stop: () => setStopped(true),
    go,
    viewSource: () => {
      // Whichever markup we're holding: ours as authored, or a live page as sent.
      if (page) setSource(sourceFor(page))
      else if (typeof liveHtml === 'string') setSource(liveHtml)
    },
    // Communicator's other half. A window of its own rather than a page in the
    // viewport: it is an editor, and popping its preview out is the whole point.
    composer: () => wm.openApp('composer'),
    about: () => setAbout(true),
    close: () => wm.close(windowId),
    toggleBar: (bar: 'navigation' | 'location' | 'personal') =>
      setBars((b) => ({ ...b, [bar]: !b[bar] })),
  }

  // Same idiom as hooks/useOutsideClick.ts: the listeners below attach once per
  // document and read whatever is current through here, so the effect doesn't have
  // to re-subscribe every time `go` is rebuilt.
  const latest = useRef({ go })
  useEffect(() => {
    latest.current = { go }
  })

  const hasOwnDoc = !!ownDoc

  /**
   * Wires the chrome into whatever document we're holding — a 1997 page or a live
   * one we fetched. Both go into a sandboxed `srcdoc` iframe, which keeps real
   * user-agent defaults and seals them off from the shell's stylesheet; `srcdoc`
   * documents are same-origin, so the listeners below can reach in.
   */
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !hasOwnDoc) return

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      const href = anchor?.getAttribute('href')
      if (!anchor || !href) return
      e.preventDefault()
      if (href.startsWith('#')) return
      if (href.startsWith('mailto:')) {
        setMailTo(href.slice('mailto:'.length))
        return
      }
      // A relative href needs the document's `<base>` to resolve, which is what
      // `anchor.href` applies. The 1997 pages write theirs out in full.
      const absolute = /^[a-z][a-z0-9+.-]*:/i.test(href) ? href : anchor.href
      latest.current.go(absolute)
    }

    /**
     * GET forms become navigations. theoldnet.com is driven by one, so without this
     * its front page would be a dead end — and a real submission inside the frame
     * would be exactly the invisible navigation this whole path exists to avoid.
     */
    const onSubmit = (e: Event) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      if ((form.getAttribute('method') ?? 'get').toLowerCase() !== 'get') return
      const params = new URLSearchParams()
      for (const [name, value] of new FormData(form).entries()) {
        if (typeof value === 'string') params.append(name, value)
      }
      // Against `origin`, not the requested address — a relative action on a redirected
      // page belongs to where the page came from. Same reason as the `<base>` above.
      const action = new URL(form.getAttribute('action') || '', origin)
      action.search = params.toString()
      latest.current.go(action.href)
    }

    // Hovering a link put its address in the status bar. Half of learning how the
    // web worked was reading that line. Clearing it lets the derived status — a
    // load in progress, or "Document: Done" — show through again on its own.
    const onOver = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      const href = anchor?.getAttribute('href')
      if (href) setHovered(href)
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('a')) setHovered(null)
    }

    const attach = () => {
      const doc = frame.contentDocument
      if (!doc) return
      doc.addEventListener('click', onClick)
      doc.addEventListener('submit', onSubmit)
      doc.addEventListener('mouseover', onOver)
      doc.addEventListener('mouseout', onOut)
    }

    // The document may already be in place by the time this runs.
    attach()
    frame.addEventListener('load', attach)
    return () => frame.removeEventListener('load', attach)
  }, [loadKey, hasOwnDoc, origin])

  const menus = buildNetscapeMenus(actions, {
    canBack,
    canForward,
    loading,
    canViewSource: !!page || typeof liveHtml === 'string',
    bars,
    history: history.map((h) => ({
      url: h,
      title: findPage(h)?.title ?? canonicalUrl(h),
    })),
  })

  return (
    <div className="ns-netscape">
      <MenuBar menus={menus} />

      {bars.navigation && (
        <div className="ns-toolbar">
          <Tool label="Back" art={BackIcon} onClick={actions.back} disabled={!canBack} />
          <Tool
            label="Forward"
            art={ForwardIcon}
            onClick={actions.forward}
            disabled={!canForward}
          />
          <Tool label="Reload" art={ReloadIcon} onClick={actions.reload} />
          <Tool label="Home" art={HomeIcon} onClick={actions.home} />
          <Tool label="Search" art={SearchIcon} onClick={() => go(HOME_URL)} />
          <Tool label="Print" art={PrintIcon} onClick={() => {}} disabled />
          <Tool label="Stop" art={StopIcon} onClick={actions.stop} disabled={!loading} />
          <span className="ns-toolbar-spacer" />
          <Throbber spinning={loading} />
        </div>
      )}

      {bars.location && (
        <div className="ns-locationbar">
          <label htmlFor={`ns-loc-${windowId}`}>Location:</label>
          <input
            id={`ns-loc-${windowId}`}
            className="ns-location"
            value={typed ?? origin}
            spellCheck={false}
            onChange={(e) => setTyped(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go(typed ?? url)
              if (e.key === 'Escape') setTyped(null)
            }}
          />
        </div>
      )}

      {bars.personal && (
        <div className="ns-personalbar">
          {BOOKMARKS.map((b) => (
            <button
              key={b.url}
              type="button"
              className="ns-bookmark"
              onClick={() => go(b.url)}
            >
              {b.label}
            </button>
          ))}
          <button type="button" className="ns-bookmark" disabled>
            WebMail
          </button>
          <button type="button" className="ns-bookmark" disabled>
            Channels
          </button>
        </div>
      )}

      <div className="xp-window-content">
        {/* Keyed on the url and load count so every navigation *and* every reload
            gets a fresh document — which resets the scroll position and makes the
            load event fire each time. */}
        {ownDoc ? (
          /* Our markup, so the chrome can read it. No `allow-scripts`: nothing on
             a page runs, which also means no framebuster and no tracker on a live
             one. Forms are permitted only because the handler above cancels every
             submission and turns it into a navigation of ours. */
          <iframe
            key={loadKey}
            ref={frameRef}
            className="ns-viewport"
            // `aria-label`, not `title`: both name the frame for assistive tech,
            // but `title` also renders as a tooltip whenever the pointer rests
            // anywhere over the page.
            aria-label={title}
            sandbox="allow-same-origin allow-forms"
            srcDoc={ownDoc}
          />
        ) : opaque ? (
          /* The fetch was refused, so the frame loads it. This is the blind mode:
             scripts run, and navigation inside is invisible to the Location bar.
             No `allow-top-navigation` — an old page's framebuster must not be able
             to redirect the whole desktop. */
          <iframe
            key={`${loadKey}!opaque`}
            className="ns-viewport"
            aria-label={host}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            referrerPolicy="no-referrer"
            src={address}
          />
        ) : (
          /* Fetch in flight. A blank panel rather than an iframe, so the address
             isn't requested twice. */
          <div className="ns-viewport" />
        )}
      </div>

      <div className="ns-statusbar">
        <span
          className="ns-security"
          data-secure={secure}
          title={secure ? 'This page is encrypted' : 'This page is not encrypted'}
        >
          {secure ? <ClosedLock /> : <BrokenKey />}
        </span>
        <span className="ns-status-text">{status}</span>
        <span className="ns-progress" data-loading={loading}>
          <span className="ns-progress-fill" />
        </span>
      </div>

      {source && (
        <Dialog title={`Source of: ${origin}`} onClose={() => setSource(null)}>
          <pre className="ns-source">{source}</pre>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setSource(null)}
            >
              Close
            </button>
          </div>
        </Dialog>
      )}

      {about && (
        <Dialog title="About Communicator" onClose={() => setAbout(false)}>
          <div className="ns-about">
            <strong>Netscape Communicator 4.08</strong>
            <br />
            Netscape Navigator
            <br />
            <br />
            Grey is the default document background, as it was before every page
            started specifying its own.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setAbout(false)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}

      {mailTo && (
        <MessageBox
          title="Netscape"
          message={`Netscape Messenger is not configured.\n\nA message to ${mailTo} could not be composed.`}
          buttons={[{ label: 'OK', primary: true, onClick: () => setMailTo(null) }]}
          onClose={() => setMailTo(null)}
        />
      )}
    </div>
  )
}
