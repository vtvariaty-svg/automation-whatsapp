-- Etapa 9: Criação da tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_text TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    ai_response TEXT, -- Opcional, mantendo conforme o esquema solicitado pela Etapa 9
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexando por número de telefone para buscas rápidas no histórico
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
