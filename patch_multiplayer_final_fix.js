const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const a = h.indexOf('function Multiplayer');
const b = h.indexOf('function Leaderboard', a);

const NEW_MULTI = `function Multiplayer({ user }) {
  const [view, setView] = React.useState('lobby');
  const [roomId, setRoomId] = React.useState('main-theater');
  const [players, setPlayers] = React.useState([]);
  const [vitals, setVitals] = React.useState({ hr: 75, bp: '118/78', spo2: 98, status: 'STABLE' });
  const [progress, setProgress] = React.useState(0);
  const [gameState, setGameState] = React.useState('ACTIVE'); 
  const [history, setHistory] = React.useState([]);
  const [chat, setChat] = React.useState([]);
  const [chatText, setChatText] = React.useState('');
  const [cmdText, setCmdText] = React.useState('');
  const [myRole, setMyRole] = React.useState('Doctor');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [availableRooms, setAvailableRooms] = React.useState([
    { id:'R101', name:'General OR 1', host:'Dr. Smith', members:2, max:4, case:'Appendectomy' },
    { id:'R102', name:'Cardiac Suite', host:'Dr. Jones', members:1, max:4, case:'Valve Repair' }
  ]);
  
  const canvasRef = React.useRef(null);
  const socketRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  const ROLE_ICONS = { 'Doctor':'👨‍⚕️', 'Surgeon':'🔪', 'Anaesthetic':'😴', 'Assistant Intern':'🎓' };
  const TOOL_ICONS = { 'vitals':'🩺', 'epi':'💉', 'defib':'⚡', 'test':'📋', 'incision':'🔪', 'suture':'🧵', 'hemo':'🩸', 'suction':'🌪️', 'intubate':'🌬️', 'propofol':'🧪', 'oxygen':'💨', 'mon':'📈', 'iv':'💧', 'gauze':'🩹', 'retract':'🪝', 'clean':'🧼' };
  
  const TOOLS = {
    'Doctor':          [{ name:'Check Vitals', action:'vitals' }, { name:'Epinephrine', action:'epi' }, { name:'Defib', action:'defib' }, { name:'Order Test', action:'test' }],
    'Surgeon':         [{ name:'Incision', action:'incision' }, { name:'Suturing', action:'suture' }, { name:'Hemostasis', action:'hemo' }, { name:'Suction', action:'suction' }],
    'Anaesthetic':     [{ name:'Intubate', action:'intubate' }, { name:'Propofol', action:'propofol' }, { name:'Oxygen', action:'oxygen' }, { name:'Monitor', action:'mon' }],
    'Assistant Intern':[{ name:'IV Fluid', action:'iv' }, { name:'Gauze', action:'gauze' }, { name:'Retract', action:'retract' }, { name:'Clean', action:'clean' }]
  };

  React.useEffect(() => {
    const skt = window.io ? window.io('http://localhost:3001') : null;
    if (!skt) return;
    socketRef.current = skt;
    skt.emit('join_room', { roomId, user: { name: user.name, role: myRole } });
    skt.on('room_update', d => { if(d.members) setPlayers(d.members); });
    skt.on('new_message', m => setChat(p => [...p, m]));
    return () => skt.disconnect();
  }, [roomId, myRole, view]);

  function createHumanoid(color, isPatient = false) {
    const group = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.7, 4, 8), new THREE.MeshStandardMaterial({ color }));
    torso.position.y = 0.6; group.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.15; group.add(head);
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), new THREE.MeshStandardMaterial({ color }));
    armL.position.set(-0.4, 0.7, 0); group.add(armL);
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), new THREE.MeshStandardMaterial({ color }));
    armR.position.set(0.4, 0.7, 0); group.add(armR);
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color }));
    legL.position.set(-0.15, 0.1, 0); group.add(legL);
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color }));
    legR.position.set(0.15, 0.1, 0); group.add(legR);
    if(isPatient) group.rotation.x = -Math.PI/2;
    // Fallback if CapsuleGeometry fails (added by previous fix scripts)
    group.traverse(c => { if(c.geometry && c.geometry.type === 'CapsuleGeometry' && !THREE.CapsuleGeometry) c.geometry = new THREE.CylinderGeometry(c.geometry.parameters.radius, c.geometry.parameters.radius, c.geometry.parameters.length, 16); });
    return group;
  }

  function createTextLabel(text, subtext, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300; canvas.height = 80;
    ctx.fillStyle = 'rgba(10,14,26,0.95)';
    const x=0,y=0,w=300,h=80,r=15;
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color || '#6366f1'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px DM Sans'; ctx.textAlign = 'center'; ctx.fillText(text, 150, 35);
    ctx.fillStyle = color || '#818cf8'; ctx.font = '600 16px DM Sans'; ctx.fillText(subtext, 150, 65);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(2, 0.5, 1);
    return sprite;
  }

  React.useEffect(() => {
    if (view !== 'room' || !canvasRef.current) return;
    const el = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020617);
    const camera = new THREE.PerspectiveCamera(50, el.clientWidth/el.clientHeight, 0.1, 100);
    camera.position.set(5, 4, 6);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const light = new THREE.PointLight(0xffffff, 1.5); light.position.set(0, 10, 0); scene.add(light);
    
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 4.6), new THREE.MeshStandardMaterial({ color:0x94a3b8 })));
    const patient = createHumanoid(0xffdbac, true); patient.position.set(0, 0.6, 0); scene.add(patient);
    const pLabel = createTextLabel('PATIENT', 'STATUS: ' + vitals.status, '#f43f5e'); pLabel.position.y = 1.3; scene.add(pLabel);

    const activePlayers = [...players];
    if(!activePlayers.find(p=>p.name===user.name)) activePlayers.push({ name:user.name, role:myRole });
    const avatarGroup = new THREE.Group();
    activePlayers.forEach((p, i) => {
      const color = p.role==='Surgeon'?0xf87171:p.role==='Anaesthetic'?0x818cf8:p.role==='Assistant Intern'?0x34d399:0x6366f1;
      const doc = createHumanoid(color);
      const label = createTextLabel(p.name, ROLE_ICONS[p.role] + ' ' + p.role, '#' + color.toString(16).padStart(6,'0'));
      label.position.y = 1.6; doc.add(label);
      const ang = (i / Math.max(1, activePlayers.length)) * Math.PI * 2;
      doc.position.set(Math.cos(ang)*3.5, 0, Math.sin(ang)*3.5); doc.lookAt(0,0,0);
      avatarGroup.add(doc);
    });
    scene.add(avatarGroup);
    scene.add(new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b));

    if (window.THREE && THREE.OBJLoader) {
      new THREE.OBJLoader().load('/hackthonnn.obj', obj => {
        obj.scale.setScalar(0.02); obj.position.y = -0.5;
        obj.traverse(c => { if(c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x1e293b, transparent:true, opacity:0.3 }); });
        scene.add(obj);
      });
    }

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      patient.position.y = 0.6 + Math.sin(performance.now()*0.002)*0.01;
      avatarGroup.children.forEach((av, i) => { av.position.y = Math.sin(performance.now()*0.0015 + i)*0.05; });
      controls.update(); renderer.render(scene, camera);
    }
    animate();
    return () => { cancelAnimationFrame(raf); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [view, players, myRole, vitals.status]);

  function handleCreateTeam() {
    if(!newTeamName.trim()) return;
    const id = 'R' + Date.now().toString().slice(-4);
    setAvailableRooms(p => [{ id, name: newTeamName, host: user.name, members: 1, max: 4, case: 'Critical Trauma' }, ...p]);
    setRoomId(id); setView('room'); setShowCreateModal(false); setNewTeamName('');
    notify('Team ' + newTeamName + ' created!', 'success');
  }

  function sendAction(action) {
    if (gameState !== 'ACTIVE') return;
    const isGood = Math.random() > 0.3;
    const newProgress = Math.min(100, progress + (isGood ? 4 : 1));
    const newHr = vitals.hr + (isGood ? -2 : 6);
    setHistory(p => [...p, { user: user.name, action, time: new Date().toLocaleTimeString(), classification: isGood ? 'OK' : 'DANGER' }]);
    setProgress(newProgress);
    setVitals(v => ({ ...v, hr: newHr, status: newHr > 150 ? 'CRITICAL' : newHr < 40 ? 'CRITICAL' : 'STABLE' }));
    if (newProgress >= 100) setGameState('WON');
    else if (newHr > 190 || newHr < 25) setGameState('LOST');
    setCmdText('');
  }

  function sendChat(e) {
    e.preventDefault(); if(!chatText.trim()) return;
    const msg = { from: user.name, text: chatText, ts: new Date().toLocaleTimeString() };
    if(socketRef.current) socketRef.current.emit('send_message', { roomId, text: chatText });
    setChat(p => [...p, msg]); setChatText('');
  }

  if (view === 'lobby') return (
    <div className="page-content fade-in">
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:400}}>
            <h3 style={{marginBottom:15}}>Create New Team</h3>
            <input value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} placeholder="Team Name..." style={{marginBottom:20}} autoFocus/>
            <div style={{display:'flex', gap:10}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleCreateTeam}>Create Team</button>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <div><h2 style={{fontSize:24,fontWeight:800}}>👥 Surgical Lobby</h2><p style={{color:'var(--text2)'}}>Initialize a team or join an active OR</p></div>
        <button className="btn btn-primary btn-lg" onClick={()=>setShowCreateModal(true)}>+ CREATE NEW TEAM</button>
      </div>
      <div style={{marginBottom:24}}>
        <label style={{fontSize:12, color:'var(--text3)', marginBottom:10, display:'block', fontWeight:800}}>CHOOSE YOUR SPECIALIZATION</label>
        <div style={{display:'flex', gap:10}}>
          {Object.keys(ROLE_ICONS).map(r => (
            <button key={r} className="btn btn-sm" style={{borderRadius:20, padding:'8px 20px', background:myRole===r?'var(--accent)':'rgba(255,255,255,0.05)', color:myRole===r?'#0a0e1a':'var(--text)', border:'1px solid var(--border)'}} onClick={() => setMyRole(r)}>{ROLE_ICONS[r]} {r}</button>
          ))}
        </div>
      </div>
      <div className="grid g2">
        {availableRooms.map(r => (
          <div key={r.id} className="card" style={{borderColor:roomId===r.id?'var(--accent)':'var(--border)', transition:'all 0.2s', cursor:'pointer'}} onClick={() => { setRoomId(r.id); setView('room'); }}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}><span style={{fontWeight:800, fontSize:16}}>{r.name}</span><span className="badge badge-green">ACTIVE</span></div>
            <div style={{fontSize:13, color:'var(--text2)', marginBottom:12}}>📋 Case: {r.case} · {r.members}/{r.max} Surgeons</div>
            <button className="btn btn-outline btn-sm btn-block">JOIN OPERATION →</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{display:'grid', gridTemplateColumns:'280px 1fr 300px', gap:12, height:'calc(100vh - 100px)', overflow:'hidden', position:'relative'}}>
      {gameState !== 'ACTIVE' && (
        <div style={{position:'absolute', inset:0, zIndex:1000, background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)'}}>
          <div style={{fontSize:100, marginBottom:20}}>{gameState==='WON'?'🏆':'🛑'}</div>
          <h1 style={{fontSize:54, fontWeight:800, color:gameState==='WON'?'var(--success)':'var(--danger)', marginBottom:10, textAlign:'center'}}>{gameState==='WON'?'MISSION SUCCESS':'MISSION FAILED'}</h1>
          <p style={{fontSize:20, color:'var(--text2)', marginBottom:30, textAlign:'center'}}>{gameState==='WON'?'The patient has been successfully stabilized. Excellent clinical performance!':'The patient was lost. Review the logs to identify the point of failure.'}</p>
          <button className="btn btn-primary btn-lg" onClick={() => { setGameState('ACTIVE'); setProgress(0); setVitals({ hr: 75, bp: '118/78', spo2: 98, status: 'STABLE' }); setHistory([]); }}>RETRY OPERATION</button>
        </div>
      )}

      {/* LEFT: LOGS */}
      <div className="card" style={{display:'flex', flexDirection:'column', overflow:'hidden', padding:0}}>
        <div style={{padding:15, borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:800, color:'var(--accent)', letterSpacing:1}}>📋 SUBJECT LOGS</div>
        <div style={{flex:1, overflowY:'auto', padding:12}}>
          {history.slice().reverse().map((h,i) => (
            <div key={i} style={{fontSize:11, padding:10, background:'var(--bg3)', borderRadius:8, marginBottom:8, borderLeft:'4px solid '+(h.classification==='DANGER'?'var(--danger)':'var(--success)')}}>
              <div style={{fontWeight:800}}>{h.user}</div>
              <div style={{marginTop:3, color:'var(--text2)'}}>{h.action}</div>
              <div style={{fontSize:9, color:'var(--text3)', marginTop:4, textAlign:'right'}}>{h.time}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" style={{margin:15}} onClick={() => setView('lobby')}>← ABANDON MISSION</button>
      </div>

      {/* CENTER: SIMULATION */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <div style={{background:'#000', borderRadius:12, padding:15, display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'2px solid #1e293b'}}>
          <div><div style={{fontSize:10,color:'#f43f5e',fontWeight:800}}>HR</div><div style={{fontSize:28,color:'#f43f5e',fontFamily:'monospace',fontWeight:800}}>{vitals.hr}</div></div>
          <div><div style={{fontSize:10,color:'#10b981',fontWeight:800}}>BP</div><div style={{fontSize:24,color:'#10b981',fontFamily:'monospace',fontWeight:800}}>{vitals.bp}</div></div>
          <div><div style={{fontSize:10,color:'#3b82f6',fontWeight:800}}>O2</div><div style={{fontSize:24,color:'#3b82f6',fontFamily:'monospace',fontWeight:800}}>{vitals.spo2}%</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:12,color:vitals.status==='CRITICAL'?'var(--danger)':'var(--success)',fontWeight:800}}>{vitals.status}</div><div style={{fontSize:10,color:'var(--text3)'}}>LIVE FEED</div></div>
        </div>
        
        <div ref={canvasRef} style={{flex:1, background:'#000', borderRadius:12, overflow:'hidden', border:'1px solid #1e293b', position:'relative'}}>
          <div style={{position:'absolute', top:20, left:'10%', width:'80%', height:10, background:'rgba(255,255,255,0.1)', borderRadius:5, zIndex:10, overflow:'hidden'}}>
            <div style={{width:\`\${progress}%\`, height:'100%', background:'linear-gradient(90deg, #38bdf8, #818cf8)', transition:'width 0.5s ease'}}/>
          </div>
          <div style={{position:'absolute', top:35, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'#fff', fontWeight:800, zIndex:10}}>SURGICAL PROGRESS: {progress}%</div>
          <div style={{position:'absolute', bottom:15, right:15, width:250, background:'rgba(10,14,26,0.9)', padding:15, borderRadius:12, border:'1px solid var(--accent2)', zIndex:10, backdropFilter:'blur(5px)'}}>
            <div style={{fontSize:11, fontWeight:800, color:'var(--accent2)', marginBottom:5}}>MISSION OBJECTIVE</div>
            <div style={{fontSize:14, fontWeight:800, color:'#fff', marginBottom:5}}>Trauma Resuscitation</div>
            <div style={{fontSize:11, color:'var(--text2)', lineHeight:1.4}}>Patient 42M, GSW to chest. Massive hemorrhage. Maintain airway and stabilize vitals.</div>
          </div>
        </div>

        <div className="card" style={{padding:15, background:'rgba(0,0,0,0.95)'}}>
          <div style={{display:'flex', justifyContent:'center', gap:10, marginBottom:15}}>
            {(TOOLS[myRole] || TOOLS.Doctor).map((t,i) => (
              <button key={i} onClick={() => sendAction(t.action)} style={{background:'rgba(255,255,255,0.05)', border:'1px solid #334155', color:'#fff', padding:'10px 15px', borderRadius:12, minWidth:85, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
                <div style={{fontSize:22}}>{TOOL_ICONS[t.action] || '🩺'}</div><div style={{fontSize:9, fontWeight:800}}>{t.name.toUpperCase()}</div>
              </button>
            ))}
          </div>
          <form onSubmit={e => {e.preventDefault(); sendAction(cmdText);}} style={{display:'flex', background:'#000', padding:'10px 15px', borderRadius:12, border:'1px solid #334155'}}>
            <span style={{color:'var(--accent)', fontSize:12, marginRight:10, fontWeight:800}}>OR_SYS{'>'}</span>
            <input style={{flex:1, background:'transparent', border:'none', color:'#fff', fontSize:13, outline:'none'}} placeholder="Enter surgical protocol..." value={cmdText} onChange={e=>setCmdText(e.target.value)}/>
          </form>
        </div>
      </div>

      {/* RIGHT: CHARTS & DISCUSSION */}
      <div style={{display:'flex', flexDirection:'column', gap:12, overflow:'hidden'}}>
        <div className="card" style={{flex:0.7, display:'flex', flexDirection:'column', overflow:'hidden', padding:0}}>
          <div style={{padding:12, borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:800, color:'var(--accent2)', letterSpacing:1}}>👥 SUBJECT CHARTS</div>
          <div style={{flex:1, overflowY:'auto', padding:12}}>
            {(players.length?players:[{name:user.name,role:myRole}]).map((p,i) => (
              <div key={i} style={{padding:'10px 15px', background:'var(--bg3)', borderRadius:10, marginBottom:8, display:'flex', alignItems:'center', gap:12, border:'1px solid '+(p.name===user.name?'var(--accent)':'transparent')}}>
                <div style={{fontSize:20}}>{ROLE_ICONS[p.role]||'🩺'}</div>
                <div>
                  <div style={{fontSize:13, fontWeight:800}}>{p.name}</div>
                  <div style={{fontSize:10, color:'var(--text3)', fontWeight:700}}>{p.role.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{flex:1.3, display:'flex', flexDirection:'column', overflow:'hidden', padding:0}}>
          <div style={{padding:12, borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:800, color:'var(--accent3)', letterSpacing:1}}>💬 DISCUSSION</div>
          <div style={{flex:1, overflowY:'auto', padding:15, display:'flex', flexDirection:'column', gap:12}}>
            {chat.map((m,i) => (
              <div key={i} style={{alignSelf: m.from===user.name?'flex-end':'flex-start', maxWidth:'85%'}}>
                <div style={{padding:'8px 12px', background:m.from===user.name?'var(--accent)':'var(--bg3)', borderRadius:12, fontSize:12, color:m.from===user.name?'#0a0e1a':'var(--text)'}}>{m.text}</div>
                <div style={{fontSize:9, color:'var(--text3)', marginTop:5, textAlign: m.from===user.name?'right':'left', fontWeight:700}}>{m.from.toUpperCase()} · {m.ts}</div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendChat} style={{padding:12, borderTop:'1px solid var(--border)', display:'flex', gap:10}}>
            <input style={{flex:1, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 15px', color:'var(--text)', fontSize:12, outline:'none'}} placeholder="Type to team..." value={chatText} onChange={e=>setChatText(e.target.value)}/>
            <button type="submit" className="btn btn-primary btn-sm">SEND</button>
          </form>
        </div>
      </div>
    </div>
  );
}
`;

if (a !== -1 && b !== -1) {
  h = h.slice(0, a) + NEW_MULTI + h.slice(b);
  fs.writeFileSync('index.html', h);
  console.log('✓ Fixed Create Team Button, Emojis, and Game States!');
} else {
  console.log('ERROR: Multiplayer component not found');
}
