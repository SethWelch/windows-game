import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import type { AppProps } from '@/os/types.ts'
import { player, usePlayerSettings } from '@/os/mediaPlayer.ts'
import { wm } from '@/os/windowStore.ts'
import {
  LIBRARY,
  clock,
  nextIndex,
  previousIndex,
  totalLength,
} from './library.ts'
import { buildPlayerMenus } from './mediaPlayerMenus.ts'
import { RadioTuner } from './RadioTuner.tsx'
import { SkinChooser } from './SkinChooser.tsx'
import { SOMA_CREDIT, SOMA_HOME } from './somafm.ts'
import type { Station } from './somafm.ts'
import { useMusic } from './useMusic.ts'
import { useRadio } from './useRadio.ts'
import { Visualizer } from './visualizer.tsx'
import type { Visualization } from './visualizer.tsx'
import './MediaPlayer.css'

/** How often the transport advances. Four a second keeps the seek bar smooth. */
const TICK_MS = 250
const STEP = TICK_MS / 1000

type View =
  | 'nowPlaying'
  | 'mediaGuide'
  | 'mediaLibrary'
  | 'radioTuner'
  | 'skinChooser'

const FEATURES: { id: View; label: string }[] = [
  { id: 'nowPlaying', label: 'Now\nPlaying' },
  { id: 'mediaGuide', label: 'Media\nGuide' },
  { id: 'mediaLibrary', label: 'Media\nLibrary' },
  { id: 'radioTuner', label: 'Radio\nTuner' },
  { id: 'skinChooser', label: 'Skin\nChooser' },
]

/**
 * The features that never worked without something we haven't got. These messages are the
 * ones the real player showed, and they're more honest than a greyed-out button: the Media
 * Guide really did just need the internet.
 *
 * Radio Tuner used to be in here and no longer is — it needed the internet too, and the
 * internet is available. See somafm.ts. Skin Chooser has left for the same reason: there
 * are skins now. The two CD features are gone from the bar entirely rather than sitting
 * there greyed, because there is no drive here and there never will be — a permanently
 * dead button is worse than no button.
 */
const UNAVAILABLE: Partial<Record<View, { heading: string; body: string }>> = {
  mediaGuide: {
    heading: 'Cannot connect to the Internet',
    body: 'The Media Guide requires an active connection. Check your connection settings and try again.',
  },
}

