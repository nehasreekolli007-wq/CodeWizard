import { create } from 'zustand';

const WIZARD_ARCHETYPES = {
  'chrono-mage':    { label: 'Chrono Mage',    emoji: '⏳', desc: 'Master of time & patterns' },
  'storm-caller':   { label: 'Storm Caller',   emoji: '⚡', desc: 'Wielder of electric force' },
  'void-walker':    { label: 'Void Walker',    emoji: '🌀', desc: 'Traveler between dimensions' },
  'nature-shaman':  { label: 'Nature Shaman',  emoji: '🌿', desc: 'Bound to living energy' },
};

const useGameStore = create((set, get) => ({
  // ── Scene management ──────────────────────────────────────────────
  scene: 'character-select', 
  setScene: (scene) => set({ scene }),

  // ── Player profile ────────────────────────────────────────────────
  player: null,    
  sessionId: null,
  setPlayer: (player) => set({ player }),
  setSessionId: (sessionId) => set({ sessionId }),

  // ── Puzzle state ──────────────────────────────────────────────────
  currentPuzzle: 0,        
  puzzlesCompleted: [],    
  activePuzzle: null,      
  hintsUsed: 0,
  score: 0,
  startTime: null,

  setStartTime: (time) => set({ startTime: time }),

  openPuzzle:  (index) => set({ activePuzzle: index }),
  closePuzzle: ()      => set({ activePuzzle: null }),

  completePuzzle: (index) => set((state) => {
    const already = state.puzzlesCompleted.includes(index);
    if (already) return {};
    const completed = [...state.puzzlesCompleted, index];
    const next = Math.min(index + 1, 7);
    return {
      puzzlesCompleted: completed,
      currentPuzzle: next,
      activePuzzle: null,
      score: state.score + 1000,
    };
  }),

  useHint: () => set((state) => ({
    hintsUsed: state.hintsUsed + 1,
    score: Math.max(0, state.score - 50),
  })),

  // ── Exploration ──────────────────────────────────
  cluesFound: [],
  findClue: (id) => set((state) => ({
    cluesFound: state.cluesFound.includes(id) ? state.cluesFound : [...state.cluesFound, id],
  })),

  audioEnabled: true,
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),

  toast: null,
  showToast: (message, type = 'info', duration = 3000) => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), duration);
  },

  // ── Game helpers ──────────────────────────────────────────────────
  getGameDuration: () => {
    const { startTime } = get();
    if (!startTime) return '0:00';
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  isPuzzleDone: (i) => get().puzzlesCompleted.includes(i),
  isGameComplete: () => get().puzzlesCompleted.length >= 7,
  
  getStarRating: () => {
    const { hintsUsed, score } = get();
    // 7000 is max score from puzzles (7 * 1000)
    if (hintsUsed === 0 && score >= 6000) return 3;
    if (hintsUsed <= 3 && score >= 4000) return 2;
    return 1;
  },

  // ── Reset ──────────────────────────────────────────────
  resetGame: () => set({
    scene: 'character-select',
    player: null, sessionId: null,
    currentPuzzle: 0, puzzlesCompleted: [],
    activePuzzle: null, hintsUsed: 0, score: 0,
    startTime: null,
    cluesFound: [], toast: null,
  }),

  WIZARD_ARCHETYPES,
}));

export default useGameStore;
