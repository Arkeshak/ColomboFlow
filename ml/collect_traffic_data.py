import os
import time
import csv
import requests
from datetime import datetime

# Points to track in Colombo
POINTS = [
    {"name": "Galle Road", "lat": 6.928, "lon": 79.853},
    {"name": "Duplication Road", "lat": 6.917, "lon": 79.862},
    {"name": "Parliament Road", "lat": 6.932, "lon": 79.872},
    {"name": "Wellawatte", "lat": 6.902, "lon": 79.852},
    {"name": "Baseline Road", "lat": 6.942, "lon": 79.882},
]

CSV_FILE = "colombo_traffic_dataset.csv"

def get_api_key():
    # Attempt to read from server/.env
    env_path = os.path.join(os.path.dirname(__file__), "..", "server", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("TOMTOM_API_KEY="):
                    return line.strip().split("=")[1]
    return os.environ.get("TOMTOM_API_KEY")

def init_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([
                "timestamp", "location_name", "latitude", "longitude", 
                "currentSpeed", "freeFlowSpeed", "currentTravelTime", "roadClosure"
            ])

def collect_data(api_key):
    print(f"[{datetime.now()}] Collecting traffic data...")
    records = []
    
    for pt in POINTS:
        try:
            url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={pt['lat']},{pt['lon']}&unit=KMPH&key={api_key}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json().get("flowSegmentData", {})
                
                records.append([
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    pt["name"],
                    pt["lat"],
                    pt["lon"],
                    data.get("currentSpeed", ""),
                    data.get("freeFlowSpeed", ""),
                    data.get("currentTravelTime", ""),
                    data.get("roadClosure", False)
                ])
            else:
                print(f"Failed to fetch {pt['name']}: {response.status_code}")
                
        except Exception as e:
            print(f"Error for {pt['name']}: {e}")
            
    if records:
        with open(CSV_FILE, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerows(records)
        print(f"[{datetime.now()}] Appended {len(records)} records to {CSV_FILE}")

def main():
    api_key = get_api_key()
    if not api_key:
        print("ERROR: TOMTOM_API_KEY not found in ../server/.env or environment variables.")
        return

    print("Initializing ColomboFlow Traffic Data Collector...")
    init_csv()
    
    interval_minutes = 10
    
    while True:
        collect_data(api_key)
        print(f"Sleeping for {interval_minutes} minutes...")
        time.sleep(interval_minutes * 60)

if __name__ == "__main__":
    main()
