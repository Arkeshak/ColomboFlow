import kagglehub
import pandas as pd
import os
import glob

print("Downloading dataset from Kaggle...")
path = kagglehub.dataset_download("rasulmah/sri-lanka-weather-dataset")
print("Path:", path)

# Find the csv file
csv_files = glob.glob(os.path.join(path, "*.csv"))
if csv_files:
    csv_path = csv_files[0]
    df = pd.read_csv(csv_path)
    print("Columns:", df.columns.tolist())
    print("Cities:", df['city'].unique() if 'city' in df.columns else 'No city column')
    print(df.head())
else:
    print("No CSV found in", path)
