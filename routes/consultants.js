const express = require('express')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')
const Consultant = require('../models/Consultant')

const router = express.Router()

// Create consultant profile
router.post('/profile', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    // Check if profile already exists
    const existingConsultant = await Consultant.findOne({ userId: req.user._id })
    if (existingConsultant) {
      return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' })
    }

    // Transform form data to match schema structure
    const { fullName, contactNo, linkedIn, totalInvestment, totalStartupsFunded, portfolio } = req.body
    
    const consultantData = {
      userId: req.user._id,
      pastPortfolio: portfolio ? portfolio.map(item => ({
        companyName: item.companyName,
        investmentAmount: parseFloat(item.investmentAmount) || 0
      })) : [],
      summary: {
        totalInvestment: parseFloat(totalInvestment) || 0,
        totalStartupsFunded: parseInt(totalStartupsFunded) || 0
      },
      verification: {
        panCard: '',
        aadharCard: '',
        isVerified: false
      }
    }

    const consultant = await Consultant.create(consultantData)
    res.status(201).json(consultant)
  } catch (error) {
    console.error('Consultant profile creation error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Get consultant profile
router.get('/profile', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    const consultant = await Consultant.findOne({ userId: req.user._id })
    res.json(consultant)
  } catch (error) {
    console.error('Get consultant profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update consultant profile
router.put('/profile', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    let updateData
    
    // Handle both form structure and direct schema structure
    if (req.body.fullName || req.body.contactNo || req.body.linkedIn || req.body.totalInvestment || req.body.totalStartupsFunded || req.body.portfolio) {
      // Form data structure - transform it
      const { fullName, contactNo, linkedIn, totalInvestment, totalStartupsFunded, portfolio, ...otherData } = req.body
      
      updateData = {
        ...otherData,
        pastPortfolio: portfolio ? portfolio.map(item => ({
          companyName: item.companyName,
          investmentAmount: parseFloat(item.investmentAmount) || 0
        })) : undefined,
        summary: {
          totalInvestment: parseFloat(totalInvestment) || 0,
          totalStartupsFunded: parseInt(totalStartupsFunded) || 0
        }
      }
      
      // Remove undefined fields
      if (!updateData.pastPortfolio) delete updateData.pastPortfolio
    } else {
      // Direct schema structure
      updateData = req.body
    }

    const consultant = await Consultant.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant profile not found' })
    }
    
    res.json(consultant)
  } catch (error) {
    console.error('Consultant profile update error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// Add portfolio item
router.post('/portfolio', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    const { companyName, investmentAmount } = req.body
    
    const consultant = await Consultant.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $push: { 
          pastPortfolio: { 
            companyName, 
            investmentAmount: parseFloat(investmentAmount) || 0 
          } 
        } 
      },
      { new: true }
    )
    
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant profile not found' })
    }
    
    res.json(consultant)
  } catch (error) {
    console.error('Add portfolio item error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update verification documents
router.put('/verification', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    const { panCard, aadharCard } = req.body
    
    const consultant = await Consultant.findOneAndUpdate(
      { userId: req.user._id },
      { 
        'verification.panCard': panCard,
        'verification.aadharCard': aadharCard
      },
      { new: true }
    )
    
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant profile not found' })
    }
    
    res.json(consultant)
  } catch (error) {
    console.error('Update verification error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete consultant profile
router.delete('/profile', auth, roleCheck(['consultant']), async (req, res) => {
  try {
    const consultant = await Consultant.findOneAndDelete({ userId: req.user._id })
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant profile not found' })
    }
    res.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Consultant profile deletion error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router