import { useEffect, useRef, useState } from 'react'
import { useAudioSettings } from '@/os/audio.ts'
import { cachedStations, fetchNowPlaying, streamFor } from './somafm.ts'
import type { Song, Station } from './somafm.ts'

/**
 * A tuned SomaFM station, and the one `<audio>` element in the whole project.
 *
 * A hook rather than a store: a second Media Player window should be a second radio, not
 * a fight over one stream. And the element is created imperatively instead of rendered,
 * because it has nothing to show — putting it in the tree would mean threading a ref
 * through JSX for something that never paints.
 *
 * Everything here is keyed by station id and *derived* rather than cleared on the way in.
 * Clearing the last station's stream at the top of the effect that resolves the next one
 * would be exactly the `react-hooks/set-state-in-effect` the house rules forbid; tagging
 * each value with the station it belongs to makes a stale one un-readable instead, which
 * is the same outcome with no extra render.
 */

/** How often to ask what's playing. Their tracks run minutes, so this is generous. */
const NOW_PLAYING_MS = 20_000

export function useRadio(playing: boolean, volume: number, muted: boolean) {
  const [station, setStation] = useState<Station | null>(null)
  /** Resolved stream mirrors, tagged with the station they belong to. */
  const [resolved, setResolved] = useState<{ id: string; mirrors: string[] } | null>(null)
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null)
  const [heard, setHeard] = useState<{ id: string; song: Song | null } | null>(null)
  /** Which mirror we are on, so a refusing one can be stepped past. */
  const [attempt, setAttempt] = useState<{ id: string; index: number } | null>(null)
  /** Between pressing play and the first audio arriving, which takes a moment. */
  const [waiting, setWaiting] = useState(false)

  const elRef = useRef<HTMLAudioElement | null>(null)
  const mixer = useAudioSettings()

  const id = station?.id ?? ''
  const error = failed?.id === id ? failed.message : null
  const song = heard?.id === id ? heard.song : null
  const mirror = attempt?.id === id ? attempt.index : 0

  /** The element itself, for as long as the window is open. */
  useEffect(() => {
    const el = new Audio()
    // Nothing is fetched until a station is tuned. Without this the element would
    // start buffering the moment a src is assigned, even paused.
    el.preload = 'none'
    /*
     * `crossOrigin` is deliberately *not* set. It is what a Web Audio `AnalyserNode`
     * would need, and these streams do send the CORS header that makes it work — but
     * setting it means a mirror that ever stops sending that header plays nothing at all.
     * Turning it on is step one of driving the visualization off real audio, and should
     * happen at the same time as the rest of that, not before.
     */
    elRef.current = el
    return () => {
      el.pause()
      // Detaching the source matters: a paused element with a live stream src keeps the
      // connection open, so closing the window would leave it running.
      el.removeAttribute('src')
      el.load()
      elRef.current = null
    }
  }, [])

  /** Turns the station's playlist file into stream URLs. */
  useEffect(() => {
    if (!station) return
    const abort = new AbortController()
    streamFor(station, abort.signal)
      .then((mirrors) => setResolved({ id: station.id, mirrors }))
      .catch((e: Error) => {
        if (e.name === 'AbortError') return
        setFailed({ id: station.id, message: `Cannot reach ${station.title}.` })
      })
    return () => abort.abort()
  }, [station])

  /**
   * Points the element at the stream and starts or stops it.
   *
   * The stream URL is worked out in here rather than derived above, because a derived
   * array would be a new identity every render and this effect would then re-run — and
   * re-running it means re-assigning `src`, which restarts the stream.
   *
   * Nothing sets `waiting` directly. Whether audio is flowing is the element's business,
   * not React's, so it comes back through the element's own events — which is also what
   * keeps this out of `react-hooks/set-state-in-effect`. `loadstart` is the one that fires
   * when `play()` begins fetching, and is what puts "Connecting" on screen.
   */
  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const mirrors = resolved?.id === station?.id ? (resolved?.mirrors ?? []) : []
    const src = mirrors[mirror]
    if (!station || !src) {
      el.pause()
      return
    }

    /**
     * A stream that dies mid-listen fires this, as does a mirror that refuses us — which
     * is why it steps to the next one before giving up. The playlist always lists three,
     * and the whole point of them being there is that any one of them can be down.
     */
    const onError = () => {
      if (mirror + 1 < mirrors.length) {
        setAttempt({ id: station.id, index: mirror + 1 })
        return
      }
      setFailed({
        id: station.id,
        message: `Cannot play ${station.title} — tried ${mirrors.length} servers.`,
      })
    }
    const flowing = () => setWaiting(false)
    const stalled = () => setWaiting(true)
    el.addEventListener('error', onError)
    el.addEventListener('loadstart', stalled)
    el.addEventListener('waiting', stalled)
    el.addEventListener('playing', flowing)
    el.addEventListener('pause', flowing)

    if (el.src !== src) el.src = src
    if (playing) {
      // Rejects if the browser refuses to autoplay, or if a pause interrupts the
      // promise — the latter is routine and not worth reporting.
      el.play().catch((e: Error) => {
        if (e.name === 'AbortError') return
        setFailed({ id: station.id, message: 'The browser blocked playback. Press Play.' })
      })
    } else {
      el.pause()
    }

    return () => {
      el.removeEventListener('error', onError)
      el.removeEventListener('loadstart', stalled)
      el.removeEventListener('waiting', stalled)
      el.removeEventListener('playing', flowing)
      el.removeEventListener('pause', flowing)
    }
  }, [station, resolved, mirror, playing])

  /**
   * The player's own volume, scaled by the tray mixer.
   *
   * Both, because they meant different things: WMP's slider was its own, but the system
   * mixer still sat on top of it. Muting either one silences the stream.
   */
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    el.volume = (volume / 100) * (mixer.volume / 100)
    el.muted = muted || mixer.muted
  }, [volume, muted, mixer.volume, mixer.muted])

  /** Polls what's playing, but only while a station is actually audible. */
  useEffect(() => {
    if (!station || !playing) return
    const abort = new AbortController()
    const ask = () => {
      fetchNowPlaying(station, abort.signal)
        .then((song) => setHeard({ id: station.id, song }))
        .catch(() => {
          // A missed poll is not worth surfacing — the last title stays up.
        })
    }
    ask()
    const timer = window.setInterval(ask, NOW_PLAYING_MS)
    return () => {
      abort.abort()
      window.clearInterval(timer)
    }
  }, [station, playing])

  return {
    station,
    song,
    error,
    waiting,
    /**
     * Every station, for the Now Playing list to offer.
     *
     * Read straight off the session cache rather than held in state: you cannot tune a
     * station without having loaded the list first, so by the time anything asks for this
     * it is populated and never changes again.
     */
    stations: cachedStations() ?? [],
    tune: setStation,
    untune: () => setStation(null),
    /**
     * Next and previous station, which is what those transport buttons should do while
     * the radio is on. Reads the session's cached channel list rather than holding its
     * own copy — see `cachedStations`.
     */
    step: (delta: number) => {
      const all = cachedStations()
      if (!all?.length || !station) return
      const at = all.findIndex((s) => s.id === station.id)
      if (at < 0) return
      setStation(all[(at + delta + all.length) % all.length])
    },
  }
}
