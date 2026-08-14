/**
 * Bongo. A purple ape, drawn rather than rendered.
 *
 * The originals were pre-rendered 3D sprite sheets played back by Microsoft Agent —
 * dozens of frames per animation, shipped as a `.acs` file. This is vector, so the parts
 * are separate groups and the motion is CSS on those groups: the arms swing from their
 * shoulders, the eyelids drop over the eyes, the body bobs.
 *
 * What makes the silhouette read as an ape rather than a teddy bear, in rough order of
 * how much each one matters:
 *
 * - **The arms are out.** Held wide and low with the palms open and forward, which is
 *   the pose these things stood in the whole time they were on your desktop.
 * - **The pale is only the muzzle.** A low oval around the nose and mouth. The eyes sit
 *   on the *fur* above it, not on a mask — a pale panel big enough to hold the eyes
 *   turns him into a lemur.
 * - **The crown is the same purple as the rest of him**, drawn as one path with the
 *   skull so the sagittal crest is part of the head. Anything lighter up there reads as
 *   a hat, and a soft edge doesn't help: it just reads as a hat with a soft edge.
 * - **Chest and belly are one pale front**, from below the chin to the hips, with a
 *   navel. Two shapes read as a bib over a beach ball.
 * - **Pale hands and feet**, and ears tucked against the head instead of sticking out.
 * - **Shoulders wider than hips**, and no neck at all.
 *
 * The limbs are round-capped strokes rather than filled paths. A stroke from shoulder to
 * elbow to wrist reads as an arm immediately and is trivial to re-aim; the tapered paths
 * that came first hugged the torso and the pair of them read as a cape. Every joint here
 * is also a `transform-origin` in Buddy.css — move one and the other has to follow, or
 * the limb pivots from thin air.
 *
 * A 120x110 viewBox with his feet on the bottom edge, so the layer positions him by his
 * feet and the balloon floats over his head.
 */
