const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const learningCode = `
/* ==================== MEDICAL CURRICULUM DATA ==================== */
const MEDICAL_CURRICULUM = [
  {
    id: 'anatomy',
    title: 'Anatomy',
    icon: '🫀',
    desc: 'Structure of the human body, organs and systems.',
    diagnosticQs: [
      { q: 'Which valve separates the left atrium from the left ventricle?', opts: ['Tricuspid', 'Mitral', 'Pulmonary', 'Aortic'], ans: 1, difficulty: 'medium' },
      { q: 'The Circle of Willis is located in which organ?', opts: ['Liver', 'Heart', 'Brain', 'Kidney'], ans: 2, difficulty: 'easy' },
      { q: 'Which of these is NOT a branch of the celiac trunk?', opts: ['Left gastric', 'Splenic', 'Common hepatic', 'Superior mesenteric'], ans: 3, difficulty: 'hard' }
    ],
    lessons: [
      {
        id: 'heart-structure',
        title: 'Cardiac Anatomy & Chambers',
        theory: 'The heart consists of four chambers: two atria and two ventricles. The left side handles oxygenated blood from the lungs, while the right side handles deoxygenated blood from the body.',
        facts: ['The myocardium is thickest in the left ventricle.', 'The SA node is the natural pacemaker.', 'Coronary arteries supply the heart muscle.'],
        mnemonic: 'TPMA: Toilet Paper My Ass (Tricuspid, Pulmonary, Mitral, Aortic) - Valve order.',
        quiz: [
          { q: 'Which chamber pumps blood to the aorta?', opts: ['RA', 'LA', 'RV', 'LV'], ans: 3 },
          { q: 'The thickest wall of the heart is found in:', opts: ['RV', 'LV', 'RA', 'LA'], ans: 1 }
        ]
      }
    ]
  },
  {
    id: 'physiology',
    title: 'Physiology',
    icon: '⚡',
    desc: 'Functional mechanisms of the human body.',
    diagnosticQs: [
      { q: 'What is the primary stimulus for breathing in a healthy person?', opts: ['Low O2', 'High CO2', 'Low pH', 'High O2'], ans: 1, difficulty: 'medium' },
      { q: 'Where does most nutrient absorption occur?', opts: ['Stomach', 'Large Intestine', 'Small Intestine', 'Esophagus'], ans: 2, difficulty: 'easy' }
    ],
    lessons: [
      {
        id: 'cardiac-cycle',
        title: 'The Cardiac Cycle',
        theory: 'The cycle involves systole (contraction) and diastole (relaxation). Stroke volume is the amount of blood pumped per beat.',
        facts: ['CO = HR x SV', 'Ejection fraction is typically 55-70%', 'The first heart sound (S1) is closure of AV valves.'],
        quiz: [{ q: 'Stroke Volume x Heart Rate equals:', opts: ['BP', 'Cardiac Output', 'MAP', 'TPR'], ans: 1 }]
      }
    ]
  },
  {
    id: 'pharmacology',
    title: 'Pharmacology',
    icon: '💊',
    desc: 'Drug actions, side effects, and mechanisms.',
    diagnosticQs: [
      { q: 'Mechanism of action of Beta-blockers:', opts: ['Antagonize B-receptors', 'Agonize B-receptors', 'Block Ca channels', 'Inhibit ACE'], ans: 0, difficulty: 'easy' },
      { q: 'Which drug is a classic inhibitor of Vitamin K epoxide reductase?', opts: ['Heparin', 'Warfarin', 'Aspirin', 'Clopidogrel'], ans: 1, difficulty: 'hard' }
    ],
    lessons: [
      {
        id: 'anti-hypertensives',
        title: 'Hypertension Management',
        theory: 'Classes include ACE inhibitors, ARBs, Beta-blockers, and Diuretics. ACE inhibitors often cause a dry cough.',
        facts: ['ACEIs block conversion of Angiotensin I to II.', 'Loop diuretics act on the thick ascending limb.', 'Beta-blockers reduce heart rate.'],
        quiz: [{ q: 'Common side effect of ACE inhibitors:', opts: ['Edema', 'Dry cough', 'Headache', 'Rash'], ans: 1 }]
      }
    ]
  }
];

/* ==================== LEARNING COMPONENT ==================== */
function Learning({ user, updateUser }) {
  const [mode, setMode] = useState(user.topicScores ? 'roadmap' : 'assessment');
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [assessIdx, setAssessIdx] = useState(0);
  const [tempScores, setTempScores] = useState({});
  const [assessStep, setAssessStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState('');

  const allDiagnosticQs = MEDICAL_CURRICULUM.flatMap(t => t.diagnosticQs.map(q => ({...q, topicId: t.id})));

  function handleAssessAnswer(ansIdx) {
    const q = allDiagnosticQs[assessIdx];
    const isCorrect = ansIdx === q.ans;
    let points = isCorrect ? 33 : 0;
    if (q.difficulty === 'hard') points = isCorrect ? 50 : -10;
    
    setTempScores(prev => ({ ...prev, [q.topicId]: (prev[q.topicId] || 0) + points }));

    if (assessIdx < allDiagnosticQs.length - 1) {
      setAssessIdx(assessIdx + 1);
    } else {
      const finalScores = {};
      MEDICAL_CURRICULUM.forEach(t => {
        finalScores[t.id] = Math.max(0, Math.min(100, tempScores[t.id] || 0));
      });
      updateUser({ 
        topicScores: finalScores, 
        learningGoal: selectedGoal,
        roadmap: MEDICAL_CURRICULUM.map(t => ({
          id: t.id,
          status: finalScores[t.id] >= 75 ? 'skip' : (finalScores[t.id] >= 40 ? 'light' : 'deep'),
          completed: false
        }))
      });
      setMode('roadmap');
    }
  }

  if (mode === 'assessment') {
    if (assessStep === 0) return (
      <div className="page-content fade-in">
        <div style={{textAlign:'center', marginBottom:30}}>
          <h2 style={{fontSize:28, fontWeight:800}}>Personalize Your Journey</h2>
          <p style={{color:'var(--text2)'}}>Tell us your goal and we'll build your custom roadmap</p>
        </div>
        <div className="grid g3">
          {['Medical Student', 'Clinical Intern', 'NEET-PG Prep'].map(g => (
            <div key={g} className={\`card assess-goal-card \${selectedGoal===g?'selected-goal':''}\`} onClick={()=>setSelectedGoal(g)}>
              <div style={{fontSize:32, marginBottom:10}}>{g==='Medical Student'?'📚':g==='Clinical Intern'?'🩺':'🏆'}</div>
              <div style={{fontWeight:700}}>{g}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-block" style={{marginTop:30}} disabled={!selectedGoal} onClick={()=>setAssessStep(1)}>Start Assessment →</button>
      </div>
    );
    const q = allDiagnosticQs[assessIdx];
    return (
      <div className="page-content fade-in">
        <div className="card" style={{marginBottom:20}}>
          <span className={\`diff-tag diff-\${q.difficulty}\`}>{q.difficulty}</span>
          <h3 style={{marginTop:10, fontSize:18, lineHeight:1.5}}>{q.q}</h3>
        </div>
        <div className="grid g2">
          {q.opts.map((opt, i) => (
            <button key={i} className="btn btn-outline btn-lg" style={{justifyContent:'flex-start'}} onClick={()=>handleAssessAnswer(i)}>{opt}</button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'roadmap') {
    const roadmap = user.roadmap || [];
    return (
      <div className="page-content fade-in">
        <h2 style={{fontSize:24, fontWeight:800, marginBottom:30}}>Your Learning Roadmap</h2>
        <div className="roadmap-wrap">
          <div className="roadmap-spine"/>
          {MEDICAL_CURRICULUM.map((topic, i) => {
            const state = roadmap.find(r => r.id === topic.id) || { status: 'locked' };
            const isDone = state.completed;
            return (
              <div key={topic.id} className="roadmap-node-row">
                <div className="node-content">
                  <div className={\`node-card \${state.status}-card \${isDone?'done-card':''}\`} onClick={() => {
                    if (state.status !== 'skip' || isDone) {
                      setCurrentTopic(topic);
                      setCurrentLesson(topic.lessons[0]);
                      setMode('lesson');
                    }
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                      <span style={{fontSize:11, fontWeight:700, color:isDone?'var(--success)':\`var(--\${state.status==='light'?'warn':'accent'})\`}}>
                        {isDone ? '✓ Completed' : (state.status === 'skip' ? 'Skipped (Strong)' : \`\${state.status} focus\`)}
                      </span>
                    </div>
                    <h4 style={{fontSize:15}}>{topic.title}</h4>
                  </div>
                </div>
                <div className="node-center"><div className={\`node-circle \${state.status} \${isDone?'done':''}\`}>{isDone ? '✅' : topic.icon}</div></div>
                <div style={{flex:1}}/>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'lesson') return (
    <div className="page-content fade-in">
      <button className="btn btn-outline btn-sm" style={{marginBottom:20}} onClick={()=>setMode('roadmap')}>← Back</button>
      <div className="card">
        <h2 style={{fontSize:24, fontWeight:800, marginBottom:16}}>{currentLesson.title}</h2>
        <p style={{lineHeight:1.7, marginBottom:20}}>{currentLesson.theory}</p>
        <div className="lesson-section-label">Practice Quiz</div>
        {currentLesson.quiz.map((q, i) => (
          <div key={i} style={{marginBottom:16}}>
            <p style={{fontWeight:600}}>{q.q}</p>
            <div style={{display:'flex', gap:6, marginTop:8}}>
              {q.opts.map((opt, oi) => <button key={oi} className="btn btn-outline btn-sm" onClick={()=>notify(oi===q.ans?'Correct!':'Try again','info')}>{opt}</button>)}
            </div>
          </div>
        ))}
        <button className="btn btn-primary btn-block" onClick={() => {
          const roadmap = [...(user.roadmap || [])];
          const idx = roadmap.findIndex(r => r.id === currentTopic.id);
          if (idx >= 0) roadmap[idx].completed = true;
          updateUser({ roadmap });
          setMode('roadmap');
        }}>Complete Module</button>
      </div>
    </div>
  );
  return null;
}
`;

const insertionPoint = '/* ==================== NOTIFICATION COMPONENT ==================== */';
if (content.includes(insertionPoint)) {
  content = content.replace(insertionPoint, learningCode + insertionPoint);
}

const pagesSearch = 'const pages = {';
const pagesUpdate = 'const pages = {\n    learning: <Learning user={user} updateUser={updateUser}/>,';
if (content.includes(pagesSearch) && !content.includes('learning: <Learning')) {
  content = content.replace(pagesSearch, pagesUpdate);
}

fs.writeFileSync(indexPath, content);
console.log('Successfully updated index.html with Learning system.');
