const Post = require('../models/Post')

const getAllPosts = async (req, res) => {
  try {
    const { sector, investmentType, limit = 10, page = 1 } = req.query
    
    // Build query object
    const query = { isActive: true }
    
    if (sector) {
      query.sector = sector
    }
    
    if (investmentType) {
      query.investmentType = investmentType
    }

    const posts = await Post.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Post.countDocuments(query)

    res.json({
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const createPost = async (req, res) => {
  try {
    const {
      companyName,
      sector,
      investmentAmount,
      investmentType,
      equityPercentage,
      consultant,
      description
    } = req.body

    // Validate required fields
    if (!companyName || !sector || !investmentAmount || !investmentType) {
      return res.status(400).json({ 
        message: 'Missing required fields: companyName, sector, investmentAmount, investmentType' 
      })
    }

    // Validate investment amount
    if (investmentAmount <= 0) {
      return res.status(400).json({ 
        message: 'Investment amount must be greater than 0' 
      })
    }

    // Validate equity percentage if provided
    if (equityPercentage !== undefined && (equityPercentage < 0 || equityPercentage > 100)) {
      return res.status(400).json({ 
        message: 'Equity percentage must be between 0 and 100' 
      })
    }

    // Determine post type based on user role
    const postType = req.user.role === 'consultant' ? 'seed' : 'startup'

    const post = new Post({
      createdBy: req.user._id,
      postType,
      companyName: companyName.trim(),
      sector,
      investmentAmount: Number(investmentAmount),
      investmentType,
      equityPercentage: equityPercentage ? Number(equityPercentage) : undefined,
      consultant: consultant?.trim() || 'StartupVista',
      description: description?.trim() || ''
    })

    await post.save()
    await post.populate('createdBy', 'name email role')

    res.status(201).json({
      message: 'Post created successfully',
      post
    })
  } catch (error) {
    console.error('Error creating post:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      })
    }
    
    res.status(500).json({ message: 'Server error' })
  }
}

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params
    
    const post = await Post.findById(postId)
      .populate('createdBy', 'name email role')
      .populate('investmentInterests.investorId', 'name email')

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Increment view count
    post.views = (post.views || 0) + 1
    await post.save()

    res.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params
    const {
      companyName,
      sector,
      investmentAmount,
      investmentType,
      equityPercentage,
      consultant,
      description
    } = req.body

    const post = await Post.findById(postId)
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if user owns the post
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' })
    }

    // Update fields if provided
    if (companyName) post.companyName = companyName.trim()
    if (sector) post.sector = sector
    if (investmentAmount) post.investmentAmount = Number(investmentAmount)
    if (investmentType) post.investmentType = investmentType
    if (equityPercentage !== undefined) post.equityPercentage = Number(equityPercentage)
    if (consultant) post.consultant = consultant.trim()
    if (description !== undefined) post.description = description.trim()

    await post.save()
    await post.populate('createdBy', 'name email role')

    res.json({
      message: 'Post updated successfully',
      post
    })
  } catch (error) {
    console.error('Error updating post:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params
    
    const post = await Post.findById(postId)
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if user owns the post
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' })
    }

    // Soft delete - set isActive to false
    post.isActive = false
    await post.save()

    res.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const expressInterest = async (req, res) => {
  try {
    const { postId } = req.params
    const { answers } = req.body

    // Validate answers
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ 
        message: 'Please provide answers to the required questions' 
      })
    }

    const post = await Post.findById(postId)
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if post is active
    if (!post.isActive) {
      return res.status(400).json({ message: 'This post is no longer active' })
    }

    // Check if user already expressed interest
    const existingInterest = post.investmentInterests.find(
      interest => interest.investorId.toString() === req.user._id.toString()
    )

    if (existingInterest) {
      return res.status(400).json({ 
        message: 'You have already expressed interest in this post' 
      })
    }

    // Add new interest
    post.investmentInterests.push({
      investorId: req.user._id,
      answers
    })

    await post.save()

    res.status(201).json({ 
      message: 'Interest expressed successfully',
      interest: post.investmentInterests[post.investmentInterests.length - 1]
    })
  } catch (error) {
    console.error('Error expressing interest:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 10, page = 1 } = req.query

    const posts = await Post.find({ 
      createdBy: userId,
      isActive: true 
    })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Post.countDocuments({ 
      createdBy: userId,
      isActive: true 
    })

    res.json({
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const searchPosts = async (req, res) => {
  try {
    const { q: searchQuery } = req.query
    const { limit = 10, page = 1 } = req.query

    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ 
        message: 'Search query is required' 
      })
    }

    const query = { 
      isActive: true,
      $or: [
        { companyName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { sector: { $regex: searchQuery, $options: 'i' } }
      ]
    }

    const posts = await Post.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Post.countDocuments(query)

    res.json({
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    console.error('Error searching posts:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const uploadDocument = async (req, res) => {
  try {
    const { postId } = req.params
    const { documentType } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ 
        message: 'No file uploaded' 
      })
    }

    if (!['onePager', 'pitchDeck'].includes(documentType)) {
      return res.status(400).json({ 
        message: 'Invalid document type. Must be onePager or pitchDeck' 
      })
    }

    const post = await Post.findById(postId)
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if user owns the post
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to update this post' 
      })
    }

    // Update the document
    post.documents[documentType] = file.path
    await post.save()

    res.json({ 
      message: 'Document uploaded successfully',
      documentPath: file.path
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getAllPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  expressInterest,
  getUserPosts,
  searchPosts,
  uploadDocument
}