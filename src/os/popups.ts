import { useSyncExternalStore } from 'react'
import { audio } from './audio.ts'
import { TASKBAR_H } from './constants.ts'
import type { ArtName } from '@/components/Popups/adArt.tsx'

/**
 * Pop-up advertisements, of the sort a 2001 machine collected by existing.
 *
 * They are not windows: no titlebar of ours, no taskbar button, no window manager.
 * That's the point — the menace of these things was that they weren't part of the
 * shell and didn't behave like it. They get their own layer above the windows and
 * below the taskbar, so the Start button always works.
 *
 * The variety is the feature. A screenful of these never looked like one program had
 * made them: some wore a convincing system dialog, some were a whole browser window
 * with a hijacked search bar down the side, some were a 468x60 strip, and some were a
 * wall of coloured words. So the shape is split in two — a `Chrome` for the frame and
 * an `AdBody` for what's inside it — and the templates below mix them freely.
 *
 * Every word of copy is invented. No real brand, product, or person appears here.
 *
 * Every way out is real. Each ad closes on its X, Escape closes the lot, and
 * `closeAll` cancels whatever was still queued to arrive.
 */

/** A run of text with its own colouring, for the ads that mix six fonts a line. */
export interface Word {
  text: string
  color?: string
  bg?: string
  italic?: boolean
  /** Sets it a size larger than its neighbours. */
  big?: boolean
}

export type Glyph = 'info' | 'warn' | 'error' | 'question' | 'shield'

/** The frame: a system dialog, a bare browser strip, a whole browser, or nothing. */
export type Chrome = 'xp' | 'thin' | 'ie' | 'none'

interface Frame {
  chrome: Chrome
  title: string
  /** Shown in the address bar, for `ie` chrome. */
  url?: string
  /** `ie` chrome only: the adware search column that installed itself. */
  sidebar?: boolean
  /** Illustration to drop in, where the body has somewhere to put one. */
  art?: ArtName
  /**
   * An invented company mark. `at` matters: a few of these signed themselves along
   * the bottom, a few tucked the logo into a corner of the artwork, and a few led
   * with it as a banner. Almost all of them didn't bother at all, which is why only
   * a handful of the templates below carry one.
   */
  brand?: { name: string; mark: number; at: BrandAt }
  /**
   * What flashes, for the ones that couldn't win your eye by standing still: the
   * whole background cycling, the frame strobing, or the hues rolling through.
   */
  blink?: Blink
  /** Preferred width and height; each spawn jitters it. */
  size: [number, number]
}

/** Where the house mark sits. */
export type BrandAt = 'strip' | 'corner' | 'banner'

/** How it demands attention. */
export type Blink = 'bg' | 'frame' | 'hue'

