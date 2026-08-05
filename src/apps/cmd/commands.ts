import { ROOT_ID, fs, getChildren, getNode } from '@/os/fs.ts'
import type { FsNode } from '@/os/fs.ts'
import { DRIVE, commas, displayPath, dosStamp, resolve, resolveTarget, sizeOf } from './paths.ts'

/**
 * The command table. Each command returns the lines it printed — no direct access
 * to the screen — so the component stays a renderer and every command is a plain
 * function of the filesystem plus its arguments.
 */

export interface CommandContext {
  /** Node id of the current directory. */
  cwd: string
  chdir: (nodeId: string) => void
  cls: () => void
  exit: () => void
  setTitle: (title: string) => void
}

export type Command = (ctx: CommandContext, args: string[], rest: string) => string[]

const NOT_FOUND = ['The system cannot find the path specified.']
const SYNTAX = ['The syntax of the command is incorrect.']
const DENIED = ['Access is denied.']

/** Free space on a drive that doesn't exist has to come from somewhere. */
const FREE_BYTES = 10_485_760

function dir(ctx: CommandContext, args: string[]): string[] {
  const spec = args.find((a) => !a.startsWith('/'))
  const folder = spec ? resolve(ctx.cwd, spec) : getNode(ctx.cwd)
  if (!folder) return ['File Not Found']
  if (folder.kind !== 'folder') {
    return [
      ` Directory of ${displayPath(folder.parentId ?? ROOT_ID)}`,
      '',
      `${dosStamp(folder.modified)}${String(commas(sizeOf(folder))).padStart(18)} ${folder.name}`,
      `${'1 File(s)'.padStart(25)}${commas(sizeOf(folder)).padStart(15)} bytes`,
    ]
  }

  const entries = getChildren(folder.id)
  const out = [
    ` Volume in drive ${DRIVE} has no label.`,
    ' Volume Serial Number is 1A2B-3C4D',
    '',
    ` Directory of ${displayPath(folder.id)}`,
    '',
  ]

  // `.` and `..` are listed everywhere except the drive root.
  const dots = folder.parentId ? ['.', '..'] : []
  for (const dot of dots) {
    out.push(`${dosStamp(folder.modified)}    <DIR>          ${dot}`)
  }

  let files = 0
  let bytes = 0
  for (const node of entries) {
    if (node.kind === 'folder') {
      out.push(`${dosStamp(node.modified)}    <DIR>          ${node.name}`)
    } else {
      files++
      bytes += sizeOf(node)
      out.push(`${dosStamp(node.modified)}${commas(sizeOf(node)).padStart(18)} ${node.name}`)
    }
  }

  const dirs = entries.filter((n) => n.kind === 'folder').length + dots.length
  out.push(
    `${`${files} File(s)`.padStart(25)}${commas(bytes).padStart(15)} bytes`,
    `${`${dirs} Dir(s)`.padStart(24)}${commas(FREE_BYTES).padStart(16)} bytes free`,
  )
  return out
}

function cd(ctx: CommandContext, args: string[]): string[] {
  if (!args.length) return [displayPath(ctx.cwd)]
  const target = resolve(ctx.cwd, args[0])
  if (!target) return NOT_FOUND
  if (target.kind !== 'folder') return ['The directory name is invalid.']
  ctx.chdir(target.id)
  return []
}

function type(ctx: CommandContext, args: string[]): string[] {
  if (!args.length) return SYNTAX
  const node = resolve(ctx.cwd, args[0])
  if (!node) return ['The system cannot find the file specified.']
  if (node.kind === 'folder') return ['Access is denied.']
  return (node.content ?? '').split('\n')
}

/** `echo text`, plus `> file` and `>> file`, which is most of why echo exists. */
function echo(ctx: CommandContext, _args: string[], rest: string): string[] {
  // No leading space required — `echo a>b` redirects, and so does a bare `echo >f`,
  // which writes an empty file. `\S+$` keeps the target to the last token, so
  // `echo 5 > 3 is true` is text rather than a redirect.
  const redirect = /(>>?)\s*(\S+)\s*$/.exec(rest)
  const text = (redirect ? rest.slice(0, redirect.index) : rest).trim()

  if (!redirect) return [text || 'ECHO is on.']

  const target = resolveTarget(ctx.cwd, redirect[2])
  if (!target) return NOT_FOUND
  const append = redirect[1] === '>>'
  const existing = target.existing

  if (existing && existing.kind !== 'file') return DENIED
  if (existing) {
    const before = append ? `${existing.content ?? ''}\n` : ''
    fs.writeFile(existing.id, `${before}${text}`)
  } else {
    fs.createFile(target.parent.id, target.name, text)
  }
  return []
}

