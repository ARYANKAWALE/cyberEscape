export const levels = [
  {
    code: '0808',
    title: 'Sequence Analysis',
    question: 'Find the next number: 2, 6, 15, 31, 56, 92, __?',
    answer: '49',
    hint: 'Inspect the pattern carefully. Enter the answer to unlock the next level.',
  },
  {
    code: '30',
    title: 'Cipher Protocol',
    question: 'If TABLE is coded as UBCMF and CHAIR as DIBJS, how is BRICK coded?',
    answer: 'CSJDL',
    hint: 'Each letter is shifted one position forward in the alphabet.',
  },
  {
    code: '2026',
    title: 'Letter Sequence',
    question: 'Find the next letter: C, F, K, R, A, __?',
    answer: 'L',
    hint: 'Look at the increasing jumps between letter positions; wrap around after Z.',
  },
  {
    code: 'Hello',
    title: 'Signal Intercept',
    question: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
    answer: 'M',
    hint: 'Think about the spelling of the words, not time itself.',
  },
  {
    code: 'CLOCK',
    title: 'Final Decryption',
    question: 'EMAN EGELLOC',
    answer: 'RAISONI',
    hint: 'Reverse the message to reveal the clue. Enter the required final answer to escape.',
    /** Start a count-up stopwatch when this puzzle is revealed. No limit — it just records time. */
    timed: true,
  },
]

export const TOTAL_LEVELS = levels.length

export const MISSION_BRIEF = [
  'Enter the access code shown for each level.',
  'Solve the revealed puzzle.',
  'Correct answers unlock the next level.',
  'The final decryption is timed — a stopwatch records how long you take.',
  'Clear all five levels to escape.',
]
