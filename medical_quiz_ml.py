"""
medical_quiz_ml.py
══════════════════
Single-file Medical Quiz ML Model.

• Trains a difficulty classifier internally (no separate files needed)
• Runs a quiz session based on chosen level
• Outputs EVERYTHING as clean JSON

Usage:
  python medical_quiz_ml.py                          # interactive menu
  python medical_quiz_ml.py --level beginner         # start at beginner
  python medical_quiz_ml.py --level hard --topic Pharmacology
  python medical_quiz_ml.py --questions 5 --output results.json
  python medical_quiz_ml.py --train-only             # just train & print model stats
  python medical_quiz_ml.py --predict                # predict difficulty of a custom question
"""

import argparse
import json
import sys
import random
import re
import numpy as np
from collections import Counter

from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score, cross_val_predict
from sklearn.metrics import classification_report, f1_score

# ══════════════════════════════════════════════════════════════════════════════
# 1. QUESTION BANK  (49 labelled questions, 8 topics, 3 levels)
# ══════════════════════════════════════════════════════════════════════════════

QUESTION_BANK = [
    # ── ANATOMY ──────────────────────────────────────────────────────────────
    {"question":"Which bone is the longest in the human body?","options":["Femur","Tibia","Humerus","Fibula"],"topic":"Anatomy","difficulty":"beginner","explanation":"The femur (thigh bone) is the longest and strongest bone in the human body."},
    {"question":"How many chambers does the human heart have?","options":["4","2","3","6"],"topic":"Anatomy","difficulty":"beginner","explanation":"The heart has 4 chambers: right atrium, right ventricle, left atrium, left ventricle."},
    {"question":"Which organ produces bile?","options":["Liver","Pancreas","Gallbladder","Spleen"],"topic":"Anatomy","difficulty":"beginner","explanation":"Bile is produced by the liver and stored in the gallbladder."},
    {"question":"The brachial plexus originates from which spinal levels?","options":["C5–T1","C1–C5","T1–T5","C3–C8"],"topic":"Anatomy","difficulty":"intermediate","explanation":"The brachial plexus arises from ventral rami of C5 through T1."},
    {"question":"Which structure passes through the foramen ovale of the skull base?","options":["V3 (mandibular nerve)","V2 (maxillary nerve)","CN VII","CN IX"],"topic":"Anatomy","difficulty":"intermediate","explanation":"The mandibular division of the trigeminal nerve (V3) passes through the foramen ovale."},
    {"question":"The Triangle of Calot is bounded by which structures?","options":["Cystic duct, common hepatic duct, inferior liver surface","Portal vein, hepatic artery, bile duct","Cystic artery, common bile duct, duodenum","Liver, gallbladder, hepatic vein"],"topic":"Anatomy","difficulty":"hard","explanation":"Calot's triangle: cystic duct (inferior), common hepatic duct (medial), liver (superior). The cystic artery runs within it."},
    {"question":"A lesion at the lateral sulcus most likely damages which cortical area?","options":["Primary auditory cortex (Heschl's gyri)","Primary motor cortex","Primary visual cortex","Somatosensory cortex"],"topic":"Anatomy","difficulty":"hard","explanation":"Heschl's transverse gyri (BA 41/42) lie within the lateral sulcus — primary auditory cortex."},

    # ── PHYSIOLOGY ────────────────────────────────────────────────────────────
    {"question":"What is the normal resting heart rate for adults?","options":["60–100 bpm","40–60 bpm","100–120 bpm","50–70 bpm"],"topic":"Physiology","difficulty":"beginner","explanation":"Normal adult resting heart rate is 60–100 beats per minute."},
    {"question":"Which ion primarily sets the resting membrane potential?","options":["Potassium (K⁺)","Sodium (Na⁺)","Chloride (Cl⁻)","Calcium (Ca²⁺)"],"topic":"Physiology","difficulty":"beginner","explanation":"K⁺ drives the resting membrane potential (~−70 mV) because the membrane is most permeable to K⁺ at rest."},
    {"question":"Which nephron segment is impermeable to water but actively reabsorbs NaCl?","options":["Thick ascending limb of Henle","Proximal convoluted tubule","Collecting duct","Thin descending limb"],"topic":"Physiology","difficulty":"intermediate","explanation":"The thick ascending limb is the 'diluting segment' — impermeable to water but reabsorbs NaCl via NKCC2."},
    {"question":"In the Frank-Starling mechanism, increased preload leads to:","options":["Increased stroke volume due to greater myofilament overlap","Decreased stroke volume due to overstretching","Increased heart rate via baroreceptors","Decreased end-diastolic volume"],"topic":"Physiology","difficulty":"intermediate","explanation":"Greater preload stretches sarcomeres toward optimal overlap, increasing cross-bridge formation and stroke volume."},
    {"question":"A patient with PaO₂ 55 mmHg, PaCO₂ 30 mmHg, pH 7.50 most likely has:","options":["Respiratory alkalosis with hypoxemia (e.g., PE)","Metabolic alkalosis with hypoxemia","Respiratory acidosis","Mixed metabolic and respiratory acidosis"],"topic":"Physiology","difficulty":"hard","explanation":"Low PaCO₂ + high pH = primary respiratory alkalosis; low PaO₂ suggests hypoxemia-driven hyperventilation (PE, high altitude)."},
    {"question":"Which Starling force primarily drives fluid reabsorption from interstitium into capillaries?","options":["Plasma oncotic pressure (πc)","Capillary hydrostatic pressure (Pc)","Interstitial hydrostatic pressure (Pi)","Interstitial oncotic pressure (πi)"],"topic":"Physiology","difficulty":"hard","explanation":"Plasma oncotic pressure (mainly albumin) draws fluid back into capillaries, opposing hydrostatic filtration."},

    # ── PHARMACOLOGY ──────────────────────────────────────────────────────────
    {"question":"First-line antihypertensive in diabetic patients?","options":["ACE inhibitors","Beta-blockers","Calcium channel blockers","Diuretics"],"topic":"Pharmacology","difficulty":"beginner","explanation":"ACE inhibitors are first-line for hypertensive diabetics — they also protect against diabetic nephropathy."},
    {"question":"Aspirin irreversibly inhibits which enzyme?","options":["COX-1 and COX-2","LOX","PLA₂","Thrombin"],"topic":"Pharmacology","difficulty":"beginner","explanation":"Aspirin irreversibly acetylates COX-1 and COX-2, blocking thromboxane A₂ and prostaglandin synthesis."},
    {"question":"A patient on warfarin starts rifampin. Expected effect on INR?","options":["INR decreases — rifampin induces CYP2C9, increasing warfarin metabolism","INR increases — rifampin inhibits warfarin clearance","No change","INR increases — rifampin displaces warfarin from albumin"],"topic":"Pharmacology","difficulty":"intermediate","explanation":"Rifampin is a potent CYP450 inducer — it accelerates warfarin metabolism, lowering plasma levels and INR."},
    {"question":"Metformin's primary mechanism of action is:","options":["Activation of AMPK → inhibits hepatic gluconeogenesis","Stimulation of pancreatic β-cell insulin secretion","Inhibition of α-glucosidase","Activation of PPAR-γ"],"topic":"Pharmacology","difficulty":"intermediate","explanation":"Metformin activates AMPK, inhibiting mitochondrial complex I and reducing hepatic glucose output."},
    {"question":"QT prolongation after starting an antibiotic is most likely caused by:","options":["Azithromycin — blocks hERG K⁺ channel","Amoxicillin — disrupts Na⁺/K⁺-ATPase","Doxycycline — inhibits cardiac Ca²⁺ channels","Metronidazole — activates β-adrenergic receptors"],"topic":"Pharmacology","difficulty":"hard","explanation":"Macrolides (azithromycin) block the hERG potassium channel, prolonging QT and risking torsades de pointes."},
    {"question":"Phenytoin exhibits zero-order kinetics at therapeutic levels because:","options":["CYP2C9 becomes saturated — small dose increase causes disproportionate plasma rise","It undergoes extensive first-pass metabolism","It is entirely renally excreted unchanged","It has very high plasma protein binding"],"topic":"Pharmacology","difficulty":"hard","explanation":"At therapeutic concentrations, hepatic CYP2C9 is saturated; metabolism becomes capacity-limited (zero-order)."},

    # ── PATHOLOGY ─────────────────────────────────────────────────────────────
    {"question":"Which type of necrosis is characteristic of tuberculosis?","options":["Caseous necrosis","Coagulative necrosis","Liquefactive necrosis","Fat necrosis"],"topic":"Pathology","difficulty":"beginner","explanation":"TB causes caseous (cheese-like) necrosis with granuloma formation."},
    {"question":"Reed-Sternberg cells are pathognomonic of which disease?","options":["Hodgkin lymphoma","Burkitt lymphoma","Multiple myeloma","CLL"],"topic":"Pathology","difficulty":"beginner","explanation":"Binucleated Reed-Sternberg cells (owl-eye nuclei) are the hallmark of Hodgkin lymphoma."},
    {"question":"A 55-year-old smoker has a central lung mass with squamous pearls. Elevated marker?","options":["SCC antigen / CK5/6","CEA","AFP","PSA"],"topic":"Pathology","difficulty":"intermediate","explanation":"Squamous cell carcinoma of the lung is centrally located and expresses SCC antigen and CK5/6."},
    {"question":"BRCA1 mutation predisposes to breast cancer by disrupting:","options":["Homologous recombination DNA repair","Mismatch repair","Nucleotide excision repair","Base excision repair"],"topic":"Pathology","difficulty":"intermediate","explanation":"BRCA1/2 proteins are essential for homologous recombination repair of double-strand DNA breaks."},
    {"question":"Renal biopsy shows 'wire-loop' lesions and subendothelial deposits on EM. Diagnosis?","options":["Diffuse proliferative lupus nephritis (Class IV)","Membranous nephropathy","IgA nephropathy","FSGS"],"topic":"Pathology","difficulty":"hard","explanation":"Wire-loop lesions (massive subendothelial immune deposits) are the hallmark of Class IV lupus nephritis."},
    {"question":"MSI-H colorectal cancer is characterized by:","options":["Loss of MMR proteins → better response to PD-1 inhibitors","APC mutation → Wnt pathway activation","KRAS mutation → poor response to anti-EGFR","CpG island methylation → BRAF V600E"],"topic":"Pathology","difficulty":"hard","explanation":"MSI-H tumors have defective MMR, accumulate frameshift neoantigens, and respond well to pembrolizumab."},

    # ── MICROBIOLOGY ──────────────────────────────────────────────────────────
    {"question":"Most common cause of urinary tract infections?","options":["E. coli","Klebsiella","S. saprophyticus","Pseudomonas"],"topic":"Microbiology","difficulty":"beginner","explanation":"E. coli accounts for ~80% of community-acquired UTIs via type 1 and P fimbriae."},
    {"question":"Gram-positive cocci in clusters that are coagulase-positive indicate:","options":["Staphylococcus aureus","S. epidermidis","Streptococcus pyogenes","Enterococcus"],"topic":"Microbiology","difficulty":"beginner","explanation":"S. aureus is uniquely coagulase-positive among staphylococci."},
    {"question":"A child develops watery diarrhea after reheated rice. Toxin?","options":["Bacillus cereus emetic toxin (cereulide) — pre-formed, heat-stable","C. difficile toxin A","ETEC LT toxin","Shiga toxin"],"topic":"Microbiology","difficulty":"intermediate","explanation":"B. cereus emetic syndrome: pre-formed cereulide in reheated rice causes rapid-onset vomiting/diarrhea."},
    {"question":"Mechanism of resistance in MRSA:","options":["mecA encodes PBP2a — altered PBP with low β-lactam affinity","β-lactamase destroys the β-lactam ring","Efflux pumps expel methicillin","Altered porin reduces drug entry"],"topic":"Microbiology","difficulty":"intermediate","explanation":"The mecA gene encodes PBP2a, which has low affinity for all β-lactams, conferring pan-β-lactam resistance."},
    {"question":"HIV viral load spikes after infection then falls. Best explanation:","options":["CD8+ cytotoxic T-cell response controls acute viremia","Neutralizing IgG clears free virus","NK cell lysis of infected cells","Interferon-α downregulates viral replication"],"topic":"Microbiology","difficulty":"hard","explanation":"The initial decline in HIV viremia correlates with the rise of HIV-specific CD8+ CTLs, not antibodies."},
    {"question":"Superantigens (e.g., TSST-1) cause massive T-cell activation by:","options":["Cross-linking MHC II with Vβ TCR — bypasses antigen-specific recognition","Activating TLR4 → IL-1β release","Binding CD28 as co-stimulatory signal","Inhibiting Tregs"],"topic":"Microbiology","difficulty":"hard","explanation":"Superantigens bind MHC II outside the peptide groove + TCR Vβ, activating 5–20% of T-cells non-specifically."},

    # ── BIOCHEMISTRY ──────────────────────────────────────────────────────────
    {"question":"Primary energy currency of the cell?","options":["ATP","NADH","GTP","FADH₂"],"topic":"Biochemistry","difficulty":"beginner","explanation":"ATP is the universal energy currency, releasing ~30.5 kJ/mol upon hydrolysis."},
    {"question":"Which vitamin deficiency causes scurvy?","options":["Vitamin C","Vitamin D","Vitamin B12","Vitamin K"],"topic":"Biochemistry","difficulty":"beginner","explanation":"Vitamin C is essential for hydroxylation of proline/lysine in collagen synthesis."},
    {"question":"Which urea cycle step occurs in the mitochondria?","options":["Carbamoyl phosphate synthesis (CPS-I) and citrulline formation","Argininosuccinate synthesis","Arginine cleavage by arginase","Fumarate release"],"topic":"Biochemistry","difficulty":"intermediate","explanation":"CPS-I and OTC (ornithine transcarbamoylase) occur in the mitochondrial matrix; remaining steps are cytosolic."},
    {"question":"Pyruvate kinase deficiency causes hemolytic anemia because RBCs cannot:","options":["Generate ATP via glycolysis to maintain Na⁺/K⁺-ATPase integrity","Produce NADPH for glutathione reduction","Oxidize glucose via PPP","Synthesize heme in reticulocytes"],"topic":"Biochemistry","difficulty":"intermediate","explanation":"RBCs rely entirely on anaerobic glycolysis for ATP. PK deficiency blocks the final step, causing osmotic lysis."},
    {"question":"Neonate with hyperammonemia, elevated citrulline, and argininosuccinate in urine has:","options":["Argininosuccinate lyase (ASL) deficiency","OTC deficiency","CPS-I deficiency","Arginase deficiency"],"topic":"Biochemistry","difficulty":"hard","explanation":"Elevated citrulline + argininosuccinate accumulation = ASL deficiency; ASL cleaves argininosuccinate to arginine + fumarate."},
    {"question":"Inhibition of Complex I (e.g., by rotenone) most directly decreases:","options":["NADH oxidation → reduced proton gradient → decreased ATP synthesis","FADH₂ oxidation","Cytochrome c reduction","Matrix ATP hydrolysis by F₁-ATPase"],"topic":"Biochemistry","difficulty":"hard","explanation":"Complex I transfers electrons from NADH to ubiquinone while pumping 4H⁺; inhibition collapses the proton gradient."},

    # ── CLINICAL MEDICINE ─────────────────────────────────────────────────────
    {"question":"Most common cause of community-acquired pneumonia?","options":["Streptococcus pneumoniae","Mycoplasma pneumoniae","Haemophilus influenzae","Legionella"],"topic":"Clinical Medicine","difficulty":"beginner","explanation":"S. pneumoniae is the leading cause of CAP across all age groups worldwide."},
    {"question":"Troponin I rises within how many hours of an acute MI?","options":["3–6 hours","12–24 hours","1–2 hours","24–48 hours"],"topic":"Clinical Medicine","difficulty":"beginner","explanation":"Cardiac troponin I begins rising 3–6 hours after myocardial injury, peaks at 24–48h."},
    {"question":"65-year-old with type 2 DM, BP 145/92. Best antihypertensive?","options":["Lisinopril — ACE inhibitor with renoprotective benefit","Amlodipine — CCB preferred in elderly","Metoprolol — masks hypoglycemia","Hydrochlorothiazide — worsens glycemic control"],"topic":"Clinical Medicine","difficulty":"intermediate","explanation":"ACE inhibitors reduce intraglomerular pressure and slow progression of diabetic nephropathy."},
    {"question":"Deep jaundice, pale stools, dark urine: expected LFT pattern?","options":["Cholestatic: elevated ALP and GGT >> AST/ALT","Hepatocellular: elevated AST/ALT >> ALP","Isolated unconjugated bilirubin elevation","Normal LFTs with elevated amylase"],"topic":"Clinical Medicine","difficulty":"intermediate","explanation":"Pale stools + dark urine = obstructive/cholestatic pattern — ALP and GGT predominate."},
    {"question":"72-year-old: confusion, BP 80/50, lactate 4.2 mmol/L after UTI. Next step?","options":["Septic shock — IV fluids 30 mL/kg + broad-spectrum antibiotics + vasopressors","Hypovolemic shock — oral rehydration only","Neurogenic shock — atropine and pacing","Anaphylactic shock — IM epinephrine"],"topic":"Clinical Medicine","difficulty":"hard","explanation":"Septic shock: 30 mL/kg IV crystalloid within 3h + antibiotics within 1h + norepinephrine if MAP <65."},
    {"question":"Anti-GBM disease (Goodpasture) targets which antigen?","options":["α3 chain of type IV collagen in GBM and alveolar BM","Desmoglein-3 in epidermal desmosomes","AChR at the neuromuscular junction","TSH receptor on thyroid follicular cells"],"topic":"Clinical Medicine","difficulty":"hard","explanation":"Autoantibodies against NC1 domain of α3(IV) collagen attack GBM and alveolar BM."},

    # ── SURGERY ───────────────────────────────────────────────────────────────
    {"question":"Rovsing's sign in appendicitis: palpation of the LLQ causes:","options":["RLQ pain","LLQ pain","Rebound tenderness","Guarding"],"topic":"Surgery","difficulty":"beginner","explanation":"LLQ pressure displaces bowel gas, increasing pressure at the inflamed appendix → RLQ pain."},
    {"question":"First step in managing tension pneumothorax?","options":["Needle decompression at 2nd ICS, MCL","CXR to confirm diagnosis","Intubation and positive pressure ventilation","Chest drain at 5th ICS, MAL"],"topic":"Surgery","difficulty":"beginner","explanation":"Tension pneumothorax is a clinical diagnosis — immediate needle decompression, don't wait for imaging."},
    {"question":"Post-Billroth II gastrectomy patient develops flushing and diarrhea 20 min after eating. Diagnosis?","options":["Early dumping syndrome — rapid gastric emptying causes fluid shift","Late dumping syndrome — reactive hypoglycemia","Afferent loop syndrome","Anastomotic leak"],"topic":"Surgery","difficulty":"intermediate","explanation":"Early dumping (15–30 min): hyperosmolar chyme → fluid shifts → intravascular depletion + vasoactive peptides."},
    {"question":"Trauma patient: FAST shows free fluid in Morrison's pouch, hemodynamically unstable. Next step?","options":["Emergent exploratory laparotomy","CT abdomen/pelvis with contrast","Diagnostic peritoneal lavage","IR embolization"],"topic":"Surgery","difficulty":"intermediate","explanation":"Hemodynamically unstable + FAST+ = immediate OR. CT is only for stable patients."},
    {"question":"3-week-old male: non-bilious projectile vomiting, olive mass, hypochloremic hypokalemic metabolic alkalosis. Management?","options":["IV fluid resuscitation to correct electrolytes → then Ramstedt pyloromyotomy","Immediate surgery — alkalosis irrelevant","NG tube and conservative management","PPI therapy for GERD"],"topic":"Surgery","difficulty":"hard","explanation":"Pyloric stenosis: correct electrolytes before surgery to prevent apnea under anesthesia."},
    {"question":"Which factor most strongly predicts anastomotic leak after colorectal surgery?","options":["Low rectal anastomosis (<5 cm from anal verge) — poor blood supply and high tension","Open vs laparoscopic approach","Surgeon experience","Stapler type"],"topic":"Surgery","difficulty":"hard","explanation":"Anastomotic leak risk is highest for low rectal anastomoses (<5 cm) due to reduced blood supply and pelvic tension."},
]

