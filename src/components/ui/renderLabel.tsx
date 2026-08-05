import type { ReactNode } from 'react'

/**
 * `'&Save'` → `S̲ave`. Access-key underlines are always shown in v1; gating them
 * behind a held Alt key is a polish item.
 */
export function renderLabel(label: string): ReactNode {
  const i = label.indexOf('&')
  if (i < 0 || i === label.length - 1) return label
  return (
    <>
      {label.slice(0, i)}
      <u>{label[i + 1]}</u>
      {label.slice(i + 2)}
    </>
  )
}
