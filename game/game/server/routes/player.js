const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Player = require('../models/Player');

// POST /api/player — Create new player
router.post('/', async (req, res) => {
  try {
    const { wizardName, gender, wizardType } = req.body;
    if (!wizardName || !gender || !wizardType)
      return res.status(400).json({ error: 'wizardName, gender, and wizardType are required' });

    const player = new Player({ playerId: uuidv4(), wizardName, gender, wizardType, puzzleStates: [] });
    await player.save();
    res.status(201).json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/player/:id — Fetch player
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findOne({ playerId: req.params.id });
    if (!player) return res.status(404).json({ error: 'Player not found in the realm' });
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/player/:id/progress — Update puzzle progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { puzzleIndex, completed, attempts, hintsUsed, solveTime } = req.body;
    const player = await Player.findOne({ playerId: req.params.id });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const existing = player.puzzleStates.find(p => p.puzzleIndex === puzzleIndex);
    if (existing) {
      existing.completed = completed ?? existing.completed;
      existing.attempts = (existing.attempts || 0) + (attempts || 0);
      existing.hintsUsed = (existing.hintsUsed || 0) + (hintsUsed || 0);
      if (completed) { existing.solveTime = solveTime; existing.completedAt = new Date(); }
    } else {
      player.puzzleStates.push({
        puzzleIndex, completed: completed || false,
        attempts: attempts || 0, hintsUsed: hintsUsed || 0,
        solveTime: solveTime || 0,
        completedAt: completed ? new Date() : undefined
      });
    }

    if (completed && puzzleIndex >= player.currentPuzzle) {
      player.currentPuzzle = Math.min(puzzleIndex + 1, 7);
    }
    player.totalHintsUsed = player.puzzleStates.reduce((sum, p) => sum + (p.hintsUsed || 0), 0);

    if (player.currentPuzzle === 7 && !player.gameCompleted) {
      player.gameCompleted = true;
      player.completedAt = new Date();
      player.calculateScore();
    }

    await player.save();
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/player/leaderboard/top — Top scores
router.get('/leaderboard/top', async (req, res) => {
  try {
    const top = await Player.find({ gameCompleted: true })
      .sort({ score: -1 })
      .limit(10)
      .select('wizardName wizardType gender score completedAt');
    res.json({ success: true, leaderboard: top });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
