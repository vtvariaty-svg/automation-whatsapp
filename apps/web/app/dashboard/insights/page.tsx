"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import Link from "next/link";
import {
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ArrowPathIcon,
  SparklesIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

type Question = { topic: string; count: number; examples: string[] };
type Objection = { objection: string; count: number; examples: string[] };
type Interest = { item: string; mentions: number };

type InsightReport = {
  commonQuestions: Question[];
  commonObjections: Objection[];
  productInterests: Interest[];
  summary: string;
};

export default function InsightsPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const [period, setPeriod] = useState("7days");
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async (forceRefresh = false) => {
    if (!user?.tenantId) return;
    forceRefresh ? setRegenerating(true) : setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const method = forceRefresh ? "POST" : "GET";
      const res = await fetch(`/api/insights?period=${period}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReport(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao carregar insights.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [user?.tenantId, period]);

  useEffect(() => {
    loadInsights(false);
  }, [loadInsights]);

  const maxQ = Math.max(...(report?.commonQuestions.map((q) => q.count) ?? [1]), 1);
  const maxO = Math.max(...(report?.commonObjections.map((o) => o.count) ?? [1]), 1);
  const maxI = Math.max(...(report?.productInterests.map((i) => i.mentions) ?? [1]), 1);

  // Pro+ gate — show after entitlements loaded
  if (!ent.loading && !ent.features.aiCopilot) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-3xl mx-auto">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900">Insights de IA</h2>
        <p className="text-gray-500">
          Análise inteligente de perguntas, objeções e interesses dos seus clientes. Disponível nos planos <strong>Pro</strong> e <strong>Business</strong>.
        </p>
        <Link
          href="/dashboard/billing#plans"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          Fazer upgrade para Pro →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-indigo-500" />
            Insights de IA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            A IA analisa suas conversas e identifica padrões, dúvidas e oportunidades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadInsights(true)}
            disabled={regenerating}
            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Regenerar análise"
          >
            <ArrowPathIcon className={`w-5 h-5 ${regenerating ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1 inline-flex">
            {[
              { value: "7days", label: "7 Dias" },
              { value: "30days", label: "30 Dias" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  period === opt.value ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 bg-gray-100 rounded w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Resumo */}
          {report.summary && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                <LightBulbIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Resumo da Análise</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{report.summary}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Perguntas mais comuns */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Perguntas Mais Comuns</h3>
                  <p className="text-xs text-gray-500">Dúvidas que seus clientes mais têm</p>
                </div>
              </div>
              <div className="p-4 flex-1 space-y-3">
                {report.commonQuestions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhuma pergunta identificada</p>
                ) : (
                  report.commonQuestions.map((q, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 capitalize">{q.topic}</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {q.count}x
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                          style={{ width: `${(q.count / maxQ) * 100}%` }}
                        />
                      </div>
                      {q.examples?.[0] && (
                        <p className="text-xs text-gray-400 italic truncate">"{q.examples[0]}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Objeções recorrentes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-orange-50/60 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Objeções Recorrentes</h3>
                  <p className="text-xs text-gray-500">Resistências detectadas nas conversas</p>
                </div>
              </div>
              <div className="p-4 flex-1 space-y-3">
                {report.commonObjections.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhuma objeção identificada</p>
                ) : (
                  report.commonObjections.map((o, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 capitalize">{o.objection}</span>
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {o.count}x
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          style={{ width: `${(o.count / maxO) * 100}%` }}
                        />
                      </div>
                      {o.examples?.[0] && (
                        <p className="text-xs text-gray-400 italic truncate">"{o.examples[0]}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Interesse em produtos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <TagIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Interesse em Produtos</h3>
                  <p className="text-xs text-gray-500">Itens e categorias mais citados</p>
                </div>
              </div>
              <div className="p-4 flex-1 space-y-3">
                {report.productInterests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum produto identificado</p>
                ) : (
                  report.productInterests.map((p, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 capitalize">{p.item}</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {p.mentions}x
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                          style={{ width: `${(p.mentions / maxI) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-right">
            Cache válido por 6h · Clique em{" "}
            <button
              onClick={() => loadInsights(true)}
              disabled={regenerating}
              className="underline hover:text-indigo-500 transition-colors"
            >
              atualizar
            </button>{" "}
            para regenerar agora
          </p>
        </>
      ) : null}
    </div>
  );
}
