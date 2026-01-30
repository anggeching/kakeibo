// Controller: handles request/response logic
const userModel = require("../models/userModel");

function listUsers(req, res) {
  // req.user came from auth middleware
  const users = userModel.getAllUsers();
  return res.json({
    message: `Hello ${req.user.role}, here are the users`,
    data: users,
  });
}

function getUser(req, res) {
  const id = Number(req.params.id);
  const user = userModel.getUserById(id);

  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ data: user });
}

module.exports = {
  listUsers,
  getUser,
};
