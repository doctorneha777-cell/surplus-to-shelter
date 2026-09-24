import React, { useEffect, useMemo, useState } from 'react';
import { DispatchResponse, DispatchDashboardRead, getDispatchDashboard, listRecipients, dispatchDonation } from '../services/rescueApi';

const DriverAssignmentScreen: React.FC<{ donationId: number; preferredRecipientId?: number | null }> = ({ donationId, preferredRecipientId }) => {
  const [assignment, setAssignment] = useState<DispatchDashboardRead | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DispatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dispatchLabel = useMemo(() => {
    if (!assignment) return 'ASSIGN DRIVER';
    return assignment.status === 'DRIVER_ASSIGNED' ? 'Driver assigned' : assignment.status.replaceAll('_', ' ');
  }, [assignment]);

  const refreshAssignment = async () => {
    try {
      const nextAssignment = await getDispatchDashboard(donationId);
      setAssignment(nextAssignment);
      setCurrentStatus({
        pickup_id: nextAssignment.id,
        donation_id: nextAssignment.donation_id,
        recipient_id: nextAssignment.recipient_id,
        driver_id: nextAssignment.driver_id,
        driver_name: 'Assigned driver',
        eta_minutes: nextAssignment.travel_minutes,
        distance_km: nextAssignment.distance_km,
        score: 0,
        reasoning: nextAssignment.pickup_instructions,
        rejected_reasons: [],
        status: nextAssignment.status,
      });
      setError('');
    } catch (requestError) {
      setAssignment(null);
      setCurrentStatus(null);
      setError(requestError instanceof Error ? requestError.message : 'No driver assignment is active yet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAssignment();
  }, [donationId]);

  const assignDriver = async () => {
    try {
      setLoading(true);
      const recipients = await listRecipients();
      const candidateId = preferredRecipientId ?? recipients.find((recipient) => recipient.available)?.id ?? recipients[0]?.id;
      if (!candidateId) {
        throw new Error('Unable to find a feasible recipient.');
      }
      const result = await dispatchDonation(donationId, candidateId);
      setCurrentStatus(result);
      await refreshAssignment();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No available driver can reach the pickup within the usable window.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !assignment && !currentStatus) {
    return <section className="rescue-panel"><p className="eyebrow">DRIVER ASSIGNMENT</p><h2>Assigning driver...</h2><p className="muted">Checking available vehicles and route feasibility.</p></section>;
  }

  if (!assignment && !currentStatus) {
    return <section className="rescue-panel"><p className="eyebrow">DRIVER ASSIGNMENT</p><h2>No assignment available</h2>{error ? <p className="error-text">{error}</p> : <p className="muted">There are no feasible driver candidates for this donation yet.</p>}<button type="button" className="primary-button" onClick={() => void assignDriver()}>Assign driver</button></section>;
  }

  const activeAssignment = assignment ?? currentStatus;

  return (
    <section className="rescue-panel">
      <p className="eyebrow">DRIVER ASSIGNMENT</p>
      <div className="panel-heading-row">
        <div>
          <h2>Driver assignment</h2>
          <p className="muted">Driver, vehicle, ETA, and rescue route summary.</p>
        </div>
        <span className="status-pill">{dispatchLabel}</span>
      </div>

      <div className="assignment-summary">
        <div>
          <span className="meta-label">Driver</span>
          <strong>{assignment ? 'Assigned driver' : currentStatus?.driver_name ?? 'Awaiting assignment'}</strong>
        </div>
        <div>
          <span className="meta-label">Vehicle</span>
          <strong>{assignment ? 'Van' : 'Awaiting availability'}</strong>
        </div>
        <div>
          <span className="meta-label">ETA</span>
          <strong>{assignment ? `${assignment.travel_minutes} min` : 'Pending'}</strong>
        </div>
        <div>
          <span className="meta-label">Capacity</span>
          <strong>{assignment ? '60 meals' : 'TBD'}</strong>
        </div>
      </div>

      {assignment && (
        <div className="route-steps">
          <span>DRIVER</span>
          <span className="route-arrow-horizontal">↓</span>
          <span>DONOR</span>
          <span className="route-arrow-horizontal">↓</span>
          <span>RECIPIENT</span>
        </div>
      )}

      {assignment && (
        <div className="mini-grid">
          <div><span>Donation</span><strong>{assignment.food_type}</strong></div>
          <div><span>Meals</span><strong>{assignment.servings}</strong></div>
          <div><span>Route feasibility</span><strong>{assignment.route_feasible ? 'ON TIME' : 'AT RISK'}</strong></div>
          <div><span>Status</span><strong>{assignment.status}</strong></div>
        </div>
      )}

      {!assignment && (
        <button type="button" className="primary-button" onClick={() => void assignDriver()}>Assign driver</button>
      )}

      {error && <p className="error-text">{error}</p>}
    </section>
  );
};

export default DriverAssignmentScreen;
