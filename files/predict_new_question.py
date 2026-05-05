"""
predict_new_question.py
───────────────────────
Predict the difficulty level of ANY new question you write.
The ML model analyses its features and returns a difficulty label + confidence.

Usage:
  python predict_new_question.py

Or import and call:
  from predict_new_question import predict_question
"""

import joblib
import numpy as np
import os

from feature_extractor import extract_features

MODEL_DIR = "models"
LABELS = ["beginner", "intermediate", "hard"]


def load_model():
    path = os.path.join(MODEL_DIR, "difficulty_classifier.joblib")
    if not os.path.exists(path):
        raise FileNotFoundError("Model not found. Run python train_model.py first.")
    return joblib.load(path)


def predict_question(question: str,
                     options: list,
                     topic: str,
                     explanation: str = "") -> dict:
    """
    Predict the difficulty of a single question.

    Parameters
    ----------
    question    : str   — the question text
    options     : list  — 4 answer options (order doesn't matter for prediction)
    topic       : str   — one of Anatomy | Physiology | Pharmacology |
                          Pathology | Microbiology | Biochemistry |
                          Clinical Medicine | Surgery
    explanation : str   — optional; answer explanation text

    Returns
    -------
    dict with keys:
      predicted_difficulty : str   — "beginner" | "intermediate" | "hard"
      confidence           : float — probability of predicted class
      probabilities        : dict  — per-class probabilities
      feature_vector       : list  — raw feature values
    """
    model = load_model()
    q_dict = {
        "question": question,
        "options": options,
        "topic": topic,
        "explanation": explanation,
    }
    feats = extract_features(q_dict).reshape(1, -1)
    pred_idx = model.predict(feats)[0]
    proba = model.predict_proba(feats)[0]

    return {
        "predicted_difficulty": LABELS[pred_idx],
        "confidence": round(float(proba[pred_idx]), 4),
        "probabilities": {
            "beginner":     round(float(proba[0]), 4),
            "intermediate": round(float(proba[1]), 4),
            "hard":         round(float(proba[2]), 4),
        },
        "feature_vector": feats[0].tolist(),
    }


def interactive_predict():
    print("\n" + "=" * 60)
    print("  ML DIFFICULTY PREDICTOR — Enter a custom question")
    print("=" * 60)

    topics = ["Anatomy", "Physiology", "Pharmacology",
              "Pathology", "Microbiology", "Biochemistry",
              "Clinical Medicine", "Surgery"]

    print("\n  Topics:")
    for i, t in enumerate(topics, 1):
        print(f"    {i}. {t}")
    while True:
        choice = input("\n  Select topic number: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(topics):
            topic = topics[int(choice) - 1]
            break

    question = input("\n  Enter question: ").strip()

    options = []
    print("  Enter 4 answer options:")
    for i in range(4):
        opt = input(f"    Option {chr(65+i)}: ").strip()
        options.append(opt)

    explanation = input("\n  Explanation (optional, press Enter to skip): ").strip()

    result = predict_question(question, options, topic, explanation)

    pred = result["predicted_difficulty"]
    conf = result["confidence"]
    colors = {"beginner": "\033[92m", "intermediate": "\033[93m", "hard": "\033[91m"}
    RESET = "\033[0m"
    col = colors.get(pred, "")

    print(f"\n  Predicted difficulty: {col}{pred.upper()}{RESET}  (confidence: {conf:.1%})")
    print(f"\n  All probabilities:")
    for lvl, prob in result["probabilities"].items():
        bar = "█" * int(prob * 30)
        print(f"    {lvl:<14} {prob:.1%}  {bar}")
    print()


if __name__ == "__main__":
    interactive_predict()
