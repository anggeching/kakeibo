// Auth middleware: runs BEFORE the controller
// Simple demo: expects header "Authorization: Bearer secret-token"
function auth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  if (token !== "secret-token") {
    return res.status(403).json({ error: "Invalid token" });
  }

  // Attach user/context to req for downstream handlers (controller)
  req.user = { id: 1, role: "admin" };

  next(); // ✅ pass control to the next middleware/controller
}

module.exports = auth;
