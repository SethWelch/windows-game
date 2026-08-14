/**
 * Ambience — the smoky visualization family, and the only thing in this project that
 * genuinely cannot be done in CSS.
 *
 * The smoke is *frame feedback*, which is how the real ones worked: every frame draws the
 * previous frame back — slightly enlarged, slightly rotated and slightly faded — and only
 * then draws the new waveform on top. A stroke therefore leaves a copy of itself that
 * creeps outward and dims over about a second, and the sum of a second's worth of copies
 * is the cloud. Nothing about that is expressible as a CSS animation: it needs last
 * frame's pixels as an input, and CSS cannot read what it drew.
 *
 * The rotation is the part that is easy to leave out and shouldn't be. Scaling alone
 * smears every stroke straight away from the centre, which reads as a zoom blur — a
 * starburst of straight radial streaks. Adding a little rotation curls the trails into
 * the billowy wisps the real thing had. Too much and it collapses into a vortex and you
 * stop being able to read the waveform at all.
 *
 * Three consequences worth knowing before changing anything here:
 *
 * - The softness is not a blur. Each generation is resampled by a fraction of a pixel as
 *   it is scaled up, so bilinear filtering smears it a little more every frame and the
 *   trail goes soft on its own. This is the one canvas in the project that wants
 *   `imageSmoothingEnabled = true`, and turning it off makes the whole effect crunchy.
 * - Every rate below is per *second* and raised to the power of `dt`, not a per-frame
 *   constant. Feedback compounds, so a per-frame decay would make the trail twice as
 *   short on a 120Hz display as on a 60Hz one.
 * - Squiggle is ink. Arc length is what sets the exposure, so a preset that draws five
 *   long lines saturates where one short loop barely registers — which is what `gain` on
 *   each preset below exists to even out.
 *
 * The presets cycle. Each holds for `HOLD_MS`, then crossfades into the next over
 * `FADE_MS` by drawing both of them at complementary alpha into the *same* feedback
 * buffer — so the outgoing shape is still smouldering in the smoke while the incoming one
 * is drawn over it, which is a genuine dissolve rather than two images mixed. Doing it
 * that way is also why there is one buffer and not two.
 */

/**
 * Internal width cap. These ran at a few hundred pixels across and were upscaled, so a
 * crisp 1:1 Ambience would be less faithful, not more — and the feedback blit is two
 * full-canvas draws per frame, which is the one cost worth keeping small.
 */
export const RENDER_W = 480

/** What fraction of the trail's brightness survives one second. */
const DECAY_PER_SEC = 0.1

/**
 * How much the trail grows per second, for the presets that explode outward. This is what
 * turns a stroke into smoke — but how *much* of it a preset wants is character rather than
 * a global: run the banded preset at this rate and its level bands get dragged into
 * diagonal streaks radiating from the middle, which is the opposite of what it is for.
 */
const ZOOM_PER_SEC = 1.2

/** How fast the axes turn, in radians per second — a full turn per minute. */
const TURN = 0.11

/** How long a preset holds before it starts handing over, and how long that takes. */
const HOLD_MS = 24_000
const FADE_MS = 6_000

/**
 * Samples along each stroked line, and it has to be this many.
 *
 * The top harmonic below is ~87 cycles across the line; Nyquist alone wants 174 points
 * and a curve only *looks* like a curve at around eight points per cycle. At 200 — what
 * this was — the fine detail aliased into a coarse zigzag before it was ever drawn, which
 * is exactly the "not squiggly enough" symptom. Raising the harmonics without raising this
 * does nothing at all.
 */
const SAMPLES = 760

/**
 * Bloom, as three strokes of the same path rather than a shadow or a filter.
 * `shadowBlur` is slow enough to show up in a profile, and `ctx.filter` isn't
 * dependable across browsers; additive strokes cost almost nothing and, once the
 * feedback has softened them, are indistinguishable.
 *
 * These alphas are tied to `wave`: squiggle is arc length, and arc length is ink. Make
 * the waveform busier and these have to come down with it, or the pane saturates to
 * white. Scale all three together — the ratio between them is the shape of the bloom.
 */
