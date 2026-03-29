import Link from "next/link";
import { WHATSAPP_BUSINESS_URL } from "@/lib/config/plans";

export function CTASection() {
  return (
    <section className="relative bg-[#080d19] overflow-hidden pt-32 pb-40">
      
      {/* Wave Transition Top from White FAQ */}
      <div className="absolute top-0 left-0 right-0 w-full z-0 overflow-hidden pointer-events-none rotate-180">
        <img 
          src="/landing-v4/backgrounds/wave-mid.svg" 
          alt="" 
          className="w-full min-w-[1440px] h-[60px] md:h-[120px] object-cover object-top" 
        />
      </div>

      {/* Premium Background Atmosphere */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="relative max-w-4xl mx-auto px-4 text-center z-10 pt-16">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight drop-shadow-sm">
          Sua máquina de vendas,
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            {" "}automatizada hoje.
          </span>
        </h2>
        <p className="text-lg md:text-xl text-slate-300 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">
          Sem setups complexos. Esqueça integrações intermináveis. Configure suas regras e veja a IA qualificar sua base 24h por dia.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-3 text-lg font-extrabold bg-blue-600 text-white px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] transition-all hover:-translate-y-1 ring-2 ring-blue-500/30 group"
          >
            Começar Gratuitamente
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href={WHATSAPP_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-5 rounded-2xl text-slate-200 font-bold transition-all backdrop-blur-sm group hover:-translate-y-1"
          >
            <svg className="w-5 h-5 fill-[#25D366] opacity-90 group-hover:opacity-100" viewBox="0 0 24 24">
               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/>
            </svg>
            Falar com Vendas
          </a>
        </div>
      </div>

      {/* Wave Section Transition Bottom perfectly aligning into Footer */}
      <div className="absolute bottom-[-1px] left-0 right-0 w-full z-0 overflow-hidden pointer-events-none">
        <img 
          src="/landing-v4/backgrounds/wave-bottom.svg" 
          alt="" 
          className="w-full min-w-[1440px] h-[60px] md:h-[120px] object-cover object-bottom" 
        />
      </div>
    </section>
  );
}