export type AdBody =
  /** Wears a convincing system dialog: glyph, a few lines, a button or two. */
  | { kind: 'dialog'; glyph: Glyph; lines: string[]; buttons: string[] }
  /** Headline, paragraph, one enormous button. The default shape of the genre. */
  | { kind: 'pitch'; headline: string; body: string; cta: string }
  /** A wall of coloured words on a saturated ground. */
  | { kind: 'words'; background: string; words: Word[] }
  /** A lead line over caption tiles, where the pictures never loaded. */
  | { kind: 'tiles'; lead: Word[]; tiles: { caption: string; hue: number }[] }
  /** Sets itself in a serif and expects to be believed. */
  | { kind: 'serif'; headline: string; body: string; link: string }
  /** The prize certificate: dotted border, spec bullets, starburst, small print. */
  | {
      kind: 'certificate'
      headline: string
      lead: string
      specs: string[]
      link: string
      disclaimer: string
    }
  /** "Before you go, did you know..." — a tick list and a corner flash. */
  | { kind: 'exit'; lead: string; ticks: string[]; cta: string; flash: string }
  /** An arrow-bulleted list of things that will not be explained. */
  | { kind: 'teasers'; heading: string; items: string[] }
  /** A product nobody can see, at a price nobody asked for. */
  | { kind: 'price'; product: string; was: string; now: string }
  /** Fields, dropdowns, and a submit button the width of the window. */
  | {
      kind: 'form'
      heading: string
      fields: { label: string; options?: string[] }[]
      cta: string
    }
  /** The fake security centre, complete with a table of your own details. */
  | {
      kind: 'security'
      heading: string
      body: string
      rows: [string, string][]
      cta: string
    }
  /** "Thank you for installing" — the one that arrives after the damage. */
  | { kind: 'installed'; message: string; link: string; button: string }
  /** Pick one. Any one. */
  | { kind: 'radio'; heading: string; options: string[]; cta: string }
  /** A question with answers that are all the same answer. */
  | { kind: 'quiz'; question: string; answers: string[] }
  /** The 468x60 banner, the standard unit of the whole era. */
  | { kind: 'strip'; words: Word[]; cta: string; background: string }
  /** An odometer, counting something. */
  | { kind: 'counter'; lead: string; digits: string; trail: string }
  /** A scan that is always scanning. */
  | { kind: 'progress'; heading: string; note: string; cta: string }
  /** Small print across the bottom of the screen, explaining nothing. */
  | { kind: 'disclaimer'; text: string }
  /** Sponsored links, indistinguishable from results. */
  | { kind: 'links'; heading: string; links: { title: string; note: string }[] }
  /** Where a photograph would have gone. */
  | { kind: 'photo'; caption: Word[]; hue: number }
  /** A banner whose text slides past forever, because it could not sit still. */
  | { kind: 'marquee'; words: Word[]; tail: string }
  /**
   * A mascot holding a sign, with the copy written onto the sign. The artwork is line
   * art with a see-through middle, so the sign shows the ad's own background.
   */
  | { kind: 'mascot'; sign: string[]; caption: string }
  /**
   * A shooting gallery. Targets drift about and clicking one gets you what clicking
   * anything else in here gets you, which is another advertisement.
   */
  | { kind: 'game'; heading: string; prize: string; targets: number; cta: string }
  /** Pick a box. Whichever you pick is the winning box. */
  | { kind: 'boxes'; heading: string; boxes: string[]; note: string }

export type AdTemplate = Frame & AdBody

const YELLOW = '#ffd21a'
const RED = '#d81020'
const BLUE = '#1030c0'
const GREEN = '#0a8f2a'
const PINK = '#ff2f9c'
const CYAN = '#00c8e0'
const WHITE = '#ffffff'

