import os
import re
import glob
import sqlite3
import cv2
import easyocr
import kagglehub

DB_FILE = "trafficiq.db"
conn = sqlite3.connect(DB_FILE)
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
            cursor.execute("""
                INSERT INTO vehicle_sightings 
                (plate_number, camera_id, sighting_time, confidence, speed_estimate_kmh, lat, lng)
                VALUES (?, ?, time('now', ?), ?, ?, ?, ?)
            """, (cleaned, cam["id"], f"-{(MAX_SAMPLES - ingested_count) * 8} minutes", float(conf), 42.0 + (ingested_count * 1.5), cam["lat"], cam["lng"]))
            conn.commit()
            print(f"[+] Ingested: {cleaned} | Conf: {conf:.2f} | Cam: {cam['id']}")
            ingested_count += 1
            break

# Ensure demo route exists
demo_route = [
    ("TS09AB1234", "CAM-01", "10:20 AM", 48.0, 17.4401, 78.3489),
    ("TS09AB1234", "CAM-03", "10:31 AM", 53.0, 17.4504, 78.3808),
    ("TS09AB1234", "CAM-05", "10:44 AM", 42.0, 17.4319, 78.4073),
    ("DL01XY9999", "CAM-02", "11:05 AM", 65.0, 17.4399, 78.4983),
]

for plate, cam, time_str, spd, lat, lng in demo_route:
    cursor.execute("""
        INSERT INTO vehicle_sightings 
        (plate_number, camera_id, sighting_time, confidence, speed_estimate_kmh, lat, lng)
        VALUES (?, ?, ?, 0.96, ?, ?, ?)
    """, (plate, cam, time_str, spd, lat, lng))

conn.commit()
print("[✓] SQLite ingestion complete.")
cursor.close()
conn.close()