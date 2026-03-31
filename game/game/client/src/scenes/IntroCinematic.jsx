import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';

// ── Realm Core geometry ───────────────────────────────────────────────────────
function RealmCore({ phase }) {
  const meshRef = { current: null };
  const ringRef = { current: null };
  const meshR   = (r) => { meshRef.current = r; };
  const ringR   = (r) => { ringRef.current = r; };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.003;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z  = t * 0.4;
      ringRef.current.rotation.x  = Math.PI / 2 + Math.sin(t * 0.3) * 0.08;
    }
  });

  const alive = phase < 2;
  return (
    <group>
      {/* Central Core orb */}
      <Float speed={1.5} floatIntensity={0.5}>
        <mesh ref={meshR}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color={alive ? '#e07b0a' : '#3d3530'}
            emissive={alive ? '#b5922a' : '#1a1510'}
            emissiveIntensity={alive ? 1.4 : 0.2}
            wireframe={phase >= 2}
          />
        </mesh>
      </Float>

      {/* Orbital ring — GOLD instead of purple */}
      <mesh ref={ringR}>
        <torusGeometry args={[2.2, 0.06, 16, 80]} />
        <meshStandardMaterial
          color={alive ? '#b5922a' : '#2a2218'}
          emissive={alive ? '#d4a520' : '#0a0808'}
          emissiveIntensity={alive ? 1.2 : 0.08}
        />
      </mesh>

      {/* Second orbiting ring — forest green */}
      {alive && (
        <mesh rotation={[0.8, 0, 0]}>
          <torusGeometry args={[1.6, 0.04, 12, 60]} />
          <meshStandardMaterial
            color="#2e7d5a"
            emissive="#2e7d5a"
            emissiveIntensity={0.9}
          />
        </mesh>
      )}

      {/* The Dark Entity (phase 1+) — amber/crimson toned */}
      {phase >= 1 && (
        <Float speed={3} floatIntensity={2} position={[4, 1, 0]}>
          <mesh>
            <octahedronGeometry args={[0.7]} />
            <meshStandardMaterial
              color="#8b0000"
              emissive="#c0392b"
              emissiveIntensity={phase === 1 ? 1.0 : 2.0}
            />
          </mesh>
          <pointLight color="#c0392b" intensity={3} distance={5} />
        </Float>
      )}

      {/* Decay particles (phase 2) */}
      {phase >= 2 && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(Array.from({ length: 300 }, () => (Math.random() - 0.5) * 10)), 3]}
            />
          </bufferGeometry>
          <pointsMaterial color="#5a4a2a" size={0.05} transparent opacity={0.6} />
        </points>
      )}
    </group>
  );
}

function CinematicCanvas({ phase }) {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 55 }} style={{ position: 'absolute', inset: 0 }}>
      <Stars radius={100} depth={60} count={4000} factor={4} saturation={0} fade speed={0.4} />
      <ambientLight intensity={0.15} color="#f0d870" />
      {/* Main core light — gold/amber */}
      <pointLight position={[0, 0, 4]} color={phase < 2 ? '#e07b0a' : '#3d2a10'} intensity={phase < 2 ? 5 : 0.8} />
      {/* Side fill — forest green */}
      <pointLight position={[5, 3, 2]} color={phase < 2 ? '#2e7d5a' : '#0a1a10'} intensity={phase < 2 ? 2 : 0.3} />
      {/* Entity red */}
      {phase >= 1 && <pointLight position={[5, 1, 0]} color="#c0392b" intensity={4} />}
      <RealmCore phase={phase} />
    </Canvas>
  );
}

// ── Cinematic script ──────────────────────────────────────────────────────────
const BEATS = [
  {
    phase: 0,
    duration: 4500,
    title: 'The Eternal Realm',
    body: 'A world of perfect harmony, sustained by the radiant energy of the Eternal Core.',
    accent: '#d4a520',
  },
  {
    phase: 1,
    duration: 4500,
    title: 'The Dark Lord Awakens',
    body: 'From a forgotten void it emerged — the Dark Lord, ancient, hungry, and without mercy.',
    accent: '#c0392b',
  },
  {
    phase: 2,
    duration: 4500,
    title: 'The Core Is Stolen',
    body: 'In a single moment, the golden light vanished. The realm trembled. Balance shattered.',
    accent: '#e07b0a',
  },
  {
    phase: 2,
    duration: 4500,
    title: 'The Last Code Wizard',
    body: 'Only one remains with the power to restore what was lost. You must reclaim the Eternal Core.',
    accent: '#2e7d5a',
  },
];

export default function IntroCinematic() {
  const { setScene, player } = useGameStore();
  const [beatIndex, setBeatIndex] = useState(0);
  const [visible, setVisible]     = useState(true);

  const beat = BEATS[beatIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (beatIndex < BEATS.length - 1) {
        setVisible(false);
        setTimeout(() => { setBeatIndex((i) => i + 1); setVisible(true); }, 600);
      } else {
        setTimeout(() => setScene('exploration'), 1200);
      }
    }, beat.duration);
    return () => clearTimeout(timer);
  }, [beatIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <CinematicCanvas phase={beat.phase} />

      {/* Cinematic letter-box */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: '#000', zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: '#000', zIndex: 5 }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(4,6,3,0.85) 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Beat text */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key={beatIndex}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7 }}
            style={{
              position: 'absolute',
              bottom: '12%', left: 0, right: 0,
              textAlign: 'center',
              padding: '0 10%',
              zIndex: 10,
            }}
          >
            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              color: beat.accent,
              marginBottom: '1rem',
              textShadow: `0 0 40px ${beat.accent}99`,
              letterSpacing: '0.06em',
            }}>
              {beat.title}
            </h2>
            <p style={{
              fontFamily: "'IM Fell English', serif",
              fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
              color: 'rgba(240, 228, 200, 0.85)',
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.85,
            }}>
              {beat.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player name banner on last beat */}
      {beatIndex === 3 && player && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            position: 'absolute',
            top: '15%', left: 0, right: 0,
            textAlign: 'center', zIndex: 10,
          }}
        >
          <div style={{
            display: 'inline-block',
            padding: '8px 32px',
            background: 'rgba(181,146,42,0.12)',
            border: '1px solid rgba(212,165,32,0.5)',
            borderRadius: 'var(--r-full)',
            fontFamily: "'Cinzel', serif",
            fontSize: '0.8rem',
            letterSpacing: '0.2em',
            color: 'var(--txt-accent)',
          }}>
            {player.gender === 'female' ? '🧙‍♀️' : '🧙‍♂️'} &nbsp;
            {player.wizardName.toUpperCase()} — {player.wizardType?.replace('-', ' ').toUpperCase()}
          </div>
        </motion.div>
      )}

      {/* Progress dots */}
      <div style={{
        position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, alignItems: 'center', zIndex: 10,
      }}>
        {BEATS.map((_, i) => (
          <div key={i} style={{
            width: i === beatIndex ? 28 : 8,
            height: 8,
            borderRadius: 4,
            background: i === beatIndex ? 'var(--clr-violet)' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* Skip button */}
      <button
        id="cinematic-skip-btn"
        className="btn btn-secondary btn-sm"
        onClick={() => setScene('exploration')}
        style={{ position: 'absolute', top: 24, right: 24, zIndex: 20 }}
      >
        Skip ›
      </button>
    </div>
  );
}
