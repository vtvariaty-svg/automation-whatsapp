import Link from 'next/link'
import { Footer } from '@/components/marketing/landing/Footer'
import MetaPixel from '@/components/marketing/MetaPixel'
import { NicheLandingHeader } from './NicheLandingHeader'
import { NicheLandingFAQ } from './NicheLandingFAQ'
import { StickyMobileCTA } from './StickyMobileCTA'
import { UTMPersist } from './UTMPersist'
import { SectionViewTracker } from './SectionViewTracker'
import { GlobalClickTracker } from './GlobalClickTracker'
import { CrossNicheCTA } from './CrossNicheCTA'
import type { NicheContent } from './content/types'
import { themeColors } from './content/types'
import { buildNicheDemoHref, buildWhatsAppHrefWithContext } from '@/lib/marketing/utm'

// ─── Static icon arrays ───────────────────────────────────────────────────────

const STEP_ICONS = [
  <svg key="s0" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>,
  <svg key="s1" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
  <svg key="s2" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="s3" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>,
]

const BENEFIT_ICONS = [
  <svg key="b0" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="b1" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  <svg key="b2" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  <svg key="b3" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  <svg key="b4" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
]

const WA_ICON = (
  <svg className="w-4 h-4 fill-[#25D366] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
  </svg>
)

// ─── Shell ────────────────────────────────────────────────────────────────────

