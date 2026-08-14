import {
  BEST_VIEWED,
  BULLET,
  ENVELOPE,
  NETSCAPE_NOW,
  NEW_BADGE,
  RAINBOW_RULE,
  STAR_TILE,
  UNDER_CONSTRUCTION,
  WEBRING,
  hitCounter,
} from './webImages.ts'

/**
 * The web, circa 1997. Two sites, written in the HTML people actually wrote:
 * `<center>`, `<font>`, layout tables with chiselled borders, body attributes for
 * colour, spacer GIFs' spiritual cousins, and a hit counter.
 *
 * Each page is a whole document rather than a fragment, because the browser
 * renders it in a sandboxed `srcdoc` iframe — so these get real user-agent
 * defaults and are sealed off from the shell's own stylesheet, which is the only
 * way "base HTML" means anything.
 */

export interface Page {
  /** Canonical, as shown in the Location bar. */
  url: string
  title: string
  /** Everything inside `<body>`, plus the body tag's own attributes. */
  bodyAttrs?: string
  html: string
}

/**
 * Navigator's default stylesheet — the browser's, not the pages'.
 *
 * The grey canvas lives on `html` rather than `body` on purpose: a page that sets
 * `bgcolor` paints its own body over the top, and a page that doesn't gets the
 * grey showing through, which is exactly how Navigator behaved. Setting it on
 * `body` here would make the default un-overridable, since presentational
 * attributes lose to author CSS.
 */
const UA_STYLE = `
  html { background: #c0c0c0; }
  body {
    color: #000;
    margin: 8px;
    font: 16px/1.16 'Times New Roman', Times, serif;
  }
  a:link { color: #0000ee; }
  a:visited { color: #551a8b; }
  a:active { color: #ff0000; }
  /* The one tag only Netscape ever supported. No modern engine still does it. */
  blink { animation: ns-blink 1s step-end infinite; }
  @keyframes ns-blink { 50% { visibility: hidden; } }
  /* The chiselled rule and table borders of the era, which modern defaults
     flattened into hairlines. */
  hr {
    height: 0;
    border: 0;
    border-top: 1px solid #808080;
    border-bottom: 1px solid #ffffff;
    margin: 7px 0;
  }
  table[border] { border-style: outset; }
  table[border] td, table[border] th { border-style: inset; border-width: 1px; }
  /* Nothing was antialiased or smoothly scaled in 1997. */
  img { image-rendering: pixelated; }
  h1, h2, h3 { font-weight: bold; margin: 0.4em 0; }
`

/**
 * Splices our own markup into the front of someone else's `<head>`, adding a head if
 * the document hasn't got one — which most hand-written HTML hasn't.
 *
 * Prepending rather than appending is what makes the cascade come out right: anything
 * the document declares for itself then comes after ours and wins, which is the
 * position a user-agent stylesheet is supposed to be in.
 */
export function withHead(html: string, extra: string): string {
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (open) => `${open}${extra}`)
    : `<head>${extra}</head>${html}`
}

/**
 * Prepends a `<base>` to fetched markup.
 *
 * A `srcdoc` document's own base URL is `about:srcdoc`, so every relative link and
 * image in someone else's HTML would be unresolvable without this. With it they
 * resolve against the real host — images load straight from there, and `a.href`
 * gives an absolute address the chrome can navigate to.
 */
export function withBase(address: string, html: string): string {
  return withHead(html, `<base href="${address.replace(/"/g, '&quot;')}">`)
}

/** The `<title>` out of fetched markup, so the window caption can be right. */
export function titleIn(html: string): string | undefined {
  return /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || undefined
}

/** The markup as authored — what View Source should show. */
export function sourceFor(page: Page): string {
  return `<HTML>
<HEAD>
<TITLE>${page.title}</TITLE>
</HEAD>
<BODY ${page.bodyAttrs ?? ''}>
${page.html}
</BODY>
</HTML>`
}

/**
 * What the renderer actually parses: the same markup with the browser's default
 * stylesheet in front of it. That block is the *browser's*, not the page's, which
 * is why View Source doesn't show it.
 */
export function documentFor(page: Page): string {
  return `<!doctype html>
<html>
<head>
<title>${page.title}</title>
<style>${UA_STYLE}</style>
</head>
<body ${page.bodyAttrs ?? ''}>
${page.html}
</body>
</html>`
}

/** Enough escaping for text going into an element, which is all `<title>` needs. */
const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * What Composer previews: a draft's markup with its style sheet behind it, rendered
 * through the same defaults Navigator gives a real page.
 *
 * Sharing `UA_STYLE` with `documentFor` is the whole point — a preview that rendered
 * against the host browser's modern defaults would show you Arial and hairline rules
 * for a page that lands in Times with chiselled ones. Same argument `SaverCanvas`
 * makes about the screen saver preview: it must not be able to show you something
 * other than what you get.
 *
 * The author's CSS is emitted *after* `UA_STYLE` so it wins on equal specificity, the
 * position a real user-agent sheet gets for free from being a weaker cascade origin.
 * Put it first and `body { font-family }` in the draft would silently lose to Times.
 *
 * A draft that is already a whole document gets spliced rather than wrapped. People
 * paste `<html>` into an HTML editor, and wrapping one document inside another leaves
 * the parser to guess which `<body>` you meant.
 */
