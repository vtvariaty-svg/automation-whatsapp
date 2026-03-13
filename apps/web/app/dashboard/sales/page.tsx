'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Product {
  name: string;
  price: number;
}

interface Opportunity {
  id: string;
  contactId: string;
  status: string;
  value: number | null;
  product?: Product | null;
  createdAt: string;
}

const KANBAN_COLUMNS = [
  { id: 'novo_lead', title: 'Novo Lead', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { id: 'interessado', title: 'Interessado', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  { id: 'checkout_enviado', title: 'Checkout Enviado', color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  { id: 'pago', title: 'Pago', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  { id: 'pos_venda', title: 'Pós-venda', color: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' },
];

export default function SalesCRM() {
  const { token } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, [token]);

  const fetchOpportunities = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sales/opportunities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update local state
    const newStatus = destination.droppableId;
    setOpportunities(prev => 
      prev.map(opp => opp.id === draggableId ? { ...opp, status: newStatus } : opp)
    );

    // Persist to backend
    try {
      await fetch(`/api/sales/opportunities/${draggableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on failure (optional, simplistic fallback here)
      fetchOpportunities();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const getOppByStatus = (status: string) => opportunities.filter(o => o.status === status);

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-[#0A0A0A] text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Pipeline de Vendas
        </h1>
        <p className="text-gray-400 mt-2">Arraste os cards para atualizar o status das negociações feitas pela IA.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start min-w-max">
            {KANBAN_COLUMNS.map(column => (
              <div key={column.id} className="w-80 flex flex-col h-full max-h-full">
                <div className={`px-4 py-3 rounded-t-xl border border-b-0 font-semibold flex items-center justify-between ${column.color}`}>
                  <span>{column.title}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                    {getOppByStatus(column.id).length}
                  </span>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 rounded-b-xl border ${column.color.replace('text-', 'border-').split(' ')[2]} border-t-0 bg-[#121212] overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-[#1A1A1A]' : ''}`}
                    >
                      {getOppByStatus(column.id).map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 p-4 rounded-xl border border-white/5 bg-[#1E1E1E] shadow-lg backdrop-blur-sm transition-all ${snapshot.isDragging ? 'shadow-indigo-500/20 border-indigo-500/50 rotate-2' : 'hover:border-white/10'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-gray-500">#{opp.id.split('-')[0]}</span>
                                <span className="text-xs text-gray-400">{new Date(opp.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                              
                              <div className="font-medium mb-1 truncate">
                                {opp.contactId}
                              </div>
                              
                              {opp.product && (
                                <div className="text-sm flex items-center mt-3 p-2 bg-white/5 rounded-lg">
                                  <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-2 text-xs">📦</div>
                                  <div className="flex flex-col truncate">
                                    <span className="truncate text-gray-300">{opp.product.name}</span>
                                  </div>
                                </div>
                              )}
                              
                              {opp.value && (
                                <div className="mt-3 text-emerald-400 font-semibold">
                                  R$ {opp.value.toFixed(2)}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
