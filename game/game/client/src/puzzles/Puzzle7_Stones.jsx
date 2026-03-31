// Puzzle 7 — Stepping Stone Sequence
// Memory + logic: path shown briefly, then player must cross correctly
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

const ROWS = 5;
const COLS = 4;
const TOTAL = ROWS * COLS;

// Safe path (indices in sequence — must step in order)
const SAFE_PATH = [0, 4, 5, 9, 10, 14, 15, 19];
const SAFE_SET = new Set(SAFE_PATH);

// Advanced SVG components for the stones
const BaseRuneNode = ({ active, color, error }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* Outer rotating aura */}
    {active && (
      <motion.circle
        cx="50" cy="50" r="44"
        fill="none" stroke={color} strokeWidth="2" strokeDasharray="10 10"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.6 }}
      />
    )}
    <polygon
      points="50,10 90,30 90,70 50,90 10,70 10,30"
      fill={error ? "rgba(180, 20, 20, 0.4)" : active ? `rgba(20, 184, 166, 0.15)` : "rgba(30,35,40,0.5)"}
      stroke={error ? "#ff3333" : active ? color : "rgba(181, 146, 42, 0.2)"}
      strokeWidth={active ? "3" : "1"}
      style={{
        filter: active ? `drop-shadow(0 0 12px ${color})` : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
      }}
    />
    {active && (
      <circle cx="50" cy="50" r="12" fill={color} />
    )}
    {error && (
      <path d="M35,35 L65,65 M65,35 L35,65" stroke="#ff3333" strokeWidth="6" strokeLinecap="round" />
    )}
    {!active && !error && (
      <circle cx="50" cy="50" r="8" fill="rgba(181, 146, 42, 0.4)" />
    )}
  </svg>
);

export default function Puzzle7_Stones({ onComplete }) {
  const { player, useHint, hintsUsed, showToast } = useGameStore();
  const [phase, setPhase] = useState('preview'); // preview | play | failed | done
  const [stepped, setStepped] = useState([]);     // which stones player stepped on correctly
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [revealed, setRevealed] = useState(false);

  // Show path for 2 seconds, then hide
  useEffect(() => {
    if (phase === 'preview') {
      setRevealed(true);
      const t = setTimeout(() => {
        setRevealed(false);
        setPhase('play');
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleStep = useCallback((idx) => {
    if (phase !== 'play') return;

    const nextExpected = SAFE_PATH[stepped.length];
    if (idx === nextExpected) {
      const next = [...stepped, idx];
      setStepped(next);
      if (next.length === SAFE_PATH.length) {
        setPhase('done');
        const solveTime = Math.floor((Date.now() - startTime) / 1000);
        updateProgress(player?.playerId, { puzzleIndex: 6, completed: true, attempts: attempts + 1, solveTime }).catch(() => { });
        setTimeout(onComplete, 2000);
      }
    } else {
      setAttempts(a => a + 1);
      showToast('A dark void triggers! The path shifts…', 'error', 2000);
      setPhase('failed');
      setTimeout(() => {
        setStepped([]);
        setPhase('preview');
      }, 1200);
    }
  }, [phase, stepped, attempts, player, startTime, onComplete, showToast]);

  const giveHint = () => {
    useHint();
    setRevealed(true);
    showToast('Hint: Memorize the glowing resonance path.', 'info', 3000);
    setTimeout(() => setRevealed(false), 2500);
  };

  const getStoneState = (idx) => {
    if (stepped.includes(idx)) return 'correct';
    if (phase === 'done') return SAFE_SET.has(idx) ? 'correct' : 'hidden';
    if (phase === 'failed' && idx === SAFE_PATH[stepped.length]) return 'wrong';
    if (revealed && SAFE_SET.has(idx)) return 'safe';
    if (idx === 0 && phase === 'play' && stepped.length === 0) return 'start';
    return 'hidden';
  };

  const isClickable = (idx) => phase === 'play' && !stepped.includes(idx);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="puzzle-header" style={{ marginBottom: '10px' }}>
        <div className="puzzle-number" style={{ color: 'var(--clr-fuchsia)' }}>Gate VII of VII</div>
        <h2 className="puzzle-title" style={{ fontSize: '2rem', textShadow: '0 0 15px rgba(212,165,32,0.5)' }}>The Void Crossing</h2>
        <p className="puzzle-desc">
          Only the illuminated nodes can hold your weight. Memorize the path before the darkness consumes it. One misstep unravels your essence.
        </p>
      </div>

      {/* Dynamic Status Bar */}
      <div style={{
        textAlign: 'center', marginBottom: '16px', height: '24px',
        fontFamily: "'Cinzel', serif", fontSize: '0.95rem', letterSpacing: '0.1em'
      }}>
        <AnimatePresence mode="wait">
          {phase === 'preview' && (
            <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1, color: '#14b8a6' }} exit={{ opacity: 0 }}>
              ✦ Attune to the resonance path… ✦
            </motion.div>
          )}
          {phase === 'play' && (
            <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1, color: '#b5922a' }} exit={{ opacity: 0 }}>
              Step {stepped.length} of {SAFE_PATH.length}
            </motion.div>
          )}
          {phase === 'failed' && (
            <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1, color: '#ef4444' }} exit={{ opacity: 0 }}>
              ✕ The void claims you. Resetting…
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="d" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, color: '#d4a520' }} exit={{ opacity: 0 }}>
              ✦ The Final Seal Shatters ✦
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Futuristic Glass-morphic Grid Container */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5, 7, 10, 0.4)',
        border: '1px solid rgba(181, 146, 42, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: '12px',
          width: '100%',
          maxWidth: '480px',
          perspective: '1000px'
        }}>
          {Array.from({ length: TOTAL }, (_, idx) => {
            const state = getStoneState(idx);
            const clickable = isClickable(idx);
            const isActive = state === 'safe' || state === 'correct' || state === 'start';
            const isError = state === 'wrong';
            const nodeColor = state === 'start' ? '#d4a520' : '#14b8a6';

            return (
              <motion.div
                key={idx}
                onClick={() => clickable && handleStep(idx)}
                whileHover={clickable ? { scale: 1.1, z: 20 } : {}}
                whileTap={clickable ? { scale: 0.9, z: -10 } : {}}
                animate={{
                  y: isActive ? [0, -6, 0] : 0,
                  opacity: state === 'hidden' && phase === 'done' ? 0.1 : 1
                }}
                transition={{
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: (idx % COLS) * 0.2 },
                  opacity: { duration: 1 }
                }}
                style={{
                  aspectRatio: '1',
                  cursor: clickable ? 'pointer' : 'default',
                  position: 'relative'
                }}
              >
                <BaseRuneNode active={isActive} error={isError} color={nodeColor} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <div style={{ color: 'var(--txt-muted)', fontSize: '0.8rem', fontFamily: "'Cinzel', serif" }}>
          Void Slips: <span style={{ color: attempts > 0 ? '#ef4444' : 'inherit' }}>{attempts}</span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={giveHint}
          disabled={hintsUsed >= 3 || phase !== 'play'}
          style={{ background: 'linear-gradient(to right, #1e293b, #0f172a)' }}
        >
          💡 Reveal Path ({3 - hintsUsed} left)
        </button>
      </div>
    </div>
  );
}
