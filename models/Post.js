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
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  consultant: {
    type: String,
    default: 'StartupVista',
    trim: true
  },
  sector: {
    type: String,
    required: true,
    enum: [
      'Technology',
      'Healthcare', 
      'Finance',
      'E-commerce',
      'Education',
      'Manufacturing',
      'Real Estate',
      'Food & Beverage',
      'Transportation',
      'Energy',
      'Entertainment',
      'Other'
    ]
  },
  investmentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  investmentType: {
    type: String,
    required: true,
    enum: [
      'pre-seed',
      'seed', 
      'series-a',
      'series-b',
      'series-c',
      'bridge',
      'convertible-note',
      'equity'
    ]
  },
  equityPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  documents: {
    onePager: {
      type: String,
      default: null
    },
    pitchDeck: {
      type: String, 
      default: null
    }
  },
  investmentInterests: [{
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: [{
      question: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
})

// Index for better query performance
postSchema.index({ createdBy: 1, isActive: 1 })
postSchema.index({ sector: 1, isActive: 1 })
postSchema.index({ investmentType: 1, isActive: 1 })
postSchema.index({ createdAt: -1 })

// Virtual for investment interest count
postSchema.virtual('interestCount').get(function() {
  return this.investmentInterests.length
})

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('Post', postSchema)