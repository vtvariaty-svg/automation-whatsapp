/**
 * SERVIDOR LEGADO — DESATIVADO
 *
 * Este servidor Express foi substituído pelo apps/web (Next.js).
 * O webhook ativo está em apps/web/app/api/webhook/whatsapp/route.ts.
 *
 * Este arquivo retorna 503 em todas as rotas para evitar que qualquer
 * deploy acidental deste serviço processe tráfego real.
 */
import express from 'express';

const app = express();

app.use((_req, res) => {
  res.status(503).json({
    error: 'SERVIDOR_LEGADO_DESATIVADO',
    message: 'Este servidor foi descontinuado. O serviço ativo está em apps/web.',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.warn('[AVISO] apps/api está desativado. Todas as rotas retornam 503.');
  console.warn('[AVISO] Use apps/web como serviço de produção.');
});
