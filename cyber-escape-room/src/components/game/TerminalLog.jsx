export default function TerminalLog({ log }) {
  return (
    <section className="surface p-[22px] max-sm:p-[17px]">
      <div className="mb-5 flex items-center justify-between gap-2.5 border-b border-[#16405d] pb-[15px]">
        <h3 className="m-0 text-[15px] tracking-[1.5px]">TERMINAL LOG</h3>
        <span className="pill">SYS.LOG</span>
      </div>

      <div className="font-mono text-[11px] leading-[1.8] text-[#78f8d9]" aria-live="polite">
        {log.map((entry, i) => (
          <div key={`${i}-${entry.text}`} className={entry.dim ? 'text-[#5e8ca7]' : ''}>
            &gt; {entry.text}
          </div>
        ))}
      </div>
    </section>
  )
}