const PASSES = [
  { width: 14, alpha: 0.014 },
  { width: 6, alpha: 0.031 },
  { width: 1.8, alpha: 0.14 },
]

/**
 * A stand-in for an audio waveform: five octaves of sine drifting against each other at
 * unrelated speeds, so it never visibly repeats. There is no PCM to analyse here — the
 * library is invented and the audio is synthesised — so like the CSS bars, this is
 * arithmetic that merely has to be plausible.
 *
 * The top two terms are what make it read as a waveform rather than as a ribbon. The last
 * one runs at roughly a five-pixel period with an amplitude several times that, so
 * successive peaks overlap and the filament looks braided — lines on lines. Anything
 * higher than this is finer than the upscale can show and only adds haze.
 *
 * Amplitudes fall off with frequency because that is what real audio does, and because
 * equal weights make a curve that reads as noise instead of as a signal.
 */
const wave = (u: number, t: number) =>
  Math.sin(u * 23 + t * 1.7) * 0.32 +
  Math.sin(u * 57 - t * 2.3) * 0.24 +
  Math.sin(u * 131 + t * 3.1) * 0.17 +
  Math.sin(u * 277 - t * 4.7) * 0.13 +
  Math.sin(u * 547 + t * 5.9) * 0.09

/**
 * The same waveform, made periodic in `u` so it can go round a closed loop.
 *
 * `wave(0)` and `wave(1)` are unrelated numbers, so a ring sampled straight from it has a
 * step in it at the seam — which the feedback then smears into a permanent scar pointing
 * out of the middle. Blending the curve into a copy of itself shifted one period back
 * agrees with itself at both ends by construction.
 */
const loopWave = (u: number, t: number) =>
  wave(u, t) * (1 - u) + wave(u - 1, t) * u

/** What a preset gets told about the pane it is drawing into. */
interface Field {
  w: number
  h: number
  /** Centre of the feedback expansion, which wanders slightly. */
  cx: number
  cy: number
  /** Perpendicular swing available to a line, in pixels. */
  amp: number
  /** Half the diagonal — how far a line has to run to cross the pane at any angle. */
  reach: number
  /** The slowly turning axis, in radians. */
  angle: number
}

interface Preset {
  /**
   * What the caption calls it. "X Marks the Spot" and "Water" are the two the reference
   * screenshots actually name; "Ripple" is a plausible member of the Ambience family but
   * not one I can confirm was what that look was called, so treat it as ours.
   */
  name: string
  /** Hue over time. Drifts, so a preset is never quite one colour. */
  hue: (t: number) => number
  /** Feedback rotation for this preset, in radians per second. */
  swirl: number
  /** Feedback expansion, per second. Low values smear in place instead of exploding. */
  zoom: number
  /**
   * Ink compensation. A preset that lays down more arc length per unit area needs less
   * alpha to reach the same brightness — see the note on PASSES.
   */
  gain: number
  /**
   * Adds this preset's lines to the current path. Deliberately does not call `beginPath`
   * or `stroke`: the caller builds one path and strokes it once per bloom pass, so the
   * three passes cannot disagree about what they are drawing.
   */
  trace: (ctx: CanvasRenderingContext2D, f: Field, t: number) => void
}

/**
 * Two waveforms crossed at right angles, turning slowly. The bright knot where they meet
 * is the spot the name refers to, and it is not drawn — it is where the additive strokes
 * overlap and climb to white on their own.
 */
