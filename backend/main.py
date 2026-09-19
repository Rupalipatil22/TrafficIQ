import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TrafficIQ Core Engine (SQLite MVP)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "trafficiq.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        camera_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        sector TEXT,
        speed_limit_kmh REAL DEFAULT 60.0
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_sightings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        sighting_time TEXT NOT NULL,
        confidence REAL NOT NULL,
        speed_estimate_kmh REAL,
        lat REAL NOT NULL,
        lng REAL NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT NOT NULL,
        camera_name TEXT,
        alert_type TEXT NOT NULL,
        details TEXT,
        time TEXT NOT NULL
    );
    """)

    # Seed cameras
    cams = [
        ('CAM-01', 'Rajiv Chowk', 17.4401, 78.3489, 'Sector 1', 60),
        ('CAM-02', 'Secunderabad Gate', 17.4399, 78.4983, 'Sector 2', 50),
        ('CAM-03', 'Cyber Towers', 17.4504, 78.3808, 'Sector 3', 80),
        ('CAM-04', 'Tolichowki Flyover', 17.3995, 78.4172, 'Sector 4', 60),
        ('CAM-05', 'Jubilee Checkpost', 17.4319, 78.4073, 'Sector 5', 50)
    ]
    cur.executemany("INSERT OR IGNORE INTO cameras VALUES (?, ?, ?, ?, ?, ?)", cams)

    # Seed demo trajectory for TS09AB1234
    sightings = [
        ('TS09AB1234', 'CAM-01', '10:20 AM', 0.96, 48.0, 17.4401, 78.3489),
        ('TS09AB1234', 'CAM-03', '10:31 AM', 0.94, 53.0, 17.4504, 78.3808),
        ('TS09AB1234', 'CAM-05', '10:44 AM', 0.91, 42.0, 17.4319, 78.4073),
        ('DL01XY9999', 'CAM-02', '11:05 AM', 0.98, 65.0, 17.4399, 78.4983),
        ('KA03MM4040', 'CAM-04', '11:15 AM', 0.93, 71.0, 17.3995, 78.4172)
    ]
    cur.execute("DELETE FROM vehicle_sightings")
    cur.executemany("INSERT INTO vehicle_sightings (plate_number, camera_id, sighting_time, confidence, speed_estimate_kmh, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)", sightings)

    # Seed alerts
    alerts = [
        ('DL01XY9999', 'Secunderabad Gate', 'WATCHLIST_HIT', 'Flagged Stolen Vehicle Registry', '11:05 AM'),
        ('KA03MM4040', 'Tolichowki Flyover', 'SPEED_VIOLATION', 'Speed 71 km/h in 60 km/h zone', '11:15 AM'),
        ('MH12AB0001', 'Cyber Towers', 'TELEPORTATION_CLONE', 'Implied velocity 210 km/h between nodes', '11:22 AM')
    ]
    cur.execute("DELETE FROM alerts")
    cur.executemany("INSERT INTO alerts (plate_number, camera_name, alert_type, details, time) VALUES (?, ?, ?, ?, ?)", alerts)

    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def root():
    return {"status": "online", "system": "TrafficIQ Real-Time Platform (SQLite)"}

@app.get("/cameras")
def get_cameras():
    conn = get_db()
    cams = conn.execute("SELECT * FROM cameras").fetchall()
    conn.close()
    return [dict(c) for c in cams]

@app.get("/vehicles/{plate_number}/trajectory")
def get_trajectory(plate_number: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT s.id, s.plate_number, s.camera_id, c.name as camera_name,
               s.sighting_time as time, s.confidence, s.speed_estimate_kmh,
               s.lat, s.lng
        FROM vehicle_sightings s
        JOIN cameras c ON s.camera_id = c.camera_id
        WHERE UPPER(s.plate_number) = UPPER(?)
        ORDER BY s.id ASC
    """, (plate_number.strip(),)).fetchall()
    conn.close()
    if not rows:
        raise HTTPException(status_code=404, detail="No trajectory records found")
    return [dict(r) for r in rows]

@app.get("/analytics/origin-destination")
def get_od_matrix():
    return [
        {"origin": "Rajiv Chowk", "destination": "Cyber Towers", "flow_volume": 58},
        {"origin": "Cyber Towers", "destination": "Jubilee Checkpost", "flow_volume": 42},
        {"origin": "Secunderabad Gate", "destination": "Rajiv Chowk", "flow_volume": 29},
        {"origin": "Tolichowki Flyover", "destination": "Jubilee Checkpost", "flow_volume": 35}
    ]

@app.get("/alerts")
def get_alerts():
    conn = get_db()
    alerts = conn.execute("SELECT * FROM alerts ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(a) for a in alerts]
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)