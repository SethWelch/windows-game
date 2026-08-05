import { useState } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import { DOCS_ID, getChildren, getNode, getPath, useFsVersion } from '@/os/fs.ts'
import { iconIdFor } from '@/os/shell.ts'
import { Dialog } from './Dialog.tsx'
import { MessageBox } from './MessageBox.tsx'

/**
 * Save As / Open, browsing the real tree. `onConfirm` hands back the chosen
 * folder plus a file name — the caller decides whether to read or write.
 *
 * `extension` is what the dialog is *for*: it gets appended to a name typed
 * without one, and the listing hides everything else, which is what the type box
 * has always claimed to do.
 */
export function FileDialog({
  mode,
  initialName = '',
  initialFolderId,
  extension = '.txt',
  typeLabel = 'Text Documents (*.txt)',
  onConfirm,
  onCancel,
}: {
  mode: 'open' | 'save'
  initialName?: string
  initialFolderId?: string
  /** Lower-case, with the dot. */
  extension?: string
  typeLabel?: string
  onConfirm: (folderId: string, name: string) => void
  onCancel: () => void
}) {
  useFsVersion()
  const [cwd, setCwd] = useState(initialFolderId ?? DOCS_ID)
  const [name, setName] = useState(initialName)
  const [overwrite, setOverwrite] = useState<string | null>(null)

  const folder = getNode(cwd) ?? getNode(DOCS_ID)!
  const entries = getChildren(folder.id).filter(
    (n) =>
      n.kind === 'folder' ||
      (n.kind === 'file' && n.name.toLowerCase().endsWith(extension)),
  )
  const trail = getPath(folder.id)

  const withExt = (n: string) => {
    const t = n.trim()
    if (!t) return ''
    return t.toLowerCase().endsWith(extension) ? t : `${t}${extension}`
  }

  const submit = () => {
    const target = withExt(name)
    if (!target) return

    const existing = entries.find(
      (n) => n.kind === 'file' && n.name.toLowerCase() === target.toLowerCase(),
    )
    if (mode === 'save' && existing) {
      setOverwrite(target)
      return
    }
    if (mode === 'open' && !existing) return
    onConfirm(folder.id, target)
  }

  if (overwrite) {
    return (
      <MessageBox
        title="Save As"
        message={`${overwrite} already exists.\nDo you want to replace it?`}
        buttons={[
          {
            label: 'Yes',
            primary: true,
            onClick: () => onConfirm(folder.id, overwrite),
          },
          { label: 'No', onClick: () => setOverwrite(null) },
        ]}
        onClose={() => setOverwrite(null)}
      />
    )
  }

  return (
    <Dialog title={mode === 'save' ? 'Save As' : 'Open'} onClose={onCancel}>
      <div className="xp-filedlg">
        <div className="xp-filedlg-row">
          <label htmlFor="fd-where">
            {mode === 'save' ? 'Save in:' : 'Look in:'}
          </label>
          <div className="xp-field xp-filedlg-where" id="fd-where">
            {trail.map((n) => n.name).join(' \\ ')}
          </div>
          <button
            type="button"
            className="xp-button xp-filedlg-up"
            disabled={!folder.parentId}
            onClick={() => folder.parentId && setCwd(folder.parentId)}
          >
            ↑ Up
          </button>
        </div>

        <div className="xp-filedlg-list">
          {entries.length === 0 ? (
            <div className="xp-filedlg-empty">This folder is empty.</div>
          ) : (
            entries.map((n) => (
              <button
                key={n.id}
                type="button"
                className="xp-filedlg-file"
                data-selected={n.kind === 'file' && withExt(name) === n.name}
                onClick={() => {
                  if (n.kind === 'file') setName(n.name)
                }}
                onDoubleClick={() => {
                  // Folders navigate; files confirm.
                  if (n.kind === 'folder') {
                    setCwd(n.id)
                    setName('')
                  } else {
                    onConfirm(folder.id, n.name)
                  }
                }}
              >
                <Icon id={iconIdFor(n)} size={16} />
                {n.name}
              </button>
            ))
          )}
        </div>

        <div className="xp-filedlg-row">
          <label htmlFor="fd-name">File name:</label>
          <input
            id="fd-name"
            className="xp-field"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>

        <div className="xp-filedlg-row">
          <label htmlFor="fd-type">Save as type:</label>
          <select id="fd-type" className="xp-field" disabled>
            <option>{typeLabel}</option>
          </select>
        </div>

        <div className="xp-filedlg-actions">
          <button
            type="button"
            className="xp-button xp-button--default"
            onClick={submit}
          >
            {mode === 'save' ? 'Save' : 'Open'}
          </button>
          <button type="button" className="xp-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  )
}
