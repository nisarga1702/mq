const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. Change Logo Icon
h = h.replace('<div className="logo-icon">M</div>', '<div className="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>');

// 2. Patch Multiplayer for Layout and Create Button
const a = h.indexOf('function Multiplayer');
const b = h.indexOf('function Leaderboard', a);

const NEW_MULTI = `function Multiplayer({ user }) {
  const [view, setView] = React.useState('lobby');
  const [roomId, setRoomId] = React.useState('main-theater');
  const [players, setPlayers] = React.useState([]);
  const [vitals, setVitals] = React.useState({ hr: 72, bp: '120/80', spo2: 98, status: 'STABLE' });
  const [history, setHistory] = React.useState([]);
  const [chat, setChat] = React.useState([]);
  const [chatText, setChatText] = React.useState('');
  const [cmdText, setCmdText] = React.useState('');
  const [mission, setMission] = React.useState({ 
    title: 'Post-Op Hemorrhage', 
    details: 'Patient 58M, undergoing recovery. Sudden drop in BP (80/50). Suspected internal bleeding.',
    objective: 'Stabilize vitals and identify source of bleeding.'
  });
  const [myRole, setMyRole] = React.useState('Doctor');
  const [availableRooms, setAvailableRooms] = React.useState([
    { id:'R001', name:'Cardiology OR', host:'Dr. Priya', members:2, max:5, case:'Chest Pain — 58M' },
    { id:'R002', name:'Emergency Bay', host:'Dr. Arjun', members:3, max:4, case:'Polytrauma — 34F' }
  ]);
  
  const canvasRef = React.useRef(null);
  const sceneRef = React.useRef(null);
  const socketRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  const ROLE_ICONS = { 'Doctor':'🩺', 'Surgeon':'✂️', 'Anaesthetic':'🌬️', 'Assistant Intern':'🎓' };
  const TOOLS = {
    'Doctor':          [{ name:'Vitals', action:'check vitals', icon:'🩺' }, { name:'Epi', action:'epinephrine', icon:'💉' }, { name:'Defib', action:'defibrillate', icon:'⚡' }, { name:'Stethoscope', action:'stetho', icon:'🎧' }],
    'Surgeon':         [{ name:'Incision', action:'incision', icon:'✂️' }, { name:'Suture', action:'suture', icon:'🧵' }, { name:'Hemostasis', action:'hemo', icon:'🩸' }, { name:'Suction', action:'suction', icon:'🌪️' }],
    'Anaesthetic':     [{ name:'Intubate', action:'intubate', icon:'🌬️' }, { name:'Propofol', action:'propofol', icon:'🧪' }, { name:'Oxygen', action:'oxygen', icon:'💨' }, { name:'Pulse Ox', action:'pulseox', icon:'📈' }],
    'Assistant Intern':[{ name:'IV Fluids', action:'iv', icon:'💧' }, { name:'Pressure', action:'pressure', icon:'🤲' }, { name:'Gauze', action:'gauze', icon:'🩹' }, { name:'Retract', action:'retract', icon:'🪝' }]
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

  function createTextLabel(text, subtext, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300; canvas.height = 80;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    const x=0, y=0, w=300, h=80, r=12;
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color || '#6366f1'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px DM Sans'; ctx.textAlign = 'center'; ctx.fillText(text, 150, 35);
    ctx.fillStyle = color || '#818cf8'; ctx.font = '600 16px DM Sans'; ctx.fillText(subtext, 150, 65);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.5, 1);
    return sprite;
  }

  React.useEffect(() => {
    if (view !== 'room' || !canvasRef.current) return;
    const el = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0e1a);
    const camera = new THREE.PerspectiveCamera(55, el.clientWidth/el.clientHeight, 0.1, 100);
    camera.position.set(6, 5, 8);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.AmbientLight(0x445577, 1.2));
    const spot = new THREE.SpotLight(0xffffff, 2); spot.position.set(0, 10, 0); scene.add(spot);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 4.6), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    scene.add(bed);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af }));
    torso.rotation.x = Math.PI/2; torso.position.y = 0.5; scene.add(torso);
    
    const activePlayers = [...players];
    if(!activePlayers.find(p=>p.name===user.name)) activePlayers.push({ name:user.name, role:myRole });
    const avatarGroup = new THREE.Group();
    activePlayers.forEach((p, i) => {
      const av = new THREE.Group();
      const roleColor = p.role==='Surgeon'?'#f87171':p.role==='Anaesthetic'?'#818cf8':p.role==='Assistant Intern'?'#34d399':'#6366f1';
      av.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16), new THREE.MeshStandardMaterial({ color: roleColor })));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af })); head.position.y = 0.5; av.add(head);
      const label = createTextLabel(p.name, (ROLE_ICONS[p.role]||'🩺') + ' ' + p.role, roleColor); label.position.y = 1.0; av.add(label);
      const ang = (i / Math.max(1, activePlayers.length)) * Math.PI * 2;
      av.position.set(Math.cos(ang)*3, 0, Math.sin(ang)*3);
      avatarGroup.add(av);
    });
    scene.add(avatarGroup);
    scene.add(new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b));
    if (window.THREE && THREE.OBJLoader) {
      new THREE.OBJLoader().load('/hackthonnn.obj', obj => {
        obj.scale.setScalar(0.02); obj.position.y = -0.5;
        obj.traverse(c => { if(c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x334155 }); });
        scene.add(obj);
      });
    }
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      avatarGroup.children.forEach((av, i) => { av.lookAt(0,0,0); });
      controls.update(); renderer.render(scene, camera);
    }
    animate();
    return () => { cancelAnimationFrame(raf); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [view, players, myRole]);

  function createRoom() {
    const name = prompt('Enter Team Name:');
    if(!name) return;
    const id = 'R' + Date.now().toString().slice(-4);
    const newRoom = { id, name, host: user.name, members: 1, max: 4, case: 'Acute Trauma' };
    setAvailableRooms(p => [newRoom, ...p]);
    setRoomId(id);
    setView('room');
    notify('Team ' + name + ' created!', 'success');
  }

  function sendAction(action) {
    setHistory(p => [...p, { user: user.name, action, time: new Date().toLocaleTimeString(), classification: 'OK' }]);
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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <div><h2 style={{fontSize:22,fontWeight:800}}>👥 Multiplayer OR Lobby</h2><p style={{color:'var(--text2)'}}>Select role and join a team</p></div>
        <button className="btn btn-primary btn-lg" onClick={createRoom}>+ Create New Team</button>
      </div>
      <div style={{marginBottom:24}}>
        <label style={{fontSize:12, color:'var(--text3)', marginBottom:8, display:'block'}}>YOUR SPECIALIZATION</label>
        <div style={{display:'flex', gap:10}}>
          {['Doctor', 'Surgeon', 'Anaesthetic', 'Assistant Intern'].map(r => (
            <button key={r} className="btn btn-sm" style={{borderRadius:20, background:myRole===r?'var(--accent)':'transparent', color:myRole===r?'#0a0e1a':'var(--text)', border:'1px solid var(--border)'}} onClick={() => setMyRole(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="grid g2">
        {availableRooms.map(r => (
          <div key={r.id} className="card" style={{borderColor:roomId===r.id?'var(--accent)':'var(--border)'}}>
            <div style={{fontWeight:700,marginBottom:4}}>{r.name}</div>
            <div style={{fontSize:12, color:'var(--text3)', marginBottom:12}}>Case: {r.case} · {r.members}/{r.max} Slots</div>
            <button className="btn btn-outline btn-sm btn-block" onClick={() => { setRoomId(r.id); setView('room'); }}>Join Operation →</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{display:'grid', gridTemplateColumns:'280px 1fr 300px', gap:12, height:'calc(100vh - 100px)', overflow:'hidden'}}>
      {/* LEFT: LOGS */}
      <div className="card" style={{display:'flex', flexDirection:'column', overflow:'hidden', padding:0}}>
        <div style={{padding:12, borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:800, color:'var(--accent)'}}>📋 SUBJECT LOGS</div>
        <div style={{flex:1, overflowY:'auto', padding:12}}>
          {history.slice().reverse().map((h,i) => (
            <div key={i} style={{fontSize:11, padding:10, background:'var(--bg3)', borderRadius:8, marginBottom:8, borderLeft:'3px solid var(--accent)'}}>
              <div style={{fontWeight:700, color:'var(--text)'}}>{h.user}</div>
              <div style={{color:'var(--text2)', marginTop:2}}>{h.action}</div>
              <div style={{fontSize:9, color:'var(--text3)', marginTop:4, textAlign:'right'}}>{h.time}</div>
            </div>
          ))}
          {!history.length && <div style={{textAlign:'center', color:'var(--text3)', marginTop:40, fontSize:12}}>Awaiting actions...</div>}
        </div>
        <button className="btn btn-outline btn-sm" style={{margin:12}} onClick={() => setView('lobby')}>← Exit to Lobby</button>
      </div>

      {/* CENTER: SIMULATION */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <div style={{background:'#000', borderRadius:12, padding:12, display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'2px solid #1e293b'}}>
          <div><div style={{fontSize:9,color:'#f43f5e'}}>HR (BPM)</div><div style={{fontSize:22,color:'#f43f5e',fontFamily:'monospace'}}>{vitals.hr.toFixed(0)}</div></div>
          <div><div style={{fontSize:9,color:'#10b981'}}>BP (mmHg)</div><div style={{fontSize:22,color:'#10b981',fontFamily:'monospace'}}>{vitals.bp}</div></div>
          <div><div style={{fontSize:9,color:'#3b82f6'}}>SPO2 (%)</div><div style={{fontSize:22,color:'#3b82f6',fontFamily:'monospace'}}>{vitals.spo2}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:11,color:'var(--success)',fontWeight:800}}>{vitals.status}</div><div style={{fontSize:9,color:'var(--text3)'}}>SIM ACTIVE</div></div>
        </div>
        
        <div ref={canvasRef} style={{flex:1, background:'#000', borderRadius:12, overflow:'hidden', border:'1px solid #1e293b', position:'relative'}}>
          {/* Right Corner Below: Mission/Objective Overlay */}
          <div style={{position:'absolute', bottom:12, right:12, width:240, background:'rgba(10,14,26,0.85)', padding:12, borderRadius:12, border:'1px solid var(--accent2)', zIndex:10, backdropFilter:'blur(4px)'}}>
            <div style={{fontSize:10, fontWeight:800, color:'var(--accent2)', marginBottom:4, textTransform:'uppercase'}}>Current Objective</div>
            <div style={{fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6}}>{mission.title}</div>
            <div style={{fontSize:11, color:'var(--text2)', lineHeight:1.4, marginBottom:8}}>{mission.details}</div>
            <div style={{fontSize:11, color:'var(--accent)', fontWeight:600}}>Goal: {mission.objective}</div>
          </div>
        </div>

        <div className="card" style={{padding:12, background:'rgba(0,0,0,0.9)'}}>
          <div style={{display:'flex', justifyContent:'center', gap:8, marginBottom:10}}>
            {(TOOLS[myRole] || TOOLS.Doctor).map((t,i) => (
              <button key={i} onClick={() => sendAction(t.action)} style={{background:'rgba(255,255,255,0.05)', border:'1px solid #334155', color:'#fff', padding:'8px 12px', borderRadius:10, minWidth:75, cursor:'pointer'}}>
                <div style={{fontSize:18}}>{t.icon}</div><div style={{fontSize:9, fontWeight:800}}>{t.name.toUpperCase()}</div>
              </button>
            ))}
          </div>
          <form onSubmit={e => {e.preventDefault(); sendAction(cmdText);}} style={{display:'flex', background:'#000', padding:'8px 12px', borderRadius:10, border:'1px solid #334155'}}>
            <span style={{color:'#6366f1', fontSize:12, marginRight:8, fontWeight:800}}>{'OR-CLI>'}</span>
            <input style={{flex:1, background:'transparent', border:'none', color:'#fff', fontSize:13, outline:'none'}} placeholder="Enter surgical command..." value={cmdText} onChange={e=>setCmdText(e.target.value)}/>
          </form>
        </div>
      </div>

      {/* RIGHT: CHARTS (TEAM) & DISCUSSION */}
      <div style={{display:'flex', flexDirection:'column', gap:12, overflow:'hidden'}}>
        <div className="card" style={{flex:0.8, display:'flex', flexDirection:'column', overflow:'hidden', padding:0}}>
          <div style={{padding:12, borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:800, color:'var(--accent2)'}}>👥 SUBJECT CHARTS (TEAM)</div>
          <div style={{flex:1, overflowY:'auto', padding:10}}>
            {(players.length?players:[{name:user.name,role:myRole}]).map((p,i) => (
              <div key={i} style={{padding:'8px 12px', background:'var(--bg3)', borderRadius:8, marginBottom:6, display:'flex', alignItems:'center', gap:10}}>
                <div style={{fontSize:16}}>{ROLE_ICONS[p.role]||'🩺'}</div>
                <div>
                  <div style={{fontSize:12, fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:10, color:'var(--text3)'}}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card" style={{flex:1.2, display:'flex', flexDirection:'column', overflow:'hidden', padding:0}}>
          <div style={{padding:12, borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:800, color:'var(--accent3)'}}>💬 DISCUSSION</div>
          <div style={{flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:10}}>
            {chat.map((m,i) => (
              <div key={i} style={{alignSelf: m.from===user.name?'flex-end':'flex-start', maxWidth:'90%'}}>
                <div style={{padding:'6px 12px', background:m.from===user.name?'var(--accent)':'var(--bg3)', borderRadius:8, fontSize:12, color:m.from===user.name?'#0a0e1a':'var(--text)'}}>{m.text}</div>
                <div style={{fontSize:9, color:'var(--text3)', marginTop:4, textAlign: m.from===user.name?'right':'left'}}>{m.from} · {m.ts}</div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendChat} style={{padding:12, borderTop:'1px solid var(--border)', display:'flex', gap:8}}>
            <input style={{flex:1, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontSize:12, outline:'none'}} placeholder="Type discussion..." value={chatText} onChange={e=>setChatText(e.target.value)}/>
            <button type="submit" className="btn btn-primary btn-sm">➤</button>
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
  console.log('✓ Icon changed and Multiplayer UI rearranged as requested!');
} else {
  console.log('ERROR: Multiplayer component not found');
}
