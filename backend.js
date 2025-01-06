const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt
const cors = require('cors')
// Create Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB (Replace with your MongoDB connection string)
mongoose.connect('mongodb+srv://ayanokojix:ejwRyGJ5Yieow4VK@cluster0.1rruy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Create a Mongoose schema for user data
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Store hashed password
});

// Create a Mongoose model
const User = mongoose.model('User', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
    const { username, fullName, email, password } = req.body;

    // Basic validation
    if (!username || !fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Hash the password before saving
        const saltRounds = 10; // Cost factor for hashing
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user to the database with hashed password
        const newUser = new User({
            username,
            fullName,
            email,
            password: hashedPassword, // Save hashed password
        });

        await newUser.save();
        res.status(201).json({ message: 'User signed up successfully!' });
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error (e.g., unique fields like email or username)
            res.status(400).json({ message: 'Username or email already exists.' });
        } else {
            console.error('Error saving user:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
