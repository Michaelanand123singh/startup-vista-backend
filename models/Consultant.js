const mongoose = require('mongoose')

const consultantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pastPortfolio: [{
    companyName: String,
    investmentAmount: Number
  }],
  summary: {
    totalInvestment: Number,
    totalStartupsFunded: Number
  },
  verification: {
    panCard: String,
    aadharCard: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Consultant', consultantSchema)
