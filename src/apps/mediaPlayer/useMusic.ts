import { useEffect, useMemo, useRef } from 'react'
import { audioBus, useAudioSettings } from '@/os/audio.ts'
import { createInstrument } from '@/os/instrument.ts'
import { createPlayer } from './synth.ts'
import type { Player } from './synth.ts'
import type { Note } from './music/notation.ts'

/**
 * Wires the transport to the synth.
 *
 * A hook rather than a store, on the same argument `useRadio` makes: two Media Players
 * should be two instruments, not a fight over one. Both hang off the shell's single
 * `AudioContext` — see `audioBus` — so the tray's volume and mute cover them.
 *
 * The player owns the position, and React asks for it rather than counting. Before this
 * the transport was a stopwatch incrementing every 250ms; now the number on screen is read
 * from the audio clock, so it cannot drift away from what you are hearing.
 */
export function useMusic({
  notes,
  playing,
  volume,
  muted,
}: {
  /** The current piece, or null when the transport is driving something else. */
  notes: Note[] | null
  playing: boolean
  /** Media Player's own volume, 0-100. The tray's is applied further down the graph. */
  volume: number
  muted: boolean
}) {
  const playerRef = useRef<Player | null>(null)
  const mixer = useAudioSettings()

  /** One player for as long as the window is open. */
  useEffect(() => {
    const bus = audioBus()
    // No Web Audio, or a context the browser refused to build. The rest of the player
    // carries on silently, which is what os/audio.ts does about the same problem.
    if (!bus) return
    const instrument = createInstrument(bus.ctx, bus.out)
    const player = createPlayer(bus.ctx, instrument)
    playerRef.current = player
    return () => {
      player.dispose()
      instrument.dispose()
      playerRef.current = null
    }
  }, [])

  /**
   * Loading a piece parks it at the start. Keyed on the notes array identity, which changes
   * exactly when the track does — `LIBRARY` is built once, so this is stable per track.
   */
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    player.load(notes ?? [])
  }, [notes])

  /** Running or not. Separate from loading, so pausing doesn't rewind. */
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (playing && notes) player.start()
    else player.stop()
  }, [playing, notes])

  /**
   * The player's own level. Muting either this or the tray silences it: the tray is a gain
   * further down the same graph, so its mute already covers us — this half is the program's
   * own slider, and 0 has to mean 0 even when the tray is wide open.
   */
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    player.setGain(muted || mixer.muted ? 0 : (volume / 100) ** 2)
  }, [volume, muted, mixer.muted])

  /**
   * Stable across renders, and it has to be.
   *
   * The transport's own interval closes over this, so a fresh object every render meant the
   * interval was cleared and recreated four times a second — the position update restarting
   * the very timer that produces it. It worked by luck; anything else causing a render would
   * have delayed the readout. Both members only read a ref, so there is nothing to keep in
   * step and no reason for the identity to change.
   */
  return useMemo(
    () => ({
      /** Seconds into the piece, off the audio clock. */
      position: () => playerRef.current?.position() ?? 0,
      seek: (seconds: number) => playerRef.current?.seek(seconds),
    }),
    [],
  )
}
