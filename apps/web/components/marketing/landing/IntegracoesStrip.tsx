export function IntegracoesStrip() {
  return (
    <section className="py-16 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Social Proof Number */}
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Confiança comprovada</p>
          <div className="flex items-baseline justify-center gap-3 mb-3">
            <span className="text-6xl md:text-7xl font-black text-[#0f172a] tracking-tight">5.000<span className="text-blue-600">+</span></span>
          </div>
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-xl mx-auto">
            Empresas já usam a Variaty para operar atendimento, vendas e agendamentos com mais velocidade.
          </p>
        </div>

        {/* Trust Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {[
            { label: "API Oficial da Meta", color: "bg-blue-50 text-blue-700 border-blue-100" },
            { label: "Operação 24/7", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { label: "Setup em minutos", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
            { label: "Controle humano total", color: "bg-purple-50 text-purple-700 border-purple-100" },
          ].map((pill) => (
            <span key={pill.label} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border ${pill.color}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {pill.label}
            </span>
          ))}
        </div>

        {/* Tech Logos */}
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-60 hover:opacity-90 grayscale hover:grayscale-0 transition-all duration-700">

            <div className="flex items-center gap-2 cursor-default">
              <svg className="w-7 h-7 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" /></svg>
              <span className="font-bold text-slate-800 tracking-tight text-[17px]">WhatsApp</span>
            </div>

            <div className="flex items-center gap-1.5 cursor-default">
              <span className="font-black text-slate-800 tracking-tighter text-2xl">Meta</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Partner</span>
            </div>

            <div className="cursor-default">
              <span className="font-extrabold text-[#635BFF] text-[28px] tracking-tighter">stripe</span>
            </div>

            <div className="flex items-center gap-2 cursor-default">
              <span className="text-xl">🧠</span>
              <span className="font-bold text-slate-800 tracking-tight text-[17px]">OpenAI</span>
            </div>

            <div className="flex items-center gap-1.5 cursor-default">
              <div className="w-5 h-5 bg-gradient-to-tr from-slate-400 to-slate-300 rounded-sm" />
              <span className="font-bold text-slate-800 tracking-tight text-[17px]">CRMs</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
