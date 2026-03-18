// ─── NFE_WEB External API Contract Types ─────────────────────────────────────
// SERVER-SIDE ONLY — used only in nfeClient.ts and route handlers.
// Never import these in client components or pages.

export interface NfeAddress {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface NfeCustomer {
  document: string;
  name: string;
  email?: string;
  address: NfeAddress;
}

export interface NfeItem {
  codigo_produto: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  cfop?: string;
  ncm?: string;
  unidade?: string;
}

export interface NfeIssuePayload {
  external_reference_id: string;
  company_id: string;
  natureza_operacao: string;
  customer: NfeCustomer;
  items: NfeItem[];
}

export interface NfeIssueResponse {
  request_id: string;
  idempotency_key: string;
  status: string;
  invoice_id: string;
  external_reference_id: string;
  protocol?: string;
}

export interface NfeStatusResponse {
  invoice_id: string;
  external_reference_id?: string;
  status: string;
  chave?: string;
  protocol?: string;
  created_at?: string;
}

/** Structured error from nfeClient — never a raw HTTP Response. */
export interface NfeClientError {
  statusCode: number;
  code?: string;
  message: string;
  retryable: boolean;
}
