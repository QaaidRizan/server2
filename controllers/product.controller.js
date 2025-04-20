import mongoose from "mongoose";
import Product from "../models/product.model.js";

const formatProduct = (product) => ({
    id: product._id.toString(), // Convert MongoDB ObjectId to string
    name: product.name,
    price: product.price,
    description: product.description, // Include description
    category: product.category,
    image: product.image, // Generate full image URL
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
    const image = req.file ? req.file.filename : ""; // Get only the filename

    if (!name || !price || !image || !description || !category) {
        return res.status(400).json({ success: false, message: "All fields (name, price, image, description, category) are required" });
    }

    try {
        const newProduct = new Product({
            name,
            price,
            image,
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
    const image = req.file ? req.file.filename : null; // Update image if a new file is provided

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

        // Update image only if a new file is provided
        if (image) {
            productToUpdate.image = image;
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