TOPICS    = ["Anatomy","Physiology","Pharmacology","Pathology","Microbiology","Biochemistry","Clinical Medicine","Surgery"]
LEVELS    = ["beginner","intermediate","hard"]
LABEL_MAP = {l: i for i, l in enumerate(LEVELS)}

# ══════════════════════════════════════════════════════════════════════════════
# 2. FEATURE EXTRACTION  (18 features per question)
# ══════════════════════════════════════════════════════════════════════════════

ADVANCED_TERMS = {
    "receptor","inhibitor","pathway","mechanism","cascade","phosphorylation",
    "transcription","translation","gene","protein","enzyme","substrate",
    "cofactor","allosteric","competitive","pharmacokinetics","pharmacodynamics",
    "bioavailability","half-life","cytochrome","metabolism","gluconeogenesis",
    "glycolysis","krebs","electron","oxidative","reductive","mitochondria",
    "membrane","voltage","action potential","depolarization","repolarization",
    "agonist","antagonist","efficacy","potency","sensitivity","specificity",
    "autoimmune","antibody","antigen","complement","cytokine","interleukin",
    "apoptosis","necrosis","metastasis","oncogene","tumor suppressor","mutation",
    "lymphoma","leukemia","carcinoma","sarcoma","hypertension","arrhythmia",
    "ischemia","infarction","sepsis","shock","acidosis","alkalosis","electrolyte",
    "nephron","glomerular","tubular","filtration","hepatic","cholestatic",
    "cirrhosis","anastomosis","resection","laparotomy","laparoscopy",
}
MECHANISM_WORDS = {"mechanism","pathway","inhibit","activate","block","stimulate",
                   "receptor","enzyme","transporter","channel","cascade","signal",
                   "mediated","dependent","regulated"}
