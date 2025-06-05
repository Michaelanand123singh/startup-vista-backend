const express = require('express')
const upload = require('../middleware/upload')
const auth = require('../middleware/auth')

const router = express.Router()

// Upload single file
router.post('/single', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: req.file.path
    })
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' })
  }
})

module.exports = router