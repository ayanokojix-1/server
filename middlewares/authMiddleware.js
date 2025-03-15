const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token

    if (!token) {
        return res.status(401).json({ status: 401, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Store decoded data (id, username) in req.user
        next(); // Move to next middleware or route handler
    } catch (error) {
        return res.status(401).json({ status: 401, message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
