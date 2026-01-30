const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKENS_PATH = path.join(__dirname, '..', 'tokens.json');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth environment variables. See README or .env.example');
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

exports.redirectToGoogle = (req, res) => {
  try {
    const oAuth2Client = getOAuth2Client();
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    // Redirect the user to Google's consent page
    res.redirect(authUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Persist the tokens for later use
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));

    // Create a spreadsheet on behalf of the user
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const title = req.query.title || 'New Spreadsheet from App';

    const response = await sheets.spreadsheets.create({
      resource: {
        properties: { title },
        sheets: [{ properties: { title: 'Sheet1' } }]
      }
    });

    const spreadsheetId = response.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    res.json({ message: 'Spreadsheet created', spreadsheetId, spreadsheetUrl });
  } catch (err) {
    console.error('Google callback error:', err);
    res.status(500).json({ error: 'Failed to exchange code or create spreadsheet' });
  }
};

exports.createSpreadsheetFromStoredTokens = async (req, res) => {
  try {
    if (!fs.existsSync(TOKENS_PATH)) {
      return res.status(400).json({ error: 'No stored tokens. Authorize first via /auth/google' });
    }

    const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH));
    const oAuth2Client = getOAuth2Client();
    oAuth2Client.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const title = req.body.title || 'New Spreadsheet from Stored Tokens';

    const response = await sheets.spreadsheets.create({
      resource: {
        properties: { title },
        sheets: [{ properties: { title: 'Sheet1' } }]
      }
    });

    const spreadsheetId = response.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    res.json({ message: 'Spreadsheet created', spreadsheetId, spreadsheetUrl });
  } catch (err) {
    console.error('Create spreadsheet error:', err);
    res.status(500).json({ error: 'Failed to create spreadsheet' });
  }
};
