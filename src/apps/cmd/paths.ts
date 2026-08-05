import { ROOT_ID, getChildren, getNode, getPath } from '@/os/fs.ts'
import type { FsNode } from '@/os/fs.ts'

/**
 * DOS paths over the shell's node tree.
 *
 * `C:\` is My Computer, so `C:\My Documents` is the same folder Explorer shows —
 * the two views of the filesystem stay honest with each other. The real XP path
 * would have been `C:\Documents and Settings\Owner\My Documents`, but inventing
 * directories that no other window can see would be worse than being brief.
 */

export const DRIVE = 'C:'

/** `C:\My Documents` for a node. */
export function displayPath(nodeId: string): string {
  const chain = getPath(nodeId).slice(1)
  return chain.length ? `${DRIVE}\\${chain.map((n) => n.name).join('\\')}` : `${DRIVE}\\`
}

const isAbsolute = (spec: string) =>
  spec.startsWith('\\') || spec.startsWith('/') || /^[A-Za-z]:/.test(spec)

const segmentsOf = (spec: string) =>
  spec
    .replace(/^[A-Za-z]:/, '')
    .split(/[\\/]+/)
    .filter((s) => s !== '' && s !== '.')

const childNamed = (parentId: string, name: string): FsNode | undefined =>
  getChildren(parentId).find((n) => n.name.toLowerCase() === name.toLowerCase())

/** Walk `spec` from `cwd`. Null when any segment is missing. */
export function resolve(cwd: string, spec: string): FsNode | undefined {
  let current = getNode(isAbsolute(spec) ? ROOT_ID : cwd)
  if (!current) return undefined

  for (const segment of segmentsOf(spec)) {
    if (segment === '..') {
      current = getNode(current.parentId ?? ROOT_ID) ?? current
      continue
    }
    const next = childNamed(current.id, segment)
    if (!next) return undefined
    current = next
  }
  return current
}

/**
 * Split a path into the folder that should hold it and the final name, for the
 * commands that create things. The folder must exist; the name needn't.
 */
export function resolveTarget(
  cwd: string,
  spec: string,
): { parent: FsNode; name: string; existing?: FsNode } | undefined {
  const segments = segmentsOf(spec)
  const name = segments.pop()
  if (!name) return undefined

  const parentSpec = (isAbsolute(spec) ? '\\' : '') + segments.join('\\')
  const parent = segments.length || isAbsolute(spec) ? resolve(cwd, parentSpec) : getNode(cwd)
  if (!parent || parent.kind !== 'folder') return undefined

  return { parent, name, existing: childNamed(parent.id, name) }
}

/** `08/03/2026  02:14 PM`, the column `dir` prints. */
export function dosStamp(at: number): string {
  const d = new Date(at)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = d.getHours() % 12 || 12
  const meridiem = d.getHours() < 12 ? 'AM' : 'PM'
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}  ${pad(
    hours,
  )}:${pad(d.getMinutes())} ${meridiem}`
}

/** `1,048,576` — cmd grouped every number it printed. */
export const commas = (n: number) => n.toLocaleString('en-US')

/**
 * A node's size in bytes. Shortcuts have no content of their own, so they get the
 * nominal size a `.lnk` file had on disk.
 */
export const sizeOf = (node: FsNode) =>
  node.kind === 'shortcut' ? 512 : (node.content?.length ?? 0)
