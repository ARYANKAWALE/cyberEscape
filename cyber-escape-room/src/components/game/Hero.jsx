function startLabel({ finished, initialized }) {
  if (finished) return 'VIEW RESULTS →'
  if (initialized) return 'RESUME MISSION →'
  return 'INITIALIZE MISSION →'
}

/**
 * Welcome banner shown only on the landing page. Greets the signed-in
 * participant and hands off to the questions page via `onStart`.
 */
export default function Hero({ name, finished, initialized, onStart, onBrief }) {
  const firstName = name?.trim().split(/\s+/)[0] || 'Operative'

  return (
    <section className="surface relative flex min-h-[min(520px,70vh)] items-center overflow-hidden p-[clamp(20px,4.5vw,56px)] max-sm:min-h-0 [background:radial-gradient(ellipse_at_85%_20%,#07508070,transparent_45%),linear-gradient(115deg,#06172b,#061124_60%,#062341)]">
      <div className="pointer-events-none absolute right-[5%] top-[18%] h-[130px] w-[130px] rotate-45 border border-[#00d9ff4a] shadow-[0_0_0_18px_#00d9ff08,0_0_0_36px_#00d9ff05] max-md:h-[90px] max-md:w-[90px] max-sm:-right-[55px] max-sm:top-auto max-sm:-bottom-[36px]" />

      <div className="relative z-[1] w-full max-w-[760px]">
        <div className="eyebrow mb-3 max-sm:tracking-[2px]">
          // WELCOME TO THE CYBER ESCAPE ROOM
        </div>

        <p className="mb-3 text-[clamp(15px,2vw,18px)] leading-relaxed text-cyber-text">
          Hello, <span className="font-bold text-cyber-mint">{firstName}</span> — welcome, and thank
          you for joining this CYBER ESCAPE ROOM.
        </p>

        <h2 className="m-0 mb-3.5 text-[clamp(28px,6vw,48px)] uppercase leading-[1.07] tracking-[1.2px] max-sm:tracking-[0.5px]">
          {finished ? (
            <>
              System{' '}
              <span className="text-cyber-cyan [text-shadow:0_0_20px_#00d9ff45]">unlocked.</span>
              <br />
              You made it out.
            </>
          ) : (
            <>
              Think fast.
              <br />
              <span className="text-cyber-cyan [text-shadow:0_0_20px_#00d9ff45]">Crack the code.</span>
            </>
          )}
        </h2>

        <p className="mb-[22px] max-w-[580px] text-sm leading-relaxed text-[#b3d0e4] max-sm:text-[13px]">
          {finished
            ? 'All five security gates have been cleared. The cyber escape room is complete.'
            : 'Five security gates stand between you and freedom. Initialize the mission to open the questions — then enter each access code, solve the challenge, and unlock the next layer of the system.'}
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <button type="button" className="btn btn-primary max-sm:w-full" onClick={onStart}>
            {startLabel({ finished, initialized })}
          </button>
          <button type="button" className="btn max-sm:w-full" onClick={onBrief}>
            MISSION BRIEF
          </button>
        </div>
      </div>
    </section>
  )
}
