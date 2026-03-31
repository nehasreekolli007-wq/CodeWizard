// Barrier Chamber — CSS perspective corridor + 7 glowing doors (no WebGL context limit issue)
import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';

import Puzzle1_Observation  from '../puzzles/Puzzle1_Observation';
import Puzzle2_Symbols      from '../puzzles/Puzzle2_Symbols';
import Puzzle3_WaterSort    from '../puzzles/Puzzle3_WaterSort';
import Puzzle4_Crossword    from '../puzzles/Puzzle4_Crossword';
import Puzzle5_Sudoku       from '../puzzles/Puzzle5_Sudoku';
import Puzzle6_Mirror       from '../puzzles/Puzzle6_Mirror';
import Puzzle7_Stones       from '../puzzles/Puzzle7_Stones';

const PUZZLE_COMPONENTS = [
  Puzzle1_Observation, Puzzle2_Symbols, Puzzle3_WaterSort,
  Puzzle4_Crossword,   Puzzle5_Sudoku,  Puzzle6_Mirror, Puzzle7_Stones,
];

const PUZZLE_NAMES = [
  'The Anomaly Log', 'The Rune Sequence', "Alchemist's Dilemma",
  'The Lore Codex',  'The Fate Grid',     'Mirror Labyrinth', 'The Void Crossing',
];

const DOOR_COLORS = [
  '#d4a520', '#e07b0a', '#b5922a',
  '#2e7d5a', '#c0392b', '#d4a520', '#27ae60',
];

const DOOR_ICONS = ['👁️', '🔮', '⚗️', '📜', '🎲', '🪞', '🪨'];

