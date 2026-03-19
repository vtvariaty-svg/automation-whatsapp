'use client';

import { useState, useEffect, useRef } from 'react';
import { getFiscalSettings, saveFiscalSettings } from '@/lib/fiscal/service';
import type { FiscalCompanyConfig } from '@/lib/fiscal/types';
import FiscalIntegrationPanel from '@/components/fiscal/FiscalIntegrationPanel';

interface NfeCompany { id: string; name: string; document: string; }

function EmpresaEmissoraSection() {
  const [companies, setCompanies] = useState<NfeCompany[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/fiscal/companies').then(r => r.json()),
      fetch('/api/fiscal/settings').then(r => r.json()),
    ]).then(([companiesRes, settingsRes]) => {
      setCompanies(companiesRes.data ?? []);
      setSelected(settingsRes.nfeCompanyId ?? '');
    }).catch(() => setError('Erro ao carregar empresas. Verifique a integração fiscal.')).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/fiscal/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfeCompanyId: selected }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-10 w-full bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
      {companies.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span>⚠️</span>
          <span>Nenhuma empresa cadastrada no módulo fiscal. <a href="/dashboard/companies" className="underline">Cadastre uma empresa</a> antes de configurar.</span>
        </div>
      ) : (
        <>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
          >
            <option value="">Selecione a empresa emissora...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.document}</option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !selected}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <span>Salvando...</span> : <span>Salvar empresa</span>}
            </button>
            {saved && <span className="text-sm text-emerald-600 font-medium">✅ Salvo</span>}
          </div>
        </>
      )}
    </div>
  );
}

interface CertStatus {
  hasCertificate: boolean;
  disabled?: boolean;
  id?: string;
  thumbprint?: string;
  label?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isExpired?: boolean;
  daysToExpiry?: number | null;
  expiryWarning?: string | null;
}

