from flask import Flask, request, jsonify
import pickle
import pandas as pd
import numpy as np
import os

app = Flask(__name__)

model = None
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        print("Traffic Prediction Model loaded successfully.")
except FileNotFoundError:
    print("Error: model.pkl not found! Please run train.py first.")
    model = None

risk_model_path = os.path.join(os.path.dirname(__file__), 'driver_risk_model.pkl')
try:
    with open(risk_model_path, 'rb') as f:
        risk_artifacts = pickle.load(f)
        risk_model = risk_artifacts['model']
        vehicle_map = risk_artifacts['vehicle_map']
        label_encoder = risk_artifacts['label_encoder']
        print("Driver Risk Model loaded successfully.")
except FileNotFoundError:
    print("Warning: driver_risk_model.pkl not found! Please run train_driver_risk.py.")
    risk_model = None

app = Flask(__name__)

def load_model():
    global model
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        load_model()
        if model is None:
            return jsonify({'error': 'Model not trained yet'}), 500
            
    try:
        data = request.json
        # Expected: hour_of_day, day_of_week, is_poya_day, rainfall_mm, road_segment_id
        
        # In a real app we'd map road_id string to numeric segment_id
        features = pd.DataFrame([{
            'hour_of_day': data.get('hour_of_day', 12),
            'day_of_week': data.get('day_of_week', 0),
            'is_poya_day': data.get('is_poya_day', 0),
            'rainfall_mm': data.get('rainfall_mm', 0.0),
            'road_segment_id': data.get('road_segment_id', 1)
        }])
        
        prediction = model.predict(features)[0]
        
        # Calculate a mock confidence based on how extreme the input is
        # Usually Random Forest variance across trees could be used
        confidence = 0.85
        
        return jsonify({
            'congestion_score': round(prediction, 1),
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict_risk', methods=['POST'])
def predict_risk():
    if risk_model is None:
        return jsonify({'error': 'Driver Risk Model not loaded'}), 500

    data = request.json
    try:
        age = float(data['age'])
        vehicle = data['vehicle_type']
        license_years = float(data['license_years'])
        penalty_points = float(data['penalty_points'])

        # Encode vehicle
        v_encoded = vehicle_map.get(vehicle, 0)
        
        # Prepare features: ['age', 'vehicle_encoded', 'license_years', 'penalty_points']
        features = np.array([[age, v_encoded, license_years, penalty_points]])
        
        prediction = risk_model.predict(features)[0]
        # Decode back to 'Low', 'Medium', 'High'
        risk_level = label_encoder.inverse_transform([prediction])[0]
        
        # Also get probabilities if we want to show confidence
        proba = risk_model.predict_proba(features)[0]
        confidence = float(np.max(proba))

        return jsonify({
            'risk_level': risk_level,
            'confidence': round(confidence, 2)
        })

    except KeyError as e:
        return jsonify({'error': f'Missing field: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=5000)
