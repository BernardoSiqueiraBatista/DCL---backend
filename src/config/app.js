import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import env from './env.js';
import loggerMiddleware from '../middlewares/logger.middleware.js';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import authRoutes from '../modules/auth/auth.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.isDev ? true : env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(loggerMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada.' });
});

app.use(errorMiddleware);

export default app;
