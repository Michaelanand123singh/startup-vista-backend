const jwt = require('jsonwebtoken')

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  try {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000) // Issued at time
    }
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d', // Token expires in 7 days
        issuer: 'startupvista',
        audience: 'startupvista-users'
      }
    )
  } catch (error) {
    console.error('Error generating token:', error)
    throw new Error('Token generation failed')
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'startupvista',
      audience: 'startupvista-users'
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired')
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token')
    } else {
      throw new Error('Token verification failed')
    }
  }
}

/**
 * Generate refresh token (for future implementation)
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    }
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '30d', // Refresh token expires in 30 days
        issuer: 'startupvista',
        audience: 'startupvista-users'
      }
    )
  } catch (error) {
    console.error('Error generating refresh token:', error)
    throw new Error('Refresh token generation failed')
  }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true })
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

/**
 * Extract user ID from token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if invalid
 */
const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.decode(token)
    return decoded?.userId || null
  } catch (error) {
    return null
  }
}

/**
 * JWT configuration constants
 */
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: '7d',
  REFRESH_EXPIRES_IN: '30d',
  ISSUER: 'startupvista',
  AUDIENCE: 'startupvista-users',
  ALGORITHM: 'HS256'
}

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  decodeToken,
  isTokenExpired,
  getUserIdFromToken,
  JWT_CONFIG
}