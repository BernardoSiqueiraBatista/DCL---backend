import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from './logger.js';

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function verifyMailer() {
  try {
    await transporter.verify();
    logger.info('✅ Serviço de e-mail (Gmail SMTP) conectado com sucesso.');
  } catch (err) {
    logger.warn(`⚠️  Falha ao verificar serviço de e-mail: ${err.message}`);
    logger.warn('   Verifique SMTP_USER e SMTP_PASS no .env (App Password do Gmail).');
  }
}

// ─── Template HTML ────────────────────────────────────────────────────────────

function getOtpEmailHtml(name, otp, type) {
  const subject    = type === 'email_verification' ? 'Verificação de e-mail' : 'Redefinição de senha';
  const actionText = type === 'email_verification' ? 'confirmar seu cadastro' : 'redefinir sua senha';

  return {
    subject: `DCL — ${subject}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e0e0e0; }
    .container { max-width: 560px; margin: 40px auto; background: #1a1a24; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a3a; }
    .header { background: linear-gradient(135deg, #6c47ff 0%, #a855f7 100%); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; color: #c0c0d0; margin-bottom: 20px; }
    .description { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 32px; }
    .otp-container { background: #0f0f13; border: 1px solid #2a2a3a; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px; }
    .otp-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
    .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #a855f7; font-family: 'Courier New', monospace; }
    .expires { font-size: 12px; color: #555; margin-top: 12px; }
    .warning { font-size: 12px; color: #f59e0b; background: #1c1810; border: 1px solid #3a2e0a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .footer { border-top: 1px solid #2a2a3a; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #444; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>DC LAB</h1></div>
    <div class="body">
      <p class="greeting">Olá, <strong>${name}</strong>!</p>
      <p class="description">
        Use o código abaixo para ${actionText}.
        Este código é válido por <strong>${env.OTP_EXPIRES_MINUTES} minutos</strong>.
      </p>
      <div class="otp-container">
        <p class="otp-label">Seu código de verificação</p>
        <p class="otp-code">${otp}</p>
        <p class="expires">Expira em ${env.OTP_EXPIRES_MINUTES} minutos</p>
      </div>
      <div class="warning">
        ⚠️ Nunca compartilhe este código. O DC LAB jamais solicitará seu código por telefone ou chat.
      </div>
      <p class="description">Se você não solicitou este código, ignore este e-mail com segurança.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} DC LAB. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`.trim(),
  };
}

export async function sendOtpEmail(user, otp, type) {
  const { subject, html } = getOtpEmailHtml(user.name, otp, type);
  
  try {
    await transporter.sendMail({
      from: `"DC LAB" <${env.SMTP_USER}>`,
      to: user.email,
      subject,
      html,
    });
    logger.info(`📧 OTP enviado para ${user.email} (tipo: ${type})`);
  } catch (err) {
    logger.warn(`\n⚠️  FALHA AO ENVIAR E-MAIL (Credenciais SMTP inválidas no .env)`);
    logger.warn(`⚠️  Tipo: ${type} | Destinatário: ${user.email}`);
    // Fix 6: exibe o OTP no console SOMENTE em ambiente de desenvolvimento
    if (env.isDev) {
      console.log(`\n    =================================`);
      console.log(`    🔑 CÓDIGO OTP: \x1b[32m\x1b[1m${otp}\x1b[0m`);
      console.log(`    =================================\n`);
    }
  }
}
