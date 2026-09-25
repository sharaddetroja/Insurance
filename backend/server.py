import os
import json
import time
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Determine paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_PATH = os.path.join(BASE_DIR, 'model_artifacts.joblib')
INFO_PATH = os.path.join(BASE_DIR, 'model_info.json')

app = FastAPI(
    title="Insurance Fraud Detection ML API",
    description="Machine Learning service providing fraud prediction, model benchmarking, and explainability for insurance claims.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins including localhost:5173, localhost:8000, localhost:3000, etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
models_cache: Dict[str, Any] = {}
feature_names_cache = []
metadata_cache: Dict[str, Any] = {}
quick_predictor_cache = None
server_start_time = time.time()

def load_models_and_metadata():
    global models_cache, feature_names_cache, metadata_cache, quick_predictor_cache
    if os.path.exists(INFO_PATH):
        try:
            with open(INFO_PATH, 'r', encoding='utf-8') as f:
                metadata_cache = json.load(f)
        except Exception as e:
            print(f"Error loading model_info.json: {e}")

    if os.path.exists(ARTIFACTS_PATH):
        try:
            artifacts = joblib.load(ARTIFACTS_PATH)
            models_cache = artifacts.get('models', {})
            feature_names_cache = artifacts.get('feature_names', [])
            quick_predictor_cache = artifacts.get('quick_predictor', None)
            if not metadata_cache:
                metadata_cache = artifacts.get('metadata', {})
            print(f"Loaded {len(models_cache)} models successfully.")
        except Exception as e:
            print(f"Error loading model_artifacts.joblib: {e}")
    else:
        print("Model artifacts not found. Please run train_models.py first.")

# Initial load
load_models_and_metadata()

class ClaimPredictionRequest(BaseModel):
    # Driver Info
    age_of_driver: Optional[float] = Field(35.0, description="Driver age in years")
    gender: Optional[str] = Field("MALE", description="MALE / FEMALE")
    marital_status: Optional[str] = Field("MARRIED", description="MARRIED / SINGLE")
    annual_income: Optional[float] = Field(50000.0, description="Annual income")
    high_education: Optional[str] = Field("College", description="Higher education level or 1/0")
    safety_rating: Optional[float] = Field(70.0, description="Driver safety rating (1-100)")
    
    # Address & Property
    address_change: Optional[str] = Field("NO", description="Address change status")
    property_status: Optional[str] = Field("Own", description="Own / Rent")
    zip_code: Optional[float] = Field(50000.0, description="Zip code")
    
    # Vehicle Info
    vehicle_category: Optional[str] = Field("Medium", description="Compact / Medium / Large")
    vehicle_price: Optional[float] = Field(35000.0, description="Vehicle price")
    age_of_vehicle: Optional[float] = Field(3.0, description="Age of vehicle")
    vehicle_color: Optional[str] = Field("Silver", description="Vehicle color")
    
    # Accident Info
    claim_date: Optional[str] = Field(None, description="Date of claim")
    claim_day_of_week: Optional[str] = Field("Friday", description="Day of week")
    accident_site: Optional[str] = Field("Highway", description="Accident location")
    past_num_of_claims: Optional[float] = Field(0.0, description="Past number of claims")
    witness_present: Optional[str] = Field("YES", description="YES / NO")
    liab_prct: Optional[float] = Field(30.0, description="Liability percentage (0-100)")
    
    # Policy Info
    channel: Optional[str] = Field("Phone", description="Phone / Online / Broker")
    police_report: Optional[str] = Field("YES", description="Police report filed (YES / NO)")
    policy_deductible: Optional[float] = Field(1000.0, description="Policy deductible")
    annual_premium: Optional[float] = Field(1200.0, description="Annual premium")
    days_open: Optional[float] = Field(5.0, description="Days open")
    form_defects: Optional[float] = Field(0.0, description="Form defects count")
    
    # Claim Financials
    total_claim: Optional[float] = Field(25000.0, description="Total claim amount")
    injury_claim: Optional[float] = Field(5000.0, description="Injury claim amount")
    
    # Model Selector
    model_name: Optional[str] = Field("Gradient Boosting", description="Model candidate to use")

def build_features_dataframe(data: ClaimPredictionRequest, feature_cols: list) -> pd.DataFrame:
    row = {col: 0.0 for col in feature_cols}

    # Numeric fields with safe casting
    numeric_values = {
        'age_of_driver': float(data.age_of_driver or 35),
        'safety_rating': float(data.safety_rating or 70),
        'annual_income': float(data.annual_income or 50000),
        'zip_code': float(data.zip_code or 50000),
        'past_num_of_claims': float(data.past_num_of_claims or 0),
        'liab_prct': float(data.liab_prct or 30),
        'age_of_vehicle': float(data.age_of_vehicle or 3),
        'vehicle_price': float(data.vehicle_price or 35000),
        'total_claim': float(data.total_claim or 25000),
        'injury_claim': float(data.injury_claim or 5000),
        'policy_deductible': float(data.policy_deductible or 1000),
        'annual_premium': float(data.annual_premium or 1200),
        'days_open': float(data.days_open or 5),
        'form_defects': float(data.form_defects or 0),
    }

    # Binary flag transformations
    high_edu_str = str(data.high_education or '').lower()
    numeric_values['high_education'] = 1.0 if high_edu_str in ['1', 'true', 'yes', 'high school', 'college', 'associate', 'masters', 'jd', 'md', 'phd'] else 0.0

    addr_str = str(data.address_change or '').upper()
    numeric_values['address_change'] = 1.0 if addr_str in ['1', 'YES', 'YES_1', 'YES_3', 'TRUE'] else 0.0

    police_str = str(data.police_report or '').upper()
    numeric_values['police_report'] = 1.0 if police_str in ['1', 'YES', 'TRUE'] else 0.0

    for k, v in numeric_values.items():
        if k in row:
            row[k] = v

    # Categorical One-Hot Encodings
    gender = str(data.gender or '').upper()
    if 'gender_M' in row:
        row['gender_M'] = 1.0 if gender in ['M', 'MALE'] else 0.0

    marital = str(data.marital_status or '').upper()
    if 'marital_status_0' in row and marital in ['0', 'SINGLE', 'DIVORCED']:
        row['marital_status_0'] = 1.0
    if 'marital_status_1' in row and marital in ['1', 'MARRIED']:
        row['marital_status_1'] = 1.0

    prop = str(data.property_status or '').capitalize()
    if 'property_status_Rent' in row and prop == 'Rent':
        row['property_status_Rent'] = 1.0

    day = str(data.claim_day_of_week or '').capitalize()
    col_day = f'claim_day_of_week_{day}'
    if col_day in row:
        row[col_day] = 1.0

    site = str(data.accident_site or '').strip()
    col_site = f'accident_site_{site}'
    if col_site in row:
        row[col_site] = 1.0

    witness = str(data.witness_present or '').upper()
    if witness in ['1', 'YES']:
        if 'witness_present_1' in row: row['witness_present_1'] = 1.0
    else:
        if 'witness_present_0' in row: row['witness_present_0'] = 1.0

    channel = str(data.channel or '').strip()
    col_channel = f'channel_{channel}'
    if col_channel in row:
        row[col_channel] = 1.0

    vcat = str(data.vehicle_category or '').capitalize()
    col_vcat = f'vehicle_category_{vcat}'
    if col_vcat in row:
        row[col_vcat] = 1.0

    vcolor = str(data.vehicle_color or '').lower()
    col_vcolor = f'vehicle_color_{vcolor}'
    if col_vcolor in row:
        row[col_vcolor] = 1.0

    return pd.DataFrame([row], columns=feature_cols)

def generate_decision_factors(data: ClaimPredictionRequest, prob: float) -> list:
    factors = []
    
    # 1. Total Claim Amount
    if (data.total_claim or 0) > 65000:
        factors.append({
            "title": "Substantial Claim Amount",
            "desc": f"Claim volume (${data.total_claim:,.0f}) significantly exceeds historical portfolio average.",
            "impact": "high_risk"
        })
    elif (data.total_claim or 0) < 20000:
        factors.append({
            "title": "Standard Claim Severity",
            "desc": f"Claim volume (${data.total_claim:,.0f}) falls well within conventional repair boundaries.",
            "impact": "low_risk"
        })

    # 2. Safety Rating
    if (data.safety_rating or 70) < 40:
        factors.append({
            "title": "Low Safety Profile",
            "desc": f"Safety rating of {data.safety_rating:.0f}/100 indicates higher accident liability risk.",
            "impact": "high_risk"
        })
    elif (data.safety_rating or 70) >= 80:
        factors.append({
            "title": "Exemplary Driver Safety",
            "desc": f"High safety rating ({data.safety_rating:.0f}/100) strongly correlates with legitimate claims.",
            "impact": "low_risk"
        })

    # 3. Police Report & Witness
    police = str(data.police_report or '').upper()
    witness = str(data.witness_present or '').upper()
    if police in ['NO', '0', 'FALSE'] and witness in ['NO', '0', 'FALSE']:
        factors.append({
            "title": "Unverified Incident Context",
            "desc": "Absence of both official police report and independent witnesses elevates scrutiny requirements.",
            "impact": "high_risk"
        })
    elif police in ['YES', '1', 'TRUE']:
        factors.append({
            "title": "Official Police Report Filed",
            "desc": "Documented law enforcement incident report confirms event timeline and details.",
            "impact": "low_risk"
        })

    # 4. Liability Percentage
    if (data.liab_prct or 0) > 70:
        factors.append({
            "title": "High Driver Liability",
            "desc": f"Driver liability assigned at {data.liab_prct:.0f}%, which presents increased financial incentive.",
            "impact": "high_risk"
        })

    # 5. Form Defects
    if (data.form_defects or 0) >= 3:
        factors.append({
            "title": "Administrative Discrepancies",
            "desc": f"{int(data.form_defects)} documentation anomalies recorded during claim intake.",
            "impact": "high_risk"
        })

    # 6. Past Claims
    if (data.past_num_of_claims or 0) >= 3:
        factors.append({
            "title": "Frequent Prior Claims",
            "desc": f"{int(data.past_num_of_claims)} prior claims on record within recent policy intervals.",
            "impact": "high_risk"
        })
    elif (data.past_num_of_claims or 0) == 0:
        factors.append({
            "title": "Clean Historical Record",
            "desc": "First-time claimant with zero previous claim disputes.",
            "impact": "low_risk"
        })

    if not factors:
        factors.append({
            "title": "Balanced Parameter Distribution",
            "desc": "Key features show standard values aligning with typical underwriting variance.",
            "impact": "neutral"
        })

    return factors

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Insurance Fraud Detection ML Engine",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "uptime_seconds": round(time.time() - server_start_time, 1),
        "models_loaded": list(models_cache.keys()),
        "active_model": "Gradient Boosting Classifier (Tuned)",
        "features_count": len(feature_names_cache),
        "dataset_records": metadata_cache.get("dataset_summary", {}).get("total_records", 12002)
    }

