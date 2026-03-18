export function getVerificationEmailHtml(verificationLink: string, userName: string = 'Usuário'): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifique seu endereço de e-mail</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background-color: #4f46e5; padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 32px 24px; color: #374151; line-height: 1.6; }
        .content p { margin-top: 0; margin-bottom: 16px; font-size: 16px; }
        .button-container { text-align: center; margin: 32px 0; }
        .button { display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
        .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .alt-link { margin-top: 24px; font-size: 14px; color: #6b7280; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo à nossa Plataforma</h1>
        </div>
        <div class="content">
          <p>Olá, ${userName},</p>
          <p>Falta pouco para você concluir o seu cadastro! Precisamos apenas confirmar que este endereço de e-mail pertence a você para liberar seu acesso.</p>
          
          <div class="button-container">
            <a href="${verificationLink}" class="button" style="color: white">Verificar meu e-mail</a>
          </div>
          
          <p><b>Este link é válido por tempo limitado.</b> Se você não se cadastrou em nossa plataforma, ignore este e-mail.</p>
          
          <div class="alt-link">
            <p>Se o botão não funcionar, copie e cole o link abaixo em seu navegador:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Plataforma. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
