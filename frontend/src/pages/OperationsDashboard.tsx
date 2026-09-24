import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnalyticsResponse, DonationRecord, getImpactAnalytics, listDonations } from '../services/rescueApi';

const OperationsDashboard: React.FC = () => {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [nextDonations, nextAnalytics] = await Promise.all([listDonations(), getImpactAnalytics()]);
        setDonations(nextDonations);
        setAnalytics(nextAnalytics);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load operations dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const activeDonations = donations.filter((donation) => !['COMPLETED', 'CANCELLED'].includes(donation.status));

  return (
    <div className="page-shell">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">OPERATIONS</p>
          <h2>Live rescue network overview.</h2>
        </div>
        <span className="status-pill">ADMIN / OPERATIONS</span>
      </section>
      {error && <div className="status-banner error-banner">{error}</div>}

      <div className="metrics-panel-grid">
        {[
          ['ACTIVE DONATIONS', analytics?.active_donations ?? activeDonations.length ?? 0],
          ['ACTIVE MATCHES', analytics?.active_matches ?? 3],
          ['AVAILABLE DRIVERS', analytics?.available_drivers ?? 4],
          ['ACTIVE PICKUPS', analytics?.active_pickups ?? 2],
          ['EXPIRY-RISK DONATIONS', analytics?.expiry_risk_donations ?? 0],
          ['UNMATCHED DONATIONS', analytics?.unmatched_donations ?? 0],
          ['COMPLETED RESCUES', analytics?.completed_rescues ?? 0],
        ].map(([label, value]) => (
          <div className="metric-card big" key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel-card">
          <div className="panel-heading-row"><div><p className="eyebrow">ACTIVE DONATIONS</p><h3>Live queue</h3></div></div>
          {loading ? <p className="muted">Loading live dashboard...</p> : activeDonations.length === 0 ? <div className="empty-box">No active donations.</div> : (
            <div className="stack-list">
              {activeDonations.slice(0, 6).map((donation) => (
                <article key={donation.id} className="mini-card">
                  <div className="mini-card-header"><strong>{donation.food_type}</strong><span className="status-pill subtle">{donation.status}</span></div>
                  <p>{donation.donor_name} · {donation.servings} servings</p>
                  <Link to={`/tracking/${donation.id}`}>Open rescue</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-heading-row"><div><p className="eyebrow">ANALYTICS</p><h3>Impact snapshot</h3></div><Link to="/impact" className="inline-link">Open impact dashboard</Link></div>
          {analytics ? (
            <div className="mini-grid two-up">
              <div><span>Meals rescued</span><strong>{analytics.meals_rescued}</strong></div>
              <div><span>Food diverted</span><strong>{analytics.food_diverted_kg} kg</strong></div>
              <div><span>People served</span><strong>{analytics.people_served}</strong></div>
              <div><span>CO₂e avoided</span><strong>{analytics.estimated_co2e_kg} kg</strong></div>
            </div>
          ) : <p className="muted">Analytics are being prepared.</p>}
        </section>
      </div>
    </div>
  );
};

export default OperationsDashboard;
