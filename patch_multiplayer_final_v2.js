const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const a = h.indexOf('function Multiplayer');
const b = h.indexOf('/* ==================== LEADERBOARD', a);

const NEW_MULTI = `function Multiplayer({ user }) {
  const [view, setView] = React.useState('lobby');
  const [roomId, setRoomId] = React.useState('main-theater');
  const [players, setPlayers] = React.useState([]);
  const [vitals, setVitals] = React.useState({ hr: 72, bp: '120/80', spo2: 98, status: 'STABLE' });
  const [history, setHistory] = React.useState([]);
  const [chat, setChat] = React.useState([]);
  const [chatText, setChatText] = React.useState('');
  const [cmdText, setCmdText] = React.useState('');
  const [mission, setMission] = React.useState({ title: 'Awaiting Team...', details: 'Join and wait for team to start the operation.' });
  const [myRole, setMyRole] = React.useState('Doctor');
  const [availableRooms, setAvailableRooms] = React.useState([
    { id:'R001', name:'Cardiology OR', host:'Dr. Priya', members:2, max:5, case:'Chest Pain — 58M' },
    { id:'R002', name:'Emergency Bay', host:'Dr. Arjun', members:3, max:4, case:'Polytrauma — 34F' }
  ]);
  
  const canvasRef = React.useRef(null);
  const sceneRef = React.useRef(null);
  const socketRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  const ROLES = ['Doctor', 'Surgeon', 'Anaesthetic', 'Assistant Intern'];
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
  }, [roomId, myRole]);

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  function createTextLabel(text, subtext, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300; canvas.height = 80;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    // Manual roundRect for older environments
    const x=0, y=0, w=300, h=80, r=12;
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color || '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText(text, 150, 35);
    
    ctx.fillStyle = color || '#818cf8';
    ctx.font = '600 16px DM Sans';
    ctx.fillText(subtext, 150, 65);
    
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.5, 1);
    return sprite;
  }

  React.useEffect(() => {
    if (view !== 'room' || !canvasRef.current) return;
    const el = canvasRef.current;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 100);
    camera.position.set(6, 5, 8);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.AmbientLight(0x445577, 1));
    const spot = new THREE.SpotLight(0xffffff, 2); spot.position.set(0, 10, 0); scene.add(spot);

    // Bed & Patient
    const bedGroup = new THREE.Group();
    bedGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 4.6), new THREE.MeshStandardMaterial({ color: 0x94a3b8 })));
    scene.add(bedGroup);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af }));
    torso.rotation.x = Math.PI/2; torso.position.y = 0.5; scene.add(torso);
    const pLabel = createTextLabel('PATIENT', 'Status: Stable', '#f43f5e');
    pLabel.position.y = 1.2; scene.add(pLabel);

    const activePlayers = [...players];
    if(!activePlayers.find(p=>p.name===user.name)) activePlayers.push({ name:user.name, role:myRole });

    const avatarGroup = new THREE.Group();
    activePlayers.forEach((p, i) => {
      const av = new THREE.Group();
      const roleColor = p.role==='Surgeon'?'#f87171':p.role==='Anaesthetic'?'#818cf8':p.role==='Assistant Intern'?'#34d399':'#6366f1';
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16), new THREE.MeshStandardMaterial({ color: roleColor, emissive: roleColor, emissiveIntensity: 0.2 }));
      body.position.y = 0.8; av.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af }));
      head.position.y = 1.3; av.add(head);
      
      const label = createTextLabel(p.name, (ROLE_ICONS[p.role]||'🩺') + ' ' + p.role, roleColor);
      label.position.y = 1.8; av.add(label);

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
      const t = performance.now()*0.001;
      avatarGroup.children.forEach((av, i) => { av.position.y = Math.sin(t*1.5 + i)*0.05; av.lookAt(0,0,0); });
      controls.update(); renderer.render(scene, camera);
    }
    animate();
    return () => { cancelAnimationFrame(raf); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [view, players, myRole]);

  function createRoom() {
    const name = prompt('Room Name:'); if(!name) return;
    const id = 'R' + Math.floor(Math.random()*900 + 100);
    setAvailableRooms(p => [...p, { id, name, host: user.name, members: 1, max: 5, case: 'Emergency Surgery' }]);
    setRoomId(id); setView('room');
  }

  function sendAction(action) {
    setHistory(p => [...p, { user: user.name, action, time: new Date().toLocaleTimeString(), classification: 'OK' }]);
    setCmdText('');
  }

  if (view === 'lobby') return (
    <div className="page-content fade-in">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <div><h2 style={{fontSize:22,fontWeight:800}}>👥 Multiplayer OR Lobby</h2><p style={{color:'var(--text2)'}}>Select role and join a team</p></div>
        <button className="btn btn-primary" onClick={createRoom}>+ Create Team Room</button>
      </div>
      <div style={{marginBottom:24}}>
        <label style={{fontSize:12, color:'var(--text3)', marginBottom:8, display:'block'}}>YOUR ROLE</label>
        <div style={{display:'flex', gap:10}}>
          {ROLES.map(r => (
            <button key={r} className="btn btn-sm" style={{borderRadius:20, background:myRole===r?'var(--accent)':'transparent', color:myRole===r?'#0a0e1a':'var(--text)', border:'1px solid var(--border)'}} onClick={() => setMyRole(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="grid g2">
        {availableRooms.map(r => (
          <div key={r.id} className="card" style={{borderColor:roomId===r.id?'var(--accent)':'var(--border)'}}>
            <div style={{fontWeight:700,marginBottom:4}}>{r.name}</div>
            <div style={{fontSize:12, color:'var(--text3)', marginBottom:12}}>{r.case} · {r.members}/{r.max} Members</div>
            <button className="btn btn-outline btn-sm btn-block" onClick={() => { setRoomId(r.id); setView('room'); }}>Join Team →</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{display:'grid', gridTemplateColumns:'260px 1fr 280px', gap:12, height:'calc(100vh - 100px)', overflow:'hidden'}}>
      <div className="card" style={{padding:12, display:'flex', flexDirection:'column', gap:8, overflow:'hidden'}}>
        <div style={{fontSize:11, fontWeight:800, color:'var(--accent)'}}>👥 TEAM</div>
        <div style={{flex:1, overflowY:'auto'}}>
          {(players.length?players:[{name:user.name,role:myRole}]).map((p,i) => (
            <div key={i} style={{padding:8, background:'var(--bg3)', borderRadius:8, fontSize:12, fontWeight:600, marginBottom:8}}>
              {ROLE_ICONS[p.role]||'🩺'} {p.name} <br/>
              <span style={{fontSize:9,color:'var(--text3)',fontWeight:400}}>{p.role}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setView('lobby')}>← Lobby</button>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <div style={{background:'#000', borderRadius:12, padding:10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid #1e293b'}}>
          <div style={{fontSize:18,color:'#f43f5e',fontFamily:'monospace'}}>{vitals.hr.toFixed(0)} HR</div>
          <div style={{fontSize:18,color:'#10b981',fontFamily:'monospace'}}>{vitals.bp} BP</div>
          <div style={{fontSize:18,color:'#3b82f6',fontFamily:'monospace'}}>{vitals.spo2}% O2</div>
          <div style={{textAlign:'right',fontSize:12,color:'var(--success)'}}>{vitals.status}</div>
        </div>
        <div ref={canvasRef} style={{flex:1, background:'#000', borderRadius:12, overflow:'hidden', border:'1px solid #1e293b'}}/>
        <div className="card" style={{padding:12, background:'rgba(0,0,0,0.8)'}}>
          <div style={{display:'flex', justifyContent:'center', gap:8, marginBottom:10}}>
            {(TOOLS[myRole] || TOOLS.Doctor).map((t,i) => (
              <button key={i} onClick={() => sendAction(t.action)} style={{background:'rgba(255,255,255,0.05)', border:'1px solid #334155', color:'#fff', padding:'8px 12px', borderRadius:10, minWidth:75, cursor:'pointer'}}>
                <div style={{fontSize:18}}>{t.icon}</div><div style={{fontSize:9, fontWeight:800}}>{t.name.toUpperCase()}</div>
              </button>
            ))}
          </div>
          <form onSubmit={e => {e.preventDefault(); sendAction(cmdText);}} style={{display:'flex', background:'#000', padding:'8px 12px', borderRadius:10, border:'1px solid #334155'}}>
            <span style={{color:'#6366f1', fontSize:12, marginRight:8}}>{'OR>'}</span>
            <input style={{flex:1, background:'transparent', border:'none', color:'#fff', fontSize:13}} placeholder="EXECUTE ACTION..." value={cmdText} onChange={e=>setCmdText(e.target.value)}/>
          </form>
        </div>
      </div>
      <div className="card" style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <div style={{fontSize:11, fontWeight:800, color:'var(--text3)', padding:10}}>💬 CHAT & LOGS</div>
        <div style={{flex:1, overflowY:'auto', padding:10}}>
          {history.slice().reverse().map((h,i) => <div key={i} style={{fontSize:11, padding:6, background:'var(--bg3)', borderRadius:6, marginBottom:4}}><b>{h.user}:</b> {h.action}</div>)}
        </div>
        <form onSubmit={sendChat} style={{padding:10, display:'flex', gap:6}}>
          <input style={{flex:1, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:12}} placeholder="Chat..." value={chatText} onChange={e=>setChatText(e.target.value)}/>
          <button type="submit" className="btn btn-primary">➤</button>
        </form>
      </div>
    </div>
  );
}
`;

if (a !== -1 && b !== -1) {
  h = h.slice(0, a) + NEW_MULTI + h.slice(b);
  fs.writeFileSync('index.html', h);
  console.log('✓ Multiplayer final polish applied correctly!');
} else {
  console.log('ERROR: Boundaries not found');
}
