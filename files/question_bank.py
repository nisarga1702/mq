"""
question_bank.py
────────────────
Large labelled question bank used to train / evaluate the ML difficulty classifier.
Each entry has:
  - question  : str
  - options   : list[str]  (4 options, index 0 = correct)
  - topic     : str
  - difficulty: str  ("beginner" | "intermediate" | "hard")
  - explanation: str
"""

QUESTION_BANK = [

    # ─── ANATOMY ───────────────────────────────────────────────────────────────
    {
        "question": "Which bone is the longest in the human body?",
        "options": ["Femur", "Tibia", "Humerus", "Fibula"],
        "topic": "Anatomy", "difficulty": "beginner",
        "explanation": "The femur (thigh bone) is the longest and strongest bone in the human body."
    },
    {
        "question": "How many chambers does the human heart have?",
        "options": ["4", "2", "3", "6"],
        "topic": "Anatomy", "difficulty": "beginner",
        "explanation": "The human heart has 4 chambers: right atrium, right ventricle, left atrium, left ventricle."
    },
    {
        "question": "Which organ is responsible for producing bile?",
        "options": ["Liver", "Pancreas", "Gallbladder", "Spleen"],
        "topic": "Anatomy", "difficulty": "beginner",
        "explanation": "Bile is produced by the liver and stored in the gallbladder."
    },
    {
        "question": "The brachial plexus originates from which spinal levels?",
        "options": ["C5–T1", "C1–C5", "T1–T5", "C3–C8"],
        "topic": "Anatomy", "difficulty": "intermediate",
        "explanation": "The brachial plexus arises from the ventral rami of spinal nerves C5 through T1."
    },
    {
        "question": "Which structure passes through the foramen ovale of the skull base?",
        "options": ["V3 (mandibular nerve)", "V2 (maxillary nerve)", "CN VII", "CN IX"],
        "topic": "Anatomy", "difficulty": "intermediate",
        "explanation": "The mandibular division of the trigeminal nerve (V3) passes through the foramen ovale."
    },
    {
        "question": "The Triangle of Calot is bounded by which structures?",
        "options": [
            "Cystic duct, common hepatic duct, inferior surface of liver",
            "Portal vein, hepatic artery, bile duct",
            "Cystic artery, common bile duct, duodenum",
            "Liver, gallbladder, hepatic vein"
        ],
        "topic": "Anatomy", "difficulty": "hard",
        "explanation": "Calot's triangle is bounded by the cystic duct inferiorly, common hepatic duct medially, and liver superiorly. The cystic artery runs within it."
    },
    {
        "question": "A lesion at the lateral sulcus (Sylvian fissure) most likely damages which cortical area?",
        "options": [
            "Primary auditory cortex (Heschl's gyri)",
            "Primary motor cortex",
            "Primary visual cortex",
            "Somatosensory cortex"
        ],
        "topic": "Anatomy", "difficulty": "hard",
        "explanation": "The primary auditory cortex (Heschl's transverse gyri, BA 41/42) lies within the lateral sulcus on the superior temporal plane."
    },

    # ─── PHYSIOLOGY ────────────────────────────────────────────────────────────
    {
        "question": "What is the normal resting heart rate for adults?",
        "options": ["60–100 bpm", "40–60 bpm", "100–120 bpm", "50–70 bpm"],
        "topic": "Physiology", "difficulty": "beginner",
        "explanation": "Normal adult resting heart rate is 60–100 beats per minute."
    },
    {
        "question": "Which ion is primarily responsible for the resting membrane potential?",
        "options": ["Potassium (K⁺)", "Sodium (Na⁺)", "Chloride (Cl⁻)", "Calcium (Ca²⁺)"],
        "topic": "Physiology", "difficulty": "beginner",
        "explanation": "K⁺ drives the resting membrane potential (≈ −70 mV) because the membrane is most permeable to K⁺ at rest."
    },
    {
        "question": "Which segment of the nephron is impermeable to water but actively reabsorbs NaCl?",
        "options": [
            "Thick ascending limb of Henle",
            "Proximal convoluted tubule",
            "Collecting duct",
            "Thin descending limb of Henle"
        ],
        "topic": "Physiology", "difficulty": "intermediate",
        "explanation": "The thick ascending limb is the 'diluting segment' — impermeable to water but reabsorbs NaCl via the NKCC2 cotransporter."
    },
    {
        "question": "In the Frank-Starling mechanism, increased preload leads to:",
        "options": [
            "Increased stroke volume due to greater myofilament overlap",
            "Decreased stroke volume due to overstretching",
            "Increased heart rate via baroreceptors",
            "Decreased end-diastolic volume"
        ],
        "topic": "Physiology", "difficulty": "intermediate",
        "explanation": "Greater preload stretches sarcomeres toward optimal overlap, increasing cross-bridge formation and stroke volume."
    },
    {
        "question": "A patient with a PaO₂ of 55 mmHg, PaCO₂ of 30 mmHg, and pH 7.50 most likely has:",
        "options": [
            "Respiratory alkalosis with hypoxemia (e.g., PE or high-altitude)",
            "Metabolic alkalosis with hypoxemia",
            "Respiratory acidosis",
            "Mixed metabolic and respiratory acidosis"
        ],
        "topic": "Physiology", "difficulty": "hard",
        "explanation": "Low PaCO₂ with high pH = primary respiratory alkalosis; low PaO₂ suggests hypoxemia-driven hyperventilation, classic for pulmonary embolism or high altitude."
    },
    {
        "question": "Which Starling force is the PRIMARY driver of fluid reabsorption from interstitium into capillaries?",
        "options": [
            "Plasma oncotic pressure (πc)",
            "Capillary hydrostatic pressure (Pc)",
            "Interstitial hydrostatic pressure (Pi)",
            "Interstitial oncotic pressure (πi)"
        ],
        "topic": "Physiology", "difficulty": "hard",
        "explanation": "Plasma oncotic pressure (mainly albumin) draws fluid back into capillaries, opposing hydrostatic filtration."
    },

    # ─── PHARMACOLOGY ──────────────────────────────────────────────────────────
    {
        "question": "Which drug class is used as the first-line treatment for hypertension in diabetic patients?",
        "options": ["ACE inhibitors", "Beta-blockers", "Calcium channel blockers", "Diuretics"],
        "topic": "Pharmacology", "difficulty": "beginner",
        "explanation": "ACE inhibitors (e.g., lisinopril) are first-line for hypertensive diabetics because they also protect against diabetic nephropathy."
    },
    {
        "question": "Aspirin irreversibly inhibits which enzyme?",
        "options": ["COX-1 and COX-2", "LOX", "PLA₂", "Thrombin"],
        "topic": "Pharmacology", "difficulty": "beginner",
        "explanation": "Aspirin irreversibly acetylates and inhibits both COX-1 and COX-2, blocking thromboxane A₂ and prostaglandin synthesis."
    },
    {
        "question": "A patient on warfarin starts rifampin for TB. Expected effect on INR?",
        "options": [
            "INR decreases — rifampin induces CYP2C9, increasing warfarin metabolism",
            "INR increases — rifampin inhibits warfarin clearance",
            "No change — rifampin does not interact with warfarin",
            "INR increases — rifampin displaces warfarin from albumin"
        ],
        "topic": "Pharmacology", "difficulty": "intermediate",
        "explanation": "Rifampin is a potent CYP450 inducer (CYP2C9, 3A4), accelerating warfarin metabolism and lowering plasma levels → decreased INR."
    },
    {
        "question": "Metformin's primary mechanism of action is:",
        "options": [
            "Activation of AMPK → inhibits hepatic gluconeogenesis",
            "Stimulation of pancreatic β-cell insulin secretion",
            "Inhibition of α-glucosidase in the intestine",
            "Activation of PPAR-γ to improve insulin sensitivity"
        ],
        "topic": "Pharmacology", "difficulty": "intermediate",
        "explanation": "Metformin activates AMPK, which inhibits mitochondrial complex I and reduces hepatic glucose output via suppression of gluconeogenesis."
    },
    {
        "question": "A patient develops QT prolongation after starting a new antibiotic. Which is most likely responsible?",
        "options": [
            "Azithromycin — blocks hERG K⁺ channel",
            "Amoxicillin — disrupts Na⁺/K⁺-ATPase",
            "Doxycycline — inhibits cardiac Ca²⁺ channels",
            "Metronidazole — activates β-adrenergic receptors"
        ],
        "topic": "Pharmacology", "difficulty": "hard",
        "explanation": "Macrolides (azithromycin) block the hERG potassium channel, delaying cardiac repolarization and prolonging the QT interval, risking torsades de pointes."
    },
    {
        "question": "Phenytoin exhibits zero-order kinetics at therapeutic levels because:",
        "options": [
            "CYP2C9 becomes saturated, so a small dose increase causes disproportionate rise in plasma levels",
            "It undergoes extensive first-pass metabolism",
            "It is entirely renally excreted unchanged",
            "It has very high plasma protein binding"
        ],
        "topic": "Pharmacology", "difficulty": "hard",
        "explanation": "At therapeutic concentrations, hepatic CYP2C9 is saturated; metabolism becomes capacity-limited (zero-order), making dose titration dangerous."
    },

    # ─── PATHOLOGY ─────────────────────────────────────────────────────────────
    {
        "question": "Which type of necrosis is characteristic of tuberculosis?",
        "options": ["Caseous necrosis", "Coagulative necrosis", "Liquefactive necrosis", "Fat necrosis"],
        "topic": "Pathology", "difficulty": "beginner",
        "explanation": "TB causes caseous (cheese-like) necrosis with granuloma formation due to the lipid-rich mycobacterial wall."
    },
    {
        "question": "Reed-Sternberg cells are pathognomonic of which disease?",
        "options": ["Hodgkin lymphoma", "Burkitt lymphoma", "Multiple myeloma", "CLL"],
        "topic": "Pathology", "difficulty": "beginner",
        "explanation": "Binucleated Reed-Sternberg cells (owl-eye nuclei) are the hallmark of Hodgkin lymphoma."
    },
    {
        "question": "A 55-year-old smoker has a central lung mass with squamous pearls on biopsy. Which marker is elevated?",
        "options": ["SCC antigen / CK5/6", "CEA", "AFP", "PSA"],
        "topic": "Pathology", "difficulty": "intermediate",
        "explanation": "Squamous cell carcinoma of the lung is centrally located, strongly associated with smoking, and expresses SCC antigen and CK5/6."
    },
    {
        "question": "BRCA1 mutation predisposes to breast cancer primarily by disrupting:",
        "options": [
            "Homologous recombination DNA repair",
            "Mismatch repair",
            "Nucleotide excision repair",
            "Base excision repair"
        ],
        "topic": "Pathology", "difficulty": "intermediate",
        "explanation": "BRCA1/2 proteins are essential for homologous recombination repair of double-strand DNA breaks; loss leads to genomic instability."
    },
    {
        "question": "A renal biopsy shows 'wire-loop' lesions on light microscopy and subendothelial deposits on EM. Diagnosis?",
        "options": [
            "Diffuse proliferative lupus nephritis (Class IV)",
            "Membranous nephropathy",
            "IgA nephropathy",
            "Focal segmental glomerulosclerosis"
        ],
        "topic": "Pathology", "difficulty": "hard",
        "explanation": "Wire-loop lesions (massive subendothelial immune deposits) are the hallmark of Class IV lupus nephritis, the most severe form."
    },
    {
        "question": "Microsatellite instability (MSI-H) colorectal cancer is characterized by:",
        "options": [
            "Loss of mismatch repair (MMR) proteins → better response to PD-1 inhibitors",
            "APC mutation → Wnt pathway activation",
            "KRAS mutation → poor response to anti-EGFR therapy",
            "CpG island methylation → BRAF V600E mutation"
        ],
        "topic": "Pathology", "difficulty": "hard",
        "explanation": "MSI-H tumors have defective MMR (MLH1, MSH2, etc.), accumulate frameshift neoantigens, and respond well to pembrolizumab (anti-PD-1)."
    },

    # ─── MICROBIOLOGY ──────────────────────────────────────────────────────────
    {
        "question": "Which bacteria is the most common cause of urinary tract infections?",
        "options": ["E. coli", "Klebsiella", "Staphylococcus saprophyticus", "Pseudomonas"],
        "topic": "Microbiology", "difficulty": "beginner",
        "explanation": "E. coli accounts for ~80% of community-acquired UTIs due to its type 1 and P fimbriae."
    },
    {
        "question": "Gram-positive cocci in clusters that are coagulase-positive indicate:",
        "options": ["Staphylococcus aureus", "S. epidermidis", "Streptococcus pyogenes", "Enterococcus"],
        "topic": "Microbiology", "difficulty": "beginner",
        "explanation": "S. aureus is uniquely coagulase-positive among staphylococci, allowing it to clot plasma and evade phagocytosis."
    },
    {
        "question": "A child develops profuse watery diarrhea after eating rice. Toxin involved?",
        "options": [
            "Bacillus cereus emetic toxin (cereulide) — pre-formed, heat-stable",
            "C. difficile toxin A",
            "ETEC LT toxin",
            "Shiga toxin"
        ],
        "topic": "Microbiology", "difficulty": "intermediate",
        "explanation": "Bacillus cereus causes two syndromes: an emetic (vomiting) form from reheated rice (pre-formed cereulide) and a diarrheal form from enterotoxins."
    },
    {
        "question": "Mechanism of resistance in MRSA:",
        "options": [
            "mecA gene encodes PBP2a — altered penicillin-binding protein with low β-lactam affinity",
            "β-lactamase destroys the β-lactam ring",
            "Efflux pumps expel methicillin",
            "Altered porin reduces drug entry"
        ],
        "topic": "Microbiology", "difficulty": "intermediate",
        "explanation": "The mecA gene (SCC mec element) encodes PBP2a, which has low affinity for all β-lactams, rendering MRSA resistant to the entire class."
    },
    {
        "question": "HIV viral load spikes shortly after infection then falls. This is best explained by:",
        "options": [
            "CD8+ cytotoxic T-cell response controlling acute viremia",
            "Neutralizing antibody (IgG) clearing free virus",
            "NK cell-mediated lysis of infected cells",
            "Interferon-α downregulating viral replication"
        ],
        "topic": "Microbiology", "difficulty": "hard",
        "explanation": "The initial decline in HIV viremia correlates with the rise of HIV-specific CD8+ CTLs, not antibodies (which appear later and are largely non-neutralizing)."
    },
    {
        "question": "Superantigens (e.g., TSST-1) cause massive T-cell activation by:",
        "options": [
            "Cross-linking MHC II on APC with Vβ region of TCR, bypassing antigen-specific recognition",
            "Activating TLR4 on macrophages to release IL-1β",
            "Binding CD28 on T-cells as a co-stimulatory signal",
            "Inhibiting regulatory T-cells (Tregs)"
        ],
        "topic": "Microbiology", "difficulty": "hard",
        "explanation": "Superantigens simultaneously bind MHC II (outside peptide groove) and TCR Vβ domains, non-specifically activating 5–20% of all T-cells and causing cytokine storm."
    },

    # ─── BIOCHEMISTRY ──────────────────────────────────────────────────────────
    {
        "question": "Which molecule is the primary energy currency of the cell?",
        "options": ["ATP", "NADH", "GTP", "FADH₂"],
        "topic": "Biochemistry", "difficulty": "beginner",
        "explanation": "ATP (adenosine triphosphate) is the universal energy currency, releasing ~30.5 kJ/mol upon hydrolysis."
    },
    {
        "question": "Which vitamin deficiency causes scurvy?",
        "options": ["Vitamin C", "Vitamin D", "Vitamin B12", "Vitamin K"],
        "topic": "Biochemistry", "difficulty": "beginner",
        "explanation": "Vitamin C (ascorbic acid) is essential for proline/lysine hydroxylation in collagen synthesis; deficiency causes scurvy."
    },
    {
        "question": "In the urea cycle, which step occurs in the mitochondria?",
        "options": [
            "Carbamoyl phosphate synthesis (CPS-I) and citrulline formation",
            "Argininosuccinate synthesis",
            "Arginine cleavage by arginase",
            "Fumarate release"
        ],
        "topic": "Biochemistry", "difficulty": "intermediate",
        "explanation": "The first two steps (CPS-I and ornithine transcarbamoylase) occur in the mitochondrial matrix; remaining steps are cytosolic."
    },
    {
        "question": "Pyruvate kinase deficiency causes hemolytic anemia because RBCs cannot:",
        "options": [
            "Generate ATP via glycolysis to maintain Na⁺/K⁺-ATPase and RBC integrity",
            "Produce NADPH for glutathione reduction",
            "Oxidize glucose via the pentose phosphate pathway",
            "Synthesize heme in reticulocytes"
        ],
        "topic": "Biochemistry", "difficulty": "intermediate",
        "explanation": "RBCs rely entirely on anaerobic glycolysis for ATP. PK deficiency blocks the final glycolytic step, depleting ATP and causing osmotic lysis."
    },
    {
        "question": "A neonate with hyperammonemia, elevated citrulline, and argininosuccinate in urine has a deficiency of:",
        "options": [
            "Argininosuccinate lyase (ASL)",
            "OTC (ornithine transcarbamoylase)",
            "CPS-I",
            "Arginase"
        ],
        "topic": "Biochemistry", "difficulty": "hard",
        "explanation": "Elevated citrulline + argininosuccinate accumulation points to ASL deficiency; ASL cleaves argininosuccinate to arginine + fumarate."
    },
    {
        "question": "Inhibition of Complex I of the electron transport chain (e.g., by rotenone) would most directly decrease:",
        "options": [
            "NADH oxidation → reduced proton gradient → decreased ATP synthesis",
            "FADH₂ oxidation",
            "Cytochrome c reduction",
            "Matrix ATP hydrolysis by F₁-ATPase"
        ],
        "topic": "Biochemistry", "difficulty": "hard",
        "explanation": "Complex I (NADH dehydrogenase) transfers electrons from NADH to ubiquinone while pumping 4H⁺; its inhibition collapses the proton gradient needed for ATP synthase."
    },

    # ─── CLINICAL MEDICINE ─────────────────────────────────────────────────────
    {
        "question": "What is the most common cause of community-acquired pneumonia?",
        "options": ["Streptococcus pneumoniae", "Mycoplasma pneumoniae", "Haemophilus influenzae", "Legionella"],
        "topic": "Clinical Medicine", "difficulty": "beginner",
        "explanation": "S. pneumoniae is the leading cause of CAP across all age groups worldwide."
    },
    {
        "question": "Troponin I rises within how many hours of an acute MI?",
        "options": ["3–6 hours", "12–24 hours", "1–2 hours", "24–48 hours"],
        "topic": "Clinical Medicine", "difficulty": "beginner",
        "explanation": "Cardiac troponin I begins rising 3–6 hours after myocardial injury, peaks at 24–48h, and remains elevated for up to 10–14 days."
    },
    {
        "question": "A 65-year-old with type 2 DM has a BP of 145/92. Best first-line antihypertensive?",
        "options": [
            "Lisinopril — ACE inhibitor with renoprotective benefit",
            "Amlodipine — CCB preferred in elderly",
            "Metoprolol — beta-blocker masks hypoglycemia",
            "Hydrochlorothiazide — worsens glycemic control"
        ],
        "topic": "Clinical Medicine", "difficulty": "intermediate",
        "explanation": "ACE inhibitors reduce intraglomerular pressure and slow progression of diabetic nephropathy, making them first-choice in diabetic hypertensives."
    },
    {
        "question": "A patient with deep jaundice, pale stools, and dark urine has which pattern of LFTs?",
        "options": [
            "Cholestatic: elevated ALP and GGT >> AST/ALT",
            "Hepatocellular: elevated AST/ALT >> ALP",
            "Isolated unconjugated bilirubin elevation",
            "Normal LFTs with elevated amylase"
        ],
        "topic": "Clinical Medicine", "difficulty": "intermediate",
        "explanation": "Pale stools (no urobilinogen) + dark urine (conjugated bilirubin) = obstructive/cholestatic pattern — ALP and GGT predominate."
    },
    {
        "question": "A 72-year-old presents with confusion, BP 80/50, lactate 4.2 mmol/L after a UTI. Diagnosis and next step?",
        "options": [
            "Septic shock — immediate IV fluids (30 mL/kg crystalloid) + broad-spectrum antibiotics + vasopressors if needed",
            "Hypovolemic shock — oral rehydration only",
            "Neurogenic shock — atropine and pacing",
            "Anaphylactic shock — IM epinephrine"
        ],
        "topic": "Clinical Medicine", "difficulty": "hard",
        "explanation": "Septic shock = sepsis + vasoplegic hypotension refractory to fluids. Surviving Sepsis guidelines: 30 mL/kg IV crystalloid within 3h + antibiotics within 1h + norepinephrine if MAP <65."
    },
    {
        "question": "Anti-GBM disease (Goodpasture syndrome) targets which antigen?",
        "options": [
            "α3 chain of type IV collagen in glomerular and alveolar basement membranes",
            "Desmoglein-3 in epidermal desmosomes",
            "AChR at the neuromuscular junction",
            "TSH receptor on thyroid follicular cells"
        ],
        "topic": "Clinical Medicine", "difficulty": "hard",
        "explanation": "Autoantibodies against the NC1 domain of α3(IV) collagen attack GBM and alveolar BM, causing crescentic glomerulonephritis and pulmonary hemorrhage."
    },

    # ─── SURGERY ───────────────────────────────────────────────────────────────
    {
        "question": "Which sign is positive in acute appendicitis when palpation of the LLQ causes RLQ pain?",
        "options": ["Rovsing's sign", "Psoas sign", "Obturator sign", "McBurney's point tenderness"],
        "topic": "Surgery", "difficulty": "beginner",
        "explanation": "Rovsing's sign: LLQ pressure displaces bowel gas, increasing pressure at inflamed appendix → RLQ pain."
    },
    {
        "question": "First step in managing a tension pneumothorax?",
        "options": [
            "Needle decompression at 2nd ICS, MCL",
            "CXR to confirm diagnosis",
            "Intubation and positive pressure ventilation",
            "Chest drain insertion at 5th ICS, MAL"
        ],
        "topic": "Surgery", "difficulty": "beginner",
        "explanation": "Tension pneumothorax is a clinical diagnosis requiring immediate needle decompression — don't wait for imaging."
    },
    {
        "question": "A patient post-Billroth II gastrectomy develops flushing, palpitations, and diarrhea 20 min after eating. Diagnosis?",
        "options": [
            "Early dumping syndrome — rapid gastric emptying causes fluid shift into bowel",
            "Late dumping syndrome — reactive hypoglycemia",
            "Afferent loop syndrome",
            "Anastomotic leak"
        ],
        "topic": "Surgery", "difficulty": "intermediate",
        "explanation": "Early dumping (15–30 min): hyperosmolar chyme → fluid shifts → intravascular depletion + vasoactive peptide release → vasomotor + GI symptoms."
    },
    {
        "question": "In a trauma patient, FAST exam shows free fluid in Morrison's pouch. Patient is hemodynamically unstable. Next step?",
        "options": [
            "Emergent exploratory laparotomy — no time for CT",
            "CT abdomen/pelvis with contrast",
            "Diagnostic peritoneal lavage",
            "Interventional radiology embolization"
        ],
        "topic": "Surgery", "difficulty": "intermediate",
        "explanation": "Hemodynamically unstable + FAST+ = immediate OR. CT is only for stable patients. DPL is rarely used now."
    },
    {
        "question": "A 3-week-old male presents with non-bilious projectile vomiting. Palpable olive mass in epigastrium. Electrolytes show hypochloremic hypokalemic metabolic alkalosis. Management?",
        "options": [
            "IV fluid resuscitation to correct electrolytes → then Ramstedt pyloromyotomy",
            "Immediate surgery — alkalosis is irrelevant",
            "NG tube decompression and conservative management",
            "Proton pump inhibitor therapy for GERD"
        ],
        "topic": "Surgery", "difficulty": "hard",
        "explanation": "Pyloric stenosis causes HCl loss via vomiting → hypochloremic metabolic alkalosis. Surgery (pyloromyotomy) is definitive but must be deferred until electrolytes are corrected to prevent apnea under anesthesia."
    },
    {
        "question": "Which factor most strongly predicts anastomotic leak risk after colorectal surgery?",
        "options": [
            "Low rectal anastomosis (<5 cm from anal verge) — poor blood supply and high tension",
            "Open vs laparoscopic approach",
            "Surgeon experience",
            "Type of stapler used"
        ],
        "topic": "Surgery", "difficulty": "hard",
        "explanation": "Anastomotic leak risk increases significantly for low rectal anastomoses (<5 cm) due to reduced blood supply, pelvic tension, and proximity to contamination."
    },
]
