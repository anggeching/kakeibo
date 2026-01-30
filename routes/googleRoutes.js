const express = require('express');
const router = express.Router();
const googleController = require('../controllers/googleController');

// Redirect user to Google OAuth consent screen
router.get('/google', googleController.redirectToGoogle);

// Google OAuth callback
router.get('/google/callback', googleController.googleCallback);

// Create spreadsheet using stored tokens (POST expects JSON body { title: '...' })
router.post('/google/create', express.json(), googleController.createSpreadsheetFromStoredTokens);

module.exports = router;
