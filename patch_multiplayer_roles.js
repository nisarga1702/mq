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
  
  const TOOLS = {
    'Doctor':          [{ name:'Vitals', action:'check vitals', icon:'🩺' }, { name:'Epi', action:'epinephrine', icon:'💉' }, { name:'Defib', action:'defibrillate', icon:'⚡' }, { name:'Stethoscope', action:'stetho', icon:'🎧' }],
    'Surgeon':         [{ name:'Incision', action:'incision', icon:'✂️' }, { name:'Suture', action:'suture', icon:'🧵' }, { name:'Hemostasis', action:'hemo', icon:'🩸' }, { name:'Suction', action:'suction', icon:'🌪️' }],
    'Anaesthetic':     [{ name:'Intubate', action:'intubate', icon:'🌬️' }, { name:'Propofol', action:'propofol', icon:'🧪' }, { name:'Oxygen', action:'oxygen', icon:'💨' }, { name:'Pulse Ox', action:'pulseox', icon:'📈' }],
    'Assistant Intern':[{ name:'IV Fluids', action:'iv', icon:'💧' }, { name:'Pressure', action:'pressure', icon:'🤲' }, { name:'Gauze', action:'gauze', icon:'🩹' }, { name:'Retract', action:'retract', icon:'🪝' }]
  };

  // ── Socket.io ──
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

  // ── Three.js Label Creation Helper ──
  function createTextLabel(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256; canvas.height = 64;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(0, 0, 256, 64, 10);
    ctx.fill();
    ctx.strokeStyle = color || '#6366f1';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.4, 1);
    return sprite;
  }

  // ── Three.js Scene ──
  React.useEffect(() => {
    if (view !== 'room' || !canvasRef.current) return;
    const el = canvasRef.current;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(6, 5, 8);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.1;

    scene.add(new THREE.AmbientLight(0x334466, 0.8));
    const spot = new THREE.SpotLight(0xffffff, 3);
    spot.position.set(0, 10, 0);
    spot.castShadow = true;
    scene.add(spot);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x0d1117 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Hospital Bed Group
    const bedGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const bedMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 4.6), frameMat);
    frame.position.y = 0.2; frame.castShadow = true;
    bedGroup.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 4.3), bedMat);
    mattress.position.y = 0.43; mattress.castShadow = true;
    bedGroup.add(mattress);
    scene.add(bedGroup);

    // Patient body
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af }));
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 0.6, 0.2);
    torso.castShadow = true;
    scene.add(torso);
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af }));
    pHead.position.set(0, 0.62, -1.5);
    scene.add(pHead);
    // Patient Label
    const pLabel = createTextLabel('PATIENT', '#f43f5e');
    pLabel.position.set(0, 1.2, 0);
    scene.add(pLabel);

    // Avatars for Players
    const avatarGroup = new THREE.Group();
    players.forEach((p, i) => {
      const av = new THREE.Group();
      const roleColor = p.role==='Surgeon'?'#f87171':p.role==='Anaesthetic'?'#818cf8':p.role==='Assistant Intern'?'#34d399':'#6366f1';
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16), new THREE.MeshStandardMaterial({ color: roleColor, emissive: roleColor, emissiveIntensity: 0.2 }));
      body.position.y = 0.8;
      av.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfda4af }));
      head.position.y = 1.3;
      av.add(head);
      
      // Label
      const label = createTextLabel(\`\${p.name} (\${p.role})\`, roleColor);
      label.position.y = 1.8;
      av.add(label);

      const ang = (i / Math.max(1, players.length)) * Math.PI * 2;
      av.position.set(Math.cos(ang)*3, 0, Math.sin(ang)*3);
      avatarGroup.add(av);
    });
    scene.add(avatarGroup);

    // Grid helper
    scene.add(new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b));

    // OBJ Loader (if available)
    if (window.THREE && THREE.OBJLoader) {
      new THREE.OBJLoader().load('/hackthonnn.obj', obj => {
        obj.scale.setScalar(0.02); obj.position.set(0, -0.5, 0);
        obj.traverse(c => { if(c.isMesh) { c.material = new THREE.MeshStandardMaterial({ color: 0x334155 }); c.receiveShadow = true; } });
        scene.add(obj);
      });
    }

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      torso.position.y = 0.6 + Math.sin(t * 2) * 0.01;
      avatarGroup.children.forEach((av, i) => { av.position.y = Math.sin(t * 1.5 + i) * 0.05; av.lookAt(0,0,0); });
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth/el.clientHeight; camera.updateProjectionMatrix(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); renderer.dispose(); if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement); };
  }, [view, players]);

  function createRoom() {
    const name = prompt('Room Name:');
    if(!name) return;
    const id = 'R' + Math.floor(Math.random()*900 + 100);
    setAvailableRooms(p => [...p, { id, name, host: user.name, members: 1, max: 5, case: 'General Surgery' }]);
    setRoomId(id); setView('room');
    notify('Room Created: ' + name, 'success');
  }

  function sendAction(action) {
    const entry = { user: user.name, action, time: new Date().toLocaleTimeString(), classification: Math.random() > 0.8 ? 'DANGER' : 'OK' };
    setHistory(p => [...p, entry]);
    setVitals(v => ({ ...v, hr: v.hr + (Math.random()-0.5)*10 }));
    setCmdText('');
  }

  function sendChat(e) {
    e.preventDefault(); if(!chatText.trim()) return;
    const msg = { from: user.name, text: chatText, ts: new Date().toLocaleTimeString() };
    setChat(p => [...p, msg]); setChatText('');
  }

  if (view === 'lobby') return (
    <div className="page-content fade-in">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:800}}>👥 Multiplayer OR Lobby</h2>
          <p style={{color:'var(--text2)'}}>Collaborate with other medical professionals in real-time</p>
        </div>
        <button className="btn btn-primary" onClick={createRoom}>+ Create Team Room</button>
      </div>

      <div style={{marginBottom:24}}>
        <label style={{fontSize:12, color:'var(--text3)', marginBottom:8, display:'block'}}>SELECT YOUR ROLE</label>
        <div style={{display:'flex', gap:10}}>
          {ROLES.map(r => (
            <button key={r} className="btn btn-sm" style={{borderRadius:20, background:myRole===r?'var(--accent)':'transparent', color:myRole===r?'#0a0e1a':'var(--text)', border:'1px solid var(--border)'}} onClick={() => setMyRole(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid g2">
        {availableRooms.map(r => (
          <div key={r.id} className="card" style={{borderColor:roomId===r.id?'var(--accent)':'var(--border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontWeight:700}}>{r.name}</span>
              <span style={{fontSize:10, padding:'2px 8px', borderRadius:4, background:'rgba(52,211,153,0.1)', color:'var(--success)'}}>ACTIVE</span>
            </div>
            <div style={{fontSize:13, color:'var(--text2)', marginBottom:8}}>💉 Case: {r.case}</div>
            <div style={{fontSize:12, color:'var(--text3)', marginBottom:12}}>Host: {r.host} · {r.members}/{r.max} Members</div>
            <button className="btn btn-outline btn-sm btn-block" onClick={() => { setRoomId(r.id); setView('room'); }}>Join Team →</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{display:'grid', gridTemplateColumns:'260px 1fr 280px', gap:12, height:'calc(100vh - 100px)', overflow:'hidden'}}>
      {/* LEFT: TEAM */}
      <div className="card" style={{display:'flex', flexDirection:'column', gap:12, padding:12}}>
        <div style={{fontSize:11, fontWeight:800, color:'var(--accent)', marginBottom:8}}>👥 SURGICAL TEAM</div>
        {players.map((p,i) => (
          <div key={i} style={{padding:10, background:'var(--bg3)', borderRadius:8, border:p.name===user.name?'1px solid var(--accent)':'none'}}>
            <div style={{fontSize:13, fontWeight:600}}>{p.name} {p.name===user.name && '(You)'}</div>
            <div style={{fontSize:10, color:'var(--text3)'}}>{p.role}</div>
          </div>
        ))}
        <div style={{flex:1}}/>
        <button className="btn btn-outline btn-sm" onClick={() => setView('lobby')}>← Back to Lobby</button>
      </div>

      {/* CENTER: SIMULATION */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <div style={{background:'#000', borderRadius:12, padding:12, display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'2px solid #1e293b'}}>
          <div style={{borderRight:'1px solid #1e293b'}}><div style={{fontSize:9,color:'#f43f5e'}}>HR</div><div style={{fontSize:24,color:'#f43f5e',fontFamily:'monospace'}}>{vitals.hr.toFixed(0)}</div></div>
          <div style={{borderRight:'1px solid #1e293b'}}><div style={{fontSize:9,color:'#10b981'}}>BP</div><div style={{fontSize:20,color:'#10b981',fontFamily:'monospace'}}>{vitals.bp}</div></div>
          <div style={{borderRight:'1px solid #1e293b'}}><div style={{fontSize:9,color:'#3b82f6'}}>SPO2</div><div style={{fontSize:20,color:'#3b82f6',fontFamily:'monospace'}}>{vitals.spo2}%</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:11,color:'var(--success)'}}>{vitals.status}</div></div>
        </div>
        
        <div ref={canvasRef} style={{flex:1, background:'#000', borderRadius:12, overflow:'hidden', border:'1px solid #1e293b'}}/>

        <div className="card" style={{padding:12, background:'rgba(0,0,0,0.8)'}}>
          <div style={{display:'flex', justifyContent:'center', gap:8, marginBottom:10}}>
            {(TOOLS[myRole] || TOOLS.Doctor).map((t,i) => (
              <button key={i} onClick={() => sendAction(t.action)} className="tool-btn-small" style={{background:'rgba(255,255,255,0.05)', border:'1px solid #334155', color:'#fff', padding:'8px 12px', borderRadius:10, minWidth:75}}>
                <div style={{fontSize:18}}>{t.icon}</div>
                <div style={{fontSize:9, fontWeight:800}}>{t.name.toUpperCase()}</div>
              </button>
            ))}
          </div>
          <form onSubmit={e => {e.preventDefault(); sendAction(cmdText);}} style={{display:'flex', background:'#000', padding:'8px 12px', borderRadius:10, border:'1px solid #334155'}}>
            <span style={{color:'#6366f1', fontFamily:'monospace', fontSize:12, marginRight:8}}>{'OR>'}</span>
            <input style={{flex:1, background:'transparent', border:'none', color:'#fff', fontSize:13}} placeholder="EXECUTE ACTION..." value={cmdText} onChange={e=>setCmdText(e.target.value)}/>
          </form>
        </div>
      </div>

      {/* RIGHT: LOGS & CHAT */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <div className="card" style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <div style={{fontSize:11, fontWeight:800, color:'var(--text3)', padding:12}}>📋 LOGS</div>
          <div style={{flex:1, overflowY:'auto', padding:'0 12px 12px'}}>
            {history.slice().reverse().map((h,i) => (
              <div key={i} style={{fontSize:11, padding:8, background:'var(--bg3)', borderRadius:8, marginBottom:6, borderLeft:'3px solid '+(h.classification==='DANGER'?'#f43f5e':'#10b981')}}>
                <div style={{fontWeight:700}}>{h.user}</div><div>{h.action}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <div style={{fontSize:11, fontWeight:800, color:'var(--text3)', padding:12}}>💬 CHAT</div>
          <div style={{flex:1, overflowY:'auto', padding:'0 12px 12px'}}>
            {chat.map((m,i) => (
              <div key={i} style={{marginBottom:8, textAlign:m.from===user.name?'right':'left'}}>
                <div style={{display:'inline-block', padding:'6px 10px', background:m.from===user.name?'var(--accent)':'var(--bg3)', borderRadius:8, fontSize:12, color:m.from===user.name?'#0a0e1a':'var(--text)'}}>{m.text}</div>
                <div style={{fontSize:9, color:'var(--text3)', marginTop:2}}>{m.from}</div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendChat} style={{padding:12, display:'flex', gap:6}}>
            <input style={{flex:1, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:12}} placeholder="Chat..." value={chatText} onChange={e=>setChatText(e.target.value)}/>
            <button type="submit" className="btn btn-primary" style={{padding:'6px 12px'}}>➤</button>
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
  console.log('✓ Multiplayer updated with Lobby, Role-based tools, and Avatar Labels!');
} else {
  console.log('ERROR: Boundaries not found');
}
