import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8000';

type PickupStatus =
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_EN_ROUTE'
  | 'PICKUP_READY'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'COMPLETED';

type Pickup = {
  id: number;
  donation_id: number;
  driver_id: number;
  recipient_id: number;
  status: PickupStatus;
  estimated_arrival: string | null;
  donor_name: string;
  recipient_name: string;
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

type Route = {
  stops: { name: string; role: string }[];
  distance_km: number;
  travel_minutes: number;
  remaining_usable_minutes: number;
  is_feasible: boolean;
  estimate_label: string;
};

const nextAction: Record<PickupStatus, { label: string; status: PickupStatus } | undefined> = {
  DRIVER_ASSIGNED: { label: 'START TRIP', status: 'DRIVER_EN_ROUTE' },
  DRIVER_EN_ROUTE: { label: 'ARRIVED AT DONOR', status: 'PICKUP_READY' },
  PICKUP_READY: { label: 'PICKED UP', status: 'PICKED_UP' },
  PICKED_UP: { label: 'START DELIVERY', status: 'DELIVERING' },
  DELIVERING: { label: 'DELIVERED', status: 'DELIVERED' },
  DELIVERED: { label: 'COMPLETE RESCUE', status: 'COMPLETED' },
  COMPLETED: undefined,
};

const DriverDashboard: React.FC = () => {
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAssignment = async () => {
    try {
      const response = await fetch(`${API_BASE}/dispatch/1`);
      if (!response.ok) throw new Error('No active pickup assignment found.');
      const assignment = (await response.json()) as Pickup;
      setPickup(assignment);
      const routeResponse = await fetch(`${API_BASE}/routes/${assignment.donation_id}`);
      if (routeResponse.ok) setRoute((await routeResponse.json()) as Route);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load assignment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAssignment();
  }, []);

  const advancePickup = async () => {
    if (!pickup) return;
    const action = nextAction[pickup.status];
    if (!action) return;
    const response = await fetch(`${API_BASE}/pickups/${pickup.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action.status, actor: 'driver-dashboard' }),
    });
    if (!response.ok) {
      setError('That status update was rejected. Refresh the assignment and try again.');
      return;
    }
    await loadAssignment();
  };

  if (loading) return <main className="driver-shell"><p>Loading assignment...</p></main>;

  return (
    <main className="driver-shell">
      <header className="driver-header">
        <div>
          <p className="eyebrow">SURPLUS-TO-SHELTER / DRIVER OPS</p>
          <h1>Current assignment</h1>
        </div>
        <span className="live-pill">LIVE RESCUE</span>
      </header>
      {error && <p className="error-banner">{error}</p>}
      {pickup && route ? (
        <section className="assignment-grid">
          <div className="assignment-panel primary-panel">
            <div className="status-row"><span className="status-dot" />{pickup.status.replaceAll('_', ' ')}</div>
            <p className="eyebrow">FOOD WINDOW</p>
            <strong className="time-value">{route.remaining_usable_minutes} min</strong>
            <p className="muted">Donor-reported usable time remaining</p>
            <div className="route-line">
              {route.stops.map((stop, index) => (
                <React.Fragment key={`${stop.role}-${stop.name}`}>
                  <div className="stop"><span className="stop-marker">{index + 1}</span><span><b>{stop.name}</b><small>{stop.role}</small></span></div>
                  {index < route.stops.length - 1 && <span className="route-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
            <button className="action-button" onClick={() => void advancePickup()} disabled={!nextAction[pickup.status]}>
              {nextAction[pickup.status]?.label || 'RESCUE COMPLETED'}
            </button>
          </div>
          <aside className="assignment-panel details-panel">
            <p className="eyebrow">ROUTE DETAIL</p>
            <div className="metric"><span>Distance</span><b>{route.distance_km} km</b></div>
            <div className="metric"><span>Estimated travel</span><b>{route.travel_minutes} min</b></div>
            <div className="metric"><span>Feasibility</span><b className={route.is_feasible ? 'good' : 'bad'}>{route.is_feasible ? 'ON TIME' : 'AT RISK'}</b></div>
            <p className="route-note">{route.estimate_label}</p>
            <p className="muted">Food: {pickup.servings} {pickup.dietary_type || ''} {pickup.food_type}</p>
            <p className="muted">Urgency: {pickup.urgency}</p>
            <p className="muted">{pickup.pickup_instructions}</p>
          </aside>
        </section>
      ) : <div className="empty-panel"><h2>No active pickup</h2><p>Dispatch will appear here once a matched donation has a feasible driver.</p></div>}
    </main>
  );
};

export default DriverDashboard;
