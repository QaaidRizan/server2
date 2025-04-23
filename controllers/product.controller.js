import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'dmlx9fibl', // Store this in your .env file for security
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    console.log("Uploading file to Cloudinary:", file.path);
    
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'products',
      resource_type: 'auto'
    });
    
    console.log("Cloudinary upload result:", {
      url: result.secure_url,
      publicId: result.public_id
    });
    
    // Delete local file after upload
    fs.unlinkSync(file.path);
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Image upload failed: " + error.message);
  }
};

const formatProduct = (product) => ({
  id: product._id.toString(),
  name: product.name,
  price: product.price,
  description: product.description,
  category: product.category,
  images: [product.image1, product.image2, product.image3, product.image4, product.image5].filter(Boolean), // Filter out null/undefined
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
  const { name, price, description, category } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!name) missingFields.push("name");
  if (!price) missingFields.push("price");
  if (!description) missingFields.push("description");
  if (!category) missingFields.push("category");
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `The following fields are missing: ${missingFields.join(", ")}`,
    });
  }

  try {
    const imageUrls = {};

    // Upload up to 5 images if provided
    if (req.files) {
      const imageFields = ['image1', 'image2', 'image3', 'image4', 'image5'];
      for (let i = 0; i < imageFields.length; i++) {
        const file = req.files[imageFields[i]];
        if (file) {
          imageUrls[imageFields[i]] = await uploadToCloudinary(file[0]);
        }
      }
    }

    const newProduct = new Product({
      name,
      price,
      description,
      category,
      ...imageUrls, // Spread uploaded image URLs into the product
    });

    const savedProduct = await newProduct.save();
    console.log("Product saved with ID:", savedProduct._id);

    res.status(201).json({
      success: true,
      message: "Product created successfully with images",
      product: formatProduct(savedProduct),
    });
  } catch (error) {
    console.error("Product creation error:", error);
    
    // Clean up any uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkError) {
              console.error("Error deleting file:", unlinkError);
            }
          }
        });
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update a product by ID
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, category } = req.body;

  try {
    const productToUpdate = await Product.findById(id);
    if (!productToUpdate) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found"
      });
    }

    // Update fields
    productToUpdate.name = name || productToUpdate.name;
    productToUpdate.price = price || productToUpdate.price;
    productToUpdate.description = description || productToUpdate.description;
    productToUpdate.category = category || productToUpdate.category;

    // Update images if new files are provided
    if (req.files) {
      const imageFields = ['image1', 'image2', 'image3', 'image4', 'image5'];
      for (let i = 0; i < imageFields.length; i++) {
        const file = req.files[imageFields[i]];
        if (file) {
          productToUpdate[imageFields[i]] = await uploadToCloudinary(file[0]);
        }
      }
    }

    const updatedProduct = await productToUpdate.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: formatProduct(updatedProduct),
    });
  } catch (error) {
    console.error("Product update error:", error);
    
    // Clean up any uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkError) {
              console.error("Error deleting file:", unlinkError);
            }
          }
        });
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
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