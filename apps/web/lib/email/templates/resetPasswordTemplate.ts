export function getPasswordResetEmailHtml(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-top: 4px solid #4f46e5; }
          .content { padding: 32px 24px; color: #374151; line-height: 1.6; }
          .content h2 { margin-top: 0; color: #111827; font-size: 20px; }
          .content p { margin-top: 0; margin-bottom: 16px; font-size: 16px; }
          .button-container { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
          .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
          .warning { margin-top: 24px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Redefinição de Senha</h2>
            <p>Recebemos uma solicitação para redefinir a senha associada à sua conta.</p>
            <p>Para escolher uma nova senha, clique no botão seguro abaixo:</p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button" style="color: white">Redefinir Senha</a>
            </div>
            
            <div class="warning">
              <p><b>Este link expira rapidamente.</b></p>
              <p>Se você não solicitou uma nova senha, por favor ignore este e-mail. Nenhuma alteração foi feita em sua conta e ela continua segura.</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Plataforma Automations. E-mail automático Transacional.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
