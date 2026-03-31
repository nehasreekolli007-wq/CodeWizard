// Puzzle 3 — Potion Water Sort
// Sort colored magical liquids into correct bottles
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

const PouringStream = ({ state }) => {
  const [coords, setCoords] = useState({ left: 0, top: 0, height: 0, width: 4 });
  
  useEffect(() => {
    const fromEl = document.getElementById(`bottle-${state.fromIdx}`);
    const toEl   = document.getElementById(`bottle-${state.toIdx}`);
    
    if (fromEl && toEl) {
      const fromRect = fromEl.getBoundingClientRect();
      const toRect   = toEl.getBoundingClientRect();
      const parentRect = fromEl.parentElement.getBoundingClientRect();
      
      const isRight = state.toIdx > state.fromIdx;
      
      // Calculate stream start (near the mouth of the tilted bottle)
      const startX = fromRect.left - parentRect.left + (isRight ? fromRect.width : 0);
      const startY = fromRect.top - parentRect.top;
      
      // Target (mouth of the destination bottle)
      const targetX = toRect.left - parentRect.left + toRect.width / 2;
      const targetY = toRect.top - parentRect.top;
      
      setCoords({
        left: startX,
        top: startY,
        width: Math.abs(targetX - startX),
        height: targetY - startY
      });
    }
  }, [state]);

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0 }}
      className="pouring-stream"
      style={{
        position: 'absolute',
        left: coords.left,
        top: coords.top,
        width: 6,
        height: coords.height,
        transformOrigin: 'top',
        background: `linear-gradient(to bottom, ${COLORS[state.color].bg}, ${COLORS[state.color].bg}aa)`,
        boxShadow: `0 0 15px ${COLORS[state.color].glow}`,
        zIndex: 10,
        borderRadius: 10,
      }}
    />
  );
};

const COLORS = {
  V: { bg: '#1a6b4a', label: 'Void Essence',  glow: 'rgba(26,107,74,0.5)' },
  T: { bg: '#14b8a6', label: 'Tidal Brew',    glow: 'rgba(20,184,166,0.5)' },
  A: { bg: '#f59e0b', label: 'Solar Amber',   glow: 'rgba(245,158,11,0.5)' },
  R: { bg: '#ef4444', label: 'Crimson Fire',  glow: 'rgba(239,68,68,0.5)'  },
};

function makeBottle(layers) { return [...layers]; }

const INITIAL_BOTTLES = [
  makeBottle(['V', 'R', 'T', 'A']),
  makeBottle(['A', 'T', 'V', 'R']),
  makeBottle(['T', 'A', 'R', 'V']),
  makeBottle(['R', 'V', 'A', 'T']),
  makeBottle([]),
  makeBottle([]),
];

const isSolved = (bottles) =>
  bottles.every((b) => b.length === 0 || (b.length === 4 && b.every((c) => c === b[0])));

const topColor = (bottle) => bottle.length > 0 ? bottle[bottle.length - 1] : null;

const countTopSame = (bottle) => {
  if (!bottle.length) return 0;
  const top = topColor(bottle);
  let count = 0;
  for (let i = bottle.length - 1; i >= 0; i--) {
    if (bottle[i] === top) count++;
    else break;
  }
  return count;
};

