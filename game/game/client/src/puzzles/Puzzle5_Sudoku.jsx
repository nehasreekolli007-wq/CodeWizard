// Puzzle 5 — Sudoku of Fate (6×6 grid, realm symbols)
import { useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

const SYMBOLS = ['⭐', '🔥', '💎', '🌀', '🍃', '⚡'];

// 6×6 valid sudoku puzzle layout (0 = empty)
const PUZZLE = [
  [1, 0, 3, 0, 5, 0],
  [0, 5, 0, 1, 0, 3],
  [0, 3, 1, 0, 6, 0],
  [5, 0, 0, 2, 0, 1],
  [3, 0, 2, 0, 4, 0],
  [0, 4, 0, 3, 0, 2],
];

// Valid mathematically correct 6x6 Sudoku solution
const SOLUTION = [
  [1, 2, 3, 4, 5, 6],
  [4, 5, 6, 1, 2, 3],
  [2, 3, 1, 5, 6, 4],
  [5, 6, 4, 2, 3, 1],
  [3, 1, 2, 6, 4, 5],
  [6, 4, 5, 3, 1, 2],
];

const isFixed = (r, c) => PUZZLE[r][c] !== 0;

const validate = (grid) => {
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++)
      if (grid[r][c] !== SOLUTION[r][c]) return false;
  return true;
};

const hasDuplicate = (grid, r, c, val) => {
  if (!val) return false;
  // Check row
  for (let cc = 0; cc < 6; cc++)
    if (cc !== c && grid[r][cc] === val) return true;
  // Check col
  for (let rr = 0; rr < 6; rr++)
    if (rr !== r && grid[rr][c] === val) return true;
  // Check 2×3 box
  const boxR = Math.floor(r / 2) * 2;
  const boxC = Math.floor(c / 3) * 3;
  for (let rr = boxR; rr < boxR + 2; rr++)
    for (let cc = boxC; cc < boxC + 3; cc++)
      if ((rr !== r || cc !== c) && grid[rr][cc] === val) return true;
  return false;
};

export default function Puzzle5_Sudoku({ onComplete }) {
  const { player, useHint, hintsUsed, showToast } = useGameStore();
  const [grid, setGrid] = useState(PUZZLE.map(r => [...r]));
  const [active, setActive] = useState(null);
  const [solved, setSolved] = useState(false);
  const [startTime] = useState(Date.now());

  const selectCell = (r, c) => { if (!isFixed(r, c) && !solved) setActive([r, c]); };

  const placeNum = (n) => {
    if (!active || solved) return;
    const [r, c] = active;
    const next = grid.map(row => [...row]);
    next[r][c] = n;
    setGrid(next);
    
    // Check if fully solved
    if (next.every((row, ri) => row.every((v, ci) => v !== 0)) && validate(next)) {
      setSolved(true);
      const solveTime = Math.floor((Date.now() - startTime) / 1000);
      updateProgress(player?.playerId, { puzzleIndex: 4, completed: true, solveTime }).catch(() => {});
      setTimeout(onComplete, 1800);
    }
  };

  const giveHint = () => {
    useHint();
    if (!active) { showToast('Select an empty cell first, then ask for a hint.', 'info'); return; }
    const [r, c] = active;
    const next = grid.map(row => [...row]);
    next[r][c] = SOLUTION[r][c];
    setGrid(next);
    showToast(`Revealed: ${SYMBOLS[SOLUTION[r][c] - 1]} for this cell!`, 'info', 3000);
    
    // Re-check just in case the hint finishes the puzzle
    if (next.every((row, ri) => row.every((v, ci) => v !== 0)) && validate(next)) {
      setSolved(true);
      setTimeout(onComplete, 1800);
    }
  };

  return (
    <div>
      <div className="puzzle-header">
        <div className="puzzle-number">Gate V of VII</div>
        <h2 className="puzzle-title">The Fate Grid</h2>
        <p className="puzzle-desc">
          Six ancient symbols. Each must appear exactly once in every row, column, and grouped 2×3 box. Fill the grid to unlock this barrier.
        </p>
      </div>
      <div className="divider" />

      {/* Symbol legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 'var(--sp-lg)', flexWrap: 'wrap' }}>
        {SYMBOLS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--txt-secondary)' }}>
            <span style={{ fontSize: '1.2rem' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="sudoku-grid" style={{ width: 'fit-content', margin: '0 auto' }}>
        {grid.map((row, r) =>
          row.map((val, c) => {
            const fixed    = isFixed(r, c);
            const isActive = active && active[0] === r && active[1] === c;
            const hasErr   = !fixed && val !== 0 && hasDuplicate(grid, r, c, val);
            const isRight  = !fixed && val !== 0 && val === SOLUTION[r][c] && !hasErr;
            return (
               <motion.div
                key={`${r}-${c}`}
                id={`sudoku-${r}-${c}`}
                className={`sudoku-cell ${fixed ? 'fixed' : ''} ${isActive ? 'active' : ''} ${hasErr ? 'error' : ''} ${isRight ? 'correct' : ''}`}
                onClick={() => selectCell(r, c)}
                whileHover={!fixed ? { scale: 1.05 } : {}}
                style={{
                  borderRight: (c + 1) % 3 === 0 && c !== 5 ? '2px solid rgba(46,125,90,0.6)' : undefined,
                  borderBottom: (r + 1) % 2 === 0 && r !== 5 ? '2px solid rgba(46,125,90,0.6)' : undefined,
                }}
              >
                {val !== 0 ? SYMBOLS[val - 1] : ''}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Number pad */}
      <div className="sudoku-numpad" style={{ maxWidth: 360, margin: 'var(--sp-lg) auto 0' }}>
        {SYMBOLS.map((s, i) => (
          <motion.div
            key={i}
            className="sudoku-num"
            onClick={() => placeNum(i + 1)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {s}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-xl)', justifyContent: 'center' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { if (active) placeNum(0); }}
          disabled={solved}
        >
          ✕ Clear Cell
        </button>
        <button className="btn btn-secondary btn-sm" onClick={giveHint} disabled={hintsUsed >= 3 || solved}>
          💡 Hint ({3 - hintsUsed} left)
        </button>
      </div>

      {solved && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', fontFamily: "'Cinzel', serif", color: 'var(--clr-teal)', marginTop: 'var(--sp-lg)' }}
        >
          ✦ The Fate Grid aligns. The barrier yields… ✦
        </motion.p>
      )}
    </div>
  );
}