export const AD_TEMPLATES: AdTemplate[] = [
  // ---------------------------------------------------------------- dialogs
  {
    chrome: 'xp',
    title: 'Welcome!',
    size: [352, 168],
    kind: 'dialog',
    glyph: 'info',
    lines: [
      'Your free trial has already begun.',
      'There is nothing further you need to do.',
      'There is nothing you can do.',
    ],
    buttons: ['OK'],
  },
  {
    chrome: 'xp',
    title: 'Subscription Notice',
    size: [364, 176],
    kind: 'dialog',
    glyph: 'warn',
    lines: [
      'Your subscription expires in 4 minutes.',
      'You did not start a subscription.',
      'It expires anyway.',
    ],
    buttons: ['Renew', 'Later'],
  },
  {
    chrome: 'xp',
    title: 'CRITICAL SYSTEM ERROR',
    size: [356, 160],
    blink: 'frame',
    kind: 'dialog',
    glyph: 'error',
    lines: [
      'A required component could not be found.',
      'Click below and we will install eleven.',
    ],
    buttons: ['Repair', 'Cancel'],
  },
  {
    chrome: 'xp',
    title: '???',
    size: [330, 150],
    kind: 'dialog',
    glyph: 'question',
    lines: ['Set this as your home page, your search page,', 'and your desktop?'],
    buttons: ['Yes', 'Yes'],
  },

  // ---------------------------------------------------------------- pitches
  {
    chrome: 'thin',
    title: 'offer.html',
    size: [268, 226],
    art: 'desktop',
    kind: 'pitch',
    headline: 'Download MORE RAM — free!',
    body: 'Add 512 MB without opening your case. No hardware. No physics.',
    cta: 'DOWNLOAD',
  },
  {
    chrome: 'thin',
    title: 'promise.jpeg',
    size: [286, 224],
    art: 'people',
    kind: 'pitch',
    headline: 'This is not an advertisement',
    body: 'It is a friendly notice from a company that admires you very much.',
    cta: 'CONTINUE',
  },
  {
    chrome: 'xp',
    title: 'Your Savings',
    size: [292, 226],
    art: 'piggy',
    kind: 'pitch',
    headline: 'You could be saving',
    body: 'Our advisers have reviewed the savings you are not making and would like to discuss them.',
    cta: 'REVIEW MY SAVINGS',
  },
  {
    chrome: 'ie',
    title: 'SmileyPack - Microsoft Internet Explorer',
    url: 'http://ads3.wintersale.net/smileys/get.asp?ref=99',
    size: [430, 300],
    art: 'photo-sale',
    kind: 'pitch',
    headline: '2,000 FREE smileys',
    body: 'Winking, dancing, and 1,998 that are also winking. Works in any e-mail.',
    cta: 'GET THEM ALL',
  },

  // ---------------------------------------------------------------- words
  {
    chrome: 'xp',
    title: 'WATCHOUTFORTHESE!!!',
    size: [300, 214],
    blink: 'bg',
    kind: 'words',
    background: '#fff200',
    words: [
      { text: 'SEVEN', color: RED, big: true },
      { text: 'THINGS', color: '#000' },
      { text: 'IN YOUR', color: BLUE },
      { text: 'KITCHEN', color: GREEN, big: true },
      { text: 'THAT ARE', color: '#000' },
      { text: 'SECRETLY', color: PINK, italic: true },
      { text: 'A KITCHEN', color: '#000', big: true },
    ],
  },
  {
    chrome: 'thin',
    title: 'breaking.html',
    size: [262, 200],
    blink: 'hue',
    kind: 'words',
    background: '#0018a8',
    words: [
      { text: 'THE', color: WHITE },
      { text: 'NEWS', color: YELLOW, big: true },
      { text: 'HAS BEEN', color: WHITE },
      { text: 'DOUBLED', color: CYAN, big: true },
      { text: 'and nobody', color: '#c8d4ff', italic: true },
      { text: 'CAN STOP IT', color: YELLOW },
    ],
  },
  {
    chrome: 'none',
    title: '',
    size: [232, 196],
    kind: 'words',
    background: '#101010',
    words: [
      { text: 'THE', color: '#8a8a8a' },
      { text: 'FUTURE', color: '#00ff66', big: true },
      { text: 'IS ALREADY', color: WHITE },
      { text: 'BEHIND YOU', color: RED, big: true },
      { text: 'act now', color: YELLOW, italic: true },
    ],
  },

  // ---------------------------------------------------------------- tiles
  {
    chrome: 'thin',
    title: 'interests.html',
    size: [330, 194],
    kind: 'tiles',
    lead: [
      { text: 'You may', color: '#000' },
      { text: 'ALSO', color: RED, big: true },
      { text: 'like:', color: '#000' },
    ],
    tiles: [
      { caption: 'Gravel', hue: 30 },
      { caption: 'A Warm Bus', hue: 190 },
      { caption: 'Regret', hue: 320 },
    ],
  },
  {
    chrome: 'xp',
    title: 'Thanks for choosing us!',
    size: [340, 200],
    kind: 'tiles',
    lead: [
      { text: 'Our growth is', color: '#0a3a00' },
      { text: 'ORGANIC', color: GREEN, big: true },
      { text: 'like a field of:', color: '#0a3a00', italic: true },
    ],
    tiles: [
      { caption: 'Poppies', hue: 0 },
      { caption: 'Antennas', hue: 210 },
      { caption: 'More Fields', hue: 100 },
    ],
  },

  // ---------------------------------------------------------------- serif
  {
    chrome: 'xp',
    title: 'Please sign here :)',
    size: [292, 260],
    art: 'people',
    kind: 'serif',
    headline: 'Sign this petition',
    body: 'We will not tell you what it says. It is a very good one and you will like it.',
    link: 'Add my name',
  },
  {
    chrome: 'ie',
    title: 'A message to you - Microsoft Internet Explorer',
    url: 'http://www.a-message-to-you.example/read.htm',
    size: [452, 310],
    art: 'person',
    kind: 'serif',
    headline: 'You are only human',
    body: 'We are a company, which is better. Let us hold your files for a while. We will keep them somewhere safe and adjacent.',
    link: 'Hand them over',
  },

  // ---------------------------------------------------------------- certificate
  {
    chrome: 'ie',
    title: 'ExclusiveRewards - Microsoft Internet Explorer',
    url: 'http://ads1.rewardpath.example/claim?id=916066',
    size: [600, 322],
    sidebar: true,
    art: 'desktop',
    brand: { name: 'REWARDPATH', mark: 0, at: 'strip' },
    kind: 'certificate',
    headline: 'CONGRATULATIONS!',
    lead: "You've been chosen to receive a FREE* Desktop Computer!",
    specs: [
      '2.66 GHz processor, 256 MB memory',
      '80 GB hard disk, 48x CD-RW drive',
      '19-inch monitor (18 inches viewable)',
    ],
    link: 'Click Here to Claim Your FREE* Desktop Computer!',
    disclaimer: '*with participation in our program',
  },

  // ---------------------------------------------------------------- exit
  {
    chrome: 'xp',
    title: 'Special Offer',
    size: [340, 236],
    art: 'phone',
    brand: { name: 'TELEBRITE', mark: 3, at: 'corner' },
    kind: 'exit',
    lead: 'Before you go, did you know...',
    ticks: [
      'You can add broadband to any broadband',
      'Works with and enhances your existing wires',
      'Built-in protection for you and your family',
    ],
    cta: 'GET A FREE TRIAL',
    flash: 'Up to 45 days FREE',
  },

  // ---------------------------------------------------------------- teasers
  {
    chrome: 'thin',
    title: "What's New",
    size: [300, 268],
    blink: 'bg',
    art: 'photo-dinosaur',
    kind: 'teasers',
    heading: "WHAT'S NEW THIS WEEK",
    items: [
      'Science Proves It: Sitting Down Causes Sitting',
      'Ten Foods You Are Already Eating',
      'Look What They Found In A Cave (Rocks)',
      'Did You See What The Weather Did?',
      'If You Get This E-Mail, It Is An E-Mail',
    ],
  },

  // ---------------------------------------------------------------- price
  {
    chrome: 'thin',
    title: 'Advertisement',
    size: [300, 246],
    art: 'printer',
    brand: { name: 'PRINTERWORLD', mark: 1, at: 'strip' },
    blink: 'frame',
    kind: 'price',
    product: 'Colour Printer',
    was: 'Under $1,000 usd',
    now: '$999',
  },

  // ---------------------------------------------------------------- form
  {
    chrome: 'ie',
    title: 'INSTANT WIN - FIRST ENTRY FREE - Microsoft Internet Explorer',
    url: 'http://instantwin.example/enter.php',
    size: [470, 342],
    art: 'photo-wallet',
    kind: 'form',
    heading: 'ENTER TO WIN INSTANTLY',
    fields: [
      { label: 'Telephone' },
      { label: 'Postcode' },
      { label: 'I am a', options: ['A Winner', 'Not Sure'] },
      { label: 'Looking for', options: ['A Prize', 'Anything'] },
    ],
    cta: 'CLAIM MY PRIZE',
  },

  // ---------------------------------------------------------------- security
  {
    chrome: 'ie',
    title: 'Security Centre - Microsoft Internet Explorer',
    url: 'http://scan.protect-alert.example/warn.html',
    size: [560, 300],
    sidebar: true,
    brand: { name: 'PROTECT-ALERT', mark: 2, at: 'corner' },
    kind: 'security',
    heading: 'Your system may be at risk',
    body: 'Our Security Centre has detected potential vulnerabilities on your PC. One of the processes running has already sent the following:',
    rows: [
      ['IP Address', '192.168.1.1'],
      ['Browser', 'Netscape Navigator 4.7'],
      ['Location', 'Your Area'],
      ['Threat Level', 'Extremely Purple'],
    ],
    cta: 'REMOVE THREATS NOW',
  },

  // ---------------------------------------------------------------- installed
  {
    chrome: 'xp',
    title: 'Setup Complete',
    size: [372, 174],
    brand: { name: 'SIDEFIND TOOLBAR', mark: 5, at: 'banner' },
    kind: 'installed',
    message:
      'Thank you for installing our search tools! You now have unlimited access to free entertainment.',
    link: 'Visit customer support',
    button: 'Close',
  },

  // ---------------------------------------------------------------- radio
  {
    chrome: 'thin',
    title: 'Join your friends',
    size: [286, 226],
    art: 'photo-dice',
    kind: 'radio',
    heading: 'Choose a game to begin:',
    options: ['Cards', 'Wheel', 'The Other One'],
    cta: 'Click Here!',
  },

  // ---------------------------------------------------------------- quiz
  {
    chrome: 'thin',
    title: 'Tickle - IQ and Personality Tests',
    size: [296, 244],
    blink: 'bg',
    art: 'photo-dice',
    kind: 'quiz',
    question: 'Which of these is a number?',
    answers: ['Seven', 'Also seven', 'A different seven'],
  },

  // ---------------------------------------------------------------- strip
  {
    chrome: 'none',
    title: '',
    size: [468, 60],
    blink: 'hue',
    kind: 'strip',
    background: 'linear-gradient(90deg, #0018a8 0%, #4a00b0 100%)',
    words: [
      { text: 'FREE', color: YELLOW, bg: RED, big: true },
      { text: 'RINGTONES', color: WHITE, big: true },
      { text: 'for a phone', color: '#c8d4ff', italic: true },
      { text: 'YOU MAY OWN', color: YELLOW },
    ],
    cta: 'CLICK',
  },
  {
    chrome: 'none',
    title: '',
    size: [468, 60],
    art: 'photo-sale',
    kind: 'strip',
    background: 'linear-gradient(90deg, #0a6a2a 0%, #0f8a58 52%, #063a18 100%)',
    words: [
      { text: 'LOWER', color: WHITE, big: true },
      { text: 'YOUR', color: YELLOW },
      { text: 'RATES', color: WHITE, big: true },
      { text: 'to a lower rate', color: '#b8e0ff', italic: true },
    ],
    cta: 'APPLY',
  },

  // ---------------------------------------------------------------- marquee
  {
    chrome: 'none',
    title: '',
    size: [420, 46],
    blink: 'bg',
    kind: 'marquee',
    words: [
      { text: 'CONGRATULATIONS', color: '#101010', big: true },
      { text: 'you are the', color: '#101010', italic: true },
      { text: 'VISITOR', color: RED, big: true },
      { text: 'we were waiting for', color: '#101010', italic: true },
    ],
    tail: 'CLICK ANYWHERE ON THIS BANNER',
  },
  {
    chrome: 'thin',
    title: 'banner.html',
    size: [340, 86],
    blink: 'hue',
    kind: 'marquee',
    words: [
      { text: 'HOT', color: YELLOW, big: true },
      { text: 'DEALS', color: WHITE, big: true },
      { text: 'on things', color: '#c8d4ff', italic: true },
      { text: 'YOU ALREADY OWN', color: CYAN },
    ],
    tail: 'this banner does not stop',
  },

  // ---------------------------------------------------------------- counter
  {
    chrome: 'thin',
    title: 'counter.cgi',
    size: [250, 212],
    blink: 'bg',
    art: 'photo-pay',
    kind: 'counter',
    lead: 'YOU ARE VISITOR NUMBER',
    digits: '0999999',
    trail: 'The millionth visitor wins. It will not be you.',
  },

  // ---------------------------------------------------------------- progress
  {
    chrome: 'xp',
    title: 'Scanning...',
    size: [376, 196],
    brand: { name: 'PC TUNE-UP 2003', mark: 4, at: 'banner' },
    kind: 'progress',
    heading: 'Scanning your computer for problems',
    note: 'Found 4,182 problems. Most of them are this window.',
    cta: 'FIX ALL',
  },

  // ---------------------------------------------------------------- disclaimer
  {
    chrome: 'none',
    title: '',
    size: [560, 74],
    kind: 'disclaimer',
    text: 'This public service announcement is brought to you by desktop advertising. Future advertisements will not display this notice and are not endorsed by, or delivered by, the sites that you visit. They may be automatically removed at any time, or never.',
  },

  // ---------------------------------------------------------------- links
  {
    chrome: 'thin',
    title: 'sideFind',
    size: [242, 214],
    kind: 'links',
    heading: 'Sponsored Results',
    links: [
      { title: 'Top 50 Sites, Ranked By Quality', note: 'Ranked by who paid.' },
      { title: 'Best Prices On Everything', note: 'One price. Everything.' },
      { title: 'Find Anyone, Anywhere', note: 'Mostly finds you.' },
    ],
  },

  // ---------------------------------------------------------------- photo
  {
    chrome: 'ie',
    title: 'TXT CHAT - Microsoft Internet Explorer',
    url: 'http://txtchat.example/first-match-free',
    size: [470, 268],
    sidebar: true,
    art: 'person',
    kind: 'photo',
    caption: [
      { text: 'CHAT', color: YELLOW, big: true },
      { text: 'WITH A', color: WHITE },
      { text: 'STRANGER', color: PINK, big: true },
      { text: 'about your warranty', color: WHITE, italic: true },
    ],
    hue: 300,
  },
  {
    chrome: 'none',
    title: '',
    size: [300, 240],
    art: 'photo-cottage',
    blink: 'hue',
    kind: 'photo',
    caption: [
      { text: 'A', color: WHITE },
      { text: 'HOUSE', color: YELLOW, big: true },
      { text: 'could be', color: WHITE, italic: true },
      { text: 'YOURS', color: '#00ff88', big: true },
    ],
    hue: 90,
  },
  // ------------------------------------------------------- photographic
  {
    chrome: 'ie',
    title: 'Have you had an accident? - Microsoft Internet Explorer',
    url: 'http://claims.wehelpyou.example/assess.asp',
    size: [472, 252],
    art: 'photo-crutches',
    kind: 'serif',
    headline: 'Have you had an accident?',
    body: 'You may be entitled to compensation, and we may be entitled to some of it. No accident is too old, too small, or too imaginary.',
    link: 'Begin my assessment',
  },
  {
    chrome: 'thin',
    title: 'lucky.html',
    size: [300, 244],
    art: 'photo-dice',
    blink: 'bg',
    kind: 'pitch',
    headline: 'THE TABLES ARE OPEN',
    body: 'Nine hundred games, one of which is dice. Your first hundred chips are on us and so is the second hundred.',
    cta: 'PLAY NOW',
  },
  {
    chrome: 'thin',
    title: 'Advertisement',
    size: [286, 252],
    art: 'photo-wallet',
    kind: 'price',
    product: 'Consolidate Everything',
    was: 'You currently pay 24.9% APR',
    now: '0%',
  },
  {
    chrome: 'ie',
    title: 'Pre-Approved Application - Microsoft Internet Explorer',
    url: 'http://apply.cardoffer.example/preapproved.php',
    size: [480, 340],
    art: 'photo-card',
    kind: 'form',
    heading: 'YOU ARE PRE-APPROVED',
    fields: [
      { label: 'Full Name' },
      { label: 'Annual Income', options: ['Prefer not to say', 'Some'] },
      { label: 'Existing Cards', options: ['None', 'Several', 'All of them'] },
    ],
    cta: 'ACCEPT MY CARD',
  },
  {
    chrome: 'xp',
    title: '3-D Dinosaurs Screensaver',
    size: [304, 250],
    art: 'photo-dinosaur',
    kind: 'pitch',
    headline: 'DINOSAURS on your desktop',
    body: 'Fully three-dimensional. Walks about. Cannot be closed, removed, or reasoned with.',
    cta: 'INSTALL FREE',
  },
  {
    chrome: 'none',
    title: '',
    size: [278, 232],
    art: 'photo-shed',
    blink: 'hue',
    kind: 'pitch',
    headline: '500 CHANNELS',
    body: 'One dish, fitted free, on whatever building you have. Four hundred of the channels are shopping.',
    cta: 'BOOK MY FITTING',
  },
  {
    chrome: 'thin',
    title: 'checkout.html',
    size: [268, 226],
    art: 'photo-pay',
    kind: 'photo',
    caption: [
      { text: 'YOU', color: WHITE, big: true },
      { text: 'HAVE', color: YELLOW },
      { text: 'THINGS', color: WHITE, big: true },
      { text: 'in a basket somewhere', color: '#ffe8a0', italic: true },
    ],
    hue: 0,
  },
  {
    chrome: 'ie',
    title: 'WIN THIS HOME - Microsoft Internet Explorer',
    url: 'http://dreamhome.prizedraw.example/enter?ref=44190',
    size: [604, 306],
    sidebar: true,
    art: 'photo-cottage',
    brand: { name: 'DREAMHOME DRAW', mark: 1, at: 'corner' },
    kind: 'certificate',
    headline: 'WIN THIS HOME!',
    lead: 'One entrant will receive this three-bedroom property, fully furnished!',
    specs: [
      'Freehold, with garden and off-road parking',
      'Council tax and insurance paid for one year',
      'Winner responsible for transfer, tax, and location',
    ],
    link: 'Click Here to Enter the Free* Prize Draw!',
    disclaimer: '*entry requires a telephone call charged at a premium rate',
  },
  {
    chrome: 'none',
    title: '',
    size: [258, 236],
    art: 'photo-mascot',
    kind: 'mascot',
    sign: ['YOU HAVE', 'MONEY WAITING'],
    caption: 'click me before he puts the sign down',
  },
  // ------------------------------------------------------- games and winners
  {
    chrome: 'none',
    title: '',
    size: [304, 224],
    blink: 'bg',
    kind: 'game',
    heading: 'SHOOT THE TARGET TO WIN',
    prize: 'TODAY: a laptop computer',
    targets: 5,
    cta: 'FIRE',
  },
  {
    chrome: 'thin',
    title: 'shoot.html',
    size: [326, 200],
    blink: 'frame',
    kind: 'game',
    heading: 'HIT 3 TARGETS — YOU HAVE 3 SHOTS',
    prize: '2 shots remaining',
    targets: 8,
    cta: 'AIM',
  },
  {
    chrome: 'xp',
    title: 'Pick a Box!',
    size: [316, 212],
    blink: 'bg',
    kind: 'boxes',
    heading: 'PICK THE WINNING BOX',
    boxes: ['1', '2', '3'],
    note: 'One of these has your prize in it. All of them do.',
  },
  {
    chrome: 'none',
    title: '',
    size: [462, 54],
    art: 'photo-sale',
    blink: 'bg',
    kind: 'marquee',
    words: [
      { text: 'YOU HAVE WON', color: RED, big: true },
      { text: 'you personally', color: '#101010', italic: true },
      { text: 'AND NOBODY ELSE', color: BLUE, big: true },
    ],
    tail: 'CLICK HERE FOR YOUR PRIZE',
  },
  {
    chrome: 'none',
    title: '',
    size: [468, 60],
    art: 'photo-pay',
    blink: 'frame',
    kind: 'strip',
    background: 'linear-gradient(90deg, #b00018 0%, #e8a000 50%, #b00018 100%)',
    words: [
      { text: 'WINNER', color: WHITE, big: true },
      { text: 'selected at', color: '#ffe8a0', italic: true },
      { text: 'RANDOM', color: YELLOW, big: true },
    ],
    cta: 'CLAIM',
  },
  {
    chrome: 'none',
    title: '',
    size: [244, 188],
    blink: 'bg',
    kind: 'words',
    background: '#ff00c8',
    words: [
      { text: 'CLICK', color: YELLOW, big: true },
      { text: 'HERE', color: WHITE, big: true },
      { text: 'FOR', color: '#101010' },
      { text: 'PRIZE', color: CYAN, big: true },
      { text: 'no purchase, no draw,', color: WHITE, italic: true },
      { text: 'NO PRIZE', color: YELLOW },
    ],
  },

]

