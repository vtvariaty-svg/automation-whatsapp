"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close on Escape key & manage body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-[70]">
            <img src="/logo.webp" alt="Variaty" className="h-20 w-auto" />
          </Link>
          
          {/* Center: Desktop Links */}
          <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-gray-600">
            <Link href="/como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</Link>
            <Link href="/precos" className="hover:text-blue-600 transition-colors">Planos</Link>
            <Link href="/demo" className="hover:text-blue-600 transition-colors">Demo</Link>
            <Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
            <Link href="/contato" className="hover:text-blue-600 transition-colors">Fale Conosco</Link>
          </div>
          
          {/* Right: CTAs + Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 relative z-[70]">
            <Link href="/login" className="hidden lg:block text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            
            <Link
              href="/register"
              className="text-sm font-bold px-4 sm:px-6 py-2.5 rounded-lg whitespace-nowrap btn-premium"
            >
              <span className="hidden sm:inline">Teste grátis</span>
              <span className="sm:hidden">Começar</span>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
              aria-expanded={isMenuOpen}
              aria-label="Toggle Navigation"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[50] transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer - Premium Navy Brand */}
      <div
        className={`fixed top-0 right-0 w-[85%] sm:w-[360px] h-full z-[55] glass-drawer transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] lg:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="glow-accent top-[-10%] right-[-20%]" />
        <div className="glow-accent bottom-[10%] left-[-20%] opacity-50 bg-blue-500/20" />

        <div className="flex flex-col h-full pt-28 pb-10 px-8 overflow-y-auto relative z-10">
          <div className="flex flex-col gap-8 text-lg font-bold text-white/90">
            <Link href="/como-funciona" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Como Funciona</Link>
            <Link href="/precos" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Planos</Link>
            <Link href="/demo" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Demo</Link>
            <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">FAQ</Link>
            <Link href="/contato" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Fale Conosco</Link>
          </div>
          
          <div className="mt-auto pt-10 border-t border-white/10 flex flex-col gap-4">
            <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
               <p className="text-white font-extrabold text-xl mb-1 relative z-10">Pronto para escalar?</p>
               <p className="text-white/60 text-sm mb-5 relative z-10">Automatize sua operação em minutos.</p>
               
               <Link
                 href="/register"
                 onClick={() => setIsMenuOpen(false)}
                 className="block text-center w-full font-extrabold btn-premium py-3.5 rounded-xl text-sm relative z-10"
               >
                 Criar Conta Grátis
               </Link>
            </div>

            <Link 
              href="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="text-center font-bold text-white/70 hover:text-white py-3 transition-colors mt-2"
            >
              Já tenho conta (Login)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
