import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 bg-[#080d19] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-5">
          Comece hoje
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1]">
          Seu atendimento trabalhando
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            enquanto você faz o que importa.
          </span>
        </h2>
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Configure sua IA em minutos, conecte seu WhatsApp e veja o atendimento funcionando. Sem contratos. Sem complicação.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold bg-blue-600 text-white px-10 py-5 rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1"
          >
            Experimente grátis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            href="/contato"
            className="w-full sm:w-auto inline-flex items-center justify-center text-base font-bold text-slate-300 border border-slate-600 px-8 py-5 rounded-xl hover:border-slate-400 hover:text-white transition-all"
          >
            Falar com consultor
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-500 font-medium">
          Sem cartão de crédito · Setup em minutos · Suporte ativo
        </p>
      </div>
    </section>
  );
}
