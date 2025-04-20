import express from 'express';
import dotenv from 'dotenv';
import path from "path";
import cors from "cors";
import { connectDB } from './config/db.js';
import { fileURLToPath } from "url";
import productRoutes from "./routers/product.routes.js";
import userRoutes from "./routers/user.routes.js";


dotenv.config();
const app = express();


// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Connect to the database
connectDB();

// Routes for products
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// Serve static files from the "uploads" folder
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));



// CORS for your frontend

app.use(cors({ origin: "http://localhost:5173" })); // Allow only your frontend to upload files

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
