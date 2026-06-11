import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import env from '../config/env.js';
import { storageProvider } from '../integrations/storage/storage.provider.js';
import { sendError } from '../utils/helpers.js';

// Task 6 / 8.5 — tipos aceitos e limites das referências gráficas.
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

const uploadDir = storageProvider.uploadDirAbs();
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Tipo de arquivo não suportado. Use png, jpg ou webp.'));
  }
  cb(null, true);
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024 },
});

// Aceita o campo "files" (até UPLOAD_MAX_FILES) e traduz erros do multer em 422.
export function uploadReferences(req, res, next) {
  const handler = multerUpload.array('files', env.UPLOAD_MAX_FILES);
  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 422, `Cada arquivo deve ter no máximo ${env.UPLOAD_MAX_MB}MB.`);
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return sendError(res, 422, `Máximo de ${env.UPLOAD_MAX_FILES} referências por envio.`);
      }
      return sendError(res, 422, err.message);
    }
    if (err) return sendError(res, 422, err.message);
    next();
  });
}
