/**
 * SomaFM — the one part of this machine that plays real audio.
 *
 * Everything else that makes a sound here is synthesised by os/audio.ts, and the media
 * library in library.ts is invented. Radio Tuner is the exception, and it is the right
 * place for the exception: a live stream has no length, so there is no duration to
 * reconcile against a transport, no seek bar to fake and nothing to pretend about.
 *
 * Why SomaFM and not one of the station directories: every one of its ~46 channels is
 * served over HTTPS, which matters because this site is, and a browser refuses to play
 * an HTTP stream inside an HTTPS page. Sampling one of the big directories, only about
 * a quarter of stations offered HTTPS at all. Its Icecast also answers with
 * `Access-Control-Allow-Origin: *`, which is what would let a real `AnalyserNode` drive
 * the Ambience visualization off actual audio rather than off arithmetic — see the note
 * at the bottom.
 *
 * **Their streams 403 any request carrying a `Referer`.** It is hotlink protection, it
 * applies to all 46 channels, and it is invisible from a terminal — curl sends no Referer
 * by default, so every station tests fine and every station fails in the browser. The fix
 * is the `no-referrer` meta in index.html, because a media element has no
 * `referrerPolicy` attribute to set. Do not remove that meta.
 *
 * They invite linking (somafm.com/linktous/) and ask that anything pointing straight at
 * a stream use their permanent URLs rather than a directory's. The `.pls` addresses here
 * come out of their own `channels.json`, so they are by definition the maintained ones.
 * They are listener-funded and take no advertising; the attribution and the link back are
 * not decoration, and `SOMA_HOME` is their own suggested wording.
 */

const API = 'https://api.somafm.com'

/** Where the attribution points. Their own sample link text, verbatim. */
export const SOMA_HOME = 'https://somafm.com/'
export const SOMA_CREDIT = 'SomaFM commercial-free internet radio'

/** A channel's own page, which is the link they prefer over a deep one. */
export const stationPage = (id: string) => `https://somafm.com/${id}`

export interface Station {
  id: string
  title: string
  description: string
  /** Pipe-separated in the API; split by the time it gets here. */
  genres: string[]
  listeners: number
  dj: string
  /**
   * The channel's logo, which they publish at 120, 256 and 512 across every channel.
   *
   * Remote rather than bundled, which is the one honest way to have artwork here: the
   * project ships no bitmaps beyond the wallpaper and the ad photos, and these are theirs
   * to serve. Unlike the streams they are not hotlink-protected, so they load whether or
   * not a Referer goes with them.
   */
  logo: string
  /** The 256px one, for anything bigger than a thumbnail. */
  logoLarge: string
  /** Resolved on demand — see `streamFor`. */
  playlist: string
}

export interface Song {
  artist: string
  title: string
  album: string
}

