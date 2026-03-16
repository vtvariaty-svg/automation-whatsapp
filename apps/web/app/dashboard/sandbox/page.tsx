'use client';

import { useState, useEffect, useCallback } from 'react';

type StepStatus = 'pass' | 'fail' | 'skip';
type RunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'partial';

interface StepResult {
  step: string;
  expected: string;
  actual: string;
  status: StepStatus;
  detail?: string;
}

interface SandboxRun {
  id: string;
  scenario: string;
  status: RunStatus;
  steps: StepResult[];
  summary: string | null;
  createdAt: string;
  finishedAt: string | null;
}

const SCENARIO_LABELS: Record<string, string> = {
  comment_to_dm_flow: 'Comentário → DM → Qualificação → Oferta',
  dm_inbound_ai_handoff: 'DM Inbound → IA → Handoff Humano',
  lead_to_appointment: 'Lead → Agendamento',
  lead_to_checkout_followup: 'Lead → Checkout → Follow-up',
  keyword_rule_match: 'Regra Keyword e Non-keyword',
};

const STATUS_COLOR: Record<RunStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const STEP_COLOR: Record<StepStatus, string> = {
  pass: 'text-green-600',
  fail: 'text-red-600',
  skip: 'text-gray-400',
};

const STEP_ICON: Record<StepStatus, string> = { pass: '✓', fail: '✗', skip: '–' };

export default function SandboxPage() {
  const [runs, setRuns] = useState<SandboxRun[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  });

  const fetchResults = useCallback(async () => {
    const res = await fetch('/api/sandbox/results?limit=30', { headers: authHeaders() });
    if (res.ok) setRuns(await res.json());
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleRun = async () => {
    setRunning(true);
    const body = selectedScenario ? { scenario: selectedScenario } : {};
    await fetch('/api/sandbox/run', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    await fetchResults();
    setRunning(false);
  };

  const handleClear = async () => {
    if (!confirm('Apagar todos os resultados?')) return;
    await fetch('/api/sandbox/results', { method: 'DELETE', headers: authHeaders() });
    setRuns([]);
  };

  const grouped = runs.reduce<Record<string, SandboxRun[]>>((acc, r) => {
    const d = new Date(r.createdAt).toLocaleDateString('pt-BR');
    (acc[d] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sandbox / QA</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Valide seus fluxos críticos sem enviar mensagens reais.
        </p>
      </div>

      {/* Run controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">Cenário</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos os cenários</option>
            {Object.entries(SCENARIO_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          {running ? 'Executando...' : 'Executar'}
        </button>
        {runs.length > 0 && (
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Limpar resultados
          </button>
        )}
      </div>

      {/* Scenario reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(SCENARIO_LABELS).map(([id, label]) => (
          <div key={id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-mono text-gray-400">{id}</p>
            <p className="text-sm text-gray-700 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">Nenhum resultado ainda. Execute um cenário acima.</p>
      )}

      {Object.entries(grouped).map(([date, dayRuns]) => (
        <div key={date}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{date}</p>
          <div className="space-y-2">
            {dayRuns.map((run) => (
              <div key={run.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[run.status]}`}>
                      {run.status}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {SCENARIO_LABELS[run.scenario] ?? run.scenario}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{run.summary}</span>
                    <span>{new Date(run.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{expanded === run.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expanded === run.id && run.steps.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 text-left">
                          <th className="pb-1 w-5"></th>
                          <th className="pb-1 pr-4">Passo</th>
                          <th className="pb-1 pr-4">Esperado</th>
                          <th className="pb-1">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {run.steps.map((step, i) => (
                          <tr key={i}>
                            <td className={`py-1 font-bold ${STEP_COLOR[step.status]}`}>
                              {STEP_ICON[step.status]}
                            </td>
                            <td className="py-1 pr-4 font-mono text-gray-600">{step.step}</td>
                            <td className="py-1 pr-4 text-gray-500">{step.expected}</td>
                            <td className="py-1 text-gray-700">
                              {step.actual}
                              {step.detail && <span className="text-gray-400 ml-1">— {step.detail}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
