import dotenv from 'dotenv';
import app from './app.js';
import { config } from './src/config/config.js';

dotenv.config();

const port = config.port || 3001;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});