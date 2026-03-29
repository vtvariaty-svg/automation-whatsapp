"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm shadow-indigo-900/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-[70]">
            <img src="/logo.webp" alt="Variaty" className="h-20 w-auto" />
          </Link>
          
          {/* Center: Desktop Links (Hidden on mobile/tablet) */}
          <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-gray-600">
            <Link href="/como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</Link>
            <Link href="/precos" className="hover:text-blue-600 transition-colors">Planos</Link>
            <Link href="/demo" className="hover:text-blue-600 transition-colors">Demo</Link>
            <Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
            <Link href="/contato" className="hover:text-blue-600 transition-colors">Fale Conosco</Link>
          </div>
          
          {/* Right: CTAs + Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 relative z-[70]">
            {/* Login Link (Desktop Only) */}
            <Link href="/login" className="hidden lg:block text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            
            {/* Primary CTA (Kept visible on mobile for high conversion) */}
            <Link
              href="/register"
              className="text-sm font-bold bg-blue-600 text-white px-4 sm:px-6 py-2.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 whitespace-nowrap ring-2 ring-blue-500/20"
            >
              <span className="hidden sm:inline">Teste grátis</span>
              <span className="sm:hidden">Começar</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors focus:outline-none"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className={`fixed inset-0 min-h-screen bg-gray-900/60 backdrop-blur-sm z-[50] transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 w-[85%] sm:w-80 h-full bg-white z-[55] shadow-2xl border-l border-gray-100 transition-transform duration-300 ease-out lg:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-28 pb-8 px-6 overflow-y-auto">
          <div className="flex flex-col gap-6 text-lg font-bold text-gray-800">
            <Link href="/como-funciona" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition-colors">Como Funciona</Link>
            <Link href="/precos" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition-colors">Planos</Link>
            <Link href="/demo" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition-colors">Demo</Link>
            <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition-colors">FAQ</Link>
            <Link href="/contato" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition-colors">Fale Conosco</Link>
          </div>
          
          <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col gap-4">
            <Link 
              href="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="text-center font-bold text-gray-600 hover:text-gray-900 py-3.5 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
            >
              Fazer Login
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMenuOpen(false)}
              className="text-center font-extrabold bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/30 ring-2 ring-blue-500/20 transition-all"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