function md(ctx: CommandContext, args: string[]): string[] {
  if (!args.length) return SYNTAX
  const target = resolveTarget(ctx.cwd, args[0])
  if (!target) return NOT_FOUND
  if (target.existing) return ['A subdirectory or file already exists.']
  fs.createFolder(target.parent.id, target.name)
  return []
}

function rd(ctx: CommandContext, args: string[]): string[] {
  if (!args.length) return SYNTAX
  const node = resolve(ctx.cwd, args[0])
  if (!node || node.kind !== 'folder') return NOT_FOUND
  if (node.system) return DENIED
  if (getChildren(node.id).length && !args.includes('/s')) {
    return ['The directory is not empty.']
  }
  fs.remove(node.id)
  return []
}

function del(ctx: CommandContext, args: string[]): string[] {
  const spec = args.find((a) => !a.startsWith('/'))
  if (!spec) return SYNTAX
  const node = resolve(ctx.cwd, spec)
  if (!node) return ['Could Not Find ' + spec]
  if (node.kind === 'folder') return DENIED
  if (node.system) return DENIED
  fs.remove(node.id)
  return []
}

function copy(ctx: CommandContext, args: string[]): string[] {
  if (args.length < 2) return SYNTAX
  const source = resolve(ctx.cwd, args[0])
  if (!source) return ['The system cannot find the file specified.']

  // `copy a b` where b is a folder copies into it; otherwise b is the new name.
  const asFolder = resolve(ctx.cwd, args[1])
  if (asFolder?.kind === 'folder') {
    if (!fs.copy(source.id, asFolder.id)) return DENIED
    return ['        1 file(s) copied.']
  }

  const target = resolveTarget(ctx.cwd, args[1])
  if (!target) return NOT_FOUND
  if (source.kind !== 'file') return DENIED
  fs.saveAs(target.parent.id, target.name, source.content ?? '')
  return ['        1 file(s) copied.']
}

function move(ctx: CommandContext, args: string[]): string[] {
  if (args.length < 2) return SYNTAX
  const source = resolve(ctx.cwd, args[0])
  if (!source) return ['The system cannot find the file specified.']
  if (source.system) return DENIED

  const asFolder = resolve(ctx.cwd, args[1])
  if (asFolder?.kind === 'folder') {
    if (!fs.move(source.id, asFolder.id)) return DENIED
    return ['        1 file(s) moved.']
  }
  // Moving onto a name that isn't a folder is a rename in place.
  const target = resolveTarget(ctx.cwd, args[1])
  if (!target) return NOT_FOUND
  if (target.parent.id !== source.parentId && !fs.move(source.id, target.parent.id)) {
    return DENIED
  }
  // `fs.rename` refuses a no-op, and `fs.move` mutates the node's name in place —
  // so after `move notes.txt sub\notes.txt` the name is already right, and asking
  // for it again would report a failure that didn't happen.
  if (source.name !== target.name && !fs.rename(source.id, target.name)) return DENIED
  return ['        1 file(s) moved.']
}

function ren(ctx: CommandContext, args: string[]): string[] {
  if (args.length < 2) return SYNTAX
  const node = resolve(ctx.cwd, args[0])
  if (!node) return ['The system cannot find the file specified.']
  if (node.system) return DENIED
  if (!fs.rename(node.id, args[1])) return ['A duplicate file name exists.']
  return []
}

/** cmd's box-drawing tree, root name shouted in capitals as it always was. */
function tree(ctx: CommandContext, args: string[]): string[] {
  const root = resolve(ctx.cwd, args.find((a) => !a.startsWith('/')) ?? '.')
  if (!root || root.kind !== 'folder') return NOT_FOUND

  const showFiles = args.some((a) => a.toLowerCase() === '/f')
  const out = [displayPath(root.id).toUpperCase()]

  const walk = (node: FsNode, prefix: string) => {
    const children = getChildren(node.id).filter(
      (c) => showFiles || c.kind === 'folder',
    )
    children.forEach((child, i) => {
      const last = i === children.length - 1
      out.push(`${prefix}${last ? '└───' : '├───'}${child.name}`)
      if (child.kind === 'folder') walk(child, `${prefix}${last ? '    ' : '│   '}`)
    })
  }
  walk(root, '')
  if (out.length === 1) out.push('No subfolders exist')
  return out
}