const xMarksTheSpot: Preset = {
  name: 'X Marks the Spot',
  hue: (t) => 196 + Math.sin(t * 0.13) * 14,
  swirl: 0.3,
  zoom: ZOOM_PER_SEC,
  gain: 1,
  trace: (ctx, f, t) => {
    // The phase offset keeps the two arms from being one curve reflected.
    for (const [arm, phase] of [
      [0, 0],
      [Math.PI / 2, 11.3],
    ]) {
      const ax = Math.cos(f.angle + arm)
      const ay = Math.sin(f.angle + arm)
      for (let i = 0; i <= SAMPLES; i++) {
        const u = i / SAMPLES
        // Along the axis, -1 at one end to 1 at the other.
        const s = (u - 0.5) * 2
        // Tapered to nothing at both ends, so the line fades out instead of stopping
        // dead at the edge of the pane.
        const env = Math.cos(s * Math.PI * 0.5) ** 1.4
        const v = wave(u, t + phase) * env * f.amp
        // Perpendicular to the axis is (-ay, ax).
        const x = f.cx + ax * s * f.reach - ay * v
        const y = f.cy + ay * s * f.reach + ax * v
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }
  },
}

/** How big the ring is, against the shorter side of the pane. */
const RING = 0.19

/**
 * The waveform bent into a closed ring instead of laid along a line.
 *
 * Green, and the only preset whose shape is compact: the spikes you see radiating out of
 * it are not drawn either, they are the ring's own bright points being dragged outward by
 * the feedback. Which is why the ring is small — it needs room around it to smear into.
 */
const water: Preset = {
  name: 'Water',
  hue: (t) => 148 + Math.sin(t * 0.11) * 16,
  // Less than the others: a ring is already radially symmetric, so rotation mostly just
  // blurs it rather than curling anything.
  swirl: 0.16,
  zoom: ZOOM_PER_SEC,
  // One short loop rather than two long lines, so it needs the help.
  gain: 1.5,
  trace: (ctx, f, t) => {
    const base = Math.min(f.w, f.h) * RING
    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES
      const th = u * Math.PI * 2 + f.angle
      const r = base * (1 + loopWave(u, t) * 0.55)
      const x = f.cx + Math.cos(th) * r
      const y = f.cy + Math.sin(th) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  },
}

/** How many bands stack up the pane. */
const BANDS = 5

/**
 * Horizontal bands, stacked and drifting — the one that looks like weather rather than
 * like a signal.
 *
 * Barely any swirl, because the bands being level is the whole character of it; give this
 * one the others' rotation and it turns into a pinwheel. Each band is offset in both `u`
 * and `t` so they are five different waveforms rather than one copied five times.
 */
const bands: Preset = {
  name: 'Ripple',
  hue: (t) => 205 + Math.sin(t * 0.09) * 12,
  swirl: 0.04,
  // A tenth of what the others use. The bands are supposed to sit there and glow, and
  // anything above about 0.2 starts pulling them into a radial burst.
  zoom: 0.12,
  // Five long lines is much more ink than the others lay down, but drawing them into a
  // trail that barely spreads concentrates it again, so the two mostly cancel. This is
  // the ratio the presets measured at against each other rather than a guess from arc
  // length alone, which had it far too dark.
  gain: 0.8,
  trace: (ctx, f, t) => {
    const swing = (f.h / BANDS) * 0.55
    for (let k = 0; k < BANDS; k++) {
      const y0 = (f.h * (k + 0.5)) / BANDS
      for (let i = 0; i <= SAMPLES; i++) {
        const u = i / SAMPLES
        // Run past both edges: the feedback expands the picture, and a band that stopped
        // at the edge would show its end creeping inward.
        const x = (u * 1.2 - 0.1) * f.w
        const y = y0 + wave(u + k * 0.37, t + k * 2.1) * swing
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }
  },
}

/** The rotation, in order. */
const PRESETS: Preset[] = [xMarksTheSpot, water, bands]

const lerp = (a: number, b: number, x: number) => a + (b - a) * x

export function createAmbience(
  w: number,
  h: number,
  /** Called when the preset being shown changes, so the caption can name it. */
  onPreset: (name: string) => void,
  /**
   * Where in the cycle to resume. A resize rebuilds the painter, and without this that
   * would jump the rotation back to the first preset and change colour on you.
   */
  startAtMs = 0,
) {
  /**
   * Last frame, kept off-screen. A canvas cannot reliably be scaled onto itself — the
   * source would be read while it is being written — so the frame is snapshotted here
   * and drawn back from here.
   */
  const prev = document.createElement('canvas')
  prev.width = w
  prev.height = h
  const prevCtx = prev.getContext('2d')

  const amp = Math.min(w, h) * 0.34
  const reach = Math.hypot(w, h) * 0.5
  const period = HOLD_MS + FADE_MS

  let elapsed = startAtMs
  let named = ''

  const paint = (ctx: CanvasRenderingContext2D, dtMs: number) => {
    elapsed += dtMs
    const dt = dtMs / 1000
    const t = elapsed / 1000
    const angle = t * TURN

    // Where the cycle is: which preset, which one it is handing over to, and how far
    // through the handover. `mix` is 0 for the whole hold, so most of the time the second
    // preset costs nothing.
    const phase = elapsed % period
    const index = Math.floor(elapsed / period) % PRESETS.length
    const from = PRESETS[index]
    const to = PRESETS[(index + 1) % PRESETS.length]
    const mix = phase <= HOLD_MS ? 0 : (phase - HOLD_MS) / FADE_MS

    // The caption follows whichever one is more of what you're looking at.
    const name = mix < 0.5 ? from.name : to.name
    if (name !== named) {
      named = name
      onPreset(name)
    }

    const decay = DECAY_PER_SEC ** dt
    const zoom = 1 + lerp(from.zoom, to.zoom, mix) * dt

    // The centre of expansion wanders, so the cloud never settles into something
    // symmetrical about the middle of the pane.
    const cx = w * (0.5 + Math.sin(t * 0.23) * 0.06)
    const cy = h * (0.5 + Math.cos(t * 0.19) * 0.06)
    const field: Field = { w, h, cx, cy, amp, reach, angle }

    // Cleared rather than filled: where the trail has decayed to nothing the canvas goes
    // transparent and the pane's own dark blue gradient shows through, which is what
    // gives the corners their colour.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = decay
    ctx.imageSmoothingEnabled = true
    // Scale and rotate together, about (cx, cy). Written out as a matrix rather than as
    // translate/rotate/scale calls because the fixed point has to be exact: drift of a
    // fraction of a pixel per frame compounds through the feedback into a visible slide.
    const spin = lerp(from.swirl, to.swirl, mix) * dt
    const m = zoom * Math.cos(spin)
    const n = zoom * Math.sin(spin)
    ctx.setTransform(m, n, -n, m, cx - (m * cx - n * cy), cy - (n * cx + m * cy))
    ctx.drawImage(prev, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Additive, so where lines overlap and where the trail folds over itself the colour
    // climbs to white — the hot core comes out of this for free rather than being drawn.
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // Hue is interpolated rather than switched, so blue slides through cyan into green
    // instead of cutting. The two presets either side of a handover are always close
    // enough round the wheel for the short way to be the pretty way.
    const hue = lerp(from.hue(t), to.hue(t), mix)
    const stroke = `hsl(${hue} 100% 62%)`

    // Both presets, at complementary weight, into the one buffer. During a hold `mix` is
    // 0 and the `to` half is skipped entirely.
    for (const [preset, weight] of [
      [from, 1 - mix],
      [to, mix],
    ] as [Preset, number][]) {
      if (weight <= 0) continue
      ctx.beginPath()
      preset.trace(ctx, field, t)
      for (const pass of PASSES) {
        ctx.globalAlpha = pass.alpha * preset.gain * weight
        ctx.lineWidth = pass.width
        ctx.strokeStyle = stroke
        ctx.stroke()
      }
    }

    // Snapshot for the next frame. `copy` rather than the default, or the buffer would
    // accumulate every frame ever drawn and saturate to white within a second.
    if (prevCtx) {
      prevCtx.globalCompositeOperation = 'copy'
      prevCtx.drawImage(ctx.canvas, 0, 0)
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  /** How far through the cycle we are, so a rebuild can pick up where this left off. */
  paint.elapsed = () => elapsed

  return paint
}
