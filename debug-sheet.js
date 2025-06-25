// debug-sheet.js
import { google } from 'googleapis';
import credentials from './credentials.json' with { type: 'json' };

// --- IMPORTANT: PASTE YOUR SPREADSHEET ID HERE ---
const SPREADSHEET_ID = '1tujRnKlaQR9q3rTSe9NKQAC7T43xiiU6rpwSSDeJxrY'; 
// ----------------------------------------------------


async function testSheetConnection() {
  console.log('Attempting to connect to Google Sheets...');

  try {
    // 1. Authenticate with the service account
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Read-only is enough for a test
    });

    await auth.authorize();
    console.log('Authentication successful.');

    // 2. Create a Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets client created.');

    // 3. Try to read a single cell from your 'Users' sheet
    console.log(`Attempting to read range 'Users!A1' from spreadsheet ID: ${SPREADSHEET_ID}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A1', // Let's try to read just the first cell of the Users sheet
    });

    // 4. Report Success
    console.log('--------------------------------------------------');
    console.log('✅✅✅ SUCCESS! ✅✅✅');
    console.log('Successfully connected and read from the sheet.');
    console.log('Data in cell A1 is:', response.data.values);
    console.log('--------------------------------------------------');
    console.log('This means your credentials, permissions, and spreadsheet ID are all CORRECT.');
    console.log('The issue is likely somewhere in the main server.js file.');


  } catch (error) {
    // 5. Report Failure
    console.log('--------------------------------------------------');
    console.error('❌❌❌ FAILURE! ❌❌❌');
    console.error('Failed to connect to the Google Sheet.');
    console.error('This means there is a fundamental problem with your credentials, permissions, Spreadsheet ID, or API settings.');
    console.error('\nHere is the full error object:');
    console.error(error);
    console.log('--------------------------------------------------');
  }
}

// Run the test
testSheetConnection();