const User = require('../models/User')
const Startup = require('../models/Startup')
const Investor = require('../models/Investor')
const Consultant = require('../models/Consultant')

const getUserProfile = async (req, res) => {
  try {
    let profileData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      contactNo: req.user.contactNo,
      linkedin: req.user.linkedin
    }

    // Get role-specific data
    if (req.user.role === 'startup') {
      const startup = await Startup.findOne({ userId: req.user._id })
      profileData.startup = startup
    } else if (req.user.role === 'investor') {
      const investor = await Investor.findOne({ userId: req.user._id })
      profileData.investor = investor
    } else if (req.user.role === 'consultant') {
      const consultant = await Consultant.findOne({ userId: req.user._id })
      profileData.consultant = consultant
    }

    res.json(profileData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { name, contactNo, linkedin } = req.body

    // Update base user info
    await User.findByIdAndUpdate(req.user._id, {
      name,
      contactNo,
      linkedin
    })

    // Update role-specific data
    if (req.user.role === 'startup') {
      const startupData = req.body.startup
      if (startupData) {
        await Startup.findOneAndUpdate(
          { userId: req.user._id },
          startupData,
          { upsert: true, new: true }
        )
      }
    } else if (req.user.role === 'investor') {
      const investorData = req.body.investor
      if (investorData) {
        await Investor.findOneAndUpdate(
          { userId: req.user._id },
          investorData,
          { upsert: true, new: true }
        )
      }
    } else if (req.user.role === 'consultant') {
      const consultantData = req.body.consultant
      if (consultantData) {
        await Consultant.findOneAndUpdate(
          { userId: req.user._id },
          consultantData,
          { upsert: true, new: true }
        )
      }
    }

    res.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getUserProfile,
  updateProfile
}
