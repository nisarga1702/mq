const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const a = h.indexOf('function Learning');
const b = h.indexOf('/* ==================== NOTIFICATION', a);

const NEW = `function Learning({ user, updateUser }) {
  const [mode, setMode] = React.useState('menu');
  const [activeTopic, setActiveTopic] = React.useState(null);
  const [quizQs, setQuizQs] = React.useState([]);
  const [quizIdx, setQuizIdx] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [revealed, setRevealed] = React.useState(false);
  const [quizResults, setQuizResults] = React.useState([]);
  const [loadingQs, setLoadingQs] = React.useState(false);
  const ML = 'http://localhost:5001';

  const TOPICS = [
    {id:'Anatomy',        icon:'🦴', color:'#38bdf8', desc:'Body structure and organ relationships'},
    {id:'Physiology',     icon:'⚡', color:'#34d399', desc:'How body systems function'},
    {id:'Pharmacology',   icon:'💊', color:'#818cf8', desc:'Drug mechanisms and clinical use'},
    {id:'Pathology',      icon:'🔬', color:'#f472b6', desc:'Disease at cellular and tissue level'},
    {id:'Microbiology',   icon:'🦠', color:'#fb923c', desc:'Bacteria, viruses and immunity'},
    {id:'Biochemistry',   icon:'🧪', color:'#fbbf24', desc:'Metabolic pathways and enzymes'},
    {id:'Clinical Medicine',icon:'🩺',color:'#38bdf8', desc:'Diagnosis and disease management'},
    {id:'Surgery',        icon:'🔪', color:'#f87171', desc:'Surgical emergencies and technique'}
  ];

  const THEORY = {
    'Anatomy':          { overview:'Anatomy is the foundation of all clinical medicine. Understand precise organ locations, spatial relationships, and nerve supplies.',          facts:['Femur is the longest bone','SA node: 60-100 bpm pacemaker','Phrenic nerve C3,4,5 → diaphragm','Radial nerve injury = wrist drop','Mitral valve = left side (LA→LV)'],          mnemonic:'TPMA valve order: Toilet Paper My Ass → Tricuspid, Pulmonary, Mitral, Aortic\nC3, 4, 5 keeps the diaphragm alive!' },
    'Physiology':       { overview:'Physiology explains HOW the body works. Master cardiac output, acid-base, and renal regulation for clinical reasoning.',                     facts:['CO = HR x SV = 5 L/min normal','EF <40% = HFrEF (systolic failure)','K+ sets resting membrane potential','ADH → water retention (collecting duct)','GFR = 120 mL/min normally'],          mnemonic:'ROME: Respiratory Opposite (pH↓, CO2↑), Metabolic Equal (pH↓, HCO3↓)\nFrank-Starling: more stretch = more force (up to a point)' },
    'Pharmacology':     { overview:'Pharmacology covers drug mechanisms, interactions, and clinical prescribing. Focus on mechanisms and key side effects.',                      facts:['ACEIs (-pril): dry cough side effect','Aspirin: irreversible COX-1 and COX-2 inhibitor','Metformin: activates AMPK → ↓ gluconeogenesis','Rifampin: CYP450 inducer → ↓ warfarin effect','Azithromycin: blocks hERG → QT prolongation'],mnemonic:'ACE inhibitors end in -pril. ARBs end in -sartan. Beta-blockers end in -olol.\n"Some Drugs Create Awesome Pharmacology": Sulfonamides, Diuretics, CCBs, ACEIs, Penicillins' },
    'Pathology':        { overview:'Pathology is the study of disease mechanisms at tissue and cellular level. Key areas: necrosis, inflammation, neoplasia.',                     facts:['TB → caseous necrosis','Reed-Sternberg cells → Hodgkin lymphoma','BRCA1/2 = homologous recombination defect','Wire-loop lesions = Lupus nephritis Class IV','MSI-H colorectal cancer responds to pembrolizumab'], mnemonic:'Necrosis mnemonics: Can Liquids Cause Fat Fibrin? = Coagulative, Liquefactive, Caseous, Fat, Fibrinoid' },
    'Microbiology':     { overview:'Microbiology covers pathogens, virulence factors, resistance mechanisms and their clinical presentations.',                                    facts:['E. coli = #1 UTI cause (80%)','S. aureus = coagulase positive','MRSA: mecA gene → PBP2a → pan β-lactam resistance','CD8+ CTLs control acute HIV viremia','Superantigens: activate 5-20% of all T cells non-specifically'], mnemonic:'Gram+ cocci clusters = Staph. Gram+ cocci chains = Strep.\nFor UTI: "E. Klebsi-cola, Pseudo-Proteus" = E.coli, Klebsiella, Pseudomonas, Proteus' },
    'Biochemistry':     { overview:'Biochemistry covers metabolic pathways, vitamins, and molecular biology relevant to clinical medicine and pharmacology.',                      facts:['ATP = universal energy currency','Pyruvate kinase deficiency → hemolytic anemia (RBCs need glycolysis)','OTC deficiency = most common urea cycle defect','Complex I inhibited by rotenone (metformin mechanism)','Vit C essential for collagen hydroxylation (proline/lysine)'], mnemonic:'ETC order: NADH → Complex I → Q → Complex III → Cytochrome c → Complex IV → O2\nUrea cycle starts and ends with Ornithine (mnemonic: Ordinarily Careless Crappers)' },
    'Clinical Medicine':{ overview:'Clinical Medicine integrates pathophysiology with real diagnosis and treatment decisions. High-yield for exams and clinical work.',              facts:['S. pneumoniae = #1 CAP cause','Troponin rises 3-6h post-MI, peaks 24-48h','tPA for ischaemic stroke: give within 4.5h','DKA: IV fluids FIRST, then insulin, monitor K+','Sepsis: 30 mL/kg IV + antibiotics within 1h'], mnemonic:'FAST for stroke: Face drooping, Arm weakness, Speech difficulty, Time to call 999\nDKA triad: hyperglycaemia + ketosis + metabolic acidosis' },
    'Surgery':          { overview:'Surgery covers acute abdomen, trauma assessment, and post-operative complications. ATLS principles are essential.',                            facts:['Rovsing sign: LLQ pressure causes RLQ pain','Tension PTX: needle decompression 2nd ICS MCL immediately','Pyloric stenosis: correct electrolytes BEFORE pyloromyotomy','Early dumping: 15-30 min, fluid shift. Late dumping: 1-3h, reactive hypoglycaemia','Anastomotic leak risk highest <5cm from anal verge'], mnemonic:'ATLS primary survey: ABCDE (Airway, Breathing, Circulation, Disability, Exposure)\nTension PTX = clinical diagnosis — act immediately, no CXR needed!' }
  };

  async function loadQuiz(topicId) {
    setLoadingQs(true); setQuizQs([]); setQuizIdx(0); setPicked(null); setRevealed(false); setQuizResults([]);
    try {
      const r = await fetch(ML + '/api/ml/questions?topic=' + encodeURIComponent(topicId) + '&n=5');
      const d = await r.json();
      setQuizQs(d.questions || []);
    } catch(e) { setQuizQs([]); }
    setLoadingQs(false);
  }

  function openTopic(t) { setActiveTopic(t); setMode('theory'); }

  function startQuiz() { loadQuiz(activeTopic.id); setMode('quiz'); }

  function submitAnswer() {
    const q = quizQs[quizIdx];
    const correct = picked === q.correct_index;
    setRevealed(true);
    setQuizResults(prev => [...prev, { correct }]);
  }

  function nextQ() {
    if (quizIdx < quizQs.length - 1) {
      setQuizIdx(i => i + 1); setPicked(null); setRevealed(false);
    } else {
      const allResults = [...quizResults, { correct: picked === quizQs[quizIdx]?.correct_index }];
      const score = allResults.filter(r => r.correct).length;
      const pct = Math.round(score / quizQs.length * 100);
      if (pct >= 60) {
        const rm = [...(user.roadmap || [])];
        const idx = rm.findIndex(r => r.id === activeTopic.id);
        if (idx >= 0) rm[idx].completed = true;
        else rm.push({ id: activeTopic.id, completed: true, status: 'done' });
        updateUser({ roadmap: rm, xp: user.xp + 100, score: user.score + score * 20 });
        notify('Topic mastered! +100 XP', 'success');
      } else {
        notify('Score: ' + pct + '% — Try again to master this topic', 'warn');
      }
      setMode('menu');
    }
  }

  function isCompleted(id) { return (user.roadmap || []).some(r => (r.id === id || r.topic === id) && r.completed); }

  /* ── THEORY VIEW ── */
  if (mode === 'theory' && activeTopic) {
    const th = THEORY[activeTopic.id] || {};
    return (
      <div className="page-content fade-in">
        <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:20}}>
          <button className="btn btn-outline btn-sm" onClick={() => setMode('menu')}>← Back to Topics</button>
          <span style={{fontSize:22}}>{activeTopic.icon}</span>
          <h2 style={{fontSize:20, fontWeight:800}}>{activeTopic.id}</h2>
        </div>

        <div className="card" style={{marginBottom:14, borderLeft:'3px solid '+activeTopic.color}}>
          <div className="lesson-section-label">📖 Overview</div>
          <p style={{lineHeight:1.7, fontSize:14, color:'var(--text)'}}>{th.overview}</p>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="lesson-section-label">🔑 Key Facts</div>
          {(th.facts || []).map((f, i) => (
            <div key={i} className="keyfact"><span>🔹</span><span>{f}</span></div>
          ))}
        </div>

        <div className="mnemonic-box" style={{marginBottom:20}}>
          <div className="lesson-section-label">🧠 Memory Tricks</div>
          <p style={{whiteSpace:'pre-line', fontSize:13, lineHeight:1.7}}>{th.mnemonic}</p>
        </div>

        <div className="clinical-box" style={{marginBottom:24}}>
          <strong style={{color:'var(--accent)'}}>🏥 Clinical Application:</strong>
          <span style={{color:'var(--text2)'}}> Understanding {activeTopic.id} helps you correctly diagnose, investigate and manage patients in real clinical scenarios.</span>
        </div>

        <button className="btn btn-primary btn-lg" onClick={startQuiz}>
          Test Your Knowledge with ML Quiz →
        </button>
      </div>
    );
  }

  /* ── QUIZ VIEW ── */
  if (mode === 'quiz') {
    if (loadingQs) return (
      <div className="page-content" style={{textAlign:'center', paddingTop:80}}>
        <div style={{fontSize:32, marginBottom:16}}>🤖</div>
        <p style={{color:'var(--text2)'}}>Loading questions from ML model…</p>
      </div>
    );

    if (!quizQs.length) return (
      <div className="page-content fade-in">
        <button className="btn btn-outline btn-sm" style={{marginBottom:20}} onClick={() => setMode('menu')}>← Back</button>
        <div className="card" style={{textAlign:'center', padding:32, borderColor:'var(--danger)'}}>
          <div style={{fontSize:40, marginBottom:12}}>⚠️</div>
          <h3>ML API Not Reachable</h3>
          <p style={{color:'var(--text2)', marginTop:8, fontSize:14}}>Start the ML API server first:</p>
          <code style={{display:'block', background:'var(--bg3)', padding:'10px 16px', borderRadius:8, marginTop:12, fontSize:13}}>python ml_api.py</code>
          <button className="btn btn-outline btn-sm" style={{marginTop:20}} onClick={() => setMode('menu')}>Back to Topics</button>
        </div>
      </div>
    );

    const q = quizQs[quizIdx];
    const prog = (quizIdx / quizQs.length) * 100;

    return (
      <div className="page-content fade-in">
        <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:12}}>
          <button className="btn btn-outline btn-sm" onClick={() => setMode('menu')}>← Exit Quiz</button>
          <span style={{fontSize:13, color:'var(--text3)'}}>Q{quizIdx+1}/{quizQs.length} — {activeTopic.id}</span>
          <span className={"diff-tag diff-"+q.difficulty} style={{marginLeft:'auto'}}>{q.difficulty}</span>
          {q.ml_predicted && <span style={{fontSize:10, color:'var(--text3)'}}>ML: {q.ml_predicted}</span>}
        </div>

        <div style={{height:4, background:'var(--bg4)', borderRadius:2, marginBottom:16}}>
          <div style={{height:'100%', background:activeTopic.color, width:prog+'%', borderRadius:2, transition:'width .4s'}}/>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <p style={{fontSize:16, fontWeight:600, lineHeight:1.6}}>{q.question}</p>
        </div>

        {q.options.map((opt, i) => {
          let bg = 'var(--bg3)', bc = 'var(--border)', col = 'var(--text)';
          if (revealed) {
            if (i === q.correct_index) { bg='rgba(52,211,153,0.12)'; bc='var(--success)'; col='var(--success)'; }
            else if (i === picked)     { bg='rgba(248,113,113,0.12)'; bc='var(--danger)';  col='var(--danger)'; }
          } else if (i === picked) { bg='rgba(56,189,248,0.1)'; bc='var(--accent)'; }
          return (
            <div key={i} onClick={() => !revealed && setPicked(i)}
              style={{padding:'13px 16px', borderRadius:8, border:'1px solid '+bc, background:bg, color:col,
                marginBottom:8, cursor:revealed?'default':'pointer', fontSize:14, transition:'all .15s'}}>
              <span style={{fontWeight:700, marginRight:8, color:'var(--text3)'}}>{String.fromCharCode(65+i)}.</span>{opt}
            </div>
          );
        })}

        {revealed && (
          <div className="card" style={{marginTop:12, borderLeft:'3px solid var(--accent2)', background:'rgba(129,140,248,0.05)'}}>
            <div className="lesson-section-label">Explanation</div>
            <p style={{fontSize:13, lineHeight:1.6, color:'var(--text2)'}}>{q.explanation}</p>
          </div>
        )}

        <div style={{marginTop:16}}>
          {!revealed
            ? <button className="btn btn-outline" disabled={picked === null} onClick={submitAnswer}>Check Answer</button>
            : <button className="btn btn-primary" onClick={nextQ}>{quizIdx < quizQs.length-1 ? 'Next Question →' : 'Finish Topic ✓'}</button>
          }
        </div>
      </div>
    );
  }

  /* ── MAIN MENU ── */
  return (
    <div className="page-content fade-in">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
        <div>
          <h2 style={{fontSize:24, fontWeight:800}}>🗺️ Learning Path</h2>
          <p style={{color:'var(--text2)', marginTop:4}}>Select a topic — study theory then take a ML-powered quiz</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => { updateUser({roadmap:[]}); notify('Progress reset','info'); }}>
          Reset Progress
        </button>
      </div>

      <div className="grid g2" style={{gap:14, marginBottom:20}}>
        {TOPICS.map(t => {
          const done = isCompleted(t.id);
          return (
            <div key={t.id} className="card" style={{cursor:'pointer', borderColor:done?t.color+'88':'var(--border)',
              background:done?t.color+'0a':'var(--card)', transition:'all .2s'}}
              onClick={() => openTopic(t)}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = done?t.color+'88':'var(--border)'}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div style={{width:46, height:46, borderRadius:12, background:t.color+'22',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0}}>
                  {t.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, fontSize:15, color:done?t.color:'var(--text)'}}>{t.id}</div>
                  <div style={{fontSize:12, color:'var(--text3)', marginTop:2}}>{t.desc}</div>
                </div>
                <div>
                  {done
                    ? <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:4,background:t.color+'22',color:t.color}}>✓ Done</span>
                    : <span style={{fontSize:18}}>→</span>
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{background:'rgba(56,189,248,0.04)', borderColor:'var(--border2)'}}>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span style={{fontSize:28}}>🤖</span>
          <div>
            <div style={{fontWeight:700, fontSize:13}}>ML-Powered Adaptive Quizzes</div>
            <div style={{fontSize:12, color:'var(--text3)', marginTop:3}}>
              Each quiz uses your trained ML model (SVM classifier, 49 clinical questions, 8 topics, adaptive difficulty).
              Make sure <code style={{background:'var(--bg3)', padding:'1px 5px', borderRadius:3}}>python ml_api.py</code> is running.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

`;

if (a !== -1 && b !== -1) {
  h = h.slice(0, a) + NEW + h.slice(b);
  fs.writeFileSync('index.html', h);
  console.log('Learning component replaced successfully!');
} else {
  console.log('ERROR: Could not find boundaries. a=' + a + ' b=' + b);
}
