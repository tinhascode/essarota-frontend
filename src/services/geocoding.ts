import { Platform } from 'react-native';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type GeoPlace = LatLng & {
  /** Endereço curto, usado como texto de origem/destino enviado ao backend. */
  label: string;
  /** Complemento (bairro, cidade) para exibir nas sugestões. */
  secondary: string;
};

type NominatimAddress = Partial<
  Record<
    | 'road'
    | 'pedestrian'
    | 'house_number'
    | 'suburb'
    | 'neighbourhood'
    | 'city'
    | 'town'
    | 'village'
    | 'municipality'
    | 'state'
    | 'ISO3166-2-lvl4',
    string
  >
>;

type NominatimPlace = {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
// Nominatim's usage policy allows at most 1 request per second.
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  lastRequestAt = Math.max(Date.now(), lastRequestAt + MIN_INTERVAL_MS);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

async function nominatim<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  await throttle();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const query = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'pt-BR',
    ...params,
  });

  const response = await fetch(`${NOMINATIM_URL}${path}?${query}`, {
    signal,
    headers: Platform.OS === 'web' ? undefined : { 'User-Agent': 'EssaRota/1.0 (app mobile)' },
  });
  if (!response.ok) throw new Error(`Falha na busca de endereços (${response.status})`);
  return (await response.json()) as T;
}

function toGeoPlace(place: NominatimPlace): GeoPlace {
  const address = place.address ?? {};
  const street = address.road ?? address.pedestrian;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;
  const uf = address['ISO3166-2-lvl4']?.split('-')[1] ?? address.state;
  const district = address.suburb ?? address.neighbourhood;

  const primary =
    place.name && place.name !== street
      ? place.name
      : [street, address.house_number].filter(Boolean).join(', ');
  const cityLabel = [city, uf].filter(Boolean).join(' - ');
  const secondary = [district, cityLabel].filter(Boolean).join(', ');

  const label = primary ? [primary, cityLabel].filter(Boolean).join(', ') : place.display_name;

  return {
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    label,
    secondary: secondary || place.display_name,
  };
}

export async function searchPlaces(text: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const places = await nominatim<NominatimPlace[]>(
    '/search',
    { q: text, limit: '5', countrycodes: 'br' },
    signal
  );
  return places.map(toGeoPlace);
}

export async function reverseGeocode({ latitude, longitude }: LatLng): Promise<GeoPlace> {
  const place = await nominatim<NominatimPlace & { error?: string }>('/reverse', {
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
  });
  if (place.error) {
    return {
      latitude,
      longitude,
      label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      secondary: 'Ponto selecionado no mapa',
    };
  }
  return { ...toGeoPlace(place), latitude, longitude };
}
