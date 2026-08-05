import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { FileDialog } from '@/components/ui/FileDialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { DOCS_ID, fs, getChildren, getNode } from '@/os/fs.ts'
import type { AppProps } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import {
  blitImage,
  copyOf,
  drawSegment,
  drawShape,
  flip,
  floodFill,
  invert,
  pickColor,
  spray,
} from './drawing.ts'
import type { Point } from './drawing.ts'
import { PALETTE, SIZES, TAKES_FILL, TAKES_SIZE, TOOLS, toolById } from './palette.ts'
import type { FillStyle, ToolId } from './palette.ts'
import { ToolIcon } from './toolIcons.tsx'
import { buildPaintMenus } from './paintMenus.ts'
import type { PaintActions, PaintFlags } from './paintMenus.ts'
import './Paint.css'

interface PaintArgs {
  /** Node id of an image to open on launch. */
  fileId?: string
}

const UNTITLED = 'untitled'
const DEFAULT_SIZE = { width: 480, height: 316 }
/** Three, which is all the real one ever remembered. */
const UNDO_LEVELS = 3

/** A rotation waiting for the bitmap to be resized under it. */
interface Pending {
  source: HTMLCanvasElement
  degrees: number
}

/**
 * Wraps the menu builder in a component of its own.
 *
 * `actions` closes over the canvas ref, and handing a ref-reading function to a
 * plain call during Paint's render is exactly what the hooks lint rules forbid —
 * passing it across a component boundary as a prop is the sanctioned way round.
 */
function PaintMenus({
  actions,
  flags,
}: {
  actions: PaintActions
  flags: PaintFlags
}) {
  return <MenuBar menus={buildPaintMenus(actions, flags)} />
}

