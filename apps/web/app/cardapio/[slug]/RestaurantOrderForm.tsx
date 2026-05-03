"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type Props = {
  slug: string;
  restaurantName: string;
  whatsappPhone: string;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  categories: Category[];
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
};

type SuccessData = {
  shortId: string;
  total: number;
  whatsappUrl: string | null;
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RestaurantOrderForm({
  slug,
  restaurantName,
  whatsappPhone,
  acceptsDelivery,
  acceptsPickup,
  categories,
}: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">(
    acceptsDelivery ? "DELIVERY" : "PICKUP"
  );
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethodText, setPaymentMethodText] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const availableProducts = categories.flatMap(c =>
    c.products.filter(p => p.isAvailable).map(p => ({ ...p, categoryName: c.name }))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: Math.min(50, i.quantity + 1) } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, notes: "" }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.productId !== productId);
    });
  };

  const updateNotes = (productId: string, notes: string) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, notes } : i));
  };

  const cartQty = (productId: string) => cart.find(i => i.productId === productId)?.quantity ?? 0;
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) { setError("Adicione pelo menos 1 item ao pedido."); return; }
    if (!customerName.trim() || customerName.trim().length < 2) { setError("Informe seu nome completo."); return; }
    if (!customerPhone.replace(/\D/g, "") || customerPhone.replace(/\D/g, "").length < 8) { setError("Informe um telefone válido."); return; }
    if (fulfillmentType === "DELIVERY" && !customerAddress.trim()) { setError("Informe o endereço de entrega."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/restaurant/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone,
          fulfillmentType,
          customerAddress: customerAddress.trim() || undefined,
          paymentMethodText: paymentMethodText.trim() || undefined,
          customerNotes: customerNotes.trim() || undefined,
          website, // honeypot
          items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes.trim() || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar. Tente novamente."); return; }

      setSuccess({ shortId: data.shortId, total: data.total, whatsappUrl: data.whatsappUrl });
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError("Erro de rede. Verifique sua conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-orange-100 p-6 space-y-4 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="font-bold text-gray-900">Pedido #{success.shortId} registrado!</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Pedido registrado como solicitação. Aguarde a confirmação do restaurante pelo WhatsApp.
        </p>
        <p className="text-lg font-bold text-orange-600">Total estimado: {fmt(success.total)}</p>
        {success.whatsappUrl && (
          <a
            href={success.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow hover:bg-orange-600 transition-colors"
          >
            <WhatsAppIcon />
            Continuar no WhatsApp
          </a>
        )}
        <button
          onClick={() => { setSuccess(null); setCart([]); setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setPaymentMethodText(""); setCustomerNotes(""); }}
          className="block mx-auto text-xs text-gray-400 hover:text-gray-600 mt-2"
        >
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
        <h3 className="font-bold text-gray-900">Montar pedido</h3>
        <p className="text-xs text-orange-700 mt-1">
          Pagamento online não é processado nesta etapa. O restaurante confirma pedido, entrega/retirada e pagamento pelo WhatsApp.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Product selection */}
        {availableProducts.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">Nenhum produto disponível no momento.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Selecione os itens</p>
            {categories.map(cat => {
              const available = cat.products.filter(p => p.isAvailable);
              if (available.length === 0) return null;
              return (
                <div key={cat.id}>
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{cat.name}</p>
                  <div className="space-y-2">
                    {available.map(product => {
                      const qty = cartQty(product.id);
                      const cartItem = cart.find(i => i.productId === product.id);
                      return (
                        <div key={product.id} className="rounded-xl border border-gray-100 overflow-hidden">
                          <div className="flex items-center gap-3 p-3">
                            {product.imageUrl && (
                              <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</p>
                              <p className="text-sm font-bold text-orange-600">{fmt(product.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {qty > 0 ? (
                                <>
                                  <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center hover:bg-gray-200 transition-colors">−</button>
                                  <span className="w-5 text-center text-sm font-bold text-gray-900">{qty}</span>
                                  <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center hover:bg-orange-600 transition-colors">+</button>
                                </>
                              ) : (
                                <button onClick={() => addToCart(product)} className="text-xs font-semibold text-orange-600 border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors">Adicionar</button>
                              )}
                            </div>
                          </div>
                          {qty > 0 && cartItem && (
                            <div className="px-3 pb-3">
                              <input
                                type="text"
                                value={cartItem.notes}
                                onChange={e => updateNotes(product.id, e.target.value)}
                                placeholder="Obs para este item (ex: sem cebola)"
                                maxLength={300}
                                className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-gray-50"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="bg-orange-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Resumo</p>
            {cart.map(i => (
              <div key={i.productId} className="flex justify-between text-sm">
                <span className="text-gray-700">{i.quantity}× {i.name}</span>
                <span className="font-medium text-gray-900">{fmt(i.price * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-orange-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
              <span>Subtotal</span>
              <span className="text-orange-600">{fmt(subtotal)}</span>
            </div>
          </div>
        )}

        {/* Customer form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot */}
          <input name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Seus dados</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(11) 99999-0000" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          {(acceptsDelivery || acceptsPickup) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pedido *</label>
              <div className="flex gap-3">
                {acceptsDelivery && (
                  <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${fulfillmentType === "DELIVERY" ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white"}`}>
                    <input type="radio" value="DELIVERY" checked={fulfillmentType === "DELIVERY"} onChange={() => setFulfillmentType("DELIVERY")} className="sr-only" />
                    <span className="text-lg">🛵</span>
                    <span className="text-sm font-semibold text-gray-700">Delivery</span>
                  </label>
                )}
                {acceptsPickup && (
                  <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${fulfillmentType === "PICKUP" ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white"}`}>
                    <input type="radio" value="PICKUP" checked={fulfillmentType === "PICKUP"} onChange={() => setFulfillmentType("PICKUP")} className="sr-only" />
                    <span className="text-lg">🏃</span>
                    <span className="text-sm font-semibold text-gray-700">Retirada</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {fulfillmentType === "DELIVERY" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de entrega *</label>
              <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Rua, número, bairro" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento (opcional)</label>
            <input value={paymentMethodText} onChange={e => setPaymentMethodText(e.target.value)} placeholder="Ex: Pix na entrega, Cartão, Dinheiro" maxLength={80} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação geral (opcional)</label>
            <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} placeholder="Ex: Portão azul, campainha não funciona" rows={2} maxLength={500} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || cart.length === 0}
            className="w-full py-3 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Enviando..." : `Enviar pedido${cart.length > 0 ? ` · ${fmt(subtotal)}` : ""}`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Ao enviar, você concorda que seus dados serão usados apenas para contato de atendimento com {restaurantName}.
          </p>
        </form>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.115 1.527 5.845L.057 23.49a.75.75 0 0 0 .921.921l5.729-1.491A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.958-1.357l-.355-.212-3.659.953.975-3.562-.232-.368A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  );
}
