import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DonationRecord, listDonations } from '../services/rescueApi';

const RecipientDashboard: React.FC = () => {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const nextDonations = await listDonations();
        setDonations(nextDonations.filter((donation) => donation.recipient_id !== null || donation.status !== 'POSTED'));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load incoming donations.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const incoming = donations.filter((donation) => donation.status !== 'COMPLETED').slice(0, 3);

  return (
    <div className="page-shell">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">RECIPIENT DASHBOARD</p>
          <h2>Current need and incoming rescue.</h2>
        </div>
        <span className="status-pill">120 meals needed</span>
      </section>
      {error && <div className="status-banner error-banner">{error}</div>}
      <div className="dashboard-grid recipient-grid">
        <section className="panel-card">
          <p className="eyebrow">CURRENT NEED</p>
          <h3>120 meals needed</h3>
          <div className="mini-grid two-up">
            <div><span>Incoming</span><strong>40 meals</strong></div>
            <div><span>Donor</span><strong>Restaurant A</strong></div>
            <div><span>Driver</span><strong>Alex</strong></div>
            <div><span>ETA</span><strong>17 min</strong></div>
          </div>
          <div className="status-summary-box"><strong>STATUS</strong><span>DELIVERING</span></div>
        </section>

        <section className="panel-card">
          <div className="panel-heading-row">
            <div>
              <p className="eyebrow">INCOMING</p>
              <h3>Incoming deliveries</h3>
            </div>
          </div>
          {loading ? <p className="muted">Loading incoming deliveries...</p> : incoming.length === 0 ? <div className="empty-box">No incoming deliveries.</div> : (
            <div className="stack-list">
              {incoming.map((donation) => (
                <article key={donation.id} className="mini-card">
                  <div className="mini-card-header"><strong>{donation.food_type}</strong><span className="status-pill subtle">{donation.status}</span></div>
                  <p>{donation.servings} meals · {donation.donor_name}</p>
                  <p>Usable by {new Date(donation.usable_until).toLocaleString()}</p>
                  <Link to={`/tracking/${donation.id}`}>Track delivery</Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RecipientDashboard;
