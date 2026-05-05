"""
train_model.py
──────────────
Trains a difficulty classifier on the medical question bank.

Pipeline:
  1. Load questions from question_bank.py
  2. Extract numeric features via feature_extractor.py
  3. Augment training data with perturbation
  4. Train multiple classifiers and pick the best via cross-validation
  5. Save the best model + scaler to disk

Models compared:
  - Random Forest (robust, interpretable)
  - Gradient Boosting (high accuracy)
  - SVM with RBF kernel (good on small data)
  - Logistic Regression (baseline)

Usage:
  python train_model.py
"""

import numpy as np
import joblib
import os
from collections import Counter

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix

from question_bank import QUESTION_BANK
from feature_extractor import extract_features, get_feature_names

LABEL_MAP = {"beginner": 0, "intermediate": 1, "hard": 2}
LABEL_INV = {v: k for k, v in LABEL_MAP.items()}
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)


def augment_data(X: np.ndarray, y: np.ndarray, factor: int = 6) -> tuple:
    """
    Simple augmentation: add Gaussian noise to numeric features.
    This helps prevent overfitting on small datasets.
    """
    rng = np.random.RandomState(42)
    X_aug, y_aug = [X], [y]
    for _ in range(factor):
        noise = rng.normal(0, 0.05, size=X.shape)
        X_aug.append(X + noise * X.std(axis=0))
        y_aug.append(y)
    return np.vstack(X_aug), np.concatenate(y_aug)


def build_candidates() -> dict:
    return {
        "RandomForest": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(
                n_estimators=300, max_depth=8,
                min_samples_leaf=2, class_weight="balanced",
                random_state=42
            ))
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", GradientBoostingClassifier(
                n_estimators=200, max_depth=4,
                learning_rate=0.08, random_state=42
            ))
        ]),
        "SVM_RBF": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", SVC(
                kernel="rbf", C=5, gamma="scale",
                class_weight="balanced", probability=True,
                random_state=42
            ))
        ]),
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(
                C=1.0, max_iter=500, class_weight="balanced",
                random_state=42
            ))
        ]),
    }


def train():
    print("=" * 60)
    print("  MEDICAL QUIZ — ML DIFFICULTY CLASSIFIER TRAINING")
    print("=" * 60)

    # ── 1. Build feature matrix ─────────────────────────────────
    print(f"\n[1/5] Loading {len(QUESTION_BANK)} questions from question bank...")
    X_raw = np.array([extract_features(q) for q in QUESTION_BANK])
    y_raw = np.array([LABEL_MAP[q["difficulty"]] for q in QUESTION_BANK])

    dist = Counter(y_raw)
    print(f"      Label distribution: beginner={dist[0]}, intermediate={dist[1]}, hard={dist[2]}")
    print(f"      Features per sample: {X_raw.shape[1]}")
    print(f"      Feature names: {get_feature_names()}")

    # ── 2. Augment ──────────────────────────────────────────────
    print("\n[2/5] Augmenting training data (noise perturbation, 6x)...")
    X, y = augment_data(X_raw, y_raw, factor=6)
    print(f"      Dataset size after augmentation: {len(X)} samples")

    # ── 3. Cross-validate all candidates ────────────────────────
    print("\n[3/5] Cross-validating candidate models (5-fold stratified)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    candidates = build_candidates()
    results = {}

    for name, pipeline in candidates.items():
        scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1_macro")
        mean_f1 = scores.mean()
        results[name] = mean_f1
        print(f"      {name:<25} F1-macro = {mean_f1:.4f} ± {scores.std():.4f}")

    best_name = max(results, key=results.get)
    best_score = results[best_name]
    print(f"\n      ✔  Best model: {best_name} (F1 = {best_score:.4f})")

    # ── 4. Train best model on full data ────────────────────────
    print(f"\n[4/5] Training {best_name} on full augmented dataset...")
    best_pipeline = candidates[best_name]
    best_pipeline.fit(X, y)

    # Full-data classification report (train set — for sanity check)
    y_pred = best_pipeline.predict(X_raw)
    print("\n      ── In-sample classification report (original data) ──")
    print(classification_report(
        y_raw, y_pred,
        target_names=["beginner", "intermediate", "hard"]
    ))
    cm = confusion_matrix(y_raw, y_pred)
    print("      Confusion matrix (rows=true, cols=pred):")
    print(f"      {cm}")

    # ── 5. Save artefacts ────────────────────────────────────────
    print(f"\n[5/5] Saving model to {MODEL_DIR}/...")
    joblib.dump(best_pipeline, f"{MODEL_DIR}/difficulty_classifier.joblib")
    joblib.dump(LABEL_MAP, f"{MODEL_DIR}/label_map.joblib")
    joblib.dump(get_feature_names(), f"{MODEL_DIR}/feature_names.joblib")

    # Also save model metadata
    meta = {
        "model_name": best_name,
        "cv_f1_macro": best_score,
        "n_training_samples": len(X),
        "n_original_samples": len(X_raw),
        "n_features": X_raw.shape[1],
        "labels": LABEL_MAP,
        "topics": ["Anatomy", "Physiology", "Pharmacology",
                   "Pathology", "Microbiology", "Biochemistry",
                   "Clinical Medicine", "Surgery"],
    }
    joblib.dump(meta, f"{MODEL_DIR}/model_meta.joblib")

    print(f"\n  Saved files:")
    for f in os.listdir(MODEL_DIR):
        size = os.path.getsize(f"{MODEL_DIR}/{f}")
        print(f"    {f}  ({size:,} bytes)")

    print("\n" + "=" * 60)
    print("  Training complete! Run  python quiz_engine.py  to play.")
    print("=" * 60 + "\n")

    return best_pipeline


if __name__ == "__main__":
    train()