export function Paint({ windowId, args }: AppProps) {
  const { fileId } = (args ?? {}) as PaintArgs
  const [seeded] = useState(() => (fileId ? getNode(fileId) : undefined))

  /**
   * The canvas is a ref, not state. Drawing *mutates* it — and a value handed back
   * by `useState` is not something to mutate, which is the rule Notepad's
   * textarea-in-state trick doesn't run into because it only ever reads.
   */
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [size, setSize] = useState(DEFAULT_SIZE)

  const [tool, setTool] = useState<ToolId>('pencil')
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [weight, setWeight] = useState(1)
  const [fillStyle, setFillStyle] = useState<FillStyle>('outline')
  const [panes, setPanes] = useState({ tools: true, colors: true, status: true })
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [cursor, setCursor] = useState<Point | null>(null)

  const [fileName, setFileName] = useState(seeded?.name ?? UNTITLED)
  const [folderId, setFolderId] = useState<string | null>(seeded?.parentId ?? null)
  const [fileDialog, setFileDialog] = useState<'open' | 'save' | null>(null)
  const [dialog, setDialog] = useState<'attributes' | 'flip' | 'about' | null>(null)

  /** Live stroke state. Changes many times per frame, so never state. */
  const stroke = useRef<{
    color: string
    from: Point
    last: Point
    /** The bitmap before the shape, restored on every move to rubber-band it. */
    snapshot: ImageData | null
  } | null>(null)
  const pending = useRef<Pending | null>(null)
  const initialized = useRef(false)

  const active = toolById(tool)

  /** The canvas and its context. Handlers and effects only — never during render. */
  const surface = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d') ?? null
    return canvas && ctx ? { canvas, ctx } : null
  }

  useEffect(() => {
    wm.setTitle(windowId, `${fileName} - Paint`)
  }, [windowId, fileName])

  /**
   * Keeps the bitmap at the size the state says, and is the only place that assigns
   * `canvas.width` — doing so clears the canvas, so it must not be a JSX prop where
   * React could write it on an unrelated render. Whatever still fits is carried
   * over, and a rotation parked in `pending` gets drawn instead.
   */
  useEffect(() => {
    const s = surface()
    if (!s) return
    const { canvas, ctx } = s

    const job = pending.current
    pending.current = null
    const keep =
      !job && initialized.current
        ? ctx.getImageData(0, 0, canvas.width, canvas.height)
        : null

    canvas.width = size.width
    canvas.height = size.height
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.width, size.height)

    if (job) {
      ctx.save()
      ctx.translate(size.width / 2, size.height / 2)
      ctx.rotate((job.degrees * Math.PI) / 180)
      ctx.drawImage(job.source, -job.source.width / 2, -job.source.height / 2)
      ctx.restore()
    } else if (keep) {
      ctx.putImageData(keep, 0, 0)
    }
    initialized.current = true
  }, [size])

  /** Launching with a file. Later opens go through the dialog. */
  useEffect(() => {
    if (seeded?.content) blitImage(canvasRef.current, seeded.content)
  }, [seeded])

  // ------------------------------------------------------------- undo

  const pushUndo = () => {
    const s = surface()
    if (!s) return
    const snap = s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height)
    setUndoStack((stack) => [...stack.slice(-(UNDO_LEVELS - 1)), snap])
  }

  const undo = () => {
    const s = surface()
    if (!s || !undoStack.length) return
    s.ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
    setUndoStack((stack) => stack.slice(0, -1))
  }

  const focused = useIsFocused(windowId)
  // `undo` is rebuilt whenever the stack changes — including on every pointermove
  // while drawing, since the coordinate readout re-renders. Reading it through a
  // ref keeps the listener attached once per focus change instead of per frame.
  const latestUndo = useRef(undo)
  useEffect(() => {
    latestUndo.current = undo
  })

  useEffect(() => {
    if (!focused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.('.xp-dialog')) return
      if ((!e.ctrlKey && !e.metaKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      latestUndo.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focused])

  // ------------------------------------------------------------- drawing

  const pointIn = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const box = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.floor(e.clientX - box.left),
      y: Math.floor(e.clientY - box.top),
    }
  }

  /** Brush, eraser and airbrush all scale off the one size the tool box offers. */
  const strokeWidth = () =>
    tool === 'pencil' ? 1 : tool === 'eraser' ? weight * 4 : weight * 2 + 1

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = surface()
    if (!s || !active.ready) return
    if (e.button !== 0 && e.button !== 2) return
    e.preventDefault()

    // Right-dragging draws with the background colour, as it always has.
    const color = e.button === 2 ? background : foreground
    const at = pointIn(e)
    pushUndo()

    if (tool === 'fill') {
      floodFill(s.ctx, at.x, at.y, color)
      return
    }
    if (tool === 'pick') {
      const picked = pickColor(s.ctx, at.x, at.y)
      if (e.button === 2) setBackground(picked)
      else setForeground(picked)
      return
    }

    stroke.current = {
      // The eraser paints the background colour rather than lifting pixels.
      color: tool === 'eraser' ? background : color,
      from: at,
      last: at,
      snapshot:
        active.kind === 'shape'
          ? s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height)
          : null,
    }

    // A click with a freehand tool should mark the canvas, not just arm the stroke.
    if (active.kind === 'freehand') {
      if (tool === 'airbrush') spray(s.ctx, at, weight * 3, stroke.current.color)
      else drawSegment(s.ctx, at, at, stroke.current.color, strokeWidth())
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const at = pointIn(e)
    setCursor(at)

    const held = stroke.current
    const s = surface()
    if (!held || !s) return

    if (active.kind === 'shape') {
      // Wipe the preview and redraw from the anchor — the same trick the real one
      // used, and why dragging a shape never left a trail.
      if (held.snapshot) s.ctx.putImageData(held.snapshot, 0, 0)
      drawShape(s.ctx, tool, held.from, at, {
        stroke: held.color,
        fill: held.color === foreground ? background : foreground,
        lineWidth: weight,
        style: fillStyle,
      })
      return
    }

    if (tool === 'airbrush') spray(s.ctx, at, weight * 3, held.color)
    else drawSegment(s.ctx, held.last, at, held.color, strokeWidth())
    held.last = at
  }

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    stroke.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // ------------------------------------------------------------- files

  const saveTo = (targetFolder: string, name: string) => {
    const s = surface()
    if (!s) return
    // A data URL rather than real BMP bytes: nothing else in the shell decodes
    // images, so the encoding only has to survive our own round trip.
    fs.saveAs(targetFolder, name, s.canvas.toDataURL('image/png'))
    setFolderId(targetFolder)
    setFileName(name)
  }

  const clearImage = () => {
    const s = surface()
    if (!s) return
    pushUndo()
    s.ctx.fillStyle = '#ffffff'
    s.ctx.fillRect(0, 0, s.canvas.width, s.canvas.height)
  }

  const actions: PaintActions = {
    newImage: () => {
      clearImage()
      setFileName(UNTITLED)
      setFolderId(null)
      setUndoStack([])
    },
    open: () => setFileDialog('open'),
    save: () => {
      if (fileName === UNTITLED || !folderId) setFileDialog('save')
      else saveTo(folderId, fileName)
    },
    saveAs: () => setFileDialog('save'),
    exit: () => wm.close(windowId),
    undo,
    flipRotate: () => setDialog('flip'),
    invert: () => {
      const s = surface()
      if (!s) return
      pushUndo()
      invert(s.ctx)
    },
    attributes: () => setDialog('attributes'),
    clearImage,
    about: () => setDialog('about'),
    togglePane: (pane) => setPanes((p) => ({ ...p, [pane]: !p[pane] })),
  }

  return (
    <div className="xp-paint">
      <PaintMenus actions={actions} flags={{ canUndo: undoStack.length > 0, panes }} />

      <div className="xp-window-content">
        <div className="xp-paint-main">
          {panes.tools && (
            <div className="xp-paint-tools">
              <div className="xp-paint-tool-grid">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="xp-paint-tool"
                    data-selected={tool === t.id}
                    disabled={!t.ready}
                    title={t.ready ? t.label : `${t.label} (not implemented)`}
                    aria-label={t.label}
                    onClick={() => setTool(t.id)}
                  >
                    <ToolIcon id={t.id} />
                  </button>
                ))}
              </div>

              {/* The options well under the tool box, which changed with the tool. */}
              <div className="xp-paint-options">
                {TAKES_SIZE.includes(tool) &&
                  SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="xp-paint-size"
                      data-selected={weight === s}
                      aria-label={`Size ${s}`}
                      onClick={() => setWeight(s)}
                    >
                      <span style={{ height: s * 2 - 1 }} />
                    </button>
                  ))}

                {TAKES_FILL.includes(tool) &&
                  (['outline', 'filled', 'both'] as FillStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      className="xp-paint-fill"
                      data-selected={fillStyle === style}
                      data-style={style}
                      aria-label={style}
                      onClick={() => setFillStyle(style)}
                    >
                      <span />
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="xp-paint-workspace">
            <div className="xp-paint-sheet">
              <canvas
                ref={canvasRef}
                className="xp-paint-canvas"
                style={{ width: size.width, height: size.height }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
                onPointerLeave={() => setCursor(null)}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>
      </div>

      {panes.colors && (
        <div className="xp-paint-colorbox">
          {/* Foreground over background, the way the indicator always sat. */}
          <div className="xp-paint-current" title="Foreground and background">
            <span
              className="xp-paint-current-bg"
              style={{ background }}
              aria-label="Background colour"
            />
            <span
              className="xp-paint-current-fg"
              style={{ background: foreground }}
              aria-label="Foreground colour"
            />
          </div>

          <div className="xp-paint-palette">
            {PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                className="xp-paint-swatch"
                style={{ background: color }}
                title={color}
                aria-label={color}
                onClick={() => setForeground(color)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setBackground(color)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {panes.status && (
        <div className="xp-statusbar xp-paint-status">
          <span className="xp-statusbar-cell xp-paint-hint">
            For Help, click Help Topics on the Help Menu.
          </span>
          <span className="xp-statusbar-cell xp-paint-coords">
            {cursor ? `${cursor.x},${cursor.y}` : ''}
          </span>
          <span className="xp-statusbar-cell xp-paint-coords">
            {size.width} x {size.height}
          </span>
        </div>
      )}

      {fileDialog && (
        <FileDialog
          mode={fileDialog}
          extension=".bmp"
          typeLabel="24-bit Bitmap (*.bmp)"
          initialName={fileName === UNTITLED ? 'untitled.bmp' : fileName}
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
            if (!found) return
            blitImage(canvasRef.current, found.content ?? '')
            setFileName(found.name)
            setFolderId(targetFolder)
            setUndoStack([])
          }}
        />
      )}

      {dialog === 'attributes' && (
        <AttributesDialog
          size={size}
          onCancel={() => setDialog(null)}
          onConfirm={(next) => {
            setDialog(null)
            setSize(next)
          }}
        />
      )}

      {dialog === 'flip' && (
        <FlipRotateDialog
          onCancel={() => setDialog(null)}
          onConfirm={(choice) => {
            setDialog(null)
            const s = surface()
            if (!s) return
            pushUndo()
            if (choice === 'horizontal' || choice === 'vertical') {
              flip(s.canvas, choice)
              return
            }
            // A quarter turn swaps the bitmap's dimensions, so the rotation has to
            // wait for the resize effect and draw itself there.
            const swap = choice !== 180
            pending.current = { source: copyOf(s.canvas), degrees: choice }
            setSize({
              width: swap ? s.canvas.height : s.canvas.width,
              height: swap ? s.canvas.width : s.canvas.height,
            })
          }}
        />
      )}

      {dialog === 'about' && (
        <Dialog title="About Paint" onClose={() => setDialog(null)}>
          <div className="xp-paint-about">
            <strong>Paint</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            Right-drag to draw with the background colour, and right-click a swatch
            to set it — the half of Paint nobody was ever told about.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setDialog(null)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

/** Image ▸ Attributes: just the width and height, in pixels. */
function AttributesDialog({
  size,
  onConfirm,
  onCancel,
}: {
  size: { width: number; height: number }
  onConfirm: (size: { width: number; height: number }) => void
  onCancel: () => void
}) {
  const [width, setWidth] = useState(String(size.width))
  const [height, setHeight] = useState(String(size.height))

  const submit = () =>
    onConfirm({
      // Clamped rather than validated: an out-of-range number was always just
      // pulled into range.
      width: Math.max(1, Math.min(2000, Math.trunc(Number(width)) || size.width)),
      height: Math.max(1, Math.min(2000, Math.trunc(Number(height)) || size.height)),
    })

  return (
    <Dialog title="Attributes" onClose={onCancel}>
      <div className="xp-paint-attrs">
        <div className="xp-choice">
          <label htmlFor="paint-w">Width:</label>
          <input
            id="paint-w"
            className="xp-field"
            inputMode="numeric"
            value={width}
            autoFocus
            onChange={(e) => setWidth(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <div className="xp-choice">
          <label htmlFor="paint-h">Height:</label>
          <input
            id="paint-h"
            className="xp-field"
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <p className="xp-paint-attrs-note">
          Shrinking the image crops it; growing it fills the new area with white.
        </p>
      </div>
      <div className="xp-dialog-buttons">
        <button type="button" className="xp-button xp-button--default" onClick={submit}>
          OK
        </button>
        <button type="button" className="xp-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Dialog>
  )
}

type FlipChoice = 'horizontal' | 'vertical' | 90 | 180 | 270

/** Image ▸ Flip/Rotate, radios and all. */
function FlipRotateDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (choice: FlipChoice) => void
  onCancel: () => void
}) {
  const [choice, setChoice] = useState<FlipChoice>('horizontal')

  const option = (value: FlipChoice, label: string) => (
    <label className="xp-choice">
      <input
        type="radio"
        className="xp-radio"
        name="paint-flip"
        checked={choice === value}
        onChange={() => setChoice(value)}
      />
      {label}
    </label>
  )

  return (
    <Dialog title="Flip and Rotate" onClose={onCancel}>
      <fieldset className="xp-groupbox">
        <legend>Flip or rotate</legend>
        {option('horizontal', 'Flip horizontal')}
        {option('vertical', 'Flip vertical')}
        {option(90, 'Rotate by 90°')}
        {option(180, 'Rotate by 180°')}
        {option(270, 'Rotate by 270°')}
      </fieldset>
      <div className="xp-dialog-buttons">
        <button
          type="button"
          className="xp-button xp-button--default"
          onClick={() => onConfirm(choice)}
        >
          OK
        </button>
        <button type="button" className="xp-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Dialog>
  )
}
