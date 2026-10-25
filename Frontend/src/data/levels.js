/**
 * CyberEscape Room – Levels Configuration
 *
 * 5 Security Levels, each containing 1 distinct cryptographic/logic question.
 *
 * Each level has a dedicated timer:
 *   Level 1: 5 minutes (300s)
 *   Level 2: 6 minutes (360s)
 *   Level 3: 7 minutes (420s)
 *   Level 4: 8 minutes (480s)
 *   Level 5: 9 minutes (540s)
 */

export const levels = [
  {
    code: '0808',
    title: 'Sequence Analysis',
    timeLimit: 300, // 5 min
    questions: [
      {
        id: 1,
        title: 'Difference Sequence',
        question: 'Find the next number: 2, 6, 15, 31, 56, 92, __?',
        answer: '49',
        hint: 'Differences between consecutive numbers are consecutive squares (4, 9, 16, 25, 36, 49). Enter 49 to proceed.',
      },
    ],
  },
  {
    title: 'Cipher Protocol',
    timeLimit: 360, // 6 min
    questions: [
      {
        id: 1,
        title: 'Caesar Shift',
        question: 'If TABLE is coded as UBCMF and CHAIR as DIBJS, how is BRICK coded?',
        answer: 'CSJDL',
        hint: 'Each letter is shifted forward by 1 in the alphabet (B→C, R→S, I→J, C→D, K→L).',
      },
    ],
  },
  {
    title: 'Letter Sequence',
    timeLimit: 420, // 7 min
    questions: [
      {
        id: 1,
        title: 'Variable Leap Sequence',
        question: 'Find the next letter: C, F, K, R, A, __?',
        answer: 'L',
        hint: 'Look at the increasing letter jumps: +3, +5, +7, +9, +11 (wrapping past Z).',
      },
    ],
  },
  {
    title: 'Signal Intercept',
    timeLimit: 480, // 8 min
    questions: [
      {
        id: 1,
        title: 'Character Frequency Riddle',
        question: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
        answer: 'M',
        hint: 'Inspect the letter composition of the words themselves, not chronological time.',
      },
    ],
  },
  {
    title: 'Final Decryption',
    timeLimit: 540, // 9 min
    timed: true,
    questions: [
      {
        id: 1,
        title: 'Reverse Clue Decryption',
        question: 'EMAN EGELLOC',
        answer: 'RAISONI',
        hint: 'Reverse the clue text to read "COLLEGE NAME". Enter the required campus institution code.',
      },
    ],
  },
]

export const TOTAL_LEVELS = levels.length
export const QUESTIONS_PER_LEVEL = 1
export const TOTAL_QUESTIONS = TOTAL_LEVELS * QUESTIONS_PER_LEVEL

export const MISSION_BRIEF = [
  'Enter the access code (0808) to breach the initial security gate.',
  'Each of the 5 levels contains 1 encrypted security challenge.',
  'Solve the challenge to clear the level and automatically advance.',
  'Each level has a countdown timer: 5 → 6 → 7 → 8 → 9 minutes.',
  'If the countdown hits 0:00 at any point during a level, you are ELIMINATED.',
  'Clear all 5 levels to escape.',
]
