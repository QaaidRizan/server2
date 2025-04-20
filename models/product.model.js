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
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
});

// Create the Product model
const Product = mongoose.model("Product", ProductSchema);

export default Product;