export function draftDocument(html: string, css: string, title: string): string {
  const sheets = `<style>${UA_STYLE}</style>${css.trim() ? `<style>${css}</style>` : ''}`
  if (/^\s*(<!doctype|<html)/i.test(html)) return withHead(html, sheets)
  return `<!doctype html>
<html>
<head>
<title>${escapeText(title)}</title>
${sheets}
</head>
<body>
${html}
</body>
</html>`
}

const DIRECTORY: Page = {
  url: 'http://www.websurfer.net/directory/',
  title: "The WebSurfer's Directory",
  // No bgcolor at all: this is the page that shows Navigator's grey default.
  html: `
<center>
<h1><font face="Arial,Helvetica" color="#000080">The WebSurfer's Directory</font></h1>
<font size="-1"><i>A Hand-Picked Guide to the Information Superhighway</i></font>
<br>
<img src="${RAINBOW_RULE}" width="468" height="7" alt="" border="0">
</center>

<p>
<font size="-1">
Welcome, cybernaut! This directory is maintained <b>by hand</b> and updated
whenever something worth seeing turns up. There are now <b>Twelve Thousand</b>
sites on the World Wide Web, so a guide is essential.
</font>
</p>

<center>
<table border="2" cellpadding="6" cellspacing="0" width="90%">
<tr bgcolor="#000080">
  <th><font color="#ffffff" face="Arial,Helvetica">Category</font></th>
  <th><font color="#ffffff" face="Arial,Helvetica">Featured Site</font></th>
</tr>
<tr>
  <td><font size="-1"><b>Personal Pages</b></font></td>
  <td><font size="-1">
    <a href="http://www.angelfire.com/~sprocket/">Sprocket's Home Page</a>
    <img src="${NEW_BADGE}" width="30" height="12" alt="New!" border="0">
  </font></td>
</tr>
<tr>
  <td><font size="-1"><b>Computers</b></font></td>
  <td><font size="-1">
    <a href="http://www.shareware-central.com/">Shareware Central</a>
    &nbsp;<font color="#808080">(link may be down)</font>
  </font></td>
</tr>
<tr>
  <td><font size="-1"><b>Reference</b></font></td>
  <td><font size="-1">
    <a href="http://www.encyclopedia-online.org/">The Online Encyclopaedia</a>
  </font></td>
</tr>
<tr>
  <td><font size="-1"><b>Weather</b></font></td>
  <td><font size="-1">Coming soon!</font></td>
</tr>
</table>
</center>

<hr>

<h3><font face="Arial,Helvetica">Submit a Site</font></h3>
<p><font size="-1">
Found something we've missed? <a href="mailto:webmaster@websurfer.net">Send us
mail</a> <img src="${ENVELOPE}" width="26" height="17" alt="" border="0">
and allow four to six weeks for review.
</font></p>

<hr>

<center>
<font size="-2" face="Arial,Helvetica">
This site has been visited
</font>
<br>
<img src="${hitCounter('0042871')}" width="90" height="22"
  alt="42871 visitors" border="0">
<br>
<font size="-2" face="Arial,Helvetica">times since January 1996.</font>
<p>
<img src="${NETSCAPE_NOW}" width="88" height="31" alt="Netscape Now!" border="0">
&nbsp;
<img src="${BEST_VIEWED}" width="88" height="31" alt="Best viewed at 800x600"
  border="0">
</p>
<font size="-2" face="Arial,Helvetica" color="#606060">
Last updated: 14 March 1998 &nbsp;|&nbsp; Maintained by hand in vi
</font>
</center>
`,
}

