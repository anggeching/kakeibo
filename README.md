# Google Sheets OAuth App (Node.js)

This project demonstrates how to use **Google OAuth 2.0** with **Node.js** to authenticate a user and **create Google Spreadsheets programmatically** using the Google Sheets API.

---

## Features

* Google OAuth 2.0 authentication
* Create Google Sheets in the authenticated user’s Drive
* Token storage for reuse (no repeated login)
* Simple Express server setup

---

## Prerequisites

Make sure you have:

* **Node.js** (v16+ recommended)
* **npm**
* A **Google account**
* Access to **Google Cloud Console**

---

## Project Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-project-folder>
```

### 2. Install dependencies

```bash
npm install
```

---

## Google Cloud Configuration

### 3. Create / select a Google Cloud project

Go to:
👉 [https://console.cloud.google.com](https://console.cloud.google.com)

Create a new project or select an existing one.

---

### 4. Enable required APIs

In Google Cloud Console:

```
APIs & Services → Library
```

Enable:

* ✅ Google Sheets API
* ✅ Google Drive API

---

### 5. Configure OAuth consent screen

```
APIs & Services → OAuth consent screen
```

* **User type**: External
* **App name**: Any name (e.g. `Kakeibo Dev`)
* **User support email**: your email
* **Developer contact email**: your email
* **Audience**: Testing
* **Test users**: add the email you’ll use to sign in

⚠️ App verification is **NOT required** for development.

---

### 6. Create OAuth Client ID

```
APIs & Services → Credentials → Create credentials → OAuth client ID
```

* **Application type**: Web application
* **Authorized redirect URI**:

```
http://localhost:3000/auth/google/callback
```

After creation, copy:

* Client ID
* Client Secret

---

## Environment Variables

### 7. Create `.env` file

Copy the example:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

⚠️ Never commit `.env` to Git.

---

## Running the App

### 8. Start the server

```bash
npm start
```

Server should run at:

```
http://localhost:3000
```

---

## OAuth Flow & Usage

### 9. Authorize with Google

Open in your browser:

```
http://localhost:3000/auth/google
```

* Sign in with Google
* Approve permissions
* Tokens will be stored locally (`tokens.json`)

---

### 10. Create a spreadsheet

Once authorized, create a spreadsheet using:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Spreadsheet"}' \
  http://localhost:3000/auth/google/create
```

Response example:

```json
{
  "spreadsheetId": "1abc...",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

The spreadsheet will appear in **your Google Drive**.

---

## Project Routes

| Method | Route                   | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | `/auth/google`          | Start Google OAuth flow         |
| GET    | `/auth/google/callback` | OAuth callback & token exchange |
| POST   | `/auth/google/create`   | Create a Google Spreadsheet     |

---

## Security Notes

* `.env` contains secrets → never commit
* `tokens.json` contains OAuth tokens → never commit
* Rotate secrets if accidentally exposed

---

## Common Errors & Fixes

### Access blocked / 403

* Add your email as a **Test user** in OAuth consent screen

### Redirect URI mismatch

* Ensure redirect URI matches **exactly** in code and Cloud Console

---

## Tech Stack

* Node.js
* Express
* Google APIs (`googleapis`)
* OAuth 2.0

