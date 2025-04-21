import mongoose from "mongoose";
import Product from "../models/product.model.js";
import cloudinary from "./cloudinary.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Save files to the uploads directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export default upload;

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'products',
      resource_type: 'image',
      fetch_format: 'auto',
      quality: 'auto',
    });

    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    throw new Error("Image upload failed: " + (err.message || "Unknown error"));
  }
};

const formatProduct = (product) => ({
  id: product._id.toString(),
  name: product.name,
  description: product.description,
  category: product.category,
  price: product.price,
  image: product.image,
});

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().select("name price image description category");
    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found" });
    }

    const formattedProducts = products.map(formatProduct);
    res.status(200).json({ success: true, products: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get a product by ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: formatProduct(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  const { name, price, description, category, imagePath } = req.body;

  if (!name || !price || !description || !category || !imagePath) {
    return res.status(400).json({ success: false, message: "All fields (name, price, description, category, imagePath) are required" });
  }

  try {
    const imageUrl = await uploadToCloudinary(imagePath);

    const newProduct = new Product({
      name,
      description,
      category,
      price,
      image: imageUrl,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      product: formatProduct(newProduct),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update a product by ID
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, category, imagePath } = req.body;

  if (!name || !price || !description || !category) {
    return res.status(400).json({ success: false, message: "All fields (name, price, description, category) are required" });
  }

  try {
    const productToUpdate = await Product.findById(id);
    if (!productToUpdate) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    productToUpdate.name = name;
    productToUpdate.price = price;
    productToUpdate.description = description;
    productToUpdate.category = category;

    if (imagePath) {
      const imageUrl = await uploadToCloudinary(imagePath);
      productToUpdate.image = imageUrl;
    }

    const updatedProduct = await productToUpdate.save();

    res.status(200).json({
      success: true,
      product: formatProduct(updatedProduct),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete a product by ID
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const productToDelete = await Product.findById(id);
    if (!productToDelete) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete image from Cloudinary when product is deleted
    if (productToDelete.image) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicId = 'products/' + productToDelete.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        // Continue with product deletion even if image deletion fails
      }
    }

    await productToDelete.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product: formatProduct(productToDelete),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
