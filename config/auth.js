const jwt = require('jsonwebtoken')
const admin = require('firebase-admin')

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      })
      console.log('Firebase Admin initialized successfully')
    } catch (error) {
      console.error('Firebase Admin initialization error:', error)
      throw new Error('Failed to initialize Firebase Admin')
    }
  }
}

// Initialize Firebase on module load
initializeFirebase()

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User's MongoDB ObjectId
 * @param {object} additionalClaims - Additional claims to include in token
 * @returns {string} JWT token
 */
const generateToken = (userId, additionalClaims = {}) => {
  try {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000), // Issued at time
      ...additionalClaims
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
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from client
 * @returns {object} Firebase user data
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    
    return {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.display_name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
      provider: 'firebase',
      authTime: decodedToken.auth_time,
      issuedAt: decodedToken.iat,
      expiresAt: decodedToken.exp
    }
  } catch (error) {
    console.error('Error verifying Firebase token:', error)
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Firebase token has expired')
    } else if (error.code === 'auth/id-token-revoked') {
      throw new Error('Firebase token has been revoked')
    } else if (error.code === 'auth/invalid-id-token') {
      throw new Error('Invalid Firebase token')
    } else {
      throw new Error('Firebase token verification failed')
    }
  }
}

/**
 * Generate JWT token with user profile data
 * @param {string} userId - User's MongoDB ObjectId  
 * @param {object} user - User object from database
 * @returns {string} JWT token with user claims
 */
const generateTokenWithUserData = (userId, user) => {
  const additionalClaims = {
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.provider,
    isVerified: user.isVerified
  }
  
  // Add Firebase-specific claims if applicable
  if (user.provider === 'firebase' && user.firebaseUid) {
    additionalClaims.firebaseUid = user.firebaseUid
  }
  
  return generateToken(userId, additionalClaims)
}

/**
 * Generate JWT token from Firebase user data
 * @param {object} firebaseUser - Firebase user data from verifyFirebaseToken
 * @param {string} mongoUserId - MongoDB user ID (after saving to DB)
 * @returns {string} JWT token
 */
const generateTokenFromFirebaseUser = (firebaseUser, mongoUserId) => {
  const additionalClaims = {
    email: firebaseUser.email,
    name: firebaseUser.name,
    provider: 'firebase',
    firebaseUid: firebaseUser.firebaseUid,
    emailVerified: firebaseUser.emailVerified
  }
  
  return generateToken(mongoUserId, additionalClaims)
}

/**
 * Generate refresh token
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
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
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
 * Verify refresh token
 * @param {string} refreshToken - Refresh token to verify
 * @returns {object} Decoded refresh token payload
 */
const verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        issuer: 'startupvista',
        audience: 'startupvista-users'
      }
    )
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token type')
    }
    
    return decoded
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired')
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token')
    } else {
      throw new Error('Refresh token verification failed')
    }
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
 * Extract user data from token
 * @param {string} token - JWT token
 * @returns {object|null} User data or null if invalid
 */
const getUserDataFromToken = (token) => {
  try {
    const decoded = jwt.decode(token)
    if (!decoded) return null
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      provider: decoded.provider,
      isVerified: decoded.isVerified,
      firebaseUid: decoded.firebaseUid
    }
  } catch (error) {
    return null
  }
}

/**
 * Check if user authenticated via Firebase
 * @param {string} token - JWT token
 * @returns {boolean} True if Firebase user
 */
const isFirebaseUser = (token) => {
  try {
    const decoded = jwt.decode(token)
    return decoded?.provider === 'firebase'
  } catch (error) {
    return false
  }
}

/**
 * Validate token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if token has valid format
 */
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.')
  return parts.length === 3
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * Create standardized auth response
 * @param {object} user - User object
 * @param {string} token - JWT token
 * @param {string} message - Response message
 * @returns {object} Standardized response
 */
const createAuthResponse = (user, token, message = 'Authentication successful') => {
  return {
    success: true,
    message,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  }
}

/**
 * Get Firebase client configuration for frontend
 * @returns {object} Firebase client config
 */
const getFirebaseClientConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  }
}

/**
 * JWT configuration constants
 */
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  EXPIRES_IN: '7d',
  REFRESH_EXPIRES_IN: '30d',
  ISSUER: 'startupvista',
  AUDIENCE: 'startupvista-users',
  ALGORITHM: 'HS256'
}

/**
 * Firebase configuration
 */
const FIREBASE_CONFIG = {
  PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL
}

module.exports = {
  // Token generation
  generateToken,
  generateTokenWithUserData,
  generateTokenFromFirebaseUser,
  generateRefreshToken,
  
  // Token verification
  verifyToken,
  verifyRefreshToken,
  verifyFirebaseToken,
  
  // Token utilities
  decodeToken,
  isTokenExpired,
  getUserIdFromToken,
  getUserDataFromToken,
  isFirebaseUser,
  isValidTokenFormat,
  extractTokenFromHeader,
  
  // Response helpers
  createAuthResponse,
  getFirebaseClientConfig,
  
  // Configuration
  JWT_CONFIG,
  FIREBASE_CONFIG,
  
  // Firebase initialization
  initializeFirebase
}