DRUG_WORDS      = {"drug","medication","antibiotic","inhibitor","blocker","agonist",
                   "antagonist","dose","overdose","toxicity","side effect","adverse",
                   "contraindicated","interaction","-olol","-pril","-statin",
                   "-mycin","-cillin","-azole","-mab","-nib"}

def extract_features(q: dict) -> np.ndarray:
    qt   = q.get("question","").lower()
    opts = q.get("options",[])
    expl = q.get("explanation","").lower()
    topic = q.get("topic","")
    words = qt.split()

    f = [
        len(qt),                                                          # question_length
        len(words),                                                        # word_count
        np.mean([len(w) for w in words]) if words else 0,                 # avg_word_length
        np.mean([len(o) for o in opts]) if opts else 0,                   # option_avg_length
        len(expl),                                                         # explanation_length
        int(bool(re.search(r"\d+[- ]year[- ]old|presents? with|patient|history of", qt))),  # has_clinical
        sum(1 for t in ADVANCED_TERMS if t in qt or t in expl),           # num_medical_terms
        int(bool(re.search(r"\d+\.?\d*\s*(mg|ml|mmol|mmhg|bpm|iu|g|kg|%)", qt))),          # has_numbers
        int(any(w in qt for w in MECHANISM_WORDS)),                        # has_mechanism
        int(any(w in qt for w in DRUG_WORDS) or topic == "Pharmacology"), # has_drug
        *[int(topic == t) for t in TOPICS],                               # topic one-hot (8)
    ]
    return np.array(f, dtype=float)

