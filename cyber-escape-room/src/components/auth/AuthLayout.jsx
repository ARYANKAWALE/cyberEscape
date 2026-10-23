import { Link } from 'react-router-dom'

/**
 * Split-screen shell for Login / Register: branding on the left,
 * form card on the right. Collapses to a single column on small screens.
 */
export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="relative z-[1] flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[#12476a] bg-[#030b16dd] px-[clamp(18px,4vw,56px)] py-5 shadow-[0_8px_30px_#0006]">
        <Link to="/login" className="flex items-center gap-3.5 no-underline">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-cyber-cyan text-[27px] text-cyber-cyan shadow-[0_0_18px_#00d9ff2c]">
            ⌑
          </div>
          <div>
            <h1 className="m-0 text-[clamp(18px,2.6vw,27px)] uppercase tracking-[3px] text-cyber-text">
              Cyber <span className="text-cyber-cyan">Escape Room</span>
            </h1>
            <div className="mt-1.5 text-[10px] tracking-[3px] text-cyber-muted">
              THINK / DECODE / ESCAPE
            </div>
          </div>
        </Link>
        <div className="hidden text-right text-xs tracking-[2px] text-cyber-mint sm:block">
          SYSTEM STATUS: <span>AUTH REQUIRED</span>
          <small className="mt-1 block text-[10px] text-cyber-muted">
            SECURE SESSION // LOCAL MODE
          </small>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1100px] flex-1 grid-cols-1 items-center gap-10 px-[clamp(14px,3vw,38px)] py-10 lg:grid-cols-[1.1fr_minmax(0,440px)]">
        {/* Brand / briefing column */}
        <section className="relative hidden overflow-hidden lg:block">
          <div className="pointer-events-none absolute -right-6 top-6 h-[150px] w-[150px] rotate-45 border border-[#00d9ff4a] shadow-[0_0_0_18px_#00d9ff08,0_0_0_36px_#00d9ff05]" />
          <div className="eyebrow mb-3">// OPERATIVE CLEARANCE</div>
          <h2 className="m-0 mb-4 text-[clamp(32px,4vw,52px)] uppercase leading-[1.07] tracking-[1.2px]">
            Identify yourself.
            <br />
            <span className="text-cyber-cyan [text-shadow:0_0_20px_#00d9ff45]">
              Then break in.
            </span>
          </h2>
          <p className="max-w-[480px] text-sm leading-relaxed text-[#b3d0e4]">
            Five security gates stand between you and freedom. Register an operative profile or
            sign in to resume your intrusion simulation. Credentials never leave this device.
          </p>

          <ul className="mt-8 space-y-3 font-mono text-[11px] leading-relaxed text-[#78f8d9]">
            <li>&gt; Secure channel established</li>
            <li>&gt; Awaiting operative credentials...</li>
            <li className="text-[#5e8ca7]">&gt; No session active</li>
          </ul>
        </section>

        {/* Form card */}
        <section className="surface p-[clamp(22px,3vw,34px)]">
          <div className="mb-6 border-b border-[#16405d] pb-4">
            <div className="eyebrow mb-2">{eyebrow}</div>
            <h3 className="m-0 text-[22px] tracking-[1.5px]">{title}</h3>
            {subtitle && <p className="mb-0 mt-2 text-xs leading-relaxed text-cyber-muted">{subtitle}</p>}
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-xs text-cyber-muted">{footer}</div>}
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1400px] flex-wrap justify-between gap-2.5 px-[clamp(14px,3vw,38px)] pb-[22px] text-[10px] tracking-[2px] text-[#5785a3]">
        <span>CYBER ESCAPE ROOM // THINK / DECODE / ESCAPE</span>
        {/* <span>LOCAL GAME BUILD · NO DATA SENT</span> */}
      </footer>
    </div>
  )
}