export function MediaPlayer({ windowId }: AppProps) {
  const [view, setView] = useState<View>('nowPlaying')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(0)
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Persisted, and shared with any other Media Player window — see os/mediaPlayer.ts.
  const { volume, muted, skin } = usePlayerSettings()
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [visualization, setVisualization] = useState<Visualization>('ambience')
  const [features, setFeatures] = useState(true)
  const [about, setAbout] = useState(false)

  const radio = useRadio(playing, volume, muted)
  /** A tuned station replaces the invented library as what the transport is driving. */
  const onAir = radio.station

  const track = LIBRARY[current] ?? null
  // A live stream has no length, and that is the whole reason the radio lives here: there
  // is no duration to invent, so the seek bar simply has nothing to do.
  const length = onAir ? 0 : (track?.length ?? 0)

  // Silent while a station is on: one transport, two things it can be driving.
  const music = useMusic({
    notes: onAir ? null : (track?.notes ?? null),
    playing,
    volume,
    muted,
  })

  useEffect(() => {
    const name = onAir ? onAir.title : track?.title
    wm.setTitle(windowId, name ? `${name} - Windows Media Player` : 'Windows Media Player')
  }, [windowId, track, onAir])

  /**
   * The transport reads through here rather than from the interval's closure, so
   * the timer is created once per play/pause instead of once per tick — the same
   * idiom hooks/useOutsideClick.ts uses.
   */
  const latest = useRef({ position, current, length, repeat, shuffle, onAir })
  useEffect(() => {
    latest.current = { position, current, length, repeat, shuffle, onAir }
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
      // On the radio the transport is a clock, not a progress bar: it counts how long
      // you have been listening and never runs out.
      if (s.onAir) {
        setPosition((p) => p + STEP)
        return
      }
      // Read, not incremented. The synth is scheduled on the audio clock and this is
      // that clock — a stopwatch here would slowly disagree with what you can hear.
      const next = music.position()
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
  }, [playing, music])

  /**
   * Playing a song is the one thing that leaves the radio.
   *
   * Reached from the Media Library table and from the playlist's own rows — and the
   * playlist only offers tracks when no station is on, so in practice this is "you went
   * to the library and started something", which is exactly when the transport should
   * stop being a tuner.
   */
  const playTrack = (index: number) => {
    radio.untune()
    setCurrent(index)
    setSelected(index)
    setPosition(0)
    setPlaying(true)
  }

  /** Tuning a station starts it, and takes the transport off the library. */
  const tune = (station: Station) => {
    radio.tune(station)
    setPosition(0)
    setPlaying(true)
  }

  const actions = {
    playPause: () => {
      // Hitting play at the end of the playlist starts it over. A stream has no end.
      if (!onAir && !playing && position >= length && length > 0) {
        setPosition(0)
        music.seek(0)
      }
      setPlaying((p) => !p)
    },
    stop: () => {
      setPlaying(false)
      setPosition(0)
      music.seek(0)
      // The station stays tuned. Stop means stop listening, not forget where you were —
      // the list beside the visualization is still the dial, and pressing play picks the
      // same station back up. The connection is released either way; `useRadio` detaches
      // the stream whenever playback stops, so nothing is held open.
    },
    // Next and previous walk the station list while the radio is on, which is what a
    // tuner's buttons are for.
    previous: () =>
      onAir ? radio.step(-1) : playTrack(previousIndex(current, LIBRARY.length)),
    next: () => {
      if (onAir) return radio.step(1)
      const following = nextIndex(current, LIBRARY.length, shuffle)
      playTrack(following ?? 0)
    },
    toggleShuffle: () => setShuffle((v) => !v),
    toggleRepeat: () => setRepeat((v) => !v),
    toggleMute: () => player.setMuted(!muted),
    setVisualization,
    toggleFeatures: () => setFeatures((v) => !v),
    about: () => setAbout(true),
    exit: () => wm.close(windowId),
  }

  /**
   * The two lines over the visualization while a station is up.
   *
   * Stopped names the station rather than the track, because the track is whatever was
   * playing when you stopped and is getting staler by the minute — the station is the
   * thing that is still true. Now that Stop leaves the dial tuned, this state is one you
   * can sit in.
   */
  const onAirLines = onAir
    ? {
        top: playing ? (radio.song?.artist ?? onAir.title) : onAir.title,
        bottom:
          radio.error ??
          (!playing
            ? onAir.description
            : radio.waiting && !radio.song
              ? `Connecting to ${onAir.title}...`
              : (radio.song?.title ?? onAir.description)),
      }
    : null

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
    // Every colour in MediaPlayer.css is derived from the variables this attribute sets.
    <div className="wmp" data-wmp-skin={skin}>
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
                <div className="wmp-np-main">
                  {/* The real player named the artist and track above the pane. Only the
                      radio has anything true to put there — the library's titles are
                      invented and already quoted in the status bar — so this appears when
                      a station is on and not otherwise.

                      Laid *over* the visualization rather than above it, so the station's
                      logo and title cost the visualization no height at all. It reads
                      fine over a bright Ambience because of the scrim behind it. */}
                  {onAir && (
                    <div className="wmp-np-info">
                      {onAir.logo && (
                        <img
                          className="wmp-np-logo"
                          src={onAir.logo}
                          alt={`${onAir.title} on SomaFM`}
                        />
                      )}
                      <span className="wmp-np-lines">
                        <span className="wmp-np-artist">{onAirLines?.top}</span>
                        <span className="wmp-np-title">{onAirLines?.bottom}</span>
                        <span className="wmp-np-station">{onAir.title} — SomaFM</span>
                      </span>
                    </div>
                  )}
                  <Visualizer
                    kind={visualization}
                    playing={playing}
                    /* On the radio the station is the closest thing to an album there is,
                       and unlike the invented library it has real art to show. */
                    track={
                      onAir
                        ? {
                            title: radio.song?.title ?? onAir.title,
                            album: onAir.title,
                            art: onAir.logoLarge,
                          }
                        : track
                    }
                  />
                </div>

                {/* The list beside the visualization is whatever the transport is
                    driving: the library's tracks, or — once a station is on — the rest of
                    the dial, so you can move between stations without going back to Radio
                    Tuner. Same rows either way, because they are the same kind of thing. */}
                <div className="wmp-playlist">
                  {onAir ? (
                    <>
                      <div className="wmp-playlist-head">
                        Radio Stations
                        <span>{radio.stations.length}</span>
                      </div>
                      <div className="wmp-playlist-body">
                        {radio.stations.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="wmp-track"
                            /* Both, and they are always the same row: with no queue to
                               select into, the station you are listening to is the only
                               thing either flag could mean. */
                            data-selected={s.id === onAir.id}
                            data-playing={s.id === onAir.id}
                            /* One click tunes, where a track needs two. A track can be
                               selected without being played because there is a queue to
                               select into; a station has no queue, so "selected but not
                               listening" would mean nothing. */
                            onClick={() => tune(s)}
                          >
                            <span className="wmp-track-title">{s.title}</span>
                            <span className="wmp-track-time">{s.listeners}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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

            {view === 'radioTuner' && <RadioTuner tuned={onAir} onTune={tune} />}

            {view === 'skinChooser' && (
              <SkinChooser current={skin} onApply={player.setSkin} />
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
            // Nothing to seek within on a live stream, and the real player greyed it too.
            disabled={!!onAir}
            onChange={(e) => {
              const to = Number(e.target.value)
              setPosition(to)
              music.seek(to)
            }}
          />
          <span className="wmp-time">
            {onAir ? `${clock(position)} live` : `${clock(position)} / ${clock(length)}`}
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
            // `setVolume` unmutes on its own, as the tray's does.
            onChange={(e) => player.setVolume(Number(e.target.value))}
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
        <span>
          {radio.error
            ? 'Error'
            : radio.waiting
              ? 'Buffering'
              : playing
                ? 'Playing'
                : position > 0
                  ? 'Paused'
                  : 'Ready'}
        </span>
        <span>
          {onAir ? (
            /* Credited wherever a stream of theirs is what you are hearing, not only on
               the tab that lists them. */
            <>
              {onAir.title} &mdash;{' '}
              <a
                className="wmp-status-link"
                href={SOMA_HOME}
                target="_blank"
                rel="noreferrer noopener"
              >
                {SOMA_CREDIT}
              </a>
            </>
          ) : track ? (
            `${track.artist} — ${track.album}`
          ) : (
            ''
          )}
        </span>
        <span>{onAir ? 'Live stream' : (track?.detail ?? '')}</span>
      </div>

      {about && (
        <Dialog title="About Windows Media Player" onClose={() => setAbout(false)}>
          <div className="wmp-about">
            <strong>Windows Media Player</strong>
            <br />
            Version 9.00.00.2980
            <br />
            <br />
            The library is five public-domain pieces, written out as notes and played by
            two oscillators and an envelope — which is roughly what a PC without a
            wavetable card sounded like. Radio Tuner is real too, and plays real stations
            from SomaFM.
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