FEATURE_NAMES = [
    "question_length","word_count","avg_word_length","option_avg_length",
    "explanation_length","has_clinical_vignette","num_medical_terms",
    "has_numbers","has_mechanism","has_drug",
    *[f"topic_{t.lower().replace(' ','_')}" for t in TOPICS],
]

# ══════════════════════════════════════════════════════════════════════════════
# 3. MODEL TRAINING
# ══════════════════════════════════════════════════════════════════════════════

def augment(X, y, factor=6, seed=42):
    rng = np.random.RandomState(seed)
    Xa, ya = [X], [y]
    for _ in range(factor):
        Xa.append(X + rng.normal(0, 0.05, X.shape) * X.std(axis=0))
        ya.append(y)
    return np.vstack(Xa), np.concatenate(ya)

def build_pipelines():
    return {
        "GradientBoosting": Pipeline([("sc", StandardScaler()),
            ("clf", GradientBoostingClassifier(n_estimators=200, max_depth=4,
                                               learning_rate=0.08, random_state=42))]),
        "RandomForest":     Pipeline([("sc", StandardScaler()),
            ("clf", RandomForestClassifier(n_estimators=300, max_depth=8,
                                           min_samples_leaf=2, class_weight="balanced",
                                           random_state=42))]),
        "SVM_RBF":          Pipeline([("sc", StandardScaler()),
            ("clf", SVC(kernel="rbf", C=5, gamma="scale", class_weight="balanced",
                        probability=True, random_state=42))]),
        "LogisticRegression": Pipeline([("sc", StandardScaler()),
            ("clf", LogisticRegression(C=1.0, max_iter=500,
                                       class_weight="balanced", random_state=42))]),
    }