export function BongoArt({ mood }: { mood: 'idle' | 'walk' | 'talk' | 'reach' }) {
  return (
    <svg className="bongo" viewBox="0 0 120 110" data-mood={mood} aria-hidden>
      <defs>
        {/* `userSpaceOnUse`, not the default: object-bounding-box gradients restart on
            every shape, so the head, torso, arms and legs would each be lit from their
            own top-left and the figure would never read as one mass. In user space they
            share a single light, up and to the left. */}
        <radialGradient id="bongo-fur" gradientUnits="userSpaceOnUse" cx="40" cy="18" r="104">
          <stop offset="0%" stopColor="#ae87dc" />
          <stop offset="46%" stopColor="#8f5fc6" />
          <stop offset="100%" stopColor="#5c3190" />
        </radialGradient>
        <radialGradient id="bongo-skin" gradientUnits="userSpaceOnUse" cx="48" cy="34" r="86">
          <stop offset="0%" stopColor="#efe0f6" />
          <stop offset="55%" stopColor="#ddc7e8" />
          <stop offset="100%" stopColor="#c3a8d2" />
        </radialGradient>
      </defs>

      <ellipse className="bongo-shadow" cx="60" cy="105" rx="28" ry="4.5" />

      <g className="bongo-body">
        {/* ---- Arms: shoulder out, elbow, forearm down, so the limb clears the body ---- */}
        <g className="bongo-arm bongo-arm--left">
          <path
            d="M44 45 27 50 22 62"
            fill="none"
            stroke="url(#bongo-fur)"
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="bongo-hand">
            {/* A mitten: palm plus three fingertips. Actual fingers are illegible at
                fourteen pixels across. */}
            <circle cx="15" cy="64" r="3.2" fill="#d9c3e5" />
            <circle cx="20" cy="61" r="3.2" fill="#e0cdea" />
            <circle cx="26" cy="62" r="3" fill="#e0cdea" />
            <ellipse cx="20" cy="68" rx="7.6" ry="6.6" fill="url(#bongo-skin)" />
          </g>
        </g>

        <g className="bongo-arm bongo-arm--right">
          <path
            d="M76 45 93 50 98 62"
            fill="none"
            stroke="url(#bongo-fur)"
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="bongo-hand">
            <circle cx="105" cy="64" r="3.2" fill="#cdb2dd" />
            <circle cx="100" cy="61" r="3.2" fill="#d5bce2" />
            <circle cx="94" cy="62" r="3" fill="#d5bce2" />
            <ellipse cx="100" cy="68" rx="7.6" ry="6.6" fill="url(#bongo-skin)" />
          </g>
        </g>

        {/* ---- Legs ---- */}
        <g className="bongo-legs">
          <g className="bongo-leg bongo-leg--back">
            <path
              d="M51 82v14"
              fill="none"
              stroke="url(#bongo-fur)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <ellipse cx="50" cy="100" rx="8.5" ry="4.4" fill="url(#bongo-skin)" />
          </g>
          <g className="bongo-leg bongo-leg--front">
            <path
              d="M69 82v14"
              fill="none"
              stroke="url(#bongo-fur)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <ellipse cx="70" cy="100" rx="8.5" ry="4.4" fill="url(#bongo-skin)" />
          </g>
        </g>

        {/* ---- Torso ---- */}
        <path
          d="M60 42c15 0 26 6 27 16 1 9-1 17-4 23-3 5-11 8-23 8s-20-3-23-8c-3-6-5-14-4-23 1-10 12-16 27-16z"
          fill="url(#bongo-fur)"
        />
        {/* Chest and belly are one pale front, narrow at the top and heavy at the
            bottom, running from under the chin to the hips. Two separate shapes read as
            a bib over a beach ball. */}
        <path
          d="M60 51c7 0 11 2 13 6 2 4 2 7 2 12 0 8-6 14-15 14s-15-6-15-14c0-5 0-8 2-12 2-4 6-6 13-6z"
          fill="url(#bongo-skin)"
        />
        <path
          d="M60 76c-1.8 0-2.7-1.2-2.7-2.6"
          fill="none"
          stroke="#b195c1"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* ---- Head ---- */}
        <g className="bongo-head">
          <ellipse cx="37" cy="28" rx="5.4" ry="6.8" fill="url(#bongo-fur)" />
          <ellipse cx="83" cy="28" rx="5.4" ry="6.8" fill="url(#bongo-fur)" />
          <ellipse cx="37.4" cy="28" rx="2.3" ry="3.4" fill="#5c3190" />
          <ellipse cx="82.6" cy="28" rx="2.3" ry="3.4" fill="#5c3190" />

          {/* One path, so the crest is part of the skull rather than a cap sitting on
              it. The peak is the sagittal crest every gorilla has and the real one wore
              as a soft point. */}
          <path
            d="M60 4c3 0 5 2 8 3 9 3 15 11 15 21 0 12-10 20-23 20S37 40 37 28c0-10 6-18 15-21 3-1 5-3 8-3z"
            fill="url(#bongo-fur)"
          />

          {/* The muzzle: pale, low, and only around the nose and mouth. The eyes sit on
              the fur above it. */}
          <ellipse cx="60" cy="39" rx="14" ry="9.5" fill="url(#bongo-skin)" />

          <path
            d="M60 31.5c2.6 0 4.4 1.6 4.4 3.3s-1.8 2.5-4.4 2.5-4.4-.8-4.4-2.5 1.8-3.3 4.4-3.3z"
            fill="#8f5fc6"
          />
          <ellipse cx="58.2" cy="34.6" rx="0.9" ry="1.2" fill="#4a2575" />
          <ellipse cx="61.8" cy="34.6" rx="0.9" ry="1.2" fill="#4a2575" />

          <path
            className="bongo-mouth"
            d="M52 41c4 6.5 12 6.5 16 0"
            fill="none"
            stroke="#6b4a7d"
            strokeWidth="2.1"
            strokeLinecap="round"
          />

          {/* Eyes: large, close together, on the purple above the muzzle. The whites and
              the catchlights are classed so Buddy.css can black them out while he is up
              to something — a blanket fill on the group would take the eyelids with it. */}
          <g className="bongo-eyes">
            <ellipse className="bongo-white" cx="53.5" cy="22.5" rx="6" ry="6.9" fill="#fff" />
            <ellipse className="bongo-white" cx="66.5" cy="22.5" rx="6" ry="6.9" fill="#fff" />
            <g className="bongo-pupils">
              <circle cx="54" cy="23.3" r="2.9" fill="#17110d" />
              <circle cx="66" cy="23.3" r="2.9" fill="#17110d" />
              <circle className="bongo-glint" cx="55" cy="21.8" r="1" fill="#fff" />
              <circle className="bongo-glint" cx="67" cy="21.8" r="1" fill="#fff" />
            </g>
            {/* Lids in the fur colour now, since fur is what surrounds the eyes. */}
            <g className="bongo-lids">
              <ellipse cx="53.5" cy="22.5" rx="6.4" ry="7.3" fill="url(#bongo-fur)" />
              <ellipse cx="66.5" cy="22.5" rx="6.4" ry="7.3" fill="url(#bongo-fur)" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
