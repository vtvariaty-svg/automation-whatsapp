-- Adicionar coluna de status do atendimento na tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ai';
