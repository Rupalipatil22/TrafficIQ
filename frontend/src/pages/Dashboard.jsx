import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [odMatrix, setOdMatrix] = useState([]);

  useEffect(() => {
    fetch('/api/analytics/origin-destination')
      .then((res) => res.json())
      .then((data) => setOdMatrix(data))
      .catch(() => {
        setOdMatrix([
          { origin: 'Rajiv Chowk', destination: 'Cyber Towers', flow_volume: 45 },
          { origin: 'Cyber Towers', destination: 'Jubilee Checkpost', flow_volume: 38 },
          { origin: 'Secunderabad Gate', destination: 'Rajiv Chowk', flow_volume: 21 },
        ]);
      });
  }, []);

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ marginBottom: '8px' }}>Macro Traffic Dynamics & Origin-Destination (OD) Matrix</h2>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>Real-time aggregated inter-junction vehicle movement patterns across city sectors</p>
      
      <div style={{ backgroundColor: '#131e3a', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <h4 style={{ marginBottom: '16px', color: '#e2e8f0', fontSize: '15px' }}>Corridor Movement Volumes</h4>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={odMatrix}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="origin" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Bar dataKey="flow_volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}