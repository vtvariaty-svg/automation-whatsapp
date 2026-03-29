import Link from "next/link";

export function PricingTeaserSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <div className="bg-[#f8fafc] border border-slate-200/60 rounded-[2.5rem] p-12 lg:p-20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-6">
            Planos desenhados para o seu momento
          </h2>
          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Do teste grátis produtivo até infraestruturas consultivas de alta escala com White-Label. Descubra a arquitetura ideal ajustada para a sua operação.
          </p>
  
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold text-white bg-blue-600 px-10 py-4.5 rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 ring-2 ring-blue-500/30 hover:-translate-y-1 transition-all"
            >
              Iniciar Plano Grátis
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </Link>
            <Link
              href="/precos"
              className="w-full sm:w-auto text-base font-bold text-slate-700 bg-white border border-slate-200 px-10 py-4.5 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:text-[#0f172a] hover:-translate-y-0.5 transition-all"
            >
              Comparar Recursos
            </Link>
          </div>
        </div>
        
      </div>
    </section>
  );
}
