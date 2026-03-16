/**
 * Next.js instrumentation hook — executado uma vez quando o servidor inicia.
 * Usado para inicializar o scheduler de follow-ups de vendas.
 * Referência: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Executar apenas no runtime Node.js (não no Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { processFollowUps } = await import('@/src/services/followUpService');

    const INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

    // Primeira execução 1 minuto após o servidor subir (aguarda DB conectar)
    setTimeout(() => {
      processFollowUps().catch(e =>
        console.error('[FollowUp] Erro na execução inicial:', e)
      );
    }, 60_000);

    // Execuções recorrentes a cada 15 minutos
    setInterval(() => {
      processFollowUps().catch(e =>
        console.error('[FollowUp] Erro no ciclo recorrente:', e)
      );
    }, INTERVAL_MS);

    console.log('[FollowUp] Scheduler iniciado — intervalo: 15 minutos');
  }
}
