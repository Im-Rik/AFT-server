import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
// import passport from 'passport'; // Not needed for manual login
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; // Not needed
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// import { OAuth2Client } from 'google-auth-library'; // Not needed
import bcrypt from 'bcryptjs'; // <-- We will use this for password checking

dotenv.config();

// --- DEFINE CONSTANTS AT THE TOP ---
const app = express();
const port = process.env.PORT || 3001;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// const BASE_URL = process.env.BASE_URL; // Not needed for manual login
// const FRONTEND_URL = process.env.FRONTEND_URL; // Not needed for manual login

import credentials from '/etc/secrets/credentials.json' with { type: 'json' };

app.use(cors());
app.use(express.json());
// app.use(session({ secret: 'trip-expense-tracker-session', resave: false, saveUninitialized: false })); // Not needed for JWT
// app.use(passport.initialize()); // Not needed
// app.use(passport.session()); // Not needed

// --- HELPER FUNCTIONS ---

async function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Admins only.' });
  next();
};

// --- NEW MANUAL AUTHENTICATION ---
// This new endpoint replaces all previous Google auth routes.
// It handles login requests from both the website and the mobile app.
app.post('/auth/manual-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const sheets = await getSheetsClient();
    // Fetch user data, including the new HashedPassword column (A:E)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A:E',
    });

    const rows = (response.data.values || []).slice(1);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No users found in the sheet.' });
    }

    // Find the user by their email, which we use as the username
    const userRow = rows.find(row => row[1] && row[1].toLowerCase() === username.toLowerCase());

    if (!userRow) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const [userId, email, name, role, hashedPassword] = userRow;

    if (!hashedPassword) {
      console.error(`User ${email} does not have a password set in the sheet.`);
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Securely compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // If password is correct, create and sign a JWT with user details
    const payload = { userId, email, name, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Send the token back to the client
    res.status(200).json({ token });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});


// --- GOOGLE AUTHENTICATION (DEPRECATED - Kept for future reference) ---
/*
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${BASE_URL}/auth/google/callback`
);

async function findOrCreateUser(profile) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A:D' });
  const rows = (response.data.values || []).slice(1);
  const usersData = rows.map((row, index) => ({
    rowIndex: index + 2, userId: row[0], email: row[1], name: row[2], role: row[3],
  }));
  const user = usersData.find(u => u.email === profile.emails[0].value);
  if (!user) throw new Error('User not found in the authorized list.');
  if (!user.userId) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: `Users!A${user.rowIndex}`,
      valueInputOption: 'USER_ENTERED', resource: { values: [[profile.id]] },
    });
    user.userId = profile.id;
  }
  return user;
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try { const user = await findOrCreateUser(profile); done(null, user); }
    catch (error) { done(error, null); }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=true`, session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.userId, email: req.user.email, name: req.user.name, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
});

app.post('/auth/google/token', (req, res) => {
    res.status(404).json({ message: 'This endpoint is deprecated. Use /auth/google/code instead.' });
});

app.post('/auth/google/code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Server auth code not provided.' });
    }
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      return res.status(401).json({ message: 'Could not retrieve ID token from Google.' });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const googlePayload = ticket.getPayload();
    if (!googlePayload) {
      return res.status(401).json({ message: 'Invalid Google token.' });
    }
    const profile = {
      id: googlePayload.sub,
      displayName: googlePayload.name,
      emails: [{ value: googlePayload.email }],
    };
    const user = await findOrCreateUser(profile);
    const appToken = jwt.sign(
      { userId: user.userId, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '25d' }
    );
    res.status(200).json({ token: appToken });
  } catch (error) {
    console.error("Error during mobile auth code exchange:", error.message);
    res.status(500).json({ message: `Authentication failed: ${error.message}` });
  }
});
*/

// --- API ROUTES (UNCHANGED) ---
// These will continue to work perfectly as they only depend on a valid JWT,
// which our new manual login system now provides.

app.get('/', (req, res) => {
  res.status(200).send('Server is live and running!');
});

app.get('/api/profile', verifyToken, (req, res) => res.json({ user: req.user }));

app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A:D' });
    const users = (response.data.values || []).slice(1).map(row => ({ id: row[0], name: row[2], role: row[3] }));
    res.json(users.filter(u => u.id));
  } catch (error) {
    console.error("ERROR FETCHING USERS:", error);
    res.status(500).json({ message: 'Could not fetch users.' });
  }
});

app.post('/api/expenses', verifyToken, isAdmin, async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const { description, amount, category, subCategory, location, locationFrom, locationTo, paidByUserId, splitType, splits } = req.body;
    const usersRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A:D' });
    const payer = (usersRes.data.values || []).slice(1).find(r => r[0] === paidByUserId);
    if (!payer) return res.status(404).json({ message: 'Payer not found.' });
    const paidByUserName = payer[2];
    const expenseId = uuidv4();
    const expenseRow = [expenseId, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), description, category, subCategory, location, locationFrom, locationTo, amount, paidByUserId, paidByUserName];
    await sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: 'Expenses!A:K', valueInputOption: 'USER_ENTERED', resource: { values: [expenseRow] } });
    let splitRows = [];
    if (splitType === 'equal') {
      const numPeople = splits.length;
      if (numPeople === 0) throw new Error("Cannot split an expense among zero people.");
      const totalAmountInPaise = Math.round(amount * 100);
      const shareInPaise = Math.floor(totalAmountInPaise / numPeople);
      const remainderInPaise = totalAmountInPaise % numPeople;
      splitRows = splits.map((userId, index) => {
        let userShareInPaise = shareInPaise;
        if (index < remainderInPaise) userShareInPaise += 1;
        return [uuidv4(), expenseId, userId, (userShareInPaise / 100).toFixed(2)];
      });
    } else if (splitType === 'exact') {
      splitRows = splits.map(split => [uuidv4(), expenseId, split.userId, split.amount]);
    } else { return res.status(400).json({ message: 'Invalid split type' }); }
    await sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: 'Splits!A:D', valueInputOption: 'USER_ENTERED', resource: { values: splitRows } });
    res.status(201).json({ success: true });
  } catch (error) { console.error("Error adding expense:", error); res.status(500).json({ message: 'Could not add expense.' }); }
});

