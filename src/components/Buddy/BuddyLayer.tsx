import { useCallback, useEffect, useRef, useState } from 'react'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import type { MenuNode } from '@/components/ui/menu.types.ts'
import { WALK_MS, buddy, useBuddies } from '@/os/buddy.ts'
import type { Buddy } from '@/os/buddy.ts'
import { useAudioSettings } from '@/os/audio.ts'
import { PITCH, chooseVoice } from '@/os/voice.ts'
import { BongoArt } from './BongoArt.tsx'
import './Buddy.css'

/**
 * Draws whatever assistants are currently loose on the desktop.
 *
 * The layer is `pointer-events: none` so it never eats a click meant for an icon —
 * only he takes input. He walks by CSS transition rather than by animation frames: the
 * store sets a destination, the transform eases there over `WALK_MS`, and nothing
 * re-renders in between. Two moving parts instead of a rAF loop per ape.
 */
export function BuddyLayer() {
  const buddies = useBuddies()
  if (!buddies.length) return null

  return (
    <div className="buddy-layer">
      {buddies.map((b) => (
        <BuddyFigure key={b.id} buddy={b} />
      ))}
    </div>
  )
}

function BuddyFigure({ buddy: b }: { buddy: Buddy }) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const speak = useSpeech()

  // Every new line is spoken as it appears, which is the thing people actually
  // remember about these — the balloon was only there to be read along with.
  useEffect(() => {
    if (b.says) speak(b.says)
  }, [b.says, speak])

  const items: MenuNode[] = [
    { id: 'joke', label: 'Tell me a &joke', onSelect: () => buddy.joke(b.id) },
    { id: 'sing', label: '&Sing a song', onSelect: () => buddy.sing(b.id) },
    { id: 'search', label: 'Search the &Web for me', onSelect: () => buddy.search(b.id) },
    { kind: 'separator' },
    { id: 'hide', label: '&Hide Bongo', onSelect: () => buddy.hide(b.id) },
    { id: 'uninstall', label: '&Uninstall Bongo...', onSelect: () => buddy.uninstall() },
  ]

  return (
    <>
      <div
        className="buddy"
        data-flip={b.flip ? '' : undefined}
        data-below={b.below ? '' : undefined}
        data-sinister={b.sinister ? '' : undefined}
        data-carrying={b.carrying ? '' : undefined}
        style={{
          transform: `translate(${b.x}px, ${b.y}px)`,
          transitionDuration: b.mood === 'walk' ? `${WALK_MS}ms` : '0ms',
        }}
      >
        {b.says && (
          <div className="buddy-balloon" role="status">
            {b.says}
            <span className="buddy-balloon-tail" aria-hidden />
          </div>
        )}

        <button
          type="button"
          className="buddy-hit"
          aria-label="Bongo"
          style={{ transform: `scaleX(${b.facing})` }}
          onClick={() => buddy.poke(b.id)}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenu({ x: e.clientX, y: e.clientY })
          }}
        >
          <BongoArt mood={b.mood} />
        </button>
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={items}
          onDismiss={() => setMenu(null)}
        />
      )}
    </>
  )
}

/**
 * His voice, through the browser's own speech synthesis — which is the closest thing
 * going to the Microsoft Agent text-to-speech these shipped with, and the detail that
 * makes the whole act land.
 *
 * Guarded on every side. It respects the tray's mute and volume, because a talking ape
 * you cannot silence from the speaker icon would be a bug rather than a joke. If the
 * browser has no synthesis, or no voice loaded yet, the balloon simply carries the line
 * on its own and nothing throws.
 */
function useSpeech() {
  const { volume, muted } = useAudioSettings()
  // The `latest` idiom from hooks/useOutsideClick.ts: written in an effect, never read
  // during render, so `speak` can stay stable and the caller's effect fires once per
  // line rather than once per volume tick.
  const latest = useRef({ volume, muted })
  useEffect(() => {
    latest.current = { volume, muted }
  })

  const speak = useCallback((line: string) => {
    const synth = window.speechSynthesis
    if (!synth) return
    const { volume: vol, muted: quiet } = latest.current
    if (quiet || vol === 0) return

    try {
      // One voice at a time. He interrupts himself, as he interrupted everything else.
      synth.cancel()
      const utterance = new SpeechSynthesisUtterance(line)
      utterance.volume = (vol / 100) ** 2

      // Just under the voice's own pitch. Detuning much further is what made him sound
      // like a growling machine rather than a synthesised one — the clipped delivery
      // these had comes from the synthesiser's phrasing, not from the pitch.
      utterance.pitch = PITCH
      // Fractionally quick, which is the one liberty worth taking: it reads as eager.
      utterance.rate = 1.04

      const voice = chooseVoice(null)
      // Left unset when the list hasn't loaded — `getVoices` populates asynchronously
      // and is usually empty on the first call. The browser default is better than
      // silence.
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }
      synth.speak(utterance)
    } catch {
      // Some browsers throw if synthesis isn't ready. The balloon still says it.
    }
  }, [])

  // Nothing half-spoken should outlive him.
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  return speak
}
