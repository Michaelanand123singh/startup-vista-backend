const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    let token = req.header('Authorization')?.replace('Bearer ', '')
    
    // Fallback to cookie if no header token (for web clients)
    if (!token && req.cookies?.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. Please log in.' 
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check token expiration separately for better error messages
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired. Please log in again.' 
      })
    }

    // Find user and exclude sensitive data
    const user = await User.findById(decoded.userId)
      .select('-password -refreshToken -__v')
      .lean()

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found. Token is invalid.' 
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account deactivated. Please contact support.' 
      })
    }

    // Check if user needs to verify email (if you have this feature)
    if (user.requireEmailVerification && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to continue',
        requiresVerification: true
      })
    }

    // Attach user to request
    req.user = user
    
    // Optionally attach the raw token for other middleware
    req.token = token
    
    next()
  } catch (error) {
    console.error('Authentication error:', error.message)
    
    let message = 'Authentication failed'
    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token'
    } else if (error.name === 'TokenExpiredError') {
      message = 'Session expired. Please log in again.'
    }

    res.status(401).json({ 
      success: false,
      message 
    })
  }
}

// Higher-order function for role-based access
auth.role = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access restricted to: ${roles.join(', ')}` 
      })
    }

    next()
  }
}

// Optional: Add a soft-check version that doesn't block requests
auth.optional = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token
  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err && decoded) {
        const user = await User.findById(decoded.userId)
          .select('-password -refreshToken -__v')
          .lean()
        
        if (user) {
          req.user = user
          req.token = token
        }
      }
      next()
    })
  } else {
    next()
  }
}

module.exports = auth