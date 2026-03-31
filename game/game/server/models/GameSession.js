const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, default: uuidv4, unique: true },
  playerId: { type: String, required: true, index: true },
  events: [{
    type: { type: String }, // 'puzzle_start', 'puzzle_complete', 'hint_used', 'clue_found'
    puzzleIndex: Number,
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed
  }],
  finalScore: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('GameSession', sessionSchema);
