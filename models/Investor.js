const mongoose = require('mongoose')

const investorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pastInvestments: [{
    companyName: String,
    investmentAmount: Number,
    exitAmount: Number
  }],
  currentHoldings: [{
    companyName: String,
    investmentAmount: Number,
    fundingType: {
      type: String,
      enum: ['equity', 'debt']
    }
  }],
  investmentPreferences: {
    ticketSize: {
      min: Number,
      max: Number
    },
    preferredSectors: [String]
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Investor', investorSchema)
