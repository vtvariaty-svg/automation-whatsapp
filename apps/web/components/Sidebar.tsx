"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("keydown", handleEsc);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("toggle-sidebar", handleToggle);
    };
  }, []);

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? "bg-[#1f2937] text-white" 
        : "text-[#e5e7eb] hover:bg-[#1f2937] hover:text-white"
    }`;
  };

  const navContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-[#1f2937] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#4338ca] flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">VTvariaty</span>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          className="ml-auto lg:hidden text-gray-400 hover:text-white p-1"
          aria-label="Fechar menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
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
        <Link href="/dashboard/billing" className={getLinkClass("/dashboard/billing")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">💳</span>
            Billing
          </div>
        </Link>
        <Link href="/dashboard/settings" className={getLinkClass("/dashboard/settings")}>
          <div className="flex items-center gap-3">
            <span className="text-lg">⚙️</span>
            Configurações
          </div>
        </Link>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:flex w-[240px] bg-[#111827] flex-col h-full shrink-0 border-r border-[#1f2937]">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar - slide in from left */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#111827] flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Hamburger button - accessible from Header */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        className="hidden"
        aria-label="Abrir menu"
      />
    </>
  );
}
