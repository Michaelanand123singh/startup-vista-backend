const express = require('express')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const Investor = require('../models/Investor')

const router = express.Router()

// Get investor profile
router.get('/profile', auth, roleCheck(['investor']), async (req, res) => {
  try {
    const investor = await Investor.findOne({ userId: req.user._id })
    res.json(investor)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Update investor profile
router.put('/profile', auth, roleCheck(['investor']), async (req, res) => {
  try {
    const investor = await Investor.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { upsert: true, new: true }
    )
    res.json(investor)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
