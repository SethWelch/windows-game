/**
 * What the POST screen reports.
 *
 * A real power-on self test tells you what it found in the machine, so this one does
 * too — every value here is read off the browser rather than invented. Most of these
 * APIs are non-standard or deprecated, and half of them are missing on any given
 * engine, which is why everything is optional and falls back to `Unknown`. That is
 * also period-accurate: a 1998 POST screen was mostly `None` and `Unknown`.
 */

interface NetworkInformation {
  downlink?: number
  downlinkMax?: number
  rtt?: number
  type?: string
  effectiveType?: string
}

interface ProbedNavigator extends Navigator {
  /** Chrome only, and deliberately capped at 8 to blunt fingerprinting. */
  deviceMemory?: number
  connection?: NetworkInformation
}

export interface SpecRow {
  label: string
  value: string
}

const UNKNOWN = 'Unknown'
export const commas = (n: number) => n.toLocaleString('en-US')

const nav = () => navigator as ProbedNavigator

/** Platform, user agent and vendor — the machine's own account of itself. */
export function identityRows(): SpecRow[] {
  return [
    { label: 'Platform', value: navigator.platform || UNKNOWN },
    { label: 'Agent', value: navigator.userAgent || UNKNOWN },
    { label: 'Vendor', value: navigator.vendor || UNKNOWN },
  ]
}

export function hardwareRows(): SpecRow[] {
  const memory = nav().deviceMemory
  return [
    {
      label: 'Cores',
      value: navigator.hardwareConcurrency
        ? String(navigator.hardwareConcurrency)
        : UNKNOWN,
    },
    // The API rounds down and stops at 8, so "at least" is the honest phrasing.
    { label: 'RAM', value: memory ? `At Least ${memory} GiB` : UNKNOWN },
  ]
}

export function networkRows(): SpecRow[] {
  const c = nav().connection
  return [
    {
      label: 'Bandwidth Estimated',
      value: c?.downlink === undefined ? UNKNOWN : `${c.downlink}Mbps`,
    },
    {
      label: 'Bandwidth Max',
      value: c?.downlinkMax === undefined ? UNKNOWN : `${c.downlinkMax}Mbps`,
    },
    { label: 'Ping', value: c?.rtt === undefined ? UNKNOWN : `${c.rtt}ms` },
    { label: 'Connection Type', value: c?.type ?? UNKNOWN },
    { label: 'Connection Effective Type', value: c?.effectiveType ?? UNKNOWN },
  ]
}

export function clockRows(): SpecRow[] {
  let zone = UNKNOWN
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || UNKNOWN
  } catch {
    // Some engines have no zone to report; `Unknown` is the honest answer.
  }
  return [
    { label: 'Current Date Time', value: new Date().toLocaleString('en-GB') },
    { label: 'Timezone', value: zone },
  ]
}

/**
 * Storage is the only figure that has to be asked for rather than read, so it comes
 * back later — which is why the screen shows it as still being counted, the way a
 * BIOS sat on `Detecting IDE...` for a moment.
 */
export async function storageRows(): Promise<SpecRow[]> {
  try {
    const { quota, usage } = (await navigator.storage?.estimate?.()) ?? {}
    if (quota === undefined || usage === undefined) {
      return [
        { label: 'Storage Quota', value: UNKNOWN },
        { label: 'Storage Usage', value: UNKNOWN },
      ]
    }
    const share = quota > 0 ? ((usage / quota) * 100).toFixed(4) : '0'
    return [
      { label: 'Storage Quota', value: `${commas(quota)}B` },
      { label: 'Storage Usage', value: `${commas(usage)}B (${share}%)` },
    ]
  } catch {
    return [
      { label: 'Storage Quota', value: UNKNOWN },
      { label: 'Storage Usage', value: UNKNOWN },
    ]
  }
}

/**
 * Lays a row out as `label : value`, wrapping the value under itself — the user
 * agent string is far too long for one line and a BIOS would have wrapped it too.
 */
export function layout(rows: SpecRow[], labelWidth: number, wrap: number): string[] {
  const out: string[] = []
  for (const row of rows) {
    const words = row.value.split(' ')
    const lines: string[] = ['']
    for (const word of words) {
      const line = lines[lines.length - 1]
      if (line && line.length + word.length + 1 > wrap) lines.push(word)
      else lines[lines.length - 1] = line ? `${line} ${word}` : word
    }
    lines.forEach((line, i) => {
      const label = i === 0 ? row.label.padEnd(labelWidth) : ''.padEnd(labelWidth)
      const gap = i === 0 ? ':' : ' '
      out.push(`${label}${gap}${line}`)
    })
  }
  return out
}
