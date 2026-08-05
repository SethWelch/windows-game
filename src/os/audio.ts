import { useSyncExternalStore } from 'react'

/**
 * The shell's sound, synthesised.
 *
 * Nothing is sampled: every one of these is a few oscillators and an envelope, built
 * here at runtime. That is partly because this project ships no binary assets, and
 * partly because the sounds it is standing in for aren't ours to copy — these are
 * original tones in the same register as the events they mark, not reproductions of
 * anybody's sound scheme.
 *
 * Volume and mute live here too, since the tray needs them and so does every sound.
 */

export type SoundName =
  | 'ding'
  | 'exclamation'
  | 'critical'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'recycle'
  | 'notify'

interface Tone {
  /** Starting frequency in Hz. */
  from: number
  /** Slides to this by the end of the tone, if given. */
  to?: number
  /** Seconds after the sound begins. */
  at?: number
  /** Seconds. */
  dur: number
  type?: OscillatorType
  gain?: number
}

/**
 * The recipes. A bell is a tone plus a quiet partial above it; a warning falls;
 * something going wrong sits on two frequencies close enough to beat against each
 * other. `recycle` is the only one that isn't tonal at all.
 */
const RECIPES: Record<SoundName, Tone[] | 'noise'> = {
  // Two partials a fifth apart: enough to read as a bell rather than a beep.
  ding: [
    { from: 880, dur: 0.4 },
    { from: 1320, dur: 0.3, gain: 0.09 },
  ],
  // A falling third — the shape of every "are you sure".
  exclamation: [
    { from: 784, dur: 0.16 },
    { from: 587, at: 0.14, dur: 0.34 },
  ],
  // A minor second, low and left to beat. Unpleasant on purpose.
  critical: [
    { from: 233, dur: 0.5, type: 'triangle', gain: 0.2 },
    { from: 220, dur: 0.5, type: 'triangle', gain: 0.2 },
  ],
  minimize: [{ from: 720, to: 300, dur: 0.14, type: 'triangle', gain: 0.14 }],
  maximize: [{ from: 300, to: 720, dur: 0.14, type: 'triangle', gain: 0.14 }],
  restore: [{ from: 520, to: 380, dur: 0.11, type: 'triangle', gain: 0.12 }],
  recycle: 'noise',
  // Two quick rising blips: something arrived.
  notify: [
    { from: 988, dur: 0.1 },
    { from: 1319, at: 0.09, dur: 0.16 },
  ],
}

// ---------------------------------------------------------------- settings

const KEY = 'xp:sound'

interface Settings {
  /** 0-100. */
  volume: number
  muted: boolean
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { volume: 70, muted: false }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      volume:
        typeof parsed.volume === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.volume)))
          : 70,
      muted: parsed.muted === true,
    }
  } catch {
    return { volume: 70, muted: false }
  }
}

/** Replaced whole on every change, so `useSyncExternalStore` sees a new snapshot. */
let settings = load()
const listeners = new Set<() => void>()

function commit(next: Settings) {
  settings = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // The setting just won't survive a reload.
  }
  listeners.forEach((l) => l())
}

// ---------------------------------------------------------------- engine

let context: AudioContext | null = null
let master: GainNode | null = null

/**
 * Builds the audio graph on first use and keeps the master gain in step.
 *
 * Browsers won't let a page make noise until the user has interacted with it, and
 * hold new contexts in `suspended` until then — so this resumes on every play, which
 * is a no-op once it's running. That's also why there's no logon sound: it would be
 * blocked before anyone had clicked anything.
 */
function engine(): { ctx: AudioContext; out: GainNode } | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null

  if (!context || !master) {
    context = new Ctor()
    master = context.createGain()
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume()

  // Squared, because loudness isn't linear in the slider's position.
  master.gain.value = settings.muted ? 0 : (settings.volume / 100) ** 2
  return { ctx: context, out: master }
}

function playTones(ctx: AudioContext, out: GainNode, tones: Tone[]) {
  for (const tone of tones) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = ctx.currentTime + (tone.at ?? 0)

    osc.type = tone.type ?? 'sine'
    osc.frequency.setValueAtTime(tone.from, start)
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.dur)

    // A few milliseconds of attack and an exponential tail. Starting or stopping an
    // oscillator at full amplitude puts a click on both ends.
    const peak = tone.gain ?? 0.22
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur)

    osc.connect(gain)
    gain.connect(out)
    osc.start(start)
    osc.stop(start + tone.dur + 0.03)
  }
}

/** The crumple: white noise squeezed through a falling band-pass. */
function playNoise(ctx: AudioContext, out: GainNode) {
  const seconds = 0.34
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    // Fades out across the buffer so the tail doesn't need a second envelope.
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(2600, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + seconds)

  const gain = ctx.createGain()
  gain.gain.value = 0.18

  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start()
}

export const audio = {
  play(name: SoundName) {
    if (settings.muted || settings.volume === 0) return
    let parts: Tone[] | 'noise'
    try {
      const built = engine()
      if (!built) return
      parts = RECIPES[name]
      if (parts === 'noise') playNoise(built.ctx, built.out)
      else playTones(built.ctx, built.out, parts)
    } catch {
      // No audio device, a blocked context, or a browser without Web Audio: the
      // shell carries on silently rather than making a fuss about it.
    }
  },

  setVolume(volume: number) {
    const next = Math.max(0, Math.min(100, Math.round(volume)))
    if (next === settings.volume && !settings.muted) return
    // Moving the slider unmutes, which is what the tray always did.
    commit({ volume: next, muted: false })
  },

  setMuted(muted: boolean) {
    if (muted === settings.muted) return
    commit({ ...settings, muted })
  },
}

export function useAudioSettings(): Settings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
    () => settings,
  )
}
