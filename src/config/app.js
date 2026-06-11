import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import env from './env.js';
import loggerMiddleware from '../middlewares/logger.middleware.js';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import { storageProvider } from '../integrations/storage/storage.provider.js';
import authRoutes from '../modules/auth/auth.routes.js';
import clientsRoutes from '../modules/clients/clients.routes.js';
import projectsRoutes from '../modules/projects/projects.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.isDev ? true : env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(loggerMiddleware);

// Arquivos de referência enviados (Task 6). Em produção migrar p/ Supabase Storage.
app.use('/uploads', express.static(storageProvider.uploadDirAbs()));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API v1 ─────────────────────────────────────────────────────────────────────
const v1 = express.Router();
v1.use('/auth', authRoutes);            // Task 1
v1.use('/dashboard', dashboardRoutes);  // Task 2
v1.use('/clients', clientsRoutes);      // Tasks 3 e 4
v1.use('/projects', projectsRoutes);    // Tasks 5 e 6
app.use('/api/v1', v1);

// Compat: mantém /auth (sem versão) usado pelo fluxo de auth já entregue.
app.use('/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada.' });
});

app.use(errorMiddleware);

export default app;
