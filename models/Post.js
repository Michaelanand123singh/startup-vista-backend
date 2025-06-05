const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postType: {
    type: String,
    enum: ['startup', 'seed'],
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  logo: String,
  consultant: {
    type: String,
    default: 'StartupVista'
  },
  sector: {
    type: String,
    required: true
  },
  investmentAmount: {
    type: Number,
    required: true
  },
  investmentType: {
    type: String,
    enum: ['equity', 'debt'],
    required: true
  },
  equityPercentage: Number,
  documents: {
    onePager: String,
    pitchDeck: String
  },
  investmentInterests: [{
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answers: [{
      question: String,
      answer: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Post', postSchema)
