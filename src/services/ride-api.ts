export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RideCoordinates = { latitude: number; longitude: number };

type Ride = { id: string; status: RideStatus };
type CreateRideInput = {
  pickup: string;
  destination: string;
  pickupCoordinates: RideCoordinates | null;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

function apiUrl(path: string) {
  if (!API_URL) throw new Error('Ride service is not configured. Set EXPO_PUBLIC_API_URL.');
  return `${API_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Ride service returned ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

function normalizeStatus(status: string): RideStatus {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, '_');
  if (
    normalized === 'requested' || normalized === 'accepted' ||
    normalized === 'driver_arriving' || normalized === 'in_progress' ||
    normalized === 'completed' || normalized === 'cancelled'
  ) return normalized;
  throw new Error(`Ride service returned an unknown ride status: ${status}`);
}

export async function findNearbyDrivers(
  pickup: string,
  coordinates: RideCoordinates | null,
): Promise<{ count: number }> {
  const params = new URLSearchParams({ pickup });
  if (coordinates) {
    params.set('latitude', String(coordinates.latitude));
    params.set('longitude', String(coordinates.longitude));
  }
  const result = await request<{ count?: number; drivers?: unknown[] }>(`/drivers/nearby?${params}`);
  return { count: result.count ?? result.drivers?.length ?? 0 };
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const result = await request<{ id: string; status: string }>('/rides', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return { id: result.id, status: normalizeStatus(result.status) };
}

export async function getRide(id: string): Promise<Ride> {
  const result = await request<{ id: string; status: string }>(`/rides/${encodeURIComponent(id)}`);
  return { id: result.id, status: normalizeStatus(result.status) };
}