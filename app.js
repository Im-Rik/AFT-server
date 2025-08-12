import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mainRouter from './src/api/routes/index.routes.js';
import { errorMiddleware } from './src/api/middlewares/error.middleware.js';
import { config } from './src/config/config.js';

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).send('Server is live and running!');
});

app.use('/api', mainRouter);

app.use(errorMiddleware);

export default app;