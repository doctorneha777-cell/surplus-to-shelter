import React from 'react';

const ImpactMethodology: React.FC = () => (
  <main className="impact-page methodology-page">
    <p className="eyebrow">SURPLUS-TO-SHELTER / TRANSPARENCY</p>
    <h1>Impact methodology</h1>
    <p className="methodology-lead">The dashboard distinguishes what the rescue system recorded from what it estimates using documented demo assumptions.</p>
    <section className="impact-panel"><h2>Actual recorded</h2><p>Meals rescued and completed donations count only after a pickup reaches <b>COMPLETED</b>. Expired, unmatched, cancelled, posted, matched, and picked-up-only donations are not counted as rescued.</p><p>Time metrics use the existing status-event timestamps: match, driver assignment, pickup, and delivery.</p></section>
    <section className="impact-panel"><h2>Estimated</h2><p>Weight uses servings multiplied by 0.35 kg per serving when actual weight is not available. People served uses the completed donation serving count and is labeled estimated.</p><p>Estimated CO₂e avoided uses estimated weight multiplied by 2.5 kg CO₂e per kg rescued food. This is a demo estimate, not a scientific measurement or claim about a specific facility.</p></section>
    <section className="impact-panel"><h2>Data integrity</h2><p>Each completed donation can create only one impact record. Repeated completion events do not double-count a rescue. Expired and unmatched donations remain visible in the operational metrics.</p></section>
    <a href="/impact">Back to impact dashboard</a>
  </main>
);

export default ImpactMethodology;