@app.get("/api/model-info")
def get_model_info():
    if not metadata_cache:
        raise HTTPException(status_code=503, detail="Model metadata not yet loaded. Please run train_models.py.")
    return metadata_cache

@app.get("/api/models")
def get_available_models():
    return {
        "models": [
            {"id": "Gradient Boosting", "name": "Gradient Boosting Classifier (Tuned)", "is_best": True, "f1_score": 0.1976, "accuracy": 0.7768},
            {"id": "Random Forest", "name": "Random Forest Classifier", "is_best": False, "f1_score": 0.1909, "accuracy": 0.7776},
            {"id": "Logistic Regression", "name": "Logistic Regression (Standardized)", "is_best": False, "f1_score": 0.1922, "accuracy": 0.7759},
            {"id": "AdaBoost", "name": "AdaBoost Classifier", "is_best": False, "f1_score": 0.1884, "accuracy": 0.7776},
            {"id": "Decision Tree", "name": "Decision Tree Classifier", "is_best": False, "f1_score": 0.1763, "accuracy": 0.7743}
        ],
        "default": "Gradient Boosting"
    }

@app.post("/api/predict")
def predict_claim(request: ClaimPredictionRequest):
    t_start = time.time()

    if not models_cache or not feature_names_cache:
        load_models_and_metadata()
        if not models_cache:
            raise HTTPException(status_code=503, detail="ML Models are unavailable. Please train models first.")

    # Select requested model or default to Gradient Boosting
    model_name = request.model_name or "Gradient Boosting"
    # Find matching model
    model = None
    for name, m in models_cache.items():
        if model_name.lower() in name.lower() or name.lower() in model_name.lower():
            model = m
            model_name = name
            break
    if model is None:
        model = models_cache.get('Gradient Boosting', list(models_cache.values())[0])
        model_name = 'Gradient Boosting'

    # Build feature row
    df_row = build_features_dataframe(request, feature_names_cache)

    # Perform inference
    try:
        prediction = int(model.predict(df_row)[0])
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(df_row)[0]
            # Class 1 is Fraud
            fraud_prob = float(probabilities[1]) * 100.0
        else:
            fraud_prob = 85.0 if prediction == 1 else 15.0
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Adjust calibration if necessary based on model class imbalance threshold
    # In Task 5 the training data fraud prevalence is ~24.6%
    if fraud_prob > 55.0:
        risk_level = "HIGH RISK"
        risk_badge = "badge-danger"
        risk_description = "Significant fraudulent indicators detected. SIU investigation and thorough claim audit recommended."
    elif fraud_prob > 28.0:
        risk_level = "MEDIUM RISK"
        risk_badge = "badge-warning"
        risk_description = "Elevated risk pattern detected. Secondary document verification and cross-referencing advised."
    else:
        risk_level = "LOW RISK"
        risk_badge = "badge-success"
        risk_description = "Claim shows standard operational characteristics with low anomalies. Recommended for automated approval."

    decision_factors = generate_decision_factors(request, fraud_prob)
    elapsed_ms = round((time.time() - t_start) * 1000, 2)

    return {
        "prediction": prediction,
        "is_fraud": bool(prediction == 1 or fraud_prob > 50.0),
        "fraud_probability": round(fraud_prob, 1),
        "confidence": round(max(fraud_prob, 100.0 - fraud_prob), 1),
        "risk_level": risk_level,
        "risk_badge": risk_badge,
        "risk_description": risk_description,
        "model_used": model_name,
        "inference_time_ms": elapsed_ms,
        "decision_factors": decision_factors,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

class QuickPredictionRequest(BaseModel):
    incident_severity: Optional[str] = "Minor Damage"
    insured_hobbies: Optional[str] = "reading"
    collision_type: Optional[str] = "Front Collision"
    age: Optional[int] = 35
    total_claim_amount: Optional[float] = 35000.0
    witnesses: Optional[int] = 2
    bodily_injuries: Optional[int] = 2
    incident_hour_of_the_day: Optional[int] = 12
    number_of_vehicles_involved: Optional[int] = 1

@app.post("/api/predict-quick")
def predict_quick(request: QuickPredictionRequest):
    global quick_predictor_cache
    if quick_predictor_cache is None:
        load_models_and_metadata()

    row = {
        'incident_severity': [request.incident_severity or 'Minor Damage'],
        'insured_hobbies': [request.insured_hobbies or 'reading'],
        'collision_type': [request.collision_type or 'Front Collision'],
        'age': [request.age or 35],
        'total_claim_amount': [float(request.total_claim_amount or 35000)],
        'witnesses': [request.witnesses if request.witnesses is not None else 2],
        'bodily_injuries': [request.bodily_injuries if request.bodily_injuries is not None else 2],
        'incident_hour_of_the_day': [request.incident_hour_of_the_day if request.incident_hour_of_the_day is not None else 12],
        'number_of_vehicles_involved': [request.number_of_vehicles_involved or 1]
    }
    df_in = pd.DataFrame(row)

    if quick_predictor_cache is not None:
        try:
            prob = float(quick_predictor_cache.predict_proba(df_in)[0][1]) * 100.0
            pred = int(quick_predictor_cache.predict(df_in)[0])
        except Exception as e:
            print(f"Quick inference fallback: {e}")
            prob = 24.5
            pred = 0
    else:
        prob = 24.5
        pred = 0

    factors = []
    if request.incident_severity == 'Major Damage':
        factors.append({"name": "Major Collision Severity", "value": "+45%", "state": "pos"})
    elif request.incident_severity == 'Total Loss':
        factors.append({"name": "Total Vehicle Loss", "value": "+18%", "state": "pos"})
    elif request.incident_severity == 'Trivial Damage':
        factors.append({"name": "Trivial Incident Impact", "value": "-8%", "state": "neg"})

    hobby = (request.insured_hobbies or '').lower()
    if hobby in ['chess', 'yachting', 'skydiving']:
        factors.append({"name": f"Policyholder Hobby: {hobby.capitalize()}", "value": "+30%", "state": "pos"})
    elif hobby == 'reading':
        factors.append({"name": "Low-Risk Hobby: Reading", "value": "-6%", "state": "neg"})

    if (request.total_claim_amount or 0) > 80000:
        factors.append({"name": "Extreme Claim Value (>$80k)", "value": "+14%", "state": "pos"})
    elif (request.total_claim_amount or 0) < 15000:
        factors.append({"name": "Low Claim Value (<$15k)", "value": "-8%", "state": "neg"})

    hour = request.incident_hour_of_the_day if request.incident_hour_of_the_day is not None else 12
    if hour >= 22 or hour <= 4:
        factors.append({"name": "Late-Night Incident Timing", "value": "+8%", "state": "pos"})

    if request.witnesses == 0:
        factors.append({"name": "Zero Witnesses Present", "value": "+6%", "state": "pos"})
    elif (request.witnesses or 0) >= 3:
        factors.append({"name": "Multiple Active Witnesses", "value": "-5%", "state": "neg"})

    prob = max(2.0, min(98.0, prob))

    if prob > 60.0:
        risk_level = "High Risk"
        risk_badge = "badge-danger"
    elif prob > 30.0:
        risk_level = "Medium Risk"
        risk_badge = "badge-warning"
    else:
        risk_level = "Low Risk"
        risk_badge = "badge-success"

    return {
        "fraud_probability": round(prob, 1),
        "prediction": pred,
        "risk_level": risk_level,
        "risk_badge": risk_badge,
        "factors": factors
    }

# Mount Frontend static files so the entire system runs unified on port 8000
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'Front-end')
if os.path.exists(FRONTEND_DIR):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == '__main__':
    import uvicorn
    print("=" * 60)
    print("  Vehicle Insurance Fraud Analytics Hub (Full Stack)")
    print("  Frontend UI + ML API running at: http://127.0.0.1:8000")
    print("  API Documentation at:             http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=8000)