// ── CSS Perspective Corridor ───────────────────────────────────────────────────
function CSSCorridor({ completed, currentPuzzle, player, isPuzzleDone, onDoorClick }) {
  const wizardX = `calc(${(Math.min(currentPuzzle, 6)) / 6 * 80 + 5}% - 24px)`;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 80%, #0e1a08 0%, #050908 60%, #020504 100%)',
    }}>
      {/* Ambient top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(181,146,42,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Perspective floor ── */}
      <div style={{
        position: 'absolute',
        bottom: '18%', left: '50%',
        transform: 'translateX(-50%) perspective(600px) rotateX(55deg)',
        transformOrigin: 'bottom center',
        width: '200%',
        height: '80%',
        background: 'repeating-linear-gradient(90deg, rgba(181,146,42,0.06) 0px, rgba(181,146,42,0.06) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, rgba(181,146,42,0.06) 0px, rgba(181,146,42,0.06) 1px, transparent 1px, transparent 80px), #080e06',
        borderTop: '2px solid rgba(181,146,42,0.25)',
        pointerEvents: 'none',
      }} />

      {/* Gold runner on floor */}
      <div style={{
        position: 'absolute',
        bottom: '17%', left: '5%', right: '5%',
        height: '3px',
        background: 'linear-gradient(90deg, transparent, #b5922a, #d4a520, #b5922a, transparent)',
        boxShadow: '0 0 20px rgba(181,146,42,0.6)',
        pointerEvents: 'none',
      }} />

      {/* ── Left wall ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: '18%',
        width: '80px',
        background: 'linear-gradient(to right, #030804, #0a1008)',
        borderRight: '1px solid rgba(181,146,42,0.08)',
        pointerEvents: 'none',
      }}>
        {/* Left wall torches */}
        {[20, 45, 70].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${pct}%`, right: 12,
            width: 8, height: 24,
            background: '#3a2a0a',
            borderRadius: 2,
          }}>
            <div style={{
              position: 'absolute', top: -10, left: '50%',
              transform: 'translateX(-50%)',
              width: 14, height: 18,
              background: 'radial-gradient(ellipse at center, #e07b0a, #ffaa00, transparent)',
              borderRadius: '50% 50% 40% 40%',
              animation: `flicker-${i} ${1.8 + i * 0.3}s ease-in-out infinite alternate`,
              filter: 'blur(1px)',
            }} />
            <div style={{
              position: 'absolute', top: -16, left: '50%',
              transform: 'translateX(-50%)',
              width: 30, height: 30,
              background: 'radial-gradient(ellipse, rgba(224,123,10,0.35) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
          </div>
        ))}
      </div>

      {/* ── Right wall ── */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: '18%',
        width: '80px',
        background: 'linear-gradient(to left, #030804, #0a1008)',
        borderLeft: '1px solid rgba(181,146,42,0.08)',
        pointerEvents: 'none',
      }}>
        {[25, 50, 75].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${pct}%`, left: 12,
            width: 8, height: 24,
            background: '#3a2a0a',
            borderRadius: 2,
          }}>
            <div style={{
              position: 'absolute', top: -10, left: '50%',
              transform: 'translateX(-50%)',
              width: 14, height: 18,
              background: 'radial-gradient(ellipse at center, #e07b0a, #ffaa00, transparent)',
              borderRadius: '50% 50% 40% 40%',
              filter: 'blur(1px)',
              animation: `flicker-${i} ${1.6 + i * 0.4}s ease-in-out infinite alternate`,
            }} />
          </div>
        ))}
      </div>

      {/* ── 7 Doors ── */}
      <div style={{
        position: 'absolute',
        top: '8%', left: '80px', right: '80px', bottom: '20%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-evenly',
        gap: '8px',
        padding: '0 16px',
      }}>
        {Array.from({ length: 7 }, (_, i) => {
          const done   = completed.includes(i);
          const active = currentPuzzle === i && !done;
          const locked = i > currentPuzzle;
          const color  = DOOR_COLORS[i];

          return (
            <motion.div
              key={i}
              onClick={() => !locked && !done && onDoorClick(i)}
              whileHover={!locked && !done ? { scale: 1.04, y: -4 } : {}}
              whileTap={!locked && !done ? { scale: 0.97 } : {}}
              style={{
                flex: 1,
                maxWidth: 120,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: locked || done ? 'default' : 'pointer',
                position: 'relative',
              }}
            >
              {/* Door arch frame */}
              <div style={{
                width: '100%',
                height: 'clamp(100px, 22vw, 220px)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                {/* Left pillar */}
                <div style={{
                  position: 'absolute',
                  left: 0, bottom: 0,
                  width: '14%', height: '85%',
                  background: done
                    ? 'linear-gradient(180deg, #2e7d5a, #1a4a30)'
                    : active
                    ? `linear-gradient(180deg, ${color}aa, ${color}44)`
                    : 'linear-gradient(180deg, #1e1a10, #141008)',
                  borderRadius: '4px 4px 0 0',
                  border: done
                    ? '1px solid rgba(46,125,90,0.6)'
                    : active
                    ? `1px solid ${color}99`
                    : '1px solid rgba(181,146,42,0.1)',
                  boxShadow: active ? `0 0 20px ${color}66` : done ? '0 0 12px rgba(46,125,90,0.4)' : 'none',
                  transition: 'all 0.4s ease',
                }} />

                {/* Right pillar */}
                <div style={{
                  position: 'absolute',
                  right: 0, bottom: 0,
                  width: '14%', height: '85%',
                  background: done
                    ? 'linear-gradient(180deg, #2e7d5a, #1a4a30)'
                    : active
                    ? `linear-gradient(180deg, ${color}aa, ${color}44)`
                    : 'linear-gradient(180deg, #1e1a10, #141008)',
                  borderRadius: '4px 4px 0 0',
                  border: done
                    ? '1px solid rgba(46,125,90,0.6)'
                    : active
                    ? `1px solid ${color}99`
                    : '1px solid rgba(181,146,42,0.1)',
                  boxShadow: active ? `0 0 20px ${color}66` : done ? '0 0 12px rgba(46,125,90,0.4)' : 'none',
                  transition: 'all 0.4s ease',
                }} />

                {/* Top arch */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '8%', right: '8%',
                  height: '30%',
                  borderRadius: '50% 50% 0 0',
                  border: done
                    ? '2px solid #27ae60'
                    : active
                    ? `2px solid ${color}`
                    : '2px solid rgba(181,146,42,0.12)',
                  borderBottom: 'none',
                  boxShadow: active ? `0 -4px 20px ${color}88` : done ? '0 -4px 16px rgba(39,174,96,0.5)' : 'none',
                  transition: 'all 0.4s ease',
                }} />

                {/* Door interior */}
                <div style={{
                  position: 'absolute',
                  top: '15%', bottom: 0,
                  left: '15%', right: '15%',
                  background: done
                    ? 'linear-gradient(180deg, rgba(39,174,96,0.15), rgba(46,125,90,0.05))'
                    : active
                    ? `linear-gradient(180deg, ${color}22, ${color}08)`
                    : locked
                    ? 'rgba(0,0,0,0.5)'
                    : 'rgba(0,0,0,0.3)',
                  borderLeft:  done ? '1px solid rgba(39,174,96,0.2)' : active ? `1px solid ${color}33` : '1px solid rgba(181,146,42,0.05)',
                  borderRight: done ? '1px solid rgba(39,174,96,0.2)' : active ? `1px solid ${color}33` : '1px solid rgba(181,146,42,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(1rem, 2.5vw, 2rem)',
                  transition: 'all 0.4s ease',
                  overflow: 'hidden',
                }}>
                  {/* Active door glow pulse */}
                  {active && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(ellipse at center, ${color}33, transparent)`,
                      }}
                    />
                  )}

                  {/* Door icon */}
                  <div style={{
                    fontSize: 'clamp(0.9rem, 2vw, 1.5rem)',
                    opacity: done ? 0.3 : locked ? 0.15 : 0.7,
                    filter: active ? `drop-shadow(0 0 8px ${color})` : 'none',
                    zIndex: 1,
                  }}>
                    {done ? '✓' : locked ? '🔒' : DOOR_ICONS[i]}
                  </div>
                </div>

                {/* Active door — glowing frame line at bottom */}
                {active && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      bottom: 0, left: '10%', right: '10%',
                      height: 2,
                      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                      boxShadow: `0 0 12px ${color}`,
                    }}
                  />
                )}

                {/* Done check badge */}
                {done && (
                  <div style={{
                    position: 'absolute',
                    top: -8, right: -4,
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2e7d5a, #27ae60)',
                    border: '1px solid #27ae60',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: '#fff',
                    boxShadow: '0 0 10px rgba(39,174,96,0.6)',
                  }}>✓</div>
                )}
              </div>

              {/* Door number label */}
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(0.5rem, 1.2vw, 0.7rem)',
                color: done ? '#27ae60' : active ? color : 'rgba(181,146,42,0.25)',
                marginTop: 6,
                letterSpacing: '0.1em',
                textAlign: 'center',
                lineHeight: 1.2,
                transition: 'color 0.4s ease',
              }}>
                {done ? '✦' : i + 1}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Wizard character walking along the floor ── */}
      <motion.div
        animate={{ x: `calc(${(Math.min(currentPuzzle, 6) / 6) * 76 + 8}vw - 36px)` }}
        transition={{ duration: 1.2, ease: 'easeInOut', type: 'spring', stiffness: 60 }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: 0,
          width: 72,
          textAlign: 'center',
          zIndex: 20,
        }}
      >
        {/* Wizard shadow */}
        <div style={{
          width: 48, height: 8,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
          margin: '0 auto',
          borderRadius: '50%',
        }} />

        {/* Character emoji for now — walking bob animation */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            lineHeight: 1,
            filter: 'drop-shadow(0 0 8px rgba(212,165,32,0.7))',
          }}
        >
          {player?.gender === 'female' ? '🧙‍♀️' : '🧙‍♂️'}
        </motion.div>

        {/* Name plate */}
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '0.55rem',
          color: 'rgba(212,165,32,0.7)',
          letterSpacing: '0.1em',
          marginTop: 2,
          whiteSpace: 'nowrap',
        }}>
          {player?.wizardName?.substring(0, 8)}
        </div>
      </motion.div>

      {/* Torch flame keyframes */}
      <style>{`
        @keyframes torchFlicker {
          0%   { transform: translateX(-50%) scaleX(1)   scaleY(1);   opacity: 0.9; }
          25%  { transform: translateX(-48%) scaleX(0.9) scaleY(1.1); opacity: 1;   }
          50%  { transform: translateX(-52%) scaleX(1.1) scaleY(0.9); opacity: 0.8; }
          75%  { transform: translateX(-50%) scaleX(0.95) scaleY(1.05); opacity: 1; }
          100% { transform: translateX(-50%) scaleX(1)   scaleY(1);   opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function BarrierChamber() {
  const {
    puzzlesCompleted, currentPuzzle, activePuzzle,
    openPuzzle, closePuzzle, completePuzzle,
    setScene, player, score, showToast, isPuzzleDone,
  } = useGameStore();

  const [doorFlash, setDoorFlash] = useState(null);

  const handlePuzzleComplete = (idx) => {
    completePuzzle(idx);
    setDoorFlash(idx);
    showToast(
      `✦ Gate ${idx + 1} shattered! ${idx < 6 ? 'Advance to the next seal…' : 'All barriers broken!'}`,
      'success', 4000
    );
    setTimeout(() => setDoorFlash(null), 2200);
    if (idx === 6) {
      setTimeout(() => setScene('victory'), 2800);
    }
  };

  const handleDoorClick = (i) => {
    if (i > currentPuzzle) { showToast('You must break the current gate first!', 'info'); return; }
    if (isPuzzleDone(i)) return;
    openPuzzle(i);
  };

  const ActivePuzzle = activePuzzle !== null ? PUZZLE_COMPONENTS[activePuzzle] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* CSS Corridor — no WebGL! */}
      <CSSCorridor
        completed={puzzlesCompleted}
        currentPuzzle={currentPuzzle}
        player={player}
        isPuzzleDone={isPuzzleDone}
        onDoorClick={handleDoorClick}
      />

      {/* Top vignette */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(to bottom, rgba(4,6,3,0.7), transparent)',
        pointerEvents: 'none', zIndex: 5,
      }} />

      {/* Door solve flash */}
      <AnimatePresence>
        {doorFlash !== null && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(46,125,90,0.5) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 6,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── HUD ── */}
      <div className="hud" style={{ zIndex: 10 }}>
        <div className="glass hud-wizard-info">
          <div className="hud-avatar">{player?.gender === 'female' ? '🧙‍♀️' : '🧙‍♂️'}</div>
          <div>
            <div className="hud-name">{player?.wizardName}</div>
            <div className="hud-type">{player?.wizardType?.replace('-', ' ')}</div>
          </div>
        </div>
        <div className="glass" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: 'var(--txt-accent)' }}>
            🚪 Gates Broken: {puzzlesCompleted.length} / 7
          </span>
          <span className="hud-score">⭐ {score.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Barrier progress nodes (bottom) ── */}
      <div className="barrier-progress" style={{ zIndex: 10 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const done   = isPuzzleDone(i);
          const active = currentPuzzle === i && !done;
          const locked = i > currentPuzzle;
          return (
            <motion.div
              key={i}
              id={`gate-node-${i + 1}`}
              className={`barrier-node ${done ? 'done' : active ? 'active' : 'locked'}`}
              onClick={() => !locked && !done && openPuzzle(i)}
              whileHover={!locked && !done ? { scale: 1.14 } : {}}
              whileTap={!locked && !done ? { scale: 0.9 } : {}}
              title={PUZZLE_NAMES[i]}
              style={{ cursor: locked || done ? 'default' : 'pointer' }}
            >
              {done ? '✓' : i + 1}
            </motion.div>
          );
        })}
      </div>

      {/* ── Approach Gate button ── */}
      <AnimatePresence>
        {activePuzzle === null && currentPuzzle < 7 && !isPuzzleDone(currentPuzzle) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: 100, left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10, textAlign: 'center',
            }}
          >
            <p style={{
              color: 'var(--txt-muted)', fontSize: '0.72rem',
              fontFamily: "'Cinzel', serif", marginBottom: 12, letterSpacing: '0.1em',
            }}>
              {DOOR_ICONS[currentPuzzle]} {PUZZLE_NAMES[currentPuzzle]}
            </p>
            <motion.button
              id={`open-puzzle-${currentPuzzle + 1}`}
              className="btn btn-primary btn-lg"
              onClick={() => openPuzzle(currentPuzzle)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              animate={{
                boxShadow: [
                  '0 4px 20px rgba(181,146,42,0.45)',
                  '0 4px 40px rgba(181,146,42,0.75)',
                  '0 4px 20px rgba(181,146,42,0.45)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✦ Approach Gate {currentPuzzle + 1} ✦
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All gates cleared */}
      <AnimatePresence>
        {currentPuzzle >= 7 && puzzlesCompleted.length >= 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute', bottom: 100, left: '50%',
              transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10,
            }}
          >
            <p style={{ color: 'var(--clr-teal)', fontFamily: "'Cinzel', serif", fontSize: '0.88rem', marginBottom: 12 }}>
              ✦ All barriers shattered! The Dark Lord awaits… ✦
            </p>
            <button className="btn btn-amber btn-lg" onClick={() => setScene('victory')}>
              ⚔ Face the Dark Lord ⚔
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Puzzle overlay ── */}
      <AnimatePresence>
        {activePuzzle !== null && ActivePuzzle && (
          <motion.div
            className="puzzle-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 200 }}
          >
            <div className="glass puzzle-panel">
              <button className="close-btn" onClick={closePuzzle} title="Close puzzle">✕</button>
              <ActivePuzzle onComplete={() => handlePuzzleComplete(activePuzzle)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
