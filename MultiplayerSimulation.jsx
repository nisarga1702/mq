import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Users, Send, Heart, CheckCircle2, XCircle, Stethoscope, Syringe, Zap, Droplet, Wind, Scissors, User, ClipboardList, MessageSquare, ShieldAlert } from 'lucide-react';

const SOCKET_URL = `http://${window.location.hostname}:5000`;

// --- 3D COMPONENTS ---

const HospitalBed = () => (
  <group position={[0, -0.5, 0]}>
    <mesh position={[0, 0.4, 0]} receiveShadow>
      <boxGeometry args={[2.2, 0.2, 4.5]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.2, 0]} castShadow>
      <boxGeometry args={[2.3, 0.3, 4.6]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
    </mesh>
    {[[-1, -2.2], [1, -2.2], [-1, 2.2], [1, 2.2]].map((pos, i) => (
      <mesh key={i} position={[pos[0], 0, pos[1]]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    ))}
  </group>
);

const PatientBody = ({ hr, status }) => {
  const meshRef = useRef();
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    // Reduced shake intensity for more realistic 'critical' state
    const shake = status === 'CRITICAL' ? (hr / 2500) : 0; 
    const breathing = Math.sin(time * (hr / 60) * Math.PI) * 0.015;
    meshRef.current.position.y = 0.5 + breathing;
    if (status === 'CRITICAL') {
      meshRef.current.position.x = Math.sin(time * 40) * shake;
    }
  });
  return (
    <group ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow><capsuleGeometry args={[0.4, 1.2, 4, 8]} /><meshStandardMaterial color={status === 'DEAD' ? '#94a3b8' : '#fda4af'} /></mesh>
      <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><sphereGeometry args={[0.25, 32, 32]} /><meshStandardMaterial color={status === 'DEAD' ? '#94a3b8' : '#fda4af'} /></mesh>
    </group>
  );
};

const PlayerAvatar = ({ player, isMe }) => (
  <group position={player.position || [0,0,0]}>
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={player.role === 'Doctor' ? '#6366f1' : '#10b981'} emissive={player.role === 'Doctor' ? '#6366f1' : '#10b981'} emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 1.9, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">{`${player.name} (${player.role[0]})`}</Text>
    </Float>
  </group>
);

// --- MAIN COMPONENT ---

