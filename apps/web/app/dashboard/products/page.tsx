"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { authApi } from "@/lib/api/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stock: number | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const emptyProduct = { name: "", description: "", category: "", price: "", stock: "" };
  const [formData, setFormData] = useState(emptyProduct);

  const loadProducts = async () => {
    try {
      const data = await authApi.listProducts();
      setProducts(data);
    } catch {
      console.error("Erro ao listar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category || "",
        price: product.price.toString(),
        stock: product.stock !== null ? product.stock.toString() : ""
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
    }
    setShowAdd(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      price: parseFloat(formData.price),
      stock: formData.stock ? parseInt(formData.stock) : null
    };

    try {
      if (editingProduct) {
        await authApi.updateProduct(editingProduct.id, payload);
      } else {
        await authApi.createProduct(payload);
      }
      setShowAdd(false);
      loadProducts();
    } catch {
      alert("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o produto "${name}"?`)) return;
    
    try {
      await authApi.deleteProduct(id);
      loadProducts();
    } catch {
      alert("Erro ao remover produto");
    }
  };

  const filteredProducts = products.filter(
    (p) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} produto{products.length !== 1 ? "s" : ""} no catálogo</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </button>
      </div>

      {products.length > 0 && (
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
          />
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchTerm ? "Nenhum resultado" : "Nenhum produto"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm ? "Tente buscar com outros termos" : "Adicione seu primeiro produto para a IA começar a vender"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              Adicionar Produto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white flex flex-col rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-all duration-300 group">
              
              <div className="flex justify-between items-start mb-3">
                {product.category ? (
                  <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide">
                    {product.category}
                  </span>
                ) : <span />}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(product)} className="p-1.5 text-gray-400 hover:text-[#4f46e5] bg-gray-50 rounded-lg" title="Editar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg" title="Excluir">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-grow mb-4">
                {product.description || "Sem descrição"}
              </p>

              <div className="flex items-end justify-between pt-4 border-t border-gray-100 mt-auto">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Preço</p>
                  <p className="text-lg font-bold text-[#4f46e5]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency || 'BRL' }).format(product.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Estoque</p>
                  <p className={`text-sm font-semibold ${product.stock !== null && product.stock <= 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                    {product.stock !== null ? `${product.stock} un` : 'Infinito'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editingProduct ? "Editar Produto" : "Novo Produto"}>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome do Produto *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Consultoria Premium"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoria</label>
            <input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Serviços"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preço *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estoque</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="Opcional (Deixe vazio para Infinito)"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o produto, suas regras ou ingredientes..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? "Salvando..." : (editingProduct ? "Salvar Alterações" : "Criar Produto")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
