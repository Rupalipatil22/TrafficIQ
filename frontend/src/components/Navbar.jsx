import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  const tabs = [
    { to: '/', name: 'Macro Analytics' },
    { to: '/track', name: 'Trajectory Tracking' },
    { to: '/map', name: 'GIS Sensor Grid' },
    { to: '/alerts', name: 'Security Alerts' },
  ];

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', backgroundColor: '#131e3a', borderBottom: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '14px' }}>TIQ</span>
        <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>TrafficIQ AI</h2>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {tabs.map((t) => {
          const isActive = loc.pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: isActive ? '#fff' : '#94a3b8',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                fontSize: '14px',
                fontWeight: '500',
                transition: '0.2s all ease'
              }}
            >
              {t.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}