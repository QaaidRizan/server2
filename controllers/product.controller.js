import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'dmlx9fibl', // Store this in your .env file for security
  api_key: process.env.CLOUDINARY_API_KEY, // Store this in your .env file for security', 
  api_secret: process.env.CLOUDINARY_API_SECRET // Store this in your .env file for security
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
  image: product.image, // This will be the Cloudinary URL
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
  
  // Check if image was uploaded
  if (!req.file) {
    missingFields.push("image");
  }
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `The following fields are missing: ${missingFields.join(", ")}`,
    });
  }

  try {
    // Additional validation for the file
    if (!req.file.path || !fs.existsSync(req.file.path)) {
      return res.status(400).json({
        success: false,
        message: "Image upload failed: File not found on server",
      });
    }

    // Check file size
    const stats = fs.statSync(req.file.path);
    if (stats.size === 0) {
      fs.unlinkSync(req.file.path); // Remove empty file
      return res.status(400).json({
        success: false,
        message: "Image upload failed: Empty file detected",
      });
    }

    // Upload to Cloudinary and get the URL
    const imageUrl = await uploadToCloudinary(req.file);
    console.log("Cloudinary image URL:", imageUrl);

    const newProduct = new Product({
      name,
      price,
      description,
      category,
      image: imageUrl, // Store the Cloudinary URL directly
    });

    const savedProduct = await newProduct.save();
    console.log("Product saved with ID:", savedProduct._id);

    // Return the product with the Cloudinary URL
    res.status(201).json({
      success: true,
      message: "Product created successfully with image",
      product: formatProduct(savedProduct),
    });
  } catch (error) {
    console.error("Product creation error:", error);
    
    // Clean up any uploaded file if there's an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
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

  if (!name || !price || !description || !category) {
    // If file was uploaded but other fields are missing, delete the file
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(400).json({ 
      success: false, 
      message: "All fields (name, price, description, category) are required"
    });
  }

  try {
    const productToUpdate = await Product.findById(id);
    if (!productToUpdate) {
      // Delete uploaded file if product not found
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({ 
        success: false, 
        message: "Product not found"
      });
    }

    // Update fields
    productToUpdate.name = name;
    productToUpdate.price = price;
    productToUpdate.description = description;
    productToUpdate.category = category;

    // Update image only if a new file is provided
    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file);
      console.log("Updated image URL:", imageUrl);
      productToUpdate.image = imageUrl;
    }

    const updatedProduct = await productToUpdate.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: formatProduct(updatedProduct),
    });
  } catch (error) {
    console.error("Product update error:", error);
    
    // Clean up any uploaded file if there's an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
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