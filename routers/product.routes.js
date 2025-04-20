import express from 'express';
import multer from 'multer';
import * as productController from '../controllers/product.controller.js';

const router = express.Router();

// Configure multer to use memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes with file upload middleware
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);

// Other routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProduct);

export default router;