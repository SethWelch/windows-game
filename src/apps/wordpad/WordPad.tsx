import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { FileDialog } from '@/components/ui/FileDialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { MessageBox } from '@/components/ui/MessageBox.tsx'
import { useOutsideClick } from '@/hooks/useOutsideClick.ts'
import { DOCS_ID, fs, getChildren, getNode, isPersisted } from '@/os/fs.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import * as rt from './richText.ts'
import type { Align, Formatting } from './richText.ts'
import {
  ColorIcon,
  CopyIcon,
  CutIcon,
  DateTimeIcon,
  FindIcon,
  NewIcon,
  OpenIcon,
  PasteIcon,
  PreviewIcon,
  PrintIcon,
  SaveIcon,
  UndoIcon,
} from './toolbarIcons.tsx'
import { buildWordPadMenus } from './wordpadMenus.ts'
import type { WordPadActions, WordPadFlags } from './wordpadMenus.ts'
import './WordPad.css'

interface WordPadArgs {
  /** Node id of a document to open on launch. */
  fileId?: string
}

const UNTITLED = 'Document'

/**
 * Same arrangement as Paint's: the actions close over the editor ref, and handing a
 * ref-reading function to a plain call during render is what the hooks rules forbid.
 * Crossing a component boundary as a prop is the way round.
 */
function WordPadMenus({
  actions,
  flags,
}: {
  actions: WordPadActions
  flags: WordPadFlags
}) {
  return <MenuBar menus={buildWordPadMenus(actions, flags)} />
}

