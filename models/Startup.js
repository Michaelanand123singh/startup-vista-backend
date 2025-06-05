const mongoose = require('mongoose')

const startupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  logo: String,
  establishmentDate: Date,
  sector: String,
  teamSize: Number,
  aboutCompany: String,
  website: String,
  androidApp: String,
  iosApp: String,
  socialLinks: {
    linkedin: String,
    facebook: String,
    instagram: String,
    twitter: String
  },
  founders: [{
    name: String,
    email: String,
    contactNo: String,
    linkedin: String,
    designation: String,
    sharePercentage: Number
  }]
}, {
  timestamps: true
})

module.exports = mongoose.model('Startup', startupSchema)