export default function Puzzle3_WaterSort({ onComplete }) {
  const { player, useHint, hintsUsed, showToast } = useGameStore();
  const [bottles, setBottles] = useState(INITIAL_BOTTLES.map(b => [...b]));
  const [selected, setSelected] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pouringState, setPouringState] = useState(null); // { from, to, color, amount }
  const [solved, setSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());

  const pour = async (toIdx) => {
    if (selected === null || selected === toIdx || solved || isAnimating) return;

    const from = [...bottles[selected]];
    const to   = [...bottles[toIdx]];
    const srcTop = topColor(from);

    if (!srcTop || to.length === 4) { setSelected(null); return; }
    if (to.length > 0 && topColor(to) !== srcTop) { setSelected(null); return; }

    const amount = countTopSame(from);
    const space  = 4 - to.length;
    const pourAmount = Math.min(amount, space);

    // 1. Kick off animation
    setIsAnimating(true);
    setPouringState({ fromIdx: selected, toIdx, color: srcTop, amount: pourAmount });

    // 2. Wait for tilt + stream start
    await new Promise(r => setTimeout(r, 600));

    // 3. Update the logical state (triggers layer height animations)
    const newFrom = from.slice(0, from.length - pourAmount);
    const newTo   = [...to, ...Array(pourAmount).fill(srcTop)];

    const newBottles = bottles.map((b, i) => {
      if (i === selected) return newFrom;
      if (i === toIdx)    return newTo;
      return [...b];
    });

    setBottles(newBottles);
    setMoves(m => m + 1);

    // 4. Wait for pouring to finish
    await new Promise(r => setTimeout(r, 600));

    // 5. Cleanup
    setPouringState(null);
    setIsAnimating(false);
    setSelected(null);

    if (isSolved(newBottles)) {
      setSolved(true);
      const solveTime = Math.floor((Date.now() - startTime) / 1000);
      updateProgress(player?.playerId, { puzzleIndex: 2, completed: true, solveTime }).catch(() => {});
      setTimeout(onComplete, 2200);
    }
  };

  const select = (idx) => {
    if (solved) return;
    if (selected === null) {
      if (bottles[idx].length === 0) return;
      setSelected(idx);
    } else {
      pour(idx);
    }
  };

  const reset = () => {
    setBottles(INITIAL_BOTTLES.map(b => [...b]));
    setSelected(null);
    setMoves(0);
    setSolved(false);
  };

  const giveHint = () => {
    useHint();
    showToast('Hint: Only pour if the top colors match OR the destination is empty. Use the empty bottles as buffer space.', 'info', 6000);
  };

  return (
    <div>
      <div className="puzzle-header">
        <div className="puzzle-number">Gate III of VII</div>
        <h2 className="puzzle-title">The Alchemist's Dilemma</h2>
        <p className="puzzle-desc">
          The magical essences have been mixed. Sort each liquid into its own bottle — only matching colors can be poured together, and only into available space.
        </p>
      </div>
      <div className="divider" />

      <div style={{ textAlign: 'center', marginBottom: 'var(--sp-md)' }}>
        <span style={{ color: 'var(--txt-muted)', fontSize: '0.8rem', fontFamily: "'Cinzel', serif" }}>
          Moves: {moves}
        </span>
      </div>

      <div className="bottles-grid" style={{ position: 'relative' }}>
        {bottles.map((bottle, idx) => {
          const isSelected = selected === idx;
          const isPouringFrom = pouringState?.fromIdx === idx;
          const isPouringTo   = pouringState?.toIdx === idx;

          const isValidTarget = selected !== null && selected !== idx && !isAnimating &&
            (bottle.length === 0 || (bottle.length < 4 && topColor(bottle) === topColor(bottles[selected])));

          return (
            <motion.div
              key={idx}
              layout
              id={`bottle-${idx}`}
              className={`bottle ${isSelected ? 'selected' : ''} ${isValidTarget ? 'valid-target' : ''}`}
              onClick={() => !isAnimating && select(idx)}
              animate={{
                rotateZ: isPouringFrom ? (pouringState.toIdx > idx ? 45 : -45) : 0,
                y: isPouringFrom ? -20 : isSelected ? -12 : 0,
                x: isPouringFrom ? (pouringState.toIdx > idx ? 20 : -20) : 0,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                boxShadow: isSelected
                  ? `0 -8px 20px ${COLORS[topColor(bottle)]?.glow || 'rgba(124,58,237,0.4)'}`
                  : isValidTarget
                  ? '0 0 15px rgba(20,184,166,0.4)'
                  : 'none',
              }}
            >
              {/* Glass Shine Effect */}
              <div className="bottle-shine" />

              {bottle.map((color, li) => (
                <motion.div
                  key={`${idx}-${li}-${color}`}
                  initial={{ height: 0 }}
                  animate={{ height: '25%' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="liquid-layer"
                  style={{
                    background: `linear-gradient(180deg, ${COLORS[color].bg}cc, ${COLORS[color].bg})`,
                    boxShadow: `inset 0 2px 4px rgba(255,255,255,0.15)`,
                  }}
                >
                  <div className="liquid-bubbles" />
                </motion.div>
              ))}
            </motion.div>
          );
        })}

        {/* Global Pouring Stream Effect */}
        <AnimatePresence>
          {pouringState && (
            <PouringStream state={pouringState} />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 'var(--sp-lg)' }}>
        {Object.entries(COLORS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--txt-secondary)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: v.bg, boxShadow: `0 0 6px ${v.glow}` }} />
            {v.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-xl)', justifyContent: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={reset} disabled={solved}>↺ Reset Bottles</button>
        <button className="btn btn-secondary btn-sm" onClick={giveHint} disabled={hintsUsed >= 3}>
          💡 Hint ({3 - hintsUsed} left)
        </button>
      </div>

      {solved && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', fontFamily: "'Cinzel', serif", color: 'var(--clr-teal)', marginTop: 'var(--sp-lg)', fontSize: '1.1rem' }}
        >
          ✦ All essences separated! The barrier yields… ✦
        </motion.p>
      )}
    </div>
  );
}