export function NicheLandingShell({ content }: { content: NicheContent }) {
  const tc = themeColors[content.theme]

  // Niche-aware CTA destinations (computed server-side — no window needed)
  const demoHref = buildNicheDemoHref(content.theme, content.slug)
  const specialistWA = buildWhatsAppHrefWithContext(content.specialistWAText)

  // Gradient headline split using content-controlled break index
  const words = content.hero.headline.split(' ')
  const gradientWords = words.slice(0, content.hero.headlineBreak).join(' ')
  const restWords = words.slice(content.hero.headlineBreak).join(' ')

  return (
    <main
      className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900"
      lang="pt-BR"
    >
      <MetaPixel />

      {/* Client-side init: UTM persist + section observer + click tracker */}
      <UTMPersist niche={content.theme} lpSlug={content.slug} />
      <SectionViewTracker niche={content.theme} lpSlug={content.slug} />
      <GlobalClickTracker niche={content.theme} lpSlug={content.slug} />

      <NicheLandingHeader primaryCTA={content.hero.primaryCTA} primaryHref={demoHref} />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-[#080d19]"
        data-section="hero"
        aria-labelledby="hero-heading"
      >
        {/* Theme ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% -5%, ${tc.heroGlow}, transparent)` }}
        />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          {/* Niche badge */}
          <div className={`inline-flex items-center gap-2 ${tc.heroBadgeBg} ${tc.heroBadgeBorder} rounded-full px-4 py-2 mb-8`}>
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${tc.bulletDot}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${tc.bulletDot}`} />
            </span>
            <span className={`text-xs font-bold uppercase tracking-widest ${tc.heroBadgeText}`}>
              {content.hero.badge}
            </span>
          </div>

          {/* Headline — content-controlled gradient split */}
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold text-white tracking-tight leading-[1.1] mb-6"
          >
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: `linear-gradient(135deg, ${tc.gradientFrom}, ${tc.gradientTo})` }}
            >
              {gradientWords}
            </span>
            {restWords && <> {restWords}</>}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            {content.hero.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              href={demoHref}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:bg-blue-500 transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              data-track="hero_cta_primary"
            >
              {content.hero.primaryCTA}
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-300 font-semibold transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              data-track="hero_cta_secondary"
            >
              {content.hero.secondaryCTA}
            </a>
          </div>

          {/* Microcopy */}
          <p className="text-xs text-slate-500 font-medium mb-8 max-w-md mx-auto">
            {content.hero.microcopy}
          </p>

          {/* Trust bullets */}
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Destaques">
            {content.hero.trustBullets.map((bullet, i) => (
              <li key={i} className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {bullet}
              </li>
            ))}
          </ul>

        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-5" aria-label="Benefícios rápidos">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {content.hero.trustBullets.map((bullet, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tc.problemIconBg}`} aria-hidden="true">
                  <svg className={`w-3.5 h-3.5 ${tc.problemIconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-slate-600">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── PROBLEM ───────────────────────────────────────────────── */}
      <section
        className="py-16 lg:py-24 bg-[#f8fafc] border-b border-slate-100"
        data-section="problem"
        aria-labelledby="problem-heading"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${tc.sectionBadge} ${tc.sectionBadgeRing}`}>
              O problema
            </span>
            <h2 id="problem-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
              {content.problem.title}
            </h2>
          </div>
          <ul className="flex flex-col gap-3" aria-label="Problemas comuns">
            {content.problem.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-4 bg-white rounded-2xl px-5 py-4 border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <span className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${tc.problemIconBg}`} aria-hidden="true">
                  <svg className={`w-3.5 h-3.5 ${tc.problemIconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <span className="text-sm sm:text-base text-slate-700 font-medium leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SOLUTION ──────────────────────────────────────────────── */}
      <section
        className="py-16 lg:py-20 bg-white"
        data-section="solution"
        aria-labelledby="solution-heading"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${tc.sectionBadge} ${tc.sectionBadgeRing}`}>
            A solução
          </span>
          <h2 id="solution-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-5">
            {content.solution.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
            {content.solution.description}
          </p>
          <Link
            href={demoHref}
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-0.5 shadow-md hover:shadow-blue-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            data-track="solution_cta"
          >
            {content.hero.primaryCTA}
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section
        id="como-funciona"
        className="py-16 lg:py-24 bg-[#f8fafc] border-t border-slate-100"
        data-section="how_it_works"
        aria-labelledby="how-heading"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${tc.sectionBadge} ${tc.sectionBadgeRing}`}>
              Passo a passo
            </span>
            <h2 id="how-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              {content.howItWorks.title}
            </h2>
          </div>

          <div className="relative">
            {/* Connector line — desktop only */}
            <div
              className={`hidden lg:block absolute top-[2.25rem] left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-[2px] bg-gradient-to-r ${tc.stepConnector}`}
              aria-hidden="true"
            />
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {content.howItWorks.steps.map((step, i) => (
                <li key={i} className="flex flex-col items-center text-center group">
                  <div className={`relative w-[4.5rem] h-[4.5rem] rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center mb-5 ${tc.problemIconText} group-hover:-translate-y-1 transition-all duration-300 z-10`}>
                    {STEP_ICONS[i]}
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#0f172a] text-white font-extrabold text-xs rounded-full flex items-center justify-center shadow ring-2 ring-white" aria-hidden="true">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-extrabold text-[#0f172a] text-sm sm:text-base mb-2 leading-snug">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────── */}
      <section
        className="py-16 lg:py-24 bg-white"
        data-section="benefits"
        aria-labelledby="benefits-heading"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${tc.sectionBadge} ${tc.sectionBadgeRing}`}>
              Benefícios
            </span>
            <h2 id="benefits-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              {content.benefits.title}
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.benefits.items.map((item, i) => (
              <li
                key={i}
                className={`bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 group ${tc.benefitHoverBorder}`}
              >
                <span className={`inline-flex w-9 h-9 rounded-xl items-center justify-center mb-4 ${tc.problemIconBg} ${tc.problemIconText} group-hover:scale-110 transition-transform duration-200`} aria-hidden="true">
                  {BENEFIT_ICONS[i % BENEFIT_ICONS.length]}
                </span>
                <h3 className="font-extrabold text-[#0f172a] text-sm sm:text-base mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── PROOF / CREDIBILITY ───────────────────────────────────── */}
      <section
        className="py-16 lg:py-20 bg-[#080d19] relative overflow-hidden"
        data-section="proof"
        aria-labelledby="proof-heading"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${tc.heroGlow}, transparent)` }}
          aria-hidden="true"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${tc.heroBadgeBg} ${tc.heroBadgeBorder} ${tc.heroBadgeText}`}>
              Para quem é
            </span>
            <h2 id="proof-heading" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {content.proof.title}
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.proof.focusPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm sm:text-base text-slate-300 font-medium leading-snug">{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link
              href={demoHref}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-500 transition-all hover:-translate-y-1 shadow-[0_8px_30px_rgba(37,99,235,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              data-track="proof_cta"
            >
              {content.hero.primaryCTA}
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── OBJECTIONS ────────────────────────────────────────────── */}
      <section
        className="py-16 lg:py-24 bg-white"
        data-section="objections"
        aria-labelledby="objections-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${tc.sectionBadge} ${tc.sectionBadgeRing}`}>
              Dúvidas comuns
            </span>
            <h2 id="objections-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              {content.objections.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.objections.items.map((item, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
                <p className={`font-extrabold text-sm sm:text-base ${tc.accentText} mb-3`}>
                  &ldquo;{item.q}&rdquo;
                </p>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CROSS-NICHE RESCUE ────────────────────────────────────── */}
      <CrossNicheCTA
        sourceNiche={content.theme}
        targetNiche={content.crossNiche.targetNiche}
        targetHref={content.crossNiche.href}
        text={content.crossNiche.text}
        ctaLabel={content.crossNiche.ctaLabel}
      />

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <NicheLandingFAQ
        items={content.faq.items}
        sectionBadge={tc.sectionBadge}
        sectionBadgeRing={tc.sectionBadgeRing}
        accentText={tc.accentText}
        niche={content.theme}
        lpSlug={content.slug}
      />

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section
        className="relative bg-[#080d19] py-24 overflow-hidden"
        data-section="final_cta"
        aria-labelledby="final-cta-heading"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(37,99,235,0.07),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15 pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" aria-hidden="true" />

        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8" aria-hidden="true">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Pronto para começar</span>
          </div>

          <h2
            id="final-cta-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5 leading-[1.06] tracking-tight"
          >
            {content.finalCTA.headline}
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-medium mb-10 max-w-xl mx-auto">
            {content.finalCTA.subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={demoHref}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-blue-600 text-white px-9 py-4 rounded-xl shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              data-track="final_cta_primary"
            >
              {content.finalCTA.primaryCTA}
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a
              href={specialistWA}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-semibold transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              data-track="final_cta_secondary"
              data-track-label={content.finalCTA.secondaryCTA}
            >
              {WA_ICON}
              {content.finalCTA.secondaryCTA}
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Sticky mobile CTA — appears after scroll */}
      <StickyMobileCTA
        label={content.stickyMobileCTA}
        href={demoHref}
        niche={content.theme}
        lpSlug={content.slug}
      />
    </main>
  )
}
