const express = require('express')
const {
  getAllPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  expressInterest,
  getUserPosts,
  searchPosts,
  uploadDocument
} = require('../controllers/postController')
const auth = require('../middleware/auth')
const upload = require('../middleware/upload')
const roleCheck = require('../middleware/roleCheck')

const router = express.Router()

// Public routes (no authentication required)
router.get('/', getAllPosts)
router.get('/search', searchPosts)
router.get('/user/:userId', getUserPosts)
router.get('/:postId', getPostById)

// Protected routes (authentication required)
router.post('/', auth, roleCheck(['startup', 'consultant']), createPost)
router.put('/:postId', auth, roleCheck(['startup', 'consultant']), updatePost)
router.delete('/:postId', auth, roleCheck(['startup', 'consultant']), deletePost)
router.post('/:postId/interest', auth, roleCheck(['investor']), expressInterest)

// Document upload route
router.post('/:postId/documents/:documentType', 
  auth, 
  roleCheck(['startup', 'consultant']), 
  upload.single('document'), 
  uploadDocument
)

module.exports = router