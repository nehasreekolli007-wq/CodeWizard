// Puzzle 1 — Environmental Observation
// Player must identify which 4 clues match the world anomalies
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { updateProgress } from '../api/client';

const WORLD_CLUES = [
  { id: 'wind',    icon: '💨', label: 'Anomalous Wind Current',   found: true  },
  { id: 'plants',  icon: '🌿', label: 'Withered Vegetation Patch', found: true  },
  { id: 'residue', icon: '✨', label: 'Magical Residue Trail',     found: true  },
  { id: 'sound',   icon: '🔊', label: 'Spatial Audio Distortion',  found: true  },
];

const DECOYS = [
  { id: 'd1', icon: '🌙', label: 'Moon Phase Shift'     },
  { id: 'd2', icon: '🌊', label: 'Tide Pattern Change'  },
  { id: 'd3', icon: '🔥', label: 'Heat Shimmer'         },
  { id: 'd4', icon: '⭐', label: 'Star Alignment'       },
  { id: 'd5', icon: '🌪', label: 'Ordinary Dust Devil'  },
  { id: 'd6', icon: '🌑', label: 'Eclipse Shadow'       },
];

const ALL_CARDS = [...WORLD_CLUES, ...DECOYS].sort(() => Math.random() - 0.5);

export default function Puzzle1_Observation({ onComplete }) {
  const { player, useHint, hintsUsed, cluesFound, showToast } = useGameStore();
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const toggle = (id) => {
    if (submitted) return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const submit = () => {
    setAttempts((a) => a + 1);
    const correct = WORLD_CLUES.every((c) => selected.includes(c.id));
    setResult(correct ? 'correct' : 'wrong');
    if (correct) {
      setSubmitted(true);
      const solveTime = Math.floor((Date.now() - startTime) / 1000);
      updateProgress(player?.playerId, {
        puzzleIndex: 0, completed: true,
        attempts: attempts + 1, solveTime
      }).catch(() => {});
      setTimeout(onComplete, 1800);
    } else {
      showToast('Not quite right. Look more carefully at what you observed in the world.', 'error', 3000);
      setTimeout(() => setResult(null), 1000);
    }
  };

  const giveHint = () => {
    useHint();
    showToast('Hint: Focus on the 4 anomalies you actually witnessed in the realm — wind, plants, light, and sound.', 'info', 5000);
  };

  return (
    <div>
      <div className="puzzle-header">
        <div className="puzzle-number">Gate I of VII</div>
        <h2 className="puzzle-title">The Anomaly Log</h2>
        <p className="puzzle-desc">
          You witnessed strange occurrences in the realm. Select the 4 true anomalies from the list below — decoys have been woven in to test your perception.
        </p>
      </div>

      <div className="divider" />

      <p style={{ textAlign: 'center', color: 'var(--txt-muted)', fontSize: '0.8rem', marginBottom: 'var(--sp-md)' }}>
        Selected: {selected.length} / 4
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--sp-sm)' }}>
        {ALL_CARDS.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`select-card ${selected.includes(card.id) ? 'selected' : ''} ${
              submitted && WORLD_CLUES.find(c => c.id === card.id) ? 'correct' : ''
            }`}
            onClick={() => toggle(card.id)}
            style={{ cursor: submitted ? 'default' : 'pointer', padding: 'var(--sp-md)' }}
          >
            <div className="card-icon" style={{ fontSize: '1.8rem' }}>{card.icon}</div>
            <div className="card-name" style={{ fontSize: '0.8rem', marginTop: 6 }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-xl)', justifyContent: 'center' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={giveHint}
          disabled={hintsUsed >= 3}
        >
          💡 Hint ({3 - hintsUsed} left)
        </button>
        <motion.button
          className={`btn btn-primary ${result === 'wrong' ? 'btn-error' : ''}`}
          onClick={submit}
          disabled={selected.length !== 4 || submitted}
          whileTap={{ scale: 0.96 }}
          animate={result === 'wrong' ? { x: [-6, 6, -6, 6, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          {submitted ? '✓ Correct!' : 'Submit Findings'}
        </motion.button>
      </div>
    </div>
  );
}
