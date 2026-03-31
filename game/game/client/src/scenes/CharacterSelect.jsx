import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from '../hooks/useForm';
import useGameStore from '../store/gameStore';
import { createPlayer, createSession } from '../api/client';
import WizardCharacter from '../components/WizardCharacter';

const GENDERS = [
  { id: 'female', icon: '🧙‍♀️', label: 'Witch', desc: 'Her magic flows from intuition & inner fire' },
  { id: 'male',   icon: '🧙‍♂️', label: 'Wizard', desc: 'His power comes from ancient lore & runes' },
];

const ARCHETYPES = [
  { id: 'chrono-mage',   icon: '⏳', label: 'Chrono Mage',   desc: 'Master of time & patterns'      },
  { id: 'storm-caller',  icon: '⚡', label: 'Storm Caller',  desc: 'Wielder of lightning force'      },
  { id: 'void-walker',   icon: '🌀', label: 'Void Walker',   desc: 'Traveler between dimensions'     },
  { id: 'nature-shaman', icon: '🌿', label: 'Nature Shaman', desc: 'Bound to living forest energy'   },
];

// ── 3D Preview Canvas ─────────────────────────────────────────────────────────
function CharacterPreviewCanvas({ gender, archetype }) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.8], fov: 45 }}
      style={{ position: 'absolute', inset: 0 }}
      shadows
    >
      {/* Background stars */}
      <Stars radius={60} depth={40} count={2000} factor={3} saturation={0} fade speed={0.5} />

      {/* Ambient + key lights — gold/green theme */}
      <ambientLight intensity={0.4} color="#f0d890" />
      <pointLight position={[2, 3, 2]}  color="#d4a520" intensity={3} castShadow />
      <pointLight position={[-2, 1, 1]} color="#2e7d5a" intensity={2} />
      <pointLight position={[0, -1, 2]} color="#e07b0a" intensity={1} />

      {/* Floor glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <circleGeometry args={[1.2, 40]} />
        <meshStandardMaterial
          color="#b5922a"
          emissive="#b5922a"
          emissiveIntensity={0.25}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Orbital ring beneath character */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.88, 0]}>
        <torusGeometry args={[0.9, 0.025, 12, 60]} />
        <meshStandardMaterial color="#b5922a" emissive="#b5922a" emissiveIntensity={1.2} />
      </mesh>

      {/* The Wizard! */}
      {gender && (
        <WizardCharacter
          gender={gender}
          archetype={archetype || 'void-walker'}
          scale={0.92}
          position={[0, -0.9, 0]}
          walking={false}
          castingSpell={false}
        />
      )}

      {/* Floating rune crystals around character */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 1.4, 0.1 + i * 0.15, Math.cos(angle) * 1.4]}
          >
            <octahedronGeometry args={[0.06]} />
            <meshStandardMaterial
              color="#d4a520"
              emissive="#d4a520"
              emissiveIntensity={1.8}
            />
          </mesh>
        );
      })}

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        target={[0, 0.3, 0]}
        autoRotate
        autoRotateSpeed={1.2}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}

