// Model: represents data access (DB)
// For demo purposes, this is a fake in-memory "database"

const USERS = [
  { id: 1, name: "Angela", email: "angela@example.com" },
  { id: 2, name: "Miggy", email: "miggy@example.com" },
];

function getAllUsers() {
  return USERS;
}

function getUserById(id) {
  return USERS.find((u) => u.id === id) || null;
}

module.exports = {
  getAllUsers,
  getUserById,
};
