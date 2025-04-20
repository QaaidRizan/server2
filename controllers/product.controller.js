import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: 'dmlx9fibl', 
    api_key: '923186729273634', 
    api_secret: process.env.CLOUDINARY_API_SECRET // Store this in your environment variables
});

// Helper function to upload image buffer directly to Cloudinary
const uploadToCloudinary = async (file) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'products',
                    resource_type: 'image',
                    // Add optimizations and transformations
                    fetch_format: 'auto',
                    quality: 'auto',
                    transformation: [
                        { width: 1000, crop: 'limit' }  // Limit maximum width while maintaining aspect ratio
                    ]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            
            // Convert buffer to stream and pipe to cloudinary
            const stream = Readable.from(file.buffer);
            stream.pipe(uploadStream);
        });
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Image upload failed");
    }
};

const formatProduct = (product) => ({
    id: product._id.toString(), // Convert MongoDB ObjectId to string
    name: product.name,
    price: product.price,
    description: product.description, // Include description
    category: product.category,
    image: product.image, // This is now a Cloudinary URL
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
    
    if (!name || !price || !description || !category) {
        return res.status(400).json({ success: false, message: "All fields (name, price, description, category) are required" });
    }

    try {
        // Upload image to Cloudinary if file exists
        let imageUrl = "";
        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file);
        } else {
            return res.status(400).json({ success: false, message: "Image is required" });
        }

        const newProduct = new Product({
            name,
            price,
            image: imageUrl, // Store the Cloudinary URL instead of filename
            description,
            category,
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
    const { name, price, description, category } = req.body;
    
    if (!name || !price || !description || !category) {
        return res.status(400).json({ success: false, message: "All fields (name, price, description, category) are required" });
    }

    try {
        const productToUpdate = await Product.findById(id);
        if (!productToUpdate) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Update fields
        productToUpdate.name = name;
        productToUpdate.price = price;
        productToUpdate.description = description;
        productToUpdate.category = category;

        // Upload new image to Cloudinary if provided
        if (req.file) {
            // Optionally remove old image from Cloudinary
            if (productToUpdate.image) {
                try {
                    const publicId = 'products/' + productToUpdate.image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.error("Error deleting old image:", error);
                    // Continue anyway
                }
            }
            
            const imageUrl = await uploadToCloudinary(req.file);
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