def train_model(verbose=False):
    X_raw = np.array([extract_features(q) for q in QUESTION_BANK])
    y_raw = np.array([LABEL_MAP[q["difficulty"]] for q in QUESTION_BANK])
    X, y  = augment(X_raw, y_raw, factor=6)

    cv      = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    pipes   = build_pipelines()
    scores  = {}
    for name, pipe in pipes.items():
        s = cross_val_score(pipe, X, y, cv=cv, scoring="f1_macro")
        scores[name] = {"mean": round(float(s.mean()), 4), "std": round(float(s.std()), 4)}

    best_name = max(scores, key=lambda n: scores[n]["mean"])
    best_pipe = pipes[best_name]
    best_pipe.fit(X, y)

    # LOO validation on original data
    from sklearn.model_selection import LeaveOneOut
    y_loo = cross_val_predict(best_pipe, X_raw, y_raw, cv=LeaveOneOut())
    loo_f1 = round(float(f1_score(y_raw, y_loo, average="macro")), 4)

    dist = Counter(y_raw.tolist())
    meta = {
        "selected_model":         best_name,
        "cv_f1_macro":            scores[best_name]["mean"],
        "loo_f1_macro":           loo_f1,
        "n_original_questions":   int(len(X_raw)),
        "n_augmented_samples":    int(len(X)),
        "n_features":             int(X_raw.shape[1]),
        "label_distribution": {
            "beginner":     int(dist[0]),
            "intermediate": int(dist[1]),
            "hard":         int(dist[2]),
        },
        "all_model_scores":       scores,
        "feature_names":          FEATURE_NAMES,
    }
    if verbose:
        print(json.dumps({"training_report": meta}, indent=2))

    return best_pipe, meta

