const express = require('express')
const { getAllPosts, createPost, expressInterest } = require('../controllers/postController')
const auth = require('../middleware/auth')
const roleCheck = require('../middleware/roleCheck')

const router = express.Router()

// Get all posts
router.get('/', getAllPosts)

// Create post (startup and consultant)
router.post('/', auth, roleCheck(['startup', 'consultant']), createPost)

// Express investment interest
router.post('/:postId/interest', auth, roleCheck(['investor']), expressInterest)

module.exports = router
