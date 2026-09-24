export const API_BASE = 'http://localhost:8000';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'The requested rescue information is temporarily unavailable.';
    try {
      const payload = await response.json() as { detail?: string; message?: string };
      message = payload.detail || payload.message || message;
    } catch {
      // Ignore JSON parse failures and keep a user-safe message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type DonationRecord = {
  id: number;
  donor_name: string;
  food_type: string;
  description: string | null;
  quantity: number;
  unit: string;
  servings: number;
  dietary_type: string | null;
  allergens: string | null;
  prepared_at: string | null;
  available_from: string;
  usable_until: string;
  storage_condition: string;
  latitude: number;
  longitude: number;
  status: string;
  safety_window_status: string;
  recipient_id: number | null;
  driver_id: number | null;
  created_at: string;
};

export type RecipientRecord = {
  id: number;
  name: string;
  capacity: number;
  current_need: number;
  food_preferences: string | null;
  dietary_restrictions: string | null;
  latitude: number;
  longitude: number;
  operating_hours: string | null;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  available: boolean;
  verified: boolean;
};

export type DriverRecord = {
  id: number;
  name: string;
  phone: string | null;
  vehicle_type: string;
  capacity: number;
  latitude: number;
  longitude: number;
  availability: boolean;
  status: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export type MatchingCandidate = {
  recipient_id: number;
  recipient_name: string;
  overall_score: number;
  distance_km: number;
  reasons: string[];
  components: Record<string, number>;
};

export type MatchRejection = {
  recipient_id: number;
  recipient_name: string;
  reason: string;
};

export type MatchingResponse = {
  donation_id: number;
  candidates: MatchingCandidate[];
  rejected: MatchRejection[];
};

export type DispatchResponse = {
  pickup_id: number;
  donation_id: number;
  recipient_id: number;
  driver_id: number;
  driver_name: string;
  eta_minutes: number;
  distance_km: number;
  score: number;
  reasoning: string;
  rejected_reasons: string[];
  status: string;
};

export type RouteRead = {
  donation_id: number;
  stops: Array<{ name: string; role: string; latitude: number; longitude: number }>;
  distance_km: number;
  travel_minutes: number;
  remaining_usable_minutes: number;
  is_feasible: boolean;
  estimate_label: string;
};

export type DispatchDashboardRead = {
  id: number;
  donation_id: number;
  driver_id: number;
  recipient_id: number;
  assigned_at: string;
  pickup_started_at: string | null;
  picked_up_at: string | null;
  delivery_started_at: string | null;
  delivered_at: string | null;
  status: string;
  estimated_arrival: string | null;
  notes: string | null;
  donor_name: string;
  donor_latitude: number;
  donor_longitude: number;
  recipient_name: string;
  recipient_latitude: number;
  recipient_longitude: number;
  urgency: string;
  food_type: string;
  dietary_type: string | null;
  servings: number;
  distance_km: number;
  travel_minutes: number;
  remaining_usable_minutes: number;
  route_feasible: boolean;
  pickup_instructions: string;
  route_estimate_label: string;
};

export type TimelineEvent = {
  id: number;
  pickup_id: number | null;
  donation_id: number | null;
  old_status: string | null;
  new_status: string | null;
  status: string;
  actor: string;
  note: string | null;
  created_at: string;
};

export type AnalyticsResponse = {
  period_label: string;
  meals_rescued: number;
  food_diverted_kg: number;
  people_served: number;
  estimated_people_served?: unknown;
  estimated_co2e_kg: number;
  co2e_avoided_kg?: unknown;
  average_time_to_match_minutes: number;
  average_pickup_minutes: number;
  average_delivery_minutes: number;
  rescue_before_expiry_rate: number;
  donations_completed: number;
  active_donations: number;
  active_matches: number;
  available_drivers: number;
  active_pickups: number;
  expiry_risk_donations: number;
  unmatched_donations: number;
  completed_rescues: number;
  methodology: string;
  funnel: Record<string, number>;
  food_categories: Array<{ category: string; donations: number; meals: number; completed: number; completion_rate: number }>;
  recipient_demand: Array<{ name: string; current_need: number; capacity: number; fulfilled: number }>;
  recent_activity: Array<{ donation_id: number; meals: number; completed_at: string }>;
  rescue_trends: Array<{ label: string; value: number }>;
  geographic_distribution: Array<{ region: string; value: number }>;
};

export const listDonations = () => api<DonationRecord[]>('/donations');

export const createDonation = (payload: Record<string, unknown>) => api<DonationRecord>('/donations', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const runMatching = (donationId: number) => api<MatchingResponse>(`/matching/run/${donationId}`, {
  method: 'POST',
});

export const listRecipients = () => api<RecipientRecord[]>('/recipients');

export const listDrivers = () => api<DriverRecord[]>('/drivers');

export const dispatchDonation = (donationId: number, recipientId: number) => api<DispatchResponse>(`/dispatch/${donationId}`, {
  method: 'POST',
  body: JSON.stringify({ recipient_id: recipientId }),
});

export const getDispatchDashboard = (donationId: number) => api<DispatchDashboardRead>(`/dispatch/${donationId}`);

export const getRoute = (donationId: number) => api<RouteRead>(`/routes/${donationId}`);

export const getPickupTimeline = (pickupId: number) => api<TimelineEvent[]>(`/pickups/${pickupId}/timeline`);

export const updatePickupStatus = (pickupId: number, status: string, actor: string) => api<TimelineEvent>(`/pickups/${pickupId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status, actor }),
});

export const getImpactAnalytics = (range = 'all') => {
  const params = range === 'all' ? '' : `?start_date=${range}`;
  return api<AnalyticsResponse>(`/impact/analytics${params}`);
};

export const getLatestDonationDispatch = async (donationId: number) => {
  try {
    return await getDispatchDashboard(donationId);
  } catch {
    return null;
  }
};
