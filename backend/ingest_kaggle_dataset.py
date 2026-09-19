import os
import re
import glob
import cv2
import psycopg2
import easyocr
import kagglehub

DB_URI = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/trafficiq")
conn = psycopg2.connect(DB_URI)
cursor = conn.cursor()

def clean_indian_plate(raw_text):
    text = re.sub(r'[^A-Z0-9]', '', raw_text.upper())
    ambiguities = {'O': '0', 'I': '1', 'Z': '2', 'B': '8', 'S': '5'}
    if len(text) >= 8:
        chars = list(text)
        for idx in [2, 3]:
            if idx < len(chars) and chars[idx] in ambiguities:
                chars[idx] = ambiguities[chars[idx]]
        text = "".join(chars)
    return text

print("[*] Downloading dataset via kagglehub...")
dataset_dir = kagglehub.dataset_download("saisirishan/indian-vehicle-dataset")
print(f"[*] Dataset downloaded to: {dataset_dir}")

image_extensions = ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG")
image_paths = []
for ext in image_extensions:
    image_paths.extend(glob.glob(os.path.join(dataset_dir, "**", ext), recursive=True))

print(f"[*] Identified {len(image_paths)} images.")

cameras = [
    {"id": "CAM-01", "name": "Rajiv Chowk", "lng": 78.3489, "lat": 17.4401},
    {"id": "CAM-02", "name": "Secunderabad Gate", "lng": 78.4983, "lat": 17.4399},
    {"id": "CAM-03", "name": "Cyber Towers", "lng": 78.3808, "lat": 17.4504},
    {"id": "CAM-04", "name": "Tolichowki Flyover", "lng": 78.4172, "lat": 17.3995},
    {"id": "CAM-05", "name": "Jubilee Checkpost", "lng": 78.4073, "lat": 17.4319},
]

print("[*] Loading EasyOCR engine...")
reader = easyocr.Reader(['en'], gpu=False)

ingested_count = 0
MAX_SAMPLES = 25

for img_path in image_paths:
    if ingested_count >= MAX_SAMPLES:
        break

    img = cv2.imread(img_path)
    if img is None:
        continue

    results = reader.readtext(img)

    for bbox, raw_text, conf in results:
        cleaned = clean_indian_plate(raw_text)
        if conf > 0.40 and len(cleaned) >= 6:
            cam = cameras[ingested_count % len(cameras)]
            offset_minutes = (MAX_SAMPLES - ingested_count) * 8
            cursor.execute("""
                INSERT INTO vehicle_sightings 
                (plate_number, camera_id, sighting_time, confidence, speed_estimate_kmh, geom)
                VALUES (%s, %s, NOW() - (%s * INTERVAL '1 minute'), %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            """, (cleaned, cam["id"], offset_minutes, float(conf), 42.0 + (ingested_count * 1.5), cam["lng"], cam["lat"]))
            conn.commit()
            print(f"[+] Ingested: {cleaned} | Conf: {conf:.2f} | Cam: {cam['id']}")
            ingested_count += 1
            break

demo_route = [
    ("TS09AB1234", "CAM-01", 35, 48.0, 78.3489, 17.4401),
    ("TS09AB1234", "CAM-03", 22, 53.0, 78.3808, 17.4504),
    ("TS09AB1234", "CAM-05", 8,  42.0, 78.4073, 17.4319),
    ("DL01XY9999", "CAM-02", 3,  65.0, 78.4983, 17.4399),
]

for plate, cam, min_ago, spd, lng, lat in demo_route:
    cursor.execute("""
        INSERT INTO vehicle_sightings 
        (plate_number, camera_id, sighting_time, confidence, speed_estimate_kmh, geom)
        VALUES (%s, %s, NOW() - (%s * INTERVAL '1 minute'), 0.96, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
    """, (plate, cam, min_ago, spd, lng, lat))
conn.commit()

print("[✓] Pipeline complete. Ingested records ready for query.")
cursor.close()
conn.close()