const HELP = [
  'For more information on a specific command, type HELP command-name',
  'CD             Displays the name of or changes the current directory.',
  'CLS            Clears the screen.',
  'COPY           Copies one or more files to another location.',
  'DATE           Displays or sets the date.',
  'DEL            Deletes one or more files.',
  'DIR            Displays a list of files and subdirectories in a directory.',
  'ECHO           Displays messages, or turns command echoing on or off.',
  'EXIT           Quits the CMD.EXE program (command interpreter).',
  'HELP           Provides Help information for Windows commands.',
  'IPCONFIG       Displays all current TCP/IP network configuration values.',
  'MD             Creates a directory.',
  'MOVE           Moves one or more files from one directory to another.',
  'PING           Sends ICMP echo requests to a host.',
  'RD             Removes a directory.',
  'REN            Renames a file or files.',
  'TIME           Displays or sets the system time.',
  'TITLE          Sets the window title for a CMD.EXE session.',
  'TREE           Graphically displays the directory structure.',
  'TYPE           Displays the contents of a text file.',
  'VER            Displays the Windows version.',
  'VOL            Displays a disk volume label and serial number.',
]

export const COMMANDS: Record<string, Command> = {
  dir,
  cd,
  chdir: cd,
  type,
  echo,
  md,
  mkdir: md,
  rd,
  rmdir: rd,
  del,
  erase: del,
  copy,
  move,
  ren,
  rename: ren,
  tree,

  cls: (ctx) => {
    ctx.cls()
    return []
  },
  exit: (ctx) => {
    ctx.exit()
    return []
  },
  title: (ctx, _args, rest) => {
    ctx.setTitle(rest.trim() || 'Command Prompt')
    return []
  },
  ver: () => ['', 'Microsoft Windows XP [Version 5.1.2600]', ''],
  vol: () => [
    ` Volume in drive ${DRIVE} has no label.`,
    ' Volume Serial Number is 1A2B-3C4D',
  ],
  date: () => [`The current date is: ${new Date().toLocaleDateString('en-US')}`],
  time: () => [`The current time is: ${new Date().toLocaleTimeString('en-US')}`],
  help: () => HELP,

  ipconfig: () => [
    '',
    'Windows IP Configuration',
    '',
    'Ethernet adapter Local Area Connection:',
    '',
    '        Connection-specific DNS Suffix  . : ',
    '        IP Address. . . . . . . . . . . . : 192.168.0.104',
    '        Subnet Mask . . . . . . . . . . . : 255.255.255.0',
    '        Default Gateway . . . . . . . . . : 192.168.0.1',
    '',
  ],

  ping: (_ctx, args) => {
    const host = args[0]
    if (!host) {
      return ['Usage: ping [-t] [-a] [-n count] target_name']
    }
    // No network to reach, so the replies are as invented as the IP address above.
    const ip = '93.184.216.34'
    return [
      '',
      `Pinging ${host} [${ip}] with 32 bytes of data:`,
      '',
      ...[41, 39, 40, 39].map(
        (ms) => `Reply from ${ip}: bytes=32 time=${ms}ms TTL=54`,
      ),
      '',
      `Ping statistics for ${ip}:`,
      '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),',
      'Approximate round trip times in milli-seconds:',
      '    Minimum = 39ms, Maximum = 41ms, Average = 39ms',
      '',
    ]
  },
}

/** Split a line into its verb and arguments, honouring "quoted names". */
export function tokenize(line: string): { verb: string; args: string[]; rest: string } {
  const trimmed = line.trim()
  const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed)
  if (!match) return { verb: '', args: [], rest: '' }
  const rest = match[2]
  const args = (rest.match(/"[^"]*"|\S+/g) ?? []).map((a) => a.replace(/"/g, ''))
  return { verb: match[1].toLowerCase(), args, rest }
}

export function run(ctx: CommandContext, line: string): string[] {
  const { verb, args, rest } = tokenize(line)
  if (!verb) return []
  const command = COMMANDS[verb]
  if (!command) {
    return [
      `'${verb}' is not recognized as an internal or external command,`,
      'operable program or batch file.',
    ]
  }
  return command(ctx, args, rest)
}
