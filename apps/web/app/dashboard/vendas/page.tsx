"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planAtLeast } from "@/lib/config/plans";
import UpgradeGate from "@/components/UpgradeGate";
import { Modal } from "@/components/ui/Modal";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "produtos" | "catalogo" | "automacoes" | "prontidao";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stock: number | null;
  active: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  triggerValue: string;
  matchType: string;
  responseType: string;
  responseText: string;
  active: boolean;
}

interface BotSetupStep {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

interface BotSetup {
  botId: string;
  botName: string;
  steps: BotSetupStep[];
  completed: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authFetch(url: string, opts: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((opts.headers as object) ?? {}),
    },
  });
}

const fmtBRL = (n: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n);

const ORDER_STATUS_OPTIONS = [
  { value: "draft", label: "Pedido criado (draft)" },
  { value: "pending_payment", label: "Aguardando pagamento" },
  { value: "paid", label: "Pedido pago" },
  { value: "processing", label: "Em processamento" },
  { value: "completed", label: "Pedido concluído" },
  { value: "cancelled", label: "Pedido cancelado" },
  { value: "refunded", label: "Pedido reembolsado" },
];

// ── Tab: Produtos ─────────────────────────────────────────────────────────────

function ProdutosTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const emptyForm = { name: "", description: "", category: "", price: "", stock: "" };
  const [form, setForm] = useState(emptyForm);

  const [loadError, setLoadError] = useState("");

  const loadProducts = async () => {
    try {
      const res = await authFetch("/api/products");
      if (res.ok) {
        setProducts(await res.json());
        setLoadError("");
      } else {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || `Erro ao carregar produtos (${res.status})`);
      }
    } catch {
      setLoadError("Erro de conexão ao carregar produtos.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const openModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setForm({
        name: p.name,
        description: p.description || "",
        category: p.category || "",
        price: p.price.toString(),
        stock: p.stock !== null ? p.stock.toString() : "",
      });
    } else {
      setEditingProduct(null);
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || undefined,
      category: form.category || undefined,
      price: parseFloat(form.price),
      stock: form.stock ? parseInt(form.stock) : null,
    };
    try {
      const res = editingProduct
        ? await authFetch(`/api/products/${editingProduct.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await authFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Erro ao salvar produto (${res.status})`);
        return;
      }
      setShowModal(false);
      loadProducts();
    } catch { alert("Erro ao salvar produto"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover o produto "${name}"?`)) return;
    try {
      const res = await authFetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Erro ao remover produto (${res.status})`);
        return;
      }
      loadProducts();
    } catch { alert("Erro ao remover produto"); }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const res = await authFetch(`/api/products/${p.id}`, { method: "PATCH", body: JSON.stringify({ active: !p.active }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Erro ao atualizar produto (${res.status})`);
        return;
      }
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !p.active } : x));
    } catch { alert("Erro ao atualizar produto"); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {loadError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {products.length} produto{products.length !== 1 ? "s" : ""}
          {products.length > 0 && (
            <span className="ml-2 text-emerald-600 font-medium">
              · {products.filter(p => p.active).length} no catálogo
            </span>
          )}
        </p>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </button>
      </div>

      {products.length > 0 && (
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 p-12 text-center">
          <span className="text-3xl block mb-3">📦</span>
          <h3 className="font-bold text-gray-900 mb-1">{searchTerm ? "Nenhum resultado" : "Nenhum produto"}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm ? "Tente outros termos" : "Adicione produtos para a IA começar a vender"}
          </p>
          {!searchTerm && (
            <button onClick={() => openModal()} className="px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold">
              Adicionar Produto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white flex flex-col rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {p.category && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">{p.category}</span>
                  )}
                  <button
                    onClick={() => handleToggleActive(p)}
                    title={p.active ? "Publicado — clique para despublicar" : "Inativo — clique para publicar"}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${p.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                  >
                    {p.active ? "✓ Catálogo" : "Inativo"}
                  </button>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(p)} className="p-1.5 text-gray-400 hover:text-[#4f46e5] bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 flex-grow mb-4">{p.description || "Sem descrição"}</p>
              <div className="flex items-end justify-between pt-4 border-t border-gray-100 mt-auto">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Preço</p>
                  <p className="text-lg font-bold text-[#4f46e5]">{fmtBRL(p.price, p.currency || "BRL")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Estoque</p>
                  <p className={`text-sm font-semibold ${p.stock !== null && p.stock <= 5 ? "text-amber-500" : "text-gray-700"}`}>
                    {p.stock !== null ? `${p.stock} un` : "Infinito"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? "Editar Produto" : "Novo Produto"}>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Consultoria Premium" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoria</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Serviços" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preço *</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estoque</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Vazio = Infinito" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o produto..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all resize-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
              {saving ? "Salvando..." : (editingProduct ? "Salvar Alterações" : "Criar Produto")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Tab: Catálogo ─────────────────────────────────────────────────────────────

function CatalogoTab({ onCriarAutomacao }: { onCriarAutomacao: (text: string) => void }) {
  const [products, setProducts] = useState<Omit<Product, "active">[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    authFetch("/api/catalog")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.products) setProducts(data.products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buildAiText = (p: Omit<Product, "active">) => {
    const lines = [`📦 *${p.name}*`, `💵 Preço: ${fmtBRL(p.price, p.currency || "BRL")}`];
    if (p.description) lines.push(`📝 ${p.description}`);
    if (p.stock !== null) lines.push(`🏷️ Estoque: ${p.stock} unidades`);
    lines.push(`\nPara pedir, responda com: "quero ${p.name.toLowerCase()}"`);
    return lines.join("\n");
  };

  const handleCopy = (p: Omit<Product, "active">) => {
    navigator.clipboard.writeText(buildAiText(p)).then(() => {
      setCopied(p.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/60 p-12 text-center">
        <span className="text-3xl block mb-3">🛍️</span>
        <h3 className="font-bold text-gray-900 mb-1">Catálogo vazio</h3>
        <p className="text-sm text-gray-500">
          Publique produtos na aba <strong>Produtos</strong> (badge ✓ Catálogo) para aparecerem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
        <strong>{products.length} produto{products.length !== 1 ? "s" : ""}</strong> publicados.
        Use <strong>Copiar texto p/ IA</strong> para gerar o conteúdo que o bot enviará nas conversas,
        ou <strong>⚡ Automação</strong> para criar uma resposta automática com esse produto.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-emerald-200/60 shadow-sm p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {p.category && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold uppercase">{p.category}</span>
                )}
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">✓ Catálogo</span>
              </div>
              <p className="text-lg font-bold text-[#4f46e5] shrink-0 ml-2">{fmtBRL(p.price, p.currency || "BRL")}</p>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description || "Sem descrição"}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(p)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  copied === p.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {copied === p.id ? "✓ Copiado!" : "📋 Copiar texto p/ IA"}
              </button>
              <button
                onClick={() => onCriarAutomacao(buildAiText(p))}
                title="Criar automação com este produto"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                ⚡ Automação
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Automações ───────────────────────────────────────────────────────────

function AutomacoesTab({
  tenantId,
  prefillText,
  onPrefillConsumed,
}: {
  tenantId: string;
  prefillText: string;
  onPrefillConsumed: () => void;
}) {
  const ent = useEntitlements();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    triggerType: "keyword",
    triggerValue: "",
    matchType: "exact",
    responseType: "text",
    responseText: "",
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/automations`);
      if (res.ok) setRules(await res.json());
      else showToast(`Erro ao carregar automações (${res.status})`);
    } catch { showToast("Erro de conexão ao carregar automações."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tenantId) loadRules(); }, [tenantId]);

  useEffect(() => {
    if (!prefillText) return;
    setEditingRule(null);
    setFormData({ name: "", triggerType: "keyword", triggerValue: "", matchType: "contains", responseType: "text", responseText: prefillText });
    setIsModalOpen(true);
    onPrefillConsumed();
  }, [prefillText]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingRule ? `/api/automations/${editingRule.id}` : `/api/automations`;
      const method = editingRule ? "PATCH" : "POST";
      const res = await authFetch(url, {
        method,
        body: JSON.stringify({ ...formData, active: editingRule ? editingRule.active : true }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingRule(null);
        setFormData({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" });
        loadRules();
        showToast(editingRule ? "Automação atualizada" : "Automação criada");
      } else {
        alert("Erro ao salvar automação.");
      }
    } catch { alert("Erro ao salvar automação."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta automação?")) return;
    try {
      const res = await authFetch(`/api/automations/${id}`, { method: "DELETE" });
      if (res.ok) loadRules();
      else showToast("Erro ao remover automação.");
    } catch { showToast("Erro ao remover automação."); }
  };

  const toggleActive = async (rule: AutomationRule) => {
    try {
      const res = await authFetch(`/api/automations/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !rule.active }),
      });
      if (res.ok) { showToast(rule.active ? "Desativada" : "Ativada"); loadRules(); }
      else showToast("Erro ao alterar status da automação.");
    } catch { showToast("Erro ao alterar status da automação."); }
  };

  const openEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({ name: rule.name, triggerType: rule.triggerType, triggerValue: rule.triggerValue, matchType: rule.matchType, responseType: rule.responseType, responseText: rule.responseText });
    setIsModalOpen(true);
  };

  const canAdd = ent.loading || ent.limits.automations === -1 || rules.length < ent.limits.automations;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {rules.length} automação{rules.length !== 1 ? "ões" : ""}
          {!ent.loading && ent.limits.automations !== -1 && ` / ${ent.limits.automations}`}
        </p>
        {canAdd ? (
          <button
            onClick={() => { setEditingRule(null); setFormData({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" }); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl font-semibold text-sm hover:bg-[#4338ca] transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Nova Automação
          </button>
        ) : (
          <Link href="/dashboard/billing" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-500 rounded-xl text-sm font-semibold">
            Limite atingido. Upgrade →
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] divide-y divide-gray-200">
            <div className="bg-gray-50 px-6 py-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Nome</div>
                <div className="col-span-3">Gatilho</div>
                <div className="col-span-1">Tipo</div>
                <div className="col-span-3">Resposta</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Carregando...</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <span className="text-2xl block mb-3">⚡</span>
                  <h3 className="font-medium text-gray-900 mb-1">Nenhuma automação</h3>
                  <p className="text-sm text-gray-500">Crie respostas automáticas por palavra-chave ou status de pedido.</p>
                </div>
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="col-span-3 font-medium text-gray-900 truncate">{rule.name}</div>
                    <div className="col-span-3">
                      {rule.triggerType === "order_status" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">🛍️ {rule.triggerValue}</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">"{rule.triggerValue}"</span>
                      )}
                    </div>
                    <div className="col-span-1 text-xs text-gray-500">
                      {rule.triggerType === "order_status" ? "Pedido" : rule.matchType === "exact" ? "Exata" : "Contém"}
                    </div>
                    <div className="col-span-3 text-sm text-gray-500 truncate" title={rule.responseText}>{rule.responseText}</div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => toggleActive(rule)}
                        role="switch"
                        aria-checked={rule.active}
                        className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 ${rule.active ? "bg-[#4f46e5]" : "bg-gray-200"}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${rule.active ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => openEditModal(rule)} className="p-1.5 text-gray-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">{toast}</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editingRule ? "Editar Automação" : "Nova Automação"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Nome da Regra</label>
                <input required type="text" placeholder="Ex: Tabela de Preços" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Tipo de Gatilho</label>
                <select
                  value={formData.triggerType}
                  onChange={e => setFormData({ ...formData, triggerType: e.target.value, triggerValue: "", matchType: e.target.value === "order_status" ? "exact" : formData.matchType })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 appearance-none"
                >
                  <option value="keyword">Palavra-chave (mensagem)</option>
                  <option value="order_status">Status de pedido</option>
                </select>
              </div>
              {formData.triggerType === "order_status" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Quando o pedido mudar para</label>
                  <select required value={formData.triggerValue} onChange={e => setFormData({ ...formData, triggerValue: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 appearance-none">
                    <option value="">Selecione o status...</option>
                    {ORDER_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Use <code className="bg-gray-100 px-1 rounded">{"{orderId}"}</code> e <code className="bg-gray-100 px-1 rounded">{"{status}"}</code> na resposta para personalizar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Gatilho (Mensagem)</label>
                    <input required type="text" placeholder="Ex: preço" value={formData.triggerValue} onChange={e => setFormData({ ...formData, triggerValue: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Correspondência</label>
                    <select value={formData.matchType} onChange={e => setFormData({ ...formData, matchType: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 appearance-none">
                      <option value="exact">Mensagem exata</option>
                      <option value="contains">Contém a palavra</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Resposta Automática</label>
                <textarea required rows={4} placeholder="O que o sistema deve responder..." value={formData.responseText} onChange={e => setFormData({ ...formData, responseText: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/50 transition-all placeholder:text-gray-400 resize-none" />
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4f46e5] rounded-xl hover:bg-[#4338ca] shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</>
                  ) : (
                    editingRule ? "Salvar Alterações" : "Criar Automação"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Prontidão ────────────────────────────────────────────────────────────

function ProntidaoTab() {
  const [data, setData] = useState<{ botSetup?: BotSetup } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/setup/checklist")
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {data?.botSetup ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🤖</div>
            <div>
              <h3 className="font-bold text-gray-900">{data.botSetup.botName}</h3>
              <p className="text-sm text-gray-500">{data.botSetup.completed}/{data.botSetup.total} etapas concluídas</p>
            </div>
            <div className="ml-auto">
              {data.botSetup.completed === data.botSetup.total ? (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">✓ Pronto para vender</span>
              ) : (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                  {data.botSetup.total - data.botSetup.completed} pendente{data.botSetup.total - data.botSetup.completed !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {data.botSetup.steps.map(step => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-xl ${step.done ? "bg-emerald-50" : "bg-gray-50"}`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-500 text-white" : "bg-gray-200"}`}>
                  {step.done ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? "text-emerald-800" : "text-gray-900"}`}>{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {step.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 p-12 text-center">
          <span className="text-3xl block mb-3">🤖</span>
          <h3 className="font-bold text-gray-900 mb-1">Nenhum bot ativado</h3>
          <p className="text-sm text-gray-500 mb-4">
            Ative um bot de vendas em <strong>Bots & IA</strong> para ver a prontidão aqui.
          </p>
          <Link
            href="/dashboard/bots"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            Configurar Bot →
          </Link>
        </div>
      )}
      <Link
        href="/dashboard/setup"
        className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 transition-all group"
      >
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4f46e5]">Ver checklist completo de ativação</p>
          <p className="text-xs text-gray-500">Setup & Ativação da plataforma →</p>
        </div>
      </Link>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "produtos", label: "Produtos", icon: "📦" },
  { id: "catalogo", label: "Catálogo", icon: "🛍️" },
  { id: "automacoes", label: "Automações", icon: "⚡" },
  { id: "prontidao", label: "Prontidão", icon: "✅" },
];

export default function VendasPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const tenantId = user?.tenantId ?? "";

  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "produtos";
    const p = new URLSearchParams(window.location.search).get("tab");
    return (["produtos", "catalogo", "automacoes", "prontidao"].includes(p ?? "") ? p : "produtos") as Tab;
  });

  const [automacaoPrefill, setAutomacaoPrefill] = useState("");

  if (!ent.loading && !planAtLeast(ent.plan, "standard")) {
    return (
      <UpgradeGate
        icon="🛍️"
        title="Catálogo & Vendas IA"
        message="Módulo disponível a partir do plano Standard."
        ctaPlan="Standard"
      />
    );
  }

  const handleCriarAutomacao = (text: string) => {
    setAutomacaoPrefill(text);
    setTab("automacoes");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo & Vendas IA</h1>
        <p className="text-sm text-gray-500 mt-1">Produtos, catálogo publicado, automações e prontidão do bot de vendas.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "produtos" && <ProdutosTab />}
      {tab === "catalogo" && <CatalogoTab onCriarAutomacao={handleCriarAutomacao} />}
      {tab === "automacoes" && (
        <AutomacoesTab
          tenantId={tenantId}
          prefillText={automacaoPrefill}
          onPrefillConsumed={() => setAutomacaoPrefill("")}
        />
      )}
      {tab === "prontidao" && <ProntidaoTab />}
    </div>
  );
}
