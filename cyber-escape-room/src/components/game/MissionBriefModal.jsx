import { useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import { MISSION_BRIEF } from '../../data/levels.js'

/** Accessible dialog for displaying the classified mission brief. */
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
        className="surface relative w-full max-w-[480px] p-6 shadow-[0_0_50px_#00d9ff15]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cyber-muted transition hover:bg-[#16405d]/40 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4 flex items-center gap-2.5 border-b border-[#16405d] pb-3.5 pr-8">
          <FileText className="size-4 text-cyber-cyan" />
          <h3 id="brief-title" className="m-0 text-[15px] tracking-[1.5px]">
            MISSION BRIEF
          </h3>
          <span className="pill ml-auto">CLASSIFIED</span>
        </div>

        <ol className="m-0 list-decimal space-y-2.5 pl-5 text-[13px] leading-relaxed text-[#b3d0e4]">
          {MISSION_BRIEF.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>


        <button type="button" className="btn btn-primary w-full" onClick={onClose} autoFocus>
          ACKNOWLEDGED
        </button>
      </div>
    </div>
  )
}
