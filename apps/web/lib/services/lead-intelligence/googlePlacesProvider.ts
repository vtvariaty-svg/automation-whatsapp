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

  const candidates: GooglePlacesProviderResult[] = [];
  
  // Limiting to max 20 results per TextSearch API call without page tokens for this stage.
  // We can pass a radius to the TextSearch endpoint (it accepts radius in meters if combined with location, 
  // but TextSearch without a specific location bias is simpler using just the query string).
  // The simplest approach is to use the `textSearch` endpoint directly.
  
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', textQuery);
  url.searchParams.append('language', 'pt-BR');
  if (params.radiusKm) {
    // Text search uses radius only as a bias, but it requires 'location' param to work typically.
    // For simplicity, we just rely on the query string which already includes the city/state.
  }
  url.searchParams.append('key', apiKey);

  const response = await fetch(url.toString(), { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Erro na API do Google Places: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Erro na API do Google Places: ${data.status}`);
  }

  const results = data.results || [];
  
  // Cap results at maxResults (max 20 per page by default in Places API)
  const limit = Math.min(params.maxResults, 20);

  for (let i = 0; i < Math.min(results.length, limit); i++) {
    const r = results[i];
    
    // Extrapolate simplified address components
    // Google Places TextSearch returns `formatted_address` which looks like: "Rua X, 123 - Bairro, City - State, Zip, Country"
    let city = params.city || null;
    let state = params.state || null;
    
    candidates.push({
      companyName: r.name || 'Desconhecido',
      placeId: r.place_id,
      website: null, // Note: TextSearch doesn't return website, would need Place Details
      phone: null,   // TextSearch doesn't return structured phone, would need Place Details
      address: r.formatted_address || null,
      city: city, // Fallback to run params for now
      state: state, // Fallback to run params for now
      category: r.types && r.types.length > 0 ? r.types[0] : null,
      rating: typeof r.rating === 'number' ? r.rating : null,
      reviewsCount: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : null,
      source: 'google'
    });
  }

  // To get website and phone, we would ideally call Place Details for each. 
  // Let's do a lightweight Place Details lookup for the results since they are max 20.
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
          const cityComp = comps.find((comp: any) => comp.types.includes('administrative_area_level_2') || comp.types.includes('locality'));
          const stateComp = comps.find((comp: any) => comp.types.includes('administrative_area_level_1'));
          
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
