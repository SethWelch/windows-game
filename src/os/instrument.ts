/**
 * The instrument: one struck-string voice, and the graph it sounds through.
 *
 * Lifted out of Media Player's sequencer so the piano can play the same thing. Two callers
 * with different needs, which is what shapes the interface: a sequencer knows how long every
 * note lasts and schedules it in advance, and a keyboard knows neither — it needs a note
 * that sounds until a finger comes off a key.
 *
 * No samples and no soundfont, because the project ships no binary assets. This is a struck
 * string built the way a subtractive synthesiser builds one, and the four things that stop
 * it sounding flat are all here:
 *
 * 1. **Twelve harmonics behind a closing filter.** A real string sounds a dozen partials and
 *    the high ones die first; that changing balance is most of what tells you a note was
 *    struck rather than switched on. A rich `PeriodicWave` under a lowpass whose cutoff falls
 *    gets it from two nodes instead of a dozen oscillators.
 * 2. **Velocity.** Louder *and* brighter, because a harder strike is both.
 * 3. **A room.** A convolver fed decaying stereo noise. Anything fully dry sounds dead.
 * 4. **A short tail.** A long release makes every note overlap the next, and that reads as
 *    bad timing rather than bad tone.
 *
 * Its output goes to the gain that `audioBus()` hands out, so the tray's volume and mute
 * cover it without either caller having to know they exist.
 */

/** How long a note keeps sounding after its written end. Short, on purpose — see (4). */
const RELEASE = 0.09

/** How long a lifted key takes to die away. Longer than RELEASE: a damper is not instant. */
const DAMPER = 0.22

/** Attack, in seconds. Long enough not to click, short enough to sound struck. */
const ATTACK = 0.005

/** Harmonics in the raw waveform, before the filter takes the top off. */
const PARTIALS = 12

/** Seconds of artificial hall, and how much of the signal goes through it. */
const REVERB_SECONDS = 1.9
const REVERB_MIX = 0.26

/** The lowest and highest notes anything here will ask for — A0 to C8, a full piano. */
export const LOWEST = 21
export const HIGHEST = 108

export const frequencyOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** A note that is still sounding because nothing has let go of it yet. */
export interface HeldVoice {
  release(): void
}

export interface Instrument {
  /** A note of known length, at an exact audio-clock time. What a sequencer wants. */
  strike(midi: number, velocity: number, when: number, dur: number): void
  /** A note that sounds until released. What a keyboard wants. */
  press(midi: number, velocity: number): HeldVoice
  /** Silence everything immediately. */
  panic(): void
  /** 0-1, this instrument's own level ahead of the shell mixer. */
  setGain(gain: number): void
  dispose(): void
}

/**
 * Twelve harmonics falling away at roughly 1/n^1.3, with the even ones pulled down. That
 * last part is what stops it sounding like a sawtooth: a real string is stiffer at its ends
 * than an ideal one, and its even partials come out weaker.
 */
function stringWave(ctx: AudioContext): PeriodicWave {
  const real = new Float32Array(PARTIALS + 1)
  const imag = new Float32Array(PARTIALS + 1)
  for (let n = 1; n <= PARTIALS; n++) {
    imag[n] = (1 / n ** 1.3) * (n % 2 === 0 ? 0.55 : 1)
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false })
}

/**
 * A hall, as a burst of noise that decays. Independent noise per channel so it opens out in
 * stereo, and a short swell before the tail builds, which is what makes it read as a room
 * rather than as a wash.
 */
function hall(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * REVERB_SECONDS)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      const t = i / length
      data[i] = (Math.random() * 2 - 1) * Math.min(1, t * 24) * (1 - t) ** 2.6
    }
  }
  return buffer
}

