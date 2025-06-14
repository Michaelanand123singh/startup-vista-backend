const User = require('../models/User')
const { generateToken, verifyFirebaseToken, generateTokenFromFirebaseUser } = require('../config/auth')
const { validationResult } = require('express-validator')

const register = async (req, res) => {
  try {
    console.log('Register request received:', { body: req.body })
    
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array())
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, role } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', email)
      return res.status(400).json({ message: 'User already exists' })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      provider: 'local'
    })

    await user.save()
    console.log('User created successfully:', user._id)

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        provider: user.provider
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const login = async (req, res) => {
  try {
    console.log('Login request received:', { body: { email: req.body.email } })
    
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array())
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      console.log('User not found:', email)
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Check if user can login with password (not a Firebase user)
    if (!user.canLoginWithPassword()) {
      console.log('Firebase user attempting password login:', email)
      return res.status(400).json({ 
        message: 'This account uses Firebase authentication. Please use the Firebase login.' 
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      console.log('Password mismatch for user:', email)
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    console.log('Login successful for user:', email)

    // Generate token
    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        provider: user.provider
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const firebaseAuth = async (req, res) => {
  try {
    console.log('Firebase auth request received:', { 
      hasIdToken: !!req.body.idToken,
      role: req.body.role,
      headers: req.headers
    })
    
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Firebase auth validation errors:', errors.array())
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      })
    }

    const { idToken, role } = req.body

    if (!idToken) {
      console.log('No idToken provided')
      return res.status(400).json({ message: 'Firebase ID token is required' })
    }

    console.log('Attempting to verify Firebase token...')
    
    // Verify Firebase token
    const firebaseUser = await verifyFirebaseToken(idToken)
    console.log('Firebase token verified successfully:', {
      uid: firebaseUser.firebaseUid,
      email: firebaseUser.email,
      name: firebaseUser.name
    })
    
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { firebaseUid: firebaseUser.firebaseUid },
        { email: firebaseUser.email }
      ]
    })

    console.log('Existing user found:', !!user)

    if (user) {
      // Existing user - update Firebase info if needed
      if (!user.firebaseUid) {
        console.log('Updating existing user with Firebase UID')
        user.firebaseUid = firebaseUser.firebaseUid
        user.provider = 'firebase'
      }
      user.avatar = firebaseUser.picture
      user.isVerified = firebaseUser.emailVerified
      await user.save()
      console.log('Existing user updated')
    } else {
      // New user - role is required for new Firebase users
      if (!role || !['startup', 'investor', 'consultant'].includes(role)) {
        console.log('New user without valid role, requesting role selection')
        return res.status(400).json({ 
          message: 'Role selection is required for new users',
          isNewUser: true,
          firebaseData: { 
            name: firebaseUser.name, 
            email: firebaseUser.email, 
            picture: firebaseUser.picture 
          }
        })
      }

      console.log('Creating new Firebase user with role:', role)

      // Create new user
      user = new User({
        name: firebaseUser.name,
        email: firebaseUser.email,
        firebaseUid: firebaseUser.firebaseUid,
        role,
        avatar: firebaseUser.picture,
        provider: 'firebase',
        isVerified: firebaseUser.emailVerified
      })

      await user.save()
      console.log('New Firebase user created:', user._id)
    }

    // Generate token
    const token = generateTokenFromFirebaseUser(firebaseUser, user._id)
    console.log('Token generated successfully')

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        provider: user.provider
      }
    })

  } catch (error) {
    console.error('Firebase Auth Error:', error)
    
    if (error.message.includes('Firebase token has expired')) {
      return res.status(401).json({ message: 'Firebase token has expired' })
    } else if (error.message.includes('Invalid Firebase token')) {
      return res.status(401).json({ message: 'Invalid Firebase token' })
    } else if (error.message.includes('Failed to initialize Firebase Admin')) {
      return res.status(500).json({ message: 'Firebase service temporarily unavailable' })
    }

    res.status(500).json({ 
      message: 'Server error during Firebase authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

const completeFirebaseSignup = async (req, res) => {
  try {
    console.log('Complete Firebase signup request:', { role: req.body.role })
    
    const { idToken, role, name, email } = req.body

    if (!idToken || !role) {
      return res.status(400).json({ message: 'ID token and role are required' })
    }

    if (!['startup', 'investor', 'consultant'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' })
    }

    // Verify Firebase token again
    const firebaseUser = await verifyFirebaseToken(idToken)
    console.log('Firebase token verified for signup completion')

    // Create new user with selected role
    const user = new User({
      name: name || firebaseUser.name,
      email: email || firebaseUser.email,
      firebaseUid: firebaseUser.firebaseUid,
      role,
      avatar: firebaseUser.picture,
      provider: 'firebase',
      isVerified: firebaseUser.emailVerified
    })

    await user.save()
    console.log('Firebase signup completed for user:', user._id)

    // Generate token
    const token = generateTokenFromFirebaseUser(firebaseUser, user._id)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        provider: user.provider
      }
    })

  } catch (error) {
    console.error('Complete Firebase Signup Error:', error)
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

const verifyToken = async (req, res) => {
  try {
    console.log('Token verification request for user:', req.user?._id)
    
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
        avatar: req.user.avatar,
        provider: req.user.provider
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get Firebase client configuration for frontend
const getFirebaseConfig = (req, res) => {
  console.log('Firebase config requested')
  
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  }
  
  console.log('Firebase config:', { ...config, apiKey: config.apiKey ? 'SET' : 'NOT SET' })
  res.json(config)
}

module.exports = {
  register,
  login,
  firebaseAuth,
  completeFirebaseSignup,
  verifyToken,
  getFirebaseConfig
}