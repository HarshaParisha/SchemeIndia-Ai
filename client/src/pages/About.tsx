import { Github, Instagram, Linkedin, Globe } from 'lucide-react'

export default function About() {
  const socials = [
    { label: 'Website', href: 'https://harshaparisha.in/', Icon: Globe },
    { label: 'Instagram', href: 'https://www.instagram.com/harsha._.l4?igsh=MXhtNWVkZ3psM21lMA%3D%3D&utm_source=qr', Icon: Instagram },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/parisha-harshavardhan/', Icon: Linkedin },
    { label: 'GitHub', href: 'https://github.com/HarshaParisha', Icon: Github },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[28px] font-semibold tracking-tight text-brand-dark">About SchemeIndia AI</div>
        <div className="mt-2 text-sm text-brand-muted">A simple way to discover government schemes you may qualify for.</div>
      </div>

      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[20px] font-semibold text-brand-dark">Hi, I’m Harsha</div>
        <div className="mt-3 text-sm leading-relaxed text-brand-muted">
          I’m a developer, and I built SchemeIndia AI because I kept seeing people miss real benefits simply because the information was scattered across portals, hard to
          understand, or buried under jargon. The goal is simple: help anyone quickly find schemes that are relevant and show exactly what to do next.
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {socials.map((s) => (
            <a
              key={s.href}
              className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-dark shadow-subtle hover:bg-brand-bg"
              href={s.href}
              target="_blank"
              rel="noreferrer"
            >
              <s.Icon className="h-4 w-4 text-brand-muted" aria-hidden="true" />
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[20px] font-semibold text-brand-dark">What SchemeIndia AI does</div>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted">
            <div>Shows Central + State schemes in one place.</div>
            <div>Explains benefits, eligibility hints, documents, and steps in plain language.</div>
            <div>Links back to official portals so you can verify and apply confidently.</div>
          </div>
        </div>

        <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
          <div className="text-[20px] font-semibold text-brand-dark">How the “AI” part works</div>
          <div className="mt-3 text-sm leading-relaxed text-brand-muted">
            You answer a short set of questions. SchemeIndia AI uses smart matching to filter schemes based on your state and basic eligibility signals, then prioritises
            what looks most relevant.
          </div>
          <div className="mt-4 text-sm leading-relaxed text-brand-muted">
            It’s designed to save you time — but it’s not a substitute for official rules. Always confirm on the official government website before applying.
          </div>
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[20px] font-semibold text-brand-dark">Why “Sahyogi”</div>
        <div className="mt-3 text-sm leading-relaxed text-brand-muted">
          “Sahyogi” means a helpful companion. The Sahyogi AI chat on the home page is designed to guide you quickly using simple options and show schemes with benefits
          and eligibility at a glance.
        </div>
        <div className="mt-4 text-sm leading-relaxed text-brand-muted">
          It asks a short set of questions and gives results in seconds using the data already available on this website.
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-white p-6 shadow-subtle">
        <div className="text-[20px] font-semibold text-brand-dark">Trust and data</div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted">
          <div>We only ask for what helps with matching (like state and basic profile choices).</div>
          <div>We don’t sell user data.</div>
          <div>Every scheme page includes an official link for the latest rules and deadlines.</div>
        </div>
      </div>

      <div className="rounded-card border border-brand-border bg-brand-bg p-6">
        <div className="text-sm font-semibold text-brand-dark">Note</div>
        <div className="mt-2 text-sm leading-relaxed text-brand-muted">
          Scheme details can change. If anything looks outdated or incorrect, the official portal is the source of truth.
        </div>
      </div>
    </div>
  )
}
