const express = require("express");
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

// Middleware sits BETWEEN request and controller:
router.get("/users", auth, userController.listUsers);
router.get("/users/:id", auth, userController.getUser);

module.exports = router;
