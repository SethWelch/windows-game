import type { AdBody, Glyph, Word } from '@/os/popups.ts'
import { AdArt } from './adArt.tsx'
import type { ArtName } from './adArt.tsx'
import { popups } from '@/os/popups.ts'

/**
 * One renderer per kind of advertisement. Twenty of them, because the whole texture
 * of a screen full of these came from no two agreeing on a layout.
 *
 * Anything clickable inside an ad spawns another ad. That was always the deal, and
 * unlike the X it's something you opted into.
 */
const more = () => popups.spawn()

export function WordRun({ word }: { word: Word }) {
  return (
    <span
      className="ad-word"
      data-big={word.big}
      style={{
        color: word.color,
        background: word.bg,
        fontStyle: word.italic ? 'italic' : undefined,
      }}
    >
      {word.text}
    </span>
  )
}

/** The system glyphs, which is what made a fake dialog convincing. */
export function GlyphArt({ kind }: { kind: Glyph }) {
  if (kind === 'warn') {
    return (
      <svg className="ad-glyph" viewBox="0 0 32 32" aria-hidden>
        <path d="M16 3l14 25H2z" fill="#ffcf3a" stroke="#8a6a00" />
        <rect x="14.8" y="11" width="2.4" height="9" fill="#3a2b00" />
        <rect x="14.8" y="22" width="2.4" height="2.4" fill="#3a2b00" />
      </svg>
    )
  }
  if (kind === 'error') {
    return (
      <svg className="ad-glyph" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="13" fill="#d61f1f" stroke="#7d0d0d" />
        <path
          d="M10 10l12 12M22 10L10 22"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (kind === 'shield') {
    return (
      <svg className="ad-glyph" viewBox="0 0 32 32" aria-hidden>
        <path d="M16 2l12 4v10c0 8-6 12-12 14C10 28 4 24 4 16V6z" fill="#2fa03f" stroke="#0d5a1a" />
        <path d="M10 16l4.5 4.5L23 12" fill="none" stroke="#fff" strokeWidth="3" />
      </svg>
    )
  }
  return (
    <svg className="ad-glyph" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="#2f6fd0" stroke="#123f7f" />
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="bold"
        fill="#fff"
      >
        {kind === 'question' ? '?' : 'i'}
      </text>
    </svg>
  )
}

export function AdContent({ body, art }: { body: AdBody; art?: ArtName }) {
  switch (body.kind) {
    case 'dialog':
      return (
        <div className="ad-dialog">
          <div className="ad-dialog-top">
            <GlyphArt kind={body.glyph} />
            <div className="ad-dialog-text">
              {body.lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
          <div className="ad-row-center">
            {body.buttons.map((label, i) => (
              <button
                key={`${label}-${i}`}
                type="button"
                className="ad-sysbutton"
                onClick={more}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )

    case 'pitch':
      return (
        <div className="ad-pitch" data-art={art ? '' : undefined}>
          {art && (
            <span className="ad-pitch-art">
              <AdArt name={art} />
            </span>
          )}
          <p className="ad-headline">{body.headline}</p>
          <p className="ad-text">{body.body}</p>
          <button type="button" className="ad-cta" onClick={more}>
            {body.cta}
          </button>
        </div>
      )

    case 'words':
      return (
        <div className="ad-words" style={{ background: body.background }}>
          {body.words.map((word, i) => (
            <WordRun key={i} word={word} />
          ))}
        </div>
      )

    case 'tiles':
      return (
        <div className="ad-tiles">
          <p className="ad-tiles-lead">
            {body.lead.map((word, i) => (
              <WordRun key={i} word={word} />
            ))}
          </p>
          <div className="ad-tiles-row">
            {body.tiles.map((tile) => (
              <button key={tile.caption} type="button" className="ad-tile" onClick={more}>
                {/* Where the picture would have been, if it had ever arrived. */}
                <span
                  className="ad-tile-art"
                  style={{ filter: `hue-rotate(${tile.hue}deg)` }}
                />
                <span className="ad-tile-caption">{tile.caption}</span>
              </button>
            ))}
          </div>
        </div>
      )

    case 'serif':
      return (
        <div className="ad-serif">
          <p className="ad-serif-headline">{body.headline}</p>
          {art && (
            <span className="ad-serif-art">
              <AdArt name={art} />
            </span>
          )}
          <p className="ad-serif-body">{body.body}</p>
          <button type="button" className="ad-serif-link" onClick={more}>
            {body.link}
          </button>
        </div>
      )

    case 'certificate':
      return (
        <div className="ad-cert">
          <p className="ad-cert-headline">{body.headline}</p>
          <div className="ad-cert-panel">
            <div className="ad-cert-copy">
              <p className="ad-cert-lead">{body.lead}</p>
              <ul className="ad-cert-specs">
                {body.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
              <button type="button" className="ad-cert-link" onClick={more}>
                {body.link}
              </button>
            </div>
            {/* The product shot. Always the whole machine, always at an angle that
                made the monitor look bigger than the stated eighteen inches. */}
            <div className="ad-cert-art" aria-hidden>
              {art && <AdArt name={art} />}
              <span className="ad-cert-flash">FREE!</span>
            </div>
          </div>
          <p className="ad-cert-small">{body.disclaimer}</p>
        </div>
      )

    case 'exit':
      return (
        <div className="ad-exit">
          <p className="ad-exit-lead">{body.lead}</p>
          {art && (
            <span className="ad-exit-art">
              <AdArt name={art} />
            </span>
          )}
          <ul className="ad-exit-ticks">
            {body.ticks.map((tick) => (
              <li key={tick}>{tick}</li>
            ))}
          </ul>
          <div className="ad-row-center">
            <button type="button" className="ad-exit-cta" onClick={more}>
              {body.cta}
            </button>
          </div>
          <span className="ad-exit-flash">{body.flash}</span>
        </div>
      )

    case 'teasers':
      return (
        <div className="ad-teasers">
          <p className="ad-teasers-head">{body.heading}</p>
          <ul>
            {body.items.map((item) => (
              <li key={item}>
                <button type="button" onClick={more}>
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )

    case 'price':
      return (
        <div className="ad-price">
          {art && (
            <span className="ad-price-art">
              <AdArt name={art} />
            </span>
          )}
          <p className="ad-price-name">{body.product}</p>
          <p className="ad-price-was">{body.was}</p>
          <p className="ad-price-now" onClick={more}>
            {body.now}
          </p>
        </div>
      )

    case 'form':
      return (
        <div className="ad-form">
          <p className="ad-form-head">{body.heading}</p>
          {art && (
            <span className="ad-form-art">
              <AdArt name={art} />
            </span>
          )}
          {body.fields.map((field) => (
            <label key={field.label} className="ad-form-row">
              <span>{field.label}</span>
              {field.options ? (
                <select onChange={more}>
                  {field.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input type="text" />
              )}
            </label>
          ))}
          <button type="button" className="ad-form-cta" onClick={more}>
            {body.cta}
          </button>
        </div>
      )

    case 'security':
      return (
        <div className="ad-security">
          <div className="ad-security-head">
            <GlyphArt kind="shield" />
            <p>{body.heading}</p>
          </div>
          <p className="ad-security-body">{body.body}</p>
          <table className="ad-security-table">
            <tbody>
              {body.rows.map(([label, value]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="ad-form-cta" onClick={more}>
            {body.cta}
          </button>
        </div>
      )

    case 'installed':
      return (
        <div className="ad-installed">
          <div className="ad-installed-top">
            <GlyphArt kind="shield" />
            <p>
              {body.message}{' '}
              <button type="button" className="ad-inline-link" onClick={more}>
                {body.link}
              </button>
            </p>
          </div>
          <div className="ad-row-center">
            <button type="button" className="ad-sysbutton" onClick={more}>
              {body.button}
            </button>
          </div>
        </div>
      )

    case 'radio':
      return (
        <div className="ad-radio">
          <p className="ad-radio-head">{body.heading}</p>
          {art && (
            <span className="ad-radio-art">
              <AdArt name={art} />
            </span>
          )}
          <div className="ad-radio-list">
            {body.options.map((option) => (
              <label key={option}>
                <input type="radio" name={`ad-${body.heading}`} onChange={more} />
                {option}
              </label>
            ))}
          </div>
          <button type="button" className="ad-sysbutton ad-radio-cta" onClick={more}>
            {body.cta}
          </button>
        </div>
      )

    case 'quiz':
      return (
        <div className="ad-quiz">
          <p className="ad-quiz-question">{body.question}</p>
          <div className="ad-quiz-answers">
            {body.answers.map((answer) => (
              <button key={answer} type="button" onClick={more}>
                {answer}
              </button>
            ))}
          </div>
        </div>
      )

    case 'strip':
      return (
        <div className="ad-strip">
          <span className="ad-strip-words">
            {body.words.map((word, i) => (
              <WordRun key={i} word={word} />
            ))}
          </span>
          <button type="button" className="ad-strip-cta" onClick={more}>
            {body.cta}
          </button>
        </div>
      )

    case 'counter':
      return (
        <div className="ad-counter">
          <p className="ad-counter-lead">{body.lead}</p>
          <span className="ad-counter-digits">
            {[...body.digits].map((digit, i) => (
              <i key={i}>{digit}</i>
            ))}
          </span>
          <p className="ad-counter-trail">{body.trail}</p>
        </div>
      )

    case 'progress':
      return (
        <div className="ad-progress">
          <p className="ad-progress-head">{body.heading}</p>
          {/* Marches forever, because it was never measuring anything. */}
          <span className="ad-progress-track">
            <i />
          </span>
          <p className="ad-progress-note">{body.note}</p>
          <div className="ad-row-center">
            <button type="button" className="ad-sysbutton" onClick={more}>
              {body.cta}
            </button>
          </div>
        </div>
      )

    case 'disclaimer':
      return <div className="ad-disclaimer">{body.text}</div>

    case 'links':
      return (
        <div className="ad-links">
          <p className="ad-links-head">{body.heading}</p>
          {body.links.map((link) => (
            <div key={link.title} className="ad-links-item">
              <button type="button" onClick={more}>
                {link.title}
              </button>
              <span>{link.note}</span>
            </div>
          ))}
        </div>
      )

    case 'photo':
      return (
        <button
          type="button"
          className="ad-photo"
          style={{ filter: `hue-rotate(${body.hue}deg)` }}
          onClick={more}
        >
          {/* Standing in for the photograph these always had, which was always of
              somebody who had no idea they were in an advertisement. Ours is drawn. */}
          <span className="ad-photo-art" aria-hidden>
            {art && <AdArt name={art} />}
          </span>
          <span className="ad-photo-caption">
            {body.caption.map((word, i) => (
              <WordRun key={i} word={word} />
            ))}
          </span>
        </button>
      )
  }
}
