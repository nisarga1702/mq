# 🩺 Medical Quiz — ML Difficulty Classifier

A complete machine-learning system that classifies medical questions by difficulty
(beginner / intermediate / hard) and runs an **adaptive quiz** that adjusts to
your performance in real time.

---

## 📁 Project Structure

```
medical_quiz/
│
├── question_bank.py          ← Labelled question dataset (48 questions, 8 topics)
├── feature_extractor.py      ← Converts questions → 18-feature numeric vectors
├── train_model.py            ← Trains & selects the best ML classifier
├── quiz_engine.py            ← Interactive adaptive quiz (CLI)
├── evaluate_model.py         ← Deep model evaluation & feature importance
├── predict_new_question.py   ← Predict difficulty of your own custom questions
├── requirements.txt          ← Python dependencies
└── models/                   ← Auto-created after training
    ├── difficulty_classifier.joblib
    ├── label_map.joblib
    ├── feature_names.joblib
    └── model_meta.joblib
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the ML model
python train_model.py

# 3. Play the adaptive quiz
python quiz_engine.py

# 4. Evaluate model performance
python evaluate_model.py

# 5. Predict difficulty of a new question
python predict_new_question.py
```

---

## 🤖 ML Pipeline

### Feature Extraction (`feature_extractor.py`)
Each question is converted into an **18-dimensional feature vector**:

| # | Feature | Description |
|---|---------|-------------|
| 1 | `question_length` | Character count of question text |
| 2 | `word_count` | Number of words |
| 3 | `avg_word_length` | Mean word length (vocabulary complexity proxy) |
| 4 | `option_avg_length` | Mean length of the 4 answer options |
| 5 | `explanation_length` | Length of the explanation text |
| 6 | `has_clinical_vignette` | 1 if question contains patient scenario |
| 7 | `num_medical_terms` | Count of advanced medical vocabulary |
| 8 | `has_numbers` | 1 if contains lab values / numeric data |
| 9 | `has_mechanism` | 1 if asks about mechanism / pathway |
| 10 | `has_drug` | 1 if involves drug names / pharmacology |
| 11–18 | `topic_*` | One-hot encoding of the 8 medical topics |

### Model Training (`train_model.py`)
Four classifiers are compared via **5-fold stratified cross-validation**:

- **Random Forest** — ensemble of 300 decision trees
- **Gradient Boosting** — sequential boosted trees
- **SVM (RBF kernel)** — support vector machine
- **Logistic Regression** — linear baseline

Training also uses **data augmentation** (Gaussian noise, 6× multiplication)
to reduce overfitting on the 48-question dataset.

The best model (by macro F1) is saved to `models/`.

### Adaptive Quiz Logic (`quiz_engine.py`)
```
2 correct in a row  →  promote to next difficulty level  ▲
2 wrong in a row    →  demote to previous difficulty level ▼
otherwise           →  stay at current level
```

---

## 📊 Topics Covered

| Topic | # Questions |
|-------|-------------|
| Anatomy | 7 |
| Physiology | 6 |
| Pharmacology | 6 |
| Pathology | 6 |
| Microbiology | 6 |
| Biochemistry | 6 |
| Clinical Medicine | 6 |
| Surgery | 5 |

---

## ⚙️ Quiz Engine Options

```bash
python quiz_engine.py --help

Options:
  --topic      Filter by topic (e.g., Anatomy, Pharmacology)
  --level      Starting level: beginner | intermediate | hard
  --questions  Number of questions (default: 8)
  --no-adaptive  Disable adaptive difficulty (fixed level)
```

### Examples

```bash
# Anatomy quiz, starting at hard level
python quiz_engine.py --topic Anatomy --level hard

# 15-question Pharmacology quiz, adaptive ON
python quiz_engine.py --topic Pharmacology --questions 15

# Fixed-difficulty beginner quiz
python quiz_engine.py --level beginner --no-adaptive --questions 10
```

---

## 🔬 Adding Your Own Questions

### Method 1 — Add to `question_bank.py`

```python
{
    "question": "Which receptor does morphine primarily act on?",
    "options": ["μ (mu) opioid receptor", "κ receptor", "δ receptor", "GABA-A receptor"],
    "topic": "Pharmacology",
    "difficulty": "beginner",         # beginner | intermediate | hard
    "explanation": "Morphine is a full agonist at μ-opioid receptors, mediating analgesia, euphoria, and respiratory depression."
}
```

Then retrain: `python train_model.py`

### Method 2 — Predict difficulty of a new question

```python
from predict_new_question import predict_question

result = predict_question(
    question="A patient with nephrotic syndrome develops periorbital oedema. Why?",
    options=["Hypoalbuminaemia reduces plasma oncotic pressure",
             "Increased ADH causes water retention",
             "Hyperaldosteronism increases Na reabsorption",
             "Lymphatic obstruction"],
    topic="Clinical Medicine",
    explanation="Loss of albumin reduces πc → net fluid filtration into interstitium."
)
print(result["predicted_difficulty"])   # → "intermediate"
print(result["probabilities"])          # → {"beginner": 0.07, "intermediate": 0.71, "hard": 0.22}
```

---

## 📦 Requirements

```
scikit-learn>=1.3
numpy>=1.24
pandas>=2.0
joblib>=1.3
```

---

## 🧠 Difficulty Levels

| Level | Target Audience | Question Style |
|-------|----------------|----------------|
| **Beginner** | Year 1–2 medical students | Core definitions, basic facts |
| **Intermediate** | Year 3–4 / clinical students | Clinical vignettes, mechanisms |
| **Hard** | USMLE Step 2/3, postgraduate | Complex pathophysiology, multi-step reasoning |
