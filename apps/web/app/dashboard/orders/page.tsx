"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { OrderFormDialog } from "@/components/orders/OrderFormDialog";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  product: string;
  price: number;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700 border-blue-200",
  confirmado: "bg-indigo-100 text-indigo-700 border-indigo-200",
  preparando: "bg-yellow-100 text-yellow-700 border-yellow-200",
  enviado: "bg-purple-100 text-purple-700 border-purple-200",
  finalizado: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    if (!user?.tenantId) return;
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/orders?tenantId=${user.tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.tenantId]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, tenantId: user?.tenantId }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Pedido
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Carregando pedidos...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">⚠️</span></div>
                    <p className="text-sm font-medium text-gray-500">Erro ao carregar pedidos</p>
                    <button onClick={fetchOrders} className="mt-3 px-4 py-2 text-xs font-semibold bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">🛍️</span></div>
                    <p className="text-sm font-medium text-gray-500">Nenhum pedido</p>
                    <p className="text-xs text-gray-400 mt-1">Os pedidos dos clientes aparecerão aqui</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.customerName || "Cliente"}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{order.product}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {Number(order.price).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border border-transparent outline-none cursor-pointer appearance-none text-center ${statusColors[order.status] || statusColors.novo}`}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="novo" className="bg-white text-gray-900 text-left">Novo</option>
                        <option value="confirmado" className="bg-white text-gray-900 text-left">Confirmado</option>
                        <option value="preparando" className="bg-white text-gray-900 text-left">Preparando</option>
                        <option value="enviado" className="bg-white text-gray-900 text-left">Enviado</option>
                        <option value="finalizado" className="bg-white text-gray-900 text-left">Finalizado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderFormDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchOrders}
        tenantId={user?.tenantId || ""}
      />
    </div>
  );
}
