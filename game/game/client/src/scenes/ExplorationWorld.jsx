import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Billboard, Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import useGameStore from '../store/gameStore';
import WizardCharacter from '../components/WizardCharacter';

// ── Clue definitions ──────────────────────────────────────────────────────────
const CLUES = [
  { id: 'wind',    pos: [-3, 0.5, -2], label: 'Unnatural Wind',   color: '#2e7d5a', icon: '💨', desc: 'Wind spirals upward from nothing — something unseen is drawing energy here.' },
  { id: 'plants',  pos: [2.5, 0, -1],  label: 'Dead Vegetation',  color: '#5a9a3a', icon: '🌿', desc: 'All plant life in this circle is grey. The Core\'s energy has been drained.' },
  { id: 'residue', pos: [0, 0.5, -4],  label: 'Magical Residue',  color: '#d4a520', icon: '✨', desc: 'Golden particles drift toward a single point — a faint trail left by the Dark Lord.' },
  { id: 'sound',   pos: [-1.5, 0, 2],  label: 'Sound Distortion', color: '#e07b0a', icon: '🔊', desc: 'The silence here is wrong — a low frequency hum pulses in rhythm with hidden dark magic.' },
];

// ── Floating clue orb ─────────────────────────────────────────────────────────
function ClueOrb({ clue, onFind, found }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = clue.pos[1] + Math.sin(state.clock.elapsedTime * 1.5 + clue.pos[0]) * 0.15;
  });

  return (
    <group position={clue.pos}>
      <mesh
        ref={meshRef}
        onClick={() => onFind(clue.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={found ? 0.3 : hovered ? 1.18 : 1}
      >
        <octahedronGeometry args={[0.28]} />
        <meshStandardMaterial
          color={clue.color}
          emissive={clue.color}
          emissiveIntensity={found ? 0.3 : hovered ? 2.5 : 1.4}
          transparent opacity={found ? 0.4 : 1}
        />
      </mesh>

      {/* Glow ring */}
      {!found && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.022, 8, 32]} />
          <meshStandardMaterial color={clue.color} emissive={clue.color} emissiveIntensity={0.7} transparent opacity={0.5} />
        </mesh>
      )}
      <pointLight color={clue.color} intensity={found ? 0.3 : hovered ? 3.5 : 1.8} distance={3} />

      {hovered && !found && (
        <Billboard position={[0, 0.8, 0]}>
          <Text fontSize={0.16} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
            {clue.icon} {clue.label}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

// ── World geometry ────────────────────────────────────────────────────────────
function DecayedWorld() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[40, 40, 24, 24]} />
        <meshStandardMaterial color="#141a0e" roughness={1} />
      </mesh>

      {/* Moss patches */}
      {[[-3,-0.49,2],[2,-0.49,-3],[0,-0.49,3],[4,-0.49,0]].map((pos,i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={pos}>
          <circleGeometry args={[0.6 + i*0.2, 16]} />
          <meshStandardMaterial color="#1a3014" roughness={1} />
        </mesh>
      ))}

      {/* Dead trees — muted forest colors */}
      {[[-4,-0.5,-3],[3.5,-0.5,-2],[-2,-0.5,3],[4,-0.5,1],[5,-0.5,-4],[-5,-0.5,1]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.055, 0.09, 1, 6]} />
            <meshStandardMaterial color="#2a2018" roughness={1} />
          </mesh>
          {[0, 1, 2].map((b) => (
            <mesh key={b} position={[Math.cos(b*2.1)*0.3, 0.85+b*0.2, Math.sin(b*2.1)*0.3]}>
              <cylinderGeometry args={[0.018, 0.04, 0.4, 4]} />
              <meshStandardMaterial color="#342a1a" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ancient stone ruins */}
      {[[-3,0,-4],[3,0,-5],[0,0,5]].map((pos,i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#2a2218" roughness={0.95} />
          </mesh>
          <mesh position={[0.5, 0.3, 0.3]}>
            <boxGeometry args={[0.3, 0.6, 0.3]} />
            <meshStandardMaterial color="#221e14" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Floating debris */}
      {Array.from({ length: 24 }, (_, i) => (
        <Float key={i} speed={0.4+Math.random()*0.6} floatIntensity={0.25} position={[
          (Math.random()-0.5)*14,
          Math.random()*2-0.2,
          (Math.random()-0.5)*14,
        ]}>
          <mesh>
            <tetrahedronGeometry args={[0.04+Math.random()*0.08]} />
            <meshStandardMaterial color="#3a2e18" emissive="#1a1408" emissiveIntensity={0.3} />
          </mesh>
        </Float>
      ))}

      {/* Golden portal to barrier — GOLD not purple */}
      <Float speed={2} floatIntensity={0.4} position={[0, 0.5, -7]}>
        <mesh>
          <torusGeometry args={[0.9, 0.09, 16, 60]} />
          <meshStandardMaterial color="#b5922a" emissive="#d4a520" emissiveIntensity={1.8} />
        </mesh>
        {/* Inner portal disc */}
        <mesh>
          <circleGeometry args={[0.8, 32]} />
          <meshStandardMaterial color="#061008" emissive="#0a1a08" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>
        <pointLight color="#d4a520" intensity={4} distance={8} />
      </Float>

      {/* Portal pillar stones */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0, -7]}>
          <cylinderGeometry args={[0.12, 0.16, 2.2, 6]} />
          <meshStandardMaterial color="#1e1a10" roughness={0.95} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Ambient gold particles (was purple) ───────────────────────────────────────
function AmbientParticles() {
  const ref = useRef();
  const pos = useRef(
    new Float32Array(Array.from({ length: 600 }, (_, i) =>
      i % 3 === 0 ? (Math.random()-0.5)*16 :
      i % 3 === 1 ? Math.random()*3 :
      (Math.random()-0.5)*16
    ))
  );
  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += 0.004;
      if (arr[i] > 3) arr[i] = -0.3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos.current, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#5a4010" size={0.035} transparent opacity={0.45} />
    </points>
  );
}

// ── Player character running through exploration ───────────────────────────────
function RunningWizard({ gender, archetype, allFound }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle orbit around center when exploring
    groupRef.current.position.x = Math.sin(t * 0.15) * 1.5;
    groupRef.current.position.z = Math.cos(t * 0.15) * 1.5 + 1;
    groupRef.current.rotation.y = -t * 0.15 + Math.PI; // face movement direction
  });
  return (
    <group ref={groupRef} position={[1.5, -0.5, 1]}>
      <WizardCharacter
        gender={gender || 'male'}
        archetype={archetype || 'void-walker'}
        scale={0.75}
        position={[0, 0, 0]}
        walking={true}
        castingSpell={false}
      />
    </group>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExplorationWorld() {
  const { cluesFound, findClue, setScene, showToast, player } = useGameStore();
  const [selectedClue, setSelectedClue] = useState(null);
  const allFound = cluesFound.length >= 4;

  const handleClueFinding = (id) => {
    const clue = CLUES.find((c) => c.id === id);
    if (!clue) return;
    if (!cluesFound.includes(id)) {
      findClue(id);
      showToast(`Discovered: ${clue.icon} ${clue.label}`, 'success', 3000);
    }
    setSelectedClue(clue);
  };

  const handleEnterBarrier = () => {
    if (!allFound) { showToast('Find all 4 anomalies first before entering!', 'info'); return; }
    setScene('barrier');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* 3D World — forest/gold theme colors */}
      <Canvas camera={{ position: [0, 2.5, 6.5], fov: 58 }} style={{ position: 'absolute', inset: 0 }}>
        <fog attach="fog" args={['#080c07', 10, 28]} />
        <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={0.3} />
        <ambientLight intensity={0.12} color="#f0e8c0" />
        {/* Main overhead — warm amber */}
        <pointLight position={[0, 6, 0]} color="#7a5010" intensity={1.5} />
        {/* Fill — forest green */}
        <pointLight position={[-5, 2, 0]} color="#1a4a2a" intensity={0.8} />
        {/* Back accent — aged gold */}
        <pointLight position={[0, 1, -8]} color="#b5922a" intensity={1.2} />

        <Suspense fallback={null}>
          <DecayedWorld />
          <AmbientParticles />
          {CLUES.map((clue) => (
            <ClueOrb key={clue.id} clue={clue} found={cluesFound.includes(clue.id)} onFind={handleClueFinding} />
          ))}
          {/* Player character running around */}
          <RunningWizard
            gender={player?.gender}
            archetype={player?.wizardType}
            allFound={allFound}
          />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="hud">
        <div className="glass hud-wizard-info">
          <div className="hud-avatar">{player?.gender === 'female' ? '🧙‍♀️' : '🧙‍♂️'}</div>
          <div>
            <div className="hud-name">{player?.wizardName || 'Wizard'}</div>
            <div className="hud-type">{player?.wizardType?.replace('-', ' ') || ''}</div>
          </div>
        </div>
        <div className="glass" style={{ padding: '8px 18px', fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: 'var(--txt-accent)' }}>
          🌍 Exploration Phase — Find the Anomalies
        </div>
      </div>

      {/* Clue tracker */}
      <div className="glass clue-tracker">
        <h4>⦿ Anomalies Detected</h4>
        {CLUES.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem' }}>
            <span className={`clue-pip ${cluesFound.includes(c.id) ? 'found' : 'notfound'}`} />
            <span style={{ color: cluesFound.includes(c.id) ? 'var(--txt-primary)' : 'var(--txt-muted)' }}>
              {c.icon} {c.label}
            </span>
          </div>
        ))}

        {allFound && (
          <div style={{
            marginTop: 12, padding: '6px 10px',
            background: 'rgba(46,125,90,0.15)',
            border: '1px solid rgba(46,125,90,0.4)',
            borderRadius: 'var(--r-sm)',
            fontSize: '0.75rem', color: 'var(--clr-teal)',
            fontFamily: "'Cinzel', serif",
          }}>
            ✓ All anomalies found!
          </div>
        )}
      </div>

      {/* Hint text */}
      <AnimatePresence>
        {!allFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            style={{
              position: 'absolute',
              bottom: 90, left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <p style={{
              color: 'rgba(212,165,32,0.5)',
              fontFamily: "'Cinzel', serif",
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
            }}>
              ✦ Click the glowing orbs scattered across the realm ✦
            </p>
            <p style={{ color: 'rgba(180,160,120,0.35)', fontSize: '0.7rem', marginTop: 4 }}>
              {cluesFound.length} / 4 anomalies discovered
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enter barrier button */}
      <AnimatePresence>
        {allFound && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}
          >
            <button id="enter-barrier-btn" className="btn btn-primary btn-lg" onClick={handleEnterBarrier}>
              ✦ Enter the Barrier Chamber ✦
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clue detail modal */}
      <AnimatePresence>
        {selectedClue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: 110, left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200, width: 'min(420px, 90vw)',
            }}
          >
            <div className="glass" style={{ padding: 'var(--sp-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>{selectedClue.icon}</div>
              <h3 style={{ fontFamily: "'Cinzel', serif", color: selectedClue.color, fontSize: '1rem', marginBottom: 10 }}>
                {selectedClue.label}
              </h3>
              <p style={{ color: 'var(--txt-secondary)', fontSize: '0.88rem', lineHeight: 1.75 }}>
                {selectedClue.desc}
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedClue(null)} style={{ marginTop: 'var(--sp-md)' }}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="crosshair" />
    </div>
  );
}
