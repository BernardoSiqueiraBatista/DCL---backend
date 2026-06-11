import path from 'path';
import { fileURLToPath } from 'url';
import env from '../../config/env.js';

/**
 * Camada de storage para referências/criativos (Task 6 / 8.5).
 *
 * Por ora resolve URLs locais para os arquivos salvos em `UPLOAD_DIR` (servidos
 * estaticamente pelo Express em /uploads). O escopo prevê bucket do Supabase com
 * URLs assinadas; a interface abaixo isola isso para troca futura sem tocar nos
 * serviços (basta implementar `publicUrl`/`signedUrl` via supabase-js).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../');

export function uploadDirAbs() {
  return path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(ROOT, env.UPLOAD_DIR);
}

/** URL pública para um arquivo já persistido no UPLOAD_DIR. */
export function publicUrl(filename) {
  const base = env.isProd && env.CORS_ORIGIN ? '' : `http://localhost:${env.PORT}`;
  return `${base}/uploads/${filename}`;
}

export const storageProvider = { uploadDirAbs, publicUrl, usingSupabase: false };
