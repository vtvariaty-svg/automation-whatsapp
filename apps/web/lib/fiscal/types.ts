// ─── Fiscal Module Types ────────────────────────────────────────────────────
// Designed to be generic (not NF-e only) — ready for future backend integration.
// Swap service.ts adapter functions to connect real fiscal API without touching UIs.

// ─── Enums / Discriminated Unions ────────────────────────────────────────────

export type FiscalDocumentType = 'nfe' | 'nfse' | 'nfce' | 'cte';

export type FiscalDocumentStatus =
  | 'draft'
  | 'pendente_validacao'
  | 'aguardando_confirmacao'
  | 'pronto_para_emitir'
  | 'emitido_mock'
  | 'erro_mock'
  | 'cancelado'
  // Real integration statuses (from NFE_WEB via /api/fiscal/emit)
  | 'processando'
  | 'autorizado'
  | 'erro_sefaz'
  | 'cancelado_sefaz';

export type FiscalRequestOrigin = 'painel' | 'whatsapp';

export type FiscalIntegrationStatus = 'desconectado' | 'em_validacao' | 'ativo';

/** Plans that unlock fiscal access. Used for UI-level gating labels. */
export type FiscalPlanAccess = 'pro' | 'business';

// ─── Core Entities ─────────────────────────────────────────────────────────

export interface FiscalCompanyConfig {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string;
  regime: 'simples' | 'lucro_presumido' | 'lucro_real';
  serieNota: string;
  proximoNumero: number;
  naturezaOperacao: string;
  observacoesPadrao: string;
  envioAutomatico: boolean;
  canalWhatsapp?: string;
  integrationStatus: FiscalIntegrationStatus;
}

export interface FiscalCustomer {
  id: string;
  nome: string;
  documento: string; // CPF or CNPJ
  tipo: 'pf' | 'pj';
  email?: string;
  telefone?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  totalDocumentos: number;
  createdAt: string;
}

export interface FiscalCatalogItem {
  id: string;
  nome: string;
  tipo: 'produto' | 'servico';
  sku?: string;
  preco: number;
  unidade: string;
  ncm?: string;   // for products (Nomenclatura Comum do Mercosul)
  cnae?: string;  // for services (Classificação Nacional de Atividades Econômicas)
  ativo: boolean;
}

export interface FiscalDocumentItem {
  id: string;
  catalogItemId?: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  desconto?: number;
  total: number;
}

export interface FiscalTimelineEvent {
  id: string;
  evento: string;
  descricao: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'pending' | 'info';
}

export interface FiscalDocument {
  id: string;
  numero?: string;
  tipo: FiscalDocumentType;
  status: FiscalDocumentStatus;
  origem: FiscalRequestOrigin;
  customerId: string;
  customerNome: string;
  customerDocumento: string;
  itens: FiscalDocumentItem[];
  subtotal: number;
  desconto: number;
  total: number;
  observacoes?: string;
  timeline: FiscalTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  // Real integration fields (populated when mode === 'real')
  mode?: 'mock' | 'real';
  externalReferenceId?: string;
  invoiceId?: string;
  protocol?: string;
  requestId?: string;
}

export interface FiscalRequest {
  id: string;
  origem: FiscalRequestOrigin;
  status: FiscalDocumentStatus;
  telefone?: string;
  mensagemOriginal?: string;
  dadosExtraidos?: Partial<{
    clienteNome: string;
    clienteDocumento: string;
    itens: string;
    valor: number;
  }>;
  inconsistencias?: string[];
  documentId?: string;
  timeline: FiscalTimelineEvent[];
  createdAt: string;
}

export interface FiscalDashboardStats {
  solicitacoesHoje: number;
  documentosEmitidos: number;
  pendenteValidacao: number;
  erros: number;
  integrationStatus: FiscalIntegrationStatus;
}

// ─── Auxiliary types for UI / filtering ────────────────────────────────────

export const FISCAL_DOCUMENT_TYPE_LABELS: Record<FiscalDocumentType, string> = {
  nfe: 'NF-e',
  nfse: 'NFS-e',
  nfce: 'NFC-e',
  cte: 'CT-e',
};

export const FISCAL_STATUS_LABELS: Record<FiscalDocumentStatus, string> = {
  draft: 'Rascunho',
  pendente_validacao: 'Pendente',
  aguardando_confirmacao: 'Aguard. Confirmação',
  pronto_para_emitir: 'Pronto p/ Emitir',
  emitido_mock: 'Emitido (simulado)',
  erro_mock: 'Erro',
  cancelado: 'Cancelado',
  processando: 'Processando',
  autorizado: 'Autorizado',
  erro_sefaz: 'Erro SEFAZ',
  cancelado_sefaz: 'Cancelado SEFAZ',
};

export const FISCAL_ORIGIN_LABELS: Record<FiscalRequestOrigin, string> = {
  painel: 'Painel',
  whatsapp: 'WhatsApp',
};
