// apps/web/lib/services/lead-intelligence/websiteEnrichmentService.ts

export interface EnrichmentResult {
  success: boolean;
  visitedUrls: string[];
  email?: string;
  phone?: string;
  mobilePhone?: string;
  companyNameHint?: string;
  notes: string[];
}

// Regex minimalista para email e telefone BR
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Telefone genérico que tenta pegar formatos brutos úteis, focado no Brasil:
// (+55)? (xx) xxxxx-xxxx ou similar
const PHONE_REGEX = /(?:\+55\s?)?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[-\s]?\d{4}/g;

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });
  clearTimeout(id);
  return response;
}

export async function enrichFromWebsite(websiteUrl: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    success: false,
    visitedUrls: [],
    notes: [],
  };

  try {
    // 1. Normalização básica da URL
    let baseUrl = websiteUrl.trim();
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;

    const pathsToTry = ['/', '/contato', '/contact', '/sobre', '/about', '/fale-conosco'];
    const emailsFound = new Set<string>();
    const phonesFound = new Set<string>();
    let companyNameHint: string | undefined = undefined;

    // 2. Tentar raspar algumas páginas
    for (const path of pathsToTry) {
      if (emailsFound.size > 0 && phonesFound.size > 0) {
        break; // Já temos o que precisamos
      }

      const targetUrl = new URL(path, origin).toString();
      try {
        const response = await fetchWithTimeout(targetUrl, TIMEOUT_MS);
        if (!response.ok) continue;

        const html = await response.text();
        result.visitedUrls.push(targetUrl);

        // Extrair texto (simplificado) removendo tags script/style
        const bodyText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ');

        // Buscar E-mails
        const emailMatches = bodyText.match(EMAIL_REGEX);
        if (emailMatches) {
          emailMatches.forEach(e => {
            const clean = e.toLowerCase();
            // Evitar imagens ou extensões estranhas caindo no regex
            if (!clean.endsWith('.png') && !clean.endsWith('.jpg') && !clean.endsWith('.gif')) {
              emailsFound.add(clean);
            }
          });
        }

        // Buscar Telefones
        const phoneMatches = bodyText.match(PHONE_REGEX);
        if (phoneMatches) {
          phoneMatches.forEach(p => phonesFound.add(p.trim()));
        }

        // Tentar pegar hint do nome da empresa no title do homepage
        if (path === '/' && !companyNameHint) {
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            // Limpa título ("Empresa XYZ - Soluções em TI" -> "Empresa XYZ")
            companyNameHint = titleMatch[1].split(/[|-]/)[0].trim();
          }
        }

      } catch (e: any) {
        if (e.name === 'AbortError') {
          result.notes.push(`Timeout ao acessar ${targetUrl}`);
        } else {
          result.notes.push(`Erro ao acessar ${targetUrl}: ${e.message}`);
        }
      }
    }

    if (emailsFound.size > 0) {
      result.email = Array.from(emailsFound)[0];
    }

    // Separar telefone de celular, se possível (simplificado para Brasil: oitavo dígito é 9 -> celular)
    if (phonesFound.size > 0) {
      const allPhones = Array.from(phonesFound);
      for (const p of allPhones) {
        const digits = p.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 11) {
          // Se tiver 11 dígitos, provavelmente é celular (tem o 9)
          if (digits.length === 11) {
            if (!result.mobilePhone) result.mobilePhone = p;
          } else {
            if (!result.phone) result.phone = p;
          }
        } else {
          // Pega o que vier como fallback
          if (!result.phone && !result.mobilePhone) result.phone = p;
        }
      }
    }

    if (companyNameHint) {
      result.companyNameHint = companyNameHint;
    }

    if (result.email || result.phone || result.mobilePhone) {
      result.success = true;
      result.notes.push(`Extraídos: ${emailsFound.size} e-mails e ${phonesFound.size} telefones.`);
    } else {
      result.notes.push('Nenhum dado de contato encontrado público.');
    }

  } catch (err: any) {
    result.notes.push(`Falha ao normalizar ou varrer a URL: ${err.message}`);
  }

  return result;
}
