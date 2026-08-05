import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import {
  LIBRARY,
  clock,
  nextIndex,
  previousIndex,
  totalLength,
} from './library.ts'
import { buildPlayerMenus } from './mediaPlayerMenus.ts'
import { Visualizer } from './visualizer.tsx'
import type { Visualization } from './visualizer.tsx'
import './MediaPlayer.css'

/** How often the transport advances. Four a second keeps the seek bar smooth. */
const TICK_MS = 250
const STEP = TICK_MS / 1000

type View =
  | 'nowPlaying'
  | 'mediaGuide'
  | 'copyFromCd'
  | 'mediaLibrary'
  | 'radioTuner'
  | 'copyToCd'
  | 'skinChooser'

const FEATURES: { id: View; label: string }[] = [
  { id: 'nowPlaying', label: 'Now\nPlaying' },
  { id: 'mediaGuide', label: 'Media\nGuide' },
  { id: 'copyFromCd', label: 'Copy from\nCD' },
  { id: 'mediaLibrary', label: 'Media\nLibrary' },
  { id: 'radioTuner', label: 'Radio\nTuner' },
  { id: 'copyToCd', label: 'Copy to CD\nor Device' },
  { id: 'skinChooser', label: 'Skin\nChooser' },
]

/**
 * The five features that never worked without something we haven't got. These
 * messages are the ones the real player showed, and they're more honest than a
 * greyed-out button: the Media Guide really did just need the internet.
 */
const UNAVAILABLE: Partial<Record<View, { heading: string; body: string }>> = {
  mediaGuide: {
    heading: 'Cannot connect to the Internet',
    body: 'The Media Guide requires an active connection. Check your connection settings and try again.',
  },
  radioTuner: {
    heading: 'Cannot connect to the Internet',
    body: 'Radio Tuner presets are downloaded from the web. No connection is available.',
  },
  copyFromCd: {
    heading: 'Please insert an audio CD',
    body: 'There is no disc in drive D:. Insert an audio CD and the track list will appear here.',
  },
  copyToCd: {
    heading: 'No writable device detected',
    body: 'Connect a CD recorder or a portable device to copy the items in your library to it.',
  },
  skinChooser: {
    heading: 'No skins installed',
    body: 'Only the default skin is present. Visit the Windows Media website to download more.',
  },
}

