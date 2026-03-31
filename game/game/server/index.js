require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Database Connection ────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const Player = require('./models/Player');
const GameSession = require('./models/GameSession');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Failed to connect to MongoDB Atlas:', err));

// ── Player routes ────────────────────────────────────────────────────────────
app.post('/api/player', async (req, res) => {
  try {
    const { wizardName, gender, wizardType } = req.body;
    const player = new Player({ wizardName, gender, wizardType });
    await player.save();
    
    // Also init progress for client compatibility
    const responsePlayer = player.toObject();
    responsePlayer.progress = { puzzlesCompleted: [], hintsUsed: 0, score: 0 };
    
    res.status(201).json({ player: responsePlayer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/player/:id', async (req, res) => {
  try {
    const playerModel = await Player.findOne({ playerId: req.params.id });
    if (!playerModel) return res.status(404).json({ error: 'Player not found' });
    
    const player = playerModel.toObject();
    player.progress = {
      puzzlesCompleted: player.puzzleStates.filter(p => p.completed).map(p => p.puzzleIndex),
      hintsUsed: player.totalHintsUsed,
      score: player.score
    };
    res.json({ player });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/player/:id/progress', async (req, res) => {
  try {
    const playerModel = await Player.findOne({ playerId: req.params.id });
    if (!playerModel) return res.status(404).json({ error: 'Player not found' });
    
    const { puzzleIndex, completed, attempts, solveTime } = req.body;
    
    // Find or create puzzle state
    let state = playerModel.puzzleStates.find(p => p.puzzleIndex === puzzleIndex);
    if (!state) {
      playerModel.puzzleStates.push({ puzzleIndex });
      state = playerModel.puzzleStates[playerModel.puzzleStates.length - 1];
    }
    
    if (completed && !state.completed) {
      state.completed = true;
      state.attempts += (attempts || 1);
      state.solveTime = solveTime || 0;
      state.completedAt = new Date();
    } else if (!completed) {
      state.attempts += (attempts || 1);
    }
    
    playerModel.currentPuzzle = Math.max(playerModel.currentPuzzle, puzzleIndex + (completed ? 1 : 0));
    playerModel.calculateScore();
    await playerModel.save();
    
    const player = playerModel.toObject();
    player.progress = {
      puzzlesCompleted: player.puzzleStates.filter(p => p.completed).map(p => p.puzzleIndex),
      hintsUsed: player.totalHintsUsed,
      score: player.score,
      lastSolveTime: solveTime
    };
    
    res.json({ player });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/player/leaderboard/top', async (req, res) => {
  try {
    const topPlayers = await Player.find().sort({ score: -1 }).limit(10);
    const leaderboard = topPlayers.map(p => ({
      wizardName: p.wizardName,
      wizardType: p.wizardType,
      score: p.score
    }));
    res.json({ leaderboard });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Session routes ───────────────────────────────────────────────────────────
app.post('/api/session', async (req, res) => {
  try {
    const { playerId } = req.body;
    const session = new GameSession({ playerId, events: [] });
    await session.save();
    res.status(201).json({ session });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/session/:id/event', async (req, res) => {
  try {
    const session = await GameSession.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    session.events.push({ ...req.body, timestamp: new Date() });
    await session.save();
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🧙 Code Wizards API is alive',
    dbState: mongoose.connection.readyState,
    timestamp: new Date()
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong in the realm…', details: err.message });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Code Wizards API running on http://localhost:${PORT}`);
});
