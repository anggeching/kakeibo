const express = require("express");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(express.json()); // built-in middleware to parse JSON bodies

app.use("/api", userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
