"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEntitlements } from "@/hooks/useEntitlements";
import UpgradeGate from "@/components/UpgradeGate";

interface CustomerProfile {
  id: string;
  contactId: string;
  totalVisits: number;
  totalSpend: number;
  loyaltyPoints: number;
  vipStatus: boolean;
  lastServiceAt: string | null;
  preferredServices: string[];
  birthdayDate: string | null;
  reengagementSentAt: string | null;
  contact: {
    name: string | null;
    phone: string | null;
  };
}

function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function BeautyClientesPage() {
  const ent = useEntitlements();
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "vip" | "inactive">("all");

  useEffect(() => {
    const url =
      filter === "inactive"
        ? "/api/beauty/customers?inactive=1&days=30"
        : "/api/beauty/customers?inactive=1&days=0";

    // For 'all' and 'vip', fetch all inactive with days=0 (returns everyone)
    fetch("/api/beauty/customers?inactive=1&days=0")
      .then((r) => r.json())
      .then((data) => {
        setProfiles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (ent.loading) return null;
  if (!ent.features.beautyWorkspace) {
    return (
      <UpgradeGate
        icon="👤"
        title="Perfis de Clientes"
        message="Histórico detalhado de clientes, visitas e fidelidade. Disponível a partir do plano Pro."
        ctaPlan="Pro"
      />
    );
  }

  const filtered = profiles.filter((p) => {
    if (filter === "vip") return p.vipStatus;
    if (filter === "inactive") {
      const d = daysSince(p.lastServiceAt);
      return d !== null && d >= 30;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/beauty"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Beauty Workspace
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">Clientes</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Perfis de clientes</h1>
        <div className="flex gap-2">
          {(["all", "vip", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Todos" : f === "vip" ? "VIP" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const inactiveDays = daysSince(p.lastServiceAt);
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:border-violet-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center text-lg">
                    {p.vipStatus ? "⭐" : "👤"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {p.contact.name ?? p.contact.phone ?? "Sem nome"}
                      {p.vipStatus && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.totalVisits} visita{p.totalVisits !== 1 ? "s" : ""} ·{" "}
                      R$ {p.totalSpend.toFixed(2)} · {p.loyaltyPoints} pts
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {inactiveDays !== null ? (
                    <div
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        inactiveDays >= 30
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {inactiveDays === 0
                        ? "Hoje"
                        : `${inactiveDays}d sem visita`}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">Nunca visitou</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
