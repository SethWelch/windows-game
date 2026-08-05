import { APP_LIST } from './apps.ts'
import { DEFAULT_MIN_SIZE } from './constants.ts'
import type { AppDefinition, Size } from './types.ts'

const BY_ID = new Map(APP_LIST.map((a) => [a.id, a]))

export const getApp = (id: string): AppDefinition | undefined => BY_ID.get(id)

export const minSizeOf = (app: AppDefinition): Size =>
  app.minSize ?? DEFAULT_MIN_SIZE

export const desktopApps = () => APP_LIST.filter((a) => a.showOnDesktop)
/**
 * Everything under All Programs, pinned or not — which is what XP showed there.
 * The pinned list itself is a user decision and lives in os/startMenu.ts;
 * `startMenuSection: 'pinned'` only seeds its default.
 */
export const allPrograms = () => APP_LIST.filter((a) => a.startMenuSection)

export interface ProgramFolder {
  /** Empty for the root. */
  name: string
  folders: ProgramFolder[]
  apps: AppDefinition[]
}

/**
 * All Programs as a tree, assembled from each app's own `startMenuFolder` so that
 * `APP_LIST` stays the one place an app is declared.
 *
 * Folders come before programs and both are alphabetical, which is the order the
 * Start menu always sorted itself into. Built once: `APP_LIST` is a constant, so
 * there is nothing to recompute.
 */
function buildProgramTree(): ProgramFolder {
  const root: ProgramFolder = { name: '', folders: [], apps: [] }

  for (const app of allPrograms()) {
    let node = root
    for (const name of app.startMenuFolder ?? []) {
      let child = node.folders.find((f) => f.name === name)
      if (!child) {
        child = { name, folders: [], apps: [] }
        node.folders.push(child)
      }
      node = child
    }
    node.apps.push(app)
  }

  const sort = (folder: ProgramFolder) => {
    folder.folders.sort((a, b) => a.name.localeCompare(b.name))
    folder.apps.sort((a, b) => a.label.localeCompare(b.label))
    folder.folders.forEach(sort)
  }
  sort(root)
  return root
}

export const PROGRAM_TREE = buildProgramTree()