// ── Placeholder when no gender selected ──────────────────────────────────────
function EmptyPreview() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 55 }} style={{ position: 'absolute', inset: 0 }}>
      <Stars radius={60} depth={40} count={2000} factor={3} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, 2]} color="#b5922a" intensity={2} />

      {/* Slowly spinning question orb */}
      <mesh>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color="#b5922a"
          emissive="#7a5c10"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      <pointLight color="#b5922a" intensity={2} distance={5} />
    </Canvas>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CharacterSelect() {
  const { setPlayer, setScene, setSessionId, showToast } = useGameStore();
  const [form, setField] = useForm({ wizardName: '', gender: '', wizardType: '' });
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const isValid = form.wizardName.trim().length >= 2 && form.gender && form.wizardType;

  const handleBegin = async () => {
    if (!isValid) return;
    try {
      const res = await createPlayer({
        wizardName: form.wizardName.trim(),
        gender: form.gender,
        wizardType: form.wizardType,
      });
      const { player } = res.data;
      setPlayer(player);
      const sessionRes = await createSession(player.playerId);
      setSessionId(sessionRes.data.session.sessionId);
      useGameStore.getState().setStartTime(Date.now()); // Initialize global timer
      showToast(`Welcome, ${player.wizardName}. The realm awaits.`, 'success', 4000);
      setTimeout(() => setScene('cinematic'), 600);
    } catch {
      const offlinePlayer = {
        playerId: `offline-${Date.now()}`,
        wizardName: form.wizardName.trim(),
        gender: form.gender,
        wizardType: form.wizardType,
      };
      setPlayer(offlinePlayer);
      useGameStore.getState().setStartTime(Date.now()); // Initialize global timer
      showToast(`Welcome, ${offlinePlayer.wizardName}. The realm awaits.`, 'info', 4000);
      setTimeout(() => setScene('cinematic'), 600);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && isValid) handleBegin(); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--clr-void)' }}>

      {/* ── LEFT: 3D Character Preview ── */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0,
        width: '52%', height: '100%',
        background: 'linear-gradient(120deg, rgba(14,22,10,0.92) 0%, rgba(8,12,7,0.5) 100%)',
      }}>
        <AnimatePresence mode="wait">
          {form.gender ? (
            <motion.div
              key={`${form.gender}-${form.wizardType}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            >
              <CharacterPreviewCanvas gender={form.gender} archetype={form.wizardType} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            >
              <EmptyPreview />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient edge */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 70%, rgba(8,12,7,0.9) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Character label at bottom */}
        <AnimatePresence>
          {form.gender && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', bottom: 32, left: 0, right: 0,
                textAlign: 'center',
                fontFamily: "'Cinzel', serif",
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                color: 'var(--txt-accent)',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(212, 165, 32, 0.8)',
                pointerEvents: 'none',
              }}
            >
              {form.gender === 'female' ? '✦ The Witch ✦' : '✦ The Wizard ✦'}
              {form.wizardType && (
                <div style={{ fontSize: '0.65rem', marginTop: 4, color: 'var(--txt-secondary)' }}>
                  {ARCHETYPES.find(a => a.id === form.wizardType)?.label}
                </div>
              )}
            </motion.div>
          )}
          {!form.gender && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', bottom: 32, left: 0, right: 0,
                textAlign: 'center',
                fontFamily: "'Cinzel', serif",
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                color: 'rgba(212,165,32,0.4)',
                pointerEvents: 'none',
              }}
            >
              Choose your form to summon your wizard
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div
        style={{
          position: 'absolute',
          right: 0, top: 0,
          width: '48%', height: '100%',
          background: 'rgba(8,12,7,0.92)',
          borderLeft: '1px solid var(--clr-border)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 40px',
          gap: '24px',
        }}
        onKeyDown={handleKey}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '0.7rem',
            letterSpacing: '0.28em',
            color: 'var(--txt-accent)',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            ✦ Realm of the Lost Core ✦
          </div>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
            background: 'linear-gradient(135deg, #f0e4c8 0%, #d4a520 55%, #2e7d5a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px',
          }}>
            Code Wizards
          </h1>
          <p style={{ color: 'var(--txt-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            The Eternal Core has been stolen. You are the last Code Wizard.
            Choose your identity and begin the journey.
          </p>
        </motion.div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--clr-border), transparent)' }} />

        {/* Name */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="char-label" htmlFor="wizard-name-input">✦ Your Wizard Name</label>
          <input
            id="wizard-name-input"
            ref={nameRef}
            className="input"
            type="text"
            placeholder="Enter your name..."
            value={form.wizardName}
            onChange={(e) => setField('wizardName', e.target.value)}
            maxLength={24}
            autoComplete="off"
          />
        </motion.div>

        {/* Gender */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <label className="char-label">✦ Choose Your Form</label>
          <div className="gender-grid">
            {GENDERS.map((g) => (
              <div
                key={g.id}
                id={`gender-${g.id}`}
                className={`select-card ${form.gender === g.id ? 'selected' : ''}`}
                onClick={() => setField('gender', g.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setField('gender', g.id)}
              >
                <div className="card-icon">{g.icon}</div>
                <div className="card-name">{g.label}</div>
                <div className="card-desc">{g.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Archetype */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <label className="char-label">✦ Choose Your Archetype</label>
          <div className="archetype-grid">
            {ARCHETYPES.map((a) => (
              <div
                key={a.id}
                id={`archetype-${a.id}`}
                className={`select-card ${form.wizardType === a.id ? 'selected' : ''}`}
                onClick={() => setField('wizardType', a.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setField('wizardType', a.id)}
              >
                <div className="card-icon">{a.icon}</div>
                <div className="card-name">{a.label}</div>
                <div className="card-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--clr-border), transparent)' }} />

        <motion.button
          id="begin-journey-btn"
          className="btn btn-primary btn-lg"
          onClick={handleBegin}
          disabled={!isValid}
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: 0.97 }}
          style={{ width: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          ✦ Begin the Journey ✦
        </motion.button>

        {!isValid && (
          <p style={{ textAlign: 'center', color: 'var(--txt-muted)', fontSize: '0.75rem' }}>
            Enter a name and choose your form & archetype to continue
          </p>
        )}
      </div>

      {/* Mobile fallback — stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          /* override inline widths */
        }
      `}</style>
    </div>
  );
}
