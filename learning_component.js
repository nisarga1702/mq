// This file is injected into index.html by patch_learning_v2.js
// It replaces the old Learning function

const LEARNING_TOPICS = [
  { id:'Anatomy',         icon:'🦴', color:'#38bdf8', desc:'Body structure, organs, spatial relationships' },
  { id:'Physiology',      icon:'⚡', color:'#34d399', desc:'How body systems function and interact' },
  { id:'Pharmacology',    icon:'💊', color:'#818cf8', desc:'Drug actions, mechanisms and side-effects' },
  { id:'Pathology',       icon:'🔬', color:'#f472b6', desc:'Disease mechanisms and tissue changes' },
  { id:'Microbiology',    icon:'🦠', color:'#fb923c', desc:'Bacteria, viruses, fungi and immunity' },
  { id:'Biochemistry',    icon:'🧪', color:'#fbbf24', desc:'Metabolic pathways and molecular biology' },
  { id:'Clinical Medicine',icon:'🩺',color:'#38bdf8', desc:'Diagnosis, management of common diseases' },
  { id:'Surgery',         icon:'🔪', color:'#f87171', desc:'Surgical principles and operative management' }
];

const TOPIC_THEORY = {
  Anatomy: {
    overview: "Anatomy is the foundation of all clinical medicine. Understanding the precise location, structure, and spatial relationships of organs enables accurate examination, imaging interpretation, and surgical planning.",
    sections: [
      { heading:'❤️ Cardiovascular', body:'The heart has 4 chambers. Right side = pulmonary circuit. Left side = systemic circuit. Valves (in order): Tricuspid → Pulmonic → Mitral → Aortic. Coronary arteries supply the myocardium — LAD is most commonly occluded in MI.' },
      { heading:'🧠 Neuroanatomy', body:'Cerebrum (frontal=motor/executive, temporal=memory/speech, parietal=sensory, occipital=vision). Circle of Willis anastomoses internal carotid + vertebrobasilar. Brachial plexus: C5–T1.' },
      { heading:'💪 Peripheral Nerves', body:'Radial nerve → wrist drop. Median nerve → ape hand (thenar wasting). Ulnar nerve → claw hand. Axillary nerve → deltoid palsy after shoulder dislocation.' }
    ],
    facts: ['Femur is longest bone', 'SA node is pacemaker at 60–100 bpm', 'Phrenic nerve C3,4,5 → diaphragm', 'Calot triangle contains cystic artery'],
    mnemonic: 'TPMA for heart valves: "Toilet Paper My Ass" — Tricuspid, Pulmonary, Mitral, Aortic\nC3,4,5 keeps the diaphragm alive!'
  },
  Physiology: {
    overview: "Physiology explains HOW the body works — normal values, compensatory mechanisms, and what fails in disease. Master cardiac, respiratory, and renal physiology for clinical success.",
    sections: [
      { heading:'❤️ Cardiac', body:'CO = HR × SV. Normal CO = 5 L/min. EF = SV/EDV × 100 (normal ≥55%). Frank-Starling: greater preload → greater stroke volume. HFrEF = EF <40%.' },
      { heading:'🫁 Respiratory', body:'Respiratory alkalosis = ↑ pH, ↓ PaCO₂ (hyperventilation). Respiratory acidosis = ↓ pH, ↑ PaCO₂ (hypoventilation). Metabolic acidosis → compensatory hyperventilation. ROME: Respiratory Opposite, Metabolic Equal.' },
      { heading:'🔬 Renal', body:'GFR = 120 mL/min. ADH → water retention (collecting duct). Aldosterone → Na⁺ retention, K⁺ excretion. RAAS: low BP → renin → Ang I → Ang II → aldosterone.' }
    ],
    facts: ['CO = HR × SV = 5 L/min normal', 'EF <40% = HFrEF (systolic failure)', 'K⁺ sets resting membrane potential', 'Thick ascending limb: impermeable to water'],
    mnemonic: 'ROME: Respiratory Opposite (pH↓, CO₂↑), Metabolic Equal (pH↓, HCO₃↓)\nADH = Antidiuretic (keeps water), Aldosterone = Na keeper, K loser'
  },
  Pharmacology: {
    overview: "Pharmacology is the study of drug mechanisms, interactions, and clinical use. High-yield: ACE inhibitors, beta-blockers, statins, antibiotics, anticoagulants.",
    sections: [
      { heading:'💊 Antihypertensives', body:'ACE inhibitors (-pril): 1st line in DM, block Ang I→II conversion, cause dry cough. ARBs (-sartan): same benefit, no cough. Beta-blockers (-olol): ↓HR, ↓BP, avoid in asthma. CCBs (amlodipine): vasodilation.' },
      { heading:'🩸 Anticoagulants', body:'Warfarin: inhibits Vit K epoxide reductase, INR monitored, reversed by Vit K. Heparin: activates antithrombin III, APTT monitored, reversed by protamine. DOACs (rivaroxaban, apixaban): factor Xa inhibitors.' },
      { heading:'🦠 Antibiotics', body:'Penicillins: β-lactam, inhibit cell wall synthesis. MRSA: mecA gene → PBP2a resistance → treat with vancomycin. Macrolides (azithromycin): block hERG K⁺ channel → QT prolongation. Rifampin: CYP450 inducer → ↓ warfarin effect.' }
    ],
    facts: ['ACEIs cause dry cough (bradykinin)', 'Aspirin: irreversible COX-1/2 inhibitor', 'Metformin: activates AMPK → ↓ gluconeogenesis', 'Phenytoin: zero-order kinetics at therapeutic levels'],
    mnemonic: 'For antibiotics MOA: "Cell Walls Please, No Fake Rocks" = Cell wall (β-lactams), Protein 30S (aminoglycosides), Protein 50S (macrolides), Nucleic acid (fluoroquinolones), Folate (sulfonamides), Ribosomes (tetracyclines)'
  },
  Pathology: {
    overview: "Pathology is the study of disease mechanisms at cellular and tissue level. Key areas: necrosis types, inflammation, neoplasia, and organ-specific pathology.",
    sections: [
      { heading:'💀 Necrosis Types', body:'Coagulative: ischemia (heart, kidney) — architecture preserved. Liquefactive: brain infarct, abscesses — cell dissolution. Caseous: TB — cheese-like, granulomas. Fat necrosis: pancreatitis — saponification. Fibrinoid: vasculitis.' },
      { heading:'🔴 Inflammation', body:'Acute: neutrophils, rapid onset. Chronic: lymphocytes/macrophages, granulomas. Granuloma = epithelioid macrophages + giant cells. Causes: TB, sarcoidosis, Crohn\'s, foreign body.' },
      { heading:'🧬 Neoplasia', body:'Reed-Sternberg cells = Hodgkin lymphoma. Wire-loop lesions = Class IV lupus nephritis. BRCA1/2 = homologous recombination defect. MSI-H colorectal cancer responds to PD-1 inhibitors (pembrolizumab).' }
    ],
    facts: ['TB → caseous necrosis', 'Reed-Sternberg cells → Hodgkin lymphoma', 'BRCA1/2 → HR repair defect', 'Wire-loop lesions → Lupus nephritis Class IV'],
    mnemonic: 'Necrosis types: "Can Liquids Cause Fat Fibrin?" = Coagulative, Liquefactive, Caseous, Fat, Fibrinoid'
  },
  Microbiology: {
    overview: "Microbiology covers bacteria, viruses, fungi, and parasites. Focus on gram stain, virulence factors, antibiotic resistance, and common clinical infections.",
    sections: [
      { heading:'🦠 Bacteria', body:'Gram +ve cocci clusters: S. aureus (coagulase +ve → virulent). MRSA: mecA gene → PBP2a → pan β-lactam resistance. E. coli: commonest UTI (80%), P & type 1 fimbriae. B. cereus: reheated rice → emetic toxin (cereulide).' },
      { heading:'🦠 Immunity & Viruses', body:'HIV: CD4+ T cell depletion → AIDS. Acute viremia controlled by CD8+ CTLs (not antibodies). Superantigens (TSST-1): cross-link MHC II + TCR Vβ → activate 5–20% T cells → cytokine storm.' },
      { heading:'💉 Resistance', body:'MRSA: mecA/PBP2a. ESBL: extended-spectrum β-lactamase (gram negatives). VRE: altered peptidoglycan (vanA/B). Treat MRSA: vancomycin or linezolid.' }
    ],
    facts: ['E. coli = #1 UTI cause', 'S. aureus = coagulase positive', 'MRSA = mecA gene → PBP2a', 'CD8+ CTLs control acute HIV viremia'],
    mnemonic: '"Staph A is COAGULASE positive, Staph E is EPIDERMIDIS (coagulase negative)"\nFor UTI bugs: "E. Klebsi-cola, Pseudo-Proteus" = E.coli, Klebsiella, Pseudomonas, Proteus'
  },
  Biochemistry: {
    overview: "Biochemistry covers metabolic pathways, enzymes, vitamins, and molecular biology. Key: glycolysis, TCA cycle, urea cycle, electron transport chain.",
    sections: [
      { heading:'⚡ Energy Metabolism', body:'Glycolysis: glucose → pyruvate (cytoplasm). TCA cycle: acetyl-CoA → CO₂ + NADH (mitochondria). ETC: NADH → Complex I → Ubiquinone → Complex III → Cyt c → Complex IV → O₂ → ATP. Rotenone inhibits Complex I.' },
      { heading:'🔄 Urea Cycle', body:'Steps in mitochondria: CPS-I (ammonia + CO₂ → carbamoyl phosphate), OTC (→ citrulline). Cytoplasm: ASS (→ argininosuccinate), ASL (→ arginine + fumarate), Arginase (→ urea + ornithine). OTC deficiency = most common.' },
      { heading:'🧬 Vitamins', body:'Vit C: collagen hydroxylation → scurvy if deficient. Vit B12 + folate: DNA synthesis, megaloblastic anemia. Vit K: γ-carboxylation of clotting factors II, VII, IX, X. Vit D: calcium absorption.' }
    ],
    facts: ['ATP = universal energy currency', 'Pyruvate kinase deficiency → hemolytic anemia (no ATP in RBCs)', 'OTC deficiency = most common urea cycle defect', 'Complex I = NADH dehydrogenase (rotenone inhibits)'],
    mnemonic: '"Nasty Nerves" for ETC order: NADH → Complex I → Q → Complex III → Cyt c → Complex IV → O₂\nUrea cycle: "Ordinarily Careless Crappers Are Also Frivolous About Urination" = Ornithine, Carbamoyl-P, Citrulline, Argininosuccinate, Arginine, Fumarate, Arginase, Urea'
  },
  'Clinical Medicine': {
    overview: "Clinical Medicine integrates pathophysiology with diagnosis and treatment. High-yield: sepsis, MI, pneumonia, DKA, stroke, and renal disease.",
    sections: [
      { heading:'🫀 Cardiac Emergencies', body:'STEMI: ST elevation → LAD most common → primary PCI <90 min. Troponin rises 3–6h, peaks 24–48h. Treat: aspirin 300mg + LMWH + PCI. Heart failure: ACEi/ARB + beta-blocker + diuretic.' },
      { heading:'🧠 Neurology', body:'Ischaemic stroke: tPA within 4.5h. NIHSS guides severity. AF → cardioembolic stroke → anticoagulate (CHA₂DS₂-VASc). DKA: ↑glucose + ketosis + metabolic acidosis → IV fluids FIRST, then insulin, monitor K⁺.' },
      { heading:'💉 Sepsis', body:'Sepsis = infection + organ dysfunction. Septic shock = sepsis + vasoplegic hypotension. Surviving Sepsis: IV 30mL/kg crystalloid + antibiotics within 1h + norepinephrine if MAP <65. Lactate >2 = tissue hypoperfusion.' }
    ],
    facts: ['S. pneumoniae = #1 CAP cause', 'Troponin rises 3–6h post-MI', 'tPA window for stroke = 4.5h', 'DKA: fluids before insulin'],
    mnemonic: '"FAST" for stroke: Face drooping, Arm weakness, Speech difficulty, Time to call 999\nDKA: "Kussmaul breathing is the body\'s last-ditch CO₂ blowoff attempt"'
  },
  Surgery: {
    overview: "Surgery covers acute abdomen, trauma, post-operative complications, and surgical emergencies. Focus on ATLS, Alvarado score, and dumping syndrome.",
    sections: [
      { heading:'🔪 Acute Abdomen', body:'Appendicitis: periumbilical → RIF pain, Rovsing\'s sign, Alvarado ≥7 → high probability. Treat: laparoscopic appendicectomy + IV antibiotics. Pyloric stenosis: non-bilious vomiting + olive mass + hypochloraemic alkalosis → correct electrolytes FIRST, then pyloromyotomy.' },
      { heading:'🩹 Trauma (ATLS)', body:'Primary survey: ABCDE. Tension pneumothorax: clinical diagnosis → needle decompression 2nd ICS MCL immediately (no CXR). FAST + haemodynamic instability → OR immediately, not CT. Haemorrhagic shock: massive transfusion 1:1:1 (RBC:FFP:platelets).' },
      { heading:'⚠️ Post-op Complications', body:'Early dumping (15–30 min): hyperosmolar chyme → fluid shift. Late dumping (1–3h): reactive hypoglycaemia. Anastomotic leak: risk highest <5cm from anal verge. Billroth II complications: afferent loop syndrome, blind loop.' }
    ],
    facts: ['Rovsing\'s sign: LLQ pressure → RLQ pain', 'Tension PTX: needle decompression immediately', 'Pyloric stenosis: correct electrolytes before surgery', 'Anastomotic leak highest risk <5cm from anal verge'],
    mnemonic: '"AMPLE" for surgical history: Allergies, Medications, Past history, Last meal, Events\n"4 H\'s and 4 T\'s" for cardiac arrest: Hypoxia, Hypovolaemia, Hypo/hyperkalaemia, Hypothermia + Tension PTX, Tamponade, Toxins, Thrombosis'
  }
};
