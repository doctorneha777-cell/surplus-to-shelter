import React, { useEffect, useMemo, useState } from 'react';
import { MatchingResponse, getRoute, runMatching } from '../services/rescueApi';

const MatchResults: React.FC<{ donationId: number; onBestMatch?: (recipientId: number | null) => void }> = ({ donationId, onBestMatch }) => {
  const [data, setData] = useState<MatchingResponse | null>(null);
  const [routeNotice, setRouteNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bestCandidate = useMemo(() => data?.candidates[0] ?? null, [data]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const matchResult = await runMatching(donationId);
        if (!active) return;
        setData(matchResult);
        onBestMatch?.(matchResult.candidates[0]?.recipient_id ?? null);
        try {
          const route = await getRoute(donationId);
          if (!active) return;
          setRouteNotice(route.estimate_label);
        } catch {
          setRouteNotice('Route information is temporarily unavailable.');
        }
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to find a feasible recipient.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [donationId, onBestMatch]);

  if (loading) {
    return <section className="rescue-panel"><p className="eyebrow">MATCHING</p><h2>Finding eligible recipients...</h2><p className="muted">Checking capacity, dietary fit, urgency, and usable time.</p></section>;
  }

  if (error) {
    return <section className="rescue-panel"><p className="eyebrow">MATCHING</p><h2>Match unavailable</h2><p className="error-text">{error}</p></section>;
  }

  if (!data) {
    return <section className="rescue-panel"><p className="eyebrow">MATCHING</p><h2>No match results</h2><p className="muted">Unable to load eligible recipients right now.</p></section>;
  }

  return (
    <section className="rescue-panel">
      <p className="eyebrow">MATCHING</p>
      <div className="panel-heading-row">
        <div>
          <h2>Best match</h2>
          <p className="muted">Donation match analysis for the current rescue.</p>
        </div>
        {bestCandidate && <span className="score-badge">Score: {Math.round(bestCandidate.overall_score * 100)}/100</span>}
      </div>

      {bestCandidate ? (
        <div className="best-match-card">
          <div className="best-match-header">
            <div>
              <p className="eyebrow">TOP CANDIDATE</p>
              <h3>{bestCandidate.recipient_name}</h3>
            </div>
            <strong>{Math.round(bestCandidate.overall_score * 100)}/100</strong>
          </div>
          <div className="match-grid">
            <div><span>Distance</span><strong>{bestCandidate.distance_km.toFixed(1)} km</strong></div>
            <div><span>Urgency</span><strong>{bestCandidate.reasons[2] ?? 'Standard priority'}</strong></div>
            <div><span>Capacity fit</span><strong>{bestCandidate.reasons[1] ?? 'Available'}</strong></div>
            <div><span>Usable window</span><strong>{bestCandidate.reasons[4] ?? 'Within window'}</strong></div>
          </div>
          <div className="reason-box">
            <p className="eyebrow">WHY THIS MATCH?</p>
            <ul>
              {bestCandidate.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <p className="route-note">{routeNotice}</p>
        </div>
      ) : (
        <p className="error-text">No feasible recipients were identified for this donation.</p>
      )}

      <div className="candidate-list">
        {data.candidates.map((candidate) => (
          <article key={candidate.recipient_id} className="candidate-row">
            <div>
              <h3>{candidate.recipient_name}</h3>
              <p>{candidate.distance_km.toFixed(1)} km away · {candidate.reasons.join(' · ')}</p>
            </div>
            <div className="candidate-score-wrap">
              <strong>{Math.round(candidate.overall_score * 100)}</strong>
              <span>score</span>
            </div>
          </article>
        ))}
      </div>

      {data.rejected.length > 0 && (
        <div className="rejected-list">
          <p className="eyebrow">REJECTED</p>
          {data.rejected.map((candidate) => (
            <div key={candidate.recipient_id} className="rejection-row">
              <strong>{candidate.recipient_name}</strong>
              <span>{candidate.reason}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MatchResults;
