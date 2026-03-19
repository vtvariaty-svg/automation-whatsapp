'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeedResult {
  tenantId: string;
  userId: string;
  email: string;
  password: string;
}

interface ResetResult {
  ok: boolean;
  tenantId: string;
}

interface CloneResult {
  newTenantId: string;
  userId: string;
  email: string;
  tempPassword: string;
}

interface DemoModeResult {
  isDemo: boolean;
  tenantName: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${(localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}`,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">{title}</p>
      <div className="space-y-1 font-mono text-sm text-green-900">{children}</div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoManagerPage() {
  // Section 1 — current demo mode status
  const [modeResult, setModeResult] = useState<DemoModeResult | null>(null);
  const [modeLoading, setModeLoading] = useState(false);
  const [modeError, setModeError] = useState('');

  // Section 2 — seed
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedError, setSeedError] = useState('');

  // Section 3 — reset
  const [resetTenantId, setResetTenantId] = useState('');
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Section 4 — clone
  const [cloneForm, setCloneForm] = useState({
    tenantId: '',
    newTenantName: '',
    newEmail: '',
  });
  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneError, setCloneError] = useState('');

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCheckMode = async () => {
    setModeLoading(true);
    setModeError('');
    setModeResult(null);
    try {
      const res = await fetch('/api/demo/mode', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      setModeResult(data);
    } catch (err: any) {
      setModeError(err.message);
    } finally {
      setModeLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedError('');
    setSeedResult(null);
    try {
      const res = await fetch('/api/admin/demo/seed', {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        // 409 returns existing data too — still show it
        if (res.status === 409) {
          setSeedResult({ tenantId: data.tenantId, userId: data.userId, email: data.email, password: data.password });
          setSeedError('Demo tenant já existe (dados existentes exibidos abaixo).');
        } else {
          throw new Error(data.error ?? 'Erro desconhecido');
        }
      } else {
        setSeedResult(data);
      }
    } catch (err: any) {
      setSeedError(err.message);
    } finally {
      setSeedLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetTenantId.trim()) {
      setResetError('Informe o Tenant ID.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetResult(null);
    try {
      const res = await fetch('/api/admin/demo/reset', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tenantId: resetTenantId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      setResetResult(data);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleClone = async () => {
    if (!cloneForm.tenantId.trim() || !cloneForm.newTenantName.trim() || !cloneForm.newEmail.trim()) {
      setCloneError('Preencha todos os campos.');
      return;
    }
    setCloneLoading(true);
    setCloneError('');
    setCloneResult(null);
    try {
      const res = await fetch('/api/admin/demo/clone', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          tenantId: cloneForm.tenantId.trim(),
          newTenantName: cloneForm.newTenantName.trim(),
          newEmail: cloneForm.newEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      setCloneResult(data);
    } catch (err: any) {
      setCloneError(err.message);
    } finally {
      setCloneLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demo Tenant Manager</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerenciar tenants de demonstração e clonar para novos trials. Apenas superadmin.
        </p>
      </div>

      {/* Section 1 — Status do modo demo */}
      <SectionCard title="Status do Modo Demo">
        <p className="mb-3 text-sm text-gray-600">
          Verifica se o tenant atual (baseado no token) está em modo demo.
        </p>
        <button
          onClick={handleCheckMode}
          disabled={modeLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {modeLoading ? 'Verificando...' : 'Verificar Status'}
        </button>

        {modeError && <ErrorCard message={modeError} />}
        {modeResult && (
          <ResultCard title="Resultado">
            <p>
              <span className="text-green-700">isDemo:</span>{' '}
              <span className={modeResult.isDemo ? 'text-amber-700 font-semibold' : ''}>
                {String(modeResult.isDemo)}
              </span>
            </p>
            <p>
              <span className="text-green-700">tenantName:</span> {modeResult.tenantName}
            </p>
          </ResultCard>
        )}
      </SectionCard>

      {/* Section 2 — Criar Demo */}
      <SectionCard title="Criar Demo">
        <p className="mb-3 text-sm text-gray-600">
          Cria o tenant <strong>Studio Bella (Demo)</strong> com usuário, assinatura, regras de
          automação, serviços e agendamentos de exemplo.
        </p>
        <button
          onClick={handleSeed}
          disabled={seedLoading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {seedLoading ? <span>Criando...</span> : <span>Criar Demo</span>}
        </button>

        {seedError && !seedResult && <ErrorCard message={seedError} />}
        {seedError && seedResult && (
          <p className="mt-3 text-xs text-amber-700">{seedError}</p>
        )}
        {seedResult && (
          <ResultCard title="Demo criado">
            <p>
              <span className="text-green-700">tenantId:</span> {seedResult.tenantId}
            </p>
            <p>
              <span className="text-green-700">userId:</span> {seedResult.userId}
            </p>
            <p>
              <span className="text-green-700">email:</span> {seedResult.email}
            </p>
            <p>
              <span className="text-green-700">password:</span>{' '}
              <span className="rounded bg-amber-100 px-1 text-amber-800">{seedResult.password}</span>
            </p>
          </ResultCard>
        )}
      </SectionCard>

      {/* Section 3 — Resetar Demo */}
      <SectionCard title="Resetar Demo">
        <p className="mb-3 text-sm text-gray-600">
          Apaga Agendamentos, Regras de Automação e Serviços do tenant demo e refaz o seed original.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={resetTenantId}
            onChange={(e) => setResetTenantId(e.target.value)}
            placeholder="Tenant ID"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
          <button
            onClick={handleReset}
            disabled={resetLoading}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {resetLoading ? 'Resetando...' : 'Resetar Demo'}
          </button>
        </div>

        {resetError && <ErrorCard message={resetError} />}
        {resetResult && (
          <ResultCard title="Demo resetado">
            <p>
              <span className="text-green-700">ok:</span> {String(resetResult.ok)}
            </p>
            <p>
              <span className="text-green-700">tenantId:</span> {resetResult.tenantId}
            </p>
          </ResultCard>
        )}
      </SectionCard>

      {/* Section 4 — Clonar para Trial */}
      <SectionCard title="Clonar para Trial">
        <p className="mb-3 text-sm text-gray-600">
          Copia AutomationRules e Services do tenant demo para um novo tenant com assinatura de
          trial (14 dias). Gera uma senha temporária para o novo usuário admin.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Tenant ID (origem demo)
            </label>
            <input
              type="text"
              value={cloneForm.tenantId}
              onChange={(e) => setCloneForm((f) => ({ ...f, tenantId: e.target.value }))}
              placeholder="uuid do tenant demo"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Nome do novo tenant
            </label>
            <input
              type="text"
              value={cloneForm.newTenantName}
              onChange={(e) => setCloneForm((f) => ({ ...f, newTenantName: e.target.value }))}
              placeholder="Ex: Studio Maria"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              E-mail do novo admin
            </label>
            <input
              type="email"
              value={cloneForm.newEmail}
              onChange={(e) => setCloneForm((f) => ({ ...f, newEmail: e.target.value }))}
              placeholder="admin@novostudio.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleClone}
            disabled={cloneLoading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {cloneLoading ? 'Clonando...' : 'Clonar para Trial'}
          </button>
        </div>

        {cloneError && <ErrorCard message={cloneError} />}
        {cloneResult && (
          <ResultCard title="Trial criado">
            <p>
              <span className="text-green-700">newTenantId:</span> {cloneResult.newTenantId}
            </p>
            <p>
              <span className="text-green-700">userId:</span> {cloneResult.userId}
            </p>
            <p>
              <span className="text-green-700">email:</span> {cloneResult.email}
            </p>
            <p>
              <span className="text-green-700">tempPassword:</span>{' '}
              <span className="rounded bg-violet-100 px-1 font-bold text-violet-800">
                {cloneResult.tempPassword}
              </span>
            </p>
          </ResultCard>
        )}
      </SectionCard>
    </div>
  );
}
