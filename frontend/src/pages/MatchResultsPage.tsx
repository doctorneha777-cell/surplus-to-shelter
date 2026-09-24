import React from 'react';
import { useParams } from 'react-router-dom';
import MatchResults from './MatchResults';

const MatchResultsPage: React.FC = () => {
  const { donationId } = useParams();
  const id = Number(donationId ?? 0);

  if (!id) {
    return <main className="page-shell"><section className="rescue-panel"><p className="eyebrow">MATCHING</p><h2>Donation not found</h2><p className="muted">Select an active donation to view the match results.</p></section></main>;
  }

  return (
    <main className="page-shell">
      <MatchResults donationId={id} />
    </main>
  );
};

export default MatchResultsPage;
