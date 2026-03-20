/**
 * asaasService.ts
 * HTTP wrapper for the Asaas API (POST /v3/payments — individual charge primitive).
 * No business logic, no Prisma. Pure I/O + typed responses.
 */

const ASAAS_BASE = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://api.asaas.com/api/v3',
};

function baseUrl(env: string): string {
  return env === 'production' ? ASAAS_BASE.production : ASAAS_BASE.sandbox;
}

function headers(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'access_token': apiKey,
  };
}

async function asaasRequest<T>(
  method: 'GET' | 'POST',
  env: string,
  apiKey: string,
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${baseUrl(env)}${path}`, {
    method,
    headers: headers(apiKey),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.errors?.[0]?.description ?? data?.message ?? `Asaas error ${res.status}`;
    throw new Error(`[Asaas] ${msg}`);
  }

  return data as T;
}

// ── Customer ──────────────────────────────────────────────────────────────────

export interface AsaasCustomerInput {
  name: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
}

interface AsaasCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpfCnpj?: string;
}

interface AsaasCustomerList {
  data: AsaasCustomer[];
  totalCount: number;
}

/**
 * Tries to find an existing customer by CPF/CNPJ or phone before creating.
 * Returns the Asaas customer ID.
 */
export async function createOrFindAsaasCustomer(
  apiKey: string,
  env: string,
  input: AsaasCustomerInput
): Promise<string> {
  // Search by cpfCnpj first (most reliable dedupe key)
  if (input.cpfCnpj) {
    const cpfClean = input.cpfCnpj.replace(/\D/g, '');
    const found = await asaasRequest<AsaasCustomerList>(
      'GET', env, apiKey,
      `/customers?cpfCnpj=${encodeURIComponent(cpfClean)}&limit=1`
    );
    if (found.data.length > 0) return found.data[0].id;
  }

  // Create new customer
  const created = await asaasRequest<AsaasCustomer>(
    'POST', env, apiKey,
    '/customers',
    {
      name: input.name,
      phone: input.phone.replace(/\D/g, ''),
      ...(input.email ? { email: input.email } : {}),
      ...(input.cpfCnpj ? { cpfCnpj: input.cpfCnpj.replace(/\D/g, '') } : {}),
    }
  );

  return created.id;
}

// ── Charge (POST /v3/payments) ─────────────────────────────────────────────────

export interface AsaasChargeInput {
  customerId: string;
  billingType: string; // BOLETO | PIX | CREDIT_CARD | UNDEFINED
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
}

export interface AsaasChargeResult {
  providerPaymentId: string;
  invoiceUrl: string | null;
  pixCopiaECola: string | null;
  pixQrCodeBase64: string | null;
  status: string;
  billingType: string;
}

interface AsaasPaymentResponse {
  id: string;
  status: string;
  billingType: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixTransaction?: {
    encodedImage?: string;
    payload?: string;
  };
}

export async function createCharge(
  apiKey: string,
  env: string,
  input: AsaasChargeInput
): Promise<AsaasChargeResult> {
  const payment = await asaasRequest<AsaasPaymentResponse>(
    'POST', env, apiKey,
    '/payments',
    {
      customer: input.customerId,
      billingType: input.billingType,
      value: input.value,
      dueDate: input.dueDate,
      description: input.description ?? '',
    }
  );

  // For PIX charges, fetch QR code separately
  let pixCopiaECola: string | null = null;
  let pixQrCodeBase64: string | null = null;

  if (payment.billingType === 'PIX' || input.billingType === 'PIX') {
    try {
      const pixData = await asaasRequest<{ encodedImage?: string; payload?: string }>(
        'GET', env, apiKey,
        `/payments/${payment.id}/pixQrCode`
      );
      pixQrCodeBase64 = pixData.encodedImage ?? null;
      pixCopiaECola = pixData.payload ?? null;
    } catch {
      // Non-fatal — invoice URL still valid
    }
  }

  return {
    providerPaymentId: payment.id,
    invoiceUrl: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
    pixCopiaECola,
    pixQrCodeBase64,
    status: payment.status,
    billingType: payment.billingType,
  };
}

// ── Get charge status ──────────────────────────────────────────────────────────

export interface AsaasChargeStatus {
  id: string;
  status: string;
  value: number;
  billingType: string;
  paymentDate?: string;
}

export async function getCharge(
  apiKey: string,
  env: string,
  providerPaymentId: string
): Promise<AsaasChargeStatus> {
  return asaasRequest<AsaasChargeStatus>(
    'GET', env, apiKey,
    `/payments/${providerPaymentId}`
  );
}
