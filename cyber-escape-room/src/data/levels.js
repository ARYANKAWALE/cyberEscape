/**
 * CyberEscape Room – Levels Configuration
 *
 * 5 Security Levels, each containing 2 distinct cryptographic/logic questions.
 * Both questions must be solved to clear each level.
 *
 * Time limits increase by level:
 *   Level 1: 5 minutes (300s) per question
 *   Level 2: 6 minutes (360s) per question
 *   Level 3: 7 minutes (420s) per question
 *   Level 4: 8 minutes (480s) per question
 *   Level 5: 9 minutes (540s) per question
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
      {
        id: 2,
        title: 'Binary Conversion',
        question: 'Convert the 8-bit binary byte 01000001 into standard decimal value.',
        answer: '65',
        hint: 'Binary positions from right to left are 1, 2, 4, 8, 16, 32, 64, 128. Add the values where bit is 1 (64 + 1).',
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
      {
        id: 2,
        title: 'Atbash Cipher',
        question: 'Using the reverse Atbash cipher (A↔Z, B↔Y, C↔X), decode this 4-letter operational word: GZHP',
        answer: 'TASK',
        hint: 'Pair mirror letters: G↔T, Z↔A, H↔S, P↔K.',
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
      {
        id: 2,
        title: 'Vowel Progression',
        question: 'What is the missing 5th term in this sequence: A1, E5, I9, O15, __?',
        answer: 'U21',
        hint: 'Sequential vowels paired with their numeric position in the English alphabet.',
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
      {
        id: 2,
        title: 'Hardware Security Riddle',
        question: 'I have keys but no locks. I have space but no room. You can enter, but you cannot go outside. What hardware am I?',
        answer: 'KEYBOARD',
        hint: 'The primary physical typing input device on your terminal.',
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
      {
        id: 2,
        title: 'Base64 Escape Keyword',
        question: 'Decode this Base64 ciphertext to obtain the master escape override key: RVNDQVBF',
        answer: 'ESCAPE',
        hint: 'Standard RFC 4648 Base64 decoding. Translates to an English operative verb.',
      },
    ],
  },
]

export const TOTAL_LEVELS = levels.length
export const QUESTIONS_PER_LEVEL = 2
export const TOTAL_QUESTIONS = TOTAL_LEVELS * QUESTIONS_PER_LEVEL

export const MISSION_BRIEF = [
  'Enter the access code (0808) to breach the initial security gate.',
  'Each of the 5 levels contains 2 encrypted security questions.',
  'Solve Question 1 to unlock Question 2. Solve both to clear the level.',
  'Clearing a level automatically advances you to the next level.',
  'Each question features an increasing countdown timer: 5 → 6 → 7 → 8 → 9 minutes.',
  'If the countdown hits 0:00 on any question, you are ELIMINATED.',
  'Clear all 10 questions across all 5 levels to escape.',
]
