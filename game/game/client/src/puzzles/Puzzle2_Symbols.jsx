// Puzzle 2 — Fantasy Castle Jigsaw
// Click to swap tiles and reconstruct the wizard castle image.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

// Generate solved array [0, 1, 2, ..., 15]
const SOLVED_TILES = Array.from({ length: TOTAL_TILES }, (_, i) => i);

export default function Puzzle2_Symbols({ onComplete }) {
  const { player, useHint, hintsUsed, showToast } = useGameStore();

  const [tiles, setTiles] = useState([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [fullyComplete, setFullyComplete] = useState(false);

  // Initialize random shuffle that guarantees a solvable state
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    if (fullyComplete) return;
    let shuffled = [...SOLVED_TILES];
    let isSolved = true;
    
    // Shuffle ensuring it's not already solved
    while (isSolved) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      isSolved = shuffled.every((val, index) => val === index);
    }
    
    setTiles(shuffled);
    setSelectedTileIndex(null);
    setSolved(false);
    setAttempts(0);
  };

  const checkWin = (currentTiles) => {
    if (currentTiles.every((val, index) => val === index)) {
      setSolved(true);
      const solveTime = Math.floor((Date.now() - startTime) / 1000);
      updateProgress(player?.playerId, { puzzleIndex: 1, completed: true, attempts, solveTime }).catch(() => {});
      setTimeout(() => setFullyComplete(true), 2000);
      setTimeout(onComplete, 4500); // 4.5 seconds to gaze upon the complete castle!
    }
  };

  const handleTileClick = (index) => {
    if (solved || fullyComplete) return;

    if (selectedTileIndex === null) {
      // Select first tile
      setSelectedTileIndex(index);
    } else if (selectedTileIndex === index) {
      // Deselect tile if clicked again
      setSelectedTileIndex(null);
    } else {
      // Swap tiles
      setAttempts(a => a + 1);
      const newTiles = [...tiles];
      const temp = newTiles[selectedTileIndex];
      newTiles[selectedTileIndex] = newTiles[index];
      newTiles[index] = temp;
      
      setTiles(newTiles);
      setSelectedTileIndex(null);
      checkWin(newTiles);
    }
  };

  const giveHint = () => {
    useHint();
    showToast("Hint: Swap distinct focal points like the castle's spire or the glowing lake first.", 'info', 6000);
    
    // Auto-solve 2 tiles as a mega hint
    if (solved || fullyComplete) return;
    
    let wrongIndices = [];
    tiles.forEach((val, i) => { if (val !== i) wrongIndices.push(i); });
    
    if (wrongIndices.length >= 2) {
      const idxA = wrongIndices[0];
      const correctValA = idxA;
      // find where correctValA currently is
      const currentPosOfCorrectA = tiles.indexOf(correctValA);
      
      const nextTiles = [...tiles];
      [nextTiles[idxA], nextTiles[currentPosOfCorrectA]] = [nextTiles[currentPosOfCorrectA], nextTiles[idxA]];
      setTiles(nextTiles);
      checkWin(nextTiles);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="puzzle-header" style={{ marginBottom: '10px' }}>
        <div className="puzzle-number" style={{ color: 'var(--clr-amber)' }}>Gate II of VII</div>
        <h2 className="puzzle-title" style={{ fontSize: '2.2rem', textShadow: '0 0 15px rgba(212,165,32,0.5)' }}>
          The Shattered Memory
        </h2>
        <p className="puzzle-desc">
           The vision of the ancient Wizard Castle has fractured. Click two tiles to swap them until the masterpiece is whole.
        </p>
      </div>

      <div style={{
         textAlign: 'center', marginBottom: '16px', color: 'var(--txt-muted)', fontSize: '0.85rem'
      }}>
         Moves: <strong style={{ color: 'white' }}>{attempts}</strong>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(30, 41, 59, 0.4)',
        border: '2px solid rgba(212, 165, 32, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'inset 0 0 40px rgba(212, 165, 32, 0.1)',
      }}>
         <AnimatePresence mode="wait">
            {!fullyComplete ? (
               <motion.div
                  key="playing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5 }}
                  style={{
                     display: 'grid',
                     gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                     gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                     gap: solved ? '0px' : '4px',
                     width: '100%',
                     maxWidth: '800px',
                     aspectRatio: '16/9', // Landscape puzzle
                     position: 'relative',
                     transition: 'gap 0.5s ease'
                  }}
               >
                  {tiles.map((tileVal, index) => {
                     // The correct original position of this tile piece
                     const row = Math.floor(tileVal / GRID_SIZE);
                     const col = tileVal % GRID_SIZE;
                     
                     const isSelected = selectedTileIndex === index;
                     const isCorrect = tileVal === index;

                     return (
                        <motion.div
                           layout // allows graceful sliding when arrays swap!
                           key={tileVal} // Must use value for key so Framer tracks the individual tile moving
                           onClick={() => handleTileClick(index)}
                           style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: 'url(/jigsaw.jpg)',
                              backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
                              backgroundPosition: `${(col * 100) / (GRID_SIZE - 1)}% ${(row * 100) / (GRID_SIZE - 1)}%`,
                              borderRadius: solved ? '0px' : '4px',
                              cursor: solved ? 'default' : 'pointer',
                              border: isSelected 
                                ? '3px solid #6ee7b7' 
                                : isCorrect && !solved 
                                  ? '2px solid rgba(16, 185, 129, 0.5)' 
                                  : 'none',
                              boxShadow: isSelected ? '0 0 15px rgba(110, 231, 183, 0.8)' : 'none',
                              zIndex: isSelected ? 10 : 1,
                              opacity: 1
                           }}
                           whileHover={!solved && { scale: isSelected ? 1.05 : 0.95 }}
                        />
                     )
                  })}
               </motion.div>
            ) : (
               <motion.div
                  key="scripted_reveal"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                     width: '100%',
                     maxWidth: '800px',
                     aspectRatio: '16/9',
                     backgroundImage: 'url(/jigsaw.jpg)',
                     backgroundSize: 'cover',
                     borderRadius: '8px',
                     boxShadow: '0 0 40px rgba(212, 165, 32, 0.4)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                  }}
               >
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }} 
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.8, type: 'spring' }}
                     style={{
                        padding: '20px 40px',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '12px',
                        border: '2px solid var(--clr-amber)',
                        textAlign: 'center', 
                        color: '#d4a520', 
                        fontFamily: "'Cinzel', serif", 
                        fontSize: '2rem', 
                        textShadow: '0 0 10px rgba(212,165,32,0.5)' 
                     }}
                  >
                     ✦ Vision Restored ✦
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={startNewGame} disabled={solved || fullyComplete}>
          ↺ Reshuffle
        </button>
        <button className="btn btn-secondary btn-sm" onClick={giveHint} disabled={hintsUsed >= 3 || solved || fullyComplete}>
          💡 Hint ({3 - hintsUsed} left)
        </button>
      </div>

      {solved && !fullyComplete && (
        <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }}
           style={{ textAlign: 'center', marginTop: '15px', color: '#10b981', fontFamily: "'Cinzel', serif", fontSize: '1.2rem' }}
        >
           The scattered memory is complete! Shifting to the next gate...
        </motion.div>
      )}
    </div>
  );
}
