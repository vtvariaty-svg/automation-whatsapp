import pool from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Salva a mensagem enviada pelo usuário.
 * @param {string} phone 
 * @param {string} message 
 */
export async function saveUserMessage(phoneNumber, messageText, tenantId, status = 'ai') {
  const query = `
    INSERT INTO conversations (id, phone_number, message_text, sender, timestamp, tenant_id, status)
    VALUES ($1, $2, $3, 'user', NOW(), $4, $5)
    RETURNING *
  `;
  const values = [uuidv4(), phoneNumber, messageText, tenantId, status];

  try {
    await pool.query(query, values);
    console.log(`Mensagem do usuário ${phoneNumber} salva no banco.`);
  } catch (error) {
    console.error('Erro ao salvar mensagem do usuário no banco:', error);
  }
}

/**
 * Salva a resposta gerada pela IA.
 * @param {string} phone 
 * @param {string} response 
 */
export async function saveAIMessage(phoneNumber, aiResponse, tenantId, status = 'ai') {
  const query = `
    INSERT INTO conversations (id, phone_number, message_text, sender, timestamp, tenant_id, status)
    VALUES ($1, $2, $3, 'ai', NOW(), $4, $5)
    RETURNING *
  `;
  const values = [uuidv4(), phoneNumber, aiResponse, tenantId, status];

  try {
    await pool.query(query, values);
    console.log(`Resposta da IA para ${phoneNumber} salva no banco.`);
  } catch (error) {
    console.error('Erro ao salvar resposta da IA no banco:', error);
  }
}

/**
 * Retorna o histórico de conversas de um número específico.
 * @param {string} phone 
 */
export async function getConversationHistory(phoneNumber, tenantId) {
  const query = `
    SELECT * FROM conversations
    WHERE phone_number = $1 AND tenant_id = $2
    ORDER BY timestamp ASC
  `;
  const values = [phoneNumber, tenantId];
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar histórico da conversa:', error);
    throw error;
  }
}

/**
 * Retorna a lista de conversas de um tenant, agrupadas por telefone.
 */
export async function getConversationsList(tenantId) {
  const query = `
    SELECT 
      phone_number as id,
      phone_number,
      MAX(timestamp) as timestamp,
      (SELECT message_text FROM conversations c2 WHERE c2.phone_number = c.phone_number AND c2.tenant_id = c.tenant_id AND c2.message_text IS NOT NULL ORDER BY timestamp DESC LIMIT 1) as last_message,
      (SELECT status FROM conversations c3 WHERE c3.phone_number = c.phone_number AND c3.tenant_id = c.tenant_id ORDER BY timestamp DESC LIMIT 1) as status
    FROM conversations c
    WHERE tenant_id = $1
    GROUP BY phone_number, tenant_id
    ORDER BY timestamp DESC
  `;
  const values = [tenantId];
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar lista de conversas:', error);
    throw error;
  }
}

/**
 * Retorna o status atual de uma conversa (baseado na última mensagem).
 */
export async function getConversationStatus(phoneNumber, tenantId) {
  const query = `
    SELECT status FROM conversations
    WHERE phone_number = $1 AND tenant_id = $2
    ORDER BY timestamp DESC
    LIMIT 1
  `;
  const values = [phoneNumber, tenantId];
  try {
    const result = await pool.query(query, values);
    if (result.rows.length > 0 && result.rows[0].status) {
      return result.rows[0].status;
    }
    return 'ai'; // Default se não houver
  } catch (error) {
    console.error('Erro ao buscar status da conversa:', error);
    return 'ai';
  }
}

/**
 * Atualiza o status de todas as mensagens de um número para 'human'.
 */
export async function takeoverConversation(phoneNumber, tenantId) {
  const query = `
    UPDATE conversations
    SET status = 'human'
    WHERE phone_number = $1 AND tenant_id = $2
  `;
  const values = [phoneNumber, tenantId];
  try {
    await pool.query(query, values);
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer takeover da conversa:', error);
    throw error;
  }
}
