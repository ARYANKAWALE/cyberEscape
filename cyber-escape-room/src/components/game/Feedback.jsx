const KIND_CLASS = {
  good: 'text-cyber-green',
  bad: 'text-cyber-red',
  '': 'text-cyber-muted',
}

export default function Feedback({ feedback }) {
  return (
    <div
      className={`mt-3 min-h-[22px] text-xs leading-relaxed ${KIND_CLASS[feedback.kind] ?? KIND_CLASS['']}`}
      aria-live="polite"
    >
      {feedback.text}
    </div>
  )
}
