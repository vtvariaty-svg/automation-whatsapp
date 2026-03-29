import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm shadow-indigo-900/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.webp" alt="Variaty" className="h-20 w-auto" />
        </Link>
        <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-gray-600">
          <Link href="/como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</Link>
          <Link href="/precos" className="hover:text-blue-600 transition-colors">Planos</Link>
          <Link href="/demo" className="hover:text-blue-600 transition-colors">Demo</Link>
          <Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
          <Link href="/contato" className="hover:text-blue-600 transition-colors">Fale Conosco</Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-blue-600 text-white px-5 sm:px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 whitespace-nowrap ring-2 ring-blue-500/20"
          >
            <span className="hidden sm:inline">Teste grátis</span>
            <span className="sm:hidden">Começar</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
