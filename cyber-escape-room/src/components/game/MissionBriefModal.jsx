import { useEffect } from 'react'
import { MISSION_BRIEF } from '../../data/levels.js'

/** Replaces the original window.alert() mission brief with an accessible dialog. */
export default function MissionBriefModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#02070fcc] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-title"
        onClick={(e) => e.stopPropagation()}
        className="surface w-full max-w-[460px] p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-2.5 border-b border-[#16405d] pb-3.5">
          <h3 id="brief-title" className="m-0 text-[15px] tracking-[1.5px]">
            MISSION BRIEF
          </h3>
          <span className="pill">CLASSIFIED</span>
        </div>

        <ol className="m-0 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-[#b3d0e4]">
          {MISSION_BRIEF.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>

        <p className="mb-5 mt-4 text-xs text-cyber-muted">
          Tip: answers are checked without case sensitivity.
        </p>

        <button type="button" className="btn btn-primary w-full" onClick={onClose} autoFocus>
          ACKNOWLEDGED
        </button>
      </div>
    </div>
  )
}
