import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#050810] text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.webp" alt="Variaty" className="h-16 w-auto grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm text-sm font-medium">
              Plataforma de atendimento com IA para WhatsApp, Instagram e Facebook. Conectada à API Oficial da Meta. Desenvolvida para operações reais de atendimento e vendas.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Produto</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/como-funciona" className="hover:text-blue-500 transition-colors">Como Funciona</Link></li>
              <li><Link href="/precos" className="hover:text-blue-500 transition-colors">Planos e Preços</Link></li>
              <li><Link href="/demo" className="hover:text-blue-500 transition-colors">Ver Demo</Link></li>
              <li><Link href="/login" className="hover:text-blue-500 transition-colors">Entrar no Painel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Empresa</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/contato" className="hover:text-blue-500 transition-colors">Falar com a equipe</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/terms" className="hover:text-blue-500 transition-colors">Termos de Serviço</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Variaty. Todos os direitos reservados.</p>
            <p className="text-xs text-slate-600 font-medium">
              Contamei Tecnologia e Sistemas Digitais LTDA — CNPJ 64.790.325/0001-06
            </p>
          </div>
          <p className="text-xs text-slate-600 font-medium tracking-wide">
            Parceiro Oficial de Negócios · Meta Business Partner
          </p>
        </div>
      </div>
    </footer>
  );
}
