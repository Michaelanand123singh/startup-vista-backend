const express = require('express')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const Startup = require('../models/Startup')

const router = express.Router()

// Create startup profile
router.post('/profile', auth, roleCheck(['startup']), async (req, res) => {
  try {
    // Check if profile already exists
    const existingStartup = await Startup.findOne({ userId: req.user._id })
    if (existingStartup) {
      return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' })
    }

    // Transform social links from flat structure to nested
    const { linkedIn, facebook, instagram, twitter, ...otherData } = req.body
    
    const startupData = {
      ...otherData,
      userId: req.user._id,
      socialLinks: {
        linkedin: linkedIn || '',
        facebook: facebook || '',
        instagram: instagram || '',
        twitter: twitter || ''
      }
    }

    const startup = await Startup.create(startupData)
    res.status(201).json(startup)
  } catch (error) {
    console.error('Startup profile creation error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Get startup profile
router.get('/profile', auth, roleCheck(['startup']), async (req, res) => {
  try {
    const startup = await Startup.findOne({ userId: req.user._id })
    res.json(startup)
  } catch (error) {
    console.error('Get startup profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update startup profile
router.put('/profile', auth, roleCheck(['startup']), async (req, res) => {
  try {
    // Transform social links if they exist in the request
    let updateData = { ...req.body }
    
    if (req.body.linkedIn || req.body.facebook || req.body.instagram || req.body.twitter) {
      const { linkedIn, facebook, instagram, twitter, ...otherData } = req.body
      updateData = {
        ...otherData,
        socialLinks: {
          linkedin: linkedIn || '',
          facebook: facebook || '',
          instagram: instagram || '',
          twitter: twitter || ''
        }
      }
    }

    const startup = await Startup.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup profile not found' })
    }
    
    res.json(startup)
  } catch (error) {
    console.error('Startup profile update error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Delete startup profile
router.delete('/profile', auth, roleCheck(['startup']), async (req, res) => {
  try {
    const startup = await Startup.findOneAndDelete({ userId: req.user._id })
    if (!startup) {
      return res.status(404).json({ message: 'Startup profile not found' })
    }
    res.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Startup profile deletion error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router