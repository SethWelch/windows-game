import type { AppDefinition } from '@/os/types.ts'
import { Composer } from './Composer.tsx'
import { ComposerPreview } from './ComposerPreview.tsx'

/**
 * Composer proper. A singleton because there is one draft — see os/composer.ts for why
 * a document list is a filesystem feature rather than an editor one.
 *
 * Wide by default: the split view has to fit a line of markup and a rendered page side
 * by side, and anything narrower than this makes both halves useless at once.
 */
export const composerApp: AppDefinition = {
  id: 'composer',
  title: 'Untitled - Netscape Composer',
  label: 'Netscape Composer',
  iconId: 'composer',
  component: Composer,
  defaultSize: { width: 780, height: 540 },
  minSize: { width: 380, height: 260 },
  singleton: true,
  startMenuSection: 'programs',
  startMenuFolder: ['Netscape Communicator'],
}

/**
 * The popped-out preview. Not in any menu and not on the desktop: the only way in is
 * Composer's Pop Out button, the same arrangement `aimImApp` has with a buddy.
 *
 * Singleton, so popping out twice raises the window you already have instead of opening
 * a second copy of one document — and so Composer can find it by `appId` to know it is
 * popped out at all.
 */
export const composerPreviewApp: AppDefinition = {
  id: 'composerPreview',
  title: 'Untitled - Netscape',
  label: 'Page Preview',
  iconId: 'netscape',
  component: ComposerPreview,
  defaultSize: { width: 480, height: 420 },
  minSize: { width: 200, height: 160 },
  singleton: true,
}
