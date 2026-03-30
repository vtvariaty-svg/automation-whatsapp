export function MecanismoVisualSection() {
  const specs = [
    { label: "Painel de atendimento unificado", icon: "🖥" },
    { label: "Status da operação em tempo real", icon: "🟢" },
    { label: "IA configurável por canal", icon: "🧠" },
    { label: "Automações e gatilhos ativos", icon: "⚡" },
    { label: "Integrações oficiais (Meta, Stripe)", icon: "🔗" },
    { label: "Checklist operacional completo", icon: "✅" },
  ];

  return (
    <section className="bg-[#080d19] py-24 lg:py-32 relative overflow-hidden">
      {/* Wave top */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden pointer-events-none">
        <img
          src="/landing-v4/backgrounds/wave-mid.svg"
          alt=""
          className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-top"
        />
      </div>

      {/* Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(79,70,229,0.08),transparent)] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 lg:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div>
            <span className="inline-block text-indigo-400 font-extrabold tracking-widest text-xs uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-md mb-8">
              O produto real
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-8">
              Um painel construído para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                operações reais de vendas
              </span>
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-10">
              Não é uma interface bonita sem função. O dashboard da Variaty foi projetado para quem precisa de visibilidade, controle e velocidade no atendimento diário.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 group hover:bg-white/10 hover:border-white/20 transition-all">
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-slate-700/60">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1e293b] border-b border-slate-700/60">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-4 flex-1 bg-slate-700/50 rounded-md h-5 flex items-center px-2">
                  <span className="text-[10px] text-slate-400 font-mono">app.vtvariatysecretary.com.br</span>
                </div>
              </div>
              <div className="relative aspect-[16/10] bg-[#0f172a]">
                <img
                  src="/landing-v4/hero/hero-dashboard-main.webp"
                  alt="Dashboard Variaty — painel de atendimento com IA"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                {/* Live indicator overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Ao vivo</span>
                </div>
              </div>
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/30 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="font-extrabold text-sm text-gray-900">247 atendimentos hoje</p>
                <p className="text-[11px] text-gray-400 font-medium">100% automatizados pela IA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none">
        <img
          src="/landing-v4/backgrounds/wave-top.svg"
          alt=""
          className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-bottom rotate-180"
        />
      </div>
    </section>
  );
}
