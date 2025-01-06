const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt
const cors = require('cors');

const rateLimit = require('express-rate-limit'); // Import express-rate-limit
// Create Express app
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

// Rate limiter: limit to 5 requests per IP per 1 minute
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute',
});

// Apply rate limiter to all requests (or specific routes like '/signup')
app.use(limiter);

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

    console.log('Signup request received');  // Log when the signup endpoint is hit

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

        console.log(`New user registered: ${username}`); // Log the username when a user is registered
        res.status(201).json({ message: 'User signed up successfully!' });
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error (e.g., unique fields like email or username)
            console.error('Duplicate error: Username or email already exists.');
            res.status(400).json({ message: 'Username or email already exists.' });
        } else {
            console.error('Error saving user:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    console.log('Login request received');  // Log when the login endpoint is hit

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        // Compare the hashed password with the one provided
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        console.log(`User logged in: ${username}`); // Log the username when a user logs in successfully
        res.status(200).json({ message: 'User logged in successfully!' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
