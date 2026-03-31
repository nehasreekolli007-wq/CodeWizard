const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const GameSession = require('../models/GameSession');

// POST /api/session — Create session
router.post('/', async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId is required' });
    const session = new GameSession({ sessionId: uuidv4(), playerId, events: [] });
    await session.save();
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session/:id/event — Log an event
router.post('/:id/event', async (req, res) => {
  try {
    const { type, puzzleIndex, data } = req.body;
    const session = await GameSession.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.events.push({ type, puzzleIndex, data, timestamp: new Date() });
    await session.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/:playerId — Get all sessions for a player
router.get('/:playerId', async (req, res) => {
  try {
    const sessions = await GameSession.find({ playerId: req.params.playerId }).sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