# ══════════════════════════════════════════════════════════════════════════════
# 4. PREDICTION HELPER
# ══════════════════════════════════════════════════════════════════════════════

def predict_difficulty(model, q: dict) -> dict:
    feats = extract_features(q).reshape(1, -1)
    idx   = model.predict(feats)[0]
    proba = model.predict_proba(feats)[0]
    return {
        "predicted_difficulty": LEVELS[idx],
        "confidence":           round(float(proba[idx]), 4),
        "probabilities": {
            "beginner":     round(float(proba[0]), 4),
            "intermediate": round(float(proba[1]), 4),
            "hard":         round(float(proba[2]), 4),
        },
    }

# ══════════════════════════════════════════════════════════════════════════════
# 5. ADAPTIVE QUIZ ENGINE
# ══════════════════════════════════════════════════════════════════════════════

def shuffle_options(q: dict) -> dict:
    opts    = q["options"].copy()
    correct = opts[0]           # index 0 is always correct in the bank
    random.shuffle(opts)
    return {**q, "options": opts, "correct_index": opts.index(correct)}

def adapt_level(current: str, recent: list) -> str:
    idx = LEVELS.index(current)
    if len(recent) >= 2:
        if all(recent[-2:]):      idx = min(idx + 1, 2)   # 2 correct → promote
        elif not any(recent[-2:]): idx = max(idx - 1, 0)  # 2 wrong   → demote
    return LEVELS[idx]

