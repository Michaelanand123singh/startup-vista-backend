const express = require('express')
const { body } = require('express-validator')
const { 
  register, 
  login, 
  firebaseAuth, 
  completeFirebaseSignup,
  verifyToken,
  getFirebaseConfig
} = require('../controllers/authController')
const auth = require('../middleware/auth')

const router = express.Router()

// Get Firebase configuration
router.get('/firebase/config', getFirebaseConfig)

// Regular register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['startup', 'investor', 'consultant']).withMessage('Invalid role')
], register)

// Regular login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], login)

// Firebase authentication
router.post('/firebase', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
  body('role').optional().isIn(['startup', 'investor', 'consultant']).withMessage('Invalid role')
], firebaseAuth)

// Complete Firebase signup with role selection
router.post('/firebase/complete', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
  body('role').isIn(['startup', 'investor', 'consultant']).withMessage('Role is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email')
], completeFirebaseSignup)

// Verify token
router.get('/verify', auth, verifyToken)

// ADD THIS: Logout route
router.post('/logout', (req, res) => {
  try {
    // Clear any server-side sessions if you have them
    // For JWT-based auth, we mainly clear client-side tokens
    res.json({ 
      message: 'Logged out successfully',
      success: true 
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ 
      message: 'Logout failed',
      error: error.message 
    })
  }
})

// ADD THIS: Token refresh route (if you're using refresh tokens)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' })
    }
    
    // Add your refresh token logic here
    // For now, just return an error
    res.status(501).json({ message: 'Refresh token functionality not implemented yet' })
    
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ 
      message: 'Token refresh failed',
      error: error.message 
    })
  }
})

module.exports = router