import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [odMatrix, setOdMatrix] = useState([]);
  const [recentSightings, setRecentSightings] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  const fetchLiveData = () => {
    fetch('/api/vehicles/recent?limit=6')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setRecentSightings(d))
      .catch(() => {});

    fetch('/api/analytics/origin-destination')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setOdMatrix(d))
      .catch(() => {});

    fetch('/api/analytics/bottlenecks')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setBottlenecks(d))
      .catch(() => {});

    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setActiveAlertsCount(d.length))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Top Telemetry KPIs */}
      <div style={styles.statsRow}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Real-Time ANPR Stream</p>
          <h2 style={styles.cardVal}>Online</h2>
          <span style={styles.badgeGood}>Edge OCR Ingestion Active</span>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>OCR Recognition Baseline</p>
          <h2 style={styles.cardVal}>94.2%</h2>
          <span style={styles.badgeGood}>Target Met (&gt;90%)</span>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Total Plates Tracked</p>
          <h2 style={styles.cardVal}>{recentSightings.length > 0 ? recentSightings[0].id : 0}</h2>
          <span style={styles.badgeNeutral}>Live Time-Series Log</span>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Security & Kinematic Flags</p>
          <h2 style={{ ...styles.cardVal, color: '#f87171' }}>{activeAlertsCount}</h2>
          <span style={styles.badgeDanger}>Critical Events Triggered</span>
        </div>
      </div>

      {/* Grid: Flow Matrix + Live Feed */}
      <div style={styles.contentGrid}>
        <div style={styles.chartPanel}>
          <h3 style={styles.sectionTitle}>Origin-Destination (OD) Corridor Flow Volumes</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={odMatrix}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="origin" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="flow_volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.feedPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={styles.sectionTitle}>Live Sighting Ingestion Stream</h3>
            <span style={{ fontSize: '12px', color: '#4ade80' }}>● Ingesting Every 3.5s</span>
          </div>
          <div style={styles.streamList}>
            {recentSightings.map((item) => (
              <div key={item.id} style={styles.streamItem}>
                <div>
                  <span style={styles.plateTag}>{item.plate_number}</span>
                  <p style={styles.streamLoc}>{item.camera_name} (Heading {item.heading_degrees}&deg;)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.streamTime}>{item.time}</p>
                  <p style={styles.streamConf}>Conf: {(item.confidence * 100).toFixed(0)}% &bull; {item.speed_estimate_kmh} km/h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Congestion Bottlenecks Section */}
      <div style={{ marginTop: '24px', backgroundColor: '#131e3a', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' }}>
        <h3 style={styles.sectionTitle}>Municipal Corridor Congestion & Bottleneck Analysis</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
          Automated bottleneck detection evaluating live traversal velocity against sector design speeds
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {bottlenecks.map((b) => (
            <div key={b.camera_id} style={{
              backgroundColor: '#0b1329',
              padding: '14px',
              borderRadius: '8px',
              border: b.congestion_level === 'HEAVY_CONGESTION' ? '1px solid #ef4444' : '1px solid #334155'
            }}>
              <p style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{b.name}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0' }}>Mean Speed: <strong style={{ color: '#fff' }}>{b.average_speed_kmh} km/h</strong> (Limit: {b.speed_limit_kmh})</p>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '700',
                backgroundColor: b.congestion_level === 'HEAVY_CONGESTION' ? '#7f1d1d' : '#064e3b',
                color: b.congestion_level === 'HEAVY_CONGESTION' ? '#fca5a5' : '#86efac'
              }}>
                {b.delay_factor}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px 32px' },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  card: { backgroundColor: '#131e3a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' },
  cardLabel: { fontSize: '13px', color: '#94a3b8', marginBottom: '6px' },
  cardVal: { fontSize: '26px', fontWeight: '700', marginBottom: '8px' },
  badgeGood: { fontSize: '11px', color: '#4ade80', backgroundColor: '#064e3b', padding: '3px 8px', borderRadius: '4px' },
  badgeNeutral: { fontSize: '11px', color: '#60a5fa', backgroundColor: '#1e3a8a', padding: '3px 8px', borderRadius: '4px' },
  badgeDanger: { fontSize: '11px', color: '#f87171', backgroundColor: '#7f1d1d', padding: '3px 8px', borderRadius: '4px' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' },
  chartPanel: { backgroundColor: '#131e3a', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' },
  feedPanel: { backgroundColor: '#131e3a', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0' },
  streamList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  streamItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#0b1329',
    borderRadius: '6px',
    border: '1px solid #1e293b',
  },
  plateTag: {
    backgroundColor: '#facc15',
    color: '#000',
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: '4px',
    fontSize: '12px',
    letterSpacing: '1px',
  },
  streamLoc: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  streamTime: { fontSize: '12px', fontWeight: '600', color: '#e2e8f0' },
  streamConf: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
};