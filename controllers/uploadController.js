const path = require('path')

const uploadSingle = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Upload failed' })
  }
}

const uploadMultiple = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      fieldname: file.fieldname
    }))

    res.json({
      message: 'Files uploaded successfully',
      files
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Upload failed' })
  }
}

module.exports = {
  uploadSingle,
  uploadMultiple
}