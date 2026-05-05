const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add Three.js + OBJLoader CDN imports to <head>
const headInsert = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
`;
html = html.replace('</head>', headInsert + '</head>');

// New Multiplayer component
const NEW_MULTI = `/* ==================== MULTIPLAYER ==================== */
function Multiplayer({ user }) {
  const [view, setView] = useState('lobby');
  const [roomId] = useState('main-theater');
  const [players, setPlayers] = useState([]);
  const [vitals, setVitals] = useState({ hr: 72, bp: '120/80', spo2: 98, status: 'STABLE' });
  const [history, setHistory] = useState([]);
  const [chat, setChat] = useState([]);
  const [chatText, setChatText] = useState('');
  const [cmdText, setCmdText] = useState('');
  const [gameState, setGameState] = useState('WAITING');
  const [mission, setMission] = useState({ title: 'Awaiting Team...', details: 'Join and wait for team to start the operation.' });
  const [timeLeft, setTimeLeft] = useState(0);
  const [myRole, setMyRole] = useState('Doctor');
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // ── Socket.io ──
  useEffect(() => {
    const skt = window.io ? window.io('http://localhost:3001') : null;
    if (!skt) return;
    socketRef.current = skt;
    skt.emit('join_room', { roomId, user: { name: user.name, role: myRole } });
    skt.on('room_update', d => { if(d.members) setPlayers(d.members); });
    skt.on('new_message', m => setChat(p => [...p, m]));
    return () => skt.disconnect();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  // ── Three.js Scene ──
  useEffect(() => {
    if (view !== 'room' || !canvasRef.current) return;
    const el = canvasRef.current;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 20, 60);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 0, 0);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.target.set(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0x334466, 0.8));
    const spot = new THREE.SpotLight(0xffffff, 3);
    spot.position.set(0, 10, 0);
    spot.angle = 0.4;
    spot.penumbra = 0.8;
    spot.castShadow = true;
    scene.add(spot);
    const blue = new THREE.PointLight(0x4488ff, 1, 15);
    blue.position.set(-5, 3, -5);
    scene.add(blue);
    const green = new THREE.PointLight(0x00ff88, 0.5, 10);
    green.position.set(5, 2, 3);
    scene.add(green);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Hospital Bed (geometric)
    const bedGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const bedMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 4.6), frameMat);
    frame.position.y = 0.2; frame.castShadow = true;
    bedGroup.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 4.3), bedMat);
    mattress.position.y = 0.43; mattress.castShadow = true;
    bedGroup.add(mattress);
    [[-1,-2.1],[ 1,-2.1],[-1, 2.1],[ 1, 2.1]].forEach(([x,z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.5,8), frameMat);
      leg.position.set(x, -0.05, z);
      bedGroup.add(leg);
    });
    // Headboard
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.1), frameMat);
    head.position.set(0, 0.7, -2.35);
    bedGroup.add(head);
    // Pillow
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
    );
    pillow.position.set(0, 0.52, -1.6);
    bedGroup.add(pillow);
    scene.add(bedGroup);

    // Patient body
    const patientGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 4, 8), skinMat);
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 0.6, 0.2);
    torso.castShadow = true;
    patientGroup.add(torso);
    const head3 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head3.position.set(0, 0.62, -1.5);
    head3.castShadow = true;
    patientGroup.add(head3);
    // Sheet (blue blanket)
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.08, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 1, transparent: true, opacity: 0.8 })
    );
    sheet.position.set(0, 0.56, 1.0);
    patientGroup.add(sheet);
    scene.add(patientGroup);

    // Try loading OBJ (hospital room)
    if (window.THREE && THREE.OBJLoader) {
      const loader = new THREE.OBJLoader();
      loader.load('/hackthonnn.obj', (obj) => {
        obj.scale.setScalar(0.02);
        obj.position.set(0, -0.5, 0);
        obj.traverse(c => {
          if (c.isMesh) {
            c.material = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 });
            c.castShadow = true; c.receiveShadow = true;
          }
        });
        scene.add(obj);
      }, undefined, () => {});
    }

    // Doctor avatars (floating spheres with labels)
    const avatarGroup = new THREE.Group();
    const positions = [[-2.5, 0, 1], [2.5, 0, 1], [0, 0, 3]];
    const roleColors = [0x6366f1, 0x10b981, 0xf59e0b];
    positions.forEach(([x,y,z], i) => {
      const avGrp = new THREE.Group();
      avGrp.position.set(x, y, z);
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: roleColors[i % 3], emissive: roleColors[i % 3], emissiveIntensity: 0.3 })
      );
      body.position.y = 0.8;
      avGrp.add(body);
      const headAv = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xfda4af })
      );
      headAv.position.y = 1.42;
      avGrp.add(headAv);
      // Coat (white box)
      const coat = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.3, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
      );
      coat.position.y = 0.85;
      avGrp.add(coat);
      avatarGroup.add(avGrp);
    });
    scene.add(avatarGroup);

    // IV Stand
    const ivMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 });
    const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0), ivMat);
    ivPole.position.set(-1.4, 0.5, -1.0);
    scene.add(ivPole);
    const ivBag = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0xbbf7d0, transparent: true, opacity: 0.7 }));
    ivBag.position.set(-1.4, 1.6, -1.0);
    scene.add(ivBag);

    // Medical monitor
    const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 }));
    monitorBase.position.set(-2.0, 0.8, -0.5);
    scene.add(monitorBase);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.01), new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x004422, emissiveIntensity: 1 }));
    screen.position.set(-2.0, 0.8, -0.44);
    scene.add(screen);

    // Grid floor lines
    const grid = new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b);
    grid.position.y = -0.49;
    scene.add(grid);

    // Animation
    let raf;
    const clock = new THREE.Clock();
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      // Breathing animation
      torso.position.y = 0.6 + Math.sin(t * 1.8) * 0.015;
      // Avatar floating
      avatarGroup.children.forEach((av, i) => {
        av.position.y = Math.sin(t * 1.5 + i * 1.2) * 0.08;
      });
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [view]);

  // ── Game logic ──
  function sendAction(action) {
    if (!action) return;
    if (socketRef.current) socketRef.current.emit('case_action', { roomId, action, userId: user.name });
    const entry = { user: user.name, action, time: new Date().toLocaleTimeString(), classification: Math.random() > 0.7 ? 'DANGER' : 'OK' };
    setHistory(p => [...p, entry]);
    // Simple vitals change
    setVitals(v => ({
      ...v,
      hr: Math.max(40, Math.min(180, v.hr + (Math.random() - 0.4) * 8)),
      status: v.hr > 140 ? 'CRITICAL' : v.hr < 50 ? 'CRITICAL' : 'STABLE'
    }));
    setCmdText('');
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatText.trim()) return;
    const msg = { from: user.name, text: chatText, ts: new Date().toLocaleTimeString() };
    if (socketRef.current) socketRef.current.emit('send_message', { roomId, message: msg });
    setChat(p => [...p, msg]);
    setChatText('');
  }

  const TOOLS = {
    Doctor:    [{ name:'Defibrillate', action:'defibrillate', icon:'⚡' }, { name:'Incision', action:'incision', icon:'✂️' }, { name:'Epinephrine', action:'epinephrine', icon:'💉' }, { name:'Check Vitals', action:'check vitals', icon:'🩺' }],
    Assistant: [{ name:'Oxygen', action:'oxygen', icon:'💨' }, { name:'IV Fluids', action:'iv fluids', icon:'💧' }, { name:'Pressure', action:'pressure', icon:'🤲' }, { name:'Suction', action:'suction', icon:'🩸' }]
  };
  const hrColor = vitals.hr > 130 || vitals.hr < 55 ? '#f43f5e' : '#10b981';

  if (view === 'lobby') return (
    <div className="page-content fade-in">
      <h2 style={{fontSize:22,fontWeight:800,marginBottom:6}}>👥 Multiplayer OR</h2>
      <p style={{color:'var(--text2)',marginBottom:20}}>Join the virtual operating theatre and collaborate in real-time</p>
      <div className="grid g2" style={{marginBottom:20}}>
        {[
          { id:'R001', name:'Cardiology OR', host:'Dr. Priya', members:2, max:5, case:'Chest Pain — 58M' },
          { id:'R002', name:'Emergency Bay', host:'Dr. Arjun', members:3, max:4, case:'Polytrauma — 34F' },
          { id:'R003', name:'General Surgery', host:'Dr. Meera', members:1, max:5, case:'Acute Appendicitis' }
        ].map(r => (
          <div key={r.id} className="card" style={{cursor:'pointer'}} onClick={() => setView('room')}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontWeight:700}}>{r.name}</span>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:'rgba(52,211,153,0.1)',color:'var(--success)'}}>● Live</span>
            </div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:8}}>🏥 {r.case}</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Host: {r.host} · {r.members}/{r.max} members</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:13}}>Your role:</span>
        {['Doctor','Assistant'].map(r => (
          <button key={r} className="btn btn-sm" style={{borderRadius:20,background:myRole===r?'var(--accent)':'transparent',color:myRole===r?'#0a0e1a':'var(--text)',border:'1px solid var(--border)'}} onClick={() => setMyRole(r)}>{r}</button>
        ))}
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => setView('room')}>Enter Operating Theatre →</button>
    </div>
  );

  return (
    <div style={{display:'grid',gridTemplateColumns:'260px 1fr 280px',gap:12,height:'calc(100vh - 100px)',overflow:'hidden',padding:'0 4px'}}>

      {/* LEFT */}
      <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
        <div className="card" style={{padding:12}}>
          <div style={{fontSize:11,fontWeight:800,color:'var(--accent)',marginBottom:10,display:'flex',gap:6,alignItems:'center'}}>👥 SURGICAL TEAM</div>
          {([{name:user.name,role:myRole},...players.filter(p=>p.name!==user.name)]).map((p,i) => (
            <div key={i} style={{padding:'7px 10px',marginBottom:6,background:'var(--bg3)',borderRadius:8,border:p.name===user.name?'1px solid var(--accent)':'1px solid transparent',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
              <span style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:p.role==='Doctor'?'rgba(99,102,241,0.2)':'rgba(16,185,129,0.2)',color:p.role==='Doctor'?'#818cf8':'#34d399'}}>{p.role||myRole}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{padding:12,flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',marginBottom:8}}>📋 MISSION</div>
          <div style={{padding:10,background:'rgba(99,102,241,0.05)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8}}>
            <div style={{fontWeight:700,fontSize:13,color:'var(--accent)',marginBottom:4}}>{mission.title}</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>{mission.details}</div>
          </div>
          <button className="btn btn-outline btn-sm btn-block" style={{marginTop:12}} onClick={() => setView('lobby')}>← Back to Lobby</button>
        </div>
      </div>

      {/* CENTER */}
      <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
        {/* Monitor */}
        <div style={{background:'#000',border:'2px solid #1e293b',borderRadius:12,padding:'12px 16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            <div style={{borderRight:'1px solid #1e293b'}}>
              <div style={{fontSize:9,fontWeight:800,color:'#f43f5e',marginBottom:2}}>HEART RATE</div>
              <div style={{fontSize:28,fontFamily:'monospace',fontWeight:800,color:hrColor,lineHeight:1}}>{vitals.hr.toFixed(0)}</div>
              <div style={{fontSize:9,color:'#f43f5e',opacity:.7}}>BPM</div>
            </div>
            <div style={{borderRight:'1px solid #1e293b'}}>
              <div style={{fontSize:9,fontWeight:800,color:'#10b981',marginBottom:2}}>BLOOD PRESSURE</div>
              <div style={{fontSize:22,fontFamily:'monospace',fontWeight:800,color:'#10b981'}}>{vitals.bp}</div>
            </div>
            <div style={{borderRight:'1px solid #1e293b'}}>
              <div style={{fontSize:9,fontWeight:800,color:'#3b82f6',marginBottom:2}}>SPO2</div>
              <div style={{fontSize:22,fontFamily:'monospace',fontWeight:800,color:'#3b82f6'}}>{vitals.spo2}%</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,fontWeight:800,color:vitals.status==='CRITICAL'?'#f43f5e':'#10b981'}}>{vitals.status}</div>
              <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>Simulation Active</div>
            </div>
          </div>
        </div>

        {/* 3D Scene */}
        <div ref={canvasRef} style={{flex:1,background:'#000',borderRadius:12,overflow:'hidden',position:'relative',border:'1px solid #1e293b'}}/>

        {/* Tools */}
        <div className="card" style={{padding:12,background:'rgba(0,0,0,0.8)'}}>
          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:10}}>
            {(TOOLS[myRole]||TOOLS.Doctor).map((t,i) => (
              <button key={i} onClick={() => sendAction(t.action)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'rgba(255,255,255,0.05)',border:'1px solid #334155',color:'#fff',padding:'8px 12px',borderRadius:10,cursor:'pointer',minWidth:72,transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(99,102,241,0.2)';e.currentTarget.style.borderColor='#6366f1';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='#334155';}}>
                <span style={{fontSize:18}}>{t.icon}</span>
                <span style={{fontSize:9,fontWeight:800}}>{t.name.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <form onSubmit={e=>{e.preventDefault();sendAction(cmdText);}} style={{display:'flex',gap:8,background:'#000',padding:'8px 12px',borderRadius:10,border:'1px solid #334155'}}>
            <span style={{color:'#6366f1',fontFamily:'monospace',fontWeight:800,fontSize:12}}>{'SYSTEM>'}</span>
            <input style={{flex:1,background:'transparent',border:'none',color:'#fff',fontFamily:'monospace',fontSize:13,outline:'none'}} placeholder="AWAITING COMMAND..." value={cmdText} onChange={e=>setCmdText(e.target.value)}/>
            <button type="submit" style={{background:'transparent',border:'none',color:'#6366f1',cursor:'pointer',fontSize:16}}>➤</button>
          </form>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
        <div className="card" style={{flex:1,padding:12,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',marginBottom:10}}>📋 SURGICAL LOG</div>
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
            {[...history].reverse().map((h,i) => (
              <div key={i} style={{fontSize:11,padding:'8px 10px',background:'var(--bg3)',borderRadius:8,borderLeft:'3px solid '+(h.classification==='DANGER'?'#f43f5e':'#10b981')}}>
                <div style={{display:'flex',justifyContent:'space-between',color:'var(--text3)',marginBottom:2}}>
                  <span style={{fontWeight:700}}>{h.user}</span><span>{h.time}</span>
                </div>
                <div style={{color:'var(--text)'}}>{h.action}</div>
              </div>
            ))}
            {!history.length && <div style={{textAlign:'center',color:'var(--text3)',marginTop:20,fontSize:12}}>No actions yet</div>}
          </div>
        </div>
        <div className="card" style={{flex:1,padding:12,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',marginBottom:10}}>💬 TEAM CHAT</div>
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
            {chat.map((m,i) => (
              <div key={i} style={{alignSelf:(m.from||m.user)===user.name?'flex-end':'flex-start',maxWidth:'88%'}}>
                <div style={{padding:'6px 10px',background:(m.from||m.user)===user.name?'var(--accent)':'var(--bg3)',borderRadius:8,fontSize:12,color:(m.from||m.user)===user.name?'#0a0e1a':'var(--text)'}}>{m.text}</div>
                <div style={{fontSize:9,color:'var(--text3)',marginTop:2,textAlign:(m.from||m.user)===user.name?'right':'left'}}>{m.from||m.user}</div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={sendChat} style={{display:'flex',gap:8}}>
            <input style={{flex:1,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',color:'var(--text)',fontSize:12,outline:'none'}} placeholder="Discuss..." value={chatText} onChange={e=>setChatText(e.target.value)}/>
            <button type="submit" style={{background:'var(--accent)',border:'none',borderRadius:8,padding:'8px 12px',cursor:'pointer',color:'#0a0e1a',fontWeight:700}}>➤</button>
          </form>
        </div>
      </div>
    </div>
  );
}

`;

const a = html.indexOf('/* ==================== MULTIPLAYER ==================== */');
const b = html.indexOf('/* ==================== LEADERBOARD ==================== */');
if (a !== -1 && b !== -1) {
  html = html.slice(0, a) + NEW_MULTI + html.slice(b);
  console.log('✓ Multiplayer component replaced!');
} else {
  console.log('ERROR: boundaries not found a=' + a + ' b=' + b);
}

fs.writeFileSync('index.html', html);
console.log('Done!');
