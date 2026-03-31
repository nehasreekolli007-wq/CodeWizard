import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './store/gameStore';
import CharacterSelect    from './scenes/CharacterSelect';
import IntroCinematic     from './scenes/IntroCinematic';
import ExplorationWorld   from './scenes/ExplorationWorld';
import BarrierChamber     from './scenes/BarrierChamber';
import FinalConfrontation from './scenes/FinalConfrontation';

// ── Global toast renderer ─────────────────────────────────────────────────────
function Toast() {
  const { toast } = useGameStore();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene router ─────────────────────────────────────────────────────────────
const SCENES = {
  'character-select': CharacterSelect,
  'cinematic':        IntroCinematic,
  'exploration':      ExplorationWorld,
  'barrier':          BarrierChamber,
  'victory':          FinalConfrontation,
};

export default function App() {
  const { scene } = useGameStore();
  const ActiveScene = SCENES[scene] || CharacterSelect;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--clr-void)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        >
          <ActiveScene />
        </motion.div>
      </AnimatePresence>

      {/* Toast always on top */}
      <Toast />
    </div>
  );
}
