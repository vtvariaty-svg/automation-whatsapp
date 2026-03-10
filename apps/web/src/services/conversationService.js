import pool from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Salva a mensagem enviada pelo usuário.
 * @param {string} phone 
 * @param {string} message 
 */
export async function saveUserMessage(phone, message) {
  const query = `
    INSERT INTO conversations (id, phone_number, message_text, sender, timestamp)
    VALUES ($1, $2, $3, $4, NOW())
  `;
  const values = [uuidv4(), phone, message, 'user'];

  try {
    await pool.query(query, values);
    console.log(`Mensagem do usuário ${phone} salva no banco.`);
  } catch (error) {
    console.error('Erro ao salvar mensagem do usuário no banco:', error);
  }
}

/**
 * Salva a resposta gerada pela IA.
 * @param {string} phone 
 * @param {string} response 
 */
export async function saveAIMessage(phone, response) {
  const query = `
    INSERT INTO conversations (id, phone_number, message_text, sender, timestamp)
    VALUES ($1, $2, $3, $4, NOW())
  `;
  const values = [uuidv4(), phone, response, 'assistant'];

  try {
    await pool.query(query, values);
    console.log(`Resposta da IA para ${phone} salva no banco.`);
  } catch (error) {
    console.error('Erro ao salvar resposta da IA no banco:', error);
  }
}

/**
 * Retorna o histórico de conversas de um número específico.
 * @param {string} phone 
 */
export async function getConversationHistory(phone) {
  const query = `
    SELECT phone_number, sender, message_text, timestamp
    FROM conversations
    WHERE phone_number = $1
    ORDER BY timestamp ASC
  `;
  
  try {
    const result = await pool.query(query, [phone]);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar histórico de conversas:', error);
    throw error;
  }
}
