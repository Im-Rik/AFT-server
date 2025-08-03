import express from 'express';
import cors from 'cors';
import mainRouter from './routes/index.js';

const app = express();

// Global Middlewares
app.use(cors({
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main entry route
app.get('/', (req, res) => {
  res.status(200).send('Server is live and running!');
});

// API Routes
app.use('/', mainRouter);

export default app;