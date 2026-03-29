export function IntegracoesStrip() {
  return (
    <section className="py-12 border-b border-gray-100 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
          Tecnologias homologadas e conexões oficiais
        </p>
        <div className="flex items-center justify-center gap-10 md:gap-20 flex-wrap opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700">
           
           {/* WhatsApp */}
           <div className="flex items-center gap-2 group cursor-default">
             <svg className="w-7 h-7 fill-[#25D366] opacity-90 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/></svg>
             <span className="font-bold text-slate-800 tracking-tight text-[17px]">WhatsApp</span>
           </div>
           
           {/* Meta */}
           <div className="flex items-center gap-2 group cursor-default pt-1">
             <span className="font-black text-slate-800 tracking-tighter text-2xl">Meta</span>
             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Partner</span>
           </div>
           
           {/* Stripe */}
           <div className="flex items-center group cursor-default pt-1">
             <span className="font-extrabold text-[#635BFF] text-[28px] tracking-tighter">stripe</span>
           </div>
           
           {/* OpenAI */}
           <div className="flex items-center gap-2 group cursor-default pt-0.5">
             <span className="text-xl">🧠</span>
             <span className="font-bold text-slate-800 tracking-tight text-[17px]">OpenAI</span>
           </div>

           {/* RD / Hubspot / Others */}
           <div className="flex items-center gap-1.5 group cursor-default">
             <div className="w-5 h-5 bg-gradient-to-tr from-slate-400 to-slate-300 rounded-sm" />
             <span className="font-bold text-slate-800 tracking-tight text-[17px]">CRMs</span>
           </div>
           
        </div>
      </div>
    </section>
  );
}
