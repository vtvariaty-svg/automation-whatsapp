"use client";

import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { RestaurantProfile } from "./components/RestaurantProfile";
import { RestaurantCategories } from "./components/RestaurantCategories";
import { RestaurantProducts } from "./components/RestaurantProducts";
import { RestaurantAddonGroups } from "./components/RestaurantAddonGroups";
import { RestaurantOrders } from "./components/RestaurantOrders";

type Tab = "perfil" | "categorias" | "produtos" | "adicionais" | "pedidos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "perfil",      label: "Perfil & Página",  icon: "🍽️"  },
  { id: "categorias",  label: "Categorias",        icon: "📂"  },
  { id: "produtos",    label: "Produtos",          icon: "🛒"  },
  { id: "adicionais",  label: "Adicionais",        icon: "➕"  },
  { id: "pedidos",     label: "Pedidos",           icon: "📬"  },
];

export default function RestaurantDashboardPage() {
  const { isSuperAdmin } = useAuth();
  const ent = useEntitlements();
  const [tab, setTab] = useState<Tab>("perfil");

  // Show spinner while plan is loading
  if (ent.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Plan guard: only restaurante or superadmin
  const hasAccess = isSuperAdmin || ent.plan === "restaurante";
  if (!hasAccess) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center px-4">
        <p className="text-5xl mb-4">🍽️</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Restaurante não disponível</h1>
        <p className="text-sm text-gray-500 mb-6">
          Este espaço de trabalho é exclusivo do Plano Restaurante.
          {ent.plan ? ` Você está no plano ${ent.plan}.` : ""}
        </p>
        <a
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors"
        >
          Ver planos disponíveis
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurante</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure os dados do seu restaurante, cardápio, categorias, produtos e pedidos.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3">
        <p className="text-xs font-medium text-orange-700">
          Pagamento online não é processado nesta etapa. O restaurante confirma o pedido e o pagamento pelo seu fluxo atual.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-white border border-b-white border-gray-200 text-orange-600 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "perfil"     && <RestaurantProfile />}
        {tab === "categorias" && <RestaurantCategories />}
        {tab === "produtos"   && <RestaurantProducts />}
        {tab === "adicionais" && <RestaurantAddonGroups />}
        {tab === "pedidos"    && <RestaurantOrders />}
      </div>
    </div>
  );
}
