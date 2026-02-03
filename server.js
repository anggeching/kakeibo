require('dotenv').config();

//declare routes and middleware 
const express = require('express');
const userRoutes = require('./routes/userRoutes'); //user-related routes
const googleRoutes = require('./routes/googleRoutes'); //google OAuth-related routes

const app = express();
app.use(express.json()); // built-in middleware to parse JSON bodies

// Prefixes: grouped by your user flow
app.use('/api', userRoutes);
app.use('/auth', googleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
