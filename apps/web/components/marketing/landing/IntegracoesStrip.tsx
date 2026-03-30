export function IntegracoesStrip() {
  return (
    <section className="py-14 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Social Proof — número em destaque máximo com contexto */}
        <div className="text-center mb-10">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4">Resultado comprovado por quem já usa</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-8xl font-black text-[#0f172a] tracking-tight leading-none">
                5.000<span className="text-blue-600">+</span>
              </span>
              <span className="text-base md:text-lg font-bold text-slate-500 mt-2">empresas atendidas</span>
            </div>

            <div className="hidden sm:block w-px h-16 bg-slate-200" />

            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-sm text-slate-500 font-medium">
              <div className="text-center">
                <p className="text-2xl font-black text-[#0f172a]">24<span className="text-indigo-600">/7</span></p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Operação ativa</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#0f172a]">&lt;3s</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Tempo de resposta</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#0f172a]">API<span className="text-blue-600"> ✓</span></p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Oficial da Meta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Logos — parceiros e integrações */}
        <div className="relative mt-8">
          <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <p className="text-center text-xs font-bold text-slate-300 uppercase tracking-[0.15em] mb-6">Tecnologias e integrações oficiais</p>
          <div className="flex items-center justify-center gap-10 md:gap-14 flex-wrap opacity-50 hover:opacity-80 grayscale hover:grayscale-0 transition-all duration-700">

            <div className="flex items-center gap-2 cursor-default">
              <svg className="w-6 h-6 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" /></svg>
              <span className="font-bold text-slate-700 text-base">WhatsApp</span>
            </div>

            <div className="flex items-center gap-1.5 cursor-default">
              <span className="font-black text-slate-700 tracking-tighter text-xl">Meta</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner</span>
            </div>

            <div className="cursor-default">
              <span className="font-extrabold text-[#635BFF] text-2xl tracking-tighter">stripe</span>
            </div>

            <div className="flex items-center gap-2 cursor-default">
              <span className="text-lg">🧠</span>
              <span className="font-bold text-slate-700 text-base">OpenAI</span>
            </div>

            <div className="flex items-center gap-1.5 cursor-default">
              <div className="w-4 h-4 bg-gradient-to-tr from-slate-400 to-slate-300 rounded-sm" />
              <span className="font-bold text-slate-700 text-base">CRMs</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
