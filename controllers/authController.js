const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const crypto = require("crypto");
const sendVerificationEmail = require("../helpers/email")
const authController = {
async signup(req, res) {
    const { username, fullName, email, password, dob, gender, country, state, address, phone_number } = req.body;
    
    if (!username || !fullName || !email || !password || !dob || !gender || !country || !address) {
        return res.status(400).json({ status: 400, message: "All fields are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Save user with the token
        const newUser = await User.create(username, fullName, email, hashedPassword, verificationToken, dob, gender, country, state, address, phone_number);

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ status: 201, message: "Signup successful. Please check your email for verification." });
    } catch (error) {
        console.error("Signup error:", error);

        if (error.code === "23505") {
            return res.status(400).json({ status: 400, message: "Username or email already exists." });
        }

        res.status(500).json({ status: 500, message: "Internal server error." });
    }
},
   async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ status: 400, message: "Username and password are required." });
    }

    try {
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(400).json({ status: 400, message: "Invalid username or password." });
        }

        // Check if the user is verified
        if (!user.is_verified) {
            return res.status(403).json({ status: 403, message: "Please verify your email before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: 400, message: "Invalid username or password." });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(200).json({ status: 200, token });
    } catch (error) {
        res.status(500).json({ status: 500, message: "Internal server error." });
    }
},

    async verifyToken(req, res) {
        try {
            // `authMiddleware` don already check token and put user details inside `req.user`
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ status: 404, message: "User not found" });
            }

            // Return user info
            res.status(200).json({
                status: 200,
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
            });
        } catch (error) {
	console.log("token error",error);
            res.status(500).json({ status: 500, message: "Internal server error." });
        }
    },
      async verifyEmail(req, res) {
    const { token } = req.query;
    if (!token) return res.status(400).json({ status: 400 });

    try {
        // Find user by token
        const user = await User.findByVerificationToken(token);
        if (!user) return res.status(400).json({ status: 400 });

        // Check if token is expired
        const tokenAge = new Date() - new Date(user.verification_token_created_at);
        if (tokenAge > 3600000) { // 1 hour in milliseconds
            return res.status(410).json({ status: 410 }); // 410: Gone (expired)
        }

        // Mark user as verified
        await User.verifyUser(user.id);

        res.status(200).json({ status: 200 });
    } catch (error) {
        res.status(500).json({ status: 500 });
    }
},

    async reverifyEmail(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 400 });

    try {
        const user = await User.findByEmail(email);
        if (!user) return res.status(404).json({ status: 404 });

        // If already verified, no need to send new token
        if (user.is_verified) {
            return res.status(409).json({ status: 409 }); // 409: Conflict (already verified)
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Update user with new token and timestamp
        await User.updateVerificationToken(user.id, verificationToken);

        // Send new verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(200).json({ status: 200 });
    } catch (error) {
        res.status(500).json({ status: 500 });
    }
}
    
};

module.exports = authController;
