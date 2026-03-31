// Final Confrontation — Optimized Action Battle
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sphere, Trail } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import useGameStore from '../store/gameStore';
import WizardCharacter from '../components/WizardCharacter';
import DarkLord from '../components/DarkLord';

// ── Performance Constants ───────────────────────────────────────────────────
const PLAYER_SPEED = 0.09;
const PROJECTILE_SPEED = 0.32;
const PLAYER_MAX_HP = 100;
const BOSS_MAX_HP = 600; // Reduced for faster gameplay

export default function FinalConfrontation() {
  const { player, score, hintsUsed, getStarRating, getGameDuration, resetGame } = useGameStore();
  const [phase, setPhase] = useState('battle'); 
  const [playerHP, setPlayerHP] = useState(PLAYER_MAX_HP);
  const [bossHP, setBossHP] = useState(BOSS_MAX_HP);

  const playerPos = useRef(new THREE.Vector3(-3.5, -1.1, 0));
  const bossPos = useRef(new THREE.Vector3(3.5, -1.1, 0));
  
  // Use a Ref for projectiles to avoid React state lag during physics updates
  const projectilesRef = useRef([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [shake, setShake] = useState(0);
  
  const lastShot = useRef(0);
  const lastBossShot = useRef(0);
  const keys = useRef({});

  // Reset battle only
  const restartBattle = () => {
    setPlayerHP(PLAYER_MAX_HP);
    setBossHP(BOSS_MAX_HP);
    playerPos.current.set(-3.5, -1.1, 0);
    bossPos.current.set(3.5, -1.1, 0);
    projectilesRef.current = [];
    setPhase('battle');
    setShake(0);
  };

  useEffect(() => {
    const down = (e) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const spawnProjectile = useCallback((from, to, color, isPlayer) => {
    projectilesRef.current.push({
      id: Math.random(),
      pos: from.clone(),
      target: to.clone(),
      velocity: new THREE.Vector3().subVectors(to, from).normalize().multiplyScalar(PROJECTILE_SPEED),
      color,
      isPlayer,
      active: true
    });
  }, []);

  const castAttack = (color = '#3498db') => {
    if (phase !== 'battle') return;
    const now = Date.now();
    if (now - lastShot.current < 200) return;
    lastShot.current = now;
    spawnProjectile(
      playerPos.current.clone().add(new THREE.Vector3(1, 1.2, 0)), 
      bossPos.current.clone().add(new THREE.Vector3(0, 1.5, 0)), 
      color, 
      true
    );
  };

  const castShield = () => {
    if (shieldActive || phase !== 'battle') return;
    setShieldActive(true);
    setTimeout(() => setShieldActive(false), 2000);
  };

  const castHeal = () => {
    if (phase !== 'battle') return;
    setPlayerHP(h => Math.min(PLAYER_MAX_HP, h + 25));
  };

  // ── Engine Component ────────────────────────────────────────────────────────
  function BattleEngine() {
    useFrame((state) => {
      if (phase !== 'battle') return;

      // 1. Player Movement
      if (keys.current['w'] && playerPos.current.y < 3.8) playerPos.current.y += PLAYER_SPEED;
      if (keys.current['s'] && playerPos.current.y > -1.1) playerPos.current.y -= PLAYER_SPEED;
      if (keys.current['a'] && playerPos.current.x > -6.5) playerPos.current.x -= PLAYER_SPEED;
      if (keys.current['d'] && playerPos.current.x < -1.2) playerPos.current.x += PLAYER_SPEED;

      // 2. Boss Movement
      bossPos.current.y = Math.sin(state.clock.elapsedTime * 2.2) * 2.2 + 0.8;
      bossPos.current.x = 4.8 + Math.cos(state.clock.elapsedTime * 1.5) * 1.4;
      bossPos.current.z = Math.sin(state.clock.elapsedTime * 1.1) * 1.5;

      // 3. Projectile Updates
      const playerBox = playerPos.current.clone().add(new THREE.Vector3(0, 1.2, 0));
      const bossBox = bossPos.current.clone().add(new THREE.Vector3(0, 1.5, 0));

      for (let p of projectilesRef.current) {
        if (!p.active) continue;
        p.pos.add(p.velocity);

        if (p.isPlayer) {
          if (p.pos.distanceTo(bossBox) < 1.2) {
            p.active = false;
            setBossHP(h => {
              const nh = h - 35; // Increased damage
              if (nh <= 0) setTimeout(() => setPhase('victory'), 400);
              return Math.max(0, nh);
            });
          }
        } else {
          if (p.pos.distanceTo(playerBox) < 1.0) {
            p.active = false;
            if (!shieldActive) {
               setShake(0.8);
               setPlayerHP(h => {
                  const nh = h - 15;
                  if (nh <= 0) setTimeout(() => setPhase('gameOver'), 400);
                  return Math.max(0, nh);
               });
            }
          }
        }
        if (Math.abs(p.pos.x) > 18 || Math.abs(p.pos.y) > 10) p.active = false;
      }

      // 4. Boss Shooting
      const now = Date.now();
      const interval = bossHP > 300 ? 1200 : 700;
      if (now - lastBossShot.current > interval) {
        lastBossShot.current = now;
        spawnProjectile(bossPos.current.clone().add(new THREE.Vector3(-0.8, 1.5, 0)), playerBox, '#ff4757', false);
      }

      if (shake > 0) setShake(s => s * 0.9);
    });

    return null;
  }

  // ── Projectile Renderer (Visual only) ──────────────────────────────────────
  function ProjectileVis() {
    const [renderTick, setTick] = useState(0);
    useFrame(() => setTick(t => t + 1));

    return (
       <group>
          {projectilesRef.current.filter(p => p.active).map(p => (
             <group key={p.id} position={p.pos.toArray()}>
                <Trail width={1.8} length={6} color={p.color} attenuation={(t) => t * t}>
                   <Sphere args={[0.15, 8, 8]}>
                      <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={8} />
                   </Sphere>
                </Trail>
                <pointLight color={p.color} intensity={4} distance={6} />
             </group>
          ))}
       </group>
    );
  }

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeys = (e) => {
      if (e.code === 'Space') castShield();
      if (e.key.toLowerCase() === 'r') castHeal();
      if (e.key.toLowerCase() === 'f') castAttack('#3498db');
      if (e.key.toLowerCase() === 'g') castAttack('#ff9f43');
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [shieldActive, phase]);

  const stars = getStarRating();
  const totalDuration = getGameDuration();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#010103' }}>
      <Canvas camera={{ position: [0, 2, 12], fov: 45 }} onClick={() => castAttack()} style={{ cursor: 'crosshair' }}>
        <BattleEngine />
        <ProjectileVis />
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0.5} fade speed={0.8} />
        <ambientLight intensity={phase === 'victory' ? 0.8 : 0.2} />
        <pointLight position={[0, 15, 10]} intensity={3} />
        
        {/* Arena Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
           <circleGeometry args={[25, 64]} />
           <meshStandardMaterial color={phase === 'victory' ? '#0d1a08' : '#050510'} roughness={1} />
        </mesh>

        <group position={shake ? [(Math.random()-0.5)*shake, (Math.random()-0.5)*shake, 0] : [0,0,0]}>
           {!phase.startsWith('victory') && (
              <group position={playerPos.current.toArray()}>
                 <WizardCharacter gender={player?.gender} archetype={player?.wizardType} scale={0.9} walking={true} />
                 {shieldActive && (
                    <Sphere args={[1.5, 24, 24]}>
                       <meshStandardMaterial color="#3498db" transparent opacity={0.3} wireframe />
                    </Sphere>
                 )}
              </group>
           )}

           {!phase.startsWith('victory') && (
              <group position={bossPos.current.toArray()}>
                 <DarkLord phase="alive" scale={1.2} />
              </group>
           )}

           {phase === 'victory' && <VictoryAnimations />}
        </group>

        <EffectComposer disableNormalPass>
           <Bloom mipmapBlur intensity={phase === 'victory' ? 2.8 : 1.2} />
        </EffectComposer>
      </Canvas>

      {/* Battle Stats HUD */}
      {phase === 'battle' && (
         <div style={{ position: 'absolute', top: 30, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {/* Player */}
            <div style={{ width: '30%', padding: '15px', background: 'rgba(10,20,40,0.85)', borderLeft: '6px solid #3498db', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontFamily: "'Cinzel', serif", marginBottom: 10 }}>
                  <span>{player?.wizardName}</span>
                  <span>{playerHP} HP</span>
               </div>
               <div style={{ height: 10, background: '#111', borderRadius: 5, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${(playerHP/PLAYER_MAX_HP)*100}%` }} style={{ height: '100%', background: '#3498db' }} />
               </div>
            </div>
            {/* Boss */}
            <div style={{ width: '40%', padding: '15px', background: 'rgba(40,10,10,0.85)', borderRight: '6px solid #ff4757', borderRadius: '12px', backdropFilter: 'blur(8px)', textAlign: 'right' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontFamily: "'Cinzel', serif", marginBottom: 10 }}>
                  <span>{bossHP} HP</span>
                  <span>DARK LORD</span>
               </div>
               <div style={{ height: 10, background: '#111', borderRadius: 5, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${(bossHP/BOSS_MAX_HP)*100}%` }} style={{ height: '100%', background: '#ff4757' }} />
               </div>
            </div>
         </div>
      )}

      {/* Spell Bar */}
      {phase === 'battle' && (
         <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 25, background: 'rgba(0,0,0,0.9)', padding: '15px 35px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.2)' }}>
               {[
                  { icon: '⚡', color: '#3498db', label: 'BOLT', key: 'F', action: () => castAttack('#3498db') },
                  { icon: '🔥', color: '#ff9f43', label: 'IGNIS', key: 'G', action: () => castAttack('#ff9f43') },
                  { icon: '🛡️', color: '#2ed573', label: 'SHIELD', key: 'SPACE', action: castShield },
                  { icon: '❤️', color: '#ff4757', label: 'HEAL', key: 'R', action: castHeal },
               ].map(s => (
                  <motion.button key={s.label} whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }} onClick={s.action} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                     <div style={{ width: 55, height: 55, borderRadius: '50%', border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: s.color, marginBottom: 5 }}>{s.icon}</div>
                     <div style={{ fontSize: '0.65rem', color: '#aaa', fontFamily: "'Cinzel', serif" }}>{s.label} ({s.key})</div>
                  </motion.button>
               ))}
            </div>
         </div>
      )}

      {/* Game Over */}
      {phase === 'gameOver' && (
         <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,0,0,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <h1 style={{ color: '#ff4757', fontSize: '5rem', fontFamily: "'Cinzel', serif" }}>DUEL LOST</h1>
            <button className="btn btn-primary" onClick={restartBattle}>Restart Duel</button>
         </div>
      )}

      {/* FINAL SCOREBOARD / VICTORY */}
      {phase === 'victory' && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, black 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.h1 initial={{ y: -30 }} animate={{ y: 0 }} style={{ color: '#d4a520', fontSize: '4.5rem', fontFamily: "'Cinzel', serif", textShadow: '0 0 40px rgba(212,165,32,0.6)', margin: 0 }}>REALM RESTORED</motion.h1>
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} style={{ width: 450, marginTop: 40, padding: '30px', background: 'rgba(10,20,15,0.92)', border: '2px solid #d4a520', borderRadius: '20px', backdropFilter: 'blur(15px)' }}>
               <h3 style={{ textAlign: 'center', color: '#fff', fontFamily: "'Cinzel', serif", fontSize: '1.4rem', borderBottom: '1px solid rgba(212,165,32,0.3)', paddingBottom: 15, marginBottom: 20 }}>MISSION SUMMARY</h3>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {[
                     { label: 'Guardian', value: player?.wizardName },
                     { label: 'Rating', value: '★'.repeat(stars) + '☆'.repeat(3 - stars) },
                     { label: 'Final Score', value: score.toLocaleString() },
                     { label: 'Hints Used', value: hintsUsed },
                     { label: 'Time Taken', value: totalDuration, highlight: true },
                     { label: 'Core Integrity', value: '100%', highlight: true },
                  ].map(stat => (
                     <div key={stat.label}>
                        <div style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                        <div style={{ color: stat.highlight ? '#d4a520' : '#fff', fontSize: '1.2rem', fontFamily: "'Cinzel', serif" }}>{stat.value}</div>
                     </div>
                  ))}
               </div>
               
               <button className="btn btn-primary" onClick={resetGame} style={{ width: '100%', marginTop: 30, padding: '12px' }}>✦ Ascend to Throne ✦</button>
            </motion.div>
         </motion.div>
      )}
    </div>
  );
}

