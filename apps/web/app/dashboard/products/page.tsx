'use client';

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { authApi } from "@/lib/api/client";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "" });

  const loadProducts = async () => {
    try {
      const data = await authApi.listProducts();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao listar produtos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.createProduct({
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      setNewProduct({ name: "", description: "", price: "" });
      setShowAdd(false);
      loadProducts();
    } catch (error) {
      alert("Erro ao adicionar produto");
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Produtos</h2>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancelar" : "Adicionar Produto"}
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border rounded-md"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full">Criar Produto</Button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product: any) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{product.description}</p>
            <p className="text-blue-600 font-bold">R$ {product.price.toFixed(2)}</p>
          </div>
        ))}
        {products.length === 0 && !showAdd && (
          <p className="text-gray-500 italic">Nenhum produto cadastrado.</p>
        )}
      </div>
    </div>
  );
}