app.post('/api/payments', verifyToken, async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const { fromUserId, toUserId, amount, note } = req.body;
    const usersRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A:D' });
    const recipient = (usersRes.data.values || []).slice(1).find(r => r[0] === toUserId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found.' });
    const toUserName = recipient[2];
    const newRow = [uuidv4(), format(new Date(), 'yyyy-MM-dd HH:mm:ss'), fromUserId, toUserId, amount, note || '', req.user.name, toUserName];
    await sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: 'Payments!A:H', valueInputOption: 'USER_ENTERED', resource: { values: [newRow] } });
    res.status(201).json({ success: true });
  } catch (error) { console.error("Error adding payment:", error); res.status(500).json({ message: 'Could not save payment.' }); }
});

app.get('/api/dashboard-data', verifyToken, async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const loggedInUserId = req.user.userId;

    const batchGetResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: ['Users!A:D', 'Expenses!A:K', 'Splits!A:D', 'Payments!A:H'],
    });

    const [usersRange, expensesRange, splitsRange, paymentsRange] = batchGetResponse.data.valueRanges;

    const userRows = (usersRange.values || []).slice(1);
    const expenseRows = (expensesRange.values || []).slice(1);
    const splitRows = (splitsRange.values || []).slice(1);
    const paymentRows = (paymentsRange.values || []).slice(1);

    const users = userRows.map(r => ({ id: r[0], name: r[2] })).filter(u => u.id && u.name);
    const userMap = users.reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {});

    const expenses = expenseRows.map(row => ({
      id: row[0], date: row[1], description: row[2], category: row[3], subCategory: row[4],
      location: row[5], locationFrom: row[6], locationTo: row[7], amount: parseFloat(row[8]) || 0,
      paidByUserId: row[9], paidByUserName: row[10]
    }));

    const payments = paymentRows.map(row => ({
      id: row[0], date: row[1], paidByUserId: row[2], paidToUserId: row[3], amount: parseFloat(row[4]) || 0,
      note: row[5], paidByUserName: row[6], paidToUserName: row[7]
    }));

    const spendingSummary = {};
    users.forEach(u => { spendingSummary[u.id] = { name: u.name, totalSpending: 0 }; });
    splitRows.forEach(split => {
      const owedByUserId = split[2];
      const shareAmount = parseFloat(split[3]) || 0;
      if (spendingSummary[owedByUserId]) spendingSummary[owedByUserId].totalSpending += shareAmount;
    });
    const spendingSummaryArray = Object.values(spendingSummary).sort((a, b) => b.totalSpending - a.totalSpending);

    const netBalances = {};
    users.forEach(u => netBalances[u.id] = 0);
    expenseRows.forEach(exp => {
      const amount = parseFloat(exp[8]) || 0;
      const paidBy = exp[9];
      if (netBalances[paidBy] !== undefined) netBalances[paidBy] += amount;
    });
    splitRows.forEach(split => {
      const owedBy = split[2];
      const shareAmount = parseFloat(split[3]) || 0;
      if (netBalances[owedBy] !== undefined) netBalances[owedBy] -= shareAmount;
    });
    paymentRows.forEach(p => {
      const fromUserId = p[2];
      const toUserId = p[3];
      const paymentAmount = parseFloat(p[4]) || 0;
      if (netBalances[fromUserId] !== undefined) netBalances[fromUserId] += paymentAmount;
      if (netBalances[toUserId] !== undefined) netBalances[toUserId] -= paymentAmount;
    });

    const debtors = [];
    const creditors = [];
    Object.entries(netBalances).forEach(([userId, balance]) => {
      if (balance < -0.01) debtors.push({ userId, amount: -balance });
      if (balance > 0.01) creditors.push({ userId, amount: balance });
    });
    const groupSettlements = [];
    while (debtors.length > 0 && creditors.length > 0) {
      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);
      const debtor = debtors[0], creditor = creditors[0];
      const amount = Math.min(debtor.amount, creditor.amount);
      groupSettlements.push({ from: debtor.userId, to: creditor.userId, fromName: userMap[debtor.userId], toName: userMap[creditor.userId], amount });
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount < 0.01) debtors.shift();
      if (creditor.amount < 0.01) creditors.shift();
    }

    const youOwe = { total: 0, breakdown: [] };
    const youAreOwed = { total: 0, breakdown: [] };
    groupSettlements.forEach(s => {
      if (s.from === loggedInUserId) youOwe.breakdown.push({ to: s.toName, amount: s.amount });
      if (s.to === loggedInUserId) youAreOwed.breakdown.push({ from: s.fromName, amount: s.amount });
    });
    youOwe.total = youOwe.breakdown.reduce((sum, item) => sum + item.amount, 0);
    youAreOwed.total = youAreOwed.breakdown.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      users,
      expenses,
      payments,
      spendingSummary: spendingSummaryArray,
      balances: {
        youOwe,
        youAreOwed,
        groupSettlements,
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Could not fetch dashboard data.' });
  }
});


// --- START SERVER ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
