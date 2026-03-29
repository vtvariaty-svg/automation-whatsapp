import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#050810] text-slate-400 pt-10 pb-8 relative overflow-hidden">
      
      {/* Optional ambient glow matching CTA bottom wave */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-900/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6 relative group">
              <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-white/10 transition-colors rounded-full" />
              <img src="/logo.webp" alt="Variaty" className="h-[52px] w-auto grayscale mix-blend-screen opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 relative z-10" />
            </Link>
            <p className="text-slate-500/80 leading-relaxed max-w-sm text-sm font-medium">
              Plataforma de atendimento com IA para WhatsApp, Instagram e Facebook. Conectada à API Oficial da Meta. Desenvolvida para operações reais de vendas.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Produto</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/como-funciona" className="text-slate-500 hover:text-blue-400 transition-colors">Como Funciona</Link></li>
              <li><Link href="/precos" className="text-slate-500 hover:text-blue-400 transition-colors">Planos e Preços</Link></li>
              <li><Link href="/demo" className="text-slate-500 hover:text-blue-400 transition-colors">Ver Demo</Link></li>
              <li><Link href="/login" className="text-slate-500 hover:text-blue-400 transition-colors">Entrar no Painel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Empresa</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/contato" className="text-slate-500 hover:text-blue-400 transition-colors">Falar com a equipe</Link></li>
              <li><Link href="/privacy" className="text-slate-500 hover:text-blue-400 transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/terms" className="text-slate-500 hover:text-blue-400 transition-colors">Termos de Serviço</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.03] pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1.5 text-center md:text-left">
            <p className="text-sm text-slate-500/70">&copy; {new Date().getFullYear()} Variaty. Todos os direitos reservados.</p>
            <p className="text-xs text-slate-600/60 font-medium">
              Contamei Tecnologia e Sistemas Digitais LTDA — CNPJ 64.790.325/0001-06
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
               Sistemas Operacionais
             </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
