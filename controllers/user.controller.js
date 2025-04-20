import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Secret key for JWT
const secretKey = process.env.JWT_SECRET || 'your_secret_key';

export const signup = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password: await bcrypt.hash(password, 10)
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (err) {
        next(err); // Pass error to the error handling middleware
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (err) {
        next(err); // Pass error to the error handling middleware
    }
};