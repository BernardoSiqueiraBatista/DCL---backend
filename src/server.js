import app from './config/app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { testConnection } from './database/connection.js';
import { verifyMailer } from './utils/mailer.js';

async function bootstrap() {
  try {
    await testConnection();
    await verifyMailer();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Servidor rodando em http://localhost:${env.PORT}`);
      logger.info(`   Ambiente: ${env.NODE_ENV}`);
      logger.info(`   Health:   http://localhost:${env.PORT}/health`);
    });

    const shutdown = (signal) => {
      logger.warn(`\n${signal} recebido. Encerrando servidor...`);
      server.close(() => {
        logger.info('Servidor encerrado com sucesso.');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forçando encerramento após timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err.message);
      logger.error(err.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

  } catch (err) {
    logger.error('Falha ao inicializar o servidor:', err.message);
    process.exit(1);
  }
}

bootstrap();
