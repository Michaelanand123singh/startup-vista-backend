const express = require('express')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const Startup = require('../models/Startup')

const router = express.Router()

// Get startup profile
router.get('/profile', auth, roleCheck(['startup']), async (req, res) => {
  try {
    const startup = await Startup.findOne({ userId: req.user._id })
    res.json(startup)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Update startup profile
router.put('/profile', auth, roleCheck(['startup']), async (req, res) => {
  try {
    const startup = await Startup.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { upsert: true, new: true }
    )
    res.json(startup)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router