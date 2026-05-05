"""
evaluate_model.py
─────────────────
Deep evaluation of the trained difficulty classifier:
  - Confusion matrix
  - Per-class precision / recall / F1
  - Feature importance (for tree models)
  - Leave-one-out cross-validation
  - Example predictions with confidence scores

Usage:
  python evaluate_model.py
"""

import numpy as np
import joblib
import os

from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.metrics import (
    classification_report, confusion_matrix,
    ConfusionMatrixDisplay, f1_score
)
from sklearn.inspection import permutation_importance

from question_bank import QUESTION_BANK
from feature_extractor import extract_features, get_feature_names

MODEL_DIR = "models"
LABELS = ["beginner", "intermediate", "hard"]


def load_artefacts():
    clf = joblib.load(f"{MODEL_DIR}/difficulty_classifier.joblib")
    meta = joblib.load(f"{MODEL_DIR}/model_meta.joblib")
    return clf, meta


def main():
    print("\n" + "=" * 62)
    print("  MEDICAL QUIZ MODEL — DEEP EVALUATION")
    print("=" * 62)

    clf, meta = load_artefacts()

    X = np.array([extract_features(q) for q in QUESTION_BANK])
    y = np.array([LABELS.index(q["difficulty"]) for q in QUESTION_BANK])
    feature_names = get_feature_names()

    print(f"\n  Model   : {meta['model_name']}")
    print(f"  CV F1   : {meta['cv_f1_macro']:.4f}")
    print(f"  Samples : {meta['n_original_samples']} original  "
          f"({meta['n_training_samples']} w/ augmentation)")
    print(f"  Features: {meta['n_features']}")

    # ── LOO Cross-validation ─────────────────────────────────────
    print("\n  Running Leave-One-Out CV on original data...")
    loo = LeaveOneOut()
    y_loo = cross_val_predict(clf, X, y, cv=loo)
    loo_f1 = f1_score(y, y_loo, average="macro")
    print(f"  LOO F1-macro : {loo_f1:.4f}")

    # ── Classification report ────────────────────────────────────
    print("\n  LOO Classification Report:")
    print("  " + "-" * 54)
    report = classification_report(y, y_loo, target_names=LABELS)
    for line in report.split("\n"):
        print("  " + line)

    # ── Confusion matrix ─────────────────────────────────────────
    cm = confusion_matrix(y, y_loo)
    print("  Confusion Matrix (rows=true, cols=predicted):")
    print(f"  {'':15} {'beginner':>10} {'intermediate':>14} {'hard':>6}")
    for i, row in enumerate(cm):
        print(f"  {LABELS[i]:15} {row[0]:>10} {row[1]:>14} {row[2]:>6}")

    # ── Feature importance ───────────────────────────────────────
    print("\n  Feature Importance (permutation, 5 repeats):")
    print("  " + "-" * 54)
    perm = permutation_importance(clf, X, y, n_repeats=5, random_state=42, scoring="f1_macro")
    importances = perm.importances_mean
    sorted_idx = np.argsort(importances)[::-1]
    for rank, idx in enumerate(sorted_idx, 1):
        bar = "█" * int(importances[idx] * 200)
        print(f"  {rank:>2}. {feature_names[idx]:<30} {importances[idx]:+.4f}  {bar}")

    # ── Example predictions ──────────────────────────────────────
    print("\n  Example Predictions (sample from each level):")
    print("  " + "-" * 54)
    proba = clf.predict_proba(X)
    for target_level in range(3):
        idxs = np.where(y == target_level)[0]
        if len(idxs) == 0:
            continue
        pick = idxs[0]
        q = QUESTION_BANK[pick]
        pred = np.argmax(proba[pick])
        print(f"\n  True: {LABELS[target_level].upper():<14} "
              f"Predicted: {LABELS[pred].upper():<14}")
        print(f"  Q: {q['question'][:70]}{'...' if len(q['question'])>70 else ''}")
        print(f"  Confidence — "
              f"B:{proba[pick][0]:.2f}  I:{proba[pick][1]:.2f}  H:{proba[pick][2]:.2f}")

    print("\n" + "=" * 62 + "\n")


if __name__ == "__main__":
    main()
