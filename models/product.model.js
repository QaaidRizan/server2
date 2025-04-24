import mongoose from "mongoose";

// Define the Product Schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Car",
      "Bike",
      "Boaty",
    ],
  },
  price: {
    type: String,
    required: true,
    min: 0,
  },
  image1: {
    type: String,
    required: false, // Optional
  },
  image2: {
    type: String,
    required: false, // Optional
  },
  image3: {
    type: String,
    required: false, // Optional
  },
  image4: {
    type: String,
    required: false, // Optional
  },
  image5: {
    type: String,
    required: false, // Optional
  },
});

// Create the Product model
const Product = mongoose.model("Product", ProductSchema);

export default Product;