/** Shapes we read out of their JSON. Narrow on purpose: everything else is ignored. */
interface RawPlaylist {
  url?: unknown
  format?: unknown
  quality?: unknown
}
interface RawChannel {
  id?: unknown
  title?: unknown
  description?: unknown
  genre?: unknown
  listeners?: unknown
  dj?: unknown
  image?: unknown
  largeimage?: unknown
  playlists?: unknown
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

/**
 * Picks which of a channel's streams to ask for.
 *
 * MP3 over AAC deliberately. Every browser decodes MP3; the `aacp` (HE-AAC) streams are
 * the ones that silently fail in some, and a station that produces no sound is worse than
 * one that uses more bandwidth.
 *
 * It does cost them bandwidth: each channel lists exactly one MP3 stream and for some of
 * them that is 320kbps, where the AAC alternative is about 130. If being gentler on a
 * donation-funded service matters more than the last few percent of codec support, prefer
 * `format === 'aac'` here — deliberately not doing that by default, because silence is a
 * worse bug than bandwidth.
 */
function bestPlaylist(raw: unknown): string {
  if (!Array.isArray(raw)) return ''
  const lists = raw as RawPlaylist[]
  const ranked = lists
    .map((p) => ({
      url: str(p.url),
      mp3: str(p.format).toLowerCase() === 'mp3',
      best: str(p.quality).toLowerCase() === 'highest',
    }))
    .filter((p) => p.url.startsWith('https://'))
    .sort((a, b) => Number(b.mp3) - Number(a.mp3) || Number(b.best) - Number(a.best))
  return ranked[0]?.url ?? ''
}

/**
 * The channel list, cached for the session.
 *
 * Module-level rather than component state so switching away from Radio Tuner and back
 * doesn't ask them for the list again. They are a donation-funded service; one request
 * per session is the polite amount.
 */
let cache: Station[] | null = null

export const cachedStations = () => cache

export async function fetchStations(signal: AbortSignal): Promise<Station[]> {
  if (cache) return cache
  const res = await fetch(`${API}/channels.json`, { signal })
  if (!res.ok) throw new Error(`channels.json: ${res.status}`)
  const body = (await res.json()) as { channels?: unknown }
  const raw = Array.isArray(body.channels) ? (body.channels as RawChannel[]) : []

  const stations = raw
    .map((c) => ({
      id: str(c.id),
      title: str(c.title, 'Untitled'),
      description: str(c.description),
      genres: str(c.genre)
        .split('|')
        .map((g) => g.trim())
        .filter(Boolean),
      listeners: Number(c.listeners) || 0,
      dj: str(c.dj),
      logo: str(c.image),
      // Falls back to the small one rather than to nothing: a 120px logo scaled up is
      // better than a gap where the art should be.
      logoLarge: str(c.largeimage) || str(c.image),
      playlist: bestPlaylist(c.playlists),
    }))
    // A channel we can't reach over HTTPS would be a row that does nothing when clicked.
    .filter((s) => s.id && s.playlist)
    .sort((a, b) => a.title.localeCompare(b.title))

  cache = stations
  return stations
}

/**
 * Turns a `.pls` into the stream URL inside it.
 *
 * An `<audio>` element cannot play a playlist file — it is a text manifest, not media —
 * so this step is not optional. The file lists several mirrors as `File1=`, `File2=` and
 * so on; the first is their preferred one, and the rest are what a retry would use.
 */
export async function streamFor(station: Station, signal: AbortSignal): Promise<string[]> {
  const res = await fetch(station.playlist, { signal })
  if (!res.ok) throw new Error(`playlist: ${res.status}`)
  const text = await res.text()
  const mirrors = [...text.matchAll(/^\s*File\d+\s*=\s*(\S+)\s*$/gim)]
    .map((m) => m[1])
    .filter((u) => u.startsWith('https://'))
  if (!mirrors.length) throw new Error('playlist held no https stream')
  return mirrors
}

/**
 * What is playing right now, newest first.
 *
 * The station's title is in the stream itself as ICY metadata, but an `<audio>` element
 * gives no way to read it — hence this. Their API happens to expose it as JSON, which is
 * the only reason the player can name a track at all.
 */
export async function fetchNowPlaying(
  station: Station,
  signal: AbortSignal,
): Promise<Song | null> {
  const res = await fetch(`${API}/songs/${encodeURIComponent(station.id)}.json`, { signal })
  if (!res.ok) return null
  const body = (await res.json()) as { songs?: unknown }
  const first = Array.isArray(body.songs) ? (body.songs[0] as Record<string, unknown>) : null
  if (!first) return null
  const song = {
    artist: str(first.artist),
    title: str(first.title),
    album: str(first.album),
  }
  return song.artist || song.title ? song : null
}

/*
 * Not done, and worth knowing why it is easy from here: because these streams answer with
 * `Access-Control-Allow-Origin: *`, an `<audio>` with `crossOrigin = 'anonymous'` can be
 * fed to a Web Audio `AnalyserNode` without tainting it. That would let ambience.ts read
 * a real FFT instead of summing sines — the visualization would move to the music. Most
 * stations on the big directories cannot do this: no CORS on the stream means the analyser
 * reads silence.
 */
