export function CredibilidadeStrip() {
  const items = [
    {
      icon: (
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      ),
      label: "API Oficial da Meta",
      sub: "Conexão blindada e segura",
    },
    {
      icon: (
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      label: "Disponibilidade 24/7",
      sub: "Sua operação não dorme",
    },
    {
      icon: (
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      ),
      label: "Setup em minutos",
      sub: "Implantação ágil sem código",
    },
    {
      icon: (
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ),
      label: "Controle Humano",
      sub: "Intervenção seletiva no chat",
    },
  ];

  return (
    <section className="py-24 bg-[#f8fafc] border-b border-slate-200/60 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* Section Header */}
          <div className="lg:w-1/3 text-center lg:text-left">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-4">
                Padrão Enterprise
             </div>
             <h3 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
               Pronto para <br className="hidden lg:block"/> o alto volume
             </h3>
             <p className="text-slate-500 font-medium mt-4 text-lg leading-relaxed">
               Tecnologia robusta e segurança corporativa envelopadas em uma interface absurdamente simples.
             </p>
          </div>

          {/* Value Props Grid */}
          <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {items.map((item, i) => (
              <div key={i} className="group relative flex gap-5 p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />
                <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  {item.icon}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-bold text-[#0f172a] text-base group-hover:text-indigo-600 transition-colors">{item.label}</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
