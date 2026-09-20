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
  const [plate, setPlate] = useState('TS11EQ2914');
  const [trajectory, setTrajectory] = useState([]);
  const [error, setError] = useState(null);

  const search = (targetPlate) => {
    if (!targetPlate.trim()) return;
    
    fetch(`/api/vehicles/${targetPlate.trim()}/trajectory`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`No trajectory found in database for plate: ${targetPlate}`);
        }
        return res.json();
      })
      .then((data) => {
        setTrajectory(data);
        setError(null); // Explicitly clear any error banner upon successful data retrieval
      })
      .catch((err) => {
        setTrajectory([]);
        setError(err.message);
      });
  };

  useEffect(() => {
    // Initial fetch for the demo vehicle
    search(plate);
  }, []);

  const polylineCoords = trajectory.map((t) => [t.lat, t.lng]);
  const center = trajectory.length > 0 ? [trajectory[0].lat, trajectory[0].lng] : [17.4401, 78.3489];

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="Enter Plate (e.g. TS11EQ2914 or TS09AB1234)"
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
          Reconstruct Route
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#450a0a',
          border: '1px solid #991b1b',
          color: '#f87171',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', height: '580px' }}>
        <div style={{ backgroundColor: '#131e3a', padding: '20px', borderRadius: '8px', overflowY: 'auto', border: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '18px', color: '#e2e8f0' }}>
            Spatial-Temporal Route: {plate}
          </h3>
          {trajectory.length === 0 && !error && (
            <p style={{ color: '#64748b', fontSize: '13px' }}>Loading trajectory...</p>
          )}
          {trajectory.map((step, idx) => (
            <div key={idx} style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '14px', marginBottom: '20px', position: 'relative' }}>
              <p style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{step.camera_name}</p>
              <p style={{ fontSize: '12px', color: '#60a5fa', margin: '2px 0' }}>{step.time} &bull; {step.speed_estimate_kmh} km/h</p>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>Confidence: {(step.confidence * 100).toFixed(0)}% | Node: {step.camera_id}</p>
            </div>
          ))}
        </div>

        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b', minHeight: '520px' }}>
          <MapContainer 
            key={polylineCoords.length}
            center={center} 
            zoom={12} 
            style={{ height: '100%', minHeight: '520px', width: '100%' }}
            whenReady={(map) => { map.target.invalidateSize(); }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={polylineCoords} color="#3b82f6" weight={5} dashArray="6, 8" />
            {trajectory.map((point, idx) => (
              <Marker key={idx} position={[point.lat, point.lng]}>
                <Popup>
                  <div style={{ color: '#000' }}>
                    <strong>{point.camera_name}</strong><br />
                    Time: {point.time}<br />
                    Speed: {point.speed_estimate_kmh} km/h
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