export function WordPad({ windowId, args }: AppProps) {
  const { fileId } = (args ?? {}) as WordPadArgs
  const [seeded] = useState(() => (fileId ? getNode(fileId) : undefined))

  /** Mutated directly on New and Open, so a ref rather than state. */
  const editorRef = useRef<HTMLDivElement>(null)
  const colorButtonRef = useRef<HTMLDivElement>(null)

  const [fileName, setFileName] = useState(seeded?.name ?? UNTITLED)
  const [folderId, setFolderId] = useState<string | null>(seeded?.parentId ?? null)
  const [dirty, setDirty] = useState(false)
  const [bars, setBars] = useState({
    toolbar: true,
    format: true,
    ruler: true,
    status: true,
  })
  const [font, setFont] = useState('Times New Roman')
  const [size, setSize] = useState('3')
  const [color, setColor] = useState('#000000')
  const [colorOpen, setColorOpen] = useState(false)
  const [marks, setMarks] = useState<Formatting>({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    bullets: false,
  })

  const [fileDialog, setFileDialog] = useState<'open' | 'save' | null>(null)
  const [about, setAbout] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    wm.setTitle(windowId, `${dirty ? '*' : ''}${fileName} - WordPad`)
  }, [windowId, fileName, dirty])

  /** The document that came in on launch. Later opens go through the dialog. */
  useEffect(() => {
    if (editorRef.current && seeded?.content !== undefined) {
      editorRef.current.innerHTML = seeded.content
    }
  }, [seeded])

  /**
   * Keeps the format bar showing what the caret is actually in. `selectionchange`
   * fires on the document, so it has to be filtered down to selections inside this
   * editor — there may well be another WordPad open.
   */
  useEffect(() => {
    const onSelectionChange = () => {
      const editor = editorRef.current
      const anchor = document.getSelection()?.anchorNode ?? null
      if (!editor || !anchor || !editor.contains(anchor)) return
      setMarks(rt.currentFormatting())
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  useOutsideClick([colorButtonRef], () => setColorOpen(false), colorOpen)

  /** Formatting commands act on the selection, which has to be in the editor. */
  const withFocus = (fn: () => void) => {
    editorRef.current?.focus()
    fn()
    setMarks(rt.currentFormatting())
    setDirty(true)
  }

  const saveTo = (targetFolder: string, name: string) => {
    // The markup is stored as-is. WordPad wrote RTF; nothing else in the shell
    // reads these, so the only requirement is that our own round trip survives.
    fs.saveAs(targetFolder, name, editorRef.current?.innerHTML ?? '')
    setFolderId(targetFolder)
    setFileName(name)
    setDirty(false)
    if (!isPersisted()) {
      setError(
        `${name} was saved, but could not be written to storage.\n\nThere is not enough space available, or your browser is blocking it. The document will be lost when you reload.`,
      )
    }
  }

  const actions: WordPadActions = {
    newDoc: () => {
      if (editorRef.current) editorRef.current.innerHTML = ''
      setFileName(UNTITLED)
      setFolderId(null)
      setDirty(false)
    },
    open: () => setFileDialog('open'),
    save: () => {
      if (fileName === UNTITLED || !folderId) setFileDialog('save')
      else saveTo(folderId, fileName)
    },
    saveAs: () => setFileDialog('save'),
    exit: () => wm.close(windowId),
    undo: () => withFocus(rt.undo),
    cut: () => withFocus(rt.cut),
    copy: () => {
      editorRef.current?.focus()
      rt.copy()
    },
    paste: () => withFocus(rt.paste),
    selectAll: () => {
      editorRef.current?.focus()
      rt.selectAll()
    },
    dateTime: () => withFocus(() => rt.insertText(rt.stamp())),
    bullets: () => withFocus(rt.bulletList),
    about: () => setAbout(true),
    toggleBar: (bar) => setBars((b) => ({ ...b, [bar]: !b[bar] })),
  }

  const align = (which: Align) => withFocus(() => rt.setAlign(which))

  /**
   * Stops a toolbar button from taking focus, which would collapse the selection
   * the command is about to act on. Buttons only — the font and size dropdowns need
   * focus to open at all.
   */
  const keepSelection = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) e.preventDefault()
  }

  return (
    <div className="wp-wordpad">
      <WordPadMenus actions={actions} flags={{ bars, bullets: marks.bullets }} />

      {bars.toolbar && (
        <div className="wp-bar" onMouseDown={keepSelection}>
          <button type="button" className="wp-tool" title="New" onClick={actions.newDoc}>
            <NewIcon />
          </button>
          <button type="button" className="wp-tool" title="Open" onClick={actions.open}>
            <OpenIcon />
          </button>
          <button type="button" className="wp-tool" title="Save" onClick={actions.save}>
            <SaveIcon />
          </button>
          <span className="wp-sep" />
          <button type="button" className="wp-tool" title="Print" disabled>
            <PrintIcon />
          </button>
          <button type="button" className="wp-tool" title="Print Preview" disabled>
            <PreviewIcon />
          </button>
          <button type="button" className="wp-tool" title="Find" disabled>
            <FindIcon />
          </button>
          <span className="wp-sep" />
          <button type="button" className="wp-tool" title="Cut" onClick={actions.cut}>
            <CutIcon />
          </button>
          <button type="button" className="wp-tool" title="Copy" onClick={actions.copy}>
            <CopyIcon />
          </button>
          <button type="button" className="wp-tool" title="Paste" onClick={actions.paste}>
            <PasteIcon />
          </button>
          <button type="button" className="wp-tool" title="Undo" onClick={actions.undo}>
            <UndoIcon />
          </button>
          <span className="wp-sep" />
          <button
            type="button"
            className="wp-tool"
            title="Date/Time"
            onClick={actions.dateTime}
          >
            <DateTimeIcon />
          </button>
        </div>
      )}

      {bars.format && (
        <div className="wp-bar wp-formatbar" onMouseDown={keepSelection}>
          <select
            className="xp-field wp-font"
            value={font}
            aria-label="Font"
            onChange={(e) => {
              setFont(e.target.value)
              withFocus(() => rt.setFont(e.target.value))
            }}
          >
            {rt.FONTS.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>

          <select
            className="xp-field wp-size"
            value={size}
            aria-label="Font size"
            onChange={(e) => {
              setSize(e.target.value)
              withFocus(() => rt.setSize(e.target.value))
            }}
          >
            {rt.SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <span className="wp-sep" />

          <button
            type="button"
            className="wp-tool wp-mark"
            data-on={marks.bold}
            title="Bold"
            onClick={() => withFocus(() => rt.toggleMark('bold'))}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className="wp-tool wp-mark"
            data-on={marks.italic}
            title="Italic"
            onClick={() => withFocus(() => rt.toggleMark('italic'))}
          >
            <i>I</i>
          </button>
          <button
            type="button"
            className="wp-tool wp-mark"
            data-on={marks.underline}
            title="Underline"
            onClick={() => withFocus(() => rt.toggleMark('underline'))}
          >
            <u>U</u>
          </button>

          <div className="wp-colorwrap" ref={colorButtonRef}>
            <button
              type="button"
              className="wp-tool"
              title="Color"
              onClick={() => setColorOpen((v) => !v)}
            >
              <ColorIcon color={color} />
            </button>
            {colorOpen && (
              <div className="wp-colormenu">
                {rt.TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="wp-colorpick"
                    style={{ background: c }}
                    title={c}
                    aria-label={c}
                    onClick={() => {
                      setColor(c)
                      setColorOpen(false)
                      withFocus(() => rt.setColor(c))
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <span className="wp-sep" />

          {(['left', 'center', 'right'] as Align[]).map((which) => (
            <button
              key={which}
              type="button"
              className="wp-tool wp-align"
              data-on={marks.align === which}
              data-align={which}
              title={`Align ${which}`}
              aria-label={`Align ${which}`}
              onClick={() => align(which)}
            >
              <span />
              <span />
              <span />
            </button>
          ))}

          <span className="wp-sep" />

          <button
            type="button"
            className="wp-tool wp-bullets"
            data-on={marks.bullets}
            title="Bullets"
            aria-label="Bullets"
            onClick={actions.bullets}
          >
            <span />
            <span />
          </button>
        </div>
      )}

      {/* Decorative, as it largely was until you dragged an indent marker. */}
      {bars.ruler && (
        <div className="wp-ruler" aria-hidden>
          <div className="wp-ruler-ticks">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="wp-ruler-inch">
                {i + 1}
              </span>
            ))}
          </div>
          <span className="wp-ruler-marker wp-ruler-marker--left" />
          <span className="wp-ruler-marker wp-ruler-marker--right" />
        </div>
      )}

      <div className="xp-window-content">
        <div className="wp-page">
          <div
            ref={editorRef}
            className="wp-editor"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            role="textbox"
            aria-multiline
            aria-label="Document"
            style={{ fontFamily: font }}
            onInput={() => setDirty(true)}
            onKeyUp={() => setMarks(rt.currentFormatting())}
            onMouseUp={() => setMarks(rt.currentFormatting())}
          />
        </div>
      </div>

      {bars.status && (
        <div className="xp-statusbar wp-status">
          <span className="xp-statusbar-cell wp-status-hint">For Help, press F1</span>
          <span className="xp-statusbar-cell wp-status-cell" />
          <span className="xp-statusbar-cell wp-status-cell" />
        </div>
      )}

      {fileDialog && (
        <FileDialog
          mode={fileDialog}
          extension=".rtf"
          typeLabel="Rich Text Format (*.rtf)"
          initialName={fileName === UNTITLED ? 'Document.rtf' : fileName}
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
            if (!found || !editorRef.current) return
            editorRef.current.innerHTML = found.content ?? ''
            setFileName(found.name)
            setFolderId(targetFolder)
            setDirty(false)
          }}
        />
      )}

      {about && (
        <Dialog title="About WordPad" onClose={() => setAbout(false)}>
          <div className="wp-about">
            <strong>WordPad</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            Rich text, saved as `.rtf` into the same tree Notepad and Paint use.
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
          title="WordPad"
          message={error}
          buttons={[{ label: 'OK', primary: true, onClick: () => setError(null) }]}
          onClose={() => setError(null)}
        />
      )}
    </div>
  )
}
