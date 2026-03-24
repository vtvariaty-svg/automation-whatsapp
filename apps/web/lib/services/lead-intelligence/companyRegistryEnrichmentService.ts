/**
 * LEAD6 — Company Registry / CNPJ Enrichment Service
 *
 * Queries BrasilAPI to validate and enrich Brazilian company data for a lead candidate.
 * Strategy:
 *   1. If the candidate already has a CNPJ, query the CNPJ endpoint directly.
 *   2. Otherwise, return an unmatched result (conservative: no guessing without a CNPJ).
 * All calls are single-candidate, one-at-a-time.
 */

const BRASILAPI_BASE = process.env.BRASILAPI_BASE_URL ?? 'https://brasilapi.com.br/api';

export interface RegistryEnrichmentResult {
  success: boolean;
  matched: boolean;
  confidence: number; // 0-100
  cnpj?: string;
  legalName?: string;
  tradeName?: string;
  companyType?: string;
  mainActivity?: string;
  city?: string;
  state?: string;
  status?: string; // active | inactive | unknown
  provider: string;
  notes: string[];
  rawSummary?: string;
}

interface BrasilApiCnpjResponse {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  natureza_juridica?: string;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
  descricao_situacao_cadastral?: string;
  situacao_cadastral?: number;
}

function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function parseSituacao(raw?: string): string {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('ativa') || lower === '2') return 'active';
  if (lower.includes('baixada') || lower.includes('inapta') || lower.includes('suspensa')) return 'inactive';
  return 'unknown';
}

async function fetchByCnpj(cnpj: string): Promise<RegistryEnrichmentResult> {
  const cleaned = normalizeCnpj(cnpj);
  const notes: string[] = [];

  if (cleaned.length !== 14) {
    return {
      success: false,
      matched: false,
      confidence: 0,
      provider: 'brasilapi',
      notes: [`CNPJ inválido: ${cnpj} (deve ter 14 dígitos sem formatação)`],
    };
  }

  let data: BrasilApiCnpjResponse;
  try {
    const res = await fetch(`${BRASILAPI_BASE}/cnpj/v1/${cleaned}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 404) {
      return {
        success: true,
        matched: false,
        confidence: 0,
        cnpj: cleaned,
        provider: 'brasilapi',
        notes: ['CNPJ não encontrado na base da Receita Federal via BrasilAPI'],
      };
    }

    if (!res.ok) {
      return {
        success: false,
        matched: false,
        confidence: 0,
        provider: 'brasilapi',
        notes: [`BrasilAPI retornou status ${res.status}`],
      };
    }

    data = (await res.json()) as BrasilApiCnpjResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      matched: false,
      confidence: 0,
      provider: 'brasilapi',
      notes: [`Erro ao chamar BrasilAPI: ${msg}`],
    };
  }

  const legalName = data.razao_social?.trim() || undefined;
  const tradeName = data.nome_fantasia?.trim() || undefined;
  const companyType = data.natureza_juridica?.trim() || undefined;
  const mainActivity = data.cnae_fiscal_descricao?.trim() || undefined;
  const city = data.municipio?.trim() || undefined;
  const state = data.uf?.trim() || undefined;
  const situacaoRaw = data.descricao_situacao_cadastral?.trim();
  const status = parseSituacao(situacaoRaw);

  if (!legalName) {
    notes.push('Razão social não retornada pela API');
  }
  if (status === 'inactive') {
    notes.push(`Empresa com situação cadastral: ${situacaoRaw ?? 'inativa'}`);
  }

  const rawSummary = [
    legalName && `Razão Social: ${legalName}`,
    tradeName && `Nome Fantasia: ${tradeName}`,
    companyType && `Natureza: ${companyType}`,
    mainActivity && `CNAE: ${mainActivity}`,
    city && state && `Localização: ${city}/${state}`,
    situacaoRaw && `Situação: ${situacaoRaw}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    success: true,
    matched: true,
    confidence: 100, // direct CNPJ lookup — full confidence
    cnpj: cleaned,
    legalName,
    tradeName,
    companyType,
    mainActivity,
    city,
    state,
    status,
    provider: 'brasilapi',
    notes,
    rawSummary,
  };
}

export interface CandidateRegistryInput {
  cnpj?: string | null;
}

export async function runCompanyRegistryEnrichment(
  candidate: CandidateRegistryInput,
): Promise<RegistryEnrichmentResult> {
  if (candidate.cnpj) {
    return fetchByCnpj(candidate.cnpj);
  }

  // Conservative: without a CNPJ we do not attempt name-based lookup
  return {
    success: true,
    matched: false,
    confidence: 0,
    provider: 'brasilapi',
    notes: [
      'Candidato sem CNPJ cadastrado. Adicione o CNPJ manualmente para validar via Receita Federal.',
    ],
  };
}
