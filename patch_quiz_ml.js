const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const ML_API = 'http://localhost:5001';

const NEW_QUIZ = `/* ==================== QUIZ (ML-POWERED) ==================== */
const ML_API = '${ML_API}';

function Quiz({ user, updateUser }) {
  const [mode, setMode] = React.useState('select');
  const [topic, setTopic] = React.useState('all');
  const [level, setLevel] = React.useState('beginner');
  const [sessionId, setSessionId] = React.useState(null);
  const [question, setQuestion] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [revealed, setRevealed] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [apiOnline, setApiOnline] = React.useState(null);
  const [levelChange, setLevelChange] = React.useState(null);

  const TOPICS = ['all','Anatomy','Physiology','Pharmacology','Pathology','Microbiology','Biochemistry','Clinical Medicine','Surgery'];

  React.useEffect(() => {
    fetch(ML_API + '/api/ml/status')
      .then(r => r.json())
      .then(d => setApiOnline(d))
      .catch(() => setApiOnline(false));
  }, []);

  async function startQuiz() {
    setLoading(true); setLevelChange(null);
    try {
      const r = await fetch(ML_API + '/api/ml/quiz/start', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ level, topic: topic === 'all' ? null : topic, n_questions: 10, adaptive: true })
      });
      const d = await r.json();
      setSessionId(d.session_id);
      setQuestion(d.question);
      setSelected(null); setRevealed(false); setFeedback(null); setSummary(null);
      setMode('quiz');
    } catch(e) { notify('ML API offline — check python ml_api.py', 'error'); }
    setLoading(false);
  }

  async function submitAnswer() {
    if (selected === null) return;
    setLoading(true);
    try {
      const r = await fetch(ML_API + '/api/ml/quiz/answer', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ session_id: sessionId, answer_index: selected })
      });
      const d = await r.json();
      setFeedback({ correct: d.is_correct, explanation: d.explanation, correct_text: d.correct_text });
      setRevealed(true);
      if (d.level_changed && d.level_changed !== question.difficulty) {
        setLevelChange(d.level_changed);
      }
      if (d.summary) {
        setSummary(d.summary);
        const pts = Math.round(d.summary.percentage * 0.5);
        updateUser({ score: user.score + pts, xp: user.xp + pts,
          quizScores: [...(user.quizScores||[]), { score: d.summary.percentage, difficulty: level, date: new Date().toLocaleDateString() }],
          totalAnswers: user.totalAnswers + d.summary.history.length,
          correctAnswers: user.correctAnswers + d.summary.history.filter(h=>h.is_correct).length
        });
      }
      if (d.next_question && !d.summary) {
        setTimeout(() => {
          setQuestion(d.next_question);
          setSelected(null); setRevealed(false); setFeedback(null); setLevelChange(null);
        }, 2200);
      }
    } catch(e) { notify('Error submitting answer','error'); }
    setLoading(false);
  }

  function diffColor(d) { return d==='beginner'?'var(--success)':d==='intermediate'?'var(--warn)':'var(--danger)'; }

  if (mode === 'select') return (
    <div className="page-content fade-in">
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:800}}>🧠 Adaptive ML Quiz</h2>
        <p style={{color:'var(--text2)',marginTop:4}}>Powered by a real ML classifier — difficulty adapts based on your performance</p>
      </div>
      {apiOnline === false && (
        <div className="card" style={{marginBottom:16,borderColor:'var(--danger)',background:'rgba(248,113,113,0.05)'}}>
          <div style={{color:'var(--danger)',fontWeight:700}}>⚠ ML API Offline</div>
          <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Run: <code style={{background:'var(--bg3)',padding:'2px 6px',borderRadius:4}}>python ml_api.py</code> in the project folder.</div>
        </div>
      )}
      {apiOnline && apiOnline.model && (
        <div className="card" style={{marginBottom:16,borderColor:'var(--accent3)',background:'rgba(52,211,153,0.05)',padding:'12px 16px'}}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <span style={{fontSize:20}}>🤖</span>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:'var(--success)'}}>ML Model Online — {apiOnline.model}</div>
              <div style={{fontSize:12,color:'var(--text3)'}}>CV F1: {apiOnline.cv_f1_macro} · {apiOnline.question_count} questions · 8 topics · Adaptive difficulty</div>
            </div>
          </div>
        </div>
      )}
      <div style={{marginBottom:16}}>
        <label style={{fontWeight:600,marginBottom:8,display:'block'}}>Topic</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {TOPICS.map(t => (
            <button key={t} onClick={()=>setTopic(t)} style={{padding:'6px 12px',borderRadius:20,border:'1px solid',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
              background:topic===t?'var(--accent)':'transparent',color:topic===t?'#0a0e1a':'var(--text2)',borderColor:topic===t?'var(--accent)':'var(--border)'}}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid g3" style={{marginBottom:20}}>
        {['beginner','intermediate','hard'].map(d => (
          <div key={d} className="card" style={{cursor:'pointer',borderColor:level===d?diffColor(d):'var(--border)',transition:'all .15s'}} onClick={()=>setLevel(d)}>
            <div style={{fontSize:22,marginBottom:6}}>{d==='beginner'?'🌱':d==='intermediate'?'🔥':'⚡'}</div>
            <div style={{fontWeight:700,textTransform:'capitalize',color:level===d?diffColor(d):'var(--text)'}}>{d}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginTop:3}}>ML adapts up or down from here</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-lg" disabled={loading||apiOnline===false} onClick={startQuiz}>
        {loading?'Starting…':'Start ML Quiz →'}
      </button>
    </div>
  );

  if (mode === 'quiz' && summary) {
    const sc = summary.percentage;
    return (
      <div className="page-content fade-in">
        <div className="card" style={{textAlign:'center',padding:28,marginBottom:20,borderColor:sc>=70?'var(--success)':sc>=40?'var(--warn)':'var(--danger)'}}>
          <div style={{fontSize:48,marginBottom:10}}>{sc>=80?'🎯':sc>=60?'📚':'💡'}</div>
          <h2 style={{fontSize:28,fontWeight:800}}>{sc}%</h2>
          <p style={{color:'var(--text2)',marginTop:6}}>{summary.score} correct — {summary.verdict}</p>
          <div style={{marginTop:16,display:'flex',gap:20,justifyContent:'center',flexWrap:'wrap'}}>
            {summary.strengths.length>0 && <div style={{padding:'8px 14px',background:'rgba(52,211,153,0.1)',border:'1px solid var(--success)',borderRadius:8,fontSize:12}}>💪 Strong: {summary.strengths.join(', ')}</div>}
            {summary.weaknesses.length>0 && <div style={{padding:'8px 14px',background:'rgba(248,113,113,0.1)',border:'1px solid var(--danger)',borderRadius:8,fontSize:12}}>📖 Review: {summary.weaknesses.join(', ')}</div>}
          </div>
        </div>
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:12}}>Per-Topic Scores</div>
          {Object.entries(summary.topic_scores).map(([t,sc]) => (
            <div key={t} className="topic-score-bar">
              <div className="tsb-header"><span>{t}</span><span style={{color:sc>=75?'var(--success)':sc>=40?'var(--warn)':'var(--danger)',fontWeight:700}}>{sc}%</span></div>
              <div className="tsb-bar"><div className="tsb-fill" style={{width:sc+'%',background:sc>=75?'var(--success)':sc>=40?'var(--warn)':'var(--danger)'}}/></div>
            </div>
          ))}
        </div>
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:12}}>Question Review</div>
          {summary.history.map((h,i) => (
            <div key={i} style={{padding:'10px 12px',marginBottom:8,borderRadius:8,background:'var(--bg3)',borderLeft:\`3px solid \${h.is_correct?'var(--success)':'var(--danger)'}\`}}>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:3}}>{h.topic} · {h.difficulty}</div>
              <div style={{fontSize:13,fontWeight:600}}>{h.question}</div>
              <div style={{fontSize:12,marginTop:4,color:h.is_correct?'var(--success)':'var(--danger)'}}>
                {h.is_correct?'✓ Correct':'✗ Wrong'} — Correct: {h.correct_option}
              </div>
              {!h.is_correct && <div style={{fontSize:12,color:'var(--text2)',marginTop:4,fontStyle:'italic'}}>{h.explanation}</div>}
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" onClick={()=>setMode('select')}>← Quiz Menu</button>
          <button className="btn btn-outline" onClick={startQuiz}>Retry</button>
        </div>
      </div>
    );
  }

  if (mode === 'quiz' && question) {
    const prog = ((question.q_num-1)/question.total)*100;
    return (
      <div className="page-content fade-in">
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:12,color:'var(--text3)'}}>
          <span>Question {question.q_num}/{question.total}</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span className={\`diff-tag diff-\${question.difficulty}\`}>{question.difficulty}</span>
            <span style={{fontSize:11,color:'var(--text3)'}}>ML: {question.ml_predicted} ({Math.round(question.ml_confidence*100)}%)</span>
          </div>
        </div>
        <div style={{height:5,background:'var(--bg4)',borderRadius:3,marginBottom:16,overflow:'hidden'}}>
          <div style={{height:'100%',background:'var(--accent2)',width:prog+'%',transition:'width .4s'}}/>
        </div>
        {levelChange && (
          <div style={{padding:'8px 14px',marginBottom:12,borderRadius:8,background:'rgba(251,191,36,0.1)',border:'1px solid var(--warn)',fontSize:13,fontWeight:600,color:'var(--warn)'}}>
            ⚡ Difficulty adapted → {levelChange.toUpperCase()}
          </div>
        )}
        <div className="card" style={{marginBottom:14}}>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>{question.topic}</div>
          <p style={{fontSize:16,fontWeight:600,lineHeight:1.6}}>{question.question}</p>
        </div>
        {question.options.map((opt,i) => {
          let cls = 'quiz-opt';
          if (revealed) {
            if (i === question._correct_index) cls += ' correct';
            else if (i === selected) cls += ' wrong';
            cls += ' disabled';
          } else if (i === selected) cls += ' selected';
          return (
            <div key={i} className={cls} onClick={()=>!revealed&&setSelected(i)}>
              <span style={{marginRight:8,fontWeight:700,color:'var(--text3)'}}>{String.fromCharCode(65+i)}.</span>{opt}
            </div>
          );
        })}
        {feedback && (
          <div className="card" style={{marginTop:12,borderLeft:\`3px solid \${feedback.correct?'var(--success)':'var(--danger)'}\`,background:feedback.correct?'rgba(52,211,153,0.05)':'rgba(248,113,113,0.05)'}}>
            <div style={{fontWeight:700,color:feedback.correct?'var(--success)':'var(--danger)',marginBottom:4}}>{feedback.correct?'✓ Correct!':'✗ Incorrect — Correct: '+feedback.correct_text}</div>
            <p style={{fontSize:13,lineHeight:1.6,color:'var(--text2)'}}>{feedback.explanation}</p>
          </div>
        )}
        <div style={{marginTop:16}}>
          {!revealed
            ? <button className="btn btn-outline" disabled={selected===null||loading} onClick={submitAnswer}>Check Answer</button>
            : !summary && <div style={{fontSize:12,color:'var(--text3)',fontStyle:'italic'}}>Loading next question…</div>
          }
        </div>
      </div>
    );
  }

  return null;
}

`;

// Replace old Quiz with ML Quiz
const qs = html.indexOf('/* ==================== QUIZ ==================== */');
const qe = html.indexOf('/* ==================== MULTIPLAYER ==================== */');
if (qs !== -1 && qe !== -1) {
  html = html.slice(0, qs) + NEW_QUIZ + html.slice(qe);
  console.log('✓ Quiz replaced');
}

fs.writeFileSync('index.html', html);
console.log('Done!');
