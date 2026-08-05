export type Visualization = 'bars' | 'waves' | 'art'

/**
 * The visualizations — the single most recognisable thing about this window.
 *
 * All of it animates in CSS rather than from a JS loop. There is no audio to
 * analyse, so nothing has to be computed per frame, and the bars can bounce at
 * sixty frames a second without the player re-rendering once. `data-playing` on the
 * wrapper is what starts and stops them.
 */

const BAR_COUNT = 32

/**
 * A deterministic spread of heights and speeds. Anything random would be reshuffled
 * on every render; this varies per bar and then stays put.
 */
function barStyle(i: number) {
  const wobble = Math.sin(i * 1.7) * 0.5 + 0.5
  const swell = Math.sin(i * 0.42) * 0.5 + 0.5
  return {
    // Tall in the middle of the spectrum, shorter at the edges, like the real one.
    '--peak': `${28 + swell * 62}%`,
    animationDuration: `${520 + wobble * 620}ms`,
    animationDelay: `${-wobble * 700}ms`,
  } as React.CSSProperties
}

export function Visualizer({
  kind,
  playing,
  track,
}: {
  kind: Visualization
  playing: boolean
  /** Named by the Album Art view, which has no artwork to show. */
  track: { title: string; album: string } | null
}) {
  if (kind === 'art') {
    return (
      <div className="wmp-vis wmp-vis--art">
        <div className="wmp-art">
          <span className="wmp-art-disc" />
          <span className="wmp-art-caption">
            {track ? track.album : 'No album art'}
          </span>
        </div>
      </div>
    )
  }

  if (kind === 'waves') {
    return (
      <div className="wmp-vis" data-playing={playing}>
        <svg
          className="wmp-waves"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Two sine paths twice the viewBox wide, slid leftward on a loop — the
              seam lands off-screen, so it reads as one endless wave. */}
          <path
            className="wmp-wave wmp-wave--back"
            d="M0 50q25-34 50 0t50 0 50 0 50 0 50 0 50 0V100H0z"
          />
          <path
            className="wmp-wave wmp-wave--front"
            d="M0 56q25 30 50 0t50 0 50 0 50 0 50 0 50 0V100H0z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="wmp-vis" data-playing={playing}>
      <div className="wmp-bars">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <span key={i} className="wmp-bar" style={barStyle(i)} />
        ))}
      </div>
    </div>
  )
}
