import { useEffect, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { FileDialog } from '@/components/ui/FileDialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { MessageBox } from '@/components/ui/MessageBox.tsx'
import { DOCS_ID, fs, getChildren, getNode, isPersisted } from '@/os/fs.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { buildNotepadMenus } from './notepadMenus.ts'
import './Notepad.css'

const UNTITLED = 'Untitled'

/** What to do once the save-changes prompt is answered. */
type PendingAction = 'new' | 'open' | 'exit'

interface LaunchArgs {
  /** Node id of a file to open on launch, e.g. from Explorer. */
  fileId?: string
}

export function Notepad({ windowId, args }: AppProps) {
  // The textarea is held in state rather than a ref: the menu actions need to
  // reach it, and state is safe to read during render where a ref is not.
  const [el, setEl] = useState<HTMLTextAreaElement | null>(null)

  const launch = (args ?? {}) as LaunchArgs
  const [seeded] = useState(() =>
    launch.fileId ? getNode(launch.fileId) : undefined,
  )

  const [text, setText] = useState(seeded?.content ?? '')
  const [fileName, setFileName] = useState(seeded?.name ?? UNTITLED)
  /** Where the current document lives; null until first save. */
  const [folderId, setFolderId] = useState<string | null>(
    seeded?.parentId ?? null,
  )
  const [dirty, setDirty] = useState(false)
  const [wordWrap, setWordWrap] = useState(false)
  const [statusBar, setStatusBar] = useState(true)
  const [caret, setCaret] = useState({ ln: 1, col: 1 })

  const [fileDialog, setFileDialog] = useState<'open' | 'save' | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The title belongs to the window, not the app — so push it up. The store's
  // no-op guard on an unchanged title is what keeps this from looping.
  useEffect(() => {
    wm.setTitle(windowId, `${dirty ? '*' : ''}${fileName} - Notepad`)
  }, [windowId, fileName, dirty])

  const syncCaret = () => {
    if (!el) return
    const upTo = el.value.slice(0, el.selectionStart)
    setCaret({
      ln: upTo.split('\n').length,
      col: el.selectionStart - upTo.lastIndexOf('\n'),
    })
  }

  /** Splice `insert` over the current selection, keeping the caret sensible. */
  const spliceSelection = (insert: string) => {
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    setText(el.value.slice(0, s) + insert + el.value.slice(e))
    setDirty(true)
    requestAnimationFrame(() => {
      el.selectionStart = s + insert.length
      el.selectionEnd = s + insert.length
      el.focus()
      syncCaret()
    })
  }

  const doSaveTo = (targetFolder: string, name: string) => {
    fs.saveAs(targetFolder, name, text)
    setFolderId(targetFolder)
    setFileName(name)
    setDirty(false)
    // The write always lands in memory; only durability can fail.
    if (!isPersisted()) {
      setError(
        `${name} was saved, but could not be written to storage.\n\nThere is not enough space available, or your browser is blocking it. The file will be lost when you reload.`,
      )
    }
  }

  const resetTo = (content: string, name: string, parent: string | null) => {
    setText(content)
    setFileName(name)
    setFolderId(parent)
    setDirty(false)
    setCaret({ ln: 1, col: 1 })
  }

  const runAction = (action: PendingAction) => {
    if (action === 'new') resetTo('', UNTITLED, null)
    else if (action === 'open') setFileDialog('open')
    else wm.close(windowId)
  }

  /** New / Open / Exit all have to settle unsaved changes first. */
  const guard = (action: PendingAction) => {
    if (dirty) setPending(action)
    else runAction(action)
  }

  const selection = () =>
    el && el.selectionStart !== el.selectionEnd
      ? el.value.slice(el.selectionStart, el.selectionEnd)
      : ''

  const actions = {
    newDoc: () => guard('new'),
    open: () => guard('open'),
    save: () => {
      if (fileName === UNTITLED || !folderId) setFileDialog('save')
      else doSaveTo(folderId, fileName)
    },
    saveAs: () => setFileDialog('save'),
    exit: () => guard('exit'),
    undo: () => {
      el?.focus()
      // Deprecated, but the only route that preserves a textarea's own undo stack.
      document.execCommand('undo')
    },
    cut: () => {
      const sel = selection()
      if (!sel) return
      void navigator.clipboard?.writeText(sel).catch(() => {})
      spliceSelection('')
    },
    copy: () => {
      const sel = selection()
      if (!sel) return
      void navigator.clipboard?.writeText(sel).catch(() => {})
    },
    paste: () => {
      void navigator.clipboard
        ?.readText()
        .then((t) => spliceSelection(t))
        .catch(() => {})
    },
    del: () => spliceSelection(''),
    selectAll: () => {
      el?.select()
      syncCaret()
    },
    timeDate: () => {
      const now = new Date()
      const time = now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
      const date = now.toLocaleDateString([], {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
      spliceSelection(`${time} ${date}`)
    },
    toggleWrap: () => setWordWrap((v) => !v),
    toggleStatusBar: () => setStatusBar((v) => !v),
    about: () => setAboutOpen(true),
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Dialogs are portaled but still bubble through the React tree, so Ctrl+A in
    // the Save As filename field must not reach the editor's Select All.
    if ((e.target as HTMLElement).closest('.xp-dialog')) return

    if (e.key === 'F5') {
      e.preventDefault()
      actions.timeDate()
      return
    }
    if (!e.ctrlKey && !e.metaKey) return
    const map: Record<string, () => void> = {
      n: actions.newDoc,
      o: actions.open,
      s: actions.save,
      a: actions.selectAll,
    }
    const run = map[e.key.toLowerCase()]
    if (run) {
      e.preventDefault()
      run()
    }
  }

  // Word Wrap hides the position readout, exactly as the real thing does.
  const showPosition = statusBar && !wordWrap

  return (
    <div className="xp-notepad" onKeyDown={onKeyDown}>
      <MenuBar menus={buildNotepadMenus(actions, { wordWrap, statusBar })} />

      <div className="xp-window-content">
        <div className="xp-notepad-editwrap">
          <textarea
            ref={setEl}
            className="xp-notepad-edit"
            data-wrap={wordWrap}
            wrap={wordWrap ? 'soft' : 'off'}
            spellCheck={false}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setDirty(true)
              syncCaret()
            }}
            onSelect={syncCaret}
            onClick={syncCaret}
            onKeyUp={syncCaret}
          />
        </div>
      </div>

      {statusBar && (
        <div className="xp-statusbar xp-notepad-status">
          <span className="xp-statusbar-cell">
            {showPosition ? `Ln ${caret.ln}, Col ${caret.col}` : ''}
          </span>
        </div>
      )}

      {fileDialog && (
        <FileDialog
          mode={fileDialog}
          initialName={fileName === UNTITLED ? 'Untitled.txt' : fileName}
          initialFolderId={folderId ?? DOCS_ID}
          onCancel={() => setFileDialog(null)}
          onConfirm={(targetFolder, name) => {
            const mode = fileDialog
            setFileDialog(null)
            if (mode === 'save') {
              doSaveTo(targetFolder, name)
              return
            }
            const found = getChildren(targetFolder).find(
              (n) => n.kind === 'file' && n.name === name,
            )
            if (found) resetTo(found.content ?? '', found.name, targetFolder)
          }}
        />
      )}

      {pending && (
        <MessageBox
          title="Notepad"
          message={`The text in the ${fileName} file has changed.\n\nDo you want to save the changes?`}
          buttons={[
            {
              label: 'Yes',
              primary: true,
              onClick: () => {
                setPending(null)
                if (fileName === UNTITLED || !folderId) setFileDialog('save')
                else doSaveTo(folderId, fileName)
              },
            },
            {
              label: 'No',
              onClick: () => {
                const action = pending
                setPending(null)
                runAction(action)
              },
            },
            { label: 'Cancel', onClick: () => setPending(null) },
          ]}
          onClose={() => setPending(null)}
        />
      )}

      {error && (
        <MessageBox
          title="Notepad"
          message={error}
          buttons={[
            { label: 'OK', primary: true, onClick: () => setError(null) },
          ]}
          onClose={() => setError(null)}
        />
      )}

      {aboutOpen && (
        <Dialog title="About Notepad" onClose={() => setAboutOpen(false)}>
          <div className="xp-notepad-about">
            <strong>Notepad</strong>
            <br />
            Version 5.1 (Build 2600)
            <br />
            <br />
            A hand-drawn tribute, rendered entirely in CSS and SVG.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setAboutOpen(false)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
