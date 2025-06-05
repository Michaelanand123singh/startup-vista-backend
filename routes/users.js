const express = require('express')
const auth = require('../middleware/auth')

const router = express.Router()

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body
    const userId = req.user._id

    // Find and update user
    const User = require('../models/User') // Adjust path as needed
    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update fields if provided
    if (name) user.name = name
    if (email) user.email = email

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router