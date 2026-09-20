import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function VehicleTracking() {
  const [plate, setPlate] = useState('TS09AB1234');
  const [trajectory, setTrajectory] = useState([]);
  const [error, setError] = useState(null);

  const search = (targetPlate) => {
    if (!targetPlate || !targetPlate.trim()) return;

    fetch(`/api/vehicles/${targetPlate.trim()}/trajectory`)
      .then((res) => {
        if (!res.ok) throw new Error(`No trajectory found in database for plate: ${targetPlate}`);
        return res.json();
      })
      .then((data) => {
        setTrajectory(data);
        setError(null);
      })
      .catch((err) => {
        setTrajectory([]);
        setError(err.message);
      });
  };

  useEffect(() => {
    search(plate);
  }, []);

  const polylineCoords = trajectory.map((t) => [t.lat, t.lng]);
  const center = trajectory.length > 0 ? [trajectory[0].lat, trajectory[0].lng] : [17.4401, 78.3489];

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Quick-Click Presets */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Live Plate Presets:</span>
        {['TS09AB1234', 'TS11EQ2914', 'HR11F7575', 'KA04MH9911', 'DL01XY9999'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPlate(p);
              search(p);
            }}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#facc15',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Plate Search Form */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="Enter Plate Number"
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: '#131e3a',
            color: '#fff',
            border: '1px solid #334155',
            outline: 'none',
            width: '320px',
            fontSize: '14px'
          }}
        />
        <button
          type="button"
          onClick={() => search(plate)}
          style={{
            padding: '10px 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600'
          }}
        >
          Reconstruct Trajectory
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#450a0a', border: '1px solid #991b1b', color: '#f87171', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Trajectory Reconstruction Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', height: '580px' }}>
        <div style={{ backgroundColor: '#131e3a', padding: '20px', borderRadius: '8px', overflowY: 'auto', border: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '18px', color: '#e2e8f0' }}>
            Chronological Route Reconstruction: {plate}
          </h3>
          {trajectory.length === 0 && !error && (
            <p style={{ color: '#64748b', fontSize: '13px' }}>Loading trajectory coordinates...</p>
          )}
          {trajectory.map((step, idx) => {
            const isSpeeding = step.speed_estimate_kmh > (step.speed_limit_kmh || 60);
            return (
              <div key={idx} style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '14px', marginBottom: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{step.camera_name}</p>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Vector: {step.heading_degrees}&deg;</span>
                </div>
                <p style={{ fontSize: '12px', color: isSpeeding ? '#f87171' : '#60a5fa', margin: '4px 0' }}>
                  {step.time} &bull; {step.speed_estimate_kmh} km/h {isSpeeding && '(Speeding Warning)'}
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Confidence: {(step.confidence * 100).toFixed(0)}% &bull; Node ID: {step.camera_id}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b', minHeight: '520px' }}>
          <MapContainer
            key={`${center[0]}-${center[1]}-${polylineCoords.length}`}
            center={center}
            zoom={12}
            style={{ height: '100%', minHeight: '520px', width: '100%' }}
            whenReady={(map) => map.target.invalidateSize()}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={polylineCoords} color="#2563eb" weight={5} dashArray="6, 8" />
            {trajectory.map((point, idx) => (
              <Marker key={idx} position={[point.lat, point.lng]}>
                <Popup>
                  <div style={{ color: '#000' }}>
                    <strong>Stop {idx + 1}: {point.camera_name}</strong><br />
                    Time: {point.time}<br />
                    Speed: {point.speed_estimate_kmh} km/h (Limit: {point.speed_limit_kmh})<br />
                    Heading: {point.heading_degrees}&deg;
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}