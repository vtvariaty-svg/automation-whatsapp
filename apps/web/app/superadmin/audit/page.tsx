'use client';

import { useEffect, useState } from 'react';
import { Activity, Search, History, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  actorUserId: string;
  targetUserId?: string;
  targetTenantId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  status: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/audit-logs?limit=100`);
      const json = await res.json();
      if (json.data) setLogs(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('USER')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (action.includes('PLAN') || action.includes('BILLING')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (action.includes('RESET')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
        <p className="text-slate-500">Trilha de auditoria inalterável de todas as ações administrativas.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <ul className="divide-y divide-slate-100">
          {loading && logs.length === 0 ? (
            <li className="p-8 text-center text-slate-400">Carregando logs de segurança...</li>
          ) : logs.map((log) => (
            <li key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex items-start space-x-4">
              <div className="mt-1">
                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-slate-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border tracking-wide ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <History className="h-3 w-3" />
                    <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString('pt-BR')}</time>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                  <div className="flex items-center space-x-1 border-b border-slate-100 pb-1">
                    <span className="font-medium text-slate-800 w-20">Ator (Admin):</span>
                    <span className="font-mono text-xs bg-slate-100 px-1 rounded">{log.actorUserId || 'Sistema'}</span>
                  </div>
                  <div className="flex items-center space-x-1 border-b border-slate-100 pb-1">
                    <span className="font-medium text-slate-800 w-20">IP Network:</span>
                    <span className="font-mono text-xs">{log.ipAddress || 'unknown'}</span>
                  </div>
                  {log.targetUserId && (
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-slate-800 w-20">Usuário Alvo:</span>
                      <span className="font-mono text-xs">{log.targetUserId}</span>
                    </div>
                  )}
                  {log.targetTenantId && (
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-slate-800 w-20">Tenant Alvo:</span>
                      <span className="font-mono text-xs">{log.targetTenantId}</span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
          {logs.length === 0 && !loading && (
            <li className="p-8 text-center text-slate-400">Nenhum registro de auditoria encontrado.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