def run_quiz(model, level="beginner", topic=None, n_questions=5, adaptive=True) -> dict:
    pool = [q for q in QUESTION_BANK if (topic is None or q["topic"] == topic)]
    if not pool:
        return {"error": f"No questions found for topic '{topic}'"}

    current_level = level
    used_ids      = set()
    history       = []
    recent        = []

    for q_num in range(1, n_questions + 1):
        # Pick a question at current level; fall back if exhausted
        candidates = [q for q in pool if q["difficulty"] == current_level
                      and id(q) not in used_ids]
        if not candidates:
            candidates = [q for q in pool if id(q) not in used_ids]
        if not candidates:
            break

        raw_q = random.choice(candidates)
        used_ids.add(id(raw_q))

        q     = shuffle_options(raw_q)
        ml    = predict_difficulty(model, raw_q)

        # ── Print question to terminal for user input ─────────────────────
        print(f"\n{'─'*60}")
        print(f"Question {q_num}/{n_questions}  |  Level: {current_level.upper()}  |  Topic: {q['topic']}")
        print(f"ML prediction: {ml['predicted_difficulty']} "
              f"(B:{ml['probabilities']['beginner']:.2f} "
              f"I:{ml['probabilities']['intermediate']:.2f} "
              f"H:{ml['probabilities']['hard']:.2f})")
        print(f"\n{q['question']}\n")
        for i, opt in enumerate(q["options"]):
            print(f"  {chr(65+i)}. {opt}")

        # ── Get answer ────────────────────────────────────────────────────
        valid = [chr(65+i) for i in range(len(q["options"]))]
        while True:
            ans = input(f"\nYour answer ({'/'.join(valid)}): ").strip().upper()
            if ans in valid:
                break
            print(f"  Please enter one of: {', '.join(valid)}")

        chosen_idx  = ord(ans) - ord("A")
        is_correct  = (chosen_idx == q["correct_index"])
        correct_lbl = chr(65 + q["correct_index"])

        if is_correct:
            print(f"  ✔  Correct!")
        else:
            print(f"  ✘  Wrong. Correct answer: {correct_lbl}. {q['options'][q['correct_index']]}")
        print(f"  Explanation: {raw_q['explanation']}")

        # ── Record result ─────────────────────────────────────────────────
        history.append({
            "question_number":       q_num,
            "topic":                 q["topic"],
            "difficulty_label":      current_level,
            "ml_predicted":          ml["predicted_difficulty"],
            "ml_confidence":         ml["confidence"],
            "ml_probabilities":      ml["probabilities"],
            "question":              q["question"],
            "options":               q["options"],
            "correct_option":        correct_lbl,
            "user_answer":           ans,
            "is_correct":            is_correct,
        })

        recent.append(is_correct)
        if len(recent) > 3:
            recent.pop(0)

        # ── Adapt level ───────────────────────────────────────────────────
        if adaptive and q_num < n_questions:
            new_level = adapt_level(current_level, recent)
            if new_level != current_level:
                direction = "▲ Promoted" if LEVELS.index(new_level) > LEVELS.index(current_level) else "▼ Demoted"
                print(f"\n  {direction} to {new_level.upper()}")
                current_level = new_level

    # ── Build JSON result ─────────────────────────────────────────────────
    correct_total = sum(1 for h in history if h["is_correct"])
    total         = len(history)

    per_topic = {}
    for h in history:
        t = h["topic"]
        per_topic.setdefault(t, {"correct": 0, "total": 0})
        per_topic[t]["total"] += 1
        if h["is_correct"]: per_topic[t]["correct"] += 1

    per_level = {}
    for h in history:
        l = h["difficulty_label"]
        per_level.setdefault(l, {"correct": 0, "total": 0})
        per_level[l]["total"] += 1
        if h["is_correct"]: per_level[l]["correct"] += 1

    pct = round(correct_total / total * 100, 1) if total else 0
    if pct == 100:  verdict = "Perfect score"
    elif pct >= 80: verdict = "Excellent"
    elif pct >= 60: verdict = "Good"
    elif pct >= 40: verdict = "Needs improvement"
    else:           verdict = "Requires more study"

    return {
        "quiz_summary": {
            "score":             f"{correct_total}/{total}",
            "percentage":        pct,
            "verdict":           verdict,
            "starting_level":    level,
            "topic_filter":      topic,
            "adaptive_mode":     adaptive,
        },
        "performance_by_topic": per_topic,
        "performance_by_level": per_level,
        "question_history":     history,
    }