function CertificateSection() {
  const [status, setStatus] = useState<CertStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/fiscal/certificate')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasCertificate: false }))
      .finally(() => setLoadingStatus(false));
  }, []);

  async function handleUpload() {
    if (!selectedFile || !password) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const pfxBase64 = btoa(binary);

      const response = await fetch('/api/fiscal/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pfxBase64, password, label: label || undefined }),
      });

      const result = await response.json();

      if (!response.ok) {
        setUploadError(result.error ?? 'Erro ao instalar certificado.');
      } else {
        setUploadSuccess(`Certificado instalado. Thumbprint: ${result.thumbprint}`);
        setPassword('');
        setLabel('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        // Refresh status
        fetch('/api/fiscal/certificate').then((r) => r.json()).then(setStatus).catch(() => {});
      }
    } finally {
      setUploading(false);
    }
  }

  function formatDate(iso?: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  if (loadingStatus) {
    return <div className="h-8 w-48 bg-gray-100 animate-pulse rounded-lg" />;
  }

  const isDisabled = status?.disabled;

  return (
    <div className="space-y-4">
      {/* Current cert status */}
      {isDisabled ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
          <span>🔒</span>
          <span>Integração fiscal desabilitada (<code className="text-xs">NFE_EXTERNAL_ENABLED=false</code>). Ative para gerenciar certificados.</span>
        </div>
      ) : status?.hasCertificate ? (
        <div className={`p-4 rounded-xl border ${status.isExpired ? 'bg-red-50 border-red-200' : status.expiryWarning ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{status.isExpired ? '🔴' : status.expiryWarning ? '🟡' : '🟢'}</span>
                <span className={`text-sm font-semibold ${status.isExpired ? 'text-red-700' : status.expiryWarning ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {status.isExpired ? 'Certificado expirado' : 'Certificado ativo'}
                </span>
              </div>
              {status.label && (
                <p className="text-xs text-gray-600">{status.label}</p>
              )}
              <p className="text-xs text-gray-500 font-mono">
                {status.thumbprint ? `${status.thumbprint.slice(0, 16)}...` : ''}
              </p>
              <div className="text-xs text-gray-500 space-x-3">
                <span>De: {formatDate(status.validFrom)}</span>
                <span>Até: {formatDate(status.validTo)}</span>
                {status.daysToExpiry !== null && status.daysToExpiry !== undefined && status.daysToExpiry >= 0 && (
                  <span className={status.expiryWarning ? 'text-amber-600 font-semibold' : ''}>{status.daysToExpiry} dias restantes</span>
                )}
              </div>
            </div>
          </div>
          {status.expiryWarning && (
            <p className="mt-2 text-xs text-amber-700 font-medium">{status.expiryWarning}</p>
          )}
          {status.isExpired && (
            <p className="mt-2 text-xs text-red-700 font-medium">Renove o certificado para continuar emitindo documentos fiscais.</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span>⚠️</span>
          <span>Nenhum certificado digital instalado. A emissão real requer um certificado A1 válido.</span>
        </div>
      )}

      {/* Upload form */}
      {!isDisabled && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {status?.hasCertificate ? 'Renovar certificado' : 'Instalar certificado'}
          </p>

          {/* File picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              selectedFile ? 'border-[#4f46e5] bg-indigo-50/40' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <span className="text-2xl">{selectedFile ? '📄' : '📁'}</span>
            <div className="flex-1 min-w-0">
              {selectedFile ? (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Selecionar certificado .pfx / .p12</p>
                  <p className="text-xs text-gray-400">Clique para abrir o seletor de arquivo</p>
                </>
              )}
            </div>
            {selectedFile && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pfx,.p12"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Senha do certificado</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha do arquivo .pfx"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          {/* Label (optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Identificação (opcional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Certificado 2025"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          {/* Feedback */}
          {uploadError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <span className="flex-shrink-0">⚠️</span>
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
              <span>✅</span>
              <span>{uploadSuccess}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || !password || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Instalando...
              </>
            ) : (
              <>{status?.hasCertificate ? '🔄 Renovar certificado' : '🔐 Instalar certificado'}</>
            )}
          </button>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            O certificado é transmitido via HTTPS e armazenado criptografado no servidor fiscal. A senha nunca é persistida neste sistema.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ConfiguracoesFiscalPage() {
  const [config, setConfig] = useState<FiscalCompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFiscalSettings().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await saveFiscalSettings(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const f = (label: string, key: keyof FiscalCompanyConfig, type = 'text') => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={config ? String(config[key] ?? '') : ''}
        onChange={(e) => setConfig((c) => c ? { ...c, [key]: e.target.value } : c)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações Fiscais</h1>
        <p className="text-sm text-gray-500 mt-1">Dados da empresa e preferências de emissão.</p>
      </div>

      {/* Section: Company */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">🏢</span> Dados da empresa
        </h2>
        {f('Razão Social', 'razaoSocial')}
        {f('CNPJ', 'cnpj')}
        {f('Inscrição Estadual', 'inscricaoEstadual')}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Regime tributário</label>
          <select
            value={config.regime}
            onChange={(e) => setConfig((c) => c ? { ...c, regime: e.target.value as FiscalCompanyConfig['regime'] } : c)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
          >
            <option value="simples">Simples Nacional</option>
            <option value="lucro_presumido">Lucro Presumido</option>
            <option value="lucro_real">Lucro Real</option>
          </select>
        </div>
      </section>

      {/* Section: Fiscal preferences */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">🧾</span> Preferências fiscais
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {f('Série da nota', 'serieNota')}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Próximo número</label>
            <input
              type="number"
              value={config.proximoNumero}
              onChange={(e) => setConfig((c) => c ? { ...c, proximoNumero: Number(e.target.value) } : c)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
        </div>
        {f('Natureza da operação', 'naturezaOperacao')}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Observações padrão</label>
          <textarea
            rows={3}
            value={config.observacoesPadrao}
            onChange={(e) => setConfig((c) => c ? { ...c, observacoesPadrao: e.target.value } : c)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] resize-none"
          />
        </div>
      </section>

      {/* Section: Delivery */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">📨</span> Envio ao cliente
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={config.envioAutomatico}
          onClick={() => setConfig((c) => c ? { ...c, envioAutomatico: !c.envioAutomatico } : c)}
          className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0"
        >
          <div className={`w-10 h-5 rounded-full transition-all relative ${config.envioAutomatico ? 'bg-[#4f46e5]' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.envioAutomatico ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">Envio automático após emissão</span>
        </button>
        {f('Canal WhatsApp para emissão (opcional)', 'canalWhatsapp', 'tel')}
      </section>

      {/* Section: Empresa Emissora */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-base">🏢</span> Empresa emissora padrão
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Empresa cadastrada no módulo fiscal que será usada ao emitir NF-e por este tenant.
          </p>
        </div>
        <EmpresaEmissoraSection />
      </section>

      {/* Section: Certificate */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-base">🔐</span> Certificado Digital A1
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Necessário para emissão real de NF-e. O arquivo .pfx é armazenado criptografado no servidor fiscal.
          </p>
        </div>
        <CertificateSection />
      </section>

      {/* Section: Integration */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">🔗</span> Integração com backend fiscal
        </h2>
        <FiscalIntegrationPanel status={config.integrationStatus} />
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-75"
        >
          {saving ? <span>Salvando...</span> : <span>Salvar configurações</span>}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">✅ Salvo</span>}
      </div>
    </div>
  );
}
