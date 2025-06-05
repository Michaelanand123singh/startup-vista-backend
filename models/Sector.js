const mongoose = require('mongoose')

const sectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  hashtags: [String]
}, {
  timestamps: true
})

module.exports = mongoose.model('Sector', sectorSchema)
