const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only for local auth
      return this.provider === 'local'
    },
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['startup', 'investor', 'consultant']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  contactNo: String,
  linkedin: String,
  // Firebase auth fields
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  avatar: {
    type: String, // Profile picture URL
    default: null
  },
  provider: {
    type: String,
    enum: ['local', 'firebase'],
    default: 'local'
  }
}, {
  timestamps: true
})

// Create compound index for email uniqueness
userSchema.index({ email: 1 }, { unique: true })

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  // Skip password hashing for Firebase users
  if (this.provider === 'firebase' || !this.isModified('password')) {
    return next()
  }
  
  try {
    this.password = await bcrypt.hash(this.password, 12)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method (only for local auth)
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Firebase users don't have passwords to compare
  if (this.provider === 'firebase') {
    throw new Error('Firebase users do not have passwords')
  }
  
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to check if user can login with password
userSchema.methods.canLoginWithPassword = function() {
  return this.provider === 'local' && this.password
}

// Method to get safe user data (without sensitive info)
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject()
  delete userObject.password
  delete userObject.__v
  return userObject
}

// Static method to find or create Firebase user
userSchema.statics.findOrCreateFirebaseUser = async function(firebaseUser) {
  try {
    // First, try to find user by Firebase UID
    let user = await this.findOne({ firebaseUid: firebaseUser.firebaseUid })
    
    if (user) {
      // Update user info if found
      user.name = firebaseUser.name
      user.avatar = firebaseUser.picture
      user.isVerified = firebaseUser.emailVerified
      await user.save()
      return user
    }
    
    // If not found by Firebase UID, check if email already exists
    user = await this.findOne({ email: firebaseUser.email })
    
    if (user) {
      // Link existing account with Firebase
      user.firebaseUid = firebaseUser.firebaseUid
      user.provider = 'firebase'
      user.avatar = firebaseUser.picture
      user.isVerified = firebaseUser.emailVerified
      await user.save()
      return user
    }
    
    // Create new user - will need role selection
    return null
    
  } catch (error) {
    throw error
  }
}

module.exports = mongoose.model('User', userSchema)