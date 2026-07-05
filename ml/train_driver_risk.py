import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle
import os
import kagglehub
import glob

def train_risk_model():
    print("Downloading violations dataset from Kaggle...")
    path = kagglehub.dataset_download("mahenvas/sri-lanka-traffic-violations-dataset")
    
    csv_files = glob.glob(os.path.join(path, "*.csv"))
    if not csv_files:
        raise FileNotFoundError("CSV not found!")
        
    print(f"Loading data from {csv_files[0]}...")
    df = pd.read_csv(csv_files[0])
    
    # Define our vehicle mapping for consistency
    vehicle_map = {'Car': 0, 'Motorcycle': 1, 'Three-Wheeler': 2, 'Lorry': 3, 'Van': 4, 'Bus': 5}
    # Map unknown vehicles to 0 (Car) as default
    df['vehicle_encoded'] = df['vehicle_type'].map(vehicle_map).fillna(0).astype(int)
    
    features = ['age', 'vehicle_encoded', 'license_years', 'penalty_points']
    X = df[features]
    
    # Encode target labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df['risk_level']) # Low, Medium, High -> 0, 1, 2
    
    print(f"Training RandomForestClassifier on {len(df)} driver profiles...")
    model = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42)
    model.fit(X, y)
    
    # Save model and encoders
    artifacts = {
        'model': model,
        'vehicle_map': vehicle_map,
        'label_encoder': label_encoder
    }
    
    model_path = os.path.join(os.path.dirname(__file__), 'driver_risk_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(artifacts, f)
        
    print(f"Driver Risk Model successfully saved to {model_path}!")

if __name__ == '__main__':
    train_risk_model()
