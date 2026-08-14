/**
 * How Bongo sounds, out of whatever the browser happens to have.
 *
 * `speechSynthesis` voices are entirely platform-dependent: this Mac has Kathy, Daniel
 * and Ralph, Windows has Zira and David, Chrome adds its own network voices, and a Linux
 * box may have one robot or nothing at all. So this ranks the ones worth having and
 * falls back politely rather than assuming — and a machine with no voices gets no voice
 * set, which lets the browser use its default instead of being silenced by us.
 *
 * Two things matter for not sounding like a machine reading a spreadsheet:
 *
 * 1. **Nearly leave the pitch alone.** Pushing it well below 1 turns any voice into a
 *    growl, which was the first thing wrong here. The stilted delivery people remember
 *    comes from the synthesiser's phrasing, not from detuning it.
 * 2. **Don't land on a novelty voice.** Every Mac ships Zarvox, Trinoids, Bells and a
 *    dozen other singing joke voices, and one of those would read as a fault rather than
 *    a character.
 *
 * Both were settled by ear and then fixed here. There was a picker in Bongo's window
 * while that was going on; it did its job and went.
 */

/**
 * How far off the voice's own pitch to speak. Just under 1, which sits him slightly
 * below a person without getting near that growl.
 *
 * Some browsers — Firefox on several platforms, and most network voices — ignore pitch
 * entirely and will simply speak at 1. Nothing to be done about that from here.
 */
export const PITCH = 0.9

/**
 * Best first.
 *
 * Kathy leads because she was picked by ear against the rest of the list, which beats
 * anything I could reason my way to — she is one of the older compact macOS voices, and
 * the slightly thin, clipped delivery is much closer to what Microsoft Agent sounded
 * like than the modern high-quality voices are. The others follow as sensible fallbacks
 * on machines that don't have her.
 */
const PREFERRED = [
  // macOS, chosen deliberately
  'Kathy',
  // macOS, high quality
  'Alex',
  'Tom',
  'Aaron',
  'Daniel',
  // macOS, legacy but perfectly listenable
  'Ralph',
  'Fred',
  // Windows. Zira and David are both older SAPI voices, so they carry the same thin,
  // compact character Kathy does; the newer "Natural" voices are far too polished.
  'Microsoft Zira',
  'Microsoft David',
  'Microsoft Mark',
  'Microsoft George',
  // Chrome's own
  'Google UK English Male',
  'Google US English',
  // Android
  'en-us-x-iom-local',
]

/**
 * Apple's novelty set. Never auto-selected: these are the ones that would have people
 * reporting the voice as broken.
 */
const NOVELTY = new Set([
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Good News',
  'Jester',
  'Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
])

const isNovelty = (name: string) => NOVELTY.has(name)

/** Every English voice installed, novelty ones included so they can be filtered. */
function englishVoices(): SpeechSynthesisVoice[] {
  const synth = window.speechSynthesis
  if (!synth) return []
  return synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'))
}

/**
 * The voice to speak with: the one that was asked for, else the best available.
 *
 * Returns null when the list is still empty — `getVoices` is populated asynchronously
 * and is routinely empty on the first call — in which case the caller should speak with
 * no voice set and let the browser use its default, rather than staying silent.
 */
export function chooseVoice(wanted: string | null): SpeechSynthesisVoice | null {
  const voices = englishVoices()
  if (!voices.length) return null

  if (wanted) {
    const asked = voices.find((v) => v.name === wanted)
    if (asked) return asked
  }

  for (const name of PREFERRED) {
    const match = voices.find((v) => v.name === name || v.name.startsWith(name))
    if (match) return match
  }

  // Nothing recognised. A local voice beats a network one for latency, and anything
  // beats a joke voice.
  const usable = voices.filter((v) => !isNovelty(v.name))
  return (
    usable.find((v) => v.localService && v.lang.startsWith('en-US')) ??
    usable.find((v) => v.localService) ??
    usable[0] ??
    null
  )
}
