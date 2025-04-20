import express from "express";
import multer from "multer";
import path from "path";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
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

// Define product-related routes
router.get("/", getAllProducts); // Fetch all products
router.get("/:id", getProductById); // Fetch a product by ID
router.post("/", upload.single("image"), createProduct); // Create a new product
router.put("/:id", upload.single("image"), updateProduct); // Update a product by ID
router.delete("/:id", deleteProduct); // Delete a product by ID

export default router;
