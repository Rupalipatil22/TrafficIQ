import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function GISMap() {
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    fetch('/api/cameras')
      .then((res) => res.json())
      .then((data) => setCameras(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ marginBottom: '8px' }}>Distributed Municipal ANPR Sensor Infrastructure</h2>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Real-time topological layout of edge ANPR units across metropolitan sectors</p>
      
      <div style={{ height: '580px', minHeight: '520px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
        <MapContainer 
          center={[17.435, 78.40]} 
          zoom={12} 
          style={{ height: '100%', minHeight: '520px', width: '100%' }}
          whenReady={(map) => { map.target.invalidateSize(); }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {cameras.map((c) => (
            <Marker key={c.camera_id} position={[c.lat, c.lng]}>
              <Popup>
                <div style={{ color: '#000' }}>
                  <strong>{c.name}</strong><br />
                  ID: {c.camera_id}<br />
                  Speed Limit: {c.speed_limit_kmh} km/h
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}