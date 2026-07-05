import kagglehub
import pandas as pd
import os
import glob

print("Downloading violations dataset from Kaggle...")
path = kagglehub.dataset_download("mahenvas/sri-lanka-traffic-violations-dataset")
print("Path:", path)

# Find the csv file
csv_files = glob.glob(os.path.join(path, "*.csv"))
if csv_files:
    csv_path = csv_files[0]
    df = pd.read_csv(csv_path)
    print("Columns:", df.columns.tolist())
    print("Risk Categories:", df['risk_category'].unique() if 'risk_category' in df.columns else 'No risk column')
    print("Vehicle Types:", df['vehicle_type'].unique() if 'vehicle_type' in df.columns else 'No vehicle type column')
    print(df.head())
else:
    print("No CSV found in", path)
