import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { FileDialog } from '@/components/ui/FileDialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { MessageBox } from '@/components/ui/MessageBox.tsx'
import { DOCS_ID, fs, getChildren, getNode } from '@/os/fs.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import {
  PlayGlyph,
  RecordGlyph,
  SeekEndGlyph,
  SeekStartGlyph,
  StopGlyph,
  WaveDisplay,
} from './glyphs.tsx'
import { buildRecorderMenus } from './soundRecorderMenus.ts'
import {
  FORMAT,
  FRAMES_PER_SECOND,
  MAX_SECONDS,
  amplify,
  byteLength,
  capture,
  decode,
  deleteAfter,
  deleteBefore,
  duration,
  echo,
  encode,
  respeed,
  reverse,
} from './waveform.ts'
import type { Wave } from './waveform.ts'
import './SoundRecorder.css'

interface RecorderArgs {
  /** Node id of a `.wav` to load on launch, e.g. from Explorer. */
  fileId?: string
}

const UNTITLED = 'Sound'
const TICK_MS = Math.round(1000 / FRAMES_PER_SECOND)

/** Two decimals, always — the way sndrec32 wrote every duration. */
const secs = (value: number) => value.toFixed(2)

export function SoundRecorder({ windowId, args }: AppProps) {
  const { fileId } = (args ?? {}) as RecorderArgs
  const [seeded] = useState(() => (fileId ? getNode(fileId) : undefined))

  const [wave, setWave] = useState<Wave>(() =>
    seeded?.content ? decode(seeded.content) : [],
  )
  /** Where the cursor sits when not recording; recording drags it along the end. */
  const [held, setHeld] = useState(0)
  /** What the user asked the transport to do. `active` below is what it's doing. */
  const [mode, setMode] = useState<'idle' | 'playing' | 'recording'>('idle')
  const [fileName, setFileName] = useState(seeded?.name ?? UNTITLED)
  const [folderId, setFolderId] = useState<string | null>(seeded?.parentId ?? null)
  const [fileDialog, setFileDialog] = useState<'open' | 'save' | null>(null)
  const [properties, setProperties] = useState(false)
  const [about, setAbout] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = duration(wave)

  /**
   * The transport stops itself, and does it by derivation rather than by writing
   * state: playback is over the moment the cursor reaches the end, and a recording
   * is over at sixty seconds, which is where the real one gave up. `mode` stays as
   * the user last set it and `active` is what the window actually shows — which is
   * what lets the tick below keep its updaters pure. Nothing reads `mode` directly.
   */
  const ended = mode === 'playing' && held >= total
  const full = mode === 'recording' && total >= MAX_SECONDS
  const active: 'idle' | 'playing' | 'recording' = ended || full ? 'idle' : mode

  /**
   * Recording pins the cursor to the end of what's been captured — keyed on `mode`
   * rather than `active` so it stays there once a recording hits the cap, instead
   * of snapping back to the start.
   */
  const position = mode === 'recording' ? total : Math.min(held, total)
  const busy = active !== 'idle'

  useEffect(() => {
    wm.setTitle(windowId, `${fileName} - Sound Recorder`)
  }, [windowId, fileName])

  /**
   * The transport. One interval drives both directions: recording appends a frame,
   * playing advances the cursor. Both updaters are pure — the stopping conditions
   * are derived above, so nothing here has to reach for another setter.
   */
  useEffect(() => {
    if (active === 'idle') return

    const id = window.setInterval(() => {
      if (active === 'recording') {
        setWave((w) => (duration(w) >= MAX_SECONDS ? w : capture(w)))
      } else {
        setHeld((p) => Math.min(total, p + 1 / FRAMES_PER_SECOND))
      }
    }, TICK_MS)

    return () => window.clearInterval(id)
  }, [active, total])

  /** Every effect and edit runs through here so the transport can't be left mid-air. */
  const transform = (fn: (w: Wave) => Wave) => {
    const next = fn(wave)
    setMode('idle')
    setWave(next)
    setHeld(Math.min(position, duration(next)))
  }

  const loadInto = (content: string, name: string, parent: string | null) => {
    setMode('idle')
    setWave(decode(content))
    setHeld(0)
    setFileName(name)
    setFolderId(parent)
  }

  const saveTo = (targetFolder: string, name: string) => {
    fs.saveAs(targetFolder, name, encode(wave))
    setFolderId(targetFolder)
    setFileName(name)
  }

  const actions = {
    newFile: () => {
      setMode('idle')
      setWave([])
      setHeld(0)
      setFileName(UNTITLED)
      setFolderId(null)
    },
    open: () => setFileDialog('open'),
    save: () => {
      if (fileName === UNTITLED || !folderId) setFileDialog('save')
      else saveTo(folderId, fileName)
    },
    saveAs: () => setFileDialog('save'),
    properties: () => setProperties(true),
    exit: () => wm.close(windowId),
    deleteBefore: () => transform((w) => deleteBefore(w, position)),
    deleteAfter: () => transform((w) => deleteAfter(w, position)),
    louder: () => transform((w) => amplify(w, 1.25)),
    quieter: () => transform((w) => amplify(w, 0.75)),
    faster: () => transform((w) => respeed(w, 2)),
    slower: () => transform((w) => respeed(w, 0.5)),
    echo: () => transform(echo),
    reverse: () => transform(reverse),
    about: () => setAbout(true),
  }

  const menus = buildRecorderMenus(actions, { empty: wave.length === 0, busy })

  const record = () => {
    if (total >= MAX_SECONDS) {
      setError(
        `This recording is already ${secs(MAX_SECONDS)} seconds long.\n\nSound Recorder cannot record any more into this file.`,
      )
      return
    }
    setMode('recording')
  }

  const play = () => {
    if (!wave.length) return
    // Replaying from the end starts over, which is what the button always did.
    if (position >= total) setHeld(0)
    setMode('playing')
  }

  /** Stop leaves the cursor wherever the transport got to, as the real one did. */
  const stop = () => {
    setHeld(position)
    setMode('idle')
  }

  return (
    <div className="xp-sr">
      <MenuBar menus={menus} />

      <div className="xp-window-content">
        <div className="xp-sr-body">
          {/* Position, display and Length share one row, as they did in the real
              window — the readouts flank the wave rather than sitting above it. */}
          <div className="xp-sr-row">
            <span className="xp-sr-readout">
              Position:
              <br />
              {secs(position)} sec.
            </span>

            <WaveDisplay wave={wave} position={position} active={busy} />

            <span className="xp-sr-readout xp-sr-readout--right">
              Length:
              <br />
              {secs(total)} sec.
            </span>
          </div>

          <input
            className="xp-sr-slider"
            type="range"
            min={0}
            max={Math.max(1, wave.length)}
            step={1}
            value={Math.round(position * FRAMES_PER_SECOND)}
            disabled={!wave.length || busy}
            aria-label="Position"
            onChange={(e) => setHeld(Number(e.target.value) / FRAMES_PER_SECOND)}
          />

          <div className="xp-sr-transport">
            <button
              type="button"
              className="xp-sr-button"
              title="Seek to Start"
              aria-label="Seek to Start"
              disabled={busy || position <= 0}
              onClick={() => setHeld(0)}
            >
              <SeekStartGlyph />
            </button>
            <button
              type="button"
              className="xp-sr-button"
              title="Seek to End"
              aria-label="Seek to End"
              disabled={busy || position >= total}
              onClick={() => setHeld(total)}
            >
              <SeekEndGlyph />
            </button>
            <button
              type="button"
              className="xp-sr-button"
              title="Play"
              aria-label="Play"
              disabled={busy || !wave.length}
              onClick={play}
            >
              <PlayGlyph />
            </button>
            <button
              type="button"
              className="xp-sr-button"
              title="Stop"
              aria-label="Stop"
              disabled={!busy}
              onClick={stop}
            >
              <StopGlyph />
            </button>
            <button
              type="button"
              className="xp-sr-button"
              title="Record"
              aria-label="Record"
              disabled={busy}
              onClick={record}
            >
              <RecordGlyph />
            </button>
          </div>
        </div>
      </div>

      {fileDialog && (
        <FileDialog
          mode={fileDialog}
          extension=".wav"
          typeLabel="Sounds (*.wav)"
          initialName={fileName === UNTITLED ? 'Sound.wav' : fileName}
          initialFolderId={folderId ?? DOCS_ID}
          onCancel={() => setFileDialog(null)}
          onConfirm={(targetFolder, name) => {
            const which = fileDialog
            setFileDialog(null)
            if (which === 'save') {
              saveTo(targetFolder, name)
              return
            }
            const found = getChildren(targetFolder).find(
              (n) => n.kind === 'file' && n.name === name,
            )
            if (found) loadInto(found.content ?? '', found.name, targetFolder)
          }}
        />
      )}

      {properties && (
        <Dialog title="Properties for Sound" onClose={() => setProperties(false)}>
          <div className="xp-sr-props">
            <div>
              <span>Length:</span>
              <span>{secs(total)} sec.</span>
            </div>
            <div>
              <span>Data Size:</span>
              <span>{byteLength(wave).toLocaleString('en-US')} bytes</span>
            </div>
            <div>
              <span>Audio Format:</span>
              <span>
                PCM {(FORMAT.rate / 1000).toFixed(3)} kHz, {FORMAT.bits} Bit,{' '}
                {FORMAT.channels === 1 ? 'Mono' : 'Stereo'}
              </span>
            </div>
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setProperties(false)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}

      {about && (
        <Dialog title="About Sound Recorder" onClose={() => setAbout(false)}>
          <div className="xp-sr-about">
            <strong>Sound Recorder</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            No microphone and no speaker — but the waveform is real data, so Add
            Echo and Reverse do to it exactly what they say.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setAbout(false)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}

      {error && (
        <MessageBox
          title="Sound Recorder"
          message={error}
          buttons={[{ label: 'OK', primary: true, onClick: () => setError(null) }]}
          onClose={() => setError(null)}
        />
      )}
    </div>
  )
}
