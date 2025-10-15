const router = require("express").Router();
const { signup, login, me, logout } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

// public
router.post("/signup", signup);
router.post("/login", login);

// auth-required
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

module.exports = router;