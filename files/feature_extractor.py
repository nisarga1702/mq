"""
feature_extractor.py
────────────────────
Converts a raw question dict into a numeric feature vector used by the ML model.

Features extracted:
  1. question_length        – char count of question text
  2. word_count             – word count of question
  3. avg_word_length        – mean word length (proxy for vocabulary complexity)
  4. option_avg_length      – mean char length of the 4 options
  5. explanation_length     – char length of explanation
  6. has_clinical_vignette  – 1 if question contains age/gender/symptom setup
  7. num_medical_terms       – count of domain-specific medical keywords
  8. has_numbers            – 1 if question contains numeric values / lab values
  9. has_mechanism          – 1 if question asks about mechanism / pathway
  10. has_drug              – 1 if question involves drug names / pharmacology words
  11. topic_encoded         – one-hot for each of 7 topics (7 features)
  ─────────────────────────────────────────────────────────────────────
  Total: 18 features
"""

import re
import numpy as np

TOPICS = [
    "Anatomy", "Physiology", "Pharmacology",
    "Pathology", "Microbiology", "Biochemistry",
    "Clinical Medicine", "Surgery"
]

# Words strongly associated with advanced/hard questions
ADVANCED_TERMS = {
    "receptor", "inhibitor", "pathway", "mechanism", "cascade",
    "phosphorylation", "transcription", "translation", "gene", "protein",
    "enzyme", "substrate", "cofactor", "allosteric", "competitive",
    "pharmacokinetics", "pharmacodynamics", "bioavailability", "half-life",
    "cytochrome", "metabolism", "gluconeogenesis", "glycolysis", "krebs",
    "electron", "oxidative", "reductive", "mitochondria", "membrane",
    "voltage", "action potential", "depolarization", "repolarization",
    "agonist", "antagonist", "partial", "inverse", "efficacy", "potency",
    "sensitivity", "specificity", "ppv", "npv", "likelihood ratio",
    "sensitivity", "autoimmune", "antibody", "antigen", "complement",
    "cytokine", "interleukin", "chemokine", "apoptosis", "necrosis",
    "metastasis", "oncogene", "tumor suppressor", "mutation", "chromosomal",
    "lymphoma", "leukemia", "carcinoma", "sarcoma", "adenoma",
    "hypertension", "hypotension", "arrhythmia", "ischemia", "infarction",
    "sepsis", "shock", "acidosis", "alkalosis", "electrolyte",
    "nephron", "glomerular", "tubular", "filtration", "reabsorption",
    "hepatic", "portal", "cholestatic", "cirrhosis", "fibrosis",
    "perioperative", "anastomosis", "resection", "laparotomy", "laparoscopy",
}

CLINICAL_KEYWORDS = {
    "year-old", "presents", "patient", "history", "complains",
    "examination", "labs show", "biopsy", "x-ray", "ct scan",
    "mri", "ultrasound", "ecg", "ekg", "vital signs", "blood pressure",
    "temperature", "pulse", "diagnosis", "treatment", "management",
}

MECHANISM_WORDS = {
    "mechanism", "pathway", "inhibit", "activate", "block", "stimulate",
    "receptor", "enzyme", "transporter", "channel", "cascade", "signal",
    "mediated", "dependent", "independent", "regulated",
}

DRUG_WORDS = {
    "drug", "medication", "antibiotic", "inhibitor", "blocker",
    "agonist", "antagonist", "dose", "overdose", "toxicity", "side effect",
    "adverse", "contraindicated", "interaction", "-olol", "-pril", "-statin",
    "-mycin", "-cillin", "-azole", "-mab", "-nib", "-tide",
}


def extract_features(question_dict: dict) -> np.ndarray:
    """
    Returns a 1-D numpy array of 18 float features for a single question.
    """
    q_text = question_dict.get("question", "").lower()
    options = question_dict.get("options", [])
    explanation = question_dict.get("explanation", "").lower()
    topic = question_dict.get("topic", "")

    words = q_text.split()
    word_count = len(words)
    question_length = len(q_text)
    avg_word_length = np.mean([len(w) for w in words]) if words else 0

    option_lengths = [len(o) for o in options]
    option_avg_length = np.mean(option_lengths) if option_lengths else 0

    explanation_length = len(explanation)

    # Clinical vignette detection
    has_clinical = int(
        bool(re.search(r"\d+[- ]year[- ]old|presents? with|patient|history of", q_text))
    )

    # Medical term count
    num_medical_terms = sum(1 for t in ADVANCED_TERMS if t in q_text or t in explanation)

    # Has numbers / lab values
    has_numbers = int(bool(re.search(r"\d+\.?\d*\s*(mg|ml|mmol|mmhg|bpm|hz|iu|g|kg|%)", q_text)))

    # Asks about mechanism
    has_mechanism = int(any(w in q_text for w in MECHANISM_WORDS))

    # Involves drugs
    has_drug = int(any(w in q_text for w in DRUG_WORDS) or topic == "Pharmacology")

    # Topic one-hot (8 topics)
    topic_vec = [int(topic == t) for t in TOPICS]

    features = [
        question_length,
        word_count,
        avg_word_length,
        option_avg_length,
        explanation_length,
        has_clinical,
        num_medical_terms,
        has_numbers,
        has_mechanism,
        has_drug,
        *topic_vec,   # 8 features
    ]

    return np.array(features, dtype=float)


def get_feature_names() -> list:
    topic_names = [f"topic_{t.lower().replace(' ', '_')}" for t in TOPICS]
    return [
        "question_length", "word_count", "avg_word_length",
        "option_avg_length", "explanation_length",
        "has_clinical_vignette", "num_medical_terms",
        "has_numbers", "has_mechanism", "has_drug",
        *topic_names,
    ]
