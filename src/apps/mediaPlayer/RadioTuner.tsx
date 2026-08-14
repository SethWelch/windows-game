import { useEffect, useState } from 'react'
import { SOMA_CREDIT, SOMA_HOME, fetchStations, stationPage } from './somafm.ts'
import type { Station } from './somafm.ts'

/**
 * Radio Tuner, listing SomaFM's channels.
 *
 * The real one downloaded presets from Microsoft and grouped them by genre, which is what
 * this does — the genres come from the channels themselves, so the list is theirs rather
 * than ours and cannot go stale in the way a hand-written one would.
 *
 * The credit at the bottom is not optional furniture. SomaFM takes no advertising and runs
 * on donations; they invite linking and this is their own suggested wording, pointing at
 * their home page rather than at a stream.
 */

/** What the list is doing. A union rather than three booleans that can disagree. */
type Load = 'loading' | 'ready' | 'failed'

export function RadioTuner({
  tuned,
  onTune,
}: {
  tuned: Station | null
  onTune: (station: Station) => void
}) {
  const [stations, setStations] = useState<Station[]>([])
  const [load, setLoad] = useState<Load>('loading')
  /** Which genre is expanded, or '' for all of them. */
  const [genre, setGenre] = useState('')

  /**
   * Fetched here rather than when the player opens, so a session that never visits this
   * tab never asks them for anything. `fetchStations` caches for the session, so coming
   * back to this tab is free.
   */
  useEffect(() => {
    const abort = new AbortController()
    fetchStations(abort.signal)
      .then((list) => {
        setStations(list)
        setLoad('ready')
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return
        setLoad('failed')
      })
    return () => abort.abort()
  }, [])

  const genres = [...new Set(stations.flatMap((s) => s.genres))].sort((a, b) =>
    a.localeCompare(b),
  )
  const shown = genre ? stations.filter((s) => s.genres.includes(genre)) : stations

  return (
    <div className="wmp-radio">
      <div className="wmp-radio-head">
        <span className="wmp-radio-title">Radio Tuner</span>
        {load === 'ready' && (
          <select
            className="wmp-radio-genre"
            value={genre}
            aria-label="Genre"
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All genres ({stations.length})</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
      </div>

      {load === 'loading' && <p className="wmp-radio-note">Finding stations...</p>}

      {load === 'failed' && (
        <div className="wmp-unavailable">
          <p className="wmp-unavailable-head">Cannot connect to the Internet</p>
          <p>
            Radio Tuner presets are downloaded from the web. No connection is available.
          </p>
        </div>
      )}

      {load === 'ready' && (
        <div className="wmp-radio-list">
          {shown.map((s) => (
            <div
              key={s.id}
              className="wmp-radio-row"
              data-tuned={tuned?.id === s.id}
            >
              <button
                type="button"
                className="wmp-radio-tune"
                onClick={() => onTune(s)}
                title={`Listen to ${s.title}`}
              >
                {tuned?.id === s.id ? 'Playing' : 'Listen'}
              </button>
              <span className="wmp-radio-name">{s.title}</span>
              <span className="wmp-radio-desc">{s.description}</span>
              <span className="wmp-radio-genres">{s.genres.join(', ')}</span>
              <span className="wmp-radio-listeners">{s.listeners} listening</span>
              {/* A real link, not one routed through our own 1997 Navigator: an
                  attribution that lands on a fake 404 is not an attribution. Their
                  preferred target is the channel's own page. */}
              <a
                className="wmp-radio-link"
                href={stationPage(s.id)}
                target="_blank"
                rel="noreferrer noopener"
              >
                Info
              </a>
            </div>
          ))}
        </div>
      )}

      <p className="wmp-radio-credit">
        Stations provided by{' '}
        <a href={SOMA_HOME} target="_blank" rel="noreferrer noopener">
          {SOMA_CREDIT}
        </a>
        . Listener-supported and commercial-free.
      </p>
    </div>
  )
}
