"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const channels = [
  { label: "WhatsApp", href: "/whatsapp", icon: "W" },
  { label: "Instagram", href: "/instagram", icon: "IG" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsMenuOpen(false); setIsChannelsOpen(false); }
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!isChannelsOpen) return;
    const handler = () => setIsChannelsOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isChannelsOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-[70]">
            <img src="/logo.webp" alt="Variaty" className="h-20 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-600">

            {/* Canais dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsChannelsOpen(!isChannelsOpen)}
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
              >
                Canais
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isChannelsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isChannelsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2">
                    <Link
                      href="/whatsapp"
                      onClick={() => setIsChannelsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" /></svg>
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">WhatsApp</p>
                        <p className="text-xs text-gray-400 font-medium">Atendimento e vendas</p>
                      </div>
                    </Link>
                    <Link
                      href="/instagram"
                      onClick={() => setIsChannelsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <rect width="20" height="20" x="2" y="2" rx="5" stroke="url(#ig)" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2"/>
                          <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig)"/>
                          <defs>
                            <linearGradient id="ig" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#F97316"/>
                              <stop offset="0.5" stopColor="#EC4899"/>
                              <stop offset="1" stopColor="#8B5CF6"/>
                            </linearGradient>
                          </defs>
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Instagram</p>
                        <p className="text-xs text-gray-400 font-medium">DMs e comentários</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</Link>
            <Link href="/precos" className="hover:text-blue-600 transition-colors">Planos</Link>
            <Link
              href="/business"
              className="flex items-center gap-1.5 text-indigo-600 font-extrabold hover:text-indigo-800 transition-colors"
            >
              Business
              <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">Consultivo</span>
            </Link>
            <Link href="/demo" className="hover:text-blue-600 transition-colors">Demo</Link>
            <Link href="/contato" className="hover:text-blue-600 transition-colors">Contato</Link>
          </div>

          {/* Right: CTAs + Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 relative z-[70]">
            <Link href="/login" className="hidden lg:block text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="text-sm font-bold px-4 sm:px-6 py-2.5 rounded-lg whitespace-nowrap btn-premium">
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

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[50] transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 w-[85%] sm:w-[360px] h-full z-[55] glass-drawer transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] lg:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="glow-accent top-[-10%] right-[-20%]" />
        <div className="glow-accent bottom-[10%] left-[-20%] opacity-50 bg-blue-500/20" />

        <div className="flex flex-col h-full pt-28 pb-10 px-8 overflow-y-auto relative z-10">
          <div className="flex flex-col gap-7 text-lg font-bold text-white/90">

            {/* Canais — mobile section */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.18em] mb-4">Canais</p>
              <div className="flex flex-col gap-4 pl-1">
                <Link href="/whatsapp" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 hover:text-[#25D366] transition-colors">
                  <svg className="w-5 h-5 fill-[#25D366] shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" /></svg>
                  WhatsApp
                </Link>
                <Link href="/instagram" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 hover:text-pink-400 transition-colors">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect width="20" height="20" x="2" y="2" rx="5" stroke="url(#ig-m)" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" stroke="url(#ig-m)" strokeWidth="2"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-m)"/>
                    <defs><linearGradient id="ig-m" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#F97316"/><stop offset=".5" stopColor="#EC4899"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
                  </svg>
                  Instagram
                </Link>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <Link href="/como-funciona" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Como Funciona</Link>
            <Link href="/precos" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Planos</Link>
            <Link
              href="/business"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              Business
              <span className="text-[9px] font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Consultivo</span>
            </Link>
            <Link href="/demo" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Demo</Link>
            <Link href="/contato" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Contato</Link>
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