/** The starburst a quarter of them wear. */
const BADGES = [
  'YOU LIKED THIS!',
  'FREE!',
  'WOW!',
  'NEW!',
  'ACT NOW',
  '#1 CHOICE',
  'AS SEEN ONLINE',
]

export interface Ad {
  id: number
  template: AdTemplate
  x: number
  y: number
  width: number
  height: number
  badge?: string
}

/**
 * The first burst. The ceiling is one of each template — a screenful of these was
 * relentless but never repetitive, and two identical windows read as our bug rather
 * than as period detail.
 */
const FIRST_WAVE = 36

let ads: Ad[] = []
let seq = 0
const pending = new Set<number>()
const listeners = new Set<() => void>()

function commit(next: Ad[]) {
  ads = next
  listeners.forEach((l) => l())
}

/** A template that isn't already up, or nothing if they all are. */
function unused(): AdTemplate | undefined {
  const showing = new Set(ads.map((ad) => ad.template))
  const free = AD_TEMPLATES.filter((t) => !showing.has(t))
  return free[Math.floor(Math.random() * free.length)]
}

function make(template: AdTemplate): Ad {
  // Each template knows roughly how big it wants to be; the jitter stops any two of
  // the same kind lining up. Strips and disclaimers keep their proportions.
  const fixed =
    template.kind === 'strip' ||
    template.kind === 'disclaimer' ||
    template.kind === 'marquee'
  const width = template.size[0] + (fixed ? 0 : Math.round(Math.random() * 44 - 12))
  const height = template.size[1] + (fixed ? 0 : Math.round(Math.random() * 32 - 10))
  const maxX = Math.max(0, window.innerWidth - width - 8)
  const maxY = Math.max(0, window.innerHeight - TASKBAR_H - height - 8)

  return {
    id: ++seq,
    template,
    x: 8 + Math.round(Math.random() * maxX),
    y: 8 + Math.round(Math.random() * maxY),
    width,
    height,
    // No starburst on the banners: it's 58px square and they aren't much taller.
    badge:
      height >= 110 && Math.random() < 0.24
        ? BADGES[Math.floor(Math.random() * BADGES.length)]
        : undefined,
  }
}

export const popups = {
  /** One more, if there's a template left that isn't already on screen. */
  spawn() {
    const template = unused()
    if (!template) return
    commit([...ads, make(template)])
  },

  /**
   * The burst. Staggered rather than all at once, because they never arrived all at
   * once — they kept coming while you were still closing the first one. The interval
   * tightens as the wave grew, so thirty-six of them still land inside four seconds
   * rather than trickling in for six.
   */
  infect() {
    audio.play('exclamation')
    for (let i = 0; i < FIRST_WAVE; i++) {
      const timer = window.setTimeout(
        () => {
          pending.delete(timer)
          popups.spawn()
        },
        120 + i * 90,
      )
      pending.add(timer)
    }
  },

  close(id: number) {
    if (!ads.some((a) => a.id === id)) return
    commit(ads.filter((a) => a.id !== id))
  },

  closeAll() {
    // Cancels the queue too. Closing them all and then watching more arrive would be
    // authentic and also unforgivable.
    pending.forEach((timer) => window.clearTimeout(timer))
    pending.clear()
    if (ads.length) commit([])
  },

  count: () => ads.length,
}

export function useAds(): Ad[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => ads,
    () => ads,
  )
}
