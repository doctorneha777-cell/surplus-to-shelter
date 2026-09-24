import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DispatchDashboardRead, getDispatchDashboard, getPickupTimeline, getRoute, TimelineEvent } from '../services/rescueApi';

const statusOrder = ['POSTED', 'MATCHED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'PICKUP_READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'COMPLETED'];

const RescueTrackingPage: React.FC = () => {
  const { donationId } = useParams();
  const donationLookupId = Number(donationId ?? 0);
  const [dispatch, setDispatch] = useState<DispatchDashboardRead | null>(null);
  const [route, setRoute] = useState<{ stops: Array<{ name: string; role: string }>; distance_km: number; travel_minutes: number; remaining_usable_minutes: number; estimate_label: string } | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!donationLookupId) {
      setError('Donation not found.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const nextDispatch = await getDispatchDashboard(donationLookupId);
        const [nextRoute, nextTimeline] = await Promise.all([
          getRoute(donationLookupId),
          getPickupTimeline(nextDispatch.id).catch(() => []),
        ]);
        setDispatch(nextDispatch);
        setRoute(nextRoute);
        setTimeline(nextTimeline);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Route information is temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [donationLookupId]);

  const currentStatus = dispatch?.status ?? 'POSTED';
  const currentStep = statusOrder.indexOf(currentStatus);

  if (loading) {
    return <main className="page-shell"><section className="rescue-panel"><p className="eyebrow">LIVE RESCUE TRACKING</p><h2>Loading route and status timeline...</h2><p className="muted">Preparing the donor, driver, and recipient route information.</p></section></main>;
  }

  return (
    <main className="page-shell">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">DONATION</p>
          <h2>{dispatch?.food_type ?? 'Vegetarian meals'} · {dispatch?.servings ?? 40} meals</h2>
        </div>
        <span className="status-pill">{currentStatus}</span>
      </section>

      {error && <div className="status-banner error-banner">{error}</div>}

      <div className="dashboard-grid tracking-grid">
        <section className="panel-card">
          <p className="eyebrow">REMAINING WINDOW</p>
          <h3>{route?.remaining_usable_minutes ?? '90'} min</h3>
          <div className="timeline">
            {statusOrder.map((status, index) => (
              <div key={status} className={index <= currentStep ? 'timeline-item active' : 'timeline-item'}>
                <span>{index <= currentStep ? '✓' : index === currentStep + 1 ? '●' : '○'}</span>
                <small>{status.replaceAll('_', ' ')}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <p className="eyebrow">MAP</p>
          <h3>Driver → Donor → Recipient</h3>
          <div className="map-card">
            <div className="route-box">
              <span>Driver</span>
              <span>→</span>
              <span>Donor</span>
              <span>→</span>
              <span>Recipient</span>
            </div>
            <div className="mini-grid two-up">
              <div><span>Distance</span><strong>{route?.distance_km ?? 12.4} km</strong></div>
              <div><span>Estimated travel time</span><strong>{route?.travel_minutes ?? 17} min</strong></div>
              <div><span>Driver</span><strong>{dispatch ? 'Assigned driver' : 'Alex'}</strong></div>
              <div><span>Recipient</span><strong>{dispatch?.recipient_name ?? 'Sunrise Shelter'}</strong></div>
              <div><span>Donor</span><strong>{dispatch?.donor_name ?? 'Restaurant A'}</strong></div>
              <div><span>Feasible route</span><strong>{dispatch?.route_feasible ?? true ? 'Yes' : 'No'}</strong></div>
            </div>
            <p className="muted">Estimated travel time — live traffic not included.</p>
            {route?.estimate_label && <p className="route-note">{route.estimate_label}</p>}
          </div>
        </section>
      </div>

      <section className="panel-card">
        <div className="panel-heading-row">
          <div><p className="eyebrow">STATUS TIMELINE</p><h3>Rescue events</h3></div>
        </div>
        <div className="stack-list">
          {timeline.length === 0 ? <div className="empty-box">No timeline events recorded yet.</div> : timeline.map((event) => (
            <article key={event.id} className="mini-card timeline-event">
              <div className="mini-card-header"><strong>{event.status.replaceAll('_', ' ')}</strong><span>{new Date(event.created_at).toLocaleTimeString()}</span></div>
              <p>{event.note || 'Status updated by the rescue system.'}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default RescueTrackingPage;
