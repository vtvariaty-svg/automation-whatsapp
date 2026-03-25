// apps/web/lib/services/lead-intelligence/googlePlacesProvider.ts

export interface GooglePlacesProviderParams {
  niche: string;
  city: string | null;
  state: string | null;
  radiusKm: number | null;
  maxResults: number;
}

export interface GooglePlacesProviderResult {
  companyName: string;
  placeId: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  source: string; // always "google"
}

/** Wait helper — Google Places API requires ~2 s between next_page_token requests. */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function discoverGooglePlaces(
  params: GooglePlacesProviderParams
): Promise<GooglePlacesProviderResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('Chave da API do Google não configurada.');
  }

  // Build the text query
  const locationParts = [params.city, params.state].filter(Boolean);
  const locationQuery = locationParts.length > 0 ? ` em ${locationParts.join(' ')}` : '';
  const textQuery = `${params.niche}${locationQuery}`;

  const rawResults: any[] = [];

  // ── Paginated TextSearch ─────────────────────────────────────────────────
  // Google Places TextSearch returns max 20 results per page with a next_page_token
  // for subsequent pages (up to 3 pages = 60 results). We keep fetching until we
  // reach maxResults or exhaust available pages.
  const MAX_PAGES = 3; // Google caps at 3 pages per query
  let pageToken: string | null = null;
  let page = 0;

  while (page < MAX_PAGES && rawResults.length < params.maxResults) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    if (pageToken) {
      // Subsequent pages: only pagetoken + key needed
      url.searchParams.append('pagetoken', pageToken);
    } else {
      // First page
      url.searchParams.append('query', textQuery);
      url.searchParams.append('language', 'pt-BR');
    }
    url.searchParams.append('key', apiKey);

    // Google requires a short pause before using a next_page_token
    if (pageToken) await delay(2000);

    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Erro na API do Google Places: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'ZERO_RESULTS') break;
    if (data.status !== 'OK') {
      throw new Error(`Erro na API do Google Places: ${data.status}`);
    }

    rawResults.push(...(data.results || []));
    pageToken = data.next_page_token || null;
    page++;

    // Stop if no more pages
    if (!pageToken) break;
  }

  // Trim to maxResults before Detail lookups (avoid extra API cost)
  const limited = rawResults.slice(0, params.maxResults);

  // ── Build base candidates ────────────────────────────────────────────────
  const candidates: GooglePlacesProviderResult[] = limited.map(r => ({
    companyName: r.name || 'Desconhecido',
    placeId: r.place_id,
    website: null,
    phone: null,
    address: r.formatted_address || null,
    city: params.city || null,
    state: params.state || null,
    category: r.types && r.types.length > 0 ? r.types[0] : null,
    rating: typeof r.rating === 'number' ? r.rating : null,
    reviewsCount: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : null,
    source: 'google',
  }));

  // ── Place Details for website, phone, and precise city/state ────────────
  const enrichedCandidates: GooglePlacesProviderResult[] = [];

  for (const c of candidates) {
    try {
      const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      detailsUrl.searchParams.append('place_id', c.placeId);
      detailsUrl.searchParams.append('fields', 'website,formatted_phone_number,address_components');
      detailsUrl.searchParams.append('key', apiKey);
      detailsUrl.searchParams.append('language', 'pt-BR');

      const detailsRes = await fetch(detailsUrl.toString(), { method: 'GET' });
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        if (detailsData.status === 'OK' && detailsData.result) {
          if (detailsData.result.website) {
            c.website = detailsData.result.website;
          }
          if (detailsData.result.formatted_phone_number) {
            c.phone = detailsData.result.formatted_phone_number;
          }
          // Try to extract city and state from address_components
          const comps = detailsData.result.address_components || [];
          const cityComp = comps.find((comp: any) =>
            comp.types.includes('administrative_area_level_2') || comp.types.includes('locality')
          );
          const stateComp = comps.find((comp: any) =>
            comp.types.includes('administrative_area_level_1')
          );
          if (cityComp) c.city = cityComp.long_name;
          if (stateComp) c.state = stateComp.short_name;
        }
      }
    } catch {
      // Ignore details error and keep what we have
    }
    enrichedCandidates.push(c);
  }

  return enrichedCandidates;
}
