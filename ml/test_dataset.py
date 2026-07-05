import kagglehub
import pandas as pd
import os

path = kagglehub.dataset_download("fedesoriano/traffic-prediction-dataset")
csv_path = os.path.join(path, "traffic.csv")

if os.path.exists(csv_path):
    df = pd.read_csv(csv_path)
    print("Columns:", df.columns.tolist())
    print(df.head())
    print("Data summary:\n", df.describe())
else:
    print("Files in downloaded dir:", os.listdir(path))
