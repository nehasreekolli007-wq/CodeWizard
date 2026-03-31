// Puzzle 4 — Wizarding Crossword
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

/**
 * WORDS & INTERSECTIONS:
 * 1. WIZARD (Across) [R2, C5-10]
 * 2. WAND (Down) [C5, R2-5] - Shared 'W' at [R2, C5]
 * 3. BROOMSTICK (Across) [R7, C0-9]
 * 4. DRAGON (Down) [C3, R3-8] - Shared 'O' at [R7, C3]
 * 5. MAGICACADEMY (Down) [C8, R1-12] - Shared 'A' at [R2, C8] with WIZARD
 * 6. INVISIBILITY (Across) [R4, C8-19] - Shared 'I' at [R4, C8] with MAGICACADEMY
 */

const GRID_TEMPLATE = [
  // 00   01    02    03    04    05    06    07    08    09    10    11    12    13    14    15    16    17    18    19
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], // R0
  [null, null, null, null, null, null, null, null, 'M',  null, null, null, null, null, null, null, null, null, null, null], // R1
  [null, null, null, null, null, 'W',  'I',  'Z',  'A',  'R',  'D',  null, null, null, null, null, null, null, null, null], // R2
  [null, null, null, 'D',  null, 'A',  null, null, 'G',  null, null, null, null, null, null, null, null, null, null, null], // R3
  [null, null, null, 'R',  null, 'N',  null, null, 'I',  'N',  'V',  'I',  'S',  'I',  'B',  'I',  'L',  'I',  'T',  'Y' ], // R4
  [null, null, null, 'A',  null, 'D',  null, null, 'C',  null, null, null, null, null, null, null, null, null, null, null], // R5
  [null, null, null, 'G',  null, null, null, null, 'A',  null, null, null, null, null, null, null, null, null, null, null], // R6
  ['B',  'R',  'O',  'O',  'M',  'S',  'T',  'I',  'C',  'K',  null, null, null, null, null, null, null, null, null, null], // R7
  [null, null, null, 'N',  null, null, null, null, 'A',  null, null, null, null, null, null, null, null, null, null, null], // R8
  [null, null, null, null, null, null, null, null, 'D',  null, null, null, null, null, null, null, null, null, null, null], // R9
  [null, null, null, null, null, null, null, null, 'E',  null, null, null, null, null, null, null, null, null, null, null], // R10
  [null, null, null, null, null, null, null, null, 'M',  null, null, null, null, null, null, null, null, null, null, null], // R11
  [null, null, null, null, null, null, null, null, 'Y',  null, null, null, null, null, null, null, null, null, null, null], // R12
];

const CLUE_NUMBERS = [
  { r: 2, c: 5, num: 1 }, // WIZARD (Across) / WAND (Down)
  { r: 7, c: 0, num: 3 }, // BROOMSTICK (Across)
  { r: 3, c: 3, num: 4 }, // DRAGON (Down)
  { r: 1, c: 8, num: 5 }, // MAGICACADEMY (Down)
  { r: 4, c: 8, num: 6 }, // INVISIBILITY (Across)
];

const ACROSS_CLUES = [
  { num: 1, clue: 'A person who casts spells using magic.', answer: 'WIZARD', row: 2, col: 5 },
  { num: 3, clue: 'A flying object witches often ride.', answer: 'BROOMSTICK', row: 7, col: 0 },
  { num: 6, clue: 'A potion that makes someone invisible.', answer: 'INVISIBILITY', row: 4, col: 8 },
];

const DOWN_CLUES = [
  { num: 1, clue: 'A magical stick used to perform spells.', answer: 'WAND', row: 2, col: 5 },
  { num: 4, clue: 'A mythical creature that breathes fire.', answer: 'DRAGON', row: 3, col: 3 },
  { num: 5, clue: 'A school where magic is taught.', answer: 'MAGICACADEMY', row: 1, col: 8 },
];

