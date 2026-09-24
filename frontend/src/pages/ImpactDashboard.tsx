import React, { useEffect, useState } from 'react';

type Metric = { value: number; label: string };
type Analytics = {
  meals_rescued: Metric;
  donations_completed: Metric;
  estimated_people_served: Metric;
  weight_diverted_kg: Metric;
  co2e_avoided_kg: Metric;
  rescue_before_expiry_rate: Metric;
  average_time_to_match_minutes: Metric;
  average_pickup_minutes: Metric;
  average_delivery_minutes: Metric;
  funnel: Record<string, number>;
  food_categories: { category: string; donations: number; meals: number; completion_rate: number }[];
  recipient_demand: { name: string; current_need: number; capacity: number; fulfilled: number }[];
  recent_activity: { donation_id: number; meals: number; completed_at: string }[];
  methodology: string;
};

const API_BASE = 'http://localhost:8000';
const ranges = { Today: 0, 'Last 7 days': 7, 'Last 30 days': 30 };

const ImpactDashboard: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [range, setRange] = useState('Last 7 days');
  const [error, setError] = useState('');

  useEffect(() => {
    const start = ranges[range as keyof typeof ranges];
    const query = start ? `?start_date=${new Date(Date.now() - start * 86400000).toISOString().slice(0, 10)}` : '';
    fetch(`${API_BASE}/impact/analytics${query}`)
      .then((response) => { if (!response.ok) throw new Error('Analytics unavailable.'); return response.json(); })
      .then((value: Analytics) => { setData(value); setError(''); })
      .catch((requestError: Error) => setError(requestError.message));
  }, [range]);

  if (error) return <main className="impact-page"><p className="error-banner">{error}</p></main>;
  if (!data) return <main className="impact-page"><p>Loading impact analytics...</p></main>;

  const funnelMax = Math.max(...Object.values(data.funnel), 1);
  return (
    <main className="impact-page">
      <header className="impact-header">
        <div><p className="eyebrow">SURPLUS-TO-SHELTER / IMPACT</p><h1>Rescue performance</h1><p className="muted">Actual completion records separated from transparent estimates.</p></div>
        <div className="range-tabs" aria-label="Analytics date range">{Object.keys(ranges).map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div>
      </header>
      <section className="impact-metrics">
        <MetricCard label="Meals rescued" metric={data.meals_rescued} />
        <MetricCard label="Food diverted" metric={data.weight_diverted_kg} suffix=" kg" />
        <MetricCard label="People served" metric={data.estimated_people_served} />
        <MetricCard label="Estimated CO2e avoided" metric={data.co2e_avoided_kg} suffix=" kg" />
      </section>
      <section className="impact-content-grid">
        <div className="impact-panel"><h2>Rescue performance</h2><div className="performance-grid"><MetricCard label="Before expiry" metric={data.rescue_before_expiry_rate} suffix="%" /><MetricCard label="Completed donations" metric={data.donations_completed} /><MetricCard label="Avg. time to match" metric={data.average_time_to_match_minutes} suffix=" min" /><MetricCard label="Avg. pickup time" metric={data.average_pickup_minutes} suffix=" min" /><MetricCard label="Avg. delivery time" metric={data.average_delivery_minutes} suffix=" min" /></div></div>
        <div className="impact-panel"><h2>Donation funnel</h2>{Object.entries(data.funnel).map(([label, value]) => <div className="funnel-row" key={label}><span>{label.replaceAll('_', ' ')}</span><div><i style={{ width: `${(value / funnelMax) * 100}%` }} /></div><b>{value}</b></div>)}</div>
      </section>
      <section className="impact-content-grid">
        <div className="impact-panel"><h2>Food categories</h2>{data.food_categories.map((item) => <div className="category-row" key={item.category}><span>{item.category}</span><b>{item.meals} meals</b><small>{item.completion_rate}% completed</small></div>)}</div>
        <div className="impact-panel"><h2>Recipient demand</h2>{data.recipient_demand.map((item) => <div className="category-row" key={item.name}><span>{item.name}</span><b>{item.fulfilled} fulfilled</b><small>{item.current_need} current need / {item.capacity} capacity</small></div>)}</div>
      </section>
      <section className="impact-panel"><h2>Recent completed rescues</h2>{data.recent_activity.length === 0 ? <p className="muted">No completed rescues in this range.</p> : data.recent_activity.map((item) => <div className="activity-row" key={item.donation_id}><span>Completed donation #{item.donation_id}</span><b>{item.meals} meals rescued</b><time>{new Date(item.completed_at).toLocaleString()}</time></div>)}</section>
      <p className="methodology-note">{data.methodology} <a href="/impact/methodology">Read the methodology</a></p>
    </main>
  );
};

const MetricCard: React.FC<{ label: string; metric: Metric; suffix?: string }> = ({ label, metric, suffix = '' }) => <div className="metric-card"><span>{label}</span><strong>{metric.value}{suffix}</strong><small>{metric.label}</small></div>;

export default ImpactDashboard;
