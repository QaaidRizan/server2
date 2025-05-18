import express from "express";
import multer from "multer";
import path from "path";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts // Add this import
} from "../controllers/product.controller.js";
import fs from 'fs';

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const router = express.Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Directory for uploaded files
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now(); // Use only the timestamp for uniqueness
        const cleanFileName = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores for compatibility
        cb(null, `${timestamp}-${cleanFileName}`);
    },
});

const upload = multer({ storage });

// Serve static files from the uploads folder
router.use("/uploads", express.static("uploads"));

// Add this route before the other routes
router.get("/search", searchProducts); // Search products by name or description

// Define product-related routes
router.get("/", getAllProducts); // Fetch all products
router.get("/:id", getProductById); // Fetch a product by ID
router.post("/", upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
]), createProduct); // Create a new product with up to 5 images
router.put("/:id", upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
]), updateProduct); // Update a product with up to 5 images
router.delete("/:id", deleteProduct); // Delete a product by ID

export default router;