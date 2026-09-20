# TrafficIQ: City-Scale ANPR & Spatial Trajectory Engine

Enterprise ANPR tracking and macro-traffic movement analytics powered by FastAPI, SQLite, EasyOCR, and React/Leaflet.

## Features
- **OCR Ingestion**: Consumes `saisirishan/indian-vehicle-dataset` with Indian RTO alphanumeric normalization.
- **Trajectory Reconstruction**: Reconstructs chronological vehicle journeys across municipal camera nodes with Leaflet vector polylines.
- **Real-Time Alerts**: Flags stolen vehicle hotlists, speeding violations, and cloned plate teleportation anomalies.
- **Macro Traffic Analytics**: Aggregates inter-junction Origin-Destination (OD) density flows.

## Quickstart

### 1. Backend (FastAPI + SQLite)
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000