# ══════════════════════════════════════════════════════════════════════════════
# 6. CLI ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Medical Quiz ML Model — single file, JSON output"
    )
    parser.add_argument("--level",       choices=LEVELS, default=None,
                        help="Starting difficulty level")
    parser.add_argument("--topic",       default=None,
                        help=f"Topic filter: {', '.join(TOPICS)}")
    parser.add_argument("--questions",   type=int, default=5,
                        help="Number of questions (default: 5)")
    parser.add_argument("--no-adaptive", action="store_true",
                        help="Disable adaptive difficulty")
    parser.add_argument("--output",      default=None,
                        help="Save JSON result to this file path")
    parser.add_argument("--train-only",  action="store_true",
                        help="Train model and print stats as JSON, then exit")
    parser.add_argument("--predict",     action="store_true",
                        help="Interactively predict difficulty of a custom question")
    args = parser.parse_args()

    # ── Train ─────────────────────────────────────────────────────────────
    print("\nTraining ML difficulty classifier...", file=sys.stderr)
    model, meta = train_model(verbose=False)
    print("Model ready.\n", file=sys.stderr)

    # ── --train-only ──────────────────────────────────────────────────────
    if args.train_only:
        print(json.dumps({"training_report": meta}, indent=2))
        return

    # ── --predict ─────────────────────────────────────────────────────────
    if args.predict:
        print("Predict difficulty of a custom question")
        print(f"Available topics: {', '.join(TOPICS)}\n")
        topic_in = input("Topic: ").strip()
        question = input("Question: ").strip()
        options  = [input(f"Option {chr(65+i)}: ").strip() for i in range(4)]
        expl     = input("Explanation (optional): ").strip()
        result   = predict_difficulty(model, {
            "question": question, "options": options,
            "topic": topic_in, "explanation": expl
        })
        output = {"prediction": result, "input": {"topic": topic_in, "question": question}}
        print(json.dumps(output, indent=2))
        return

    # ── Level selection menu (if not passed via CLI) ───────────────────────
    level = args.level
    if not level:
        print("Select starting difficulty level:")
        for i, l in enumerate(LEVELS, 1):
            descs = {"beginner":"Core concepts, definitions",
                     "intermediate":"Clinical reasoning, mechanisms",
                     "hard":"USMLE Step 2/3, complex pathophysiology"}
            print(f"  {i}. {l.capitalize()} — {descs[l]}")
        while True:
            c = input("\nEnter 1 / 2 / 3: ").strip()
            if c in ("1","2","3"):
                level = LEVELS[int(c)-1]
                break

    # ── Run quiz ──────────────────────────────────────────────────────────
    result = run_quiz(
        model      = model,
        level      = level,
        topic      = args.topic,
        n_questions= args.questions,
        adaptive   = not args.no_adaptive,
    )

    # Attach model metadata to output
    result["model_info"] = meta

    # ── Print JSON ────────────────────────────────────────────────────────
    print("\n" + "═"*60)
    print("  JSON OUTPUT")
    print("═"*60)
    json_str = json.dumps(result, indent=2)
    print(json_str)

    # ── Optional file save ────────────────────────────────────────────────
    if args.output:
        with open(args.output, "w") as f:
            f.write(json_str)
        print(f"\n  Saved to: {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
