import pool from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Busca um tenant pelo ID do telefone do WhatsApp.
 * @param {string} phoneId 
 */
export async function getTenantByPhoneId(phoneId) {
  const query = 'SELECT * FROM tenants WHERE whatsapp_phone_id = $1';
  try {
    const result = await pool.query(query, [phoneId]);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar tenant por phoneId:', error);
    throw error;
  }
}

/**
 * Cria um novo tenant.
 */
export async function createTenant({ name, whatsapp_phone_id, whatsapp_token, openai_key, ai_prompt }) {
  const query = `
    INSERT INTO tenants (id, name, whatsapp_phone_id, whatsapp_token, openai_key, ai_prompt)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [uuidv4(), name, whatsapp_phone_id, whatsapp_token, openai_key, ai_prompt];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    throw error;
  }
}

/**
 * Lista todos os tenants.
 */
export async function listTenants() {
  const query = 'SELECT * FROM tenants ORDER BY created_at DESC';
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    throw error;
  }
}

/**
 * Busca tenant por ID.
 */
export async function getTenantById(id) {
  const query = 'SELECT * FROM tenants WHERE id = $1';
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar tenant por ID:', error);
    throw error;
  }
}
