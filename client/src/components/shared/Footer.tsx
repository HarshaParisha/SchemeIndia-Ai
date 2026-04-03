import { Link } from 'react-router-dom'
import { Github, Instagram, Linkedin, Globe } from 'lucide-react'

import { APP_NAME, APP_TAGLINE, ROUTES } from '@/lib/constants'

export default function Footer() {
  const socials = [
    { label: 'Website', href: 'https://harshaparisha.in/', Icon: Globe },
    { label: 'Instagram', href: 'https://www.instagram.com/harsha._.l4?igsh=MXhtNWVkZ3psM21lMA%3D%3D&utm_source=qr', Icon: Instagram },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/parisha-harshavardhan/', Icon: Linkedin },
    { label: 'GitHub', href: 'https://github.com/HarshaParisha', Icon: Github },
  ]

  return (
    <footer className="border-t border-brand-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="font-display text-sm font-semibold tracking-tight text-brand-dark">{APP_NAME}</div>
          <div className="mt-2 text-xs text-brand-muted">{APP_TAGLINE}</div>
          <div className="mt-4 text-xs text-brand-muted">Every scheme page includes an official link. Always verify details on the government portal.</div>
          <div className="mt-3 text-xs text-brand-muted">
            Built in public as an open project. <Link to={ROUTES.about} className="underline">Learn more</Link>
          </div>
        </div>
        <div className="text-xs text-brand-muted">
          <div className="font-semibold text-brand-dark">Links</div>
          <div className="mt-3 grid gap-2">
            <Link to={ROUTES.schemes} className="hover:underline">Browse schemes</Link>
            <Link to={ROUTES.states} className="hover:underline">States</Link>
            <Link to={ROUTES.categories} className="hover:underline">Categories</Link>
            <Link to={ROUTES.about} className="hover:underline">About</Link>
          </div>
        </div>
        <div className="text-xs text-brand-muted">
          <div className="font-semibold text-brand-dark">Disclaimer</div>
          <div className="mt-2 leading-relaxed">
            Independent platform using government data and official portals for reference. Scheme rules can change. Always confirm on the official website before applying.
          </div>
        </div>
        <div className="text-xs text-brand-muted">
          <div className="font-semibold text-brand-dark">Support</div>
          <div className="mt-2 leading-relaxed">If you are stuck, visit the relevant scheme’s official link or your nearest CSC/help centre.</div>

          <div className="mt-4">
            <div className="font-semibold text-brand-dark">Social</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-white shadow-subtle hover:bg-brand-bg"
                  aria-label={s.label}
                  title={s.label}
                >
                  <s.Icon className="h-5 w-5 text-brand-dark" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
