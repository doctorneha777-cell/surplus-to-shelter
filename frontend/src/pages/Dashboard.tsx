import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createDonation, DonationRecord, listDonations } from '../services/rescueApi';

const isoMinutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString();

const emptyForm = {
  donor_name: 'Restaurant A',
  food_type: 'Vegetarian meals',
  description: 'Freshly prepared and ready to serve.',
  quantity: 40,
  unit: 'meals',
  servings: 40,
  dietary_type: 'vegetarian',
  allergens: 'None reported',
  prepared_at: new Date().toISOString(),
  usable_until: isoMinutesFromNow(120),
  storage_condition: 'Refrigerated',
  latitude: 12.979,
  longitude: 77.591,
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);

  const activeDonations = useMemo(
    () => donations.filter((donation) => !['COMPLETED', 'CANCELLED'].includes(donation.status)).slice(0, 5),
    [donations],
  );

  const loadDonations = async () => {
    try {
      const nextDonations = await listDonations();
      setDonations(nextDonations);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDonations();
  }, []);

  const handleChange = (field: keyof typeof emptyForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = await createDonation({
        ...form,
        available_from: new Date().toISOString(),
        quantity: Number(form.quantity),
        servings: Number(form.servings),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      setSuccess(`DONATION CREATED — rescue workflow launched for donation #${result.id}.`);
      setForm(emptyForm);
      await loadDonations();
      navigate(`/matches/${result.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Donation could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await createDonation({
        donor_name: 'Demo kitchen',
        food_type: 'Vegetarian meals',
        description: 'Synthetic demo donation for the full rescue workflow.',
        quantity: 40,
        unit: 'meals',
        servings: 40,
        dietary_type: 'vegetarian',
        allergens: 'None reported',
        prepared_at: new Date().toISOString(),
        available_from: new Date().toISOString(),
        usable_until: isoMinutesFromNow(120),
        storage_condition: 'Refrigerated',
        latitude: 12.979,
        longitude: 77.591,
      });
      setSuccess('DEMO ENVIRONMENT — starting the live rescue sequence.');
      navigate(`/matches/${result.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to start the live demo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell donor-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">DONOR OPERATIONS</p>
          <h2>Post surplus food and follow it through delivery.</h2>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={handleDemo} disabled={submitting}>
            {submitting ? 'Starting demo...' : 'RUN LIVE DEMO'}
          </button>
        </div>
      </section>

      {error && <div className="status-banner error-banner">{error}</div>}
      {success && <div className="status-banner success-banner">{success}</div>}

      <div className="dashboard-grid">
        <section className="panel-card donation-form-panel">
          <div className="panel-heading-row">
            <div>
              <p className="eyebrow">POST SURPLUS FOOD</p>
              <h3>Donation intake</h3>
            </div>
            <span className="status-pill">FAST ENTRY</span>
          </div>

          <form onSubmit={handleSubmit} className="donation-form">
            <div className="field-grid">
              <label>
                Food type
                <input value={form.food_type} onChange={(event) => handleChange('food_type', event.target.value)} />
              </label>
              <label>
                Donor name
                <input value={form.donor_name} onChange={(event) => handleChange('donor_name', event.target.value)} />
              </label>
              <label className="span-2">
                Description
                <input value={form.description} onChange={(event) => handleChange('description', event.target.value)} />
              </label>
              <label>
                Quantity
                <input type="number" min="1" value={form.quantity} onChange={(event) => handleChange('quantity', Number(event.target.value))} />
              </label>
              <label>
                Unit
                <input value={form.unit} onChange={(event) => handleChange('unit', event.target.value)} />
              </label>
              <label>
                Servings
                <input type="number" min="1" value={form.servings} onChange={(event) => handleChange('servings', Number(event.target.value))} />
              </label>
              <label>
                Dietary info
                <input value={form.dietary_type} onChange={(event) => handleChange('dietary_type', event.target.value)} />
              </label>
              <label>
                Allergens
                <input value={form.allergens} onChange={(event) => handleChange('allergens', event.target.value)} />
              </label>
              <label>
                Prepared time
                <input type="datetime-local" value={new Date(form.prepared_at).toISOString().slice(0, 16)} onChange={(event) => handleChange('prepared_at', new Date(event.target.value).toISOString())} />
              </label>
              <label>
                Usable until
                <input type="datetime-local" value={new Date(form.usable_until).toISOString().slice(0, 16)} onChange={(event) => handleChange('usable_until', new Date(event.target.value).toISOString())} />
              </label>
              <label>
                Storage condition
                <input value={form.storage_condition} onChange={(event) => handleChange('storage_condition', event.target.value)} />
              </label>
              <label>
                Pickup location
                <input value={form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : 'Restaurant A'} readOnly />
              </label>
            </div>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Posting donation...' : 'POST SURPLUS FOOD'}
            </button>
          </form>
        </section>

        <section className="panel-card">
          <div className="panel-heading-row">
            <div>
              <p className="eyebrow">ACTIVE DONATIONS</p>
              <h3>Rescue queue</h3>
            </div>
            <Link to="/operations" className="inline-link">View operations</Link>
          </div>

          {loading ? (
            <p className="muted">Loading active donations...</p>
          ) : activeDonations.length === 0 ? (
            <div className="empty-box">No active donations.</div>
          ) : (
            <div className="stack-list">
              {activeDonations.map((donation) => (
                <article key={donation.id} className="mini-card">
                  <div className="mini-card-header">
                    <strong>{donation.food_type}</strong>
                    <span className="status-pill subtle">{donation.status}</span>
                  </div>
                  <p>{donation.servings} servings · {donation.quantity} {donation.unit}</p>
                  <p>Usable until {new Date(donation.usable_until).toLocaleString()}</p>
                  <div className="mini-meta-row">
                    <span>Matched: {donation.recipient_id ? 'Yes' : 'Pending'}</span>
                    <span>Driver: {donation.driver_id ? 'Assigned' : 'Unassigned'}</span>
                  </div>
                  <Link to={`/tracking/${donation.id}`}>Track rescue</Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;