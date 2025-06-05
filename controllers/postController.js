const Post = require('../models/Post')

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isActive: true })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })

    res.json(posts)
  } catch (error) {
    console.error(error)
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
      consultant
    } = req.body

    const postType = req.user.role === 'consultant' ? 'seed' : 'startup'

    const post = new Post({
      createdBy: req.user._id,
      postType,
      companyName,
      sector,
      investmentAmount,
      investmentType,
      equityPercentage,
      consultant: consultant || 'StartupVista'
    })

    await post.save()
    await post.populate('createdBy', 'name email role')

    res.status(201).json(post)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

const expressInterest = async (req, res) => {
  try {
    const { postId } = req.params
    const { answers } = req.body

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if investor already expressed interest
    const existingInterest = post.investmentInterests.find(
      interest => interest.investorId.toString() === req.user._id.toString()
    )

    if (existingInterest) {
      return res.status(400).json({ message: 'Interest already expressed' })
    }

    post.investmentInterests.push({
      investorId: req.user._id,
      answers
    })

    await post.save()

    res.json({ message: 'Interest expressed successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getAllPosts,
  createPost,
  expressInterest
}