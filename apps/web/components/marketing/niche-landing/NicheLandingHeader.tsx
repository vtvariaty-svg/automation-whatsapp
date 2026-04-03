import Link from 'next/link'

interface NicheLandingHeaderProps {
  primaryCTA: string
  primaryHref: string
}

/** Slim LP header — logo + "Entrar" link (desktop) + primary CTA.
 *  No full nav to avoid distraction on paid traffic pages. */
export function NicheLandingHeader({ primaryCTA, primaryHref }: NicheLandingHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="Variaty — página inicial"
          >
            <img src="/logo.webp" alt="Variaty" className="h-12 w-auto" />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
            >
              Entrar
            </Link>
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-md hover:shadow-blue-200/60 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              data-track="header_cta"
            >
              {primaryCTA}
            </Link>
          </div>

        </div>
      </div>
    </header>
  )
}
