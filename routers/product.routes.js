import express from 'express';
import multer from 'multer';
import * as productController from '../controllers/product.controller.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Routes with file upload middleware
router.post('/', upload.single('image'), (req, res, next) => {
  productController.createProduct(req, res, next);
  // Clean up the temporary file
  fs.unlinkSync(req.file.path);
});

router.put('/:id', upload.single('image'), (req, res, next) => {
  productController.updateProduct(req, res, next);
  // Clean up the temporary file
  fs.unlinkSync(req.file.path);
});

// Other routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProduct);

export default router;