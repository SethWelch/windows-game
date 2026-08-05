/**
 * The roster, and the voices behind it.
 *
 * There is no network here, so every buddy is a small keyword machine with a
 * personality: a few things it recognises, a few things it says otherwise, and a
 * typing speed. That last one matters more than it sounds — a reply that appears
 * instantly reads as a script, and one that takes a plausible few seconds reads as
 * a person.
 */

export type Group = 'Buddies' | 'Family' | 'Co-Workers'

export const GROUPS: Group[] = ['Buddies', 'Family', 'Co-Workers']

export interface Persona {
  /** Used when they open the conversation themselves. */
  hello: string[]
  /** First match wins. */
  rules: [RegExp, string[]][]
  /** When nothing matches. */
  filler: string[]
  /** Characters per second, for the pause before a reply lands. */
  cps: number
}

export interface Buddy {
  id: string
  screenName: string
  group: Group
  online: boolean
  /** Minutes idle, shown in parentheses the way AIM did. */
  idle?: number
  /** Their away message, if they're away. */
  away?: string
  persona: Persona
}

export const BUDDIES: Buddy[] = [
  {
    id: 'skater',
    screenName: 'SkaterBoi2001',
    group: 'Buddies',
    online: true,
    persona: {
      cps: 9,
      hello: ['sup', 'yo whats up', 'hey u there?'],
      rules: [
        [/\b(hi|hey|hello|sup|yo)\b/i, ['sup', 'hey', 'yoooo']],
        [
          /\b(homework|school|class|test|math)\b/i,
          ['ugh dont remind me', 'i didnt do it lol', 'is that due tomorrow??'],
        ],
        [
          /\b(skate|board|ollie|tony hawk)\b/i,
          ['i landed a kickflip yesterday', 'THPS2 is the greatest game ever made', 'we should go to the park'],
        ],
        [/\?$/, ['idk', 'maybe', 'probably lol']],
      ],
      filler: ['lol', 'haha yea', 'thats crazy', 'brb my mom needs the phone', 'g2g dinner'],
    },
  },
  {
    id: 'ashley',
    screenName: 'xoxoAshley88',
    group: 'Buddies',
    online: true,
    persona: {
      cps: 13,
      hello: ['HI!!! :-)', 'omg hii!!'],
      rules: [
        [/\b(hi|hey|hello)\b/i, ['HII!! :-)', 'heyyy!! :-)']],
        [
          /\b(how are you|how r u|hows it going)\b/i,
          ['im GREAT!!! :-) how r u???', 'sooo good!! :-)'],
        ],
        [
          /\b(sad|bad|tired|sick)\b/i,
          ['awww :-( im sorry!!', 'noooo :-( that stinks!!'],
        ],
        [/\b(music|song|cd|radio)\b/i, ['have u heard the new nsync?!?!', 'i love that song!!! :-)']],
      ],
      filler: ['omg totally!!', 'hahaha :-)', 'thats sooo funny!!', 'awwww :-)', 'ttyl!! :-)'],
    },
  },
  {
    id: 'coffee',
    screenName: 'CoffeeCat_99',
    group: 'Buddies',
    online: true,
    idle: 14,
    away: 'brb, coffee run. leave a message!',
    persona: {
      cps: 11,
      hello: ['hey, you around?'],
      rules: [
        [/\b(coffee|caffeine|latte)\b/i, ['now youre speaking my language', 'third cup today. dont judge me']],
        [/\b(hi|hey|hello)\b/i, ['hey! sorry, was afk', 'oh hi!']],
      ],
      filler: ['sorry, i was away from the keyboard', 'back! what did i miss?', 'haha, fair enough'],
    },
  },
  {
    id: 'dad',
    screenName: 'DadsPC',
    group: 'Family',
    online: true,
    persona: {
      cps: 4,
      hello: ['IS THIS WORKING'],
      rules: [
        [/\b(hi|hey|hello)\b/i, ['HELLO. THIS IS DAD.', 'HI. IS THE CAPS LOCK ON?']],
        [/\b(dinner|food|eat)\b/i, ['DINNER IS AT SIX. DO NOT BE LATE.', 'YOUR MOTHER MADE MEATLOAF.']],
        [/\b(money|allowance|\$)\b/i, ['WE WILL DISCUSS THIS IN PERSON.']],
        [/\b(bye|g2g|later)\b/i, ['GOODBYE. LOVE, DAD.']],
      ],
      filler: ['OK.', 'HOW DO I ATTACH A PHOTO', 'I DO NOT UNDERSTAND.', 'PLEASE CALL THE HOUSE PHONE.'],
    },
  },
  {
    id: 'grandma',
    screenName: 'GrandmaJo',
    group: 'Family',
    online: false,
    persona: {
      cps: 5,
      hello: ['Hello, dear.'],
      rules: [[/\b(hi|hey|hello)\b/i, ['Hello, dear! How are you?']]],
      filler: ['That is wonderful, dear.', 'Do you need anything?'],
    },
  },
  {
    id: 'dave',
    screenName: 'BossManDave',
    group: 'Co-Workers',
    online: true,
    away: 'In a meeting until 4.',
    persona: {
      cps: 15,
      hello: ['got a minute?'],
      rules: [
        [/\b(report|deadline|friday|tps)\b/i, ['is that on my desk yet?', 'end of day works.']],
        [/\b(hi|hey|hello)\b/i, ['hi. quick question.']],
        [/\b(sick|vacation|pto|off)\b/i, ['send me an email so i have a record.']],
      ],
      filler: ['noted.', 'lets circle back on that.', 'sounds good.'],
    },
  },
  {
    id: 'mel',
    screenName: 'mel_from_accounting',
    group: 'Co-Workers',
    online: false,
    persona: {
      cps: 12,
      hello: ['hi! quick expense question'],
      rules: [[/\b(receipt|expense|invoice)\b/i, ['i need that in triplicate, sorry!']]],
      filler: ['ok!', 'ill look into it.'],
    },
  },
]

export const getBuddy = (id: string): Buddy | undefined =>
  BUDDIES.find((b) => b.id === id)

/**
 * `turn` walks each list instead of picking at random, so a buddy never says the
 * same thing twice in a row and a conversation reads as if it's going somewhere.
 */
export function replyTo(buddy: Buddy, incoming: string, turn: number): string {
  for (const [pattern, answers] of buddy.persona.rules) {
    if (pattern.test(incoming)) return answers[turn % answers.length]
  }
  const { filler } = buddy.persona
  return filler[turn % filler.length]
}

/** How long this buddy would take to type `text`, in milliseconds. */
export const typingTime = (buddy: Buddy, text: string) =>
  Math.min(6000, Math.max(700, (text.length / buddy.persona.cps) * 1000))
