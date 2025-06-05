const express = require('express')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const Investor = require('../models/Investor')

const router = express.Router()

// Create investor profile
router.post('/profile', auth, roleCheck(['investor']), async (req, res) => {
  try {
    // Check if profile already exists
    const existingInvestor = await Investor.findOne({ userId: req.user._id })
    if (existingInvestor) {
      return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' })
    }

    // Transform form data to match schema structure
    const { fullName, contactNo, linkedIn, ticketSize, preferredSectors } = req.body
    
    const investorData = {
      userId: req.user._id,
      pastInvestments: [], // Initialize empty, can be filled later
      currentHoldings: [], // Initialize empty, can be filled later
      investmentPreferences: {
        ticketSize: {
          min: 0,
          max: ticketSize || 0
        },
        preferredSectors: preferredSectors || []
      }
    }

    const investor = await Investor.create(investorData)
    res.status(201).json(investor)
  } catch (error) {
    console.error('Investor profile creation error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Get investor profile
router.get('/profile', auth, roleCheck(['investor']), async (req, res) => {
  try {
    const investor = await Investor.findOne({ userId: req.user._id })
    res.json(investor)
  } catch (error) {
    console.error('Get investor profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update investor profile
router.put('/profile', auth, roleCheck(['investor']), async (req, res) => {
  try {
    // Handle both form structure and direct schema structure
    let updateData
    
    if (req.body.fullName || req.body.contactNo || req.body.linkedIn || req.body.ticketSize || req.body.preferredSectors) {
      // Form data structure - transform it
      const { fullName, contactNo, linkedIn, ticketSize, preferredSectors, ...otherData } = req.body
      updateData = {
        ...otherData,
        investmentPreferences: {
          ticketSize: {
            min: 0,
            max: ticketSize || 0
          },
          preferredSectors: preferredSectors || []
        }
      }
    } else {
      // Direct schema structure
      updateData = req.body
    }

    const investor = await Investor.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!investor) {
      return res.status(404).json({ message: 'Investor profile not found' })
    }
    
    res.json(investor)
  } catch (error) {
    console.error('Investor profile update error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Add past investment
router.post('/investments/past', auth, roleCheck(['investor']), async (req, res) => {
  try {
    const { companyName, investmentAmount, exitAmount } = req.body
    
    const investor = await Investor.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $push: { 
          pastInvestments: { companyName, investmentAmount, exitAmount } 
        } 
      },
      { new: true }
    )
    
    if (!investor) {
      return res.status(404).json({ message: 'Investor profile not found' })
    }
    
    res.json(investor)
  } catch (error) {
    console.error('Add past investment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Add current holding
router.post('/investments/current', auth, roleCheck(['investor']), async (req, res) => {
  try {
    const { companyName, investmentAmount, fundingType } = req.body
    
    const investor = await Investor.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $push: { 
          currentHoldings: { companyName, investmentAmount, fundingType } 
        } 
      },
      { new: true }
    )
    
    if (!investor) {
      return res.status(404).json({ message: 'Investor profile not found' })
    }
    
    res.json(investor)
  } catch (error) {
    console.error('Add current holding error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete investor profile
router.delete('/profile', auth, roleCheck(['investor']), async (req, res) => {
  try {
    const investor = await Investor.findOneAndDelete({ userId: req.user._id })
    if (!investor) {
      return res.status(404).json({ message: 'Investor profile not found' })
    }
    res.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Investor profile deletion error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router