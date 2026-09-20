import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';

export default function GISMap() {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    fetch('/api/analytics/heatmap')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setHeatmapData(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2>City GIS ANPR Sensor Grid & Traffic Density Heatmap</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Live geospatial node telemetry with dynamic density heat layer
          </p>
        </div>
        <span style={{ fontSize: '12px', backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '6px 12px', borderRadius: '6px' }}>
          Heatmap Mode: Active
        </span>
      </div>

      <div style={{ height: '580px', minHeight: '520px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
        <MapContainer
          center={[17.435, 78.40]}
          zoom={12}
          style={{ height: '100%', minHeight: '520px', width: '100%' }}
          whenReady={(map) => map.target.invalidateSize()}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Dynamic GIS Traffic Density Circles */}
          {heatmapData.map((node, i) => (
            <CircleMarker
              key={`heat-${i}`}
              center={[node.lat, node.lng]}
              radius={24 + node.intensity * 20}
              pathOptions={{
                fillColor: node.intensity > 0.6 ? '#ef4444' : '#3b82f6',
                color: node.intensity > 0.6 ? '#b91c1c' : '#1d4ed8',
                weight: 1,
                fillOpacity: 0.35
              }}
            />
          ))}

          {/* Sensor Pins */}
          {heatmapData.map((c, i) => (
            <Marker key={`cam-${i}`} position={[c.lat, c.lng]}>
              <Popup>
                <div style={{ color: '#000' }}>
                  <strong>{c.name}</strong><br />
                  Total Sightings: {c.sightings}<br />
                  Density Index: {(c.intensity * 100).toFixed(0)}%
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}