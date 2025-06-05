const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/'
    
    if (file.fieldname === 'logo') {
      uploadPath += 'logos/'
    } else if (file.fieldname === 'onePager' || file.fieldname === 'pitchDeck') {
      uploadPath += 'documents/'
    } else {
      uploadPath += 'verification/'
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'logo') {
    // Allow only images for logos
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for logos'), false)
    }
  } else {
    // Allow images and PDFs for documents
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only image and PDF files are allowed'), false)
    }
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

module.exports = upload