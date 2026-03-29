import Link from "next/link";
import { WHATSAPP_BUSINESS_URL } from "@/lib/config/plans";

export function CTASection() {
  return (
    <section className="relative bg-[#080d19] overflow-hidden pt-32 pb-40">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />

      {/* Wave Transition Top to blend with previous white section perfectly if needed */}
      <div className="absolute top-0 w-full leading-none z-0 transform rotate-180">
        <svg 
          className="absolute top-0 w-full text-white fill-current -z-10" 
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ height: '40px', display: 'block', width: '100%' }}
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight">
          Sua máquina de vendas,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            automatizada hoje.
          </span>
        </h2>
        <p className="text-lg md:text-xl text-slate-300 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">
          Sem setups complexos. Sem focar em tecnologia estrutural. Apenas configure suas regras de negócio e veja a IA qualificar sua base 24h por dia.
        </p>

        <div className="flex flex-col items-center justify-center gap-6">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 text-lg md:text-xl font-extrabold bg-blue-600 text-white px-12 py-6 rounded-2xl hover:bg-blue-500 shadow-[0_0_60px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 ring-4 ring-blue-500/20"
          >
            Quero automatizar agora
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href={WHATSAPP_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            Ou fale com o comercial
          </a>
        </div>
      </div>

      {/* Wave Section Transition Bottom (V4 explicit asset hook) */}
      <div className="absolute bottom-0 w-full leading-none z-0">
        <img 
          src="/landing-v4/backgrounds/wave-bottom.svg" 
          onError={(e) => { e.currentTarget.style.display='none'; }}
          alt="" 
          className="absolute bottom-0 w-full h-16 md:h-32 object-cover object-top opacity-100" 
        />
        {/* Fallback internal generic wave */}
        <svg className="absolute bottom-0 w-full h-12 md:h-24 text-white fill-current -z-10" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,250.7C672,277,768,267,864,240C960,213,1056,171,1152,176C1248,181,1344,235,1392,261.3L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
}
