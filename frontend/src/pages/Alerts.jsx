import React, { useState, useEffect } from 'react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ marginBottom: '8px' }}>Real-Time Watchlist & Anomaly Alerts</h2>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Automated triggers flagging stolen hotlists, plate clones, and kinematic teleportation</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        {alerts.map((a) => (
          <div key={a.id} style={{ backgroundColor: '#131e3a', border: '1px solid #7f1d1d', padding: '18px', borderRadius: '8px' }}>
            <span style={{ background: '#dc2626', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
              {a.alert_type}
            </span>
            <h3 style={{ margin: '10px 0 6px 0', fontSize: '16px', letterSpacing: '0.5px' }}>{a.plate_number}</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>{a.details}</p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
              Intersection: <strong>{a.camera_name || 'Network Sighting'}</strong> &bull; {a.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}