import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_NODES = [
  { camera_id: 'CAM-01', name: 'Rajiv Chowk', lat: 17.4401, lng: 78.3489, sector: 'Sector 1', limit: 60, sightings: 48, intensity: 0.85 },
  { camera_id: 'CAM-02', name: 'Secunderabad Gate', lat: 17.4399, lng: 78.4983, sector: 'Sector 2', limit: 50, sightings: 22, intensity: 0.45 },
  { camera_id: 'CAM-03', name: 'Cyber Towers', lat: 17.4504, lng: 78.3808, sector: 'Sector 3', limit: 80, sightings: 64, intensity: 0.95 },
  { camera_id: 'CAM-04', name: 'Tolichowki Flyover', lat: 17.3995, lng: 78.4172, sector: 'Sector 4', limit: 60, sightings: 31, intensity: 0.55 },
  { camera_id: 'CAM-05', name: 'Jubilee Checkpost', lat: 17.4319, lng: 78.4073, sector: 'Sector 5', limit: 50, sightings: 39, intensity: 0.70 },
];

export default function GISMap() {
  const [nodes, setNodes] = useState(DEFAULT_NODES);

  useEffect(() => {
    fetch('/api/analytics/heatmap')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNodes(data);
        }
      })
      .catch(() => {
        // Keeps DEFAULT_NODES active if backend is disconnected
      });
  }, []);

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ color: '#f8fafc', fontSize: '20px', margin: 0 }}>
            City GIS ANPR Sensor Grid & Traffic Density Heatmap
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Live geospatial node telemetry with dynamic density heat layer
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', fontWeight: '700' }}>
            ● High Congestion (&gt;75%)
          </span>
          <span style={{ fontSize: '12px', backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '6px 12px', borderRadius: '6px', fontWeight: '700' }}>
            ● Free Flow Corridor
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', height: '580px' }}>
        {/* Interactive GIS Map Container */}
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b', minHeight: '540px' }}>
          <MapContainer
            center={[17.435, 78.41]}
            zoom={12}
            style={{ height: '100%', minHeight: '540px', width: '100%' }}
            whenReady={(map) => map.target.invalidateSize()}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Heatmap Density Rings */}
            {nodes.map((node, i) => {
              const isHeavy = node.intensity > 0.65;
              return (
                <CircleMarker
                  key={`heat-${i}`}
                  center={[node.lat, node.lng]}
                  radius={28 + (node.intensity || 0.5) * 22}
                  pathOptions={{
                    fillColor: isHeavy ? '#ef4444' : '#3b82f6',
                    color: isHeavy ? '#dc2626' : '#2563eb',
                    weight: 2,
                    fillOpacity: 0.35
                  }}
                />
              );
            })}

            {/* ANPR Camera Sensor Pins */}
            {nodes.map((node, i) => (
              <Marker key={`cam-${i}`} position={[node.lat, node.lng]}>
                <Popup>
                  <div style={{ color: '#000', fontSize: '13px' }}>
                    <strong style={{ fontSize: '14px' }}>{node.name}</strong><br />
                    Node ID: {node.camera_id || `CAM-0${i+1}`}<br />
                    Total Detections: {node.sightings || 25}<br />
                    Density Index: {((node.intensity || 0.6) * 100).toFixed(0)}%<br />
                    Speed Limit: {node.limit || 60} km/h
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Right Side Telemetry Summary */}
        <div style={{ backgroundColor: '#131e3a', padding: '18px', borderRadius: '8px', border: '1px solid #1e293b', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '14px' }}>Active Camera Telemetry</h3>
          {nodes.map((n, idx) => (
            <div key={idx} style={{ backgroundColor: '#0b1329', padding: '12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{n.name}</strong>
                <span style={{ fontSize: '11px', color: '#4ade80' }}>● ONLINE</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0' }}>
                Coords: {n.lat.toFixed(3)}, {n.lng.toFixed(3)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#60a5fa' }}>
                <span>Traffic Load: {((n.intensity || 0.6) * 100).toFixed(0)}%</span>
                <span>{n.sightings || 25} passes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}