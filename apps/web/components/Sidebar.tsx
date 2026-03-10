import Link from "next/link";

import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? "bg-[#1f2937] text-white" 
        : "text-[#e5e7eb] hover:bg-[#1f2937] hover:text-white"
    }`;
  };

  return (
    <aside className="w-[240px] bg-[#111827] flex flex-col h-full shrink-0 border-r border-[#1f2937] transition-all">
      <div className="h-16 flex items-center px-6 border-b border-[#1f2937]">
        {/* Abstract Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#4338ca] flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">AutoSync</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        <Link href="/dashboard" className={getLinkClass("/dashboard")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">📊</span>
            Dashboard
          </div>
        </Link>
        <Link href="/dashboard/conversations" className={getLinkClass("/dashboard/conversations")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">💬</span>
            Conversas
          </div>
        </Link>
        <Link href="/dashboard/pedidos" className={getLinkClass("/dashboard/pedidos")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">🛍️</span>
            Pedidos
          </div>
        </Link>
        <Link href="/dashboard/agenda" className={getLinkClass("/dashboard/agenda")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">📅</span>
            Agenda
          </div>
        </Link>
        <div className="pt-4 pb-2">
          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Automação
          </p>
        </div>
        <Link href="/dashboard/ai" className={getLinkClass("/dashboard/ai")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">🤖</span>
            Configuração de IA
          </div>
        </Link>
        <Link href="/dashboard/ai-test" className={getLinkClass("/dashboard/ai-test")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">🧪</span>
            Teste IA
          </div>
        </Link>
        <div className="pt-4 pb-2">
          <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Administração
          </p>
        </div>
        <Link href="/dashboard/integrations" className={getLinkClass("/dashboard/integrations")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">🔌</span>
            Integrações
          </div>
        </Link>
        <Link href="/dashboard/products" className={getLinkClass("/dashboard/products")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">📦</span>
            Produtos
          </div>
        </Link>
        <Link href="/dashboard/settings" className={getLinkClass("/dashboard/settings")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">⚙️</span>
            Configurações
          </div>
        </Link>
      </nav>
    </aside>
  );
}

