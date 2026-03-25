"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stock: number | null;
}

interface OrderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  // Optional pre-fill from conversation
  contactId?: string;
  conversationId?: string;
  customerPhone?: string;
  customerName?: string;
  origin?: string;
}

interface ItemInput {
  productId?: string; // set when added from catalog
  name: string;
  quantity: string;
  unitPrice: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrderFormDialog({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  contactId,
  conversationId,
  customerPhone: prefillPhone,
  customerName: prefillName,
  origin: prefillOrigin,
}: OrderFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [form, setForm] = useState({
    customerName: prefillName ?? "",
    customerPhone: prefillPhone ?? "",
    origin: prefillOrigin ?? "manual",
    notes: "",
  });
  const [items, setItems] = useState<ItemInput[]>([{ name: "", quantity: "1", unitPrice: "" }]);
  const [error, setError] = useState("");

  // Catalog
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setCatalogLoading(true);
    fetch("/api/catalog", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.products) setCatalogProducts(data.products); })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Catalog selection ──────────────────────────────────────────────────────

  const addFromCatalog = (product: CatalogProduct) => {
    // If already present, increment quantity
    const existingIdx = items.findIndex((it) => it.productId === product.id);
    if (existingIdx >= 0) {
      const copy = [...items];
      copy[existingIdx] = {
        ...copy[existingIdx],
        quantity: String((parseInt(copy[existingIdx].quantity) || 1) + 1),
      };
      setItems(copy);
      return;
    }
    // Replace first empty item, or append
    const emptyIdx = items.findIndex((it) => !it.name.trim() && !it.unitPrice);
    const newItem: ItemInput = {
      productId: product.id,
      name: product.name,
      quantity: "1",
      unitPrice: String(product.price),
    };
    if (emptyIdx >= 0) {
      const copy = [...items];
      copy[emptyIdx] = newItem;
      setItems(copy);
    } else {
      setItems([...items, newItem]);
    }
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────────

  const addItem = () => setItems([...items, { name: "", quantity: "1", unitPrice: "" }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ItemInput, value: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: value };
    setItems(copy);
  };

  const total = items.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0),
    0
  );

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");

    const token = localStorage.getItem("auth_token");

    try {
      const payload: any = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        origin: form.origin,
        notes: form.notes || undefined,
        contactId: contactId || undefined,
        conversationId,
        items: items
          .filter((it) => it.name.trim())
          .map((it) => ({
            productId: it.productId ?? undefined,
            name: it.name,
            quantity: parseInt(it.quantity) || 1,
            unitPrice: parseFloat(it.unitPrice) || 0,
          })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar pedido");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Novo Pedido</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
              <input
                type="text"
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="5511999999999"
              />
            </div>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none bg-white"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>

          {/* Catalog picker — only shown when there are active products */}
          {(catalogLoading || catalogProducts.length > 0) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Adicionar do catálogo
              </label>
              {catalogLoading ? (
                <p className="text-xs text-gray-400">Carregando catálogo...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {catalogProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addFromCatalog(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-all"
                    >
                      <span>{p.name}</span>
                      <span className="text-indigo-400 font-normal">
                        R$ {p.price.toFixed(2).replace(".", ",")}
                      </span>
                      {p.stock !== null && p.stock <= 5 && (
                        <span className="text-amber-500 font-normal">· {p.stock} un</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Itens do Pedido</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`flex gap-2 items-start ${
                    item.productId ? "bg-indigo-50/40 -mx-1 px-1 py-0.5 rounded-lg" : ""
                  }`}
                >
                  <input
                    type="text"
                    required
                    className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#4f46e5] outline-none"
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    placeholder="Produto/Serviço"
                  />
                  <input
                    type="number"
                    min="1"
                    className="w-16 h-9 px-2 rounded-lg border border-gray-300 text-sm text-center focus:ring-2 focus:ring-[#4f46e5] outline-none"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    placeholder="Qtd"
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="w-28 h-9 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#4f46e5] outline-none"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    placeholder="R$ 0,00"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="h-9 px-2 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right mt-2 text-sm font-semibold text-gray-700">
              Total: R$ {total.toFixed(2).replace(".", ",")}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#4f46e5] outline-none resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas internas sobre o pedido..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white"
              disabled={loading}
            >
              {loading ? <span>Salvando...</span> : <span>Criar Pedido</span>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