function VictoryAnimations() {
   return (
      <group>
         <VictoryParticles count={600} />
         <RestoredCore />
      </group>
   );
}

function VictoryParticles({ count = 300 }) {
  const ref = useRef();
  const positions = useRef(new Float32Array(count * 3));
  const vels = useRef(Array.from({ length: count }, () => ({ x: (Math.random()-0.5)*0.06, y: Math.random()*0.12+0.02, z: (Math.random()-0.5)*0.06 })));
  useEffect(() => {
     for(let i=0; i<count; i++) { positions.current[i*3] = (Math.random()-0.5)*12; positions.current[i*3+1] = -2; positions.current[i*3+2] = (Math.random()-0.5)*12; }
  }, []);
  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i*3] += vels.current[i].x; pos[i*3+1] += vels.current[i].y; pos[i*3+2] += vels.current[i].z;
      if (pos[i*3+1] > 10) pos[i*3+1] = -2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions.current, 3]} /></bufferGeometry><pointsMaterial color="#d4a520" size={0.08} transparent opacity={0.8} /></points>;
}

function RestoredCore() {
  return (
    <Float speed={2} floatIntensity={1.5}>
      <mesh><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial color="#e07b0a" emissive="#d4a520" emissiveIntensity={5} /></mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[1.5, 0.05, 12, 64]} /><meshStandardMaterial color="#b5922a" emissive="#d4a520" emissiveIntensity={2} /></mesh>
      <pointLight color="#d4a520" intensity={15} distance={20} />
    </Float>
  );
}