const SPROCKET: Page = {
  url: 'http://www.angelfire.com/~sprocket/',
  title: "Sprocket's Home Page!!!",
  // The full complement of body attributes — this is what page styling *was*.
  bodyAttrs: `bgcolor="#000044" background="${STAR_TILE}" text="#ffffff" link="#00ffff" vlink="#ff99ff" alink="#ff0000"`,
  html: `
<center>
<font size="+4" face="Comic Sans MS,Arial" color="#ffff00">
<b>~*~ Sprocket's Home Page ~*~</b>
</font>
<br>
<font size="+1" color="#00ff00"><blink>*** UNDER CONSTRUCTION ***</blink></font>
<br>
<img src="${UNDER_CONSTRUCTION}" width="88" height="31" alt="Under Construction"
  border="0">
<br>
<img src="${RAINBOW_RULE}" width="468" height="7" alt="" border="0">
</center>

<p>
<font size="+1" color="#ffcc00"><b>Hi and welcome to my web page!!</b></font>
<br>
My name is Dave and I am 24 years old. I made this page myself with Notepad and
it took me <b>three weeks</b>. Please sign my guestbook before you leave!
</p>

<h3><font color="#ffff00">About Me</font></h3>
<ul>
<li><img src="${BULLET}" width="13" height="13" alt="" border="0">
  I have a cat named <b>Sprocket</b>. This page is named after him.
<li><img src="${BULLET}" width="13" height="13" alt="" border="0">
  My computer is a <b>Pentium II 266 MHz</b> with <b>64 MB</b> of RAM.
<li><img src="${BULLET}" width="13" height="13" alt="" border="0">
  I have a 56k modem now so this page should load <i>really</i> fast.
<li><img src="${BULLET}" width="13" height="13" alt="" border="0">
  My favourite band is They Might Be Giants.
</ul>

<h3><font color="#ffff00">My Favourite Links</font></h3>
<center>
<table border="2" cellpadding="5" cellspacing="0" bgcolor="#000088">
<tr>
  <td><font color="#ffffff" size="-1">
    <a href="http://www.websurfer.net/directory/">The WebSurfer's Directory</a>
  </font></td>
  <td><font color="#ffffff" size="-1">
    <a href="http://www.sprocket-fan-club.net/">Sprocket Fan Club</a>
  </font></td>
</tr>
<tr>
  <td><font color="#ffffff" size="-1">
    <a href="http://www.angelfire.com/~sprocket/guestbook.html">My Guestbook</a>
  </font></td>
  <td><font color="#ffffff" size="-1">
    <a href="mailto:sprocket@angelfire.com">E-mail me!</a>
  </font></td>
</tr>
</table>
</center>

<blockquote>
<font size="-1" color="#cccccc"><i>
"The Internet is going to be the biggest thing since the fax machine."
</i><br>&nbsp;&nbsp;&nbsp;— my dad, 1996</font>
</blockquote>

<hr>

<center>
<img src="${hitCounter('0000317')}" width="90" height="22"
  alt="317 visitors" border="0">
<br>
<font size="-2">You are visitor number 317! Thanks for stopping by!!</font>
<p>
<img src="${WEBRING}" width="88" height="31" alt="WebRing" border="0">
&nbsp;
<img src="${NETSCAPE_NOW}" width="88" height="31" alt="Netscape Now!" border="0">
</p>
<font size="-2" color="#8888cc">
This page best viewed with Netscape Navigator 3.0 or higher.<br>
Last updated 08/22/1998. &copy; 1998 Dave.
</font>
</center>
`,
}

export const PAGES: Page[] = [DIRECTORY, SPROCKET]

export const HOME_URL = DIRECTORY.url

/** Bookmarks, for the Go menu and the personal toolbar. */
export const BOOKMARKS: { label: string; url: string }[] = [
  { label: "WebSurfer's Directory", url: DIRECTORY.url },
  { label: "Sprocket's Home Page", url: SPROCKET.url },
  // The one address that leaves 1997. See LIVE_HOSTS below.
  { label: 'The Old Net', url: 'https://theoldnet.com/' },
]

/** Scheme, `www.`-tolerance and trailing slashes all ignored for matching. */
function key(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/\/+$/, '')
}

const BY_KEY = new Map(PAGES.map((p) => [key(p.url), p]))

/**
 * Hosts allowed out to the real internet.
 *
 * An allowlist rather than "anything unknown", because a typo should stay inside
 * the fiction: `www.fake-site.com` gets the period 404 below, where a real lookup
 * would hand it to the host browser and we'd get *its* error page in the frame
 * instead of ours. Add a host here and Navigator will go there for real.
 *
 * A host only belongs here if it permits framing — no `X-Frame-Options`, no CSP
 * `frame-ancestors` — and actually serves something. `theoldweb.com` looks like it
 * qualifies on the first count but is a parked domain whose only content is a
 * script redirect to an ad lander, so it frames as a blank page.
 */
export const LIVE_HOSTS = ['theoldnet.com', 'web.archive.org']

const hostOf = (url: string) => key(url).split('/')[0]

export function isLive(url: string): boolean {
  const host = hostOf(url)
  return LIVE_HOSTS.some((h) => host === h || host === `www.${h}`)
}

/** The full URL to show in the Location bar for whatever the user typed. */
export function canonicalUrl(input: string): string {
  const found = BY_KEY.get(key(input))
  if (found) return found.url

  const trimmed = input.trim()
  const scheme = /^([a-z]+):\/\//i.exec(trimmed)?.[1]
  const bare = trimmed.replace(/^[a-z]+:\/\//i, '')
  // Keep an explicit scheme; otherwise the real web gets https and 1997 gets http.
  return `${scheme ?? (isLive(bare) ? 'https' : 'http')}://${bare}`
}

export const findPage = (url: string): Page | undefined => BY_KEY.get(key(url))

/** What a 1997 server said when it didn't have the file. */
export function notFoundPage(url: string): Page {
  const path = `/${key(url).split('/').slice(1).join('/')}`
  const host = key(url).split('/')[0] || 'localhost'
  return {
    url: canonicalUrl(url),
    title: '404 Not Found',
    html: `
<h1>Not Found</h1>
<p>The requested URL ${path} was not found on this server.</p>
<hr>
<address>Apache/1.3.6 Server at ${host} Port 80</address>
`,
  }
}
