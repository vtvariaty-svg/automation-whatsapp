/**
 * Maps NFE_WEB HTTP error responses to operational user messages.
 * Never exposes internal API details, secrets, or raw server errors.
 */
export function mapNfeError(statusCode: number, body: any): string {
  const code = body?.code;

  if (statusCode === 400) {
    return 'Dados inválidos para emissão. Verifique CPF/CNPJ, endereço completo e itens.';
  }
  if (statusCode === 409 && code === 'business_duplication') {
    const ref = body?.external_reference_id ?? '';
    return `Documento fiscal já emitido para esta operação${ref ? ` (ref: ${ref})` : ''}.`;
  }
  if (statusCode === 409 && code === 'idempotency_conflict') {
    return 'Emissão em andamento. Aguarde alguns instantes e consulte o status.';
  }
  if (statusCode === 409 && code === 'idempotency_payload_mismatch') {
    return 'Conflito de idempotência: mesma chave com dados diferentes.';
  }
  if (statusCode === 409) {
    return 'Conflito: operação duplicada ou em processamento.';
  }
  if (statusCode === 408) {
    return 'Timeout na comunicação com o serviço fiscal. Tente novamente.';
  }
  if (statusCode === 429) {
    return 'Limite de requisições atingido. Aguarde um momento e tente novamente.';
  }
  if (statusCode === 404) {
    return 'Documento fiscal não encontrado.';
  }
  if (statusCode >= 500) {
    return 'Erro interno no serviço fiscal. A operação pode ser retentada.';
  }
  return body?.error ?? 'Erro desconhecido na emissão fiscal.';
}

/** Returns true for status codes that are safe to retry (transient errors). */
export function isRetryable(statusCode: number): boolean {
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
}
