import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DiseaseDatabase from './pages/DiseaseDatabase';
import DriverDashboard from './pages/DriverDashboard';
import NotificationPage from './pages/NotificationPage';
import NotificationBell from './components/NotificationBell';
import ImpactDashboard from './pages/ImpactDashboard';
import ImpactMethodology from './pages/ImpactMethodology';
import MatchResultsPage from './pages/MatchResultsPage';
import RecipientDashboard from './pages/RecipientDashboard';
import OperationsDashboard from './pages/OperationsDashboard';
import RescueTrackingPage from './pages/RescueTrackingPage';
import DemoPage from './pages/DemoPage';

const roleNav: Record<string, Array<{ to: string; label: string }>> = {
  donor: [
    { to: '/', label: 'Dashboard' },
    { to: '/demo', label: 'Demo' },
    { to: '/donor', label: 'Donations' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/impact', label: 'Impact' },
  ],
  recipient: [
    { to: '/recipient', label: 'Dashboard' },
    { to: '/recipient', label: 'Incoming' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/impact', label: 'Impact' },
  ],
  driver: [
    { to: '/driver', label: 'Dashboard' },
    { to: '/driver', label: 'Current Pickup' },
    { to: '/notifications', label: 'Notifications' },
  ],
  admin: [
    { to: '/operations', label: 'Operations' },
    { to: '/operations', label: 'Donations' },
    { to: '/driver', label: 'Drivers' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/impact', label: 'Analytics' },
  ],
};

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'donor' | 'recipient' | 'driver' | 'admin'>('donor');
  const navLinks = useMemo(() => roleNav[activeRole], [activeRole]);

  return (
    <Router>
      <div className="rescue-app-shell">
        <NotificationBell />
        <header className="top-bar">
          <div className="brand-block">
            <p className="eyebrow">SURPLUS-TO-SHELTER</p>
            <h1>Rescue operating system</h1>
          </div>
          <nav className="role-switcher" aria-label="Role selection">
            {(['donor', 'recipient', 'driver', 'admin'] as const).map((role) => (
              <button
                key={role}
                type="button"
                className={role === activeRole ? 'role-button active' : 'role-button'}
                onClick={() => setActiveRole(role)}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </nav>
        </header>

        <nav className="main-nav" aria-label="Main navigation">
          {navLinks.map((item) => (
            <NavLink
              key={`${activeRole}-${item.label}`}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="page-frame">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/donor" element={<Dashboard />} />
            <Route path="/recipient" element={<RecipientDashboard />} />
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/operations" element={<OperationsDashboard />} />
            <Route path="/matches/:donationId" element={<MatchResultsPage />} />
            <Route path="/tracking/:donationId" element={<RescueTrackingPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/disease-database" element={<DiseaseDatabase />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/impact/methodology" element={<ImpactMethodology />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;