export default function Puzzle4_Crossword({ onComplete }) {
  const { player, useHint, hintsUsed, showToast } = useGameStore();
  const [cells, setCells] = useState(
    GRID_TEMPLATE.map(row => row.map(c => c === null ? null : ''))
  );
  const [activeCell, setActiveCell] = useState(null);
  const [solved, setSolved] = useState(false);
  const [startTime] = useState(Date.now());
  const inputRef = useRef(null);

  const check = () => {
    let allCorrect = true;
    for (let r = 0; r < GRID_TEMPLATE.length; r++) {
      for (let c = 0; c < GRID_TEMPLATE[r].length; c++) {
        if (GRID_TEMPLATE[r][c] !== null) {
          if ((cells[r][c] || '').toUpperCase() !== GRID_TEMPLATE[r][c]) {
            allCorrect = false;
          }
        }
      }
    }
    if (allCorrect) {
      setSolved(true);
      const solveTime = Math.floor((Date.now() - startTime) / 1000);
      updateProgress(player?.playerId, { puzzleIndex: 3, completed: true, solveTime }).catch(() => {});
      setTimeout(onComplete, 1800);
    } else {
      showToast('Some answers are wrong. Check the clues again!', 'error', 3000);
    }
  };

  const handleCellClick = (r, c) => {
    if (GRID_TEMPLATE[r][c] === null) return;
    setActiveCell([r, c]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKey = (e) => {
    if (!activeCell) return;
    const [r, c] = activeCell;
    const key = e.key.toUpperCase();

    const ROWS = GRID_TEMPLATE.length;
    const COLS = GRID_TEMPLATE[0].length;

    if (/^[A-Z]$/.test(key)) {
      const next = cells.map(row => [...row]);
      next[r][c] = key;
      setCells(next);
      // Move to next logical cell (prefer across)
      const nextC = c + 1;
      if (nextC < COLS && GRID_TEMPLATE[r][nextC] !== null) {
        setActiveCell([r, nextC]);
      } else if (r + 1 < ROWS && GRID_TEMPLATE[r + 1][c] !== null) {
        setActiveCell([r + 1, c]); // fallback down
      }
    } else if (key === 'BACKSPACE') {
      const next = cells.map(row => [...row]);
      next[r][c] = '';
      setCells(next);
      if (c > 0 && GRID_TEMPLATE[r][c - 1] !== null) setActiveCell([r, c - 1]);
      else if (r > 0 && GRID_TEMPLATE[r - 1][c] !== null) setActiveCell([r - 1, c]);
    } else if (key === 'ARROWRIGHT' && c + 1 < COLS && GRID_TEMPLATE[r][c + 1] !== null) {
      setActiveCell([r, c + 1]);
    } else if (key === 'ARROWLEFT' && c > 0 && GRID_TEMPLATE[r][c - 1] !== null) {
      setActiveCell([r, c - 1]);
    } else if (key === 'ARROWDOWN' && r + 1 < ROWS && GRID_TEMPLATE[r + 1][c] !== null) {
      setActiveCell([r + 1, c]);
    } else if (key === 'ARROWUP' && r > 0 && GRID_TEMPLATE[r - 1][c] !== null) {
      setActiveCell([r - 1, c]);
    }
  };

  const isCorrectCell = (r, c) =>
    cells[r][c] && cells[r][c].toUpperCase() === GRID_TEMPLATE[r][c];

  const isWrongCell = (r, c) =>
    cells[r][c] && cells[r][c].toUpperCase() !== GRID_TEMPLATE[r][c];

  const giveHint = () => {
    useHint();
    showToast('Hint: WIZARD, BROOMSTICK, INVISIBILITY across. WAND, DRAGON, MAGIC ACADEMY down.', 'info', 6000);
  };

  return (
    <div style={{ padding: '0 20px', height: '100%', overflow: 'hidden' }}>
      <div className="puzzle-header">
        <div className="puzzle-number">Gate IV of VII</div>
        <h2 className="puzzle-title">The Wizard's Codex</h2>
        <p className="puzzle-desc">
          Complete the mystical crossword grid to unlock the gate.
          <br />
          <small>(Ignore spaces for multi-word answers)</small>
        </p>
      </div>
      <div className="divider" />

      {/* Hidden input to capture keyboard */}
      <input
        ref={inputRef}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
        onKeyDown={handleKey}
        readOnly
      />

      <div style={{ display: 'flex', gap: 'var(--sp-xl)', justifyContent: 'center', flexWrap: 'nowrap', alignItems: 'flex-start', overflow: 'hidden' }}>
        {/* Grid Container */}
        <div style={{ flex: '1 1 auto', overflow: 'auto' }}>
          <div className="crossword-grid" style={{ gridTemplateColumns: `repeat(20, min(24px, 4vw))`, gap: '2px', padding: '10px' }}>
            {GRID_TEMPLATE.map((row, r) =>
              row.map((template, c) => {
                if (template === null) return <div key={`${r}-${c}`} className="crossword-cell black" style={{ width: '100%', height: 'auto', aspectRatio: '1' }} />;
                const isActive = activeCell && activeCell[0] === r && activeCell[1] === c;
                const clueNum = CLUE_NUMBERS.find(cl => cl.r === r && cl.c === c)?.num;
                
                return (
                  <div
                    key={`${r}-${c}`}
                    id={`cell-${r}-${c}`}
                    className={`crossword-cell ${isActive ? 'active' : ''} ${isCorrectCell(r,c) ? 'correct' : ''} ${solved ? '' : isWrongCell(r,c) && cells[r][c] ? 'wrong' : ''}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{ position: 'relative', width: '100%', height: 'auto', aspectRatio: '1', fontSize: '0.6rem' }}
                  >
                    {clueNum && <span style={{ position: 'absolute', top: 1, left: 2, fontSize: '0.4rem', opacity: 0.7 }}>{clueNum}</span>}
                    {cells[r][c] || ''}
                  </div>
                );
              })
            )}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--txt-muted)', fontSize: '0.7rem', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
            Click a cell then type. Arrow keys to navigate.
          </p>
        </div>

        {/* Clues */}
        <div style={{ flex: '0 0 250px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 'var(--sp-lg)' }}>
            <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--txt-accent)', marginBottom: 'var(--sp-sm)' }}>ACROSS</h4>
            {ACROSS_CLUES.map(cl => (
              <div key={cl.num} style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--clr-amber)', fontFamily: "'Cinzel', serif", fontSize: '0.75rem' }}>{cl.num}. </span>
                <span style={{ color: 'var(--txt-secondary)', fontSize: '0.7rem' }}>{cl.clue}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--txt-accent)', marginBottom: 'var(--sp-sm)' }}>DOWN</h4>
            {DOWN_CLUES.map(cl => (
              <div key={cl.num} style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--clr-violet-dim)', fontFamily: "'Cinzel', serif", fontSize: '0.75rem' }}>{cl.num}. </span>
                <span style={{ color: 'var(--txt-secondary)', fontSize: '0.7rem' }}>{cl.clue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-md)', justifyContent: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={giveHint} disabled={hintsUsed >= 3}>
          💡 Hint ({3 - hintsUsed} left)
        </button>
        <button className="btn btn-primary" onClick={check} disabled={solved}>
          {solved ? '✓ Codex Complete!' : 'Decipher Codex'}
        </button>
      </div>
    </div>
  );
}
