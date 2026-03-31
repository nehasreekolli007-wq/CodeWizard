// Puzzle 6 — Mirror Maze (Beam Redirect)
// Rotate mirrors on a 5×5 grid to direct a beam to the crystal target
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

// Cell types: null=empty, '/'=mirror /, '\'=mirror \, 'S'=source, 'T'=target
const INITIAL_GRID = [
  ['S',  null, null, null, null],
  [null, '\\', null, null, null],
  [null, null, null, '/',  null],
  [null, null, '\\', null, null],
  [null, null, null, null, 'T' ],
];

// Direction: 'R'=right, 'L'=left, 'U'=up, 'D'=down
function traceBeam(grid) {
  const beamCells = new Set();
  let r = 0, c = 0, dir = 'R';
  let steps = 0;
  let reachedTarget = false;

  while (steps < 50) {
    const key = `${r},${c}`;
    if (beamCells.has(key)) break;
    beamCells.add(key);
    steps++;

    const cell = grid[r]?.[c];
    if (cell === 'T') { reachedTarget = true; break; }

    // Reflect off mirrors
    if (cell === '/') {
      dir = dir === 'R' ? 'U' : dir === 'L' ? 'D' : dir === 'U' ? 'R' : 'L';
    } else if (cell === '\\') {
      dir = dir === 'R' ? 'D' : dir === 'L' ? 'U' : dir === 'U' ? 'L' : 'R';
    }

    // Move
    if (dir === 'R') c++;
    else if (dir === 'L') c--;
    else if (dir === 'U') r--;
    else if (dir === 'D') r++;

    if (r < 0 || r >= 5 || c < 0 || c >= 5) break;
  }

  return { beamCells, reachedTarget };
}

const MIRROR_ICONS = { '/': '╱', '\\': '╲' };

export default function Puzzle6_Mirror({ onComplete }) {
  const { player, useHint, hintsUsed, showToast } = useGameStore();
  const [grid, setGrid] = useState(INITIAL_GRID.map(r => [...r]));
  const [solved, setSolved] = useState(false);
  const [startTime] = useState(Date.now());

  const { beamCells, reachedTarget } = traceBeam(grid);

  const rotateMirror = useCallback((r, c) => {
    if (solved) return;
    const cell = grid[r][c];
    if (cell === 'S' || cell === 'T') return;
    const next = grid.map(row => [...row]);
    if (cell === '/') next[r][c] = '\\';
    else if (cell === '\\') next[r][c] = null;
    else next[r][c] = '/';
    setGrid(next);

    const { reachedTarget: hit } = traceBeam(next);
    if (hit) {
      setSolved(true);
      const solveTime = Math.floor((Date.now() - startTime) / 1000);
      updateProgress(player?.playerId, { puzzleIndex: 5, completed: true, solveTime }).catch(() => {});
      setTimeout(onComplete, 1800);
    }
  }, [grid, solved]);

  const giveHint = () => {
    useHint();
    showToast('Hint: Click empty cells to add mirrors. Click mirrors to rotate them. Get the beam (starting top-left) to hit the crystal (bottom-right).', 'info', 6000);
  };

  return (
    <div>
      <div className="puzzle-header">
        <div className="puzzle-number">Gate VI of VII</div>
        <h2 className="puzzle-title">The Mirror Labyrinth</h2>
        <p className="puzzle-desc">
          A magical beam of light enters from the source. Rotate and place mirror shards to redirect it onto the target crystal. Click cells to cycle through mirror types.
        </p>
      </div>
      <div className="divider" />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-lg)' }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 'var(--sp-lg)', fontSize: '0.8rem', color: 'var(--txt-secondary)' }}>
          <span>⚡ <span style={{ color: 'var(--clr-violet)' }}>S</span> = Source</span>
          <span>💎 <span style={{ color: 'var(--clr-teal)' }}>T</span> = Target Crystal</span>
          <span>Click empty → add mirror</span>
          <span>Click mirror → rotate/remove</span>
        </div>

        {/* Grid */}
        <div className="mirror-grid">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const onBeam = beamCells.has(key);
              const isTarget = cell === 'T';
              const isSource = cell === 'S';

              return (
                <motion.div
                  key={key}
                  id={`mirror-${r}-${c}`}
                  className={`mirror-cell ${isSource ? 'source' : ''} ${isTarget ? (reachedTarget && solved ? 'target lit' : 'target') : ''} ${onBeam && !isSource && !isTarget ? 'beam-active' : ''} ${cell === '/' || cell === '\\' ? 'has-mirror' : ''}`}
                  onClick={() => rotateMirror(r, c)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {isSource && <span style={{ fontSize: '1.6rem' }}>⚡</span>}
                  {isTarget && <span style={{ fontSize: '1.6rem' }}>{(reachedTarget && solved) ? '💥' : '💎'}</span>}
                  {(cell === '/' || cell === '\\') && (
                    <span style={{
                      fontSize: '2.2rem', fontWeight: 700,
                      color: onBeam ? 'var(--clr-amber)' : 'var(--txt-accent)',
                      textShadow: onBeam ? 'var(--shadow-amber)' : 'none',
                      lineHeight: 1,
                    }}>
                      {MIRROR_ICONS[cell]}
                    </span>
                  )}
                  {/* Beam indicator on empty cells */}
                  {onBeam && !cell && !isSource && !isTarget && (
                    <div style={{
                      width: '60%', height: 3,
                      background: 'var(--clr-amber)',
                      boxShadow: 'var(--shadow-amber)',
                      borderRadius: 2,
                    }} />
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {solved && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ fontFamily: "'Cinzel', serif", color: 'var(--clr-teal)', fontSize: '1.1rem', textAlign: 'center' }}
          >
            ✦ The crystal ignites! The sixth barrier shatters! ✦
          </motion.p>
        )}

        <button className="btn btn-secondary btn-sm" onClick={giveHint} disabled={hintsUsed >= 3 || solved}>
          💡 Hint ({3 - hintsUsed} left)
        </button>
      </div>
    </div>
  );
}
