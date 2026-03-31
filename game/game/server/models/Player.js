const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const puzzleStateSchema = new mongoose.Schema({
  puzzleIndex: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  solveTime: { type: Number, default: 0 }, // seconds
  completedAt: { type: Date }
});

const playerSchema = new mongoose.Schema({
  playerId: { type: String, default: uuidv4, unique: true, index: true },
  wizardName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  wizardType: {
    type: String,
    enum: ['chrono-mage', 'storm-caller', 'void-walker', 'nature-shaman'],
    required: true
  },
  currentPuzzle: { type: Number, default: 0, min: 0, max: 7 },
  puzzleStates: [puzzleStateSchema],
  totalHintsUsed: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  gameCompleted: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

// Calculate score before saving
playerSchema.methods.calculateScore = function () {
  const baseScore = this.puzzleStates.filter(p => p.completed).length * 1000;
  const hintPenalty = this.totalHintsUsed * 50;
  const timePlayed = this.completedAt
    ? Math.floor((this.completedAt - this.startTime) / 1000)
    : 0;
  const timePenalty = Math.floor(timePlayed / 60) * 10;
  this.score = Math.max(0, baseScore - hintPenalty - timePenalty);
  return this.score;
};

module.exports = mongoose.model('Player', playerSchema);
