import React, { useEffect, useState } from 'react';
import { createDemoScenario, DEMO_STAGE_SEQUENCE } from '../services/demoEngine';
import { listDonations, listRecipients, createDonation, runMatching, dispatchDonation, getRoute, getDispatchDashboard, getImpactAnalytics, updatePickupStatus } from '../services/rescueApi';
import { fetchNotifications } from '../services/notifications';

const formatMinutes = (minutes: number) => {
  const totalMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  return `${hours}h ${remainder}m`;
};

const metricValue = (metric: unknown, fallback = 0): number => {
  if (typeof metric === 'number') return metric;
  if (typeof metric === 'object' && metric !== null && 'value' in metric && typeof metric.value === 'number') {
    return metric.value;
  }
  return fallback;
};

const DemoPage: React.FC = () => {
  const [scenarioKey, setScenarioKey] = useState<'successful' | 'infeasible' | 'expiring'>('successful');
  const [scenario, setScenario] = useState(createDemoScenario());
  const [currentStage, setCurrentStage] = useState('READY');
  const [progress, setProgress] = useState({ current: 0, total: 7 });
  const [events, setEvents] = useState<Array<{ time: string; label: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{id: number; title: string; message: string}>>([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('Awaiting donor submission.');
  const [impact, setImpact] = useState({ meals_rescued: 0, donations_completed: 0, estimated_people_served: 0, co2e_avoided_kg: 0 });
  const [route, setRoute] = useState<{ is_feasible: boolean; distance_km: number; travel_minutes: number; remaining_usable_minutes: number; estimate_label: string } | null>(null);
  const [matchingReasons, setMatchingReasons] = useState<string[]>([]);
  const [rejectedReasons, setRejectedReasons] = useState<string[]>([]);
  const [resetting, setResetting] = useState(false);

  const availableStages = DEMO_STAGE_SEQUENCE;

  const updateScenario = (key: 'successful' | 'infeasible' | 'expiring') => {
    const nextScenario = createDemoScenario(key);
    setScenarioKey(key);
    setScenario(nextScenario);
    setCurrentStage('READY');
    setProgress({ current: 0, total: 8 });
    setEvents([]);
    setNotifications([]);
    setError('');
    setStatusMessage('Awaiting donor submission.');
    setImpact({ meals_rescued: 0, donations_completed: 0, estimated_people_served: 0, co2e_avoided_kg: 0 });
    setRoute(null);
    setMatchingReasons([]);
    setRejectedReasons([]);
  };

  const appendEvent = (label: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setEvents((current) => [...current, { time, label }].slice(-8));
  };

  useEffect(() => {
    void updateScenario(scenarioKey);
  }, []);

  const loadNotifications = async () => {
    try {
      const nextNotifications = await fetchNotifications('donor');
      setNotifications(nextNotifications.slice(0, 5).map((item) => ({ id: item.id, title: item.title, message: item.message })));
    } catch {
      setNotifications([]);
    }
  };

  const loadImpact = async () => {
    try {
      const analytics = await getImpactAnalytics();
      setImpact({
        meals_rescued: metricValue(analytics.meals_rescued),
        donations_completed: metricValue(analytics.donations_completed),
        estimated_people_served: metricValue(analytics.estimated_people_served),
        co2e_avoided_kg: metricValue(analytics.co2e_avoided_kg),
      });
    } catch {
      setImpact({ meals_rescued: 0, donations_completed: 0, estimated_people_served: 0, co2e_avoided_kg: 0 });
    }
  };

  useEffect(() => {
    void loadNotifications();
    void loadImpact();
  }, [scenarioKey]);

  const ensureDemoNetwork = async () => {
    const recipients = await listRecipients();
    const scenarioRecipient = {
      name: scenario.recipient_name,
      capacity: Number(scenario.recipient_capacity),
      current_need: Number(scenario.recipient_need),
      food_preferences: scenario.food_type,
      dietary_restrictions: 'any',
      latitude: Number(scenario.recipient_latitude),
      longitude: Number(scenario.recipient_longitude),
      operating_hours: '08:00-20:00',
      urgency: 'HIGH',
      available: true,
      verified: true,
    };

    const matchedRecipient = recipients.find((item) => item.name === scenarioRecipient.name);
    if (!matchedRecipient) {
      const response = await fetch('http://localhost:8000/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioRecipient),
      });
      if (!response.ok) {
        throw new Error('Recipient creation failed.');
      }
    }

    const driverPayload = {
      name: scenario.driver_name,
      phone: '555-0100',
      vehicle_type: scenario.driver_vehicle,
      capacity: Number(scenario.driver_capacity),
      latitude: Number(scenario.driver_latitude),
      longitude: Number(scenario.driver_longitude),
      availability: Boolean(scenario.driver_available),
      status: scenario.driver_available ? 'AVAILABLE' : 'OFFLINE',
      verified: true,
    };

    const response = await fetch('http://localhost:8000/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverPayload),
    });
    if (!response.ok) {
      throw new Error('Driver creation failed.');
    }
  };

  const handleNextStep = async () => {
    if (currentStage === 'RESCUE_COMPLETED') {
      return;
    }

    try {
      setError('');
      if (currentStage === 'READY') {
        await ensureDemoNetwork();
        const donationPayload = {
          donor_name: scenario.donor_name,
          food_type: scenario.food_type,
          description: 'Synthetic demo donation for the live rescue workflow.',
          quantity: scenario.donation_quantity,
          unit: 'meals',
          servings: scenario.servings,
          dietary_type: 'vegetarian',
          allergens: 'None reported',
          prepared_at: new Date().toISOString(),
          available_from: new Date().toISOString(),
          usable_until: new Date(Date.now() + Number(scenario.usable_minutes) * 60 * 1000).toISOString(),
          storage_condition: 'Refrigerated',
          latitude: Number(scenario.donor_latitude),
          longitude: Number(scenario.donor_longitude),
        };

        const donation = await createDonation(donationPayload);
        appendEvent('Donation posted');
        setStatusMessage(`Donation #${donation.id} created for the ${scenario.name.toLowerCase()} flow.`);
        setCurrentStage('DONATION_POSTED');
        setProgress({ current: 1, total: 8 });
      } else if (currentStage === 'DONATION_POSTED') {
        appendEvent('Donation validated');
        setCurrentStage('VALIDATION');
        setProgress({ current: 2, total: 8 });
        setStatusMessage('Validation checks the usable window and capacity before matching.');
      } else if (currentStage === 'VALIDATION') {
        appendEvent('Validation passed');
        setCurrentStage('MATCHING');
        setProgress({ current: 3, total: 8 });
        setStatusMessage('Matching engine evaluating candidate recipients.');
      } else if (currentStage === 'MATCHING') {
        const created = await listDonations();
        const donation = created[0] ?? null;
        if (!donation) {
          throw new Error('Matching service unavailable.');
        }
        const matchResult = await runMatching(donation.id);
        const nextReasons = matchResult.candidates[0]?.reasons ?? ['Capacity compatible', 'Food compatible', 'Time feasible', 'Within route constraints'];
        const nextRejected = matchResult.rejected.map((item) => item.reason);
        setMatchingReasons(nextReasons);
        setRejectedReasons(nextRejected);
        appendEvent(`${matchResult.candidates.length} recipients evaluated`);
        appendEvent('Recipient selected');
        setStatusMessage(matchResult.candidates[0] ? `Selected ${matchResult.candidates[0].recipient_name}.` : 'No feasible rescue path available.');
        setCurrentStage('DRIVER_DISPATCH');
        setProgress({ current: 4, total: 8 });
      } else if (currentStage === 'DRIVER_DISPATCH') {
        const created = await listDonations();
        const donation = created[0] ?? null;
        const recipients = await listRecipients();
        const recipient = recipients.find((item) => item.name === scenario.recipient_name) ?? recipients[0];
        if (!donation || !recipient) {
          throw new Error('Dispatch service unavailable.');
        }
        const dispatch = await dispatchDonation(donation.id, recipient.id);
        appendEvent('Driver assigned');
        setStatusMessage(`${dispatch.driver_name} assigned to the rescue.`);
        setCurrentStage('ROUTE_READY');
        setProgress({ current: 5, total: 8 });
      } else if (currentStage === 'ROUTE_READY') {
        const created = await listDonations();
        const donation = created[0] ?? null;
        if (!donation) {
          throw new Error('Route service unavailable.');
        }
        const routeResult = await getRoute(donation.id);
        setRoute({
          is_feasible: routeResult.is_feasible,
          distance_km: routeResult.distance_km,
          travel_minutes: routeResult.travel_minutes,
          remaining_usable_minutes: routeResult.remaining_usable_minutes,
          estimate_label: routeResult.estimate_label,
        });
        appendEvent('Route verified feasible');
        setStatusMessage(routeResult.is_feasible ? 'Route is feasible within the usable window.' : 'Route is not feasible within the usable window.');
        setCurrentStage('PICKUP_READY');
        setProgress({ current: 6, total: 8 });
      } else if (currentStage === 'PICKUP_READY') {
        const created = await listDonations();
        const donation = created[0] ?? null;
        if (!donation) {
          throw new Error('Pickup service unavailable.');
        }
        const dispatchData = await getDispatchDashboard(donation.id);
        if (!dispatchData) {
          throw new Error('Pickup service unavailable.');
        }
        await updatePickupStatus(dispatchData.id, 'DRIVER_EN_ROUTE', 'demo');
        await updatePickupStatus(dispatchData.id, 'PICKUP_READY', 'demo');
        appendEvent('Pickup prepared');
        setCurrentStage('DELIVERY_IN_PROGRESS');
        setProgress({ current: 7, total: 8 });
        setStatusMessage('Driver is ready at the donor and pickup can proceed.');
      } else if (currentStage === 'DELIVERY_IN_PROGRESS') {
        const created = await listDonations();
        const donation = created[0] ?? null;
        if (!donation) {
          throw new Error('Delivery service unavailable.');
        }
        const dispatchData = await getDispatchDashboard(donation.id);
        if (!dispatchData) {
          throw new Error('Delivery service unavailable.');
        }
        await updatePickupStatus(dispatchData.id, 'PICKED_UP', 'demo');
        await updatePickupStatus(dispatchData.id, 'DELIVERING', 'demo');
        await updatePickupStatus(dispatchData.id, 'DELIVERED', 'demo');
        await updatePickupStatus(dispatchData.id, 'COMPLETED', 'demo');
        appendEvent('Delivery completed');
        const analytics = await getImpactAnalytics();
        setImpact({
          meals_rescued: metricValue(analytics.meals_rescued, 40),
          donations_completed: metricValue(analytics.donations_completed, 1),
          estimated_people_served: metricValue(analytics.estimated_people_served, 40),
          co2e_avoided_kg: metricValue(analytics.co2e_avoided_kg),
        });
        setCurrentStage('RESCUE_COMPLETED');
        setProgress({ current: 8, total: 8 });
        setStatusMessage('RESCUE COMPLETED');
      }

      await loadNotifications();
      await loadImpact();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Matching service unavailable.');
    }
  };

  const resetDemo = () => {
    setResetting(true);
    setTimeout(() => {
      updateScenario(scenarioKey);
      setResetting(false);
    }, 50);
  };

  const remainingWindow = scenario.usable_minutes - (progress.current * Math.max(2, Math.round(scenario.usable_minutes / 8)));
  const stageLabel = currentStage;

  return (
    <main className="page-shell">
      <section className="hero-panel compact demo-hero">
        <div>
          <p className="eyebrow">SURPLUS → SHELTER</p>
          <h2>Rescue surplus food before the usable window expires.</h2>
        </div>
      </section>

      <div className="demo-flow">
        <span>DONOR</span>
        <span>↓</span>
        <span>MATCHING ENGINE</span>
        <span>↓</span>
        <span>RECIPIENT</span>
        <span>↓</span>
        <span>DRIVER</span>
        <span>↓</span>
        <span>ROUTE</span>
        <span>↓</span>
        <span>DELIVERY</span>
        <span>↓</span>
        <span>IMPACT</span>
      </div>

      <div className="demo-layout">
        <section className="panel-card demo-main-panel">
          <div className="panel-heading-row demo-header-row">
            <div>
              <p className="eyebrow">LIVE RESCUE DEMO</p>
              <h3>{scenario.label}</h3>
            </div>
            <span className="status-pill">{stageLabel}</span>
          </div>

          {error && <div className="status-banner error-banner">{error} <button type="button" className="inline-retry" onClick={handleNextStep}>RETRY</button></div>}

          <div className="demo-status-grid">
            <div>
              <p className="eyebrow">Status</p>
              <h4>{stageLabel}</h4>
            </div>
            <div>
              <p className="eyebrow">Progress</p>
              <h4>{progress.current} / {progress.total}</h4>
            </div>
            <div>
              <p className="eyebrow">Donation</p>
              <h4>{scenario.donation_quantity} {scenario.food_type}</h4>
            </div>
            <div>
              <p className="eyebrow">Recipient</p>
              <h4>{scenario.recipient_name}</h4>
            </div>
            <div>
              <p className="eyebrow">Driver</p>
              <h4>{scenario.driver_name}</h4>
            </div>
            <div>
              <p className="eyebrow">Remaining usable window</p>
              <h4>{formatMinutes(Math.max(0, remainingWindow))}</h4>
            </div>
          </div>

          <div className="demo-actions">
            <button type="button" className="primary-button" onClick={handleNextStep} disabled={resetting}>NEXT STEP</button>
            <button type="button" className="secondary-button" onClick={resetDemo}>RESET DEMO</button>
          </div>

          <div className="demo-message-box">
            <p className="eyebrow">SYSTEM STATUS</p>
            <strong>{statusMessage}</strong>
          </div>
        </section>

        <aside className="panel-card demo-side-panel">
          <div className="panel-heading-row">
            <div>
              <p className="eyebrow">SCENARIO</p>
              <h3>DEMO DATA</h3>
            </div>
          </div>

          <label className="scenario-select-label">
            Scenario
            <select value={scenarioKey} onChange={(event) => updateScenario(event.target.value as 'successful' | 'infeasible' | 'expiring')}>
              <option value="successful">Successful Rescue</option>
              <option value="infeasible">No Feasible Rescue</option>
              <option value="expiring">Expiring Donation</option>
            </select>
          </label>

          <div className="mini-grid">
            <div>
              <span>Meals</span>
              <strong>{scenario.servings}</strong>
            </div>
            <div>
              <span>Driver</span>
              <strong>{scenario.driver_name}</strong>
            </div>
            <div>
              <span>Recipient</span>
              <strong>{scenario.recipient_name}</strong>
            </div>
            <div>
              <span>Window</span>
              <strong>{formatMinutes(Number(scenario.usable_minutes))}</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="demo-lower-grid">
        <section className="panel-card demo-log-card">
          <div className="panel-heading-row">
            <div><p className="eyebrow">EVENT LOG</p><h3>Live timeline</h3></div>
          </div>
          <div className="event-log">
            {events.length === 0 ? (
              <div className="empty-box">No demo events recorded yet.</div>
            ) : (
              events.map((event, index) => (
                <div key={`${event.time}-${event.label}-${index}`} className="event-row">
                  <strong>{event.time}</strong>
                  <span>{event.label}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel-card demo-notes-card">
          <div className="panel-heading-row">
            <div><p className="eyebrow">NOTIFICATIONS</p><h3>Recent system updates</h3></div>
          </div>
          {notifications.length === 0 ? (
            <div className="empty-box">No notifications from the live rescue workflow yet.</div>
          ) : (
            <div className="stack-list">
              {notifications.map((notification) => (
                <div key={notification.id} className="mini-card">
                  <div className="mini-card-header">
                    <strong>{notification.title}</strong>
                    <span className="status-pill subtle">✓</span>
                  </div>
                  <p>{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="demo-lower-grid">
        <section className="panel-card">
          <div className="panel-heading-row">
            <div><p className="eyebrow">MATCHING EXPLANATION</p><h3>WHY THIS RECIPIENT?</h3></div>
          </div>
          {matchingReasons.length === 0 ? (
            <div className="empty-box">Matching factors will appear when the rescue flow reaches the best candidate.</div>
          ) : (
            <ul className="check-list">
              {matchingReasons.map((reason) => (
                <li key={reason}>✓ {reason}</li>
              ))}
            </ul>
          )}
          {rejectedReasons.length > 0 && (
            <div className="reason-box">
              <p className="eyebrow">REJECTION REASONS</p>
              <ul>
                {rejectedReasons.map((reason) => (<li key={reason}>{reason}</li>))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-heading-row">
            <div><p className="eyebrow">ROUTE</p><h3>Driver → Donor → Recipient</h3></div>
          </div>
          {route ? (
            <div className="mini-grid">
              <div><span>Driver → Donor</span><strong>{(route.distance_km / 2).toFixed(1)} km</strong></div>
              <div><span>Donor → Recipient</span><strong>{(route.distance_km / 2).toFixed(1)} km</strong></div>
              <div><span>Total distance</span><strong>{route.distance_km.toFixed(1)} km</strong></div>
              <div><span>Estimated travel time</span><strong>{route.travel_minutes} min</strong></div>
              <div><span>Remaining usable window</span><strong>{route.remaining_usable_minutes} min</strong></div>
              <div><span>Feasible route</span><strong>{route.is_feasible ? 'Yes' : 'No'}</strong></div>
            </div>
          ) : (
            <div className="empty-box">Route details will appear once dispatch is verified.</div>
          )}
          <p className="route-note">Travel time is estimated; live traffic is not included.</p>
        </section>
      </div>

      <div className="demo-lower-grid">
        <section className="panel-card">
          <div className="panel-heading-row">
            <div><p className="eyebrow">IMPACT</p><h3>Rescue outcomes</h3></div>
          </div>
          <div className="mini-grid">
            <div><span>Meals rescued</span><strong>{impact.meals_rescued}</strong></div>
            <div><span>Completed donations</span><strong>{impact.donations_completed}</strong></div>
            <div><span>Estimated people served</span><strong>{impact.estimated_people_served}</strong></div>
            <div><span>Estimated CO₂e avoided</span><strong>{impact.co2e_avoided_kg.toFixed(1)} kg</strong></div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-heading-row">
            <div><p className="eyebrow">FINAL STATE</p><h3>{currentStage === 'RESCUE_COMPLETED' ? 'RESCUE COMPLETED' : 'IN PROGRESS'}</h3></div>
          </div>
          {currentStage === 'RESCUE_COMPLETED' ? (
            <div className="success-panel">
              <p><strong>{impact.meals_rescued} meals rescued from surplus</strong> and delivered to a recipient.</p>
              <div className="mini-grid">
                <div><span>Match time</span><strong>12 min</strong></div>
                <div><span>Pickup time</span><strong>9 min</strong></div>
                <div><span>Delivery time</span><strong>18 min</strong></div>
                <div><span>Total rescue time</span><strong>39 min</strong></div>
              </div>
              <div className="mini-grid">
                <div><span>Impact created</span><strong>Yes</strong></div>
                <div><span>Meals rescued</span><strong>{impact.meals_rescued}</strong></div>
                <div><span>Food diverted</span><strong>{impact.meals_rescued} kg</strong></div>
                <div><span>Estimated CO₂e avoided</span><strong>{impact.co2e_avoided_kg.toFixed(1)} kg</strong></div>
              </div>
            </div>
          ) : (
            <div className="empty-box">The final completion state appears after the live rescue flow closes successfully.</div>
          )}
        </section>
      </div>
    </main>
  );
};

export default DemoPage;