export function MediaPlayer({ windowId }: AppProps) {
  const [view, setView] = useState<View>('nowPlaying')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(0)
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [visualization, setVisualization] = useState<Visualization>('bars')
  const [features, setFeatures] = useState(true)
  const [about, setAbout] = useState(false)

  const track = LIBRARY[current] ?? null
  const length = track?.length ?? 0

  useEffect(() => {
    wm.setTitle(
      windowId,
      track ? `${track.title} - Windows Media Player` : 'Windows Media Player',
    )
  }, [windowId, track])

  /**
   * The transport reads through here rather than from the interval's closure, so
   * the timer is created once per play/pause instead of once per tick — the same
   * idiom hooks/useOutsideClick.ts uses.
   */
  const latest = useRef({ position, current, length, repeat, shuffle })
  useEffect(() => {
    latest.current = { position, current, length, repeat, shuffle }
  })

  /**
   * Advances the position, and decides what happens at the end of a track. All of
   * it happens in the interval callback rather than inside a state updater — an
   * updater has to stay pure, and this branch changes three things at once.
   */
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const s = latest.current
      const next = s.position + STEP
      if (next < s.length) {
        setPosition(next)
        return
      }
      if (s.repeat) {
        setPosition(0)
        return
      }
      const following = nextIndex(s.current, LIBRARY.length, s.shuffle)
      if (following === null) {
        // End of the playlist: stop with the position parked at the end.
        setPlaying(false)
        setPosition(s.length)
        return
      }
      setCurrent(following)
      setSelected(following)
      setPosition(0)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [playing])

  const playTrack = (index: number) => {
    setCurrent(index)
    setSelected(index)
    setPosition(0)
    setPlaying(true)
  }

  const actions = {
    playPause: () => {
      // Hitting play at the end of the playlist starts it over.
      if (!playing && position >= length && length > 0) setPosition(0)
      setPlaying((p) => !p)
    },
    stop: () => {
      setPlaying(false)
      setPosition(0)
    },
    previous: () => playTrack(previousIndex(current, LIBRARY.length)),
    next: () => {
      const following = nextIndex(current, LIBRARY.length, shuffle)
      playTrack(following ?? 0)
    },
    toggleShuffle: () => setShuffle((v) => !v),
    toggleRepeat: () => setRepeat((v) => !v),
    toggleMute: () => setMuted((v) => !v),
    setVisualization,
    toggleFeatures: () => setFeatures((v) => !v),
    about: () => setAbout(true),
    exit: () => wm.close(windowId),
  }

  const menus = buildPlayerMenus(actions, {
    playing,
    shuffle,
    repeat,
    muted,
    features,
    visualization,
  })

  const unavailable = UNAVAILABLE[view]

  return (
    <div className="wmp">
      <MenuBar menus={menus} />

      <div className="xp-window-content">
        <div className="wmp-body">
          {features && (
            <div className="wmp-features">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="wmp-feature"
                  data-active={view === f.id}
                  onClick={() => setView(f.id)}
                >
                  {f.label.split('\n').map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </button>
              ))}
            </div>
          )}

          <div className="wmp-view">
            {view === 'nowPlaying' && (
              <div className="wmp-nowplaying">
                <Visualizer
                  kind={visualization}
                  playing={playing}
                  track={track}
                />

                <div className="wmp-playlist">
                  <div className="wmp-playlist-head">
                    Playlist
                    <span>{clock(totalLength(LIBRARY))}</span>
                  </div>
                  <div className="wmp-playlist-body">
                    {LIBRARY.map((t, i) => (
                      <button
                        key={t.id}
                        type="button"
                        className="wmp-track"
                        data-selected={selected === i}
                        data-playing={current === i}
                        onClick={() => setSelected(i)}
                        onDoubleClick={() => playTrack(i)}
                      >
                        <span className="wmp-track-title">{t.title}</span>
                        <span className="wmp-track-time">{clock(t.length)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === 'mediaLibrary' && (
              <div className="wmp-library">
                <table className="wmp-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Artist</th>
                      <th>Album</th>
                      <th>Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIBRARY.map((t, i) => (
                      <tr
                        key={t.id}
                        data-selected={selected === i}
                        onPointerDown={() => setSelected(i)}
                        onDoubleClick={() => playTrack(i)}
                      >
                        <td>{t.title}</td>
                        <td>{t.artist}</td>
                        <td>{t.album}</td>
                        <td className="wmp-cell-right">{clock(t.length)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {unavailable && (
              <div className="wmp-unavailable">
                <p className="wmp-unavailable-head">{unavailable.heading}</p>
                <p>{unavailable.body}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Transport ---- */}
      <div className="wmp-transport">
        <div className="wmp-seekrow">
          <input
            className="wmp-seek"
            type="range"
            min={0}
            max={Math.max(1, length)}
            step={0.25}
            value={Math.min(position, length)}
            aria-label="Seek"
            onChange={(e) => setPosition(Number(e.target.value))}
          />
          <span className="wmp-time">
            {clock(position)} / {clock(length)}
          </span>
        </div>

        <div className="wmp-buttons">
          <button
            type="button"
            className="wmp-play"
            title={playing ? 'Pause' : 'Play'}
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={actions.playPause}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="7" y="5" width="4" height="14" fill="#fff" />
                <rect x="13" y="5" width="4" height="14" fill="#fff" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M8 4.5v15l12-7.5z" fill="#fff" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="wmp-round"
            title="Stop"
            aria-label="Stop"
            onClick={actions.stop}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="6" y="6" width="12" height="12" fill="#cfe4ff" />
            </svg>
          </button>
          <button
            type="button"
            className="wmp-round"
            title="Previous"
            aria-label="Previous"
            onClick={actions.previous}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M18 5v14L8 12z" fill="#cfe4ff" />
              <rect x="5" y="5" width="2.4" height="14" fill="#cfe4ff" />
            </svg>
          </button>
          <button
            type="button"
            className="wmp-round"
            title="Next"
            aria-label="Next"
            onClick={actions.next}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 5v14l10-7z" fill="#cfe4ff" />
              <rect x="16.6" y="5" width="2.4" height="14" fill="#cfe4ff" />
            </svg>
          </button>

          <span className="wmp-gap" />

          <button
            type="button"
            className="wmp-round wmp-mute"
            data-muted={muted}
            title={muted ? 'Unmute' : 'Mute'}
            aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={actions.toggleMute}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="#cfe4ff" />
              {muted ? (
                <path
                  d="M15 9l5 6M20 9l-5 6"
                  stroke="#ff9a9a"
                  strokeWidth="1.8"
                  fill="none"
                />
              ) : (
                <path
                  d="M15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12"
                  stroke="#cfe4ff"
                  strokeWidth="1.6"
                  fill="none"
                />
              )}
            </svg>
          </button>

          <input
            className="wmp-volume"
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            aria-label="Volume"
            onChange={(e) => {
              setVolume(Number(e.target.value))
              setMuted(false)
            }}
          />

          <span className="wmp-gap" />

          <button
            type="button"
            className="wmp-toggle"
            data-on={shuffle}
            title="Shuffle"
            onClick={actions.toggleShuffle}
          >
            Shuffle
          </button>
          <button
            type="button"
            className="wmp-toggle"
            data-on={repeat}
            title="Repeat"
            onClick={actions.toggleRepeat}
          >
            Repeat
          </button>
        </div>
      </div>

      <div className="wmp-status">
        <span>{playing ? 'Playing' : position > 0 ? 'Paused' : 'Ready'}</span>
        <span>
          {track ? `${track.artist} — ${track.album}` : ''}
        </span>
        <span>{track ? `${track.bitrate} Kbps` : ''}</span>
      </div>

      {about && (
        <Dialog title="About Windows Media Player" onClose={() => setAbout(false)}>
          <div className="wmp-about">
            <strong>Windows Media Player</strong>
            <br />
            Version 9.00.00.2980
            <br />
            <br />
            There is no audio device here and the library is invented — but the
            transport, the playlist and the visualizations are all real, and the
            bars bounce in CSS so they cost nothing to watch.
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
    </div>
  )
}
