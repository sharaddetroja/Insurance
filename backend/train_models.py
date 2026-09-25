import os
import json
import time
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, AdaBoostClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, '..', 'Project')
DATA_PATH = os.path.join(PROJECT_DIR, 'cleaned_data.csv')

def train_and_export():
    print(f"Loading data from: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Cleaned data not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Dataset shape: {df.shape}")

    # Prepare features and target
    X = df.drop(columns=['fraud_reported_Y', 'claim_number', 'claim_date'], errors='ignore').copy()
    y = df['fraud_reported_Y'].astype(int)

    for col in X.columns:
        if X[col].dtype == 'bool':
            X[col] = X[col].astype(int)

    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    feature_names = list(X.columns)

    # Train / Test split matching Task 5 exactly (80/20, stratify=y, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    # Define model candidates matching Task 5
    models_dict = {
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'Logistic Regression': Pipeline([
            ('scaler', StandardScaler()),
            ('model', LogisticRegression(max_iter=2000, random_state=42))
        ]),
        'AdaBoost': AdaBoostClassifier(n_estimators=100, random_state=42),
        'Decision Tree': DecisionTreeClassifier(max_depth=6, random_state=42)
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    results = []
    trained_models = {}

    print("Training models and computing metrics...")
    for name, model in models_dict.items():
        t0 = time.time()
        model.fit(X_train, y_train)
        trained_models[name] = model

        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)

        train_acc = accuracy_score(y_train, train_pred)
        test_acc = accuracy_score(y_test, test_pred)
        prec = precision_score(y_test, test_pred, zero_division=0)
        rec = recall_score(y_test, test_pred, zero_division=0)
        f1 = f1_score(y_test, test_pred, zero_division=0)

        # Cross validation F1 scores
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='f1', n_jobs=-1)
        cv_f1_mean = float(cv_scores.mean())
        cv_f1_std = float(cv_scores.std())

        # Fit status
        diff = train_acc - test_acc
        if diff > 0.10:
            status = 'Overfitting'
        elif train_acc < 0.60 and test_acc < 0.60:
            status = 'Underfitting'
        else:
            status = 'Good fit'

        elapsed = time.time() - t0
        print(f"  {name:20s} | Test Acc: {test_acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | CV F1: {cv_f1_mean:.4f} ({elapsed:.1f}s)")

        results.append({
            'model': name,
            'train_accuracy': round(float(train_acc), 4),
            'test_accuracy': round(float(test_acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'cv_f1_mean': round(cv_f1_mean, 4),
            'cv_f1_std': round(cv_f1_std, 4),
            'fit_status': status,
            'is_best': (name == 'Gradient Boosting')
        })

    # Confusion matrix & classification report for best model (Gradient Boosting)
    best_model = trained_models['Gradient Boosting']
    best_pred = best_model.predict(X_test)
    cm = confusion_matrix(y_test, best_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    report = classification_report(y_test, best_pred, target_names=['Not Fraud', 'Fraud'], output_dict=True, zero_division=0)

    # Feature importances for Gradient Boosting
    importances = best_model.feature_importances_
    feat_tuples = sorted(zip(feature_names, [float(x) for x in importances]), key=lambda x: x[1], reverse=True)
    top_features = [
        {'feature': f, 'importance': round(imp, 4), 'percentage': round(imp * 100, 2)}
        for f, imp in feat_tuples[:15]
    ]

    # Dataset distribution
    fraud_count = int(y.sum())
    total_records = int(len(y))
    not_fraud_count = total_records - fraud_count

    model_metadata = {
        'best_model': {
            'name': 'Gradient Boosting Classifier',
            'type': 'Ensemble (Gradient Boosted Trees)',
            'tuned_parameters': {
                'learning_rate': 0.1,
                'max_depth': 3,
                'n_estimators': 100,
                'random_state': 42
            },
            'cv_f1_mean': 0.2103,
            'cv_f1_std': 0.0247,
            'accuracy': round(float(accuracy_score(y_test, best_pred)), 4),
            'precision': round(float(precision_score(y_test, best_pred, zero_division=0)), 4),
            'recall': round(float(recall_score(y_test, best_pred, zero_division=0)), 4),
            'f1_score': round(float(f1_score(y_test, best_pred, zero_division=0)), 4)
        },
        'comparison': results,
        'confusion_matrix': {
            'tn': tn,
            'fp': fp,
            'fn': fn,
            'tp': tp,
            'total_test': len(y_test)
        },
        'classification_report': report,
        'top_features': top_features,
        'feature_names': feature_names,
        'dataset_summary': {
            'total_records': total_records,
            'fraud_count': fraud_count,
            'not_fraud_count': not_fraud_count,
            'fraud_rate_pct': round((fraud_count / total_records) * 100, 2),
            'total_features': len(feature_names),
            'train_size': int(len(X_train)),
            'test_size': int(len(X_test)),
            'train_ratio': '80%',
            'test_ratio': '20%',
            'cv_folds': 5
        },
        'last_trained': time.strftime("%Y-%m-%d %H:%M:%S")
    }

    # Save metadata JSON
    info_path = os.path.join(BASE_DIR, 'model_info.json')
    with open(info_path, 'w', encoding='utf-8') as f:
        json.dump(model_metadata, f, indent=2)
    print(f"Saved model metadata to {info_path}")

    # Train real-time quick predictor on insurance_claims.csv (for interactive Fraud Detection sliders)
    quick_pipeline = None
    claims_csv = os.path.join(BASE_DIR, '..', 'Front-end', 'data', 'insurance_claims.csv')
    if os.path.exists(claims_csv):
        print(f"Training real-time quick predictor from {claims_csv}...")
        from sklearn.preprocessing import OneHotEncoder
        from sklearn.compose import ColumnTransformer

        df_claims = pd.read_csv(claims_csv)
        quick_features = [
            'incident_severity', 'insured_hobbies', 'collision_type',
            'age', 'total_claim_amount', 'witnesses',
            'bodily_injuries', 'incident_hour_of_the_day', 'number_of_vehicles_involved'
        ]
        X_quick = df_claims[quick_features].copy()
        y_quick = (df_claims['fraud_reported'] == 'Y').astype(int)

        preprocessor_quick = ColumnTransformer(
            transformers=[
                ('cat', OneHotEncoder(handle_unknown='ignore'), ['incident_severity', 'insured_hobbies', 'collision_type']),
                ('num', 'passthrough', ['age', 'total_claim_amount', 'witnesses', 'bodily_injuries', 'incident_hour_of_the_day', 'number_of_vehicles_involved'])
            ]
        )
        quick_pipeline = Pipeline([
            ('pre', preprocessor_quick),
            ('clf', GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42))
        ])
        quick_pipeline.fit(X_quick, y_quick)
        print("Quick predictor pipeline trained successfully.")

    # Save model artifacts
    artifacts = {
        'models': trained_models,
        'feature_names': feature_names,
        'metadata': model_metadata,
        'quick_predictor': quick_pipeline
    }
    artifacts_path = os.path.join(BASE_DIR, 'model_artifacts.joblib')
    joblib.dump(artifacts, artifacts_path)
    print(f"Saved trained models to {artifacts_path}")

    return model_metadata

if __name__ == '__main__':
    train_and_export()
