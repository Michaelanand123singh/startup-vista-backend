const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

// CORS configuration - be more specific about origins
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Database connection
const connectDB = require('./config/database')
connectDB()

// Health check endpoint - moved before routes to avoid conflicts
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Default route - moved before other routes
app.get('/', (req, res) => {
  res.json({ message: 'StartupVista API is running!' })
})

// Routes - wrapped in try-catch to identify problematic routes
try {
  app.use('/api/auth', require('./routes/auth'))
  console.log('✓ Auth routes loaded')
} catch (error) {
  console.error('✗ Error loading auth routes:', error.message)
}

try {
  app.use('/api/users', require('./routes/users'))
  console.log('✓ Users routes loaded')
} catch (error) {
  console.error('✗ Error loading users routes:', error.message)
}

try {
  app.use('/api/posts', require('./routes/posts'))
  console.log('✓ Posts routes loaded')
} catch (error) {
  console.error('✗ Error loading posts routes:', error.message)
}

try {
  app.use('/api/uploads', require('./routes/uploads'))
  console.log('✓ Uploads routes loaded')
} catch (error) {
  console.error('✗ Error loading uploads routes:', error.message)
}

try {
  app.use('/api/startups', require('./routes/startups'))
  console.log('✓ Startups routes loaded')
} catch (error) {
  console.error('✗ Error loading startups routes:', error.message)
}

try {
  app.use('/api/investors', require('./routes/investors'))
  console.log('✓ Investors routes loaded')
} catch (error) {
  console.error('✗ Error loading investors routes:', error.message)
}

try {
  app.use('/api/consultants', require('./routes/consultants'))
  console.log('✓ Consultants routes loaded')
} catch (error) {
  console.error('✗ Error loading consultants routes:', error.message)
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    })
  }
  
  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(500).json({
      message: 'Database Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    })
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`)
})