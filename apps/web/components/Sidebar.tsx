"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", section: null },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈", section: null },
  { href: "/dashboard/conversations", label: "Conversas", icon: "💬", section: null },
  { href: "/dashboard/orders", label: "Pedidos", icon: "🛍️", section: null },
  { href: "/dashboard/appointments", label: "Agenda", icon: "📅", section: null },
  { href: "/dashboard/services", label: "Serviços", icon: "✂️", section: null },
  { href: "/dashboard/ai", label: "Configuração de IA", icon: "🤖", section: "Automação" },
  { href: "/dashboard/automations", label: "Respostas Rápidas", icon: "⚡", section: null },
  { href: "/dashboard/integrations", label: "Integrações", icon: "🔌", section: "Administração" },
  { href: "/dashboard/products", label: "Produtos", icon: "📦", section: null },
  { href: "/dashboard/billing", label: "Assinatura", icon: "💳", section: null },
  { href: "/dashboard/settings", label: "Configurações", icon: "⚙️", section: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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

  const navContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <div>
            <span className="text-white font-bold text-[15px] tracking-tight block leading-tight">Variaty</span>
            <span className="text-indigo-300 text-[10px] font-medium tracking-wider uppercase">Secretary IA</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="ml-auto lg:hidden text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
          aria-label="Fechar menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href}>
              {item.section && (
                <div className="pt-5 pb-2 px-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                    {item.section}
                  </p>
                </div>
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/10 text-white border border-indigo-500/20 shadow-sm shadow-indigo-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <span className={`text-base ${isActive ? "scale-110" : ""} transition-transform`}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400"></div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/[0.06] flex flex-col gap-3">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/10">
          <p className="text-xs text-indigo-300 font-semibold mb-1">Plano Atual</p>
          <p className="text-white font-bold text-sm">Starter</p>
          <Link href="/dashboard/billing" className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition-colors">
            Fazer upgrade →
          </Link>
        </div>
        <div className="text-[10px] text-gray-500 leading-tight px-1">
          <p className="font-semibold text-gray-400">Contamei Tecnologia e Sistemas Digitais LTDA</p>
          <p>CNPJ: 64.790.325/0001-06</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] bg-[#0c1120] flex-col h-full shrink-0 border-r border-white/[0.06]">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0c1120] flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        className="hidden"
        aria-label="Abrir menu"
      />
    </>
  );
}
