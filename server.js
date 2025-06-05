const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Database connection
const connectDB = require('./config/database')
connectDB()

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/posts', require('./routes/posts'))
app.use('/api/uploads', require('./routes/uploads'))
app.use('/api/startups', require('./routes/startups'))
app.use('/api/investors', require('./routes/investors'))
app.use('/api/consultants', require('./routes/consultants'))


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'StartupVista API is running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})