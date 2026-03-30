import Link from "next/link";

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20ver%20uma%20demonstra%C3%A7%C3%A3o%20da%20Variaty.";

export function ComoFuncionaSection() {
  const etapas = [
    {
      num: "01",
      titulo: "Conecte sua operação",
      desc: "Vincule WhatsApp, Instagram e Facebook via API Oficial da Meta. Seguro, verificado, sem risco de banimento.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      num: "02",
      titulo: "Configure sua IA e automações",
      desc: "Defina o tom, as regras de negócio, os produtos e os fluxos. Sem código. A IA assimila sua marca em minutos.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      num: "03",
      titulo: "Atenda, qualifique e converta",
      desc: "A IA entra em ação: responde, agenda, filtra e fecha. Você vê tudo no painel e intervém quando quiser.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="como-funciona" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-50/40 rounded-full mix-blend-multiply blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-blue-600 font-extrabold tracking-widest text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-blue-100">
            Em 3 passos
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f172a] mb-6 tracking-tight">
            Do zero ao primeiro atendimento
            <br className="hidden md:block" /> automático em minutos
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Sem desenvolvedor. Sem fluxogramas. Sem meses de implantação. Você configura e a operação já começa.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-[3.5rem] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-[2px] bg-gradient-to-r from-blue-100 via-indigo-200 to-blue-100" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {etapas.map((e, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Step Icon */}
                <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/60 flex items-center justify-center mb-7 text-indigo-600 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-indigo-100/60 transition-all duration-500 z-10">
                  {e.icon}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0f172a] text-white font-extrabold text-xs rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                    {e.num}
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-[#0f172a] mb-3 group-hover:text-indigo-600 transition-colors">{e.titulo}</h3>
                <p className="text-base text-slate-500 leading-relaxed font-medium max-w-xs">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-extrabold bg-blue-600 text-white px-10 py-4 rounded-xl shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 hover:shadow-[0_8px_40px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 ring-2 ring-blue-500/20"
          >
            Começar agora
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
          <a
            href={WHATSAPP_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#25D366] transition-colors"
          >
            <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" /></svg>
            Ver demonstração ao vivo
          </a>
        </div>
      </div>
    </section>
  );
}
