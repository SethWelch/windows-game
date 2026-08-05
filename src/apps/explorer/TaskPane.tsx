import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import { PaneChevron } from '@/icons/ToolbarIcons.tsx'
import type { IconId } from '@/icons/registry.ts'
import { DOCS_ID, ROOT_ID, getNode } from '@/os/fs.ts'
import type { FsNode } from '@/os/fs.ts'

function Pane({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="xp-pane">
      <button
        type="button"
        className="xp-pane-header"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <PaneChevron open={open} />
      </button>
      {open && <div className="xp-pane-body">{children}</div>}
    </div>
  )
}

function Link({
  label,
  iconId,
  disabled,
  onClick,
}: {
  label: string
  iconId?: IconId
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="xp-pane-link"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="xp-pane-link-icon">
        {iconId ? <Icon id={iconId} size={16} /> : null}
      </span>
      <span>{label}</span>
    </button>
  )
}

const KIND_LABEL: Record<FsNode['kind'], string> = {
  folder: 'File Folder',
  file: 'Text Document',
  shortcut: 'Shortcut',
}

export function TaskPane({
  folder,
  selected,
  onNavigate,
  onNewFolder,
  onRename,
  onCopy,
  onDelete,
}: {
  folder: FsNode
  selected: FsNode | null
  onNavigate: (id: string) => void
  onNewFolder: () => void
  onRename: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const atRoot = folder.id === ROOT_ID
  const parent = folder.parentId ? getNode(folder.parentId) : undefined
  const detail = selected ?? folder

  return (
    <div className="xp-explorer-tasks">
      {atRoot ? (
        <Pane title="System Tasks">
          <Link label="View system information" iconId="myComputer" disabled />
          <Link label="Add or remove programs" disabled />
          <Link label="Change a setting" disabled />
        </Pane>
      ) : (
        <Pane title="File and Folder Tasks">
          <Link label="Make a new folder" iconId="folder" onClick={onNewFolder} />
          {selected && !selected.system && (
            <>
              <Link label={`Rename this ${selected.kind}`} onClick={onRename} />
              <Link label={`Copy this ${selected.kind}`} onClick={onCopy} />
              <Link label={`Delete this ${selected.kind}`} onClick={onDelete} />
            </>
          )}
          <Link label="Publish this folder to the Web" disabled />
          <Link label="Share this folder" disabled />
        </Pane>
      )}

      <Pane title="Other Places">
        {parent && (
          <Link
            label={parent.name}
            iconId={parent.id === ROOT_ID ? 'myComputer' : 'folder'}
            onClick={() => onNavigate(parent.id)}
          />
        )}
        {folder.id !== DOCS_ID && (
          <Link
            label="My Documents"
            iconId="folder"
            onClick={() => onNavigate(DOCS_ID)}
          />
        )}
        {!atRoot && (
          <Link
            label="My Computer"
            iconId="myComputer"
            onClick={() => onNavigate(ROOT_ID)}
          />
        )}
        <Link label="My Network Places" disabled />
        <Link label="Control Panel" disabled />
      </Pane>

      <Pane title="Details">
        <div className="xp-pane-details">
          <strong>{detail.name}</strong>
          <span>{detail.system ? 'System Folder' : KIND_LABEL[detail.kind]}</span>
        </div>
      </Pane>
    </div>
  )
}
