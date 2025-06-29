# AFT - Expense Tracker Backend

This is the Node.js and Express.js backend server for the AFT Group Expense Tracker application. It provides a RESTful API for handling user authentication, expense tracking, payments, and real-time balance calculations, using Google Sheets as a database.

## ✨ Core Features

  * **Secure Authentication:** Handles user login with password hashing (`bcrypt`) and provides session management using JSON Web Tokens (JWT).
  * **Google Sheets Integration:** Uses a Google Sheet as a lightweight and easily manageable database for all application data, including users, expenses, and payments.
  * **Real-time Data Processing:** The `/api/dashboard-data` endpoint acts as a powerful data processor, calculating user balances, debts, and simplified settlement plans on the fly with each request.
  * **Role-Based Access:** Supports a simple role system (`admin`, `member`) to protect certain actions, such as adding new group expenses.
  * **RESTful API:** Provides a clear set of endpoints for all frontend operations, configured with CORS for secure cross-origin communication.

## 🛠️ Tech Stack

  * **Runtime:** [Node.js](https://nodejs.org/)
  * **Framework:** [Express.js](https://expressjs.com/)
  * **Database:** [Google Sheets API](https://developers.google.com/sheets/api)
  * **Authentication:** [JSON Web Token (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken), [bcrypt.js](https://www.google.com/search?q=https://github.com/dcodeIO/bcrypt.js)
  * **Dependencies:** `googleapis`, `cors`, `dotenv`, `uuid`, `date-fns`

## 🚀 Setup and Configuration

To run this server locally, you must configure three things: Google Cloud credentials, your Google Sheet, and local environment variables.

### 1\. Google Cloud & Sheets Setup

This server uses a Google Service Account to interact with your Google Sheet without requiring user login.

1.  **Create a Google Cloud Project:** Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2.  **Enable the Google Sheets API:** In your new project, navigate to "APIs & Services" \> "Library" and enable the "Google Sheets API".
3.  **Create a Service Account:**
      * Navigate to "IAM & Admin" \> "Service Accounts".
      * Click "Create Service Account".
      * Give it a name (e.g., "aft-sheets-editor") and grant it the **Editor** role.
4.  **Generate JSON Key:**
      * Once the service account is created, click on it, go to the **"Keys"** tab, click "Add Key", and select "Create new key".
      * Choose **JSON** as the key type. A JSON file will be downloaded.
      * Rename this downloaded file to `credentials.json` and place it in the root directory of your backend project. **This file is a secret and must not be committed to GitHub.**
5.  **Share Your Google Sheet:**
      * Inside your `credentials.json` file, find the `client_email` address (it will look something like `...gserviceaccount.com`).
      * Open your Google Sheet and click the "Share" button.
      * Paste the `client_email` address and give it **Editor** access.

### 2\. Environment Variables

Create a file named `.env` in the root of your project directory. This file will hold your secret keys.

```env
# The ID of your Google Sheet. You can get this from the sheet's URL.
# (e.g., in docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit)
SPREADSHEET_ID=your_google_sheet_id_here

# A long, random, secret string used for signing authentication tokens.
JWT_SECRET=your_super_secret_key_for_jwt

# The port the server will run on (optional, defaults to 3001).
PORT=3001
```

### 3\. Install Dependencies

Navigate to the project directory in your terminal and run:

```bash
npm install
```

## ▶️ Running the Server

Once setup is complete, you can start the server with:

```bash
node server.js
```

The server will be running locally, typically on `http://localhost:3001`.

## API Endpoints

The following are the main API routes available.

| Method | Endpoint                    | Protection | Description                                                                                              |
| :----- | :-------------------------- | :--------- | :------------------------------------------------------------------------------------------------------- |
| `POST` | `/auth/manual-login`        | Public     | Authenticates a user with username and password, returning a JWT on success.                           |
| `GET` | `/api/profile`              | Token      | Fetches the profile information for the authenticated user making the request.                           |
| `GET` | `/api/users`                | Token      | Returns a list of all users (ID, name, role) in the group.                                               |
| `POST` | `/api/expenses`             | Admin      | Adds a new expense and its splits to the sheet. Requires the user to have the "admin" role.            |
| `POST` | `/api/payments`             | Token      | Records a direct payment from one user to another to settle debts.                                       |
| `GET`  | `/api/dashboard-data`       | Token      | The main data endpoint. Returns a large JSON object with all balances, debts, settlements, and lists.    |
| `GET`  | `/api/health-check`         | Public     | A simple endpoint to verify that the server is live and running the latest deployed code.                |
