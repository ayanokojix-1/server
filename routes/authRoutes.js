const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/reverify-email", authController.reverifyEmail);
router.post("/login", authController.login);
router.get("/verify", authMiddleware, authController.verifyToken);
router.get("/verify-email", authController.verifyEmail);

module.exports = router;