const MultiplayerSimulation = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [roomData, setRoomData] = useState({ players: [], vitals: { hr: 0, status: 'WAITING' }, history: [], gameState: 'WAITING', timeRemaining: 0, mission: { title: '', details: '' } });
  const [chat, setChat] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    newSocket.emit('join-room', { roomId: 'main-theater', user });
    newSocket.on('room-update', (data) => setRoomData(prev => ({ ...prev, ...data })));
    newSocket.on('game-tick', (data) => setRoomData(prev => ({ ...prev, ...data })));
    newSocket.on('operation-update', ({ vitals, logEntry }) => {
      setRoomData(prev => ({ ...prev, vitals, history: [...prev.history, logEntry] }));
    });
    newSocket.on('new-message', (msg) => setChat(prev => [...prev, msg]));
    return () => newSocket.close();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const executeAction = (action) => {
    if (!socket || roomData.gameState !== 'ACTIVE') return;
    socket.emit('surgical-action', { roomId: 'main-theater', action, player: { name: user.name, role: roomData.players.find(p => p.name === user.name)?.role } });
    setInputText('');
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatText) return;
    socket.emit('chat-message', { roomId: 'main-theater', message: chatText, user });
    setChatText('');
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const myPlayer = roomData.players.find(p => p.name === user.name);

  const tools = {
    'Doctor': [
      { name: 'Defibrillate', action: 'defibrillate', icon: <Zap size={18} /> },
      { name: 'Incision', action: 'incision', icon: <Scissors size={18} /> },
      { name: 'Epinephrine', action: 'epinephrine', icon: <Syringe size={18} /> },
      { name: 'Check Vitals', action: 'check vitals', icon: <Stethoscope size={18} /> },
    ],
    'Assistant': [
      { name: 'Oxygen', action: 'oxygen', icon: <Wind size={18} /> },
      { name: 'IV Fluids', action: 'iv fluids', icon: <Droplet size={18} /> },
      { name: 'Apply Pressure', action: 'pressure', icon: <Activity size={18} /> },
      { name: 'Suction', action: 'suction', icon: <Droplet size={18} /> },
    ]
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '280px 1fr 320px', 
      gap: '15px', 
      height: 'calc(100vh - 100px)', 
      width: '100%',
      padding: '10px', 
      background: '#020617',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* LEFT COLUMN: TEAM & MISSION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}>
        <div className="glass-card" style={{ padding: '15px' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#6366f1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} /> SURGICAL TEAM
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {roomData.players.map((p, i) => (
              <div key={i} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: p.name === user.name ? '1px solid #6366f1' : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{p.name}</span>
                  <span style={{ fontSize: '0.55rem', color: p.role === 'Doctor' ? '#6366f1' : '#10b981', border: `1px solid ${p.role === 'Doctor' ? '#6366f1' : '#10b981'}`, padding: '1px 5px', borderRadius: '4px' }}>{p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '15px', flex: 1, overflow: 'hidden' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} /> MISSION OBJECTIVE
          </h3>
          <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <p style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '6px' }}>{roomData.mission.title}</p>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.4' }}>{roomData.mission.details}</p>
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: MONITOR + 3D + TOOLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}>
        {/* TOP MONITOR */}
        <div className="glass-card" style={{ padding: '15px 20px', background: '#000', border: '2px solid #1e293b', borderRadius: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div style={{ borderRight: '1px solid #1e293b' }}>
              <p style={{ color: '#f43f5e', fontSize: '0.55rem', fontWeight: '800', marginBottom: '2px' }}>HEART RATE</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <h2 style={{ color: '#f43f5e', fontSize: '2.2rem', fontFamily: 'monospace', margin: 0, lineHeight: 1 }}>
                  {roomData.vitals.hr ? Number(roomData.vitals.hr).toFixed(1) : '--'}
                </h2>
                <span style={{ fontSize: '0.6rem', color: '#f43f5e', opacity: 0.7 }}>BPM</span>
              </div>
            </div>
            <div style={{ borderRight: '1px solid #1e293b' }}>
              <p style={{ color: '#10b981', fontSize: '0.55rem', fontWeight: '800', marginBottom: '2px' }}>BP</p>
              <h2 style={{ color: '#10b981', fontSize: '1.8rem', fontFamily: 'monospace', margin: 0 }}>120/80</h2>
            </div>
            <div style={{ borderRight: '1px solid #1e293b' }}>
              <p style={{ color: '#3b82f6', fontSize: '0.55rem', fontWeight: '800', marginBottom: '2px' }}>SPO2</p>
              <h2 style={{ color: '#3b82f6', fontSize: '1.8rem', fontFamily: 'monospace', margin: 0 }}>98%</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', color: '#6366f1', marginBottom: '4px' }}>
                <Clock size={14} /><span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(roomData.timeRemaining)}</span>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: roomData.vitals.status === 'DEAD' ? '#f43f5e' : '#10b981', textTransform: 'uppercase' }}>{roomData.vitals.status}</span>
            </div>
          </div>
        </div>

        {/* 3D THEATER VIEW */}
        <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000', padding: 0 }}>
          <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[5, 4, 5]} />
            <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minDistance={3} maxDistance={12} />
            <ambientLight intensity={0.5} />
            <spotLight position={[0, 8, 0]} intensity={2.5} angle={0.4} penumbra={1} castShadow />
            <HospitalBed />
            <PatientBody hr={roomData.vitals.hr} status={roomData.vitals.status} />
            {roomData.players.map(p => (<PlayerAvatar key={p.id} player={p} isMe={p.name === user.name} />))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#0f172a" roughness={0.6} /></mesh>
            <Environment preset="night" />
          </Canvas>

          {roomData.vitals.status === 'CRITICAL' && (
            <motion.div animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ position: 'absolute', inset: 0, border: '15px solid #f43f5e', pointerEvents: 'none', zIndex: 10 }} />
          )}

          <AnimatePresence>
            {(roomData.gameState === 'WON' || roomData.gameState === 'LOST') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(10px)' }}>
                {roomData.gameState === 'WON' ? (<><CheckCircle2 size={80} color="#10b981" /><h1 style={{ color: '#10b981', fontSize: '3rem', marginTop: '20px' }}>MISSION SUCCESS</h1></>) : (<><XCircle size={80} color="#f43f5e" /><h1 style={{ color: '#f43f5e', fontSize: '3rem', marginTop: '20px' }}>MISSION FAILED</h1></>)}
                <button type="button" onClick={() => socket.emit('reset-room', { roomId: 'main-theater' })} className="btn-primary" style={{ marginTop: '30px', padding: '12px 30px' }}>RETRY MISSION</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM: TOOLS & COMMAND */}
        <div className="glass-card" style={{ padding: '15px', background: 'rgba(0,0,0,0.8)', border: '1px solid #1e293b' }}>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              {tools[myPlayer?.role]?.map((tool, i) => (
                <button type="button" key={i} onClick={() => executeAction(tool.action)} className="tool-btn-small" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', minWidth: '75px'
                }}>
                  <div style={{ color: myPlayer?.role === 'Doctor' ? '#6366f1' : '#10b981' }}>{tool.icon}</div>
                  <span style={{ fontSize: '0.5rem', fontWeight: 'bold' }}>{tool.name.toUpperCase()}</span>
                </button>
              ))}
           </div>
           <form onSubmit={(e) => { e.preventDefault(); executeAction(inputText); }} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#000', padding: '8px 12px', borderRadius: '10px', border: '1px solid #334155' }}>
              <span style={{ color: '#6366f1', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75rem' }}>SYSTEM{'>'}</span>
              <input 
                className="input-field" 
                style={{ marginBottom: 0, border: 'none', background: 'transparent', padding: '0', fontSize: '0.85rem', fontFamily: 'monospace', width: '100%' }}
                placeholder="AWAITING COMMAND..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer' }}><Send size={16} /></button>
           </form>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGS & CHAT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}>
        <div className="glass-card" style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} /> SURGICAL LOG
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {roomData.history.slice(-15).reverse().map((h, i) => (
              <div key={i} style={{ fontSize: '0.65rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `3px solid ${h.classification === 'DANGER' ? '#f43f5e' : '#10b981'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold' }}>{h.user}</span>
                  <span>{h.time}</span>
                </div>
                <p style={{ margin: 0, color: '#e2e8f0' }}>{h.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={14} /> DISCUSSIONS
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {chat.map((m, i) => (
              <div key={i} style={{ fontSize: '0.7rem', alignSelf: m.user === user.name ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                <div style={{ padding: '6px 10px', background: m.user === user.name ? '#6366f1' : 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>{m.text}</div>
                <p style={{ fontSize: '0.5rem', color: '#94a3b8', marginTop: '3px', textAlign: m.user === user.name ? 'right' : 'left' }}>{m.user}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} style={{ display: 'flex', gap: '8px' }}>
            <input className="input-field" style={{ marginBottom: 0, padding: '8px', fontSize: '0.75rem' }} placeholder="Discuss..." value={chatText} onChange={(e) => setChatText(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ padding: '8px' }}><Send size={16} /></button>
          </form>
        </div>
      </div>

      <style>{`
        .tool-btn-small:hover {
          background: rgba(99, 102, 241, 0.2) !important;
          border-color: #6366f1 !important;
          transform: translateY(-2px);
        }
        * { box-sizing: border-box; }
        html, body { overflow: hidden; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
};

export default MultiplayerSimulation;
