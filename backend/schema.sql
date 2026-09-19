CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cameras (
    camera_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    sector VARCHAR(50),
    speed_limit_kmh FLOAT DEFAULT 60.0,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_cameras_geom ON cameras USING GIST(geom);

CREATE TABLE IF NOT EXISTS watchlist (
    plate_number VARCHAR(16) PRIMARY KEY,
    reason TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'CRITICAL',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_sightings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(16) NOT NULL,
    camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    sighting_time TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL,
    speed_estimate_kmh FLOAT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sightings_plate_time ON vehicle_sightings (plate_number, sighting_time ASC);
CREATE INDEX IF NOT EXISTS idx_sightings_geom ON vehicle_sightings USING GIST(geom);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(16) NOT NULL,
    camera_id VARCHAR(32) REFERENCES cameras(camera_id),
    alert_type VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO cameras (camera_id, name, geom, speed_limit_kmh) VALUES 
('CAM-01', 'Rajiv Chowk', ST_SetSRID(ST_MakePoint(78.3489, 17.4401), 4326), 60),
('CAM-02', 'Secunderabad Gate', ST_SetSRID(ST_MakePoint(78.4983, 17.4399), 4326), 50),
('CAM-03', 'Cyber Towers', ST_SetSRID(ST_MakePoint(78.3808, 17.4504), 4326), 80),
('CAM-04', 'Tolichowki Flyover', ST_SetSRID(ST_MakePoint(78.4172, 17.3995), 4326), 60),
('CAM-05', 'Jubilee Checkpost', ST_SetSRID(ST_MakePoint(78.4073, 17.4319), 4326), 50)
ON CONFLICT (camera_id) DO NOTHING;

INSERT INTO watchlist (plate_number, reason) VALUES
('DL01XY9999', 'Flagged Stolen Vehicle Registry'),
('MH12AB0001', 'Wanted in Highway Violation')
ON CONFLICT (plate_number) DO NOTHING;

CREATE OR REPLACE FUNCTION check_teleportation_and_watchlist()
RETURNS TRIGGER AS $$
DECLARE
    prev_record RECORD;
    dist_meters FLOAT;
    time_diff_sec FLOAT;
    implied_speed_kmh FLOAT;
    wl_hit RECORD;
BEGIN
    SELECT * INTO wl_hit FROM watchlist WHERE plate_number = NEW.plate_number;
    IF FOUND THEN
        INSERT INTO alerts (plate_number, camera_id, alert_type, details)
        VALUES (NEW.plate_number, NEW.camera_id, 'WATCHLIST_HIT', wl_hit.reason);
    END IF;

    SELECT sighting_time, geom INTO prev_record
    FROM vehicle_sightings
    WHERE plate_number = NEW.plate_number AND id <> NEW.id
    ORDER BY sighting_time DESC LIMIT 1;

    IF FOUND THEN
        dist_meters := ST_Distance(NEW.geom::geography, prev_record.geom::geography);
        time_diff_sec := ABS(EXTRACT(EPOCH FROM (NEW.sighting_time - prev_record.sighting_time)));

        IF time_diff_sec > 10 THEN
            implied_speed_kmh := (dist_meters / time_diff_sec) * 3.6;
            IF implied_speed_kmh > 180.0 THEN
                INSERT INTO alerts (plate_number, camera_id, alert_type, details)
                VALUES (NEW.plate_number, NEW.camera_id, 'TELEPORTATION_CLONE',
                        format('Implied speed %s km/h between camera nodes', round(implied_speed_kmh::numeric, 1)));
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_sighting ON vehicle_sightings;
CREATE TRIGGER trg_validate_sighting
BEFORE INSERT ON vehicle_sightings
FOR EACH ROW EXECUTE FUNCTION check_teleportation_and_watchlist();