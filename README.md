# TrafficIQ: City-Scale ANPR & Spatial Trajectory Engine

Enterprise ANPR tracking and macro-traffic movement analytics powered by PostgreSQL/PostGIS, EasyOCR with Kaggle dataset integration, and React/Leaflet.

## Features
- **OCR Ingestion**: Consumes `saisirishan/indian-vehicle-dataset` using `kagglehub` and applies Indian RTO alphanumeric normalization.
- **Trajectory Reconstruction**: Reconstructs chronological vehicle journeys across municipal camera nodes with speed estimates.
- **Kinematic & Watchlist Alerts**: Detects teleportation/cloned plates (>180 km/h implied speed) and watchlist hits via database triggers.
- **GIS Grid & OD Matrix**: Aggregates macro Origin-Destination movement flows.

## Quickstart

### 1. Database Setup
```bash
createdb trafficiq
psql -d trafficiq -f backend/schema.sql