export function createInstrument(ctx: AudioContext, out: GainNode): Instrument {
  const level = ctx.createGain()
  level.gain.value = 0.7
  level.connect(out)

  const dry = ctx.createGain()
  dry.gain.value = 1 - REVERB_MIX
  dry.connect(level)

  const wet = ctx.createGain()
  wet.gain.value = REVERB_MIX
  wet.connect(level)

  let reverb: ConvolverNode | null = null
  try {
    reverb = ctx.createConvolver()
    reverb.buffer = hall(ctx)
    reverb.connect(wet)
  } catch {
    // No convolver, or a context that refused the buffer. Dry is worse, not broken.
    reverb = null
    dry.gain.value = 1
  }

  const wave = stringWave(ctx)

  /**
   * Everything sounding hangs off here rather than off the mix directly, so `panic` is one
   * ramp instead of chasing individual oscillators. Notes already scheduled into the future
   * still start, but into a node connected to nothing, and they stop themselves.
   */
  let bus = ctx.createGain()
  const connectBus = (node: GainNode) => {
    node.connect(dry)
    if (reverb) node.connect(reverb)
  }
  connectBus(bus)

  /** How long the note would ring if nothing stopped it — heavy bass strings ring longest. */
  const ringOf = (midi: number) => {
    const height = Math.min(1, Math.max(0, (midi - LOWEST) / (HIGHEST - LOWEST)))
    return 7.5 - height * 6.2
  }

  /**
   * Builds one voice and starts it. `hold` is how long the envelope is written for; a held
   * note passes its full ring and has the tail rewritten when it is released.
   */
  function build(midi: number, velocity: number, when: number, hold: number) {
    const hz = frequencyOf(midi)
    const ring = ringOf(midi)

    const env = ctx.createGain()
    const peak = 0.26 * (0.3 + velocity * 0.7)
    env.gain.setValueAtTime(0.0001, when)
    env.gain.linearRampToValueAtTime(peak, when + ATTACK)
    // One exponential from the peak on the string's own time constant, cut short when the
    // note ends. A piano loses most of its energy in the first half-second and then hangs on
    // quietly; a single ramp to silence over the note's length sounds like an organ.
    env.gain.exponentialRampToValueAtTime(peak * 0.22, when + Math.min(ring, 0.55))
    env.gain.exponentialRampToValueAtTime(0.0001, when + hold)
    env.connect(bus)

    /**
     * The filter is what makes it a struck string rather than a held tone: bright on the
     * attack, closing as the note decays, so the harmonics arrive together and thin out from
     * the top down. Harder strikes open it further, which is the "brighter" half of velocity.
     */
    const timbre = ctx.createBiquadFilter()
    timbre.type = 'lowpass'
    timbre.Q.value = 0.7
    const open = Math.min(ctx.sampleRate / 2.2, hz * (7 + velocity * 5))
    timbre.frequency.setValueAtTime(open, when)
    timbre.frequency.exponentialRampToValueAtTime(
      Math.min(open, hz * 2.4),
      when + Math.min(ring, 0.7),
    )

    const osc = ctx.createOscillator()
    osc.setPeriodicWave(wave)
    osc.frequency.value = hz
    // Real strings are stretched slightly sharp towards the top. A couple of cents is
    // inaudible as pitch and audible as an instrument rather than a signal generator.
    const height = Math.min(1, Math.max(0, (midi - LOWEST) / (HIGHEST - LOWEST)))
    osc.detune.value = (height - 0.5) * 6

    osc.connect(timbre)
    timbre.connect(env)
    osc.start(when)
    osc.stop(when + hold + 0.05)
    return { env, osc }
  }

  return {
    strike(midi, velocity, when, dur) {
      build(midi, velocity, when, Math.min(dur + RELEASE, ringOf(midi)))
    },

    press(midi, velocity) {
      const when = ctx.currentTime
      const ring = ringOf(midi)
      const { env, osc } = build(midi, velocity, when, ring)
      let released = false
      return {
        release() {
          if (released) return
          released = true
          const at = ctx.currentTime
          /*
           * The envelope is already written out to the note's full ring, so releasing means
           * replacing the rest of it — and to do that without a click you have to hold
           * whatever value it has reached right now.
           *
           * `cancelAndHoldAtTime` does exactly that and is the right tool, but it is not in
           * every engine. Where it is missing, `.value` is the next best reading of where the
           * envelope has got to; it can be a fraction stale, which is inaudible over a 220ms
           * fade but would be a click if we ramped from `peak` instead.
           */
          const hold = env.gain as AudioParam & {
            cancelAndHoldAtTime?: (t: number) => void
          }
          if (typeof hold.cancelAndHoldAtTime === 'function') {
            hold.cancelAndHoldAtTime(at)
          } else {
            const now = env.gain.value
            env.gain.cancelScheduledValues(at)
            env.gain.setValueAtTime(Math.max(0.0001, now), at)
          }
          env.gain.exponentialRampToValueAtTime(0.0001, at + DAMPER)
          osc.stop(at + DAMPER + 0.05)
        },
      }
    },

    panic() {
      const dying = bus
      dying.gain.setValueAtTime(dying.gain.value, ctx.currentTime)
      dying.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05)
      window.setTimeout(() => dying.disconnect(), 400)
      bus = ctx.createGain()
      connectBus(bus)
    },

    setGain(gain) {
      level.gain.value = Math.max(0, Math.min(1, gain))
    },

    dispose() {
      bus.disconnect()
      level.disconnect()
      dry.disconnect()
      wet.disconnect()
      reverb?.disconnect()
    },
  }
}
