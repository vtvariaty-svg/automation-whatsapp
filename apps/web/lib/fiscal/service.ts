// ─── Fiscal Service — Adapter Layer ─────────────────────────────────────────
// All functions return Promises, matching the signature of future real API calls.
// To integrate a real fiscal backend: replace mock returns with fetch/axios calls.
// The consuming pages/components don't need to change.

import type {
  FiscalCompanyConfig,
  FiscalCustomer,
  FiscalCatalogItem,
  FiscalDocument,
  FiscalDocumentStatus,
  FiscalRequest,
  FiscalDashboardStats,
} from './types';

import {
  MOCK_COMPANY_CONFIG,
  MOCK_CUSTOMERS,
  MOCK_CATALOG,
  MOCK_DOCUMENTS,
  MOCK_REQUESTS,
  MOCK_DASHBOARD_STATS,
} from './mocks';

// In-memory store for mock mutations (resets on page refresh — expected in mock mode)
let _customers = [...MOCK_CUSTOMERS];
let _catalog = [...MOCK_CATALOG];
let _documents = [...MOCK_DOCUMENTS];
let _requests = [...MOCK_REQUESTS];
let _config = { ...MOCK_COMPANY_CONFIG };

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getFiscalDashboard(): Promise<FiscalDashboardStats> {
  await delay();
  return {
    ...MOCK_DASHBOARD_STATS,
    pendenteValidacao: _documents.filter((d) => d.status === 'pendente_validacao').length,
    erros: _documents.filter((d) => d.status === 'erro_mock').length,
    documentosEmitidos: _documents.filter((d) => d.status === 'emitido_mock').length,
  };
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getFiscalDocuments(): Promise<FiscalDocument[]> {
  await delay();
  return [..._documents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getFiscalDocumentById(id: string): Promise<FiscalDocument | null> {
  await delay(200);
  return _documents.find((d) => d.id === id) ?? null;
}

export async function simulateFiscalEmission(data: {
  tipo: string;
  customerId: string;
  customerNome: string;
  customerDocumento: string;
  itens: FiscalDocument['itens'];
  subtotal: number;
  desconto: number;
  total: number;
  observacoes?: string;
}): Promise<FiscalDocument> {
  await delay(800);
  const id = `doc-${Date.now()}`;
  const now = new Date().toISOString();
  const doc: FiscalDocument = {
    id,
    tipo: data.tipo as FiscalDocument['tipo'],
    status: 'emitido_mock',
    origem: 'painel',
    customerId: data.customerId,
    customerNome: data.customerNome,
    customerDocumento: data.customerDocumento,
    itens: data.itens,
    subtotal: data.subtotal,
    desconto: data.desconto,
    total: data.total,
    observacoes: data.observacoes,
    timeline: [
      { id: 't1', evento: 'Documento criado', descricao: 'Emissão iniciada pelo painel', timestamp: now, status: 'info' },
      { id: 't2', evento: 'Validação concluída', descricao: 'Dados verificados com sucesso', timestamp: now, status: 'success' },
      { id: 't3', evento: 'Emissão simulada', descricao: 'Documento gerado em modo de simulação', timestamp: now, status: 'success' },
    ],
    createdAt: now,
    updatedAt: now,
  };
  _documents = [doc, ..._documents];
  return doc;
}

export async function updateDocumentStatus(id: string, status: FiscalDocumentStatus): Promise<FiscalDocument | null> {
  await delay(300);
  _documents = _documents.map((d) =>
    d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
  );
  return _documents.find((d) => d.id === id) ?? null;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getFiscalCustomers(): Promise<FiscalCustomer[]> {
  await delay();
  return [..._customers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveFiscalCustomer(
  data: Omit<FiscalCustomer, 'id' | 'totalDocumentos' | 'createdAt'>
): Promise<FiscalCustomer> {
  await delay(500);
  const customer: FiscalCustomer = {
    ...data,
    id: `cust-${Date.now()}`,
    totalDocumentos: 0,
    createdAt: new Date().toISOString(),
  };
  _customers = [customer, ..._customers];
  return customer;
}

export async function updateFiscalCustomer(
  id: string,
  data: Partial<FiscalCustomer>
): Promise<FiscalCustomer | null> {
  await delay(400);
  _customers = _customers.map((c) => (c.id === id ? { ...c, ...data } : c));
  return _customers.find((c) => c.id === id) ?? null;
}

export async function deleteFiscalCustomer(id: string): Promise<void> {
  await delay(300);
  _customers = _customers.filter((c) => c.id !== id);
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export async function getFiscalCatalog(): Promise<FiscalCatalogItem[]> {
  await delay();
  return [..._catalog].sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function saveFiscalCatalogItem(
  data: Omit<FiscalCatalogItem, 'id'>
): Promise<FiscalCatalogItem> {
  await delay(500);
  const item: FiscalCatalogItem = { ...data, id: `cat-${Date.now()}` };
  _catalog = [item, ..._catalog];
  return item;
}

export async function updateFiscalCatalogItem(
  id: string,
  data: Partial<FiscalCatalogItem>
): Promise<FiscalCatalogItem | null> {
  await delay(400);
  _catalog = _catalog.map((c) => (c.id === id ? { ...c, ...data } : c));
  return _catalog.find((c) => c.id === id) ?? null;
}

export async function deleteFiscalCatalogItem(id: string): Promise<void> {
  await delay(300);
  _catalog = _catalog.filter((c) => c.id !== id);
}

// ─── WhatsApp Requests ────────────────────────────────────────────────────────

export async function getFiscalRequests(): Promise<FiscalRequest[]> {
  await delay();
  return [..._requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getFiscalRequestById(id: string): Promise<FiscalRequest | null> {
  await delay(200);
  return _requests.find((r) => r.id === id) ?? null;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getFiscalSettings(): Promise<FiscalCompanyConfig> {
  await delay(300);
  return { ..._config };
}

export async function saveFiscalSettings(data: Partial<FiscalCompanyConfig>): Promise<FiscalCompanyConfig> {
  await delay(600);
  _config = { ..._config, ...data };
  return { ..._config };
}
