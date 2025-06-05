const express = require('express')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const Consultant = require('../models/Consultant')

const router = express.Router()

// Get consultant profile
router.get('/profile', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    const consultant = await Consultant.findOne({ userId: req.user._id })
    res.json(consultant)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Update consultant profile
router.put('/profile', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    const consultant = await Consultant.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { upsert: true, new: true }
    )
    res.json(consultant)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router