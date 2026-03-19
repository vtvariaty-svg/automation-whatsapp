'use client';

import { useEffect, useState } from 'react';
import { Search, MoreVertical, Ban, CheckCircle, Key, Mail, ShieldAlert } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  forcePasswordReset: boolean;
  lastLoginAt: string | null;
  tenant: { name: string } | null;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/users?search=${search}&limit=50`);
      const json = await res.json();
      if (json.data) setUsers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleStatus = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja ${user.isActive ? 'desativar' : 'ativar'} ${user.email}?`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}/toggle-active`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(`Erro: ${data.error}`);
        return;
      }
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const forceReset = async (user: User) => {
    if (!window.confirm(`Forçar reset de senha para ${user.email}? A conta receberá a flag forcePasswordReset.`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}/force-password-reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) alert(`Erro: ${data.error}`);
      else alert(`Link gerado: ${data.resetLink}`);
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const changeEmail = async (user: User) => {
    const newEmail = window.prompt(`Novo email para ${user.email}:`);
    if (!newEmail) return;

    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/superadmin/users/${user.id}/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Erro: ${data.error}`);
        return;
      }
      fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500">Controle global de contas, senhas e status de acesso.</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-medium">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Último Login</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Carregando...</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.name || 'Sem nome'}</div>
                    <div className="text-sm text-slate-500 flex items-center space-x-1">
                      <span>{user.email}</span>
                      {user.forcePasswordReset && <ShieldAlert className="h-3 w-3 text-red-500" title="Reset Pendente" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.tenant?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center space-x-1 text-sm font-medium ${user.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {user.isActive ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      <span>{user.isActive ? 'Ativo' : 'Inativo'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => toggleStatus(user)}
                      disabled={actionLoading === user.id}
                      className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title={user.isActive ? "Desativar Conta" : "Ativar Conta"}
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => changeEmail(user)}
                      disabled={actionLoading === user.id}
                      className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Alterar Email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => forceReset(user)}
                      disabled={actionLoading === user.id}
                      className="p-2 text-slate-400 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Forçar Reset de Senha"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
