'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { authApi } from "@/lib/api/client";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "" });
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Produtos</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie os produtos ou serviços oferecidos pela sua empresa.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          Adicionar Produto
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome e Descrição</TableHead>
              <TableHead className="w-48 text-right">Preço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-md">{product.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    R$ {product.price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Novo Produto"
      >
        <form onSubmit={handleAdd} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Produto</label>
            <Input
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
              placeholder="Ex: Cesta de Café da Manhã"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <Textarea
              rows={3}
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Descreva o produto, ingredientes, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
              placeholder="Ex: 99.90"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Criar Produto"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
