/**
 * CyberEscape Room – Levels Configuration
 *
 * 5 Security Levels with new cryptic security puzzles:
 *   Level 1: The Encrypted Keyboard (3 min, Easy)
 *   Level 2: The Firewall Escape (4 min, Medium)
 *   Level 3: The Hacker's Identity (5 min, Medium)
 *   Level 4: The Central Server Password (6 min, Hard)
 *   Level 5: The Final Locker Breach (8 min, Expert)
 */

export const levels = [
  {
    code: '0808',
    title: 'The Encrypted Keyboard',
    difficulty: 'Easy',
    timeLimit: 180, // 3 min
    alert: 'SYSTEM ALERT: KEYBOARD PATTERN DETECTED',
    questions: [
      {
        id: 1,
        title: 'The Encrypted Keyboard',
        question: `SYSTEM ALERT: KEYBOARD PATTERN DETECTED

A hacker has hidden a numerical access key inside a digital keyboard. The numbers follow a secret mathematical pattern:

  1      4      9
 16     25     36
 49      ?     81

Your mission: Identify the missing number to decrypt the first security key.
Enter the missing number to proceed.`,
        answer: '64',
        hint: 'Inspect the sequence of consecutive squares: 1², 2², 3², 4², 5², 6², 7², 8², 9². Calculate 8².',
      },
    ],
  },
  {
    title: 'The Firewall Escape',
    difficulty: 'Medium',
    timeLimit: 240, // 4 min
    alert: 'SYSTEM ALERT: UNAUTHORIZED ACCESS DETECTED',
    questions: [
      {
        id: 1,
        title: 'The Firewall Escape',
        question: `SYSTEM ALERT: UNAUTHORIZED ACCESS DETECTED

A cybercriminal is trapped inside a high-security facility surrounded by a 30-metre digital firewall.
To escape, the criminal must climb the wall. Every minute, he climbs 5 metres but slips down 2 metres before beginning the next minute.
Once he reaches the top, he escapes immediately without slipping back.

Your mission: Calculate the minimum number of minutes required to cross the firewall.
Enter the number of minutes to unlock the next level.`,
        answer: '10',
        hint: 'After 9 minutes, net height is 9 × (5 - 2) = 27m. In the 10th minute, he climbs 5m to reach 32m (clearing 30m) without slipping back.',
      },
    ],
  },
  {
    title: "The Hacker's Identity",
    difficulty: 'Medium',
    timeLimit: 300, // 5 min
    alert: 'CONFIDENTIAL FILE: IDENTITY UNKNOWN',
    questions: [
      {
        id: 1,
        title: "The Hacker's Identity",
        question: `CONFIDENTIAL FILE: IDENTITY UNKNOWN

The security team has intercepted a hacker's encrypted identity file. His age is hidden, but two clues have been recovered.

Recovered intelligence:
1. Five years ago, the hacker's age was exactly half of the age he will be five years from now.
2. His current age is a two-digit number.

Your mission: Analyse the timeline and uncover the hacker's current age.
Enter the age to identify the suspect.`,
        answer: '15',
        hint: 'Set up the age equation: (Age - 5) = (Age + 5) / 2. Solve for Age.',
      },
    ],
  },
  {
    title: 'The Central Server Password',
    difficulty: 'Hard',
    timeLimit: 360, // 6 min
    alert: 'CRITICAL ALERT: CENTRAL SERVER LOCKED',
    questions: [
      {
        id: 1,
        title: 'The Central Server Password',
        question: `CRITICAL ALERT: CENTRAL SERVER LOCKED

A hacker has taken control of the college's central server and encrypted its access credentials. Before disappearing, the hacker left behind four clues.

Your team has intercepted the following evidence:
ENCRYPTED EVIDENCE:
1. The first digit is twice the last digit.
2. The second digit is one greater than the last digit.
3. The third digit is the sum of the first and last digits.
4. The sum of all four digits is 22.

Your mission: Decode the clues and recover the exact four-digit server password.
Enter the password to restore server access.`,
        answer: '6493',
        hint: 'Let the 4 digits be [A, B, C, D]. A = 2D, B = D + 1, C = A + D = 3D. Total: 2D + (D + 1) + 3D + D = 7D + 1 = 22 => 7D = 21 => D = 3. Find A, B, C, D.',
      },
    ],
  },
  {
    title: 'The Final Locker Breach',
    difficulty: 'Expert',
    timeLimit: 480, // 8 min
    timed: true,
    alert: 'FINAL ALERT: MASTER LOCKER ACTIVATED',
    questions: [
      {
        id: 1,
        title: 'The Final Locker Breach',
        question: `FINAL ALERT: MASTER LOCKER ACTIVATED

You have reached the final security checkpoint. A mysterious locker contains the master access key needed to complete the mission.
The locker is protected by a three-digit numerical code. Five failed attempts will permanently activate the security alarm.
Fortunately, you have recovered five previous attempts and their corresponding system responses:

RECOVERED ACCESS LOGS:
• 682: Exactly one digit is correct and in the correct position.
• 614: Exactly one digit is correct, but in the wrong position.
• 206: Exactly two digits are correct, but both are in the wrong positions.
• 738: None of these digits appears in the secret code.
• 780: Exactly one digit is correct, but in the wrong position.

Your mission: Analyse all five security logs, eliminate the incorrect possibilities, and discover the exact three-digit master code.
Enter the code to unlock the final locker and complete the mission.`,
        answer: '042',
        acceptedAnswers: ['042', '42'],
        hint: 'From 738: digits 7, 3, 8 are eliminated. From 780: 0 is correct in wrong position (not pos 3). From 682: 8 is eliminated, so 6 or 2 is in correct position. From 206 & 614: 6 is eliminated, which leaves 2 in the 3rd position (from 682), 0 in the 1st position (from 206), and 4 in the 2nd position (from 614).',
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
  'Each level has a countdown timer: 3 → 4 → 5 → 6 → 8 minutes.',
  'If the countdown hits 0:00 at any point during a level, you are ELIMINATED.',
  'Clear all 5 levels to escape.',
]
